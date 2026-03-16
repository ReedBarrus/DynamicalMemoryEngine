// tests/test_door_one_executive_lane.js
//
// Contract tests for runtime/DoorOneExecutiveLane.js
//
// Scope:
//   - constructor / initial state
//   - ingest success path
//   - repeated-run session accumulation
//   - latest accessors
//   - reset
//   - determinism
//   - failed input handling
//   - boundary integrity
//
// Boundary contract:
//   - executive coordination only
//   - not canon
//   - not promotion
//   - does not mint C1
//   - does not mutate raw input

import { DoorOneExecutiveLane } from "../runtime/DoorOneExecutiveLane.js";
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

function deepEq(a, b, label) {
    const sa = JSON.stringify(a);
    const sb = JSON.stringify(b);
    ok(sa === sb, `${label}${sa === sb ? "" : " (deep mismatch)"}`);
}

function notIncludes(str, sub, label) {
    ok(!String(str).includes(sub), label);
}

function isOneOf(value, allowed, label) {
    ok(allowed.includes(value), `${label} (${value})`);
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
};

const QUERY_SPEC = {
    query_id: "q.exec.synthetic.v1",
    kind: "energy_trend",
    mode: "ENERGY",
    scope: { allow_cross_segment: true },
};

const QUERY_POLICY = {
    policy_id: "qp.exec.synthetic.v1",
    scoring: "energy_delta",
    normalization: "none",
    topK: 5,
};

const EPOCH_CONTEXT = {
    epoch_id: "epoch.synthetic.1",
    t_start: 0,
    t_end: 20,
    settlement_policy_id: "settlement.synthetic.v1",
    consensus_window: 10,
};

const CONSENSUS_POLICY = {
    policy_id: "consensus.exec.synthetic.v1",
};

function makeRawInput({ seed = 7, noiseStd = 0.01, source_id = "exec.probe" } = {}) {
    const { signal } = makeTestSignal({
        durationSec: 4,
        fs: 8,
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

// ─────────────────────────────────────────────────────────────────────────────
// Build lane
// ─────────────────────────────────────────────────────────────────────────────

const lane = new DoorOneExecutiveLane({
    policies: POLICIES,
    querySpec: QUERY_SPEC,
    queryPolicy: QUERY_POLICY,
    epochContext: EPOCH_CONTEXT,
    consensusPolicy: CONSENSUS_POLICY,
    max_runs: 5,
    session_id: "door-one-exec-test-session",
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

section("A. Initial state");
eq(lane.latestRunResult(), null, "A1: latestRunResult null at start");
eq(lane.latestWorkbench(), null, "A2: latestWorkbench null at start");
eq(lane.latestCrossRunReport(), null, "A3: latestCrossRunReport null at start");
eq(lane.sessionSummary().run_count, 0, "A4: sessionSummary.run_count = 0");
eq(lane.sessionSummary().cross_run_available, false, "A5: sessionSummary.cross_run_available = false");

section("B. Ingest success path");
const rawA = makeRawInput({ seed: 7, source_id: "exec.runA" });
const rawABefore = JSON.stringify(rawA);

const ingestA = lane.ingest(rawA, {
    run_label: "exec_run_a",
});
eq(ingestA.ok, true, "B1: first ingest ok=true");
ok(ingestA.run_result && typeof ingestA.run_result === "object", "B2: run_result present");
ok(ingestA.workbench && typeof ingestA.workbench === "object", "B3: workbench present");
ok(ingestA.session_summary && typeof ingestA.session_summary === "object", "B4: session_summary present");
eq(ingestA.run_result.run_label, "exec_run_a", "B5: run_label preserved");
eq(ingestA.workbench.workbench_type, "runtime:door_one_workbench", "B6: workbench_type correct");
eq(ingestA.session_summary.run_count, 1, "B7: session run_count = 1 after first ingest");
eq(JSON.stringify(rawA), rawABefore, "B8: ingest does not mutate raw input");

section("C. Repeated-run accumulation");
const ingestB = lane.ingest(
    makeRawInput({ seed: 7, source_id: "exec.runB" }),
    { run_label: "exec_run_b" }
);
eq(ingestB.ok, true, "C1: second ingest ok=true");
eq(ingestB.session_summary.run_count, 2, "C2: session run_count = 2 after second ingest");
eq(ingestB.session_summary.cross_run_available, true, "C3: cross_run_available=true after second ingest");
eq(ingestB.session_summary.cross_run_run_count, 2, "C4: cross_run_run_count = 2");

const ingestC = lane.ingest(
    makeRawInput({ seed: 19, noiseStd: 0.03, source_id: "exec.runC" }),
    { run_label: "exec_run_c" }
);
eq(ingestC.ok, true, "C5: third ingest ok=true");
eq(ingestC.session_summary.run_count, 3, "C6: session run_count = 3 after third ingest");
eq(ingestC.session_summary.cross_run_available, true, "C7: cross_run still available");
eq(ingestC.session_summary.cross_run_run_count, 3, "C8: cross_run_run_count = 3");

section("D. Latest accessors");
ok(lane.latestRunResult() && typeof lane.latestRunResult() === "object", "D1: latestRunResult returns object");
ok(lane.latestWorkbench() && typeof lane.latestWorkbench() === "object", "D2: latestWorkbench returns object");
ok(lane.latestCrossRunReport() && typeof lane.latestCrossRunReport() === "object", "D3: latestCrossRunReport returns object");
eq(lane.latestRunResult().run_label, "exec_run_c", "D4: latestRunResult is newest run");
eq(lane.latestWorkbench().workbench_type, "runtime:door_one_workbench", "D5: latestWorkbench type correct");
eq(lane.latestCrossRunReport().report_type, "runtime:cross_run_dynamics_report", "D6: latestCrossRunReport type correct");

section("E. Workbench / review integration");
eq(
    ingestC.workbench.promotion_readiness.report.report_type,
    "runtime:promotion_readiness_report",
    "E1: workbench includes promotion readiness"
);
eq(
    ingestC.workbench.canon_candidate.dossier.dossier_type,
    "runtime:canon_candidate_dossier",
    "E2: workbench includes canon candidate dossier"
);
ok(
    ["defer", "reject", "eligible_for_promotion"].includes(
        ingestC.workbench.consensus_review.review?.result
    ),
    "E3: workbench includes bounded consensus review result"
);

section("F. Determinism");
const lane2 = new DoorOneExecutiveLane({
    policies: POLICIES,
    querySpec: QUERY_SPEC,
    queryPolicy: QUERY_POLICY,
    epochContext: EPOCH_CONTEXT,
    consensusPolicy: CONSENSUS_POLICY,
    max_runs: 5,
    session_id: "door-one-exec-test-session-2",
});

const seq1A = lane2.ingest(makeRawInput({ seed: 7, source_id: "exec.detA" }), { run_label: "det_a" });
const seq1B = lane2.ingest(makeRawInput({ seed: 7, source_id: "exec.detB" }), { run_label: "det_b" });
const seq1C = lane2.ingest(makeRawInput({ seed: 19, noiseStd: 0.03, source_id: "exec.detC" }), { run_label: "det_c" });

const lane3 = new DoorOneExecutiveLane({
    policies: POLICIES,
    querySpec: QUERY_SPEC,
    queryPolicy: QUERY_POLICY,
    epochContext: EPOCH_CONTEXT,
    consensusPolicy: CONSENSUS_POLICY,
    max_runs: 5,
    session_id: "door-one-exec-test-session-3",
});

const seq2A = lane3.ingest(makeRawInput({ seed: 7, source_id: "exec.detA" }), { run_label: "det_a" });
const seq2B = lane3.ingest(makeRawInput({ seed: 7, source_id: "exec.detB" }), { run_label: "det_b" });
const seq2C = lane3.ingest(makeRawInput({ seed: 19, noiseStd: 0.03, source_id: "exec.detC" }), { run_label: "det_c" });

deepEq(seq1A.run_result, seq2A.run_result, "F1: first run_result deterministic");
deepEq(seq1B.cross_run_report, seq2B.cross_run_report, "F2: second cross_run_report deterministic");
deepEq(seq1C.workbench, seq2C.workbench, "F3: third workbench deterministic");

section("G. Reset");
const resetRes = lane.reset();
eq(resetRes.ok, true, "G1: reset returns ok=true");
eq(lane.latestRunResult(), null, "G2: latestRunResult cleared");
eq(lane.latestWorkbench(), null, "G3: latestWorkbench cleared");
eq(lane.latestCrossRunReport(), null, "G4: latestCrossRunReport cleared");
eq(lane.sessionSummary().run_count, 0, "G5: sessionSummary.run_count reset to 0");

section("H. Failed input handling");
const bad0 = lane.ingest(null);
eq(bad0.ok, false, "H1: null input -> ok=false");
eq(bad0.error, "INVALID_INPUT", "H2: null input -> INVALID_INPUT");

const bad1 = lane.ingest({});
eq(bad1.ok, false, "H3: empty object -> ok=false");
eq(bad1.error, "INVALID_INPUT", "H4: empty object -> INVALID_INPUT");

const bad2 = lane.ingest({ timestamps: [], values: [] });
eq(bad2.ok, false, "H5: empty arrays -> ok=false");
eq(bad2.error, "INVALID_INPUT", "H6: empty arrays -> INVALID_INPUT");

const bad3 = lane.ingest({ timestamps: [0, 1], values: [1] });
eq(bad3.ok, false, "H7: mismatched lengths -> ok=false");
eq(bad3.error, "INVALID_INPUT", "H8: mismatched lengths -> INVALID_INPUT");

section("I. Boundary integrity");
const json = JSON.stringify(ingestC);
notIncludes(json, '"artifact_class":"C1"', "I1: no C1 artifact class");
notIncludes(json, '"canonical"', "I2: no canonical key");
notIncludes(json, '"promoted"', "I3: no promoted key");
notIncludes(json, '"truth"', "I4: no truth key");
notIncludes(json, '"ontology":', "I5: no ontology key");
isOneOf(
    ingestC.workbench.consensus_review.review?.result,
    ["defer", "reject", "eligible_for_promotion"],
    "I6: bounded consensus result only"
);

finish();
