// tests/hud/app_surfaces/test_metalayer_execution_shell.js
//
// Contract tests for hud/MetaLayerObjectExecutionShell.jsx

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let PASS = 0;
let FAIL = 0;
function section(t) { console.log(`\n-- ${t} --`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ok ${label}`); }
    else { FAIL++; console.error(`  not ok ${label}`); }
}
function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

let shellSrc = null;
let execMainSrc = null;
let execHtmlSrc = null;
let demoSrc = null;
try { shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch (_) {}
try { execMainSrc = await readFile(path.join(ROOT, "hud/execution_main.jsx"), "utf8"); } catch (_) {}
try { execHtmlSrc = await readFile(path.join(ROOT, "execution.html"), "utf8"); } catch (_) {}
try { demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch (_) {}

section("A. File placement and execution entry");
ok(shellSrc !== null, "A1: shell exists");
ok(execMainSrc !== null, "A2: execution_main exists");
ok(execHtmlSrc !== null, "A3: execution.html exists");
if (execMainSrc) {
    ok(execMainSrc.includes("MetaLayerObjectExecutionShell"), "A4: execution_main imports shell");
}
if (execHtmlSrc) {
    ok(execHtmlSrc.includes("execution_main.jsx"), "A5: execution.html points to execution_main.jsx");
}

section("B. Constitutional posture stays bounded");
if (shellSrc) {
    ok(shellSrc.includes("execution surface"), "B1: execution-surface posture declared");
    ok(shellSrc.includes("not authority"), "B2: not-authority posture declared");
    ok(shellSrc.includes("runtime is not canon") || shellSrc.includes("below canon"), "B3: below-canon posture declared");
    ok(!shellSrc.includes("mintCanon"), "B4: no canon minting");
    ok(!shellSrc.includes("canonical_status ="), "B5: no C1 mutation");
}

section("C. Shell regions and ordering");
if (shellSrc) {
    ok(shellSrc.includes("Control / Orchestration"), "C1: control region present");
    ok(shellSrc.includes("Run Status"), "C2: status region present");
    ok(shellSrc.includes("Inspection / Results"), "C3: results region present");
    ok(shellSrc.includes("Request Surface"), "C4: request region present");
    ok(shellSrc.includes("Replay / Reconstruction"), "C5: replay region present");

    const aIdx = shellSrc.indexOf("Control / Orchestration");
    const bIdx = shellSrc.indexOf("Run Status");
    const cIdx = shellSrc.indexOf("Inspection / Results");
    const dIdx = shellSrc.indexOf("Request Surface");
    const eIdx = shellSrc.indexOf("Replay / Reconstruction");
    ok(aIdx > -1 && bIdx > aIdx && cIdx > bIdx && dIdx > cIdx && eIdx > dIdx, "C6: regions appear in shell order");
}

section("D. Explicit active shell routing path");
if (shellSrc) {
    ok(shellSrc.includes("buildActiveShellState"), "D1: shell builds one active shell state object");
    ok(shellSrc.includes("annotateShellRecord"), "D2: shell tags request/replay records with active context");
    ok(shellSrc.includes("const activeShellState = useMemo"), "D3: active shell state is memoized");
    ok(shellSrc.includes("setRunResult(null);") && shellSrc.includes("setWorkbench(null);"), "D4: stale active result cleared on new run start");
    ok(shellSrc.includes("activeShellState.activeRequest"), "D5: request pane reads one active request object from shell state");
    ok(shellSrc.includes("downloadRequestJson(activeRequest)"), "D6: request export uses the visible active request object");
    ok(shellSrc.includes("activeShellState.requestLog"), "D7: request log rendering is active-context scoped");
    ok(shellSrc.includes("activeShellState.replayLog"), "D8: replay log rendering is active-context scoped");
    ok(shellSrc.includes("requestHistoryCount"), "D9: shell preserves session history count separately");
    ok(shellSrc.includes("replayHistoryCount"), "D10: shell preserves replay history count separately");
}

section("E. Shell export remains read-side only");
if (shellSrc) {
    ok(shellSrc.includes("onStateChange(activeShellState)"), "E1: app export uses active shell state");
    ok(shellSrc.includes("typeof onStateChange === \"function\""), "E2: export callback remains guarded");
    ok(shellSrc.includes("useEffect"), "E3: export path still uses useEffect");
}

section("F. Runtime seam remains local and explicit");
if (shellSrc) {
    ok(shellSrc.includes("DoorOneOrchestrator"), "F1: shell still calls orchestrator directly");
    ok(shellSrc.includes("CrossRunSession"), "F2: shell still uses cross-run session");
    ok(shellSrc.includes("DoorOneWorkbench"), "F3: shell still assembles workbench");
    ok(shellSrc.includes("ReplayRegion"), "F4: replay region remains in shell seam");
}

section("G. Public demo remains separate");
if (shellSrc) {
    ok(!shellSrc.match(/import.*MetaLayerConsultationDemo/), "G1: shell does not import demo surface");
}
if (demoSrc) {
    ok(!demoSrc.includes("MetaLayerObjectExecutionShell"), "G2: demo does not import shell");
}

finish();
