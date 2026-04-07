// hud/adapters/structuralViewerPayloadAdapter.js
//
// Shared structural viewer payload adapter v0.
//
// Constitutional posture:
// - This adapter normalizes one shared read-side viewer payload.
// - It does not redefine runtime meaning, review meaning, or canon status.
// - Live / Static / Inspection may differ by mode and telemetry posture,
//   but not by separate truth contracts.
// - Structural payload remains primary.
// - Overlays remain optional and subordinate.
// - Missing future seams must not break the payload.

import {
    readAttentionMemoryOverlay,
    readCanonCandidateDossier,
    readConsensusReview,
    readReadinessReport,
    readTrajectoryOverlay,
} from "../workbenchLayerReaders.js";

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function safeObject(value) {
    return value && typeof value === "object" ? value : null;
}

function firstDefined(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return null;
}

function hasEntries(value) {
    return !!(value && typeof value === "object" && Object.keys(value).length > 0);
}

function uniqueStrings(values) {
    return [...new Set(safeArray(values).filter((value) => typeof value === "string" && value.length > 0))];
}

function toTimestampRange(workbench, runResult) {
    const timestamps =
        safeArray(runResult?.artifacts?.a1?.timestamps).length > 0
            ? runResult.artifacts.a1.timestamps
            : safeArray(workbench?.runtime?.artifacts?.a1?.timestamps);

    if (timestamps.length === 0) return undefined;
    return [timestamps[0], timestamps[timestamps.length - 1]];
}

function extractBaseInput({
    mode = "static",
    runResult = null,
    workbench = null,
    requestLog = [],
    replayLog = [],
    sourceFamilyLabel = "unspecified",
    runStatus = "idle",
    runError = null,
    hasActiveResult = false,
    telemetry = null,
} = {}) {
    return {
        mode,
        runResult,
        workbench,
        requestLog: safeArray(requestLog),
        replayLog: safeArray(replayLog),
        sourceFamilyLabel,
        runStatus,
        runError,
        hasActiveResult,
        telemetry: safeObject(telemetry),
    };
}

function deriveStateBasis(input) {
    const hasActiveResult =
        input?.hasActiveResult === true ||
        !!(input?.runResult?.ok && input?.workbench);
    const hasShellContext =
        hasActiveResult ||
        safeArray(input?.requestLog).length > 0 ||
        safeArray(input?.replayLog).length > 0 ||
        String(input?.sourceFamilyLabel ?? "") !== "unspecified" ||
        String(input?.runStatus ?? "idle") !== "idle" ||
        !!input?.runError;

    if (hasActiveResult) {
        return {
            state_basis: "active_shell_state",
            state_availability: "active runtime/workbench state visible",
        };
    }

    if (hasShellContext) {
        return {
            state_basis: "shell_state_fallback",
            state_availability: input?.runError
                ? `no active result | ${input.runError}`
                : `no active result | ${input?.runStatus ?? "idle"}`,
        };
    }

    return {
        state_basis: "viewer_route_placeholder",
        state_availability: "awaiting exported runtime/workbench state",
    };
}

function buildSourceHeader(input) {
    const { mode, runResult, workbench, sourceFamilyLabel } = input;
    const a1 = safeObject(runResult?.artifacts?.a1) ?? safeObject(workbench?.runtime?.artifacts?.a1) ?? {};
    const queryPolicyId = workbench?.runtime?.artifacts?.q?.receipts?.query?.query_policy_id ?? null;
    const segmentIds = safeArray(workbench?.scope?.segment_ids);
    const stateBasis = deriveStateBasis(input);

    return {
        source_id: firstDefined(
            workbench?.scope?.source_id,
            a1?.meta?.source_id,
            a1?.ingest_receipt?.source_id,
            a1?.source_id,
            "unbound_source"
        ),
        source_family: sourceFamilyLabel,
        run_id: firstDefined(runResult?.run_label, workbench?.scope?.stream_id),
        segment_id: segmentIds[0] ?? undefined,
        lens_id: queryPolicyId ?? undefined,
        timestamp_range: toTimestampRange(workbench, runResult),
        mode_posture: `${mode}_viewer_payload`,
        state_basis: stateBasis.state_basis,
        state_availability: stateBasis.state_availability,
    };
}

function buildLineageHeader(input) {
    const { runResult, workbench, requestLog, replayLog } = input;
    const latestRequest = requestLog[0] ?? null;
    const latestReplay = replayLog[0] ?? null;
    const stateBasis = deriveStateBasis(input);

    const provenanceRefs = uniqueStrings([
        workbench?.scope?.stream_id,
        workbench?.scope?.source_id,
        runResult?.run_label,
        workbench?.runtime?.artifacts?.a1?.clock_policy_id,
        workbench?.runtime?.artifacts?.q?.receipts?.query?.query_policy_id,
    ]);

    const generatedFrom = uniqueStrings([
        runResult ? "run_result" : "",
        workbench?.runtime ? "workbench.runtime" : "",
        hasEntries(workbench?.semantic_overlay) ? "workbench.semantic_overlay" : "",
        hasEntries(workbench?.readiness_overlay) ? "workbench.readiness_overlay" : "",
        hasEntries(workbench?.review_overlay) ? "workbench.review_overlay" : "",
        stateBasis.state_basis,
    ]);

    const explicitNonClaims = uniqueStrings([
        ...(safeArray(latestRequest?.explicit_non_claims)),
        "display remains below authority",
        "overlays remain optional",
        "future settlement seam remains optional",
        "future identity audit seam remains optional",
    ]);

    return {
        provenance_refs: provenanceRefs,
        retained_tier: latestReplay?.retained_tier_used?.tier_label ?? undefined,
        replay_posture: latestReplay?.replay_posture ?? undefined,
        reconstruction_posture:
            /reconstruction/i.test(String(latestReplay?.replay_type ?? ""))
                ? latestReplay?.reconstruction_class ?? latestReplay?.replay_type
                : undefined,
        generated_from: generatedFrom,
        explicit_non_claims: explicitNonClaims,
    };
}

function buildStructuralSection(input) {
    const { workbench, replayLog } = input;
    const runtime = safeObject(workbench?.runtime) ?? {};
    const trajectory = readTrajectoryOverlay(workbench);
    const attentionMemory = readAttentionMemoryOverlay(workbench);
    const anomalyReports = safeArray(runtime?.artifacts?.anomaly_reports);
    const basinSets = safeArray(runtime?.artifacts?.basin_sets);
    const segmentTransitions = safeArray(runtime?.substrate?.segment_transitions);
    const transitionReport = safeObject(runtime?.substrate?.transition_report);
    const latestReplay = replayLog[0] ?? null;
    const structural = {};

    if (hasEntries(trajectory)) {
        structural.trajectories = {
            trajectory,
            segment_transitions: segmentTransitions,
            transition_report: transitionReport ?? undefined,
        };
    }

    if (hasEntries(trajectory?.segment_character) || hasEntries(trajectory?.neighborhood_character)) {
        structural.persistence = {
            neighborhood_character: trajectory?.neighborhood_character ?? undefined,
            segment_character: trajectory?.segment_character ?? undefined,
        };
    }

    if (anomalyReports.length > 0) {
        structural.anomalies = anomalyReports.map((row) => ({
            anomaly_type: firstDefined(
                row?.comparison_summary?.dominant_change,
                row?.anomaly_type,
                row?.artifact_type,
                row?.event_type,
                "anomaly"
            ),
            t_start: row?.comparison_window?.window_span?.t_start ?? null,
            t_end: row?.comparison_window?.window_span?.t_end ?? null,
        }));
    }

    if (basinSets.length > 0 || hasEntries(transitionReport)) {
        structural.basins = {
            basin_sets: basinSets,
            transition_report: transitionReport ?? undefined,
        };
    }

    if (
        safeArray(runtime?.artifacts?.h1s).length > 0 ||
        safeArray(runtime?.artifacts?.m1s).length > 0 ||
        hasEntries(attentionMemory)
    ) {
        structural.retained = {
            h1_count: safeArray(runtime?.artifacts?.h1s).length,
            m1_count: safeArray(runtime?.artifacts?.m1s).length,
            attention_memory: hasEntries(attentionMemory) ? attentionMemory : undefined,
        };
    }

    if (latestReplay) {
        structural.replay = {
            replay_request_id: latestReplay.replay_request_id ?? null,
            replay_type: latestReplay.replay_type ?? null,
            replay_posture: latestReplay.replay_posture ?? null,
            retained_tier_used: latestReplay.retained_tier_used ?? null,
        };
    }

    if (/reconstruction/i.test(String(latestReplay?.replay_type ?? ""))) {
        structural.reconstruction = {
            replay_request_id: latestReplay.replay_request_id ?? null,
            reconstruction_class: latestReplay.reconstruction_class ?? latestReplay.replay_type ?? null,
        };
    }

    return structural;
}

function buildOverlays(input) {
    const { workbench } = input;
    const semantic = {};
    const trajectory = readTrajectoryOverlay(workbench);
    const attentionMemory = readAttentionMemoryOverlay(workbench);
    const readiness = readReadinessReport(workbench);
    const canonCandidate = readCanonCandidateDossier(workbench);
    const consensusReview = readConsensusReview(workbench);
    const review = {};
    const overlays = {};

    if (hasEntries(trajectory)) semantic.trajectory = trajectory;
    if (hasEntries(attentionMemory)) semantic.attention_memory = attentionMemory;
    if (hasEntries(semantic)) overlays.semantic = semantic;

    if (hasEntries(readiness)) {
        overlays.readiness = {
            promotion_readiness: readiness,
        };
    }

    if (hasEntries(canonCandidate)) review.canon_candidate = canonCandidate;
    if (hasEntries(consensusReview)) review.consensus_review = consensusReview;
    if (hasEntries(review)) overlays.review = review;

    return hasEntries(overlays) ? overlays : undefined;
}

function buildTelemetry(input) {
    const { mode, telemetry } = input;
    if (telemetry) return telemetry;

    if (mode === "live") {
        return {
            placeholder_status: "live_telemetry_unwired",
            visibility_note: "timing conditions remain separate from structural evidence and overlays",
        };
    }

    return undefined;
}

export function buildStructuralViewerPayload(input = {}) {
    const base = extractBaseInput(input);
    return {
        source: buildSourceHeader(base),
        mode: base.mode,
        lineage: buildLineageHeader(base),
        structural: buildStructuralSection(base),
        overlays: buildOverlays(base),
        telemetry: buildTelemetry(base),
    };
}
