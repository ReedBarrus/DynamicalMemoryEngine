// tests/consultation/test_handoff_activation_request_surface.js
//
// Contract tests for the handoff / activation request surface.
//
// Scope:
//   - requestModel.js: object shape, required fields, status vocabulary,
//     lineage extraction, non-claims, explicit fencing
//   - shell integration: request log wiring, real request objects (not stubs),
//     sourceFamilyLabel derivation, onRequest handler
//   - boundary: no C1 mutation, no canon promotion, no consensus invocation
//   - separation: lab HUD and public demo untouched
//
// Success condition per task spec:
//   1.  request surface explicitly fenced as not automatic
//   2.  consultation request creates a bounded request object
//   3.  activation/review request creates a bounded request object
//   4.  request objects preserve lineage fields from run/result
//   5.  request objects preserve scope/non-claims/support basis
//   6.  request statuses distinct from canon statuses
//   7.  no C1 minted or mutated
//   8.  no consensus/promotion logic invoked
//   9.  request history/log visible and separate from result planes
//   10. lab HUD untouched
//   11. public demo untouched
//   12. execution shell remains active surface

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

import {
    buildConsultationRequest,
    buildActivationReviewRequest,
    requestSummaryLine,
    downloadRequestJson,
} from "../../hud/requestModel.js";

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

// ─── Minimal workbench/runResult fixture ──────────────────────────────────────
const MOCK_RUN_RESULT = {
    run_label: "test.run.001",
    ok: true,
    ingest: { artifact: { source_id: "synthetic.seed42", stream_id: "stream.test.001" } },
    anomalies: [{ time_start: 3.0, anomaly_type: "frequency_shift" }],
};
const MOCK_WORKBENCH = {
    scope: {
        stream_id: "stream.test.001",
        segment_ids: ["seg.0", "seg.1", "seg.2"],
        cross_run_context: { available: true, run_count: 3 },
    },
    runtime_evidence: {
        harmonic_state_count: 12,
        merged_state_count: 4,
        query_result_count: 3,
    },
    promotion_readiness: {
        report: { readiness_summary: { overall_readiness: "insufficient" } },
    },
    canon_candidate: {
        dossier: { candidate_claim: { claim_type: "bounded_structural_claim" } },
    },
    consensus_review: { review: { result: "defer" } },
};

const CANON_STATUSES = new Set([
    "proposed", "promoted", "contested", "narrowed",
    "suspended", "superseded", "revoked", "deferred",
]);

// ─── A. requestModel.js file posture ─────────────────────────────────────────
section("A. requestModel.js constitutional posture");
{
    let src = null;
    try { src = await readFile(path.join(ROOT, "hud/requestModel.js"), "utf8"); } catch(_){}
    ok(src !== null, "A1: hud/requestModel.js exists");
    if (src) {
        ok(src.includes("not promotion") || src.includes("not a promotion"), "A2: not-promotion posture declared");
        ok(src.includes("not canon"),                                         "A3: not-canon posture declared");
        ok(src.includes("explicit"),                                          "A4: explicit fencing language present");
        ok(!src.includes("mintCanon") && !src.includes("mint_canon"),        "A5: no mintCanon calls");
        ok(!src.includes("canonical_status ="),                               "A6: no C1 mutation");
        ok(!src.includes("ConsensusOp"),                                      "A7: no ConsensusOp invocation");
        // Request statuses must be declared as distinct from canon statuses
        ok(src.includes("drafted") && src.includes("prepared") && src.includes("emitted"),
                                                                              "A8: request status vocabulary declared");
    }
}

// ─── B. Consultation request shape ───────────────────────────────────────────
section("B. buildConsultationRequest — object shape and content");
{
    const req = buildConsultationRequest({
        workbench: MOCK_WORKBENCH,
        runResult: MOCK_RUN_RESULT,
        sourceFamilyLabel: "Synthetic Signal",
        requestedUse: "bounded review-anchor consultation under same declared lens",
        notes: "test note",
    });

    // Required fields
    ok(typeof req.request_id === "string" && req.request_id.length > 0, "B1: request_id present");
    eq(req.request_type, "consultation",                                  "B2: request_type = consultation");
    eq(req.request_status, "prepared",                                    "B3: request_status = prepared");
    ok(typeof req.created_at === "string",                                "B4: created_at present");

    // Fencing
    ok(req.consultation_posture?.includes("not truth"),                   "B5: not-truth posture in consultation_posture");
    ok(req.consultation_posture?.includes("not promotion"),               "B6: not-promotion posture in consultation_posture");

    // Lineage from run/workbench
    eq(req.run_label, MOCK_RUN_RESULT.run_label,                          "B7: run_label preserved from runResult");
    eq(req.stream_id, "stream.test.001",                                  "B8: stream_id preserved");
    eq(req.source_id, "synthetic.seed42",                                 "B9: source_id preserved");
    eq(req.segment_count, 3,                                              "B10: segment_count preserved");
    eq(req.cross_run_available, true,                                     "B11: cross_run_available preserved");
    eq(req.anomaly_count, 1,                                              "B12: anomaly_count from runResult");

    // Evidence / scope
    ok(Array.isArray(req.support_basis) && req.support_basis.length > 0, "B13: support_basis non-empty");
    ok(typeof req.claim_scope === "string" && req.claim_scope.length > 0, "B14: claim_scope present");
    ok(Array.isArray(req.explicit_non_claims) && req.explicit_non_claims.length > 0, "B15: explicit_non_claims present");
    ok(req.explicit_non_claims.includes("not canon"),                     "B16: 'not canon' in non-claims");
    ok(req.explicit_non_claims.includes("not truth"),                     "B17: 'not truth' in non-claims");
    ok(req.explicit_non_claims.includes("not a promotion decision"),      "B18: 'not a promotion decision' in non-claims");

    // Requested use preserved
    ok(req.requested_use?.includes("review-anchor"),                      "B19: requested_use preserved");

    // Notes
    eq(req.notes, "test note",                                            "B20: notes preserved");

    // Source family
    eq(req.source_family_label, "Synthetic Signal",                       "B21: sourceFamilyLabel preserved");

    // Request status is NOT a canon status
    ok(!CANON_STATUSES.has(req.request_status),                           "B22: request_status not a canon status");
}

// ─── C. Activation/review request shape ──────────────────────────────────────
section("C. buildActivationReviewRequest — object shape and content");
{
    const req = buildActivationReviewRequest({
        workbench: MOCK_WORKBENCH,
        runResult: MOCK_RUN_RESULT,
        sourceFamilyLabel: "Synthetic Signal",
        proposedBoundedClaim: "Under the declared medium FFT/Hann lens, the current run provides bounded structural evidence.",
        allowedUse: "bounded review consideration only",
        notes: "activation test",
    });

    eq(req.request_type, "activation_review",                             "C1: request_type = activation_review");
    eq(req.request_status, "prepared",                                    "C2: request_status = prepared");
    ok(req.request_id.startsWith("AREQ"),                                 "C3: request_id has AREQ prefix");

    // Claim
    ok(typeof req.proposed_bounded_claim === "string" && req.proposed_bounded_claim.length > 0, "C4: proposed_bounded_claim present");
    ok(typeof req.claim_scope === "string",                               "C5: claim_scope present");

    // Non-claims (must include at minimum not-canon and not-automatic-promotion)
    ok(Array.isArray(req.explicit_non_claims) && req.explicit_non_claims.length >= 3, "C6: explicit_non_claims non-trivial");
    ok(req.explicit_non_claims.includes("not canon"),                     "C7: 'not canon' in non-claims");
    ok(req.explicit_non_claims.includes("not automatic promotion"),       "C8: 'not automatic promotion' in non-claims");

    // Lineage
    eq(req.run_label,  MOCK_RUN_RESULT.run_label,                         "C9: run_label preserved");
    eq(req.stream_id,  "stream.test.001",                                 "C10: stream_id preserved");
    eq(req.cross_run_count, 3,                                            "C11: cross_run_count preserved");

    // Evidence
    ok(Array.isArray(req.support_basis) && req.support_basis.length > 0, "C12: support_basis non-empty");
    ok(req.support_basis.includes("cross_run_evidence"),                  "C13: cross_run_evidence in support_basis");
    ok(req.support_basis.includes("harmonic_state_evidence"),             "C14: harmonic_state_evidence in support_basis");
    ok(req.support_basis.includes("anomaly_event_evidence"),              "C15: anomaly_event_evidence in support_basis");

    // Allowed use
    eq(req.allowed_use, "bounded review consideration only",              "C16: allowed_use preserved");

    // Posture
    ok(req.request_posture?.includes("not automatic"),                    "C17: not-automatic posture present");
    ok(typeof req.recommended_interim === "string",                       "C18: recommended_interim present");
    ok(typeof req.blast_radius === "string",                              "C19: blast_radius declared");

    // Not a canon status
    ok(!CANON_STATUSES.has(req.request_status),                           "C20: request_status not a canon status");
}

// ─── D. Auto-derived claim when none provided ─────────────────────────────────
section("D. Auto-derived claim fallback");
{
    const req = buildActivationReviewRequest({
        workbench: MOCK_WORKBENCH,
        runResult: MOCK_RUN_RESULT,
        sourceFamilyLabel: "Synthetic Signal",
        // No proposedBoundedClaim — should auto-derive
    });
    ok(typeof req.proposed_bounded_claim === "string" && req.proposed_bounded_claim.length > 0,
                                                                          "D1: claim auto-derived when not provided");
    ok(!req.proposed_bounded_claim.includes("undefined"),                 "D2: auto-derived claim has no undefined tokens");
}

// ─── E. Empty workbench / runResult — graceful degradation ───────────────────
section("E. Graceful degradation with missing context");
{
    const cReq = buildConsultationRequest({});
    eq(cReq.request_type, "consultation",                                 "E1: consultation request still has type");
    eq(cReq.request_status, "prepared",                                   "E2: still marked prepared");
    ok(cReq.run_label === null || cReq.run_label === undefined,           "E3: run_label null when no runResult");
    ok(Array.isArray(cReq.explicit_non_claims),                           "E4: explicit_non_claims always present");

    const aReq = buildActivationReviewRequest({});
    eq(aReq.request_type, "activation_review",                            "E5: activation request still has type");
    ok(Array.isArray(aReq.support_basis),                                 "E6: support_basis always an array");
}

// ─── F. requestSummaryLine ────────────────────────────────────────────────────
section("F. requestSummaryLine formatting");
{
    const cReq = buildConsultationRequest({
        workbench: MOCK_WORKBENCH,
        runResult: MOCK_RUN_RESULT,
        requestedUse: "bounded review-anchor consultation under same declared lens",
    });
    const cLine = requestSummaryLine(cReq);
    ok(typeof cLine === "string" && cLine.length > 0,                    "F1: consultation summary line is non-empty string");
    ok(cLine.includes("CONSULT"),                                         "F2: CONSULT prefix in consultation line");
    ok(cLine.includes("prepared"),                                        "F3: status visible in summary line");

    const aReq = buildActivationReviewRequest({ workbench: MOCK_WORKBENCH, runResult: MOCK_RUN_RESULT });
    const aLine = requestSummaryLine(aReq);
    ok(typeof aLine === "string" && aLine.length > 0,                    "F4: activation summary line is non-empty string");
    ok(aLine.includes("ACT-REV"),                                        "F5: ACT-REV prefix in activation line");
}

// ─── G. Request IDs are distinct per call ─────────────────────────────────────
section("G. Request ID uniqueness");
{
    const r1 = buildConsultationRequest({});
    const r2 = buildConsultationRequest({});
    const r3 = buildActivationReviewRequest({});
    ok(r1.request_id !== r2.request_id,                                  "G1: consecutive consultation IDs are distinct");
    ok(r1.request_id !== r3.request_id,                                  "G2: consultation ID distinct from activation ID");
    ok(r1.request_id.startsWith("CREQ"),                                 "G3: consultation ID has CREQ prefix");
    ok(r3.request_id.startsWith("AREQ"),                                 "G4: activation ID has AREQ prefix");
}

// ─── H. Shell source: real request model wired, stubs removed ─────────────────
section("H. Shell wiring — real model replaces stubs");
{
    let shellSrc = null;
    try { shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch(_){}
    ok(shellSrc !== null, "H1: shell file readable");
    if (shellSrc) {
        // Real model wired
        ok(shellSrc.includes("buildConsultationRequest"),                "H2: buildConsultationRequest imported/used in shell");
        ok(shellSrc.includes("buildActivationReviewRequest"),            "H3: buildActivationReviewRequest imported/used in shell");
        ok(shellSrc.includes("requestSummaryLine"),                      "H4: requestSummaryLine used in shell log");
        ok(shellSrc.includes("handleRequest"),                           "H5: handleRequest handler present");
        ok(shellSrc.includes("onRequest"),                               "H6: onRequest prop wired to RequestRegion");
        ok(shellSrc.includes("sourceFamilyLabel"),                       "H7: sourceFamilyLabel derived and passed");

        // Stubs removed
        ok(!shellSrc.includes("stub · consultation seam not yet wired"), "H8: old consultation stub removed");
        ok(!shellSrc.includes("stub · activation/review seam not yet wired"), "H9: old activation stub removed");

        // Request log updated
        ok(!shellSrc.includes("request log (stubs)"),                   "H10: 'request log (stubs)' label removed");
        ok(shellSrc.includes("below canon · not automatic"),             "H11: new log posture label present");

        // Constitutional posture
        ok(!shellSrc.includes("mintCanon"),                              "H12: no mintCanon in shell");
        ok(!shellSrc.includes("canonical_status ="),                     "H13: no C1 mutation in shell");

        // Fencing still visible
        ok(shellSrc.includes("not automatic"),                           "H14: not-automatic fencing present");
        ok(shellSrc.includes("not promotion") || shellSrc.includes("not a promotion"), "H15: not-promotion fencing present");
    }
}

// ─── I. Separation — other surfaces untouched ─────────────────────────────────
section("I. Separation from other surfaces");
{
    let labHudSrc = null, demoSrc = null;
    try { labHudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8"); } catch(_){}
    try { demoSrc   = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch(_){}

    if (labHudSrc) {
        ok(!labHudSrc.includes("requestModel"),                          "I1: lab HUD does not reference requestModel");
        ok(!labHudSrc.includes("buildConsultationRequest"),              "I2: lab HUD unchanged");
        ok(labHudSrc.includes("export default function DoorOneStructuralMemoryHUD"), "I3: lab HUD export intact");
    }
    if (demoSrc) {
        ok(!demoSrc.includes("requestModel"),                            "I4: public demo does not reference requestModel");
        ok(!demoSrc.includes("buildConsultationRequest"),                "I5: public demo unchanged");
    }

    // Execution shell is still the active surface
    let execHtmlSrc = null;
    try { execHtmlSrc = await readFile(path.join(ROOT, "execution.html"), "utf8"); } catch(_){}
    ok(execHtmlSrc !== null,                                             "I6: execution.html still exists");
    if (execHtmlSrc) {
        ok(execHtmlSrc.includes("execution_main.jsx"),                   "I7: execution.html still points to shell entry");
    }
}

finish();
