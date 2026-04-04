// tests/test_attention_memory_report.js
//
// Contract tests for runtime/AttentionMemoryReport.js
//
// Scope:
//   - output shape
//   - evidence discipline
//   - determinism
//   - label sanity
//   - boundary integrity
//   - failed input handling
//   - optional base-report injection path
//
// Boundary contract:
//   - derived / observational overlay only
//   - no canon, no prediction, no ontology claims
//   - no semantic intent or trusted commitment claims
//   - consumes DoorOneOrchestrator result + TrajectoryInterpretationReport semantics
//   - deterministic given identical orchestrator result / base report
//
// References:
//   - runtime/AttentionMemoryReport.js
//   - runtime/TrajectoryInterpretationReport.js
//   - runtime/DoorOneOrchestrator.js
//   - README_MasterConstitution.md §3 / §5
//   - README_RepoPlacementConstitution.md (canonical tests/ placement)

import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { TrajectoryInterpretationReport } from "../runtime/TrajectoryInterpretationReport.js";
import { AttentionMemoryReport } from "../runtime/AttentionMemoryReport.js";
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
        source_id: "amr.probe",
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
        query_id: "q.amr",
        kind: "energy_trend",
        mode: "ENERGY",
        scope: { allow_cross_segment: true },
    };
}

function makeQueryPolicy() {
    return {
        policy_id: "qp.amr",
        scoring: "energy_delta",
        normalization: "none",
        topK: 5,
    };
}

function buildGoodResult() {
    const orch = new DoorOneOrchestrator({ policies: POLICIES });
    return orch.runBatch(makeRawFixture(), {
        query_spec: makeQuerySpec(),
        query_policy: makeQueryPolicy(),
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

const amr = new AttentionMemoryReport();
const tir = new TrajectoryInterpretationReport();

const result = buildGoodResult();
const baseReport = tir.interpret(result);
const report = amr.interpret(result, baseReport);

section("A. Output shape");
ok(result?.ok === true, "A1: orchestrator result.ok before overlay");
ok(baseReport && typeof baseReport === "object", "A2: base trajectory report present");
ok(report && typeof report === "object", "A3: interpret() returns plain object");
eq(report.report_type, "runtime:attention_memory_report", "A4: report_type correct");
includes(report.generated_from, "derived overlay", "A5: generated_from preserves overlay boundary");
ok(report.scope && typeof report.scope === "object", "A6: scope present");
ok(report.attention_character && typeof report.attention_character === "object", "A7: attention_character present");
ok(report.memory_character && typeof report.memory_character === "object", "A8: memory_character present");
ok(report.coordination_hints && typeof report.coordination_hints === "object", "A9: coordination_hints present");
ok(Array.isArray(report.overlay_flags), "A10: overlay_flags array present");
ok(Array.isArray(report.notes), "A11: notes array present");
eq(report.scope.stream_id, baseReport.scope?.stream_id ?? null, "A12: scope.stream_id copied from base report");
deepEq(report.scope.segment_ids, baseReport.scope?.segment_ids ?? [], "A13: scope.segment_ids copied from base report");

section("B. Evidence discipline");
ok(report.attention_character.evidence && typeof report.attention_character.evidence === "object", "B1: attention evidence object present");
ok(report.memory_character.evidence && typeof report.memory_character.evidence === "object", "B2: memory evidence object present");
ok(report.coordination_hints.evidence && typeof report.coordination_hints.evidence === "object", "B3: coordination evidence object present");

ok("dominant_dwell_share" in report.attention_character.evidence, "B4: attention evidence.dominant_dwell_share present");
ok("transition_density_value" in report.attention_character.evidence, "B5: attention evidence.transition_density_value present");
ok("motion" in report.attention_character.evidence, "B6: attention evidence.motion present");

ok("total_re_entries" in report.memory_character.evidence, "B7: memory evidence.total_re_entries present");
ok("convergence" in report.memory_character.evidence, "B8: memory evidence.convergence present");
ok("continuity" in report.memory_character.evidence, "B9: memory evidence.continuity present");

ok("sticky_neighborhood" in report.coordination_hints.evidence, "B10: coordination evidence.sticky_neighborhood present");
ok("high_recurrence" in report.coordination_hints.evidence, "B11: coordination evidence.high_recurrence present");
ok("convergence" in report.coordination_hints.evidence, "B12: coordination evidence.convergence present");

ok(!("artifact_class" in report), "B13: report has no artifact_class");
ok(!("artifact_class" in report.attention_character), "B14: attention_character has no artifact_class");
ok(!("artifact_class" in report.memory_character), "B15: memory_character has no artifact_class");
ok(!("artifact_class" in report.coordination_hints), "B16: coordination_hints has no artifact_class");

section("C. Determinism");
const result2 = buildGoodResult();
const baseReport2 = tir.interpret(result2);
const report2 = amr.interpret(result2, baseReport2);
deepEq(report, report2, "C1: identical input result -> identical overlay report");

const internalBaseReport = amr.interpret(result);
deepEq(report, internalBaseReport, "C2: explicit baseReport path matches internal-base path");

section("D. Label sanity");
isOneOf(
    report.attention_character.concentration,
    ["low", "medium", "high"],
    "D1: attention concentration label allowed"
);
isOneOf(
    report.attention_character.persistence,
    ["low", "medium", "high"],
    "D2: attention persistence label allowed"
);
isOneOf(
    report.attention_character.volatility,
    ["low", "medium", "high"],
    "D3: attention volatility label allowed"
);
isOneOf(
    report.memory_character.recurrence_strength,
    ["low", "medium", "high"],
    "D4: memory recurrence_strength label allowed"
);
isOneOf(
    report.memory_character.persistence,
    ["low", "medium", "high"],
    "D5: memory persistence label allowed"
);
isOneOf(
    report.memory_character.stability,
    ["low", "medium", "high"],
    "D6: memory stability label allowed"
);
isOneOf(
    report.coordination_hints.pre_commitment,
    ["absent", "weak", "emergent"],
    "D7: coordination pre_commitment label allowed"
);

section("E. Boundary integrity");
const json = JSON.stringify(report);

notIncludes(json, '"artifact_class":"C1"', "E1: no C1 artifact class in report");
notIncludes(json, '"canonical"', "E2: no canonical key");
notIncludes(json, '"promoted"', "E3: no promoted key");
notIncludes(json, '"trusted"', "E4: no trusted authority language");
notIncludes(json, '"prediction"', "E5: no prediction key");
notIncludes(json, '"next state"', "E6: no next-state language");
notIncludes(json, '"likely next"', "E7: no likely-next language");
notIncludes(json, '"ontology"', "E8: no ontology key");
notIncludes(json, '"intent"', "E9: no intent key");
notIncludes(json, '"agency"', "E10: no agency key");
notIncludes(json, '"commitment":', "E11: no hard commitment object");
notIncludes(json, '"trusted commitment"', "E12: no trusted commitment phrase");

includes(report.generated_from, "not canon", "E13: generated_from denies canon");
includes(report.generated_from, "not intent", "E14: generated_from denies intent");
includes(report.generated_from, "not ontology", "E15: generated_from denies ontology");

ok(
    report.notes.some(n => n.includes("No semantic intent or trusted commitment is asserted.")),
    "E16: notes preserve no-intent / no-trusted-commitment boundary"
);
ok(
    report.notes.some(n => n.includes("Pre-commitment is a cautious coordination hint, not authority or canon.")),
    "E17: notes preserve cautious pre-commitment boundary"
);

section("F. Failed input handling");
const failed1 = amr.interpret(null);
eq(failed1.ok, false, "F1: null input -> ok=false");
eq(failed1.error, "INVALID_INPUT", "F2: null input -> INVALID_INPUT");
ok(Array.isArray(failed1.reasons), "F3: null input -> reasons array");

const failed2 = amr.interpret({ ok: false, error: "WHATEVER" });
eq(failed2.ok, false, "F4: failed orchestrator result -> ok=false");
eq(failed2.error, "INVALID_INPUT", "F5: failed orchestrator result -> INVALID_INPUT");

const failed3 = amr.interpret(result, { ok: false, error: "INVALID_BASE_REPORT" });
eq(failed3.ok, false, "F6: invalid base report -> ok=false");
eq(failed3.error, "INVALID_BASE_REPORT", "F7: invalid base report -> INVALID_BASE_REPORT");
ok(Array.isArray(failed3.reasons), "F8: invalid base report -> reasons array");

finish();