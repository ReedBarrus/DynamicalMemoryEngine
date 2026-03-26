// server/DoorOneApiServer.js
//
// Layer: Tooling / HTTP inspection surface
// Authority class: tooling
//
// Purpose:
//   Expose DoorOneExecutiveLane via a thin HTTP REST API.
//   This server is an OBSERVATIONAL surface only — it delegates all
//   computation to DoorOneExecutiveLane and surfaces the results as
//   non-authoritative JSON.
//
// Boundary contract:
//   - tooling layer only; authority_class: "tooling"
//   - does not mint, modify, or promote any artifacts
//   - does not claim to be the substrate
//   - all responses are labelled is_authoritative: false
//   - ingest endpoint accepts raw signal descriptors and delegates to
//     DoorOneExecutiveLane.ingest() — no pipeline logic here
//   - read endpoints expose read-side outputs only
//   - one DoorOneExecutiveLane instance per server process; not per request
//
// References:
//   - README_MasterConstitution.md §3 / §5
//   - README_ConstitutionAppendix.md §A (authority classes)
//   - runtime/DoorOneExecutiveLane.js (delegation target)

import express from "express";
import { DoorOneExecutiveLane } from "../runtime/DoorOneExecutiveLane.js";

// ─── Default policies ─────────────────────────────────────────────────────────
//
// These are the operational defaults for the server — equivalent to the
// policies used in scripts/run_door_one_live.js. They are configuration,
// not business logic; the server delegates all pipeline execution to
// DoorOneExecutiveLane. All policy ids are namespaced "api.v1".
//
// Callers may override policies at server startup via environment configuration
// or by supplying a custom ExecutiveLane via the factory opts (not yet exposed
// via HTTP — that is a future door).

const DEFAULT_POLICIES = {
    clock_policy_id: "clock.api.v1",

    ingest_policy: {
        policy_id: "ingest.api.v1",
        gap_threshold_multiplier: 3.0,
        allow_non_monotonic: false,
        allow_empty: false,
        non_monotonic_mode: "reject",
    },

    grid_spec: {
        Fs_target: 256,
        t_ref: 0,
        grid_policy: "strict",
        drift_model: "none",
        non_monotonic_policy: "reject",
        interp_method: "linear",
        gap_policy: "interpolate_small",
        small_gap_multiplier: 3.0,
        max_gap_seconds: null,
        anti_alias_filter: false,
    },

    window_spec: {
        mode: "fixed",
        Fs_target: 256,
        base_window_N: 256,
        hop_N: 128,
        window_function: "hann",
        overlap_ratio: 0.5,
        stationarity_policy: "tolerant",
        salience_policy: "off",
        gap_policy: "interpolate_small",
        max_missing_ratio: 0.25,
        boundary_policy: "pad",
    },

    transform_policy: {
        policy_id: "transform.api.v1",
        transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum",
        numeric_policy: "tolerant",
    },

    compression_policy: {
        policy_id: "compress.api.v1",
        selection_method: "topK",
        budget_K: 8,
        maxK: 8,
        include_dc: true,
        invariance_lens: "identity",
        numeric_policy: "tolerant",
        respect_novelty_boundary: true,
        thresholds: {
            max_recon_rmse: 0.25,
            max_energy_residual: 0.25,
            max_band_divergence: 0.30,
        },
    },

    anomaly_policy: {
        policy_id: "anomaly.api.v1",
        invariance_mode: "band_profile",
        divergence_metric: "band_l1",
        threshold_value: 0.15,
        frequency_tolerance_hz: 1.0,
        phase_sensitivity_mode: "strict",
        novelty_min_duration: 0,
        segmentation_mode: "strict",
        dominant_bin_threshold: 0.2,
        new_frequency_threshold: 0.15,
        vanished_frequency_threshold: 0.15,
        energy_shift_threshold: 0.15,
    },

    merge_policy: {
        policy_id: "merge.api.v1",
        adjacency_rule: "time_touching",
        phase_alignment_mode: "clock_delta_rotation",
        weights_mode: "duration",
        novelty_gate: "strict",
        merge_mode: "authoritative",
        grid_tolerance: 0,
    },

    post_merge_compression_policy: {
        policy_id: "merge.compress.api.v1",
        selection_method: "topK",
        budget_K: 8,
        maxK: 8,
        include_dc: true,
        invariance_lens: "identity",
        thresholds: {
            max_recon_rmse: 0.30,
            max_energy_residual: 0.30,
            max_band_divergence: 0.30,
        },
    },

    reconstruct_policy: {
        policy_id: "reconstruct.api.v1",
        output_format: "values",
        fill_missing_bins: "ZERO",
        validate_invariants: true,
        window_compensation: "NONE",
        numeric_policy: "tolerant",
    },

    basin_policy: {
        policy_id: "basin.api.v1",
        similarity_threshold: 0.35,
        min_member_count: 1,
        weight_mode: "duration",
        linkage: "single_link",
    },

    consensus_policy: {
        policy_id: "consensus.api.v1",
        promotion_threshold: 0.8,
        max_energy_drift: 0.1,
        max_band_drift: 0.1,
        coherence_tests: ["energy_invariance", "band_profile_invariance"],
        settlement_mode: "single_node",
    },
};

// ─── Constitutional constants ─────────────────────────────────────────────────

const AUTHORITY_CLASS = "tooling";
const IS_AUTHORITATIVE = false;
const SERVER_VERSION = "0.1.0";
const DOOR = "one";

// ─── Single shared ExecutiveLane instance ─────────────────────────────────────

const executiveLane = new DoorOneExecutiveLane({ policies: DEFAULT_POLICIES });

// ─── Workbench state cache ─────────────────────────────────────────────────────
// The server caches the latest workbench / run result from ingest calls so
// read-side endpoints can serve them without re-running the pipeline.

let _latestWorkbench = null;
let _latestRunResult = null;
let _latestCrossRunReport = null;

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Server-level header: every response declares the authority class
app.use((_req, res, next) => {
    res.setHeader("X-DME-Authority-Class", AUTHORITY_CLASS);
    next();
});

// ─── Observational envelope helper ───────────────────────────────────────────
// Wraps any payload in the constitutional observational envelope so that
// callers cannot mistake API output for authoritative artifact output.

function observational(payload) {
    return {
        authority_class: AUTHORITY_CLASS,
        is_authoritative: IS_AUTHORITATIVE,
        generated_by: "DoorOneApiServer",
        note: "This response is an observational, non-authoritative read-side surface. It is not canon and does not imply artifact promotion.",
        ...payload,
    };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * POST /ingest
 *
 * Body: {
 *   stream_id:    string   — identifies the stream
 *   source_id:   string   — source device / fixture identifier
 *   channel:     string   — signal channel
 *   modality:    string   — signal modality (e.g. "voltage")
 *   clock_policy_id: string
 *   samples:     number[] — raw sample values
 *   sample_rate: number   — samples per second (Hz); used to derive timestamps
 *   timestamp_ms: number  — wall-clock reference for t=0 (optional metadata)
 *   timestamps:  number[] — explicit timestamps in seconds (optional; if absent,
 *                           derived from sample_rate and samples.length)
 * }
 *
 * Delegates to executiveLane.ingest(rawInput) and returns an observational
 * summary. Never returns authoritative artifacts directly.
 */
app.post("/ingest", (req, res) => {
    const body = req.body ?? {};

    // Build the raw input object expected by DoorOneExecutiveLane
    const {
        stream_id,
        source_id,
        channel,
        modality,
        clock_policy_id,
        samples,
        sample_rate,
        timestamp_ms,
        timestamps: explicitTimestamps,
        meta,
    } = body;

    // Derive timestamps from sample_rate if not explicitly supplied
    let timestamps = explicitTimestamps;
    if (!Array.isArray(timestamps) || timestamps.length === 0) {
        if (!Array.isArray(samples) || samples.length === 0) {
            return res.status(400).json(observational({
                ok: false,
                error: "INVALID_INPUT",
                reasons: ["'samples' must be a non-empty array when 'timestamps' is not supplied"],
            }));
        }
        if (typeof sample_rate !== "number" || sample_rate <= 0) {
            return res.status(400).json(observational({
                ok: false,
                error: "INVALID_INPUT",
                reasons: ["'sample_rate' must be a positive number when 'timestamps' is not supplied"],
            }));
        }
        timestamps = samples.map((_, i) => i / sample_rate);
    }

    const values = Array.isArray(samples) ? samples : Array.isArray(body.values) ? body.values : [];

    const rawInput = {
        stream_id,
        source_id: source_id ?? "api_ingest",
        channel: channel ?? "ch0",
        modality: modality ?? "unknown",
        clock_policy_id: clock_policy_id ?? "clock.api.v1",
        timestamps,
        values,
        meta: {
            ...(meta ?? {}),
            timestamp_ms: timestamp_ms ?? null,
            ingested_via: "DoorOneApiServer",
        },
    };

    let result;
    try {
        result = executiveLane.ingest(rawInput);
    } catch (err) {
        return res.status(500).json(observational({
            ok: false,
            error: "OPERATOR_EXCEPTION",
            reasons: [err?.message ?? "Unknown error during ingest"],
        }));
    }

    if (!result?.ok) {
        return res.status(422).json(observational({
            ok: false,
            error: result?.error ?? "INGEST_FAILED",
            reasons: result?.reasons ?? [],
        }));
    }

    // Cache for read-side endpoints
    _latestWorkbench = executiveLane.latestWorkbench();
    _latestRunResult = executiveLane.latestRunResult();
    _latestCrossRunReport = executiveLane.latestCrossRunReport();

    const runResult = result.run_result ?? {};
    const substrate = runResult.substrate ?? {};
    const sessionSummary = result.session_summary ?? {};

    return res.status(200).json(observational({
        ok: true,
        run_id: runResult.run_label ?? null,
        summary: {
            run_count: sessionSummary.run_count ?? null,
            cross_run_available: sessionSummary.cross_run_available ?? false,
        },
        substrate_metrics: {
            state_count: substrate.state_count ?? null,
            basin_count: substrate.basin_count ?? null,
            segment_count: substrate.segment_count ?? null,
            trajectory_frames: substrate.trajectory_frames ?? null,
        },
    }));
});

/**
 * GET /workbench
 *
 * Returns the current workbench state — a read-side integration view.
 * Not canon, not authoritative. Returns 404 if no ingest has been performed.
 */
app.get("/workbench", (_req, res) => {
    const workbench = _latestWorkbench ?? executiveLane.latestWorkbench();

    if (!workbench) {
        return res.status(404).json(observational({
            ok: false,
            error: "NO_DATA",
            reasons: ["No ingest has been performed yet; workbench is empty"],
        }));
    }

    return res.status(200).json(observational({
        ok: true,
        workbench,
    }));
});

/**
 * GET /session
 *
 * Returns the session summary — run count, cross-run availability.
 */
app.get("/session", (_req, res) => {
    let summary;
    try {
        summary = executiveLane.sessionSummary();
    } catch (err) {
        return res.status(500).json(observational({
            ok: false,
            error: "SESSION_READ_FAILED",
            reasons: [err?.message ?? "Unknown error"],
        }));
    }

    return res.status(200).json(observational({
        ok: true,
        session: summary,
    }));
});

/**
 * GET /substrate/metrics
 *
 * Returns substrate size, basin count, and trajectory length from the
 * latest run result. Read-side only; does not re-run any pipeline step.
 */
app.get("/substrate/metrics", (_req, res) => {
    const runResult = _latestRunResult ?? executiveLane.latestRunResult();

    if (!runResult) {
        return res.status(404).json(observational({
            ok: false,
            error: "NO_DATA",
            reasons: ["No ingest has been performed yet; no substrate metrics available"],
        }));
    }

    const substrate = runResult.substrate ?? {};

    return res.status(200).json(observational({
        ok: true,
        substrate_metrics: {
            state_count: substrate.state_count ?? null,
            basin_count: substrate.basin_count ?? null,
            segment_count: substrate.segment_count ?? null,
            trajectory_frames: substrate.trajectory_frames ?? null,
            t_span: substrate.t_span ?? null,
            segment_ids: substrate.segment_ids ?? [],
        },
    }));
});

/**
 * GET /trajectory
 *
 * Returns recent trajectory frames from the latest run result.
 * Query param: ?limit=N (default 50)
 */
app.get("/trajectory", (req, res) => {
    const runResult = _latestRunResult ?? executiveLane.latestRunResult();

    if (!runResult) {
        return res.status(404).json(observational({
            ok: false,
            error: "NO_DATA",
            reasons: ["No ingest has been performed yet; no trajectory available"],
        }));
    }

    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50;

    // Trajectory frames are available inside summaries.trajectory
    const trajectorySummary = runResult.summaries?.trajectory ?? null;
    const substrate = runResult.substrate ?? {};

    return res.status(200).json(observational({
        ok: true,
        limit,
        trajectory: {
            summary: trajectorySummary,
            trajectory_frames: substrate.trajectory_frames ?? null,
            t_span: substrate.t_span ?? null,
            segment_ids: substrate.segment_ids ?? [],
            segment_transitions: substrate.segment_transitions ?? [],
            note: "Full frame buffer is held in-process by MemorySubstrate. This surface exposes the summary and transition view only. Use /workbench for the full interpretation surface.",
        },
    }));
});

/**
 * GET /consensus/readiness
 *
 * Returns the current PromotionReadinessReport from the latest workbench.
 * Observational only — does not trigger ConsensusOp or mint C1.
 */
app.get("/consensus/readiness", (_req, res) => {
    const workbench = _latestWorkbench ?? executiveLane.latestWorkbench();

    if (!workbench) {
        return res.status(404).json(observational({
            ok: false,
            error: "NO_DATA",
            reasons: ["No ingest has been performed yet; no promotion readiness data available"],
        }));
    }

    const readiness = workbench.promotion_readiness ?? null;

    return res.status(200).json(observational({
        ok: true,
        promotion_readiness: readiness,
        note: "PromotionReadinessReport is observational. It does not trigger ConsensusOp. C1 minting requires explicit promotion outside this API surface.",
    }));
});

/**
 * POST /reset
 *
 * Resets the ExecutiveLane session — clears all run history and cached state.
 * Does not affect any already-committed external canonical memory (none exists
 * in Door One scope).
 */
app.post("/reset", (_req, res) => {
    let resetResult;
    try {
        resetResult = executiveLane.reset();
    } catch (err) {
        return res.status(500).json(observational({
            ok: false,
            error: "RESET_FAILED",
            reasons: [err?.message ?? "Unknown error"],
        }));
    }

    // Clear local cache
    _latestWorkbench = null;
    _latestRunResult = null;
    _latestCrossRunReport = null;

    return res.status(200).json(observational({
        ok: resetResult?.ok ?? true,
        reset: true,
        timestamp_ms: Date.now(),
    }));
});

/**
 * GET /health
 *
 * Liveness check. Returns server version and door identifier.
 */
app.get("/health", (_req, res) => {
    return res.status(200).json({
        status: "ok",
        version: SERVER_VERSION,
        door: DOOR,
        authority_class: AUTHORITY_CLASS,
        is_authoritative: IS_AUTHORITATIVE,
    });
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
    res.status(404).json(observational({
        ok: false,
        error: "NOT_FOUND",
        reasons: ["The requested endpoint does not exist on this server"],
    }));
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3141;

app.listen(PORT, () => {
    console.log(`DME Door One API Server listening on :${PORT}`);
    console.log(`  authority_class : ${AUTHORITY_CLASS}`);
    console.log(`  is_authoritative: ${IS_AUTHORITATIVE}`);
    console.log(`  door            : ${DOOR}`);
    console.log(`  version         : ${SERVER_VERSION}`);
    console.log(`  note: This server is an observational inspection surface only.`);
    console.log(`        It is not the substrate. It does not mint or promote artifacts.`);
});

export { app };
