// run_pipeline_substrate.js
//
// Integrated pipeline runner — batch/offline mode
//
// Extends run_pipeline.js with:
//   - SegmentTracker (AnomalyOp → segment_id management)
//   - MemorySubstrate (append-only H1/M1 store with trajectory)
//   - BasinOp (structural neighborhood formation per segment)
//   - Trajectory dynamics (velocity, convergence, dwell)
//   - ConsensusOp stub (legitimacy validation + promotion receipt)
//   - Extended output artifacts (BasinSet, trajectory frames, substrate summary)
//
// This is the canonical Door One offline pipeline.
// Real-time operation (AnalogSamplerOp → streaming flush) builds on this.
//
// Usage:
//   node run_pipeline_substrate.js
//
// Outputs written to ./out_substrate/

import { mkdir, writeFile } from "node:fs/promises";
import { makeTestSignal } from "../fixtures/test_signal.js";

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
import { BasinOp } from "../operators/basin/BasinOp.js";
import { ConsensusOp } from "../operators/consensus/ConsensusOp.js";

// ─── Policies ─────────────────────────────────────────────────────────────────

const CLOCK_POLICY_ID = "clock.synthetic.v1";

const INGEST_POLICY = {
    policy_id: "ingest.synthetic.v1",
    gap_threshold_multiplier: 3.0,
    allow_non_monotonic: false,
    allow_empty: false,
    non_monotonic_mode: "reject",
};

const GRID_SPEC = {
    Fs_target: 256,
    t_ref: 0,
    grid_policy: "strict",
    drift_model: "none",
    non_monotonic_policy: "reject",
    interp_method: "linear",
    gap_policy: "interpolate_small",
    small_gap_multiplier: 3.0,
    max_gap_seconds: null,
    anti_alias_filter: false,
};

const WIN_SPEC = {
    mode: "fixed",
    Fs_target: 256,
    base_window_N: 256,
    hop_N: 128,
    window_function: "hann",
    overlap_ratio: 0.5,
    stationarity_policy: "tolerant",
    salience_policy: "off",
    gap_policy: "interpolate_small",
    max_missing_ratio: 0.25,
    boundary_policy: "pad",
};

const TRANSFORM_POLICY = {
    policy_id: "transform.synthetic.v1",
    transform_type: "fft",
    normalization_mode: "forward_1_over_N",
    scaling_convention: "real_input_half_spectrum",
    numeric_policy: "tolerant",
};

const COMPRESS_POLICY = {
    policy_id: "compress.synthetic.v1",
    selection_method: "topK",
    budget_K: 8,
    maxK: 8,
    include_dc: true,
    invariance_lens: "identity",
    numeric_policy: "tolerant",
    respect_novelty_boundary: true,
    thresholds: {
        max_recon_rmse: 0.25,
        max_energy_residual: 0.25,
        max_band_divergence: 0.3,
    },
};

const ANOMALY_POLICY = {
    policy_id: "anomaly.synthetic.v1",
    invariance_mode: "band_profile",
    divergence_metric: "band_l1",
    threshold_value: 0.15,
    frequency_tolerance_hz: 1.0,
    phase_sensitivity_mode: "strict",
    novelty_min_duration: 0,
    segmentation_mode: "strict",
    dominant_bin_threshold: 0.2,
    new_frequency_threshold: 0.15,
    vanished_frequency_threshold: 0.15,
    energy_shift_threshold: 0.15,
};

const MERGE_POLICY = {
    policy_id: "merge.synthetic.v1",
    adjacency_rule: "time_touching",
    phase_alignment_mode: "clock_delta_rotation",
    weights_mode: "duration",
    novelty_gate: "strict",
    merge_mode: "authoritative",
    grid_tolerance: 0,
};

const POST_MERGE_COMPRESS = {
    policy_id: "merge.compress.synthetic.v1",
    selection_method: "topK",
    budget_K: 8,
    maxK: 8,
    include_dc: true,
    invariance_lens: "identity",
    thresholds: {
        max_recon_rmse: 0.30,
        max_energy_residual: 0.30,
        max_band_divergence: 0.30,
    },
};

const RECONSTRUCT_POLICY = {
    policy_id: "reconstruct.synthetic.v1",
    output_format: "values",
    fill_missing_bins: "ZERO",
    validate_invariants: true,
    window_compensation: "NONE",
    numeric_policy: "tolerant",
};

const QUERY_POLICY = {
    policy_id: "query.synthetic.v1",
    scoring: "band_l1",
    normalization: "band_profile_norm",
    phase_used: false,
    allow_lens_merge: false,
    topK: 5,
};

const BASIN_POLICY = {
    policy_id: "basin.synthetic.v1",
    similarity_threshold: 0.35,
    min_member_count: 2,
    weight_mode: "duration",
    linkage: "single_link",
};

const EPOCH_CONTEXT = {
    epoch_id: "epoch.synthetic.1",
    t_start: 0,
    t_end: 20,
    settlement_policy_id: "settlement.synthetic.v1",
    consensus_window: 10,
};

const CONSENSUS_POLICY = {
    policy_id: "consensus.synthetic.v1",
    promotion_threshold: 0.8,
    max_energy_drift: 0.1,
    max_band_drift: 0.1,
    coherence_tests: ["energy_invariance", "band_profile_invariance"],
    settlement_mode: "single_node",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir("./out_substrate", { recursive: true });

    // ── Step 0: Generate synthetic signal ─────────────────────────────────────
    const fixture = makeTestSignal({
        durationSec: 10,
        fs: 256,
        seed: 42,
        noiseStd: 0.03,
        source_id: "synthetic_fixture_v1",
        channel: "ch0",
        modality: "voltage",
        units: "arb",
    });
    const { signal, truth } = fixture;
    console.log(`\nGenerated test signal: ${truth.durationSec}s @ ${truth.fs} Hz`);
    console.log(`Segments in truth: ${truth.segments.length}`);

    // ── Step 1: A1 — Ingest ───────────────────────────────────────────────────
    const ingestOp = new IngestOp();
    const ingest = assertOk("IngestOp", ingestOp.run({
        timestamps: signal.timestamps,
        values: signal.values,
        meta: signal.meta,
        clock_policy_id: CLOCK_POLICY_ID,
        ingest_policy: INGEST_POLICY,
        stream_id: signal.stream_id,
        source_id: signal.source_id,
        channel: signal.channel,
        modality: signal.modality,
    }));
    const a1 = ingest.artifact;
    console.log(`\nA1: ${a1.stream_id}`);

    // ── Step 2: A2 — Clock align ──────────────────────────────────────────────
    const clockAlignOp = new ClockAlignOp();
    const align = assertOk("ClockAlignOp", clockAlignOp.run({
        a1,
        grid_spec: { ...GRID_SPEC, t_ref: a1.timestamps[0] ?? 0 },
    }));
    const a2 = align.artifact;
    console.log(`A2: ${a2.aligned_values.length} aligned samples`);

    // ── Step 3: W1 — Window ───────────────────────────────────────────────────
    const windowOp = new WindowOp();
    const windowed = assertOk("WindowOp", windowOp.run({ a2, window_spec: WIN_SPEC }));
    const w1s = windowed.artifacts;
    console.log(`W1: ${w1s.length} windows`);

    // ── Step 4: S1 → H1 with segmentation ────────────────────────────────────
    // The segment tracker is initialized after we know the stream_id from A1.
    const segTracker = new SegmentTracker({ stream_id: a1.stream_id });
    const substrate = new MemorySubstrate({
        substrate_id: `substrate:${a1.stream_id}`,
        trajectory_max_frames: 2048,
    });

    const transformOp = new TransformOp();
    const compressOp = new CompressOp();
    const anomalyOp = new AnomalyOp();

    const h1s = [];
    const anomalyReports = [];
    const segmentTransitions = [];
    const skippedWindows = [];

    // Rolling baseline: first H1 in each segment serves as the baseline.
    // Reset when a segment transition occurs.
    let currentBaseline = null;

    for (const w1 of w1s) {
        // Transform
        const tOut = transformOp.run({ w1, transform_policy: TRANSFORM_POLICY });
        if (!tOut.ok) {
            skippedWindows.push({ window_id: w1.window_id, stage: "transform", error: tOut.error, reasons: tOut.reasons });
            continue;
        }
        const s1 = tOut.artifact;

        // Compress — use current segment_id from tracker
        const cOut = compressOp.run({
            s1,
            compression_policy: COMPRESS_POLICY,
            context: {
                segment_id: segTracker.currentSegmentId,
                window_span: {
                    t_start: w1.grid.t0,
                    t_end: w1.grid.t0 + w1.grid.N / w1.grid.Fs_target,
                },
            },
        });
        if (!cOut.ok) {
            skippedWindows.push({ window_id: w1.window_id, stage: "compress", error: cOut.error, reasons: cOut.reasons });
            continue;
        }
        const h1 = cOut.artifact;
        h1s.push(h1);

        // Set baseline for first H1 in this segment
        const isSegmentBaseline = (currentBaseline === null);
        if (isSegmentBaseline) {
            currentBaseline = h1;
        }

        // Anomaly check (skip for the first H1 in the current segment — it is the baseline)
        let report = null;
        let currentNovelty = false;

        if (!isSegmentBaseline && currentBaseline) {
            const aOut = anomalyOp.run({
                h_current: h1,
                h_base: currentBaseline,
                anomaly_policy: ANOMALY_POLICY,
            });
            if (!aOut.ok) {
                // AnomalyOp failure is non-fatal; log and continue
                console.warn(`  AnomalyOp warning on window ${w1.window_id}: ${aOut.error}`);
            } else {
                report = aOut.artifact;
                anomalyReports.push(report);
                currentNovelty = Boolean(report.novelty_gate_triggered);
            }
        }

        // Commit to substrate with the novelty result for THIS H1
        substrate.commit(h1, { novelty_gate_triggered: currentNovelty });

        // Feed to segment tracker AFTER compress/anomaly for this H1, and BEFORE next compress
        if (report) {
            const transition = segTracker.observe(report);
            if (transition) {
                segmentTransitions.push(transition);
                console.log(`  ↳ Segment transition: ${transition.from_segment_id} → ${transition.to_segment_id} at t=${transition.t_transition?.toFixed(3)}`);
                // Reset baseline for new segment — next H1 will become it
                currentBaseline = null;
            }
        }
    }

    console.log(`\nS1→H1: ${h1s.length} harmonic states, ${skippedWindows.length} skipped`);
    console.log(`AnomalyOp: ${anomalyReports.length} reports, ${segmentTransitions.length} segment transitions`);
    console.log(`SegmentTracker: ${segTracker.summary().segment_count} segments`);

    // ── Step 5: Merge adjacent H1s within each segment ────────────────────────
    const mergeOp = new MergeOp();
    const m1s = [];
    const mergeFailures = [];

    // Group H1s by segment_id
    const h1sBySegment = new Map();
    for (const h1 of h1s) {
        if (!h1sBySegment.has(h1.segment_id)) h1sBySegment.set(h1.segment_id, []);
        h1sBySegment.get(h1.segment_id).push(h1);
    }

    for (const [segId, segH1s] of h1sBySegment) {
        // Merge pairs within each segment
        for (let i = 0; i + 1 < segH1s.length; i += 2) {
            const mOut = mergeOp.run({
                states: [segH1s[i], segH1s[i + 1]],
                merge_policy: MERGE_POLICY,
                post_merge_compression_policy: POST_MERGE_COMPRESS,
                merge_tree_position: { level: 0, index: Math.floor(i / 2) },
            });
            if (mOut.ok) {
                m1s.push(mOut.artifact);
                substrate.commit(mOut.artifact);
            } else {
                mergeFailures.push({ segment_id: segId, pair: i, error: mOut.error, reasons: mOut.reasons });
            }
        }
    }

    console.log(`\nMergeOp: ${m1s.length} merged states, ${mergeFailures.length} failures`);

    // ── Step 6: Basin formation per segment ───────────────────────────────────
    const basinOp = new BasinOp();
    const allBasinSets = [];

    for (const segId of segTracker.segmentHistory()) {
        const segStates = substrate.statesForSegment(segId);
        if (segStates.length === 0) continue;

        // Skip segments with too few states for min_member_count
        const enoughForBasin = segStates.length >= BASIN_POLICY.min_member_count;
        if (!enoughForBasin) {
            console.log(`  Basin: segment ${segId} has only ${segStates.length} state(s) — using min_member_count=1`);
        }

        const bPolicy = enoughForBasin
            ? BASIN_POLICY
            : { ...BASIN_POLICY, min_member_count: 1, policy_id: "basin.synthetic.v1.single" };

        const rbResult = substrate.rebuildBasins({ segment_id: segId, basin_policy: bPolicy });
        if (rbResult.ok) {
            allBasinSets.push(rbResult.artifact);
            console.log(`  Basin: segment ${segId} → ${rbResult.artifact.basins.length} basins from ${segStates.length} states`);
        } else {
            console.warn(`  Basin: rebuildBasins failed for ${segId}: ${rbResult.error}`);
        }
    }

    // ── Step 7: Trajectory dynamics ───────────────────────────────────────────
    const vel = substrate.trajectory.velocityEstimate(8);
    const conv = substrate.trajectory.isConverging(8);
    const dwell = substrate.trajectory.currentBasinDwellCount();

    console.log(`\nTrajectory:`);
    console.log(`  frames: ${substrate.trajectory.summary().frame_count}`);
    console.log(`  velocity (mean L1/frame): ${vel.mean_l1_delta?.toFixed(4) ?? "n/a"}`);
    console.log(`  converging: ${conv.is_converging} (slope=${conv.trend_slope?.toFixed(4) ?? "n/a"}, sufficient_data=${conv.sufficient_data})`);
    console.log(`  current basin dwell: ${dwell} consecutive frames`);

    // ── Step 8: Reconstruct from first M1 (or H1 fallback) ───────────────────
    const reconstructOp = new ReconstructOp();
    const reconTarget = m1s[0] ?? h1s[0];
    const reconstructed = assertOk("ReconstructOp", reconstructOp.run({
        state: reconTarget,
        reconstruct_policy: RECONSTRUCT_POLICY,
    }));
    const a3 = reconstructed.artifact;

    // ── Step 9: Query ─────────────────────────────────────────────────────────
    const queryOp = new QueryOp();
    const corpus = [...h1s, ...m1s];
    const query = assertOk("QueryOp", queryOp.run({
        query_spec: {
            query_id: "query.synthetic.1",
            kind: "similarity",
            mode: "IDENTITY",
            scope: {
                stream_id: a1.stream_id,
                allow_cross_segment: true,
                same_grid_only: true,
            },
            query: { state: h1s[0] },
        },
        query_policy: QUERY_POLICY,
        corpus,
    }));
    const q = query.artifact;

    // ── Step 10: ConsensusOp stub on each M1 ─────────────────────────────────
    const consensusOp = new ConsensusOp();
    const consensusReceipts = [];
    for (const m1 of m1s.slice(0, 5)) {  // first 5 for brevity
        const cr = consensusOp.run({
            candidate: m1,
            epoch_context: EPOCH_CONTEXT,
            consensus_policy: CONSENSUS_POLICY,
        });
        consensusReceipts.push({
            state_id: m1.state_id,
            ok: cr.ok,
            result: cr.result,
            legitimacy_passed: cr.receipt?.legitimacy_passed,
            legitimacy_failures: cr.receipt?.legitimacy_failures,
            candidate_confidence: cr.receipt?.candidate_confidence,
            result_reason: cr.receipt?.result_reason,
        });
    }

    const legitimacyPassCount = consensusReceipts.filter(r => r.legitimacy_passed).length;
    console.log(`\nConsensusOp: ${consensusReceipts.length} candidates evaluated`);
    console.log(`  legitimacy passed: ${legitimacyPassCount}/${consensusReceipts.length}`);
    console.log(`  all deferred (Door One stub): ${consensusReceipts.every(r => r.result === "deferred")}`);

    // ── Step 11: Substrate summary ────────────────────────────────────────────
    const substrateSummary = substrate.summary();
    console.log(`\nSubstrate:`);
    console.log(`  states: ${substrateSummary.state_count} (H1 + M1)`);
    console.log(`  basins: ${substrateSummary.basin_count}`);
    console.log(`  segments: ${substrateSummary.segment_count}`);
    console.log(`  trajectory frames: ${substrateSummary.trajectory?.frame_count}`);

    // ── Step 12: Write artifacts ──────────────────────────────────────────────
    await writeJson("./out_substrate/fixture.signal.json", signal);
    await writeJson("./out_substrate/fixture.truth.json", truth);
    await writeJson("./out_substrate/A1.json", a1);
    await writeJson("./out_substrate/A2.json", a2);
    await writeJson("./out_substrate/W1.json", w1s);
    await writeJson("./out_substrate/H1.json", h1s);
    await writeJson("./out_substrate/AnomalyReports.json", anomalyReports);
    await writeJson("./out_substrate/SegmentTransitions.json", segmentTransitions);
    await writeJson("./out_substrate/M1.json", m1s);
    await writeJson("./out_substrate/A3.json", a3);
    await writeJson("./out_substrate/Q.json", q);
    await writeJson("./out_substrate/BasinSets.json", allBasinSets);
    await writeJson("./out_substrate/TrajectoryFrames.json", substrate.trajectory.all());
    await writeJson("./out_substrate/ConsensusReceipts.json", consensusReceipts);
    await writeJson("./out_substrate/skipped_windows.json", skippedWindows);
    await writeJson("./out_substrate/merge_failures.json", mergeFailures);

    const summary = {
        run_timestamp: new Date().toISOString(),
        stream_id: a1.stream_id,

        // Signal
        signal_duration_sec: truth.durationSec,
        signal_fs: truth.fs,
        sample_count: signal.values.length,
        truth_segment_count: truth.segments.length,

        // Pipeline
        aligned_sample_count: a2.aligned_values.length,
        window_count: w1s.length,
        h1_count: h1s.length,
        m1_count: m1s.length,
        anomaly_report_count: anomalyReports.length,
        skipped_window_count: skippedWindows.length,
        merge_failure_count: mergeFailures.length,

        // Segmentation
        segment_count: segTracker.summary().segment_count,
        segment_transitions: segmentTransitions.length,
        segment_ids: segTracker.segmentHistory(),

        // Substrate
        substrate_state_count: substrateSummary.state_count,
        substrate_basin_count: substrateSummary.basin_count,
        substrate_trajectory_frames: substrateSummary.trajectory?.frame_count,
        t_span: substrateSummary.t_span,

        // Basin sets
        basin_sets: allBasinSets.map(bs => ({
            segment_id: bs.segment_id,
            basin_count: bs.basins.length,
            states_considered: bs.receipts.states_considered,
            unassigned: bs.receipts.states_unassigned,
        })),

        // Trajectory
        trajectory_velocity_mean_l1: vel.mean_l1_delta,
        trajectory_converging: conv.is_converging,
        trajectory_convergence_slope: conv.trend_slope,
        trajectory_sufficient_data: conv.sufficient_data,
        trajectory_basin_dwell: dwell,

        // Consensus
        consensus_candidates_evaluated: consensusReceipts.length,
        consensus_legitimacy_pass_rate: consensusReceipts.length > 0
            ? legitimacyPassCount / consensusReceipts.length
            : null,

        // Query
        query_result_count: q.results.length,
        top_query_refs: q.results.slice(0, 3).map(r => r.ref),

        // Reconstruction
        reconstruction_target_class: reconTarget.artifact_class,
        reconstruction_target_id: reconTarget.state_id,
    };

    await writeJson("./out_substrate/summary.json", summary);

    console.log("\n── Run complete ──────────────────────────────────────");
    console.log("Artifacts written to ./out_substrate/");
    console.log(`  A1, A2, W1, H1[${h1s.length}], M1[${m1s.length}], A3, Q`);
    console.log(`  AnomalyReports[${anomalyReports.length}], SegmentTransitions[${segmentTransitions.length}]`);
    console.log(`  BasinSets[${allBasinSets.length}], TrajectoryFrames[${substrate.trajectory.all().length}]`);
    console.log(`  ConsensusReceipts[${consensusReceipts.length}]`);
    console.log(`  summary.json`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertOk(label, result) {
    if (!result?.ok) {
        console.error(`\n${label} FAILED`);
        console.error(JSON.stringify(result, null, 2));
        process.exit(1);
    }
    return result;
}

async function writeJson(path, value) {
    await writeFile(path, JSON.stringify(value, null, 2), "utf8");
}

main().catch(err => { console.error(err); process.exit(1); });
