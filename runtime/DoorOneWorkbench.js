// runtime/DoorOneWorkbench.js
/**
 * DoorOneWorkbench
 *
 * Layer:
 *   Read-side runtime integration helper.
 *   Not a pipeline operator. Not an authority-bearing artifact.
 *
 * Purpose:
 *   Assemble a single, deterministic Door One inspection surface from already-lawful
 *   runtime outputs:
 *     - DoorOneOrchestrator result
 *     - optional CrossRunDynamicsReport or CrossRunSession
 *     - PromotionReadinessReport
 *     - CanonCandidateDossier
 *     - optional ConsensusOp review result
 *
 * Boundary contract:
 *   - integration view only
 *   - not canon
 *   - not promotion
 *   - not ontology
 *   - not truth
 *   - does not mutate input result, reports, dossier, or review objects
 *   - does not recompute authoritative artifacts
 *   - does not mint C1
 *   - does not imply canon merely by assembling evidence and review surfaces
 *
 * Runtime role:
 *   - compose lawful Door One outputs into one stable workbench object
 *   - support terminal HUDs, runners, and future UI surfaces
 *   - remain below canon as an inspection/integration surface
 *
 * Inputs:
 *   - completed DoorOneOrchestrator result
 *   - optional CrossRunDynamicsReport
 *   - optional CrossRunSession
 *   - optional PromotionReadinessReport
 *   - optional CanonCandidateDossier
 *   - optional ConsensusOp review inputs / outputs
 *
 * Output:
 *   Plain-data workbench object containing:
 *     - runtime
 *     - semantic_overlay
 *     - readiness_overlay
 *     - review_overlay
 *     - compatibility aliases for transitional downstream consumers
 *     - optional cross_run
 *
 * Non-responsibilities:
 *   - does NOT replace DoorOneOrchestrator
 *   - does NOT perform ingestion or operator execution
 *   - does NOT define new artifact classes
 *   - does NOT redefine promotion rules
 *   - does NOT activate deferred layers
 *
 * References:
 *   - README_MasterConstitution.md §3 / §5
 *   - README_WorkflowContract.md
 *   - README_RepoPlacementConstitution.md §2 (`runtime/` coordinators)
 */

import { PromotionReadinessReport } from "./PromotionReadinessReport.js";
import { CanonCandidateDossier } from "./CanonCandidateDossier.js";
import { CrossRunDynamicsReport } from "./CrossRunDynamicsReport.js";
import { ConsensusOp } from "../operators/consensus/ConsensusOp.js";

export class DoorOneWorkbench {
    constructor(opts = {}) {
        this._promotionReadiness =
            opts.promotionReadinessReport ?? new PromotionReadinessReport();

        this._canonCandidate =
            opts.canonCandidateDossier ?? new CanonCandidateDossier();

        this._crossRun =
            opts.crossRunDynamicsReport ?? new CrossRunDynamicsReport();

        this._consensus =
            opts.consensusOp ?? new ConsensusOp();
    }

    assemble(result, opts = {}) {
        if (!result?.ok) {
            return {
                ok: false,
                error: "INVALID_INPUT",
                reasons: ["DoorOneWorkbench requires a successful DoorOneOrchestrator result"],
            };
        }

        const crossRunReport =
            this._resolveCrossRunReport(opts);

        const promotionReadiness =
            opts.promotionReadinessReport ??
            this._promotionReadiness.interpret(result, crossRunReport);

        if (!promotionReadiness || promotionReadiness.ok === false) {
            return {
                ok: false,
                error: "INVALID_PROMOTION_READINESS",
                reasons: ["DoorOneWorkbench could not derive a valid PromotionReadinessReport"],
            };
        }

        const canonCandidate =
            opts.canonCandidateDossier ??
            this._canonCandidate.assemble(
                result,
                crossRunReport,
                promotionReadiness,
                opts.candidateOptions ?? {}
            );

        if (!canonCandidate || canonCandidate.ok === false) {
            return {
                ok: false,
                error: "INVALID_CANON_CANDIDATE",
                reasons: ["DoorOneWorkbench could not derive a valid CanonCandidateDossier"],
            };
        }

        const consensusReview =
            this._resolveConsensusReview(canonCandidate, opts);

        const runtime = {
            artifacts: this._copy(result?.artifacts ?? {}),
            substrate: this._copy(result?.substrate ?? {}),
            summaries: this._copy(result?.summaries ?? {}),
            audit: this._copy(result?.audit ?? {}),
        };

        const semanticOverlay = {
            trajectory: this._copy(
                result?.semantic_overlay?.trajectory ??
                result?.interpretation?.trajectory ??
                null
            ),
            attention_memory: this._copy(
                result?.semantic_overlay?.attention_memory ??
                result?.interpretation?.attention_memory ??
                null
            ),
        };

        const readinessOverlay = {
            promotion_readiness: this._copy(promotionReadiness),
        };

        const reviewOverlay = {
            canon_candidate: this._copy(canonCandidate),
            consensus_review: consensusReview ? this._copy(consensusReview) : null,
        };

        const compatibilityAliases = {
            interpretation: {
                trajectory: this._copy(result?.interpretation?.trajectory ?? null),
                attention_memory: this._copy(result?.interpretation?.attention_memory ?? null),
            },
            promotion_readiness: {
                report: this._copy(promotionReadiness),
            },
            canon_candidate: {
                dossier: this._copy(canonCandidate),
            },
            consensus_review: {
                review: consensusReview ? this._copy(consensusReview) : null,
            },
        };

        return {
            workbench_type: "runtime:door_one_workbench",
            generated_from:
                "Door One runtime primary section, downstream semantic/readiness/review overlay bundles, cross-run, and transitional compatibility aliases only; integration view, not canon",
            scope: {
                stream_id: result?.artifacts?.a1?.stream_id ?? null,
                source_id: result?.artifacts?.a1?.source_id ?? null,
                segment_ids: Array.isArray(result?.substrate?.segment_ids)
                    ? [...result.substrate.segment_ids]
                    : [],
                t_span: result?.substrate?.t_span
                    ? {
                        t_start: result.substrate.t_span.t_start ?? null,
                        t_end: result.substrate.t_span.t_end ?? null,
                        duration_sec: result.substrate.t_span.duration_sec ?? null,
                    }
                    : null,
                cross_run_context: {
                    available: !!crossRunReport,
                    run_count: crossRunReport?.scope?.run_count ?? 0,
                },
            },
            runtime,
            semantic_overlay: semanticOverlay,
            readiness_overlay: readinessOverlay,
            review_overlay: reviewOverlay,
            compatibility_aliases: this._copy(compatibilityAliases),

            cross_run: {
                available: !!crossRunReport,
                report: crossRunReport ? this._copy(crossRunReport) : null,
            },

            interpretation: this._copy(compatibilityAliases.interpretation),
            promotion_readiness: this._copy(compatibilityAliases.promotion_readiness),
            canon_candidate: this._copy(compatibilityAliases.canon_candidate),
            consensus_review: this._copy(compatibilityAliases.consensus_review),

            notes: this._buildNotes(crossRunReport, consensusReview),
        };
    }

    _resolveCrossRunReport(opts) {
        if (opts.crossRunReport) return opts.crossRunReport;

        if (opts.crossRunSession) {
            if (typeof opts.crossRunSession.latestReport === "function") {
                const latest = opts.crossRunSession.latestReport();
                if (latest) return latest;
            }
            if (typeof opts.crossRunSession.compareAll === "function") {
                const report = opts.crossRunSession.compareAll();
                if (report && report.ok !== false) return report;
            }
        }

        return null;
    }

    _resolveConsensusReview(canonCandidate, opts) {
        if (!opts.epochContext) return null;

        const review =
            opts.consensusReview ??
            this._consensus.review(
                canonCandidate,
                opts.epochContext,
                opts.consensusPolicy ?? {}
            );

        return review;
    }

    _buildNotes(crossRunReport, consensusReview) {
        const notes = [
            "Workbench is an integration view, not canon.",
            "Consensus review remains explicit and does not itself imply C1 minting in v0.1.",
            "consensus_review remains a downstream review-only bundle; retained result labels do not themselves imply promotion.",
            "promotion_recommendation remains a retained dossier compatibility label for review routing only and does not itself imply promotion.",
            "Trajectory semantic overlay remains removable and does not become structural runtime substance by itself.",
            "Structural runtime remains the primary workbench section; semantic, readiness, and review outputs are attached downstream as explicit bundles.",
            "Compatibility aliases are grouped under compatibility_aliases and mirrored at top level only as transitional downstream bridges.",
        ];

        if (!crossRunReport) {
            notes.push("No cross-run report was supplied; workbench is operating in single-run mode.");
        }

        if (!consensusReview) {
            notes.push("No consensus review was performed; epoch context was not supplied.");
        }

        return notes;
    }

    _copy(v) {
        return JSON.parse(JSON.stringify(v));
    }
}
