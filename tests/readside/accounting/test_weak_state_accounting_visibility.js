import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { deriveWeakStateAccounting } from "../../../hud/weakStateAccounting.js";
import { buildOperatorLegibilityModel } from "../../../hud/operatorLegibilityModel.js";
import { buildRuntimeReconstructionReplay } from "../../../hud/replayModel.js";
import { workbenchToStructuralHudModel } from "../../../hud/DoorOneStructuralMemoryHudModel.js";

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
    run_label: "shell.run.leg3.weakstate.001",
    artifacts: {
        a1: {
            source_id: "synthetic.seed42",
            stream_id: "stream.leg3.weakstate.001",
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

function makeWorkbench({
    continuity = "mixed",
    recurrenceStrength = "low",
    totalReEntries = 0,
    eventTypes = ["drift"],
} = {}) {
    return {
        scope: {
            stream_id: "stream.leg3.weakstate.001",
            segment_ids: ["seg.0", "seg.1", "seg.2"],
            cross_run_context: { available: false, run_count: 1 },
        },
        runtime: {
            artifacts: RUN_RESULT.artifacts,
            substrate: {
                state_count: 15,
                basin_count: 0,
                segment_count: 3,
                trajectory_frames: 10,
                transition_report: {
                    total_transitions: 1,
                    total_re_entries: totalReEntries,
                    current_neighborhood_id: totalReEntries > 0 ? "NBHD-01" : null,
                    current_dwell_count: totalReEntries > 0 ? 3 : 0,
                    current_dwell_duration_sec: totalReEntries > 0 ? 1.2 : 0,
                    dominant_dwell_share: totalReEntries > 0 ? 0.54 : 0,
                    dwell: totalReEntries > 0 ? [{
                        neighborhood_id: "NBHD-01",
                        dwell_count: 6,
                        re_entry_count: totalReEntries,
                    }] : [],
                    transitions: [],
                },
                segment_transitions: [
                    { t_transition: 2.0, divergence_score: 0.22, detected_event_types: eventTypes },
                ],
            },
        },
        interpretation: {
            trajectory: {
                trajectory_character: { convergence: "bounded", motion: "active" },
                neighborhood_character: {
                    occupancy: "developing",
                    recurrence_strength: recurrenceStrength,
                    evidence: { total_re_entries: totalReEntries },
                },
                segment_character: { continuity },
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
}

const BASE_WORKBENCH = makeWorkbench();
const BASE_REPLAY = buildRuntimeReconstructionReplay({
    workbench: BASE_WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
});

const DISTORTED_REPLAY = {
    ...BASE_REPLAY,
    threshold_posture: {
        ...BASE_REPLAY.threshold_posture,
        threshold_outcome: "bounded_supported",
        downgrade_output: "",
        compression_survival: "warning",
        distortion_posture: "warning",
    },
    replay_fidelity_record_v0: {
        ...BASE_REPLAY.replay_fidelity_record_v0,
        threshold_outcome: "bounded_supported",
        downgrade_posture: "",
        fidelity_posture: "support-trace class - bounded support",
    },
};

const UNRESOLVED_REPLAY = {
    ...BASE_REPLAY,
    threshold_posture: {
        ...BASE_REPLAY.threshold_posture,
        threshold_outcome: "support_unresolved",
        downgrade_output: "",
        compression_survival: "unknown",
        distortion_posture: "not_declared",
    },
    replay_fidelity_record_v0: {
        ...BASE_REPLAY.replay_fidelity_record_v0,
        mechanization_status: "partially_mechanized",
        threshold_outcome: "support_unresolved",
        downgrade_posture: "",
        fidelity_posture: "support-trace class - unresolved support question",
        failure_posture: "",
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

const INSUFFICIENT_REPLAY = buildRuntimeReconstructionReplay({
    workbench: BASE_WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
    retainedTierOverride: TIER2,
    receiptSupport: RECEIPT_SUPPORT,
});

function buildShellState({ workbench = BASE_WORKBENCH, replay = BASE_REPLAY } = {}) {
    return {
        runId: "shell.run.leg3.weakstate.001",
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

section("A. weak-state accounting keeps distinct classes instead of confidence collapse");
{
    const noisyHud = workbenchToStructuralHudModel(BASE_WORKBENCH);
    const noisy = deriveWeakStateAccounting({
        objectKind: "source",
        hasActiveResult: true,
        sourceFamilyLabel: "Synthetic Signal",
        runResult: RUN_RESULT,
        workbench: BASE_WORKBENCH,
        hudModel: noisyHud,
    });
    const distorted = deriveWeakStateAccounting({
        objectKind: "replay",
        hasActiveResult: true,
        sourceFamilyLabel: "Synthetic Signal",
        runResult: RUN_RESULT,
        workbench: BASE_WORKBENCH,
        hudModel: noisyHud,
        replay: DISTORTED_REPLAY,
    });
    const insufficient = deriveWeakStateAccounting({
        objectKind: "replay",
        hasActiveResult: true,
        sourceFamilyLabel: "Synthetic Signal",
        runResult: RUN_RESULT,
        workbench: BASE_WORKBENCH,
        hudModel: noisyHud,
        replay: INSUFFICIENT_REPLAY,
    });
    const unresolved = deriveWeakStateAccounting({
        objectKind: "replay",
        hasActiveResult: true,
        sourceFamilyLabel: "Synthetic Signal",
        runResult: RUN_RESULT,
        workbench: BASE_WORKBENCH,
        hudModel: noisyHud,
        replay: UNRESOLVED_REPLAY,
    });
    const rupturedWorkbench = makeWorkbench({
        continuity: "broken",
        recurrenceStrength: "low",
        totalReEntries: 0,
        eventTypes: ["rupture"],
    });
    const ruptured = deriveWeakStateAccounting({
        objectKind: "spectral_state",
        hasActiveResult: true,
        sourceFamilyLabel: "Synthetic Signal",
        runResult: RUN_RESULT,
        workbench: rupturedWorkbench,
        hudModel: workbenchToStructuralHudModel(rupturedWorkbench),
    });
    const recurrentWorkbench = makeWorkbench({
        continuity: "mixed",
        recurrenceStrength: "moderate",
        totalReEntries: 2,
        eventTypes: ["drift"],
    });
    const recurrent = deriveWeakStateAccounting({
        objectKind: "spectral_state",
        hasActiveResult: true,
        sourceFamilyLabel: "Synthetic Signal",
        runResult: RUN_RESULT,
        workbench: recurrentWorkbench,
        hudModel: workbenchToStructuralHudModel(recurrentWorkbench),
    });

    eq(noisy.dominantClassCode, "noise", "A1: high synthetic variability maps to noise");
    includes(noisy.sourcePathCondition, "noise std 0.12", "A2: noise stays source-path based");
    eq(distorted.dominantClassCode, "distortion", "A3: distortion warning maps to distortion");
    includes(distorted.representationCondition, "distortion posture warning", "A4: distortion stays representation-level");
    eq(insufficient.dominantClassCode, "insufficiency", "A5: retained-tier insufficiency maps to insufficiency");
    includes(insufficient.claimStatusCondition, "support floor not met", "A6: insufficiency stays support-floor failure");
    eq(unresolved.dominantClassCode, "uncertainty", "A7: unresolved support question maps to uncertainty");
    includes(unresolved.claimStatusCondition, "remains unresolved", "A8: uncertainty stays claim-status related");
    eq(ruptured.dominantClassCode, "rupture", "A9: rupture event stays rupture");
    includes(ruptured.continuityCondition, "rupture-like continuity break", "A10: rupture stays continuity-break specific");
    includes(recurrent.recurrenceCondition, "total re-entries 2", "A11: recurrence remains a separate bounded signal");
    includes(noisy.boundaryNote, "not a global confidence score", "A12: helper blocks confidence collapse");
}

section("B. operator model exposes dominant class and layer split");
{
    const distortionModel = buildOperatorLegibilityModel(buildShellState({ replay: DISTORTED_REPLAY }));
    const distortionReplay = replayObject(distortionModel);

    eq(factValue(distortionReplay, "dominant weak-state"), "distortion", "B1: replay object exposes dominant weak-state");
    includes(factValue(distortionReplay, "representation condition"), "distortion posture warning", "B2: replay object exposes representation condition");
    includes(factValue(distortionReplay, "claim-status condition"), "bounded claim supported", "B3: replay object keeps claim-status distinct from distortion");
    includes(factValue(distortionReplay, "weak-state boundary"), "not a global confidence score", "B4: replay object keeps lattice boundary visible");
    ok(distortionReplay.postureChips.includes("distortion"), "B5: replay object exposes distortion chip");

    const noisyModel = buildOperatorLegibilityModel(buildShellState({ replay: BASE_REPLAY }));
    const noisySource = stage(noisyModel, "source");
    eq(factValue(noisySource, "dominant weak-state"), "noise", "B6: source stage exposes noise as dominant weak-state");
    includes(factValue(noisySource, "source-path condition"), "noise std 0.12", "B7: source stage keeps noise at source-path layer");
}

section("C. anti-collapse stays explicit in helper, model, and panel");
{
    const helperSrc = await readFile(path.join(ROOT, "hud/weakStateAccounting.js"), "utf8");
    const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");

    includes(helperSrc, "not a global confidence score", "C1: helper blocks global confidence collapse");
    includes(modelSrc, "\"dominant weak-state\"", "C2: model emits dominant weak-state row");
    includes(modelSrc, "\"source-path condition\"", "C3: model emits source-path condition row");
    includes(modelSrc, "\"representation condition\"", "C4: model emits representation condition row");
    includes(modelSrc, "\"claim-status condition\"", "C5: model emits claim-status condition row");
    includes(panelSrc, "Noise, distortion, uncertainty, insufficiency, degradation, rupture, and recurrence are separate bounded accounting classes.", "C6: panel keeps weak-state classes explicit");
    includes(panelSrc, "This surface uses a weak-state lattice, not a global confidence score.", "C7: panel blocks confidence-score rhetoric");
    ok(!helperSrc.includes("low confidence"), "C8: helper does not collapse into low-confidence language");
}

finish();
