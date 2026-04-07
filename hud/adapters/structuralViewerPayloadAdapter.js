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

function finiteNumberOrNull(value) {
    return Number.isFinite(value) ? value : null;
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
    runId = null,
    activeRunLabel = null,
    runResult = null,
    workbench = null,
    requestLog = [],
    replayLog = [],
    sourceFamilyLabel = "unspecified",
    runStatus = "idle",
    runError = null,
    hasActiveResult = false,
    publishedAtMs = null,
    publicationSource = null,
    viewObservedAtMs = null,
    telemetry = null,
} = {}) {
    return {
        mode,
        runId,
        activeRunLabel,
        runResult,
        workbench,
        requestLog: safeArray(requestLog),
        replayLog: safeArray(replayLog),
        sourceFamilyLabel,
        runStatus,
        runError,
        hasActiveResult,
        publishedAtMs,
        publicationSource,
        viewObservedAtMs,
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

function buildSpectralProjection(runtime) {
    const frames = safeArray(runtime?.artifacts?.h1s)
        .map((state, frameIndex) => {
            const bandProfile = safeObject(state?.invariants?.band_profile_norm);
            const bandEnergy = safeArray(bandProfile?.band_energy)
                .map((value) => finiteNumberOrNull(value))
                .filter((value) => value !== null);

            if (bandEnergy.length === 0) return null;

            const windowSpan = safeObject(state?.window_span) ?? {};

            return {
                frame_index: frameIndex,
                state_id: state?.state_id ?? `h1_frame_${frameIndex}`,
                segment_id: state?.segment_id ?? null,
                t_start: finiteNumberOrNull(windowSpan.t_start),
                t_end: finiteNumberOrNull(windowSpan.t_end),
                duration_sec: finiteNumberOrNull(windowSpan.duration_sec),
                window_count: finiteNumberOrNull(windowSpan.window_count),
                energy_norm: finiteNumberOrNull(state?.invariants?.energy_norm),
                band_energy: bandEnergy,
                band_edges: safeArray(bandProfile?.band_edges)
                    .map((value) => finiteNumberOrNull(value))
                    .filter((value) => value !== null),
            };
        })
        .filter(Boolean)
        .sort((left, right) => {
            const leftStart = Number.isFinite(left.t_start) ? left.t_start : Number.POSITIVE_INFINITY;
            const rightStart = Number.isFinite(right.t_start) ? right.t_start : Number.POSITIVE_INFINITY;
            if (leftStart !== rightStart) return leftStart - rightStart;
            const leftEnd = Number.isFinite(left.t_end) ? left.t_end : leftStart;
            const rightEnd = Number.isFinite(right.t_end) ? right.t_end : rightStart;
            return leftEnd - rightEnd;
        });

    if (frames.length === 0) return undefined;

    const bandCount = Math.max(...frames.map((frame) => frame.band_energy.length));
    const maxEnergy = Math.max(1, ...frames.flatMap((frame) => frame.band_energy));
    const bandEdges = frames.find((frame) => frame.band_edges.length >= bandCount + 1)?.band_edges;
    const timeStarts = frames.map((frame) => frame.t_start).filter((value) => value !== null);
    const timeEnds = frames.map((frame) => frame.t_end).filter((value) => value !== null);

    return {
        viewer_kind: "frequency_time_spectral_v0",
        frame_count: frames.length,
        band_count: bandCount,
        band_edges: bandEdges ?? undefined,
        t_start: timeStarts.length > 0 ? Math.min(...timeStarts) : undefined,
        t_end: timeEnds.length > 0 ? Math.max(...timeEnds) : undefined,
        max_band_energy: maxEnergy,
        frames,
    };
}

function buildEnergyProjection(runtime) {
    const frames = safeArray(runtime?.artifacts?.h1s)
        .map((state, frameIndex) => {
            const windowSpan = safeObject(state?.window_span) ?? {};
            const energyRaw = finiteNumberOrNull(state?.invariants?.energy_raw);
            const energyNorm = finiteNumberOrNull(state?.invariants?.energy_norm);
            const chosenEnergy = energyRaw ?? energyNorm;

            if (chosenEnergy === null) return null;

            return {
                frame_index: frameIndex,
                state_id: state?.state_id ?? `h1_energy_${frameIndex}`,
                segment_id: state?.segment_id ?? null,
                t_start: finiteNumberOrNull(windowSpan.t_start),
                t_end: finiteNumberOrNull(windowSpan.t_end),
                duration_sec: finiteNumberOrNull(windowSpan.duration_sec),
                window_count: finiteNumberOrNull(windowSpan.window_count),
                energy_raw: energyRaw,
                energy_norm: energyNorm,
                amplitude_estimate:
                    chosenEnergy !== null && chosenEnergy >= 0 ? Math.sqrt(chosenEnergy) : null,
                amplitude_basis: energyRaw !== null ? "energy_raw" : "energy_norm",
            };
        })
        .filter(Boolean)
        .sort((left, right) => {
            const leftStart = Number.isFinite(left.t_start) ? left.t_start : Number.POSITIVE_INFINITY;
            const rightStart = Number.isFinite(right.t_start) ? right.t_start : Number.POSITIVE_INFINITY;
            if (leftStart !== rightStart) return leftStart - rightStart;
            const leftEnd = Number.isFinite(left.t_end) ? left.t_end : leftStart;
            const rightEnd = Number.isFinite(right.t_end) ? right.t_end : rightStart;
            return leftEnd - rightEnd;
        });

    if (frames.length === 0) return undefined;

    const timeStarts = frames.map((frame) => frame.t_start).filter((value) => value !== null);
    const timeEnds = frames.map((frame) => frame.t_end).filter((value) => value !== null);
    const energyValues = frames
        .map((frame) => frame.energy_raw ?? frame.energy_norm)
        .filter((value) => value !== null);
    const amplitudeValues = frames
        .map((frame) => frame.amplitude_estimate)
        .filter((value) => value !== null);

    return {
        viewer_kind: "energy_amplitude_view_v0",
        frame_count: frames.length,
        t_start: timeStarts.length > 0 ? Math.min(...timeStarts) : undefined,
        t_end: timeEnds.length > 0 ? Math.max(...timeEnds) : undefined,
        max_energy_value: energyValues.length > 0 ? Math.max(...energyValues) : undefined,
        max_amplitude_estimate: amplitudeValues.length > 0 ? Math.max(...amplitudeValues) : undefined,
        frames,
    };
}

function frameOverlapsRange(frame, tStart, tEnd) {
    const frameStart = finiteNumberOrNull(frame?.t_start);
    const frameEnd = finiteNumberOrNull(frame?.t_end);

    if (frameStart === null || frameEnd === null || tStart === null || tEnd === null) return false;
    return frameEnd > tStart && frameStart < tEnd;
}

function buildEvidenceWindows({ spectral, energy, anomalies }) {
    const anomalyRows = safeArray(anomalies);
    if (anomalyRows.length === 0) return undefined;

    const anomalyStarts = anomalyRows.map((row) => finiteNumberOrNull(row?.t_start)).filter((value) => value !== null);
    const anomalyEnds = anomalyRows.map((row) => finiteNumberOrNull(row?.t_end)).filter((value) => value !== null);
    if (anomalyStarts.length === 0 || anomalyEnds.length === 0) return undefined;

    const perturbationStart = Math.min(...anomalyStarts);
    const perturbationEnd = Math.max(...anomalyEnds);
    const referenceFrames = safeArray(spectral?.frames).length > 0
        ? spectral.frames
        : safeArray(energy?.frames);

    if (referenceFrames.length === 0) return undefined;

    const baselineFrames = referenceFrames.filter((frame) => {
        const frameEnd = finiteNumberOrNull(frame?.t_end);
        return frameEnd !== null && frameEnd <= perturbationStart;
    });
    const perturbationFrames = referenceFrames.filter((frame) =>
        frameOverlapsRange(frame, perturbationStart, perturbationEnd)
    );
    const returnFrames = referenceFrames.filter((frame) => {
        const frameStart = finiteNumberOrNull(frame?.t_start);
        return frameStart !== null && frameStart >= perturbationEnd;
    });

    if (baselineFrames.length === 0 || perturbationFrames.length === 0 || returnFrames.length === 0) {
        return undefined;
    }

    return {
        viewer_kind: "baseline_perturbation_return_windows_v0",
        basis: "anomaly_window_triptych",
        slots: [
            {
                slot_id: "baseline",
                label: "Baseline",
                t_start: baselineFrames[0]?.t_start ?? undefined,
                t_end: baselineFrames[baselineFrames.length - 1]?.t_end ?? undefined,
                frame_count: baselineFrames.length,
            },
            {
                slot_id: "perturbation",
                label: "Perturbation",
                t_start: perturbationStart,
                t_end: perturbationEnd,
                frame_count: perturbationFrames.length,
            },
            {
                slot_id: "return",
                label: "Return",
                t_start: returnFrames[0]?.t_start ?? undefined,
                t_end: returnFrames[returnFrames.length - 1]?.t_end ?? undefined,
                frame_count: returnFrames.length,
            },
        ],
    };
}

function buildStructuralSection(input) {
    const { workbench, replayLog } = input;
    const runtime = safeObject(workbench?.runtime) ?? {};
    const trajectory = readTrajectoryOverlay(workbench);
    const attentionMemory = readAttentionMemoryOverlay(workbench);
    const anomalyReports = safeArray(runtime?.artifacts?.anomaly_reports);
    const basinSets = safeArray(runtime?.artifacts?.basin_sets);
    const h1States = safeArray(runtime?.artifacts?.h1s);
    const segmentTransitions = safeArray(runtime?.substrate?.segment_transitions);
    const transitionReport = safeObject(runtime?.substrate?.transition_report);
    const latestReplay = replayLog[0] ?? null;
    const structural = {};
    const spectral = buildSpectralProjection(runtime);
    const energy = buildEnergyProjection(runtime);

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

    if (spectral) {
        structural.spectral = spectral;
    }

    if (energy) {
        structural.energy = energy;
    }

    const evidenceWindows = buildEvidenceWindows({
        spectral,
        energy,
        anomalies: structural.anomalies,
    });

    if (evidenceWindows) {
        structural.evidence_windows = evidenceWindows;
    }

    if (
        h1States.length > 0 ||
        safeArray(runtime?.artifacts?.m1s).length > 0 ||
        hasEntries(attentionMemory)
    ) {
        structural.retained = {
            h1_count: h1States.length,
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
        const hasActiveRuntime = input.hasActiveResult === true || !!(input.runResult?.ok && input.workbench);
        const timestampRange = toTimestampRange(input.workbench, input.runResult);
        const hasPublishedAt = Number.isFinite(input.publishedAtMs);
        const hasObservedAt = Number.isFinite(input.viewObservedAtMs);
        const exportAgeMs =
            hasPublishedAt && hasObservedAt
                ? Math.max(0, input.viewObservedAtMs - input.publishedAtMs)
                : undefined;
        const unavailableFields = [
            "input_rate_hz",
            "pipeline_latency_ms",
            "render_fps",
            "dropped_frames",
            "browser_jitter_ms",
            "processing_jitter_ms",
            "queue_depth",
            "update_cadence_ms",
        ];

        return {
            rail_status: hasActiveRuntime ? "live_runtime_attached" : "live_runtime_unavailable",
            placeholder_status: hasActiveRuntime
                ? "timing_metrics_partially_unwired"
                : "live_telemetry_unavailable_until_active_state",
            visibility_note: "Telemetry describes viewer/runtime timing posture only, not structural evidence or overlays.",
            availability_note: hasActiveRuntime
                ? "Showing current shell export posture and available timing stamps. Cadence and jitter metrics remain unwired."
                : "No active runtime/workbench state is visible. Live telemetry is limited to shell export posture.",
            run_status: input.runStatus ?? "idle",
            run_id: input.runId ?? undefined,
            active_run_label: input.activeRunLabel ?? input.runResult?.run_label ?? undefined,
            publication_source: input.publicationSource ?? undefined,
            published_at_ms: hasPublishedAt ? input.publishedAtMs : undefined,
            view_observed_at_ms: hasObservedAt ? input.viewObservedAtMs : undefined,
            export_age_ms: exportAgeMs,
            source_window: Array.isArray(timestampRange)
                ? { t_start: timestampRange[0], t_end: timestampRange[1] }
                : undefined,
            unavailable_fields: unavailableFields,
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
