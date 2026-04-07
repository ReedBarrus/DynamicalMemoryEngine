// tests/hud/app_surfaces/test_semantic_oscilloscope_app_surface.js
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
let viewerAdapterSrc = null;
let appSrc = null;
let appMainSrc = null;
let appHtmlSrc = null;
let shellSrc = null;
let demoSrc = null;
let hudSrc = null;
let tandemSrc = null;
let liveModeShellSrc = null;
let staticModeShellSrc = null;
let inspectionModeShellSrc = null;
let viewerModeShellFrameSrc = null;
let shellStateRouterSrc = null;

try { routerSrc = await readFile(path.join(ROOT, "hud/HomeRouterShell.jsx"), "utf8"); } catch (_) {}
try { viewerAdapterSrc = await readFile(path.join(ROOT, "hud/adapters/structuralViewerPayloadAdapter.js"), "utf8"); } catch (_) {}
try { appSrc = await readFile(path.join(ROOT, "hud/SemanticOscilloscopeApp.jsx"), "utf8"); } catch (_) {}
try { appMainSrc = await readFile(path.join(ROOT, "hud/app_main.jsx"), "utf8"); } catch (_) {}
try { appHtmlSrc = await readFile(path.join(ROOT, "app.html"), "utf8"); } catch (_) {}
try { shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch (_) {}
try { demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch (_) {}
try { hudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8"); } catch (_) {}
try { tandemSrc = await readFile(path.join(ROOT, "hud/adapters/tandemAdapter.js"), "utf8"); } catch (_) {}
try { liveModeShellSrc = await readFile(path.join(ROOT, "hud/LiveModeShell.jsx"), "utf8"); } catch (_) {}
try { staticModeShellSrc = await readFile(path.join(ROOT, "hud/StaticModeShell.jsx"), "utf8"); } catch (_) {}
try { inspectionModeShellSrc = await readFile(path.join(ROOT, "hud/InspectionModeShell.jsx"), "utf8"); } catch (_) {}
try { viewerModeShellFrameSrc = await readFile(path.join(ROOT, "hud/ViewerModeShellFrame.jsx"), "utf8"); } catch (_) {}
try { shellStateRouterSrc = await readFile(path.join(ROOT, "hud/shellStateRouter.js"), "utf8"); } catch (_) {}

section("A. App surface file placement");
ok(routerSrc !== null, "A1: HomeRouterShell exists");
ok(viewerAdapterSrc !== null, "A2: structuralViewerPayloadAdapter exists");
ok(appSrc !== null, "A3: SemanticOscilloscopeApp exists");
ok(appMainSrc !== null, "A4: app_main exists");
ok(appHtmlSrc !== null, "A5: app.html exists");
ok(liveModeShellSrc !== null, "A6: LiveModeShell exists");
ok(staticModeShellSrc !== null, "A7: StaticModeShell exists");
ok(inspectionModeShellSrc !== null, "A8: InspectionModeShell exists");
ok(viewerModeShellFrameSrc !== null, "A9: ViewerModeShellFrame exists");
ok(shellStateRouterSrc !== null, "A10: shellStateRouter exists");
if (appMainSrc) {
    ok(appMainSrc.includes("HomeRouterShell"), "A11: app_main imports HomeRouterShell");
}
if (appHtmlSrc) {
    ok(appHtmlSrc.includes("app_main.jsx"), "A12: app.html points to app_main.jsx");
    ok(appHtmlSrc.includes("Home Router Shell"), "A13: app.html names the home router shell");
}
if (viewerAdapterSrc) {
    ok(viewerAdapterSrc.includes("one shared read-side viewer payload") || viewerAdapterSrc.includes("shared structural viewer payload"), "A14: adapter source declares shared payload posture");
}

section("B. Home router shell stays thin");
if (routerSrc) {
    ok(routerSrc.includes("window.location.hash"), "B1: shell uses local hash routing");
    ok(routerSrc.includes("ROUTES.live") && routerSrc.includes("ROUTES.static") && routerSrc.includes("ROUTES.inspection"), "B2: Live / Static / Inspection routes declared");
    ok(routerSrc.includes("Routing surface only.") || routerSrc.includes("routing surface only"), "B3: shell posture states routing-only boundary");
    ok(routerSrc.includes("Display below authority"), "B4: shell preserves below-authority posture");
    ok(routerSrc.includes("LegacyRoute"), "B5: shell preserves transitional legacy route");
    ok(!routerSrc.includes("PlaceholderRoute"), "B6: old generic placeholder route is removed");
    ok(routerSrc.includes("buildStructuralViewerPayload"), "B7: top-level shell uses shared viewer payload adapter");
    ok(routerSrc.includes("<LiveModeShell") && routerSrc.includes("<StaticModeShell") && routerSrc.includes("<InspectionModeShell"), "B8: router dispatches explicit mode shells");
    ok(routerSrc.includes("readPublishedShellState"), "B9: shell reads published execution state");
    ok(routerSrc.includes("ACTIVE_SHELL_STATE_EVENT"), "B10: shell listens for published state updates");
    ok(!routerSrc.includes("MetaLayerObjectExecutionShell"), "B11: top-level shell does not embed execution controls directly");
    ok(!routerSrc.includes("DoorOneStructuralMemoryHUD"), "B12: top-level shell is not itself the dense inspection HUD");
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
    ok(routerSrc.includes("onGoHome={() => navigate(ROUTES.home)}"), "C9: mode shells can return to home");
    ok(routerSrc.includes("onOpenLegacy={() => navigate(ROUTES.legacy)}"), "C10: mode shells can open transitional legacy route");
    ok(routerSrc.includes("runResult: activeShellState?.hasActiveResult ? activeShellState.runResult : null"), "C11: router only threads real runResult when active state exists");
    ok(routerSrc.includes("workbench: activeShellState?.hasActiveResult ? activeShellState.workbench : null"), "C12: router only threads real workbench when active state exists");
    ok(routerSrc.includes('sourceFamilyLabel: activeShellState?.sourceFamilyLabel ?? "unspecified"'), "C13: router threads real source family label with explicit fallback");
}

section("D. Mode shells stay distinct over one shared payload seam");
if (liveModeShellSrc && staticModeShellSrc && inspectionModeShellSrc && viewerModeShellFrameSrc) {
    ok(liveModeShellSrc.includes('import ViewerModeShellFrame from "./ViewerModeShellFrame.jsx"'), "D1: live mode shell uses shared frame");
    ok(staticModeShellSrc.includes('import ViewerModeShellFrame from "./ViewerModeShellFrame.jsx"'), "D2: static mode shell uses shared frame");
    ok(inspectionModeShellSrc.includes('import ViewerModeShellFrame from "./ViewerModeShellFrame.jsx"'), "D3: inspection mode shell uses shared frame");
    ok(liveModeShellSrc.includes("Telemetry is not yet implemented here."), "D4: live shell keeps telemetry honesty explicit");
    ok(liveModeShellSrc.includes("Structural priority"), "D5: live shell keeps structural-first posture");
    ok(staticModeShellSrc.includes("Static mode is not live playback paused."), "D6: static shell does not fake live posture");
    ok(staticModeShellSrc.includes("Provenance-first reading"), "D7: static shell keeps provenance posture explicit");
    ok(inspectionModeShellSrc.includes("does not silently become the default top-level face again"), "D8: inspection shell stays non-default");
    ok(inspectionModeShellSrc.includes("settlement, identity continuity, or canon posture"), "D9: inspection shell avoids semantic inflation");
    ok(viewerModeShellFrameSrc.includes("All mode shells consume the same shared payload seam."), "D10: shared frame preserves one payload seam");
    ok(viewerModeShellFrameSrc.includes("payload.structural"), "D11: shared frame reads structural section");
    ok(viewerModeShellFrameSrc.includes("payload.overlays"), "D12: shared frame keeps overlays optional");
    ok(viewerModeShellFrameSrc.includes("payload.source.state_basis"), "D13: shared frame shows state basis explicitly");
    ok(viewerModeShellFrameSrc.includes("payload.source.state_availability"), "D14: shared frame shows fallback or active state posture explicitly");
    ok(!viewerModeShellFrameSrc.includes("settlement_report"), "D15: shared frame does not require settlement_report");
    ok(!viewerModeShellFrameSrc.includes("identity_audit"), "D16: shared frame does not require identity_audit");
}

section("E. Legacy composed app stays preserved");
if (appSrc) {
    ok(appSrc.includes("MetaLayerObjectExecutionShell"), "E1: execution shell composed");
    ok(appSrc.includes("MetaLayerConsultationDemo"), "E2: public demo composed");
    ok(appSrc.includes("DoorOneStructuralMemoryHUD"), "E3: lab HUD composed");
    ok(appSrc.includes("OperatorLegibilityPanel"), "E4: operator panel composed");
    ok(appSrc.includes("projectBoth"), "E5: tandem adapter used");
    ok(appSrc.includes("presentation posture") || appSrc.includes("NOT truth conditions"), "E6: mode switching posture declared");
    ok(appSrc.includes("composed environment"), "E7: composed-environment note preserved");
    ok(appSrc.includes("not authority") || appSrc.includes("Not authority"), "E8: not-authority note preserved");
}

section("F. Legacy composed app state threading remains intact");
if (appSrc) {
    ok(appSrc.includes("handleShellStateChange"), "F1: app defines shell state callback");
    ok(appSrc.includes("setShellState(nextState);"), "F2: app replaces mirrored shell state instead of merging stale keys");
    ok(appSrc.includes("hasActiveResult"), "F3: app mirrors active-result posture from shell state");
    ok(appSrc.includes("activeRunLabel"), "F4: app keeps active run label in mirrored state");
    ok(appSrc.includes("activeRequest"), "F5: app mirrors active request state from the shell export");
    ok(appSrc.includes("requestHistoryCount"), "F6: app keeps request history count in mirrored state");
    ok(appSrc.includes("replayHistoryCount"), "F7: app keeps replay history count in mirrored state");
    ok(appSrc.includes("shellState.hasActiveResult ? shellState : null"), "F8: demo only receives live shell state when an active result exists");
    ok(appSrc.includes("workbench={shellState.workbench}"), "F9: lab HUD stays workbench-native");
}

section("G. Shell state export path remains explicit");
if (shellSrc) {
    ok(shellSrc.includes("buildActiveShellState"), "G1: shell builds explicit active shell state");
    ok(shellSrc.includes("publishActiveShellState(activeShellState)"), "G2: shell publishes active shell state for viewer routes");
    ok(shellSrc.includes("annotateShellRecord"), "G3: shell annotates request and replay records");
    ok(shellSrc.includes("const activeShellState = useMemo"), "G4: active shell state memoized at shell seam");
    ok(shellSrc.includes("onStateChange(activeShellState)"), "G5: shell exports active shell state to app");
    ok(shellSrc.includes("activeRequest={activeShellState.activeRequest}"), "G6: request pane receives the active request from shell state");
    ok(shellSrc.includes("downloadRequestJson(activeRequest)"), "G7: request export uses the same active request object shown in-pane");
    ok(shellSrc.includes("activeShellState.requestLog"), "G8: request pane reads active-context request state");
    ok(shellSrc.includes("activeShellState.replayLog"), "G9: replay pane reads active-context replay state");
    ok(shellSrc.includes("setRunResult(null);") && shellSrc.includes("setWorkbench(null);"), "G10: shell clears stale active result on rerun/error path");
}
if (shellStateRouterSrc) {
    ok(shellStateRouterSrc.includes('ACTIVE_SHELL_STATE_EVENT = "dme:active-shell-state"'), "G11: shellStateRouter declares active-shell-state event");
    ok(shellStateRouterSrc.includes("readPublishedShellState"), "G12: shellStateRouter can read published shell state");
    ok(shellStateRouterSrc.includes("publishActiveShellState"), "G13: shellStateRouter can publish shell state");
}

section("H. Downstream surfaces remain bounded");
if (demoSrc) {
    ok(!demoSrc.includes("handleRun") && !demoSrc.includes("onRun"), "H1: demo surface has no run controls");
    ok(demoSrc.includes("read-side only") || demoSrc.includes("Not authority"), "H2: demo keeps read-side posture");
}
if (hudSrc) {
    ok(!hudSrc.includes("handleRun"), "H3: lab HUD has no run controls");
    ok(
        hudSrc.includes("Structural continuity here is not settlement or identity closure."),
        "H4: lab HUD keeps structural continuity separate from settlement and identity closure"
    );
    ok(
        hudSrc.includes("post-perturbation") && hudSrc.includes("identity audit"),
        "H5: lab HUD reserves optional future read-side attachment space without implementing it"
    );
}

section("I. Legacy composition remains bounded");
if (appSrc) {
    ok(appSrc.includes("TandemSummaryBar"), "I1: tandem summary bar remains in legacy app");
    const provIdx = appSrc.indexOf("source_family");
    const reviewIdx = appSrc.indexOf("request_count");
    ok(provIdx > -1 && reviewIdx > provIdx, "I2: tandem summary keeps provenance before request/replay review counts");
}
if (tandemSrc) {
    ok(tandemSrc.includes("internal_hud") && tandemSrc.includes("public_demo"), "I3: tandem adapter preserves both projections");
    ok(!tandemSrc.includes("mintCanon"), "I4: tandem adapter does not mint canon");
    ok(!tandemSrc.match(/new ConsensusOp|ConsensusOp\(/), "I5: tandem adapter does not invoke consensus");
}

section("J. Entrypoints stay preserved");
{
    let execHtml = null;
    let demoHtml = null;
    try { execHtml = await readFile(path.join(ROOT, "execution.html"), "utf8"); } catch (_) {}
    try { demoHtml = await readFile(path.join(ROOT, "demo.html"), "utf8"); } catch (_) {}

    ok(execHtml !== null, "J1: execution.html still exists");
    ok(demoHtml !== null, "J2: demo.html still exists");
    if (execHtml) ok(execHtml.includes("execution_main.jsx"), "J3: execution entry preserved");
    if (demoHtml) ok(demoHtml.includes("demo_main.jsx"), "J4: demo entry preserved");
}

finish();
