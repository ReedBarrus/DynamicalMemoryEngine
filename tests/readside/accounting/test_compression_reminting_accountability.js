import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { deriveCompressionRemintingAccountability } from "../../../hud/compressionRemintingAccountability.js";
import { buildOperatorLegibilityModel } from "../../../hud/operatorLegibilityModel.js";
import { buildRuntimeReconstructionReplay } from "../../../hud/replayModel.js";

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

function factValue(object, label) {
    return (object?.auditFacts ?? []).find(([k]) => k === label)?.[1] ?? null;
}

function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const RUN_RESULT = {
    ok: true,
    run_label: "shell.run.leg3.compression.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.leg3.compression.001",
            channel: "ch0",
            modality: "voltage",
            meta: { seed: 42, noiseStd: 0.12, durationSec: 10 },
        },
        h1s: Array.from({ length: 12 }, (_, idx) => ({ id: `h${idx}` })),
        m1s: Array.from({ length: 4 }, (_, idx) => ({ id: `m${idx}` })),
        anomaly_reports: [{ anomaly_type: "drift", divergence_score: 0.18 }],
        q: { receipts: { query: { query_policy_id: "query.synthetic.v1" } } },
    },
};

const WORKBENCH = {
    scope: {
        stream_id: "stream.leg3.compression.001",
        segment_ids: ["seg.0", "seg.1", "seg.2"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: {
        artifacts: RUN_RESULT.artifacts,
        substrate: {
            state_count: 16,
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
                { t_transition: 2.0, divergence_score: 0.22, detected_event_types: ["drift"] },
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

const DIRECT_ONLY_WORKBENCH = {
    ...WORKBENCH,
    runtime: {
        ...WORKBENCH.runtime,
        artifacts: {
            ...WORKBENCH.runtime.artifacts,
            m1s: [],
        },
    },
};

const TIER0_REPLAY = buildRuntimeReconstructionReplay({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
});

const REMINTED_REPLAY = {
    ...TIER0_REPLAY,
    retained_tier_used: {
        tier_used: 1,
        tier_label: "Tier 1 - durable receipts",
    },
    reconstruction_status: "completed",
    replay_fidelity_record_v0: {
        ...TIER0_REPLAY.replay_fidelity_record_v0,
        retained_tier: "Tier 1 - durable receipts",
        reconstruction_class: "derived_structural_reminting",
        threshold_outcome: "bounded_supported",
    },
    reconstruction_summary: {
        ...TIER0_REPLAY.reconstruction_summary,
        reconstruction_class: "derived_structural_reminting",
    },
};

const DEGRADED_REPLAY = {
    ...TIER0_REPLAY,
    reconstruction_status: "downgraded",
    threshold_posture: {
        ...TIER0_REPLAY.threshold_posture,
        threshold_outcome: "support_unresolved",
        downgrade_output: "support_degraded",
        compression_survival: "warning",
        distortion_posture: "warning",
    },
    replay_fidelity_record_v0: {
        ...TIER0_REPLAY.replay_fidelity_record_v0,
        mechanization_status: "partially_mechanized",
        threshold_outcome: "support_unresolved",
        downgrade_posture: "support_degraded",
        fidelity_posture: "support-trace class - degraded continuity",
        failure_posture: "downgrade/insufficiency remains explicit",
    },
};

const UNRESOLVED_REPLAY = {
    ...TIER0_REPLAY,
    threshold_posture: {
        ...TIER0_REPLAY.threshold_posture,
        threshold_outcome: "support_unresolved",
        downgrade_output: "",
        compression_survival: "unknown",
        distortion_posture: "warning",
    },
    replay_fidelity_record_v0: {
        ...TIER0_REPLAY.replay_fidelity_record_v0,
        mechanization_status: "partially_mechanized",
        threshold_outcome: "support_unresolved",
        downgrade_posture: "",
        fidelity_posture: "support-trace class - unresolved support question",
        failure_posture: "",
    },
};

function buildShellState(replay = TIER0_REPLAY, workbench = WORKBENCH) {
    return {
        runId: "shell.run.leg3.compression.001",
        activeRunLabel: RUN_RESULT.run_label,
        workbench,
        runResult: RUN_RESULT,
        activeRequest: null,
        requestLog: [],
        replayLog: replay ? [replay] : [],
        requestHistoryCount: 0,
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

section("A. compression/reminting accountability stays distinct and support-grounded");
{
    const compressedRetained = deriveCompressionRemintingAccountability({
        objectKind: "retained_signature",
        hasActiveResult: true,
        workbench: WORKBENCH,
    });
    const directlyRetained = deriveCompressionRemintingAccountability({
        objectKind: "retained_signature",
        hasActiveResult: true,
        workbench: DIRECT_ONLY_WORKBENCH,
    });
    const replaySupport = deriveCompressionRemintingAccountability({
        objectKind: "replay",
        replay: TIER0_REPLAY,
    });
    const reconstructed = deriveCompressionRemintingAccountability({
        objectKind: "reconstruction",
        replay: TIER0_REPLAY,
    });
    const reminted = deriveCompressionRemintingAccountability({
        objectKind: "reconstruction",
        replay: REMINTED_REPLAY,
    });
    const degraded = deriveCompressionRemintingAccountability({
        objectKind: "reconstruction",
        replay: DEGRADED_REPLAY,
    });
    const unresolved = deriveCompressionRemintingAccountability({
        objectKind: "reconstruction",
        replay: UNRESOLVED_REPLAY,
    });

    eq(compressedRetained.classCode, "compressed_retained", "A1: retained signature can classify as compressed_retained");
    includes(compressedRetained.accountabilityBasis, "merge/compression path", "A2: compressed retention stays support-grounded");
    eq(directlyRetained.classCode, "directly_retained", "A3: direct structural survival stays distinct from compressed retention");
    eq(replaySupport.classCode, "replay_support_only", "A4: replay remains support-only for accountability");
    eq(reconstructed.classCode, "reconstructed", "A5: support-trace reconstruction stays reconstructed");
    eq(reminted.classCode, "reminted", "A6: derived structural reminting stays distinct");
    includes(reminted.notPreserved, "not direct retention", "A7: reminting stays distinct from direct preservation");
    eq(degraded.classCode, "degraded_residue", "A8: degraded replay/reconstruction maps to degraded residue");
    eq(unresolved.classCode, "unresolved", "A9: unresolved accountability remains unresolved");
}

section("B. operator surface exposes accountability posture and what survived");
{
    const retainedModel = buildOperatorLegibilityModel(buildShellState(TIER0_REPLAY, WORKBENCH));
    const retainedStage = stage(retainedModel, "retained_signature");
    const replay = replayObject(retainedModel);
    const reconstruction = reconstructionObject(retainedModel);

    eq(factValue(retainedStage, "compression / reminting posture"), "compressed_retained", "B1: retained stage exposes compressed retention");
    includes(factValue(retainedStage, "what survived"), "Compressed retained structure survives", "B2: retained stage shows what survived");
    ok(retainedStage.postureChips.includes("compressed_retained"), "B3: retained stage chip exposes compressed retention");
    eq(factValue(replay, "compression / reminting posture"), "replay_support_only", "B4: replay exposes support-only accountability");
    includes(factValue(replay, "accountability not preserved"), "does not prove direct preservation", "B5: replay blocks direct-preservation inflation");
    eq(factValue(reconstruction, "compression / reminting posture"), "reconstructed", "B6: reconstruction exposes reconstructed posture");
    includes(factValue(reconstruction, "accountability basis"), "support-trace reconstruction remains active", "B7: reconstruction basis stays explicit");

    const remintedModel = buildOperatorLegibilityModel(buildShellState(REMINTED_REPLAY, WORKBENCH));
    const remintedReconstruction = reconstructionObject(remintedModel);
    eq(factValue(remintedReconstruction, "compression / reminting posture"), "reminted", "B8: operator surface exposes reminted posture");
    includes(factValue(remintedReconstruction, "accountability basis"), "derived reminting path", "B9: reminted basis stays explicit");
}

section("C. panel source constrains preservation inflation further");
{
    const helperSrc = await readFile(path.join(ROOT, "hud/compressionRemintingAccountability.js"), "utf8");
    const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");

    includes(helperSrc, "Compression convenience does not become continuity proof", "C1: helper blocks compression convenience inflation");
    includes(helperSrc, "not direct preservation", "C2: helper keeps reminting distinct from direct preservation");
    includes(modelSrc, "\"compression / reminting posture\"", "C3: model emits accountability posture");
    includes(modelSrc, "\"what survived\"", "C4: model emits survival row");
    includes(modelSrc, "\"accountability not preserved\"", "C5: model emits accountability non-preserved row");
    includes(panelSrc, "Reminting is distinct from direct preservation.", "C6: panel keeps reminting distinct");
    includes(panelSrc, "Compression convenience is not continuity proof.", "C7: panel blocks compression-as-proof inflation");
}

finish();
