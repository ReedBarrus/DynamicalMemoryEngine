// tests/test_door_one_structural_memory_hud.js
//
// Contract tests for hud/DoorOneStructuralMemoryHud.jsx
//
// Scope:
//   - browser HUD renderability
//   - lawful read-side model projection
//   - deterministic projection from lawful workbench input
//   - boundary integrity (no canon / no truth / no ontology)
//   - mutation safety
//
// Boundary contract:
//   - read-side consumer only
//   - below canon
//   - does not alter runtime/workbench meaning
//   - does not emit C1
//   - does not promote memory
//
// References:
//   - hud/DoorOneStructuralMemoryHud.jsx
//   - runtime/DoorOneWorkbench.js
//   - README_DoorOneRuntimeBoundary.md
//   - README_DoorOneAcceptanceChecklist.md
//   - README_WorkflowContract.md
//   - README_MasterConstitution.md

import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { CrossRunDynamicsReport } from "../runtime/CrossRunDynamicsReport.js";
import { CrossRunSession } from "../runtime/CrossRunSession.js";
import { DoorOneWorkbench } from "../runtime/DoorOneWorkbench.js";
import { workbenchToStructuralHudModel } from "../hud/DoorOneStructuralMemoryHudModel.js";
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
    source_id = "hud.probe",
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

function makeQuerySpec(id = "q.hud") {
    return {
        query_id: id,
        kind: "energy_trend",
        mode: "ENERGY",
        scope: { allow_cross_segment: true },
    };
}

function makeQueryPolicy(id = "qp.hud") {
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
            query_spec: querySpec ?? makeQuerySpec(runLabel ? `q.${runLabel}` : "q.hud"),
            query_policy: queryPolicy ?? makeQueryPolicy(runLabel ? `qp.${runLabel}` : "qp.hud"),
        }
    );

    result.run_label = runLabel ?? "run";
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build lawful runs / cross-run context
// ─────────────────────────────────────────────────────────────────────────────

const runA = buildRun({
    runLabel: "run_a",
    raw: makeRawFixture({ seed: 7, source_id: "hud.runA" }),
});

const runB = buildRun({
    runLabel: "run_b",
    raw: makeRawFixture({ seed: 7, source_id: "hud.runA" }),
});

const runC = buildRun({
    runLabel: "run_c",
    raw: makeRawFixture({ seed: 19, noiseStd: 0.03, source_id: "hud.runC" }),
    policies: makePolicies({
        anomaly_policy: { threshold_value: 0.08 },
    }),
});

const crd = new CrossRunDynamicsReport();
const crossRunReport = crd.compare([runA, runB, runC]);

const session = new CrossRunSession({ session_id: "hud.session", max_runs: 5 });
session.addRun(runA);
session.addRun(runB);
session.addRun(runC);

const workbench = new DoorOneWorkbench();

const wbSingle = workbench.assemble(runA);
const wbCross = workbench.assemble(runA, {
    crossRunReport,
    epochContext: clone(BASE_POLICIES.epoch_context),
    consensusPolicy: { policy_id: "consensus.hud.v1" },
});
const wbSession = workbench.assemble(runA, {
    crossRunSession: session,
    epochContext: clone(BASE_POLICIES.epoch_context),
    consensusPolicy: { policy_id: "consensus.hud.v1" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

section("A. Model projection shape");

const modelSingle = workbenchToStructuralHudModel(wbSingle);
const modelCross = workbenchToStructuralHudModel(wbCross, wbCross?.cross_run?.report ?? null);

ok(modelSingle && typeof modelSingle === "object", "A1: single-run HUD model returns object");
ok(modelCross && typeof modelCross === "object", "A2: cross-run HUD model returns object");

eq(modelSingle.source_mode, "single_run", "A3: single-run source_mode correct");
eq(modelCross.source_mode, "session", "A4: cross-run source_mode correct");

eq(modelSingle.stream_id, wbSingle.scope.stream_id, "A5: stream_id preserved");
ok(typeof modelSingle.stream_badge === "string", "A6: stream_badge present");
ok(modelSingle.run_health && typeof modelSingle.run_health === "object", "A7: run_health section present");
ok(modelSingle.structure && typeof modelSingle.structure === "object", "A8: structure section present");
ok(modelSingle.review && typeof modelSingle.review === "object", "A9: review section present");
ok(Array.isArray(modelSingle.neighborhoods), "A10: neighborhoods array present");
ok(Array.isArray(modelSingle.transitions), "A11: transitions array present");
ok(Array.isArray(modelSingle.segmentTransitions), "A12: segmentTransitions array present");
ok(
    modelSingle.provenance && typeof modelSingle.provenance === "object",
    "A13: provenance section present"
);
ok(
    modelSingle.runtime_evidence && typeof modelSingle.runtime_evidence === "object",
    "A14: runtime_evidence section present"
);
ok(
    modelSingle.audit && typeof modelSingle.audit === "object",
    "A15: audit section present"
);


section("B. Evidence mapping remains observational");

eq(
    modelSingle.run_health.states,
    wbSingle.runtime?.substrate?.state_count ?? 0,
    "B1: state count mapped from substrate"
);
eq(
    modelSingle.run_health.basins,
    wbSingle.runtime?.substrate?.basin_count ?? 0,
    "B2: basin count mapped from substrate"
);
eq(
    modelSingle.run_health.segments,
    wbSingle.runtime?.substrate?.segment_count ?? 0,
    "B3: segment count mapped from substrate"
);
eq(
    modelSingle.structure.convergence,
    wbSingle.interpretation?.trajectory?.trajectory_character?.convergence ?? "unknown",
    "B4: convergence mapped from workbench interpretation"
);
eq(
    modelSingle.structure.motion,
    wbSingle.interpretation?.trajectory?.trajectory_character?.motion ?? "unknown",
    "B5: motion mapped from workbench interpretation"
);
eq(
    modelSingle.review.readiness,
    wbSingle.promotion_readiness?.report?.readiness_summary?.overall_readiness ?? "unknown",
    "B6: readiness mapped from readiness report"
);
eq(
    modelSingle.review.consensus,
    wbSingle.consensus_review?.review?.result ?? "not_reviewed",
    "B7: consensus mapped from bounded review posture"
);
eq(
    modelCross.cross_run?.report_type,
    wbCross.cross_run?.report?.report_type,
    "B8: cross-run report passed through observationally"
);
eq(
    modelSingle.provenance.stream_id,
    wbSingle.scope.stream_id,
    "B9: provenance stream_id mapped from workbench scope"
);
eq(
    modelSingle.audit.skipped_windows,
    wbSingle.runtime?.audit?.skipped_windows?.length ?? 0,
    "B10: audit skipped_windows mapped from runtime audit"
);

section("C. Browser HUD projection surface");

ok(typeof modelSingle.stream_badge === "string", "C1: stream badge projects");
ok(Array.isArray(modelSingle.neighborhoods), "C2: neighborhoods project");
ok(Array.isArray(modelSingle.transitions), "C3: transitions project");
ok(Array.isArray(modelSingle.segmentTransitions), "C4: segment transitions project");
eq(modelSingle.source_mode, "single_run", "C5: single-run projection remains bounded");
eq(modelCross.source_mode, "session", "C6: cross-run projection remains bounded");


section("D. Determinism and mutation safety");

const beforeWorkbench = JSON.stringify(wbCross);
const modelCrossAgain = workbenchToStructuralHudModel(wbCross, wbCross?.cross_run?.report ?? null);

deepEq(modelCrossAgain, modelCross, "D1: repeated model projection is deterministic");
eq(JSON.stringify(wbCross), beforeWorkbench, "D2: projection path does not mutate workbench");

section("E. Boundary integrity");

const modelJson = JSON.stringify(modelCross);
const htmlJson = "";

notIncludes(modelJson, '"artifact_class":"C1"', "E1: HUD model does not mint C1");
notIncludes(modelJson, '"promoted":true', "E2: HUD model does not promote");
notIncludes(modelJson, '"truth"', "E3: HUD model does not define truth");
notIncludes(modelJson, '"ontology"', "E4: HUD model does not define ontology");

section("F. Lawful read-side posture summary");

ok(
    modelCross.review.consensus === "defer" ||
    modelCross.review.consensus === "reject" ||
    modelCross.review.consensus === "eligible_for_promotion" ||
    modelCross.review.consensus === "not_reviewed",
    "F1: consensus remains bounded review posture only"
);

ok(
    Array.isArray(modelCross.neighborhoods) &&
    Array.isArray(modelCross.transitions) &&
    Array.isArray(modelCross.segmentTransitions),
    "F2: browser HUD remains evidence/projective surface only"
);

section("G. Neighborhood identity promotion remains read-side only");

const wbLabelPromotion = clone(wbSingle);
wbLabelPromotion.runtime = wbLabelPromotion.runtime ?? {};
wbLabelPromotion.runtime.substrate = wbLabelPromotion.runtime.substrate ?? {};
wbLabelPromotion.runtime.substrate.transition_report =
    wbLabelPromotion.runtime.substrate.transition_report ?? {};

wbLabelPromotion.runtime.substrate.transition_report.neighborhood_dwell = [
    {
        neighborhood_label: "baseline_01",
        neighborhood_id: "nbhd.synthetic.01",
        dwell_count: 10,
        dwell_duration_sec: 1.25,
        re_entry_count: 1,
    },
    {
        label: "perturb_01",
        neighborhood_id: "nbhd.synthetic.02",
        dwell_count: 7,
        dwell_duration_sec: 0.75,
        re_entry_count: 2,
    },
    {
        neighborhood_id: "nbhd.runtime.03",
        dwell_count: 5,
        dwell_duration_sec: 0.5,
        re_entry_count: 0,
    },
    {
        dwell_count: 3,
        dwell_duration_sec: 0.25,
        re_entry_count: 0,
    },
];

wbLabelPromotion.runtime.substrate.transition_report.current_neighborhood_id = "nbhd.runtime.03";
wbLabelPromotion.runtime.substrate.transition_report.transitions = [
    { from_label: "baseline_01", to_label: "perturb_01", count: 2 },
    { from_neighborhood_id: "nbhd.runtime.03", to: "NBHD-04", count: 1 },
];
wbLabelPromotion.runtime.substrate.transition_report.total_transitions = 3;

const promotedModel = workbenchToStructuralHudModel(wbLabelPromotion);

eq(
    promotedModel.neighborhoods[0]?.id,
    "baseline_01",
    "G1: neighborhood_label outranks neighborhood_id"
);
eq(
    promotedModel.neighborhoods[1]?.id,
    "perturb_01",
    "G2: label outranks neighborhood_id"
);
eq(
    promotedModel.neighborhoods[2]?.id,
    "nbhd.runtime.03",
    "G3: neighborhood_id used when no truer label exists"
);
eq(
    promotedModel.neighborhoods[3]?.id,
    "NBHD-04",
    "G4: synthetic fallback used only when no upstream identity exists"
);
eq(
    promotedModel.neighborhoods[2]?.current,
    true,
    "G5: current neighborhood still matches lawful runtime identity"
);
eq(
    promotedModel.transitions[0]?.from,
    "baseline_01",
    "G6: transition from_label promoted"
);
eq(
    promotedModel.transitions[0]?.to,
    "perturb_01",
    "G7: transition to_label promoted"
);
eq(
    promotedModel.transitions[1]?.from,
    "nbhd.runtime.03",
    "G8: transition falls back to runtime identity when label absent"
);

section("H. basin_id outranks synthetic fallback");

const wbBasinPromotion = clone(wbSingle);
wbBasinPromotion.runtime = wbBasinPromotion.runtime ?? {};
wbBasinPromotion.runtime.substrate = wbBasinPromotion.runtime.substrate ?? {};
wbBasinPromotion.runtime.substrate.transition_report =
    wbBasinPromotion.runtime.substrate.transition_report ?? {};

wbBasinPromotion.runtime.substrate.transition_report.dwell = [
    {
        basin_id: "BN:test:alpha",
        dwell_runs: 2,
        total_frames: 5,
        total_duration_sec: 1.5,
    },
    {
        dwell_runs: 1,
        total_frames: 2,
        total_duration_sec: 0.5,
    },
];

wbBasinPromotion.runtime.substrate.transition_report.current_neighborhood_id =
    "BN:test:alpha";

const basinModel = workbenchToStructuralHudModel(wbBasinPromotion);

eq(
    basinModel.neighborhoods[0]?.id,
    "BN:test:alpha",
    "H1: basin_id used before synthetic fallback"
);
eq(
    basinModel.neighborhoods[1]?.id,
    "NBHD-02",
    "H2: synthetic fallback remains last resort"
);
eq(
    basinModel.neighborhoods[0]?.current,
    true,
    "H3: current neighborhood matches basin_id-backed identity"
);
eq(
    basinModel.neighborhoods[0]?.dwellFrames,
    5,
    "H4: total_frames maps into dwellFrames"
);
eq(
    basinModel.neighborhoods[0]?.dwellSec,
    1.5,
    "H5: total_duration_sec maps into dwellSec"
);
eq(
    basinModel.neighborhoods[0]?.reEntries,
    2,
    "H6: dwell_runs maps into reEntries"
);
eq(
    basinModel.neighborhoods[0]?.evidence?.basin_id,
    "BN:test:alpha",
    "H7: evidence retains raw basin_id"
);

finish();