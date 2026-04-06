// runtime/CanonCandidateDossier.js

/**
 * CanonCandidateDossier
 *
 * Layer:
 *   Read-side runtime canon-review assembler.
 *   Not a pipeline operator. Not an authority-bearing artifact.
 *
 * Purpose:
 *   Assemble a bounded, non-canonical review packet from already-lawful
 *   Door One evidence surfaces.
 *
 * Boundary contract:
 *   - not canon
 *   - not promotion
 *   - not ontology
 *   - not truth
 *   - not a pipeline artifact
 *   - does not mutate input result or reports
 *   - does not decide promotion
 *   - does not emit C1
 *
 * Canon promotion contract (v0.1, embedded):
 *
 *   1. Dossier status
 *      - A dossier is an untrusted candidate packet for explicit review.
 *      - A dossier is not C1.
 *      - A dossier must never be treated as canon or as a semi-canonical artifact.
 *
 *   2. Admissible claim types
 *      - "stable_structural_identity"
 *      - "reproducible_recurrent_regime"
 *      - "candidate_structural_regime"
 *      - Additional claim types must be explicitly added later.
 *
 *   3. Minimum required evidence surfaces
 *      - completed DoorOneOrchestrator result
 *      - semantic_overlay.trajectory
 *      - semantic_overlay.attention_memory
 *      - PromotionReadinessReport (supplied or internally derived)
 *      - optional CrossRunDynamicsReport
 *
 *   4. Review posture
 *      - trust_status must begin as "untrusted_candidate"
 *      - review_status must begin as "unreviewed"
 *      - intended_canon_target may be "C1" only as a proposed review target,
 *        never as an achieved status
 *
 *   5. Promotion recommendation semantics
 *      - "defer_review" means evidence is incomplete or blocked
 *      - "weak_review" means review may be meaningful but blockers remain
 *      - "eligible_for_review" means evidence may justify explicit ConsensusOp review
 *      - none of these states mean promotion has occurred
 *
 *   6. ConsensusOp handoff
 *      - ConsensusOp may review a dossier
 *      - ConsensusOp must emit an explicit defer / reject / promote outcome later
 *      - canon must never arise implicitly from dossier assembly
 */

import { PromotionReadinessReport } from "./PromotionReadinessReport.js";

export class CanonCandidateDossier {
    /**
     * @param {Object} [opts]
     * @param {string} [opts.default_claim_type="candidate_structural_regime"]
     * @param {string} [opts.default_claim_label="candidate structural regime"]
     * @param {string} [opts.intended_canon_target="C1"]
     * @param {PromotionReadinessReport} [opts.promotionReadinessReport]
     */
    constructor(opts = {}) {
        this.cfg = {
            default_claim_type: opts.default_claim_type ?? "candidate_structural_regime",
            default_claim_label: opts.default_claim_label ?? "candidate structural regime",
            intended_canon_target: opts.intended_canon_target ?? "C1",
        };

        this._readiness = opts.promotionReadinessReport ?? new PromotionReadinessReport();
    }

    /**
     * Assemble a non-canonical canon candidate dossier.
     *
     * @param {Object} result - completed DoorOneOrchestrator result
     * @param {Object|null} [crossRunReport=null] - optional CrossRunDynamicsReport
     * @param {Object|null} [promotionReadinessReport=null] - optional PromotionReadinessReport
     * @param {Object} [opts]
     * @param {string} [opts.claim_type]
     * @param {string} [opts.claim_label]
     * @param {string} [opts.claim_summary]
     * @returns {Object}
     */
    assemble(result, crossRunReport = null, promotionReadinessReport = null, opts = {}) {
        if (!result?.ok) {
            return {
                ok: false,
                error: "INVALID_INPUT",
                reasons: ["CanonCandidateDossier requires a successful DoorOneOrchestrator result"],
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
                reasons: ["CanonCandidateDossier requires semantic_overlay.trajectory and semantic_overlay.attention_memory"],
            };
        }

        const readiness =
            promotionReadinessReport ??
            this._readiness.interpret(result, crossRunReport);

        if (!readiness || readiness.ok === false) {
            return {
                ok: false,
                error: "INVALID_READINESS",
                reasons: ["CanonCandidateDossier requires a valid PromotionReadinessReport"],
            };
        }

        const scope = this._buildScope(result, crossRunReport);
        const candidateClaim = this._buildCandidateClaim(result, readiness, opts);
        const sourceRefs = this._buildSourceRefs(result, crossRunReport, readiness);
        const evidenceBundle = this._buildEvidenceBundle(result, crossRunReport, readiness);
        const blockers = this._copyArray(readiness?.blockers);
        const insufficiencies = this._copyArray(readiness?.insufficiencies);
        const promotionRecommendation = this._buildPromotionRecommendation(readiness, blockers, insufficiencies);
        const reviewPackagingPosture = this._buildReviewPackagingPosture(readiness, blockers, insufficiencies);
        const reviewHorizon = this._buildReviewHorizon(readiness, blockers, insufficiencies);
        const receipts = this._buildReceipts(result, crossRunReport, readiness);
        const semanticEnvelope = this._buildSemanticEnvelope({
            readiness,
            blockers,
            insufficiencies,
            reviewPackagingPosture,
        });
        const notes = this._buildNotes(readiness, reviewPackagingPosture);

        return {
            dossier_type: "runtime:canon_candidate_dossier",
            report_kind: semanticEnvelope.report_kind,
            candidate_id: this._buildCandidateId(result, readiness, candidateClaim),
            generated_at: this._generatedAt(result),
            generated_from:
                "Door One runtime evidence only; downstream candidate review packaging, not runtime truth, not approval, not promotion, not canon, not ontology",
            scope,
            query_class: semanticEnvelope.query_class,
            claim_ceiling: semanticEnvelope.claim_ceiling,
            primary_posture: semanticEnvelope.primary_posture,
            primary_descriptors: semanticEnvelope.primary_descriptors,
            secondary_descriptors: semanticEnvelope.secondary_descriptors,
            ...(semanticEnvelope.caution_posture ? { caution_posture: semanticEnvelope.caution_posture } : {}),
            evidence_refs: semanticEnvelope.evidence_refs,
            explicit_non_claims: semanticEnvelope.explicit_non_claims,
            review_packaging_posture: reviewPackagingPosture,
            review_horizon: reviewHorizon,
            review_routing_posture: this._buildReviewRoutingPosture(
                promotionRecommendation,
                blockers,
                insufficiencies
            ),
            candidate_claim: candidateClaim,
            source_refs: sourceRefs,
            evidence_bundle: evidenceBundle,
            blockers,
            insufficiencies,
            promotion_recommendation: promotionRecommendation,
            receipts,
            notes,
        };
    }

    _buildSemanticEnvelope({ readiness, blockers, insufficiencies, reviewPackagingPosture }) {
        return {
            report_kind: "canon_candidate_review_packaging",
            query_class: "Q6_review",
            claim_ceiling: "review_only",
            primary_posture: this._derivePrimaryPosture(readiness, blockers, insufficiencies),
            primary_descriptors: [
                `review_horizon:${reviewPackagingPosture?.review_horizon ?? "defer"}`,
                `blockers:${blockers?.length ?? 0}`,
                `insufficiencies:${insufficiencies?.length ?? 0}`,
            ].slice(0, 3),
            secondary_descriptors: [
                `readiness:${readiness?.readiness_summary?.overall_readiness ?? "insufficient_data"}`,
                `trust_status:untrusted_candidate`,
            ].slice(0, 2),
            caution_posture: this._deriveCautionPosture(readiness, blockers, insufficiencies),
            evidence_refs: [
                "semantic_overlay.trajectory",
                "semantic_overlay.attention_memory",
                "source_refs.artifact_refs",
                "source_refs.report_refs",
                "evidence_bundle",
                "readiness_overlay.promotion_readiness",
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

    _derivePrimaryPosture(readiness, blockers, insufficiencies) {
        const overall = readiness?.readiness_summary?.overall_readiness ?? "insufficient_data";
        if (overall === "insufficient_data") return "review_packaging_insufficient";
        if ((blockers?.length ?? 0) > 0) return "review_packaging_blocked";
        if (overall === "high") return "review_packaging_supported";
        if (overall === "medium") return "review_packaging_narrowed";
        if ((insufficiencies?.length ?? 0) > 0) return "review_packaging_cautious";
        return "review_packaging_limited";
    }

    _deriveCautionPosture(readiness, blockers, insufficiencies) {
        const overall = readiness?.readiness_summary?.overall_readiness ?? "insufficient_data";
        if ((blockers?.length ?? 0) > 0) return "review_required";
        if (overall === "insufficient_data") return "insufficient_evidence";
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

    _buildCandidateClaim(result, readiness, opts) {
        const claimType = opts.claim_type ?? this.cfg.default_claim_type;
        const claimLabel = opts.claim_label ?? this.cfg.default_claim_label;
        const claimSummary =
            opts.claim_summary ??
            this._defaultClaimSummary(readiness);

        return {
            claim_type: claimType,
            claim_label: claimLabel,
            claim_summary: claimSummary,
            intended_canon_target: this.cfg.intended_canon_target,
            trust_status: "untrusted_candidate",
        };
    }

    _defaultClaimSummary(readiness) {
        const overall = readiness?.readiness_summary?.overall_readiness ?? "insufficient_data";
        const posture = readiness?.readiness_summary?.confidence_posture ?? "cautious";

        if (overall === "high") {
            return "Persistent recurrent structural regime with comparatively strong supporting evidence for future review";
        }
        if (overall === "medium") {
            return "Candidate structural regime with developing support and remaining review caveats";
        }
        if (overall === "low") {
            return "Weakly supported candidate structural regime with substantive blockers";
        }
        return "Insufficiently supported candidate structural regime pending additional evidence";
    }

    _buildSourceRefs(result, crossRunReport, readiness) {
        const trajectory =
            result?.semantic_overlay?.trajectory ??
            result?.interpretation?.trajectory ??
            null;
        const attentionMemory =
            result?.semantic_overlay?.attention_memory ??
            result?.interpretation?.attention_memory ??
            null;

        return {
            artifact_refs: {
                a1_ref: result?.artifacts?.a1?.stream_id ?? null,
                h1_refs: this._pluckIds(result?.artifacts?.h1s, "state_id"),
                m1_refs: this._pluckIds(result?.artifacts?.m1s, "state_id"),
                anomaly_refs: this._pluckIds(result?.artifacts?.anomaly_reports, "report_id"),
                basin_set_refs: this._pluckIds(result?.artifacts?.basin_sets, "artifact_id"),
            },
            report_refs: {
                trajectory_report_type: trajectory?.report_type ?? null,
                attention_memory_report_type: attentionMemory?.report_type ?? null,
                cross_run_report_type: crossRunReport?.report_type ?? null,
                promotion_readiness_report_type: readiness?.report_type ?? null,
            },
        };
    }

    _buildEvidenceBundle(result, crossRunReport, readiness) {
        const trajectory =
            result?.semantic_overlay?.trajectory ??
            result?.interpretation?.trajectory ??
            {};
        const attentionMemory =
            result?.semantic_overlay?.attention_memory ??
            result?.interpretation?.attention_memory ??
            {};
        const pairwise = Array.isArray(crossRunReport?.pairwise_comparisons)
            ? crossRunReport.pairwise_comparisons
            : [];

        return {
            trajectory: {
                convergence: trajectory?.trajectory_character?.convergence ?? "unknown",
                motion: trajectory?.trajectory_character?.motion ?? "unknown",
                occupancy: trajectory?.neighborhood_character?.occupancy ?? "unknown",
                transition_density: trajectory?.neighborhood_character?.transition_density ?? "unknown",
                recurrence_strength: trajectory?.neighborhood_character?.recurrence_strength ?? "unknown",
                continuity: trajectory?.segment_character?.continuity ?? "unknown",
                boundary_density: trajectory?.segment_character?.boundary_density ?? "unknown",
            },

            attention_memory: {
                attention_concentration: attentionMemory?.attention_character?.concentration ?? "unknown",
                attention_persistence: attentionMemory?.attention_character?.persistence ?? "unknown",
                attention_volatility: attentionMemory?.attention_character?.volatility ?? "unknown",
                support_persistence: attentionMemory?.support_persistence?.posture ?? "unknown",
                reuse_pressure: attentionMemory?.reuse_pressure?.posture ?? "unknown",
                memory_candidate_posture: attentionMemory?.memory_candidate_posture?.posture ?? "unknown",
                memory_recurrence_strength: attentionMemory?.memory_character?.recurrence_strength ?? "unknown",
                memory_persistence: attentionMemory?.memory_character?.persistence ?? "unknown",
                memory_stability: attentionMemory?.memory_character?.stability ?? "unknown",
            },

            cross_run: {
                reproducibility: crossRunReport?.reproducibility_summary?.overall_reproducibility ?? "insufficient_data",
                similarity_ratio: this._mean(
                    pairwise.map(p => this._finiteOrNull(p?.evidence?.similarity_ratio)).filter(v => v !== null)
                ) ?? 0,
                supporting_runs: this._supportingRuns(crossRunReport),
                diverging_runs: this._divergingRuns(crossRunReport),
            },

            readiness: {
                readiness_label: readiness?.readiness_summary?.overall_readiness ?? "insufficient_data",
                evidence_domains: this._domainLabels(readiness?.evidence_domains),
            },
        };
    }

    _buildPromotionRecommendation(readiness, blockers, insufficiencies) {
        const overall = readiness?.readiness_summary?.overall_readiness ?? "insufficient_data";

        let recommendation = "defer_review";
        if (overall === "high" && blockers.length === 0) recommendation = "eligible_for_review";
        else if (overall === "medium") recommendation = "weak_review";

        return {
            review_status: "unreviewed",
            recommendation,
            compatibility_posture: "legacy_review_routing_name_only",
            route_horizon: this._deriveReviewRoutingHorizon(recommendation, blockers, insufficiencies),
            explicit_non_claims: [
                "not_promotion",
                "not_approval",
                "not_canon",
            ],
            rationale: [
                `overall_readiness=${overall}`,
                `blockers=${blockers.length}`,
                `insufficiencies=${insufficiencies.length}`,
                "routing_only=review_boundary",
            ],
            minimum_next_evidence: [
                ...insufficiencies.map(i => i.code),
                ...blockers.map(b => b.code),
            ],
        };
    }

    _buildReviewRoutingPosture(promotionRecommendation, blockers, insufficiencies) {
        return {
            posture: "review_routing_only",
            compatibility_surface: "promotion_recommendation",
            route_status: promotionRecommendation?.recommendation ?? "defer_review",
            route_horizon: promotionRecommendation?.route_horizon ?? "defer",
            blocker_posture: blockers.length > 0 ? "blocked" : "clear",
            insufficiency_posture: insufficiencies.length > 0 ? "evidence_gaps_live" : "evidence_gaps_bounded",
            explicit_non_claims: [
                "not_promotion",
                "not_approval",
                "not_canon",
            ],
        };
    }

    _deriveReviewRoutingHorizon(recommendation, blockers, insufficiencies) {
        if ((blockers?.length ?? 0) > 0) return "blocked";
        if ((insufficiencies?.length ?? 0) > 0) return "defer";
        if (recommendation === "eligible_for_review") return "review_supported";
        if (recommendation === "weak_review") return "review_narrowed";
        return "defer";
    }

    _buildReviewPackagingPosture(readiness, blockers, insufficiencies) {
        return {
            posture: this._derivePrimaryPosture(readiness, blockers, insufficiencies),
            candidate_status: "untrusted_candidate",
            blocker_posture: blockers.length > 0 ? "blocked" : "clear",
            insufficiency_posture: insufficiencies.length > 0 ? "evidence_gaps_live" : "evidence_gaps_bounded",
            review_horizon: this._deriveReviewHorizon(readiness, blockers, insufficiencies),
        };
    }

    _buildReviewHorizon(readiness, blockers, insufficiencies) {
        return {
            status: this._deriveReviewHorizon(readiness, blockers, insufficiencies),
            next_evidence_targets: [
                ...insufficiencies.map(i => i.code),
                ...blockers.map(b => b.code),
            ],
        };
    }

    _deriveReviewHorizon(readiness, blockers, insufficiencies) {
        const overall = readiness?.readiness_summary?.overall_readiness ?? "insufficient_data";
        if (overall === "insufficient_data") return "defer";
        if ((blockers?.length ?? 0) > 0) return "blocked";
        if (overall === "high") return "supported";
        if (overall === "medium") return "narrowed";
        if ((insufficiencies?.length ?? 0) > 0) return "cautious";
        return "limited";
    }

    _buildReceipts(result, crossRunReport, readiness) {
        const sourceRefs = this._buildSourceRefs(result, crossRunReport, readiness);

        return {
            provenance_complete: !!sourceRefs?.artifact_refs?.a1_ref,
            cross_run_required_for_claim: true,
            replayable_support_present: this._hasReplayableSupport(sourceRefs),
            legitimacy_notes: [
                "candidate packet assembled from read-side evidence only",
                "promotion decision remains explicit and external to dossier assembly",
            ],
        };
    }

    _buildNotes(readiness, reviewPackagingPosture) {
        const notes = [
            "This dossier is downstream review packaging only and is not runtime truth, approval, promotion, or canon.",
            "This dossier does not promote memory or establish identity closure by packaging.",
            "promotion_recommendation is a retained compatibility label for review routing only and does not imply promotion.",
            "ConsensusOp or later canon review must make any later review decision explicitly.",
        ];

        const overall = readiness?.readiness_summary?.overall_readiness ?? "insufficient_data";
        if (overall === "insufficient_data") {
            notes.push("Candidate review remains limited by insufficient evidence.");
        }
        if (reviewPackagingPosture?.review_horizon === "supported") {
            notes.push("Supported review horizon remains bounded review packaging only and does not imply approval, promotion, or canon activation.");
        }

        return notes;
    }

    _buildCandidateId(result, readiness, candidateClaim) {
        const streamId = result?.artifacts?.a1?.stream_id ?? "unknown_stream";
        const seed = [
            streamId,
            candidateClaim?.claim_type ?? "unknown_claim",
            readiness?.readiness_summary?.overall_readiness ?? "insufficient_data",
            result?.substrate?.state_count ?? 0,
            result?.substrate?.segment_count ?? 0,
        ].join("|");

        return `ccd:${streamId}:${this._stableHash(seed)}`;
    }

    _generatedAt(result) {
        return result?.run_label ?? "runtime-generated";
    }

    _supportingRuns(crossRunReport) {
        if (!crossRunReport || crossRunReport.ok === false) return [];
        const labels = new Set();
        for (const row of crossRunReport?.pairwise_comparisons ?? []) {
            if (row?.similarity === "high" || row?.similarity === "medium") {
                if (row.run_a) labels.add(row.run_a);
                if (row.run_b) labels.add(row.run_b);
            }
        }
        return [...labels];
    }

    _divergingRuns(crossRunReport) {
        if (!crossRunReport || crossRunReport.ok === false) return [];
        const labels = new Set();
        for (const row of crossRunReport?.pairwise_comparisons ?? []) {
            if (row?.similarity === "low") {
                if (row.run_a) labels.add(row.run_a);
                if (row.run_b) labels.add(row.run_b);
            }
        }
        return [...labels];
    }

    _domainLabels(domains) {
        const out = {};
        for (const [k, v] of Object.entries(domains ?? {})) {
            out[k] = v?.label ?? "insufficient_data";
        }
        return out;
    }

    _hasReplayableSupport(sourceRefs) {
        return (
            Array.isArray(sourceRefs?.artifact_refs?.h1_refs) &&
            sourceRefs.artifact_refs.h1_refs.length > 0
        );
    }

    _pluckIds(arr, key) {
        if (!Array.isArray(arr)) return [];
        return arr.map(x => x?.[key]).filter(Boolean);
    }

    _copyArray(arr) {
        return Array.isArray(arr) ? JSON.parse(JSON.stringify(arr)) : [];
    }

    _finiteOrNull(v) {
        return Number.isFinite(v) ? v : null;
    }

    _mean(vals) {
        if (!Array.isArray(vals) || vals.length === 0) return null;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
    }

    _stableHash(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i += 1) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return (h >>> 0).toString(16);
    }
}
