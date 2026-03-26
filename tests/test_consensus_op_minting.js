// tests/test_consensus_op_minting.js
//
// Contract tests for ConsensusOp.mintCanon() — v0.2 C1 minting path.
//
// Scope:
//   - mintCanon() input validation
//   - readiness gate (high strict, medium with policy override, others rejected)
//   - C1 artifact shape and field contracts
//   - C1 immutability (Object.freeze)
//   - Provenance completeness
//   - Promotion evidence completeness
//   - Mutation safety (dossier not mutated)
//   - Determinism (same dossier → stable artifact shape)
//   - Boundary integrity (no deferred-layer leakage)
//   - NOT_ELIGIBLE_FOR_PROMOTION path
//
// Constitutional basis:
//   README_MasterConstitution.md §3 Canon Space, §5 Rule 5, §7 C1 artifact contract
//   README_ConstitutionAppendix.md §A (authority_class: canon), §B C1
//
// References:
//   - operators/consensus/ConsensusOp.js (v0.2)
//   - runtime/CanonCandidateDossier.js
//   - runtime/PromotionReadinessReport.js
//   - runtime/CrossRunDynamicsReport.js
//   - runtime/DoorOneOrchestrator.js

import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { CrossRunDynamicsReport } from "../runtime/CrossRunDynamicsReport.js";
import { PromotionReadinessReport } from "../runtime/PromotionReadinessReport.js";
import { CanonCandidateDossier } from "../runtime/CanonCandidateDossier.js";
import { ConsensusOp } from "../operators/consensus/ConsensusOp.js";
import { makeTestSignal } from "../fixtures/test_signal.js";

// ─────────────────────────────────────────────────────────────────────────────
// Minimal test harness (same pattern as test_consensus_op.js)
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
    ok(Object.is(actual, expected), `${label}${Object.is(actual, expected) ? "" : ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`);
}

function includes(str, sub, label) {
    ok(String(str).includes(sub), label);
}

function notIncludes(str, sub, label) {
    ok(!String(str).includes(sub), label);
}

function isOneOf(value, allowed, label) {
    ok(allowed.includes(value), `${label} (got ${JSON.stringify(value)})`);
}

function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL === 0 ? "  ALL TESTS PASSED ✓" : "  TESTS FAILED ✗");
    if (FAIL > 0) process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared fixture setup (mirrors test_consensus_op.js baseline)
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
    const { signal } = makeTestSignal({ durationSec, fs, seed, noiseStd, source_id, channel, modality, units });
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
    return { query_id: id, kind: "energy_trend", mode: "ENERGY", scope: { allow_cross_segment: true } };
}

function makeQueryPolicy(id = "qp.cons") {
    return { policy_id: id, scoring: "energy_delta", normalization: "none", topK: 5 };
}

function buildRun({ runLabel, raw, policies, querySpec, queryPolicy } = {}) {
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
// Build fixtures
// ─────────────────────────────────────────────────────────────────────────────

const runA = buildRun({ runLabel: "run_a", raw: makeRawFixture({ seed: 7, source_id: "cons.runA" }) });
const runB = buildRun({ runLabel: "run_b", raw: makeRawFixture({ seed: 7, source_id: "cons.runA" }) });
const runC = buildRun({
    runLabel: "run_c",
    raw: makeRawFixture({ seed: 19, noiseStd: 0.03, source_id: "cons.runC" }),
    policies: makePolicies({ anomaly_policy: { threshold_value: 0.08 } }),
});

const crd = new CrossRunDynamicsReport();
const crossRunReport = crd.compare([runA, runB, runC]);

const prr = new PromotionReadinessReport();
const readinessWithCross = prr.interpret(runA, crossRunReport);

const ccd = new CanonCandidateDossier();

// Promotion-eligible dossier (mirrors section F of test_consensus_op.js)
const eligibleDossier = (() => {
    const base = ccd.assemble(runA, crossRunReport, readinessWithCross, {
        claim_type: "stable_structural_identity",
        claim_label: "candidate structural identity",
    });
    const d = clone(base);
    d.blockers = [];
    d.insufficiencies = [];
    d.promotion_recommendation.recommendation = "eligible_for_review";
    d.evidence_bundle.readiness.readiness_label = "high";
    d.scope.cross_run_context.available = true;
    d.receipts.provenance_complete = true;
    d.receipts.replayable_support_present = true;
    return d;
})();

// Medium readiness dossier — eligible but only with override
const mediumDossier = (() => {
    const d = clone(eligibleDossier);
    d.evidence_bundle.readiness.readiness_label = "medium";
    return d;
})();

// Non-eligible dossier (blockers present, review → defer)
const nonEligibleDossier = (() => {
    const base = ccd.assemble(runA, null, null, {
        claim_type: "candidate_structural_regime",
        claim_label: "candidate structural regime",
    });
    return base;
})();

const cons = new ConsensusOp();

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

section("M-A. mintCanon() returns ok=true on eligible high-readiness dossier");
const mintResult = cons.mintCanon(eligibleDossier);
ok(mintResult && typeof mintResult === "object", "M-A1: mintCanon returns an object");
eq(mintResult.ok, true, "M-A2: ok=true on eligible dossier");
ok(mintResult.c1 && typeof mintResult.c1 === "object", "M-A3: c1 artifact present");

section("M-B. C1 artifact class and authority fields");
const c1 = mintResult.c1;
eq(c1.artifact_class, "canon", "M-B1: artifact_class = 'canon'");
eq(c1.authority_class, "canon", "M-B2: authority_class = 'canon'");
ok(typeof c1.artifact_id === "string", "M-B3: artifact_id is a string");
ok(c1.artifact_id.startsWith("c1:"), "M-B4: artifact_id starts with 'c1:'");
ok(typeof c1.stream_id === "string", "M-B5: stream_id is a string");
ok(typeof c1.minted_at_ms === "number" && c1.minted_at_ms > 0, "M-B6: minted_at_ms is a positive number");

section("M-C. canonical_state shape");
ok(c1.canonical_state && typeof c1.canonical_state === "object", "M-C1: canonical_state is an object");
ok(c1.canonical_state.harmonic_summary && typeof c1.canonical_state.harmonic_summary === "object", "M-C2: harmonic_summary present");
ok(typeof c1.canonical_state.recurrence_score === "number", "M-C3: recurrence_score is a number");
ok(typeof c1.canonical_state.structural_stability_score === "number", "M-C4: structural_stability_score is a number");
ok("basin_id" in c1.canonical_state, "M-C5: basin_id key present (may be null)");
ok("segment_id" in c1.canonical_state, "M-C6: segment_id key present (may be null)");

section("M-D. promotion_evidence shape");
ok(c1.promotion_evidence && typeof c1.promotion_evidence === "object", "M-D1: promotion_evidence is an object");
ok(typeof c1.promotion_evidence.dossier_id === "string", "M-D2: dossier_id is a string");
isOneOf(c1.promotion_evidence.readiness_category, ["high", "medium"], "M-D3: readiness_category is high or medium");
ok(Array.isArray(c1.promotion_evidence.readiness_domains_passed), "M-D4: readiness_domains_passed is an array");
ok(Array.isArray(c1.promotion_evidence.blockers_cleared), "M-D5: blockers_cleared is an array");
eq(c1.promotion_evidence.blockers_cleared.length, 0, "M-D6: blockers_cleared is empty at mint time");
ok(typeof c1.promotion_evidence.cross_run_reproducible === "boolean", "M-D7: cross_run_reproducible is a boolean");

section("M-E. provenance shape");
ok(c1.provenance && typeof c1.provenance === "object", "M-E1: provenance is an object");
eq(c1.provenance.operator, "ConsensusOp", "M-E2: provenance.operator = 'ConsensusOp'");
eq(c1.provenance.operator_version, "0.2.0", "M-E3: provenance.operator_version = '0.2.0'");
ok(typeof c1.provenance.policy_id === "string", "M-E4: provenance.policy_id is a string");
ok(typeof c1.provenance.settlement_policy === "string", "M-E5: provenance.settlement_policy is a string");
eq(c1.provenance.settlement_policy, "readiness_threshold_high", "M-E6: high readiness -> readiness_threshold_high settlement");
ok(Array.isArray(c1.provenance.input_refs), "M-E7: provenance.input_refs is an array");
ok(c1.provenance.input_refs.length > 0, "M-E8: provenance.input_refs is non-empty");
eq(c1.provenance.minted_by, "ConsensusOp.mint()", "M-E9: provenance.minted_by correct");
includes(c1.provenance.constitutional_basis, "README_MasterConstitution", "M-E10: constitutional_basis references MasterConstitution");

section("M-F. C1 immutability (Object.freeze)");
const frozenC1 = mintResult.c1;
let mutationAttemptFailed = false;
try {
    frozenC1.artifact_class = "MUTATED";
    // In strict mode this throws; in sloppy mode the assignment is silently ignored
    mutationAttemptFailed = frozenC1.artifact_class !== "MUTATED";
} catch (_) {
    mutationAttemptFailed = true;
}
ok(mutationAttemptFailed || Object.isFrozen(frozenC1), "M-F1: C1 artifact is frozen (mutation rejected)");
ok(Object.isFrozen(frozenC1), "M-F2: Object.isFrozen(c1) === true");

section("M-G. Mutation safety — dossier not mutated by mintCanon");
const dossierSnapshot = JSON.stringify(eligibleDossier);
cons.mintCanon(eligibleDossier);
eq(JSON.stringify(eligibleDossier), dossierSnapshot, "M-G1: mintCanon() does not mutate dossier input");

section("M-H. Medium-readiness gate");
const mediumNoOverride = cons.mintCanon(mediumDossier);
eq(mediumNoOverride.ok, false, "M-H1: medium readiness without override -> ok=false");
eq(mediumNoOverride.error, "READINESS_INSUFFICIENT_FOR_MINT", "M-H2: medium no override -> READINESS_INSUFFICIENT_FOR_MINT");

const mediumWithOverride = cons.mintCanon(mediumDossier, { allow_medium_promotion: true });
eq(mediumWithOverride.ok, true, "M-H3: medium readiness with allow_medium_promotion=true -> ok=true");
ok(mediumWithOverride.c1 && typeof mediumWithOverride.c1 === "object", "M-H4: c1 artifact present on medium promotion");
eq(mediumWithOverride.c1.promotion_evidence.readiness_category, "medium", "M-H5: readiness_category=medium preserved in c1");
eq(mediumWithOverride.c1.provenance.settlement_policy, "readiness_threshold_medium", "M-H6: medium promotion -> readiness_threshold_medium settlement");

section("M-I. NOT_ELIGIBLE_FOR_PROMOTION path");
const notEligible = cons.mintCanon(nonEligibleDossier);
eq(notEligible.ok, false, "M-I1: non-eligible dossier -> ok=false");
eq(notEligible.error, "NOT_ELIGIBLE_FOR_PROMOTION", "M-I2: non-eligible -> NOT_ELIGIBLE_FOR_PROMOTION");
ok(Array.isArray(notEligible.reasons), "M-I3: reasons array present");
ok(notEligible.reasons.length > 0, "M-I4: at least one reason given");

section("M-J. mintCanon() input validation");
const mintNull = cons.mintCanon(null);
eq(mintNull.ok, false, "M-J1: null dossier -> ok=false");
eq(mintNull.error, "INVALID_DOSSIER", "M-J2: null dossier -> INVALID_DOSSIER");

const mintWrongType = cons.mintCanon({ dossier_type: "wrong" });
eq(mintWrongType.ok, false, "M-J3: wrong dossier_type -> ok=false");
eq(mintWrongType.error, "INVALID_DOSSIER", "M-J4: wrong dossier_type -> INVALID_DOSSIER");

const mintBadClaim = clone(eligibleDossier);
mintBadClaim.candidate_claim.claim_type = "ontology_truth_claim";
const mintInadmissible = cons.mintCanon(mintBadClaim);
eq(mintInadmissible.ok, false, "M-J5: inadmissible claim_type -> ok=false");
eq(mintInadmissible.error, "INADMISSIBLE_CLAIM_TYPE", "M-J6: inadmissible claim -> INADMISSIBLE_CLAIM_TYPE");

const mintBadTrust = clone(eligibleDossier);
mintBadTrust.candidate_claim.trust_status = "trusted_candidate";
const mintBadTrustResult = cons.mintCanon(mintBadTrust);
eq(mintBadTrustResult.ok, false, "M-J7: trust_status not untrusted_candidate -> ok=false");
eq(mintBadTrustResult.error, "INVALID_DOSSIER_STATUS", "M-J8: wrong trust_status -> INVALID_DOSSIER_STATUS");

const mintBadReviewStatus = clone(eligibleDossier);
mintBadReviewStatus.promotion_recommendation.review_status = "reviewed";
const mintBadReviewResult = cons.mintCanon(mintBadReviewStatus);
eq(mintBadReviewResult.ok, false, "M-J9: already-reviewed dossier -> ok=false");
eq(mintBadReviewResult.error, "INVALID_DOSSIER_STATUS", "M-J10: already-reviewed -> INVALID_DOSSIER_STATUS");

section("M-K. Boundary integrity — no deferred-layer leakage in C1");
const c1Json = JSON.stringify(c1);
notIncludes(c1Json, '"prediction"', "M-K1: no prediction layer in C1");
notIncludes(c1Json, '"agency"', "M-K2: no agency layer in C1");
notIncludes(c1Json, '"ontology":', "M-K3: no ontology key in C1");
notIncludes(c1Json, '"truth"', "M-K4: no unqualified truth key in C1");
notIncludes(c1Json, '"symbolic"', "M-K5: no symbolic layer in C1");
eq(c1.artifact_class, "canon", "M-K6: artifact_class locked to 'canon'");

section("M-L. review() still returns operator_version 0.2.0");
const epochCtx = clone(BASE_POLICIES.epoch_context);
const reviewResult = cons.review(eligibleDossier, epochCtx);
eq(reviewResult.ok, true, "M-L1: review() still succeeds in v0.2");
eq(reviewResult.review_receipt.operator_version, "0.1.0", "M-L2: review() receipt still reports operator_version 0.1.0 (review gate unchanged from v0.1)");
eq(reviewResult.review_receipt.canonical_state_emitted, false, "M-L3: review() never sets canonical_state_emitted=true");

finish();
