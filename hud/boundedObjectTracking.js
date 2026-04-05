"use strict";

import { deriveOperatorThresholdPosture } from "./replayThresholdFidelityPosture.js";
import { deriveStructuralIdentityPosture } from "./structuralIdentityPosture.js";
import { deriveMemorySupportClassification } from "./memorySupportClassification.js";
import { deriveCompressionRemintingAccountability } from "./compressionRemintingAccountability.js";

function shortHandle(value, fallback = "none") {
    const text = typeof value === "string" ? value : "";
    if (!text) return fallback;
    return text.length <= 14 ? text : text.slice(-14);
}

function sourceRef(runResult = null, workbench = null) {
    return runResult?.artifacts?.a1
        ?? workbench?.runtime?.artifacts?.a1
        ?? null;
}

function supportBasisLabel(replay) {
    const basis = Array.isArray(replay?.replay_fidelity_record_v0?.support_basis ?? replay?.support_basis)
        ? (replay?.replay_fidelity_record_v0?.support_basis ?? replay?.support_basis).filter(Boolean)
        : [];
    return basis.length > 0 ? basis.join(", ") : "bounded support only";
}

function reconstructionClass(replay) {
    const raw = replay?.replay_fidelity_record_v0?.reconstruction_class
        ?? replay?.reconstruction_summary?.reconstruction_class
        ?? replay?.reconstruction_class
        ?? "support_trace_reconstruction";
    return raw === "support_trace" ? "support_trace_reconstruction" : raw;
}

function baseSourceBasis({ sourceFamilyLabel = "unspecified", runResult = null, workbench = null, replay = null }) {
    const a1 = sourceRef(runResult, workbench) ?? {
        source_id: replay?.source_id ?? null,
        stream_id: replay?.stream_id ?? null,
    };
    const parts = [
        sourceFamilyLabel,
        a1?.source_id ? `source ${a1.source_id}` : null,
        a1?.stream_id ? `stream ${shortHandle(a1.stream_id, a1.stream_id)}` : null,
        runResult?.run_label ? `run ${runResult.run_label}` : replay?.run_label ? `run ${replay.run_label}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" | ") : "no active source basis";
}

function defaultBoundary() {
    return "This handle is a bounded tracking aid only. It does not by itself prove full structural identity, cross-session continuity, or authority.";
}

export function deriveBoundedObjectTracking({
    objectKind = "source",
    hasActiveResult = false,
    sourceFamilyLabel = "unspecified",
    runResult = null,
    workbench = null,
    replay = null,
    activeRequest = null,
} = {}) {
    const a1 = sourceRef(runResult, workbench);
    const streamId = workbench?.scope?.stream_id ?? a1?.stream_id ?? null;
    const runLabel = runResult?.run_label ?? null;
    const sourceBasis = baseSourceBasis({ sourceFamilyLabel, runResult, workbench, replay });

    if (objectKind === "source") {
        return {
            objectHandle: a1?.source_id ? `SRC:${shortHandle(a1.source_id)}` : "SRC:awaiting_run",
            objectClass: "source_basis_object",
            sourceBasis,
            routeClass: "source selection -> lawful ingest",
            supportTier: hasActiveResult ? "active source basis" : "awaiting source",
            closureState: hasActiveResult ? "active source basis visible" : "awaiting active source run",
            neighboringObjects: "upstream none | downstream spectral_state",
            addressBoundary: defaultBoundary(),
        };
    }

    if (objectKind === "spectral_state") {
        const h1Count = Number(workbench?.runtime?.artifacts?.h1s?.length ?? 0) || 0;
        return {
            objectHandle: streamId ? `SPC:${shortHandle(streamId)}:${h1Count}H1` : "SPC:awaiting_run",
            objectClass: "spectral_state_object",
            sourceBasis,
            routeClass: "ingest -> clock align -> window -> transform -> compress",
            supportTier: hasActiveResult ? "Tier 0 live runtime structure" : "awaiting structural derivation",
            closureState: hasActiveResult ? "mechanized live derivation" : "awaiting active source run",
            neighboringObjects: "upstream source | downstream retained_signature",
            addressBoundary: defaultBoundary(),
        };
    }

    if (objectKind === "retained_signature") {
        const memoryClass = deriveMemorySupportClassification({ objectKind, hasActiveResult, workbench });
        const accountability = deriveCompressionRemintingAccountability({ objectKind, hasActiveResult, workbench });
        const m1Count = Number(workbench?.runtime?.artifacts?.m1s?.length ?? 0) || 0;
        return {
            objectHandle: streamId ? `RET:${shortHandle(streamId)}:${m1Count}M1` : "RET:awaiting_run",
            objectClass: "retained_signature_object",
            sourceBasis,
            routeClass: "merge_op -> post-merge compression",
            supportTier: hasActiveResult ? `live retained support | ${m1Count} M1 states` : "awaiting retained support",
            closureState: `${memoryClass.classLabel} | ${accountability.classLabel}`,
            neighboringObjects: "upstream spectral_state | downstream replay_reconstruction",
            addressBoundary: defaultBoundary(),
        };
    }

    if (objectKind === "interpretation_overlay") {
        return {
            objectHandle: runLabel ? `INT:${shortHandle(runLabel)}` : "INT:awaiting_run",
            objectClass: "interpretation_overlay_object",
            sourceBasis,
            routeClass: "trajectory / attention-memory read-side interpretation",
            supportTier: hasActiveResult ? "read-side overlay only" : "awaiting runtime evidence",
            closureState: hasActiveResult ? "interpretive overlay only" : "awaiting active run",
            neighboringObjects: "upstream replay_reconstruction | downstream review_gate",
            addressBoundary: defaultBoundary(),
        };
    }

    if (objectKind === "review_gate") {
        const memoryClass = deriveMemorySupportClassification({ objectKind, hasActiveResult, activeRequest });
        return {
            objectHandle: activeRequest?.request_id
                ? `REQ:${shortHandle(activeRequest.request_id)}`
                : runLabel
                    ? `RVW:${shortHandle(runLabel)}`
                    : "RVW:awaiting_run",
            objectClass: activeRequest ? "prepared_request_object" : "review_gate_object",
            sourceBasis,
            routeClass: activeRequest
                ? "prepared request routing from active shell context"
                : "candidate/readiness downstream routing",
            supportTier: activeRequest ? "downstream request support only" : "review-facing downstream only",
            closureState: `${activeRequest?.request_status ?? (hasActiveResult ? "candidate_only" : "awaiting_run")} | ${memoryClass.classLabel}`,
            neighboringObjects: "upstream interpretation_overlay | downstream none",
            addressBoundary: defaultBoundary(),
        };
    }

    if (!replay) {
        const prefix = objectKind === "reconstruction" ? "RECON" : "RPLY";
        return {
            objectHandle: `${prefix}:awaiting_request`,
            objectClass: objectKind === "reconstruction" ? "reconstruction_object" : "replay_object",
            sourceBasis,
            routeClass: objectKind === "reconstruction"
                ? "replay request -> reconstruction backend seam"
                : "explicit replay request under declared lens",
            supportTier: "awaiting replay object",
            closureState: "awaiting replay request",
            neighboringObjects: objectKind === "reconstruction"
                ? "upstream replay | downstream interpretation_overlay"
                : "upstream retained_signature | downstream reconstruction",
            addressBoundary: defaultBoundary(),
        };
    }

    const threshold = deriveOperatorThresholdPosture(replay);
    const identity = deriveStructuralIdentityPosture(replay, { objectKind });
    const memoryClass = deriveMemorySupportClassification({ objectKind, replay });
    const accountability = deriveCompressionRemintingAccountability({ objectKind, replay });
    const tier = replay?.replay_fidelity_record_v0?.retained_tier ?? replay?.retained_tier_used?.tier_label ?? "retained tier not declared";

    if (objectKind === "reconstruction") {
        return {
            objectHandle: replay?.replay_request_id
                ? `RECON:${shortHandle(replay.replay_request_id)}`
                : "RECON:prepared",
            objectClass: `${reconstructionClass(replay)} object`,
            sourceBasis,
            routeClass: `replay request -> ${reconstructionClass(replay)}`,
            supportTier: `${tier} | ${supportBasisLabel(replay)}`,
            closureState: `${identity.outcomeLabel} | ${memoryClass.classLabel} | ${accountability.classLabel} | ${threshold.classLabel}`,
            neighboringObjects: "upstream replay | downstream interpretation_overlay",
            addressBoundary: defaultBoundary(),
        };
    }

    return {
        objectHandle: replay?.replay_request_id
            ? `RPLY:${shortHandle(replay.replay_request_id)}`
            : "RPLY:prepared",
        objectClass: "replay_object",
        sourceBasis,
        routeClass: "explicit replay request under declared lens",
        supportTier: `${tier} | ${supportBasisLabel(replay)}`,
        closureState: `${identity.outcomeLabel} | ${memoryClass.classLabel} | ${accountability.classLabel} | ${threshold.classLabel}`,
        neighboringObjects: "upstream retained_signature | downstream reconstruction",
        addressBoundary: defaultBoundary(),
    };
}
