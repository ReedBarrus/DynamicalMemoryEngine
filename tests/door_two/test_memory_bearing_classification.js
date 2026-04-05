import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { deriveMemorySupportClassification } from "../../hud/memorySupportClassification.js";
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

const RUN_RESULT = {
    ok: true,
    run_label: "shell.run.leg3.memory.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.leg3.memory.001",
            channel: "ch0",
            modality: "voltage",
            meta: { seed: 42, noiseStd: 0.12, durationSec: 10 },
        },
        h1s: Array.from({ length: 12 }, (_, idx) => ({ id: `h${idx}` })),
        m1s: Array.from({ length: 5 }, (_, idx) => ({ id: `m${idx}` })),
        anomaly_reports: [{ anomaly_type: "drift", divergence_score: 0.22 }],
        q: { receipts: { query: { query_policy_id: "query.synthetic.v1" } } },
    },
};

const WORKBENCH = {
    scope: {
        stream_id: "stream.leg3.memory.001",
        segment_ids: ["seg.0", "seg.1", "seg.2"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: {
        artifacts: RUN_RESULT.artifacts,
        substrate: {
            state_count: 17,
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
                { t_transition: 2.2, divergence_score: 0.27, detected_event_types: ["drift"] },
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

const SUPPORT_ONLY_WORKBENCH = {
    ...WORKBENCH,
    runtime: {
        ...WORKBENCH.runtime,
        artifacts: {
            ...WORKBENCH.runtime.artifacts,
            m1s: [],
        },
    },
};

const ACTIVE_REQUEST = buildConsultationRequest({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
});

const TIER0_REPLAY = buildRuntimeReconstructionReplay({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
});

const DEGRADED_REPLAY = {
    request_status: "prepared",
    reconstruction_status: "downgraded",
    replay_type: "runtime_reconstruction",
    declared_lens: TIER0_REPLAY.declared_lens,
    retained_tier_used: { tier_used: 1, tier_label: "Tier 1 - durable receipts" },
    support_basis: ["request_support_evidence", "receipt_lineage"],
    replay_fidelity_record_v0: {
        mechanization_status: "partially_mechanized",
        retained_tier: "Tier 1 - durable receipts",
        support_basis: ["request_support_evidence", "receipt_lineage"],
        threshold_outcome: "support_unresolved",
        downgrade_posture: "support_degraded",
        fidelity_posture: "support-trace class - degraded continuity",
        failure_posture: "request-support replay is missing the original request context",
    },
};

const UNRESOLVED_REPLAY = {
    request_status: "prepared",
    reconstruction_status: "prepared",
    replay_type: "runtime_reconstruction",
    declared_lens: TIER0_REPLAY.declared_lens,
    retained_tier_used: TIER0_REPLAY.retained_tier_used,
    support_basis: ["harmonic_state_evidence"],
    replay_fidelity_record_v0: {
        mechanization_status: "partially_mechanized",
        retained_tier: "Tier 0 - live working state",
        support_basis: ["harmonic_state_evidence"],
        threshold_outcome: "support_unresolved",
        downgrade_posture: "",
        fidelity_posture: "support-trace class - unresolved support question",
        failure_posture: "",
    },
};

function buildShellState({ replay = null, workbench = WORKBENCH, activeRequest = ACTIVE_REQUEST } = {}) {
    return {
        runId: "shell.run.leg3.memory.001",
        activeRunLabel: RUN_RESULT.run_label,
        workbench,
        runResult: RUN_RESULT,
        activeRequest,
        requestLog: activeRequest ? [activeRequest] : [],
        replayLog: replay ? [replay] : [],
        requestHistoryCount: activeRequest ? 1 : 0,
        replayHistoryCount: replay ? 1 : 0,
        sourceFamilyLabel: "Synthetic Signal",
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

section("A. memory-bearing versus support-only classes stay structurally grounded");
{
    const retainedMemory = deriveMemorySupportClassification({
        objectKind: "retained_signature",
        hasActiveResult: true,
        workbench: WORKBENCH,
    });
    const retainedSupportOnly = deriveMemorySupportClassification({
        objectKind: "retained_signature",
        hasActiveResult: true,
        workbench: SUPPORT_ONLY_WORKBENCH,
    });
    const replaySupportOnly = deriveMemorySupportClassification({
        objectKind: "replay",
        replay: TIER0_REPLAY,
    });
    const reconstructionSupport = deriveMemorySupportClassification({
        objectKind: "reconstruction",
        replay: TIER0_REPLAY,
    });
    const reviewOnly = deriveMemorySupportClassification({
        objectKind: "review_gate",
        hasActiveResult: true,
        activeRequest: ACTIVE_REQUEST,
    });
    const degradedResidue = deriveMemorySupportClassification({
        objectKind: "replay",
        replay: DEGRADED_REPLAY,
    });
    const unresolved = deriveMemorySupportClassification({
        objectKind: "replay",
        replay: UNRESOLVED_REPLAY,
    });

    eq(retainedMemory.classCode, "memory_bearing", "A1: retained signature can classify as memory_bearing");
    eq(retainedMemory.lawfulNextPosture, "keep", "A2: memory_bearing maps to keep");
    includes(retainedMemory.classificationBasis, "Active retained structural trace survives", "A3: memory_bearing stays support-grounded");
    eq(retainedSupportOnly.classCode, "memory_supporting", "A4: retained support without retained closure stays memory_supporting");
    eq(replaySupportOnly.classCode, "replay_support_only", "A5: replay stays replay_support_only even when conserved");
    includes(replaySupportOnly.note, "not preservation-bearing memory", "A6: replay usefulness does not become memory-bearing");
    eq(reconstructionSupport.classCode, "memory_supporting", "A7: reconstruction maps to memory_supporting");
    eq(reviewOnly.classCode, "review_only", "A8: review gate stays review_only");
    eq(degradedResidue.classCode, "degraded_residue", "A9: degraded replay maps to degraded_residue");
    eq(unresolved.classCode, "unresolved", "A10: unresolved replay stays unresolved");
}

section("B. operator surface exposes class, basis, and anti-inflation posture");
{
    const model = buildOperatorLegibilityModel(buildShellState({ replay: TIER0_REPLAY }));
    const retainedStage = stage(model, "retained_signature");
    const replay = replayObject(model);
    const reconstruction = reconstructionObject(model);
    const review = stage(model, "review_gate");

    eq(factValue(retainedStage, "memory / support class"), "memory_bearing", "B1: retained stage exposes memory_bearing");
    includes(factValue(retainedStage, "classification basis"), "retained structural trace", "B2: retained stage exposes structural classification basis");
    ok(retainedStage.postureChips.includes("memory_bearing"), "B3: retained stage chip exposes memory_bearing");
    eq(factValue(replay, "memory / support class"), "replay_support_only", "B4: replay object exposes replay_support_only");
    includes(factValue(replay, "classification basis"), "bounded to declared support", "B5: replay classification stays support-grounded");
    includes(factValue(replay, "classification boundary"), "must not promote the replay object into memory-bearing status", "B6: replay keeps anti-inflation boundary");
    eq(factValue(reconstruction, "memory / support class"), "memory_supporting", "B7: reconstruction exposes memory_supporting");
    includes(factValue(reconstruction, "classification basis"), "Support-trace reconstruction remains structurally grounded", "B8: reconstruction basis stays structural");
    eq(factValue(review, "memory / support class"), "review_only", "B9: review gate exposes review_only");
    includes(factValue(review, "classification basis"), "downstream evaluation support only", "B10: review gate stays fenced");
}

section("C. semantic-only usefulness does not inflate memory-bearing status");
{
    const helperSrc = await readFile(path.join(ROOT, "hud/memorySupportClassification.js"), "utf8");
    const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");

    includes(helperSrc, "Semantic usefulness alone does not justify memory-bearing language", "C1: helper blocks semantic-only memory inflation");
    includes(helperSrc, "Replay remains support-only", "C2: helper keeps replay support-only");
    includes(modelSrc, "\"memory / support class\"", "C3: model emits memory/support class");
    includes(modelSrc, "\"classification basis\"", "C4: model emits classification basis");
    includes(modelSrc, "\"classification boundary\"", "C5: model emits classification boundary");
    includes(panelSrc, "Semantic usefulness does not make an object memory-bearing.", "C6: panel keeps semantic usefulness below memory-bearing status");
}

finish();
