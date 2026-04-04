// scripts/run_identity_separability_probe_rms_envelope.js
//
// Identity Separability Probe — Multitrace (raw amplitude + RMS envelope)
//
// Purpose:
//   Extend the single-trace identity separability probe to run in parallel
//   across two sibling trace families:
//     A. raw_amplitude  — existing spectral/band-profile lens (same as v0 probe)
//     B. rms_envelope   — RMS energy-envelope derived trace
//
//   Decision target:
//     - Does the RMS/envelope trace separate amplitude-shift more clearly?
//     - Does it weaken frequency discrimination, as expected?
//     - Is parallel trace family comparison justified before multi-scale work?
//
// Boundary contract:
//   - read-side only — no mutation of pipeline behavior or artifact meaning
//   - RmsEnvelopeAdapter derives the envelope before ingest; raw path is unchanged
//   - two trace families are PARALLEL, never fused or auto-selected
//   - no canon logic, no prediction logic, no ontology
//   - receipt rows carry trace_family for explicit attribution
//
// Run:
//   node scripts/run_identity_separability_probe_rms_envelope.js
//
// Optional env:
//   PROBE_MT_OUTPUT_DIR    — override ./out_experiments/identity_separability_probe_multitrace
//   PROBE_MT_WINDOW_COUNT  — limit windows per cohort (default: all)
//
// References:
//   - operators/sampler/RmsEnvelopeAdapter.js (envelope derivation)
//   - scripts/run_identity_separability_probe.js (v0 probe, single-trace model)
//   - README_DoorOneAdapterPolicy.md (pre-ingest adapter posture)
//   - README_DoorOneRuntimeBoundary.md (read-side posture)

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }         from "../operators/ingest/IngestOp.js";
import { ClockAlignOp }     from "../operators/clock/ClockAlignOp.js";
import { WindowOp }         from "../operators/window/WindowOp.js";
import { TransformOp }      from "../operators/transform/TransformOp.js";
import { CompressOp }       from "../operators/compress/CompressOp.js";
import { BasinOp }          from "../operators/basin/BasinOp.js";
import { RmsEnvelopeAdapter } from "../operators/sampler/RmsEnvelopeAdapter.js";

const OUTPUT_DIR  = process.env.PROBE_MT_OUTPUT_DIR
    ?? "./out_experiments/identity_separability_probe_multitrace";
const MAX_WINDOWS = process.env.PROBE_MT_WINDOW_COUNT
    ? Number.parseInt(process.env.PROBE_MT_WINDOW_COUNT, 10)
    : Infinity;

// ─── Signal parameters ────────────────────────────────────────────────────────

const FS_RAW      = 256;
const DURATION    = 4;
const BASE_AMP    = 1.0;
const SHIFTED_AMP = 2.5;

// RMS envelope parameters — window of 16 samples → Fs_envelope = 16 Hz
const RMS_WINDOW_N = 16;
// FS_ENV = FS_RAW / RMS_WINDOW_N = 16 Hz → Nyquist = 8 Hz

const COHORT_SPECS = {
    baseline_amplitude: {
        label: "baseline_amplitude",
        components: [{ freq_hz: 20, amplitude: BASE_AMP }, { freq_hz: 40, amplitude: BASE_AMP * 0.5 }],
        noise_std: 0.02,
        source_id: "probe.baseline_amplitude",
    },
    amplitude_shift: {
        label: "amplitude_shift",
        components: [{ freq_hz: 20, amplitude: SHIFTED_AMP }, { freq_hz: 40, amplitude: SHIFTED_AMP * 0.5 }],
        noise_std: 0.02,
        source_id: "probe.amplitude_shift",
    },
    baseline_frequency: {
        label: "baseline_frequency",
        components: [{ freq_hz: 8, amplitude: BASE_AMP }, { freq_hz: 16, amplitude: BASE_AMP * 0.5 }],
        noise_std: 0.02,
        source_id: "probe.baseline_frequency",
    },
    frequency_shift: {
        label: "frequency_shift",
        components: [{ freq_hz: 8, amplitude: BASE_AMP }, { freq_hz: 24, amplitude: BASE_AMP * 0.5 }],
        noise_std: 0.02,
        source_id: "probe.frequency_shift",
    },
};

const PAIR_PLAN = [
    { a: "baseline_amplitude", b: "amplitude_shift",    label: "baseline_amplitude vs amplitude_shift" },
    { a: "baseline_frequency", b: "frequency_shift",    label: "baseline_frequency vs frequency_shift" },
    { a: "baseline_amplitude", b: "baseline_frequency", label: "baseline_amplitude vs baseline_frequency" },
    { a: "amplitude_shift",    b: "frequency_shift",    label: "amplitude_shift vs frequency_shift" },
];

// ─── Raw amplitude pipeline policies ─────────────────────────────────────────

const RAW_POLICIES = {
    clock_policy_id: "clock.probe.v1",
    ingest_policy: {
        policy_id: "ingest.probe.v1",
        gap_threshold_multiplier: 3.0,
        allow_non_monotonic: false,
        allow_empty: false,
        non_monotonic_mode: "reject",
    },
    grid_spec: {
        Fs_target: FS_RAW, t_ref: 0,
        grid_policy: "strict", drift_model: "none",
        non_monotonic_policy: "reject", interp_method: "linear",
        gap_policy: "interpolate_small", small_gap_multiplier: 3.0,
        max_gap_seconds: null, anti_alias_filter: false,
    },
    window_spec: {
        mode: "fixed", Fs_target: FS_RAW,
        base_window_N: 256, hop_N: 128,
        window_function: "hann", overlap_ratio: 0.5,
        stationarity_policy: "tolerant", salience_policy: "off",
        gap_policy: "interpolate_small", max_missing_ratio: 0.25, boundary_policy: "truncate",
    },
    transform_policy: {
        policy_id: "transform.probe.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant",
    },
    compression_policy: {
        policy_id: "compress.probe.v1", selection_method: "topK",
        budget_K: 16, maxK: 16, include_dc: false, invariance_lens: "energy",
        numeric_policy: "tolerant", respect_novelty_boundary: false,
        thresholds: { max_recon_rmse: 999, max_energy_residual: 999, max_band_divergence: 999 },
    },
    basin_policy: {
        policy_id: "basin.probe.v1", similarity_threshold: 0.5,
        min_member_count: 1, weight_mode: "duration",
        linkage: "single_link", cross_segment: true,
    },
};

// ─── Envelope pipeline policies ───────────────────────────────────────────────
// The envelope runs at Fs_env = 16 Hz. Window size must be meaningful at that rate.
// 8-sample window at 16 Hz → 0.5 s temporal support (reasonable for envelope structure).

const FS_ENV = FS_RAW / RMS_WINDOW_N;  // 16 Hz
const ENV_WIN_N = 8;                   // 8 samples @ 16 Hz = 0.5 s

const ENV_POLICIES = {
    clock_policy_id: "clock.probe.env.v1",
    ingest_policy: {
        policy_id: "ingest.probe.env.v1",
        gap_threshold_multiplier: 3.0,
        allow_non_monotonic: false,
        allow_empty: false,
        non_monotonic_mode: "reject",
    },
    grid_spec: {
        Fs_target: FS_ENV, t_ref: 0,
        grid_policy: "strict", drift_model: "none",
        non_monotonic_policy: "reject", interp_method: "linear",
        gap_policy: "interpolate_small", small_gap_multiplier: 3.0,
        max_gap_seconds: null, anti_alias_filter: false,
    },
    window_spec: {
        mode: "fixed", Fs_target: FS_ENV,
        base_window_N: ENV_WIN_N, hop_N: Math.floor(ENV_WIN_N / 2),
        window_function: "hann", overlap_ratio: 0.5,
        stationarity_policy: "tolerant", salience_policy: "off",
        gap_policy: "interpolate_small", max_missing_ratio: 0.25, boundary_policy: "truncate",
    },
    transform_policy: {
        policy_id: "transform.probe.env.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant",
    },
    compression_policy: {
        policy_id: "compress.probe.env.v1", selection_method: "topK",
        budget_K: 4, maxK: 4, include_dc: true, invariance_lens: "energy",
        numeric_policy: "tolerant", respect_novelty_boundary: false,
        thresholds: { max_recon_rmse: 999, max_energy_residual: 999, max_band_divergence: 999 },
    },
    basin_policy: {
        policy_id: "basin.probe.env.v1", similarity_threshold: 0.6,
        min_member_count: 1, weight_mode: "duration",
        linkage: "single_link", cross_segment: true,
    },
};

// Band edges for each trace family
// Raw amplitude: 8 bands over 0–128 Hz (Nyquist of 256 Hz signal)
const RAW_BAND_EDGES = [0, 16, 32, 48, 64, 80, 96, 112, 128];
// RMS envelope: 4 bands over 0–8 Hz (Nyquist of 16 Hz envelope signal)
const ENV_BAND_EDGES = [0, 2, 4, 6, 8];

const TOP_K_RAW = 8;
const TOP_K_ENV = 4;   // fewer bins at lower sample rate

// ─── Signal generator ─────────────────────────────────────────────────────────

function generateSignal(spec) {
    const n  = Math.floor(DURATION * FS_RAW);
    const dt = 1 / FS_RAW;
    const values = new Array(n);
    const timestamps = new Array(n);
    let noiseState = 0;
    for (let c = 0; c < spec.source_id.length; c++)
        noiseState = (noiseState * 31 + spec.source_id.charCodeAt(c)) >>> 0;
    function nextNoise() {
        noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
        return (noiseState / 4294967296 - 0.5) * 2;
    }
    for (let i = 0; i < n; i++) {
        const t = i * dt;
        let x = 0;
        for (const { freq_hz, amplitude } of spec.components)
            x += amplitude * Math.sin(2 * Math.PI * freq_hz * t);
        x += nextNoise() * spec.noise_std;
        values[i] = x; timestamps[i] = t;
    }
    return { values, timestamps };
}

// ─── Pipeline runners ─────────────────────────────────────────────────────────

function runRawPipeline(spec) {
    const { values, timestamps } = generateSignal(spec);
    const segmentId = `seg:${spec.source_id}:0`;

    const a1r = new IngestOp().run({
        timestamps, values, source_id: spec.source_id,
        channel: "ch0", modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS_RAW },
        clock_policy_id: RAW_POLICIES.clock_policy_id,
        ingest_policy: RAW_POLICIES.ingest_policy,
    });
    if (!a1r.ok) throw new Error(`[raw] IngestOp ${spec.label}: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({
        a1: a1r.artifact,
        grid_spec: { ...RAW_POLICIES.grid_spec, t_ref: timestamps[0] },
    });
    if (!a2r.ok) throw new Error(`[raw] ClockAlignOp ${spec.label}: ${a2r.error}`);

    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: RAW_POLICIES.window_spec });
    if (!w1r.ok) throw new Error(`[raw] WindowOp ${spec.label}: ${w1r.error}`);

    const tfOp = new TransformOp();
    const cpOp = new CompressOp();
    const s1s = [], h1s = [];
    const limit = isFinite(MAX_WINDOWS) ? Math.min(w1r.artifacts.length, MAX_WINDOWS) : w1r.artifacts.length;

    for (let wi = 0; wi < limit; wi++) {
        const w1 = w1r.artifacts[wi];
        const tr = tfOp.run({ w1, transform_policy: RAW_POLICIES.transform_policy });
        if (!tr.ok) continue;
        s1s.push(tr.artifact);
        const t_start = w1.grid?.t0 ?? (wi * RAW_POLICIES.window_spec.hop_N / FS_RAW);
        const cr = cpOp.run({
            s1: tr.artifact, compression_policy: RAW_POLICIES.compression_policy,
            context: { segment_id: segmentId, window_span: { t_start, t_end: t_start + RAW_POLICIES.window_spec.base_window_N / FS_RAW } },
        });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s, basin_policy: RAW_POLICIES.basin_policy });
        if (br.ok) basinSet = br.artifact;
    }

    return {
        spec, s1s, h1s, basinSet,
        trace_family: "raw_amplitude",
        source_trace_identity:  a1r.artifact.stream_id,
        parent_source_identity: spec.source_id,
        band_edges: RAW_BAND_EDGES,
        top_k: TOP_K_RAW,
        // Pre-ingest absolute energy stats — from raw values before any normalization
        raw_energy_stats: computeRawEnergyStats(values, RAW_POLICIES.window_spec.base_window_N),
    };
}

function runEnvelopePipeline(spec) {
    const { values, timestamps } = generateSignal(spec);
    const segmentId = `seg:${spec.source_id}:env:0`;

    const envAdapter = new RmsEnvelopeAdapter({
        rms_window_N: RMS_WINDOW_N,
        Fs_raw: FS_RAW,
        clock_policy_id: ENV_POLICIES.clock_policy_id,
        ingest_policy_id: ENV_POLICIES.ingest_policy.policy_id,
    });

    const dr = envAdapter.derive({ values, timestamps, parentSpec: spec });
    if (!dr.ok) throw new Error(`[env] derive ${spec.label}: ${dr.error}`);

    const envInput = dr.ingest_input;

    const a1r = new IngestOp().run(envInput);
    if (!a1r.ok) throw new Error(`[env] IngestOp ${spec.label}: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({
        a1: a1r.artifact,
        grid_spec: { ...ENV_POLICIES.grid_spec, t_ref: envInput.timestamps[0] },
    });
    if (!a2r.ok) throw new Error(`[env] ClockAlignOp ${spec.label}: ${a2r.error}`);

    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: ENV_POLICIES.window_spec });
    if (!w1r.ok) throw new Error(`[env] WindowOp ${spec.label}: ${w1r.error}`);

    const tfOp = new TransformOp();
    const cpOp = new CompressOp();
    const s1s  = [], h1s = [];
    const limit = isFinite(MAX_WINDOWS) ? Math.min(w1r.artifacts.length, MAX_WINDOWS) : w1r.artifacts.length;

    for (let wi = 0; wi < limit; wi++) {
        const w1     = w1r.artifacts[wi];
        const tr     = tfOp.run({ w1, transform_policy: ENV_POLICIES.transform_policy });
        if (!tr.ok) continue;
        s1s.push(tr.artifact);
        const t_start = w1.grid?.t0 ?? (wi * ENV_POLICIES.window_spec.hop_N / FS_ENV);
        const cr = cpOp.run({
            s1: tr.artifact, compression_policy: ENV_POLICIES.compression_policy,
            context: { segment_id: segmentId, window_span: { t_start, t_end: t_start + ENV_WIN_N / FS_ENV } },
        });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s, basin_policy: ENV_POLICIES.basin_policy });
        if (br.ok) basinSet = br.artifact;
    }

    return {
        spec, s1s, h1s, basinSet,
        trace_family: "rms_envelope",
        source_trace_identity:  a1r.artifact.stream_id,
        parent_source_identity: spec.source_id,
        // Pre-ingest absolute energy stats — from envelope values before any normalization
        // Envelope values are RMS amplitudes, so energy here = mean(rms_value^2) per window
        raw_energy_stats: computeRawEnergyStats(dr.ingest_input.values, ENV_POLICIES.window_spec.base_window_N),
        envelope_meta: {
            rms_window_N:     RMS_WINDOW_N,
            Fs_raw:           FS_RAW,
            Fs_envelope:      FS_ENV,
            note: "Envelope spectral content limited to 0–8 Hz. post_transform / post_compress " +
                  "metrics reflect envelope-spectral structure, not raw-amplitude spectral structure.",
        },
        band_edges: ENV_BAND_EDGES,
        top_k: TOP_K_ENV,
    };
}

// ─── Shared metric helpers ────────────────────────────────────────────────────

function l1(a, b) {
    const n = Math.max(a.length, b.length);
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
    return s;
}

function normL1(v) {
    const s = v.reduce((acc, x) => acc + Math.abs(x), 0);
    return s === 0 ? v.map(() => 0) : v.map(x => x / s);
}

function topKIndices(bins, k) {
    return [...bins].sort((a, b) => b.magnitude - a.magnitude)
        .slice(0, k).map(b => b.k).sort((a, b) => a - b);
}

function topKMagProfile(bins, k) {
    const top = [...bins].sort((a, b) => b.magnitude - a.magnitude)
        .slice(0, k).sort((a, b) => a.k - b.k);
    return normL1(top.map(b => b.magnitude));
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
    const s   = new Array(len).fill(0);
    for (const v of vecs) for (let i = 0; i < len; i++) s[i] += v[i] ?? 0;
    return s.map(x => x / vecs.length);
}

// ─── Absolute energy helpers (pre-pipeline, no operator contact) ─────────────
// These operate on raw signal values BEFORE any ingest, alignment, or spectral
// transformation. They cannot and do not reach into any operator internals.

/**
 * Compute per-window absolute energy statistics from raw values.
 * Non-overlapping frames of windowN samples; no normalization applied.
 * @param {number[]} values
 * @param {number} windowN
 * @returns {{ per_window_rms: number[], per_window_energy: number[],
 *             mean_rms: number, mean_energy: number, energy_variance: number,
 *             mean_abs: number }}
 */
function computeRawEnergyStats(values, windowN) {
    const frameCount = Math.floor(values.length / windowN);
    const perWindowRms    = new Array(frameCount);
    const perWindowEnergy = new Array(frameCount);
    const perWindowAbs    = new Array(frameCount);

    for (let f = 0; f < frameCount; f++) {
        const start = f * windowN;
        let sumSq = 0, sumAbs = 0;
        for (let i = 0; i < windowN; i++) {
            const v = values[start + i] ?? 0;
            sumSq  += v * v;
            sumAbs += Math.abs(v);
        }
        const energy       = sumSq / windowN;          // mean square (power)
        perWindowRms[f]    = Math.sqrt(energy);         // RMS amplitude
        perWindowEnergy[f] = energy;                    // mean square energy
        perWindowAbs[f]    = sumAbs / windowN;          // mean absolute amplitude
    }

    const meanRms    = perWindowRms.reduce((a, b) => a + b, 0) / (frameCount || 1);
    const meanEnergy = perWindowEnergy.reduce((a, b) => a + b, 0) / (frameCount || 1);
    const meanAbs    = perWindowAbs.reduce((a, b) => a + b, 0) / (frameCount || 1);

    const energyVariance = frameCount > 1
        ? perWindowEnergy.reduce((a, b) => a + (b - meanEnergy) ** 2, 0) / frameCount
        : 0;

    return { per_window_rms: perWindowRms, per_window_energy: perWindowEnergy,
             mean_rms: meanRms, mean_energy: meanEnergy, energy_variance: energyVariance,
             mean_abs: meanAbs, frame_count: frameCount };
}

/**
 * Probe absolute energy identity between two cohorts.
 * Returns receipt-style rows — no stage taps, no operator contact.
 * Stage label is "pre_ingest" to make the data source explicit.
 */
function probeAbsoluteEnergy(cohortA, cohortB) {
    const tf   = cohortA.trace_family;
    const pair = `${cohortA.spec.label} vs ${cohortB.spec.label}`;
    const stage = "pre_ingest";
    const base = { tf, pair, stage,
        source_trace_identity:  cohortA.source_trace_identity,
        parent_source_identity: cohortA.parent_source_identity };

    const sA = cohortA.raw_energy_stats;
    const sB = cohortB.raw_energy_stats;

    if (!sA || !sB) {
        return [makeRow({ ...base, metric: "absolute_energy_ratio", raw_value: null,
            interpretation: "raw_energy_stats not available on cohort" })];
    }

    // Metric 1: absolute_rms_mean_distance — |mean_rms_A - mean_rms_B|
    // Un-normalized; directly reflects amplitude scale difference.
    const rmsDist = Math.abs(sA.mean_rms - sB.mean_rms);

    // Metric 2: absolute_energy_ratio — larger / smaller, always ≥ 1.
    // A ratio > 1.5 means one cohort carries 50% more energy per window.
    const energyRatio = sA.mean_energy > 0 && sB.mean_energy > 0
        ? Math.max(sA.mean_energy, sB.mean_energy) / Math.min(sA.mean_energy, sB.mean_energy)
        : null;

    // Metric 3: absolute_energy_variance_distance — |var_A - var_B| / max(var_A, var_B)
    // Near 0 = both cohorts have similar energy stability; near 1 = one is much more variable.
    const maxVar = Math.max(sA.energy_variance, sB.energy_variance);
    const varDist = maxVar > 0
        ? Math.abs(sA.energy_variance - sB.energy_variance) / maxVar
        : 0;

    // Metric 4: absolute_mean_abs_distance — |mean_abs_A - mean_abs_B|
    const absDist = Math.abs(sA.mean_abs - sB.mean_abs);

    return [
        makeRow({ ...base, metric: "absolute_rms_mean_distance", raw_value: rmsDist,
            extra: { mean_rms_a: sA.mean_rms, mean_rms_b: sB.mean_rms } }),
        makeRow({ ...base, metric: "absolute_energy_ratio",      raw_value: energyRatio,
            extra: { mean_energy_a: sA.mean_energy, mean_energy_b: sB.mean_energy } }),
        makeRow({ ...base, metric: "absolute_energy_variance_distance", raw_value: varDist,
            extra: { var_a: sA.energy_variance, var_b: sB.energy_variance } }),
        makeRow({ ...base, metric: "absolute_mean_abs_distance", raw_value: absDist,
            extra: { mean_abs_a: sA.mean_abs, mean_abs_b: sB.mean_abs } }),
    ];
}

// ─── Stage probing ────────────────────────────────────────────────────────────

function probeStage(cohortA, cohortB, stage) {
    const rows = [];
    const bandEdges = cohortA.band_edges;   // both cohorts in same trace family → same edges
    const topK      = cohortA.top_k;
    const tf        = cohortA.trace_family;
    const pair      = `${cohortA.spec.label} vs ${cohortB.spec.label}`;

    if (stage === "post_transform" || stage === "post_compress") {
        const binsA = stage === "post_transform"
            ? cohortA.s1s.map(s => s.spectrum)
            : cohortA.h1s.map(h => h.kept_bins);
        const binsB = stage === "post_transform"
            ? cohortB.s1s.map(s => s.spectrum)
            : cohortB.h1s.map(h => h.kept_bins);
        const nW = Math.min(binsA.length, binsB.length);

        if (nW === 0) {
            return [makeRow({ tf, pair, stage, metric: "no_windows", raw_value: null,
                interpretation: "no overlapping windows",
                source_trace_identity: cohortA.source_trace_identity,
                parent_source_identity: cohortA.parent_source_identity })];
        }

        const bandDists = [], domDiffs = [], topKOvlps = [];
        for (let wi = 0; wi < nW; wi++) {
            const bpA = bandProfile(binsA[wi], bandEdges);
            const bpB = bandProfile(binsB[wi], bandEdges);
            bandDists.push(l1(bpA, bpB));
            domDiffs.push(l1(topKMagProfile(binsA[wi], topK), topKMagProfile(binsB[wi], topK)));
            const sA = new Set(topKIndices(binsA[wi], topK));
            const shared = topKIndices(binsB[wi], topK).filter(k => sA.has(k)).length;
            topKOvlps.push(shared / topK);
        }

        const bdS  = meanStd(bandDists);
        const ddS  = meanStd(domDiffs);
        const tkS  = meanStd(topKOvlps);
        const cDist = l1(
            meanVec(binsA.slice(0, nW).map(b => bandProfile(b, bandEdges))),
            meanVec(binsB.slice(0, nW).map(b => bandProfile(b, bandEdges)))
        );
        const tempStab = nW > 1 ? bdS.std : null;

        const base = { tf, pair, stage, nW,
            source_trace_identity: cohortA.source_trace_identity,
            parent_source_identity: cohortA.parent_source_identity };

        rows.push(
            makeRow({ ...base, metric: "dominant_bin_profile_difference", raw_value: ddS.mean,
                temporal_stability: tempStab }),
            makeRow({ ...base, metric: "topK_overlap_ratio",              raw_value: tkS.mean,
                temporal_stability: nW > 1 ? tkS.std : null }),
            makeRow({ ...base, metric: "band_profile_distance",           raw_value: bdS.mean,
                temporal_stability: tempStab }),
            makeRow({ ...base, metric: "centroid_distance",               raw_value: cDist,
                temporal_stability: null }),
        );

    } else if (stage === "post_basin") {
        const cA = (cohortA.basinSet?.basins ?? []).map(b => b.centroid_band_profile);
        const cB = (cohortB.basinSet?.basins ?? []).map(b => b.centroid_band_profile);
        const base = { tf, pair, stage,
            source_trace_identity: cohortA.source_trace_identity,
            parent_source_identity: cohortA.parent_source_identity };

        if (!cA.length || !cB.length) {
            rows.push(makeRow({ ...base, metric: "centroid_distance", raw_value: null,
                interpretation: "insufficient basins — check min_member_count",
                next_action: "lower min_member_count or extend signal duration" }));
        } else {
            const nW = Math.min(cohortA.h1s.length, cohortB.h1s.length);
            const h1BdDists = [];
            const bandEdges = cohortA.band_edges;
            for (let wi = 0; wi < nW; wi++) {
                h1BdDists.push(l1(
                    bandProfile(cohortA.h1s[wi].kept_bins, bandEdges),
                    bandProfile(cohortB.h1s[wi].kept_bins, bandEdges)
                ));
            }
            const stab = meanStd(h1BdDists);
            rows.push(
                makeRow({ ...base, metric: "centroid_distance", raw_value: l1(cA[0], cB[0]),
                    temporal_stability: nW > 1 ? stab.std : null,
                    basin_count_a: cA.length, basin_count_b: cB.length }),
                makeRow({ ...base, metric: "band_profile_distance", raw_value: stab.mean,
                    temporal_stability: nW > 1 ? stab.std : null, nW }),
            );
        }
    }
    return rows;
}

// ─── Classification / interpretation ─────────────────────────────────────────

const THRESHOLDS = {
    band_profile_distance:              { separated: 0.20, borderline: 0.08 },
    dominant_bin_profile_difference:    { separated: 0.30, borderline: 0.10 },
    topK_overlap_ratio:                 { similar: 0.75,   borderline: 0.40 },
    centroid_distance:                  { separated: 0.20, borderline: 0.08 },
    // Absolute energy metrics — un-normalized, amplitude-bearing
    absolute_rms_mean_distance:         { separated: 0.20, borderline: 0.05 },
    absolute_energy_ratio:              { separated: 1.50, borderline: 1.10 },  // ratio ≥ 1
    absolute_energy_variance_distance:  { separated: 0.30, borderline: 0.10 },
    absolute_mean_abs_distance:         { separated: 0.15, borderline: 0.04 },
};

function classify(metric, value) {
    if (value == null) return "unknown";
    const t = THRESHOLDS[metric];
    if (!t) return "unclassified";
    // topK_overlap_ratio: higher value = more similar (inverse direction)
    if (metric === "topK_overlap_ratio") {
        return value >= t.similar ? "similar" : value >= t.borderline ? "borderline" : "separated";
    }
    // absolute_energy_ratio: value ≥ 1; higher = more separated
    if (metric === "absolute_energy_ratio") {
        return value >= t.separated ? "separated" : value >= t.borderline ? "borderline" : "similar";
    }
    // All other metrics: higher value = more separated
    return value > t.separated ? "separated" : value > t.borderline ? "borderline" : "similar";
}

function interpret(metric, value, tf) {
    if (value == null) return "no data";
    const cl = classify(metric, value);
    const traceNote = tf === "rms_envelope" ? " [envelope trace]" : " [raw amplitude trace]";
    const map = {
        band_profile_distance: {
            separated: `band energy distribution clearly distinct${traceNote}`,
            borderline: `partial band energy divergence${traceNote}`,
            similar:    `band energy distribution structurally similar${traceNote}`,
        },
        dominant_bin_profile_difference: {
            separated: `dominant bins are structurally distinct${traceNote}`,
            borderline: `dominant bins partially overlap${traceNote}`,
            similar:    `dominant bins are near-identical${traceNote}`,
        },
        topK_overlap_ratio: {
            similar:    `high structural overlap — cohorts share dominant frequency content${traceNote}`,
            borderline: `partial structural overlap${traceNote}`,
            separated:  `low overlap — cohorts occupy distinct frequency bins${traceNote}`,
        },
        centroid_distance: {
            separated: `structural neighborhoods clearly separated${traceNote}`,
            borderline: `structural neighborhoods partially diverge${traceNote}`,
            similar:    `structural neighborhoods overlap${traceNote}`,
        },
        // Absolute energy metrics — amplitude-bearing, pre-normalization
        absolute_rms_mean_distance: {
            separated: `RMS amplitude clearly distinct — amplitude identity separable${traceNote}`,
            borderline: `RMS amplitude partially distinct${traceNote}`,
            similar:    `RMS amplitude near-identical — amplitude indistinguishable at this scale${traceNote}`,
        },
        absolute_energy_ratio: {
            separated: `energy ratio clearly > 1.5 — amplitude-scale identity is present and separable${traceNote}`,
            borderline: `energy ratio slightly > 1 — marginal amplitude difference${traceNote}`,
            similar:    `energy ratio near 1 — cohorts carry similar absolute energy${traceNote}`,
        },
        absolute_energy_variance_distance: {
            separated: `energy variance clearly distinct — one cohort is much more variable${traceNote}`,
            borderline: `energy variance partially distinct${traceNote}`,
            similar:    `energy variance similar — both cohorts have comparable stability${traceNote}`,
        },
        absolute_mean_abs_distance: {
            separated: `mean absolute amplitude clearly distinct${traceNote}`,
            borderline: `mean absolute amplitude partially distinct${traceNote}`,
            similar:    `mean absolute amplitude near-identical${traceNote}`,
        },
    };
    return map[metric]?.[cl] ?? `value=${value?.toFixed(4)}${traceNote}`;
}

function nextAction(metric, value, tf) {
    const cl = classify(metric, value);
    if (metric.startsWith("absolute_")) {
        if (cl === "separated") return "amplitude identity confirmed — consider absolute energy as a parallel identity channel";
        if (cl === "similar")   return "amplitude identity absent at this scale — cohorts share energy level";
        return "marginal amplitude difference — check signal generation parameters";
    }
    if (cl === "separated") return "cohorts separable — compare with other trace family";
    if (cl === "similar" && tf === "rms_envelope" && metric === "band_profile_distance") {
        return "envelope band profile similar — amplitude difference may require un-normalized energy metric";
    }
    if (cl === "similar") return "cohorts not separated at this stage in this trace family";
    return "marginal — verify signal spec or adjust threshold";
}

function makeRow({ tf, pair, stage, metric, raw_value = null,
    temporal_stability = null, nW = null,
    basin_count_a = null, basin_count_b = null,
    source_trace_identity, parent_source_identity,
    extra = null,
    interpretation: interpOverride = null,
    next_action: nextOverride = null }) {

    const threshKey = metric === "dominant_bin_profile_difference"
        ? "dominant_bin_profile_difference" : metric;
    const tObj   = THRESHOLDS[threshKey];
    const cl     = classify(metric, raw_value);
    const interp = interpOverride ?? interpret(metric, raw_value, tf);
    const action = nextOverride  ?? nextAction(metric, raw_value, tf);

    return {
        trace_family:           tf,
        pair,
        stage,
        metric,
        raw_value:              typeof raw_value === "number" ? parseFloat(raw_value.toFixed(6)) : raw_value,
        threshold:              tObj ? JSON.stringify(tObj) : "n/a",
        classification:         cl,
        temporal_stability:     typeof temporal_stability === "number"
            ? parseFloat(temporal_stability.toFixed(6)) : temporal_stability,
        temporal_stability_label: temporal_stability == null ? "n/a"
            : temporal_stability < 0.02 ? "stable"
            : temporal_stability < 0.08 ? "variable" : "unstable",
        n_windows:              nW,
        basin_count_a,
        basin_count_b,
        source_trace_identity,
        parent_source_identity,
        // extra: additional metric-specific values (e.g. raw energy_a, energy_b for ratios)
        ...(extra ? { extra: Object.fromEntries(
            Object.entries(extra).map(([k, v]) => [k, typeof v === "number" ? parseFloat(v.toFixed(6)) : v])
        ) } : {}),
        interpretation:         interp,
        next_action:            action,
    };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Identity Separability Probe — Multitrace (raw_amplitude + rms_envelope)");
    console.log(`  output dir : ${OUTPUT_DIR}`);
    console.log(`  cohorts    : ${Object.keys(COHORT_SPECS).join(", ")}`);
    console.log(`  pairs      : ${PAIR_PLAN.length}`);
    console.log(`  rms_window : N=${RMS_WINDOW_N} → Fs_env=${FS_ENV} Hz`);
    console.log();

    const STAGES = ["post_transform", "post_compress", "post_basin"];
    // pre_ingest is handled separately via probeAbsoluteEnergy — not a stage tap

    // ── Run all cohorts for both trace families ───────────────────────────────
    console.log("Running raw_amplitude pipeline for each cohort...");
    const rawCohorts = {};
    for (const [key, spec] of Object.entries(COHORT_SPECS)) {
        process.stdout.write(`  ${key.padEnd(28)} `);
        const c = runRawPipeline(spec);
        rawCohorts[key] = c;
        console.log(`s1s=${c.s1s.length}  h1s=${c.h1s.length}  basins=${c.basinSet?.basins?.length ?? 0}`);
    }

    console.log("\nRunning rms_envelope pipeline for each cohort...");
    const envCohorts = {};
    for (const [key, spec] of Object.entries(COHORT_SPECS)) {
        process.stdout.write(`  ${key.padEnd(28)} `);
        const c = runEnvelopePipeline(spec);
        envCohorts[key] = c;
        console.log(`s1s=${c.s1s.length}  h1s=${c.h1s.length}  basins=${c.basinSet?.basins?.length ?? 0}`);
    }

    // ── Run pairwise probes for both trace families ───────────────────────────
    console.log("\nRunning pairwise probes...");
    const allRows = [];

    for (const pair of PAIR_PLAN) {
        for (const [tf, cohorts] of [["raw_amplitude", rawCohorts], ["rms_envelope", envCohorts]]) {
            const cA = cohorts[pair.a];
            const cB = cohorts[pair.b];
            process.stdout.write(`  [${tf.padEnd(15)}] ${pair.label.padEnd(52)} `);
            let n = 0;
            for (const stage of STAGES) {
                const rows = probeStage(cA, cB, stage);
                allRows.push(...rows);
                n += rows.length;
            }
            // Absolute energy probe — pre-ingest, no stage tap
            const energyRows = probeAbsoluteEnergy(cA, cB);
            allRows.push(...energyRows);
            n += energyRows.length;
            console.log(`${n} rows`);
        }
    }

    // ── Write outputs ─────────────────────────────────────────────────────────
    console.log();

    const report = {
        probe_type:    "identity_separability_probe_multitrace",
        probe_version: "0.1.0",
        generated_from:
            "Door One pipeline read-side probe (multitrace) — no pipeline mutation, no canon, not promotion",
        generated_at:  new Date().toISOString(),
        probe_config: {
            cohorts:        Object.keys(COHORT_SPECS),
            pairs:          PAIR_PLAN.map(p => p.label),
            stages:         STAGES,
            trace_families: ["raw_amplitude", "rms_envelope"],
            metrics: ["dominant_bin_profile_difference","topK_overlap_ratio",
                      "band_profile_distance","centroid_distance",
                      "absolute_rms_mean_distance","absolute_energy_ratio",
                      "absolute_energy_variance_distance","absolute_mean_abs_distance"],
            rms_envelope: {
                rms_window_N:       RMS_WINDOW_N,
                Fs_raw:             FS_RAW,
                Fs_envelope:        FS_ENV,
                env_window_N:       ENV_WIN_N,
                env_band_edges:     ENV_BAND_EDGES,
                note: "Envelope spectral content limited to 0–8 Hz. Frequency-content metrics " +
                      "reflect envelope-spectral space, not raw-amplitude spectral space.",
            },
            raw_amplitude: {
                Fs_raw:     FS_RAW,
                window_N:   RAW_POLICIES.window_spec.base_window_N,
                band_edges: RAW_BAND_EDGES,
            },
        },
        disclaimers: {
            not_canon:                    true,
            not_truth:                    true,
            not_promotion:                true,
            probe_is_read_side_only:      true,
            trace_families_are_parallel:  true,
            no_automatic_trace_selection: true,
            thresholds_are_starting_points: true,
        },
        total_rows: allRows.length,
        rows: allRows,
    };

    const reportPath = `${OUTPUT_DIR}/multitrace_separability_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`Full report → ${reportPath}`);

    // TSV for easy inspection
    const tsvLines = [
        ["trace_family","pair","stage","metric","raw_value","classification",
         "temporal_stability","temporal_stability_label","n_windows",
         "source_trace_identity","parent_source_identity",
         "interpretation","next_action"].join("\t"),
        ...allRows.map(r => [
            r.trace_family, r.pair, r.stage, r.metric,
            r.raw_value ?? "—", r.classification,
            r.temporal_stability ?? "—", r.temporal_stability_label,
            r.n_windows ?? "—",
            r.source_trace_identity ?? "—", r.parent_source_identity ?? "—",
            r.interpretation, r.next_action,
        ].join("\t")),
    ];
    const tsvPath = `${OUTPUT_DIR}/multitrace_separability_table.tsv`;
    await writeFile(tsvPath, tsvLines.join("\n"), "utf8");
    console.log(`Compact table → ${tsvPath}`);

    // ── Console summary — comparison table ────────────────────────────────────
    console.log();
    console.log("Classification summary by trace family and pair:");
    console.log(`${"─".repeat(100)}`);
    console.log(`${"trace_family".padEnd(18)} ${"pair".padEnd(48)} ${"sep".padStart(5)} ${"bord".padStart(5)} ${"sim".padStart(5)}`);
    console.log(`${"─".repeat(100)}`);

    for (const tf of ["raw_amplitude", "rms_envelope"]) {
        for (const pair of PAIR_PLAN) {
            const pairRows = allRows.filter(
                r => r.trace_family === tf && r.pair === pair.label && r.raw_value != null
            );
            const counts = { separated: 0, borderline: 0, similar: 0 };
            for (const r of pairRows) counts[r.classification] = (counts[r.classification] ?? 0) + 1;
            console.log(
                `${tf.padEnd(18)} ${pair.label.padEnd(48)}` +
                `${String(counts.separated).padStart(5)} ${String(counts.borderline).padStart(5)} ${String(counts.similar).padStart(5)}`
            );
        }
        console.log();
    }

    console.log("Decision targets:");
    // amplitude separation comparison
    const ampPair = "baseline_amplitude vs amplitude_shift";
    const rawAmpRows = allRows.filter(r => r.trace_family === "raw_amplitude" && r.pair === ampPair && r.metric === "band_profile_distance");
    const envAmpRows = allRows.filter(r => r.trace_family === "rms_envelope"  && r.pair === ampPair && r.metric === "band_profile_distance");
    const rawAmpMean = rawAmpRows.length ? rawAmpRows[0].raw_value : null;
    const envAmpMean = envAmpRows.length ? envAmpRows[0].raw_value : null;
    console.log(`  amplitude_shift separation (band_profile_distance):`);
    console.log(`    raw_amplitude  : ${rawAmpMean?.toFixed(4) ?? "—"}  (${rawAmpRows[0]?.classification ?? "—"})`);
    console.log(`    rms_envelope   : ${envAmpMean?.toFixed(4) ?? "—"}  (${envAmpRows[0]?.classification ?? "—"})`);
    console.log(`    envelope better? ${envAmpMean != null && rawAmpMean != null && envAmpMean > rawAmpMean ? "YES" : "NO or equal"}`);

    // frequency discrimination comparison
    const freqPair = "baseline_amplitude vs baseline_frequency";
    const rawFreqRows = allRows.filter(r => r.trace_family === "raw_amplitude" && r.pair === freqPair && r.metric === "band_profile_distance");
    const envFreqRows = allRows.filter(r => r.trace_family === "rms_envelope"  && r.pair === freqPair && r.metric === "band_profile_distance");
    const rawFreqMean = rawFreqRows.length ? rawFreqRows[0].raw_value : null;
    const envFreqMean = envFreqRows.length ? envFreqRows[0].raw_value : null;
    console.log(`\n  frequency discrimination (band_profile_distance):`);
    console.log(`    raw_amplitude  : ${rawFreqMean?.toFixed(4) ?? "—"}  (${rawFreqRows[0]?.classification ?? "—"})`);
    console.log(`    rms_envelope   : ${envFreqMean?.toFixed(4) ?? "—"}  (${envFreqRows[0]?.classification ?? "—"})`);
    console.log(`    envelope weaker? ${envFreqMean != null && rawFreqMean != null && envFreqMean < rawFreqMean ? "YES (expected)" : "NO — unexpected"}`);

    // Absolute energy decision targets
    console.log(`\n  absolute energy — amplitude_shift separation:`);
    for (const tf of ["raw_amplitude", "rms_envelope"]) {
        const rowRatio = allRows.find(r => r.trace_family === tf && r.pair === ampPair
            && r.metric === "absolute_energy_ratio" && r.stage === "pre_ingest");
        const rowRms   = allRows.find(r => r.trace_family === tf && r.pair === ampPair
            && r.metric === "absolute_rms_mean_distance" && r.stage === "pre_ingest");
        console.log(`    [${tf.padEnd(15)}]  energy_ratio=${rowRatio?.raw_value?.toFixed(3) ?? "—"} (${rowRatio?.classification ?? "—"})  rms_dist=${rowRms?.raw_value?.toFixed(4) ?? "—"} (${rowRms?.classification ?? "—"})`);
    }

    console.log(`\n  absolute energy — frequency_shift separation:`);
    const freqShiftPair = "baseline_frequency vs frequency_shift";
    for (const tf of ["raw_amplitude", "rms_envelope"]) {
        const rowRatio = allRows.find(r => r.trace_family === tf && r.pair === freqShiftPair
            && r.metric === "absolute_energy_ratio" && r.stage === "pre_ingest");
        console.log(`    [${tf.padEnd(15)}]  energy_ratio=${rowRatio?.raw_value?.toFixed(3) ?? "—"} (${rowRatio?.classification ?? "—"})`);
    }

    console.log(`\n  orthogonal identity axes confirmed?`);
    const ampRatioRaw = allRows.find(r => r.trace_family === "raw_amplitude" && r.pair === ampPair
        && r.metric === "absolute_energy_ratio" && r.stage === "pre_ingest");
    const freqDistRaw = allRows.find(r => r.trace_family === "raw_amplitude" && r.pair === freqPair
        && r.metric === "band_profile_distance");
    const ampSep   = ampRatioRaw?.classification === "separated";
    const freqSep  = freqDistRaw?.classification === "separated";
    console.log(`    spectral identity separates frequency pairs? ${freqSep ? "YES" : "NO"}`);
    console.log(`    absolute energy separates amplitude pairs?   ${ampSep  ? "YES" : "NO"}`);
    console.log(`    → multi-channel identity justified: ${ampSep && freqSep ? "YES — proceed to multi-channel design" : "PARTIAL — review thresholds"}`);

    console.log();
    console.log("Done. No pipeline state was mutated by this probe.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
