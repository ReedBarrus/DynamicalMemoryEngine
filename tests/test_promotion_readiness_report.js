// tests/test_promotion_readiness_report.js
//
// Contract tests for runtime/PromotionReadinessReport.js
//
// Scope:
//   - output shape
//   - evidence discipline
//   - single-run / no-cross-run path
//   - cross-run injection path
//   - determinism
//   - boundary integrity
//   - failed input handling
//
// Boundary contract:
//   - evidence only
//   - not canon
//   - not promotion
//   - not ontology
//   - not truth
//   - consumes completed DoorOneOrchestrator result
//   - may consume CrossRunDynamicsReport as optional strengthening context
//
// References:
//   - runtime/PromotionReadinessReport.js
//   - runtime/DoorOneOrchestrator.js
//   - runtime/CrossRunDynamicsReport.js
//   - README_MasterConstitution.md §3 / §5
//   - README_ConstitutionAppendix.md §A / §E

import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { CrossRunDynamicsReport } from "../runtime/CrossRunDynamicsReport.js";
import { PromotionReadinessReport } from "../runtime/PromotionReadinessReport.js";
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
    source_id = "prr.probe",
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

function makeQuerySpec(id = "q.prr") {
    return {
        query_id: id,
        kind: "energy_trend",
        mode: "ENERGY",
        scope: { allow_cross_segment: true },
    };
}

function makeQueryPolicy(id = "qp.prr") {
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
            query_spec: querySpec ?? makeQuerySpec(runLabel ? `q.${runLabel}` : "q.prr"),
            query_policy: queryPolicy ?? makeQueryPolicy(runLabel ? `qp.${runLabel}` : "qp.prr"),
        }
    );

    result.run_label = runLabel ?? "run";
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build lawful runs and optional cross-run context
// ─────────────────────────────────────────────────────────────────────────────

const runA = buildRun({
    runLabel: "run_a",
    raw: makeRawFixture({ seed: 7, source_id: "prr.runA" }),
});

const runB = buildRun({
    runLabel: "run_b",
    raw: makeRawFixture({ seed: 7, source_id: "prr.runA" }),
});

const runC = buildRun({
    runLabel: "run_c",
    raw: makeRawFixture({ seed: 19, noiseStd: 0.03, source_id: "prr.runC" }),
    policies: makePolicies({
        anomaly_policy: { threshold_value: 0.08 },
    }),
});

const crd = new CrossRunDynamicsReport();
const crossRunReport = crd.compare([runA, runB, runC]);

const prr = new PromotionReadinessReport();
const reportNoCross = prr.interpret(runA);
const reportWithCross = prr.interpret(runA, crossRunReport);

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

section("A. Output shape");
ok(runA?.ok === true, "A1: runA ok");
ok(reportNoCross && typeof reportNoCross === "object", "A2: interpret() returns plain object");
eq(reportNoCross.report_type, "runtime:promotion_readiness_report", "A3: report_type correct");
eq(reportNoCross.report_kind, "promotion_readiness_advisory_overlay", "A4: report_kind correct");
eq(reportNoCross.query_class, "Q7_consultation_readiness", "A5: query_class explicit");
eq(reportNoCross.claim_ceiling, "readiness_only", "A6: claim_ceiling explicit");
includes(reportNoCross.generated_from, "not canon", "A7: generated_from denies canon");
includes(reportNoCross.generated_from, "not promotion", "A8: generated_from denies promotion");
includes(reportNoCross.generated_from, "not approval", "A9: generated_from denies approval");
ok(reportNoCross.scope && typeof reportNoCross.scope === "object", "A10: scope present");
ok(typeof reportNoCross.primary_posture === "string", "A11: primary_posture present");
ok(Array.isArray(reportNoCross.primary_descriptors), "A12: primary_descriptors present");
ok(Array.isArray(reportNoCross.secondary_descriptors), "A13: secondary_descriptors present");
ok(Array.isArray(reportNoCross.evidence_refs), "A14: evidence_refs present");
ok(Array.isArray(reportNoCross.explicit_non_claims), "A15: explicit_non_claims present");
ok(reportNoCross.advisory_posture && typeof reportNoCross.advisory_posture === "object", "A16: advisory_posture present");
ok(reportNoCross.readiness_summary && typeof reportNoCross.readiness_summary === "object", "A17: readiness_summary present");
ok(reportNoCross.evidence_domains && typeof reportNoCross.evidence_domains === "object", "A18: evidence_domains present");
ok(Array.isArray(reportNoCross.blockers), "A19: blockers array present");
ok(Array.isArray(reportNoCross.insufficiencies), "A20: insufficiencies array present");
ok(reportNoCross.advisory_horizon && typeof reportNoCross.advisory_horizon === "object", "A21: advisory_horizon present");
ok(reportNoCross.promotion_hints && typeof reportNoCross.promotion_hints === "object", "A22: promotion_hints compatibility surface present");
ok(Array.isArray(reportNoCross.readiness_flags), "A23: readiness_flags array present");
ok(Array.isArray(reportNoCross.notes), "A24: notes array present");
eq(reportNoCross.scope.stream_id, runA?.artifacts?.a1?.stream_id ?? null, "A25: scope.stream_id sourced from A1");
deepEq(reportNoCross.scope.segment_ids, runA?.substrate?.segment_ids ?? [], "A26: scope.segment_ids preserved from substrate");

section("B. Evidence discipline");
const domains = reportNoCross.evidence_domains;

ok(domains.structural_stability && typeof domains.structural_stability === "object", "B1: structural_stability present");
ok(domains.recurrence_strength && typeof domains.recurrence_strength === "object", "B2: recurrence_strength present");
ok(domains.segment_coherence && typeof domains.segment_coherence === "object", "B3: segment_coherence present");
ok(domains.transition_selectivity && typeof domains.transition_selectivity === "object", "B4: transition_selectivity present");
ok(domains.attention_memory_alignment && typeof domains.attention_memory_alignment === "object", "B5: attention_memory_alignment present");
ok(domains.cross_run_reproducibility && typeof domains.cross_run_reproducibility === "object", "B6: cross_run_reproducibility present");

for (const [name, domain] of Object.entries(domains)) {
    ok("label" in domain, `B7: ${name}.label present`);
    ok(domain.evidence && typeof domain.evidence === "object", `B8: ${name}.evidence present`);
}

ok("convergence" in domains.structural_stability.evidence, "B9: structural_stability evidence.convergence present");
ok("total_re_entries" in domains.recurrence_strength.evidence, "B10: recurrence_strength evidence.total_re_entries present");
ok("continuity" in domains.segment_coherence.evidence, "B11: segment_coherence evidence.continuity present");
ok("transition_density" in domains.transition_selectivity.evidence, "B12: transition_selectivity evidence.transition_density present");
ok("attention_concentration" in domains.attention_memory_alignment.evidence, "B13: attention_memory_alignment evidence.attention_concentration present");
ok("overall_reproducibility" in domains.cross_run_reproducibility.evidence, "B14: cross_run_reproducibility evidence.overall_reproducibility present");

ok(!("artifact_class" in reportNoCross), "B15: report has no artifact_class");
ok(!("artifact_class" in domains.structural_stability), "B16: structural_stability has no artifact_class");
ok(!("artifact_class" in domains.transition_selectivity), "B17: transition_selectivity has no artifact_class");
ok(!("artifact_class" in domains.cross_run_reproducibility), "B18: cross_run_reproducibility has no artifact_class");

section("C. Single-run / no-cross-run path");
eq(reportNoCross.scope.cross_run_context.available, false, "C1: no cross-run -> scope.cross_run_context.available=false");
eq(reportNoCross.scope.cross_run_context.run_count, 0, "C2: no cross-run -> run_count=0");
eq(domains.cross_run_reproducibility.label, "insufficient_data", "C3: no cross-run -> cross_run_reproducibility=insufficient_data");
ok(
    reportNoCross.insufficiencies.some(i => i.code === "NO_CROSS_RUN_CONTEXT"),
    "C4: insufficiencies include NO_CROSS_RUN_CONTEXT"
);

section("D. Cross-run injection path");
ok(crossRunReport && typeof crossRunReport === "object", "D1: crossRunReport present");
eq(reportWithCross.scope.cross_run_context.available, true, "D2: with cross-run -> scope.cross_run_context.available=true");
eq(reportWithCross.scope.cross_run_context.run_count, 3, "D3: with cross-run -> run_count=3");
eq(
    reportWithCross.evidence_domains.cross_run_reproducibility.label,
    crossRunReport.reproducibility_summary.overall_reproducibility,
    "D4: cross-run domain reflects cross-run overall reproducibility"
);
eq(
    reportWithCross.evidence_domains.cross_run_reproducibility.evidence.available,
    true,
    "D5: cross-run evidence.available=true"
);

section("E. Label sanity");
const readiness = reportWithCross.readiness_summary;
isOneOf(readiness.overall_readiness, ["low", "medium", "high", "insufficient_data"], "E1: overall_readiness allowed");
isOneOf(readiness.confidence_posture, ["cautious", "developing", "supported"], "E2: confidence_posture allowed");
isOneOf(reportWithCross.advisory_posture.posture, ["advisory_insufficient", "advisory_blocked", "advisory_supported", "advisory_developing", "advisory_cautious", "advisory_limited"], "E3: advisory_posture.posture allowed");
isOneOf(reportWithCross.advisory_posture.review_horizon, ["defer", "blocked", "supported", "developing", "cautious", "limited"], "E4: advisory_posture.review_horizon allowed");

for (const [name, domain] of Object.entries(reportWithCross.evidence_domains)) {
    isOneOf(domain.label, ["low", "medium", "high", "insufficient_data"], `E5: ${name}.label allowed`);
}

section("F. Determinism");
const reportWithCross2 = prr.interpret(runA, crossRunReport);
deepEq(reportWithCross, reportWithCross2, "F1: identical inputs -> identical readiness report");

section("G. Boundary integrity");
const json = JSON.stringify(reportWithCross);

notIncludes(json, '"artifact_class":"C1"', "G1: no C1 artifact class");
notIncludes(json, '"canonical"', "G2: no canonical key");
notIncludes(json, '"promoted"', "G3: no promoted key");
notIncludes(json, '"truth"', "G4: no truth key");
notIncludes(json, '"ontology":', "G5: no ontology key");
notIncludes(json, '"promotion_action"', "G6: no promotion action object");
notIncludes(json, '"promote"', "G7: no promote field");
notIncludes(json, '"true basin"', "G8: no true basin claim");
notIncludes(json, '"attractor basin"', "G9: no attractor basin language");
notIncludes(json, '"approval"', "G10: no approval key");

includes(reportWithCross.generated_from, "not canon", "G11: generated_from denies canon");
includes(reportWithCross.generated_from, "not promotion", "G12: generated_from denies promotion");
includes(reportWithCross.generated_from, "not approval", "G13: generated_from denies approval");
includes(reportWithCross.generated_from, "not ontology", "G14: generated_from denies ontology");
ok(reportWithCross.primary_descriptors.length <= 3, "G15: primary descriptor count bounded");
ok(reportWithCross.secondary_descriptors.length <= 2, "G16: secondary descriptor count bounded");
ok(reportWithCross.explicit_non_claims.includes("not_promotion"), "G17: explicit_non_claims deny promotion");
ok(reportWithCross.explicit_non_claims.includes("not_approval"), "G18: explicit_non_claims deny approval");
ok(reportWithCross.explicit_non_claims.includes("not_runtime_substance"), "G19: explicit_non_claims deny runtime substance");

ok(
    reportWithCross.notes.some(n => n.includes("Promotion readiness is an advisory downstream surface only and does not imply approval or promotion.")),
    "G20: notes preserve advisory/non-promotional boundary"
);
ok(
    reportWithCross.notes.some(n => n.includes("Readiness summarizes evidence, blockers, insufficiencies, and review horizon only.")),
    "G21: notes preserve evidence-only boundary"
);
ok(
    reportWithCross.notes.some(n => n.includes("Repeated structure strengthens evidence but does not prove ontology or true dynamical basin membership.")),
    "G22: notes preserve no-ontology/no-true-basin boundary"
);

section("H. Failed input handling");
const fail0 = prr.interpret(null);
eq(fail0.ok, false, "H1: null input -> ok=false");
eq(fail0.error, "INVALID_INPUT", "H2: null input -> INVALID_INPUT");
ok(Array.isArray(fail0.reasons), "H3: null input -> reasons array");

const fail1 = prr.interpret({ ok: false, error: "BAD" });
eq(fail1.ok, false, "H4: failed run -> ok=false");
eq(fail1.error, "INVALID_INPUT", "H5: failed run -> INVALID_INPUT");

const fail2 = prr.interpret({
    ok: true,
    artifacts: {},
    substrate: {},
    summaries: {},
    audit: {},
    interpretation: {},
});
eq(fail2.ok, false, "H6: missing interpretation surfaces -> ok=false");
eq(fail2.error, "INVALID_INPUT", "H7: missing interpretation surfaces -> INVALID_INPUT");
ok(Array.isArray(fail2.reasons), "H8: missing interpretation surfaces -> reasons array");

finish();
