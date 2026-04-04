function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function firstDefined(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return null;
}

function syntheticNeighborhoodId(idx) {
    return `NBHD-${String(idx + 1).padStart(2, "0")}`;
}

function resolveNeighborhoodIdentity(entry, idx, tr = {}) {
    return firstDefined(
        entry?.neighborhood_label,
        entry?.label,
        entry?.neighborhood_name,
        entry?.name,
        entry?.neighborhood_id,
        entry?.basin_id,
        entry?.id,
        syntheticNeighborhoodId(idx)
    );
}

function safeNum(value) {
    return Number.isFinite(value) ? value : 0;
}

function incrementCount(counts, key) {
    const normalizedKey = key ?? "unspecified";
    counts[normalizedKey] = (counts[normalizedKey] ?? 0) + 1;
}

function countEventTypes(rows) {
    const counts = {};
    for (const row of safeArray(rows)) {
        for (const eventType of safeArray(row?.detected_event_types ?? row?.events)) {
            incrementCount(counts, eventType);
        }
    }
    return counts;
}

function countAnomalyTypes(rows) {
    const counts = {};
    for (const row of safeArray(rows)) {
        const eventTypes = safeArray(row?.detected_event_types);
        if (eventTypes.length > 0) {
            for (const eventType of eventTypes) incrementCount(counts, eventType);
            continue;
        }

        incrementCount(
            counts,
            firstDefined(
                row?.anomaly_type,
                row?.report_type,
                row?.kind,
                row?.novelty_type,
                row?.event_type
            )
        );
    }
    return counts;
}

function dominantNeighborhoodSummary(neighborhoods) {
    const ranked = [...safeArray(neighborhoods)].sort((a, b) => {
        const frameDelta = safeNum(b?.dwellFrames) - safeNum(a?.dwellFrames);
        if (frameDelta !== 0) return frameDelta;

        const reentryDelta = safeNum(b?.reEntries) - safeNum(a?.reEntries);
        if (reentryDelta !== 0) return reentryDelta;

        return String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
    });

    return ranked[0] ?? null;
}

function dominantTransitionSummary(transitions) {
    const ranked = [...safeArray(transitions)].sort((a, b) => {
        const countDelta = safeNum(b?.count) - safeNum(a?.count);
        if (countDelta !== 0) return countDelta;

        return `${a?.from ?? ""}->${a?.to ?? ""}`.localeCompare(`${b?.from ?? ""}->${b?.to ?? ""}`);
    });

    return ranked[0] ?? null;
}

function buildSourceProfileNote(meta = {}) {
    const parts = [];
    if (meta?.seed !== undefined && meta?.seed !== null) parts.push(`seed ${meta.seed}`);
    if (meta?.noiseStd !== undefined && meta?.noiseStd !== null) parts.push(`noise std ${meta.noiseStd}`);
    if (meta?.durationSec !== undefined && meta?.durationSec !== null) parts.push(`duration ${meta.durationSec}s`);
    return parts.length > 0 ? parts.join(" · ") : "—";
}

export function shortId(id) {
    if (!id) return "—";

    const text = String(id);

    if (text.startsWith("NBHD-")) return text;

    const parts = text.split(":");
    const last = parts[parts.length - 1] ?? text;

    if (last.length <= 12) return last;
    return `${last.slice(0, 4)}…${last.slice(-4)}`;
}

export function workbenchToStructuralHudModel(workbench, crossRunReport = null) {
    const tr = workbench?.runtime?.substrate?.transition_report ?? {};
    const segTransitions = safeArray(workbench?.runtime?.substrate?.segment_transitions);
    const readiness = workbench?.promotion_readiness?.report?.readiness_summary ?? {};
    const trajectory = workbench?.interpretation?.trajectory ?? {};
    const sourceMeta = workbench?.runtime?.artifacts?.a1?.meta ?? {};
    const runtimeArtifacts = workbench?.runtime?.artifacts ?? {};
    const anomalyReports = safeArray(runtimeArtifacts?.anomaly_reports);

    const dwell = Array.isArray(tr.neighborhood_dwell)
        ? tr.neighborhood_dwell
        : Array.isArray(tr.dwell)
            ? tr.dwell
            : [];

    const maxDwellCount = Math.max(
        1,
        ...dwell.map((n) => Number(n.dwell_count ?? n.frames ?? 0) || 0)
    );

    const neighborhoods = dwell.map((n, idx) => {
        const neighborhoodId = resolveNeighborhoodIdentity(n, idx, tr);
        const dwellFrames =
            Number(n.dwell_count ?? n.total_frames ?? n.frames ?? 0) || 0;

        const dwellSec =
            Number(n.dwell_duration_sec ?? n.total_duration_sec ?? n.duration_sec ?? 0) || 0;

        const reEntries =
            Number(n.re_entry_count ?? n.re_entries ?? n.dwell_runs ?? n.runs ?? 0) || 0;
        return {
            id: neighborhoodId,
            dwellFrames,
            dwellSec,
            reEntries,
            activity: Math.min(1, dwellFrames / maxDwellCount),
            current:
                neighborhoodId === tr.current_neighborhood_id ||
                neighborhoodId === tr.current_neighborhood_label,

            evidence: {
                neighborhood_label: n?.neighborhood_label ?? null,
                label: n?.label ?? null,
                neighborhood_name: n?.neighborhood_name ?? null,
                name: n?.name ?? null,
                neighborhood_id: n?.neighborhood_id ?? null,
                basin_id: n?.basin_id ?? null,
                id: n?.id ?? null,
            },
        };
    });

    const totalTransitions = Number(tr.total_transitions ?? 0) || 0;

    const transitions = safeArray(tr.transitions).map((t) => ({
        from:
            firstDefined(
                t?.from_label,
                t?.from_neighborhood_label,
                t?.from_name,
                t?.from_neighborhood_id,
                t?.from
            ) ?? "—",

        to:
            firstDefined(
                t?.to_label,
                t?.to_neighborhood_label,
                t?.to_name,
                t?.to_neighborhood_id,
                t?.to
            ) ?? "—",

        count: Number(t.count ?? 0) || 0,
        share: totalTransitions > 0 ? (Number(t.count ?? 0) || 0) / totalTransitions : 0,
    }));

    const dominantNeighborhood = dominantNeighborhoodSummary(neighborhoods);
    const dominantTransition = dominantTransitionSummary(transitions);
    const segmentEventTypes = countEventTypes(segTransitions);
    const anomalyTypeCounts = countAnomalyTypes(anomalyReports);
    const dominantDwellShare =
        Number(
            trajectory?.neighborhood_character?.evidence?.dominant_dwell_share ??
            0
        ) || 0;
    const currentNeighborhoodId =
        tr.current_neighborhood_id ??
        tr.current_neighborhood_label ??
        neighborhoods.find((n) => n.current)?.id ??
        null;
    const currentDwellCount =
        Number(
            tr.current_dwell_count ??
            trajectory?.neighborhood_character?.evidence?.current_dwell_count ??
            0
        ) || 0;
    const currentDwellDurationSec =
        Number(
            tr.current_dwell_duration_sec ??
            trajectory?.neighborhood_character?.evidence?.current_dwell_duration_sec ??
            0
        ) || 0;
    const totalReEntries =
        Number(
            tr.total_re_entries ??
            trajectory?.neighborhood_character?.evidence?.total_re_entries ??
            0
        ) || 0;

    return {
        source_mode: workbench?.scope?.cross_run_context?.available ? "session" : "single_run",
        cycle: null,
        stream_badge: shortId(workbench?.scope?.stream_id ?? "—"),
        stream_id: workbench?.scope?.stream_id ?? "—",

        provenance: {
            source_mode: workbench?.scope?.cross_run_context?.available ? "session" : "single_run",
            stream_id: workbench?.scope?.stream_id ?? "—",
            stream_badge: shortId(workbench?.scope?.stream_id ?? "—"),
            segment_count: Number(workbench?.scope?.segment_ids?.length ?? 0) || 0,
            cross_run_available: Boolean(workbench?.scope?.cross_run_context?.available),
            cross_run_count: Number(workbench?.scope?.cross_run_context?.run_count ?? 0) || 0,
            source_id:
                workbench?.scope?.source_id ??
                workbench?.runtime?.artifacts?.a1?.meta?.source_id ??
                workbench?.runtime?.artifacts?.a1?.ingest_receipt?.source_id ??
                workbench?.runtime?.artifacts?.a1?.source_id ??
                workbench?.runtime?.artifacts?.a2?.source_id ??
                workbench?.runtime?.artifacts?.a1?.meta?.source_path ??
                workbench?.runtime?.artifacts?.a1?.meta?.source_mode ??
                "—",

            channel:
                workbench?.runtime?.artifacts?.a1?.meta?.channel ??
                workbench?.runtime?.artifacts?.a1?.channel ??
                workbench?.runtime?.artifacts?.a2?.channel ??
                "—",

            modality:
                workbench?.runtime?.artifacts?.a1?.meta?.modality ??
                workbench?.runtime?.artifacts?.a1?.modality ??
                workbench?.runtime?.artifacts?.a2?.modality ??
                "—",

            source_mode:
                workbench?.runtime?.artifacts?.a1?.meta?.source_mode ??
                workbench?.scope?.source_mode ??
                "—",

            source_seed: sourceMeta?.seed ?? null,
            source_noise_std: sourceMeta?.noiseStd ?? null,
            source_profile_note: buildSourceProfileNote(sourceMeta),

            source_format:
                workbench?.runtime?.artifacts?.a1?.meta?.source_format ??
                "—",

            clock_policy_id:
                workbench?.runtime?.artifacts?.a1?.clock_policy_id ??
                workbench?.runtime?.artifacts?.a1?.policies?.clock_policy_id ??
                workbench?.runtime?.artifacts?.a2?.clock_policy_id ??
                "—",

            query_policy_id:
                workbench?.runtime?.artifacts?.q?.receipts?.query?.query_policy_id ?? "—",

            t_start:
                workbench?.runtime?.artifacts?.a1?.timestamps?.[0] ??
                workbench?.runtime?.artifacts?.a2?.grid?.t_start ??
                "—",

            t_end:
                workbench?.runtime?.artifacts?.a1?.timestamps?.[
                Math.max(0, (workbench?.runtime?.artifacts?.a1?.timestamps?.length ?? 1) - 1)
                ] ??
                workbench?.runtime?.artifacts?.a2?.grid?.t_end ??
                "—",
        },

        run_health: {
            states: Number(workbench?.runtime?.substrate?.state_count ?? 0) || 0,
            basins: Number(workbench?.runtime?.substrate?.basin_count ?? 0) || 0,
            segments: Number(workbench?.runtime?.substrate?.segment_count ?? 0) || 0,
            skipped:
                Number(workbench?.runtime?.audit?.skipped_windows?.length ?? 0) || 0,
            merge_failures:
                Number(workbench?.runtime?.audit?.merge_failures?.length ?? 0) || 0,
        },

        runtime_evidence: {
            artifact_counts: {
                h1s: Number(runtimeArtifacts?.h1s?.length ?? 0) || 0,
                m1s: Number(runtimeArtifacts?.m1s?.length ?? 0) || 0,
                anomaly_reports: Number(anomalyReports?.length ?? 0) || 0,
                basin_sets:
                    Number(runtimeArtifacts?.basin_sets?.length ?? 0) || 0,
                has_query: Boolean(runtimeArtifacts?.q),
            },
            trajectory_frames:
                Number(workbench?.runtime?.substrate?.trajectory_frames ?? 0) || 0,
            transition_count:
                Number(workbench?.runtime?.substrate?.transition_report?.total_transitions ?? 0) || 0,
            total_re_entries: totalReEntries,
            current_neighborhood_id: currentNeighborhoodId,
            current_dwell_count: currentDwellCount,
            current_dwell_duration_sec: currentDwellDurationSec,
            dominant_dwell_share: dominantDwellShare,
            dominant_neighborhood_id: dominantNeighborhood?.id ?? null,
            dominant_neighborhood_frames: safeNum(dominantNeighborhood?.dwellFrames),
            dominant_transition:
                dominantTransition
                    ? {
                        from: dominantTransition.from,
                        to: dominantTransition.to,
                        count: safeNum(dominantTransition.count),
                    }
                    : null,
            segment_boundary_events: segTransitions.length,
            segment_event_types: segmentEventTypes,
            anomaly_type_counts: anomalyTypeCounts,
        },

        audit: {
            skipped_windows:
                Number(workbench?.runtime?.audit?.skipped_windows?.length ?? 0) || 0,
            merge_failures:
                Number(workbench?.runtime?.audit?.merge_failures?.length ?? 0) || 0,
            consensus_receipts:
                Number(workbench?.runtime?.audit?.consensus_receipts?.length ?? 0) || 0,
        },

        structure: {
            convergence: trajectory?.trajectory_character?.convergence ?? "unknown",
            motion: trajectory?.trajectory_character?.motion ?? "unknown",
            occupancy: trajectory?.neighborhood_character?.occupancy ?? "unknown",
            recurrence: trajectory?.neighborhood_character?.recurrence_strength ?? "unknown",
            continuity: trajectory?.segment_character?.continuity ?? "unknown",
            transition_selectivity:
                workbench?.promotion_readiness?.report?.evidence_domains?.transition_selectivity?.label ??
                "unknown",
        },

        review: {
            readiness: readiness?.overall_readiness ?? "unknown",
            confidence: readiness?.confidence ?? "unknown",
            claim:
                workbench?.canon_candidate?.dossier?.candidate_claim?.claim_type ?? "unknown",
            consensus:
                workbench?.consensus_review?.review?.result ?? "not_reviewed",
            blockers:
                Number(workbench?.canon_candidate?.dossier?.blockers?.length ?? 0) || 0,
            insufficiencies:
                Number(workbench?.canon_candidate?.dossier?.insufficiencies?.length ?? 0) || 0,
        },

        neighborhoods,
        transitions,

        segmentTransitions: segTransitions.map((e) => ({
            t: Number(e?.t_transition ?? e?.t ?? 0) || 0,
            divergence: Number(e?.divergence_score ?? e?.divergence ?? 0) || 0,
            events: safeArray(e?.detected_event_types ?? e?.events),
        })),

        cross_run: crossRunReport
            ? {
                report_type: crossRunReport?.report_type ?? null,
                run_count: crossRunReport?.scope?.run_count ?? 0,
            }
            : null,
    };
}
