// tests/test_door_one_hud_workbench.js
//
// Contract tests for DoorOneHUD.renderWorkbench(...)
//
// Scope:
//   - workbench HUD output shape
//   - required panels present
//   - promotion readiness panel
//   - canon candidate dossier panel
//   - consensus review panel
//   - no canon leakage
//   - determinism
//   - failed input handling

import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { CrossRunDynamicsReport } from "../runtime/CrossRunDynamicsReport.js";
import { CrossRunSession } from "../runtime/CrossRunSession.js";
import { DoorOneWorkbench } from "../runtime/DoorOneWorkbench.js";
import { DoorOneHUD } from "../hud/DoorOneHUD.js";
import { makeTestSignal } from "../fixtures/test_signal.js";

// ─────────────────────────────────────────────────────────────────────────────
// Minimal test harness
// ─────────────────────────────────────────────────────────────────────────────

let PASS = 0;
let FAIL = 0;

function section(title) {
    console.log(`\n── ${title} ──`);
}

function ok(condition, label) {
    if (condition) {
        PASS += 1;
        console.log(`  ✓ ${label}`);
    } else {
        FAIL += 1;
        console.log(`  ✗ ${label}`);
    }
}

function eq(actual, expected, label) {
    ok(Object.is(actual, expected), `${label}${Object.is(actual, expected) ? "" : ` (expected ${expected}, got ${actual})`}`);
}

function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL === 0 ? "  ALL TESTS PASSED ✓" : "  TESTS FAILED ✗");
    if (FAIL > 0) process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared fixture setup
// ─────────────────────────────────────────────────────────────────────────────

const BASE_POLICIES = {
    clock_policy_id: "clock.synthetic.v1",

    ingest_policy: {
        policy_id: "ingest.synthetic.v1",
        gap_threshold_multiplier: 3.0,
        allow_non_monotonic: false,
        allow_empty: false,
        non_monotonic_mode: "reject",
    },

    grid_spec: {
        Fs_target: 8,
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
        Fs_target: 8,
        base_window_N: 8,
        hop_N: 4,
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

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function makePolicies(overrides = {}) {
    const p = clone(BASE_POLICIES);
    for (const [k, v] of Object.entries(overrides)) {
        if (v && typeof v === "object" && !Array.isArray(v) && p[k] && typeof p[k] === "object") {
            p[k] = { ...p[k], ...v };
        } else {
            p[k] = v;
        }
    }
    return p;
}

function makeRawFixture({
    durationSec = 4,
    fs = 8,
    seed = 7,
    noiseStd = 0.01,
    source_id = "hudwb.probe",
    channel = "ch0",
    modality = "voltage",
    units = "arb",
} = {}) {
    const { signal } = makeTestSignal({
        durationSec,
        fs,
        seed,
        noiseStd,
        source_id,
        channel,
        modality,
        units,
    });

    return {
        timestamps: signal.timestamps,
        values: signal.values,
        stream_id: signal.stream_id,
        source_id: signal.source_id,
        channel: signal.channel,
        modality: signal.modality,
        meta: signal.meta,
        clock_policy_id: BASE_POLICIES.clock_policy_id,
    };
}

function makeQuerySpec(id = "q.hudwb") {
    return {
        query_id: id,
        kind: "energy_trend",
        mode: "ENERGY",
        scope: { allow_cross_segment: true },
    };
}

function makeQueryPolicy(id = "qp.hudwb") {
    return {
        policy_id: id,
        scoring: "energy_delta",
        normalization: "none",
        topK: 5,
    };
}

function buildRun({
    runLabel,
    raw,
    policies,
    querySpec,
    queryPolicy,
} = {}) {
    const orch = new DoorOneOrchestrator({
        policies: policies ?? makePolicies(),
        substrate_id: `substrate:${runLabel ?? "run"}`,
    });

    const result = orch.runBatch(
        raw ?? makeRawFixture(),
        {
            query_spec: querySpec ?? makeQuerySpec(runLabel ? `q.${runLabel}` : "q.hudwb"),
            query_policy: queryPolicy ?? makeQueryPolicy(runLabel ? `qp.${runLabel}` : "qp.hudwb"),
        }
    );

    result.run_label = runLabel ?? "run";
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build lawful workbench
// ─────────────────────────────────────────────────────────────────────────────

const runA = buildRun({
    runLabel: "run_a",
    raw: makeRawFixture({ seed: 7, source_id: "hudwb.runA" }),
});

const runB = buildRun({
    runLabel: "run_b",
    raw: makeRawFixture({ seed: 7, source_id: "hudwb.runA" }),
});

const runC = buildRun({
    runLabel: "run_c",
    raw: makeRawFixture({ seed: 19, noiseStd: 0.03, source_id: "hudwb.runC" }),
    policies: makePolicies({
        anomaly_policy: { threshold_value: 0.08 },
    }),
});

const session = new CrossRunSession({ session_id: "hudwb.session", max_runs: 5 });
session.addRun(runA);
session.addRun(runB);
session.addRun(runC);

const workbench = new DoorOneWorkbench();
const wb = workbench.assemble(runA, {
    crossRunSession: session,
    epochContext: clone(BASE_POLICIES.epoch_context),
    consensusPolicy: { policy_id: "consensus.hudwb.v1" },
});

const hud = new DoorOneHUD();
const output = hud.renderWorkbench(wb, {
    run_label: "hudwb_main",
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

section("A. HUD consumes workbench");
ok(wb?.workbench_type === "runtime:door_one_workbench", "A1: valid workbench before rendering");
ok(typeof output === "string", "A2: renderWorkbench returns string");
ok(output.length > 0, "A3: output non-empty");

section("B. Required panels present");
ok(output.includes("[1] RUNTIME SUMMARY"), "B1: panel [1] present");
ok(output.includes("[2] ARTIFACTS"), "B2: panel [2] present");
ok(output.includes("[3] SUBSTRATE"), "B3: panel [3] present");
ok(output.includes("[4] STRUCTURAL NEIGHBORHOODS"), "B4: panel [4] present");
ok(output.includes("[5] AUDIT"), "B5: panel [5] present");
ok(output.includes("[6] INTERPRETATION"), "B6: panel [6] present");
ok(output.includes("[7] PROMOTION READINESS"), "B7: panel [7] present");
ok(output.includes("[8] CANON CANDIDATE DOSSIER"), "B8: panel [8] present");
ok(output.includes("[9] CONSENSUS REVIEW"), "B9: panel [9] present");

section("C. Promotion readiness panel");
ok(output.includes("overall"), "C1: readiness overall row present");
ok(output.includes("confidence"), "C2: readiness confidence row present");
ok(output.includes("blockers"), "C3: readiness blockers row present");
ok(output.includes("insufficiencies"), "C4: readiness insufficiencies row present");
ok(output.includes("domains:"), "C5: readiness domains summary present");

section("D. Canon candidate dossier panel");
ok(output.includes("candidate_id"), "D1: candidate_id row present");
ok(output.includes("claim_type"), "D2: claim_type row present");
ok(output.includes("claim_label"), "D3: claim_label row present");
ok(output.includes("canon_target"), "D4: canon_target row present");
ok(output.includes("trust_status"), "D5: trust_status row present");
ok(output.includes("review_status"), "D6: review_status row present");
ok(output.includes("recommendation"), "D7: recommendation row present");

section("E. Consensus review panel");
ok(output.includes("result"), "E1: review result row present");
ok(output.includes("policy_id"), "E2: review policy_id row present");
ok(output.includes("epoch_id"), "E3: review epoch_id row present");
ok(output.includes("dossier_id"), "E4: review dossier_id row present");
ok(output.includes("c1_emitted"), "E5: c1_emitted row present");

section("F. Boundary integrity");
ok(!output.includes("C1 CanonicalState"), "F1: no C1 CanonicalState language");
ok(!output.includes("canonical memory"), "F2: no canonical memory language");
ok(!output.includes("true basin"), "F3: no true basin language");
ok(!output.includes("attractor basin"), "F4: no attractor basin language");
ok(!output.includes("likely next"), "F5: no prediction language");
ok(output.includes("integration view, not canon") || output.includes("Workbench is an integration view, not canon."), "F6: non-canon boundary preserved");
ok(output.includes("no C1 minting in v0.1") || output.includes("does not itself imply C1 minting in v0.1"), "F7: bounded consensus note preserved");

section("G. Determinism");
const output2 = hud.renderWorkbench(wb, {
    run_label: "hudwb_main",
});
eq(output, output2, "G1: identical input -> identical HUD output");

section("H. Failed input handling");
const failed = hud.renderWorkbench(null);
ok(typeof failed === "string", "H1: failed renderWorkbench returns string");
ok(failed.includes("STATUS"), "H2: failed output includes STATUS");
ok(failed.includes("FAILED"), "H3: failed output includes FAILED");
ok(failed.includes("INVALID_WORKBENCH"), "H4: failed output includes INVALID_WORKBENCH");

finish();
