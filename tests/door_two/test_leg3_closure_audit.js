import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildOperatorLegibilityModel } from "../../hud/operatorLegibilityModel.js";
import { buildRuntimeReconstructionReplay } from "../../hud/replayModel.js";
import { buildConsultationRequest } from "../../hud/requestModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

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

function factValue(object, label) {
    return (object?.auditFacts ?? []).find(([k]) => k === label)?.[1] ?? null;
}

function stage(model, id) {
    return model.stages.find((item) => item.id === id);
}

function replayObject(model) {
    return stage(model, "replay_reconstruction")?.objects?.find((item) => item.id === "replay");
}

function reconstructionObject(model) {
    return stage(model, "replay_reconstruction")?.objects?.find((item) => item.id === "reconstruction");
}

function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const SYNTH_RUN = {
    ok: true,
    run_label: "shell.run.leg3.closure.synthetic.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.leg3.closure.synthetic.001",
            channel: "ch0",
            modality: "voltage",
            meta: { seed: 42, noiseStd: 0.12, durationSec: 10 },
        },
        h1s: Array.from({ length: 12 }, (_, idx) => ({ id: `h${idx}` })),
        m1s: Array.from({ length: 4 }, (_, idx) => ({ id: `m${idx}` })),
        anomaly_reports: [{ anomaly_type: "drift", divergence_score: 0.2 }],
        q: { receipts: { query: { query_policy_id: "query.synthetic.v1" } } },
    },
};

const SYNTH_WORKBENCH = {
    scope: {
        stream_id: "stream.leg3.closure.synthetic.001",
        segment_ids: ["seg.0", "seg.1", "seg.2"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: {
        artifacts: SYNTH_RUN.artifacts,
        substrate: {
            state_count: 16,
            basin_count: 0,
            segment_count: 3,
            trajectory_frames: 10,
            transition_report: {
                total_transitions: 1,
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
            ],
        },
    },
    interpretation: {
        trajectory: {
            trajectory_character: { convergence: "bounded", motion: "active" },
            neighborhood_character: {
                occupancy: "developing",
                recurrence_strength: "low",
                evidence: { total_re_entries: 0 },
            },
            segment_character: { continuity: "mixed" },
        },
    },
    promotion_readiness: {
        report: { readiness_summary: { overall_readiness: "insufficient" } },
    },
    canon_candidate: {
        dossier: { candidate_claim: { claim_type: "bounded_structural_claim" } },
    },
    consensus_review: {
        review: { result: "defer" },
    },
};

const RECORDED_RUN = {
    ok: true,
    run_label: "shell.run.leg3.closure.recorded.001",
    artifacts: {
        a1: {
            source_id: "baseline_001.wav",
            stream_id: "recorded.stream.leg3.closure.001",
            channel: "mono",
            modality: "audio",
            meta: {
                source_mode: "recorded_source",
                original_filename: "baseline_001.wav",
                recorded_family: "daw_tone_sine_400hz_RoomChange",
            },
        },
        h1s: [{ id: "h0" }],
        m1s: [],
        anomaly_reports: [],
        q: { receipts: { query: { query_policy_id: "query.recorded.v1" } } },
    },
};

const RECORDED_WORKBENCH = {
    ...SYNTH_WORKBENCH,
    scope: {
        stream_id: "recorded.stream.leg3.closure.001",
        segment_ids: ["seg.0"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: {
        ...SYNTH_WORKBENCH.runtime,
        artifacts: RECORDED_RUN.artifacts,
    },
};

const ACTIVE_REPLAY = buildRuntimeReconstructionReplay({
    workbench: SYNTH_WORKBENCH,
    runResult: SYNTH_RUN,
    sourceFamilyLabel: "Synthetic Signal",
});

const ACTIVE_REQUEST = buildConsultationRequest({
    workbench: SYNTH_WORKBENCH,
    runResult: SYNTH_RUN,
    sourceFamilyLabel: "Synthetic Signal",
});

function buildShellState({
    runResult = SYNTH_RUN,
    workbench = SYNTH_WORKBENCH,
    sourceFamilyLabel = "Synthetic Signal",
    replay = ACTIVE_REPLAY,
    activeRequest = ACTIVE_REQUEST,
} = {}) {
    return {
        runId: runResult.run_label,
        activeRunLabel: runResult.run_label,
        workbench,
        runResult,
        activeRequest,
        requestLog: activeRequest ? [activeRequest] : [],
        replayLog: replay ? [replay] : [],
        requestHistoryCount: activeRequest ? 1 : 0,
        replayHistoryCount: replay ? 1 : 0,
        sourceFamilyLabel,
        runStatus: "complete",
        runError: null,
        hasActiveResult: true,
    };
}

section("A. Leg 3 operator surface exposes all active audit layers together");
{
    const model = buildOperatorLegibilityModel(buildShellState());
    const sourceStage = stage(model, "source");
    const retainedStage = stage(model, "retained_signature");
    const replay = replayObject(model);
    const reconstruction = reconstructionObject(model);
    const review = stage(model, "review_gate");

    includes(factValue(sourceStage, "dominant weak-state"), "noise", "A1: source stage exposes weak-state accounting");
    includes(factValue(retainedStage, "memory / support class"), "memory_bearing", "A2: retained stage exposes memory/support classification");
    includes(factValue(retainedStage, "compression / reminting posture"), "compressed_retained", "A3: retained stage exposes compression accountability");
    includes(factValue(replay, "object handle"), "RPLY:", "A4: replay object exposes bounded object tracking");
    includes(factValue(replay, "structural identity"), "conserved", "A5: replay object exposes structural identity posture");
    includes(factValue(replay, "weak-state boundary"), "bounded lattice", "A6: replay object blocks confidence collapse");
    includes(factValue(reconstruction, "memory / support class"), "memory_supporting", "A7: reconstruction stays support-only rather than memory-bearing");
    includes(factValue(review, "memory / support class"), "review_only", "A8: review gate remains fenced downstream");
}

section("B. Recorded source basis remains explicit without identity inflation");
{
    const recordedModel = buildOperatorLegibilityModel(buildShellState({
        runResult: RECORDED_RUN,
        workbench: RECORDED_WORKBENCH,
        sourceFamilyLabel: "Recorded Source Lane",
        replay: null,
        activeRequest: null,
    }));
    const sourceStage = stage(recordedModel, "source");

    includes(factValue(sourceStage, "source basis"), "Recorded Source Lane", "B1: recorded source basis stays explicit");
    includes(factValue(sourceStage, "object handle"), "SRC:", "B2: recorded source keeps bounded handle");
    includes(factValue(sourceStage, "address boundary"), "bounded tracking aid only", "B3: recorded source still blocks handle inflation");
}

section("C. Panel source keeps Leg 3 non-claims visible");
{
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");
    const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");

    includes(panelSrc, "Displayed coherence is not preserved identity.", "C1: panel keeps semantic-only preservation inflation blocked");
    includes(panelSrc, "Semantic usefulness does not make an object memory-bearing.", "C2: panel keeps memory-bearing support-grounded");
    includes(panelSrc, "Reminting is distinct from direct preservation.", "C3: panel keeps reminting distinct from direct retention");
    includes(panelSrc, "This surface uses a weak-state lattice, not a global confidence score.", "C4: panel keeps weak-state lattice explicit");
    includes(modelSrc, "\"structural identity\"", "C5: model emits structural identity row");
    includes(modelSrc, "\"memory / support class\"", "C6: model emits memory/support class row");
    includes(modelSrc, "\"compression / reminting posture\"", "C7: model emits accountability row");
    includes(modelSrc, "\"object handle\"", "C8: model emits bounded object tracking row");
    includes(modelSrc, "\"dominant weak-state\"", "C9: model emits weak-state row");
}

finish();
