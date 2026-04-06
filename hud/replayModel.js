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

import { reconstructFromReplayRequest } from "../runtime/reconstruction/ProvenanceReconstructionPipeline.js";
import { readReadinessReport, readCanonCandidateDossier } from "./workbenchLayerReaders.js";

function makeReplayId(type) {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 7);
    const pfx = type === "runtime_reconstruction" ? "RPLY-RT" : "RPLY-RQ";
    return `${pfx}-${ts}-${rand}`;
}

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

function tierExplicitNonClaims(tierUsed = 0) {
    const base = [
        "not raw restoration",
        "not truth",
        "not canon",
        "not promotion",
        "not ontology",
        "not equivalent to original source artifact",
    ];

    if (tierUsed === 0) {
        base.push("not receipt-backed in Tier 0");
    }
    if (tierUsed === 1) {
        base.push("receipt-backed lineage is not source-equivalent replay");
    }
    return base;
}

function normalizeReceiptSupport(receiptSupport = null) {
    if (!receiptSupport) return null;
    const receiptRefs = Array.isArray(receiptSupport.receipt_refs)
        ? receiptSupport.receipt_refs.filter(Boolean)
        : [];
    const receiptLineage = Array.isArray(receiptSupport.receipt_lineage)
        ? receiptSupport.receipt_lineage.filter(Boolean)
        : [];

    return {
        receipt_refs: receiptRefs,
        receipt_lineage: receiptLineage,
        receipt_count: Number(receiptSupport.receipt_count ?? receiptRefs.length + receiptLineage.length),
        provenance_complete: receiptSupport.provenance_complete === true,
        replayable_support_present: receiptSupport.replayable_support_present === true,
        lineage_summary: receiptSupport.lineage_summary ?? null,
    };
}

function deriveReplaySupport(workbench, runResult) {
    if (!workbench && !runResult) return ["no_active_run"];
    const runtimeArtifacts = workbench?.runtime?.artifacts ?? runResult?.artifacts ?? {};
    const scope = workbench?.scope ?? {};
    const basis = [];

    if ((runtimeArtifacts?.h1s?.length ?? 0) > 0) basis.push("harmonic_state_evidence");
    if ((runtimeArtifacts?.m1s?.length ?? 0) > 0) basis.push("merged_state_evidence");
    if (runtimeArtifacts?.q) basis.push("query_result_evidence");
    if ((runtimeArtifacts?.anomaly_reports ?? []).length > 0) basis.push("anomaly_event_evidence");
    if (scope?.cross_run_context?.available) basis.push("cross_run_evidence");
    if (basis.length === 0) basis.push("single_run_structural_evidence_only");
    return basis;
}

function attachReconstruction(baseReplay, runResult, workbench) {
    const reconstruction = reconstructFromReplayRequest({
        replayRequest: baseReplay,
        runResult,
        workbench,
    });

    return {
        ...baseReplay,
        request_status: reconstruction.ok ? baseReplay.request_status : "failed",
        reconstruction_type: reconstruction.reconstruction_type,
        reconstruction_status: reconstruction.reconstruction_status,
        reconstruction_trace: reconstruction.reconstruction_trace,
        reconstruction_summary: reconstruction.reconstruction_summary,
        threshold_posture: reconstruction.threshold_posture,
        latency_posture: reconstruction.latency_posture,
        fidelity_posture: reconstruction.fidelity_posture,
        failure_reason: reconstruction.failure_reason,
        failure_posture: reconstruction.failure_posture,
        support_basis: reconstruction.support_basis?.length ? reconstruction.support_basis : baseReplay.support_basis,
        explicit_non_claims: reconstruction.explicit_non_claims?.length ? reconstruction.explicit_non_claims : baseReplay.explicit_non_claims,
        declared_lens: reconstruction.declared_lens ?? baseReplay.declared_lens,
        retained_tier_used: reconstruction.retained_tier_used ?? baseReplay.retained_tier_used,
        derived_vs_durable: reconstruction.derived_vs_durable ?? baseReplay.derived_vs_durable,
        replay_fidelity_record_v0: reconstruction.replay_fidelity_record_v0 ?? null,
        replay_posture: `${baseReplay.replay_posture} · support-trace only`,
    };
}

export function buildRuntimeReconstructionReplay({
    workbench,
    runResult,
    sourceFamilyLabel = "unspecified",
    notes = "",
    retainedTierOverride = null,
    receiptSupport = null,
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
    const read = readReadinessReport(workbench);
    const dos = readCanonCandidateDossier(workbench);
    const lens = declareLens(sourceFamilyLabel, runResult);
    const tier = retainedTierOverride ?? declareRetainedTier(runResult);
    const normalizedReceiptSupport = normalizeReceiptSupport(receiptSupport);
    const basis = deriveReplaySupport(workbench, runResult);
    if (normalizedReceiptSupport?.receipt_refs?.length || normalizedReceiptSupport?.receipt_lineage?.length) {
        basis.push("durable_receipt_lineage");
    }
    const a1 = runResult?.artifacts?.a1 ?? workbench?.runtime?.artifacts?.a1 ?? null;
    const tierUsed = Number(tier?.tier_used ?? 0);

    const baseReplay = {
        replay_request_id: id,
        replay_type: "runtime_reconstruction",
        request_status: "prepared",
        requested_at: new Date().toISOString(),
        replay_target_type: "current_run_workbench",
        replay_target_ref: runResult.run_label,
        source_family: sourceFamilyLabel,
        stream_id: scope?.stream_id ?? a1?.stream_id ?? null,
        source_id: a1?.source_id ?? null,
        run_label: runResult.run_label,
        segment_count: (scope?.segment_ids ?? []).length,
        cross_run_available: scope?.cross_run_context?.available ?? false,
        cross_run_count: scope?.cross_run_context?.run_count ?? null,
        declared_lens: lens,
        retained_tier_used: tier,
        receipt_support: normalizedReceiptSupport,
        support_basis: basis,
        anomaly_count: (workbench?.runtime?.artifacts?.anomaly_reports ?? []).length,
        overall_readiness: read?.readiness_summary?.overall_readiness ?? null,
        candidate_claim_type: dos?.candidate_claim?.claim_type ?? null,
        derived_vs_durable: tierUsed === 1
            ? "mixed · Tier 1 durable receipt lineage · replay support remains receipt-bounded"
            : "derived · Tier 0 live working state · not durable beyond current session",
        allowed_use: "bounded read-side replay inspection only · not promotion · not truth",
        explicit_non_claims: tierExplicitNonClaims(tierUsed),
        replay_posture: tierUsed === 1
            ? "lens-bound support · receipt-backed lineage · Tier 1 · non-authoritative"
            : "lens-bound support · runtime-derived · Tier 0 · non-authoritative",
        notes,
    };

    return attachReconstruction(baseReplay, runResult, workbench);
}

export function buildRequestSupportReplay({
    targetRequest,
    workbench,
    runResult,
    sourceFamilyLabel = "unspecified",
    notes = "",
    retainedTierOverride = null,
    receiptSupport = null,
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
    const tier = retainedTierOverride ?? declareRetainedTier(runResult);
    const normalizedReceiptSupport = normalizeReceiptSupport(
        receiptSupport ?? targetRequest.receipt_support ?? null
    );
    const basis = targetRequest.support_basis ?? deriveReplaySupport(workbench, runResult);
    if (normalizedReceiptSupport?.receipt_refs?.length || normalizedReceiptSupport?.receipt_lineage?.length) {
        basis.push("durable_receipt_lineage");
    }
    const tierUsed = Number(tier?.tier_used ?? 0);

    const baseReplay = {
        replay_request_id: id,
        replay_type: "request_support_replay",
        request_status: "prepared",
        requested_at: new Date().toISOString(),
        replay_target_type: "prepared_request",
        replay_target_ref: targetRequest.request_id,
        target_request_type: targetRequest.request_type,
        source_family: targetRequest.source_family_label ?? sourceFamilyLabel,
        stream_id: targetRequest.stream_id,
        source_id: targetRequest.source_id,
        run_label: targetRequest.run_label,
        segment_count: targetRequest.segment_count ?? null,
        cross_run_available: targetRequest.cross_run_available ?? false,
        cross_run_count: targetRequest.cross_run_count ?? null,
        declared_lens: lens,
        retained_tier_used: tier,
        receipt_support: normalizedReceiptSupport,
        support_basis: basis,
        anomaly_count: targetRequest.anomaly_count ?? 0,
        overall_readiness: targetRequest.overall_readiness ?? null,
        explicit_non_claims: targetRequest.explicit_non_claims ?? tierExplicitNonClaims(tierUsed),
        derived_vs_durable: tierUsed === 1
            ? "mixed · Tier 1 durable receipt lineage · re-presenting bounded request support"
            : "derived · Tier 0 · re-presenting prior prepared request support",
        allowed_use: "bounded support replay for prepared-request inspection only · not fulfillment · not canon · not promotion",
        replay_posture: tierUsed === 1
            ? "request-support replay · lens-bound · Tier 1 receipt lineage · non-authoritative"
            : "request-support replay · lens-bound · Tier 0 · non-authoritative",
        request_not_fulfilled: true,
        notes,
    };

    return attachReconstruction(baseReplay, runResult, workbench);
}

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

export function downloadReplayJson(req) {
    const blob = new Blob([JSON.stringify(req, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${req.replay_request_id ?? "replay"}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
