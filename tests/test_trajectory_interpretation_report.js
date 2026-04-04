// tests/test_trajectory_interpretation_report.js
//
// Contract tests for runtime/TrajectoryInterpretationReport.js
//
// Scope:
//   - output shape
//   - evidence discipline
//   - determinism
//   - label sanity
//   - boundary integrity
//   - failed input handling
//
// Boundary contract:
//   - interpretation is derived / observational only
//   - no canon, no prediction, no ontology claims
//   - consumes DoorOneOrchestrator result shape as input
//   - deterministic given identical orchestrator result
//
// References:
//   - runtime/TrajectoryInterpretationReport.js
//   - runtime/DoorOneOrchestrator.js
//   - README_MasterConstitution.md §3 / §5
//   - README_ConstitutionAppendix.md §A / §E

import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { TrajectoryInterpretationReport } from "../runtime/TrajectoryInterpretationReport.js";
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

function includes(str, sub, label) {
    ok(String(str).includes(sub), label);
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

    epoch_context: {
        epoch_id: "epoch.synthetic.1",
        t_start: 0,
        t_end: 20,
        settlement_policy_id: "settlement.synthetic.v1",
        consensus_window: 10,
    },
};

function makeRawFixture() {
    const { signal } = makeTestSignal({
        durationSec: 4,
        fs: 8,
        seed: 7,
        noiseStd: 0.01,
        source_id: "tir.probe",
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

function makeQuerySpec() {
    return {
        query_id: "q.tir",
        kind: "energy_trend",
        mode: "ENERGY",
        scope: { allow_cross_segment: true },
    };
}

function makeQueryPolicy() {
    return {
        policy_id: "qp.tir",
        scoring: "energy_delta",
        normalization: "none",
        topK: 5,
    };
}

function buildGoodResult() {
    const orch = new DoorOneOrchestrator({ policies: POLICIES });
    const result = orch.runBatch(makeRawFixture(), {
        query_spec: makeQuerySpec(),
        query_policy: makeQueryPolicy(),
    });
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

const tir = new TrajectoryInterpretationReport();
const result = buildGoodResult();
const report = tir.interpret(result);

section("A. Output shape");
ok(result?.ok === true, "A1: orchestrator result.ok before interpretation");
ok(report && typeof report === "object", "A2: interpret() returns plain object");
eq(report.report_type, "runtime:trajectory_interpretation_report", "A3: report_type correct");
includes(report.generated_from, "observations only", "A4: generated_from preserves observational boundary");
ok(report.scope && typeof report.scope === "object", "A5: scope present");
ok(report.trajectory_character && typeof report.trajectory_character === "object", "A6: trajectory_character present");
ok(report.neighborhood_character && typeof report.neighborhood_character === "object", "A7: neighborhood_character present");
ok(report.segment_character && typeof report.segment_character === "object", "A8: segment_character present");
ok(Array.isArray(report.dynamics_flags), "A9: dynamics_flags array present");
ok(Array.isArray(report.notes), "A10: notes array present");
eq(report.scope.stream_id, result.artifacts?.a1?.stream_id ?? null, "A11: scope.stream_id sourced from A1");
deepEq(report.scope.segment_ids, result.substrate?.segment_ids ?? [], "A12: scope.segment_ids preserved from substrate");
ok(report.scope.t_span === null || typeof report.scope.t_span === "object", "A13: scope.t_span object|null");

section("B. Evidence discipline");
ok(report.trajectory_character.evidence && typeof report.trajectory_character.evidence === "object", "B1: trajectory evidence object present");
ok(report.neighborhood_character.evidence && typeof report.neighborhood_character.evidence === "object", "B2: neighborhood evidence object present");
ok(report.segment_character.evidence && typeof report.segment_character.evidence === "object", "B3: segment evidence object present");

ok("sufficient_data" in report.trajectory_character.evidence, "B4: trajectory evidence.sufficient_data present");
ok("trend_slope" in report.trajectory_character.evidence, "B5: trajectory evidence.trend_slope present");
ok("mean_l1_delta" in report.trajectory_character.evidence, "B6: trajectory evidence.mean_l1_delta present");
ok("total_neighborhoods_observed" in report.neighborhood_character.evidence, "B7: neighborhood evidence.total_neighborhoods_observed present");
ok("dominant_dwell_share" in report.neighborhood_character.evidence, "B8: neighborhood evidence.dominant_dwell_share present");
ok("segment_transition_count" in report.segment_character.evidence, "B9: segment evidence.segment_transition_count present");
ok("event_type_counts" in report.segment_character.evidence, "B10: segment evidence.event_type_counts present");

ok(!("artifact_class" in report), "B11: report has no artifact_class");
ok(!("artifact_class" in report.trajectory_character), "B12: trajectory_character has no artifact_class");
ok(!("artifact_class" in report.neighborhood_character), "B13: neighborhood_character has no artifact_class");
ok(!("artifact_class" in report.segment_character), "B14: segment_character has no artifact_class");

section("C. Determinism");
const report2 = tir.interpret(buildGoodResult());
deepEq(report, report2, "C1: identical input result -> identical interpretation report");

section("D. Label sanity");
isOneOf(
    report.trajectory_character.convergence,
    ["insufficient_data", "weak", "moderate", "strong"],
    "D1: convergence label allowed"
);
isOneOf(
    report.trajectory_character.motion,
    ["stable", "drifting", "transitional", "oscillatory", "diffuse"],
    "D2: motion label allowed"
);
isOneOf(
    report.neighborhood_character.occupancy,
    ["sticky", "recurrent", "hopping", "diffuse", "sparse"],
    "D3: occupancy label allowed"
);
isOneOf(
    report.neighborhood_character.transition_density,
    ["low", "medium", "high"],
    "D4: transition_density label allowed"
);
isOneOf(
    report.neighborhood_character.recurrence_strength,
    ["low", "medium", "high"],
    "D5: recurrence_strength label allowed"
);
isOneOf(
    report.segment_character.continuity,
    ["smooth", "novelty-driven", "fragmented", "mixed"],
    "D6: segment continuity label allowed"
);
isOneOf(
    report.segment_character.boundary_density,
    ["low", "medium", "high"],
    "D7: boundary_density label allowed"
);

section("E. Boundary integrity");
const json = JSON.stringify(report);

notIncludes(json, '"artifact_class":"C1"', "E1: no C1 artifact class in report");
notIncludes(json, '"canonical"', "E2: no canonical key");
notIncludes(json, '"promoted"', "E3: no promoted key");
notIncludes(json, '"trusted"', "E4: no trusted authority language");
notIncludes(json, '"true basin"', "E5: no true basin claim");
notIncludes(json, '"attractor basin"', "E6: no attractor basin language");
notIncludes(json, '"next state"', "E7: no next-state language");
notIncludes(json, '"likely next"', "E8: no likely-next language");
notIncludes(json, '"forecast"', "E9: no forecast language");

includes(report.generated_from, "not canon", "E10: generated_from denies canon");
includes(report.generated_from, "not prediction", "E11: generated_from denies prediction");
includes(report.generated_from, "not ontology", "E12: generated_from denies ontology");

ok(
    report.notes.some(n => n.includes("Neighborhood recurrence does not prove true dynamical basin membership.")),
    "E13: notes preserve basin-membership caution"
);
ok(
    report.notes.some(n => n.includes("No forward prediction is performed.")),
    "E14: notes preserve no-prediction boundary"
);

section("F. Failed input handling");
const failed1 = tir.interpret(null);
eq(failed1.ok, false, "F1: null input -> ok=false");
eq(failed1.error, "INVALID_INPUT", "F2: null input -> INVALID_INPUT");
ok(Array.isArray(failed1.reasons), "F3: null input -> reasons array");

const failed2 = tir.interpret({ ok: false, error: "WHATEVER" });
eq(failed2.ok, false, "F4: failed orchestrator result -> ok=false");
eq(failed2.error, "INVALID_INPUT", "F5: failed orchestrator result -> INVALID_INPUT");
ok(
    failed2.reasons?.[0]?.includes("requires a successful DoorOneOrchestrator result"),
    "F6: failed input reason is explicit"
);

finish();