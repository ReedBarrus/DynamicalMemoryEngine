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
    run_label: "shell.run.leg2.tier.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.leg2.tier.001",
            channel: "ch0",
            modality: "voltage",
            meta: { seed: 42, noiseStd: 0.12, durationSec: 10 },
        },
        h1s: Array.from({ length: 9 }, (_, idx) => ({ id: `h${idx}` })),
        m1s: Array.from({ length: 4 }, (_, idx) => ({ id: `m${idx}` })),
        anomaly_reports: [{ anomaly_type: "drift", divergence_score: 0.2 }],
        q: { receipts: { query: { query_policy_id: "query.synthetic.v1" } } },
    },
};

const HOLLOW_RUN = {
    ok: true,
    run_label: "shell.run.leg2.tier.hollow",
    artifacts: {},
};

const WORKBENCH = {
    scope: {
        stream_id: "stream.leg2.tier.001",
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
        report: { readiness_summary: { overall_readiness: "insufficient" } },
    },
    canon_candidate: {
        dossier: { candidate_claim: { claim_type: "bounded_structural_claim" } },
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

function buildShellState(replay, runResult = RUN_RESULT, workbench = WORKBENCH) {
    return {
        runId: "shell.run.leg2.tier.001",
        activeRunLabel: runResult.run_label,
        workbench,
        runResult,
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

const TIER0_REPLAY = buildRuntimeReconstructionReplay({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
});

const TIER1_REPLAY = buildRuntimeReconstructionReplay({
    workbench: HOLLOW_WORKBENCH,
    runResult: HOLLOW_RUN,
    sourceFamilyLabel: "Synthetic Signal",
    retainedTierOverride: TIER1,
    receiptSupport: RECEIPT_SUPPORT,
});

const TIER2_REPLAY = buildRuntimeReconstructionReplay({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
    retainedTierOverride: TIER2,
    receiptSupport: RECEIPT_SUPPORT,
});

const TIER0_MODEL = buildOperatorLegibilityModel(buildShellState(TIER0_REPLAY));
const TIER1_MODEL = buildOperatorLegibilityModel(buildShellState(TIER1_REPLAY, HOLLOW_RUN, HOLLOW_WORKBENCH));
const TIER2_MODEL = buildOperatorLegibilityModel(buildShellState(TIER2_REPLAY));

function replayObject(model) {
    return model.stages.find((stage) => stage.id === "replay_reconstruction")?.objects?.find((obj) => obj.id === "replay");
}

function reconstructionObject(model) {
    return model.stages.find((stage) => stage.id === "replay_reconstruction")?.objects?.find((obj) => obj.id === "reconstruction");
}

section("A. tier legitimacy stays non-equivalent across replay objects");
{
    const tier0 = replayObject(TIER0_MODEL);
    const tier1 = replayObject(TIER1_MODEL);
    const tier2 = replayObject(TIER2_MODEL);

    includes(factValue(tier0, "legitimacy"), "Tier 0 live replay legitimacy", "A1: Tier 0 legitimacy is live-session specific");
    includes(factValue(tier1, "legitimacy"), "Tier 1 replay legitimacy", "A2: Tier 1 legitimacy is receipt-backed specific");
    includes(factValue(tier2, "legitimacy"), "Tier 2 replay legitimacy not established", "A3: Tier 2 legitimacy stays insufficient");
    ok(factValue(tier0, "legitimacy") !== factValue(tier1, "legitimacy"), "A4: Tier 0 and Tier 1 legitimacy are not equivalent");
    ok(factValue(tier1, "legitimacy") !== factValue(tier2, "legitimacy"), "A5: Tier 1 and Tier 2 legitimacy are not equivalent");
    ok(tier0.postureChips.includes("tier_0_live"), "A6: Tier 0 chip remains explicit");
    ok(tier1.postureChips.includes("tier_1_receipt"), "A7: Tier 1 chip remains explicit");
    ok(tier2.postureChips.includes("tier_2_plus_insufficient"), "A8: Tier 2+ insufficiency chip remains explicit");
}

section("B. preserved vs not-preserved posture stays tier-specific");
{
    const tier0 = replayObject(TIER0_MODEL);
    const tier1 = replayObject(TIER1_MODEL);
    const tier2 = replayObject(TIER2_MODEL);

    includes(factValue(tier0, "preserved"), "live-session bounded replay", "B1: Tier 0 preserved posture stays live-session specific");
    includes(factValue(tier0, "not preserved"), "receipt-backed lineage continuity", "B2: Tier 0 explicitly does not preserve durable lineage");
    includes(factValue(tier1, "preserved"), "receipt-backed lineage replay", "B3: Tier 1 preserved posture stays receipt-specific");
    includes(factValue(tier1, "not preserved"), "live source availability", "B4: Tier 1 explicitly does not preserve live source availability");
    includes(factValue(tier2, "preserved"), "downgrade / insufficiency remains visible", "B5: Tier 2 preserves only explicit insufficiency posture");
    includes(factValue(tier2, "not preserved"), "lawful replay legitimacy", "B6: Tier 2 explicitly does not preserve replay legitimacy");
    ok(factValue(tier0, "preserved") !== factValue(tier1, "preserved"), "B7: Tier 0 and Tier 1 preserved posture are not silently equivalent");
}

section("C. reconstruction sufficiency stays non-equivalent across tiers");
{
    const tier0 = reconstructionObject(TIER0_MODEL);
    const tier1 = reconstructionObject(TIER1_MODEL);
    const tier2 = reconstructionObject(TIER2_MODEL);

    includes(factValue(tier0, "legitimacy"), "Tier 0 support-trace reconstruction legitimacy", "C1: Tier 0 reconstruction legitimacy is live support");
    includes(factValue(tier1, "legitimacy"), "Tier 1 support-trace reconstruction legitimacy", "C2: Tier 1 reconstruction legitimacy is receipt-backed");
    includes(factValue(tier2, "legitimacy"), "Tier 2 support-trace reconstruction legitimacy not established", "C3: Tier 2 reconstruction legitimacy stays insufficient");
    includes(factValue(tier2, "not preserved"), "completed support-trace reconstruction", "C4: Tier 2 explicitly does not preserve completed reconstruction");
    includes(factValue(tier2, "downgrade / failure"), "retained_tier_insufficient", "C5: Tier 2 downgrade stays explicit and non-decorative");
}

section("D. operator panel source declares the non-equivalence posture");
{
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");
    const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");

    includes(panelSrc, "Tier 0 live support, Tier 1 receipt lineage, and Tier 2+ insufficiency are not equivalent.", "D1: panel declares tier non-equivalence");
    includes(panelSrc, "Preserved does not mean equivalent.", "D2: panel keeps preserved-vs-equivalent warning explicit");
    includes(modelSrc, '"preserved"', "D3: model emits preserved posture");
    includes(modelSrc, '"not preserved"', "D4: model emits not-preserved posture");
}

finish();
