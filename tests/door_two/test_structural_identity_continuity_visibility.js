import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { deriveStructuralIdentityPosture } from "../../hud/structuralIdentityPosture.js";
import { buildOperatorLegibilityModel } from "../../hud/operatorLegibilityModel.js";
import { buildRuntimeReconstructionReplay } from "../../hud/replayModel.js";

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
    run_label: "shell.run.leg3.identity.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.leg3.identity.001",
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

const HOLLOW_RUN = {
    ok: true,
    run_label: "shell.run.leg3.identity.hollow",
    artifacts: {},
};

const WORKBENCH = {
    scope: {
        stream_id: "stream.leg3.identity.001",
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
    receipt_refs: ["receipt_cycle_0001_live_run_1.json"],
    receipt_lineage: ["out_provenance/live/receipt_cycle_0001_live_run_1.json"],
    receipt_count: 1,
    provenance_complete: true,
    replayable_support_present: true,
    lineage_summary: "durable provenance receipt lineage",
};

function buildShellState(replay, runResult = RUN_RESULT, workbench = WORKBENCH) {
    return {
        runId: "shell.run.leg3.identity.001",
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

function replayObject(model) {
    return model.stages.find((stage) => stage.id === "replay_reconstruction")?.objects?.find((obj) => obj.id === "replay");
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

const DEGRADED_REPLAY = {
    request_status: "prepared",
    reconstruction_status: "downgraded",
    replay_type: "runtime_reconstruction",
    declared_lens: TIER1_REPLAY.declared_lens,
    retained_tier_used: TIER1_REPLAY.retained_tier_used,
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

section("A. structural identity posture mapping stays distinct and support-grounded");
{
    const conserved = deriveStructuralIdentityPosture(TIER0_REPLAY, { objectKind: "replay" });
    const narrowed = deriveStructuralIdentityPosture(TIER1_REPLAY, { objectKind: "replay" });
    const degraded = deriveStructuralIdentityPosture(DEGRADED_REPLAY, { objectKind: "replay" });
    const unresolved = deriveStructuralIdentityPosture(UNRESOLVED_REPLAY, { objectKind: "replay" });
    const broken = deriveStructuralIdentityPosture(TIER2_REPLAY, { objectKind: "replay" });

    eq(conserved.outcomeCode, "conserved", "A1: Tier 0 maps to conserved identity");
    eq(conserved.lawfulNextPosture, "keep", "A2: conserved identity keeps posture");
    includes(conserved.supportSurvival, "Surviving support remains strong enough", "A3: conserved identity stays support-grounded");
    eq(narrowed.outcomeCode, "narrowed", "A4: Tier 1 maps to narrowed identity");
    eq(narrowed.lawfulNextPosture, "narrow", "A5: narrowed identity maps to narrow");
    includes(narrowed.note, "Same-thing language must remain explicitly narrowed", "A6: narrowed identity keeps downgrade explicit");
    eq(degraded.outcomeCode, "degraded", "A7: degraded replay maps to degraded identity");
    eq(degraded.lawfulNextPosture, "downgrade", "A8: degraded identity maps to downgrade");
    eq(unresolved.outcomeCode, "unresolved", "A9: unresolved replay maps to unresolved identity");
    eq(unresolved.lawfulNextPosture, "review_required", "A10: unresolved identity maps to review_required or defer path");
    eq(broken.outcomeCode, "broken", "A11: insufficient replay maps to broken/new identity required");
    eq(broken.lawfulNextPosture, "split", "A12: broken identity maps to split");
}

section("B. operator surface exposes structural identity basis and anti-inflation boundary");
{
    const model = buildOperatorLegibilityModel(buildShellState(TIER1_REPLAY, HOLLOW_RUN, HOLLOW_WORKBENCH));
    const replay = replayObject(model);

    includes(factValue(replay, "structural identity"), "narrowed", "B1: operator replay exposes structural identity outcome");
    includes(factValue(replay, "bounded question"), "same replay-support continuity question", "B2: bounded question is visible");
    includes(factValue(replay, "declared constraints"), "Tier 1", "B3: declared constraints stay visible");
    includes(factValue(replay, "support survival"), "narrower retained-lineage form", "B4: support survival stays visible");
    includes(factValue(replay, "mechanized basis"), "mechanized", "B5: mechanized basis stays visible");
    includes(factValue(replay, "lawful next posture"), "narrow", "B6: lawful next posture stays visible");
    includes(factValue(replay, "semantic boundary"), "must not widen the continuity claim", "B7: semantic-vs-structural boundary stays explicit");
    ok(replay.postureChips.includes("identity_narrowed"), "B8: identity chip stays visible");
}

section("C. panel source prevents semantic-only preservation inflation");
{
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");
    const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");
    const helperSrc = await readFile(path.join(ROOT, "hud/structuralIdentityPosture.js"), "utf8");

    includes(panelSrc, "Structural identity remains grounded in bounded question, declared constraints, support survival,", "C1: panel grounds identity in structural basis");
    includes(panelSrc, "Displayed coherence is not preserved identity.", "C2: panel blocks semantic-only preservation inflation");
    includes(panelSrc, "Semantic summaries remain", "C3: panel keeps semantic layer interpretive");
    includes(modelSrc, '"structural identity"', "C4: model emits structural identity field");
    includes(modelSrc, '"bounded question"', "C5: model emits bounded-question field");
    includes(modelSrc, '"declared constraints"', "C6: model emits declared-constraints field");
    includes(modelSrc, '"semantic boundary"', "C7: model emits semantic-boundary field");
    includes(helperSrc, "new identity required", "C8: helper keeps broken/new identity required posture explicit");
}

finish();
