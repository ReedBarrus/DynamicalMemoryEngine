// test_door_one_c1_consultation_strip.js
//
// Contract tests for the C1 consultation strip surface.
//
// Scope:
//   - result record shape (out_canon/)
//   - HUD component prop contract
//   - boundary integrity: no authority drift, no mutation, read-side only
//   - graceful empty state (null result)
//   - field presence and values
//
// Boundary contract:
//   - strip is read-side only
//   - strip does not alter the live C1 object
//   - strip does not alter Door One runtime
//   - strip does not represent authority
//   - strip does not instantiate Packet 3

import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// REPO_ROOT = the working directory where all files live (/home/Engineer)
const REPO_ROOT = path.resolve(__dirname, "../..");

// ─── Test harness ─────────────────────────────────────────────────────────────
let PASS = 0, FAIL = 0;
function section(t) { console.log(`\n── ${t} ──`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ✓ ${label}`); }
    else { FAIL++; console.error(`  ✗ ${label}`); }
}
function eq(a, b, label) { ok(Object.is(a, b), `${label}${Object.is(a, b) ? "" : " (expected " + JSON.stringify(b) + ", got " + JSON.stringify(a) + ")"}`); }
function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL === 0 ? "  ALL TESTS PASSED ✓" : "  TESTS FAILED ✗");
    if (FAIL > 0) process.exit(1);
}

// ─── A. out_canon/ placement and file existence ────────────────────────────────

section("A. out_canon/ placement and result record");

const OUT_CANON_DIR = path.join(REPO_ROOT, "out_canon");
const RESULT_PATH = path.join(OUT_CANON_DIR, "c1_first_consultation_result.json");
const LIVE_C1_PATH = path.join(REPO_ROOT, "canon", "C1_BASELINE_SINE400_001.json");

let resultJson = null;
let liveC1Json = null;
try {
    resultJson = JSON.parse(await readFile(RESULT_PATH, "utf8"));
    ok(true, "A1: c1_first_consultation_result.json exists in out_canon/");
} catch (_) {
    ok(false, "A1: c1_first_consultation_result.json exists in out_canon/ — FILE MISSING");
}

try {
    liveC1Json = JSON.parse(await readFile(LIVE_C1_PATH, "utf8"));
    ok(true, "A2: live C1 object exists in canon/");
} catch (_) {
    ok(false, "A2: live C1 object exists in canon/ — FILE MISSING");
}

// The result should NOT be in canon/ (it's a generated output, not an authority object)
try {
    await access(path.join(REPO_ROOT, "canon", "c1_first_consultation_result.json"));
    ok(false, "A3: consultation result must NOT live in canon/ (authority placement)");
} catch (_) {
    ok(true, "A3: consultation result correctly absent from canon/ (lives in out_canon/ only)");
}

// ─── B. Result record shape ────────────────────────────────────────────────────

section("B. Result record shape and required fields");

const r = resultJson;
ok(r !== null, "B1: result record parsed successfully");
eq(r?.record_type, "c1_first_consultation_result", "B2: record_type correct");

// Constitutional posture fields
ok(r?.constitutional_posture?.c1_object_not_modified === true, "B3: c1_object_not_modified = true");
ok(r?.constitutional_posture?.packet3_not_instantiated === true, "B4: packet3_not_instantiated = true");
ok(r?.constitutional_posture?.read_side_only === true, "B5: read_side_only = true");

// consultation_target fields
ok(typeof r?.consultation_target?.canonical_id === "string", "B6: canonical_id present in target");
ok(typeof r?.consultation_target?.canonical_status === "string", "B7: canonical_status present in target");
ok(typeof r?.consultation_target?.challenge_posture === "string", "B8: challenge_posture present in target");
ok(typeof r?.consultation_target?.source_family === "string", "B9: source_family present in target");

// consultation_A fields (used by HUD strip)
const cA = r?.consultation_A;
ok(typeof cA?.decision === "string", "B10: decision present in consultation_A");
ok(typeof cA?.reason === "string", "B11: reason present in consultation_A");
ok(typeof cA?.requested_use === "string", "B12: requested_use present in consultation_A");
ok(typeof cA?.effective_scope_note === "string", "B13: effective_scope_note present on allow result");
eq(cA?.decision, "allow", "B14: first consultation decision = allow (same-family)");

// Negative control
eq(r?.consultation_B_negative_control?.decision, "deny", "B15: negative control decision = deny (cross-family)");

// Challenge pressure
ok(typeof r?.challenge_pressure === "string", "B16: challenge_pressure present");
ok(typeof r?.review_judgment === "string", "B17: review_judgment present");
eq(r?.review_judgment, "keep_promoted", "B18: first consultation judgment = keep_promoted");

// ─── C. Seven HUD-strip fields all present ────────────────────────────────────

section("C. All seven required strip fields resolvable from result record");

// The strip shows:
// canonical_id, canonical_status, requested_use, decision, reason,
// challenge_posture, effective_scope_note
const HUD_FIELDS = [
    ["canonical_id", r?.consultation_target?.canonical_id],
    ["canonical_status", r?.consultation_target?.canonical_status],
    ["requested_use", r?.consultation_A?.requested_use],
    ["decision", r?.consultation_A?.decision],
    ["reason", r?.consultation_A?.reason],
    ["challenge_posture", r?.consultation_target?.challenge_posture],
    ["effective_scope_note", r?.consultation_A?.effective_scope_note],
];
for (const [field, val] of HUD_FIELDS) {
    ok(typeof val === "string" && val.length > 0, `C1: strip field '${field}' is non-empty string`);
}

// ─── D. HUD component file integrity ──────────────────────────────────────────

section("D. HUD component file integrity");

let hudSrc = null;
try {
    hudSrc = await readFile(path.join(REPO_ROOT, "hud", "DoorOneStructuralMemoryHud.jsx"), "utf8");
    ok(true, "D1: DoorOneStructuralMemoryHud.jsx readable");
} catch (_) {
    ok(false, "D1: DoorOneStructuralMemoryHud.jsx readable — FILE MISSING");
}

if (hudSrc) {
    ok(hudSrc.includes("C1ConsultationStrip"), "D2: C1ConsultationStrip component defined");
    ok(hudSrc.includes("c1ConsultationResult = null"), "D3: c1ConsultationResult prop with null default");
    ok(hudSrc.includes("Plane 5 — Door Two Canon Consultation"), "D4: Plane 5 eyebrow present");
    ok(hudSrc.includes("Read-side only") || hudSrc.includes("read-side"), "D5: read-side posture text present");
    ok(hudSrc.includes("out_canon/"), "D6: out_canon/ sourcing noted in HUD");
    ok(hudSrc.includes("not authority"), "D7: 'not authority' disclaimer present");
    ok(!hudSrc.includes("consultC1("), "D8: consultC1() NOT called from HUD (strip is read-only consumer)");
    ok(!hudSrc.includes("c1Object.canonical_status ="), "D9: no mutation of C1 object in HUD");
    // The strip should gracefully handle null
    ok(hudSrc.includes("No consultation result loaded"), "D10: graceful null state message present");
    // Plane 5 appears after Plane 4 (Review Surfaces)
    // Plane 5 is defined as a component above the main export, then rendered after Plane 4.
    // Check that C1ConsultationStrip is rendered after the Plane 4 SectionShell in the main return.
    const p4Idx = hudSrc.indexOf("Plane 4 — Review Surfaces");
    const stripRenderIdx = hudSrc.indexOf("<C1ConsultationStrip");
    ok(p4Idx > 0 && stripRenderIdx > p4Idx, "D11: <C1ConsultationStrip> rendered after Plane 4 in main return");
    // No Packet 3 references added
    ok(!hudSrc.includes("CAND-RETURNLIKE") && !hudSrc.includes("Packet3"), "D12: no Packet 3 references in HUD");
}

// ─── E. Demo file integrity ────────────────────────────────────────────────────

section("E. Demo file integrity");

let demoSrc = null;
try {
    demoSrc = await readFile(path.join(REPO_ROOT, "hud", "DoorOneStructuralMemoryHudDemo.jsx"), "utf8");
    ok(true, "E1: DoorOneStructuralMemoryHudDemo.jsx readable");
} catch (_) {
    ok(false, "E1: DoorOneStructuralMemoryHudDemo.jsx readable — FILE MISSING");
}

if (demoSrc) {
    ok(demoSrc.includes("out_canon/c1_first_consultation_result.json"), "E2: imports result from out_canon/");
    ok(demoSrc.includes("c1ConsultationResult"), "E3: passes c1ConsultationResult prop to HUD");
    ok(demoSrc.includes("read-side only") || demoSrc.includes("Read-side"), "E4: read-side posture comment present");
    // Verify the prop is passed to the HUD render
    ok(demoSrc.includes("c1ConsultationResult={c1ConsultationResult}"), "E5: prop wired into DoorOneStructuralMemoryHUD");
}

// ─── F. Live C1 object unchanged ──────────────────────────────────────────────

section("F. Live C1 object unchanged");

const c1 = liveC1Json;
eq(c1?.canonical_id, "C1_BASELINE_SINE400_001", "F1: canonical_id unchanged");
eq(c1?.canonical_status, "promoted", "F2: canonical_status still promoted");
eq(c1?.canonical_version, 1, "F3: canonical_version still 1");
eq(c1?.runtime_handoff_enabled, true, "F4: runtime_handoff_enabled still true");
eq(c1?.challenge_posture, "none_active", "F5: challenge_posture still none_active");
eq(c1?.supersession_ref, null, "F6: supersession_ref still null");
eq(c1?.revocation_ref, null, "F7: revocation_ref still null");

// ─── G. Boundary integrity ────────────────────────────────────────────────────

section("G. Boundary integrity");

// The result record itself must not contain canon-claiming language
const resultStr = JSON.stringify(r ?? {});
ok(!resultStr.includes('"is_canon"'), "G1: no is_canon field in result record");
ok(!resultStr.includes('"promoted_claim"'), "G2: no promoted_claim field (canon-only) in result record");
ok(!resultStr.includes('"prediction"'), "G3: no prediction field in result record");

// HUD must not import consultC1 helper (read-only consumer only)
if (hudSrc) {
    ok(!hudSrc.includes("from \"../canon/consultC1"), "G4: HUD does not import consultC1 helper");
    ok(!hudSrc.includes("import consultC1"), "G5: HUD does not import consultC1 helper (any path)");
}

// Result record correctly maps decision, status, scope
eq(r?.consultation_A?.decision, "allow", "G6: Consultation A = allow");
eq(r?.consultation_B_negative_control?.decision, "deny", "G7: Consultation B = deny (negative control)");
ok(r?.challenge_pressure === "none", "G8: no challenge pressure recorded");
eq(r?.review_judgment, "keep_promoted", "G9: judgment = keep_promoted");

finish();
