// test_door_one_orchestrator.js
//
// Contract tests for DoorOneOrchestrator — batch and incremental execution paths.
//
// Verifies:
//   - output shape separates artifacts / substrate / summaries / audit correctly
//   - pipeline artifacts carry artifact_class; reports do not
//   - deterministic across repeated runs with identical input
//   - no canon/promotion/prediction fields in output
//   - audit captures failures without crashing the run
//   - incremental (processWindow) and batch (runBatch) produce equivalent results
//   - QueryOp authority wording is Tooling, not Derived
//
// Run from the resonance/ directory:
//   node test_door_one_orchestrator.js

import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { makeTestSignal } from "../fixtures/test_signal.js";
import { QueryOp } from "../operators/query/QueryOp.js";

// ─── Harness ──────────────────────────────────────────────────────────────────

let passed = 0, failed = 0;
const failures = [];

function assert(label, condition, detail = "") {
    if (condition) { console.log(`  ✓ ${label}`); passed++; }
    else {
        const msg = `  ✗ ${label}${detail ? ` — ${detail}` : ""}`;
        console.error(msg); failures.push(msg); failed++;
    }
}
function section(name) { console.log(`\n── ${name} ──`); }

// ─── Shared policies (minimal lawful set) ─────────────────────────────────────

const POLICIES = {
    clock_policy_id: "clock.test.v1",

    ingest_policy: {
        policy_id: "ingest.test.v1",
        gap_threshold_multiplier: 3.0,
        allow_non_monotonic: false,
        allow_empty: false,
        non_monotonic_mode: "reject",
    },

    grid_spec: {
        Fs_target: 8,
        t_ref: 0,
        drift_model: "none",
        non_monotonic_policy: "reject",
        interp_method: "linear",
        gap_policy: "cut",
        anti_alias_filter: false,
    },

    window_spec: {
        mode: "fixed",
        Fs_target: 8,
        base_window_N: 8,
        hop_N: 8,
        window_function: "hann",
        overlap_ratio: 0,
        stationarity_policy: "tolerant",
        salience_policy: "off",
        gap_policy: "cut",
        max_missing_ratio: 0.25,
        boundary_policy: "truncate",
    },

    transform_policy: {
        policy_id: "transform.test.v1",
        transform_type: "dft",
        normalization_mode: "forward_1_over_N",
    },

    compression_policy: {
        policy_id: "compress.test.v1",
        selection_method: "topK",
        budget_K: 3,
        maxK: 3,
        include_dc: true,
        invariance_lens: "energy",
        respect_novelty_boundary: false,
        thresholds: { max_recon_rmse: 999, max_energy_residual: 999, max_band_divergence: 999 },
    },

    anomaly_policy: {
        policy_id: "anomaly.test.v1",
        invariance_mode: "band_profile",
        divergence_metric: "band_l1",
        threshold_value: 0.5,
        frequency_tolerance_hz: 0,
        phase_sensitivity_mode: "off",
        novelty_min_duration: 0,
        segmentation_mode: "strict",
    },

    merge_policy: {
        policy_id: "merge.test.v1",
        adjacency_rule: "time_touching",
        phase_alignment_mode: "clock_delta_rotation",
        weights_mode: "duration",
        novelty_gate: "off",
        merge_mode: "authoritative",
        grid_tolerance: 0,
    },

    post_merge_compression_policy: {
        policy_id: "mergecomp.test.v1",
        selection_method: "topK",
        budget_K: 3,
        invariance_lens: "energy",
        include_dc: true,
        thresholds: { max_recon_rmse: 999, max_energy_residual: 999, max_band_divergence: 999 },
    },

    reconstruct_policy: {
        policy_id: "recon.test.v1",
        output_format: "values",
        fill_missing_bins: "ZERO",
        validate_invariants: false,
        window_compensation: "NONE",
    },

    basin_policy: {
        policy_id: "basin.test.v1",
        similarity_threshold: 0.5,
        min_member_count: 1,
        weight_mode: "duration",
        linkage: "single_link",
    },
};

const QUERY_SPEC = {
    query_id: "q.orch.test",
    kind: "energy_trend",
    mode: "ENERGY",
    scope: { allow_cross_segment: true },
};
const QUERY_POLICY = {
    policy_id: "qp.test.v1",
    scoring: "energy_delta",
    normalization: "none",
    topK: 10,
};

// Build a minimal raw input from makeTestSignal at low Fs
const { signal } = makeTestSignal({
    durationSec: 4,
    fs: 8,
    seed: 7,
    noiseStd: 0.01,
    source_id: "orch.fixture",
    channel: "ch0",
    modality: "voltage",
    units: "arb",
});
const RAW_INPUT = {
    timestamps: signal.timestamps,
    values: signal.values,
    stream_id: signal.stream_id,
    source_id: signal.source_id,
    channel: signal.channel,
    modality: signal.modality,
    meta: signal.meta,
    clock_policy_id: POLICIES.clock_policy_id,
};

// ════════════════════════════════════════════════════════════════════════════
// A. Output shape — artifacts / substrate / summaries / audit separation
// ════════════════════════════════════════════════════════════════════════════

section("A. Output shape");

const orch = new DoorOneOrchestrator({ policies: POLICIES, substrate_id: "orch.test" });
const result = orch.runBatch(RAW_INPUT, { query_spec: QUERY_SPEC, query_policy: QUERY_POLICY });

assert("A1: runBatch returns ok=true", result.ok, JSON.stringify(result.error));

// Top-level shape
assert("A2: result has artifacts section", typeof result.artifacts === "object");
assert("A3: result has substrate section", typeof result.substrate === "object");
assert("A4: result has summaries section", typeof result.summaries === "object");
assert("A5: result has audit section", typeof result.audit === "object");

// Artifacts section — all have artifact_class
const { a1, a2, h1s, m1s, a3, q, anomaly_reports, basin_sets } = result.artifacts;
assert("A6: artifacts.a1 has artifact_class A1", a1?.artifact_class === "A1");
assert("A7: artifacts.a2 has artifact_class A2", a2?.artifact_class === "A2");
assert("A8: artifacts.h1s is array of H1",
    Array.isArray(h1s) && h1s.length > 0 && h1s.every(h => h.artifact_class === "H1"));
assert("A9: artifacts.anomaly_reports are An artifacts",
    Array.isArray(anomaly_reports) && anomaly_reports.every(r => r.artifact_class === "An"));
assert("A10: artifacts.basin_sets are BN artifacts",
    Array.isArray(basin_sets) && basin_sets.every(b => b.artifact_class === "BN"));
assert("A11: artifacts.q has artifact_class Q", q?.artifact_class === "Q");

// Substrate section — plain-data counts + transition report
assert("A12: substrate.state_count is number", typeof result.substrate.state_count === "number");
assert("A13: substrate.basin_count is number", typeof result.substrate.basin_count === "number");
assert("A14: substrate.segment_ids is array", Array.isArray(result.substrate.segment_ids));
assert("A15: substrate.transition_report.report_type = substrate:observational_report",
    result.substrate.transition_report?.report_type === "substrate:observational_report");

// Summaries section — non-artifact plain-data
assert("A16: summaries.substrate.report_type = substrate:operational_summary",
    result.summaries.substrate?.report_type === "substrate:operational_summary");
assert("A17: summaries.trajectory is object", typeof result.summaries.trajectory === "object");
assert("A18: summaries.segtracker is object", typeof result.summaries.segtracker === "object");

// Audit section — arrays
assert("A19: audit.skipped_windows is array", Array.isArray(result.audit.skipped_windows));
assert("A20: audit.merge_failures is array", Array.isArray(result.audit.merge_failures));
assert("A21: audit.consensus_receipts is array", Array.isArray(result.audit.consensus_receipts));

// Interpretation
assert("A22: result has interpretation section",
    result.interpretation && typeof result.interpretation === "object");

assert("A23: result has semantic_overlay section",
    result.semantic_overlay && typeof result.semantic_overlay === "object");

assert("A24: semantic_overlay.trajectory present",
    result.semantic_overlay?.trajectory && typeof result.semantic_overlay.trajectory === "object");

assert("A25: interpretation.trajectory compatibility alias present",
    result.interpretation?.trajectory && typeof result.interpretation.trajectory === "object");

assert("A26: interpretation.attention_memory present",
    result.interpretation?.attention_memory && typeof result.interpretation.attention_memory === "object");

assert("A27: trajectory overlay report_type correct",
    result.semantic_overlay?.trajectory?.report_type === "runtime:trajectory_interpretation_report");

assert("A28: trajectory overlay query_class declared",
    result.semantic_overlay?.trajectory?.query_class === "Q2_continuity");

assert("A29: attention/memory report_type correct",
    result.interpretation?.attention_memory?.report_type === "runtime:attention_memory_report");

// ════════════════════════════════════════════════════════════════════════════
// B. Artifact class discipline — artifacts have artifact_class, reports do not
// ════════════════════════════════════════════════════════════════════════════

section("B. Artifact class discipline");

// Pipeline artifacts carry artifact_class
assert("B1: A1 carries artifact_class", "artifact_class" in a1);
assert("B2: A2 carries artifact_class", "artifact_class" in a2);
assert("B3: each H1 carries artifact_class", h1s.every(h => "artifact_class" in h));
assert("B4: Q carries artifact_class", "artifact_class" in q);

// Non-artifact outputs do NOT carry artifact_class
assert("B5: substrate transition_report has no artifact_class",
    !("artifact_class" in result.substrate.transition_report));
assert("B6: summaries.substrate has no artifact_class",
    !("artifact_class" in result.summaries.substrate));
assert("B7: summaries.trajectory has no artifact_class",
    !("artifact_class" in result.summaries.trajectory));

// Q is Tooling authority (read-side recognition) — confirmed by no top-level query_policy_id
assert("B8: Q has no top-level query_policy_id (policy_id inside receipts.query)",
    !("query_policy_id" in q) &&
    typeof q.receipts?.query?.query_policy_id === "string");

// ════════════════════════════════════════════════════════════════════════════
// C. No canon / prediction / promotion in output
// ════════════════════════════════════════════════════════════════════════════

section("C. No canon/prediction leakage");

const resultStr = JSON.stringify(result);
assert("C1: no 'C1' artifact class in output", !resultStr.includes('"C1"'));
assert("C2: no 'canonical' key in output", !resultStr.includes('"canonical"'));
assert("C3: no 'promoted' key in output", !resultStr.includes('"promoted"'));
assert("C4: no 'prediction' in output", !resultStr.includes('"prediction"'));
assert("C5: consensus_receipts all result=deferred",
    result.audit.consensus_receipts.every(r => r.result === "deferred") ||
    result.audit.consensus_receipts.length === 0);

section("C2. Semantic overlay removability");

const structuralOnly = JSON.parse(JSON.stringify(result));
delete structuralOnly.semantic_overlay;
if (structuralOnly.interpretation) {
    delete structuralOnly.interpretation.trajectory;
}

assert("C6: structural-only copy keeps artifacts", typeof structuralOnly.artifacts === "object");
assert("C7: structural-only copy keeps substrate", typeof structuralOnly.substrate === "object");
assert("C8: structural-only copy keeps summaries", typeof structuralOnly.summaries === "object");
assert("C9: structural-only copy keeps audit", typeof structuralOnly.audit === "object");
assert("C10: structural trajectory summary remains available without overlay",
    typeof structuralOnly.summaries?.trajectory === "object");

// ════════════════════════════════════════════════════════════════════════════
// D. Determinism — batch run twice with identical input → identical shape
// ════════════════════════════════════════════════════════════════════════════

section("D. Determinism");

const orch2 = new DoorOneOrchestrator({ policies: POLICIES, substrate_id: "orch.test.det" });
const result2 = orch2.runBatch(RAW_INPUT, { query_spec: QUERY_SPEC, query_policy: QUERY_POLICY });

assert("D1: both runs ok", result.ok && result2.ok);
assert("D2: same h1s count", result.artifacts.h1s.length === result2.artifacts.h1s.length);
assert("D3: same m1s count", result.artifacts.m1s.length === result2.artifacts.m1s.length);
assert("D4: same segment_ids", JSON.stringify(result.substrate.segment_ids) ===
    JSON.stringify(result2.substrate.segment_ids));
assert("D5: same transition counts",
    result.substrate.transition_report.total_transitions ===
    result2.substrate.transition_report.total_transitions);
assert("D6: same Q result refs",
    JSON.stringify(result.artifacts.q.results.map(r => r.ref)) ===
    JSON.stringify(result2.artifacts.q.results.map(r => r.ref)));
assert("D7: same semantic overlay posture",
    result.semantic_overlay?.trajectory?.primary_posture === result2.semantic_overlay?.trajectory?.primary_posture);

// ════════════════════════════════════════════════════════════════════════════
// E. Incremental path — ingestAndAlign + processWindow + finalise
//    should produce equivalent shape to runBatch
// ════════════════════════════════════════════════════════════════════════════

section("E. Incremental path equivalence");

const orchInc = new DoorOneOrchestrator({ policies: POLICIES, substrate_id: "orch.test.inc" });
const ia = orchInc.ingestAndAlign(RAW_INPUT);
assert("E1: ingestAndAlign ok", ia.ok, JSON.stringify(ia));
assert("E2: a1 returned from ingestAndAlign", ia.a1?.artifact_class === "A1");
assert("E3: a2 returned from ingestAndAlign", ia.a2?.artifact_class === "A2");
assert("E4: currentSegmentId set after ingestAndAlign", typeof orchInc.currentSegmentId === "string");

const win = orchInc.window(ia.a2);
assert("E5: window() ok", win.ok, JSON.stringify(win));
assert("E6: w1s is array", Array.isArray(win.w1s) && win.w1s.length > 0);

let windowsOk = 0, windowsSkipped = 0;
for (const w1 of win.w1s) {
    const pw = orchInc.processWindow(w1);
    if (pw.ok && !pw.skipped) windowsOk++;
    else windowsSkipped++;
}
assert("E7: at least some windows processed ok", windowsOk > 0, `ok=${windowsOk} skipped=${windowsSkipped}`);

const incResult = orchInc.finalise({ query_spec: QUERY_SPEC, query_policy: QUERY_POLICY });
assert("E8: finalise returns ok", incResult.ok, JSON.stringify(incResult.error));
assert("E9: incremental h1s count matches batch",
    incResult.artifacts.h1s.length === result.artifacts.h1s.length,
    `inc=${incResult.artifacts.h1s.length} batch=${result.artifacts.h1s.length}`);
assert("E10: incremental has same output sections (artifacts/substrate/summaries/audit)",
    "artifacts" in incResult && "substrate" in incResult &&
    "summaries" in incResult && "audit" in incResult);

// processWindow before ingestAndAlign returns explicit error
const orchBad = new DoorOneOrchestrator({ policies: POLICIES });
const badPW = orchBad.processWindow({ window_id: "w0", grid: {} });
assert("E11: processWindow before ingestAndAlign returns ok=false with skip_reason",
    !badPW.ok && typeof badPW.skip_reason === "string");

// ════════════════════════════════════════════════════════════════════════════
// F. Audit captures failures, does not crash run
// ════════════════════════════════════════════════════════════════════════════

section("F. Audit integrity");

// skipped_windows array exists regardless of whether any were skipped
assert("F1: audit.skipped_windows is always an array", Array.isArray(result.audit.skipped_windows));
assert("F2: audit.merge_failures is always an array", Array.isArray(result.audit.merge_failures));

// Run with a signal that produces at least one window to check audit path
assert("F3: run completes even if some audit arrays are empty",
    result.ok && result.audit.skipped_windows !== undefined);

// ════════════════════════════════════════════════════════════════════════════
// G. QueryOp sidequest — authority wording is Tooling, not Derived
// ════════════════════════════════════════════════════════════════════════════

section("G. QueryOp authority class sidequest");

// The JSDoc patch changed "Derived" to "Tooling" — verify by reading the source
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const _queryOpPath = fileURLToPath(new URL("../operators/query/QueryOp.js", import.meta.url));
const queryOpSrc = await readFile(_queryOpPath, "utf8");
assert("G1: QueryOp JSDoc says 'Authority class: Tooling'",
    queryOpSrc.includes("Authority class: Tooling"));
assert("G2: QueryOp JSDoc does not say 'Authority class: Derived'",
    !queryOpSrc.includes("Authority class: Derived"));

// Q artifact_class is "Q" (registered in Appendix §A as Tooling)
const qResult = result.artifacts.q;
assert("G3: Q artifact_class = Q", qResult?.artifact_class === "Q");
assert("G4: Q has no top-level query_policy_id", !("query_policy_id" in qResult));
assert("G5: Q.receipts.query.query_policy_id is string",
    typeof qResult?.receipts?.query?.query_policy_id === "string");

// ════════════════════════════════════════════════════════════════════════════
// H. Substrate live access during incremental processing
// ════════════════════════════════════════════════════════════════════════════

section("H. Substrate live access");

assert("H1: orch.substrate returns MemorySubstrate instance",
    orchInc.substrate !== null && typeof orchInc.substrate.commit === "function");
assert("H2: substrate.allStates() count matches h1s + m1s in result",
    orchInc.substrate.allStates().length ===
    incResult.artifacts.h1s.length + incResult.artifacts.m1s.length);
assert("H3: substrate.trajectory.summary().frame_count matches trajectory_frames in result.substrate",
    orchInc.substrate.trajectory.summary().frame_count ===
    incResult.substrate.trajectory_frames);

// ════════════════════════════════════════════════════════════════════════════
// Results
// ════════════════════════════════════════════════════════════════════════════

console.log(`\n${"═".repeat(54)}`);
console.log(`  ${passed} passed   ${failed} failed`);
if (failures.length > 0) {
    console.log("\nFailed:");
    for (const f of failures) console.log(f);
    console.log(`\n  SOME TESTS FAILED ✗`);
    process.exit(1);
} else {
    console.log(`  ALL TESTS PASSED ✓`);
}
