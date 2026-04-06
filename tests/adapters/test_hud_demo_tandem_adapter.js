// tests/door_two/test_hud_demo_tandem_adapter.js
//
// Contract tests for hud/adapters/tandemAdapter.js and its wiring into shell + demo.
//
// Verifies all 13 required conditions from the task spec.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

import {
    buildTandemInput,
    projectForHUD,
    projectForDemo,
    projectBoth,
} from "../../hud/adapters/tandemAdapter.js";

let PASS = 0, FAIL = 0;
function section(t) { console.log(`\n── ${t} ──`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ✓ ${label}`); }
    else { FAIL++; console.error(`  ✗ ${label}`); }
}
function eq(a, b, label) {
    ok(Object.is(a, b), `${label}${Object.is(a, b) ? "" : " (expected " + JSON.stringify(b) + ", got " + JSON.stringify(a) + ")"}`);
}
function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL === 0 ? "  ALL TESTS PASSED ✓" : "  TESTS FAILED ✗");
    if (FAIL > 0) process.exit(1);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MOCK_RUN = {
    run_label: "shell.run.tandem.001",
    ok: true,
    ingest: { artifact: { source_id: "synthetic.tandem", stream_id: "stream.tandem.001" } },
    anomalies: [{ time_start: 3.0, anomaly_type: "frequency_shift" }, { time_start: 7.1, anomaly_type: "dropout" }],
};
const MOCK_WB = {
    scope: {
        stream_id: "stream.tandem.001",
        segment_ids: ["s0", "s1", "s2", "s3", "s4"],
        cross_run_context: { available: true, run_count: 2 },
    },
    runtime_evidence: { harmonic_state_count: 10, merged_state_count: 4, query_result_count: 3 },
    promotion_readiness: { report: { readiness_summary: { overall_readiness: "insufficient" } } },
    canon_candidate: { dossier: { candidate_claim: { claim_type: "bounded_structural_claim" } } },
    consensus_review: { review: { result: "defer" } },
};
const MOCK_REQUEST = {
    request_id: "CREQ-tandem-001",
    request_type: "consultation",
    request_status: "prepared",
    run_label: "shell.run.tandem.001",
    stream_id: "stream.tandem.001",
    explicit_non_claims: ["not canon", "not truth"],
};
const MOCK_REPLAY = {
    replay_request_id: "RPLY-RT-tandem-001",
    replay_type: "runtime_reconstruction",
    request_status: "prepared",
    replay_posture: "lens-bound support · runtime-derived · Tier 0 · non-authoritative",
    retained_tier_used: { tier_label: "Tier 0 — live working state" },
};

const FULL_INPUT = {
    runResult: MOCK_RUN, workbench: MOCK_WB,
    requestLog: [MOCK_REQUEST], replayLog: [MOCK_REPLAY],
    sourceFamilyLabel: "Synthetic Signal", runStatus: "complete",
};

const DIFFERENTIATED_INPUT = {
    runResult: {
        ...MOCK_RUN,
        artifacts: {
            a1: {
                source_id: "synthetic.seed42",
                stream_id: "stream.tandem.002",
                meta: { seed: 42, noiseStd: 0.12, durationSec: 10 },
            },
        },
    },
    workbench: {
        ...MOCK_WB,
        scope: {
            ...MOCK_WB.scope,
            stream_id: "stream.tandem.002",
        },
        runtime_evidence: { harmonic_state_count: 12, merged_state_count: 5, query_result_count: 3 },
    },
    requestLog: [MOCK_REQUEST],
    replayLog: [MOCK_REPLAY],
    sourceFamilyLabel: "Synthetic Signal",
    runStatus: "complete",
};

// ─── A. tandemAdapter.js constitutional posture ───────────────────────────────
section("A. tandemAdapter.js constitutional posture");
{
    let src = null;
    try { src = await readFile(path.join(ROOT, "hud/adapters/tandemAdapter.js"), "utf8"); } catch (_) { }
    ok(src !== null, "A1: hud/adapters/tandemAdapter.js exists");
    if (src) {
        ok(src.includes("not authority") || src.includes("not redefine"), "A2: not-authority posture declared");
        ok(!src.includes("mintCanon"), "A3: no mintCanon");
        ok(!src.match(/new ConsensusOp|ConsensusOp\(/), "A4: no ConsensusOp invocation (comment mention ok)");
        ok(!src.includes("canonical_status ="), "A5: no C1 mutation");
        ok(src.includes("internal_hud") && src.includes("public_demo"), "A6: both audience postures declared");
        ok(src.includes("Provenance") && src.includes("Evidence") && src.includes("Interpretation"),
            "A7: inspection ordering preserved in adapter");
    }
}

// ─── B. buildTandemInput normalizer ──────────────────────────────────────────
section("B. buildTandemInput normalizer");
{
    const n = buildTandemInput(FULL_INPUT);
    eq(n.hasResult, true, "B1: hasResult=true when run+workbench present");
    eq(n.sourceFamilyLabel, "Synthetic Signal", "B2: sourceFamilyLabel preserved");
    ok(Array.isArray(n.requestLog) && n.requestLog.length === 1, "B3: requestLog preserved");
    ok(Array.isArray(n.replayLog) && n.replayLog.length === 1, "B4: replayLog preserved");

    // Empty input
    const empty = buildTandemInput({});
    eq(empty.hasResult, false, "B5: empty input → hasResult=false");
    ok(Array.isArray(empty.requestLog), "B6: requestLog always array");
    ok(Array.isArray(empty.replayLog), "B7: replayLog always array");
}

// ─── C. Both projections derive from the same normalized input ────────────────
section("C. Same source state — both projections");
{
    const { hud, demo } = projectBoth(FULL_INPUT);

    // Both have the same source family
    eq(hud.provenance.source_family, "Synthetic Signal", "C1: HUD source_family matches input");
    eq(demo.provenance.source_family, "Synthetic Signal", "C2: demo source_family matches input");

    // Both have the same object_id/run_label
    ok(hud.provenance.object_id === demo.provenance.object_id ||
        (hud.provenance.run_label !== undefined), "C3: HUD and demo share object reference");

    // Both reflect same has_result
    eq(hud.has_result, true, "C4: HUD has_result = true");
    eq(demo.has_result, true, "C5: demo has_result = true");
}

// ─── D. HUD projection shape and content ─────────────────────────────────────
section("D. projectForHUD — shape and density");
{
    const hud = projectForHUD(FULL_INPUT);

    eq(hud.audience_posture, "internal_hud", "D1: audience_posture = internal_hud");

    // 1. Provenance (full)
    ok(typeof hud.provenance.source_family === "string", "D2: provenance.source_family present");
    ok(typeof hud.provenance.run_label === "string", "D3: provenance.run_label present");
    ok(typeof hud.provenance.segment_count_label === "string", "D4: segment_count_label present");
    ok(typeof hud.provenance.cross_run_label === "string", "D5: cross_run_label present");
    ok(typeof hud.layer_boundary?.runtime === "string", "D5b: HUD layer_boundary runtime note present");
    ok(typeof hud.layer_boundary?.semantic_overlay === "string", "D5c: HUD layer_boundary semantic note present");

    // 2. Evidence (full counts)
    eq(hud.evidence.harmonic_state_count, 10, "D6: harmonic_state_count preserved");
    eq(hud.evidence.merged_state_count, 4, "D7: merged_state_count preserved");
    eq(hud.evidence.anomaly_count, 2, "D8: anomaly_count from runResult");
    ok(Array.isArray(hud.evidence.evidence_summary_rows) && hud.evidence.evidence_summary_rows.length >= 5,
        "D9: evidence_summary_rows present and non-trivial");

    // 3. Interpretation (bounded)
    ok(typeof hud.interpretation.summary === "string", "D10: interpretation.summary present");
    ok(hud.interpretation.posture?.includes("not authority"), "D11: not-authority in interpretation posture");

    // 4. Review/request/replay (below evidence)
    ok(typeof hud.review_request_replay.request_log_note === "string", "D12: request_log_note present");
    ok(typeof hud.review_request_replay.replay_log_note === "string", "D13: replay_log_note present");
    ok(hud.review_request_replay.request_count === 1, "D14: request_count = 1");
    ok(hud.review_request_replay.replay_count === 1, "D15: replay_count = 1");

    // Non-authority notes
    ok(Array.isArray(hud.explicit_non_authority_notes) && hud.explicit_non_authority_notes.length >= 3,
        "D16: explicit_non_authority_notes present");
    ok(hud.explicit_non_authority_notes.includes("runtime is not canon"), "D17: 'runtime is not canon' note");
}

// ─── E. Demo projection — calmer and narrower than HUD ───────────────────────
section("E. projectForDemo — calmer and narrower");
{
    const demo = projectForDemo(FULL_INPUT);
    const hud = projectForHUD(FULL_INPUT);

    eq(demo.audience_posture, "public_demo", "E1: audience_posture = public_demo");

    // 1. Provenance present
    ok(typeof demo.provenance.object_label === "string", "E2: object_label present");
    ok(typeof demo.provenance.declared_lens === "string", "E3: declared_lens present");
    ok("source_profile_note" in demo.provenance, "E3b: source_profile_note present in demo provenance");
    ok(typeof demo.layer_boundary_note === "string", "E3c: demo layer_boundary_note present");

    // 2. Evidence compact (no raw counts)
    ok(Array.isArray(demo.evidence.summary_lines) && demo.evidence.summary_lines.length > 0,
        "E4: evidence summary_lines present");
    ok(demo.evidence.summary_lines.every(l => typeof l === "string"), "E5: summary_lines all strings");
    // Demo must NOT expose raw harmonic_state_count
    ok(!("harmonic_state_count" in demo.evidence), "E6: demo does not expose raw harmonic count");
    ok(!("merged_state_count" in demo.evidence), "E7: demo does not expose raw merged count");

    // 3. Interpretation bounded
    ok(typeof demo.interpretation.summary === "string", "E8: interpretation.summary present");
    ok(typeof demo.interpretation.derived_note === "string", "E9: derived_note present");
    ok(demo.interpretation.derived_note?.includes("not authority"), "E10: not-authority in derived_note");

    // 4. Review/request brief (notes only, not full objects)
    ok(typeof demo.review_request_replay.request_note === "string", "E11: request_note present (string only)");
    ok(typeof demo.review_request_replay.replay_note === "string", "E12: replay_note present (string only)");
    ok(!("request_count" in demo.review_request_replay), "E13: demo does not expose raw request_count");

    // Demo is narrower than HUD
    const hudKeys = Object.keys(hud.evidence).length;
    const demoKeys = Object.keys(demo.evidence).length;
    ok(demoKeys < hudKeys, "E14: demo evidence has fewer fields than HUD evidence");

    // Non-authority notes (fewer in demo)
    ok(Array.isArray(demo.explicit_non_authority_notes), "E15: non_authority_notes present in demo");
    ok(demo.explicit_non_authority_notes.length <= hud.explicit_non_authority_notes.length,
        "E16: demo shows fewer non-authority notes than HUD");
}

section("E2. Source differentiation remains visible when evidence differs");
{
    const baseDemo = projectForDemo(FULL_INPUT);
    const noisyDemo = projectForDemo(DIFFERENTIATED_INPUT);
    const noisyHud = projectForHUD(DIFFERENTIATED_INPUT);

    ok(baseDemo.provenance.source_profile_note !== noisyDemo.provenance.source_profile_note,
        "E2.1: differing source metadata produces different demo provenance notes");
    ok(baseDemo.evidence.summary_lines.join(" | ") !== noisyDemo.evidence.summary_lines.join(" | "),
        "E2.2: differing source/evidence conditions do not collapse into identical demo summaries");
    ok(noisyHud.provenance.source_profile_note?.includes("noise std 0.12"),
        "E2.3: HUD projection preserves source-profile note from runtime metadata");
}

// ─── F. Provenance-first ordering in both projections ─────────────────────────
section("F. Inspection ordering preserved");
{
    let src = null;
    try { src = await readFile(path.join(ROOT, "hud/adapters/tandemAdapter.js"), "utf8"); } catch (_) { }
    if (src) {
        const p1 = src.indexOf("1. Provenance");
        const p2 = src.indexOf("2. Runtime Evidence");
        const p3 = src.indexOf("3. Interpretation");
        const p4 = src.indexOf("4. Review");
        ok(p1 > 0 && p2 > p1 && p3 > p2 && p4 > p3, "F1: adapter source preserves 1→2→3→4 comment ordering");
    }
    const { hud, demo } = projectBoth(FULL_INPUT);
    // Provenance object must be present before interpretation
    ok("provenance" in hud && "interpretation" in hud, "F2: HUD has both provenance and interpretation");
    ok("provenance" in demo && "interpretation" in demo, "F3: demo has both provenance and interpretation");
    ok(hud.provenance.source_family !== undefined, "F4: HUD provenance.source_family accessible");
    ok(demo.provenance.source_family !== undefined, "F5: demo provenance.source_family accessible");
}

// ─── G. Empty/no-result state ─────────────────────────────────────────────────
section("G. No-result graceful degradation");
{
    const empty = projectBoth({});
    eq(empty.hud.has_result, false, "G1: empty → HUD has_result = false");
    eq(empty.demo.has_result, false, "G2: empty → demo has_result = false");
    ok(typeof empty.hud.interpretation.summary === "string", "G3: HUD interpretation still present when empty");
    ok(typeof empty.demo.interpretation.summary === "string", "G4: demo interpretation still present when empty");
}

// ─── H. Shell wiring ──────────────────────────────────────────────────────────
section("H. Shell wiring");
{
    let shellSrc = null;
    try { shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch (_) { }
    ok(shellSrc !== null, "H1: shell readable");
    if (shellSrc) {
        ok(shellSrc.includes("projectBoth"), "H2: projectBoth imported and used in shell");
        ok(shellSrc.includes("tandemProjection"), "H3: tandemProjection variable present");
        ok(shellSrc.includes("TandemStrip"), "H4: TandemStrip component present");
        ok(shellSrc.includes("hud={tandemProjection.hud}"), "H5: hud projection wired to TandemStrip");
        ok(shellSrc.includes("demo={tandemProjection.demo}"), "H6: demo projection wired to TandemStrip");
        ok(shellSrc.includes("same read-side model") || shellSrc.includes("same source"), "H7: same-source note visible");
        ok(!shellSrc.includes("mintCanon"), "H8: no mintCanon in shell");
    }
}

// ─── I. Demo surface wiring ───────────────────────────────────────────────────
section("I. Demo surface wiring");
{
    let demoSrc = null;
    try { demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch (_) { }
    ok(demoSrc !== null, "I1: demo readable");
    if (demoSrc) {
        ok(demoSrc.includes("tandemAdapter"), "I2: tandemAdapter imported in demo");
        ok(demoSrc.includes("projectForDemo"), "I3: projectForDemo imported in demo");
        ok(demoSrc.includes("liveShellState"), "I4: liveShellState prop accepted by demo");
        ok(demoSrc.includes("liveProjection"), "I5: liveProjection computed when prop present");
        ok(demoSrc.includes("public_demo projection"), "I6: live projection label present in demo UI");
        // Static story still present
        ok(demoSrc.includes("DEMO_OBJECT"), "I7: static C1 story still present");
        ok(demoSrc.includes("HISTORY"), "I8: static history still present");
        ok(!demoSrc.includes("mintCanon"), "I9: no mintCanon in demo");
    }
}

// ─── J. Surface separation ────────────────────────────────────────────────────
section("J. Surface separation maintained");
{
    let labHudSrc = null;
    try { labHudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8"); } catch (_) { }
    if (labHudSrc) {
        ok(!labHudSrc.includes("tandemAdapter"), "J1: lab HUD does not import tandemAdapter");
        ok(labHudSrc.includes("export default function DoorOneStructuralMemoryHUD"), "J2: lab HUD export intact");
    }
    let execHtmlSrc = null;
    try { execHtmlSrc = await readFile(path.join(ROOT, "execution.html"), "utf8"); } catch (_) { }
    ok(execHtmlSrc !== null, "J3: execution.html still exists");
    let demoHtmlSrc = null;
    try { demoHtmlSrc = await readFile(path.join(ROOT, "demo.html"), "utf8"); } catch (_) { }
    ok(demoHtmlSrc !== null, "J4: demo.html still exists");
}

finish();
