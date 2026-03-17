function safeArray(value) {
    return Array.isArray(value) ? value : [];
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
        const neighborhoodId =
            n.neighborhood_id ?? n.id ?? `NBHD-${String(idx + 1).padStart(2, "0")}`;
        const dwellFrames = Number(n.dwell_count ?? n.frames ?? 0) || 0;
        const dwellSec = Number(n.dwell_duration_sec ?? n.duration_sec ?? 0) || 0;
        const reEntries = Number(n.re_entry_count ?? n.re_entries ?? n.runs ?? 0) || 0;

        return {
            id: neighborhoodId,
            dwellFrames,
            dwellSec,
            reEntries,
            activity: Math.min(1, dwellFrames / maxDwellCount),
            current: neighborhoodId === tr.current_neighborhood_id,
        };
    });

    const totalTransitions = Number(tr.total_transitions ?? 0) || 0;

    const transitions = safeArray(tr.transitions).map((t) => ({
        from: t.from ?? "—",
        to: t.to ?? "—",
        count: Number(t.count ?? 0) || 0,
        share: totalTransitions > 0 ? (Number(t.count ?? 0) || 0) / totalTransitions : 0,
    }));

    return {
        source_mode: workbench?.scope?.cross_run_context?.available ? "session" : "single_run",
        cycle: null,
        stream_badge: shortId(workbench?.scope?.stream_id ?? "—"),
        stream_id: workbench?.scope?.stream_id ?? "—",

        run_health: {
            states: Number(workbench?.runtime?.substrate?.state_count ?? 0) || 0,
            basins: Number(workbench?.runtime?.substrate?.basin_count ?? 0) || 0,
            segments: Number(workbench?.runtime?.substrate?.segment_count ?? 0) || 0,
            skipped:
                Number(workbench?.runtime?.audit?.skipped_windows?.length ?? 0) || 0,
            merge_failures:
                Number(workbench?.runtime?.audit?.merge_failures?.length ?? 0) || 0,
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