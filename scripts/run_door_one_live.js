// scripts/run_door_one_live.js
//
// Door One pseudo-live executive runner
//
// Purpose:
//   - drive DoorOneExecutiveLane with repeated synthetic inputs
//   - render latest DoorOneWorkbench HUD each cycle
//   - write snapshots to ./out_live/
//   - stay thin and executable; no new authority semantics
//
// Boundary contract:
//   - thin wrapper only
//   - not canon
//   - not promotion
//   - does not mint C1
//   - consumes DoorOneExecutiveLane + DoorOneHUD as-is
//
// Future attach points:
//   - AnalogSamplerOp.flushAll() / flushChunk() output
//   - file-based raw ingest input
//   - device/socket adapters that emit raw Door One input structs

import { mkdir, writeFile, readdir, rm } from "node:fs/promises";
import { makeTestSignal } from "../fixtures/test_signal.js";
import { DoorOneExecutiveLane } from "../runtime/DoorOneExecutiveLane.js";
import { DoorOneHUD } from "../hud/DoorOneHUD.js";
import { AnalogSamplerOp } from "../operators/sampler/AnalogSamplerOp.js";

// ─────────────────────────────────────────────────────────────────────────────
// Policies / query / review context
// ─────────────────────────────────────────────────────────────────────────────

const POLICIES = {
    clock_policy_id: "clock.synthetic.v1",

    ingest_policy: {
        policy_id: "ingest.synthetic.v1",
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
        policy_id: "transform.synthetic.v1",
        transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum",
        numeric_policy: "tolerant",
    },

    compression_policy: {
        policy_id: "compress.synthetic.v1",
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
        policy_id: "anomaly.synthetic.v1",
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
        policy_id: "merge.synthetic.v1",
        adjacency_rule: "time_touching",
        phase_alignment_mode: "clock_delta_rotation",
        weights_mode: "duration",
        novelty_gate: "strict",
        merge_mode: "authoritative",
        grid_tolerance: 0,
    },

    post_merge_compression_policy: {
        policy_id: "merge.compress.synthetic.v1",
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
        policy_id: "reconstruct.synthetic.v1",
        output_format: "values",
        fill_missing_bins: "ZERO",
        validate_invariants: true,
        window_compensation: "NONE",
        numeric_policy: "tolerant",
    },

    basin_policy: {
        policy_id: "basin.synthetic.v1",
        similarity_threshold: 0.35,
        min_member_count: 1,
        weight_mode: "duration",
        linkage: "single_link",
    },

    consensus_policy: {
        policy_id: "consensus.synthetic.v1",
        promotion_threshold: 0.8,
        max_energy_drift: 0.1,
        max_band_drift: 0.1,
        coherence_tests: ["energy_invariance", "band_profile_invariance"],
        settlement_mode: "single_node",
    },
};

const QUERY_SPEC = {
    query_id: "q.live.synthetic.v1",
    kind: "energy_trend",
    mode: "ENERGY",
    scope: { allow_cross_segment: true },
};

const QUERY_POLICY = {
    policy_id: "qp.live.synthetic.v1",
    scoring: "energy_delta",
    normalization: "none",
    topK: 5,
};

const EPOCH_CONTEXT = {
    epoch_id: "epoch.synthetic.live.1",
    t_start: 0,
    t_end: 60,
    settlement_policy_id: "settlement.synthetic.v1",
    consensus_window: 10,
};

const CONSENSUS_POLICY = {
    policy_id: "consensus.live.synthetic.v1",
};

// ─────────────────────────────────────────────────────────────────────────────
// Live source factory
// ─────────────────────────────────────────────────────────────────────────────

const LIVE_SOURCE_MODE = process.env.DOOR_ONE_SOURCE_MODE ?? "synthetic";
const MAX_LIVE_CYCLES_TO_KEEP = Math.max(
    1,
    Number.parseInt(process.env.MAX_LIVE_CYCLES_TO_KEEP ?? "10", 10) || 10
);

const PROVENANCE_ROOT = "./out_provenance/live";

// Supported:
//   - "synthetic"
//   - "sampler_flush_all"
//   - "sampler_flush_chunk"

function makeSyntheticSignal({
    seed = 42,
    noiseStd = 0.03,
    source_id = "synthetic_live_v1",
    durationSec = 10,
    fs = 256,
} = {}) {
    const { signal } = makeTestSignal({
        durationSec,
        fs,
        seed,
        noiseStd,
        source_id,
        channel: "ch0",
        modality: "voltage",
        units: "arb",
    });

    return signal;
}

function makeRawInputFromSignal(signal) {
    return {
        timestamps: signal.timestamps,
        values: signal.values,
        stream_id: signal.stream_id,
        source_id: signal.source_id,
        channel: signal.channel,
        modality: signal.modality,
        meta: signal.meta,
        clock_policy_id: POLICIES.clock_policy_id,
    };
}

function makeSyntheticCycleInput(i) {
    const seeds = [42, 42, 99, 123, 42];
    const noise = [0.03, 0.03, 0.05, 0.02, 0.04];
    const sources = [
        "synthetic_live_v1",
        "synthetic_live_v1",
        "synthetic_live_v2",
        "synthetic_live_v3",
        "synthetic_live_v1",
    ];

    const signal = makeSyntheticSignal({
        seed: seeds[i] ?? (42 + i),
        noiseStd: noise[i] ?? 0.03,
        source_id: sources[i] ?? `synthetic_live_v${i + 1}`,
    });

    return {
        ingest_payload: makeRawInputFromSignal(signal),
        raw_input_for_log: makeRawInputFromSignal(signal),
        source_mode: "synthetic",
    };
}

function createSamplerSource() {
    return new AnalogSamplerOp({
        source_id: "sampler_live_v1",
        channel: "ch0",
        modality: "voltage",
        units: "arb",
        Fs_nominal: POLICIES.grid_spec?.Fs_target ?? 256,
        clock_policy_id: POLICIES.clock_policy_id,
        ingest_policy_id: POLICIES.ingest_policy?.policy_id ?? "ingest.synthetic.v1",
        gap_threshold_multiplier: POLICIES.ingest_policy?.gap_threshold_multiplier ?? 3.0,
        allow_non_monotonic: POLICIES.ingest_policy?.allow_non_monotonic ?? false,
        non_monotonic_mode: POLICIES.ingest_policy?.non_monotonic_mode ?? "reject",
    });
}

function makeSamplerCycleInput(i, sampler, mode = "sampler_flush_all") {
    // v0.1 adapter seam:
    // we still synthesize the sample values here, but route them through the
    // AnalogSamplerOp so the executive lane receives sampler flush output
    // through the exact same ingest path it would use for phone / file / IoT
    // device adapters later.

    const seeds = [42, 42, 99, 123, 42];
    const noise = [0.03, 0.03, 0.05, 0.02, 0.04];
    const sources = [
        "sampler_live_v1",
        "sampler_live_v1",
        "sampler_live_v2",
        "sampler_live_v3",
        "sampler_live_v1",
    ];

    const signal = makeSyntheticSignal({
        seed: seeds[i] ?? (42 + i),
        noiseStd: noise[i] ?? 0.03,
        source_id: sources[i] ?? `sampler_live_v${i + 1}`,
        fs: sampler.Fs_nominal,
    });

    const ingestRes = sampler.ingest({
        values: signal.values,
        timestamps: signal.timestamps,
    });

    if (!ingestRes?.ok) {
        return {
            ingest_payload: ingestRes,
            raw_input_for_log: null,
            source_mode: mode,
        };
    }

    const flushRes =
        mode === "sampler_flush_chunk"
            ? sampler.flushChunk(POLICIES.window_spec?.base_window_N ?? 256, {
                stream_id: signal.stream_id,
            })
            : sampler.flushAll({
                stream_id: signal.stream_id,
            });

    return {
        ingest_payload: flushRes,
        raw_input_for_log: flushRes?.ingest_input ?? null,
        source_mode: mode,
    };
}

function createCycleInputProvider(mode = LIVE_SOURCE_MODE) {
    if (mode === "synthetic") {
        return {
            mode,
            next(i) {
                return makeSyntheticCycleInput(i);
            },
        };
    }

    if (mode === "sampler_flush_all" || mode === "sampler_flush_chunk") {
        const sampler = createSamplerSource();

        return {
            mode,
            next(i) {
                return makeSamplerCycleInput(i, sampler, mode);
            },
        };
    }

    throw new Error(
        `Unsupported DOOR_ONE_SOURCE_MODE="${mode}". ` +
        `Expected "synthetic", "sampler_flush_all", or "sampler_flush_chunk".`
    );
}
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function writeJson(path, data) {
    await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

async function pruneLiveCycleDirs({
    rootDir = "./out_live",
    keepCount = MAX_LIVE_CYCLES_TO_KEEP,
} = {}) {
    const names = await readdir(rootDir, { withFileTypes: true });

    const cycleDirs = names
        .filter((entry) => entry.isDirectory() && /^cycle_\d+$/.test(entry.name))
        .map((entry) => ({
            name: entry.name,
            index: Number.parseInt(entry.name.slice("cycle_".length), 10),
        }))
        .filter((entry) => Number.isFinite(entry.index))
        .sort((a, b) => a.index - b.index);

    const excess = Math.max(0, cycleDirs.length - keepCount);
    if (excess === 0) return;

    const toRemove = cycleDirs.slice(0, excess);

    for (const entry of toRemove) {
        await rm(`${rootDir}/${entry.name}`, { recursive: true, force: true });
    }
}

function buildProvenanceReceipt({
    cycleDirName,
    cycleSummary,
    ingestResult,
    cycleSource,
    rawInputForLog,
}) {
    const wb = ingestResult?.workbench ?? {};
    const runtime = wb?.runtime ?? {};
    const substrate = runtime?.substrate ?? {};
    const prr = wb?.promotion_readiness?.report ?? {};
    const readiness = prr?.readiness_summary ?? {};
    const review = wb?.consensus_review?.review ?? {};
    const runResult = ingestResult?.run_result ?? {};
    const crossRunReport = ingestResult?.cross_run_report ?? null;

    return {
        receipt_type: "runtime:door_one_live_provenance_receipt",
        receipt_version: "0.1.0",
        generated_from:
            "Door One live cycle summary, workbench scope/runtime summaries, and optional cross-run report only; durable provenance receipt, not canon",
        written_at: new Date().toISOString(),

        cycle: {
            cycle_dir: cycleDirName,
            cycle_index: cycleSummary?.cycle_index ?? null,
            run_label: cycleSummary?.run_label ?? runResult?.run_label ?? null,
        },

        scope: {
            stream_id: wb?.scope?.stream_id ?? null,
            source_mode: cycleSource?.source_mode ?? null,
            source_id: rawInputForLog?.source_id ?? null,
            channel: rawInputForLog?.channel ?? null,
            modality: rawInputForLog?.modality ?? null,
        },

        structural_summary: {
            state_count: substrate?.state_count ?? 0,
            basin_count: substrate?.basin_count ?? 0,
            segment_count: substrate?.segment_count ?? 0,
            convergence:
                wb?.interpretation?.trajectory?.trajectory_character?.convergence ?? "unknown",
            motion:
                wb?.interpretation?.trajectory?.trajectory_character?.motion ?? "unknown",
            occupancy:
                wb?.interpretation?.trajectory?.neighborhood_character?.occupancy ?? "unknown",
            recurrence:
                wb?.interpretation?.trajectory?.neighborhood_character?.recurrence_strength ?? "unknown",
            continuity:
                wb?.interpretation?.trajectory?.segment_character?.continuity ?? "unknown",
            transition_selectivity:
                prr?.evidence_domains?.transition_selectivity?.label ?? "unknown",
        },

        review_summary: {
            readiness: readiness?.overall_readiness ?? "unknown",
            confidence: readiness?.confidence ?? "unknown",
            claim_type:
                wb?.canon_candidate?.dossier?.candidate_claim?.claim_type ?? null,
            consensus_result: review?.result ?? "not_reviewed",
            blocker_count:
                Array.isArray(wb?.canon_candidate?.dossier?.blockers)
                    ? wb.canon_candidate.dossier.blockers.length
                    : 0,
            insufficiency_count:
                Array.isArray(wb?.canon_candidate?.dossier?.insufficiencies)
                    ? wb.canon_candidate.dossier.insufficiencies.length
                    : 0,
        },

        cross_run_context: {
            available: !!crossRunReport,
            run_count: crossRunReport?.scope?.run_count ?? 0,
        },

        references: {
            live_cycle_dir: `./out_live/${cycleDirName}`,
            latest_workbench: "./out_live/latest_workbench.json",
            latest_run_result: "./out_live/latest_run_result.json",
            latest_cross_run_report: "./out_live/latest_cross_run_report.json",
            latest_session_summary: "./out_live/session_summary.json",
        },
    };
}

async function writeProvenanceReceipt(receipt) {
    const cycleIndex = String(receipt?.cycle?.cycle_index ?? 0).padStart(4, "0");
    const runLabel = receipt?.cycle?.run_label ?? `cycle_${cycleIndex}`;
    const safeRunLabel = String(runLabel).replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${PROVENANCE_ROOT}/receipt_cycle_${cycleIndex}_${safeRunLabel}.json`;

    await writeJson(path, receipt);
}

function buildCycleSummary(ingestResult, cycleIndex, previousSummary = null) {
    const wb = ingestResult?.workbench ?? {};
    const runtime = wb?.runtime ?? {};
    const substrate = runtime?.substrate ?? {};
    const audit = runtime?.audit ?? {};
    const tir = wb?.interpretation?.trajectory ?? {};
    const prr = wb?.promotion_readiness?.report ?? {};
    const dossier = wb?.canon_candidate?.dossier ?? {};
    const review = wb?.consensus_review?.review ?? {};

    const summary = {
        cycle_index: cycleIndex + 1,
        run_label: ingestResult?.run_result?.run_label ?? "—",
        stream_id: wb?.scope?.stream_id ?? "—",

        run_health: {
            state_count: substrate?.state_count ?? 0,
            basin_count: substrate?.basin_count ?? 0,
            segment_count: substrate?.segment_count ?? 0,
            skipped_windows: Array.isArray(audit?.skipped_windows) ? audit.skipped_windows.length : 0,
            merge_failures: Array.isArray(audit?.merge_failures) ? audit.merge_failures.length : 0,
        },

        structure: {
            convergence: tir?.trajectory_character?.convergence ?? "—",
            motion: tir?.trajectory_character?.motion ?? "—",
            occupancy: tir?.neighborhood_character?.occupancy ?? "—",
            recurrence: tir?.neighborhood_character?.recurrence_strength ?? "—",
            continuity: tir?.segment_character?.continuity ?? "—",
            transition_selectivity:
                prr?.evidence_domains?.transition_selectivity?.label ?? "—",
        },

        review: {
            readiness: prr?.readiness_summary?.overall_readiness ?? "—",
            confidence: prr?.readiness_summary?.confidence_posture ?? "—",
            claim_type: dossier?.candidate_claim?.claim_type ?? "—",
            consensus_result: review?.result ?? "not_run",
            blocker_count: prr?.readiness_summary?.blocker_count ?? 0,
            insufficiency_count: prr?.readiness_summary?.insufficiency_count ?? 0,
        },

        delta_vs_prev: buildCycleDelta(previousSummary, ingestResult),
    };

    return summary;
}

function buildCycleDelta(previousSummary, ingestResult) {
    const wb = ingestResult?.workbench ?? {};
    const tir = wb?.interpretation?.trajectory ?? {};
    const prr = wb?.promotion_readiness?.report ?? {};
    const review = wb?.consensus_review?.review ?? {};
    const crossRunCount = wb?.scope?.cross_run_context?.run_count ?? 0;

    const current = {
        readiness: prr?.readiness_summary?.overall_readiness ?? "—",
        convergence: tir?.trajectory_character?.convergence ?? "—",
        recurrence: tir?.neighborhood_character?.recurrence_strength ?? "—",
        consensus: review?.result ?? "not_run",
    };

    if (!previousSummary) {
        return {
            readiness_changed: "n/a",
            convergence_changed: "n/a",
            recurrence_changed: "n/a",
            consensus_changed: "n/a",
            cross_run_count: crossRunCount,
        };
    }

    return {
        readiness_changed:
            current.readiness === previousSummary.review?.readiness ? "no_change" : "changed",
        convergence_changed:
            current.convergence === previousSummary.structure?.convergence ? "no_change" : "changed",
        recurrence_changed:
            current.recurrence === previousSummary.structure?.recurrence ? "no_change" : "changed",
        consensus_changed:
            current.consensus === previousSummary.review?.consensus_result ? "no_change" : "changed",
        cross_run_count: crossRunCount,
    };
}

function conciseCycleSummary(summary) {
    return [
        "",
        `Cycle ${summary?.cycle_index ?? "—"}`,
        `  run_label: ${summary?.run_label ?? "—"}`,
        `  stream_id: ${summary?.stream_id ?? "—"}`,
        "",
        "  run_health:",
        `    states=${summary?.run_health?.state_count ?? 0}  ` +
        `basins=${summary?.run_health?.basin_count ?? 0}  ` +
        `segments=${summary?.run_health?.segment_count ?? 0}  ` +
        `skipped=${summary?.run_health?.skipped_windows ?? 0}  ` +
        `merge_failures=${summary?.run_health?.merge_failures ?? 0}`,
        "",
        "  structure:",
        `    convergence=${summary?.structure?.convergence ?? "—"}`,
        `    motion=${summary?.structure?.motion ?? "—"}`,
        `    occupancy=${summary?.structure?.occupancy ?? "—"}`,
        `    recurrence=${summary?.structure?.recurrence ?? "—"}`,
        `    continuity=${summary?.structure?.continuity ?? "—"}`,
        `    transition_selectivity=${summary?.structure?.transition_selectivity ?? "—"}`,
        "",
        "  review:",
        `    readiness=${summary?.review?.readiness ?? "—"}`,
        `    confidence=${summary?.review?.confidence ?? "—"}`,
        `    claim=${summary?.review?.claim_type ?? "—"}`,
        `    consensus=${summary?.review?.consensus_result ?? "—"}`,
        `    blockers=${summary?.review?.blocker_count ?? 0}`,
        `    insufficiencies=${summary?.review?.insufficiency_count ?? 0}`,
        "",
        "  delta_vs_prev:",
        `    readiness=${summary?.delta_vs_prev?.readiness_changed ?? "—"}`,
        `    convergence=${summary?.delta_vs_prev?.convergence_changed ?? "—"}`,
        `    recurrence=${summary?.delta_vs_prev?.recurrence_changed ?? "—"}`,
        `    consensus=${summary?.delta_vs_prev?.consensus_changed ?? "—"}`,
        `    cross_run_count=${summary?.delta_vs_prev?.cross_run_count ?? 0}`,
        "",
    ].join("\n");
}
// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir("./out_live", { recursive: true });
    await mkdir(PROVENANCE_ROOT, { recursive: true });
    console.log(`Door One live source mode: ${LIVE_SOURCE_MODE}`);
    console.log(`Door One live retention cap: ${MAX_LIVE_CYCLES_TO_KEEP} cycle directories`);
    console.log(`Door One provenance receipt dir: ${PROVENANCE_ROOT}`);
    const lane = new DoorOneExecutiveLane({
        policies: POLICIES,
        querySpec: QUERY_SPEC,
        queryPolicy: QUERY_POLICY,
        epochContext: EPOCH_CONTEXT,
        consensusPolicy: CONSENSUS_POLICY,
        max_runs: 12,
        session_id: "door-one-live-session",
    });

    const hud = new DoorOneHUD();
    const sourceProvider = createCycleInputProvider();

    const cycleCount = 5;
    let previousSummary = null;

    for (let i = 0; i < cycleCount; i += 1) {
        const cycleSource = sourceProvider.next(i);
        const ingestPayload = cycleSource?.ingest_payload;
        const rawInputForLog = cycleSource?.raw_input_for_log;

        const ingestResult = lane.ingest(ingestPayload, {
            run_label: `live_run_${i + 1}`,
            substrate_id: `door_one_live_substrate_${i + 1}`,
            candidateOptions: {
                claim_type: "stable_structural_identity",
                claim_label: "candidate structural identity",
            },
        });

        if (!ingestResult?.ok) {
            console.error(`Cycle ${i + 1} failed:`);
            console.error(JSON.stringify(ingestResult, null, 2));
            process.exit(1);
        }

        const hudText = hud.renderWorkbench(ingestResult.workbench, {
            mode: "live",
            run_label: ingestResult.run_result?.run_label ?? `live_run_${i + 1}`,
        });
        const cycleSummary = buildCycleSummary(ingestResult, i, previousSummary);

        const cycleDir = `./out_live/cycle_${String(i + 1).padStart(2, "0")}`;
        await mkdir(cycleDir, { recursive: true });
        await writeJson(`${cycleDir}/source_info.json`, {
            source_mode: cycleSource?.source_mode ?? sourceProvider.mode,
            ingest_payload_kind:
                ingestPayload && typeof ingestPayload === "object" && "ingest_input" in ingestPayload
                    ? "sampler_flush"
                    : "raw_input",
        });
        await writeJson(`${cycleDir}/raw_input.json`, rawInputForLog);
        await writeJson(`${cycleDir}/run_result.json`, ingestResult.run_result);
        await writeJson(`${cycleDir}/workbench.json`, ingestResult.workbench);
        await writeJson(`${cycleDir}/cross_run_report.json`, ingestResult.cross_run_report);
        await writeJson(`${cycleDir}/session_summary.json`, ingestResult.session_summary);
        await writeJson("./out_live/source_config.json", {
            source_mode: sourceProvider.mode,
            supported_modes: ["synthetic", "sampler_flush_all", "sampler_flush_chunk"],
        });
        await writeJson(`${cycleDir}/cycle_summary.json`, cycleSummary);
        await writeFile(`${cycleDir}/hud.txt`, hudText, "utf8");

        const cycleDirName = `cycle_${String(i + 1).padStart(2, "0")}`;
        const provenanceReceipt = buildProvenanceReceipt({
            cycleDirName,
            cycleSummary,
            ingestResult,
            cycleSource,
            rawInputForLog,
        });

        await writeProvenanceReceipt(provenanceReceipt);

        await pruneLiveCycleDirs({
            rootDir: "./out_live",
            keepCount: MAX_LIVE_CYCLES_TO_KEEP,
        });

        console.log(conciseCycleSummary(cycleSummary));
        previousSummary = cycleSummary;
    }

    const latestWorkbench = lane.latestWorkbench();
    const latestRun = lane.latestRunResult();
    const latestCrossRun = lane.latestCrossRunReport();
    const sessionSummary = lane.sessionSummary();

    await writeJson("./out_live/source_config.json", {
        source_mode: sourceProvider.mode,
        supported_modes: ["synthetic", "sampler_flush_all", "sampler_flush_chunk"],
    });
    await writeJson(`${PROVENANCE_ROOT}/retention_config.json`, {
        receipt_type: "runtime:door_one_live_provenance_retention_config",
        max_live_cycles_to_keep: MAX_LIVE_CYCLES_TO_KEEP,
        provenance_root: PROVENANCE_ROOT,
        live_root: "./out_live",
        preserved_latest_files: [
            "latest_workbench.json",
            "latest_run_result.json",
            "latest_cross_run_report.json",
            "session_summary.json",
            "source_config.json",
        ],
        pruned_surface: "out_live/cycle_XX",
        durable_surface: "out_provenance/live/receipt_cycle_*.json",
    });
    await writeJson("./out_live/latest_workbench.json", latestWorkbench);
    await writeJson("./out_live/latest_run_result.json", latestRun);
    await writeJson("./out_live/latest_cross_run_report.json", latestCrossRun);
    await writeJson("./out_live/session_summary.json", sessionSummary);

    console.log("Live outputs written to ./out_live/");
    console.log(`  - bounded cycle_XX/ history (max ${MAX_LIVE_CYCLES_TO_KEEP})`);
    console.log("  - latest_workbench.json");
    console.log("  - latest_run_result.json");
    console.log("  - latest_cross_run_report.json");
    console.log("  - session_summary.json");
    console.log(`Durable provenance receipts written to ${PROVENANCE_ROOT}/`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});