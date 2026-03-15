// runtime/AttentionMemoryReport.js

/**
 * AttentionMemoryReport
 *
 * Layer:
 *   Read-side runtime interpretation overlay.
 *   Not a pipeline operator. Not an authority-bearing artifact.
 *
 * Purpose:
 *   Produce a deterministic, plain-data overlay describing attention-like and
 *   memory-like structural behavior using:
 *     - DoorOneOrchestrator result
 *     - TrajectoryInterpretationReport
 *
 * Boundary contract:
 *   - derived / observational overlay only
 *   - not canon
 *   - not prediction
 *   - not ontology
 *   - not semantic intent
 *   - not trusted commitment
 *   - does not mutate input result
 *   - does not recompute authoritative artifacts
 *   - does not claim agency or commitment as fact
 *
 * Output:
 *   Plain-data report with explicit evidence fields under each overlay label.
 *
 * Dependencies:
 *   - runtime/TrajectoryInterpretationReport.js
 */

import { TrajectoryInterpretationReport } from "./TrajectoryInterpretationReport.js";

export class AttentionMemoryReport {
    /**
     * @param {Object} [opts]
     * @param {number} [opts.high_concentration_share=0.60]
     * @param {number} [opts.medium_concentration_share=0.40]
     * @param {number} [opts.high_persistence_dwell=3]
     * @param {number} [opts.medium_persistence_dwell=2]
     * @param {number} [opts.high_volatility_transition_density=0.50]
     * @param {number} [opts.medium_volatility_transition_density=0.20]
     * @param {number} [opts.high_memory_reentry_ratio=1.0]
     * @param {number} [opts.medium_memory_reentry_ratio=0.50]
     */
    constructor(opts = {}) {
        this.cfg = {
            high_concentration_share: opts.high_concentration_share ?? 0.60,
            medium_concentration_share: opts.medium_concentration_share ?? 0.40,
            high_persistence_dwell: opts.high_persistence_dwell ?? 3,
            medium_persistence_dwell: opts.medium_persistence_dwell ?? 2,
            high_volatility_transition_density: opts.high_volatility_transition_density ?? 0.50,
            medium_volatility_transition_density: opts.medium_volatility_transition_density ?? 0.20,
            high_memory_reentry_ratio: opts.high_memory_reentry_ratio ?? 1.0,
            medium_memory_reentry_ratio: opts.medium_memory_reentry_ratio ?? 0.50,
        };

        this._base = new TrajectoryInterpretationReport();
    }

    /**
     * Interpret a DoorOneOrchestrator result into attention/memory overlay form.
     *
     * If baseReport is omitted, it is derived internally from
     * TrajectoryInterpretationReport.
     *
     * @param {Object} result
     * @param {Object|null} [baseReport=null]
     * @returns {Object}
     */
    interpret(result, baseReport = null) {
        if (!result?.ok) {
            return {
                ok: false,
                error: "INVALID_INPUT",
                reasons: ["AttentionMemoryReport requires a successful DoorOneOrchestrator result"],
            };
        }

        const base = baseReport ?? this._base.interpret(result);
        if (!base || base.ok === false) {
            return {
                ok: false,
                error: "INVALID_BASE_REPORT",
                reasons: ["AttentionMemoryReport requires a valid TrajectoryInterpretationReport"],
            };
        }

        const attentionCharacter =
            this._interpretAttentionCharacter(base);

        const memoryCharacter =
            this._interpretMemoryCharacter(base);

        const coordinationHints =
            this._interpretCoordinationHints(base);

        const overlayFlags =
            this._deriveOverlayFlags({ attentionCharacter, memoryCharacter, coordinationHints });

        const notes =
            this._buildNotes({ attentionCharacter, memoryCharacter, coordinationHints });

        return {
            report_type: "runtime:attention_memory_report",
            generated_from:
                "Door One trajectory interpretation, dwell, recurrence, transition, and segment-boundary observations only; derived overlay, not canon, not intent, not ontology",
            scope: this._copyScope(base.scope),

            attention_character: attentionCharacter,
            memory_character: memoryCharacter,
            coordination_hints: coordinationHints,

            overlay_flags: overlayFlags,
            notes,
        };
    }

    // -------------------------------------------------------------------------
    // Attention character
    // -------------------------------------------------------------------------

    _interpretAttentionCharacter(base) {
        const n = base?.neighborhood_character ?? {};
        const t = base?.trajectory_character ?? {};
        const s = base?.segment_character ?? {};

        const dominantDwellShare = this._finiteOrZero(n?.evidence?.dominant_dwell_share);
        const currentDwellCount = this._finiteOrZero(n?.evidence?.current_dwell_count);
        const currentDwellDurationSec = this._finiteOrZero(n?.evidence?.current_dwell_duration_sec);
        const transitionDensityValue = this._finiteOrZero(n?.evidence?.transition_density_value);

        const occupancy = n?.occupancy ?? "sparse";
        const motion = t?.motion ?? "diffuse";
        const boundaryDensity = s?.boundary_density ?? "low";

        const concentration =
            this._labelAttentionConcentration({ dominantDwellShare, occupancy });

        const persistence =
            this._labelAttentionPersistence({ currentDwellCount, currentDwellDurationSec, occupancy });

        const volatility =
            this._labelAttentionVolatility({ transitionDensityValue, motion, boundaryDensity });

        return {
            concentration,
            persistence,
            volatility,
            evidence: {
                dominant_dwell_share: dominantDwellShare,
                current_dwell_count: currentDwellCount,
                current_dwell_duration_sec: currentDwellDurationSec,
                transition_density_value: transitionDensityValue,
                boundary_density: boundaryDensity,
                occupancy,
                motion,
            },
        };
    }

    _labelAttentionConcentration({ dominantDwellShare, occupancy }) {
        if (occupancy === "sparse") return "low";
        if (dominantDwellShare >= this.cfg.high_concentration_share) return "high";
        if (dominantDwellShare >= this.cfg.medium_concentration_share) return "medium";
        return "low";
    }

    _labelAttentionPersistence({ currentDwellCount, currentDwellDurationSec, occupancy }) {
        if (occupancy === "sparse") return "low";
        if (currentDwellCount >= this.cfg.high_persistence_dwell || currentDwellDurationSec >= 3) return "high";
        if (currentDwellCount >= this.cfg.medium_persistence_dwell || currentDwellDurationSec >= 1.5) return "medium";
        return "low";
    }

    _labelAttentionVolatility({ transitionDensityValue, motion, boundaryDensity }) {
        if (transitionDensityValue >= this.cfg.high_volatility_transition_density) return "high";
        if (boundaryDensity === "high" || motion === "transitional") return "high";
        if (transitionDensityValue >= this.cfg.medium_volatility_transition_density) return "medium";
        if (motion === "drifting" || boundaryDensity === "medium") return "medium";
        return "low";
    }

    // -------------------------------------------------------------------------
    // Memory character
    // -------------------------------------------------------------------------

    _interpretMemoryCharacter(base) {
        const n = base?.neighborhood_character ?? {};
        const t = base?.trajectory_character ?? {};
        const s = base?.segment_character ?? {};

        const totalReEntries = this._finiteOrZero(n?.evidence?.total_re_entries);
        const totalNeighborhoods = this._finiteOrZero(n?.evidence?.total_neighborhoods_observed);
        const dominantDwellShare = this._finiteOrZero(n?.evidence?.dominant_dwell_share);

        const recurrenceStrengthLabel = n?.recurrence_strength ?? "low";
        const convergence = t?.convergence ?? "insufficient_data";
        const continuity = s?.continuity ?? "mixed";

        const recurrenceStrength =
            this._labelMemoryRecurrenceStrength({
                recurrenceStrengthLabel,
                totalReEntries,
                totalNeighborhoods,
            });

        const persistence =
            this._labelMemoryPersistence({
                dominantDwellShare,
                recurrenceStrength,
                continuity,
            });

        const stability =
            this._labelMemoryStability({
                convergence,
                continuity,
                recurrenceStrength,
            });

        return {
            recurrence_strength: recurrenceStrength,
            persistence,
            stability,
            evidence: {
                total_re_entries: totalReEntries,
                total_neighborhoods_observed: totalNeighborhoods,
                dominant_dwell_share: dominantDwellShare,
                base_recurrence_strength: recurrenceStrengthLabel,
                convergence,
                continuity,
            },
        };
    }

    _labelMemoryRecurrenceStrength({ recurrenceStrengthLabel, totalReEntries, totalNeighborhoods }) {
        if (recurrenceStrengthLabel === "high") return "high";
        if (recurrenceStrengthLabel === "medium") return "medium";

        const ratio = this._safeRatio(totalReEntries, totalNeighborhoods);
        if (ratio >= this.cfg.high_memory_reentry_ratio) return "high";
        if (ratio >= this.cfg.medium_memory_reentry_ratio) return "medium";
        return "low";
    }

    _labelMemoryPersistence({ dominantDwellShare, recurrenceStrength, continuity }) {
        if (continuity === "fragmented") return "low";
        if (recurrenceStrength === "high" && dominantDwellShare >= this.cfg.medium_concentration_share) return "high";
        if (recurrenceStrength === "medium" || dominantDwellShare >= this.cfg.medium_concentration_share) return "medium";
        return "low";
    }

    _labelMemoryStability({ convergence, continuity, recurrenceStrength }) {
        if (continuity === "fragmented") return "low";
        if ((convergence === "strong" || convergence === "moderate") && recurrenceStrength === "high") return "high";
        if (convergence === "weak" && recurrenceStrength === "low") return "low";
        if (convergence === "insufficient_data") return "low";
        return "medium";
    }

    // -------------------------------------------------------------------------
    // Coordination hints
    // -------------------------------------------------------------------------

    _interpretCoordinationHints(base) {
        const t = base?.trajectory_character ?? {};
        const n = base?.neighborhood_character ?? {};
        const s = base?.segment_character ?? {};
        const flags = Array.isArray(base?.dynamics_flags) ? base.dynamics_flags : [];

        const stickyNeighborhood = flags.includes("sticky_neighborhood");
        const highRecurrence = flags.includes("high_recurrence");
        const convergence = t?.convergence ?? "insufficient_data";
        const continuity = s?.continuity ?? "mixed";

        const preCommitment =
            this._labelPreCommitment({
                stickyNeighborhood,
                highRecurrence,
                convergence,
                continuity,
            });

        return {
            pre_commitment: preCommitment,
            evidence: {
                sticky_neighborhood: stickyNeighborhood,
                high_recurrence: highRecurrence,
                convergence,
                continuity,
            },
        };
    }

    _labelPreCommitment({ stickyNeighborhood, highRecurrence, convergence, continuity }) {
        if (continuity === "fragmented" || continuity === "novelty-driven") return "absent";
        if (stickyNeighborhood && highRecurrence && (convergence === "strong" || convergence === "moderate")) {
            return "emergent";
        }
        if (stickyNeighborhood || highRecurrence) {
            return "weak";
        }
        return "absent";
    }

    // -------------------------------------------------------------------------
    // Flags / notes
    // -------------------------------------------------------------------------

    _deriveOverlayFlags({ attentionCharacter, memoryCharacter, coordinationHints }) {
        const flags = [];

        if (attentionCharacter?.concentration === "high") flags.push("attention_concentrated");
        if (attentionCharacter?.persistence === "high") flags.push("attention_persistent");
        if (attentionCharacter?.volatility === "high") flags.push("attention_volatile");

        if (memoryCharacter?.recurrence_strength === "high") flags.push("memory_recurrent");
        if (memoryCharacter?.stability === "high") flags.push("memory_stable");

        if (coordinationHints?.pre_commitment === "emergent") flags.push("pre_commitment_emergent");

        return flags;
    }

    _buildNotes({ attentionCharacter, memoryCharacter, coordinationHints }) {
        const notes = [
            "Attention and memory labels are derived overlays over structural observations only.",
            "No semantic intent or trusted commitment is asserted.",
            "Pre-commitment is a cautious coordination hint, not authority or canon.",
        ];

        if (attentionCharacter?.volatility === "high") {
            notes.push("Attention-like focus is volatile under current transition/boundary conditions.");
        }

        if (memoryCharacter?.stability === "low") {
            notes.push("Memory-like stability is weak under current recurrence/convergence evidence.");
        }

        if (coordinationHints?.pre_commitment === "absent") {
            notes.push("No coordination persistence strong enough for even tentative pre-commitment labeling was observed.");
        }

        return notes;
    }

    // -------------------------------------------------------------------------
    // Small utilities
    // -------------------------------------------------------------------------

    _copyScope(scope) {
        return scope
            ? {
                stream_id: scope.stream_id ?? null,
                segment_ids: Array.isArray(scope.segment_ids) ? [...scope.segment_ids] : [],
                t_span: scope.t_span
                    ? {
                        t_start: scope.t_span.t_start ?? null,
                        t_end: scope.t_span.t_end ?? null,
                        duration_sec: scope.t_span.duration_sec ?? null,
                    }
                    : null,
            }
            : { stream_id: null, segment_ids: [], t_span: null };
    }

    _finiteOrZero(v) {
        return Number.isFinite(v) ? v : 0;
    }

    _safeRatio(a, b) {
        if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return 0;
        return a / b;
    }
}
