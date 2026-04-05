"use strict";

import { shortId, workbenchToStructuralHudModel } from "./DoorOneStructuralMemoryHudModel.js";
import {
    deriveOperatorThresholdPosture,
    deriveOperatorFidelityPosture,
    deriveOperatorWeakStateDiscipline,
} from "./replayThresholdFidelityPosture.js";
import { deriveStructuralIdentityPosture } from "./structuralIdentityPosture.js";
import { deriveMemorySupportClassification } from "./memorySupportClassification.js";
import { deriveCompressionRemintingAccountability } from "./compressionRemintingAccountability.js";
import { deriveBoundedObjectTracking } from "./boundedObjectTracking.js";
import { deriveWeakStateAccounting } from "./weakStateAccounting.js";

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function firstReplay(replayLog) {
    return safeArray(replayLog)[0] ?? null;
}

function joinParts(parts) {
    return parts.filter(Boolean).join(" | ");
}

function summarizeSupportBasis(supportBasis, fallback = "bounded support only") {
    const basis = safeArray(supportBasis);
    return basis.length > 0 ? basis.join(", ") : fallback;
}

function summarizeList(items, fallback = "none declared") {
    const values = safeArray(items).filter(Boolean);
    return values.length > 0 ? values.join(", ") : fallback;
}

function trackingAuditFacts(tracking) {
    return [
        ["object handle", tracking.objectHandle],
        ["object class", tracking.objectClass],
        ["source basis", tracking.sourceBasis],
        ["route class", tracking.routeClass],
        ["support tier", tracking.supportTier],
        ["closure / accountability", tracking.closureState],
        ["neighboring objects", tracking.neighboringObjects],
        ["address boundary", tracking.addressBoundary],
    ];
}

function weakStateAuditFacts(weakState) {
    return [
        ["dominant weak-state", weakState.dominantClassLabel],
        ["source-path condition", weakState.sourcePathCondition],
        ["representation condition", weakState.representationCondition],
        ["claim-status condition", weakState.claimStatusCondition],
        ["continuity condition", weakState.continuityCondition],
        ["recurrence condition", weakState.recurrenceCondition],
        ["weak-state next posture", weakState.lawfulNextPosture],
        ["weak-state boundary", weakState.boundaryNote],
    ];
}

function tierLabel(replay) {
    return replay?.replay_fidelity_record_v0?.retained_tier
        ?? replay?.retained_tier_used?.tier_label
        ?? "retained tier not declared";
}

function tierNumber(replay) {
    return Number(replay?.retained_tier_used?.tier_used ?? -1);
}

function mechanizationStatus(replay) {
    return replay?.replay_fidelity_record_v0?.mechanization_status ?? "not_declared";
}

function tierChip(replay) {
    const tierUsed = tierNumber(replay);
    if (tierUsed === 0) return "tier_0_live";
    if (tierUsed === 1) return "tier_1_receipt";
    if (tierUsed >= 2) return "tier_2_plus_insufficient";
    return "tier_not_declared";
}

function basisModeLabel(replay) {
    if (!replay) return "awaiting explicit replay request";
    const tierUsed = Number(replay?.retained_tier_used?.tier_used ?? 0);
    const hasReceiptLineage =
        replay?.receipt_support?.provenance_complete === true &&
        replay?.receipt_support?.replayable_support_present === true;

    if (tierUsed === 0) {
        return "source-available live runtime support";
    }
    if (tierUsed === 1 && hasReceiptLineage) {
        return "retained-only durable receipt lineage";
    }
    if (tierUsed >= 2) {
        return `retained-only requested at Tier ${tierUsed} - explicit insufficiency`;
    }
    return "bounded retained/support basis only";
}

function thresholdOutcomeLabel(replay) {
    return replay?.replay_fidelity_record_v0?.threshold_outcome
        ?? replay?.threshold_posture?.threshold_outcome
        ?? "threshold posture not yet active";
}

function downgradeFailureLabel(replay) {
    if (!replay) return "no replay object prepared yet";
    const parts = [];
    const downgrade =
        replay?.replay_fidelity_record_v0?.downgrade_posture
        ?? replay?.threshold_posture?.downgrade_output
        ?? null;
    const failure =
        replay?.replay_fidelity_record_v0?.failure_posture
        ?? replay?.failure_posture
        ?? replay?.failure_reason
        ?? null;

    if (downgrade) parts.push(`downgrade ${downgrade}`);
    if (failure) parts.push(`failure ${failure}`);
    return parts.length > 0 ? parts.join(" | ") : "no explicit downgrade or failure";
}

function replayLegitimacyLabel(replay) {
    if (!replay) return "awaiting explicit replay request";
    const tierUsed = tierNumber(replay);
    const mechanization = mechanizationStatus(replay);

    if (replay?.request_status === "failed" || mechanization === "failed") {
        return "replay legitimacy not established - explicit failure";
    }
    if (tierUsed === 0 && mechanization === "mechanized") {
        return "Tier 0 live replay legitimacy - session-scoped runtime support only";
    }
    if (tierUsed === 1 && mechanization === "mechanized") {
        return "Tier 1 replay legitimacy - receipt-backed lineage only";
    }
    if (tierUsed >= 2) {
        return `Tier ${tierUsed} replay legitimacy not established - explicit insufficiency`;
    }
    return "replay legitimacy remains bounded by surviving support and declared lens";
}

function reconstructionLegitimacyLabel(replay) {
    if (!replay) return "awaiting explicit replay request";
    const tierUsed = tierNumber(replay);
    const mechanization = mechanizationStatus(replay);

    if (replay?.reconstruction_status === "failed" || mechanization === "failed") {
        return "reconstruction legitimacy not established - explicit failure";
    }
    if (tierUsed === 0 && replay?.reconstruction_status === "completed") {
        return "Tier 0 support-trace reconstruction legitimacy - live support only";
    }
    if (tierUsed === 1 && replay?.reconstruction_status === "completed") {
        return "Tier 1 support-trace reconstruction legitimacy - receipt-backed lineage only";
    }
    if (tierUsed >= 2) {
        return `Tier ${tierUsed} support-trace reconstruction legitimacy not established - explicit insufficiency`;
    }
    return "reconstruction legitimacy remains bounded by declared tier and surviving support";
}

function preservedReplayPosture(replay) {
    if (!replay) return ["explicit request boundary only"];
    const tierUsed = tierNumber(replay);
    const mechanization = mechanizationStatus(replay);

    if (replay?.request_status === "failed" || mechanization === "failed") {
        return ["explicit failure visibility", "non-claims remain intact"];
    }
    if (tierUsed === 0) {
        return [
            "live-session bounded replay",
            "declared-lens replay of active retained support",
            "support-trace path while runtime support survives",
        ];
    }
    if (tierUsed === 1) {
        return [
            "receipt-backed lineage replay",
            "retained-only replay basis",
            "support survives without live source availability",
        ];
    }
    return [
        "tier declaration remains visible",
        "downgrade / insufficiency remains visible",
        "non-authority posture remains explicit",
    ];
}

function notPreservedReplayPosture(replay) {
    if (!replay) return ["mechanized replay legitimacy"];
    const tierUsed = tierNumber(replay);
    const mechanization = mechanizationStatus(replay);

    if (replay?.request_status === "failed" || mechanization === "failed") {
        return ["lawful replay legitimacy", "completed replay continuity"];
    }
    if (tierUsed === 0) {
        return [
            "durable replay after session loss",
            "receipt-backed lineage continuity",
            "source equivalence",
        ];
    }
    if (tierUsed === 1) {
        return [
            "live source availability",
            "raw source continuity",
            "source equivalence",
        ];
    }
    return [
        "lawful replay legitimacy",
        "completed replay continuity",
        "source continuity",
    ];
}

function preservedReconstructionPosture(replay) {
    if (!replay) return ["explicit backend boundary only"];
    const tierUsed = tierNumber(replay);
    const mechanization = mechanizationStatus(replay);

    if (replay?.reconstruction_status === "failed" || mechanization === "failed") {
        return ["explicit failure visibility", "support-trace boundary remains explicit"];
    }
    if (tierUsed === 0) {
        return [
            "live support-trace reconstruction",
            "declared-lens retained support basis",
            "threshold outcome from active runtime support",
        ];
    }
    if (tierUsed === 1) {
        return [
            "receipt-backed support-trace reconstruction",
            "retained-only lineage basis",
            "durable receipt support basis remains inspectable",
        ];
    }
    return [
        "tier declaration remains visible",
        "downgrade / insufficiency remains visible",
        "support-trace non-claims remain explicit",
    ];
}

function notPreservedReconstructionPosture(replay) {
    if (!replay) return ["mechanized support-trace reconstruction"];
    const tierUsed = tierNumber(replay);
    const mechanization = mechanizationStatus(replay);

    if (replay?.reconstruction_status === "failed" || mechanization === "failed") {
        return ["completed support-trace reconstruction", "reconstruction legitimacy"];
    }
    if (tierUsed === 0) {
        return [
            "durable reconstruction after session loss",
            "receipt-backed retained lineage",
            "source equivalence",
        ];
    }
    if (tierUsed === 1) {
        return [
            "live source availability",
            "operator reversal",
            "source equivalence",
        ];
    }
    return [
        "completed support-trace reconstruction",
        "lawful reconstruction legitimacy",
        "source continuity",
    ];
}

function replayStatusChips(replay) {
    if (!replay) return [];
    const threshold = deriveOperatorThresholdPosture(replay);
    const discipline = deriveOperatorWeakStateDiscipline(replay);
    const identity = deriveStructuralIdentityPosture(replay, { objectKind: "replay" });
    const memoryClass = deriveMemorySupportClassification({ objectKind: "replay", replay });
    const accountability = deriveCompressionRemintingAccountability({ objectKind: "replay", replay });
    const weakState = deriveWeakStateAccounting({ objectKind: "replay", replay });
    const chips = [
        weakState.chipCode,
        accountability.chipCode,
        memoryClass.chipCode,
        tierChip(replay),
        identity.chipCode,
        threshold.classCode,
        ["review_required", "retained_tier_insufficient", "replay_not_justified", "reconstructable_only"].includes(discipline.nextActionCode)
            ? discipline.nextActionCode
            : null,
        replay.request_status ?? null,
        replay.replay_fidelity_record_v0?.mechanization_status ?? null,
    ].filter(Boolean);
    return [...new Set(chips)].slice(0, 8);
}

function reconstructionStatusChips(replay) {
    if (!replay) return [];
    const threshold = deriveOperatorThresholdPosture(replay);
    const fidelity = deriveOperatorFidelityPosture(replay);
    const discipline = deriveOperatorWeakStateDiscipline(replay);
    const identity = deriveStructuralIdentityPosture(replay, { objectKind: "reconstruction" });
    const memoryClass = deriveMemorySupportClassification({ objectKind: "reconstruction", replay });
    const accountability = deriveCompressionRemintingAccountability({ objectKind: "reconstruction", replay });
    const weakState = deriveWeakStateAccounting({ objectKind: "reconstruction", replay });
    const chips = [
        weakState.chipCode,
        accountability.chipCode,
        memoryClass.chipCode,
        tierChip(replay),
        identity.chipCode,
        threshold.classCode,
        fidelity.classCode,
        ["review_required", "retained_tier_insufficient", "replay_not_justified", "reconstructable_only"].includes(discipline.nextActionCode)
            ? discipline.nextActionCode
            : null,
        replay.reconstruction_status ?? null,
    ].filter(Boolean);
    return [...new Set(chips)].slice(0, 8);
}

function replayAuditFacts(replay, context = {}) {
    const threshold = deriveOperatorThresholdPosture(replay);
    const fidelity = deriveOperatorFidelityPosture(replay);
    const discipline = deriveOperatorWeakStateDiscipline(replay);
    const identity = deriveStructuralIdentityPosture(replay, { objectKind: "replay" });
    const memoryClass = deriveMemorySupportClassification({ objectKind: "replay", replay });
    const accountability = deriveCompressionRemintingAccountability({ objectKind: "replay", replay });
    const tracking = deriveBoundedObjectTracking({
        objectKind: "replay",
        hasActiveResult: context.hasActiveResult,
        sourceFamilyLabel: context.sourceFamilyLabel,
        runResult: context.runResult,
        workbench: context.workbench,
        replay,
    });
    const weakState = deriveWeakStateAccounting({
        objectKind: "replay",
        hasActiveResult: context.hasActiveResult,
        sourceFamilyLabel: context.sourceFamilyLabel,
        runResult: context.runResult,
        workbench: context.workbench,
        hudModel: context.hudModel,
        replay,
    });
    if (!replay) {
        return [
            ["legitimacy", "awaiting explicit replay request"],
            ...trackingAuditFacts(tracking),
            ...weakStateAuditFacts(weakState),
            ["memory / support class", memoryClass.classLabel],
            ["classification basis", memoryClass.classificationBasis],
            ["compression / reminting posture", accountability.classLabel],
            ["accountability basis", accountability.accountabilityBasis],
            ["structural identity", identity.outcomeLabel],
            ["bounded question", identity.boundedQuestion],
            ["declared constraints", identity.declaredConstraints],
            ["support survival", identity.supportSurvival],
            ["mechanized basis", identity.mechanizedBasis],
            ["memory next posture", memoryClass.lawfulNextPosture],
            ["accountability next posture", accountability.lawfulNextPosture],
            ["lawful next posture", identity.lawfulNextPosture],
            ["basis mode", "awaiting explicit replay request"],
            ["retained tier", "not yet declared in an active replay object"],
            ["what survived", accountability.whatSurvived],
            ["what degraded", accountability.whatDegraded],
            ["accountability not preserved", accountability.notPreserved],
            ["preserved", "explicit request boundary only"],
            ["not preserved", "mechanized replay legitimacy"],
            ["support basis", "bounded retained support becomes visible once replay is prepared"],
            ["mechanization", "not yet active"],
            ["threshold class", threshold.classLabel],
            ["threshold meaning", threshold.note],
            ["threshold posture", "not yet active"],
            ["fidelity class", fidelity.classLabel],
            ["fidelity meaning", fidelity.note],
            ["accountability boundary", accountability.note],
            ["classification boundary", memoryClass.semanticBoundary],
            ["semantic boundary", identity.semanticBoundary],
            ["discipline boundary", discipline.boundaryNote],
            ["next-action posture", `${discipline.nextActionLabel} | ${discipline.nextActionNote}`],
            ["downgrade / failure", "not yet active"],
        ];
    }

    return [
        ["legitimacy", replayLegitimacyLabel(replay)],
        ...trackingAuditFacts(tracking),
        ...weakStateAuditFacts(weakState),
        ["memory / support class", memoryClass.classLabel],
        ["classification basis", memoryClass.classificationBasis],
        ["compression / reminting posture", accountability.classLabel],
        ["accountability basis", accountability.accountabilityBasis],
        ["structural identity", identity.outcomeLabel],
        ["bounded question", identity.boundedQuestion],
        ["declared constraints", identity.declaredConstraints],
        ["support survival", identity.supportSurvival],
        ["mechanized basis", identity.mechanizedBasis],
        ["memory next posture", memoryClass.lawfulNextPosture],
        ["accountability next posture", accountability.lawfulNextPosture],
        ["lawful next posture", identity.lawfulNextPosture],
        ["basis mode", basisModeLabel(replay)],
        ["retained tier", tierLabel(replay)],
        ["what survived", accountability.whatSurvived],
        ["what degraded", accountability.whatDegraded],
        ["accountability not preserved", accountability.notPreserved],
        ["preserved", summarizeList(preservedReplayPosture(replay))],
        ["not preserved", summarizeList(notPreservedReplayPosture(replay))],
        ["support basis", summarizeSupportBasis(replay?.replay_fidelity_record_v0?.support_basis ?? replay.support_basis)],
        ["mechanization", replay?.replay_fidelity_record_v0?.mechanization_status ?? "not declared"],
        ["threshold class", threshold.classLabel],
        ["threshold meaning", threshold.note],
        ["threshold posture", thresholdOutcomeLabel(replay)],
        ["fidelity class", fidelity.classLabel],
        ["fidelity meaning", fidelity.note],
        ["accountability boundary", accountability.note],
        ["classification boundary", memoryClass.semanticBoundary],
        ["semantic boundary", identity.semanticBoundary],
        ["discipline boundary", discipline.boundaryNote],
        ["next-action posture", `${discipline.nextActionLabel} | ${discipline.nextActionNote}`],
        ["downgrade / failure", downgradeFailureLabel(replay)],
    ];
}

function reconstructionAuditFacts(replay, context = {}) {
    const threshold = deriveOperatorThresholdPosture(replay);
    const fidelity = deriveOperatorFidelityPosture(replay);
    const discipline = deriveOperatorWeakStateDiscipline(replay);
    const identity = deriveStructuralIdentityPosture(replay, { objectKind: "reconstruction" });
    const memoryClass = deriveMemorySupportClassification({ objectKind: "reconstruction", replay });
    const accountability = deriveCompressionRemintingAccountability({ objectKind: "reconstruction", replay });
    const tracking = deriveBoundedObjectTracking({
        objectKind: "reconstruction",
        hasActiveResult: context.hasActiveResult,
        sourceFamilyLabel: context.sourceFamilyLabel,
        runResult: context.runResult,
        workbench: context.workbench,
        replay,
    });
    const weakState = deriveWeakStateAccounting({
        objectKind: "reconstruction",
        hasActiveResult: context.hasActiveResult,
        sourceFamilyLabel: context.sourceFamilyLabel,
        runResult: context.runResult,
        workbench: context.workbench,
        hudModel: context.hudModel,
        replay,
    });
    if (!replay) {
        return [
            ["legitimacy", "awaiting explicit replay request"],
            ...trackingAuditFacts(tracking),
            ...weakStateAuditFacts(weakState),
            ["memory / support class", memoryClass.classLabel],
            ["classification basis", memoryClass.classificationBasis],
            ["compression / reminting posture", accountability.classLabel],
            ["accountability basis", accountability.accountabilityBasis],
            ["structural identity", identity.outcomeLabel],
            ["bounded question", identity.boundedQuestion],
            ["declared constraints", identity.declaredConstraints],
            ["support survival", identity.supportSurvival],
            ["mechanized basis", identity.mechanizedBasis],
            ["memory next posture", memoryClass.lawfulNextPosture],
            ["accountability next posture", accountability.lawfulNextPosture],
            ["lawful next posture", identity.lawfulNextPosture],
            ["basis mode", "awaiting explicit replay request"],
            ["retained tier", "not yet declared in an active replay object"],
            ["what survived", accountability.whatSurvived],
            ["what degraded", accountability.whatDegraded],
            ["accountability not preserved", accountability.notPreserved],
            ["preserved", "explicit backend boundary only"],
            ["not preserved", "mechanized support-trace reconstruction"],
            ["support basis", "support-trace basis becomes visible once reconstruction is prepared"],
            ["threshold class", threshold.classLabel],
            ["threshold meaning", threshold.note],
            ["fidelity class", fidelity.classLabel],
            ["fidelity meaning", fidelity.note],
            ["fidelity posture", "not yet active"],
            ["trace depth", "not yet active"],
            ["accountability boundary", accountability.note],
            ["classification boundary", memoryClass.semanticBoundary],
            ["semantic boundary", identity.semanticBoundary],
            ["discipline boundary", discipline.boundaryNote],
            ["next-action posture", `${discipline.nextActionLabel} | ${discipline.nextActionNote}`],
            ["downgrade / failure", "not yet active"],
        ];
    }

    return [
        ["legitimacy", reconstructionLegitimacyLabel(replay)],
        ...trackingAuditFacts(tracking),
        ...weakStateAuditFacts(weakState),
        ["memory / support class", memoryClass.classLabel],
        ["classification basis", memoryClass.classificationBasis],
        ["compression / reminting posture", accountability.classLabel],
        ["accountability basis", accountability.accountabilityBasis],
        ["structural identity", identity.outcomeLabel],
        ["bounded question", identity.boundedQuestion],
        ["declared constraints", identity.declaredConstraints],
        ["support survival", identity.supportSurvival],
        ["mechanized basis", identity.mechanizedBasis],
        ["memory next posture", memoryClass.lawfulNextPosture],
        ["accountability next posture", accountability.lawfulNextPosture],
        ["lawful next posture", identity.lawfulNextPosture],
        ["basis mode", basisModeLabel(replay)],
        ["retained tier", tierLabel(replay)],
        ["what survived", accountability.whatSurvived],
        ["what degraded", accountability.whatDegraded],
        ["accountability not preserved", accountability.notPreserved],
        ["preserved", summarizeList(preservedReconstructionPosture(replay))],
        ["not preserved", summarizeList(notPreservedReconstructionPosture(replay))],
        ["support basis", summarizeSupportBasis(replay?.replay_fidelity_record_v0?.support_basis ?? replay.support_basis)],
        ["threshold class", threshold.classLabel],
        ["threshold meaning", threshold.note],
        ["fidelity class", fidelity.classLabel],
        ["fidelity meaning", fidelity.note],
        ["fidelity posture", replay?.replay_fidelity_record_v0?.fidelity_posture ?? replay?.fidelity_posture ?? "not declared"],
        ["trace depth", `${safeArray(replay?.reconstruction_trace).length} trace steps`],
        ["accountability boundary", accountability.note],
        ["classification boundary", memoryClass.semanticBoundary],
        ["semantic boundary", identity.semanticBoundary],
        ["discipline boundary", discipline.boundaryNote],
        ["next-action posture", `${discipline.nextActionLabel} | ${discipline.nextActionNote}`],
        ["downgrade / failure", downgradeFailureLabel(replay)],
    ];
}

function sourceProfileNote(runResult) {
    const meta = runResult?.artifacts?.a1?.meta ?? {};
    const parts = [];
    if (meta.source_mode === "recorded_source") {
        parts.push("recorded source");
        if (meta.original_filename) parts.push(`file ${meta.original_filename}`);
        if (meta.recorded_family) parts.push(`family ${meta.recorded_family}`);
        if (meta.nominal_sample_rate_hz !== undefined && meta.nominal_sample_rate_hz !== null) {
            parts.push(`nominal ${meta.nominal_sample_rate_hz}Hz`);
        }
        if (meta.original_sample_rate_hz !== undefined && meta.original_sample_rate_hz !== null) {
            parts.push(`original ${meta.original_sample_rate_hz}Hz`);
        }
        if (meta.decode) parts.push(`decode ${meta.decode}`);
        return parts.join(" | ");
    }
    if (meta.seed !== undefined && meta.seed !== null) parts.push(`seed ${meta.seed}`);
    if (meta.noiseStd !== undefined && meta.noiseStd !== null) parts.push(`noise std ${meta.noiseStd}`);
    if (meta.durationSec !== undefined && meta.durationSec !== null) parts.push(`duration ${meta.durationSec}s`);
    return parts.length > 0 ? parts.join(" | ") : "no source profile metadata";
}

function deriveEvidenceDepthPosture({ hasActiveResult, sourceFamilyLabel, runResult, hudModel }) {
    if (!hasActiveResult || !hudModel) {
        return {
            code: "awaiting_run",
            label: "awaiting_run",
            note: "Run a source through the execution shell to expose the active object path.",
        };
    }

    const sourceId = String(runResult?.artifacts?.a1?.source_id ?? "").toLowerCase();
    const family = String(sourceFamilyLabel ?? "").toLowerCase();
    const isSynthetic = family.includes("synthetic") || sourceId.startsWith("synthetic.");
    const transitionCount = Number(hudModel?.runtime_evidence?.transition_count ?? 0) || 0;
    const currentNeighborhood = hudModel?.runtime_evidence?.current_neighborhood_id ?? null;
    const segmentBoundaryEvents = Number(hudModel?.runtime_evidence?.segment_boundary_events ?? 0) || 0;

    if (isSynthetic && transitionCount === 0 && !currentNeighborhood) {
        return {
            code: "coarse_runtime_support",
            label: "coarse_runtime_support",
            note: "Verified synthetic preset path is active. Top-line runtime counters can stay coarse here; use segment-boundary and anomaly evidence for the available separation.",
        };
    }

    if (transitionCount > 0 || currentNeighborhood || segmentBoundaryEvents > 0) {
        return {
            code: "partial_runtime_differentiation",
            label: "partial_runtime_differentiation",
            note: "Run-relative runtime evidence is present, but the surface remains bounded and read-side only.",
        };
    }

    return {
        code: "bounded_runtime_support",
        label: "bounded_runtime_support",
        note: "Runtime evidence is present, but differentiation remains limited at the current seam.",
    };
}

function buildSourceStage({ hasActiveResult, sourceFamilyLabel, runResult, workbench }) {
    const a1 = runResult?.artifacts?.a1 ?? workbench?.runtime?.artifacts?.a1 ?? {};
    const streamId = workbench?.scope?.stream_id ?? a1?.stream_id ?? null;
    const hudModel = hasActiveResult ? workbenchToStructuralHudModel(workbench) : null;
    const tracking = deriveBoundedObjectTracking({
        objectKind: "source",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
    });
    const weakState = deriveWeakStateAccounting({
        objectKind: "source",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
        hudModel,
    });
    return {
        id: "source",
        title: "Source",
        status: hasActiveResult ? "available" : "awaiting_run",
        objectName: hasActiveResult
            ? `${sourceFamilyLabel} source object`
            : "Source object awaiting active run",
        producedBy: hasActiveResult
            ? "Execution shell source selection plus lawful ingest path"
            : "No source has been run through the shell yet",
        dependsOn: hasActiveResult
            ? joinParts([
                `source_id ${a1?.source_id ?? "-"}`,
                streamId ? `stream ${shortId(streamId)}` : null,
                sourceProfileNote(runResult),
            ])
            : "Select a source family or file-backed ingest payload",
        currentStatus: hasActiveResult
            ? joinParts([
                "available",
                a1?.modality ? `modality ${a1.modality}` : null,
                a1?.channel ? `channel ${a1.channel}` : null,
            ])
            : "awaiting_run",
        legalClaim: hasActiveResult
            ? "Active source basis only. This is provenance for the current run, not interpretation or authority."
            : "No source basis can be claimed until a run exists.",
        nextAction: hasActiveResult
            ? "Inspect the spectral state derived from this source window and declared shell lens."
            : "Run a source through the execution shell.",
        auditFacts: [
            ...trackingAuditFacts(tracking),
            ...weakStateAuditFacts(weakState),
        ],
        postureChips: [weakState.chipCode].filter(Boolean),
        postureNote: `${tracking.addressBoundary} ${weakState.note}`,
    };
}

function buildSpectralStage({ hasActiveResult, sourceFamilyLabel, runResult, workbench, hudModel }) {
    const h1Count = Number(workbench?.runtime?.artifacts?.h1s?.length ?? 0) || 0;
    const segmentCount = Number(workbench?.runtime?.substrate?.segment_count ?? 0) || 0;
    const tracking = deriveBoundedObjectTracking({
        objectKind: "spectral_state",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
    });
    const weakState = deriveWeakStateAccounting({
        objectKind: "spectral_state",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
        hudModel,
    });
    return {
        id: "spectral_state",
        title: "Spectral State",
        status: hasActiveResult ? "mechanized" : "awaiting_run",
        objectName: hasActiveResult
            ? "Spectral state object (H1 structural states)"
            : "Spectral state object awaiting source-derived runtime state",
        producedBy: hasActiveResult
            ? "Ingest -> ClockAlign -> Window -> Transform -> Compress"
            : "Requires an active source run before structural state exists",
        dependsOn: hasActiveResult
            ? joinParts([
                `${h1Count} H1 states`,
                `${segmentCount} segments`,
                "FFT/Hann shell lens",
            ])
            : "Depends on active source intake plus declared shell policies",
        currentStatus: hasActiveResult
            ? joinParts([
                "available",
                `${h1Count} H1 states`,
                `${hudModel?.runtime_evidence?.artifact_counts?.anomaly_reports ?? 0} anomaly receipts`,
            ])
            : "awaiting_run",
        legalClaim: hasActiveResult
            ? "Mechanized structural state under the declared shell lens. Not interpretation, truth, or canon."
            : "No structural claim is available until a run exists.",
        nextAction: hasActiveResult
            ? "Follow the retained signature and runtime evidence derived from these structural states."
            : "Run a source to create spectral state.",
        auditFacts: [
            ...trackingAuditFacts(tracking),
            ...weakStateAuditFacts(weakState),
        ],
        postureChips: [weakState.chipCode].filter(Boolean),
        postureNote: `${tracking.addressBoundary} ${weakState.note}`,
    };
}

function buildRetainedStage({ hasActiveResult, sourceFamilyLabel, runResult, workbench, hudModel }) {
    const m1Count = Number(workbench?.runtime?.artifacts?.m1s?.length ?? 0) || 0;
    const memoryClass = deriveMemorySupportClassification({
        objectKind: "retained_signature",
        hasActiveResult,
        workbench,
    });
    const accountability = deriveCompressionRemintingAccountability({
        objectKind: "retained_signature",
        hasActiveResult,
        workbench,
    });
    const tracking = deriveBoundedObjectTracking({
        objectKind: "retained_signature",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
    });
    const weakState = deriveWeakStateAccounting({
        objectKind: "retained_signature",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
        hudModel,
    });
    const supportBasis = summarizeSupportBasis(hudModel ? [
        hudModel.runtime_evidence?.artifact_counts?.m1s > 0 ? "merged_state_evidence" : null,
        hudModel.runtime_evidence?.artifact_counts?.h1s > 0 ? "harmonic_state_evidence" : null,
        hudModel.runtime_evidence?.artifact_counts?.anomaly_reports > 0 ? "anomaly_event_evidence" : null,
    ] : []);
    return {
        id: "retained_signature",
        title: "Retained Signature",
        status: hasActiveResult ? (m1Count > 0 ? "retained" : "partial") : "awaiting_run",
        objectName: hasActiveResult
            ? "Retained signature object (bounded retained structural trace)"
            : "Retained signature object awaiting retained support",
        producedBy: hasActiveResult
            ? "MergeOp over adjacent structural states within novelty-bounded segments"
            : "Requires structural state before retained support can be exposed",
        dependsOn: hasActiveResult
            ? joinParts([
                `${m1Count} M1 retained states`,
                supportBasis,
            ])
            : "Depends on active spectral-state output",
        currentStatus: hasActiveResult
            ? joinParts([
                m1Count > 0 ? "retained" : "partial",
                `${m1Count} retained states`,
            ])
            : "awaiting_run",
        legalClaim: hasActiveResult
            ? "Bounded retained support only. Not full memory authority, not canon, not source equivalence."
            : "No retained-support claim is available until retained state exists.",
        nextAction: hasActiveResult
            ? "Use retained support for bounded replay and reconstruction posture."
            : "Run a source and produce retained states.",
        auditFacts: [
            ...trackingAuditFacts(tracking),
            ...weakStateAuditFacts(weakState),
            ["memory / support class", memoryClass.classLabel],
            ["classification basis", memoryClass.classificationBasis],
            ["compression / reminting posture", accountability.classLabel],
            ["accountability basis", accountability.accountabilityBasis],
            ["what survived", accountability.whatSurvived],
            ["what degraded", accountability.whatDegraded],
            ["accountability not preserved", accountability.notPreserved],
            ["memory next posture", memoryClass.lawfulNextPosture],
            ["accountability next posture", accountability.lawfulNextPosture],
            ["accountability boundary", accountability.note],
            ["classification boundary", memoryClass.semanticBoundary],
        ],
        postureChips: [weakState.chipCode, accountability.chipCode, memoryClass.chipCode].filter(Boolean),
        postureNote: `${tracking.addressBoundary} ${weakState.note} ${accountability.note} ${memoryClass.note}`,
    };
}

function buildReplayObject({ hasActiveResult, sourceFamilyLabel, runResult, workbench, hudModel, replay }) {
    const discipline = deriveOperatorWeakStateDiscipline(replay);
    const tracking = deriveBoundedObjectTracking({
        objectKind: "replay",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
        replay,
    });
    const weakState = deriveWeakStateAccounting({
        objectKind: "replay",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
        hudModel,
        replay,
    });
    return {
        id: "replay",
        title: "Replay",
        status: replay?.request_status ?? (hasActiveResult ? "available_if_requested" : "awaiting_run"),
        objectName: "Replay object",
        producedBy: replay
            ? "Explicit replay request under the declared lens"
            : "Prepared only when the operator requests replay from the active run",
        dependsOn: replay
            ? summarizeSupportBasis(replay.support_basis, "bounded support basis")
            : "Depends on live source or retained support, declared lens, and retained-tier posture",
        currentStatus: replay
            ? joinParts([
                replay.request_status ?? "prepared",
                replay.replay_posture ?? null,
            ])
            : hasActiveResult ? "not_requested" : "awaiting_run",
        legalClaim: replay
            ? replay.allowed_use ?? "Bounded replay inspection only."
            : "Replay remains lens-bound support only and is not fused with reconstruction.",
        nextAction: replay
            ? discipline.nextActionNote
            : hasActiveResult ? "Prepare replay from the active run when needed." : "Run a source before requesting replay.",
        auditFacts: replayAuditFacts(replay, {
            hasActiveResult,
            sourceFamilyLabel,
            runResult,
            workbench,
            hudModel,
        }),
        postureChips: replayStatusChips(replay),
        postureNote: replay
            ? `${tracking.addressBoundary} ${weakState.note} Replay is bounded re-exposure under the declared lens. Not raw restoration, not truth, not canon.`
            : "Replay stays inactive until explicitly requested from the current bounded object path.",
    };
}

function buildReconstructionObject({ hasActiveResult, sourceFamilyLabel, runResult, workbench, hudModel, replay }) {
    const discipline = deriveOperatorWeakStateDiscipline(replay);
    const fidelity = replay?.replay_fidelity_record_v0 ?? null;
    const tracking = deriveBoundedObjectTracking({
        objectKind: "reconstruction",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
        replay,
    });
    const weakState = deriveWeakStateAccounting({
        objectKind: "reconstruction",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
        hudModel,
        replay,
    });
    return {
        id: "reconstruction",
        title: "Reconstruction",
        status: replay?.reconstruction_status ?? (hasActiveResult ? "trace_available_if_requested" : "awaiting_run"),
        objectName: "Reconstruction object",
        producedBy: replay
            ? "Backend reconstruction seam from the active replay request"
            : "Becomes active only when replay invokes the reconstruction backend",
        dependsOn: replay
            ? joinParts([
                summarizeSupportBasis(fidelity?.support_basis ?? replay.support_basis, "bounded support basis"),
                fidelity?.retained_tier ? `tier ${fidelity.retained_tier}` : null,
            ])
            : "Depends on replay request plus support-trace basis",
        currentStatus: replay
            ? joinParts([
                replay.reconstruction_status ?? null,
                replay.fidelity_posture ?? null,
                replay.threshold_posture ?? null,
            ])
            : hasActiveResult ? "not_requested" : "awaiting_run",
        legalClaim: replay
            ? "Support-trace reconstruction only. Explicitly not raw restoration or source equivalence."
            : "Reconstruction remains distinct from replay and is not implicitly active.",
        nextAction: replay
            ? discipline.nextActionNote
            : hasActiveResult ? "Request replay to activate the reconstruction seam." : "Run a source before reconstruction is possible.",
        auditFacts: reconstructionAuditFacts(replay, {
            hasActiveResult,
            sourceFamilyLabel,
            runResult,
            workbench,
            hudModel,
        }),
        postureChips: reconstructionStatusChips(replay),
        postureNote: replay
            ? `${tracking.addressBoundary} ${weakState.note} Reconstruction stays support-trace bounded. It does not imply source equivalence or operator reversal.`
            : "Reconstruction remains inactive until replay invokes the backend support-trace seam.",
    };
}

function replayStageStatus({ replay, hasActiveResult }) {
    if (!replay) return hasActiveResult ? "available_if_requested" : "awaiting_run";
    if (replay.request_status === "failed" || replay.reconstruction_status === "failed") return "failed";
    if (replay.reconstruction_status === "downgraded") return "downgraded";
    return "prepared";
}

function buildInterpretationStage({ hasActiveResult, sourceFamilyLabel, runResult, workbench }) {
    const trajectory = workbench?.interpretation?.trajectory ?? {};
    const tracking = deriveBoundedObjectTracking({
        objectKind: "interpretation_overlay",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
    });
    return {
        id: "interpretation_overlay",
        title: "Interpretation Overlay",
        status: hasActiveResult ? "displayed" : "awaiting_run",
        objectName: hasActiveResult
            ? "Interpretation overlay"
            : "Interpretation overlay awaiting structural evidence",
        producedBy: hasActiveResult
            ? "Trajectory and attention-memory read-side interpretation reports"
            : "Requires runtime evidence before overlay can be shown",
        dependsOn: hasActiveResult
            ? joinParts([
                trajectory?.trajectory_character?.convergence ? `convergence ${trajectory.trajectory_character.convergence}` : null,
                trajectory?.trajectory_character?.motion ? `motion ${trajectory.trajectory_character.motion}` : null,
                trajectory?.segment_character?.continuity ? `continuity ${trajectory.segment_character.continuity}` : null,
            ])
            : "Depends on runtime evidence and retained support",
        currentStatus: hasActiveResult
            ? "displayed overlay | lower authority than source and structural evidence"
            : "awaiting_run",
        legalClaim: hasActiveResult
            ? "Bounded interpretation only. It overlays structural evidence and does not replace it."
            : "No interpretation claim is available without runtime evidence.",
        nextAction: hasActiveResult
            ? "Use interpretation to orient review, not to overrule structural evidence."
            : "Run a source before interpretation becomes available.",
        auditFacts: trackingAuditFacts(tracking),
        postureNote: tracking.addressBoundary,
    };
}

function buildReviewStage({ hasActiveResult, sourceFamilyLabel, runResult, activeRequest, requestLog, workbench }) {
    const readiness = workbench?.promotion_readiness?.report?.readiness_summary?.overall_readiness ?? "unknown";
    const claimType = workbench?.canon_candidate?.dossier?.candidate_claim?.claim_type ?? "candidate_only";
    const memoryClass = deriveMemorySupportClassification({
        objectKind: "review_gate",
        hasActiveResult,
        activeRequest,
    });
    const tracking = deriveBoundedObjectTracking({
        objectKind: "review_gate",
        hasActiveResult,
        sourceFamilyLabel,
        runResult,
        workbench,
        activeRequest,
    });
    return {
        id: "review_gate",
        title: "Review Gate",
        status: activeRequest?.request_status ?? (hasActiveResult ? "candidate_only" : "awaiting_run"),
        objectName: hasActiveResult
            ? "Review gate"
            : "Review gate awaiting active run",
        producedBy: activeRequest
            ? "Prepared request object routed from the active shell context"
            : "Readiness and candidate surfaces remain downstream until a request is prepared",
        dependsOn: hasActiveResult
            ? joinParts([
                `readiness ${readiness}`,
                `claim ${claimType}`,
                `${safeArray(requestLog).length} active-context requests`,
            ])
            : "Depends on active run plus explicit request preparation",
        currentStatus: activeRequest
            ? joinParts([
                activeRequest.request_status ?? null,
                activeRequest.fulfillment_status ?? null,
                activeRequest.mechanization_status ?? null,
            ])
            : hasActiveResult ? "candidate_only | request not yet prepared" : "awaiting_run",
        legalClaim: activeRequest
            ? "Prepared request only. Not fulfilled consultation, not review acceptance, not canon."
            : "Downstream review remains fenced below authority and below fulfillment.",
        nextAction: hasActiveResult
            ? (activeRequest
                ? "Export or inspect the prepared request without treating it as resolved review."
                : "Prepare a consultation or activation-review request if downstream review is needed.")
            : "Run a source before review-facing surfaces can be prepared.",
        auditFacts: [
            ...trackingAuditFacts(tracking),
            ["memory / support class", memoryClass.classLabel],
            ["classification basis", memoryClass.classificationBasis],
            ["memory next posture", memoryClass.lawfulNextPosture],
            ["classification boundary", memoryClass.semanticBoundary],
        ],
        postureChips: [memoryClass.chipCode].filter(Boolean),
        postureNote: `${tracking.addressBoundary} ${memoryClass.note}`,
    };
}

function sourceKindLabel(sourceFamilyLabel, runResult) {
    const family = String(sourceFamilyLabel ?? "").toLowerCase();
    const sourceId = String(runResult?.artifacts?.a1?.source_id ?? "").toLowerCase();
    const sourceMode = String(runResult?.artifacts?.a1?.meta?.source_mode ?? "").toLowerCase();

    if (sourceMode === "recorded_source" || family.includes("recorded")) return "recorded";
    if (family.includes("synthetic") || sourceId.startsWith("synthetic.")) return "synthetic";
    return "other";
}

function comparisonScore(caseSummary) {
    if (!caseSummary) return -1;
    const counts = caseSummary.counts ?? {};
    const threshold = caseSummary.replayThresholdClass ?? "";
    const base = (counts.h1 ?? 0) + (counts.m1 ?? 0) + (counts.anomalies ?? 0);
    if (threshold === "conserved") return base + 2;
    if (threshold === "narrowed") return base + 1;
    return base;
}

function buildComparisonCase(caseEntry = null) {
    if (!caseEntry?.runResult?.ok || !caseEntry?.workbench) return null;

    const hudModel = workbenchToStructuralHudModel(caseEntry.workbench);
    const evidenceDepth = deriveEvidenceDepthPosture({
        hasActiveResult: true,
        sourceFamilyLabel: caseEntry.sourceFamilyLabel,
        runResult: caseEntry.runResult,
        hudModel,
    });
    const replay = caseEntry.replay ?? null;
    const threshold = deriveOperatorThresholdPosture(replay);
    const fidelity = deriveOperatorFidelityPosture(replay);

    return {
        kind: sourceKindLabel(caseEntry.sourceFamilyLabel, caseEntry.runResult),
        sourceFamilyLabel: caseEntry.sourceFamilyLabel ?? "unspecified",
        runLabel: caseEntry.runLabel ?? caseEntry.runResult?.run_label ?? null,
        sourceProfile: sourceProfileNote(caseEntry.runResult),
        sourceId: caseEntry.runResult?.artifacts?.a1?.source_id ?? null,
        evidenceDepth,
        counts: {
            h1: Number(caseEntry.workbench?.runtime?.artifacts?.h1s?.length ?? 0) || 0,
            m1: Number(caseEntry.workbench?.runtime?.artifacts?.m1s?.length ?? 0) || 0,
            anomalies: Number(caseEntry.workbench?.runtime?.artifacts?.anomaly_reports?.length ?? 0) || 0,
        },
        replayStatus: replay?.request_status ?? "not_requested",
        reconstructionStatus: replay?.reconstruction_status ?? "not_requested",
        replayThresholdClass: replay ? threshold.classLabel : "not requested",
        reconstructionFidelityClass: replay ? fidelity.classLabel : "not requested",
        supportBasis: replay
            ? summarizeSupportBasis(replay?.replay_fidelity_record_v0?.support_basis ?? replay.support_basis)
            : "replay not yet prepared for this run",
    };
}

function buildSourceComparison(sourceComparison = null) {
    const synthetic = buildComparisonCase(sourceComparison?.synthetic ?? null);
    const recorded = buildComparisonCase(sourceComparison?.recorded ?? null);

    if (!synthetic && !recorded) return null;

    let summary = "Comparison remains bounded to the currently available synthetic and recorded session cases.";
    if (synthetic && recorded) {
        const syntheticScore = comparisonScore(synthetic);
        const recordedScore = comparisonScore(recorded);
        if (recordedScore > syntheticScore) {
            summary = "Recorded case currently preserves richer replay / reconstruction support than the compared synthetic case at this seam. This is a local session comparison, not a global source-family ranking.";
        } else if (syntheticScore > recordedScore) {
            summary = "Synthetic case currently preserves richer replay / reconstruction support than the compared recorded case at this seam. This is a local session comparison, not a global source-family ranking.";
        } else {
            summary = "Compared synthetic and recorded cases remain close at this seam. Similarity here is bounded to the current compared runs and does not generalize across source families.";
        }
    } else if (synthetic) {
        summary = "Synthetic comparison case is available, but no recorded comparison case is currently present in session-backed history.";
    } else {
        summary = "Recorded comparison case is available, but no synthetic comparison case is currently present in session-backed history.";
    }

    return {
        synthetic,
        recorded,
        summary,
    };
}

export function buildOperatorLegibilityModel(shellState = {}) {
    const workbench = shellState?.workbench ?? null;
    const runResult = shellState?.runResult ?? null;
    const replay = firstReplay(shellState?.replayLog);
    const activeRequest = shellState?.activeRequest ?? null;
    const hasActiveResult = !!(shellState?.hasActiveResult && runResult?.ok && workbench);
    const hudModel = hasActiveResult ? workbenchToStructuralHudModel(workbench) : null;
    const evidenceDepth = deriveEvidenceDepthPosture({
        hasActiveResult,
        sourceFamilyLabel: shellState?.sourceFamilyLabel ?? "unspecified",
        runResult,
        hudModel,
    });

    return {
        hasActiveResult,
        sourceBasis: {
            sourceFamily: shellState?.sourceFamilyLabel ?? "unspecified",
            runLabel: shellState?.activeRunLabel ?? runResult?.run_label ?? null,
            streamId: workbench?.scope?.stream_id ?? runResult?.artifacts?.a1?.stream_id ?? null,
            sourceId: runResult?.artifacts?.a1?.source_id ?? null,
            sourceProfile: sourceProfileNote(runResult),
        },
        evidenceDepth,
        sourceComparison: buildSourceComparison(shellState?.sourceComparison ?? null),
        stages: [
            buildSourceStage({
                hasActiveResult,
                sourceFamilyLabel: shellState?.sourceFamilyLabel ?? "unspecified",
                runResult,
                workbench,
            }),
            buildSpectralStage({
                hasActiveResult,
                sourceFamilyLabel: shellState?.sourceFamilyLabel ?? "unspecified",
                runResult,
                workbench,
                hudModel,
            }),
            buildRetainedStage({
                hasActiveResult,
                sourceFamilyLabel: shellState?.sourceFamilyLabel ?? "unspecified",
                runResult,
                workbench,
                hudModel,
            }),
            {
                id: "replay_reconstruction",
                title: "Replay / Reconstruction",
                status: replayStageStatus({ replay, hasActiveResult }),
                objects: [
                    buildReplayObject({
                        hasActiveResult,
                        sourceFamilyLabel: shellState?.sourceFamilyLabel ?? "unspecified",
                        runResult,
                        workbench,
                        hudModel,
                        replay,
                    }),
                    buildReconstructionObject({
                        hasActiveResult,
                        sourceFamilyLabel: shellState?.sourceFamilyLabel ?? "unspecified",
                        runResult,
                        workbench,
                        hudModel,
                        replay,
                    }),
                ],
            },
            buildInterpretationStage({
                hasActiveResult,
                sourceFamilyLabel: shellState?.sourceFamilyLabel ?? "unspecified",
                runResult,
                workbench,
            }),
            buildReviewStage({
                hasActiveResult,
                sourceFamilyLabel: shellState?.sourceFamilyLabel ?? "unspecified",
                runResult,
                activeRequest,
                requestLog: shellState?.requestLog ?? [],
                workbench,
            }),
        ],
    };
}
