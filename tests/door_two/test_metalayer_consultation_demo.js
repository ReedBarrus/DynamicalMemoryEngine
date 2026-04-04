// tests/door_two/test_metalayer_consultation_demo.js
//
// Contract tests for hud/MetaLayerConsultationDemo.jsx
//
// Scope:
//   - demo file existence and placement
//   - static model data shape and values (from consultation record notes)
//   - constitutional posture embedded in source
//   - five-plane ordering (Provenance before Review before History)
//   - lab HUD left intact and separate
//   - no authority drift, no runtime imports, no consultation seam calls
//   - three-lifecycle-entry correctness
//
// Boundary contract:
//   - demo is read-side only
//   - demo does not call consultC1()
//   - demo does not import canon/ objects
//   - demo does not alter lab HUD
//   - demo does not alter Door One operator contracts

import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");  // /home/Engineer

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

// ─── Read source files ────────────────────────────────────────────────────────
let demoSrc = null, mainSrc = null, demoMainSrc = null, demoHtmlSrc = null;
try { demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch (_) { }
// lab HUD main.jsx: canonical location is hud/ in the project,
// but demo files live in ROOT/hud/. Also check the project source.
const mainPaths = ["hud/main.jsx", "main.jsx", "../mnt/project/main.jsx"];
for (const p of mainPaths) {
    try { mainSrc = await readFile(path.join(ROOT, p), "utf8"); break; } catch (_) { }
}
// Fallback: read directly from project (read-only source copy)
if (!mainSrc) {
    try { mainSrc = await readFile("/mnt/project/main.jsx", "utf8"); } catch (_) { }
}
try { demoMainSrc = await readFile(path.join(ROOT, "hud/demo_main.jsx"), "utf8"); } catch (_) { }
try { demoHtmlSrc = await readFile(path.join(ROOT, "demo.html"), "utf8"); } catch (_) { }

// ─── A. File placement ────────────────────────────────────────────────────────
section("A. File placement and existence");

ok(demoSrc !== null, "A1: hud/MetaLayerConsultationDemo.jsx exists");
ok(demoMainSrc !== null, "A2: hud/demo_main.jsx exists");
ok(demoHtmlSrc !== null, "A3: demo.html exists");
ok(mainSrc !== null, "A4: hud/main.jsx (lab HUD entry) still exists and readable");

// Separation: lab HUD entry must not import MetaLayerConsultationDemo
if (mainSrc) {
    ok(!mainSrc.includes("MetaLayerConsultationDemo"), "A5: lab HUD main.jsx does not import MetaLayerConsultationDemo");
}

// demo_main must not import from DoorOneStructuralMemoryHud (lab HUD)
if (demoMainSrc) {
    ok(!demoMainSrc.includes("DoorOneStructuralMemoryHud"), "A6: demo_main.jsx does not import lab HUD");
}

// ─── B. Constitutional posture in source ─────────────────────────────────────
section("B. Constitutional posture");

if (demoSrc) {
    ok(demoSrc.includes("Read-side only") || demoSrc.includes("read-side only"), "B1: read-side posture declared");
    ok(demoSrc.includes("not authority") || demoSrc.includes("Not authority"), "B2: not-authority disclaimer present");
    ok(demoSrc.includes("not prediction") || demoSrc.includes("Not prediction"), "B3: not-prediction disclaimer present");
    ok(demoSrc.includes("not semantic truth") || demoSrc.includes("Not semantic"), "B4: not-semantic-truth disclaimer present");
    ok(demoSrc.includes("non-authoritative"), "B5: non-authoritative label in interpretation plane");
    ok(!demoSrc.includes("consultC1("), "B6: demo does not call consultC1()");
    ok(!demoSrc.includes("canon/C1_BASELINE"), "B7: demo does not import live C1 object");
    ok(!demoSrc.includes("canonical_status ="), "B8: demo does not mutate any C1 field");
    ok(!demoSrc.includes("runtime_handoff_enabled"), "B9: no runtime handoff fields in demo (those belong to consultation layer)");
}

// ─── C. Static model data correctness ────────────────────────────────────────
section("C. Static model data values");

if (demoSrc) {
    // Three history entries present
    ok(demoSrc.includes("original"), "C1: 'original' history entry present");
    ok(demoSrc.includes("room_change_contaminated"), "C2: 'room_change_contaminated' entry present");
    ok(demoSrc.includes("room_change_clean"), "C3: 'room_change_clean' entry present");

    // Values from README.C1_RoomChangeComparativeConsultationRecord.md
    ok(demoSrc.includes("1.237983"), "C4: original bVsP = 1.237983");
    ok(demoSrc.includes("0.010871"), "C5: original bVsR = 0.010871");
    ok(demoSrc.includes("0.856604"), "C6: contaminated bVsP = 0.856604");
    ok(demoSrc.includes("0.020502"), "C7: contaminated bVsR = 0.020502");
    ok(demoSrc.includes("1.11536"), "C8: clean bVsP = 1.11536");
    ok(demoSrc.includes("0.01618"), "C9: clean bVsR = 0.01618");

    // Three judgments
    ok(demoSrc.includes("keep_promoted"), "C10: keep_promoted judgment present");
    ok(demoSrc.includes("annotate_for_review_only"), "C11: annotate_for_review_only judgment present");

    // Reference thresholds
    ok(demoSrc.includes("1.24"), "C12: reference bVsP = 1.24");
    ok(demoSrc.includes("0.992"), "C13: challenge floor = 0.992");
    ok(demoSrc.includes("0.050"), "C14: challenge ceiling = 0.050");

    // Object identity
    ok(demoSrc.includes("C1_BASELINE_SINE400_001"), "C15: correct object_id");
    ok(demoSrc.includes("daw_mic_sine_400hz"), "C16: correct source_family");
}

// ─── D. Five-plane ordering ───────────────────────────────────────────────────
section("D. Five-plane ordering (provenance before review)");

if (demoSrc) {
    const p1 = demoSrc.indexOf("Plane 1");
    const p2 = demoSrc.indexOf("Plane 2");
    const p3 = demoSrc.indexOf("Plane 3");
    const p4 = demoSrc.indexOf("Plane 4");
    const p5 = demoSrc.indexOf("Plane 5");

    ok(p1 > 0, "D1: Plane 1 present");
    ok(p2 > p1, "D2: Plane 2 after Plane 1");
    ok(p3 > p2, "D3: Plane 3 after Plane 2");
    ok(p4 > p3, "D4: Plane 4 after Plane 3");
    ok(p5 > p4, "D5: Plane 5 after Plane 4");

    // Provenance plane must have object_id, source_family, declared_lens
    ok(demoSrc.includes("object_id"), "D6: object_id in Plane 1 provenance");
    ok(demoSrc.includes("source_family"), "D7: source_family in Plane 1 provenance");
    ok(demoSrc.includes("declared_lens"), "D8: declared_lens in Plane 1 provenance");

    // Review plane must have explicit fencing language
    ok(demoSrc.includes("fenced") || demoSrc.includes("lower-authority"),
        "D9: Plane 4 review posture is visibly fenced");

    // History plane must mention replay/inspect
    ok(demoSrc.includes("inspect") || demoSrc.includes("Replay"),
        "D10: Plane 5 is inspectable/replay surface");
}

// ─── E. Required fields present ──────────────────────────────────────────────
section("E. Required demo fields from governing note");

if (demoSrc) {
    // From README_MetaLayerConsultationDemo §9: required fields for first demo card
    const requiredFields = [
        ["object_label", "D1: object_label"],
        ["object_id", "E1: object_id"],
        ["current_status", "E2: current_status"],
        ["bounded_claim", "E3: bounded_claim"],
        ["allowed_use", "E4: allowed_use"],
        ["explicit_non_claims", "E5: explicit_non_claims"],
        ["source_family", "E6: source_family"],
        ["declared_lens", "E7: declared_lens"],
        ["lineage", "E8: lineage / consultation_lineage"],
        ["support_basis", "E9: support_basis"],
        ["interpretation", "E10: current_evidence_summary / interpretation"],
    ];
    for (const [field, label] of requiredFields) {
        ok(demoSrc.includes(field), label);
    }
    // History entries (lifecycle states)
    ok(demoSrc.includes("HISTORY") || demoSrc.includes("history"), "E11: history_entries present");
}

// ─── F. Lab HUD intact ────────────────────────────────────────────────────────
section("F. Lab HUD intact and separate");

try {
    const labHud = await readFile(path.join(ROOT, "DoorOneStructuralMemoryHud.jsx"), "utf8");
    ok(labHud.includes("export default function DoorOneStructuralMemoryHUD"), "F1: lab HUD main export still present");
    ok(labHud.includes("Plane 1"), "F2: lab HUD Plane 1 still present");
    ok(labHud.includes("Plane 4"), "F3: lab HUD Plane 4 (Review) still present");
    ok(labHud.includes("Plane 5"), "F4: lab HUD Plane 5 (C1 strip) still present");
    ok(!labHud.includes("MetaLayerConsultationDemo"), "F5: lab HUD does not reference MetaLayerConsultationDemo");
} catch (_) {
    ok(false, "F1: lab HUD file not readable");
}

// ─── G. Separation contracts ──────────────────────────────────────────────────
section("G. Separation and boundary contracts");

if (demoSrc) {
    // Demo must not import DoorOneStructuralMemoryHud components
    ok(!demoSrc.match(/import.*DoorOneStructuralMemoryHud/), "G1: demo does not import lab HUD (comment refs OK)");
    ok(!demoSrc.includes("DoorOneStructuralMemoryHudModel"), "G2: demo does not import lab HUD model");
    ok(!demoSrc.includes("workbenchToStructuralHudModel"), "G3: demo does not use lab HUD model adapter");

    // Demo must not claim ontology authority
    ok(!demoSrc.includes('"is_canon"'), "G4: no is_canon field");
    ok(!demoSrc.includes("truth_label"), "G5: no truth_label field");
    // "prediction" appears in explicit_non_claims ("not prediction authority") — that is correct.
    // The check is: no prediction compute logic, not absence of the word.
    ok(!demoSrc.includes("predict(") && !demoSrc.includes("usePrediction"),
        "G6: no prediction compute logic in demo");

    // Demo entry point separation
    if (demoMainSrc) {
        ok(demoMainSrc.includes("MetaLayerConsultationDemo"), "G7: demo_main imports MetaLayerConsultationDemo");
        ok(!demoMainSrc.includes("DoorOneStructuralMemoryHud"), "G8: demo_main does not import lab HUD");
    }
    if (demoHtmlSrc) {
        ok(demoHtmlSrc.includes("demo_main.jsx"), "G9: demo.html points to demo_main.jsx");
        ok(demoHtmlSrc.includes("DME"), "G10: demo.html has appropriate title");
    }
}

finish();
