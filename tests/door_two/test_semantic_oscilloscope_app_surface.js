// tests/door_two/test_semantic_oscilloscope_app_surface.js
//
// Contract tests for the Semantic Oscilloscope app surface integration.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

let PASS = 0;
let FAIL = 0;
function section(title) { console.log(`\n-- ${title} --`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ok ${label}`); }
    else { FAIL++; console.error(`  not ok ${label}`); }
}
function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

let appSrc = null;
let appMainSrc = null;
let appHtmlSrc = null;
let shellSrc = null;
let demoSrc = null;
let hudSrc = null;
let tandemSrc = null;

try { appSrc = await readFile(path.join(ROOT, "hud/SemanticOscilloscopeApp.jsx"), "utf8"); } catch (_) {}
try { appMainSrc = await readFile(path.join(ROOT, "hud/app_main.jsx"), "utf8"); } catch (_) {}
try { appHtmlSrc = await readFile(path.join(ROOT, "app.html"), "utf8"); } catch (_) {}
try { shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch (_) {}
try { demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch (_) {}
try { hudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8"); } catch (_) {}
try { tandemSrc = await readFile(path.join(ROOT, "hud/adapters/tandemAdapter.js"), "utf8"); } catch (_) {}

section("A. App surface file placement");
ok(appSrc !== null, "A1: SemanticOscilloscopeApp exists");
ok(appMainSrc !== null, "A2: app_main exists");
ok(appHtmlSrc !== null, "A3: app.html exists");
if (appMainSrc) {
    ok(appMainSrc.includes("SemanticOscilloscopeApp"), "A4: app_main imports SemanticOscilloscopeApp");
}
if (appHtmlSrc) {
    ok(appHtmlSrc.includes("app_main.jsx"), "A5: app.html points to app_main.jsx");
    ok(appHtmlSrc.includes("Semantic Oscilloscope"), "A6: app.html names the composed app");
}

section("B. App composition stays bounded");
if (appSrc) {
    ok(appSrc.includes("MetaLayerObjectExecutionShell"), "B1: execution shell composed");
    ok(appSrc.includes("MetaLayerConsultationDemo"), "B2: public demo composed");
    ok(appSrc.includes("DoorOneStructuralMemoryHUD"), "B3: lab HUD composed");
    ok(appSrc.includes("OperatorLegibilityPanel"), "B4: operator panel composed");
    ok(appSrc.includes("projectBoth"), "B5: tandem adapter used");
    ok(appSrc.includes("presentation posture") || appSrc.includes("NOT truth conditions"), "B6: mode switching posture declared");
    ok(appSrc.includes("composed environment"), "B7: composed-environment note preserved");
    ok(appSrc.includes("not authority") || appSrc.includes("Not authority"), "B8: not-authority note preserved");
}

section("C. State threading uses authoritative shell export");
if (appSrc) {
    ok(appSrc.includes("handleShellStateChange"), "C1: app defines shell state callback");
    ok(appSrc.includes("setShellState(nextState);"), "C2: app replaces mirrored shell state instead of merging stale keys");
    ok(appSrc.includes("hasActiveResult"), "C3: app mirrors active-result posture from shell state");
    ok(appSrc.includes("activeRunLabel"), "C4: app keeps active run label in mirrored state");
    ok(appSrc.includes("activeRequest"), "C5: app mirrors active request state from the shell export");
    ok(appSrc.includes("requestHistoryCount"), "C6: app keeps request history count in mirrored state");
    ok(appSrc.includes("replayHistoryCount"), "C7: app keeps replay history count in mirrored state");
    ok(appSrc.includes("shellState.hasActiveResult ? shellState : null"), "C8: demo only receives live shell state when an active result exists");
    ok(appSrc.includes("workbench={shellState.workbench}"), "C9: lab HUD stays workbench-native");
}

section("D. Shell routing path remains explicit");
if (shellSrc) {
    ok(shellSrc.includes("buildActiveShellState"), "D1: shell builds explicit active shell state");
    ok(shellSrc.includes("annotateShellRecord"), "D2: shell annotates request and replay records");
    ok(shellSrc.includes("const activeShellState = useMemo"), "D3: active shell state memoized at shell seam");
    ok(shellSrc.includes("onStateChange(activeShellState)"), "D4: shell exports active shell state to app");
    ok(shellSrc.includes("activeRequest={activeShellState.activeRequest}"), "D5: request pane receives the active request from shell state");
    ok(shellSrc.includes("downloadRequestJson(activeRequest)"), "D6: request export uses the same active request object shown in-pane");
    ok(shellSrc.includes("activeShellState.requestLog"), "D7: request pane reads active-context request state");
    ok(shellSrc.includes("activeShellState.replayLog"), "D8: replay pane reads active-context replay state");
    ok(shellSrc.includes("setRunResult(null);") && shellSrc.includes("setWorkbench(null);"), "D9: shell clears stale active result on rerun/error path");
}

section("E. Mode separation does not relocate authority");
if (appSrc) {
    ok(appSrc.includes('id: "operator"'), "E1: operator mode is available in the app shell");
    ok(appSrc.includes("Execution Surface"), "E2: execution pane remains labeled operational");
    ok(appSrc.includes("Inspection Surface"), "E3: lab inspection pane remains labeled read-side");
    ok(appSrc.includes("Demo Surface"), "E4: demo pane remains labeled read-side");
    ok(appSrc.includes("Operator Surface"), "E5: operator pane remains labeled read-side");
    ok(!appSrc.includes("handleRun"), "E6: app layer does not own run controls");
    ok(!appSrc.includes("DropZone"), "E7: app layer does not pull intake controls out of shell");
}
if (demoSrc) {
    ok(!demoSrc.includes("handleRun") && !demoSrc.includes("onRun"), "E8: demo surface has no run controls");
    ok(demoSrc.includes("read-side only") || demoSrc.includes("Not authority"), "E9: demo keeps read-side posture");
}
if (hudSrc) {
    ok(!hudSrc.includes("handleRun"), "E10: lab HUD has no run controls");
}

section("F. Tandem and ordering posture remain bounded");
if (appSrc) {
    ok(appSrc.includes("TandemSummaryBar"), "F1: tandem summary bar remains in app");
    const provIdx = appSrc.indexOf("source_family");
    const reviewIdx = appSrc.indexOf("request_count");
    ok(provIdx > -1 && reviewIdx > provIdx, "F2: tandem summary keeps provenance before request/replay review counts");
}
if (tandemSrc) {
    ok(tandemSrc.includes("internal_hud") && tandemSrc.includes("public_demo"), "F3: tandem adapter preserves both projections");
    ok(!tandemSrc.includes("mintCanon"), "F4: tandem adapter does not mint canon");
    ok(!tandemSrc.match(/new ConsensusOp|ConsensusOp\(/), "F5: tandem adapter does not invoke consensus");
}

section("G. Entrypoints stay preserved");
{
    let execHtml = null;
    let demoHtml = null;
    try { execHtml = await readFile(path.join(ROOT, "execution.html"), "utf8"); } catch (_) {}
    try { demoHtml = await readFile(path.join(ROOT, "demo.html"), "utf8"); } catch (_) {}

    ok(execHtml !== null, "G1: execution.html still exists");
    ok(demoHtml !== null, "G2: demo.html still exists");
    if (execHtml) ok(execHtml.includes("execution_main.jsx"), "G3: execution entry preserved");
    if (demoHtml) ok(demoHtml.includes("demo_main.jsx"), "G4: demo entry preserved");
}

finish();
