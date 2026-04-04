// hud/tandemAdapter.js
//
// HUD / Demo Tandem Adapter — shared read-side model shaping
//
// Constitutional posture:
//   - This adapter shapes read-side presentation projections from lawful
//     shell-emitted state. It does NOT redefine runtime meaning, request
//     meaning, replay meaning, or canon status.
//   - Both projections derive from the same underlying state.
//   - The HUD projection is denser; the demo projection is calmer and narrower.
//   - Neither projection may claim authority, infer truth, or invoke promotion.
//   - Provenance remains prior to evidence; evidence remains prior to
//     interpretation; review/request/replay surfaces remain lowest.
//   - This file contains no runtime operators, no ConsensusOp calls,
//     no C1 mutation, and no canon logic.
//
// Input: shell-emitted state object (see buildTandemInput)
// Outputs:
//   - internal_hud  projection  (denser, provenance + evidence + request/replay detail)
//   - public_demo   projection  (calmer, narrower, single-object card posture)
//
// Both outputs preserve the required inspection ordering:
//   1. Provenance
//   2. Runtime Evidence
//   3. Interpretation
//   4. Review / Request / Replay Surfaces

"use strict";

// ─── Input normalizer ─────────────────────────────────────────────────────────
// Accepts the shape emitted by the execution shell and normalizes missing fields
// gracefully. Does not re-derive runtime values from raw operators.
export function buildTandemInput({
    runResult = null,
    workbench = null,
    requestLog = [],
    replayLog = [],
    sourceFamilyLabel = "unspecified",
    runStatus = "idle",
} = {}) {
    return {
        runResult,
        workbench,
        requestLog: Array.isArray(requestLog) ? requestLog : [],
        replayLog: Array.isArray(replayLog) ? replayLog : [],
        sourceFamilyLabel,
        runStatus,
        hasResult: !!(runResult?.ok && workbench),
    };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function safeStr(v, fallback = "—") {
    return (v !== null && v !== undefined && v !== "") ? String(v) : fallback;
}

function safeNum(v, fallback = 0) {
    return Number.isFinite(Number(v)) ? Number(v) : fallback;
}

function buildSourceProfileNote(meta = {}) {
    const parts = [];
    if (meta?.seed !== undefined && meta?.seed !== null) parts.push(`seed ${meta.seed}`);
    if (meta?.noiseStd !== undefined && meta?.noiseStd !== null) parts.push(`noise std ${meta.noiseStd}`);
    if (meta?.durationSec !== undefined && meta?.durationSec !== null) parts.push(`duration ${meta.durationSec}s`);
    return parts.length > 0 ? parts.join(" · ") : "—";
}

// Extract provenance block from shell state
function extractProvenance(input) {
    const { runResult, workbench, sourceFamilyLabel, runStatus } = input;
    const scope = workbench?.scope ?? {};
    const a1 = runResult?.artifacts?.a1
        ?? runResult?.ingest?.artifact
        ?? workbench?.runtime?.artifacts?.a1
        ?? {};
    const sourceMeta = a1?.meta ?? {};
    return {
        source_family: sourceFamilyLabel,
        object_id: safeStr(scope?.stream_id ?? a1?.stream_id),
        source_id: safeStr(a1?.source_id),
        source_seed: sourceMeta?.seed ?? null,
        source_noise_std: sourceMeta?.noiseStd ?? null,
        source_profile_note: buildSourceProfileNote(sourceMeta),
        run_label: safeStr(runResult?.run_label),
        run_status: runStatus,
        declared_lens: "medium FFT/Hann · N=256 · hop=128 · Fs=256Hz",
        cross_run_available: !!(scope?.cross_run_context?.available),
        cross_run_count: safeNum(scope?.cross_run_context?.run_count),
        segment_count: safeNum((scope?.segment_ids ?? []).length),
        ingest_ok: !!(runResult?.ok),
        lineage_note: runResult?.run_label
            ? `shell run · ${sourceFamilyLabel} · ${safeStr(scope?.stream_id ?? a1?.stream_id)}`
            : "no run yet",
    };
}

// Extract evidence block from shell state
function extractEvidence(input) {
    const { runResult, workbench } = input;
    const runtime = workbench?.runtime ?? {};
    const r = workbench?.promotion_readiness?.report ?? {};
    const dos = workbench?.canon_candidate?.dossier ?? {};
    const anomalyReports = runtime?.artifacts?.anomaly_reports ?? runResult?.anomalies ?? [];
    const harmonicStateCount = safeNum(runtime?.artifacts?.h1s?.length ?? workbench?.runtime_evidence?.harmonic_state_count);
    const mergedStateCount = safeNum(runtime?.artifacts?.m1s?.length ?? workbench?.runtime_evidence?.merged_state_count);
    const queryResultCount = runtime?.artifacts?.q ? 1 : safeNum(workbench?.runtime_evidence?.query_result_count);
    return {
        state_count: safeNum(runtime?.substrate?.state_count),
        basin_count: safeNum(runtime?.substrate?.basin_count),
        segment_count: safeNum(runtime?.substrate?.segment_count),
        harmonic_state_count: harmonicStateCount,
        merged_state_count: mergedStateCount,
        query_result_count: queryResultCount,
        anomaly_count: anomalyReports.length,
        anomaly_events: anomalyReports.slice(0, 5).map(a => ({
            time_start: a?.comparison_window?.window_span?.t_start ?? null,
            anomaly_type: a?.comparison_summary?.dominant_change ?? a?.artifact_type ?? "anomaly",
        })),
        overall_readiness: safeStr(r?.readiness_summary?.overall_readiness),
        candidate_claim_type: safeStr(dos?.candidate_claim?.claim_type),
        consensus_result: safeStr(workbench?.consensus_review?.review?.result),
    };
}

// Derive interpretation note (bounded, non-authoritative)
function deriveInterpretation(input, evidence) {
    if (!input.hasResult) {
        return {
            summary: "No run result available. Select a source and run to generate structural evidence.",
            posture: "derived · non-authoritative · not canon",
        };
    }
    const readiness = evidence.overall_readiness;
    let summary;
    if (readiness === "insufficient") {
        summary = `Current evidence is insufficient for promotion review. Runtime memory is structured and lawful. Further cross-run evidence is needed before canon review.`;
    } else if (readiness === "deferred") {
        summary = `Deferred. The run produced structural evidence but additional review conditions must be met before activation consideration.`;
    } else if (evidence.anomaly_count > 0) {
        summary = `Structural evidence is present with ${evidence.anomaly_count} anomaly event${evidence.anomaly_count > 1 ? "s" : ""} observed. Review posture and candidate dossier are available for inspection.`;
    } else {
        summary = `Structural evidence is present. No anomaly events observed in this run. Readiness posture and candidate dossier are available for review.`;
    }
    return {
        summary,
        posture: "derived · bounded · read-side only · not authority · not canon",
    };
}

// Derive request/replay summary block
function extractReviewRequestReplay(input) {
    const { requestLog, replayLog } = input;
    const latestRequest = requestLog[0] ?? null;
    const latestReplay = replayLog[0] ?? null;

    return {
        request_count: requestLog.length,
        replay_count: replayLog.length,
        latest_request: latestRequest ? {
            request_id: latestRequest.request_id,
            request_type: latestRequest.request_type,
            request_status: latestRequest.request_status,
            run_label: latestRequest.run_label,
            non_claims_count: (latestRequest.explicit_non_claims ?? []).length,
        } : null,
        latest_replay: latestReplay ? {
            replay_request_id: latestReplay.replay_request_id,
            replay_type: latestReplay.replay_type,
            request_status: latestReplay.request_status,
            tier_label: latestReplay.retained_tier_used?.tier_label ?? "—",
            replay_posture: latestReplay.replay_posture,
        } : null,
        posture_note: "requests and replays are explicit fences · below canon · not automatic",
    };
}

// ─── Non-authority notes (always present in both projections) ─────────────────
const NON_AUTHORITY_NOTES = [
    "runtime is not canon",
    "query is not truth",
    "display is not authority",
    "replay is lens-bound support only",
    "requests are explicit fences, not automatic promotions",
];

// ─── Internal HUD projection ──────────────────────────────────────────────────
//
// Denser. Full counts. All available fields. Request/replay log metadata.
// Audience: operator, internal inspection.
//
export function projectForHUD(input) {
    const norm = buildTandemInput(input);
    const prov = extractProvenance(norm);
    const evid = extractEvidence(norm);
    const interp = deriveInterpretation(norm, evid);
    const rrr = extractReviewRequestReplay(norm);

    return {
        audience_posture: "internal_hud",
        has_result: norm.hasResult,

        // 1. Provenance (primary)
        provenance: {
            ...prov,
            // HUD gets the full segment count and all ids available
            segment_count_label: `${prov.segment_count} segment${prov.segment_count !== 1 ? "s" : ""}`,
            cross_run_label: prov.cross_run_available
                ? `yes · ${prov.cross_run_count} run${prov.cross_run_count !== 1 ? "s" : ""}`
                : "no",
        },

        // 2. Runtime Evidence (full counts)
        evidence: {
            ...evid,
            evidence_summary_rows: [
                ["states", String(evid.state_count)],
                ["basins", String(evid.basin_count)],
                ["segments", String(evid.segment_count)],
                ["h1_artifacts", String(evid.harmonic_state_count)],
                ["merged_states", String(evid.merged_state_count)],
                ["query_results", String(evid.query_result_count)],
                ["anomaly_events", String(evid.anomaly_count)],
                ["overall_readiness", evid.overall_readiness],
                ["candidate_claim", evid.candidate_claim_type],
                ["consensus_result", evid.consensus_result],
            ],
        },

        // 3. Interpretation (derived, bounded)
        interpretation: {
            ...interp,
            // HUD gets readiness detail
            readiness_label: evid.overall_readiness,
        },

        // 4. Review / Request / Replay (below evidence)
        review_request_replay: {
            ...rrr,
            // HUD gets counts and latest summaries
            request_log_note: rrr.request_count > 0
                ? `${rrr.request_count} prepared request${rrr.request_count !== 1 ? "s" : ""}`
                : "no requests prepared",
            replay_log_note: rrr.replay_count > 0
                ? `${rrr.replay_count} prepared replay${rrr.replay_count !== 1 ? "s" : ""}`
                : "no replays prepared",
        },

        explicit_non_authority_notes: NON_AUTHORITY_NOTES,
    };
}

// ─── Public demo projection ───────────────────────────────────────────────────
//
// Calmer. Narrower. Single-object card posture.
// Audience: external, Internet Society, founding wave.
// Omits raw counts; shows human-readable summaries.
// Review/replay posture is brief and fenced.
//
export function projectForDemo(input) {
    const norm = buildTandemInput(input);
    const prov = extractProvenance(norm);
    const evid = extractEvidence(norm);
    const interp = deriveInterpretation(norm, evid);
    const rrr = extractReviewRequestReplay(norm);

    // Compact object label for demo card
    const objectLabel = norm.hasResult
        ? `${prov.source_family} · ${prov.run_label}`
        : "No run yet";

    // Compact evidence summary for demo (no raw counts — just high-level)
    const evidenceSummary = norm.hasResult
        ? [
            prov.source_profile_note !== "—"
                ? `source profile: ${prov.source_profile_note}`
                : null,
            prov.cross_run_available
                ? `${prov.cross_run_count} cross-run comparison${prov.cross_run_count !== 1 ? "s" : ""} available`
                : "single run",
            evid.anomaly_count > 0
                ? `${evid.anomaly_count} anomaly event${evid.anomaly_count !== 1 ? "s" : ""} observed`
                : "no anomaly events",
            evid.harmonic_state_count > 0 || evid.merged_state_count > 0
                ? `runtime profile: ${evid.harmonic_state_count} harmonic · ${evid.merged_state_count} merged`
                : null,
            `${prov.segment_count} segment${prov.segment_count !== 1 ? "s" : ""}`,
        ].filter(Boolean)
        : ["no evidence yet"];

    // Compact request/replay status for demo card
    const requestNote = rrr.latest_request
        ? `${rrr.latest_request.request_type} request · ${rrr.latest_request.request_status}`
        : "no requests prepared";
    const replayNote = rrr.latest_replay
        ? `replay prepared · ${rrr.latest_replay.tier_label ?? "Tier 0"}`
        : "no replays prepared";

    return {
        audience_posture: "public_demo",
        has_result: norm.hasResult,

        // 1. Provenance (human-readable, prominent)
        provenance: {
            object_label: objectLabel,
            object_id: prov.object_id,
            source_family: prov.source_family,
            source_profile_note: prov.source_profile_note,
            declared_lens: prov.declared_lens,
            lineage_note: prov.lineage_note,
            ingest_ok: prov.ingest_ok,
        },

        // 2. Evidence (compact, no raw counts)
        evidence: {
            summary_lines: evidenceSummary,
            readiness_note: evid.overall_readiness !== "—"
                ? `readiness: ${evid.overall_readiness}`
                : "readiness: not evaluated",
            has_anomaly_events: evid.anomaly_count > 0,
        },

        // 3. Interpretation (bounded, prominently labeled non-authoritative)
        interpretation: {
            summary: interp.summary,
            posture: interp.posture,
            derived_note: "derived · bounded · not authority · not canon",
        },

        // 4. Review / Request / Replay (lower, brief)
        review_request_replay: {
            request_note: requestNote,
            replay_note: replayNote,
            posture_note: rrr.posture_note,
            // Demo shows one-line notes only, not full request/replay objects
        },

        explicit_non_authority_notes: NON_AUTHORITY_NOTES.slice(0, 3),
        // Demo surfaces fewer non-authority notes — the posture label carries the rest
    };
}

// ─── Both projections together ────────────────────────────────────────────────
// Returns { hud, demo } from the same normalized input.
// Guarantees both derive from identical underlying state.
export function projectBoth(input) {
    const norm = buildTandemInput(input);   // normalize once
    return {
        hud: projectForHUD(norm),
        demo: projectForDemo(norm),
    };
}
