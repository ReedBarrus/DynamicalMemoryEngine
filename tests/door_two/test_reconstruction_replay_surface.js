// tests/door_two/test_reconstruction_replay_surface.js
//
// Focused contract tests for replay model reconstruction wiring and replay rendering.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

import {
    buildRuntimeReconstructionReplay,
    buildRequestSupportReplay,
    replaySummaryLine,
    declareLens,
    declareRetainedTier,
} from "../../hud/replayModel.js";

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

const MOCK_RUN = {
    run_label: "shell.run.001",
    ok: true,
    artifacts: {
        a1: { source_id: "synthetic.seed42", stream_id: "stream.shell.001" },
        h1s: [{ artifact_class: "H1" }],
        m1s: [{ artifact_class: "M1" }],
        q: { artifact_class: "Q" },
        anomaly_reports: [{ artifact_class: "An" }],
    },
};
const HOLLOW_RUN = {
    run_label: "shell.run.001",
    ok: true,
    artifacts: {},
};
const MOCK_WB = {
    scope: {
        stream_id: "stream.shell.001",
        segment_ids: ["s0","s1","s2","s3"],
        cross_run_context: { available: true, run_count: 3 },
    },
    runtime: { artifacts: MOCK_RUN.artifacts },
    interpretation: { trajectory: {} },
    promotion_readiness: { report: { readiness_summary: { overall_readiness: "insufficient" } } },
    canon_candidate:     { dossier: { candidate_claim: { claim_type: "bounded_structural_claim" } } },
    consensus_review:    { review: { result: "defer" } },
};
const MOCK_REQUEST = {
    request_id:          "CREQ-1234-abc",
    request_type:        "consultation",
    request_status:      "prepared",
    source_family_label: "Synthetic Signal",
    run_label:           "shell.run.001",
    stream_id:           "stream.shell.001",
    source_id:           "synthetic.seed42",
    segment_count:       4,
    cross_run_available: true,
    cross_run_count:     3,
    support_basis:       ["harmonic_state_evidence", "cross_run_evidence"],
    anomaly_count:       1,
    overall_readiness:   "insufficient",
    explicit_non_claims: ["not canon","not truth","not a promotion decision"],
    requested_use:       "bounded review-anchor consultation under same declared lens",
};
const TIER2 = {
    tier_used: 2,
    tier_label: "Tier 2 — regenerable digest",
    honest_posture: "declared-only posture",
};

section("A. replayModel.js constitutional posture");
{
    const src = await readFile(path.join(ROOT, "hud/replayModel.js"), "utf8");
    ok(src.includes("reconstructFromReplayRequest"), "A1: reconstruction backend imported");
    ok(src.includes("support-trace only"), "A2: replay posture stays support-trace bounded");
    ok(!src.includes("ConsensusOp"), "A3: no ConsensusOp in replay model");
    ok(!src.includes("mintCanon"), "A4: no canon minting in replay model");
}

section("B. declare helpers");
{
    const lens = declareLens("Synthetic Signal", MOCK_RUN);
    const tier = declareRetainedTier(MOCK_RUN);
    eq(lens.stream_id, "stream.shell.001", "B1: lens keeps stream provenance");
    eq(tier.tier_used, 0, "B2: retained tier defaults to Tier 0");
}

section("C. runtime replay carries reconstruction fields");
{
    const r = buildRuntimeReconstructionReplay({
        workbench: MOCK_WB,
        runResult: MOCK_RUN,
        sourceFamilyLabel: "Synthetic Signal",
        notes: "test replay",
    });

    eq(r.request_status, "prepared", "C1: runtime replay remains prepared on success");
    eq(r.reconstruction_type, "support_trace", "C2: reconstruction_type attached");
    eq(r.reconstruction_status, "completed", "C3: reconstruction_status attached");
    ok(Array.isArray(r.reconstruction_trace) && r.reconstruction_trace.length > 0, "C4: reconstruction_trace attached");
    eq(r.reconstruction_summary?.reconstruction_class, "support_trace", "C5: reconstruction_summary attached");
    eq(r.threshold_posture?.downgrade_output, null, "C6: Tier 0 runtime replay has no downgrade");
    ok(typeof r.latency_posture === "string", "C7: latency_posture attached");
    ok(typeof r.fidelity_posture === "string", "C8: fidelity_posture attached");
    eq(r.failure_reason, null, "C9: failure_reason null on success");
    ok(r.explicit_non_claims.includes("not source-adjacent reconstitution"), "C10: backend non-claims preserved");
    ok(r.replay_posture.includes("support-trace only"), "C11: replay posture remains bounded");
}

section("D. request-support replay carries reconstruction fields");
{
    const r = buildRequestSupportReplay({
        targetRequest: MOCK_REQUEST,
        workbench: MOCK_WB,
        runResult: MOCK_RUN,
        sourceFamilyLabel: "Synthetic Signal",
    });

    eq(r.request_status, "prepared", "D1: request-support replay remains prepared on success");
    eq(r.reconstruction_type, "support_trace", "D2: request-support replay attaches reconstruction_type");
    eq(r.reconstruction_status, "completed", "D3: request-support replay attaches reconstruction_status");
    ok(Array.isArray(r.reconstruction_trace) && r.reconstruction_trace.length > 0, "D4: request-support replay attaches reconstruction_trace");
    ok(r.request_not_fulfilled === true, "D5: request_not_fulfilled preserved");
    ok(r.allowed_use.includes("not fulfillment"), "D6: not-fulfillment posture preserved");
}

section("E. reconstruction failure stays explicit");
{
    const r = buildRuntimeReconstructionReplay({
        workbench: MOCK_WB,
        runResult: HOLLOW_RUN,
        sourceFamilyLabel: "Synthetic Signal",
    });

    eq(r.request_status, "failed", "E1: hollow runtime support fails replay preparation honestly");
    eq(r.reconstruction_status, "failed", "E2: reconstruction_status stays explicit on failure");
    ok(typeof r.failure_reason === "string" && r.failure_reason.length > 0, "E3: failure_reason attached");
    ok(Array.isArray(r.reconstruction_trace) && r.reconstruction_trace.some((s) => s.step_type === "reconstruction_failed"), "E4: failed reconstruction trace attached");
}

section("F. higher-tier insufficiency stays explicit");
{
    const r = buildRuntimeReconstructionReplay({
        workbench: MOCK_WB,
        runResult: MOCK_RUN,
        sourceFamilyLabel: "Synthetic Signal",
        retainedTierOverride: TIER2,
    });

    eq(r.request_status, "prepared", "F1: higher-tier replay still returns bounded object");
    eq(r.threshold_posture?.retained_tier_sufficiency, "fail", "F2: higher-tier insufficiency attached");
    eq(r.threshold_posture?.downgrade_output, "retained_tier_insufficient", "F3: higher-tier downgrade attached");
    ok(r.reconstruction_summary?.non_authority_note.includes(TIER2.tier_label), "F4: reconstruction summary remains tier-honest");
}

section("G. replaySummaryLine formatting");
{
    const rt = buildRuntimeReconstructionReplay({ workbench: MOCK_WB, runResult: MOCK_RUN });
    const line = replaySummaryLine(rt);
    ok(typeof line === "string" && line.includes("RT-RECON"), "G1: replay summary line remains available");
}

section("H. ReplayRegion rendering order and explicit posture");
{
    const src = await readFile(path.join(ROOT, "hud/ReplayRegion.jsx"), "utf8");
    ok(src.includes("2 · Reconstruction Summary"), "H1: reconstruction summary section rendered");
    ok(src.includes("3 · Threshold Posture / Downgrade"), "H2: threshold posture section rendered");
    ok(src.includes("4 · Reconstruction Trace"), "H3: reconstruction trace section rendered");
    ok(src.includes("5 · Non-Claims / Request Posture"), "H4: non-claims section rendered");
    ok(src.includes("replay failed:"), "H5: failure path rendered explicitly");
    ok(src.includes("explicit downgrade:"), "H6: downgrade rendered explicitly");
    ok(src.includes("this is not fulfillment"), "H7: request-support replay notice preserved");
    ok(src.includes("lastReplay.reconstruction_summary") && src.includes("lastReplay.threshold_posture") && src.includes("lastReplay.reconstruction_trace"), "H8: rendering reads mechanized reconstruction-backed fields");

    const p1 = src.indexOf("1 · Provenance");
    const p2 = src.indexOf("2 · Reconstruction Summary");
    const p3 = src.indexOf("3 · Threshold Posture / Downgrade");
    const p4 = src.indexOf("4 · Reconstruction Trace");
    const p5 = src.indexOf("5 · Non-Claims / Request Posture");
    ok(p1 > -1 && p2 > p1 && p3 > p2 && p4 > p3 && p5 > p4, "H9: replay panel uses required lawful rendering order");
}

finish();
