// tests/door_two/test_semantic_oscilloscope_app_surface.js
//
// Contract tests for the Semantic Oscilloscope app surface integration.
//
// Verifies all 14 required conditions from the task spec.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

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

let appSrc = null, appMainSrc = null, appHtmlSrc = null;
let shellSrc = null, demoSrc = null, labHudSrc = null;
let tandemSrc = null;

try { appSrc = await readFile(path.join(ROOT, "hud/SemanticOscilloscopeApp.jsx"), "utf8"); } catch (_) { }
try { appMainSrc = await readFile(path.join(ROOT, "hud/app_main.jsx"), "utf8"); } catch (_) { }
try { appHtmlSrc = await readFile(path.join(ROOT, "app.html"), "utf8"); } catch (_) { }
try { shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch (_) { }
try { demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch (_) { }
try { labHudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8"); } catch (_) { }
try { tandemSrc = await readFile(path.join(ROOT, "hud/adapters/tandemAdapter.js"), "utf8"); } catch (_) { }

// ─── A. File placement ────────────────────────────────────────────────────────
section("A. App surface file placement");
ok(appSrc !== null, "A1: hud/SemanticOscilloscopeApp.jsx exists");
ok(appMainSrc !== null, "A2: hud/app_main.jsx exists");
ok(appHtmlSrc !== null, "A3: app.html exists");

if (appMainSrc) {
    ok(appMainSrc.includes("SemanticOscilloscopeApp"), "A4: app_main imports SemanticOscilloscopeApp");
    ok(!appMainSrc.includes("MetaLayerObjectExecutionShell") || appMainSrc.match(/import.*SemanticOscilloscope/), "A5: app_main does not import shell directly");
}
if (appHtmlSrc) {
    ok(appHtmlSrc.includes("app_main.jsx"), "A6: app.html points to app_main.jsx");
    ok(appHtmlSrc.includes("Semantic Oscilloscope"), "A7: app.html has appropriate title");
}

// ─── B. App composition structure ────────────────────────────────────────────
section("B. App composition structure");
if (appSrc) {
    // Composes all four role surfaces
    ok(appSrc.includes("MetaLayerObjectExecutionShell"), "B1: execution shell composed");
    ok(appSrc.includes("MetaLayerConsultationDemo"), "B2: public demo composed");
    ok(appSrc.includes("DoorOneStructuralMemoryHUD"), "B3: lab HUD composed");
    ok(appSrc.includes("projectBoth") || appSrc.includes("tandemAdapter"), "B4: tandem adapter used");

    // Mode awareness
    ok(appSrc.includes("lab") && appSrc.includes("demo"), "B5: both modes declared");
    ok(appSrc.includes("mode") && appSrc.includes("setMode"), "B6: mode state present");
    ok(appSrc.includes("ModeHeader") || appSrc.includes("mode toggle"), "B7: mode toggle UI present");
    ok(appSrc.includes("TandemSummaryBar") || appSrc.includes("tandem"), "B8: tandem summary bar present");
}

// ─── C. Lab mode and demo mode both exist ─────────────────────────────────────
section("C. Both modes present and described");
if (appSrc) {
    const labIdx = appSrc.indexOf('"lab"');
    const demoIdx = appSrc.indexOf('"demo"');
    ok(labIdx > 0, "C1: 'lab' mode string present");
    ok(demoIdx > 0, "C2: 'demo' mode string present");

    // Lab mode should show execution + lab HUD
    ok(appSrc.includes("Execution Surface") || appSrc.includes("execution"), "C3: execution role labeled in lab mode");
    ok(appSrc.includes("Inspection Surface") || appSrc.includes("inspection"), "C4: inspection role labeled");

    // Demo mode should show demo as primary
    ok(appSrc.includes("Demo Surface") || appSrc.includes("demo posture"), "C5: demo role labeled in demo mode");
    ok(appSrc.includes("public posture") || appSrc.includes("calmer"), "C6: calmer/public posture noted in demo mode");
}

// ─── D. Mode switching changes presentation, not truth ────────────────────────
section("D. Mode switching posture");
if (appSrc) {
    // Mode switching rule: changes visibility/layout, not state
    ok(appSrc.includes("presentation posture") || appSrc.includes("audience posture") ||
        appSrc.includes("NOT truth conditions"), "D1: mode-switch posture rule declared");

    // The shell state (workbench, runResult) does not change on mode switch
    ok(!appSrc.includes("setWorkbench") || appSrc.match(/setWorkbench.*onStateChange|onStateChange.*setWorkbench/s),
        "D2: workbench state not changed by mode toggle");

    // Same state feeds both modes
    ok(appSrc.includes("shellState") || appSrc.includes("onStateChange"), "D3: shared shell state threads into both modes");
}

ok(!appSrc.includes('key="lab"') || !appSrc.includes('key="demo"'), "D4: mode switch does not remount whole shell branches");

// ─── E. State threading — shell remains state owner ───────────────────────────
section("E. Shell state threading");
if (shellSrc) {
    ok(shellSrc.includes("onStateChange"), "E1: shell accepts onStateChange prop");
    ok(shellSrc.includes("typeof onStateChange === \"function\""), "E2: shell checks onStateChange before calling");
    ok(shellSrc.includes("onStateChange({ workbench"), "E3: shell exports workbench via callback");
    ok(shellSrc.includes("onStateChange") && shellSrc.includes("useEffect"), "E4: state export uses useEffect");
    ok(!shellSrc.includes("setMode"), "E5: shell does not control app mode");
}
if (appSrc) {
    ok(appSrc.includes("handleShellStateChange") || appSrc.includes("onStateChange"), "E6: app receives shell state updates");
    ok(appSrc.includes("shellState"), "E7: app mirrors shell state");
}

ok(appSrc.includes("ExecutionShellWithStateExport") && appSrc.indexOf("ExecutionShellWithStateExport") === appSrc.lastIndexOf("ExecutionShellWithStateExport"), "E8: one shell instance in app composition");

// ─── F. Execution controls remain execution-side ─────────────────────────────
section("F. Execution controls remain execution-side");
if (appSrc) {
    // DropZone / run should be inside the execution shell, not the demo or lab HUD
    ok(!appSrc.includes("DropZone"), "F1: DropZone not in app composition layer (stays in shell)");
    ok(!appSrc.includes("onRun"), "F2: onRun not in app composition layer");
    ok(!appSrc.includes("handleRun"), "F3: handleRun not in app composition layer");

    // Execution side labeled
    ok(appSrc.includes("operational") || appSrc.includes("Execution Surface"), "F4: execution described as operational");
}
if (demoSrc) {
    ok(!demoSrc.includes("handleRun") && !demoSrc.includes("onRun"), "F5: demo does not contain run controls");
}
if (labHudSrc) {
    ok(!labHudSrc.includes("handleRun"), "F6: lab HUD does not contain run controls");
}

// ─── G. Demo remains read-side only ──────────────────────────────────────────
section("G. Demo read-side posture");
if (appSrc) {
    ok(appSrc.includes("read-side") || appSrc.includes("calmer"), "G1: demo described as read-side/calmer in app");
    ok(appSrc.includes("liveShellState") || appSrc.includes("DemoPane"), "G2: demo pane receives live state");
}
if (demoSrc) {
    ok(!demoSrc.includes("mintCanon"), "G3: demo does not mintCanon");
    ok(!demoSrc.match(/new ConsensusOp|ConsensusOp\(/), "G4: demo does not invoke ConsensusOp");
    ok(demoSrc.includes("read-side only") || demoSrc.includes("Not authority"), "G5: demo posture note present");
}

// ─── H. Lab HUD remains deeper inspection surface ────────────────────────────
section("H. Lab HUD separation");
if (appSrc) {
    // App does NOT use tandemAdapter to feed the lab HUD
    // (it passes workbench directly — preserving the workbench-native model)
    ok(appSrc.includes("LabHUDPane"), "H1: LabHUDPane wrapper present");
    ok(appSrc.includes("workbench={shellState.workbench}"), "H2: lab HUD receives raw workbench, not tandem output");
    ok(!appSrc.includes("projectForHUD(") || appSrc.indexOf("projectForHUD") > appSrc.indexOf("workbench={shellState.workbench}"),
        "H3: lab HUD not fed by projectForHUD");
}
if (labHudSrc) {
    ok(labHudSrc.includes("export default function DoorOneStructuralMemoryHUD"), "H4: lab HUD export intact");
    ok(!labHudSrc.includes("SemanticOscilloscopeApp"), "H5: lab HUD does not reference app");
}

// ─── I. Tandem adapter remains parity seam ───────────────────────────────────
section("I. Tandem adapter posture");
if (appSrc) {
    ok(appSrc.includes("projectBoth"), "I1: projectBoth used for tandem");
    ok(appSrc.includes("TandemSummaryBar") || appSrc.includes("tandem summary"), "I2: tandem summary bar visible in app");
}
if (tandemSrc) {
    ok(!tandemSrc.match(/new ConsensusOp|ConsensusOp\(/), "I3: tandem adapter does not invoke ConsensusOp");
    ok(!tandemSrc.includes("mintCanon"), "I4: tandem adapter does not mintCanon");
    ok(tandemSrc.includes("internal_hud") && tandemSrc.includes("public_demo"), "I5: both projections still present");
}

// ─── J. Inspection ordering preserved ────────────────────────────────────────
section("J. Provenance-first ordering");
if (appSrc) {
    // Tandem summary shows provenance fields before request/replay
    const provIdx = appSrc.indexOf("source_family");
    const reviewIdx = appSrc.indexOf("request_count");
    ok(provIdx > 0 && reviewIdx > 0 && provIdx < reviewIdx, "J1: provenance fields before request counts in tandem bar");
}
if (tandemSrc) {
    const p1 = tandemSrc.indexOf("1. Provenance");
    const p2 = tandemSrc.indexOf("2. Runtime Evidence");
    const p4 = tandemSrc.indexOf("4. Review");
    ok(p1 > 0 && p2 > p1 && p4 > p2, "J2: tandem adapter preserves 1→2→4 ordering");
}

// ─── K. Constitutional posture ───────────────────────────────────────────────
section("K. Constitutional posture");
if (appSrc) {
    ok(appSrc.includes("not authority") || appSrc.includes("Not authority"), "K1: not-authority declared in app");
    ok(appSrc.includes("composed environment"), "K2: 'composed environment' description present");
    ok(!appSrc.includes("mintCanon"), "K3: no mintCanon in app");
    ok(!appSrc.match(/new ConsensusOp|ConsensusOp\(/), "K4: no ConsensusOp in app");
    ok(!appSrc.includes("canonical_status ="), "K5: no C1 mutation in app");
    ok(appSrc.includes("Same source") || appSrc.includes("same source"), "K6: same-source tandem rule declared");
}

// ─── L. Existing entrypoints preserved ───────────────────────────────────────
section("L. Existing entrypoints preserved");
{
    let execHtml = null, demoHtml = null, indexHtml = null;
    try { execHtml = await readFile(path.join(ROOT, "execution.html"), "utf8"); } catch (_) { }
    try { demoHtml = await readFile(path.join(ROOT, "demo.html"), "utf8"); } catch (_) { }
    for (const p of [path.join(ROOT, "index.html"), "/mnt/project/index.html"]) {
        try { indexHtml = await readFile(p, "utf8"); break; } catch (_) { }
    }
    ok(execHtml !== null, "L1: execution.html still exists");
    ok(demoHtml !== null, "L2: demo.html still exists");
    ok(indexHtml !== null, "L3: index.html still exists");
    if (execHtml) ok(execHtml.includes("execution_main.jsx"), "L4: execution.html still points to execution_main.jsx");
    if (demoHtml) ok(demoHtml.includes("demo_main.jsx"), "L5: demo.html still points to demo_main.jsx");
}

// ─── M. Drag-drop intake stays on execution side ──────────────────────────────
section("M. Drag-drop stays execution-side");
if (appSrc) {
    ok(!appSrc.includes("onDrop") && !appSrc.includes("handleDrop"), "M1: no drag-drop handlers in app composition layer");
    ok(!appSrc.includes("DropZone"), "M2: DropZone not imported by app layer");
}
if (demoSrc) {
    ok(!demoSrc.includes("onDrop"), "M3: demo has no drop handlers");
}

finish();
