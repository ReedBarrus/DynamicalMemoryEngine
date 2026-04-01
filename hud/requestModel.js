// hud/requestModel.js
//
// Bounded Request Object Model
//
// Constitutional posture:
//   - Request objects are preparation, not promotion.
//   - A prepared request is not a canon claim, not a trusted memory object,
//     not a promotion decision, and not an automatic activation.
//   - Request statuses are distinct from canon statuses (see C1_StatusLifecycle).
//   - These helpers produce bounded, inspectable, lineage-preserving request
//     objects that remain below canon until later review resolves them.
//   - No C1 is minted here. No consensus is invoked.
//
// Request statuses (distinct from canon statuses):
//   drafted   — being built, not yet submitted
//   prepared  — complete and ready for external handling
//   emitted   — handed off (logged, copied, or exported)
//   deferred  — held pending more evidence or scope clarity
//   failed    — could not be prepared due to missing required context
//
// Request types:
//   consultation       — request to compare current context against a reference posture
//   activation_review  — request for bounded review/activation consideration

"use strict";

// ─── ID generation ────────────────────────────────────────────────────────────
function makeRequestId(type) {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 7);
    const pfx = type === "consultation" ? "CREQ" : "AREQ";
    return `${pfx}-${ts}-${rand}`;
}

// ─── Extract lineage from workbench + runResult ───────────────────────────────
// Pulls available fields from the current run without inventing values.
// Returns null for unavailable fields rather than guessing.
function extractLineage(workbench, runResult) {
    if (!workbench && !runResult) return {};
    const scope = workbench?.scope ?? {};
    const dossier = workbench?.canon_candidate?.dossier ?? {};
    const readiness = workbench?.promotion_readiness?.report ?? {};
    const a1 = runResult?.artifacts?.a1 ?? workbench?.runtime?.artifacts?.a1 ?? {};
    const runtime = workbench?.runtime ?? {};

    return {
        run_label: runResult?.run_label ?? null,
        stream_id: scope?.stream_id ?? a1?.stream_id ?? null,
        source_id: a1?.source_id ?? null,
        segment_count: (scope?.segment_ids ?? []).length || null,
        cross_run_available: scope?.cross_run_context?.available ?? false,
        cross_run_count: scope?.cross_run_context?.run_count ?? null,
        anomaly_count: (runtime?.artifacts?.anomaly_reports ?? []).length,
        overall_readiness: readiness?.readiness_summary?.overall_readiness ?? null,
        candidate_claim_type: dossier?.candidate_claim?.claim_type ?? null,
        consensus_result: workbench?.consensus_review?.review?.result ?? null,
    };
}

// ─── Derive support basis from workbench evidence ────────────────────────────
function deriveSupportBasis(workbench, runResult) {
    const basis = [];
    const runtime = workbench?.runtime ?? {};
    if ((runtime?.artifacts?.h1s?.length ?? 0) > 0) basis.push("harmonic_state_evidence");
    if ((runtime?.artifacts?.m1s?.length ?? 0) > 0) basis.push("merged_state_evidence");
    if (runtime?.artifacts?.q) basis.push("query_result_evidence");
    if ((runtime?.artifacts?.anomaly_reports ?? []).length > 0) basis.push("anomaly_event_evidence");
    if (workbench?.scope?.cross_run_context?.available) basis.push("cross_run_evidence");
    if (basis.length === 0) basis.push("single_run_structural_evidence");
    return basis;
}

// ─── Consultation request builder ─────────────────────────────────────────────
//
// A consultation request asks: can the current run context be compared against
// a reference/use under declared scope?
//
// It does NOT ask to promote anything. It asks for a bounded comparison.
//
export function buildConsultationRequest({
    workbench,
    runResult,
    sourceFamilyLabel = "unspecified",
    declaredLens = "medium FFT/Hann (N=256, hop=128, Fs=2400Hz)",
    requestedUse = "bounded review-anchor consultation under same declared lens",
    notes = "",
} = {}) {
    const id = makeRequestId("consultation");
    const lineage = extractLineage(workbench, runResult);
    const support = deriveSupportBasis(workbench, runResult);

    return {
        request_id: id,
        request_type: "consultation",
        request_status: "prepared",
        created_at: new Date().toISOString(),

        // What is being requested
        requested_use: requestedUse,
        consultation_posture: "comparison_request_only · not truth · not promotion",

        // Lineage from current run
        source_family_label: sourceFamilyLabel,
        run_label: lineage.run_label,
        stream_id: lineage.stream_id,
        source_id: lineage.source_id,
        segment_count: lineage.segment_count,
        cross_run_available: lineage.cross_run_available,

        // Declared lens
        declared_lens: declaredLens,

        // Evidence
        support_basis: support,
        anomaly_count: lineage.anomaly_count,
        overall_readiness: lineage.overall_readiness,

        // Scope / non-claims
        claim_scope: "current run context only · same declared lens · single family",
        explicit_non_claims: [
            "not canon",
            "not truth",
            "not prediction",
            "not cross-family generalization",
            "not event truth",
            "not a promotion decision",
        ],

        // Posture
        derived_vs_durable: "derived · not durable until explicit review resolves this request",
        recommended_interim: "keep below canon until review evaluates this request",

        notes,
    };
}

// ─── Activation / review request builder ─────────────────────────────────────
//
// An activation/review request asks: is there a bounded claim worth reviewing
// for potential promotion consideration?
//
// This is packet-adjacent but is explicitly a request, not a promotion.
// It preserves the bounded-claim posture from the candidate-packet spec.
//
export function buildActivationReviewRequest({
    workbench,
    runResult,
    sourceFamilyLabel = "unspecified",
    declaredLens = "medium FFT/Hann (N=256, hop=128, Fs=2400Hz)",
    proposedBoundedClaim = "",
    claimScope = "current run · same declared lens · single family",
    allowedUse = "",
    notes = "",
} = {}) {
    const id = makeRequestId("activation_review");
    const lineage = extractLineage(workbench, runResult);
    const support = deriveSupportBasis(workbench, runResult);

    // Derive a default claim from workbench if none provided
    const claimType = lineage.candidate_claim_type ?? "bounded_structural_claim";
    const defaultClaim = proposedBoundedClaim ||
        (lineage.stream_id
            ? `Under the declared ${declaredLens} lens and within the current ${sourceFamilyLabel} context, the current run provides bounded structural evidence for review under use: ${allowedUse || "same-family comparison"}.`
            : "No run result available — claim cannot be derived.");

    return {
        request_id: id,
        request_type: "activation_review",
        request_status: "prepared",
        created_at: new Date().toISOString(),

        // Claim
        claim_type: claimType,
        proposed_bounded_claim: defaultClaim,
        claim_scope: claimScope,

        // Allowed use / non-claims (bounded-claim posture)
        allowed_use: allowedUse || "bounded review consideration only",
        explicit_non_claims: [
            "not canon",
            "not truth",
            "not prediction authority",
            "not ontology inference",
            "not event truth",
            "not cross-family generalization",
            "not automatic promotion",
        ],

        // Lineage from current run
        source_family_label: sourceFamilyLabel,
        run_label: lineage.run_label,
        stream_id: lineage.stream_id,
        source_id: lineage.source_id,
        segment_count: lineage.segment_count,
        cross_run_available: lineage.cross_run_available,
        cross_run_count: lineage.cross_run_count,

        // Declared lens
        declared_lens: declaredLens,

        // Evidence / support basis
        support_basis: support,
        anomaly_count: lineage.anomaly_count,
        overall_readiness: lineage.overall_readiness,
        consensus_result: lineage.consensus_result,

        // Governability
        blast_radius: "local · single family · single run · low if scope preserved",
        contestability_note: "this request may be challenged if later same-family evidence breaks the declared claim scope",
        recommended_interim: "keep below canon until explicit review resolves this request",

        // Posture
        derived_vs_durable: "derived · not durable until review decision",
        request_posture: "explicit request for review consideration only · not automatic activation",

        notes,
    };
}

// ─── Export helpers ───────────────────────────────────────────────────────────

// Produce a compact summary string for display in the request log.
export function requestSummaryLine(req) {
    const ts = req.created_at?.slice(11, 19) ?? "??:??:??";
    const type = req.request_type === "consultation" ? "CONSULT" : "ACT-REV";
    const use = req.request_type === "consultation"
        ? (req.requested_use?.slice(0, 40) ?? "—")
        : (req.proposed_bounded_claim?.slice(0, 40) ?? "—");
    return `${ts} · ${type} · ${req.request_status} · ${use}…`;
}

// Download request object as JSON (browser only).
export function downloadRequestJson(req) {
    const blob = new Blob([JSON.stringify(req, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${req.request_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
