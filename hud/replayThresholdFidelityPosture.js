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

    const tierUsed = tierNumber(replay);
    const thresholdOutcome = rawThresholdOutcome(replay);
    const downgrade = rawDowngradePosture(replay);
    const failure = rawFailurePosture(replay);
    const mechanization = mechanizationStatus(replay);

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
