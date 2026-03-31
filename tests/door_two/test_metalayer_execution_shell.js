// tests/door_two/test_metalayer_execution_shell.js
//
// Contract tests for hud/MetaLayerObjectExecutionShell.jsx
//
// Scope:
//   - file placement and existence
//   - source family catalog correctness (wired vs planned)
//   - constitutional posture in source
//   - four-region structure (Control, Status, Results, Request)
//   - visible fencing of unsupported families
//   - visible fencing of consultation/activation stubs
//   - lab HUD and public demo untouched
//   - calls DoorOneOrchestrator (not a hidden seam)
//   - no authority drift

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

let PASS = 0, FAIL = 0;
function section(t) { console.log(`\n── ${t} ──`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ✓ ${label}`); }
    else       { FAIL++; console.error(`  ✗ ${label}`); }
}
function eq(a, b, label) { ok(Object.is(a,b), `${label}${Object.is(a,b)?"":" (expected "+JSON.stringify(b)+", got "+JSON.stringify(a)+")"}`); }
function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL===0?"  ALL TESTS PASSED ✓":"  TESTS FAILED ✗");
    if(FAIL>0) process.exit(1);
}

let shellSrc = null, execMainSrc = null, execHtmlSrc = null;
let labHudSrc = null, demoSrc = null;
try { shellSrc    = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch(_){}
try { execMainSrc = await readFile(path.join(ROOT, "hud/execution_main.jsx"), "utf8"); } catch(_){}
try { execHtmlSrc = await readFile(path.join(ROOT, "execution.html"), "utf8"); } catch(_){}
try { labHudSrc   = await readFile(path.join(ROOT, "DoorOneStructuralMemoryHud.jsx"), "utf8"); } catch(_){}
try { demoSrc     = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch(_){}

// ─── A. File placement ────────────────────────────────────────────────────────
section("A. File placement and existence");
ok(shellSrc    !== null, "A1: hud/MetaLayerObjectExecutionShell.jsx exists");
ok(execMainSrc !== null, "A2: hud/execution_main.jsx exists");
ok(execHtmlSrc !== null, "A3: execution.html exists");

if (execMainSrc) {
    ok(execMainSrc.includes("MetaLayerObjectExecutionShell"),  "A4: execution_main imports shell");
    ok(!execMainSrc.match(/^import.*DoorOneStructuralMemoryHud/m),  "A5: execution_main does not import lab HUD");
    ok(!execMainSrc.match(/^import.*MetaLayerConsultationDemo/m),  "A6: execution_main does not import public demo");
}
if (execHtmlSrc) {
    ok(execHtmlSrc.includes("execution_main.jsx"),             "A7: execution.html points to execution_main.jsx");
    ok(execHtmlSrc.includes("Execution Shell"),                "A8: execution.html has appropriate title");
}

// ─── B. Constitutional posture ────────────────────────────────────────────────
section("B. Constitutional posture");
if (shellSrc) {
    ok(shellSrc.includes("not authority") || shellSrc.includes("Not authority"),    "B1: not-authority disclaimer");
    ok(shellSrc.includes("runtime is not canon") || shellSrc.includes("below canon"), "B2: runtime-is-not-canon declared");
    ok(shellSrc.includes("read-side only") || shellSrc.includes("Read-side"),        "B3: read-side posture");
    ok(shellSrc.includes("not automatic"),                                            "B4: request actions are not automatic");
    ok(!shellSrc.includes("mintCanon") && !shellSrc.includes("mint_canon"),          "B5: no mintCanon calls");
    ok(!shellSrc.includes("canonical_status ="),                                     "B6: no C1 mutation");
    ok(!shellSrc.includes("c1Object.canonical_status ="),                            "B7: no live C1 object mutation");
}

// ─── C. Source family catalog ─────────────────────────────────────────────────
section("C. Source family catalog");
if (shellSrc) {
    // Wired families
    ok(shellSrc.includes("synthetic_signal"),     "C1: synthetic_signal family present");
    ok(shellSrc.includes('wired:       true'),     "C2: at least one family marked wired:true");

    // Planned families
    ok(shellSrc.includes("smart_tag_lifecycle"),   "C3: smart_tag_lifecycle present");
    ok(shellSrc.includes("presence_signal"),       "C4: presence_signal present");
    ok(shellSrc.includes("derived_trace"),         "C5: derived_trace present");
    ok(shellSrc.includes("audio_real_source"),     "C6: audio_real_source present");

    // Planned families are explicitly marked
    ok(shellSrc.includes("planned"),               "C7: 'planned' badge used for unwired families");
    ok(shellSrc.includes("not yet wired"),         "C8: 'not yet wired' text for unsupported families");
}

// ─── D. Four shell regions ────────────────────────────────────────────────────
section("D. Four shell regions");
if (shellSrc) {
    ok(shellSrc.includes("Control / Orchestration") || shellSrc.includes("A — Control"), "D1: Region A present");
    ok(shellSrc.includes("Run Status") || shellSrc.includes("B — Run Status"),            "D2: Region B present");
    ok(shellSrc.includes("Inspection / Results") || shellSrc.includes("C — Inspection"), "D3: Region C present");
    ok(shellSrc.includes("Request Surface") || shellSrc.includes("D — Request"),         "D4: Region D present");

    // Correct region order
    const aIdx = shellSrc.indexOf("Control / Orchestration");
    const bIdx = shellSrc.indexOf("Run Status");
    const cIdx = shellSrc.indexOf("Inspection / Results");
    const dIdx = shellSrc.indexOf("Request Surface");
    ok(aIdx > 0 && bIdx > aIdx && cIdx > bIdx && dIdx > cIdx, "D5: regions in correct A→B→C→D order");

    // Results region preserves read-side ordering
    const p1 = shellSrc.indexOf("Provenance");
    const p2 = shellSrc.indexOf("Runtime Evidence");
    const p3 = shellSrc.indexOf("Interpretation");
    const p4 = shellSrc.indexOf("Review / Request");
    ok(p1 > 0 && p2 > p1 && p3 > p2 && p4 > p3, "D6: provenance-first ordering in results region");
}

// ─── E. Lawful seam usage ─────────────────────────────────────────────────────
section("E. Lawful seam usage");
if (shellSrc) {
    ok(shellSrc.includes("DoorOneOrchestrator"),    "E1: calls DoorOneOrchestrator");
    ok(shellSrc.includes("CrossRunSession"),        "E2: uses CrossRunSession");
    ok(shellSrc.includes("DoorOneWorkbench"),       "E3: uses DoorOneWorkbench");
    ok(shellSrc.includes("makeTestSignal"),         "E4: uses makeTestSignal fixture for synthetic family");
    ok(!shellSrc.includes("fetch("),               "E5: no hidden fetch calls (no secret HTTP bridge)");
    ok(!shellSrc.includes("import(\"node:"),       "E6: no Node.js-specific imports in browser component");
}

// ─── F. Request surface fencing ──────────────────────────────────────────────
section("F. Request surface fencing");
if (shellSrc) {
    ok(shellSrc.includes("stub"),                   "F1: consultation/activation stubs labeled as stubs");
    ok(shellSrc.includes("not yet wired in v0"),    "F2: v0 stub status declared");
    ok(shellSrc.includes("request consultation"),   "F3: consultation request button present");
    ok(shellSrc.includes("request activation"),     "F4: activation request button present");
    ok(shellSrc.includes("not automatic"),          "F5: not-automatic disclaimer in request region");
}

// ─── G. Separation — other surfaces untouched ─────────────────────────────────
section("G. Separation from other surfaces");
if (shellSrc) {
    ok(!shellSrc.includes("DoorOneStructuralMemoryHudDemo"),     "G1: no lab HUD demo import");
    ok(!shellSrc.match(/import.*MetaLayerConsultationDemo/),     "G2: no public demo import");
}
if (labHudSrc) {
    ok(!labHudSrc.includes("MetaLayerObjectExecutionShell"),     "G3: lab HUD unchanged — no shell import");
    ok(labHudSrc.includes("export default function DoorOneStructuralMemoryHUD"), "G4: lab HUD export intact");
}
if (demoSrc) {
    ok(!demoSrc.includes("MetaLayerObjectExecutionShell"),       "G5: public demo unchanged");
}

finish();
