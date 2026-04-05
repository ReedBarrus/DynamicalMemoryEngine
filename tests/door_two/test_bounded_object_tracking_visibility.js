import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { deriveBoundedObjectTracking } from "../../hud/boundedObjectTracking.js";
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

function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const SYNTH_RUN = {
    ok: true,
    run_label: "shell.run.leg3.track.synthetic.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.leg3.track.synthetic.001",
            channel: "ch0",
            modality: "voltage",
            meta: { seed: 42, noiseStd: 0.12, durationSec: 10 },
        },
        h1s: Array.from({ length: 10 }, (_, idx) => ({ id: `h${idx}` })),
        m1s: Array.from({ length: 4 }, (_, idx) => ({ id: `m${idx}` })),
        anomaly_reports: [{ anomaly_type: "drift", divergence_score: 0.2 }],
        q: { receipts: { query: { query_policy_id: "query.synthetic.v1" } } },
    },
};

const SYNTH_WORKBENCH = {
    scope: {
        stream_id: "stream.leg3.track.synthetic.001",
        segment_ids: ["seg.0", "seg.1", "seg.2"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: {
        artifacts: SYNTH_RUN.artifacts,
        substrate: {
            state_count: 14,
            basin_count: 0,
            segment_count: 3,
            trajectory_frames: 10,
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
                { t_transition: 2.3, divergence_score: 0.24, detected_event_types: ["drift"] },
            ],
        },
    },
    interpretation: {
        trajectory: {
            trajectory_character: { convergence: "bounded", motion: "active" },
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
    run_label: "shell.run.leg3.track.recorded.001",
    artifacts: {
        a1: {
            source_id: "baseline_001.wav",
            stream_id: "recorded.stream.leg3.track.001",
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
        stream_id: "recorded.stream.leg3.track.001",
        segment_ids: ["seg.0"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: {
        ...SYNTH_WORKBENCH.runtime,
        artifacts: RECORDED_RUN.artifacts,
    },
};

const ACTIVE_REQUEST = buildConsultationRequest({
    workbench: SYNTH_WORKBENCH,
    runResult: SYNTH_RUN,
    sourceFamilyLabel: "Synthetic Signal",
});

const ACTIVE_REPLAY = buildRuntimeReconstructionReplay({
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

function stage(model, id) {
    return model.stages.find((item) => item.id === id);
}

function replayObject(model) {
    return stage(model, "replay_reconstruction")?.objects?.find((item) => item.id === "replay");
}

function reconstructionObject(model) {
    return stage(model, "replay_reconstruction")?.objects?.find((item) => item.id === "reconstruction");
}

section("A. bounded object tracking helper stays multi-axis and non-magical");
{
    const sourceTracking = deriveBoundedObjectTracking({
        objectKind: "source",
        hasActiveResult: true,
        sourceFamilyLabel: "Synthetic Signal",
        runResult: SYNTH_RUN,
        workbench: SYNTH_WORKBENCH,
    });
    const replayTracking = deriveBoundedObjectTracking({
        objectKind: "replay",
        replay: ACTIVE_REPLAY,
        sourceFamilyLabel: "Synthetic Signal",
        runResult: SYNTH_RUN,
        workbench: SYNTH_WORKBENCH,
    });
    const reconstructionTracking = deriveBoundedObjectTracking({
        objectKind: "reconstruction",
        replay: ACTIVE_REPLAY,
        sourceFamilyLabel: "Synthetic Signal",
        runResult: SYNTH_RUN,
        workbench: SYNTH_WORKBENCH,
    });

    includes(sourceTracking.objectHandle, "SRC:", "A1: source handle uses bounded source prefix");
    eq(sourceTracking.objectClass, "source_basis_object", "A2: source tracking exposes object class");
    includes(sourceTracking.routeClass, "lawful ingest", "A3: source tracking exposes route class");
    includes(sourceTracking.neighboringObjects, "downstream spectral_state", "A4: source tracking exposes neighbors");
    includes(replayTracking.objectHandle, "RPLY:", "A5: replay handle uses bounded replay prefix");
    eq(replayTracking.objectClass, "replay_object", "A6: replay tracking exposes replay object class");
    includes(replayTracking.supportTier, "Tier 0", "A7: replay tracking exposes support tier");
    includes(reconstructionTracking.objectClass, "support_trace_reconstruction object", "A8: reconstruction tracking exposes reconstruction class");
    includes(replayTracking.addressBoundary, "does not by itself prove full structural identity", "A9: tracking boundary blocks address inflation");
}

section("B. operator model exposes handle, class, route, and address boundary");
{
    const syntheticModel = buildOperatorLegibilityModel(buildShellState());
    const sourceStage = stage(syntheticModel, "source");
    const retainedStage = stage(syntheticModel, "retained_signature");
    const replay = replayObject(syntheticModel);
    const reconstruction = reconstructionObject(syntheticModel);
    const review = stage(syntheticModel, "review_gate");

    includes(factValue(sourceStage, "object handle"), "SRC:", "B1: source stage exposes object handle");
    eq(factValue(sourceStage, "object class"), "source_basis_object", "B2: source stage exposes object class");
    includes(factValue(sourceStage, "route class"), "lawful ingest", "B3: source stage exposes route class");
    includes(factValue(retainedStage, "neighboring objects"), "replay_reconstruction", "B4: retained stage exposes neighbors");
    includes(factValue(replay, "object handle"), "RPLY:", "B5: replay object exposes replay handle");
    includes(factValue(replay, "object class"), "replay_object", "B6: replay object exposes replay class");
    includes(factValue(replay, "address boundary"), "does not by itself prove full structural identity", "B7: replay object blocks handle inflation");
    includes(factValue(replay, "structural identity"), "conserved", "B8: identity outcome remains separate from object handle");
    ok(
        factValue(replay, "object handle") !== factValue(replay, "structural identity"),
        "B9: handle and identity outcome remain distinct fields"
    );
    includes(factValue(reconstruction, "object class"), "support_trace_reconstruction object", "B10: reconstruction object exposes reconstruction class");
    includes(factValue(review, "object handle"), "REQ:", "B11: review gate exposes prepared-request tracking handle");

    const recordedModel = buildOperatorLegibilityModel(buildShellState({
        runResult: RECORDED_RUN,
        workbench: RECORDED_WORKBENCH,
        sourceFamilyLabel: "Recorded Source Lane",
        replay: null,
        activeRequest: null,
    }));
    const recordedSource = stage(recordedModel, "source");
    includes(factValue(recordedSource, "source basis"), "Recorded Source Lane", "B12: recorded source basis remains explicit in tracking");
    includes(factValue(recordedSource, "object handle"), "SRC:", "B13: recorded source still uses bounded source handle");
}

section("C. source keeps address-vs-identity anti-inflation explicit");
{
    const helperSrc = await readFile(path.join(ROOT, "hud/boundedObjectTracking.js"), "utf8");
    const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");

    includes(helperSrc, "bounded tracking aid only", "C1: helper declares bounded tracking posture");
    includes(helperSrc, "does not by itself prove full structural identity", "C2: helper blocks handle-as-identity inflation");
    includes(modelSrc, "\"object handle\"", "C3: model emits object handle");
    includes(modelSrc, "\"object class\"", "C4: model emits object class");
    includes(modelSrc, "\"address boundary\"", "C5: model emits address boundary");
    includes(panelSrc, "Object handles aid tracking, but they are not full identity by themselves.", "C6: panel keeps handle inflation explicit");
    includes(panelSrc, "One handle does not stand in for", "C7: panel non-claims block keeps address boundary visible");
}

finish();
