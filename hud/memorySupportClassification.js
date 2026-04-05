"use strict";

import { deriveOperatorThresholdPosture, deriveOperatorWeakStateDiscipline } from "./replayThresholdFidelityPosture.js";
import { deriveStructuralIdentityPosture } from "./structuralIdentityPosture.js";

function supportBasisLabel(replay) {
    const basis = Array.isArray(replay?.replay_fidelity_record_v0?.support_basis ?? replay?.support_basis)
        ? (replay?.replay_fidelity_record_v0?.support_basis ?? replay?.support_basis).filter(Boolean)
        : [];
    return basis.length > 0 ? basis.join(", ") : "bounded support only";
}

function retainedSupportLabel(workbench) {
    const h1Count = Number(workbench?.runtime?.artifacts?.h1s?.length ?? 0) || 0;
    const m1Count = Number(workbench?.runtime?.artifacts?.m1s?.length ?? 0) || 0;
    return `H1 ${h1Count} | M1 ${m1Count}`;
}

function unresolvedClassification(note, lawfulNextPosture = "defer") {
    return {
        classCode: "unresolved",
        classLabel: "unresolved",
        chipCode: "unresolved",
        classificationBasis: note,
        lawfulNextPosture,
        semanticBoundary: "Semantic usefulness alone does not justify memory-bearing language while structural closure remains unresolved.",
        note,
    };
}

export function deriveMemorySupportClassification({
    objectKind = "replay",
    hasActiveResult = false,
    workbench = null,
    replay = null,
    activeRequest = null,
} = {}) {
    if (objectKind === "retained_signature") {
        if (!hasActiveResult || !workbench) {
            return unresolvedClassification(
                "No active retained structural support is available yet, so memory/support status remains unresolved at this seam."
            );
        }

        const h1Count = Number(workbench?.runtime?.artifacts?.h1s?.length ?? 0) || 0;
        const m1Count = Number(workbench?.runtime?.artifacts?.m1s?.length ?? 0) || 0;

        if (m1Count > 0) {
            return {
                classCode: "memory_bearing",
                classLabel: "memory_bearing",
                chipCode: "memory_bearing",
                classificationBasis: `Active retained structural trace survives as bounded reuse support under the declared shell lens (${retainedSupportLabel(workbench)}).`,
                lawfulNextPosture: "keep",
                semanticBoundary: "Retention closure is support-grounded here. Semantic summary may describe the retained object but does not create its memory-bearing status.",
                note: "This retained-signature object is currently the strongest preservation-bearing class available at the Door One retained-support seam.",
            };
        }

        if (h1Count > 0) {
            return {
                classCode: "memory_supporting",
                classLabel: "memory_supporting",
                chipCode: "memory_supporting",
                classificationBasis: `Structural evidence survives (${retainedSupportLabel(workbench)}), but retained reuse closure is not strong enough to treat the object itself as memory-bearing.`,
                lawfulNextPosture: "narrow",
                semanticBoundary: "Semantic usefulness may still exist, but it must remain below preservation-bearing classification while retained closure is incomplete.",
                note: "This object preserves support necessary for memory, but is not itself fully reusable as memory at this layer.",
            };
        }

        return {
            classCode: "degraded_residue",
            classLabel: "degraded_residue",
            chipCode: "degraded_residue",
            classificationBasis: "The active run lacks enough retained structural survival to support stronger memory language at this seam.",
            lawfulNextPosture: "downgrade",
            semanticBoundary: "Displayed continuity or convenience summary must not replace missing retained support.",
            note: "Residual structure remains inspectable, but stronger preservation-bearing claims have been lost.",
        };
    }

    if (objectKind === "review_gate") {
        if (!hasActiveResult && !activeRequest) {
            return unresolvedClassification(
                "No active run or prepared request is present yet, so downstream review posture remains unresolved."
            );
        }

        return {
            classCode: "review_only",
            classLabel: "review_only",
            chipCode: "review_only",
            classificationBasis: activeRequest
                ? "Prepared request and review-facing posture are active, but this surface remains downstream evaluation support only."
                : "Candidate/readiness posture is visible, but it remains downstream review-facing support rather than runtime memory.",
            lawfulNextPosture: activeRequest ? "review_required" : "defer",
            semanticBoundary: "Review usefulness does not make this object preservation-bearing or runtime memory-bearing.",
            note: "This object is useful for evaluation, export, or downstream review preparation only.",
        };
    }

    if (!replay) {
        return unresolvedClassification(
            objectKind === "reconstruction"
                ? "No reconstruction-support object is active yet, so memory/support status remains unresolved."
                : "No replay-support object is active yet, so memory/support status remains unresolved."
        );
    }

    const threshold = deriveOperatorThresholdPosture(replay);
    const discipline = deriveOperatorWeakStateDiscipline(replay);
    const identity = deriveStructuralIdentityPosture(replay, { objectKind });
    const supportBasis = supportBasisLabel(replay);
    const weakOrBroken = ["failed", "insufficient", "degraded"].includes(threshold.classCode)
        || ["broken", "degraded"].includes(identity.outcomeCode);

    if (threshold.classCode === "unresolved" || identity.outcomeCode === "unresolved") {
        return {
            classCode: "unresolved",
            classLabel: "unresolved",
            chipCode: "unresolved",
            classificationBasis: `Support basis ${supportBasis} remains open or incomplete for a stronger memory/support classification at the current seam.`,
            lawfulNextPosture: discipline.nextActionCode === "review_required" ? "review_required" : "defer",
            semanticBoundary: "Semantic usefulness must not force a stronger memory class while support, identity closure, or mechanized basis remain unresolved.",
            note: "The current object remains lawful to inspect, but it is not yet lawful to classify it as preservation-bearing.",
        };
    }

    if (weakOrBroken) {
        return {
            classCode: "degraded_residue",
            classLabel: "degraded_residue",
            chipCode: "degraded_residue",
            classificationBasis: `Support basis ${supportBasis} survives only in weakened form, so stronger memory/support claims must downgrade to residue at this seam.`,
            lawfulNextPosture: discipline.nextActionCode === "review_required" ? "review_required" : "downgrade",
            semanticBoundary: "Replay usefulness or interpretive convenience must not hide degraded or insufficient support behind stronger memory language.",
            note: "This object remains inspectable residue or weakened support, not preservation-bearing memory.",
        };
    }

    if (objectKind === "reconstruction") {
        return {
            classCode: "memory_supporting",
            classLabel: "memory_supporting",
            chipCode: "memory_supporting",
            classificationBasis: `Support-trace reconstruction remains structurally grounded under ${supportBasis}, but it is still supporting memory rather than carrying preservation by itself.`,
            lawfulNextPosture: identity.lawfulNextPosture,
            semanticBoundary: "Reconstruction may expose reusable support, but it does not become memory-bearing merely because it is useful or coherent.",
            note: "This object supports later memory-bearing judgment without itself becoming preservation-bearing at this seam.",
        };
    }

    return {
        classCode: "replay_support_only",
        classLabel: "replay_support_only",
        chipCode: "replay_support_only",
        classificationBasis: `Replay remains bounded to declared support under ${supportBasis}; it is lawful support for re-exposure, not preservation-bearing memory.`,
        lawfulNextPosture: identity.lawfulNextPosture,
        semanticBoundary: "Replay usefulness, legibility, or continuity language must not promote the replay object into memory-bearing status by itself.",
        note: "Replay remains support-only even when preserved structure is strong enough to justify bounded replay legitimacy. It is not preservation-bearing memory.",
    };
}
