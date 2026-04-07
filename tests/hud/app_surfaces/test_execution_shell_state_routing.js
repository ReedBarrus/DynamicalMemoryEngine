// tests/hud/app_surfaces/test_execution_shell_state_routing.js
//
// Focused routing/coherence tests for the execution shell state-routing seam.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    annotateShellRecord,
    buildActiveShellState,
} from "../../../hud/shellStateRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let PASS = 0;
let FAIL = 0;
function section(t) { console.log(`\n-- ${t} --`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ok ${label}`); }
    else { FAIL++; console.error(`  not ok ${label}`); }
}
function eq(a, b, label) {
    ok(Object.is(a, b), `${label}${Object.is(a, b) ? "" : ` (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`}`);
}
function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const RUN_A = {
    ok: true,
    run_label: "shell.run.001",
    artifacts: { a1: { source_id: "synthetic.seed42", stream_id: "stream.shell.001" } },
};
const RUN_B = {
    ok: true,
    run_label: "shell.run.002",
    artifacts: { a1: { source_id: "synthetic.seed84", stream_id: "stream.shell.002" } },
};
const WORKBENCH_A = { scope: { stream_id: "stream.shell.001", segment_ids: ["s0", "s1"] } };

section("A. annotateShellRecord binds records to active shell context");
{
    const req = annotateShellRecord(
        { request_id: "CREQ-1", run_label: "shell.run.001" },
        { runId: "shell.run.001", runResult: RUN_A, sourceFamilyLabel: "Synthetic Signal" }
    );

    eq(req.context_run_id, "shell.run.001", "A1: context_run_id attached");
    eq(req.context_run_label, "shell.run.001", "A2: context_run_label attached");
    eq(req.source_family_label, "Synthetic Signal", "A3: source_family_label preserved from active shell context");
}

section("B. buildActiveShellState filters logs to the active run");
{
    const requestLog = [
        { request_id: "CREQ-old", run_label: "shell.run.000", context_run_label: "shell.run.000" },
        { request_id: "CREQ-new", run_label: "shell.run.001", context_run_label: "shell.run.001" },
    ];
    const replayLog = [
        { replay_request_id: "RPLY-old", run_label: "shell.run.000", context_run_label: "shell.run.000" },
        { replay_request_id: "RPLY-new", run_label: "shell.run.001", context_run_label: "shell.run.001" },
    ];

    const state = buildActiveShellState({
        runId: "shell.run.001",
        runResult: RUN_A,
        workbench: WORKBENCH_A,
        requestLog,
        replayLog,
        sourceFamilyLabel: "Synthetic Signal",
        runStatus: "complete",
    });

    eq(state.activeRunLabel, "shell.run.001", "B1: activeRunLabel derived from runResult");
    eq(state.activeRequest.request_id, "CREQ-new", "B2: activeRequest derives from active-context request log head");
    eq(state.requestLog.length, 1, "B3: request log filtered to active run");
    eq(state.requestLog[0].request_id, "CREQ-new", "B4: active request preserved");
    eq(state.replayLog.length, 1, "B5: replay log filtered to active run");
    eq(state.replayLog[0].replay_request_id, "RPLY-new", "B6: active replay preserved");
    eq(state.requestHistoryCount, 2, "B7: request history count preserved separately");
    eq(state.replayHistoryCount, 2, "B8: replay history count preserved separately");
    eq(state.hasActiveResult, true, "B9: hasActiveResult true when runResult.ok and workbench present");
}

section("C. running/error states do not keep stale active result");
{
    const runningState = buildActiveShellState({
        runId: "shell.run.002",
        runResult: null,
        workbench: null,
        requestLog: [],
        replayLog: [],
        sourceFamilyLabel: "File Import (JSON / CSV / WAV)",
        runStatus: "running",
    });

    eq(runningState.hasActiveResult, false, "C1: running without workbench does not claim active result");
    eq(runningState.activeRequest, null, "C2: no active request when no active run");
    eq(runningState.requestLog.length, 0, "C3: no active request log when no active run");
    eq(runningState.replayLog.length, 0, "C4: no active replay log when no active run");
}

section("D. shell/app source uses active routing path");
{
    const shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8");
    const appSrc = await readFile(path.join(ROOT, "hud/SemanticOscilloscopeApp.jsx"), "utf8");

    ok(shellSrc.includes("buildActiveShellState"), "D1: shell imports active shell state helper");
    ok(shellSrc.includes("annotateShellRecord"), "D2: shell annotates request/replay records with shell context");
    ok(shellSrc.includes("setRunResult(null);") && shellSrc.includes("setWorkbench(null);"), "D3: shell clears stale active result on new run start");
    ok(shellSrc.includes("activeShellState.activeRequest"), "D4: shell routes one active request object into the request pane");
    ok(shellSrc.includes("downloadRequestJson(activeRequest)"), "D5: request export uses the visible active request object");
    ok(shellSrc.includes("activeShellState.requestLog") && shellSrc.includes("activeShellState.replayLog"), "D6: shell renders active-context logs");
    ok(appSrc.includes("setShellState(nextState);"), "D7: app treats shell export as authoritative replacement");
    ok(appSrc.includes("shellState.hasActiveResult ? shellState : null"), "D8: demo pane only receives active shell result state");
}

section("E. source family label stays tied to active run context");
{
    const stateA = buildActiveShellState({
        runId: "shell.run.001",
        runResult: RUN_A,
        workbench: WORKBENCH_A,
        requestLog: [],
        replayLog: [],
        sourceFamilyLabel: "Synthetic Signal",
        runStatus: "complete",
    });
    const stateB = buildActiveShellState({
        runId: "shell.run.002",
        runResult: RUN_B,
        workbench: { scope: { stream_id: "stream.shell.002", segment_ids: ["s0"] } },
        requestLog: [],
        replayLog: [],
        sourceFamilyLabel: "File Import (JSON / CSV / WAV)",
        runStatus: "complete",
    });

    eq(stateA.sourceFamilyLabel, "Synthetic Signal", "E1: first active context preserves its own source family");
    eq(stateB.sourceFamilyLabel, "File Import (JSON / CSV / WAV)", "E2: second active context preserves its own source family");
}

finish();
