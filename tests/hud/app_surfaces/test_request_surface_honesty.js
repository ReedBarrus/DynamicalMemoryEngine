// tests/door_two/test_request_surface_honesty.js
//
// Focused request-surface honesty tests for Packet C.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    buildConsultationRequest,
    buildActivationReviewRequest,
} from "../../../hud/requestModel.js";
import { annotateShellRecord, buildActiveShellState } from "../../../hud/shellStateRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let PASS = 0;
let FAIL = 0;
function section(title) { console.log(`\n-- ${title} --`); }
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
    run_label: "shell.run.request.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.request.001",
        },
    },
};

const RUN_B = {
    ok: true,
    run_label: "shell.run.request.002",
    artifacts: {
        a1: {
            source_id: "synthetic.seed84",
            stream_id: "stream.request.002",
        },
    },
};

const WORKBENCH_A = {
    scope: {
        stream_id: "stream.request.001",
        segment_ids: ["seg.0", "seg.1"],
        cross_run_context: { available: true, run_count: 2 },
    },
    runtime: {
        artifacts: {
            h1s: [{ id: "h1.0" }],
            m1s: [{ id: "m1.0" }],
            anomaly_reports: [{ artifact_type: "frequency_shift" }],
        },
    },
    promotion_readiness: {
        report: { readiness_summary: { overall_readiness: "insufficient" } },
    },
    canon_candidate: {
        dossier: { candidate_claim: { claim_type: "bounded_structural_claim" } },
    },
};

section("A. request objects carry prepared-only posture");
{
    const consult = buildConsultationRequest({
        workbench: WORKBENCH_A,
        runResult: RUN_A,
        sourceFamilyLabel: "Synthetic Signal",
    });
    const review = buildActivationReviewRequest({
        workbench: WORKBENCH_A,
        runResult: RUN_A,
        sourceFamilyLabel: "Synthetic Signal",
    });

    eq(consult.request_status, "prepared", "A1: consultation request remains prepared");
    eq(consult.fulfillment_status, "not_fulfilled", "A2: consultation request explicitly not fulfilled");
    ok(consult.request_surface_posture.includes("prepared only"), "A3: consultation request has prepared-only posture");
    eq(review.request_status, "prepared", "A4: activation review request remains prepared");
    eq(review.fulfillment_status, "not_fulfilled", "A5: activation review request explicitly not fulfilled");
    ok(review.request_surface_posture.includes("review protocol not executed"), "A6: activation review request states protocol not executed");
}

section("B. active request derives from the same active-context log used for display");
{
    const requestA = annotateShellRecord(
        buildConsultationRequest({
            workbench: WORKBENCH_A,
            runResult: RUN_A,
            sourceFamilyLabel: "Synthetic Signal",
            notes: "run A",
        }),
        { runId: RUN_A.run_label, runResult: RUN_A, sourceFamilyLabel: "Synthetic Signal" }
    );
    const requestB = annotateShellRecord(
        buildActivationReviewRequest({
            workbench: {
                ...WORKBENCH_A,
                scope: {
                    stream_id: "stream.request.002",
                    segment_ids: ["seg.9"],
                    cross_run_context: { available: false, run_count: 1 },
                },
            },
            runResult: RUN_B,
            sourceFamilyLabel: "File Import (JSON / CSV / WAV)",
            notes: "run B",
        }),
        { runId: RUN_B.run_label, runResult: RUN_B, sourceFamilyLabel: "File Import (JSON / CSV / WAV)" }
    );

    const state = buildActiveShellState({
        runId: RUN_A.run_label,
        runResult: RUN_A,
        workbench: WORKBENCH_A,
        requestLog: [requestB, requestA],
        replayLog: [],
        sourceFamilyLabel: "Synthetic Signal",
        runStatus: "complete",
    });

    eq(state.activeRequest.request_id, requestA.request_id, "B1: activeRequest matches the active run request");
    eq(state.requestLog.length, 1, "B2: active view shows only active-context request entries");
    eq(state.requestLog[0].request_id, requestA.request_id, "B3: request log head matches active request");
    eq(state.requestHistoryCount, 2, "B4: total request history count preserved separately");
}

section("C. request state clears on run/context change without a new active request");
{
    const previousRequest = annotateShellRecord(
        buildConsultationRequest({
            workbench: WORKBENCH_A,
            runResult: RUN_A,
            sourceFamilyLabel: "Synthetic Signal",
        }),
        { runId: RUN_A.run_label, runResult: RUN_A, sourceFamilyLabel: "Synthetic Signal" }
    );

    const state = buildActiveShellState({
        runId: RUN_B.run_label,
        runResult: RUN_B,
        workbench: { scope: { stream_id: "stream.request.002", segment_ids: ["seg.9"] } },
        requestLog: [previousRequest],
        replayLog: [],
        sourceFamilyLabel: "File Import (JSON / CSV / WAV)",
        runStatus: "complete",
    });

    eq(state.activeRequest, null, "C1: stale request does not carry into a new active run");
    eq(state.requestLog.length, 0, "C2: stale request log entries are filtered out of active view");
    eq(state.requestHistoryCount, 1, "C3: prior request remains counted in session history");
}

section("D. shell source uses one visible request object path");
{
    const shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8");
    const requestModelSrc = await readFile(path.join(ROOT, "hud/requestModel.js"), "utf8");
    const appSrc = await readFile(path.join(ROOT, "hud/SemanticOscilloscopeApp.jsx"), "utf8");

    ok(shellSrc.includes("activeRequest={activeShellState.activeRequest}"), "D1: request pane receives activeRequest from shell state");
    ok(shellSrc.includes("downloadRequestJson(activeRequest)"), "D2: request export uses activeRequest");
    ok(shellSrc.includes("request_surface_posture"), "D3: pane renders request_surface_posture from the request object");
    ok(shellSrc.includes("activeRequest.fulfillment_status") && shellSrc.includes("activeRequest.mechanization_status"), "D4: pane shows bounded prepared-only status lines from the active request object");
    ok(requestModelSrc.includes("fulfillment_status"), "D5: request model emits fulfillment_status");
    ok(requestModelSrc.includes("mechanization_status"), "D6: request model emits mechanization_status");
    ok(appSrc.includes("activeRequest"), "D7: app mirror keeps activeRequest in exported shell state");
}

finish();
