import { workbenchToStructuralHudModel } from "../../../hud/DoorOneStructuralMemoryHudModel.js";
import { buildRuntimeReconstructionReplay } from "../../../hud/replayModel.js";
import {
    buildConsultationRequest,
    buildActivationReviewRequest,
} from "../../../hud/requestModel.js";
import { buildOperatorLegibilityModel } from "../../../hud/operatorLegibilityModel.js";
import { projectForHUD, projectForDemo } from "../../../hud/adapters/tandemAdapter.js";

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
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`
    );
}

function includes(text, pattern, label) {
    ok(String(text).includes(pattern), label);
}

function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

function stage(model, id) {
    return model.stages.find((item) => item.id === id);
}

const RUN_RESULT = {
    ok: true,
    run_label: "shell.run.readside.bundle.001",
    artifacts: {
        a1: {
            source_id: "synthetic.bundle.001",
            stream_id: "stream.readside.bundle.001",
            meta: { seed: 9, noiseStd: 0.02, durationSec: 8 },
        },
        h1s: [{ id: "h1.0" }],
        m1s: [{ id: "m1.0" }],
        anomaly_reports: [{ anomaly_type: "drift", divergence_score: 0.21 }],
        q: { receipts: { query: { query_policy_id: "query.bundle.v1" } } },
    },
};

const WORKBENCH = {
    scope: {
        stream_id: "stream.readside.bundle.001",
        segment_ids: ["seg.0", "seg.1"],
        cross_run_context: { available: true, run_count: 2 },
    },
    runtime: {
        artifacts: RUN_RESULT.artifacts,
        substrate: {
            state_count: 2,
            basin_count: 0,
            segment_count: 2,
            trajectory_frames: 4,
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
            segment_transitions: [],
        },
        audit: {
            skipped_windows: [],
            merge_failures: [],
            consensus_receipts: [],
        },
    },
    semantic_overlay: {
        trajectory: {
            report_type: "runtime:trajectory_interpretation_report",
            query_class: "Q2_continuity",
            primary_posture: "bundle_primary_posture",
            trajectory_character: { convergence: "bundle_convergence", motion: "bundle_motion" },
            neighborhood_character: { occupancy: "bundle_occupancy", recurrence_strength: "bundle_recurrence", evidence: {} },
            segment_character: { continuity: "bundle_continuity" },
        },
        attention_memory: {
            report_type: "runtime:attention_memory_report",
        },
    },
    readiness_overlay: {
        promotion_readiness: {
            report_type: "runtime:promotion_readiness_report",
            readiness_summary: { overall_readiness: "bundle_readiness", confidence: "bundle_confidence" },
            evidence_domains: { transition_selectivity: { label: "bundle_transition_selectivity" } },
        },
    },
    review_overlay: {
        canon_candidate: {
            dossier_type: "runtime:canon_candidate_dossier",
            candidate_claim: { claim_type: "bundle_claim" },
            blockers: ["bundle_blocker"],
            insufficiencies: ["bundle_insufficiency"],
        },
        consensus_review: {
            result: "bundle_consensus",
        },
    },
    interpretation: {
        trajectory: {
            trajectory_character: { convergence: "alias_convergence", motion: "alias_motion" },
            neighborhood_character: { occupancy: "alias_occupancy", recurrence_strength: "alias_recurrence", evidence: {} },
            segment_character: { continuity: "alias_continuity" },
        },
        attention_memory: { report_type: "runtime:attention_memory_report" },
    },
    promotion_readiness: {
        report: {
            readiness_summary: { overall_readiness: "alias_readiness", confidence: "alias_confidence" },
            evidence_domains: { transition_selectivity: { label: "alias_transition_selectivity" } },
        },
    },
    canon_candidate: {
        dossier: {
            candidate_claim: { claim_type: "alias_claim" },
            blockers: ["alias_blocker"],
            insufficiencies: ["alias_insufficiency"],
        },
    },
    consensus_review: {
        review: { result: "alias_consensus" },
    },
};

section("A. HUD model prefers explicit bundle sections");
{
    const model = workbenchToStructuralHudModel(WORKBENCH);
    eq(model.structure.convergence, "bundle_convergence", "A1: convergence comes from semantic_overlay");
    eq(model.structure.transition_selectivity, "bundle_transition_selectivity", "A2: transition selectivity comes from readiness_overlay");
    eq(model.review.readiness, "bundle_readiness", "A3: readiness comes from readiness_overlay");
    eq(model.review.claim, "bundle_claim", "A4: claim comes from review_overlay");
    eq(model.review.consensus, "bundle_consensus", "A5: consensus comes from review_overlay");
    includes(model.layer_sources.posture_note, "Structural runtime stays primary", "A6: HUD model keeps layer boundary note");
}

section("B. replay and request surfaces prefer explicit bundle sections");
{
    const replay = buildRuntimeReconstructionReplay({
        workbench: WORKBENCH,
        runResult: RUN_RESULT,
        sourceFamilyLabel: "Synthetic Signal",
    });
    const consultation = buildConsultationRequest({
        workbench: WORKBENCH,
        runResult: RUN_RESULT,
        sourceFamilyLabel: "Synthetic Signal",
    });
    const activation = buildActivationReviewRequest({
        workbench: WORKBENCH,
        runResult: RUN_RESULT,
        sourceFamilyLabel: "Synthetic Signal",
    });

    eq(replay.overall_readiness, "bundle_readiness", "B1: replay readiness comes from readiness_overlay");
    eq(replay.candidate_claim_type, "bundle_claim", "B2: replay claim type comes from review_overlay");
    eq(consultation.overall_readiness, "bundle_readiness", "B3: consultation readiness comes from readiness_overlay");
    eq(activation.claim_type, "bundle_claim", "B4: activation claim type comes from review_overlay");
    eq(activation.consensus_result, "bundle_consensus", "B5: activation consensus comes from review_overlay");
}

section("C. operator legibility model keeps bundle boundaries explicit");
{
    const model = buildOperatorLegibilityModel({
        runId: RUN_RESULT.run_label,
        activeRunLabel: RUN_RESULT.run_label,
        workbench: WORKBENCH,
        runResult: RUN_RESULT,
        activeRequest: null,
        requestLog: [],
        replayLog: [],
        requestHistoryCount: 0,
        replayHistoryCount: 0,
        sourceFamilyLabel: "Synthetic Signal",
        runStatus: "complete",
        runError: null,
        hasActiveResult: true,
    });

    const interpretationStage = stage(model, "interpretation_overlay");
    const reviewStage = stage(model, "review_gate");
    const interpretationBundleFact = interpretationStage.auditFacts.find(([k]) => k === "bundle source")?.[1] ?? "";
    const reviewBundleFact = reviewStage.auditFacts.find(([k]) => k === "bundle source")?.[1] ?? "";

    includes(interpretationStage.dependsOn, "bundle_convergence", "C1: interpretation stage depends on semantic_overlay values");
    includes(interpretationBundleFact, "semantic_overlay", "C2: interpretation stage names semantic bundle source");
    includes(reviewStage.dependsOn, "readiness bundle_readiness", "C3: review gate depends on readiness overlay value");
    includes(reviewStage.dependsOn, "claim bundle_claim", "C4: review gate depends on review overlay value");
    includes(reviewBundleFact, "readiness_overlay", "C5: review gate names readiness/review bundle source");
}

section("D. tandem adapter keeps separated-layer posture visible");
{
    const hud = projectForHUD({
        runResult: RUN_RESULT,
        workbench: WORKBENCH,
        requestLog: [],
        replayLog: [],
        sourceFamilyLabel: "Synthetic Signal",
        runStatus: "complete",
    });
    const demo = projectForDemo({
        runResult: RUN_RESULT,
        workbench: WORKBENCH,
        requestLog: [],
        replayLog: [],
        sourceFamilyLabel: "Synthetic Signal",
        runStatus: "complete",
    });

    eq(hud.evidence.overall_readiness, "bundle_readiness", "D1: HUD projection reads readiness from bundle");
    eq(hud.evidence.candidate_claim_type, "bundle_claim", "D2: HUD projection reads candidate claim from bundle");
    eq(hud.evidence.consensus_result, "bundle_consensus", "D3: HUD projection reads consensus from bundle");
    includes(hud.interpretation.summary, "Semantic overlay", "D4: HUD interpretation summary keeps overlay separate");
    eq(hud.layer_boundary.runtime, "primary structural evidence", "D5: HUD layer boundary keeps runtime primary");
    includes(demo.layer_boundary_note, "Semantic overlay, readiness, and review stay separate", "D6: demo layer boundary note stays explicit");
}

finish();
