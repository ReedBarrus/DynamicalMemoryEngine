// tests/test_canon_candidate_dossier.js
//
// Contract tests for runtime/CanonCandidateDossier.js
//
// Scope:
//   - output shape
//   - candidate claim structure
//   - source refs
//   - evidence bundle
//   - recommendation semantics
//   - determinism
//   - boundary integrity
//   - failed input handling
//
// Boundary contract:
//   - dossier is runtime-side review input only
//   - dossier is not canon
//   - dossier does not promote memory
//   - dossier does not emit C1
//   - dossier does not decide truth or ontology

import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { CrossRunDynamicsReport } from "../runtime/CrossRunDynamicsReport.js";
import { PromotionReadinessReport } from "../runtime/PromotionReadinessReport.js";
import { CanonCandidateDossier } from "../runtime/CanonCandidateDossier.js";
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
    source_id = "ccd.probe",
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

function makeQuerySpec(id = "q.ccd") {
    return {
        query_id: id,
        kind: "energy_trend",
        mode: "ENERGY",
        scope: { allow_cross_segment: true },
    };
}

function makeQueryPolicy(id = "qp.ccd") {
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
            query_spec: querySpec ?? makeQuerySpec(runLabel ? `q.${runLabel}` : "q.ccd"),
            query_policy: queryPolicy ?? makeQueryPolicy(runLabel ? `qp.${runLabel}` : "qp.ccd"),
        }
    );

    result.run_label = runLabel ?? "run";
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build lawful inputs
// ─────────────────────────────────────────────────────────────────────────────

const runA = buildRun({
    runLabel: "run_a",
    raw: makeRawFixture({ seed: 7, source_id: "ccd.runA" }),
});

const runB = buildRun({
    runLabel: "run_b",
    raw: makeRawFixture({ seed: 7, source_id: "ccd.runA" }),
});

const runC = buildRun({
    runLabel: "run_c",
    raw: makeRawFixture({ seed: 19, noiseStd: 0.03, source_id: "ccd.runC" }),
    policies: makePolicies({
        anomaly_policy: { threshold_value: 0.08 },
    }),
});

const crd = new CrossRunDynamicsReport();
const crossRunReport = crd.compare([runA, runB, runC]);

const prr = new PromotionReadinessReport();
const readinessNoCross = prr.interpret(runA);
const readinessWithCross = prr.interpret(runA, crossRunReport);

const ccd = new CanonCandidateDossier();
const dossierNoCross = ccd.assemble(runA);
const dossierWithCross = ccd.assemble(runA, crossRunReport, readinessWithCross);

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

section("A. Output shape");
ok(runA?.ok === true, "A1: runA ok");
ok(dossierNoCross && typeof dossierNoCross === "object", "A2: assemble() returns plain object");
eq(dossierNoCross.dossier_type, "runtime:canon_candidate_dossier", "A3: dossier_type correct");
includes(dossierNoCross.generated_from, "not canon", "A4: generated_from denies canon");
includes(dossierNoCross.generated_from, "not promotion", "A5: generated_from denies promotion");
ok(dossierNoCross.scope && typeof dossierNoCross.scope === "object", "A6: scope present");
ok(dossierNoCross.candidate_claim && typeof dossierNoCross.candidate_claim === "object", "A7: candidate_claim present");
ok(dossierNoCross.source_refs && typeof dossierNoCross.source_refs === "object", "A8: source_refs present");
ok(dossierNoCross.evidence_bundle && typeof dossierNoCross.evidence_bundle === "object", "A9: evidence_bundle present");
ok(Array.isArray(dossierNoCross.blockers), "A10: blockers array present");
ok(Array.isArray(dossierNoCross.insufficiencies), "A11: insufficiencies array present");
ok(dossierNoCross.promotion_recommendation && typeof dossierNoCross.promotion_recommendation === "object", "A12: promotion_recommendation present");
ok(dossierNoCross.receipts && typeof dossierNoCross.receipts === "object", "A13: receipts present");
ok(Array.isArray(dossierNoCross.notes), "A14: notes array present");
ok(typeof dossierNoCross.candidate_id === "string" && dossierNoCross.candidate_id.startsWith("ccd:"), "A15: candidate_id present and prefixed");
ok(typeof dossierNoCross.generated_at === "string", "A16: generated_at string present");

section("B. Candidate claim structure");
eq(dossierNoCross.candidate_claim.intended_canon_target, "C1", "B1: intended_canon_target = C1");
eq(dossierNoCross.candidate_claim.trust_status, "untrusted_candidate", "B2: trust_status = untrusted_candidate");
ok(typeof dossierNoCross.candidate_claim.claim_type === "string", "B3: claim_type present");
ok(typeof dossierNoCross.candidate_claim.claim_label === "string", "B4: claim_label present");
ok(typeof dossierNoCross.candidate_claim.claim_summary === "string", "B5: claim_summary present");

const dossierCustomClaim = ccd.assemble(runA, crossRunReport, readinessWithCross, {
    claim_type: "stable_structural_identity",
    claim_label: "candidate structural identity",
    claim_summary: "custom summary",
});
eq(dossierCustomClaim.candidate_claim.claim_type, "stable_structural_identity", "B6: custom claim_type applied");
eq(dossierCustomClaim.candidate_claim.claim_label, "candidate structural identity", "B7: custom claim_label applied");
eq(dossierCustomClaim.candidate_claim.claim_summary, "custom summary", "B8: custom claim_summary applied");

section("C. Source refs");
ok(dossierWithCross.source_refs.artifact_refs && typeof dossierWithCross.source_refs.artifact_refs === "object", "C1: artifact_refs present");
ok(dossierWithCross.source_refs.report_refs && typeof dossierWithCross.source_refs.report_refs === "object", "C2: report_refs present");

eq(dossierWithCross.source_refs.artifact_refs.a1_ref, runA.artifacts?.a1?.stream_id ?? null, "C3: a1_ref sourced from run A1");
ok(Array.isArray(dossierWithCross.source_refs.artifact_refs.h1_refs), "C4: h1_refs array present");
ok(Array.isArray(dossierWithCross.source_refs.artifact_refs.m1_refs), "C5: m1_refs array present");
ok(Array.isArray(dossierWithCross.source_refs.artifact_refs.anomaly_refs), "C6: anomaly_refs array present");
ok(Array.isArray(dossierWithCross.source_refs.artifact_refs.basin_set_refs), "C7: basin_set_refs array present");

eq(
    dossierWithCross.source_refs.report_refs.trajectory_report_type,
    runA.interpretation?.trajectory?.report_type ?? null,
    "C8: trajectory_report_type matches run interpretation"
);
eq(
    dossierWithCross.source_refs.report_refs.attention_memory_report_type,
    runA.interpretation?.attention_memory?.report_type ?? null,
    "C9: attention_memory_report_type matches run interpretation"
);
eq(
    dossierWithCross.source_refs.report_refs.cross_run_report_type,
    crossRunReport.report_type,
    "C10: cross_run_report_type matches supplied cross-run report"
);
eq(
    dossierWithCross.source_refs.report_refs.promotion_readiness_report_type,
    readinessWithCross.report_type,
    "C11: promotion_readiness_report_type matches supplied readiness report"
);

section("D. Evidence bundle");
ok(dossierWithCross.evidence_bundle.trajectory && typeof dossierWithCross.evidence_bundle.trajectory === "object", "D1: trajectory bundle present");
ok(dossierWithCross.evidence_bundle.attention_memory && typeof dossierWithCross.evidence_bundle.attention_memory === "object", "D2: attention_memory bundle present");
ok(dossierWithCross.evidence_bundle.cross_run && typeof dossierWithCross.evidence_bundle.cross_run === "object", "D3: cross_run bundle present");
ok(dossierWithCross.evidence_bundle.readiness && typeof dossierWithCross.evidence_bundle.readiness === "object", "D4: readiness bundle present");

ok("convergence" in dossierWithCross.evidence_bundle.trajectory, "D5: trajectory.convergence present");
ok("attention_concentration" in dossierWithCross.evidence_bundle.attention_memory, "D6: attention_memory.attention_concentration present");
ok("reproducibility" in dossierWithCross.evidence_bundle.cross_run, "D7: cross_run.reproducibility present");
ok("readiness_label" in dossierWithCross.evidence_bundle.readiness, "D8: readiness.readiness_label present");

ok(Array.isArray(dossierWithCross.evidence_bundle.cross_run.supporting_runs), "D9: cross_run.supporting_runs array present");
ok(Array.isArray(dossierWithCross.evidence_bundle.cross_run.diverging_runs), "D10: cross_run.diverging_runs array present");
ok(dossierWithCross.evidence_bundle.readiness.evidence_domains && typeof dossierWithCross.evidence_bundle.readiness.evidence_domains === "object", "D11: readiness.evidence_domains present");
ok("transition_selectivity" in dossierWithCross.evidence_bundle.readiness.evidence_domains, "D12: readiness.evidence_domains.transition_selectivity present");

section("E. Recommendation semantics");
eq(dossierNoCross.promotion_recommendation.review_status, "unreviewed", "E1: review_status = unreviewed");
isOneOf(
    dossierNoCross.promotion_recommendation.recommendation,
    ["defer_review", "weak_review", "eligible_for_review"],
    "E2: recommendation label allowed"
);
ok(Array.isArray(dossierNoCross.promotion_recommendation.rationale), "E3: rationale array present");
ok(Array.isArray(dossierNoCross.promotion_recommendation.minimum_next_evidence), "E4: minimum_next_evidence array present");

section("F. Cross-run / no-cross-run behavior");
eq(dossierNoCross.scope.cross_run_context.available, false, "F1: no cross-run -> scope.cross_run_context.available=false");
eq(dossierNoCross.scope.cross_run_context.run_count, 0, "F2: no cross-run -> run_count=0");
eq(dossierWithCross.scope.cross_run_context.available, true, "F3: with cross-run -> scope.cross_run_context.available=true");
eq(dossierWithCross.scope.cross_run_context.run_count, 3, "F4: with cross-run -> run_count=3");
eq(
    dossierWithCross.evidence_bundle.cross_run.reproducibility,
    crossRunReport.reproducibility_summary.overall_reproducibility,
    "F5: cross-run reproducibility copied through"
);

section("G. Receipts");
eq(dossierWithCross.receipts.cross_run_required_for_claim, true, "G1: receipts.cross_run_required_for_claim = true");
ok(typeof dossierWithCross.receipts.provenance_complete === "boolean", "G2: receipts.provenance_complete boolean");
ok(typeof dossierWithCross.receipts.replayable_support_present === "boolean", "G3: receipts.replayable_support_present boolean");
ok(Array.isArray(dossierWithCross.receipts.legitimacy_notes), "G4: receipts.legitimacy_notes array present");

section("H. Determinism");
const dossierWithCross2 = ccd.assemble(runA, crossRunReport, readinessWithCross);
deepEq(dossierWithCross, dossierWithCross2, "H1: identical inputs -> identical dossier");

section("I. Boundary integrity");
const json = JSON.stringify(dossierWithCross);

notIncludes(json, '"artifact_class":"C1"', "I1: no C1 artifact class");
notIncludes(json, '"canonical"', "I2: no canonical key");
notIncludes(json, '"promoted"', "I3: no promoted key");
notIncludes(json, '"truth"', "I4: no truth key");
notIncludes(json, '"ontology":', "I5: no ontology key");
notIncludes(json, '"promotion_action"', "I6: no promotion action object");
notIncludes(json, '"promote"', "I7: no promote field");
notIncludes(json, '"review_status":"reviewed"', "I8: never pretends review already occurred");

includes(dossierWithCross.generated_from, "not canon", "I9: generated_from denies canon");
includes(dossierWithCross.generated_from, "not promotion", "I10: generated_from denies promotion");
includes(dossierWithCross.generated_from, "not ontology", "I11: generated_from denies ontology");

ok(
    dossierWithCross.notes.some(n => n.includes("This dossier is not canon.")),
    "I12: notes preserve not-canon boundary"
);
ok(
    dossierWithCross.notes.some(n => n.includes("This dossier does not promote memory.")),
    "I13: notes preserve no-promotion boundary"
);
ok(
    dossierWithCross.notes.some(n => n.includes("ConsensusOp or later canon review must make the promotion decision explicitly.")),
    "I14: notes preserve explicit-review boundary"
);

section("J. Failed input handling");
const fail0 = ccd.assemble(null);
eq(fail0.ok, false, "J1: null input -> ok=false");
eq(fail0.error, "INVALID_INPUT", "J2: null input -> INVALID_INPUT");
ok(Array.isArray(fail0.reasons), "J3: null input -> reasons array");

const fail1 = ccd.assemble({ ok: false, error: "BAD" });
eq(fail1.ok, false, "J4: failed run -> ok=false");
eq(fail1.error, "INVALID_INPUT", "J5: failed run -> INVALID_INPUT");

const fail2 = ccd.assemble({
    ok: true,
    artifacts: {},
    substrate: {},
    summaries: {},
    audit: {},
    interpretation: {},
});
eq(fail2.ok, false, "J6: missing interpretation surfaces -> ok=false");
eq(fail2.error, "INVALID_INPUT", "J7: missing interpretation surfaces -> INVALID_INPUT");
ok(Array.isArray(fail2.reasons), "J8: missing interpretation surfaces -> reasons array");

const fail3 = ccd.assemble(runA, crossRunReport, { ok: false, error: "INVALID_READINESS" });
eq(fail3.ok, false, "J9: invalid readiness report -> ok=false");
eq(fail3.error, "INVALID_READINESS", "J10: invalid readiness report -> INVALID_READINESS");
ok(Array.isArray(fail3.reasons), "J11: invalid readiness report -> reasons array");

finish();