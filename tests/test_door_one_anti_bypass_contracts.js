// tests/test_door_one_anti_bypass_contracts.js
//
// Anti-bypass contract tests across Door One seams.
//
// Scope:
//   - executive seam rejects arbitrary semantic payloads
//   - executive seam accepts lawful sampler flush output only via ingest boundary
//   - workbench remains integration-only and does not mint canon
//   - HUD remains read-side and does not leak canon authority
//   - consensus remains explicit review boundary only
//
// Boundary contract:
//   - runtime is not canon
//   - query is not truth
//   - substrate is not ontology
//   - workbench is inspection-only
//   - HUD is read-side only
//   - consensus is promotion-only and does not mint C1 in v0.1

import { DoorOneExecutiveLane } from "../runtime/DoorOneExecutiveLane.js";
import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { DoorOneWorkbench } from "../runtime/DoorOneWorkbench.js";
import { DoorOneHUD } from "../hud/DoorOneHUD.js";
import { CrossRunDynamicsReport } from "../runtime/CrossRunDynamicsReport.js";
import { PromotionReadinessReport } from "../runtime/PromotionReadinessReport.js";
import { CanonCandidateDossier } from "../runtime/CanonCandidateDossier.js";
import { ConsensusOp } from "../operators/consensus/ConsensusOp.js";
import { AnalogSamplerOp } from "../operators/sampler/AnalogSamplerOp.js";
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
    ok(
        Object.is(actual, expected),
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${expected}, got ${actual})`}`
    );
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

const QUERY_SPEC = {
    query_id: "q.antibypass.synthetic.v1",
    kind: "energy_trend",
    mode: "ENERGY",
    scope: { allow_cross_segment: true },
};

const QUERY_POLICY = {
    policy_id: "qp.antibypass.synthetic.v1",
    scoring: "energy_delta",
    normalization: "none",
    topK: 5,
};

const EPOCH_CONTEXT = {
    epoch_id: "epoch.synthetic.antibypass.1",
    t_start: 0,
    t_end: 20,
    settlement_policy_id: "settlement.synthetic.v1",
    consensus_window: 10,
};

const CONSENSUS_POLICY = {
    policy_id: "consensus.antibypass.synthetic.v1",
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

function makeRawInput({
    durationSec = 4,
    fs = 8,
    seed = 7,
    noiseStd = 0.01,
    source_id = "antibypass.probe",
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

function buildRun({
    runLabel = "run",
    raw,
    policies,
} = {}) {
    const orch = new DoorOneOrchestrator({
        policies: policies ?? makePolicies(),
        substrate_id: `substrate:${runLabel}`,
    });

    const result = orch.runBatch(
        raw ?? makeRawInput({ source_id: `src.${runLabel}` }),
        {
            query_spec: QUERY_SPEC,
            query_policy: QUERY_POLICY,
        }
    );

    result.run_label = runLabel;
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const lane = new DoorOneExecutiveLane({
    policies: BASE_POLICIES,
    querySpec: QUERY_SPEC,
    queryPolicy: QUERY_POLICY,
    epochContext: EPOCH_CONTEXT,
    consensusPolicy: CONSENSUS_POLICY,
    max_runs: 5,
    session_id: "door-one-antibypass-session",
});

const runA = buildRun({
    runLabel: "run_a",
    raw: makeRawInput({ seed: 7, source_id: "antibypass.runA" }),
});

const runB = buildRun({
    runLabel: "run_b",
    raw: makeRawInput({ seed: 7, source_id: "antibypass.runA" }),
});

const runC = buildRun({
    runLabel: "run_c",
    raw: makeRawInput({ seed: 19, noiseStd: 0.03, source_id: "antibypass.runC" }),
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

const workbenchBuilder = new DoorOneWorkbench();
const workbench = workbenchBuilder.assemble(runA, {
    crossRunReport,
    epochContext: EPOCH_CONTEXT,
    consensusPolicy: CONSENSUS_POLICY,
    candidateOptions: {
        claim_type: "stable_structural_identity",
        claim_label: "candidate structural identity",
    },
});

const hud = new DoorOneHUD();
const cons = new ConsensusOp();

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

section("A. Executive seam rejects arbitrary semantic payloads");

const laneBeforeBad = lane.sessionSummary();
const badPayload = {
    candidate_claim: { claim_type: "stable_structural_identity" },
    truth_status: "definitely_canon_now",
    symbolic_overlay: ["basically_truth"],
};

const badResult = lane.ingest(badPayload, { run_label: "bad_exec" });

eq(badResult.ok, false, "A1: arbitrary semantic payload rejected");
ok(!!badResult.error, "A2: rejection surface contains error");
eq(
    lane.sessionSummary().run_count,
    laneBeforeBad.run_count,
    "A3: rejected payload does not advance session"
);
eq(lane.latestRunResult(), null, "A4: rejected payload does not create latest run");
eq(lane.latestWorkbench(), null, "A5: rejected payload does not create latest workbench");

section("B. Executive seam accepts lawful sampler flush output only via ingest boundary");

const sampler = new AnalogSamplerOp({
    source_id: "sampler.antibypass.v1",
    channel: "ch0",
    modality: "voltage",
    units: "arb",
    Fs_nominal: BASE_POLICIES.grid_spec.Fs_target,
    clock_policy_id: BASE_POLICIES.clock_policy_id,
    ingest_policy_id: BASE_POLICIES.ingest_policy.policy_id,
    gap_threshold_multiplier: BASE_POLICIES.ingest_policy.gap_threshold_multiplier,
    allow_non_monotonic: BASE_POLICIES.ingest_policy.allow_non_monotonic,
    non_monotonic_mode: BASE_POLICIES.ingest_policy.non_monotonic_mode,
});

const samplerSignal = makeRawInput({
    durationSec: 4,
    fs: 8,
    seed: 42,
    noiseStd: 0.02,
    source_id: "sampler.antibypass.signal",
});

const samplerIngest = sampler.ingest({
    values: samplerSignal.values,
    timestamps: samplerSignal.timestamps,
});

eq(samplerIngest.ok, true, "B1: sampler ingest ok");

const flushRes = sampler.flushAll({
    stream_id: samplerSignal.stream_id,
});

eq(flushRes.ok, true, "B2: sampler flush ok");
ok(flushRes.ingest_input && typeof flushRes.ingest_input === "object", "B3: flush exposes ingest_input");

const flushInputBefore = JSON.stringify(flushRes);

const flushRun = lane.ingest(flushRes, {
    run_label: "exec_sampler_run",
});

eq(flushRun.ok, true, "B4: executive accepts lawful sampler flush result");
eq(flushRun.run_result.run_label, "exec_sampler_run", "B5: sampler run label preserved");
eq(JSON.stringify(flushRes), flushInputBefore, "B6: executive does not mutate sampler flush payload");

section("C. Workbench seam remains integration-only");

eq(workbench.workbench_type, "runtime:door_one_workbench", "C1: workbench type correct");
includes(workbench.generated_from, "not canon", "C2: workbench denies canon in generated_from");
ok(workbench.canon_candidate?.dossier, "C3: workbench may include dossier");
ok(workbench.consensus_review?.review, "C4: workbench may include bounded consensus review");

const workbenchJson = JSON.stringify(workbench);
notIncludes(workbenchJson, '"artifact_class":"C1"', "C5: workbench does not mint C1");
notIncludes(workbenchJson, '"CanonicalState"', "C6: workbench does not emit CanonicalState");
notIncludes(workbenchJson, '"promoted":true', "C7: workbench does not mark promoted=true");

section("D. HUD seam remains read-side only");

const hudText = hud.renderWorkbench(workbench);

includes(hudText, "DOOR ONE — WORKBENCH HUD", "D1: HUD renders workbench surface");
includes(hudText, "consensus", "D2: HUD may show bounded review posture");
notIncludes(hudText, "CanonicalState", "D3: HUD does not leak CanonicalState");
notIncludes(hudText, "artifact_class: C1", "D4: HUD does not render C1 artifact");
notIncludes(hudText, "ground truth", "D5: HUD does not claim truth");
notIncludes(hudText, "true attractor basin", "D6: HUD does not use prohibited ontology phrase");

section("E. Consensus seam remains explicit review boundary only");

const dossierBefore = JSON.stringify(strongDossier);

const reviewRes = cons.review(
    strongDossier,
    EPOCH_CONTEXT,
    CONSENSUS_POLICY
);

eq(reviewRes.ok, true, "E1: consensus review succeeds on lawful dossier");
isOneOf(
    reviewRes.result,
    ["defer", "reject", "eligible_for_promotion"],
    "E2: consensus emits bounded review posture only"
);
eq(
    reviewRes.review_receipt.canonical_state_emitted,
    false,
    "E3: consensus review does not emit canonical state"
);
eq(
    JSON.stringify(strongDossier),
    dossierBefore,
    "E4: consensus review does not mutate dossier"
);

section("F. Cross-run and readiness remain evidence, not promotion");

ok(crossRunReport && typeof crossRunReport === "object", "F1: cross-run report returns plain object");
eq(
    crossRunReport.report_type,
    "runtime:cross_run_dynamics_report",
    "F1b: cross-run report_type correct"
);
includes(crossRunReport.generated_from, "not canon", "F2: cross-run report denies canon");
eq(readinessWithCross.report_type, "runtime:promotion_readiness_report", "F3: readiness report type correct");
includes(
    readinessWithCross.generated_from,
    "not canon",
    "F4: readiness report denies canon/promotion"
);

const crossJson = JSON.stringify(crossRunReport);
const readinessJson = JSON.stringify(readinessWithCross);

notIncludes(crossJson, '"artifact_class":"C1"', "F5: cross-run report does not mint C1");
notIncludes(readinessJson, '"artifact_class":"C1"', "F6: readiness report does not mint C1");
notIncludes(readinessJson, '"promoted":true', "F7: readiness does not promote");
notIncludes(crossJson, '"truth"', "F8: cross-run report does not define truth");

section("G. Anti-bypass seam summary");

ok(
    lane.latestWorkbench()?.workbench_type === "runtime:door_one_workbench",
    "G1: latest workbench remains lawful after successful ingest path"
);
ok(
    lane.sessionSummary().run_count >= 1,
    "G2: lawful ingest path advances session"
);
notIncludes(
    JSON.stringify(lane.latestWorkbench()),
    '"artifact_class":"C1"',
    "G3: latest workbench still contains no C1 after executive flow"
);

finish();