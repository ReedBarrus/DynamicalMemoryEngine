// operators/consensus/ConsensusOp.js

/**
 * ConsensusOp  —  STUB / DECLARED INTERFACE (Door One)
 *
 * Purpose:
 * Promote eligible aggregate runtime memory (M1 MergedStates) into canonical
 * distributed memory (C1 CanonicalState) through resonance-based coherence
 * validation.
 *
 * This operator is the ONLY path by which provisional runtime memory becomes
 * canonical. All operators below it (IngestOp → MergeOp) produce authoritative
 * or derived artifacts; ConsensusOp is what makes them canonical.
 *
 * From OPERATOR_CONTRACTS.md §10:
 *   "ConsensusOp is not a storage transform; it is a legitimacy promotion operator.
 *    It lives above deterministic runtime transformation."
 *
 * Door One status: DECLARED, NOT IMPLEMENTED
 *
 * What this stub does:
 *   - validates candidate M1 against all legitimacy prerequisites
 *   - confirms EpochContext is well-formed
 *   - emits a CONSENSUS_DEFERRED result with full validation receipt
 *   - does NOT promote to C1 yet (no consensus mechanism implemented)
 *
 * What must be fixed before any active implementation:
 *   1. coherence tests used (e.g. cross-node resonance check)
 *   2. settlement interval (epoch duration and overlap rules)
 *   3. tolerance model (how much drift is allowed at promotion)
 *   4. promotion threshold (minimum overall confidence for C1)
 *   5. distributed settlement protocol (multi-node or single-node proof)
 *
 * C1 CanonicalState (declared schema, not yet produced):
 * {
 *   artifact_type: "CanonicalState",
 *   artifact_class: "C1",
 *   canonical_id,          // C1:<epoch_id>:<stream_id>:<segment_id>:<t_start>:<t_end>
 *   epoch_id,
 *   stream_id,
 *   segment_id,
 *   window_span,
 *   grid,
 *   kept_bins[],
 *   invariants,
 *   uncertainty,
 *   confidence,
 *   consensus_receipt: {
 *     epoch_id,
 *     coherence_tests_applied[],
 *     promotion_threshold,
 *     candidate_refs[],
 *     result,              // "promoted" | "rejected" | "decayed"
 *     settlement_policy_id,
 *   },
 *   policies,
 *   provenance,
 * }
 *
 * References:
 * - README_MasterConstitution.md §7 (artifact authority graph)
 * - README_SubstrateLayer.md §6 (ConsensusOp stub contract)
 * - OPERATOR_CONTRACTS.md §10, §11
 */

/**
 * @typedef {Object} EpochContext
 * @property {string} epoch_id
 * @property {number} t_start
 * @property {number} t_end
 * @property {string} settlement_policy_id
 * @property {string} [promotion_scope]
 * @property {number} [consensus_window]
 */

/**
 * @typedef {Object} ConsensusPolicy
 * @property {string} policy_id
 * @property {number} promotion_threshold          — minimum overall confidence for C1
 * @property {number} max_energy_drift             — max energy divergence from M1 invariants
 * @property {number} max_band_drift               — max band-profile divergence
 * @property {string[]} coherence_tests            — declared but not run in Door One
 * @property {"single_node"|"multi_node"} settlement_mode
 */

/**
 * @typedef {Object} ConsensusReceipt
 * @property {string} epoch_id
 * @property {string[]} coherence_tests_declared
 * @property {number} promotion_threshold
 * @property {string[]} candidate_refs
 * @property {"promoted"|"rejected"|"deferred"} result
 * @property {string} result_reason
 * @property {string} settlement_policy_id
 * @property {number} candidate_confidence
 * @property {boolean} legitimacy_passed
 * @property {string[]} legitimacy_failures
 */

/**
 * @typedef {{ ok: true,  result: "deferred", receipt: ConsensusReceipt }
 *          | { ok: false, error: string, reasons: string[] }} ConsensusOutcome
 */

export class ConsensusOp {
    /**
     * @param {Object} cfg
     * @param {string} [cfg.operator_id="ConsensusOp"]
     * @param {string} [cfg.operator_version="0.1.0"]
     */
    constructor(cfg = {}) {
        this.operator_id = cfg.operator_id ?? "ConsensusOp";
        this.operator_version = cfg.operator_version ?? "0.1.0";
    }

    /**
     * Attempt canonical promotion of an M1 candidate.
     *
     * Door One behavior:
     *   - runs full legitimacy validation
     *   - returns CONSENSUS_DEFERRED with a receipt explaining what passed/failed
     *   - never emits C1
     *
     * @param {Object} input
     * @param {Object} input.candidate       — M1 MergedState
     * @param {EpochContext} input.epoch_context
     * @param {ConsensusPolicy} input.consensus_policy
     * @returns {ConsensusOutcome}
     */
    run(input) {
        const { candidate, epoch_context, consensus_policy } = input ?? {};
        const reasons = [];

        // ── Schema validation ──
        if (!candidate || candidate.artifact_class !== "M1") {
            reasons.push("input.candidate must be a valid M1 MergedState");
        }
        if (!epoch_context?.epoch_id || typeof epoch_context.epoch_id !== "string") {
            reasons.push("epoch_context.epoch_id must be a non-empty string");
        }
        if (!Number.isFinite(epoch_context?.t_start) || !Number.isFinite(epoch_context?.t_end)) {
            reasons.push("epoch_context must have finite t_start and t_end");
        }
        if (!epoch_context?.settlement_policy_id) {
            reasons.push("epoch_context.settlement_policy_id is required");
        }
        if (!consensus_policy?.policy_id) {
            reasons.push("consensus_policy.policy_id is required");
        }
        if (!Number.isFinite(consensus_policy?.promotion_threshold)) {
            reasons.push("consensus_policy.promotion_threshold must be a finite number");
        }

        if (reasons.length > 0) {
            return { ok: false, error: "INVALID_SCHEMA", reasons };
        }

        // ── Legitimacy validation (SystemLegitimacy §1) ──
        const legitimacyFailures = validateLegitimacy(candidate);

        // ── Confidence check ──
        const candidateConfidence = candidate.confidence?.overall ?? 0;
        const meetsThreshold = candidateConfidence >= consensus_policy.promotion_threshold;

        // ── Epoch containment check ──
        const epochContains =
            candidate.window_span.t_start >= epoch_context.t_start &&
            candidate.window_span.t_end <= epoch_context.t_end;

        // ── Receipt ──
        /** @type {ConsensusReceipt} */
        const receipt = {
            epoch_id: epoch_context.epoch_id,
            coherence_tests_declared: consensus_policy.coherence_tests ?? [],
            promotion_threshold: consensus_policy.promotion_threshold,
            candidate_refs: [candidate.state_id],
            result: "deferred",
            result_reason: buildDeferralReason({
                legitimacyFailures,
                meetsThreshold,
                epochContains,
                candidateConfidence,
                threshold: consensus_policy.promotion_threshold,
            }),
            settlement_policy_id: epoch_context.settlement_policy_id,
            candidate_confidence: candidateConfidence,
            legitimacy_passed: legitimacyFailures.length === 0,
            legitimacy_failures: legitimacyFailures,
        };

        // Door One: always defer — C1 production is not implemented
        return {
            ok: true,
            result: "deferred",
            receipt,
            provenance: {
                operator_id: this.operator_id,
                operator_version: this.operator_version,
                input_refs: [candidate.state_id],
            },
        };
    }

    /**
     * Declare the C1 schema for forward compatibility documentation.
     * Returns the empty schema with null fields — not a real artifact.
     * @returns {Object}
     */
    c1Schema() {
        return {
            artifact_type: "CanonicalState",
            artifact_class: "C1",
            canonical_id: null,
            epoch_id: null,
            stream_id: null,
            segment_id: null,
            window_span: null,
            grid: null,
            kept_bins: [],
            invariants: null,
            uncertainty: null,
            confidence: null,
            consensus_receipt: {
                epoch_id: null,
                coherence_tests_applied: [],
                promotion_threshold: null,
                candidate_refs: [],
                result: null,
                settlement_policy_id: null,
            },
            policies: null,
            provenance: null,
            _door_one_note: "C1 production not yet implemented. ConsensusOp is declared interface only.",
        };
    }
}

// ─── Legitimacy validation ─────────────────────────────────────────────────

/**
 * Validate an M1 against System Legitimacy §1 prerequisites for promotion.
 * Returns array of failure strings (empty = passed).
 * @param {Object} candidate — M1
 * @returns {string[]}
 */
function validateLegitimacy(candidate) {
    const failures = [];

    // Traceable to authoritative ingest
    if (!candidate.policies?.clock_policy_id) {
        failures.push("missing policies.clock_policy_id (not traceable to ingest)");
    }
    if (!candidate.provenance?.input_refs?.length) {
        failures.push("missing provenance.input_refs (lineage broken)");
    }

    // Coordinate frame explicit — grid.N and grid.df are numbers, not strings
    if (!candidate.grid?.Fs_target || !Number.isFinite(candidate.grid?.N) || !Number.isFinite(candidate.grid?.df)) {
        failures.push("grid is incomplete (Fs_target, N, df required)");
    }

    // Invariants declared
    if (!Number.isFinite(candidate.invariants?.energy_raw)) {
        failures.push("invariants.energy_raw is not a finite number");
    }
    if (!Array.isArray(candidate.invariants?.band_profile_norm?.band_energy)) {
        failures.push("invariants.band_profile_norm.band_energy missing");
    }

    // Reductions logged
    if (!candidate.receipts?.merge?.merged_from?.length) {
        failures.push("receipts.merge.merged_from is empty (reductions not logged)");
    }

    // Uncertainty quantified — uncertainty.time is an object (not undefined)
    if (!candidate.uncertainty?.time || typeof candidate.uncertainty.time !== "object") {
        failures.push("uncertainty.time is missing or not an object");
    }

    // Replayability
    if (!Array.isArray(candidate.kept_bins) || candidate.kept_bins.length === 0) {
        failures.push("kept_bins is empty (state is not replayable)");
    }

    // Confidence meaningful
    if (!Number.isFinite(candidate.confidence?.overall)) {
        failures.push("confidence.overall is not a finite number");
    }

    return failures;
}

function buildDeferralReason({ legitimacyFailures, meetsThreshold, epochContains, candidateConfidence, threshold }) {
    if (legitimacyFailures.length > 0) {
        return `Door One stub: legitimacy failures: ${legitimacyFailures.slice(0, 2).join("; ")}`;
    }
    if (!meetsThreshold) {
        return `Door One stub: confidence ${candidateConfidence.toFixed(3)} < threshold ${threshold}`;
    }
    if (!epochContains) {
        return "Door One stub: candidate window_span not contained within epoch bounds";
    }
    return "Door One stub: consensus mechanism not yet implemented";
}
