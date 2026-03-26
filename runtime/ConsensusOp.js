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
 *   v0.2 adds mintCanon() — explicit C1 CanonicalState minting under strict
 *   promotion criteria. The existing review() method is unchanged.
 *
 * Boundary contract:
 *   - explicit promotion boundary
 *   - not a normal runtime transform
 *   - does not silently emit canon
 *   - does not treat runtime evidence as truth
 *   - does not mutate dossier input
 *   - review outcome must be explicit
 *   - C1 artifacts are frozen at creation (Object.freeze)
 *
 * Inputs:
 *   - CanonCandidateDossier (runtime review packet)
 *   - EpochContext
 *   - consensus policy
 *
 * v0.1 bounded behavior (unchanged):
 *   - validate dossier admissibility
 *   - validate review context
 *   - review blockers / insufficiencies / recommendation posture
 *   - emit one of: "defer" | "reject" | "eligible_for_promotion"
 *   - emit review_receipt
 *   - DO NOT mint C1
 *
 * v0.2 addition — mintCanon():
 *   - requires outcome === "eligible_for_promotion" from review()
 *   - requires readiness_category "high" (strict) or "medium" (with allow_medium_promotion=true)
 *   - emits a frozen C1 CanonicalState artifact
 *   - all provenance fields required by constitution are present
 *
 * Review semantics:
 *   - defer:
 *       evidence incomplete, insufficiencies remain, or review should wait
 *   - reject:
 *       inadmissible claim, invalid dossier, or legitimacy clearly fails
 *   - eligible_for_promotion:
 *       dossier is reviewable and may proceed to explicit canon-mint step
 *
 * Admissible claim types (v0.1 / v0.2):
 *   - stable_structural_identity
 *   - reproducible_recurrent_regime
 *   - candidate_structural_regime
 *
 * Output:
 *   review()     → plain-data review result with review_receipt (not C1)
 *   mintCanon()  → { ok, c1 } where c1 is a frozen C1 CanonicalState, or { ok: false, error, reasons }
 *
 * Constitutional basis:
 *   README_MasterConstitution.md §3 Canon Space, §5 Rule 5
 *   README_ConstitutionAppendix.md §A (authority class: Canon), §B C1 artifact
 */

export class ConsensusOp {
    /**
     * @param {Object} [opts]
     */
    constructor(opts = {}) {
        this.operator_id = "ConsensusOp";
        this.operator_version = "0.2.0";
        // review() emits the v0.1.0 receipt version — the review gate is unchanged from v0.1.
        // mintCanon() provenance uses operator_version (0.2.0).
        this._review_receipt_version = "0.1.0";
        this.default_policy_id = opts.default_policy_id ?? "consensus.default.v0_2";

        this.allowedClaimTypes = new Set([
            "stable_structural_identity",
            "reproducible_recurrent_regime",
            "candidate_structural_regime",
        ]);
    }

    /**
     * Review a canon candidate dossier.
     *
     * Unchanged from v0.1. All 52+ existing tests must continue to pass.
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
                operator_version: this._review_receipt_version,
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

    /**
     * Mint a C1 CanonicalState artifact from a promotion-eligible dossier.
     *
     * This is the explicit canon-mint step for ConsensusOp v0.2.
     *
     * Requirements:
     *   - dossier must pass review() and produce outcome "eligible_for_promotion"
     *   - readiness_category must be "high" (strict) or "medium" with allow_medium_promotion=true
     *   - dossier must not be mutated
     *   - returned C1 is frozen (Object.freeze)
     *
     * @param {Object} dossier   - CanonCandidateDossier (same object passed to review())
     * @param {Object} [options]
     * @param {boolean} [options.allow_medium_promotion=false]  - explicit policy override to mint from "medium" readiness
     * @param {string}  [options.policy_id]                     - minting policy id for provenance
     * @returns {{ ok: true, c1: Object } | { ok: false, error: string, reasons: string[] }}
     */
    mintCanon(dossier, options = {}) {
        // ── 1. Validate dossier admissibility (reuse review-gate checks) ──────
        const basicValidation = this._validateInputsForMint(dossier);
        if (!basicValidation.ok) return basicValidation;

        // ── 2. Run a full review pass to confirm eligibility ──────────────────
        // mintCanon needs an epochContext; derive a minimal one from the dossier
        // if the caller has not injected one. The dossier always carries scope.
        const syntheticEpoch = {
            epoch_id: `mint-epoch:${dossier.candidate_id ?? "unknown"}`,
            t_start: dossier?.scope?.t_span?.t_start ?? 0,
            t_end: dossier?.scope?.t_span?.t_end ?? 0,
        };

        const reviewResult = this.review(dossier, syntheticEpoch, {
            policy_id: options.policy_id ?? "promotion_v0.2",
        });

        if (!reviewResult.ok || reviewResult.result !== "eligible_for_promotion") {
            return {
                ok: false,
                error: "NOT_ELIGIBLE_FOR_PROMOTION",
                reasons: [
                    "mintCanon() requires review() outcome to be eligible_for_promotion.",
                    `review() outcome: ${reviewResult.result ?? reviewResult.error}`,
                    ...(reviewResult.reasons ?? []),
                    ...(reviewResult.review_receipt?.rationale ?? []),
                ],
            };
        }

        // ── 3. Readiness category gate ────────────────────────────────────────
        const readinessLabel = dossier?.evidence_bundle?.readiness?.readiness_label ?? "insufficient_data";
        const allowMedium = !!options.allow_medium_promotion;

        if (readinessLabel === "high") {
            // strict path — always allowed
        } else if (readinessLabel === "medium" && allowMedium) {
            // explicit policy override path — allowed
        } else {
            return {
                ok: false,
                error: "READINESS_INSUFFICIENT_FOR_MINT",
                reasons: [
                    `C1 minting requires readiness_label "high" (strict) or "medium" with allow_medium_promotion=true.`,
                    `Observed readiness_label: ${readinessLabel}`,
                    `allow_medium_promotion: ${allowMedium}`,
                ],
            };
        }

        // ── 4. Build the C1 artifact ──────────────────────────────────────────
        const c1 = this._buildC1(dossier, readinessLabel, options);

        // ── 5. Freeze and return ──────────────────────────────────────────────
        return {
            ok: true,
            c1: Object.freeze(c1),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // C1 construction (private)
    // ─────────────────────────────────────────────────────────────────────────

    _buildC1(dossier, readinessLabel, options) {
        const streamId = dossier?.scope?.stream_id ?? "unknown_stream";
        const mintedAt = Date.now();
        const policyId = options.policy_id ?? "promotion_v0.2";
        const settlementPolicy =
            readinessLabel === "high"
                ? "readiness_threshold_high"
                : "readiness_threshold_medium";

        const canonicalState = this._buildCanonicalState(dossier);
        const promotionEvidence = this._buildPromotionEvidence(dossier, readinessLabel);
        const provenance = this._buildProvenance(dossier, policyId, settlementPolicy);

        return {
            artifact_class: "canon",
            authority_class: "canon",
            artifact_id: `c1:${streamId}:${mintedAt}`,
            stream_id: streamId,
            minted_at_ms: mintedAt,
            canonical_state: canonicalState,
            promotion_evidence: promotionEvidence,
            provenance,
        };
    }

    _buildCanonicalState(dossier) {
        const eb = dossier?.evidence_bundle ?? {};
        const traj = eb.trajectory ?? {};
        const crossRun = eb.cross_run ?? {};
        const readiness = eb.readiness ?? {};

        // Harmonic summary — best structural summary from trajectory evidence
        const harmonicSummary = {
            convergence: traj.convergence ?? "unknown",
            motion: traj.motion ?? "unknown",
            occupancy: traj.occupancy ?? "unknown",
            recurrence_strength: traj.recurrence_strength ?? "unknown",
            continuity: traj.continuity ?? "unknown",
            transition_density: traj.transition_density ?? "unknown",
            boundary_density: traj.boundary_density ?? "unknown",
        };

        // Basin id — from source refs basin_set_refs if available
        const basinSetRefs = dossier?.source_refs?.artifact_refs?.basin_set_refs ?? [];
        const basinId = basinSetRefs.length > 0 ? basinSetRefs[0] : null;

        // Segment id — first segment from scope
        const segmentIds = dossier?.scope?.segment_ids ?? [];
        const segmentId = segmentIds.length > 0 ? segmentIds[0] : null;

        // Recurrence score — map recurrence strength label to numeric
        const recurrenceScore = this._labelToScore(traj.recurrence_strength ?? "unknown");

        // Structural stability score — from cross-run similarity or readiness domain labels
        const stabilityScore = crossRun.similarity_ratio != null && Number.isFinite(crossRun.similarity_ratio)
            ? crossRun.similarity_ratio
            : this._labelToScore(readiness.readiness_label ?? "insufficient_data");

        return {
            harmonic_summary: harmonicSummary,
            basin_id: basinId,
            segment_id: segmentId,
            recurrence_score: recurrenceScore,
            structural_stability_score: stabilityScore,
        };
    }

    _buildPromotionEvidence(dossier, readinessLabel) {
        const crossRunAvailable = !!dossier?.scope?.cross_run_context?.available;
        const blockersList = Array.isArray(dossier?.blockers) ? dossier.blockers : [];
        const readinessLabel_ = dossier?.evidence_bundle?.readiness?.readiness_label ?? readinessLabel;
        const domainLabels = dossier?.evidence_bundle?.readiness?.evidence_domains ?? {};

        const domainsPassedHigh = Object.entries(domainLabels)
            .filter(([, label]) => label === "high")
            .map(([domain]) => domain);

        return {
            dossier_id: dossier?.candidate_id ?? null,
            readiness_category: readinessLabel_,
            readiness_domains_passed: domainsPassedHigh,
            blockers_cleared: this._copy(blockersList.filter(() => false)), // blockers_cleared = [] at time of mint (blockers must be absent for eligible)
            cross_run_reproducible: crossRunAvailable,
        };
    }

    _buildProvenance(dossier, policyId, settlementPolicy) {
        const artifactId = dossier?.candidate_id ?? null;

        return {
            operator: "ConsensusOp",
            operator_version: this.operator_version,
            policy_id: policyId,
            settlement_policy: settlementPolicy,
            input_refs: artifactId ? [artifactId] : [],
            minted_by: "ConsensusOp.mint()",
            constitutional_basis: "README_MasterConstitution §Canon",
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mint-specific validation (dossier only — no epochContext needed here)
    // ─────────────────────────────────────────────────────────────────────────

    _validateInputsForMint(dossier) {
        if (!dossier || typeof dossier !== "object") {
            return {
                ok: false,
                error: "INVALID_DOSSIER",
                reasons: ["mintCanon() requires a canon candidate dossier object"],
            };
        }

        if (dossier?.dossier_type !== "runtime:canon_candidate_dossier") {
            return {
                ok: false,
                error: "INVALID_DOSSIER",
                reasons: ["mintCanon() requires dossier_type=runtime:canon_candidate_dossier"],
            };
        }

        const claimType = dossier?.candidate_claim?.claim_type ?? null;
        if (!this.allowedClaimTypes.has(claimType)) {
            return {
                ok: false,
                error: "INADMISSIBLE_CLAIM_TYPE",
                reasons: [`Claim type is not admissible for minting: ${claimType}`],
            };
        }

        if (dossier?.candidate_claim?.trust_status !== "untrusted_candidate") {
            return {
                ok: false,
                error: "INVALID_DOSSIER_STATUS",
                reasons: ["candidate_claim.trust_status must be untrusted_candidate at mint time"],
            };
        }

        if (dossier?.promotion_recommendation?.review_status !== "unreviewed") {
            return {
                ok: false,
                error: "INVALID_DOSSIER_STATUS",
                reasons: ["promotion_recommendation.review_status must be unreviewed at mint time"],
            };
        }

        return { ok: true };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Shared review internals (unchanged from v0.1)
    // ─────────────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────────────
    // Utilities
    // ─────────────────────────────────────────────────────────────────────────

    _labelToScore(label) {
        const map = { high: 1.0, medium: 0.6, low: 0.2, insufficient_data: 0.0, unknown: 0.0 };
        return map[label] ?? 0.0;
    }

    _copy(v) {
        return JSON.parse(JSON.stringify(v));
    }
}
