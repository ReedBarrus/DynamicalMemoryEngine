// tests/door_two/test_semantic_oscilloscope_app_surface.js
//
// Contract tests for the top-level app surface after the Home / Router shell split.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

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

let routerSrc = null;
let appSrc = null;
let appMainSrc = null;
let appHtmlSrc = null;
let shellSrc = null;
let demoSrc = null;
let hudSrc = null;
let tandemSrc = null;

try { routerSrc = await readFile(path.join(ROOT, "hud/HomeRouterShell.jsx"), "utf8"); } catch (_) {}
try { appSrc = await readFile(path.join(ROOT, "hud/SemanticOscilloscopeApp.jsx"), "utf8"); } catch (_) {}
try { appMainSrc = await readFile(path.join(ROOT, "hud/app_main.jsx"), "utf8"); } catch (_) {}
try { appHtmlSrc = await readFile(path.join(ROOT, "app.html"), "utf8"); } catch (_) {}
try { shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch (_) {}
try { demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch (_) {}
try { hudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8"); } catch (_) {}
try { tandemSrc = await readFile(path.join(ROOT, "hud/adapters/tandemAdapter.js"), "utf8"); } catch (_) {}

section("A. App surface file placement");
ok(routerSrc !== null, "A1: HomeRouterShell exists");
ok(appSrc !== null, "A2: SemanticOscilloscopeApp exists");
ok(appMainSrc !== null, "A3: app_main exists");
ok(appHtmlSrc !== null, "A4: app.html exists");
if (appMainSrc) {
    ok(appMainSrc.includes("HomeRouterShell"), "A5: app_main imports HomeRouterShell");
}
if (appHtmlSrc) {
    ok(appHtmlSrc.includes("app_main.jsx"), "A6: app.html points to app_main.jsx");
    ok(appHtmlSrc.includes("Home Router Shell"), "A7: app.html names the home router shell");
}

section("B. Home router shell stays thin");
if (routerSrc) {
    ok(routerSrc.includes("window.location.hash"), "B1: shell uses local hash routing");
    ok(routerSrc.includes("ROUTES.live") && routerSrc.includes("ROUTES.static") && routerSrc.includes("ROUTES.inspection"), "B2: Live / Static / Inspection routes declared");
    ok(routerSrc.includes("Routing surface only.") || routerSrc.includes("routing surface only"), "B3: shell posture states routing-only boundary");
    ok(routerSrc.includes("Display below authority"), "B4: shell preserves below-authority posture");
    ok(routerSrc.includes("LegacyRoute"), "B5: shell preserves transitional legacy route");
    ok(routerSrc.includes("placeholder route"), "B6: viewer routes are placeholder-level in this packet");
    ok(!routerSrc.includes("MetaLayerObjectExecutionShell"), "B7: top-level shell does not embed execution controls directly");
    ok(!routerSrc.includes("DoorOneStructuralMemoryHUD"), "B8: top-level shell is not itself the dense inspection HUD");
}

section("C. Route choices and reachability remain explicit");
if (routerSrc) {
    ok(routerSrc.includes("/home"), "C1: home route declared");
    ok(routerSrc.includes("/live"), "C2: live route declared");
    ok(routerSrc.includes("/static"), "C3: static route declared");
    ok(routerSrc.includes("/inspection"), "C4: inspection route declared");
    ok(routerSrc.includes("/legacy-composed"), "C5: legacy route declared");
    ok(routerSrc.includes("execution.html") && routerSrc.includes("index.html") && routerSrc.includes("demo.html"), "C6: standalone existing functionality remains reachable");
    ok(routerSrc.includes("SemanticOscilloscopeApp"), "C7: legacy composed app remains reachable from the shell");
    ok(routerSrc.includes("Live / Static / Inspection entry points"), "C8: home shell presents explicit viewer-family entry points");
}

section("D. Legacy composed app stays preserved");
if (appSrc) {
    ok(appSrc.includes("MetaLayerObjectExecutionShell"), "D1: execution shell composed");
    ok(appSrc.includes("MetaLayerConsultationDemo"), "D2: public demo composed");
    ok(appSrc.includes("DoorOneStructuralMemoryHUD"), "D3: lab HUD composed");
    ok(appSrc.includes("OperatorLegibilityPanel"), "D4: operator panel composed");
    ok(appSrc.includes("projectBoth"), "D5: tandem adapter used");
    ok(appSrc.includes("presentation posture") || appSrc.includes("NOT truth conditions"), "D6: mode switching posture declared");
    ok(appSrc.includes("composed environment"), "D7: composed-environment note preserved");
    ok(appSrc.includes("not authority") || appSrc.includes("Not authority"), "D8: not-authority note preserved");
}

section("E. Legacy composed app state threading remains intact");
if (appSrc) {
    ok(appSrc.includes("handleShellStateChange"), "E1: app defines shell state callback");
    ok(appSrc.includes("setShellState(nextState);"), "E2: app replaces mirrored shell state instead of merging stale keys");
    ok(appSrc.includes("hasActiveResult"), "E3: app mirrors active-result posture from shell state");
    ok(appSrc.includes("activeRunLabel"), "E4: app keeps active run label in mirrored state");
    ok(appSrc.includes("activeRequest"), "E5: app mirrors active request state from the shell export");
    ok(appSrc.includes("requestHistoryCount"), "E6: app keeps request history count in mirrored state");
    ok(appSrc.includes("replayHistoryCount"), "E7: app keeps replay history count in mirrored state");
    ok(appSrc.includes("shellState.hasActiveResult ? shellState : null"), "E8: demo only receives live shell state when an active result exists");
    ok(appSrc.includes("workbench={shellState.workbench}"), "E9: lab HUD stays workbench-native");
}

section("F. Shell state export path remains explicit");
if (shellSrc) {
    ok(shellSrc.includes("buildActiveShellState"), "F1: shell builds explicit active shell state");
    ok(shellSrc.includes("annotateShellRecord"), "F2: shell annotates request and replay records");
    ok(shellSrc.includes("const activeShellState = useMemo"), "F3: active shell state memoized at shell seam");
    ok(shellSrc.includes("onStateChange(activeShellState)"), "F4: shell exports active shell state to app");
    ok(shellSrc.includes("activeRequest={activeShellState.activeRequest}"), "F5: request pane receives the active request from shell state");
    ok(shellSrc.includes("downloadRequestJson(activeRequest)"), "F6: request export uses the same active request object shown in-pane");
    ok(shellSrc.includes("activeShellState.requestLog"), "F7: request pane reads active-context request state");
    ok(shellSrc.includes("activeShellState.replayLog"), "F8: replay pane reads active-context replay state");
    ok(shellSrc.includes("setRunResult(null);") && shellSrc.includes("setWorkbench(null);"), "F9: shell clears stale active result on rerun/error path");
}

section("G. Downstream surfaces remain bounded");
if (demoSrc) {
    ok(!demoSrc.includes("handleRun") && !demoSrc.includes("onRun"), "G1: demo surface has no run controls");
    ok(demoSrc.includes("read-side only") || demoSrc.includes("Not authority"), "G2: demo keeps read-side posture");
}
if (hudSrc) {
    ok(!hudSrc.includes("handleRun"), "E10: lab HUD has no run controls");
    ok(
        hudSrc.includes("Structural continuity here is not settlement or identity closure."),
        "E11: lab HUD keeps structural continuity separate from settlement and identity closure"
    );
    ok(
        hudSrc.includes("post-perturbation") && hudSrc.includes("identity audit"),
        "E12: lab HUD reserves optional future read-side attachment space without implementing it"
    );
}

section("H. Legacy composition remains bounded");
if (appSrc) {
    ok(appSrc.includes("TandemSummaryBar"), "H1: tandem summary bar remains in legacy app");
    const provIdx = appSrc.indexOf("source_family");
    const reviewIdx = appSrc.indexOf("request_count");
    ok(provIdx > -1 && reviewIdx > provIdx, "H2: tandem summary keeps provenance before request/replay review counts");
}
if (tandemSrc) {
    ok(tandemSrc.includes("internal_hud") && tandemSrc.includes("public_demo"), "H3: tandem adapter preserves both projections");
    ok(!tandemSrc.includes("mintCanon"), "H4: tandem adapter does not mint canon");
    ok(!tandemSrc.match(/new ConsensusOp|ConsensusOp\(/), "H5: tandem adapter does not invoke consensus");
}

section("I. Entrypoints stay preserved");
{
    let execHtml = null;
    let demoHtml = null;
    try { execHtml = await readFile(path.join(ROOT, "execution.html"), "utf8"); } catch (_) {}
    try { demoHtml = await readFile(path.join(ROOT, "demo.html"), "utf8"); } catch (_) {}

    ok(execHtml !== null, "I1: execution.html still exists");
    ok(demoHtml !== null, "I2: demo.html still exists");
    if (execHtml) ok(execHtml.includes("execution_main.jsx"), "I3: execution entry preserved");
    if (demoHtml) ok(demoHtml.includes("demo_main.jsx"), "I4: demo entry preserved");
}

finish();
