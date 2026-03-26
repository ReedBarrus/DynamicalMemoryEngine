// scripts/run_identity_separability_probe_scale_calibrated.js
//
// Scale-Calibrated Spectral Comparison Probe
//
// One-line anchor:
//   Evaluate whether spectral identity should be compared using global thresholds,
//   per-scale thresholds, or relative cross-scale classification, and determine
//   which preserves identity without contradiction across observation horizons.
//
// Core question:
//   Is spectral identity a scale-invariant quantity, or a scale-conditioned
//   observation?
//
// The three strategies under test:
//
//   Strategy 1 — Per-Scale Thresholds
//     Each scale defines its own separability threshold derived from the
//     empirical distribution of metric values at that scale. Asks: does identity
//     remain consistent when evaluated within its native scale?
//
//   Strategy 2 — Scale-Normalized Distance
//     Normalize the spectral distance so it becomes more portable across scale.
//     Three normalization candidates:
//       A. bin_width     — divide by frequency resolution (Fs/N Hz/bin)
//       B. sqrt_N        — divide by sqrt(window_N), energy-conserving
//       C. entropy       — divide by band-profile entropy (distributional spread)
//     Asks: can we make spectral distances portable across scale?
//
//   Strategy 3 — Relative Within-Scale Classification
//     No global distances. At each scale, rank pairs by metric value and classify
//     as separated if above median. Summarize across scales as a pattern.
//     Asks: is identity better treated as a pattern across scales than a single value?
//
// Absolute energy metrics (absolute_energy_ratio, etc.) are included as a
// control / anchor. They are expected to be strategy-invariant.
//
// Constraint: cohorts, pairs, and pipeline are identical to the multiscale probe.
// Only comparison logic changes.
//
// Boundary contract:
//   - read-side only — no pipeline mutation, no operator changes
//   - no canon, no prediction, no ontology
//   - no automatic best-strategy selection
//   - all strategies run explicitly and in parallel
//   - attributable, reversible, removable
//
// Run:
//   node scripts/run_identity_separability_probe_scale_calibrated.js
//
// Optional env:
//   PROBE_SC_OUTPUT_DIR — override ./out_experiments/identity_probe_scale_calibrated
//
// References:
//   - scripts/run_identity_separability_probe_multiscale.js (pipeline runner)
//   - README_DoorOneRuntimeBoundary.md

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }           from "../operators/ingest/IngestOp.js";
import { ClockAlignOp }       from "../operators/clock/ClockAlignOp.js";
import { WindowOp }           from "../operators/window/WindowOp.js";
import { TransformOp }        from "../operators/transform/TransformOp.js";
import { CompressOp }         from "../operators/compress/CompressOp.js";
import { BasinOp }            from "../operators/basin/BasinOp.js";

const OUTPUT_DIR = process.env.PROBE_SC_OUTPUT_DIR
    ?? "./out_experiments/identity_probe_scale_calibrated";

// ─── Scale / signal parameters (identical to multiscale probe) ────────────────
const SCALE_SET   = [8, 16, 32, 64];
const FS_RAW      = 256;
const DURATION    = 4;
const BASE_AMP    = 1.0;
const SHIFTED_AMP = 2.5;

const COHORT_SPECS = {
    baseline_amplitude:  { label: "baseline_amplitude",  source_id: "probe.baseline_amplitude",  noise_std: 0.02, components: [{ freq_hz: 20, amplitude: BASE_AMP }, { freq_hz: 40, amplitude: BASE_AMP * 0.5 }] },
    amplitude_shift:     { label: "amplitude_shift",     source_id: "probe.amplitude_shift",     noise_std: 0.02, components: [{ freq_hz: 20, amplitude: SHIFTED_AMP }, { freq_hz: 40, amplitude: SHIFTED_AMP * 0.5 }] },
    baseline_frequency:  { label: "baseline_frequency",  source_id: "probe.baseline_frequency",  noise_std: 0.02, components: [{ freq_hz: 8,  amplitude: BASE_AMP }, { freq_hz: 16, amplitude: BASE_AMP * 0.5 }] },
    frequency_shift:     { label: "frequency_shift",     source_id: "probe.frequency_shift",     noise_std: 0.02, components: [{ freq_hz: 8,  amplitude: BASE_AMP }, { freq_hz: 24, amplitude: BASE_AMP * 0.5 }] },
};

const PAIR_PLAN = [
    { a: "baseline_amplitude", b: "amplitude_shift",    label: "baseline_amplitude vs amplitude_shift" },
    { a: "baseline_frequency", b: "frequency_shift",    label: "baseline_frequency vs frequency_shift" },
    { a: "baseline_amplitude", b: "baseline_frequency", label: "baseline_amplitude vs baseline_frequency" },
    { a: "amplitude_shift",    b: "frequency_shift",    label: "amplitude_shift vs frequency_shift" },
];

// Ground truth separation expectations (for strategy evaluation):
//   separated:  baseline_amplitude vs baseline_frequency
//               amplitude_shift vs frequency_shift
//               baseline_frequency vs frequency_shift  (at appropriate scale)
//   similar:    baseline_amplitude vs amplitude_shift   (spectral channel)
// Used for precision / recall evaluation of each strategy.
const GROUND_TRUTH = {
    "baseline_amplitude vs amplitude_shift":    "similar",      // same freq structure, different amp
    "baseline_frequency vs frequency_shift":    "separated",    // different freq structure
    "baseline_amplitude vs baseline_frequency": "separated",    // very different freq structure
    "amplitude_shift vs frequency_shift":       "separated",    // different freq structure
};

const RAW_BAND_EDGES = [0, 16, 32, 48, 64, 80, 96, 112, 128];
function topKForScale(N) { return Math.min(8, Math.floor(N / 2)); }

// ─── Signal generator (deterministic, identical to prior probes) ─────────────
function generateSignal(spec) {
    const n = Math.floor(DURATION * FS_RAW);
    const values = new Array(n), timestamps = new Array(n);
    let ns = 0;
    for (let c = 0; c < spec.source_id.length; c++) ns = (ns * 31 + spec.source_id.charCodeAt(c)) >>> 0;
    function nextNoise() { ns = (ns * 1664525 + 1013904223) >>> 0; return (ns / 4294967296 - 0.5) * 2; }
    for (let i = 0; i < n; i++) {
        const t = i / FS_RAW;
        let x = 0;
        for (const { freq_hz, amplitude } of spec.components) x += amplitude * Math.sin(2 * Math.PI * freq_hz * t);
        x += nextNoise() * spec.noise_std;
        values[i] = x; timestamps[i] = t;
    }
    return { values, timestamps };
}

// ─── Pipeline runner at a given scale (identical to multiscale probe) ─────────
function runRawPipelineAtScale(spec, scale_N) {
    const { values, timestamps } = generateSignal(spec);
    const hop_N  = Math.max(1, Math.floor(scale_N / 2));
    const maxBins = Math.floor(scale_N / 2);
    const segId  = `seg:${spec.source_id}:sc:${scale_N}`;

    const a1r = new IngestOp().run({
        timestamps, values, source_id: spec.source_id,
        channel: "ch0", modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS_RAW },
        clock_policy_id: "clock.probe.sc.v1",
        ingest_policy: { policy_id: "ingest.probe.sc.v1", gap_threshold_multiplier: 3.0, allow_non_monotonic: false, allow_empty: false, non_monotonic_mode: "reject" },
    });
    if (!a1r.ok) throw new Error(`IngestOp ${spec.label} N=${scale_N}: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({ a1: a1r.artifact,
        grid_spec: { Fs_target: FS_RAW, t_ref: timestamps[0], grid_policy: "strict", drift_model: "none",
            non_monotonic_policy: "reject", interp_method: "linear", gap_policy: "interpolate_small",
            small_gap_multiplier: 3.0, max_gap_seconds: null, anti_alias_filter: false } });
    if (!a2r.ok) throw new Error(`ClockAlignOp ${spec.label} N=${scale_N}: ${a2r.error}`);

    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: {
        mode: "fixed", Fs_target: FS_RAW, base_window_N: scale_N, hop_N,
        window_function: "hann", overlap_ratio: 0.5, stationarity_policy: "tolerant",
        salience_policy: "off", gap_policy: "interpolate_small", max_missing_ratio: 0.25, boundary_policy: "truncate",
    }});
    if (!w1r.ok) throw new Error(`WindowOp ${spec.label} N=${scale_N}: ${w1r.error}`);

    const tfOp = new TransformOp(), cpOp = new CompressOp();
    const s1s = [], h1s = [];
    const compPolicy = { policy_id: `compress.sc.N${scale_N}.v1`, selection_method: "topK",
        budget_K: Math.min(16, maxBins), maxK: Math.min(16, maxBins),
        include_dc: false, invariance_lens: "energy", numeric_policy: "tolerant",
        respect_novelty_boundary: false,
        thresholds: { max_recon_rmse: 999, max_energy_residual: 999, max_band_divergence: 999 } };
    const tfPolicy = { policy_id: "transform.sc.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N", scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant" };

    for (let wi = 0; wi < w1r.artifacts.length; wi++) {
        const w1 = w1r.artifacts[wi];
        const tr = tfOp.run({ w1, transform_policy: tfPolicy });
        if (!tr.ok) continue;
        s1s.push(tr.artifact);
        const t_start = w1.grid?.t0 ?? (wi * hop_N / FS_RAW);
        const cr = cpOp.run({ s1: tr.artifact, compression_policy: compPolicy,
            context: { segment_id: segId, window_span: { t_start, t_end: t_start + scale_N / FS_RAW } } });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s, basin_policy: {
            policy_id: "basin.sc.v1", similarity_threshold: 0.5, min_member_count: 1,
            weight_mode: "duration", linkage: "single_link", cross_segment: true } });
        if (br.ok) basinSet = br.artifact;
    }

    const rawEnergyStats = computeRawEnergyStats(values, scale_N);
    return { spec, scale_N, s1s, h1s, basinSet,
        trace_family: "raw_amplitude",
        source_trace_identity: a1r.artifact.stream_id,
        parent_source_identity: spec.source_id,
        band_edges: RAW_BAND_EDGES, top_k: topKForScale(scale_N),
        raw_energy_stats: rawEnergyStats,
        freq_resolution_hz: FS_RAW / scale_N };
}

// ─── Metric helpers ───────────────────────────────────────────────────────────

function l1(a, b) {
    const n = Math.max(a.length, b.length);
    let s = 0; for (let i = 0; i < n; i++) s += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
    return s;
}
function normL1(v) {
    const s = v.reduce((a, x) => a + Math.abs(x), 0);
    return s === 0 ? v.map(() => 0) : v.map(x => x / s);
}
function topKIndices(bins, k) {
    return [...bins].sort((a, b) => b.magnitude - a.magnitude).slice(0, k).map(b => b.k).sort((a, b) => a - b);
}
function topKMagProfile(bins, k) {
    return normL1([...bins].sort((a, b) => b.magnitude - a.magnitude).slice(0, k).sort((a, b) => a.k - b.k).map(b => b.magnitude));
}
function bandProfile(bins, bandEdges) {
    const nB = bandEdges.length - 1;
    const energy = new Array(nB).fill(0);
    for (const b of bins) {
        const e = b.re * b.re + b.im * b.im;
        for (let i = 0; i < nB; i++) {
            if (b.freq_hz >= bandEdges[i] && b.freq_hz < bandEdges[i + 1]) { energy[i] += e; break; }
        }
    }
    return normL1(energy);
}
function meanStd(arr) {
    if (!arr.length) return { mean: null, std: null };
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    return { mean: m, std: Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length) };
}
function meanVec(vecs) {
    if (!vecs.length) return [];
    const len = vecs[0].length;
    const s = new Array(len).fill(0);
    for (const v of vecs) for (let i = 0; i < len; i++) s[i] += v[i] ?? 0;
    return s.map(x => x / vecs.length);
}
function computeRawEnergyStats(values, windowN) {
    const fc = Math.floor(values.length / windowN);
    const perE = new Array(fc);
    for (let f = 0; f < fc; f++) {
        let sq = 0; for (let i = 0; i < windowN; i++) { const v = values[f * windowN + i] ?? 0; sq += v * v; }
        perE[f] = sq / windowN;
    }
    const meanE = perE.reduce((a, b) => a + b, 0) / (fc || 1);
    const maxE = Math.max(...perE.map(e => e || 0)), minE = Math.min(...perE.map(e => e || Infinity));
    return { mean_energy: meanE, frame_count: fc,
             mean_rms: Math.sqrt(meanE), mean_abs: Math.sqrt(meanE),
             energy_variance: fc > 1 ? perE.reduce((a, b) => a + (b - meanE) ** 2, 0) / fc : 0 };
}

// Shannon entropy of a normalized probability vector
function shannonEntropy(v) {
    let h = 0;
    for (const p of v) { if (p > 0) h -= p * Math.log2(p); }
    return h;
}

// ─── Raw metric extraction at a given scale ───────────────────────────────────
// Returns the un-classified raw band_profile_distance per pair for one scale.

function extractRawMetricsAtScale(cohorts, scale_N) {
    const results = {};
    for (const pair of PAIR_PLAN) {
        const cA = cohorts[pair.a], cB = cohorts[pair.b];
        const bandEdges = cA.band_edges;
        const topK = cA.top_k;

        // post_compress h1s
        const binsA = cA.h1s.map(h => h.kept_bins);
        const binsB = cB.h1s.map(h => h.kept_bins);
        const nW = Math.min(binsA.length, binsB.length);

        const bandDists = [];
        for (let wi = 0; wi < nW; wi++) {
            const bpA = bandProfile(binsA[wi], bandEdges);
            const bpB = bandProfile(binsB[wi], bandEdges);
            bandDists.push(l1(bpA, bpB));
        }
        const { mean: meanBD } = meanStd(bandDists);

        // Centroid band profile for entropy normalization
        const meanBpA = meanVec(binsA.slice(0, nW).map(b => bandProfile(b, bandEdges)));
        const meanBpB = meanVec(binsB.slice(0, nW).map(b => bandProfile(b, bandEdges)));
        const centDist = l1(meanBpA, meanBpB);

        // Entropy of each cohort's mean band profile
        const entropyA = shannonEntropy(normL1(meanBpA.map(Math.abs)));
        const entropyB = shannonEntropy(normL1(meanBpB.map(Math.abs)));
        const meanEntropy = (entropyA + entropyB) / 2;

        // Absolute energy metrics
        const sA = cA.raw_energy_stats, sB = cB.raw_energy_stats;
        const maxE = Math.max(sA.mean_energy, sB.mean_energy);
        const minE = Math.min(sA.mean_energy, sB.mean_energy);
        const energyRatio = maxE > 0 && minE > 0 ? maxE / minE : null;

        results[pair.label] = {
            band_profile_distance_raw: meanBD,
            centroid_distance_raw:     centDist,
            mean_entropy_A:            entropyA,
            mean_entropy_B:            entropyB,
            mean_entropy:              meanEntropy,
            freq_resolution_hz:        cA.freq_resolution_hz,  // Fs/N
            scale_N,
            n_windows:                 nW,
            absolute_energy_ratio:     energyRatio,
        };
    }
    return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY 1 — Per-Scale Thresholds
// ═══════════════════════════════════════════════════════════════════════════════
// At each scale, fit a threshold from the empirical distribution:
//   - collect band_profile_distance values for all pairs at this scale
//   - separate them into "should be separated" and "should be similar" groups
//     using GROUND_TRUTH labels
//   - threshold = midpoint between max(similar group) and min(separated group)
//   - if no gap exists, threshold = median of all values

function computePerScaleThresholds(rawMetricsAllScales) {
    // rawMetricsAllScales: Map<scale_N, { pair_label → { band_profile_distance_raw, ... } }>
    const thresholds = {};
    for (const [scale_N, pairMetrics] of Object.entries(rawMetricsAllScales)) {
        const similarVals = [], separatedVals = [];
        for (const [pairLabel, metrics] of Object.entries(pairMetrics)) {
            const v = metrics.band_profile_distance_raw;
            if (v == null) continue;
            if (GROUND_TRUTH[pairLabel] === "similar") similarVals.push(v);
            else separatedVals.push(v);
        }
        // Threshold = midpoint between max(similar) and min(separated)
        const maxSimilar    = similarVals.length  ? Math.max(...similarVals)    : 0;
        const minSeparated  = separatedVals.length ? Math.min(...separatedVals) : 1;

        let threshold, derivation;
        if (minSeparated > maxSimilar) {
            // Clean gap — midpoint is unambiguous
            threshold   = (maxSimilar + minSeparated) / 2;
            derivation  = `midpoint: max_similar=${maxSimilar.toFixed(4)} min_separated=${minSeparated.toFixed(4)}`;
        } else {
            // Overlap — use median of all values as fallback
            const all = [...similarVals, ...separatedVals].sort((a, b) => a - b);
            threshold  = all[Math.floor(all.length / 2)];
            derivation = `overlap — fallback to median: ${threshold.toFixed(4)}`;
        }
        thresholds[scale_N] = { threshold, derivation, max_similar: maxSimilar, min_separated: minSeparated };
    }
    return thresholds;
}

function applyPerScaleThresholds(rawMetricsAllScales, thresholds) {
    const rows = [];
    for (const [scale_N, pairMetrics] of Object.entries(rawMetricsAllScales)) {
        const tObj = thresholds[scale_N];
        for (const [pairLabel, metrics] of Object.entries(pairMetrics)) {
            const v = metrics.band_profile_distance_raw;
            const cl = v == null ? "unknown" : v > tObj.threshold ? "separated" : "similar";
            const expected = GROUND_TRUTH[pairLabel];
            rows.push({
                strategy: "per_scale_threshold",
                scale_N:  parseInt(scale_N),
                pair:     pairLabel,
                metric:   "band_profile_distance",
                raw_value:      v != null ? parseFloat(v.toFixed(6)) : null,
                threshold:      parseFloat(tObj.threshold.toFixed(6)),
                threshold_source: tObj.derivation,
                classification:   cl,
                expected:         expected,
                correct:          cl === expected,
                n_windows:        metrics.n_windows,
            });
        }
    }
    return rows;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY 2 — Scale-Normalized Distance
// ═══════════════════════════════════════════════════════════════════════════════
// Three normalization candidates, applied to band_profile_distance:
//
//   A. bin_width: distance / (Fs/N)
//      Rationale: band_profile_distance accumulates over bands; each band edge
//      spans multiple bins at fine resolution. Dividing by bin-width in Hz
//      partially corrects for this.
//
//   B. sqrt_N: distance / sqrt(N)
//      Rationale: L1 distances over normalized profiles tend to scale with
//      sqrt(dimensionality) for random vectors.
//
//   C. entropy: distance / mean_entropy
//      Rationale: when a band profile is spread across many bands (high entropy),
//      any given distance reflects real separation. When concentrated (low entropy),
//      the same distance may be noise. Normalizing by entropy makes distance
//      comparable across concentration regimes.

const GLOBAL_THRESHOLD_BASE = 0.20;  // from original probe

function applyScaleNormalizedDistance(rawMetricsAllScales) {
    const rows = [];

    // Collect all normalized values to fit a single global threshold post-normalization
    const normValsByStrategy = { bin_width: [], sqrt_N: [], entropy: [] };

    for (const [scale_N, pairMetrics] of Object.entries(rawMetricsAllScales)) {
        const N = parseInt(scale_N);
        const df = FS_RAW / N;  // frequency resolution in Hz/bin

        for (const [pairLabel, metrics] of Object.entries(pairMetrics)) {
            const rawDist = metrics.band_profile_distance_raw;
            if (rawDist == null) continue;

            const normA = rawDist / df;                    // Strategy 2A: per Hz
            const normB = rawDist / Math.sqrt(N);          // Strategy 2B: sqrt-N
            const normC = metrics.mean_entropy > 0         // Strategy 2C: entropy
                ? rawDist / metrics.mean_entropy : rawDist;

            normValsByStrategy.bin_width.push({ scale_N: N, pair: pairLabel, value: normA });
            normValsByStrategy.sqrt_N.push(   { scale_N: N, pair: pairLabel, value: normB });
            normValsByStrategy.entropy.push(  { scale_N: N, pair: pairLabel, value: normC });
        }
    }

    // Fit global threshold per normalization from ground truth separation
    function fitThreshold(entries) {
        const sim = entries.filter(e => GROUND_TRUTH[e.pair] === "similar").map(e => e.value);
        const sep = entries.filter(e => GROUND_TRUTH[e.pair] === "separated").map(e => e.value);
        const maxSim = sim.length ? Math.max(...sim) : 0;
        const minSep = sep.length ? Math.min(...sep) : 1;
        if (minSep > maxSim) return { threshold: (maxSim + minSep) / 2, clean_gap: true, max_similar: maxSim, min_separated: minSep };
        const all = [...sim, ...sep].sort((a, b) => a - b);
        return { threshold: all[Math.floor(all.length / 2)], clean_gap: false, max_similar: maxSim, min_separated: minSep };
    }

    const normThresholds = {
        bin_width: fitThreshold(normValsByStrategy.bin_width),
        sqrt_N:    fitThreshold(normValsByStrategy.sqrt_N),
        entropy:   fitThreshold(normValsByStrategy.entropy),
    };

    // Emit rows
    for (const [scale_N, pairMetrics] of Object.entries(rawMetricsAllScales)) {
        const N = parseInt(scale_N);
        const df = FS_RAW / N;

        for (const [pairLabel, metrics] of Object.entries(pairMetrics)) {
            const rawDist = metrics.band_profile_distance_raw;
            if (rawDist == null) continue;
            const expected = GROUND_TRUTH[pairLabel];

            const normalized = {
                bin_width: rawDist / df,
                sqrt_N:    rawDist / Math.sqrt(N),
                entropy:   metrics.mean_entropy > 0 ? rawDist / metrics.mean_entropy : rawDist,
            };

            for (const [normName, normVal] of Object.entries(normalized)) {
                const tObj = normThresholds[normName];
                const cl   = normVal > tObj.threshold ? "separated" : "similar";
                rows.push({
                    strategy:      "scale_normalized_distance",
                    normalization: normName,
                    scale_N:       N,
                    pair:          pairLabel,
                    metric:        "band_profile_distance",
                    raw_value:     parseFloat(rawDist.toFixed(6)),
                    normalized_value: parseFloat(normVal.toFixed(6)),
                    normalization_factor: parseFloat((normName === "bin_width" ? df : normName === "sqrt_N" ? Math.sqrt(N) : metrics.mean_entropy).toFixed(6)),
                    threshold:     parseFloat(tObj.threshold.toFixed(6)),
                    threshold_clean_gap: tObj.clean_gap,
                    classification: cl,
                    expected,
                    correct: cl === expected,
                    mean_entropy_at_scale: parseFloat(metrics.mean_entropy.toFixed(6)),
                    n_windows:     metrics.n_windows,
                });
            }
        }
    }
    return { rows, normThresholds };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY 3 — Relative Within-Scale Classification
// ═══════════════════════════════════════════════════════════════════════════════
// At each scale independently:
//   1. Rank all pairs by band_profile_distance (ascending)
//   2. Classify as "separated" if value > median of all pairs at this scale
//   3. Summarize across scales as a cross-scale pattern:
//      - scales_separated: count of scales where this pair is "separated"
//      - scales_similar:   count of scales where this pair is "similar"
//      - scale_pattern:    "always_separated" | "always_similar" |
//                          "mostly_separated" | "mostly_similar" | "mixed"

function applyRelativeClassification(rawMetricsAllScales) {
    const perScaleRows = [];

    for (const [scale_N, pairMetrics] of Object.entries(rawMetricsAllScales)) {
        const N = parseInt(scale_N);
        // Median of band_profile_distance across all pairs at this scale
        const allVals = Object.values(pairMetrics).map(m => m.band_profile_distance_raw).filter(v => v != null);
        allVals.sort((a, b) => a - b);
        const median = allVals.length ? allVals[Math.floor(allVals.length / 2)] : 0;

        // Rank by distance ascending (rank 1 = most similar, rank 4 = most separated)
        const sorted = Object.entries(pairMetrics)
            .filter(([, m]) => m.band_profile_distance_raw != null)
            .sort((a, b) => a[1].band_profile_distance_raw - b[1].band_profile_distance_raw);
        const rankOf = {};
        sorted.forEach(([label, _], i) => { rankOf[label] = i + 1; });

        for (const [pairLabel, metrics] of Object.entries(pairMetrics)) {
            const v = metrics.band_profile_distance_raw;
            if (v == null) continue;
            const cl       = v > median ? "separated" : "similar";
            const expected = GROUND_TRUTH[pairLabel];
            perScaleRows.push({
                strategy:       "relative_classification",
                scale_N:        N,
                pair:           pairLabel,
                metric:         "band_profile_distance",
                raw_value:      parseFloat(v.toFixed(6)),
                scale_median:   parseFloat(median.toFixed(6)),
                rank_at_scale:  rankOf[pairLabel],
                classification: cl,
                expected,
                correct:        cl === expected,
                n_windows:      metrics.n_windows,
            });
        }
    }

    // Cross-scale summary per pair
    const summaryRows = [];
    for (const pair of PAIR_PLAN) {
        const pairRows = perScaleRows.filter(r => r.pair === pair.label).sort((a, b) => a.scale_N - b.scale_N);
        const nSep = pairRows.filter(r => r.classification === "separated").length;
        const nSim = pairRows.length - nSep;
        const nTotal = pairRows.length;
        const consistencyRatio = nTotal > 0 ? nSep / nTotal : 0;

        let scalePattern;
        if (consistencyRatio === 1.0) scalePattern = "always_separated";
        else if (consistencyRatio === 0.0) scalePattern = "always_similar";
        else if (consistencyRatio >= 0.75) scalePattern = "mostly_separated";
        else if (consistencyRatio <= 0.25) scalePattern = "mostly_similar";
        else scalePattern = "mixed";

        const expected = GROUND_TRUTH[pair.label];
        const overallCl = consistencyRatio >= 0.5 ? "separated" : "similar";

        summaryRows.push({
            strategy:          "relative_classification",
            pair:              pair.label,
            metric:            "band_profile_distance",
            scales_separated:  nSep,
            scales_similar:    nSim,
            consistency_ratio: parseFloat(consistencyRatio.toFixed(4)),
            scale_pattern:     scalePattern,
            overall_classification: overallCl,
            expected,
            correct:           overallCl === expected,
            per_scale_detail:  pairRows.map(r => ({
                scale_N: r.scale_N, raw_value: r.raw_value,
                classification: r.classification, rank: r.rank_at_scale,
            })),
        });
    }

    return { perScaleRows, summaryRows };
}

// ─── Strategy evaluation summary ─────────────────────────────────────────────
// Compute precision and recall for each strategy against GROUND_TRUTH.
// "Correct" = classification matches expected.

function evaluateStrategy(rows, strategyName) {
    const byPairScale = {};
    for (const r of rows) {
        if (r.expected == null || r.correct == null) continue;
        const key = `${r.pair}::${r.scale_N ?? "summary"}`;
        byPairScale[key] = r.correct;
    }
    const total   = Object.values(byPairScale).length;
    const correct = Object.values(byPairScale).filter(Boolean).length;
    const accuracy = total > 0 ? correct / total : null;

    // Pairs that were supposed to be separated but classified similar (false negatives)
    const falseNeg = rows.filter(r => r.expected === "separated" && r.classification === "similar");
    // Pairs that were supposed to be similar but classified separated (false positives)
    const falsePos = rows.filter(r => r.expected === "similar"    && r.classification === "separated");

    return {
        strategy: strategyName,
        total_decisions:    total,
        correct_decisions:  correct,
        accuracy:           accuracy != null ? parseFloat(accuracy.toFixed(4)) : null,
        false_negatives:    [...new Set(falseNeg.map(r => `${r.pair} @ N=${r.scale_N}`))],
        false_positives:    [...new Set(falsePos.map(r => `${r.pair} @ N=${r.scale_N}`))],
    };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Scale-Calibrated Spectral Comparison Probe");
    console.log(`  output dir  : ${OUTPUT_DIR}`);
    console.log(`  scale_set   : [${SCALE_SET.join(", ")}] @ ${FS_RAW} Hz`);
    console.log(`  strategies  : per_scale_threshold | scale_normalized_distance | relative_classification`);
    console.log(`  anchor      : absolute_energy_ratio as invariant control`);
    console.log();

    // ── Run pipeline at all scales ────────────────────────────────────────────
    console.log("Running pipeline at all scales...");
    const cohortsByScale = {};
    for (const scale_N of SCALE_SET) {
        cohortsByScale[scale_N] = {};
        process.stdout.write(`  N=${String(scale_N).padStart(2)}: `);
        for (const [key, spec] of Object.entries(COHORT_SPECS)) {
            cohortsByScale[scale_N][key] = runRawPipelineAtScale(spec, scale_N);
            process.stdout.write(`${key.substring(0,4)}  `);
        }
        console.log();
    }

    // ── Extract raw metrics at each scale ─────────────────────────────────────
    const rawMetricsAllScales = {};
    for (const scale_N of SCALE_SET) {
        rawMetricsAllScales[scale_N] = extractRawMetricsAtScale(cohortsByScale[scale_N], scale_N);
    }

    console.log("\nRaw band_profile_distance values (ground truth in parens):");
    for (const pair of PAIR_PLAN) {
        const expected = GROUND_TRUTH[pair.label];
        const vals = SCALE_SET.map(N => {
            const v = rawMetricsAllScales[N][pair.label]?.band_profile_distance_raw;
            return `N${N}:${v?.toFixed(3) ?? "—"}`;
        }).join("  ");
        console.log(`  [exp:${expected.padEnd(9)}] ${pair.label.padEnd(48)}  ${vals}`);
    }

    // ── Strategy 1 — Per-scale thresholds ─────────────────────────────────────
    console.log("\n── Strategy 1: Per-Scale Thresholds ──");
    const perScaleThresholds = computePerScaleThresholds(rawMetricsAllScales);
    const s1Rows = applyPerScaleThresholds(rawMetricsAllScales, perScaleThresholds);
    const s1Eval = evaluateStrategy(s1Rows, "per_scale_threshold");

    console.log("  Fitted thresholds:");
    for (const [scale_N, t] of Object.entries(perScaleThresholds)) {
        console.log(`    N=${String(scale_N).padStart(2)}: threshold=${t.threshold.toFixed(4)}  gap_clean=${t.min_separated > t.max_similar}  [${t.derivation}]`);
    }
    console.log(`  Accuracy: ${(s1Eval.accuracy * 100).toFixed(1)}%  (${s1Eval.correct_decisions}/${s1Eval.total_decisions})`);
    if (s1Eval.false_negatives.length) console.log(`  False negatives: ${s1Eval.false_negatives.join(", ")}`);
    if (s1Eval.false_positives.length) console.log(`  False positives: ${s1Eval.false_positives.join(", ")}`);

    // ── Strategy 2 — Scale-normalized distance ─────────────────────────────────
    console.log("\n── Strategy 2: Scale-Normalized Distance ──");
    const { rows: s2Rows, normThresholds } = applyScaleNormalizedDistance(rawMetricsAllScales);
    const normNames = ["bin_width", "sqrt_N", "entropy"];

    for (const norm of normNames) {
        const normRows = s2Rows.filter(r => r.normalization === norm);
        const eval2    = evaluateStrategy(normRows, `scale_normalized_${norm}`);
        const tObj     = normThresholds[norm];
        console.log(`  [${norm.padEnd(10)}]  threshold=${tObj.threshold.toFixed(4)}  clean_gap=${tObj.clean_gap}  accuracy=${(eval2.accuracy * 100).toFixed(1)}%`);
        if (eval2.false_negatives.length) console.log(`    FN: ${eval2.false_negatives.join(", ")}`);
        if (eval2.false_positives.length) console.log(`    FP: ${eval2.false_positives.join(", ")}`);
    }

    // ── Strategy 3 — Relative within-scale classification ─────────────────────
    console.log("\n── Strategy 3: Relative Within-Scale Classification ──");
    const { perScaleRows: s3Rows, summaryRows: s3Summary } = applyRelativeClassification(rawMetricsAllScales);
    const s3Eval = evaluateStrategy(s3Summary, "relative_classification");

    for (const s of s3Summary) {
        const tick = s.correct ? "✓" : "✗";
        console.log(`  ${tick} [exp:${s.expected.padEnd(9)}] ${s.pair.padEnd(48)}  pattern=${s.scale_pattern.padEnd(22)}  sep=${s.scales_separated}/${s.scales_separated + s.scales_similar}  → ${s.overall_classification}`);
    }
    console.log(`  Accuracy: ${(s3Eval.accuracy * 100).toFixed(1)}%  (${s3Eval.correct_decisions}/${s3Eval.total_decisions})`);

    // ── Absolute energy control (strategy-invariant) ──────────────────────────
    // Energy ratio is scale-invariant — show it doesn't change regardless of strategy
    console.log("\n── Absolute Energy Ratio (control — expected scale-invariant) ──");
    for (const pair of PAIR_PLAN) {
        const vals = SCALE_SET.map(N => rawMetricsAllScales[N][pair.label]?.absolute_energy_ratio?.toFixed(3) ?? "—");
        const invariant = new Set(vals).size === 1;
        console.log(`  ${invariant ? "✓" : "⚠"} ${pair.label.padEnd(48)}  ${vals.join("  ")}  ${invariant ? "[invariant]" : "[varies]"}`);
    }

    // ── Write outputs ─────────────────────────────────────────────────────────
    const report = {
        probe_type:     "scale_calibrated_spectral_comparison",
        probe_version:  "0.1.0",
        generated_from: "Door One read-side scale-calibrated comparison probe — no pipeline mutation, no canon",
        generated_at:   new Date().toISOString(),
        probe_config: {
            scale_set:        SCALE_SET,
            cohorts:          Object.keys(COHORT_SPECS),
            pairs:            PAIR_PLAN.map(p => p.label),
            ground_truth:     GROUND_TRUTH,
            global_threshold: GLOBAL_THRESHOLD_BASE,
            strategies:       ["per_scale_threshold", "scale_normalized_distance", "relative_classification"],
            normalizations:   normNames,
        },
        disclaimers: {
            not_canon: true, not_truth: true, not_promotion: true,
            probe_is_read_side_only: true, no_automatic_strategy_selection: true,
            thresholds_are_empirically_derived: true,
        },
        // Raw per-scale metric values for independent analysis
        raw_metrics_by_scale: rawMetricsAllScales,
        // Per-scale thresholds derived by strategy 1
        per_scale_thresholds: perScaleThresholds,
        // Strategy results
        strategy_1: { per_scale_thresholds: perScaleThresholds, rows: s1Rows, evaluation: s1Eval },
        strategy_2: { normalization_thresholds: normThresholds, rows: s2Rows,
            evaluation_by_norm: Object.fromEntries(normNames.map(n => [
                n, evaluateStrategy(s2Rows.filter(r => r.normalization === n), `scale_normalized_${n}`)
            ]))},
        strategy_3: { per_scale_rows: s3Rows, summary_rows: s3Summary, evaluation: s3Eval },
    };

    const reportPath = `${OUTPUT_DIR}/scale_calibrated_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);

    // ── Decision summary ──────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(90));
    console.log("CORE QUESTION: Is spectral identity scale-invariant or scale-conditioned?");
    console.log("─".repeat(90));

    const s1Acc = s1Eval.accuracy;
    const s2BestNorm = normNames.reduce((best, n) => {
        const ev = evaluateStrategy(s2Rows.filter(r => r.normalization === n), n);
        return (!best || ev.accuracy > best.accuracy) ? { name: n, ...ev } : best;
    }, null);
    const s3Acc = s3Eval.accuracy;

    console.log(`\n  Strategy 1 (per-scale thresholds):    accuracy=${(s1Acc*100).toFixed(1)}%`);
    console.log(`  Strategy 2 (scale-normalized):         accuracy=${(s2BestNorm.accuracy*100).toFixed(1)}% [best norm: ${s2BestNorm.name}]`);
    console.log(`  Strategy 3 (relative classification):  accuracy=${(s3Acc*100).toFixed(1)}%`);

    // Global threshold baseline
    const globalRows = [];
    for (const [scale_N, pairMetrics] of Object.entries(rawMetricsAllScales)) {
        for (const [pairLabel, metrics] of Object.entries(pairMetrics)) {
            const v = metrics.band_profile_distance_raw;
            if (v == null) continue;
            globalRows.push({ pair: pairLabel, scale_N: parseInt(scale_N),
                classification: v > GLOBAL_THRESHOLD_BASE ? "separated" : "similar",
                expected: GROUND_TRUTH[pairLabel],
                correct: (v > GLOBAL_THRESHOLD_BASE ? "separated" : "similar") === GROUND_TRUTH[pairLabel] });
        }
    }
    const globalEval = evaluateStrategy(globalRows, "global_threshold");
    console.log(`  Baseline (global threshold ${GLOBAL_THRESHOLD_BASE}):     accuracy=${(globalEval.accuracy*100).toFixed(1)}%`);

    const bestAcc = Math.max(s1Acc, s2BestNorm.accuracy, s3Acc);
    const winner  = bestAcc === s1Acc ? "per_scale_threshold"
        : bestAcc === s2BestNorm.accuracy ? `scale_normalized_${s2BestNorm.name}`
        : "relative_classification";

    console.log(`\n  Best strategy: ${winner}  (accuracy=${(bestAcc*100).toFixed(1)}%)`);
    console.log(`  Global baseline: ${(globalEval.accuracy*100).toFixed(1)}%`);
    console.log(`  Improvement over global: +${((bestAcc - globalEval.accuracy)*100).toFixed(1)} pp`);

    const isConditioned = globalEval.accuracy < 0.80;
    console.log(`\n  Spectral identity is: ${isConditioned
        ? "SCALE-CONDITIONED — global thresholds fail; per-scale or relative strategies required"
        : "APPROXIMATELY SCALE-INVARIANT — global threshold is sufficient"}`);

    const noStrategyWorks = bestAcc < 0.75;
    console.log(`\n  Do we need temporal derivatives next?`);
    if (noStrategyWorks) {
        console.log(`    YES — no comparison strategy achieves reliable accuracy. Temporal derivatives are the correct next probe.`);
    } else if (globalEval.accuracy >= 0.90) {
        console.log(`    NOT YET — global threshold is sufficient at this scale set. Current architecture is stable.`);
    } else {
        console.log(`    NOT YET — scale-calibrated comparison resolves the contradictions. ` +
            `Recommend adopting ${winner} before considering temporal derivatives.`);
    }

    console.log();
    console.log("Done. No pipeline state was mutated by this probe.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
