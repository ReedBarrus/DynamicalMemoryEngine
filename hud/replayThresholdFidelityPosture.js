"use strict";

function tierNumber(replay) {
    return Number(replay?.retained_tier_used?.tier_used ?? -1);
}

function rawThresholdOutcome(replay) {
    return replay?.replay_fidelity_record_v0?.threshold_outcome
        ?? replay?.threshold_posture?.threshold_outcome
        ?? "";
}

function rawDowngradePosture(replay) {
    return replay?.replay_fidelity_record_v0?.downgrade_posture
        ?? replay?.threshold_posture?.downgrade_output
        ?? "";
}

function rawFailurePosture(replay) {
    return replay?.replay_fidelity_record_v0?.failure_posture
        ?? replay?.failure_posture
        ?? replay?.failure_reason
        ?? "";
}

function mechanizationStatus(replay) {
    return replay?.replay_fidelity_record_v0?.mechanization_status
        ?? (replay?.request_status === "failed" || replay?.reconstruction_status === "failed" ? "failed" : "");
}

function thresholdSnapshot(replay = null) {
    return {
        tierUsed: tierNumber(replay),
        thresholdOutcome: rawThresholdOutcome(replay),
        downgrade: rawDowngradePosture(replay),
        failure: rawFailurePosture(replay),
        mechanization: mechanizationStatus(replay),
    };
}

export function deriveOperatorThresholdPosture(replay = null) {
    if (!replay) {
        return {
            classCode: "unresolved",
            classLabel: "unresolved",
            rawOutcome: "",
            rawDowngrade: "",
            note: "No replay object is active yet, so the threshold question remains unresolved at the operator surface.",
        };
    }

    const {
        tierUsed,
        thresholdOutcome,
        downgrade,
        failure,
        mechanization,
    } = thresholdSnapshot(replay);

    if (replay?.request_status === "failed" || replay?.reconstruction_status === "failed" || mechanization === "failed") {
        return {
            classCode: "failed",
            classLabel: "failed",
            rawOutcome: thresholdOutcome,
            rawDowngrade: downgrade,
            note: failure || "Replay / reconstruction failed before a lawful threshold result could be established.",
        };
    }

    if (downgrade === "support_degraded") {
        return {
            classCode: "degraded",
            classLabel: "degraded",
            rawOutcome: thresholdOutcome,
            rawDowngrade: downgrade,
            note: "Some support survives, but the requested replay path is degraded relative to the declared replay question.",
        };
    }

    if (downgrade === "retained_tier_insufficient" || downgrade === "reconstruction_not_justified") {
        return {
            classCode: "insufficient",
            classLabel: "insufficient",
            rawOutcome: thresholdOutcome,
            rawDowngrade: downgrade,
            note: "Surviving support does not justify lawful replay legitimacy for the declared tier and lens.",
        };
    }

    if (thresholdOutcome === "support_unresolved") {
        return {
            classCode: "unresolved",
            classLabel: "unresolved",
            rawOutcome: thresholdOutcome,
            rawDowngrade: downgrade,
            note: "The replay-support question remains open at this seam; unresolved is not a weak success.",
        };
    }

    if (thresholdOutcome === "bounded_supported" && tierUsed === 0) {
        return {
            classCode: "conserved",
            classLabel: "conserved",
            rawOutcome: thresholdOutcome,
            rawDowngrade: downgrade,
            note: "The bounded replay question is conserved by surviving live runtime support under the declared lens.",
        };
    }

    if (thresholdOutcome === "bounded_supported" && tierUsed === 1) {
        return {
            classCode: "narrowed",
            classLabel: "narrowed",
            rawOutcome: thresholdOutcome,
            rawDowngrade: downgrade,
            note: "The bounded replay question survives in a narrower retained receipt-lineage form; preserved does not mean equivalent.",
        };
    }

    return {
        classCode: "unresolved",
        classLabel: "unresolved",
        rawOutcome: thresholdOutcome,
        rawDowngrade: downgrade,
        note: "The threshold posture remains bounded and unresolved at the current seam.",
    };
}

export function deriveOperatorFidelityPosture(replay = null) {
    const threshold = deriveOperatorThresholdPosture(replay);

    if (!replay) {
        return {
            classCode: "unresolved_support_trace",
            classLabel: "unresolved support-trace",
            rawFidelity: "",
            note: "No replay object is active yet, so no fidelity posture can be taken beyond unresolved support-trace potential.",
        };
    }

    const rawFidelity = replay?.replay_fidelity_record_v0?.fidelity_posture
        ?? replay?.fidelity_posture
        ?? "";

    if (threshold.classCode === "failed") {
        return {
            classCode: "failed_support_trace",
            classLabel: "failed support-trace",
            rawFidelity,
            note: "No lawful support-trace quality could be established because the replay path failed.",
        };
    }

    if (threshold.classCode === "conserved") {
        return {
            classCode: "conserved_support_trace",
            classLabel: "conserved support-trace",
            rawFidelity,
            note: "Support-trace quality is strongest here within the active seam, while still remaining non-restorative and non-authoritative.",
        };
    }

    if (threshold.classCode === "narrowed") {
        return {
            classCode: "narrowed_support_trace",
            classLabel: "narrowed support-trace",
            rawFidelity,
            note: "Support-trace quality survives in a narrower retained form; it remains bounded and not source-equivalent.",
        };
    }

    if (threshold.classCode === "degraded") {
        return {
            classCode: "degraded_support_trace",
            classLabel: "degraded support-trace",
            rawFidelity,
            note: "Support-trace quality is present but degraded; degraded remains distinct from insufficient and unresolved.",
        };
    }

    if (threshold.classCode === "insufficient") {
        return {
            classCode: "insufficient_support_trace",
            classLabel: "insufficient support-trace",
            rawFidelity,
            note: "Support survives in some form, but not enough to justify lawful replay / reconstruction quality for the declared tier.",
        };
    }

    return {
        classCode: "unresolved_support_trace",
        classLabel: "unresolved support-trace",
        rawFidelity,
        note: "Support-trace quality remains unresolved at the current seam; unresolved is distinct from degraded and insufficient.",
    };
}

export function deriveOperatorWeakStateDiscipline(replay = null) {
    const threshold = deriveOperatorThresholdPosture(replay);
    const { downgrade } = thresholdSnapshot(replay);

    if (!replay) {
        return {
            stateCode: "awaiting_request",
            stateLabel: "awaiting request",
            nextActionCode: "prepare_replay_request",
            nextActionLabel: "prepare replay request",
            boundaryNote: "No replay or reconstruction object is active yet, so no weak-state discipline can be claimed beyond awaiting an explicit request.",
            nextActionNote: "Prepare replay from the active run before reading any threshold or fidelity posture.",
        };
    }

    if (threshold.classCode === "failed") {
        return {
            stateCode: "failed",
            stateLabel: "explicit failure",
            nextActionCode: "review_required",
            nextActionLabel: "review required",
            boundaryNote: "Failure is explicit local failure. Do not read it as weakened replay success or decorative comfort.",
            nextActionNote: "Inspect the failure posture and missing support path before retrying or treating the object as replayable.",
        };
    }

    if (threshold.classCode === "degraded") {
        return {
            stateCode: "degraded",
            stateLabel: "degraded support",
            nextActionCode: "reconstructable_only",
            nextActionLabel: "reconstructable only",
            boundaryNote: "Some support survives, but replay continuity is degraded. Degraded remains weaker than conserved or narrowed and distinct from insufficiency.",
            nextActionNote: "Treat the object as bounded support-trace reconstruction only unless stronger replay support is restored.",
        };
    }

    if (threshold.classCode === "insufficient") {
        if (downgrade === "retained_tier_insufficient") {
            return {
                stateCode: "insufficient",
                stateLabel: "retained-tier insufficiency",
                nextActionCode: "retained_tier_insufficient",
                nextActionLabel: "retained tier insufficient",
                boundaryNote: "Insufficiency means surviving support is bounded below lawful replay legitimacy for the declared retained tier. It is not almost replayable.",
                nextActionNote: "Step down the retained tier or remain at bounded retained support without treating this as legitimate replay continuity.",
            };
        }

        return {
            stateCode: "insufficient",
            stateLabel: "replay not justified",
            nextActionCode: "replay_not_justified",
            nextActionLabel: "replay not justified",
            boundaryNote: "Replay is not justified from the currently surviving support basis. Insufficiency is bounded absence, not a weak success.",
            nextActionNote: "Treat the object as retained support only or restore stronger live support before claiming replay legitimacy.",
        };
    }

    if (threshold.classCode === "unresolved") {
        return {
            stateCode: "unresolved",
            stateLabel: "support unresolved",
            nextActionCode: "review_required",
            nextActionLabel: "review required",
            boundaryNote: "Unresolved means the support question remains open at this seam. It is not degraded support and not weak success.",
            nextActionNote: "Review missing context or evidence before reading this object as replayable, degraded, or sufficient.",
        };
    }

    if (threshold.classCode === "narrowed") {
        return {
            stateCode: "narrowed",
            stateLabel: "narrowed retained replay",
            nextActionCode: "bounded_lineage_replay",
            nextActionLabel: "bounded lineage replay",
            boundaryNote: "Support survives in a narrower retained lineage form. Narrowed remains bounded and non-equivalent to live replay.",
            nextActionNote: "Use receipt-backed lineage replay within the declared tier and keep non-equivalence explicit.",
        };
    }

    return {
        stateCode: "conserved",
        stateLabel: "conserved live replay",
        nextActionCode: "bounded_replay_available",
        nextActionLabel: "bounded replay available",
        boundaryNote: "This is the strongest support posture at the active seam, but it remains bounded replay support rather than restoration or truth.",
        nextActionNote: "Inspect replay and reconstruction within the declared lens without treating conserved support as raw restoration.",
    };
}
