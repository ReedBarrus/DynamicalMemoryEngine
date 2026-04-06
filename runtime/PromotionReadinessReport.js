// runtime/PromotionReadinessReport.js

/**
 * PromotionReadinessReport
 *
 * Layer:
 *   Read-side runtime readiness helper.
 *   Not a pipeline operator. Not an authority-bearing artifact.
 *
 * Purpose:
 *   Summarize advisory readiness posture over already-derived evidence,
 *   what blockers remain, and what evidence is still insufficient.
 *
 * Boundary contract:
 *   - evidence only
 *   - not canon
 *   - not promotion
 *   - not ontology
 *   - not truth
 *   - does not mutate input result
 *   - does not promote memory
 *
 * Inputs:
 *   - completed DoorOneOrchestrator result
 *   - optional CrossRunDynamicsReport
 *
 * Sources:
 *   - semantic_overlay.trajectory
 *   - semantic_overlay.attention_memory
 *   - interpretation.* compatibility aliases only as fallback
 *   - optional cross-run reproducibility report
 */

export class PromotionReadinessReport {
    constructor(opts = {}) {
        this.cfg = {
            high_domain_count_for_high_readiness: opts.high_domain_count_for_high_readiness ?? 4,
            medium_domain_count_for_medium_readiness: opts.medium_domain_count_for_medium_readiness ?? 3,
        };
    }

    interpret(result, crossRunReport = null) {
        if (!result?.ok) {
            return {
                ok: false,
                error: "INVALID_INPUT",
                reasons: ["PromotionReadinessReport requires a successful DoorOneOrchestrator result"],
            };
        }

        const trajectory =
            result?.semantic_overlay?.trajectory ??
            result?.interpretation?.trajectory ??
            null;
        const attentionMemory =
            result?.semantic_overlay?.attention_memory ??
            result?.interpretation?.attention_memory ??
            null;

        if (!trajectory || !attentionMemory) {
            return {
                ok: false,
                error: "INVALID_INPUT",
                reasons: ["PromotionReadinessReport requires semantic_overlay.trajectory and semantic_overlay.attention_memory"],
            };
        }

        const scope = this._buildScope(result, crossRunReport);

        const evidenceDomains = {
            structural_stability: this._scoreStructuralStability(trajectory, result),
            recurrence_strength: this._scoreRecurrenceStrength(trajectory),
            segment_coherence: this._scoreSegmentCoherence(trajectory),
            transition_selectivity: this._scoreTransitionSelectivity(trajectory),
            attention_memory_alignment: this._scoreAttentionMemoryAlignment(attentionMemory),
            cross_run_reproducibility: this._scoreCrossRunReproducibility(crossRunReport),
        };

        const blockers = this._collectBlockers(evidenceDomains);
        const insufficiencies = this._collectInsufficiencies(evidenceDomains, crossRunReport);
        const promotionHints = this._buildPromotionHints(evidenceDomains, blockers, insufficiencies);
        const advisoryHorizon = this._buildAdvisoryHorizon(evidenceDomains, blockers, insufficiencies);
        const readinessSummary = this._summarizeReadiness(evidenceDomains, blockers, insufficiencies);
        const advisoryPosture = this._buildAdvisoryPosture(readinessSummary, blockers, insufficiencies);
        const semanticEnvelope = this._buildSemanticEnvelope({
            readinessSummary,
            blockers,
            insufficiencies,
            evidenceDomains,
        });
        const readinessFlags = this._deriveFlags(readinessSummary, evidenceDomains, blockers, insufficiencies);
        const notes = this._buildNotes(readinessSummary, blockers, insufficiencies, advisoryPosture);

        return {
            report_type: "runtime:promotion_readiness_report",
            report_kind: semanticEnvelope.report_kind,
            generated_from:
                "Door One substrate summaries, transition reports, trajectory interpretation, attention-memory semantic overlay, transition-selectivity heuristics, and optional cross-run comparison evidence only; advisory readiness overlay, not runtime truth, not approval, not promotion, not canon, not ontology",
            scope,
            query_class: semanticEnvelope.query_class,
            claim_ceiling: semanticEnvelope.claim_ceiling,
            primary_posture: semanticEnvelope.primary_posture,
            primary_descriptors: semanticEnvelope.primary_descriptors,
            secondary_descriptors: semanticEnvelope.secondary_descriptors,
            ...(semanticEnvelope.caution_posture ? { caution_posture: semanticEnvelope.caution_posture } : {}),
            evidence_refs: semanticEnvelope.evidence_refs,
            explicit_non_claims: semanticEnvelope.explicit_non_claims,
            advisory_posture: advisoryPosture,
            readiness_summary: readinessSummary,
            evidence_domains: evidenceDomains,
            blockers,
            insufficiencies,
            advisory_horizon: advisoryHorizon,
            promotion_hints: promotionHints,
            readiness_flags: readinessFlags,
            notes,
        };
    }

    _buildSemanticEnvelope({ readinessSummary, blockers, insufficiencies, evidenceDomains }) {
        return {
            report_kind: "promotion_readiness_advisory_overlay",
            query_class: "Q7_consultation_readiness",
            claim_ceiling: "readiness_only",
            primary_posture: this._derivePrimaryPosture(readinessSummary, blockers, insufficiencies),
            primary_descriptors: [
                `overall_readiness:${readinessSummary?.overall_readiness ?? "insufficient_data"}`,
                `blockers:${blockers?.length ?? 0}`,
                `insufficiencies:${insufficiencies?.length ?? 0}`,
            ].slice(0, 3),
            secondary_descriptors: [
                `cross_run:${evidenceDomains?.cross_run_reproducibility?.label ?? "insufficient_data"}`,
                `structural_stability:${evidenceDomains?.structural_stability?.label ?? "insufficient_data"}`,
            ].slice(0, 2),
            caution_posture: this._deriveCautionPosture(readinessSummary, blockers, insufficiencies),
            evidence_refs: [
                "semantic_overlay.trajectory",
                "semantic_overlay.attention_memory",
                "substrate.transition_report",
                "optional.cross_run_report",
            ],
            explicit_non_claims: [
                "not_truth_claim",
                "not_runtime_substance",
                "not_approval",
                "not_promotion",
                "not_canon",
            ],
        };
    }

    _derivePrimaryPosture(summary, blockers, insufficiencies) {
        if ((summary?.overall_readiness ?? "insufficient_data") === "insufficient_data") return "advisory_insufficient";
        if ((blockers?.length ?? 0) > 0) return "advisory_blocked";
        if ((summary?.overall_readiness ?? "low") === "high") return "advisory_supported";
        if ((summary?.overall_readiness ?? "low") === "medium") return "advisory_developing";
        if ((insufficiencies?.length ?? 0) > 0) return "advisory_cautious";
        return "advisory_limited";
    }

    _deriveCautionPosture(summary, blockers, insufficiencies) {
        if ((blockers?.length ?? 0) > 0) return "review_horizon_blocked";
        if ((summary?.overall_readiness ?? "insufficient_data") === "insufficient_data") return "insufficient_evidence";
        if ((insufficiencies?.length ?? 0) > 0) return "non_promotional";
        return null;
    }

    _buildScope(result, crossRunReport) {
        return {
            stream_id: result?.artifacts?.a1?.stream_id ?? null,
            segment_ids: Array.isArray(result?.substrate?.segment_ids) ? [...result.substrate.segment_ids] : [],
            t_span: result?.substrate?.t_span
                ? {
                    t_start: result.substrate.t_span.t_start ?? null,
                    t_end: result.substrate.t_span.t_end ?? null,
                    duration_sec: result.substrate.t_span.duration_sec ?? null,
                }
                : null,
            cross_run_context: {
                available: !!crossRunReport && crossRunReport.ok !== false,
                run_count: crossRunReport?.scope?.run_count ?? 0,
            },
        };
    }

    _scoreStructuralStability(trajectory, result) {
        const convergence = trajectory?.trajectory_character?.convergence ?? "insufficient_data";
        const motion = trajectory?.trajectory_character?.motion ?? "diffuse";
        const dominantShare = this._finiteOrZero(
            trajectory?.neighborhood_character?.evidence?.dominant_dwell_share
        );
        const transitionDensity = trajectory?.neighborhood_character?.transition_density ?? "low";

        let label = "low";
        if (convergence === "insufficient_data") label = "insufficient_data";
        else if (convergence === "strong" && motion === "stable" && dominantShare >= 0.5) label = "high";
        else if ((convergence === "moderate" || convergence === "strong") && transitionDensity !== "high") label = "medium";

        return {
            label,
            evidence: {
                convergence,
                motion,
                dominant_dwell_share: dominantShare,
                transition_density: transitionDensity,
                state_count: result?.substrate?.state_count ?? 0,
            },
        };
    }

    _scoreRecurrenceStrength(trajectory) {
        const recurrence = trajectory?.neighborhood_character?.recurrence_strength ?? "low";
        const totalReEntries = this._finiteOrZero(
            trajectory?.neighborhood_character?.evidence?.total_re_entries
        );
        const totalNeighborhoods = this._finiteOrZero(
            trajectory?.neighborhood_character?.evidence?.total_neighborhoods_observed
        );

        const label =
            totalNeighborhoods === 0 ? "insufficient_data" :
                recurrence === "high" ? "high" :
                    recurrence === "medium" ? "medium" :
                        "low";

        return {
            label,
            evidence: {
                recurrence_strength: recurrence,
                total_re_entries: totalReEntries,
                total_neighborhoods_observed: totalNeighborhoods,
            },
        };
    }

    _scoreSegmentCoherence(trajectory) {
        const continuity = trajectory?.segment_character?.continuity ?? "mixed";
        const boundaryDensity = trajectory?.segment_character?.boundary_density ?? "low";

        const label =
            continuity === "smooth" ? "high" :
                continuity === "mixed" ? "medium" :
                    continuity === "novelty-driven" || continuity === "fragmented" ? "low" :
                        "insufficient_data";

        return {
            label,
            evidence: {
                continuity,
                boundary_density: boundaryDensity,
                segment_transition_count: this._finiteOrZero(
                    trajectory?.segment_character?.evidence?.segment_transition_count
                ),
            },
        };
    }

    _scoreTransitionSelectivity(trajectory) {
        const occupancy = trajectory?.neighborhood_character?.occupancy ?? "sparse";
        const transitionDensity = trajectory?.neighborhood_character?.transition_density ?? "low";
        const motion = trajectory?.trajectory_character?.motion ?? "diffuse";
        const boundaryDensity = trajectory?.segment_character?.boundary_density ?? "low";

        let label = "low";

        if (occupancy === "sparse") {
            label = "insufficient_data";
        } else if (
            (occupancy === "sticky" || occupancy === "recurrent") &&
            transitionDensity === "low" &&
            boundaryDensity !== "high"
        ) {
            label = "high";
        } else if (
            (occupancy === "recurrent" || occupancy === "hopping") &&
            (transitionDensity === "medium" || boundaryDensity === "medium")
        ) {
            label = "medium";
        } else if (
            occupancy === "diffuse" ||
            transitionDensity === "high" ||
            motion === "diffuse"
        ) {
            label = "low";
        }

        return {
            label,
            evidence: {
                occupancy,
                transition_density: transitionDensity,
                motion,
                boundary_density: boundaryDensity,
            },
        };
    }

    _scoreAttentionMemoryAlignment(attentionMemory) {
        const supportPersistence = attentionMemory?.support_persistence?.posture ?? "support_only";
        const reusePressure = attentionMemory?.reuse_pressure?.posture ?? "low";
        const memoryCandidate = attentionMemory?.memory_candidate_posture?.posture ?? "no_memory_class_claim";
        const concentration =
            attentionMemory?.support_persistence?.evidence?.attention_concentration ??
            attentionMemory?.attention_character?.concentration ??
            "low";
        const persistence =
            attentionMemory?.support_persistence?.evidence?.attention_persistence ??
            attentionMemory?.attention_character?.persistence ??
            "low";

        let label = "low";
        if (
            supportPersistence === "sustained" &&
            reusePressure !== "elevated" &&
            memoryCandidate !== "no_memory_class_claim"
        ) {
            label = "high";
        } else if (
            supportPersistence !== "support_only" &&
            reusePressure !== "elevated"
        ) {
            label = "medium";
        }

        return {
            label,
            evidence: {
                support_persistence: supportPersistence,
                reuse_pressure: reusePressure,
                memory_candidate_posture: memoryCandidate,
                attention_concentration: concentration,
                attention_persistence: persistence,
            },
        };
    }

    _scoreCrossRunReproducibility(crossRunReport) {
        if (!crossRunReport || crossRunReport.ok === false) {
            return {
                label: "insufficient_data",
                evidence: {
                    available: false,
                    overall_reproducibility: "insufficient_data",
                },
            };
        }

        return {
            label: crossRunReport?.reproducibility_summary?.overall_reproducibility ?? "insufficient_data",
            evidence: {
                available: true,
                overall_reproducibility: crossRunReport?.reproducibility_summary?.overall_reproducibility ?? "insufficient_data",
                neighborhood_reproducibility: crossRunReport?.reproducibility_summary?.neighborhood_reproducibility ?? "insufficient_data",
                overlay_reproducibility: crossRunReport?.reproducibility_summary?.overlay_reproducibility ?? "insufficient_data",
            },
        };
    }

    _collectBlockers(domains) {
        const blockers = [];

        if (domains.structural_stability.label === "low") {
            blockers.push({
                code: "LOW_STRUCTURAL_STABILITY",
                severity: "high",
                reason: "Structural stability evidence is weak",
                evidence: domains.structural_stability.evidence,
            });
        }

        if (domains.segment_coherence.label === "low") {
            blockers.push({
                code: "LOW_SEGMENT_COHERENCE",
                severity: "high",
                reason: "Segment behavior remains fragmented or novelty-driven",
                evidence: domains.segment_coherence.evidence,
            });
        }

        if (domains.transition_selectivity.label === "low") {
            blockers.push({
                code: "LOW_TRANSITION_SELECTIVITY",
                severity: "medium",
                reason: "Transition structure remains too diffuse or weakly constrained",
                evidence: domains.transition_selectivity.evidence,
            });
        }

        if (domains.cross_run_reproducibility.label === "low") {
            blockers.push({
                code: "LOW_REPRODUCIBILITY",
                severity: "high",
                reason: "Cross-run evidence does not yet support stable repeatability",
                evidence: domains.cross_run_reproducibility.evidence,
            });
        }

        return blockers;
    }

    _collectInsufficiencies(domains, crossRunReport) {
        const insufficiencies = [];

        for (const [name, domain] of Object.entries(domains)) {
            if (domain.label === "insufficient_data") {
                insufficiencies.push({
                    code: `INSUFFICIENT_${name.toUpperCase()}`,
                    reason: `${name} does not yet have enough evidence`,
                    evidence: domain.evidence,
                });
            }
        }

        if (!crossRunReport) {
            insufficiencies.push({
                code: "NO_CROSS_RUN_CONTEXT",
                reason: "No cross-run comparison evidence was supplied",
                evidence: { available: false },
            });
        }

        return insufficiencies;
    }

    _buildPromotionHints(domains, blockers, insufficiencies) {
        const entries = Object.entries(domains);
        return {
            eligible_domains: entries.filter(([, d]) => d.label === "high").map(([k]) => k),
            blocked_domains: blockers.map(b => b.code),
            next_evidence_targets: insufficiencies.map(i => i.code),
        };
    }

    _buildAdvisoryHorizon(domains, blockers, insufficiencies) {
        const entries = Object.entries(domains);
        return {
            supported_domains: entries.filter(([, d]) => d.label === "high").map(([k]) => k),
            blocked_domains: blockers.map(b => b.code),
            next_evidence_targets: insufficiencies.map(i => i.code),
        };
    }

    _summarizeReadiness(domains, blockers, insufficiencies) {
        const labels = Object.values(domains).map(d => d.label);
        const highCount = labels.filter(l => l === "high").length;
        const mediumCount = labels.filter(l => l === "medium").length;

        let overall = "low";
        if (insufficiencies.length >= 3 && highCount === 0 && mediumCount === 0) overall = "insufficient_data";
        else if (blockers.length === 0 && highCount >= this.cfg.high_domain_count_for_high_readiness) overall = "high";
        else if (highCount + mediumCount >= this.cfg.medium_domain_count_for_medium_readiness) overall = "medium";

        const confidence_posture =
            overall === "high" ? "supported" :
                overall === "medium" ? "developing" :
                    "cautious";

        return {
            overall_readiness: overall,
            confidence_posture,
            blocker_count: blockers.length,
            insufficiency_count: insufficiencies.length,
        };
    }

    _buildAdvisoryPosture(summary, blockers, insufficiencies) {
        return {
            posture: this._derivePrimaryPosture(summary, blockers, insufficiencies),
            blocker_posture: blockers.length > 0 ? "blocked" : "clear",
            insufficiency_posture: insufficiencies.length > 0 ? "evidence_gaps_live" : "evidence_gaps_bounded",
            review_horizon: this._deriveReviewHorizon(summary, blockers, insufficiencies),
        };
    }

    _deriveReviewHorizon(summary, blockers, insufficiencies) {
        if ((summary?.overall_readiness ?? "insufficient_data") === "insufficient_data") return "defer";
        if ((blockers?.length ?? 0) > 0) return "blocked";
        if ((summary?.overall_readiness ?? "low") === "high") return "supported";
        if ((summary?.overall_readiness ?? "low") === "medium") return "developing";
        if ((insufficiencies?.length ?? 0) > 0) return "cautious";
        return "limited";
    }

    _deriveFlags(summary, domains, blockers, insufficiencies) {
        const flags = [];

        if (domains.cross_run_reproducibility.label === "high") flags.push("cross_run_supported");
        if (domains.attention_memory_alignment.label === "high") flags.push("overlay_alignment_supported");
        if (domains.structural_stability.label === "high") flags.push("structurally_stable");
        if (domains.recurrence_strength.label === "high") flags.push("recurrently_supported");
        if (domains.transition_selectivity.label === "high") flags.push("transition_selective");
        if (domains.segment_coherence.label === "low") flags.push("segment_fragmentation_detected");
        if (summary.overall_readiness === "high" && blockers.length === 0) flags.push("review_horizon_supported");
        if (insufficiencies.some(i => i.code === "NO_CROSS_RUN_CONTEXT")) flags.push("cross_run_missing");

        return flags;
    }

    _buildNotes(summary, blockers, insufficiencies, advisoryPosture) {
        const notes = [
            "Promotion readiness is an advisory downstream surface only and does not imply approval or promotion.",
            "Readiness summarizes evidence, blockers, insufficiencies, and review horizon only.",
            "Repeated structure strengthens evidence but does not prove ontology or true dynamical basin membership.",
        ];

        if (summary.overall_readiness === "insufficient_data") {
            notes.push("Overall readiness is limited by insufficient evidence.");
        }
        if (blockers.length > 0) {
            notes.push("At least one blocker remains before future promotion review would be meaningful.");
        }
        if (insufficiencies.length > 0) {
            notes.push("Missing evidence should be addressed before stronger readiness claims are made.");
        }
        if (advisoryPosture?.review_horizon === "supported") {
            notes.push("Supported review horizon remains advisory only and is not approval, promotion, or canon activation.");
        }

        return notes;
    }

    _finiteOrZero(v) {
        return Number.isFinite(v) ? v : 0;
    }
}
