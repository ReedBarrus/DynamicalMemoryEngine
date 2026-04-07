import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildOperatorLegibilityModel } from "../../../hud/operatorLegibilityModel.js";
import {
    deriveOperatorThresholdPosture,
    deriveOperatorWeakStateDiscipline,
} from "../../../hud/replayThresholdFidelityPosture.js";
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
    run_label: "shell.run.leg2.failure.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.leg2.failure.001",
            channel: "ch0",
            modality: "voltage",
            meta: { seed: 42, noiseStd: 0.12, durationSec: 10 },
        },
        h1s: Array.from({ length: 8 }, (_, idx) => ({ id: `h${idx}` })),
        m1s: Array.from({ length: 3 }, (_, idx) => ({ id: `m${idx}` })),
        anomaly_reports: [{ anomaly_type: "drift", divergence_score: 0.21 }],
        q: { receipts: { query: { query_policy_id: "query.synthetic.v1" } } },
    },
};

const WORKBENCH = {
    scope: {
        stream_id: "stream.leg2.failure.001",
        segment_ids: ["seg.0", "seg.1", "seg.2"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: {
        artifacts: RUN_RESULT.artifacts,
        substrate: {
            state_count: 13,
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
                { t_transition: 2.4, divergence_score: 0.26, detected_event_types: ["drift"] },
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

const TIER2 = {
    tier_used: 2,
    tier_label: "Tier 2 - regenerable digest",
    honest_posture: "declared-only posture",
};

const RECEIPT_SUPPORT = {
    receipt_refs: ["receipt_cycle_0001_live_run_1.json"],
    receipt_lineage: ["out_provenance/live/receipt_cycle_0001_live_run_1.json"],
    receipt_count: 1,
    provenance_complete: true,
    replayable_support_present: true,
    lineage_summary: "durable provenance receipt lineage",
};

function buildShellState(replay) {
    return {
        runId: "shell.run.leg2.failure.001",
        activeRunLabel: RUN_RESULT.run_label,
        workbench: WORKBENCH,
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

function replayObject(model) {
    return model.stages.find((stage) => stage.id === "replay_reconstruction")?.objects?.find((obj) => obj.id === "replay");
}

function reconstructionObject(model) {
    return model.stages.find((stage) => stage.id === "replay_reconstruction")?.objects?.find((obj) => obj.id === "reconstruction");
}

const FAILED_REPLAY = buildRuntimeReconstructionReplay({
    workbench: null,
    runResult: null,
    sourceFamilyLabel: "Synthetic Signal",
});

const INSUFFICIENT_REPLAY = buildRuntimeReconstructionReplay({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
    retainedTierOverride: TIER2,
    receiptSupport: RECEIPT_SUPPORT,
});

const DEGRADED_REPLAY = {
    replay_request_id: "RPLY-LEG2-DEGRADED",
    replay_type: "runtime_reconstruction",
    request_status: "prepared",
    reconstruction_status: "downgraded",
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
    replay_request_id: "RPLY-LEG2-UNRESOLVED",
    replay_type: "runtime_reconstruction",
    request_status: "prepared",
    reconstruction_status: "prepared",
    retained_tier_used: { tier_used: 0, tier_label: "Tier 0 - live working state" },
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

section("A. failure / insufficiency / unresolved / degraded stay distinct");
{
    const failedDiscipline = deriveOperatorWeakStateDiscipline(FAILED_REPLAY);
    const insufficientDiscipline = deriveOperatorWeakStateDiscipline(INSUFFICIENT_REPLAY);
    const degradedDiscipline = deriveOperatorWeakStateDiscipline(DEGRADED_REPLAY);
    const unresolvedDiscipline = deriveOperatorWeakStateDiscipline(UNRESOLVED_REPLAY);

    eq(deriveOperatorThresholdPosture(FAILED_REPLAY).classCode, "failed", "A1: failed stays failed");
    eq(deriveOperatorThresholdPosture(INSUFFICIENT_REPLAY).classCode, "insufficient", "A2: retained-tier insufficiency stays insufficient");
    eq(deriveOperatorThresholdPosture(DEGRADED_REPLAY).classCode, "degraded", "A3: support_degraded stays degraded");
    eq(deriveOperatorThresholdPosture(UNRESOLVED_REPLAY).classCode, "unresolved", "A4: support_unresolved stays unresolved");
    eq(failedDiscipline.nextActionCode, "review_required", "A5: failure maps to review_required");
    eq(insufficientDiscipline.nextActionCode, "retained_tier_insufficient", "A6: retained-tier insufficiency maps to retained_tier_insufficient");
    eq(degradedDiscipline.nextActionCode, "reconstructable_only", "A7: degraded maps to reconstructable_only");
    eq(unresolvedDiscipline.nextActionCode, "review_required", "A8: unresolved maps to review_required");
    includes(failedDiscipline.boundaryNote, "Do not read it as weakened replay success", "A9: failed stays distinct from weak success");
    includes(insufficientDiscipline.boundaryNote, "not almost replayable", "A10: insufficiency stays non-decorative");
    includes(degradedDiscipline.boundaryNote, "distinct from insufficiency", "A11: degraded stays distinct from insufficiency");
    includes(unresolvedDiscipline.boundaryNote, "not degraded support", "A12: unresolved stays distinct from degraded");
}

section("B. operator model exposes discipline boundary and next-action posture");
{
    const failedModel = buildOperatorLegibilityModel(buildShellState(FAILED_REPLAY));
    const failedReplayObject = replayObject(failedModel);

    includes(factValue(failedReplayObject, "discipline boundary"), "Failure is explicit local failure", "B1: failed replay exposes failure boundary");
    includes(factValue(failedReplayObject, "next-action posture"), "review required", "B2: failed replay exposes review-required posture");
    ok(failedReplayObject.postureChips.includes("review_required"), "B3: failed replay chip exposes review_required");

    const insufficientModel = buildOperatorLegibilityModel(buildShellState(INSUFFICIENT_REPLAY));
    const insufficientReconstruction = reconstructionObject(insufficientModel);

    includes(factValue(insufficientReconstruction, "discipline boundary"), "bounded below lawful replay legitimacy", "B4: insufficient reconstruction stays bounded");
    includes(factValue(insufficientReconstruction, "next-action posture"), "retained tier insufficient", "B5: insufficient reconstruction exposes retained-tier insufficiency");
    ok(insufficientReconstruction.postureChips.includes("retained_tier_insufficient"), "B6: insufficient reconstruction chip stays explicit");

    const degradedModel = buildOperatorLegibilityModel(buildShellState(DEGRADED_REPLAY));
    const degradedReconstruction = reconstructionObject(degradedModel);

    includes(factValue(degradedReconstruction, "discipline boundary"), "Some support survives", "B7: degraded reconstruction stays weaker-but-supported");
    includes(factValue(degradedReconstruction, "next-action posture"), "reconstructable only", "B8: degraded reconstruction exposes reconstructable-only posture");
    ok(degradedReconstruction.postureChips.includes("reconstructable_only"), "B9: degraded reconstruction chip stays explicit");

    const unresolvedModel = buildOperatorLegibilityModel(buildShellState(UNRESOLVED_REPLAY));
    const unresolvedReplayObject = replayObject(unresolvedModel);

    includes(factValue(unresolvedReplayObject, "discipline boundary"), "support question remains open", "B10: unresolved replay stays open rather than weak success");
    includes(factValue(unresolvedReplayObject, "next-action posture"), "Review missing context or evidence", "B11: unresolved replay exposes review posture");
}

section("C. operator surface source keeps the weak-state discipline explicit");
{
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");
    const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");

    includes(panelSrc, "Failure is not weak success.", "C1: panel keeps failure distinct from weak success");
    includes(panelSrc, "Insufficiency is not almost replayable.", "C2: panel keeps insufficiency non-decorative");
    includes(panelSrc, "Unresolved is not degraded.", "C3: panel keeps unresolved distinct from degraded");
    includes(modelSrc, "\"discipline boundary\"", "C4: model emits discipline boundary");
    includes(modelSrc, "\"next-action posture\"", "C5: model emits next-action posture");
}

finish();
