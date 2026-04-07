// tests/reconstruction/readside/test_reconstruction_replay_surface.js
//
// Focused contract tests for replay model reconstruction wiring and replay rendering.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    buildRuntimeReconstructionReplay,
    buildRequestSupportReplay,
    replaySummaryLine,
    declareLens,
    declareRetainedTier,
} from "../../../hud/replayModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let PASS = 0;
let FAIL = 0;
function section(t) { console.log(`\n-- ${t} --`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ok ${label}`); }
    else { FAIL++; console.error(`  not ok ${label}`); }
}
function eq(a, b, label) {
    ok(Object.is(a, b), `${label}${Object.is(a, b) ? "" : ` (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`}`);
}
function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
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
        segment_ids: ["s0", "s1", "s2", "s3"],
        cross_run_context: { available: true, run_count: 3 },
    },
    runtime: { artifacts: MOCK_RUN.artifacts },
    interpretation: { trajectory: {} },
    promotion_readiness: { report: { readiness_summary: { overall_readiness: "insufficient" } } },
    canon_candidate: { dossier: { candidate_claim: { claim_type: "bounded_structural_claim" } } },
    consensus_review: { review: { result: "defer" } },
};
const MOCK_REQUEST = {
    request_id: "CREQ-1234-abc",
    request_type: "consultation",
    request_status: "prepared",
    source_family_label: "Synthetic Signal",
    run_label: "shell.run.001",
    stream_id: "stream.shell.001",
    source_id: "synthetic.seed42",
    segment_count: 4,
    cross_run_available: true,
    cross_run_count: 3,
    support_basis: ["harmonic_state_evidence", "cross_run_evidence"],
    anomaly_count: 1,
    overall_readiness: "insufficient",
    explicit_non_claims: ["not canon", "not truth", "not a promotion decision"],
    requested_use: "bounded review-anchor consultation under same declared lens",
};
const TIER1 = {
    tier_used: 1,
    tier_label: "Tier 1 - durable receipts",
    honest_posture: "receipt-backed lineage support only",
};
const TIER2 = {
    tier_used: 2,
    tier_label: "Tier 2 - regenerable digest",
    honest_posture: "declared-only posture",
};
const TIER3 = {
    tier_used: 3,
    tier_label: "Tier 3 - pinned packet",
    honest_posture: "declared-only posture",
};
const TIER4 = {
    tier_used: 4,
    tier_label: "Tier 4 - archive bundle",
    honest_posture: "declared-only posture",
};
const RECEIPT_SUPPORT = {
    receipt_refs: ["receipt_cycle_0001_live_run_1.json", "receipt_cycle_0002_live_run_2.json"],
    receipt_lineage: ["out_provenance/live/receipt_cycle_0001_live_run_1.json"],
    receipt_count: 2,
    provenance_complete: true,
    replayable_support_present: true,
    lineage_summary: "durable provenance receipt lineage",
};

section("A. replayModel.js constitutional posture");
{
    const src = await readFile(path.join(ROOT, "hud/replayModel.js"), "utf8");
    ok(src.includes("reconstructFromReplayRequest"), "A1: reconstruction backend imported");
    ok(src.includes("receiptSupport"), "A2: replay model can pass receipt support");
    ok(src.includes("replay_fidelity_record_v0"), "A3: replay model threads backend fidelity record");
    ok(!src.includes("ConsensusOp"), "A4: no ConsensusOp in replay model");
}

section("B. declare helpers");
{
    const lens = declareLens("Synthetic Signal", MOCK_RUN);
    const tier = declareRetainedTier(MOCK_RUN);
    eq(lens.stream_id, "stream.shell.001", "B1: lens keeps stream provenance");
    eq(tier.tier_used, 0, "B2: retained tier defaults to Tier 0");
}

section("C. Tier 0 runtime replay carries backend fidelity record");
{
    const r = buildRuntimeReconstructionReplay({
        workbench: MOCK_WB,
        runResult: MOCK_RUN,
        sourceFamilyLabel: "Synthetic Signal",
        notes: "test replay",
    });

    eq(r.request_status, "prepared", "C1: runtime replay remains prepared on success");
    eq(r.reconstruction_status, "completed", "C2: Tier 0 completes");
    eq(r.threshold_posture?.downgrade_output, null, "C3: Tier 0 has no downgrade");
    ok(typeof r.replay_fidelity_record_v0 === "object", "C4: fidelity record attached");
    eq(r.replay_fidelity_record_v0.mechanization_status, "mechanized", "C5: Tier 0 marked mechanized");
    ok(r.replay_fidelity_record_v0.explicit_non_claims.includes("not raw restoration"), "C6: fidelity record preserves non-claims");
}

section("D. Tier 1 runtime replay is receipt-backed");
{
    const r = buildRuntimeReconstructionReplay({
        workbench: MOCK_WB,
        runResult: HOLLOW_RUN,
        sourceFamilyLabel: "Synthetic Signal",
        retainedTierOverride: TIER1,
        receiptSupport: RECEIPT_SUPPORT,
    });

    eq(r.request_status, "prepared", "D1: Tier 1 replay remains prepared");
    eq(r.reconstruction_status, "completed", "D2: Tier 1 completes");
    eq(r.threshold_posture?.retained_tier_sufficiency, "pass", "D3: Tier 1 sufficiency passes");
    eq(r.replay_fidelity_record_v0.mechanization_status, "mechanized", "D4: Tier 1 marked mechanized");
    ok(r.support_basis.includes("receipt_cycle_0001_live_run_1.json"), "D5: receipt refs included in support basis");
}

section("E. request-support replay carries reconstruction fields");
{
    const r = buildRequestSupportReplay({
        targetRequest: MOCK_REQUEST,
        workbench: MOCK_WB,
        runResult: MOCK_RUN,
        sourceFamilyLabel: "Synthetic Signal",
    });

    eq(r.request_status, "prepared", "E1: request-support replay remains prepared on success");
    eq(r.reconstruction_status, "completed", "E2: request-support replay completes");
    ok(Array.isArray(r.reconstruction_trace) && r.reconstruction_trace.length > 0, "E3: request-support replay attaches reconstruction trace");
    ok(r.request_not_fulfilled === true, "E4: request_not_fulfilled preserved");
    ok(r.allowed_use.includes("not fulfillment"), "E5: not-fulfillment posture preserved");
}

section("F. Tier 0 failure stays explicit");
{
    const r = buildRuntimeReconstructionReplay({
        workbench: MOCK_WB,
        runResult: HOLLOW_RUN,
        sourceFamilyLabel: "Synthetic Signal",
    });

    eq(r.request_status, "failed", "F1: hollow runtime support fails replay honestly");
    eq(r.reconstruction_status, "failed", "F2: reconstruction_status explicit on failure");
    eq(r.replay_fidelity_record_v0.mechanization_status, "failed", "F3: fidelity record marks failure");
    ok(typeof r.failure_reason === "string" && r.failure_reason.length > 0, "F4: failure_reason attached");
}

for (const tier of [TIER2, TIER3, TIER4]) {
    section(`G. ${tier.tier_label} posture stays explicit`);
    const r = buildRuntimeReconstructionReplay({
        workbench: MOCK_WB,
        runResult: MOCK_RUN,
        sourceFamilyLabel: "Synthetic Signal",
        retainedTierOverride: tier,
        receiptSupport: RECEIPT_SUPPORT,
    });

    eq(r.request_status, "prepared", `${tier.tier_label}: bounded replay object returned`);
    eq(r.reconstruction_status, "downgraded", `${tier.tier_label}: reconstruction marked downgraded`);
    eq(r.threshold_posture?.retained_tier_sufficiency, "fail", `${tier.tier_label}: insufficiency explicit`);
    eq(r.threshold_posture?.downgrade_output, "retained_tier_insufficient", `${tier.tier_label}: downgrade explicit`);
    eq(r.replay_fidelity_record_v0.mechanization_status, "partially_mechanized", `${tier.tier_label}: fidelity record marks partial mechanization`);
}

section("H. replaySummaryLine formatting");
{
    const rt = buildRuntimeReconstructionReplay({ workbench: MOCK_WB, runResult: MOCK_RUN });
    const line = replaySummaryLine(rt);
    ok(typeof line === "string" && line.includes("RT-RECON"), "H1: replay summary line remains available");
}

section("I. ReplayRegion rendering order and explicit posture");
{
    const src = await readFile(path.join(ROOT, "hud/ReplayRegion.jsx"), "utf8");
    ok(src.includes("replay_fidelity_record_v0"), "I1: fidelity record rendered from backend field");
    ok(src.includes("2 · Replay Fidelity Record"), "I2: fidelity record section rendered");
    ok(src.includes("3 · Reconstruction Summary"), "I3: reconstruction summary section rendered");
    ok(src.includes("4 · Threshold Posture / Downgrade"), "I4: threshold posture section rendered");
    ok(src.includes("5 · Reconstruction Trace"), "I5: reconstruction trace section rendered");
    ok(src.includes("6 · Non-Claims / Request Posture"), "I6: non-claims section rendered");
    ok(src.includes("failure_posture"), "I7: failure posture rendered explicitly");
    ok(src.includes("explicit downgrade:"), "I8: downgrade rendered explicitly");
    ok(src.includes("this is not fulfillment"), "I9: request-support replay notice preserved");

    const p1 = src.indexOf("1 · Provenance");
    const p2 = src.indexOf("2 · Replay Fidelity Record");
    const p3 = src.indexOf("3 · Reconstruction Summary");
    const p4 = src.indexOf("4 · Threshold Posture / Downgrade");
    const p5 = src.indexOf("5 · Reconstruction Trace");
    const p6 = src.indexOf("6 · Non-Claims / Request Posture");
    ok(p1 > -1 && p2 > p1 && p3 > p2 && p4 > p3 && p5 > p4 && p6 > p5, "I10: replay panel uses required lawful rendering order");
}

finish();
