// operators/consensus/ConsensusOp.js

/**
 * ConsensusOp
 *
 * Layer:
 *   Canon boundary review gate.
 *   Promotion-only boundary operator.
 *
 * Purpose:
 *   Review a CanonCandidateDossier under explicit legitimacy criteria and return
 *   a bounded review outcome.
 *
 * Boundary contract:
 *   - explicit promotion boundary
 *   - not a normal runtime transform
 *   - does not silently emit canon
 *   - does not treat runtime evidence as truth
 *   - does not mutate dossier input
 *   - review outcome must be explicit
 *
 * Inputs:
 *   - CanonCandidateDossier (runtime review packet)
 *   - EpochContext
 *   - consensus policy
 *
 * v0.1 bounded behavior:
 *   - validate dossier admissibility
 *   - validate review context
 *   - review blockers / insufficiencies / recommendation posture
 *   - emit one of:
 *       * "defer"
 *       * "reject"
 *       * "eligible_for_promotion"
 *   - emit review_receipt
 *   - DO NOT mint C1
 *
 * Path to true canon activation (future bounded step):
 *   v0.1  review gate only
 *   v0.2  explicit promote path may emit C1 CanonicalState
 *         only when:
 *           - claim type is admissible
 *           - dossier review outcome is promotion-eligible
 *           - legitimacy checks pass
 *           - settlement / epoch context is present
 *           - canonical receipts are emitted explicitly
 *
 * Review semantics:
 *   - defer:
 *       evidence incomplete, insufficiencies remain, or review should wait
 *   - reject:
 *       inadmissible claim, invalid dossier, or legitimacy clearly fails
 *   - eligible_for_promotion:
 *       dossier is reviewable and may proceed to a later explicit canon-mint step
 *
 * Admissible claim types (v0.1):
 *   - stable_structural_identity
 *   - reproducible_recurrent_regime
 *   - candidate_structural_regime
 *
 * Output:
 *   Plain-data review result with review_receipt.
 *   Not C1 in v0.1.
 */

export class ConsensusOp {
    /**
     * @param {Object} [opts]
     */
    constructor(opts = {}) {
        this.operator_id = "ConsensusOp";
        this.operator_version = "0.1.0";
        this.default_policy_id = opts.default_policy_id ?? "consensus.default.v0_1";

        this.allowedClaimTypes = new Set([
            "stable_structural_identity",
            "reproducible_recurrent_regime",
            "candidate_structural_regime",
        ]);
    }

    /**
     * Review a canon candidate dossier.
     *
     * @param {Object} dossier
     * @param {Object} epochContext
     * @param {Object} [policy={}]
     * @returns {Object}
     */
    review(dossier, epochContext, policy = {}) {
        const validation = this._validateInputs(dossier, epochContext, policy);
        if (!validation.ok) {
            return validation;
        }

        const effectivePolicy = this._normalizePolicy(policy);

        const legitimacyChecks = this._runLegitimacyChecks(dossier, epochContext, effectivePolicy);
        const blockers = Array.isArray(dossier?.blockers) ? this._copy(dossier.blockers) : [];
        const insufficiencies = Array.isArray(dossier?.insufficiencies) ? this._copy(dossier.insufficiencies) : [];
        const recommendation = dossier?.promotion_recommendation?.recommendation ?? "defer_review";

        const outcome = this._decideOutcome({
            dossier,
            legitimacyChecks,
            blockers,
            insufficiencies,
            recommendation,
            policy: effectivePolicy,
        });

        return {
            ok: true,
            result: outcome.result,
            review_receipt: {
                operator_id: this.operator_id,
                operator_version: this.operator_version,
                policy_id: effectivePolicy.policy_id,
                dossier_id: dossier?.candidate_id ?? null,
                claim_type: dossier?.candidate_claim?.claim_type ?? null,
                epoch_id: epochContext?.epoch_id ?? null,
                legitimacy_checks: legitimacyChecks,
                blockers_considered: blockers.map(b => b?.code ?? b).filter(Boolean),
                insufficiencies_considered: insufficiencies.map(i => i?.code ?? i).filter(Boolean),
                rationale: outcome.rationale,
                canonical_state_emitted: false,
            },
        };
    }

    _validateInputs(dossier, epochContext, policy) {
        if (!dossier || typeof dossier !== "object") {
            return {
                ok: false,
                error: "INVALID_DOSSIER",
                reasons: ["ConsensusOp requires a canon candidate dossier object"],
            };
        }

        if (dossier?.dossier_type !== "runtime:canon_candidate_dossier") {
            return {
                ok: false,
                error: "INVALID_DOSSIER",
                reasons: ["ConsensusOp requires dossier_type=runtime:canon_candidate_dossier"],
            };
        }

        if (!epochContext || typeof epochContext !== "object") {
            return {
                ok: false,
                error: "INVALID_EPOCH_CONTEXT",
                reasons: ["ConsensusOp requires an epoch context object"],
            };
        }

        if (!epochContext?.epoch_id) {
            return {
                ok: false,
                error: "INVALID_EPOCH_CONTEXT",
                reasons: ["epochContext.epoch_id is required"],
            };
        }

        const claimType = dossier?.candidate_claim?.claim_type ?? null;
        if (!this.allowedClaimTypes.has(claimType)) {
            return {
                ok: false,
                error: "INADMISSIBLE_CLAIM_TYPE",
                reasons: [`Claim type is not admissible: ${claimType}`],
            };
        }

        if (dossier?.candidate_claim?.trust_status !== "untrusted_candidate") {
            return {
                ok: false,
                error: "INVALID_DOSSIER_STATUS",
                reasons: ["candidate_claim.trust_status must be untrusted_candidate at review time"],
            };
        }

        const reviewStatus = dossier?.promotion_recommendation?.review_status ?? null;
        if (reviewStatus !== "unreviewed") {
            return {
                ok: false,
                error: "INVALID_DOSSIER_STATUS",
                reasons: ["promotion_recommendation.review_status must be unreviewed at review time"],
            };
        }

        if (policy != null && typeof policy !== "object") {
            return {
                ok: false,
                error: "INVALID_POLICY",
                reasons: ["ConsensusOp policy must be an object when supplied"],
            };
        }

        return { ok: true };
    }

    _normalizePolicy(policy) {
        return {
            policy_id: policy?.policy_id ?? this.default_policy_id,
            require_cross_run_for_strong_claims: policy?.require_cross_run_for_strong_claims ?? true,
            require_replayable_support: policy?.require_replayable_support ?? true,
            allow_weak_review: policy?.allow_weak_review ?? true,
            strong_claim_types: Array.isArray(policy?.strong_claim_types)
                ? [...policy.strong_claim_types]
                : ["stable_structural_identity", "reproducible_recurrent_regime"],
        };
    }

    _runLegitimacyChecks(dossier, epochContext, policy) {
        const claimType = dossier?.candidate_claim?.claim_type ?? null;
        const readiness = dossier?.evidence_bundle?.readiness?.readiness_label ?? "insufficient_data";
        const crossRunAvailable = !!dossier?.scope?.cross_run_context?.available;
        const replayableSupport = !!dossier?.receipts?.replayable_support_present;
        const provenanceComplete = !!dossier?.receipts?.provenance_complete;

        const checks = [
            {
                check: "claim_type_admissible",
                passed: this.allowedClaimTypes.has(claimType),
                observed: claimType,
            },
            {
                check: "epoch_context_present",
                passed: !!epochContext?.epoch_id,
                observed: epochContext?.epoch_id ?? null,
            },
            {
                check: "provenance_complete",
                passed: provenanceComplete,
                observed: provenanceComplete,
            },
            {
                check: "replayable_support_present",
                passed: policy.require_replayable_support ? replayableSupport : true,
                observed: replayableSupport,
            },
            {
                check: "readiness_not_low",
                passed: readiness === "medium" || readiness === "high",
                observed: readiness,
            },
            {
                check: "cross_run_support_for_strong_claims",
                passed: this._crossRunSatisfiedForClaim(claimType, crossRunAvailable, policy),
                observed: {
                    claim_type: claimType,
                    cross_run_available: crossRunAvailable,
                },
            },
        ];

        return checks;
    }

    _crossRunSatisfiedForClaim(claimType, crossRunAvailable, policy) {
        const isStrong = policy.strong_claim_types.includes(claimType);
        if (!isStrong) return true;
        if (!policy.require_cross_run_for_strong_claims) return true;
        return !!crossRunAvailable;
    }

    _decideOutcome({ dossier, legitimacyChecks, blockers, insufficiencies, recommendation, policy }) {
        const failedChecks = legitimacyChecks.filter(c => !c.passed);

        if (failedChecks.some(c =>
            c.check === "claim_type_admissible" ||
            c.check === "epoch_context_present" ||
            c.check === "provenance_complete"
        )) {
            return {
                result: "reject",
                rationale: [
                    "One or more hard legitimacy checks failed.",
                    ...failedChecks.map(c => `failed:${c.check}`),
                ],
            };
        }

        if (failedChecks.some(c => c.check === "cross_run_support_for_strong_claims")) {
            return {
                result: "defer",
                rationale: [
                    "Cross-run support is required for this claim type before strong review.",
                    ...failedChecks.map(c => `failed:${c.check}`),
                ],
            };
        }

        if (insufficiencies.length > 0) {
            return {
                result: "defer",
                rationale: [
                    "Review deferred because insufficiencies remain.",
                    ...insufficiencies.map(i => `insufficiency:${i?.code ?? "unknown"}`),
                ],
            };
        }

        if (blockers.length > 0) {
            return {
                result: policy.allow_weak_review ? "defer" : "reject",
                rationale: [
                    "Review not promotion-eligible because blockers remain.",
                    ...blockers.map(b => `blocker:${b?.code ?? "unknown"}`),
                ],
            };
        }

        if (recommendation === "eligible_for_review") {
            return {
                result: "eligible_for_promotion",
                rationale: [
                    "Dossier is reviewable and promotion-eligible under current bounded policy.",
                    "No blockers or insufficiencies remain.",
                ],
            };
        }

        if (recommendation === "weak_review" && policy.allow_weak_review) {
            return {
                result: "defer",
                rationale: [
                    "Weak review posture does not yet justify promotion eligibility.",
                ],
            };
        }

        return {
            result: "defer",
            rationale: [
                "Default defer posture applied.",
            ],
        };
    }

    _copy(v) {
        return JSON.parse(JSON.stringify(v));
    }
}
