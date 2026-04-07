import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildOperatorLegibilityModel } from "../../../hud/operatorLegibilityModel.js";
import { buildRuntimeReconstructionReplay } from "../../../hud/replayModel.js";
import { buildConsultationRequest } from "../../../hud/requestModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let PASS = 0;
let FAIL = 0;

function section(title) {
    console.log(`\n-- ${title} --`);
}

function ok(condition, label) {
    if (condition) {
        PASS += 1;
        console.log(`  ok ${label}`);
    } else {
        FAIL += 1;
        console.error(`  not ok ${label}`);
    }
}

function eq(actual, expected, label) {
    ok(
        Object.is(actual, expected),
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${expected}, got ${actual})`}`
    );
}

function includes(text, pattern, label) {
    ok(String(text).includes(pattern), label);
}

function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const RUN_RESULT = {
    ok: true,
    run_label: "shell.run.operator.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.operator.001",
            channel: "ch0",
            modality: "voltage",
            meta: { seed: 42, noiseStd: 0.12, durationSec: 10 },
        },
        h1s: Array.from({ length: 16 }, (_, idx) => ({ id: `h${idx}` })),
        m1s: Array.from({ length: 7 }, (_, idx) => ({ id: `m${idx}` })),
        anomaly_reports: [
            { anomaly_type: "drift", divergence_score: 0.03 },
            { anomaly_type: "energy_shift", divergence_score: 0.37 },
        ],
        q: { receipts: { query: { query_policy_id: "query.synthetic.v1" } } },
    },
};

const WORKBENCH = {
    scope: {
        stream_id: "stream.operator.001",
        segment_ids: ["seg.0", "seg.1", "seg.2", "seg.3"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: {
        artifacts: RUN_RESULT.artifacts,
        substrate: {
            state_count: 23,
            basin_count: 0,
            segment_count: 4,
            trajectory_frames: 18,
            transition_report: {
                total_transitions: 0,
                total_re_entries: 0,
                current_neighborhood_id: null,
                current_dwell_count: 0,
                current_dwell_duration_sec: 0,
                dominant_dwell_share: 0,
                dwell: [],
                transitions: [],
            },
            segment_transitions: [
                { t_transition: 2.5, divergence_score: 0.24, detected_event_types: ["drift"] },
                { t_transition: 4.5, divergence_score: 0.37, detected_event_types: ["drift", "energy_shift"] },
            ],
        },
        audit: {
            skipped_windows: [],
            merge_failures: [],
            consensus_receipts: [],
        },
    },
    interpretation: {
        trajectory: {
            trajectory_character: { convergence: "bounded", motion: "active" },
            neighborhood_character: {
                occupancy: "sparse",
                recurrence_strength: "low",
                evidence: {
                    total_re_entries: 0,
                    current_dwell_count: 0,
                    current_dwell_duration_sec: 0,
                    dominant_dwell_share: 0,
                },
            },
            segment_character: { continuity: "mixed" },
        },
        attention_memory: {
            report_type: "runtime:attention_memory_report",
        },
    },
    promotion_readiness: {
        report: {
            readiness_summary: { overall_readiness: "insufficient", confidence: "low" },
            evidence_domains: { transition_selectivity: { label: "bounded" } },
        },
    },
    canon_candidate: {
        dossier: {
            candidate_claim: { claim_type: "bounded_structural_claim" },
            blockers: [],
            insufficiencies: ["bounded_support_only"],
        },
    },
    consensus_review: {
        review: { result: "defer" },
    },
};

const ACTIVE_REQUEST = buildConsultationRequest({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
});

const ACTIVE_REPLAY = buildRuntimeReconstructionReplay({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
});

const SHELL_STATE = {
    runId: "shell.run.operator.001",
    activeRunLabel: RUN_RESULT.run_label,
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    activeRequest: ACTIVE_REQUEST,
    requestLog: [ACTIVE_REQUEST],
    replayLog: [ACTIVE_REPLAY],
    requestHistoryCount: 1,
    replayHistoryCount: 1,
    sourceFamilyLabel: "Synthetic Signal",
    runStatus: "complete",
    runError: null,
    hasActiveResult: true,
};

section("A. operator model uses live shell and workbench state");
{
    const model = buildOperatorLegibilityModel(SHELL_STATE);
    const replayStage = model.stages.find((stage) => stage.id === "replay_reconstruction");
    const reviewStage = model.stages.find((stage) => stage.id === "review_gate");

    eq(model.hasActiveResult, true, "A1: operator model reflects active shell result");
    eq(model.sourceBasis.sourceFamily, "Synthetic Signal", "A2: source family comes from shell state");
    eq(model.sourceBasis.runLabel, RUN_RESULT.run_label, "A3: active run label comes from shell state");
    eq(model.sourceBasis.sourceId, "synthetic.seed42", "A4: source id comes from runtime result");
    includes(model.sourceBasis.sourceProfile, "noise std 0.12", "A5: source profile exposes active source basis");
    eq(model.evidenceDepth.code, "coarse_runtime_support", "A6: evidence-depth posture reflects verified coarse synthetic path");
    includes(
        model.evidenceDepth.note,
        "segment-boundary and anomaly evidence",
        "A7: coarse posture stays explicit about where differentiation still survives"
    );
    eq(model.stages.length, 6, "A8: bounded operator path exposes six stages");
    eq(replayStage.objects.length, 2, "A9: replay and reconstruction remain distinct objects");
    eq(replayStage.objects[0].title, "Replay", "A10: replay object remains visible");
    eq(replayStage.objects[1].title, "Reconstruction", "A11: reconstruction object remains visible");
    includes(replayStage.objects[0].currentStatus, ACTIVE_REPLAY.request_status, "A12: replay status comes from active replay object");
    includes(replayStage.objects[1].currentStatus, ACTIVE_REPLAY.reconstruction_status, "A13: reconstruction status comes from active replay object");
    includes(reviewStage.currentStatus, ACTIVE_REQUEST.fulfillment_status, "A14: review gate keeps prepared-not-fulfilled posture visible");
    includes(reviewStage.legalClaim, "not canon", "A15: review gate stays fenced below canon");
}

section("B. operator mode is wired into the main app shell");
{
    const appSrc = await readFile(path.join(ROOT, "hud/SemanticOscilloscopeApp.jsx"), "utf8");
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");

    includes(appSrc, 'id: "operator"', "B1: app defines Operator mode");
    includes(appSrc, "OperatorLegibilityPanel", "B2: app imports operator panel");
    includes(appSrc, "<OperatorPane shellState={shellState} />", "B3: operator mode receives mirrored shell state");
    includes(appSrc, "Operator Surface", "B4: operator pane is labeled as a read-side operator surface");
    includes(panelSrc, "Source -> Spectral State -> Retained Signature -> Replay / Reconstruction -> Interpretation Overlay -> Review Gate", "B5: panel renders the bounded causal strip");
    includes(panelSrc, "what object am I", "B6: panel answers object identity");
    includes(panelSrc, "how produced", "B7: panel answers production path");
    includes(panelSrc, "depends on", "B8: panel answers dependency basis");
    includes(panelSrc, "current status", "B9: panel answers current status");
    includes(panelSrc, "legal claim", "B10: panel answers bounded claim posture");
    includes(panelSrc, "what next", "B11: panel answers next lawful action");
    includes(panelSrc, "Replay is not fused with reconstruction", "B12: panel preserves replay/reconstruction boundary in visible non-claims");
    ok(
        panelSrc.includes("Prepared request") && panelSrc.includes("not fulfilled review"),
        "B13: panel preserves request/review fence in visible non-claims"
    );
}

finish();
