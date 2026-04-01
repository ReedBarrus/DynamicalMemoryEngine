// runtime/reconstruction/ProvenanceReconstructionPipeline.js
//
// Provenance Reconstruction Pipeline — support-trace class, Tier 0 only
//
// Constitutional posture:
//   - Replay is lens-bound support, not truth restoration.
//   - This pipeline produces support-trace reconstruction only.
//   - It does NOT re-run DoorOneOrchestrator or any Door One operator.
//   - It does NOT restore raw source signal.
//   - It does NOT infer missing evidence.
//   - It does NOT widen beyond replayRequest.retained_tier_used.
//   - It does NOT invent higher-tier replay support.
//   - It does NOT call ConsensusOp.
//   - It does NOT mint C1.
//   - Failure is explicit and local — no fake results.
//
// Reconstruction class: support-trace reconstruction
//   (README.DeterministicInvarianceThreshold.md §9.1)
//   Reconstructs support lineage from retained evidence and declared lens/tier context.
//   Does not imply raw source restoration or full operator reversal.
//
// Fractal-local principle:
//   Reconstruction obeys the same local deterministic principle the original
//   runtime obeyed, within the declared lens and retained-tier boundary.
//   (README.DeterministicInvarianceThreshold.md §4)
//
// Retained tier in v0: Tier 0 (live working state) only.
//   Higher tiers (1–4) are declared-posture-aware but not yet materially
//   wired for reconstruction. Tier insufficiency is emitted explicitly.
//
// Seam rule: no hud/ imports. Declared lens / tier fields pass through
//   replayRequest.declared_lens and replayRequest.retained_tier_used.
//
// References:
//   README.DeterministicInvarianceThreshold.md
//   README.DeclaredVsMechanizedAudit.md
//   README.ReconstructionReplaySurface.md
//   README_ContinuousIngestRetentionLadder.md
//   README_DoorOneRuntimeBoundary.md

"use strict";

// ─── Trace step taxonomy ──────────────────────────────────────────────────────
const STEP = {
    REPLAY_REQUEST_RECEIVED:     "replay_request_received",
    TARGET_RESOLVED:             "target_resolved",
    LENS_DECLARED:               "lens_declared",
    RETAINED_TIER_DECLARED:      "retained_tier_declared",
    LINEAGE_BOUND:               "lineage_bound",
    RUNTIME_SUPPORT_COLLECTED:   "runtime_support_collected",
    INTERPRETIVE_SUPPORT_COLLECTED: "interpretive_support_collected",
    SCALE_LATENCY_DECLARED:      "scale_latency_declared",
    REQUEST_CONTEXT_BOUND:       "request_context_bound",
    REQUEST_CONTEXT_ABSENT:      "request_context_absent",
    RECONSTRUCTION_COMPLETED:    "reconstruction_completed",
    RECONSTRUCTION_FAILED:       "reconstruction_failed",
};

// ─── Downgrade vocabulary (§11 DeterministicInvarianceThreshold) ─────────────
const DOWNGRADE = {
    NARROWED_SCOPE:                    "narrowed_scope",
    UNRESOLVED:                        "unresolved",
    SUPPORT_DEGRADED:                  "support_degraded",
    RETAINED_TIER_INSUFFICIENT:        "retained_tier_insufficient",
    RECONSTRUCTION_NOT_JUSTIFIED:      "reconstruction_not_justified",
    NEW_IDENTITY_REQUIRED:             "new_identity_required",
};

// ─── Non-authority notes (always included) ───────────────────────────────────
const NON_CLAIMS = [
    "not raw restoration",
    "not truth",
    "not canon",
    "not promotion",
    "not ontology",
    "not equivalent to original source signal",
    "not operator reversal",
    "not receipt-backed in v0",
    "not source-adjacent reconstitution",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTraceStep({
    stepIndex,
    stepType,
    status = "ok",       // ok | warning | failed
    label,
    detail,
    evidenceRef = null,
    retainedTier = "Tier 0 — live working state",
    lensBound = true,
    nonAuthorityNote = "lens-bound support · Tier 0 · not authority",
}) {
    return {
        step_index:        stepIndex,
        step_type:         stepType,
        status,
        label,
        detail,
        evidence_ref:      evidenceRef,
        retained_tier:     retainedTier,
        lens_bound:        lensBound,
        non_authority_note: nonAuthorityNote,
    };
}

function failReplay(replayRequest, trace, reason) {
    const rrid = replayRequest?.replay_request_id ?? null;
    trace.push(makeTraceStep({
        stepIndex: trace.length,
        stepType:  STEP.RECONSTRUCTION_FAILED,
        status:    "failed",
        label:     "reconstruction failed",
        detail:    reason,
        lensBound: false,
        nonAuthorityNote: "explicit failure · no invented support",
    }));
    return {
        ok:                     false,
        reconstruction_type:    replayRequest?.replay_type ?? "unknown",
        reconstruction_status:  "failed",
        replay_request_id:      rrid,
        target:                 null,
        declared_lens:          replayRequest?.declared_lens ?? null,
        retained_tier_used:     replayRequest?.retained_tier_used ?? null,
        support_basis:          [],
        explicit_non_claims:    NON_CLAIMS,
        derived_vs_durable:     "failed · no support derived",
        latency_posture:        null,
        fidelity_posture:       null,
        threshold_posture:      evaluateThresholdPosture({ failed: true }),
        reconstruction_trace:   trace,
        reconstruction_summary: { step_count: trace.length, evidence_refs: 0, failure_reason: reason },
        notes:                  null,
        failure_reason:         reason,
    };
}

function extractReplayTarget(replayRequest) {
    if (!replayRequest) return null;
    return {
        type:    replayRequest.replay_target_type ?? "unknown",
        ref:     replayRequest.replay_target_ref  ?? null,
        family:  replayRequest.source_family      ?? "unspecified",
        run:     replayRequest.run_label          ?? null,
        stream:  replayRequest.stream_id          ?? null,
        source:  replayRequest.source_id          ?? null,
    };
}

function collectRuntimeSupport(runResult, workbench) {
    if (!runResult?.ok) return { available: false, refs: [], counts: {} };
    const arts = runResult.artifacts ?? {};
    const runtimeRefs = [];
    const contextualRefs = [];
    const counts = {};

    if (arts.a1) counts.a1 = 1, runtimeRefs.push("a1_ingest_artifact");
    if (Array.isArray(arts.h1s) && arts.h1s.length) counts.h1s = arts.h1s.length, runtimeRefs.push("h1s_harmonic_states");
    if (Array.isArray(arts.m1s) && arts.m1s.length) counts.m1s = arts.m1s.length, runtimeRefs.push("m1s_merged_states");
    if (Array.isArray(arts.anomaly_reports) && arts.anomaly_reports.length) {
        counts.anomaly_reports = arts.anomaly_reports.length;
        runtimeRefs.push("anomaly_reports");
    }
    if (arts.q) counts.q = 1, runtimeRefs.push("q_query_result");

    if (workbench?.scope) contextualRefs.push("workbench_scope");
    if (workbench?.runtime) contextualRefs.push("workbench_runtime");

    return {
        available: runtimeRefs.length > 0,
        refs: [...runtimeRefs, ...contextualRefs],
        runtime_refs: runtimeRefs,
        contextual_refs: contextualRefs,
        counts,
    };
}

function collectInterpretiveSupport(workbench) {
    if (!workbench) return { available: false, refs: [] };
    const refs = [];
    if (workbench.promotion_readiness?.report) refs.push("promotion_readiness_report");
    if (workbench.canon_candidate?.dossier)    refs.push("canon_candidate_dossier");
    if (workbench.consensus_review?.review)    refs.push("consensus_review");
    if (workbench.interpretation)              refs.push("workbench_interpretation");
    return { available: refs.length > 0, refs };
}

function evaluateThresholdPosture({
    failed          = false,
    hasRunResult    = false,
    hasWorkbench    = false,
    tierUsed        = 0,
    hasRuntimeSupport = false,
    hasInterpSupport  = false,
    isRequestReplay   = false,
    targetRequestPresent = false,
} = {}) {
    if (failed) {
        return {
            local_invariance:          "unknown",
            compression_survival:      "unknown",
            distortion_posture:        "fail",
            retained_tier_sufficiency: "fail",
            query_equivalence:         "not_applicable",
            downgrade_output:          DOWNGRADE.RECONSTRUCTION_NOT_JUSTIFIED,
            notes: "reconstruction failed — threshold evaluation could not be completed",
        };
    }

    const localInvariance = (hasRunResult && hasWorkbench && hasRuntimeSupport)
        ? "pass" : "unknown";

    const compressionSurvival = hasRuntimeSupport ? "pass" : "unknown";
    const distortionPosture = (hasRunResult && hasRuntimeSupport) ? "pass" : "warning";
    const tierSufficiency = (tierUsed <= 0) ? "pass" : "fail";
    const queryEquivalence = "not_applicable";

    let downgradeOutput = null;
    if (isRequestReplay && !targetRequestPresent) {
        downgradeOutput = DOWNGRADE.SUPPORT_DEGRADED;
    } else if (tierUsed > 0) {
        downgradeOutput = DOWNGRADE.RETAINED_TIER_INSUFFICIENT;
    } else if (!hasRunResult || !hasRuntimeSupport) {
        downgradeOutput = DOWNGRADE.RETAINED_TIER_INSUFFICIENT;
    }

    return {
        local_invariance:          localInvariance,
        compression_survival:      compressionSurvival,
        distortion_posture:        distortionPosture,
        retained_tier_sufficiency: tierSufficiency,
        query_equivalence:         queryEquivalence,
        downgrade_output:          downgradeOutput,
        notes: tierUsed > 0
            ? `Tier ${tierUsed} replay not yet wired in v0; declared-only posture`
            : "Tier 0 live working state — session-scoped only",
    };
}

function declareScaleLatencyFidelity(runtimeSupport) {
    if (!runtimeSupport.available) {
        return {
            latency_posture: "not_applicable — no runtime support",
            fidelity_posture: "Tier 0 declared · no runtime evidence available · fidelity unknown",
        };
    }
    const stateCount = (runtimeSupport.counts.h1s ?? 0) + (runtimeSupport.counts.m1s ?? 0);
    return {
        latency_posture:
            "Tier 0 live working state · session-scoped · no durable lineage · " +
            "reconstruction available only while session remains active",
        fidelity_posture:
            `support-trace class · ${stateCount} harmonic/merged state${stateCount !== 1 ? "s" : ""} referenced · ` +
            "lens-bound · not raw restoration · not source equivalence",
    };
}

// ─── Main reconstruction function ────────────────────────────────────────────

/**
 * Reconstruct from a prepared replay request.
 *
 * @param {Object} replayRequest - A prepared replayModel.js request object
 * @param {Object|null} runResult - The orchestrator run result (artifacts, etc.)
 * @param {Object|null} workbench - The assembled workbench output
 * @returns {Object} Reconstruction result (see output shape in header)
 */
export function reconstructFromReplayRequest({
    replayRequest  = null,
    runResult      = null,
    workbench      = null,
} = {}) {
    const trace = [];

    // ── Step 0: Guard — replay request must be present ────────────────────────
    if (!replayRequest || typeof replayRequest !== "object") {
        return failReplay(null, trace, "replayRequest is null or not an object");
    }
    if (replayRequest.request_status === "failed") {
        return failReplay(replayRequest, trace,
            `replayRequest has status 'failed': ${replayRequest.failure_reason ?? "no reason recorded"}`);
    }

    trace.push(makeTraceStep({
        stepIndex: 0,
        stepType:  STEP.REPLAY_REQUEST_RECEIVED,
        status:    "ok",
        label:     "replay request received",
        detail:    `id=${replayRequest.replay_request_id} type=${replayRequest.replay_type} status=${replayRequest.request_status}`,
        evidenceRef: replayRequest.replay_request_id,
    }));

    // ── Step 1: Resolve replay target ─────────────────────────────────────────
    const target = extractReplayTarget(replayRequest);
    if (!target || !target.type || target.type === "unknown") {
        return failReplay(replayRequest, trace, "replay target type cannot be resolved from replayRequest");
    }

    trace.push(makeTraceStep({
        stepIndex: 1,
        stepType:  STEP.TARGET_RESOLVED,
        status:    "ok",
        label:     "target resolved",
        detail:    `type=${target.type} ref=${target.ref ?? "—"} family=${target.family} run=${target.run ?? "—"}`,
        evidenceRef: target.ref,
    }));

    // ── Step 2: Declare lens ──────────────────────────────────────────────────
    const lens = replayRequest.declared_lens ?? null;
    const lensStr = lens
        ? `${lens.transform_family ?? "?"} · N=${lens.window_N ?? "?"} · hop=${lens.hop_N ?? "?"} · Fs=${lens.Fs_target ?? "?"}`
        : "no declared lens";

    trace.push(makeTraceStep({
        stepIndex: 2,
        stepType:  STEP.LENS_DECLARED,
        status:    lens ? "ok" : "warning",
        label:     "lens declared",
        detail:    lensStr,
        nonAuthorityNote: "declared lens only · not re-run · not computed from raw source",
    }));

    // ── Step 3: Declare retained tier ─────────────────────────────────────────
    const tier    = replayRequest.retained_tier_used ?? null;
    const tierNum = tier?.tier_used ?? 0;
    const tierStr = tier?.tier_label ?? "Tier 0 — live working state (default)";

    trace.push(makeTraceStep({
        stepIndex: 3,
        stepType:  STEP.RETAINED_TIER_DECLARED,
        status:    tierNum <= 0 ? "ok" : "warning",
        label:     "retained tier declared",
        detail:    `${tierStr} · honest_posture=${tier?.honest_posture ?? "Tier 0 only"}`,
        retainedTier: tierStr,
        nonAuthorityNote:
            tierNum > 0
                ? `Tier ${tierNum} declared but not materially wired in v0 — downgrade applies`
                : "Tier 0 live working state · session-scoped · not durable",
    }));

    // ── Step 4: Bind lineage ──────────────────────────────────────────────────
    const hasLineage = !!(target.stream || target.run || target.source);

    trace.push(makeTraceStep({
        stepIndex: 4,
        stepType:  STEP.LINEAGE_BOUND,
        status:    hasLineage ? "ok" : "warning",
        label:     "lineage bound",
        detail:    `stream=${target.stream ?? "—"} run=${target.run ?? "—"} source=${target.source ?? "—"}`,
        evidenceRef: target.stream ?? target.run,
        nonAuthorityNote: "lineage from replayRequest fields · not re-derived from raw artifacts",
    }));

    // ── Step 5: Collect runtime support ───────────────────────────────────────
    const runtimeSupport = collectRuntimeSupport(runResult, workbench);

    // For runtime_reconstruction replay, runResult is required
    const isRtReplay = replayRequest.replay_type === "runtime_reconstruction";
    const isRqReplay = replayRequest.replay_type === "request_support_replay";

    if (isRtReplay && !runtimeSupport.available) {
        return failReplay(replayRequest, trace,
            "runtime_reconstruction replay requires runResult with meaningful runtime support · no sufficient runtime artifacts available");
    }

    trace.push(makeTraceStep({
        stepIndex: 5,
        stepType:  STEP.RUNTIME_SUPPORT_COLLECTED,
        status:    runtimeSupport.available ? "ok" : "warning",
        label:     "runtime support collected",
        detail:    runtimeSupport.available
            ? `runtime_refs=[${runtimeSupport.runtime_refs.join(", ")}] context_refs=[${runtimeSupport.contextual_refs.join(", ")}] counts=${JSON.stringify(runtimeSupport.counts)}`
            : "no meaningful runtime support available — operating from declared posture only",
        evidenceRef: runtimeSupport.runtime_refs[0] ?? runtimeSupport.contextual_refs[0] ?? null,
        nonAuthorityNote:
            "runtime artifacts referenced by type only · not reconstructed from source · not operator-rerun",
    }));

    // ── Step 6: Collect interpretive support ──────────────────────────────────
    const interpSupport = collectInterpretiveSupport(workbench);

    trace.push(makeTraceStep({
        stepIndex: 6,
        stepType:  STEP.INTERPRETIVE_SUPPORT_COLLECTED,
        status:    interpSupport.available ? "ok" : "warning",
        label:     "interpretive support collected",
        detail:    interpSupport.available
            ? `refs=[${interpSupport.refs.join(", ")}]`
            : "no interpretive support available",
        evidenceRef: interpSupport.refs[0] ?? null,
        nonAuthorityNote: "workbench-native interpretation · read-side only · not canon",
    }));

    // ── Step 7: Declare scale / latency / fidelity ────────────────────────────
    const { latency_posture, fidelity_posture } = declareScaleLatencyFidelity(runtimeSupport);

    trace.push(makeTraceStep({
        stepIndex: 7,
        stepType:  STEP.SCALE_LATENCY_DECLARED,
        status:    "ok",
        label:     "scale / latency / fidelity declared",
        detail:    `latency: ${latency_posture.slice(0, 80)} | fidelity: ${fidelity_posture.slice(0, 80)}`,
        nonAuthorityNote: "fidelity declared not measured · tier-honest support posture only",
    }));

    // ── Step 8: Request context ───────────────────────────────────────────────
    // For request_support_replay, bind the target request context if present
    let requestContextStep;
    if (isRqReplay) {
        const hasTargetRequestRef = !!(replayRequest.replay_target_ref && replayRequest.target_request_type);
        requestContextStep = makeTraceStep({
            stepIndex: 8,
            stepType:  hasTargetRequestRef ? STEP.REQUEST_CONTEXT_BOUND : STEP.REQUEST_CONTEXT_ABSENT,
            status:    hasTargetRequestRef ? "ok" : "warning",
            label:     hasTargetRequestRef ? "request context bound" : "request context absent",
            detail:    hasTargetRequestRef
                ? `target_ref=${replayRequest.replay_target_ref} target_type=${replayRequest.target_request_type}`
                : "no target request reference found in replayRequest — using available runtime context only",
            evidenceRef: replayRequest.replay_target_ref,
            nonAuthorityNote: "request-support replay · original request NOT fulfilled · replay ≠ fulfillment",
        });
    } else {
        requestContextStep = makeTraceStep({
            stepIndex: 8,
            stepType:  STEP.REQUEST_CONTEXT_BOUND,
            status:    "ok",
            label:     "runtime reconstruction context bound",
            detail:    "replay_target_type=current_run_workbench · no external request context required",
        });
    }
    trace.push(requestContextStep);

    // ── Step 9: Complete reconstruction ───────────────────────────────────────
    const allRefs = [...runtimeSupport.refs, ...interpSupport.refs];

    trace.push(makeTraceStep({
        stepIndex: 9,
        stepType:  STEP.RECONSTRUCTION_COMPLETED,
        status:    "ok",
        label:     "reconstruction completed",
        detail:    `support-trace class · ${allRefs.length} evidence ref${allRefs.length !== 1 ? "s" : ""} · ` +
                   `${trace.length} trace step${trace.length !== 1 ? "s" : ""} · ${tierStr}`,
        evidenceRef: allRefs[0] ?? null,
        retainedTier: tierStr,
        nonAuthorityNote:
            "support-trace reconstruction complete · tier-honest · not raw restoration · not promotion · not truth",
    }));

    // ── Threshold posture evaluation ──────────────────────────────────────────
    const threshold_posture = evaluateThresholdPosture({
        failed:               false,
        hasRunResult:         !!(runResult?.ok),
        hasWorkbench:         !!workbench,
        tierUsed:             tierNum,
        hasRuntimeSupport:    runtimeSupport.available,
        hasInterpSupport:     interpSupport.available,
        isRequestReplay:      isRqReplay,
        targetRequestPresent: isRqReplay
            ? !!(replayRequest.replay_target_ref)
            : true,
    });

    // ── Assemble support basis ────────────────────────────────────────────────
    const support_basis = [
        ...(replayRequest.support_basis ?? []),
        ...runtimeSupport.refs,
        ...interpSupport.refs,
    ].filter((v, i, a) => a.indexOf(v) === i);  // dedupe

    // ── Reconstruction summary ─────────────────────────────────────────────────
    const reconstruction_summary = {
        reconstruction_class:  "support_trace",
        replay_type:           replayRequest.replay_type,
        step_count:            trace.length,
        evidence_refs:         allRefs.length,
        support_basis_count:   support_basis.length,
        runtime_available:     runtimeSupport.available,
        interpretive_available:interpSupport.available,
        tier_used:             tierNum,
        tier_label:            tierStr,
        lens_declared:         !!lens,
        lineage_bound:         hasLineage,
        threshold_outcome:     threshold_posture.local_invariance,
        downgrade_output:      threshold_posture.downgrade_output,
        non_authority_note:    `support-trace only · ${tierStr} · lens-bound · not raw restoration · not canon`,
    };

    return {
        ok:                     true,
        reconstruction_type:    "support_trace",
        reconstruction_status:  "completed",
        replay_request_id:      replayRequest.replay_request_id,
        target,
        declared_lens:          lens,
        retained_tier_used:     tier,
        support_basis,
        explicit_non_claims:    [
            ...(replayRequest.explicit_non_claims ?? []),
            ...NON_CLAIMS.filter(c => !(replayRequest.explicit_non_claims ?? []).includes(c)),
        ],
        derived_vs_durable:     replayRequest.derived_vs_durable
            ?? "derived · Tier 0 live working state · not durable",
        latency_posture,
        fidelity_posture,
        threshold_posture,
        reconstruction_trace:   trace,
        reconstruction_summary,
        notes:                  replayRequest.notes ?? null,
        failure_reason:         null,
    };
}
