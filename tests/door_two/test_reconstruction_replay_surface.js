// tests/door_two/test_reconstruction_replay_surface.js
//
// Contract tests for the reconstruction / replay surface.
//
// Scope:
//   - replayModel.js: object shape, required fields, tier/lens declaration,
//     derived-vs-durable posture, non-claims, status vocabulary
//   - runtime_reconstruction replay class
//   - request_support_replay class (distinct from runtime replay)
//   - failure posture (no run result available)
//   - shell wiring: replayLog state, handleReplay, ReplayRegion present
//   - separation: lab HUD and public demo untouched
//   - boundary: no C1 minted, no consensus invoked, no promotion
//
// Verifies all 13 required conditions from the task spec.

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

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MOCK_RUN = {
    run_label: "shell.run.001",
    ok: true,
    ingest: { artifact: { source_id: "synthetic.seed42", stream_id: "stream.shell.001" } },
    anomalies: [{ time_start: 3.0, anomaly_type: "frequency_shift" }],
};
const MOCK_WB = {
    scope: {
        stream_id: "stream.shell.001",
        segment_ids: ["s0","s1","s2","s3"],
        cross_run_context: { available: true, run_count: 3 },
    },
    runtime_evidence: { harmonic_state_count: 8, merged_state_count: 3, query_result_count: 2 },
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

const CANON_STATUSES   = new Set(["proposed","promoted","contested","narrowed","suspended","superseded","revoked","deferred"]);
const REQUEST_STATUSES = new Set(["drafted","prepared","emitted","deferred","failed"]);
const REPLAY_STATUSES  = new Set(["drafted","prepared","rendered","deferred","failed"]);

// ─── A. replayModel.js constitutional posture ─────────────────────────────────
section("A. replayModel.js constitutional posture");
{
    let src = null;
    try { src = await readFile(path.join(ROOT, "hud/replayModel.js"), "utf8"); } catch(_){}
    ok(src !== null,                                                        "A1: hud/replayModel.js exists");
    if (src) {
        ok(src.includes("not truth restoration") || src.includes("lens-bound support, not truth"), "A2: core replay rule declared");
        ok(src.includes("not canon"),                                       "A3: not-canon posture declared");
        ok(src.includes("Tier 0"),                                          "A4: Tier 0 honestly declared");
        ok(!src.includes("mintCanon"),                                      "A5: no mintCanon");
        ok(!src.includes("ConsensusOp"),                                    "A6: no ConsensusOp");
        ok(!src.includes("canonical_status ="),                             "A7: no C1 mutation");
        ok(src.includes("drafted") && src.includes("prepared") && src.includes("rendered"), "A8: replay status vocabulary declared");
        ok(src.includes("runtime_reconstruction") && src.includes("request_support_replay"), "A9: replay types declared");
    }
}

// ─── B. declareLens ───────────────────────────────────────────────────────────
section("B. declareLens helper");
{
    const lens = declareLens("Synthetic Signal", MOCK_RUN);
    ok(typeof lens.transform_family === "string" && lens.transform_family.length > 0, "B1: transform_family present");
    ok(typeof lens.window_N === "number",          "B2: window_N present");
    ok(typeof lens.hop_N === "number",             "B3: hop_N present");
    ok(typeof lens.Fs_target === "number",         "B4: Fs_target present");
    ok(typeof lens.scale_posture === "string",     "B5: scale_posture present");
    ok(typeof lens.note === "string",              "B6: lens note present");
    eq(lens.source_family, "Synthetic Signal",     "B7: source_family preserved");
    eq(lens.stream_id, "stream.shell.001",         "B8: stream_id from runResult");
}

// ─── C. declareRetainedTier ───────────────────────────────────────────────────
section("C. declareRetainedTier helper");
{
    const tier = declareRetainedTier(MOCK_RUN);
    eq(tier.tier_used, 0,                          "C1: tier_used = 0 (Tier 0 live working state)");
    ok(tier.tier_label.includes("Tier 0"),         "C2: tier_label mentions Tier 0");
    ok(Array.isArray(tier.supports),               "C3: supports is array");
    ok(Array.isArray(tier.does_not_imply),         "C4: does_not_imply is array");
    ok(tier.does_not_imply.includes("promotion"),  "C5: 'promotion' in does_not_imply");
    ok(tier.higher_tiers_note?.includes("not yet wired"), "C6: higher tiers honestly noted as not yet wired");
    ok(typeof tier.honest_posture === "string",    "C7: honest_posture declared");
    ok(tier.honest_posture.includes("Tier 0 only"),"C8: honest_posture says 'Tier 0 only'");
}

// ─── D. buildRuntimeReconstructionReplay ─────────────────────────────────────
section("D. buildRuntimeReconstructionReplay");
{
    const r = buildRuntimeReconstructionReplay({
        workbench: MOCK_WB, runResult: MOCK_RUN, sourceFamilyLabel: "Synthetic Signal",
        notes: "test replay",
    });

    ok(typeof r.replay_request_id === "string",    "D1: replay_request_id present");
    ok(r.replay_request_id.startsWith("RPLY-RT"),  "D2: RPLY-RT prefix");
    eq(r.replay_type, "runtime_reconstruction",    "D3: replay_type = runtime_reconstruction");
    eq(r.request_status, "prepared",              "D4: request_status = prepared");
    ok(!CANON_STATUSES.has(r.request_status),      "D5: request_status not a canon status");
    ok(REPLAY_STATUSES.has(r.request_status),      "D6: request_status is valid replay status");

    // Lens
    ok(typeof r.declared_lens === "object" && r.declared_lens !== null, "D7: declared_lens present");
    ok(typeof r.declared_lens.transform_family === "string",            "D8: lens has transform_family");
    ok(typeof r.declared_lens.window_N === "number",                    "D9: lens has window_N");

    // Retained tier
    eq(r.retained_tier_used?.tier_used, 0,         "D10: Tier 0 declared");
    ok(r.retained_tier_used?.honest_posture?.includes("Tier 0 only"), "D11: honest Tier 0 posture");

    // Lineage
    eq(r.run_label, MOCK_RUN.run_label,            "D12: run_label preserved");
    eq(r.stream_id, "stream.shell.001",            "D13: stream_id preserved");
    eq(r.source_id, "synthetic.seed42",            "D14: source_id preserved");
    eq(r.segment_count, 4,                         "D15: segment_count preserved");
    eq(r.cross_run_available, true,                "D16: cross_run_available preserved");

    // Support basis
    ok(Array.isArray(r.support_basis) && r.support_basis.length > 0, "D17: support_basis non-empty");
    ok(r.support_basis.includes("harmonic_state_evidence"),            "D18: harmonic evidence in basis");
    ok(r.support_basis.includes("cross_run_evidence"),                 "D19: cross_run evidence in basis");
    ok(r.support_basis.includes("anomaly_event_evidence"),             "D20: anomaly evidence in basis");

    // Non-claims
    ok(Array.isArray(r.explicit_non_claims) && r.explicit_non_claims.length >= 5, "D21: explicit_non_claims non-trivial");
    ok(r.explicit_non_claims.includes("not raw restoration"),          "D22: 'not raw restoration' in non-claims");
    ok(r.explicit_non_claims.includes("not truth"),                    "D23: 'not truth' in non-claims");
    ok(r.explicit_non_claims.includes("not canon"),                    "D24: 'not canon' in non-claims");
    ok(r.explicit_non_claims.includes("not receipt-backed in v0"),     "D25: honest v0 limitation declared");

    // Posture
    ok(r.replay_posture?.includes("lens-bound"),   "D26: lens-bound posture present");
    ok(r.replay_posture?.includes("Tier 0"),        "D27: Tier 0 in posture");
    ok(r.replay_posture?.includes("non-authoritative"), "D28: non-authoritative in posture");
    ok(r.derived_vs_durable?.includes("derived"),  "D29: derived posture declared");
    eq(r.notes, "test replay",                     "D30: notes preserved");
}

// ─── E. buildRequestSupportReplay ────────────────────────────────────────────
section("E. buildRequestSupportReplay");
{
    const r = buildRequestSupportReplay({
        targetRequest: MOCK_REQUEST,
        workbench: MOCK_WB,
        runResult: MOCK_RUN,
        sourceFamilyLabel: "Synthetic Signal",
    });

    ok(r.replay_request_id.startsWith("RPLY-RQ"),  "E1: RPLY-RQ prefix");
    eq(r.replay_type, "request_support_replay",    "E2: replay_type = request_support_replay");
    eq(r.request_status, "prepared",              "E3: request_status = prepared");

    // Target reference
    eq(r.replay_target_ref, MOCK_REQUEST.request_id, "E4: target ref = prepared request id");
    eq(r.replay_target_type, "prepared_request",   "E5: target type = prepared_request");
    eq(r.target_request_type, "consultation",      "E6: target_request_type preserved");

    // Lineage from the target request (not from current run)
    eq(r.run_label, MOCK_REQUEST.run_label,        "E7: run_label from target request");
    eq(r.stream_id, MOCK_REQUEST.stream_id,        "E8: stream_id from target request");
    eq(r.cross_run_available, true,                "E9: cross_run from target request");

    // Support basis from target request
    ok(r.support_basis.includes("harmonic_state_evidence"), "E10: support_basis from target request");

    // Explicit: replay does not fulfill the request
    eq(r.request_not_fulfilled, true,              "E11: request_not_fulfilled = true");
    ok(r.allowed_use?.includes("not fulfillment"), "E12: 'not fulfillment' in allowed_use");

    // Replay and request are distinct objects
    ok(r.replay_request_id !== MOCK_REQUEST.request_id, "E13: replay ID distinct from request ID");
}

// ─── F. buildRequestSupportReplay — no target request ────────────────────────
section("F. Failure posture");
{
    // No target request
    const noTarget = buildRequestSupportReplay({ workbench: MOCK_WB, runResult: MOCK_RUN });
    eq(noTarget.request_status, "failed",          "F1: missing target → status = failed");
    ok(typeof noTarget.failure_reason === "string", "F2: failure_reason present");

    // No runResult/workbench for reconstruction
    const noRun = buildRuntimeReconstructionReplay({});
    eq(noRun.request_status, "failed",             "F3: missing run → status = failed");
    ok(typeof noRun.failure_reason === "string",   "F4: failure_reason present");

    // Failed replay does not advance (status is failed, not prepared)
    ok(!CANON_STATUSES.has(noRun.request_status),  "F5: failed replay not a canon status");
}

// ─── G. Replay types are distinct ─────────────────────────────────────────────
section("G. Replay class distinction");
{
    const rt = buildRuntimeReconstructionReplay({ workbench: MOCK_WB, runResult: MOCK_RUN });
    const rq = buildRequestSupportReplay({ targetRequest: MOCK_REQUEST, workbench: MOCK_WB, runResult: MOCK_RUN });

    ok(rt.replay_type !== rq.replay_type,          "G1: replay types are distinct");
    eq(rt.replay_target_type, "current_run_workbench", "G2: RT target = current_run_workbench");
    eq(rq.replay_target_type, "prepared_request",  "G3: RQ target = prepared_request");
    ok(rt.replay_request_id !== rq.replay_request_id, "G4: IDs are distinct");
}

// ─── H. replaySummaryLine ─────────────────────────────────────────────────────
section("H. replaySummaryLine formatting");
{
    const rt  = buildRuntimeReconstructionReplay({ workbench: MOCK_WB, runResult: MOCK_RUN });
    const rq  = buildRequestSupportReplay({ targetRequest: MOCK_REQUEST, workbench: MOCK_WB, runResult: MOCK_RUN });
    const rtL = replaySummaryLine(rt);
    const rqL = replaySummaryLine(rq);

    ok(typeof rtL === "string" && rtL.length > 0,  "H1: runtime replay summary non-empty");
    ok(rtL.includes("RT-RECON"),                   "H2: RT-RECON prefix in runtime summary");
    ok(typeof rqL === "string" && rqL.length > 0,  "H3: request replay summary non-empty");
    ok(rqL.includes("RQ-SUPP"),                    "H4: RQ-SUPP prefix in request summary");
    ok(rtL.includes("prepared"),                   "H5: status visible in summary");
}

// ─── I. Shell wiring ──────────────────────────────────────────────────────────
section("I. Shell wiring");
{
    let shellSrc = null;
    try { shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch(_){}
    ok(shellSrc !== null,                          "I1: shell readable");
    if (shellSrc) {
        ok(shellSrc.includes("buildRuntimeReconstructionReplay"), "I2: buildRuntimeReconstructionReplay imported");
        ok(shellSrc.includes("buildRequestSupportReplay"),        "I3: buildRequestSupportReplay imported");
        ok(shellSrc.includes("replaySummaryLine"),                "I4: replaySummaryLine used in shell");
        ok(shellSrc.includes("ReplayRegion"),                     "I5: ReplayRegion component present");
        ok(shellSrc.includes("replayLog"),                        "I6: replayLog state present");
        ok(shellSrc.includes("handleReplay"),                     "I7: handleReplay handler present");
        ok(shellSrc.includes("onReplay"),                         "I8: onReplay prop wired to ReplayRegion");
        ok(shellSrc.includes("Tier 0"),                           "I9: Tier 0 visible in shell UI");
        ok(shellSrc.includes("lens-bound"),                       "I10: lens-bound posture visible");
        ok(shellSrc.includes("not authority"),                    "I11: not-authority posture visible");

        // Provenance-first ordering preserved in replay panel
        const p1 = shellSrc.indexOf("1 · Provenance");
        const p2 = shellSrc.indexOf("2 · Runtime Evidence");
        const p3 = shellSrc.indexOf("3 · Declared Lens");
        const p4 = shellSrc.indexOf("4 · Retained Tier");
        const p5 = shellSrc.indexOf("5 · Derived Posture");
        ok(p1 > 0 && p2 > p1 && p3 > p2 && p4 > p3 && p5 > p4, "I12: replay panel uses provenance-first ordering");

        // No canon promotion
        ok(!shellSrc.includes("mintCanon"),        "I13: no mintCanon in shell");
        ok(!shellSrc.includes("canonical_status ="), "I14: no C1 mutation");

        // request_not_fulfilled note for request replay
        ok(shellSrc.includes("request_not_fulfilled") || shellSrc.includes("not been fulfilled"),
                                                   "I15: request-not-fulfilled notice in replay panel");

        // Replay log separate from request log
        ok(shellSrc.includes("replay log"),        "I16: replay log present");
        ok(shellSrc.includes("request log"),       "I17: request log still present and separate");
    }
}

// ─── J. Separation from other surfaces ───────────────────────────────────────
section("J. Surface separation");
{
    let labHudSrc = null, demoSrc = null;
    try { labHudSrc = await readFile(path.join(ROOT, "DoorOneStructuralMemoryHud.jsx"), "utf8"); } catch(_){}
    try { demoSrc   = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch(_){}

    if (labHudSrc) {
        ok(!labHudSrc.includes("replayModel"),     "J1: lab HUD unchanged");
        ok(labHudSrc.includes("export default function DoorOneStructuralMemoryHUD"), "J2: lab HUD export intact");
    }
    if (demoSrc) {
        ok(!demoSrc.includes("replayModel"),       "J3: public demo unchanged");
    }

    let execHtmlSrc = null;
    try { execHtmlSrc = await readFile(path.join(ROOT, "execution.html"), "utf8"); } catch(_){}
    ok(execHtmlSrc !== null,                       "J4: execution.html still exists");
}

finish();
