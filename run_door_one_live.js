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

import { mkdir, writeFile } from "node:fs/promises";
import { makeTestSignal } from "../fixtures/test_signal.js";
import { DoorOneExecutiveLane } from "../runtime/DoorOneExecutiveLane.js";
import { DoorOneHUD } from "../hud/DoorOneHUD.js";

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
// Synthetic source
// ─────────────────────────────────────────────────────────────────────────────

function makeRawInput({
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

function cycleInput(i) {
    // Mild deterministic perturbation across cycles.
    // Built so future live adapters can replace this function
    // with AnalogSamplerOp.flush*() output unchanged.
    const seeds = [42, 42, 99, 123, 42];
    const noise = [0.03, 0.03, 0.05, 0.02, 0.04];
    const sources = [
        "synthetic_live_v1",
        "synthetic_live_v1",
        "synthetic_live_v2",
        "synthetic_live_v3",
        "synthetic_live_v1",
    ];

    return makeRawInput({
        seed: seeds[i] ?? (42 + i),
        noiseStd: noise[i] ?? 0.03,
        source_id: sources[i] ?? `synthetic_live_v${i + 1}`,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function conciseCycleSummary(ingestResult, cycleIndex) {
    const wb = ingestResult?.workbench ?? {};
    const readiness = wb?.promotion_readiness?.report?.readiness_summary ?? {};
    const dossier = wb?.canon_candidate?.dossier?.candidate_claim ?? {};
    const review = wb?.consensus_review?.review ?? {};

    return [
        "",
        `Cycle ${cycleIndex + 1}`,
        `  run_label: ${ingestResult?.run_result?.run_label ?? "—"}`,
        `  stream_id: ${wb?.scope?.stream_id ?? "—"}`,
        `  cross_run: ${wb?.scope?.cross_run_context?.available ? `yes (${wb.scope.cross_run_context.run_count})` : "no"}`,
        `  readiness: ${readiness?.overall_readiness ?? "—"}`,
        `  candidate_claim: ${dossier?.claim_type ?? "—"}`,
        `  consensus_review: ${review?.result ?? "not_run"}`,
        "",
    ].join("\n");
}

async function writeJson(path, data) {
    await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir("./out_live", { recursive: true });

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

    const cycleCount = 5;

    for (let i = 0; i < cycleCount; i += 1) {
        const rawInput = cycleInput(i);

        const ingestResult = lane.ingest(rawInput, {
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

        const cycleDir = `./out_live/cycle_${String(i + 1).padStart(2, "0")}`;
        await mkdir(cycleDir, { recursive: true });

        await writeJson(`${cycleDir}/raw_input.json`, rawInput);
        await writeJson(`${cycleDir}/run_result.json`, ingestResult.run_result);
        await writeJson(`${cycleDir}/workbench.json`, ingestResult.workbench);
        await writeJson(`${cycleDir}/cross_run_report.json`, ingestResult.cross_run_report);
        await writeJson(`${cycleDir}/session_summary.json`, ingestResult.session_summary);
        await writeFile(`${cycleDir}/hud.txt`, hudText, "utf8");

        console.log(conciseCycleSummary(ingestResult, i));
    }

    const latestWorkbench = lane.latestWorkbench();
    const latestRun = lane.latestRunResult();
    const latestCrossRun = lane.latestCrossRunReport();
    const sessionSummary = lane.sessionSummary();

    await writeJson("./out_live/latest_workbench.json", latestWorkbench);
    await writeJson("./out_live/latest_run_result.json", latestRun);
    await writeJson("./out_live/latest_cross_run_report.json", latestCrossRun);
    await writeJson("./out_live/session_summary.json", sessionSummary);

    console.log("Live outputs written to ./out_live/");
    console.log("  - cycle_01/ ... cycle_05/");
    console.log("  - latest_workbench.json");
    console.log("  - latest_run_result.json");
    console.log("  - latest_cross_run_report.json");
    console.log("  - session_summary.json");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});