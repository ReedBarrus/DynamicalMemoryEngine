// scripts/run_door_one_workbench.js
//
// Door One Workbench runner
//
// Purpose:
//   - run a lawful Door One batch pass
//   - assemble the DoorOneWorkbench view
//   - write inspection outputs to ./out_workbench/
//   - print a concise terminal summary
//
// Boundary contract:
//   - thin executable wrapper only
//   - does not define new artifact meaning
//   - does not activate canon
//   - does not mint C1
//   - consumes DoorOneOrchestrator + DoorOneWorkbench as-is

import { mkdir, writeFile } from "node:fs/promises";

import { makeTestSignal } from "../fixtures/test_signal.js";
import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { DoorOneWorkbench } from "../runtime/DoorOneWorkbench.js";
import { DoorOneHUD } from "../hud/DoorOneHUD.js";
import { CrossRunSession } from "../runtime/CrossRunSession.js";

// ─────────────────────────────────────────────────────────────────────────────
// Policies
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

    epoch_context: {
        epoch_id: "epoch.synthetic.1",
        t_start: 0,
        t_end: 20,
        settlement_policy_id: "settlement.synthetic.v1",
        consensus_window: 10,
    },
};

const QUERY_SPEC = {
    query_id: "q.workbench.synthetic.v1",
    kind: "energy_trend",
    mode: "ENERGY",
    scope: { allow_cross_segment: true },
};

const QUERY_POLICY = {
    policy_id: "qp.workbench.synthetic.v1",
    scoring: "energy_delta",
    normalization: "none",
    topK: 5,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRawInput({ seed = 42, noiseStd = 0.03, source_id = "synthetic_workbench_v1" } = {}) {
    const { signal } = makeTestSignal({
        durationSec: 10,
        fs: 256,
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

function conciseWorkbenchSummary(workbench) {
    const review = workbench?.consensus_review?.review;
    const dossier = workbench?.canon_candidate?.dossier;
    const readiness = workbench?.promotion_readiness?.report;

    return [
        "",
        "Door One Workbench",
        `  stream_id: ${workbench?.scope?.stream_id ?? "—"}`,
        `  segments: ${(workbench?.scope?.segment_ids ?? []).length}`,
        `  cross_run: ${workbench?.scope?.cross_run_context?.available ? `yes (${workbench.scope.cross_run_context.run_count})` : "no"}`,
        `  readiness: ${readiness?.readiness_summary?.overall_readiness ?? "—"}`,
        `  candidate_claim: ${dossier?.candidate_claim?.claim_type ?? "—"}`,
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
    await mkdir("./out_workbench", { recursive: true });

    // Primary run
    const raw = makeRawInput({ seed: 42, noiseStd: 0.03, source_id: "synthetic_workbench_v1" });

    const orch = new DoorOneOrchestrator({
        policies: POLICIES,
        substrate_id: "door_one_workbench_substrate",
    });

    const result = orch.runBatch(raw, {
        query_spec: QUERY_SPEC,
        query_policy: QUERY_POLICY,
    });

    if (!result?.ok) {
        console.error("DoorOneOrchestrator failed:");
        console.error(JSON.stringify(result, null, 2));
        process.exit(1);
    }

    result.run_label = "workbench_run_a";

    // Optional cross-run context for a richer workbench
    const runB = (() => {
        const o = new DoorOneOrchestrator({
            policies: POLICIES,
            substrate_id: "door_one_workbench_substrate_b",
        });
        const r = o.runBatch(
            makeRawInput({ seed: 42, noiseStd: 0.03, source_id: "synthetic_workbench_v1" }),
            { query_spec: QUERY_SPEC, query_policy: QUERY_POLICY }
        );
        r.run_label = "workbench_run_b";
        return r;
    })();

    const runC = (() => {
        const o = new DoorOneOrchestrator({
            policies: {
                ...POLICIES,
                anomaly_policy: {
                    ...POLICIES.anomaly_policy,
                    threshold_value: 0.08,
                },
            },
            substrate_id: "door_one_workbench_substrate_c",
        });
        const r = o.runBatch(
            makeRawInput({ seed: 99, noiseStd: 0.05, source_id: "synthetic_workbench_v2" }),
            { query_spec: QUERY_SPEC, query_policy: QUERY_POLICY }
        );
        r.run_label = "workbench_run_c";
        return r;
    })();

    const session = new CrossRunSession({
        session_id: "door-one-workbench-session",
        max_runs: 10,
    });

    session.addRun(result);
    session.addRun(runB);
    session.addRun(runC);

    const workbench = new DoorOneWorkbench();
    const assembled = workbench.assemble(result, {
        crossRunSession: session,
        epochContext: POLICIES.epoch_context,
        consensusPolicy: { policy_id: "consensus.workbench.synthetic.v1" },
        candidateOptions: {
            claim_type: "stable_structural_identity",
            claim_label: "candidate structural identity",
        },
    });

    if (!assembled?.workbench_type) {
        console.error("DoorOneWorkbench assembly failed:");
        console.error(JSON.stringify(assembled, null, 2));
        process.exit(1);
    }

    const hud = new DoorOneHUD();
    const hudText = hud.renderWorkbench(assembled, {
        mode: "batch",
        run_label: result.run_label,
    });

    // Write outputs
    await writeJson("./out_workbench/orchestrator_result.json", result);
    await writeJson("./out_workbench/workbench.json", assembled);
    await writeFile("./out_workbench/hud.txt", hudText, "utf8");
    await writeJson("./out_workbench/cross_run_report.json", assembled.cross_run?.report);
    await writeJson("./out_workbench/promotion_readiness.json", assembled.promotion_readiness?.report);
    await writeJson("./out_workbench/canon_candidate_dossier.json", assembled.canon_candidate?.dossier);
    await writeJson("./out_workbench/consensus_review.json", assembled.consensus_review?.review);

    console.log(conciseWorkbenchSummary(assembled));
    console.log("Outputs written to ./out_workbench/");
    console.log("  - orchestrator_result.json");
    console.log("  - workbench.json");
    console.log("  - hud.txt");
    console.log("  - cross_run_report.json");
    console.log("  - promotion_readiness.json");
    console.log("  - canon_candidate_dossier.json");
    console.log("  - consensus_review.json");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});