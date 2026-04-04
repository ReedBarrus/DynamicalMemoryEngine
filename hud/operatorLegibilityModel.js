"use strict";

import { shortId, workbenchToStructuralHudModel } from "./DoorOneStructuralMemoryHudModel.js";

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

function sourceProfileNote(runResult) {
    const meta = runResult?.artifacts?.a1?.meta ?? {};
    const parts = [];
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
    };
}

function buildSpectralStage({ hasActiveResult, workbench, hudModel }) {
    const h1Count = Number(workbench?.runtime?.artifacts?.h1s?.length ?? 0) || 0;
    const segmentCount = Number(workbench?.runtime?.substrate?.segment_count ?? 0) || 0;
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
    };
}

function buildRetainedStage({ hasActiveResult, workbench, hudModel }) {
    const m1Count = Number(workbench?.runtime?.artifacts?.m1s?.length ?? 0) || 0;
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
    };
}

function buildReplayObject({ hasActiveResult, replay }) {
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
            ? "Inspect downgrade, fidelity, and support basis before treating replay as stronger than bounded support."
            : hasActiveResult ? "Prepare replay from the active run when needed." : "Run a source before requesting replay.",
    };
}

function buildReconstructionObject({ hasActiveResult, replay }) {
    const fidelity = replay?.replay_fidelity_record_v0 ?? null;
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
            ? (replay.failure_posture
                ? "Honor explicit failure or downgrade posture."
                : "Compare reconstruction posture against retained support and interpretation.")
            : hasActiveResult ? "Request replay to activate the reconstruction seam." : "Run a source before reconstruction is possible.",
    };
}

function buildInterpretationStage({ hasActiveResult, workbench }) {
    const trajectory = workbench?.interpretation?.trajectory ?? {};
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
    };
}

function buildReviewStage({ hasActiveResult, activeRequest, requestLog, workbench }) {
    const readiness = workbench?.promotion_readiness?.report?.readiness_summary?.overall_readiness ?? "unknown";
    const claimType = workbench?.canon_candidate?.dossier?.candidate_claim?.claim_type ?? "candidate_only";
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
        stages: [
            buildSourceStage({
                hasActiveResult,
                sourceFamilyLabel: shellState?.sourceFamilyLabel ?? "unspecified",
                runResult,
                workbench,
            }),
            buildSpectralStage({ hasActiveResult, workbench, hudModel }),
            buildRetainedStage({ hasActiveResult, workbench, hudModel }),
            {
                id: "replay_reconstruction",
                title: "Replay / Reconstruction",
                status: replay ? "prepared" : (hasActiveResult ? "available_if_requested" : "awaiting_run"),
                objects: [
                    buildReplayObject({ hasActiveResult, replay }),
                    buildReconstructionObject({ hasActiveResult, replay }),
                ],
            },
            buildInterpretationStage({ hasActiveResult, workbench }),
            buildReviewStage({
                hasActiveResult,
                activeRequest,
                requestLog: shellState?.requestLog ?? [],
                workbench,
            }),
        ],
    };
}
