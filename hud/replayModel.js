// hud/replayModel.js
//
// Bounded Replay Request Object Model
//
// Constitutional posture:
//   - Replay is lens-bound support, not truth restoration.
//   - Replay requests are explicit surface-level objects that remain below canon.
//   - Replay surfaces may reconstruct or re-present prior structure under a
//     declared lens and retained-tier posture. They may not imply truth,
//     canon, ontology, or raw source equivalence.
//   - Retained-tier posture must be declared explicitly, including when it is
//     only Tier 0 (live working state).
//   - Derived-vs-durable posture must be stated.
//   - No C1 is minted. No consensus is invoked. No promotion occurs.
//
// Replay request statuses (distinct from canon statuses and request statuses):
//   drafted   — being constructed
//   prepared  — object complete, ready for rendering
//   rendered  — replay panel has displayed this request
//   deferred  — held pending evidence or tier availability
//   failed    — could not be prepared due to missing required context
//
// Replay types:
//   runtime_reconstruction   — from current in-memory run/workbench
//   request_support_replay   — replay support for a prepared consultation/activation request

"use strict";

// ─── ID generation ────────────────────────────────────────────────────────────
function makeReplayId(type) {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 7);
    const pfx = type === "runtime_reconstruction" ? "RPLY-RT" : "RPLY-RQ";
    return `${pfx}-${ts}-${rand}`;
}

// ─── Declared lens extraction ─────────────────────────────────────────────────
// Builds a bounded lens record from available context.
// v0 uses the policy constants baked into the shell (synthetic/file-import path).
// These match the active POLICIES in MetaLayerObjectExecutionShell.jsx.
export function declareLens(sourceFamilyLabel = "unspecified", runResult = null) {
    return {
        transform_family: "FFT/Hann",
        window_family: "Hann",
        window_N: 256,
        hop_N: 128,
        Fs_target: 256,
        scale_posture: "medium",
        band_partition: "declared per transform policy",
        segmentation_rule: "anomaly-boundary strict",
        comparison_basis: "structural band profile · cross-run comparison",
        replay_lens: "declared read-side shell lens",
        source_family: sourceFamilyLabel,
        stream_id: runResult?.artifacts?.a1?.stream_id ?? null,
        note: "active shell policies · medium FFT/Hann · N=256 hop=128 · Fs=256Hz",
    };
}

// ─── Retained tier declaration ────────────────────────────────────────────────
// v0 honestly declares Tier 0 (live working state).
// Later tiers (durable receipts, digest, pinned packet, archive) are noted
// as not yet materially wired for browser shell replay.
export function declareRetainedTier(runResult = null) {
    return {
        tier_used: 0,
        tier_label: "Tier 0 — live working state",
        tier_description: "in-memory run/workbench from current shell session",
        supports: [
            "current-cycle inspection",
            "short-horizon local visibility",
            "operator convenience for active session",
        ],
        does_not_imply: [
            "durable lineage",
            "stable replay legitimacy beyond this session",
            "promotion",
            "receipt-backed preservation",
        ],
        higher_tiers_note: "Tier 1 (durable receipts), Tier 2 (digest), Tier 3 (pinned packet), Tier 4 (archive) are not yet wired for browser shell replay in v0",
        source_ref: runResult?.run_label ?? null,
        honest_posture: "Tier 0 only · not receipt-backed · session-scoped",
    };
}

// ─── Derive replay support basis from workbench ───────────────────────────────
function deriveReplaySupport(workbench, runResult) {
    if (!workbench && !runResult) return ["no_active_run"];
    const runtime = workbench?.runtime ?? {};
    const scope = workbench?.scope ?? {};
    const basis = [];

    if ((runtime?.artifacts?.h1s?.length ?? 0) > 0) basis.push("harmonic_state_evidence");
    if ((runtime?.artifacts?.m1s?.length ?? 0) > 0) basis.push("merged_state_evidence");
    if (runtime?.artifacts?.q) basis.push("query_result_evidence");
    if ((runtime?.artifacts?.anomaly_reports ?? []).length > 0) basis.push("anomaly_event_evidence");
    if (scope?.cross_run_context?.available) basis.push("cross_run_evidence");
    if (basis.length === 0) basis.push("single_run_structural_evidence_only");
    return basis;
}

// ─── Runtime reconstruction replay builder ───────────────────────────────────
//
// Replay class: runtime_reconstruction
// Target: current in-memory run/workbench (Tier 0)
//
export function buildRuntimeReconstructionReplay({
    workbench,
    runResult,
    sourceFamilyLabel = "unspecified",
    notes = "",
} = {}) {
    if (!runResult?.ok || !workbench) {
        return {
            replay_request_id: makeReplayId("runtime_reconstruction"),
            replay_type: "runtime_reconstruction",
            request_status: "failed",
            requested_at: new Date().toISOString(),
            failure_reason: "no active run/workbench available for replay",
            notes,
        };
    }

    const id = makeReplayId("runtime_reconstruction");
    const scope = workbench?.scope ?? {};
    const read = workbench?.promotion_readiness?.report ?? {};
    const dos = workbench?.canon_candidate?.dossier ?? {};
    const lens = declareLens(sourceFamilyLabel, runResult);
    const tier = declareRetainedTier(runResult);
    const basis = deriveReplaySupport(workbench, runResult);
    const a1 = runResult?.artifacts?.a1 ?? workbench?.runtime?.artifacts?.a1 ?? null;

    return {
        replay_request_id: id,
        replay_type: "runtime_reconstruction",
        request_status: "prepared",
        requested_at: new Date().toISOString(),

        // Target
        replay_target_type: "current_run_workbench",
        replay_target_ref: runResult.run_label,

        // Provenance lineage
        source_family: sourceFamilyLabel,


        stream_id: scope?.stream_id ?? a1?.stream_id ?? null,
        source_id: a1?.source_id ?? null,
        run_label: runResult.run_label,
        segment_count: (scope?.segment_ids ?? []).length,
        cross_run_available: scope?.cross_run_context?.available ?? false,
        cross_run_count: scope?.cross_run_context?.run_count ?? null,

        // Lens
        declared_lens: lens,

        // Retained tier
        retained_tier_used: tier,

        // Evidence / support
        support_basis: basis,
        anomaly_count: (workbench?.runtime?.artifacts?.anomaly_reports ?? []).length,
        overall_readiness: read?.readiness_summary?.overall_readiness ?? null,
        candidate_claim_type: dos?.candidate_claim?.claim_type ?? null,

        // Posture
        derived_vs_durable: "derived · Tier 0 live working state · not durable beyond current session",
        allowed_use: "bounded read-side replay inspection only · not promotion · not truth",
        explicit_non_claims: [
            "not raw restoration",
            "not truth",
            "not canon",
            "not promotion",
            "not ontology",
            "not equivalent to original source artifact",
            "not receipt-backed in v0",
        ],
        replay_posture: "lens-bound support · runtime-derived · Tier 0 · non-authoritative",

        notes,
    };
}

// ─── Request support replay builder ──────────────────────────────────────────
//
// Replay class: request_support_replay
// Target: a previously prepared consultation or activation/review request
//
export function buildRequestSupportReplay({
    targetRequest,
    workbench,
    runResult,
    sourceFamilyLabel = "unspecified",
    notes = "",
} = {}) {
    if (!targetRequest) {
        return {
            replay_request_id: makeReplayId("request_support_replay"),
            replay_type: "request_support_replay",
            request_status: "failed",
            requested_at: new Date().toISOString(),
            failure_reason: "no target request provided",
            notes,
        };
    }

    const id = makeReplayId("request_support_replay");
    const lens = declareLens(sourceFamilyLabel, runResult);
    const tier = declareRetainedTier(runResult);
    const basis = deriveReplaySupport(workbench, runResult);

    return {
        replay_request_id: id,
        replay_type: "request_support_replay",
        request_status: "prepared",
        requested_at: new Date().toISOString(),

        // Target: the prepared request being replayed
        replay_target_type: "prepared_request",
        replay_target_ref: targetRequest.request_id,
        target_request_type: targetRequest.request_type,

        // Provenance from the target request (preserving its lineage)
        source_family: targetRequest.source_family_label ?? sourceFamilyLabel,
        stream_id: targetRequest.stream_id,
        source_id: targetRequest.source_id,
        run_label: targetRequest.run_label,
        segment_count: targetRequest.segment_count ?? null,
        cross_run_available: targetRequest.cross_run_available ?? false,

        // Lens
        declared_lens: lens,

        // Retained tier
        retained_tier_used: tier,

        // Support from the linked request
        support_basis: targetRequest.support_basis ?? basis,
        anomaly_count: targetRequest.anomaly_count ?? 0,
        overall_readiness: targetRequest.overall_readiness ?? null,

        // Non-claims pass through from the request
        explicit_non_claims: targetRequest.explicit_non_claims ?? [
            "not raw restoration",
            "not truth",
            "not canon",
            "not promotion",
        ],

        // Posture
        derived_vs_durable: "derived · Tier 0 · re-presenting prior prepared request support",
        allowed_use: "bounded support replay for prepared-request inspection only · not fulfillment · not canon · not promotion",
        replay_posture: "request-support replay · lens-bound · Tier 0 · non-authoritative",
        request_not_fulfilled: true,  // explicit: this replay does NOT fulfill the request

        notes,
    };
}

// ─── Summary line for replay log ─────────────────────────────────────────────
export function replaySummaryLine(req) {
    if (!req) return "—";
    const ts = req.requested_at?.slice(11, 19) ?? "??:??:??";
    const type = req.replay_type === "runtime_reconstruction" ? "RT-RECON"
        : req.replay_type === "request_support_replay" ? "RQ-SUPP"
            : req.replay_type ?? "REPLAY";
    const ref = req.replay_target_ref?.slice(0, 30) ?? "—";
    const st = req.request_status ?? "—";
    return `${ts} · ${type} · ${st} · target: ${ref}`;
}

// ─── Download replay request as JSON ─────────────────────────────────────────
export function downloadReplayJson(req) {
    const blob = new Blob([JSON.stringify(req, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${req.replay_request_id ?? "replay"}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
