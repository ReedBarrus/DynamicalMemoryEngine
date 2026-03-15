// tests/test_consensus_op.js
//
// Contract tests for operators/consensus/ConsensusOp.js
//
// Scope:
//   - input validation
//   - legitimacy check surface
//   - defer / reject / eligible_for_promotion outcomes
//   - receipt discipline
//   - mutation safety
//   - boundary integrity
//
// Boundary contract:
//   - explicit promotion boundary
//   - review gate only in v0.1
//   - no silent canon emission
//   - no C1 minting
//   - dossier remains unmodified
//
// References:
//   - operators/consensus/ConsensusOp.js
//   - runtime/CanonCandidateDossier.js
//   - runtime/PromotionReadinessReport.js
//   - README_MasterConstitution.md §3 / §5
//   - README_ConstitutionAppendix.md §B / §C

import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { CrossRunDynamicsReport } from "../runtime/CrossRunDynamicsReport.js";
import { PromotionReadinessReport } from "../runtime/PromotionReadinessReport.js";
import { CanonCandidateDossier } from "../runtime/CanonCandidateDossier.js";
import { ConsensusOp } from "../operators/consensus/ConsensusOp.js";
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
    source_id = "cons.probe",
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

function makeQuerySpec(id = "q.cons") {
    return {
        query_id: id,
        kind: "energy_trend",
        mode: "ENERGY",
        scope: { allow_cross_segment: true },
    };
}

function makeQueryPolicy(id = "qp.cons") {
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
            query_spec: querySpec ?? makeQuerySpec(runLabel ? `q.${runLabel}` : "q.cons"),
            query_policy: queryPolicy ?? makeQueryPolicy(runLabel ? `qp.${runLabel}` : "qp.cons"),
        }
    );

    result.run_label = runLabel ?? "run";
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build lawful dossiers
// ─────────────────────────────────────────────────────────────────────────────

const runA = buildRun({
    runLabel: "run_a",
    raw: makeRawFixture({ seed: 7, source_id: "cons.runA" }),
});

const runB = buildRun({
    runLabel: "run_b",
    raw: makeRawFixture({ seed: 7, source_id: "cons.runA" }),
});

const runC = buildRun({
    runLabel: "run_c",
    raw: makeRawFixture({ seed: 19, noiseStd: 0.03, source_id: "cons.runC" }),
    policies: makePolicies({
        anomaly_policy: { threshold_value: 0.08 },
    }),
});

const crd = new CrossRunDynamicsReport();
const crossRunReport = crd.compare([runA, runB, runC]);

const prr = new PromotionReadinessReport();
const readinessWithCross = prr.interpret(runA, crossRunReport);

const ccd = new CanonCandidateDossier();
const strongDossier = ccd.assemble(
    runA,
    crossRunReport,
    readinessWithCross,
    {
        claim_type: "stable_structural_identity",
        claim_label: "candidate structural identity",
    }
);

const weakDossier = ccd.assemble(
    runA,
    null,
    null,
    {
        claim_type: "candidate_structural_regime",
        claim_label: "candidate structural regime",
    }
);

const cons = new ConsensusOp();
const epochContext = clone(BASE_POLICIES.epoch_context);

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

section("A. Output shape");
ok(strongDossier && typeof strongDossier === "object", "A1: strong dossier present");
const strongReview = cons.review(strongDossier, epochContext, { policy_id: "consensus.review.v1" });
ok(strongReview && typeof strongReview === "object", "A2: review() returns object");
eq(strongReview.ok, true, "A3: review ok=true on valid dossier");
isOneOf(strongReview.result, ["defer", "reject", "eligible_for_promotion"], "A4: result label allowed");
ok(strongReview.review_receipt && typeof strongReview.review_receipt === "object", "A5: review_receipt present");
eq(strongReview.review_receipt.operator_id, "ConsensusOp", "A6: operator_id correct");
eq(strongReview.review_receipt.operator_version, "0.1.0", "A7: operator_version correct");
eq(strongReview.review_receipt.policy_id, "consensus.review.v1", "A8: policy_id preserved");
eq(strongReview.review_receipt.dossier_id, strongDossier.candidate_id, "A9: dossier_id preserved");
eq(strongReview.review_receipt.claim_type, strongDossier.candidate_claim.claim_type, "A10: claim_type preserved");
eq(strongReview.review_receipt.epoch_id, epochContext.epoch_id, "A11: epoch_id preserved");
ok(Array.isArray(strongReview.review_receipt.legitimacy_checks), "A12: legitimacy_checks array present");
ok(Array.isArray(strongReview.review_receipt.blockers_considered), "A13: blockers_considered array present");
ok(Array.isArray(strongReview.review_receipt.insufficiencies_considered), "A14: insufficiencies_considered array present");
ok(Array.isArray(strongReview.review_receipt.rationale), "A15: rationale array present");
eq(strongReview.review_receipt.canonical_state_emitted, false, "A16: canonical_state_emitted = false");

section("B. Input validation");
const bad0 = cons.review(null, epochContext);
eq(bad0.ok, false, "B1: null dossier -> ok=false");
eq(bad0.error, "INVALID_DOSSIER", "B2: null dossier -> INVALID_DOSSIER");
ok(Array.isArray(bad0.reasons), "B3: null dossier -> reasons array");

const bad1 = cons.review({ dossier_type: "wrong" }, epochContext);
eq(bad1.ok, false, "B4: wrong dossier_type -> ok=false");
eq(bad1.error, "INVALID_DOSSIER", "B5: wrong dossier_type -> INVALID_DOSSIER");

const bad2 = cons.review(strongDossier, null);
eq(bad2.ok, false, "B6: missing epochContext -> ok=false");
eq(bad2.error, "INVALID_EPOCH_CONTEXT", "B7: missing epochContext -> INVALID_EPOCH_CONTEXT");

const bad3 = cons.review(strongDossier, {});
eq(bad3.ok, false, "B8: epochContext missing epoch_id -> ok=false");
eq(bad3.error, "INVALID_EPOCH_CONTEXT", "B9: epochContext missing epoch_id -> INVALID_EPOCH_CONTEXT");

const inadmissible = clone(strongDossier);
inadmissible.candidate_claim.claim_type = "ontology_truth_claim";
const bad4 = cons.review(inadmissible, epochContext);
eq(bad4.ok, false, "B10: inadmissible claim_type -> ok=false");
eq(bad4.error, "INADMISSIBLE_CLAIM_TYPE", "B11: inadmissible claim_type -> INADMISSIBLE_CLAIM_TYPE");

const badStatus1 = clone(strongDossier);
badStatus1.candidate_claim.trust_status = "trusted_candidate";
const bad5 = cons.review(badStatus1, epochContext);
eq(bad5.ok, false, "B12: trust_status not untrusted_candidate -> ok=false");
eq(bad5.error, "INVALID_DOSSIER_STATUS", "B13: trust_status not untrusted_candidate -> INVALID_DOSSIER_STATUS");

const badStatus2 = clone(strongDossier);
badStatus2.promotion_recommendation.review_status = "reviewed";
const bad6 = cons.review(badStatus2, epochContext);
eq(bad6.ok, false, "B14: review_status not unreviewed -> ok=false");
eq(bad6.error, "INVALID_DOSSIER_STATUS", "B15: review_status not unreviewed -> INVALID_DOSSIER_STATUS");

const bad7 = cons.review(strongDossier, epochContext, "not-an-object");
eq(bad7.ok, false, "B16: non-object policy -> ok=false");
eq(bad7.error, "INVALID_POLICY", "B17: non-object policy -> INVALID_POLICY");

section("C. Legitimacy check surface");
const lc = strongReview.review_receipt.legitimacy_checks;
ok(lc.some(x => x.check === "claim_type_admissible"), "C1: claim_type_admissible check present");
ok(lc.some(x => x.check === "epoch_context_present"), "C2: epoch_context_present check present");
ok(lc.some(x => x.check === "provenance_complete"), "C3: provenance_complete check present");
ok(lc.some(x => x.check === "replayable_support_present"), "C4: replayable_support_present check present");
ok(lc.some(x => x.check === "readiness_not_low"), "C5: readiness_not_low check present");
ok(lc.some(x => x.check === "cross_run_support_for_strong_claims"), "C6: cross_run_support_for_strong_claims check present");

section("D. Outcome semantics — defer");
const weakReview = cons.review(weakDossier, epochContext);
eq(weakReview.ok, true, "D1: weak dossier review ok=true");
eq(weakReview.result, "defer", "D2: weak dossier -> defer");

const noCrossStrong = ccd.assemble(
    runA,
    null,
    null,
    {
        claim_type: "stable_structural_identity",
        claim_label: "strong claim no cross-run",
    }
);
const strongNoCrossReview = cons.review(noCrossStrong, epochContext);
eq(strongNoCrossReview.ok, true, "D3: strong dossier without cross-run review ok=true");
eq(strongNoCrossReview.result, "defer", "D4: strong claim without cross-run -> defer");

section("E. Outcome semantics — reject");
const missingProv = clone(strongDossier);
missingProv.receipts.provenance_complete = false;
const rejectReview = cons.review(missingProv, epochContext);
eq(rejectReview.ok, true, "E1: hard legitimacy failure still returns review result");
eq(rejectReview.result, "reject", "E2: provenance_complete=false -> reject");
ok(
    rejectReview.review_receipt.rationale.some(r => String(r).includes("failed:provenance_complete")),
    "E3: reject rationale includes failed hard check"
);

const withBlockersNoWeak = cons.review(
    weakDossier,
    epochContext,
    { allow_weak_review: false, policy_id: "consensus.no-weak.v1" }
);
eq(withBlockersNoWeak.ok, true, "E4: blockers with allow_weak_review=false still returns review result");
eq(withBlockersNoWeak.result, "defer", "E5: insufficiencies dominate blockers path -> defer");

section("F. Outcome semantics — eligible_for_promotion");
const eligibleDossier = clone(strongDossier);
eligibleDossier.blockers = [];
eligibleDossier.insufficiencies = [];
eligibleDossier.promotion_recommendation.recommendation = "eligible_for_review";
eligibleDossier.evidence_bundle.readiness.readiness_label = "high";
eligibleDossier.scope.cross_run_context.available = true;
eligibleDossier.receipts.provenance_complete = true;
eligibleDossier.receipts.replayable_support_present = true;

const eligibleReview = cons.review(eligibleDossier, epochContext);
eq(eligibleReview.ok, true, "F1: eligible dossier review ok=true");
eq(eligibleReview.result, "eligible_for_promotion", "F2: clean eligible dossier -> eligible_for_promotion");
eq(eligibleReview.review_receipt.canonical_state_emitted, false, "F3: still no C1 emitted in v0.1");

section("G. Determinism");
const strongReview2 = cons.review(strongDossier, epochContext, { policy_id: "consensus.review.v1" });
deepEq(strongReview, strongReview2, "G1: identical inputs -> identical review result");

section("H. Mutation safety");
const beforeStrong = JSON.stringify(strongDossier);
cons.review(strongDossier, epochContext, { policy_id: "consensus.review.v1" });
eq(JSON.stringify(strongDossier), beforeStrong, "H1: review() does not mutate dossier input");

section("I. Boundary integrity");
const json = JSON.stringify(strongReview);
notIncludes(json, '"artifact_class":"C1"', "I1: no C1 artifact class");
notIncludes(json, '"canonical"', "I2: no canonical key");
notIncludes(json, '"promoted"', "I3: no promoted key");
notIncludes(json, '"truth"', "I4: no truth key");
notIncludes(json, '"ontology":', "I5: no ontology key");
notIncludes(json, '"prediction"', "I6: no prediction key");
notIncludes(json, '"canonical_state_emitted":true', "I7: never claims canon emission");
isOneOf(strongReview.result, ["defer", "reject", "eligible_for_promotion"], "I8: bounded review result only");

finish();
