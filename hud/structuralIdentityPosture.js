"use strict";

import {
    deriveOperatorThresholdPosture,
    deriveOperatorWeakStateDiscipline,
} from "./replayThresholdFidelityPosture.js";

function safeArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
}

function tierLabel(replay) {
    return replay?.replay_fidelity_record_v0?.retained_tier
        ?? replay?.retained_tier_used?.tier_label
        ?? "retained tier not declared";
}

function lensLabel(replay) {
    const lens = replay?.declared_lens ?? {};
    const parts = [];
    if (lens.replay_lens) parts.push(lens.replay_lens);
    if (lens.transform_family) parts.push(lens.transform_family);
    if (lens.window_family) parts.push(lens.window_family);
    if (lens.source_family) parts.push(lens.source_family);
    return parts.length > 0 ? parts.join(" | ") : "declared lens not yet active";
}

function supportBasisLabel(replay) {
    const basis = safeArray(replay?.replay_fidelity_record_v0?.support_basis ?? replay?.support_basis);
    return basis.length > 0 ? basis.join(", ") : "bounded support only";
}

function mechanizedBasisLabel(replay, objectKind) {
    if (!replay) return "not yet mechanized";
    const parts = [];
    if (objectKind === "reconstruction") {
        parts.push(replay?.reconstruction_status ?? "reconstruction status not declared");
    } else {
        parts.push(replay?.request_status ?? "replay status not declared");
    }
    parts.push(replay?.replay_fidelity_record_v0?.mechanization_status ?? "mechanization not declared");
    return parts.filter(Boolean).join(" | ");
}

export function deriveStructuralIdentityPosture(replay = null, { objectKind = "replay" } = {}) {
    const threshold = deriveOperatorThresholdPosture(replay);
    const discipline = deriveOperatorWeakStateDiscipline(replay);
    const question = objectKind === "reconstruction"
        ? "Can this bounded object still answer the same support-trace reconstruction continuity question under the declared lens and retained tier?"
        : "Can this bounded object still answer the same replay-support continuity question under the declared lens and retained tier?";

    if (!replay) {
        return {
            outcomeCode: "unresolved",
            outcomeLabel: "unresolved",
            chipCode: "identity_unresolved",
            boundedQuestion: question,
            declaredConstraints: "declared lens and retained tier become auditable once a replay object exists",
            supportSurvival: "no active support basis yet",
            mechanizedBasis: "not yet mechanized",
            semanticBoundary: "No semantic or display-only coherence may carry identity before a replay / reconstruction object exists.",
            lawfulNextPosture: "defer",
            note: "No replay object is active yet, so structural identity remains unresolved rather than silently assumed.",
        };
    }

    const constraints = [
        lensLabel(replay),
        tierLabel(replay),
        replay?.replay_type ? `type ${replay.replay_type}` : null,
    ].filter(Boolean).join(" | ");

    if (threshold.classCode === "conserved") {
        return {
            outcomeCode: "conserved",
            outcomeLabel: "conserved",
            chipCode: "identity_conserved",
            boundedQuestion: question,
            declaredConstraints: constraints,
            supportSurvival: `Surviving support remains strong enough for the same bounded question under ${supportBasisLabel(replay)}.`,
            mechanizedBasis: mechanizedBasisLabel(replay, objectKind),
            semanticBoundary: "Structural support is carrying continuity here. Semantic summaries remain interpretive and do not add preservation authority.",
            lawfulNextPosture: "keep",
            note: "The same bounded question remains answerable under the same declared constraints with sufficient surviving support and mechanized basis.",
        };
    }

    if (threshold.classCode === "narrowed") {
        return {
            outcomeCode: "narrowed",
            outcomeLabel: "narrowed",
            chipCode: "identity_narrowed",
            boundedQuestion: question,
            declaredConstraints: constraints,
            supportSurvival: `Support survives in a narrower retained-lineage form under ${supportBasisLabel(replay)}.`,
            mechanizedBasis: mechanizedBasisLabel(replay, objectKind),
            semanticBoundary: "Semantic coherence may describe the surviving object, but it must not widen the continuity claim beyond the retained support that survives.",
            lawfulNextPosture: "narrow",
            note: "Continuity survives only under reduced scope and tighter use. Same-thing language must remain explicitly narrowed.",
        };
    }

    if (threshold.classCode === "degraded") {
        return {
            outcomeCode: "degraded",
            outcomeLabel: "degraded",
            chipCode: "identity_degraded",
            boundedQuestion: question,
            declaredConstraints: constraints,
            supportSurvival: `Some support survives under ${supportBasisLabel(replay)}, but the continuity claim is weakened relative to the original bounded question.`,
            mechanizedBasis: mechanizedBasisLabel(replay, objectKind),
            semanticBoundary: "Displayed coherence is not preserved identity by itself. Continuity remains support-grounded and explicitly downgraded.",
            lawfulNextPosture: "downgrade",
            note: "Useful continuity remains, but identity language requires explicit weakening and must not be treated as conserved sameness.",
        };
    }

    if (threshold.classCode === "insufficient") {
        return {
            outcomeCode: "broken",
            outcomeLabel: "broken / new identity required",
            chipCode: "identity_broken",
            boundedQuestion: question,
            declaredConstraints: constraints,
            supportSurvival: `Support survival has fallen below the floor needed to preserve the same bounded identity claim at this seam under ${supportBasisLabel(replay)}.`,
            mechanizedBasis: mechanizedBasisLabel(replay, objectKind),
            semanticBoundary: "Semantic summaries must not preserve sameness when support no longer justifies it. If continuity rhetoric must continue, it requires a new identity class or explicit split.",
            lawfulNextPosture: "split",
            note: "The current seam no longer justifies silent same-object language. New identity required is more lawful than decorative continuity comfort.",
        };
    }

    return {
        outcomeCode: "unresolved",
        outcomeLabel: "unresolved",
        chipCode: "identity_unresolved",
        boundedQuestion: question,
        declaredConstraints: constraints,
        supportSurvival: `Support remains open or incomplete under ${supportBasisLabel(replay)}.`,
        mechanizedBasis: mechanizedBasisLabel(replay, objectKind),
        semanticBoundary: "Semantic summaries remain interpretive only. They must not carry preservation claims while continuity remains unresolved.",
        lawfulNextPosture: discipline.nextActionCode === "review_required" ? "review_required" : "defer",
        note: "The current seam cannot honestly justify either strong continuity or strong break. Unresolved posture is lawful.",
    };
}
