function safeObject(value) {
    return value && typeof value === "object" ? value : null;
}

export function readTrajectoryOverlay(workbench) {
    return safeObject(
        workbench?.semantic_overlay?.trajectory ??
        workbench?.compatibility_aliases?.interpretation?.trajectory ??
        workbench?.interpretation?.trajectory
    ) ?? {};
}

export function readAttentionMemoryOverlay(workbench) {
    return safeObject(
        workbench?.semantic_overlay?.attention_memory ??
        workbench?.compatibility_aliases?.interpretation?.attention_memory ??
        workbench?.interpretation?.attention_memory
    ) ?? {};
}

export function readReadinessReport(workbench) {
    return safeObject(
        workbench?.readiness_overlay?.promotion_readiness ??
        workbench?.compatibility_aliases?.promotion_readiness?.report ??
        workbench?.promotion_readiness?.report
    ) ?? {};
}

export function readCanonCandidateDossier(workbench) {
    return safeObject(
        workbench?.review_overlay?.canon_candidate ??
        workbench?.compatibility_aliases?.canon_candidate?.dossier ??
        workbench?.canon_candidate?.dossier
    ) ?? {};
}

export function readConsensusReview(workbench) {
    return safeObject(
        workbench?.review_overlay?.consensus_review ??
        workbench?.compatibility_aliases?.consensus_review?.review ??
        workbench?.consensus_review?.review
    ) ?? null;
}
