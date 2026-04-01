// tests/door_two/test_provenance_reconstruction_pipeline.js
//
// Contract tests for runtime/reconstruction/ProvenanceReconstructionPipeline.js
//
// Verifies all 11 required conditions from the task spec, plus:
//   - output shape completeness
//   - trace step taxonomy correctness
//   - threshold posture accuracy
//   - fractal-local principle compliance

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

import {
    reconstructFromReplayRequest,
} from "../../runtime/reconstruction/ProvenanceReconstructionPipeline.js";

let PASS = 0, FAIL = 0;
function section(t) { console.log(`\n── ${t} ──`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ✓ ${label}`); }
    else       { FAIL++; console.error(`  ✗ ${label}`); }
}
function eq(a, b, label) {
    ok(Object.is(a,b), `${label}${Object.is(a,b)?"":" (expected "+JSON.stringify(b)+", got "+JSON.stringify(a)+")"}`);
}
function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL===0?"  ALL TESTS PASSED ✓":"  TESTS FAILED ✗");
    if(FAIL>0) process.exit(1);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MOCK_DECLARED_LENS = {
    transform_family: "FFT/Hann",
    window_N:         256,
    hop_N:            128,
    Fs_target:        256,
    scale_posture:    "medium",
    note:             "active shell policies · medium FFT/Hann",
};
const MOCK_TIER = {
    tier_used:      0,
    tier_label:     "Tier 0 — live working state",
    honest_posture: "Tier 0 only · not receipt-backed · session-scoped",
};
const MOCK_RT_REQUEST = {
    replay_request_id:  "RPLY-RT-test-001",
    replay_type:        "runtime_reconstruction",
    request_status:     "prepared",
    replay_target_type: "current_run_workbench",
    replay_target_ref:  "shell.run.test.001",
    source_family:      "Synthetic Signal",
    run_label:          "shell.run.test.001",
    stream_id:          "stream.test.001",
    source_id:          "synthetic.test",
    declared_lens:      MOCK_DECLARED_LENS,
    retained_tier_used: MOCK_TIER,
    support_basis:      ["harmonic_state_evidence", "cross_run_evidence"],
    explicit_non_claims:["not canon","not truth","not raw restoration"],
    derived_vs_durable: "derived · Tier 0",
    notes:              "test reconstruction",
};
const MOCK_RQ_REQUEST = {
    replay_request_id:  "RPLY-RQ-test-002",
    replay_type:        "request_support_replay",
    request_status:     "prepared",
    replay_target_type: "prepared_request",
    replay_target_ref:  "CREQ-test-001",
    target_request_type: "consultation",
    source_family:      "Synthetic Signal",
    run_label:          "shell.run.test.001",
    stream_id:          "stream.test.001",
    source_id:          "synthetic.test",
    declared_lens:      MOCK_DECLARED_LENS,
    retained_tier_used: MOCK_TIER,
    support_basis:      ["harmonic_state_evidence"],
    explicit_non_claims:["not canon","not truth","not fulfillment"],
    derived_vs_durable: "derived · Tier 0",
    request_not_fulfilled: true,
};
const MOCK_RUN = {
    ok:    true,
    run_label: "shell.run.test.001",
    artifacts: {
        a1:    { artifact_class: "A1", stream_id: "stream.test.001" },
        h1s:   [{ artifact_class: "H1" }, { artifact_class: "H1" }, { artifact_class: "H1" }],
        m1s:   [{ artifact_class: "M1" }],
        a3:    { artifact_class: "A3" },
        q:     { artifact_class: "Q" },
        anomaly_reports: [{ artifact_class: "An", anomaly_type: "frequency_shift" }],
        basin_sets: [],
    },
    anomalies: [{ time_start: 3.0, anomaly_type: "frequency_shift" }],
};
const MOCK_WB = {
    scope: { stream_id: "stream.test.001", segment_ids: ["s0","s1","s2"] },
    runtime: { substrate: { state_count: 3 } },
    promotion_readiness: { report: { readiness_summary: { overall_readiness: "insufficient" } } },
    canon_candidate:     { dossier: { candidate_claim: { claim_type: "bounded_structural_claim" } } },
    consensus_review:    { review: { result: "defer" } },
    interpretation:      { trajectory: {} },
};

const CANON_STATUSES = new Set(["proposed","promoted","contested","narrowed","suspended","superseded","revoked","deferred"]);

// ─── A. Source file posture ───────────────────────────────────────────────────
section("A. Pipeline source constitutional posture");
{
    let src = null;
    try { src = await readFile(path.join(ROOT, "runtime/reconstruction/ProvenanceReconstructionPipeline.js"), "utf8"); } catch(_){}
    ok(src !== null, "A1: ProvenanceReconstructionPipeline.js exists");
    if (src) {
        ok(src.includes("support-trace reconstruction"),           "A2: support-trace class declared");
        ok(src.includes("not raw restoration"),                    "A3: not-raw-restoration declared");
        ok(src.includes("not truth"),                              "A4: not-truth declared");
        ok(src.includes("not canon"),                              "A5: not-canon declared");
        ok(!src.includes("from \"../../hud/"),                    "A6: no hud/ imports (seam rule)");
        ok(!src.match(/new DoorOneOrchestrator|import.*DoorOneOrchestrator/), "A7: no orchestrator instantiation or import (comment mention ok)");
        ok(!src.match(/new ConsensusOp|import.*ConsensusOp/),       "A8: no ConsensusOp instantiation or import (comment mention ok)");
        ok(!src.includes("mintCanon"),                             "A9: no mintCanon");
        ok(src.includes("fractal-local") || src.includes("fractal_local") || src.includes("Fractal-local"), "A10: fractal-local principle referenced (any case)");
    }
}

// ─── B. Valid runtime_reconstruction replay ───────────────────────────────────
section("B. Valid runtime_reconstruction replay");
{
    const r = reconstructFromReplayRequest({
        replayRequest: MOCK_RT_REQUEST,
        runResult:     MOCK_RUN,
        workbench:     MOCK_WB,
    });

    eq(r.ok, true,                                     "B1: ok = true");
    eq(r.reconstruction_type, "support_trace",         "B2: reconstruction_type = support_trace");
    eq(r.reconstruction_status, "completed",           "B3: reconstruction_status = completed");
    eq(r.replay_request_id, MOCK_RT_REQUEST.replay_request_id, "B4: replay_request_id preserved");

    // Target
    ok(r.target !== null && typeof r.target === "object", "B5: target present");
    eq(r.target.type, "current_run_workbench",         "B6: target.type correct");

    // Trace
    ok(Array.isArray(r.reconstruction_trace) && r.reconstruction_trace.length >= 8, "B7: trace non-empty (≥8 steps)");

    // Required step types present
    const stepTypes = r.reconstruction_trace.map(s => s.step_type);
    ok(stepTypes.includes("replay_request_received"),     "B8: replay_request_received step present");
    ok(stepTypes.includes("target_resolved"),             "B9: target_resolved step present");
    ok(stepTypes.includes("lens_declared"),               "B10: lens_declared step present");
    ok(stepTypes.includes("retained_tier_declared"),      "B11: retained_tier_declared step present");
    ok(stepTypes.includes("lineage_bound"),               "B12: lineage_bound step present");
    ok(stepTypes.includes("runtime_support_collected"),   "B13: runtime_support_collected step present");
    ok(stepTypes.includes("scale_latency_declared"),      "B14: scale_latency_declared step present");
    ok(stepTypes.includes("reconstruction_completed"),    "B15: reconstruction_completed step present");

    // No failure
    eq(r.failure_reason, null,                         "B16: failure_reason = null");
}

// ─── C. Valid request_support_replay ─────────────────────────────────────────
section("C. Valid request_support_replay");
{
    const r = reconstructFromReplayRequest({
        replayRequest: MOCK_RQ_REQUEST,
        runResult:     MOCK_RUN,
        workbench:     MOCK_WB,
    });

    eq(r.ok, true,                                     "C1: ok = true");
    eq(r.reconstruction_type, "support_trace",         "C2: reconstruction_type = support_trace");

    // Request context step present
    const stepTypes = r.reconstruction_trace.map(s => s.step_type);
    ok(stepTypes.includes("request_context_bound"),    "C3: request_context_bound step present");

    // Target is prepared_request
    eq(r.target?.type, "prepared_request",             "C4: target.type = prepared_request");
    eq(r.target?.ref, "CREQ-test-001",                 "C5: target.ref = CREQ-test-001");
}

// ─── D. Missing replayRequest fails explicitly ────────────────────────────────
section("D. Failure posture — missing replayRequest");
{
    const r1 = reconstructFromReplayRequest({ replayRequest: null });
    eq(r1.ok, false,                                   "D1: null replayRequest → ok = false");
    ok(typeof r1.failure_reason === "string",           "D2: failure_reason present");
    ok(Array.isArray(r1.reconstruction_trace),          "D3: trace still an array on failure");
    ok(r1.reconstruction_trace.some(s => s.step_type === "reconstruction_failed"),
                                                        "D4: reconstruction_failed step in trace");

    const r2 = reconstructFromReplayRequest({});
    eq(r2.ok, false,                                   "D5: empty args → ok = false");

    const r3 = reconstructFromReplayRequest({ replayRequest: { request_status: "failed", replay_request_id: "x", failure_reason: "test fail" } });
    eq(r3.ok, false,                                   "D6: pre-failed request → ok = false");
    ok(r3.failure_reason?.includes("failed"),           "D7: pre-failed reason propagated");
}

// ─── E. Missing run/workbench context ─────────────────────────────────────────
section("E. Failure — runtime_reconstruction without runResult");
{
    const r = reconstructFromReplayRequest({
        replayRequest: MOCK_RT_REQUEST,
        runResult:     null,
        workbench:     null,
    });
    eq(r.ok, false,                                    "E1: runtime_reconstruction without runResult → ok = false");
    ok(typeof r.failure_reason === "string" && r.failure_reason.length > 0, "E2: explicit failure reason");
    ok(!r.reconstruction_trace.some(s => s.step_type === "reconstruction_completed"),
                                                        "E3: no reconstruction_completed step on failure");
}

// ─── F. Retained tier preserved ───────────────────────────────────────────────
section("F. Retained tier preserved in output");
{
    const r = reconstructFromReplayRequest({
        replayRequest: MOCK_RT_REQUEST,
        runResult:     MOCK_RUN,
        workbench:     MOCK_WB,
    });
    ok(r.retained_tier_used !== null,                  "F1: retained_tier_used present in output");
    eq(r.retained_tier_used?.tier_used, 0,             "F2: tier_used = 0 (Tier 0)");
    ok(r.retained_tier_used?.tier_label?.includes("Tier 0"), "F3: tier_label mentions Tier 0");

    // Tier is visible in trace steps
    const tierStep = r.reconstruction_trace.find(s => s.step_type === "retained_tier_declared");
    ok(tierStep?.detail?.includes("Tier 0"),           "F4: Tier 0 in retained_tier_declared step detail");
}

// ─── G. No operator rerun ─────────────────────────────────────────────────────
section("G. No operator rerun");
{
    let src = null;
    try { src = await readFile(path.join(ROOT, "runtime/reconstruction/ProvenanceReconstructionPipeline.js"), "utf8"); } catch(_){}
    if (src) {
        ok(!src.includes("new DoorOneOrchestrator"),   "G1: no DoorOneOrchestrator instantiation");
        ok(!src.includes("runBatch"),                  "G2: no runBatch call");
        ok(!src.includes("IngestOp"),                  "G3: no IngestOp");
        ok(!src.includes("ClockAlignOp"),              "G4: no ClockAlignOp");
        ok(!src.includes("WindowOp"),                  "G5: no WindowOp");
        ok(!src.includes("TransformOp"),               "G6: no TransformOp");
        ok(!src.includes("CompressOp"),                "G7: no CompressOp");
        ok(!src.includes("ReconstructOp"),             "G8: no ReconstructOp (operator reversal)");
    }
}

// ─── H. No canon/promotion fields ────────────────────────────────────────────
section("H. No canon or promotion fields introduced");
{
    const r = reconstructFromReplayRequest({
        replayRequest: MOCK_RT_REQUEST,
        runResult:     MOCK_RUN,
        workbench:     MOCK_WB,
    });

    ok(!("canonical_id"     in r),                     "H1: no canonical_id in output");
    ok(!("canonical_status" in r),                     "H2: no canonical_status in output");
    ok(!("promoted_claim"   in r),                     "H3: no promoted_claim in output");
    ok(!("runtime_handoff_enabled" in r),              "H4: no runtime_handoff_enabled in output");
    ok(!CANON_STATUSES.has(r.reconstruction_status),   "H5: reconstruction_status not a canon status");

    // No canon status in trace steps
    ok(r.reconstruction_trace.every(s => !CANON_STATUSES.has(s.status)),
                                                        "H6: no canon statuses in trace step statuses");
}

// ─── I. Explicit non-claims preserved ────────────────────────────────────────
section("I. Explicit non-claims preserved and augmented");
{
    const r = reconstructFromReplayRequest({
        replayRequest: MOCK_RT_REQUEST,
        runResult:     MOCK_RUN,
        workbench:     MOCK_WB,
    });

    ok(Array.isArray(r.explicit_non_claims) && r.explicit_non_claims.length >= 5,
                                                        "I1: explicit_non_claims non-trivial");
    ok(r.explicit_non_claims.includes("not canon"),    "I2: 'not canon' in non-claims");
    ok(r.explicit_non_claims.includes("not truth"),    "I3: 'not truth' in non-claims");
    ok(r.explicit_non_claims.includes("not raw restoration"), "I4: 'not raw restoration' in non-claims");
    ok(r.explicit_non_claims.includes("not operator reversal"), "I5: 'not operator reversal' in non-claims");
    ok(r.explicit_non_claims.includes("not source-adjacent reconstitution"), "I6: 'not source-adjacent reconstitution'");
}

// ─── J. Reconstruction summary matches trace evidence counts ──────────────────
section("J. Reconstruction summary consistency");
{
    const r = reconstructFromReplayRequest({
        replayRequest: MOCK_RT_REQUEST,
        runResult:     MOCK_RUN,
        workbench:     MOCK_WB,
    });

    eq(r.reconstruction_summary.step_count, r.reconstruction_trace.length,
                                                        "J1: step_count matches trace length");
    ok(r.reconstruction_summary.evidence_refs > 0,     "J2: evidence_refs > 0 when support available");
    ok(r.reconstruction_summary.support_basis_count > 0, "J3: support_basis_count > 0");
    eq(r.reconstruction_summary.reconstruction_class, "support_trace", "J4: class = support_trace");
    ok(typeof r.reconstruction_summary.tier_used === "number", "J5: tier_used in summary");
    ok(r.reconstruction_summary.non_authority_note?.includes("not canon"), "J6: non_authority_note in summary");
}

// ─── K. Threshold posture emitted ────────────────────────────────────────────
section("K. Threshold posture emitted (5 tests)");
{
    const r = reconstructFromReplayRequest({
        replayRequest: MOCK_RT_REQUEST,
        runResult:     MOCK_RUN,
        workbench:     MOCK_WB,
    });

    ok(r.threshold_posture !== null && typeof r.threshold_posture === "object",
                                                        "K1: threshold_posture is object");
    ok(["pass","fail","unknown"].includes(r.threshold_posture.local_invariance),
                                                        "K2: local_invariance is valid value");
    ok(["pass","fail","unknown"].includes(r.threshold_posture.compression_survival),
                                                        "K3: compression_survival is valid value");
    ok(["pass","warning","fail"].includes(r.threshold_posture.distortion_posture),
                                                        "K4: distortion_posture is valid value");
    ok(["pass","fail"].includes(r.threshold_posture.retained_tier_sufficiency),
                                                        "K5: retained_tier_sufficiency is valid value");
    eq(r.threshold_posture.query_equivalence, "not_applicable",
                                                        "K6: query_equivalence = not_applicable in v0");

    // With valid Tier 0 + run result, local invariance should pass
    eq(r.threshold_posture.local_invariance, "pass",   "K7: local_invariance = pass with valid Tier 0 + run");
    eq(r.threshold_posture.retained_tier_sufficiency, "pass", "K8: tier_sufficiency = pass for Tier 0");
}

// ─── L. Downgrade posture when context is insufficient ───────────────────────
section("L. Downgrade posture emitted when context insufficient");
{
    // request_support_replay without run context
    const r = reconstructFromReplayRequest({
        replayRequest: MOCK_RQ_REQUEST,
        runResult:     null,
        workbench:     null,
    });
    // request_support_replay without run still builds (uses declared posture)
    // but threshold should show degraded support
    if (r.ok) {
        ok(r.threshold_posture.local_invariance !== "pass" ||
           r.threshold_posture.downgrade_output !== null ||
           r.threshold_posture.distortion_posture === "warning",
                                                        "L1: insufficient context produces degraded threshold");
    } else {
        ok(r.threshold_posture?.downgrade_output !== undefined,
                                                        "L1: failure also produces downgrade posture");
    }

    // Explicit downgrade on failure
    const failed = reconstructFromReplayRequest({ replayRequest: null });
    ok(failed.threshold_posture?.downgrade_output === "reconstruction_not_justified",
                                                        "L2: explicit downgrade on null request");
}

// ─── M. Trace step shape completeness ─────────────────────────────────────────
section("M. Trace step shape completeness");
{
    const r = reconstructFromReplayRequest({
        replayRequest: MOCK_RT_REQUEST,
        runResult:     MOCK_RUN,
        workbench:     MOCK_WB,
    });

    const REQUIRED_STEP_FIELDS = ["step_index","step_type","status","label","detail","retained_tier","lens_bound","non_authority_note"];
    for (const step of r.reconstruction_trace) {
        for (const f of REQUIRED_STEP_FIELDS) {
            ok(f in step, `M: step[${step.step_index}] has field '${f}'`);
        }
    }
    // Step indices should be monotonically increasing
    r.reconstruction_trace.forEach((s, i) => {
        eq(s.step_index, i, `M: step[${i}] step_index = ${i}`);
    });
}

finish();
