"use strict";

import { deriveOperatorThresholdPosture, deriveOperatorWeakStateDiscipline } from "./replayThresholdFidelityPosture.js";
import { deriveStructuralIdentityPosture } from "./structuralIdentityPosture.js";
import { deriveCompressionRemintingAccountability } from "./compressionRemintingAccountability.js";

function safeArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
}

function sourceMeta(runResult, workbench) {
    return runResult?.artifacts?.a1?.meta ?? workbench?.runtime?.artifacts?.a1?.meta ?? {};
}

function sourceText(sourceFamilyLabel, runResult, workbench) {
    const meta = sourceMeta(runResult, workbench);
    return [
        sourceFamilyLabel,
        runResult?.artifacts?.a1?.source_id,
        workbench?.runtime?.artifacts?.a1?.source_id,
        meta?.recorded_family,
        meta?.original_filename,
    ].filter(Boolean).join(" ").toLowerCase();
}

function segmentEventTypes(workbench, hudModel) {
    const fromWorkbench = safeArray(workbench?.runtime?.substrate?.segment_transitions)
        .flatMap((row) => safeArray(row?.detected_event_types ?? row?.events));
    const fromHud = Object.keys(hudModel?.runtime_evidence?.segment_event_types ?? {});
    return [...new Set([...fromWorkbench, ...fromHud].filter(Boolean))];
}

function totalReEntries(workbench, hudModel) {
    return Number(
        hudModel?.runtime_evidence?.total_re_entries
        ?? workbench?.runtime?.substrate?.transition_report?.total_re_entries
        ?? workbench?.interpretation?.trajectory?.neighborhood_character?.evidence?.total_re_entries
        ?? 0
    ) || 0;
}

function recurrenceStrength(workbench, hudModel) {
    return workbench?.interpretation?.trajectory?.neighborhood_character?.recurrence_strength
        ?? hudModel?.structure?.recurrence
        ?? "unknown";
}

function continuityLabel(workbench, hudModel) {
    return workbench?.interpretation?.trajectory?.segment_character?.continuity
        ?? hudModel?.structure?.continuity
        ?? "unknown";
}

function hasExplicitRupture(workbench, hudModel) {
    const events = segmentEventTypes(workbench, hudModel);
    if (events.some((eventType) => /rupture|break|discontinu|split/i.test(String(eventType)))) {
        return true;
    }
    return /rupture|break|discontinu|split/i.test(String(continuityLabel(workbench, hudModel)));
}

function explicitDistortion(distortionPosture) {
    const text = String(distortionPosture ?? "").trim().toLowerCase();
    return text !== "" && text !== "not_declared" && text !== "none";
}

function sourcePathCondition({ sourceFamilyLabel, runResult, workbench }) {
    const meta = sourceMeta(runResult, workbench);
    const text = sourceText(sourceFamilyLabel, runResult, workbench);
    const noiseStd = Number(meta?.noiseStd);
    if (Number.isFinite(noiseStd) && noiseStd >= 0.1) {
        return `high declared source variability | synthetic noise std ${noiseStd}`;
    }
    if (Number.isFinite(noiseStd) && noiseStd > 0) {
        return `declared source variability | synthetic noise std ${noiseStd}`;
    }
    if (text.includes("noise")) {
        return "recorded source family includes explicit noise-path variability";
    }
    return "no explicit source-path variability alert declared";
}

function representationCondition({
    objectKind,
    accountability,
    replay,
}) {
    const distortionPosture = replay?.threshold_posture?.distortion_posture ?? "not_declared";
    const compressionSurvival = replay?.threshold_posture?.compression_survival ?? "not_declared";

    if (explicitDistortion(distortionPosture)) {
        return `distortion posture ${distortionPosture} | compression survival ${compressionSurvival}`;
    }
    if (accountability?.classCode === "compressed_retained") {
        return "compression-retained path active; direct one-to-one structural detail is compressed";
    }
    if (accountability?.classCode === "reminted") {
        return "derived reminting path active; representation changed without becoming direct preservation";
    }
    if (accountability?.classCode === "degraded_residue") {
        return "representation survival is degraded; direct preservation is no longer justified";
    }
    if (objectKind === "source") {
        return "no explicit representation-loss alert at the source stage";
    }
    return "no explicit representation-loss alert declared";
}

function claimStatusCondition({ threshold, discipline, hasReplay }) {
    if (!hasReplay) {
        return "claim-status posture activates later in replay / reconstruction or review seams";
    }
    if (threshold.classCode === "failed") {
        return "claim path failed before a lawful support result could be established";
    }
    if (threshold.classCode === "insufficient") {
        return "support floor not met for the stronger bounded claim at this seam";
    }
    if (threshold.classCode === "unresolved") {
        return "stronger claim remains unresolved at the current seam";
    }
    if (threshold.classCode === "degraded") {
        return "weaker-but-still-supported claim only";
    }
    if (threshold.classCode === "conserved" || threshold.classCode === "narrowed") {
        return `bounded claim supported as ${threshold.classLabel}; preserved does not imply global equivalence`;
    }
    return discipline?.boundaryNote ?? "claim-status posture remains bounded";
}

function continuityCondition({ identity, workbench, hudModel, hasReplay }) {
    if (hasExplicitRupture(workbench, hudModel)) {
        return "rupture-like continuity break is visible in current boundary evidence";
    }
    if (identity?.outcomeCode === "broken") {
        return "continuity broken / new identity required";
    }
    if (identity?.outcomeCode === "degraded") {
        return "continuity degraded";
    }
    if (identity?.outcomeCode === "narrowed") {
        return "continuity narrowed";
    }
    if (identity?.outcomeCode === "conserved") {
        return "continuity conserved";
    }
    if (identity?.outcomeCode === "unresolved") {
        return "continuity unresolved";
    }
    if (!hasReplay) {
        return `continuity report ${continuityLabel(workbench, hudModel)}`;
    }
    return "no explicit continuity outcome declared";
}

function recurrenceCondition(workbench, hudModel) {
    const reEntries = totalReEntries(workbench, hudModel);
    const strength = recurrenceStrength(workbench, hudModel);
    if (reEntries > 0) {
        return `recurrence present | total re-entries ${reEntries}`;
    }
    if (strength && strength !== "unknown") {
        return `recurrence strength ${strength} | total re-entries ${reEntries}`;
    }
    return "no explicit recurrence signal declared";
}

function dominantClass({
    sourceCondition,
    replay,
    threshold,
    identity,
    accountability,
    workbench,
    hudModel,
}) {
    if (hasExplicitRupture(workbench, hudModel)) {
        return { code: "rupture", label: "rupture", chipCode: "rupture" };
    }
    if (threshold?.classCode === "insufficient") {
        return { code: "insufficiency", label: "insufficiency", chipCode: "insufficient" };
    }
    if (threshold?.classCode === "unresolved" || identity?.outcomeCode === "unresolved") {
        return { code: "uncertainty", label: "uncertainty", chipCode: "uncertainty" };
    }
    if (
        threshold?.classCode === "degraded"
        || identity?.outcomeCode === "degraded"
        || accountability?.classCode === "degraded_residue"
    ) {
        return { code: "degradation", label: "degradation", chipCode: "degraded" };
    }
    if (explicitDistortion(replay?.threshold_posture?.distortion_posture)) {
        return { code: "distortion", label: "distortion", chipCode: "distortion" };
    }
    if (sourceCondition !== "no explicit source-path variability alert declared") {
        return { code: "noise", label: "noise", chipCode: "noise" };
    }
    if (totalReEntries(workbench, hudModel) > 0) {
        return { code: "recurrence", label: "recurrence", chipCode: "recurrence" };
    }
    return { code: "none_declared", label: "no dominant weak-state declared", chipCode: null };
}

function lawfulNextPosture({ dominant, discipline, accountability, identity }) {
    if (dominant.code === "rupture") {
        return "split | continuity break is more lawful than vague similarity comfort.";
    }
    if (discipline) {
        return `${discipline.nextActionLabel} | ${discipline.nextActionNote}`;
    }
    if (accountability?.lawfulNextPosture) {
        return `${accountability.lawfulNextPosture} | keep compression and reminting posture explicit.`;
    }
    if (identity?.lawfulNextPosture) {
        return `${identity.lawfulNextPosture} | keep continuity claims bounded to surviving support.`;
    }
    if (dominant.code === "noise") {
        return "keep provenance visible | source variability is not by itself claim uncertainty.";
    }
    if (dominant.code === "none_declared") {
        return "defer | no stronger weak-state action is required at the current seam.";
    }
    return "defer | keep the current weak-state class explicit and support-grounded.";
}

export function deriveWeakStateAccounting({
    objectKind = "replay",
    hasActiveResult = false,
    sourceFamilyLabel = "unspecified",
    runResult = null,
    workbench = null,
    hudModel = null,
    replay = null,
} = {}) {
    const hasReplay = !!replay;
    const threshold = hasReplay ? deriveOperatorThresholdPosture(replay) : null;
    const discipline = hasReplay ? deriveOperatorWeakStateDiscipline(replay) : null;
    const identity = hasReplay
        ? deriveStructuralIdentityPosture(replay, { objectKind: objectKind === "reconstruction" ? "reconstruction" : "replay" })
        : null;
    const accountability = (objectKind === "retained_signature" || hasReplay)
        ? deriveCompressionRemintingAccountability({
            objectKind,
            hasActiveResult,
            workbench,
            replay,
        })
        : null;

    const sourceCondition = sourcePathCondition({ sourceFamilyLabel, runResult, workbench });
    const representation = representationCondition({ objectKind, accountability, replay });
    const claim = claimStatusCondition({ threshold, discipline, hasReplay });
    const continuity = continuityCondition({ identity, workbench, hudModel, hasReplay });
    const recurrence = recurrenceCondition(workbench, hudModel);
    const dominant = dominantClass({
        sourceCondition,
        replay,
        threshold,
        identity,
        accountability,
        workbench,
        hudModel,
    });

    return {
        dominantClassCode: dominant.code,
        dominantClassLabel: dominant.label,
        chipCode: dominant.chipCode,
        sourcePathCondition: sourceCondition,
        representationCondition: representation,
        claimStatusCondition: claim,
        continuityCondition: continuity,
        recurrenceCondition: recurrence,
        lawfulNextPosture: lawfulNextPosture({
            dominant,
            discipline,
            accountability,
            identity,
        }),
        boundaryNote: "Noise is source/support-path variability. Distortion is representation-level. Uncertainty is claim-status. This remains a bounded lattice, not a global confidence score.",
        note: dominant.code === "none_declared"
            ? "No single weak-state class dominates the current object at this seam."
            : `Dominant weak-state class: ${dominant.label}. Keep semantic ambiguity below structural accounting.`,
    };
}
