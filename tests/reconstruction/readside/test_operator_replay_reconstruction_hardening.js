import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    run_label: "shell.run.leg2.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.leg2.001",
            channel: "ch0",
            modality: "voltage",
            meta: { seed: 42, noiseStd: 0.12, durationSec: 10 },
        },
        h1s: Array.from({ length: 12 }, (_, idx) => ({ id: `h${idx}` })),
        m1s: Array.from({ length: 5 }, (_, idx) => ({ id: `m${idx}` })),
        anomaly_reports: [
            { anomaly_type: "drift", divergence_score: 0.2 },
        ],
        q: { receipts: { query: { query_policy_id: "query.synthetic.v1" } } },
    },
};

const HOLLOW_RUN = {
    ok: true,
    run_label: "shell.run.leg2.hollow",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.leg2.001",
            channel: "ch0",
            modality: "voltage",
            meta: { seed: 42, noiseStd: 0.12, durationSec: 10 },
        },
    },
};

const WORKBENCH = {
    scope: {
        stream_id: "stream.leg2.001",
        segment_ids: ["seg.0", "seg.1", "seg.2"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: {
        artifacts: RUN_RESULT.artifacts,
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
                { t_transition: 2.5, divergence_score: 0.24, detected_event_types: ["drift"] },
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
        report: {
            readiness_summary: { overall_readiness: "insufficient" },
        },
    },
    canon_candidate: {
        dossier: {
            candidate_claim: { claim_type: "bounded_structural_claim" },
        },
    },
    consensus_review: {
        review: { result: "defer" },
    },
};

const HOLLOW_WORKBENCH = {
    ...WORKBENCH,
    runtime: {
        ...WORKBENCH.runtime,
        artifacts: HOLLOW_RUN.artifacts,
    },
};

const TIER1 = {
    tier_used: 1,
    tier_label: "Tier 1 - durable receipts",
    honest_posture: "receipt-backed lineage support only",
};

const TIER2 = {
    tier_used: 2,
    tier_label: "Tier 2 - regenerable digest",
    honest_posture: "declared-only posture",
};

const RECEIPT_SUPPORT = {
    receipt_refs: ["receipt_cycle_0001_live_run_1.json", "receipt_cycle_0002_live_run_2.json"],
    receipt_lineage: ["out_provenance/live/receipt_cycle_0001_live_run_1.json"],
    receipt_count: 2,
    provenance_complete: true,
    replayable_support_present: true,
    lineage_summary: "durable provenance receipt lineage",
};

function buildShellState(replay) {
    return {
        runId: "shell.run.leg2.001",
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

const LIVE_REPLAY = buildRuntimeReconstructionReplay({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
});

const RECEIPT_REPLAY = buildRuntimeReconstructionReplay({
    workbench: HOLLOW_WORKBENCH,
    runResult: HOLLOW_RUN,
    sourceFamilyLabel: "Synthetic Signal",
    retainedTierOverride: TIER1,
    receiptSupport: RECEIPT_SUPPORT,
});

const DOWNGRADED_REPLAY = buildRuntimeReconstructionReplay({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
    retainedTierOverride: TIER2,
    receiptSupport: RECEIPT_SUPPORT,
});

const FAILED_REPLAY = buildRuntimeReconstructionReplay({
    workbench: null,
    runResult: null,
    sourceFamilyLabel: "Synthetic Signal",
});

section("A. live replay and reconstruction stay distinct and operator-legible");
{
    const model = buildOperatorLegibilityModel(buildShellState(LIVE_REPLAY));
    const replayStage = model.stages.find((stage) => stage.id === "replay_reconstruction");
    const replayObject = replayStage.objects.find((obj) => obj.id === "replay");
    const reconstructionObject = replayStage.objects.find((obj) => obj.id === "reconstruction");

    eq(replayStage.status, "prepared", "A1: replay stage reports prepared status on successful replay");
    eq(factValue(replayObject, "basis mode"), "source-available live runtime support", "A2: replay exposes live source-available basis");
    includes(factValue(replayObject, "support basis"), "harmonic_state_evidence", "A3: replay exposes retained/support basis");
    eq(factValue(replayObject, "mechanization"), "mechanized", "A4: replay exposes mechanization posture");
    eq(factValue(replayObject, "threshold posture"), "bounded_supported", "A5: replay exposes threshold outcome");
    includes(replayObject.postureNote, "Not raw restoration", "A6: replay keeps non-restoration posture visible");
    includes(factValue(reconstructionObject, "fidelity posture"), "support-trace", "A7: reconstruction exposes fidelity posture");
    includes(factValue(reconstructionObject, "trace depth"), "11 trace steps", "A8: reconstruction exposes trace depth");
    includes(reconstructionObject.postureNote, "not imply source equivalence", "A9: reconstruction keeps non-equivalence posture visible");
}

section("B. retained-only receipt lineage is visible when source is not the active basis");
{
    const model = buildOperatorLegibilityModel(buildShellState(RECEIPT_REPLAY));
    const replayStage = model.stages.find((stage) => stage.id === "replay_reconstruction");
    const replayObject = replayStage.objects.find((obj) => obj.id === "replay");

    eq(factValue(replayObject, "basis mode"), "retained-only durable receipt lineage", "B1: Tier 1 replay shows retained-only receipt basis");
    includes(factValue(replayObject, "retained tier"), "Tier 1", "B2: Tier 1 label stays visible");
    includes(factValue(replayObject, "support basis"), "receipt_cycle_0001_live_run_1.json", "B3: receipt-backed support basis stays visible");
    ok(replayObject.postureChips.includes("mechanized"), "B4: receipt-backed replay keeps mechanized posture visible");
}

section("C. downgrade and failure posture remain explicit");
{
    const downgradedModel = buildOperatorLegibilityModel(buildShellState(DOWNGRADED_REPLAY));
    const downgradedStage = downgradedModel.stages.find((stage) => stage.id === "replay_reconstruction");
    const downgradedReconstruction = downgradedStage.objects.find((obj) => obj.id === "reconstruction");

    eq(downgradedStage.status, "downgraded", "C1: replay stage exposes downgraded posture");
    includes(factValue(downgradedReconstruction, "basis mode"), "retained-only requested at Tier 2", "C2: downgraded basis mode is explicit");
    includes(factValue(downgradedReconstruction, "downgrade / failure"), "retained_tier_insufficient", "C3: downgrade posture is explicit");

    const failedModel = buildOperatorLegibilityModel(buildShellState(FAILED_REPLAY));
    const failedStage = failedModel.stages.find((stage) => stage.id === "replay_reconstruction");
    const failedReplayObject = failedStage.objects.find((obj) => obj.id === "replay");

    eq(failedStage.status, "failed", "C4: replay stage exposes failure posture");
    includes(factValue(failedReplayObject, "downgrade / failure"), "no active run/workbench available for replay", "C5: failure reason stays operator-visible");
    ok(failedReplayObject.postureChips.includes("failed"), "C6: failure chip stays visible");
}

section("D. operator panel source renders replay hardening fields explicitly");
{
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");
    const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");

    includes(panelSrc, "operator replay audit", "D1: panel renders operator replay audit block");
    includes(modelSrc, '"basis mode"', "D2: model emits basis mode field");
    includes(modelSrc, '"retained tier"', "D3: model emits retained tier field");
    includes(modelSrc, '"downgrade / failure"', "D4: model emits downgrade/failure field");
    includes(modelSrc, "Replay is bounded re-exposure under the declared lens", "D5: replay non-restoration note rendered");
    includes(modelSrc, "support-trace bounded", "D6: reconstruction non-equivalence note rendered");
    includes(panelSrc, "Replay is not raw restoration", "D7: panel-level non-claim preserved");
    ok(
        panelSrc.includes("Reconstruction is not source") && panelSrc.includes("equivalence."),
        "D8: panel-level reconstruction non-claim preserved"
    );
}

finish();
