// scripts/run_identity_separability_probe.js
//
// Identity Separability Probe Runner v0
//
// Purpose:
//   Measure structural separability across the Minimal Cohort Matrix at three
//   pipeline stage taps (post-transform / post-compress / post-basin) and emit
//   receipt-style diagnostic rows.
//
// Boundary contract:
//   - read-side only — operators are called normally but probe taps only READ outputs
//   - no mutation of pipeline behavior, artifact shapes, or operator contracts
//   - no canon logic, no ontology changes
//   - probe layer is fully self-contained and removable (no imports by other files)
//   - not canon, not promotion, not truth
//
// Minimal Cohort Matrix:
//   baseline_amplitude  — standard tone, nominal amplitude
//   amplitude_shift     — same tone structure, amplitude scaled up
//   baseline_frequency  — different dominant frequency, nominal amplitude
//   frequency_shift     — baseline_frequency structure with one frequency replaced
//
// Pairwise grid (4 pairs):
//   baseline_amplitude  vs amplitude_shift
//   baseline_frequency  vs frequency_shift
//   baseline_amplitude  vs baseline_frequency
//   amplitude_shift     vs frequency_shift
//
// Stage taps (3 stages):
//   post_transform  — S1 SpectralFrame (full spectrum bins)
//   post_compress   — H1 HarmonicState (kept_bins)
//   post_basin      — BN BasinSet (centroid_band_profile)
//
// Metrics (5):
//   dominant_bin_profile_difference  — L1 distance between top-K magnitude profiles
//   topK_overlap_ratio               — fraction of top-K bin indices shared
//   band_profile_distance            — L1 distance between normalized band energy vectors
//   centroid_distance                — L1 distance between band-profile centroids
//   temporal_stability               — std-dev of band_profile_distance across N windows
//
// Run:
//   node scripts/run_identity_separability_probe.js
//
// Optional env:
//   PROBE_OUTPUT_DIR   — override ./out_experiments/identity_separability_probe_v0
//   PROBE_WINDOW_COUNT — override number of windows to probe (default: all)
//
// References:
//   - README_MasterConstitution.md §3 (structural / runtime memory layers)
//   - README_DoorOneRuntimeBoundary.md (read-side only posture)

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }      from "../operators/ingest/IngestOp.js";
import { ClockAlignOp }  from "../operators/clock/ClockAlignOp.js";
import { WindowOp }      from "../operators/window/WindowOp.js";
import { TransformOp }   from "../operators/transform/TransformOp.js";
import { CompressOp }    from "../operators/compress/CompressOp.js";
import { BasinOp }       from "../operators/basin/BasinOp.js";

const OUTPUT_DIR = process.env.PROBE_OUTPUT_DIR
    ?? "./out_experiments/identity_separability_probe_v0";
const MAX_WINDOWS = process.env.PROBE_WINDOW_COUNT
    ? Number.parseInt(process.env.PROBE_WINDOW_COUNT, 10)
    : Infinity;

// ─── Cohort signal parameters ─────────────────────────────────────────────────
// Four cohorts, each described by a list of { freq_hz, amplitude } components.
// Generated synthetically — no file dependency.

const FS          = 256;       // Hz
const DURATION    = 4;         // seconds
const BASE_AMP    = 1.0;
const SHIFTED_AMP = 2.5;       // amplitude_shift factor vs baseline

const COHORT_SPECS = {
    baseline_amplitude: {
        label: "baseline_amplitude",
        description: "Standard tone: 20 Hz + 40 Hz harmonics, nominal amplitude",
        components: [
            { freq_hz: 20, amplitude: BASE_AMP },
            { freq_hz: 40, amplitude: BASE_AMP * 0.5 },
        ],
        noise_std: 0.02,
        source_id: "probe.baseline_amplitude",
    },
    amplitude_shift: {
        label: "amplitude_shift",
        description: "Same tone structure as baseline_amplitude, amplitude scaled up",
        components: [
            { freq_hz: 20, amplitude: SHIFTED_AMP },
            { freq_hz: 40, amplitude: SHIFTED_AMP * 0.5 },
        ],
        noise_std: 0.02,
        source_id: "probe.amplitude_shift",
    },
    baseline_frequency: {
        label: "baseline_frequency",
        description: "Different dominant frequency: 8 Hz + 16 Hz, nominal amplitude",
        components: [
            { freq_hz: 8,  amplitude: BASE_AMP },
            { freq_hz: 16, amplitude: BASE_AMP * 0.5 },
        ],
        noise_std: 0.02,
        source_id: "probe.baseline_frequency",
    },
    frequency_shift: {
        label: "frequency_shift",
        description: "baseline_frequency structure with second harmonic replaced: 8 Hz + 24 Hz",
        components: [
            { freq_hz: 8,  amplitude: BASE_AMP },
            { freq_hz: 24, amplitude: BASE_AMP * 0.5 },
        ],
        noise_std: 0.02,
        source_id: "probe.frequency_shift",
    },
};

const PAIR_PLAN = [
    { a: "baseline_amplitude", b: "amplitude_shift",     label: "baseline_amplitude vs amplitude_shift" },
    { a: "baseline_frequency", b: "frequency_shift",     label: "baseline_frequency vs frequency_shift" },
    { a: "baseline_amplitude", b: "baseline_frequency",  label: "baseline_amplitude vs baseline_frequency" },
    { a: "amplitude_shift",    b: "frequency_shift",     label: "amplitude_shift vs frequency_shift" },
];

// ─── Pipeline policies ────────────────────────────────────────────────────────

const POLICIES = {
    clock_policy_id: "clock.probe.v1",

    ingest_policy: {
        policy_id: "ingest.probe.v1",
        gap_threshold_multiplier: 3.0,
        allow_non_monotonic: false,
        allow_empty: false,
        non_monotonic_mode: "reject",
    },

    grid_spec: {
        Fs_target: FS,
        t_ref: 0,
        grid_policy: "strict",
        drift_model: "none",
        non_monotonic_policy: "reject",
        interp_method: "linear",
        gap_policy: "interpolate_small",
        small_gap_multiplier: 3.0,
        max_gap_seconds: null,
        anti_alias_filter: false,
    },

    window_spec: {
        mode: "fixed",
        Fs_target: FS,
        base_window_N: 256,
        hop_N: 128,
        window_function: "hann",
        overlap_ratio: 0.5,
        stationarity_policy: "tolerant",
        salience_policy: "off",
        gap_policy: "interpolate_small",
        max_missing_ratio: 0.25,
        boundary_policy: "truncate",
    },

    transform_policy: {
        policy_id: "transform.probe.v1",
        transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum",
        numeric_policy: "tolerant",
    },

    compression_policy: {
        policy_id: "compress.probe.v1",
        selection_method: "topK",
        budget_K: 16,
        maxK: 16,
        include_dc: false,
        invariance_lens: "energy",
        numeric_policy: "tolerant",
        respect_novelty_boundary: false,
        thresholds: {
            max_recon_rmse: 999,
            max_energy_residual: 999,
            max_band_divergence: 999,
        },
    },

    basin_policy: {
        policy_id: "basin.probe.v1",
        similarity_threshold: 0.5,
        min_member_count: 1,
        weight_mode: "duration",
        linkage: "single_link",
        cross_segment: true,
    },
};

// Band edges for band_profile_distance metric (covers full spectrum at FS/2)
// 8 bands equally spaced up to FS/2 = 128 Hz
const BAND_EDGES = [0, 16, 32, 48, 64, 80, 96, 112, 128];

// Top-K for dominant_bin_profile_difference and topK_overlap_ratio
const TOP_K = 8;

// ─── Signal generator ─────────────────────────────────────────────────────────

function generateSignal(spec) {
    const n = Math.floor(DURATION * FS);
    const dt = 1 / FS;
    const values = new Array(n);
    const timestamps = new Array(n);

    // Deterministic LCG noise seeded from source_id string
    let noiseState = 0;
    for (let c = 0; c < spec.source_id.length; c++) noiseState = (noiseState * 31 + spec.source_id.charCodeAt(c)) >>> 0;
    function nextNoise() {
        noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
        return (noiseState / 4294967296 - 0.5) * 2;
    }

    for (let i = 0; i < n; i++) {
        const t = i * dt;
        let x = 0;
        for (const { freq_hz, amplitude } of spec.components) {
            x += amplitude * Math.sin(2 * Math.PI * freq_hz * t);
        }
        x += nextNoise() * spec.noise_std;
        values[i] = x;
        timestamps[i] = t;
    }

    return { values, timestamps };
}

// ─── Pipeline runner ──────────────────────────────────────────────────────────
// Runs the pipeline for one cohort and returns read-only stage taps.
// Returns { s1s, h1s, basinSet } — no pipeline objects are mutated.

function runCohortPipeline(spec) {
    const { values, timestamps } = generateSignal(spec);

    // A1
    const ingestOp = new IngestOp();
    const ingestResult = ingestOp.run({
        timestamps,
        values,
        source_id: spec.source_id,
        channel: "ch0",
        modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS },
        clock_policy_id: POLICIES.clock_policy_id,
        ingest_policy: POLICIES.ingest_policy,
    });
    if (!ingestResult.ok) throw new Error(`IngestOp failed for ${spec.label}: ${ingestResult.error}`);
    const a1 = ingestResult.artifact;

    // A2
    const clockAlignOp = new ClockAlignOp();
    const alignResult = clockAlignOp.run({
        a1,
        grid_spec: { ...POLICIES.grid_spec, t_ref: timestamps[0] },
    });
    if (!alignResult.ok) throw new Error(`ClockAlignOp failed for ${spec.label}: ${alignResult.error}`);
    const a2 = alignResult.artifact;

    // W1s
    const windowOp = new WindowOp();
    const windowResult = windowOp.run({ a2, window_spec: POLICIES.window_spec });
    if (!windowResult.ok) throw new Error(`WindowOp failed for ${spec.label}: ${windowResult.error}`);
    const w1s = windowResult.artifacts;

    const transformOp  = new TransformOp();
    const compressOp   = new CompressOp();

    const s1s = [];   // post_transform tap
    const h1s = [];   // post_compress tap

    const segmentId = `seg:${spec.source_id}:0`;
    const limit = isFinite(MAX_WINDOWS) ? Math.min(w1s.length, MAX_WINDOWS) : w1s.length;

    for (let wi = 0; wi < limit; wi++) {
        const w1 = w1s[wi];

        // ── post-transform tap ────────────────────────────────────────────────
        const tResult = transformOp.run({ w1, transform_policy: POLICIES.transform_policy });
        if (!tResult.ok) continue;
        const s1 = tResult.artifact;   // READ-ONLY tap
        s1s.push(s1);

        // ── post-compress tap ─────────────────────────────────────────────────
        const t_start = w1.grid?.t0 ?? (wi * POLICIES.window_spec.hop_N / FS);
        const t_end   = t_start + POLICIES.window_spec.base_window_N / FS;
        const cResult = compressOp.run({
            s1,
            compression_policy: POLICIES.compression_policy,
            context: {
                segment_id: segmentId,
                window_span: { t_start, t_end },
            },
        });
        if (!cResult.ok) continue;
        const h1 = cResult.artifact;   // READ-ONLY tap
        h1s.push(h1);
    }

    // ── post-basin tap ────────────────────────────────────────────────────────
    // BasinOp over all H1s for this cohort — READ-ONLY output
    let basinSet = null;
    if (h1s.length > 0) {
        const basinOp = new BasinOp();
        const bResult = basinOp.run({
            states: h1s,
            basin_policy: POLICIES.basin_policy,
        });
        if (bResult.ok) basinSet = bResult.artifact;   // READ-ONLY tap
    }

    return { s1s, h1s, basinSet, stream_id: a1.stream_id, segment_id: segmentId };
}

// ─── Probe metrics ────────────────────────────────────────────────────────────

/** L1 distance between two numeric vectors (zero-padded to equal length). */
function l1(a, b) {
    const n = Math.max(a.length, b.length);
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
    return sum;
}

/** L2 norm (for normalization). */
function l2norm(v) {
    let s = 0;
    for (const x of v) s += x * x;
    return Math.sqrt(s);
}

/** Normalize vector to L1 sum = 1. Returns zero vector if sum is 0. */
function normL1(v) {
    const s = v.reduce((acc, x) => acc + Math.abs(x), 0);
    return s === 0 ? v.map(() => 0) : v.map(x => x / s);
}

/** Extract top-K bin indices by magnitude from a bins array. */
function topKIndices(bins, k) {
    return [...bins]
        .sort((a, b) => b.magnitude - a.magnitude)
        .slice(0, k)
        .map(b => b.k)
        .sort((a, b) => a - b);   // sort indices for deterministic comparison
}

/** Normalized magnitude profile of top-K bins (in index order). */
function topKMagProfile(bins, k) {
    const topBins = [...bins]
        .sort((a, b) => b.magnitude - a.magnitude)
        .slice(0, k)
        .sort((a, b) => a.k - b.k);   // sort by bin index
    const mags = topBins.map(b => b.magnitude);
    return normL1(mags);
}

/**
 * Band profile from a bins array, given band_edges array.
 * Returns normalized energy per band.
 */
function bandProfile(bins, bandEdges) {
    const nBands = bandEdges.length - 1;
    const energy = new Array(nBands).fill(0);
    for (const b of bins) {
        const e = b.re * b.re + b.im * b.im;
        for (let i = 0; i < nBands; i++) {
            if (b.freq_hz >= bandEdges[i] && b.freq_hz < bandEdges[i + 1]) {
                energy[i] += e;
                break;
            }
        }
    }
    return normL1(energy);
}

/** Mean and std-dev of an array of numbers. */
function meanStd(arr) {
    if (arr.length === 0) return { mean: null, std: null };
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
    return { mean: m, std: Math.sqrt(variance) };
}

// ─── Stage metric extractors ──────────────────────────────────────────────────
// Each returns { windows_a: number[][], windows_b: number[][] }
// where each inner array is the per-window band profile (or metric-relevant vector).

function extractPostTransform(cohortA, cohortB) {
    // Use full spectrum — all bins from S1
    const nW = Math.min(cohortA.s1s.length, cohortB.s1s.length);
    const wa = cohortA.s1s.slice(0, nW).map(s1 => s1.spectrum);
    const wb = cohortB.s1s.slice(0, nW).map(s1 => s1.spectrum);
    return { bins_a: wa, bins_b: wb, nW };
}

function extractPostCompress(cohortA, cohortB) {
    const nW = Math.min(cohortA.h1s.length, cohortB.h1s.length);
    const wa = cohortA.h1s.slice(0, nW).map(h1 => h1.kept_bins);
    const wb = cohortB.h1s.slice(0, nW).map(h1 => h1.kept_bins);
    return { bins_a: wa, bins_b: wb, nW };
}

function extractPostBasin(cohortA, cohortB) {
    // BasinOp gives centroids — one per basin per cohort.
    // We use the centroid profiles directly for single-value comparison.
    // (temporal_stability is not applicable at basin level — uses H1s instead)
    const centroidsA = (cohortA.basinSet?.basins ?? []).map(b => b.centroid_band_profile);
    const centroidsB = (cohortB.basinSet?.basins ?? []).map(b => b.centroid_band_profile);
    return { centroidsA, centroidsB };
}

// ─── Core probe: compute all metrics for one (pair, stage) ───────────────────

function probeStage(cohortA, cohortB, stage) {
    const results = [];

    if (stage === "post_transform" || stage === "post_compress") {
        const { bins_a, bins_b, nW } =
            stage === "post_transform"
                ? extractPostTransform(cohortA, cohortB)
                : extractPostCompress(cohortA, cohortB);

        if (nW === 0) {
            return [makeRow({ pair: pairLabel(cohortA, cohortB), stage,
                metric: "no_windows", raw_value: null,
                interpretation: "no overlapping windows available" })];
        }

        // Per-window metric arrays for temporal_stability
        const bandDistances     = [];
        const dominantDiffs     = [];
        const topKOverlaps      = [];

        for (let wi = 0; wi < nW; wi++) {
            const bpA = bandProfile(bins_a[wi], BAND_EDGES);
            const bpB = bandProfile(bins_b[wi], BAND_EDGES);
            bandDistances.push(l1(bpA, bpB));

            const magA = topKMagProfile(bins_a[wi], TOP_K);
            const magB = topKMagProfile(bins_b[wi], TOP_K);
            dominantDiffs.push(l1(magA, magB));

            const idxA = new Set(topKIndices(bins_a[wi], TOP_K));
            const idxB = topKIndices(bins_b[wi], TOP_K);
            const shared = idxB.filter(k => idxA.has(k)).length;
            topKOverlaps.push(shared / TOP_K);
        }

        // Mean values (summary across windows)
        const bdStats   = meanStd(bandDistances);
        const ddStats   = meanStd(dominantDiffs);
        const tkStats   = meanStd(topKOverlaps);

        // centroid_distance: compare mean band profiles across all windows
        const meanBpA = meanProfile(bins_a.map(b => bandProfile(b, BAND_EDGES)));
        const meanBpB = meanProfile(bins_b.map(b => bandProfile(b, BAND_EDGES)));
        const centDist = l1(meanBpA, meanBpB);

        // temporal_stability: std-dev of band_profile_distance across windows
        const tempStab = bandDistances.length > 1 ? bdStats.std : null;

        const pair = pairLabel(cohortA, cohortB);

        results.push(
            makeRow({
                pair, stage,
                metric: "dominant_bin_profile_difference",
                raw_value: ddStats.mean,
                n_windows: nW,
                temporal_stability: tempStab,
                interpretation: interpretDominantDiff(ddStats.mean),
            }),
            makeRow({
                pair, stage,
                metric: "topK_overlap_ratio",
                raw_value: tkStats.mean,
                n_windows: nW,
                temporal_stability: tkStats.std ?? null,
                interpretation: interpretTopKOverlap(tkStats.mean),
            }),
            makeRow({
                pair, stage,
                metric: "band_profile_distance",
                raw_value: bdStats.mean,
                n_windows: nW,
                temporal_stability: tempStab,
                interpretation: interpretBandDist(bdStats.mean),
            }),
            makeRow({
                pair, stage,
                metric: "centroid_distance",
                raw_value: centDist,
                n_windows: nW,
                temporal_stability: null,   // centroid_distance is already aggregated
                interpretation: interpretCentroidDist(centDist),
            }),
        );

    } else if (stage === "post_basin") {
        const { centroidsA, centroidsB } = extractPostBasin(cohortA, cohortB);
        const pair = pairLabel(cohortA, cohortB);

        if (centroidsA.length === 0 || centroidsB.length === 0) {
            results.push(makeRow({
                pair, stage,
                metric: "basin_centroid_distance",
                raw_value: null,
                interpretation: "insufficient basins formed — check basin_policy.min_member_count",
                next_action: "lower min_member_count or increase cohort duration",
            }));
            return results;
        }

        // Primary centroids (first basin, duration-weighted — largest by membership)
        const cA = centroidsA[0];
        const cB = centroidsB[0];
        const centDist = l1(cA, cB);

        // temporal_stability at basin level: use H1 band-profile distances
        const h1BandDists = [];
        const nW = Math.min(cohortA.h1s.length, cohortB.h1s.length);
        for (let wi = 0; wi < nW; wi++) {
            const bpA = bandProfile(cohortA.h1s[wi].kept_bins, BAND_EDGES);
            const bpB = bandProfile(cohortB.h1s[wi].kept_bins, BAND_EDGES);
            h1BandDists.push(l1(bpA, bpB));
        }
        const stabStats = meanStd(h1BandDists);
        const tempStab  = h1BandDists.length > 1 ? stabStats.std : null;

        results.push(
            makeRow({
                pair, stage,
                metric: "centroid_distance",
                raw_value: centDist,
                n_windows: null,
                basin_count_a: centroidsA.length,
                basin_count_b: centroidsB.length,
                temporal_stability: tempStab,
                interpretation: interpretCentroidDist(centDist),
            }),
            makeRow({
                pair, stage,
                metric: "band_profile_distance",
                raw_value: stabStats.mean,
                n_windows: nW,
                temporal_stability: tempStab,
                interpretation: interpretBandDist(stabStats.mean),
            }),
        );
    }

    return results;
}

// ─── Helpers for metrics ──────────────────────────────────────────────────────

function meanProfile(profiles) {
    if (!profiles.length) return [];
    const len = profiles[0].length;
    const sum = new Array(len).fill(0);
    for (const p of profiles) for (let i = 0; i < len; i++) sum[i] += (p[i] ?? 0);
    return sum.map(x => x / profiles.length);
}

function pairLabel(cohortA, cohortB) {
    return `${cohortA.spec.label} vs ${cohortB.spec.label}`;
}

// ─── Classification and thresholds ───────────────────────────────────────────
// Thresholds are conservative starting points for the v0 probe.
// They should be recalibrated after empirical runs.

const THRESHOLDS = {
    band_profile_distance: {
        separated:   0.20,   // > 0.20 → clearly separated
        borderline:  0.08,   // 0.08–0.20 → borderline
    },
    dominant_bin_diff: {
        separated:   0.30,
        borderline:  0.10,
    },
    topK_overlap: {
        similar:     0.75,   // > 0.75 → structurally similar
        borderline:  0.40,   // 0.40–0.75 → partial overlap
    },
    centroid_distance: {
        separated:   0.20,
        borderline:  0.08,
    },
};

function classify(value, metric) {
    if (value == null) return "unknown";
    const t = THRESHOLDS[metric];
    if (!t) return "unclassified";

    if (metric === "topK_overlap_ratio") {
        // Higher = more similar (inverse direction)
        if (value >= t.similar)   return "similar";
        if (value >= t.borderline) return "borderline";
        return "separated";
    }

    // Lower = more similar for distance metrics
    if (value > t.separated)   return "separated";
    if (value > t.borderline)  return "borderline";
    return "similar";
}

function classifyStability(std) {
    if (std == null) return "n/a";
    if (std < 0.02)  return "stable";
    if (std < 0.08)  return "variable";
    return "unstable";
}

function interpretDominantDiff(v) {
    if (v == null) return "no data";
    if (v > THRESHOLDS.dominant_bin_diff.separated) return "dominant bins are structurally distinct";
    if (v > THRESHOLDS.dominant_bin_diff.borderline) return "dominant bins partially overlap";
    return "dominant bins are near-identical";
}

function interpretTopKOverlap(v) {
    if (v == null) return "no data";
    if (v >= THRESHOLDS.topK_overlap.similar) return "high structural overlap — cohorts share dominant frequency content";
    if (v >= THRESHOLDS.topK_overlap.borderline) return "partial structural overlap";
    return "low overlap — cohorts occupy distinct frequency bins";
}

function interpretBandDist(v) {
    if (v == null) return "no data";
    if (v > THRESHOLDS.band_profile_distance.separated) return "band energy distribution is clearly distinct";
    if (v > THRESHOLDS.band_profile_distance.borderline) return "band energy shows partial divergence";
    return "band energy distribution is structurally similar";
}

function interpretCentroidDist(v) {
    if (v == null) return "no data";
    if (v > THRESHOLDS.centroid_distance.separated) return "structural neighborhoods are clearly separated";
    if (v > THRESHOLDS.centroid_distance.borderline) return "structural neighborhoods partially diverge";
    return "structural neighborhoods overlap — may cluster together";
}

function nextAction(classification, metric) {
    if (classification === "similar" && metric !== "topK_overlap_ratio") {
        return "cohorts may not be distinguishable at this stage — check signal generation or tighten anomaly threshold";
    }
    if (classification === "separated") {
        return "cohorts are separable at this stage — proceed to cross-run comparison";
    }
    if (classification === "borderline") {
        return "marginal separation — verify signal fidelity or try tighter window/compression policy";
    }
    if (classification === "similar" && metric === "topK_overlap_ratio") {
        return "high bin overlap expected for same-frequency cohorts — verify via band_profile_distance";
    }
    return "inspect raw_value against threshold and review signal spec";
}

// ─── Row builder (receipt-style output) ──────────────────────────────────────

function makeRow({
    pair, stage, metric,
    raw_value = null,
    n_windows = null,
    basin_count_a = null,
    basin_count_b = null,
    temporal_stability = null,
    interpretation = "",
    next_action: next_action_override = null,
}) {
    const thresholdKey = {
        dominant_bin_profile_difference: "dominant_bin_diff",
        topK_overlap_ratio:              "topK_overlap",
        band_profile_distance:           "band_profile_distance",
        centroid_distance:               "centroid_distance",
        basin_centroid_distance:         "centroid_distance",
    }[metric] ?? metric;

    const classification = classify(raw_value, thresholdKey === "dominant_bin_diff"
        ? "dominant_bin_diff" : thresholdKey);

    const thresholds = THRESHOLDS[thresholdKey]
        ? JSON.stringify(THRESHOLDS[thresholdKey])
        : "see probe source";

    const stability_label = classifyStability(temporal_stability);
    const suggested_action = next_action_override ?? nextAction(classification, metric);

    return {
        pair,
        stage,
        metric,
        raw_value: typeof raw_value === "number" ? parseFloat(raw_value.toFixed(6)) : raw_value,
        threshold:           thresholds,
        classification,
        n_windows,
        basin_count_a,
        basin_count_b,
        temporal_stability:  typeof temporal_stability === "number"
            ? parseFloat(temporal_stability.toFixed(6)) : temporal_stability,
        temporal_stability_label: stability_label,
        interpretation,
        next_action:         suggested_action,
    };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Identity Separability Probe v0");
    console.log(`  output dir : ${OUTPUT_DIR}`);
    console.log(`  cohorts    : ${Object.keys(COHORT_SPECS).join(", ")}`);
    console.log(`  pairs      : ${PAIR_PLAN.length}`);
    console.log(`  stages     : post_transform, post_compress, post_basin`);
    console.log(`  metrics    : dominant_bin_profile_difference, topK_overlap_ratio,`);
    console.log(`               band_profile_distance, centroid_distance, temporal_stability`);
    console.log();

    // Build all cohorts once (each cohort runs the pipeline once)
    console.log("Running pipeline for each cohort...");
    const cohorts = {};
    for (const [key, spec] of Object.entries(COHORT_SPECS)) {
        process.stdout.write(`  ${key.padEnd(30)} `);
        const result = runCohortPipeline(spec);
        result.spec = spec;
        cohorts[key] = result;
        console.log(
            `s1s=${result.s1s.length}  h1s=${result.h1s.length}  ` +
            `basins=${result.basinSet?.basins?.length ?? 0}`
        );
    }
    console.log();

    // Run all (pair × stage) probes
    const allRows = [];
    const STAGES = ["post_transform", "post_compress", "post_basin"];

    console.log("Running pairwise probes...");
    for (const pair of PAIR_PLAN) {
        const cohortA = cohorts[pair.a];
        const cohortB = cohorts[pair.b];
        process.stdout.write(`  ${pair.label.padEnd(55)} `);
        let pairRowCount = 0;
        for (const stage of STAGES) {
            const rows = probeStage(cohortA, cohortB, stage);
            allRows.push(...rows);
            pairRowCount += rows.length;
        }
        console.log(`${pairRowCount} rows`);
    }
    console.log();

    // Write full diagnostic output
    const report = {
        probe_type:    "identity_separability_probe",
        probe_version: "0.1.0",
        generated_from:
            "Door One pipeline read-side probe — no pipeline mutation, no canon, not promotion",
        generated_at:  new Date().toISOString(),
        probe_config: {
            cohorts:        Object.keys(COHORT_SPECS),
            pairs:          PAIR_PLAN.map(p => p.label),
            stages:         STAGES,
            metrics:        ["dominant_bin_profile_difference", "topK_overlap_ratio",
                             "band_profile_distance", "centroid_distance", "temporal_stability"],
            top_k:          TOP_K,
            band_edges:     BAND_EDGES,
            window_policy:  {
                base_window_N: POLICIES.window_spec.base_window_N,
                hop_N:         POLICIES.window_spec.hop_N,
                Fs_target:     FS,
            },
        },
        disclaimers: {
            not_canon:                    true,
            not_truth:                    true,
            not_promotion:                true,
            probe_is_read_side_only:      true,
            thresholds_are_starting_points: true,
        },
        total_rows: allRows.length,
        rows: allRows,
    };

    const reportPath = `${OUTPUT_DIR}/separability_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`Full report written to ${reportPath}`);

    // Write compact table (TSV for easy inspection)
    const tsvLines = [
        ["pair", "stage", "metric", "raw_value", "classification",
         "temporal_stability", "temporal_stability_label", "n_windows",
         "interpretation", "next_action"].join("\t"),
        ...allRows.map(r => [
            r.pair, r.stage, r.metric,
            r.raw_value ?? "—",
            r.classification,
            r.temporal_stability ?? "—",
            r.temporal_stability_label,
            r.n_windows ?? "—",
            r.interpretation,
            r.next_action,
        ].join("\t")),
    ];
    const tsvPath = `${OUTPUT_DIR}/separability_table.tsv`;
    await writeFile(tsvPath, tsvLines.join("\n"), "utf8");
    console.log(`Compact table written to ${tsvPath}`);

    // Console summary — classification distribution per pair
    console.log();
    console.log("Summary — classification distribution per pair:");
    for (const pair of PAIR_PLAN) {
        const pairRows = allRows.filter(r => r.pair === pair.label && r.raw_value != null);
        const counts = { similar: 0, borderline: 0, separated: 0 };
        for (const r of pairRows) counts[r.classification] = (counts[r.classification] ?? 0) + 1;
        console.log(
            `  ${pair.label.padEnd(55)}` +
            `  separated=${counts.separated ?? 0}` +
            `  borderline=${counts.borderline ?? 0}` +
            `  similar=${counts.similar ?? 0}`
        );
    }
    console.log();
    console.log("Done. No pipeline state was mutated by this probe.");
}

main().catch(err => {
    console.error("Fatal:", err.message ?? err);
    process.exit(1);
});
