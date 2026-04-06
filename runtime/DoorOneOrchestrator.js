// DoorOneOrchestrator.js
//
// Layer: Substrate Space (orchestration helper)
// Authority class: none — this is a runtime coordinator, not a pipeline operator
//
// Purpose:
// Provide one obvious, stable way to run the Door One stack end-to-end for:
//   - batch execution  (runBatch)
//   - incremental/stream-style execution  (processWindow / finalise)
//
// Boundary contract:
//   - does not define new operators, artifact classes, or policy defaults
//   - all policy must be supplied by the caller; no hidden defaults beyond
//     individual operator behavior already declared in their JSDoc
//   - output is a plain-data object that explicitly separates:
//       artifacts       — pipeline artifact classes (A1, A2, W1, H1, M1, An, A3, Q, BN)
//       substrate       — substrate commit counts, basin sets, transition report
//       summaries       — operational summaries (plain-data, non-canonical)
//       audit           — skipped windows, merge failures, consensus receipts
//   - deterministic and audit-friendly; all non-ok operator results are
//     surfaced in audit, never silently dropped
//   - does NOT activate canon, prediction, agency, or any deferred layer
//   - ConsensusOp remains a stub; its receipts appear in audit only
//
// Usage (batch):
//   const orch = new DoorOneOrchestrator({ policies, substrate_id });
//   const result = await orch.runBatch(a1_input);
//
// Usage (incremental):
//   const orch = new DoorOneOrchestrator({ policies, substrate_id });
//   const a1a2 = orch.ingestAndAlign(raw_input);
//   for (const w1 of orch.window(a1a2.a2)) {
//     orch.processWindow(w1);
//   }
//   const result = await orch.finalise({ query_spec, query_policy });
//
// References:
//   - README_MasterConstitution.md §3 (layer definitions)
//   - README_SubstrateLayer.md (substrate component contracts)
//   - operator-local JSDoc (individual operator contracts)

import { IngestOp } from "../operators/ingest/IngestOp.js";
import { ClockAlignOp } from "../operators/clock/ClockAlignOp.js";
import { WindowOp } from "../operators/window/WindowOp.js";
import { TransformOp } from "../operators/transform/TransformOp.js";
import { CompressOp } from "../operators/compress/CompressOp.js";
import { AnomalyOp } from "../operators/anomaly/AnomalyOp.js";
import { MergeOp } from "../operators/merge/MergeOp.js";
import { ReconstructOp } from "../operators/reconstruct/ReconstructOp.js";
import { QueryOp } from "../operators/query/QueryOp.js";

import { SegmentTracker } from "../operators/trajectory/SegmentTracker.js";
import { MemorySubstrate } from "../operators/substrate/MemorySubstrate.js";
import { ConsensusOp } from "../operators/consensus/ConsensusOp.js";
import { TrajectoryInterpretationReport } from "./TrajectoryInterpretationReport.js";
import { AttentionMemoryReport } from "./AttentionMemoryReport.js";

// ─── DoorOneOrchestrator ──────────────────────────────────────────────────────

export class DoorOneOrchestrator {
    /**
     * @param {Object} cfg
     * @param {DoorOnePolicies} cfg.policies — all operator policies; no hidden defaults
     * @param {string} [cfg.substrate_id]    — passed to MemorySubstrate constructor
     * @param {number} [cfg.trajectory_max_frames=2048]
     */
    constructor({ policies, substrate_id, trajectory_max_frames = 2048 }) {
        if (!policies) throw new Error("DoorOneOrchestrator: policies is required");

        this.policies = policies;

        // Operators — one instance per orchestrator lifecycle
        this._ingestOp = new IngestOp();
        this._clockAlignOp = new ClockAlignOp();
        this._windowOp = new WindowOp();
        this._transformOp = new TransformOp();
        this._compressOp = new CompressOp();
        this._anomalyOp = new AnomalyOp();
        this._mergeOp = new MergeOp();
        this._reconstructOp = new ReconstructOp();
        this._queryOp = new QueryOp();
        this._consensusOp = new ConsensusOp();

        // Substrate components — initialised without stream_id; SegmentTracker
        // is created after ingest when stream_id is known
        this._substrate = new MemorySubstrate({
            substrate_id: substrate_id ?? "door_one_substrate",
            trajectory_max_frames,
        });

        /** @type {SegmentTracker|null} */
        this._segTracker = null;

        // Accumulated incremental state
        this._h1s = [];
        this._anomalyReports = [];
        this._segmentTransitions = [];
        this._skippedWindows = [];
        this._currentBaseline = null;
        this._a1 = null;
        this._a2 = null;

        // Interpretation layer
        this._trajectoryInterpretation = new TrajectoryInterpretationReport();
        this._attentionMemory = new AttentionMemoryReport();
    }

    // ── Ingest + align ────────────────────────────────────────────────────────

    /**
     * Run IngestOp → ClockAlignOp. Initialises the SegmentTracker.
     * Must be called before processWindow().
     *
     * @param {Object} raw — { timestamps, values, stream_id?, source_id, channel,
     *                         modality, meta?, clock_policy_id }
     * @returns {{ ok: true, a1, a2 } | { ok: false, error, reasons }}
     */
    ingestAndAlign(raw) {
        const p = this.policies;

        const ingest = this._ingestOp.run({
            timestamps: raw.timestamps,
            values: raw.values,
            meta: raw.meta,
            clock_policy_id: raw.clock_policy_id ?? p.clock_policy_id,
            ingest_policy: p.ingest_policy,
            stream_id: raw.stream_id,
            source_id: raw.source_id,
            channel: raw.channel,
            modality: raw.modality,
        });
        if (!ingest.ok) return { ok: false, stage: "IngestOp", error: ingest.error, reasons: ingest.reasons };

        this._a1 = ingest.artifact;

        // Initialise SegmentTracker now that stream_id is known
        this._segTracker = new SegmentTracker({ stream_id: this._a1.stream_id });

        const align = this._clockAlignOp.run({
            a1: this._a1,
            grid_spec: { ...p.grid_spec, t_ref: this._a1.timestamps[0] ?? 0 },
        });
        if (!align.ok) return { ok: false, stage: "ClockAlignOp", error: align.error, reasons: align.reasons };

        this._a2 = align.artifact;
        return { ok: true, a1: this._a1, a2: this._a2 };
    }

    /**
     * Run WindowOp over the aligned stream. Returns W1[].
     * @param {Object} a2
     * @returns {{ ok: true, w1s: Object[] } | { ok: false, error, reasons }}
     */
    window(a2) {
        const out = this._windowOp.run({ a2, window_spec: this.policies.window_spec });
        if (!out.ok) return { ok: false, stage: "WindowOp", error: out.error, reasons: out.reasons };
        return { ok: true, w1s: out.artifacts };
    }

    // ── Per-window processing (incremental path) ──────────────────────────────

    /**
     * Process one W1 through TransformOp → CompressOp → AnomalyOp → commit.
     * Safe to call in a loop for streaming use.
     *
     * @param {Object} w1
     * @returns {{
     *   ok: boolean,
     *   h1: Object|null,
     *   anomaly_report: Object|null,
     *   segment_transition: Object|null,
     *   skipped: boolean,
     *   skip_reason: string|null,
     * }}
     */
    processWindow(w1) {
        if (!this._segTracker) {
            return { ok: false, skipped: true, skip_reason: "ingestAndAlign() must be called first", h1: null, anomaly_report: null, segment_transition: null };
        }

        const p = this.policies;

        // Transform W1 → S1
        const tOut = this._transformOp.run({ w1, transform_policy: p.transform_policy });
        if (!tOut.ok) {
            const skip = { window_id: w1.window_id, stage: "transform", error: tOut.error, reasons: tOut.reasons };
            this._skippedWindows.push(skip);
            return { ok: false, skipped: true, skip_reason: tOut.error, h1: null, anomaly_report: null, segment_transition: null };
        }

        // Compress S1 → H1 with current segment_id
        const t_start = w1.grid?.t0 ?? w1.window_span?.t_start ?? 0;
        const t_end = t_start + (w1.grid?.N ?? 0) / (w1.grid?.Fs_target ?? 1);
        const cOut = this._compressOp.run({
            s1: tOut.artifact,
            compression_policy: p.compression_policy,
            context: {
                segment_id: this._segTracker.currentSegmentId,
                window_span: { t_start, t_end },
            },
        });
        if (!cOut.ok) {
            const skip = { window_id: w1.window_id, stage: "compress", error: cOut.error, reasons: cOut.reasons };
            this._skippedWindows.push(skip);
            return { ok: false, skipped: true, skip_reason: cOut.error, h1: null, anomaly_report: null, segment_transition: null };
        }

        const h1 = cOut.artifact;
        this._h1s.push(h1);

        // Set baseline for first H1 in this segment
        const isSegmentBaseline = (this._currentBaseline === null);
        if (isSegmentBaseline) this._currentBaseline = h1;

        // Anomaly check (skip for the first H1 in the current segment — it is the baseline)
        let anomalyReport = null;
        let segmentTransition = null;
        let currentNovelty = false;

        if (!isSegmentBaseline && this._currentBaseline) {
            const aOut = this._anomalyOp.run({
                h_current: h1,
                h_base: this._currentBaseline,
                anomaly_policy: p.anomaly_policy,
            });
            if (aOut.ok) {
                anomalyReport = aOut.artifact;
                this._anomalyReports.push(anomalyReport);
                currentNovelty = Boolean(anomalyReport.novelty_gate_triggered);
            }
            // Non-ok AnomalyOp is non-fatal; H1 still committed
        }

        // Commit H1 to substrate with the novelty result for THIS H1
        this._substrate.commit(h1, { novelty_gate_triggered: currentNovelty });

        // Feed to segment tracker AFTER compress/anomaly for this H1, and BEFORE next compress
        if (anomalyReport) {
            const transition = this._segTracker.observe(anomalyReport);
            if (transition) {
                segmentTransition = transition;
                this._segmentTransitions.push(transition);
                this._currentBaseline = null; // next H1 becomes new segment baseline
            }
        }

        return { ok: true, skipped: false, skip_reason: null, h1, anomaly_report: anomalyReport, segment_transition: segmentTransition };
    }

    // ── Finalise (merge + basins + reconstruct + query + consensus) ────────────

    /**
     * Complete the pipeline after all windows have been processed.
     * Runs MergeOp, rebuildBasins, ReconstructOp, QueryOp, ConsensusOp stub.
     *
     * @param {Object} opts
     * @param {Object}  opts.query_spec
     * @param {Object}  opts.query_policy
     * @param {Object}  [opts.epoch_context]   — for ConsensusOp stub
     * @param {Object}  [opts.consensus_policy] — for ConsensusOp stub
     * @returns {DoorOneResult}
     */
    finalise({ query_spec, query_policy, epoch_context, consensus_policy } = {}) {
        const p = this.policies;

        // ── Merge H1s within each segment ──────────────────────────────────
        const m1s = [];
        const mergeFailures = [];

        const h1sBySegment = new Map();
        for (const h1 of this._h1s) {
            if (!h1sBySegment.has(h1.segment_id)) h1sBySegment.set(h1.segment_id, []);
            h1sBySegment.get(h1.segment_id).push(h1);
        }

        for (const [segId, segH1s] of h1sBySegment) {
            for (let i = 0; i + 1 < segH1s.length; i += 2) {
                const mOut = this._mergeOp.run({
                    states: [segH1s[i], segH1s[i + 1]],
                    merge_policy: p.merge_policy,
                    post_merge_compression_policy: p.post_merge_compression_policy,
                    merge_tree_position: { level: 0, index: Math.floor(i / 2) },
                });
                if (mOut.ok) {
                    m1s.push(mOut.artifact);
                    this._substrate.commit(mOut.artifact);
                } else {
                    mergeFailures.push({ segment_id: segId, pair: i, error: mOut.error, reasons: mOut.reasons });
                }
            }
        }

        // ── Basin formation per segment ─────────────────────────────────────
        const basinSets = [];
        if (this._segTracker && p.basin_policy) {
            for (const segId of this._segTracker.segmentHistory()) {
                const segStates = this._substrate.statesForSegment(segId);
                if (segStates.length === 0) continue;

                const bPolicy = segStates.length >= (p.basin_policy.min_member_count ?? 1)
                    ? p.basin_policy
                    : { ...p.basin_policy, min_member_count: 1, policy_id: p.basin_policy.policy_id + ".single" };

                const rbResult = this._substrate.rebuildBasins({ segment_id: segId, basin_policy: bPolicy });
                if (rbResult.ok) basinSets.push(rbResult.artifact);
            }
        }

        // ── Reconstruct (first M1, fallback to first H1) ────────────────────
        let a3 = null;
        const reconTarget = m1s[0] ?? this._h1s[0] ?? null;
        if (reconTarget && p.reconstruct_policy) {
            const rOut = this._reconstructOp.run({ state: reconTarget, reconstruct_policy: p.reconstruct_policy });
            if (rOut.ok) a3 = rOut.artifact;
        }

        // ── Query ────────────────────────────────────────────────────────────
        let q = null;
        if (query_spec && query_policy && (this._h1s.length + m1s.length) > 0) {
            const qOut = this._substrate.queryStates(query_spec, query_policy);
            if (qOut.ok) q = qOut.artifact;
        }

        // ── ConsensusOp stub ────────────────────────────────────────────────
        const consensusReceipts = [];
        if (epoch_context && consensus_policy) {
            for (const m1 of m1s.slice(0, 5)) {
                const cr = this._consensusOp.run({
                    candidate: m1,
                    epoch_context,
                    consensus_policy,
                });
                consensusReceipts.push({
                    state_id: m1.state_id,
                    ok: cr.ok,
                    result: cr.result,
                    legitimacy_passed: cr.receipt?.legitimacy_passed,
                    legitimacy_failures: cr.receipt?.legitimacy_failures,
                    result_reason: cr.receipt?.result_reason,
                });
            }
        }

        // ── Transition report ────────────────────────────────────────────────
        const transitionReport = this._substrate.neighborhoodTransitionReport();

        return buildResult({
            a1: this._a1,
            a2: this._a2,
            h1s: this._h1s,
            m1s,
            a3,
            q,
            basinSets,
            anomalyReports: this._anomalyReports,
            segmentTransitions: this._segmentTransitions,
            substrate: this._substrate,
            transitionReport,
            skippedWindows: this._skippedWindows,
            mergeFailures,
            consensusReceipts,
            segTracker: this._segTracker,
            trajectoryInterpreter: this._trajectoryInterpretation,
            attentionMemoryInterpreter: this._attentionMemory,
        });
    }

    // ── Batch convenience ─────────────────────────────────────────────────────

    /**
     * Run the full Door One pipeline in one call over a pre-ingested raw input.
     *
     * @param {Object} raw — same shape as ingestAndAlign(raw)
     * @param {Object} opts — same shape as finalise(opts)
     * @returns {DoorOneResult}
     */
    runBatch(raw, opts = {}) {
        const ia = this.ingestAndAlign(raw);
        if (!ia.ok) return { ok: false, stage: ia.stage, error: ia.error, reasons: ia.reasons };

        const win = this.window(ia.a2);
        if (!win.ok) return { ok: false, stage: win.stage, error: win.error, reasons: win.reasons };

        for (const w1 of win.w1s) {
            this.processWindow(w1);
        }

        return this.finalise(opts);
    }

    // ── Read-side ─────────────────────────────────────────────────────────────

    /** Live substrate handle (for dynamics queries during incremental processing). */
    get substrate() { return this._substrate; }

    /** Current segment ID from SegmentTracker (null before ingestAndAlign). */
    get currentSegmentId() { return this._segTracker?.currentSegmentId ?? null; }
}

// ─── Result builder ───────────────────────────────────────────────────────────

/**
 * Assemble the DoorOneResult plain-data output object.
 * All sections are explicitly labelled by their constitutional class.
 *
 * @typedef {Object} DoorOneResult
 * @property {boolean} ok
 * @property {Object} artifacts   — pipeline artifact classes (A1, A2, H1[], M1[], A3, Q)
 * @property {Object} substrate   — substrate commit/basin/transition read-side output
 * @property {Object} summaries   — operational summaries (plain-data, non-canonical)
 * @property {Object} audit       — skipped windows, merge failures, consensus receipts
 */
function buildResult({ a1, a2, h1s, m1s, a3, q, basinSets, anomalyReports,
    segmentTransitions, substrate, transitionReport, skippedWindows, mergeFailures,
    consensusReceipts, segTracker, trajectoryInterpreter, attentionMemoryInterpreter }) {

    const substrateSummary = substrate.summary();
    const trajSummary = substrate.trajectory.summary();
    const trajectoryInterpretation = trajectoryInterpreter.interpret({
        ok: true,
        artifacts: {
            a1,
            a2,
            h1s,
            m1s,
            a3,
            q,
            anomaly_reports: anomalyReports,
            basin_sets: basinSets,
        },
        substrate: {
            state_count: substrateSummary.state_count,
            basin_count: substrateSummary.basin_count,
            segment_count: substrateSummary.segment_count,
            trajectory_frames: trajSummary.frame_count,
            t_span: substrateSummary.t_span,
            segment_ids: segTracker.summary().segment_ids ?? [],
            segment_transitions: segmentTransitions,
            transition_report: transitionReport,
        },
        summaries: {
            substrate: substrateSummary,
            trajectory: trajSummary,
            segtracker: segTracker.summary(),
        },
        audit: {
            skipped_windows: skippedWindows,
            merge_failures: mergeFailures,
            consensus_receipts: consensusReceipts,
        },
    });

    const attentionMemory = attentionMemoryInterpreter.interpret(
        {
            ok: true,
            artifacts: {
                a1,
                a2,
                h1s,
                m1s,
                a3,
                q,
                anomaly_reports: anomalyReports,
                basin_sets: basinSets,
            },
            substrate: {
                state_count: substrateSummary.state_count,
                basin_count: substrateSummary.basin_count,
                segment_count: substrateSummary.segment_count,
                trajectory_frames: trajSummary.frame_count,
                t_span: substrateSummary.t_span,
                segment_ids: segTracker.summary().segment_ids ?? [],
                segment_transitions: segmentTransitions,
                transition_report: transitionReport,
            },
            summaries: {
                substrate: substrateSummary,
                trajectory: trajSummary,
                segtracker: segTracker.summary(),
            },
            audit: {
                skipped_windows: skippedWindows,
                merge_failures: mergeFailures,
                consensus_receipts: consensusReceipts,
            },
        },
        trajectoryInterpretation
    );

    return {
        ok: true,

        // ── Artifacts: pipeline artifact classes with artifact_class fields ──
        artifacts: {
            a1,
            a2,
            h1s,
            m1s,
            a3,
            q,
            anomaly_reports: anomalyReports,
            basin_sets: basinSets,
        },

        // ── Substrate: commit/basin/trajectory read-side outputs ─────────────
        substrate: {
            state_count: substrateSummary.state_count,
            basin_count: substrateSummary.basin_count,
            segment_count: substrateSummary.segment_count,
            t_span: substrateSummary.t_span,
            trajectory_frames: trajSummary.frame_count,
            segment_ids: segTracker?.segmentHistory() ?? [],
            segment_transitions: segmentTransitions,
            transition_report: transitionReport,   // report_type: "substrate:observational_report"
        },

        // ── Summaries: plain-data operational views (non-canonical, non-artifact)
        summaries: {
            substrate: substrateSummary,          // report_type: "substrate:operational_summary"
            trajectory: trajSummary,
            segtracker: segTracker?.summary() ?? null,
        },
        semantic_overlay: {
            trajectory: trajectoryInterpretation,
            attention_memory: attentionMemory,
        },
        readiness_overlay: {},
        review_overlay: {},
        // - Interpretation
        interpretation: {
            // Compatibility alias while downstream seams are still being isolated.
            trajectory: trajectoryInterpretation,
            attention_memory: attentionMemory,
        },
        // ── Audit: non-ok results and stub receipts ───────────────────────────
        audit: {
            skipped_windows: skippedWindows,
            merge_failures: mergeFailures,
            consensus_receipts: consensusReceipts,
        },
    };
}

/**
 * @typedef {Object} DoorOnePolicies
 * @property {string}  clock_policy_id
 * @property {Object}  ingest_policy
 * @property {Object}  grid_spec
 * @property {Object}  window_spec
 * @property {Object}  transform_policy
 * @property {Object}  compression_policy
 * @property {Object}  anomaly_policy
 * @property {Object}  merge_policy
 * @property {Object}  post_merge_compression_policy
 * @property {Object}  [reconstruct_policy]
 * @property {Object}  [basin_policy]
 */
