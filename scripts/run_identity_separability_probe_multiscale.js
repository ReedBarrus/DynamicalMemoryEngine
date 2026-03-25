// scripts/run_identity_separability_probe_multiscale.js
//
// Door One Multi-Scale Identity Probe v0
//
// One-line anchor:
//   Multi-scale probing is not about increasing resolution, but about testing
//   whether identity remains invariant, transforms lawfully, fragments or
//   consolidates, or collapses as the observation horizon changes.
//
// Purpose:
//   Run the existing two-channel identity probe (spectral + absolute energy)
//   across SCALE_SET = [8, 16, 32, 64] window sizes and answer:
//
//     - Does the energy channel remain stable across scale?
//     - Does the spectral channel remain stable across scale?
//     - Where does each channel persist / drift / fragment / collapse?
//     - Is multi-scale alone sufficient to clarify the identity boundary?
//     - Do we need temporal derivatives next, or does scale already expose
//       the relevant failure surface?
//
// Scale posture:
//   Scale is treated as a qualified recurrence axis, not a generic dimension.
//   Each scale_N defines the temporal support of one observation horizon.
//   Changes across scale are classified as one of:
//     persistence             — identity holds stably across all scales
//     lawful_transformation   — metric drifts but classification holds
//     fragmentation_consolidation — classification varies, not full collapse
//     collapse                — identity no longer separable at one or more scales
//
// Trace families (explicit, not fused):
//   raw_amplitude  — spectral/band-profile path + absolute pre-ingest energy
//   rms_envelope   — runs at its natural fixed scale (determined by RMS_WINDOW_N),
//                    not swept. Included as a single-scale reference row only.
//
// Outputs:
//   per_scale_rows     — one row per (tf × pair × stage × metric × scale_N)
//   cross_scale_summary — one row per (tf × pair × stage × metric) across scales
//
// Boundary contract:
//   - read-side only — no pipeline mutation, no operator contract changes
//   - no canon logic, no prediction logic, no ontology
//   - scale parameterization only changes window_spec.base_window_N and hop_N
//   - all probe logic is attributable, reversible, removable
//   - no automatic best-scale selection
//
// Run:
//   node scripts/run_identity_separability_probe_multiscale.js
//
// Optional env:
//   PROBE_MS_OUTPUT_DIR   — override ./out_experiments/identity_separability_probe_multiscale
//
// References:
//   - scripts/run_identity_separability_probe_rms_envelope.js (base probe, reused logic)
//   - operators/sampler/RmsEnvelopeAdapter.js
//   - README_DoorOneRuntimeBoundary.md

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }           from "../operators/ingest/IngestOp.js";
import { ClockAlignOp }       from "../operators/clock/ClockAlignOp.js";
import { WindowOp }           from "../operators/window/WindowOp.js";
import { TransformOp }        from "../operators/transform/TransformOp.js";
import { CompressOp }         from "../operators/compress/CompressOp.js";
import { BasinOp }            from "../operators/basin/BasinOp.js";
import { RmsEnvelopeAdapter } from "../operators/sampler/RmsEnvelopeAdapter.js";

const OUTPUT_DIR = process.env.PROBE_MS_OUTPUT_DIR
    ?? "./out_experiments/identity_separability_probe_multiscale";

// ─── Scale set ────────────────────────────────────────────────────────────────
// These are window sizes (in samples at FS_RAW=256 Hz) to sweep.
// temporal support: 8→31ms, 16→62ms, 32→125ms, 64→250ms
const SCALE_SET = [8, 16, 32, 64];

// ─── Signal parameters ────────────────────────────────────────────────────────

const FS_RAW      = 256;
const DURATION    = 4;      // seconds — 1024 samples at 256 Hz
const BASE_AMP    = 1.0;
const SHIFTED_AMP = 2.5;

// RMS envelope — fixed derivation window, not swept
const RMS_WINDOW_N = 16;
const FS_ENV       = FS_RAW / RMS_WINDOW_N;   // 16 Hz
const ENV_WIN_N    = 8;                         // fixed window in envelope space

// ─── Cohorts ──────────────────────────────────────────────────────────────────

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

// ─── Shared policy skeleton (window fields filled per scale) ──────────────────

const BASE_INGEST_POLICY = {
    policy_id: "ingest.probe.ms.v1",
    gap_threshold_multiplier: 3.0,
    allow_non_monotonic: false,
    allow_empty: false,
    non_monotonic_mode: "reject",
};

const BASE_GRID_SPEC = {
    Fs_target: FS_RAW, t_ref: 0,
    grid_policy: "strict", drift_model: "none",
    non_monotonic_policy: "reject", interp_method: "linear",
    gap_policy: "interpolate_small", small_gap_multiplier: 3.0,
    max_gap_seconds: null, anti_alias_filter: false,
};

const BASE_TRANSFORM_POLICY = {
    policy_id: "transform.probe.ms.v1", transform_type: "fft",
    normalization_mode: "forward_1_over_N",
    scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant",
};

const BASE_BASIN_POLICY = {
    policy_id: "basin.probe.ms.v1", similarity_threshold: 0.5,
    min_member_count: 1, weight_mode: "duration",
    linkage: "single_link", cross_segment: true,
};

const ENV_INGEST_POLICY = {
    policy_id: "ingest.probe.ms.env.v1",
    gap_threshold_multiplier: 3.0,
    allow_non_monotonic: false,
    allow_empty: false,
    non_monotonic_mode: "reject",
};

// Band edges — scale-aware for raw; fixed for envelope
// At small scale_N the frequency resolution coarsens (df = Fs/N).
// We use a single set of band edges that covers Nyquist regardless of scale_N,
// accepting that some bands may have zero energy at coarse resolution.
const RAW_BAND_EDGES = [0, 16, 32, 48, 64, 80, 96, 112, 128];
const ENV_BAND_EDGES = [0, 2, 4, 6, 8];

// top_K is capped at half the number of bins in the window (N/2 bins for real FFT)
// At scale_N=8 → 4 bins; at scale_N=64 → 32 bins. Cap at 8 for comparability.
function topKForScale(scale_N) { return Math.min(8, Math.floor(scale_N / 2)); }

// ─── Signal generator (identical to base probe — deterministic) ───────────────

function generateSignal(spec) {
    const n = Math.floor(DURATION * FS_RAW);
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

// ─── Pipeline runner at a given scale ─────────────────────────────────────────
// Only window_spec.base_window_N and hop_N change with scale.
// Everything else is identical to the base probe.

function runRawPipelineAtScale(spec, scale_N) {
    const { values, timestamps } = generateSignal(spec);
    const hop_N     = Math.max(1, Math.floor(scale_N / 2));
    const segmentId = `seg:${spec.source_id}:ms:${scale_N}`;
    const top_k     = topKForScale(scale_N);

    const windowSpec = {
        mode: "fixed", Fs_target: FS_RAW,
        base_window_N: scale_N, hop_N,
        window_function: "hann", overlap_ratio: 0.5,
        stationarity_policy: "tolerant", salience_policy: "off",
        gap_policy: "interpolate_small", max_missing_ratio: 0.25, boundary_policy: "truncate",
    };

    // budget_K must not exceed bins available (scale_N/2 for real FFT)
    const maxBins = Math.floor(scale_N / 2);
    const compressPolicy = {
        policy_id: `compress.probe.ms.N${scale_N}.v1`, selection_method: "topK",
        budget_K: Math.min(16, maxBins), maxK: Math.min(16, maxBins),
        include_dc: false, invariance_lens: "energy",
        numeric_policy: "tolerant", respect_novelty_boundary: false,
        thresholds: { max_recon_rmse: 999, max_energy_residual: 999, max_band_divergence: 999 },
    };

    const a1r = new IngestOp().run({
        timestamps, values, source_id: spec.source_id,
        channel: "ch0", modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS_RAW },
        clock_policy_id: "clock.probe.ms.v1",
        ingest_policy: BASE_INGEST_POLICY,
    });
    if (!a1r.ok) throw new Error(`[raw/N=${scale_N}] IngestOp ${spec.label}: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({
        a1: a1r.artifact,
        grid_spec: { ...BASE_GRID_SPEC, t_ref: timestamps[0] },
    });
    if (!a2r.ok) throw new Error(`[raw/N=${scale_N}] ClockAlignOp ${spec.label}: ${a2r.error}`);

    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: windowSpec });
    if (!w1r.ok) throw new Error(`[raw/N=${scale_N}] WindowOp ${spec.label}: ${w1r.error}`);

    const tfOp = new TransformOp();
    const cpOp = new CompressOp();
    const s1s  = [], h1s = [];

    for (let wi = 0; wi < w1r.artifacts.length; wi++) {
        const w1 = w1r.artifacts[wi];
        const tr = tfOp.run({ w1, transform_policy: BASE_TRANSFORM_POLICY });
        if (!tr.ok) continue;
        s1s.push(tr.artifact);
        const t_start = w1.grid?.t0 ?? (wi * hop_N / FS_RAW);
        const cr = cpOp.run({
            s1: tr.artifact, compression_policy: compressPolicy,
            context: { segment_id: segmentId, window_span: { t_start, t_end: t_start + scale_N / FS_RAW } },
        });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s, basin_policy: BASE_BASIN_POLICY });
        if (br.ok) basinSet = br.artifact;
    }

    // Absolute energy stats use the SAME window size as the scale being probed.
    // This means energy stats also vary with scale — intentional and informative.
    const rawEnergyStats = computeRawEnergyStats(values, scale_N);

    return {
        spec, scale_N, s1s, h1s, basinSet,
        trace_family: "raw_amplitude",
        source_trace_identity:  a1r.artifact.stream_id,
        parent_source_identity: spec.source_id,
        band_edges: RAW_BAND_EDGES,
        top_k,
        raw_energy_stats: rawEnergyStats,
        window_count: w1r.artifacts.length,
    };
}

// Envelope runs at its natural scale only (RMS_WINDOW_N determines Fs_env).
// Not swept — returned as a single-scale reference with scale_N = "env_fixed".
function runEnvelopePipelineFixed(spec) {
    const { values, timestamps } = generateSignal(spec);
    const segmentId = `seg:${spec.source_id}:ms:env`;

    const envAdapter = new RmsEnvelopeAdapter({
        rms_window_N: RMS_WINDOW_N, Fs_raw: FS_RAW,
        clock_policy_id: "clock.probe.ms.env.v1",
        ingest_policy_id: ENV_INGEST_POLICY.policy_id,
    });
    const dr = envAdapter.derive({ values, timestamps, parentSpec: spec });
    if (!dr.ok) throw new Error(`[env] derive ${spec.label}: ${dr.error}`);

    const envInput = dr.ingest_input;
    const a1r = new IngestOp().run(envInput);
    if (!a1r.ok) throw new Error(`[env] IngestOp ${spec.label}: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({
        a1: a1r.artifact,
        grid_spec: { Fs_target: FS_ENV, t_ref: envInput.timestamps[0],
            grid_policy: "strict", drift_model: "none", non_monotonic_policy: "reject",
            interp_method: "linear", gap_policy: "interpolate_small",
            small_gap_multiplier: 3.0, max_gap_seconds: null, anti_alias_filter: false },
    });
    if (!a2r.ok) throw new Error(`[env] ClockAlignOp ${spec.label}: ${a2r.error}`);

    const envWindowSpec = {
        mode: "fixed", Fs_target: FS_ENV,
        base_window_N: ENV_WIN_N, hop_N: Math.floor(ENV_WIN_N / 2),
        window_function: "hann", overlap_ratio: 0.5,
        stationarity_policy: "tolerant", salience_policy: "off",
        gap_policy: "interpolate_small", max_missing_ratio: 0.25, boundary_policy: "truncate",
    };
    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: envWindowSpec });
    if (!w1r.ok) throw new Error(`[env] WindowOp ${spec.label}: ${w1r.error}`);

    const tfOp = new TransformOp();
    const cpOp = new CompressOp();
    const s1s  = [], h1s = [];
    const envCompressPolicy = {
        policy_id: "compress.probe.ms.env.v1", selection_method: "topK",
        budget_K: 4, maxK: 4, include_dc: true, invariance_lens: "energy",
        numeric_policy: "tolerant", respect_novelty_boundary: false,
        thresholds: { max_recon_rmse: 999, max_energy_residual: 999, max_band_divergence: 999 },
    };
    const envTransformPolicy = {
        policy_id: "transform.probe.ms.env.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant",
    };

    for (let wi = 0; wi < w1r.artifacts.length; wi++) {
        const w1 = w1r.artifacts[wi];
        const tr = tfOp.run({ w1, transform_policy: envTransformPolicy });
        if (!tr.ok) continue;
        s1s.push(tr.artifact);
        const t_start = w1.grid?.t0 ?? (wi * Math.floor(ENV_WIN_N / 2) / FS_ENV);
        const cr = cpOp.run({
            s1: tr.artifact, compression_policy: envCompressPolicy,
            context: { segment_id: segmentId, window_span: { t_start, t_end: t_start + ENV_WIN_N / FS_ENV } },
        });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s, basin_policy: { ...BASE_BASIN_POLICY, similarity_threshold: 0.6 } });
        if (br.ok) basinSet = br.artifact;
    }

    return {
        spec, scale_N: `env_N${ENV_WIN_N}`, s1s, h1s, basinSet,
        trace_family: "rms_envelope",
        source_trace_identity:  a1r.artifact.stream_id,
        parent_source_identity: spec.source_id,
        band_edges: ENV_BAND_EDGES,
        top_k: 4,
        raw_energy_stats: computeRawEnergyStats(dr.ingest_input.values, ENV_WIN_N),
        window_count: w1r.artifacts.length,
        envelope_meta: { rms_window_N: RMS_WINDOW_N, Fs_raw: FS_RAW, Fs_envelope: FS_ENV,
            note: "Envelope not swept — scale is fixed by RMS_WINDOW_N derivation." },
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
    const s = v.reduce((a, x) => a + Math.abs(x), 0);
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
    const s = new Array(len).fill(0);
    for (const v of vecs) for (let i = 0; i < len; i++) s[i] += v[i] ?? 0;
    return s.map(x => x / vecs.length);
}

function computeRawEnergyStats(values, windowN) {
    const frameCount = Math.floor(values.length / windowN);
    const perRms = new Array(frameCount), perEnergy = new Array(frameCount), perAbs = new Array(frameCount);
    for (let f = 0; f < frameCount; f++) {
        const start = f * windowN;
        let sumSq = 0, sumAbs = 0;
        for (let i = 0; i < windowN; i++) {
            const v = values[start + i] ?? 0;
            sumSq += v * v; sumAbs += Math.abs(v);
        }
        const e = sumSq / windowN;
        perRms[f] = Math.sqrt(e); perEnergy[f] = e; perAbs[f] = sumAbs / windowN;
    }
    const meanRms    = perRms.reduce((a, b) => a + b, 0) / (frameCount || 1);
    const meanEnergy = perEnergy.reduce((a, b) => a + b, 0) / (frameCount || 1);
    const meanAbs    = perAbs.reduce((a, b) => a + b, 0) / (frameCount || 1);
    const energyVar  = frameCount > 1
        ? perEnergy.reduce((a, b) => a + (b - meanEnergy) ** 2, 0) / frameCount : 0;
    return { per_window_rms: perRms, per_window_energy: perEnergy,
             mean_rms: meanRms, mean_energy: meanEnergy, energy_variance: energyVar,
             mean_abs: meanAbs, frame_count: frameCount };
}

// ─── Classification / thresholds (identical to base probe) ───────────────────

const THRESHOLDS = {
    band_profile_distance:              { separated: 0.20, borderline: 0.08 },
    dominant_bin_profile_difference:    { separated: 0.30, borderline: 0.10 },
    topK_overlap_ratio:                 { similar: 0.75,   borderline: 0.40 },
    centroid_distance:                  { separated: 0.20, borderline: 0.08 },
    absolute_rms_mean_distance:         { separated: 0.20, borderline: 0.05 },
    absolute_energy_ratio:              { separated: 1.50, borderline: 1.10 },
    absolute_energy_variance_distance:  { separated: 0.30, borderline: 0.10 },
    absolute_mean_abs_distance:         { separated: 0.15, borderline: 0.04 },
};

function classify(metric, value) {
    if (value == null) return "unknown";
    const t = THRESHOLDS[metric];
    if (!t) return "unclassified";
    if (metric === "topK_overlap_ratio")  return value >= t.similar ? "similar" : value >= t.borderline ? "borderline" : "separated";
    if (metric === "absolute_energy_ratio") return value >= t.separated ? "separated" : value >= t.borderline ? "borderline" : "similar";
    return value > t.separated ? "separated" : value > t.borderline ? "borderline" : "similar";
}

function isSeparated(metric, value) { return classify(metric, value) === "separated"; }

// ─── Per-scale stage probe ────────────────────────────────────────────────────

function probeStageAtScale(cohortA, cohortB, stage, scale_N) {
    const tf        = cohortA.trace_family;
    const pair      = `${cohortA.spec.label} vs ${cohortB.spec.label}`;
    const bandEdges = cohortA.band_edges;
    const topK      = cohortA.top_k;
    const base      = { tf, pair, stage, scale_N,
        source_trace_identity:  cohortA.source_trace_identity,
        parent_source_identity: cohortA.parent_source_identity };
    const rows      = [];

    if (stage === "post_transform" || stage === "post_compress") {
        const binsA = stage === "post_transform"
            ? cohortA.s1s.map(s => s.spectrum)
            : cohortA.h1s.map(h => h.kept_bins);
        const binsB = stage === "post_transform"
            ? cohortB.s1s.map(s => s.spectrum)
            : cohortB.h1s.map(h => h.kept_bins);
        const nW = Math.min(binsA.length, binsB.length);

        if (nW === 0) {
            return [makeRow({ ...base, metric: "no_windows", raw_value: null,
                interpretation: `no overlapping windows at scale_N=${scale_N}`,
                next_action: "signal may be too short for this window size" })];
        }

        const bandDists = [], domDiffs = [], topKOvlps = [];
        for (let wi = 0; wi < nW; wi++) {
            const bpA = bandProfile(binsA[wi], bandEdges);
            const bpB = bandProfile(binsB[wi], bandEdges);
            bandDists.push(l1(bpA, bpB));
            domDiffs.push(l1(topKMagProfile(binsA[wi], topK), topKMagProfile(binsB[wi], topK)));
            const sA = new Set(topKIndices(binsA[wi], topK));
            topKOvlps.push(topKIndices(binsB[wi], topK).filter(k => sA.has(k)).length / topK);
        }

        const bdS  = meanStd(bandDists);
        const ddS  = meanStd(domDiffs);
        const tkS  = meanStd(topKOvlps);
        const cDist = l1(
            meanVec(binsA.slice(0, nW).map(b => bandProfile(b, bandEdges))),
            meanVec(binsB.slice(0, nW).map(b => bandProfile(b, bandEdges)))
        );

        rows.push(
            makeRow({ ...base, metric: "dominant_bin_profile_difference", raw_value: ddS.mean, nW, temporal_stability: nW > 1 ? ddS.std : null }),
            makeRow({ ...base, metric: "topK_overlap_ratio",              raw_value: tkS.mean, nW, temporal_stability: nW > 1 ? tkS.std : null }),
            makeRow({ ...base, metric: "band_profile_distance",           raw_value: bdS.mean, nW, temporal_stability: nW > 1 ? bdS.std : null }),
            makeRow({ ...base, metric: "centroid_distance",               raw_value: cDist,    nW }),
        );

    } else if (stage === "post_basin") {
        const cA = (cohortA.basinSet?.basins ?? []).map(b => b.centroid_band_profile);
        const cB = (cohortB.basinSet?.basins ?? []).map(b => b.centroid_band_profile);

        if (!cA.length || !cB.length) {
            rows.push(makeRow({ ...base, metric: "centroid_distance", raw_value: null,
                interpretation: `insufficient basins at scale_N=${scale_N}`,
                next_action: "extend signal duration or reduce min_member_count" }));
        } else {
            const nW = Math.min(cohortA.h1s.length, cohortB.h1s.length);
            const h1Dists = [];
            for (let wi = 0; wi < nW; wi++) {
                h1Dists.push(l1(
                    bandProfile(cohortA.h1s[wi].kept_bins, bandEdges),
                    bandProfile(cohortB.h1s[wi].kept_bins, bandEdges)
                ));
            }
            const stab = meanStd(h1Dists);
            rows.push(
                makeRow({ ...base, metric: "centroid_distance",   raw_value: l1(cA[0], cB[0]), nW: null, basin_count_a: cA.length, basin_count_b: cB.length, temporal_stability: nW > 1 ? stab.std : null }),
                makeRow({ ...base, metric: "band_profile_distance", raw_value: stab.mean,       nW, temporal_stability: nW > 1 ? stab.std : null }),
            );
        }
    }
    return rows;
}

function probeAbsoluteEnergyAtScale(cohortA, cohortB, scale_N) {
    const tf    = cohortA.trace_family;
    const pair  = `${cohortA.spec.label} vs ${cohortB.spec.label}`;
    const stage = "pre_ingest";
    const base  = { tf, pair, stage, scale_N,
        source_trace_identity:  cohortA.source_trace_identity,
        parent_source_identity: cohortA.parent_source_identity };
    const sA = cohortA.raw_energy_stats;
    const sB = cohortB.raw_energy_stats;

    if (!sA || !sB) return [makeRow({ ...base, metric: "absolute_energy_ratio", raw_value: null })];

    const rmsDist    = Math.abs(sA.mean_rms - sB.mean_rms);
    const maxE       = Math.max(sA.mean_energy, sB.mean_energy);
    const minE       = Math.min(sA.mean_energy, sB.mean_energy);
    const energyRatio = maxE > 0 && minE > 0 ? maxE / minE : null;
    const maxVar     = Math.max(sA.energy_variance, sB.energy_variance);
    const varDist    = maxVar > 0 ? Math.abs(sA.energy_variance - sB.energy_variance) / maxVar : 0;
    const absDist    = Math.abs(sA.mean_abs - sB.mean_abs);

    return [
        makeRow({ ...base, metric: "absolute_rms_mean_distance",        raw_value: rmsDist,     extra: { mean_rms_a: sA.mean_rms,       mean_rms_b: sB.mean_rms } }),
        makeRow({ ...base, metric: "absolute_energy_ratio",             raw_value: energyRatio, extra: { mean_energy_a: sA.mean_energy, mean_energy_b: sB.mean_energy } }),
        makeRow({ ...base, metric: "absolute_energy_variance_distance", raw_value: varDist,     extra: { var_a: sA.energy_variance,     var_b: sB.energy_variance } }),
        makeRow({ ...base, metric: "absolute_mean_abs_distance",        raw_value: absDist,     extra: { mean_abs_a: sA.mean_abs,        mean_abs_b: sB.mean_abs } }),
    ];
}

// ─── Cross-scale summary ──────────────────────────────────────────────────────

/**
 * Given a list of per-scale rows for one (tf × pair × stage × metric),
 * compute cross-scale summary metrics and classify scale behavior.
 *
 * Scale behavior taxonomy:
 *   persistence             — separated at all scales, low drift
 *   lawful_transformation   — separated at all scales, moderate drift
 *   fragmentation_consolidation — separated at some scales only
 *   collapse                — not separated at any scale
 */
function buildCrossScaleSummary(rows) {
    // rows: per-scale rows for one (tf × pair × stage × metric), sorted by scale_N ascending
    if (!rows.length) return null;

    const { trace_family: tf, pair, stage, metric,
            source_trace_identity, parent_source_identity } = rows[0];

    const numericRows = rows.filter(r => r.raw_value != null && typeof r.scale_N === "number");
    if (!numericRows.length) return null;

    const scaleValues = numericRows.map(r => r.scale_N);
    const rawValues   = numericRows.map(r => r.raw_value);
    const classifs    = numericRows.map(r => classify(metric, r.raw_value));

    // A. scale_stability — std-dev of raw_value across scales
    const { mean: scaleMean, std: scaleStd } = meanStd(rawValues);
    const scaleStability = scaleStd ?? 0;

    // B. scale_consistency_ratio — fraction of scales classified "separated"
    const nSep = classifs.filter(c => c === "separated").length;
    const scaleConsistencyRatio = numericRows.length > 0 ? nSep / numericRows.length : 0;

    // C. scale_collapse_point — first scale where identity flips to non-separated
    // For topK_overlap_ratio "similar" = separated in intent, so invert
    const isInverse = metric === "topK_overlap_ratio";
    let scaleCollapsePoint = null;
    for (const r of numericRows) {
        const cl = classify(metric, r.raw_value);
        const bad = isInverse ? (cl !== "similar") : (cl !== "separated");
        if (bad) { scaleCollapsePoint = r.scale_N; break; }
    }

    // D. scale_drift_profile — directional description
    //    slope sign: positive = metric increases with scale, negative = decreases
    let slope = null;
    let driftLabel = "flat";
    if (rawValues.length >= 2) {
        const n = rawValues.length;
        // Simple linear regression slope over scale indices
        const xMean = scaleValues.reduce((a, b) => a + b, 0) / n;
        const yMean = scaleMean;
        let num = 0, den = 0;
        for (let i = 0; i < n; i++) {
            num += (scaleValues[i] - xMean) * (rawValues[i] - yMean);
            den += (scaleValues[i] - xMean) ** 2;
        }
        slope = den !== 0 ? num / den : 0;
        const relSlope = scaleStability > 0 ? Math.abs(slope) * (scaleValues[n - 1] - scaleValues[0]) / (scaleStability * 2) : 0;
        driftLabel = relSlope < 0.3 ? "flat"
            : slope > 0 ? "increasing_with_scale"
            : "decreasing_with_scale";
    }

    const scaleDriftProfile = {
        slope: slope != null ? parseFloat(slope.toFixed(6)) : null,
        direction: driftLabel,
        variance: parseFloat(scaleStability.toFixed(6)),
        description: describeDrift(driftLabel, metric, scaleConsistencyRatio),
    };

    // E. scale_behavior classification
    const scaleBehavior = classifyScaleBehavior(scaleConsistencyRatio, scaleStability, driftLabel, numericRows.length);

    // Interpretation
    const interpretation = interpretScaleBehavior(scaleBehavior, metric, tf, scaleCollapsePoint);
    const next_action    = nextActionScaleBehavior(scaleBehavior, metric);

    return {
        row_type: "cross_scale_summary",
        trace_family: tf,
        pair,
        stage,
        metric,
        scale_values:            scaleValues,
        raw_values_per_scale:    numericRows.map(r => ({ scale_N: r.scale_N, raw_value: r.raw_value, classification: classify(metric, r.raw_value) })),
        scale_stability:         parseFloat(scaleStability.toFixed(6)),
        scale_consistency_ratio: parseFloat(scaleConsistencyRatio.toFixed(4)),
        scale_collapse_point:    scaleCollapsePoint,
        scale_drift_profile:     scaleDriftProfile,
        scale_behavior:          scaleBehavior,
        source_trace_identity,
        parent_source_identity,
        interpretation,
        next_action,
    };
}

function classifyScaleBehavior(consistencyRatio, stability, driftDirection, nScales) {
    if (nScales < 2) return "insufficient_scales";
    if (consistencyRatio === 0) return "collapse";
    if (consistencyRatio === 1) {
        // Separated at all scales — persistence vs lawful_transformation
        return stability < 0.05 && driftDirection === "flat"
            ? "persistence"
            : "lawful_transformation";
    }
    // Some scales separated, some not
    return "fragmentation_consolidation";
}

function describeDrift(driftLabel, metric, consistencyRatio) {
    if (driftLabel === "flat") return "metric value stable across scale";
    if (driftLabel === "increasing_with_scale") return `${metric} increases at larger support`;
    return `${metric} decreases at larger support`;
}

function interpretScaleBehavior(behavior, metric, tf, collapsePoint) {
    const traceNote = `[${tf}]`;
    switch (behavior) {
        case "persistence":
            return `identity persists across all tested scales ${traceNote} — ${metric} remains separated and stable`;
        case "lawful_transformation":
            return `identity transforms lawfully across scale ${traceNote} — ${metric} separates at all scales but drifts`;
        case "fragmentation_consolidation":
            return collapsePoint != null
                ? `identity fragments at scale_N=${collapsePoint} ${traceNote} — separable at some scales but not all`
                : `identity consolidates variably across scale ${traceNote} — classification is scale-dependent`;
        case "collapse":
            return `identity collapses across all tested scales ${traceNote} — ${metric} does not separate at any scale`;
        default:
            return `scale behavior undetermined ${traceNote}`;
    }
}

function nextActionScaleBehavior(behavior, metric) {
    switch (behavior) {
        case "persistence":
            return "channel is scale-stable — current support policies are sufficient";
        case "lawful_transformation":
            return "channel drifts with scale but does not collapse — consider whether scale calibration is needed before multi-channel fusion";
        case "fragmentation_consolidation":
            return "identity is scale-sensitive — identify the support horizon where separation holds and calibrate window policy accordingly";
        case "collapse":
            return "channel does not separate at this metric — verify signal generation or check whether a different metric family is needed";
        default:
            return "inspect raw_values_per_scale and verify scale_N coverage";
    }
}

// ─── makeRow ─────────────────────────────────────────────────────────────────

function makeRow({ tf, pair, stage, metric, scale_N = null, raw_value = null,
    temporal_stability = null, nW = null,
    basin_count_a = null, basin_count_b = null,
    source_trace_identity, parent_source_identity,
    extra = null,
    interpretation: interpOverride = null,
    next_action: nextOverride = null }) {

    const tObj  = THRESHOLDS[metric];
    const cl    = classify(metric, raw_value);
    const interp = interpOverride ?? defaultInterpret(metric, cl, tf, scale_N);
    const action = nextOverride   ?? defaultNextAction(metric, cl, tf);

    return {
        row_type: "per_scale",
        trace_family:          tf,
        pair,
        stage,
        metric,
        scale_N,
        raw_value:             typeof raw_value === "number" ? parseFloat(raw_value.toFixed(6)) : raw_value,
        threshold:             tObj ? JSON.stringify(tObj) : "n/a",
        classification:        cl,
        temporal_stability:    typeof temporal_stability === "number" ? parseFloat(temporal_stability.toFixed(6)) : temporal_stability,
        temporal_stability_label: temporal_stability == null ? "n/a"
            : temporal_stability < 0.02 ? "stable" : temporal_stability < 0.08 ? "variable" : "unstable",
        n_windows:             nW,
        basin_count_a,
        basin_count_b,
        source_trace_identity,
        parent_source_identity,
        ...(extra ? { extra: Object.fromEntries(
            Object.entries(extra).map(([k, v]) => [k, typeof v === "number" ? parseFloat(v.toFixed(6)) : v])
        ) } : {}),
        interpretation:        interp,
        next_action:           action,
    };
}

function defaultInterpret(metric, cl, tf, scale_N) {
    const sNote = scale_N != null ? ` at scale_N=${scale_N}` : "";
    const tNote = `[${tf}]`;
    const labels = {
        band_profile_distance:              { separated: "band energy distinct", borderline: "partial divergence", similar: "band energy similar" },
        dominant_bin_profile_difference:    { separated: "dominant bins distinct", borderline: "partial overlap", similar: "dominant bins near-identical" },
        topK_overlap_ratio:                 { similar: "high bin overlap", borderline: "partial overlap", separated: "low bin overlap" },
        centroid_distance:                  { separated: "neighborhoods separated", borderline: "partial divergence", similar: "neighborhoods overlap" },
        absolute_rms_mean_distance:         { separated: "RMS clearly distinct", borderline: "RMS partially distinct", similar: "RMS near-identical" },
        absolute_energy_ratio:              { separated: "energy ratio > 1.5 — amplitude identity separable", borderline: "marginal energy ratio", similar: "energy ratio near 1" },
        absolute_energy_variance_distance:  { separated: "energy variance distinct", borderline: "partial variance diff", similar: "variance similar" },
        absolute_mean_abs_distance:         { separated: "mean abs amplitude distinct", borderline: "partial abs diff", similar: "mean abs near-identical" },
    };
    return `${labels[metric]?.[cl] ?? `${metric}=${cl}`}${sNote} ${tNote}`;
}

function defaultNextAction(metric, cl, tf) {
    if (metric.startsWith("absolute_")) {
        if (cl === "separated") return "amplitude identity confirmed at this scale";
        if (cl === "similar")   return "amplitude identity absent — normalized by this metric";
        return "marginal — check signal generation";
    }
    if (cl === "separated") return "spectral identity confirmed at this scale";
    if (cl === "similar")   return "not separable at this stage/scale";
    return "borderline — verify signal spec";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Door One Multi-Scale Identity Probe v0");
    console.log(`  output dir : ${OUTPUT_DIR}`);
    console.log(`  scale_set  : [${SCALE_SET.join(", ")}] samples @ ${FS_RAW} Hz`);
    console.log(`  scale durations: ${SCALE_SET.map(n => `N=${n}→${(n/FS_RAW*1000).toFixed(0)}ms`).join("  ")}`);
    console.log(`  cohorts    : ${Object.keys(COHORT_SPECS).join(", ")}`);
    console.log(`  pairs      : ${PAIR_PLAN.length}`);
    console.log(`  trace families: raw_amplitude (swept), rms_envelope (fixed reference)`);
    console.log();

    const STAGES = ["post_transform", "post_compress", "post_basin"];

    // ── Pre-generate signals (reused across all scales) ───────────────────────
    const signals = {};
    for (const [key, spec] of Object.entries(COHORT_SPECS)) {
        signals[key] = generateSignal(spec);
    }

    // ── Run raw_amplitude pipeline at each scale ──────────────────────────────
    // cohortsByScale[scale_N][key] = cohort result
    const cohortsByScale = {};

    for (const scale_N of SCALE_SET) {
        process.stdout.write(`\nScale N=${String(scale_N).padStart(2)} (${(scale_N/FS_RAW*1000).toFixed(0)}ms): `);
        cohortsByScale[scale_N] = {};
        for (const [key, spec] of Object.entries(COHORT_SPECS)) {
            const c = runRawPipelineAtScale(spec, scale_N);
            cohortsByScale[scale_N][key] = c;
            process.stdout.write(`${key.substring(0,4)}:w${c.window_count}  `);
        }
        console.log();
    }

    // ── Run rms_envelope pipeline at fixed scale ──────────────────────────────
    console.log("\nRunning rms_envelope pipeline (fixed scale reference)...");
    const envCohorts = {};
    for (const [key, spec] of Object.entries(COHORT_SPECS)) {
        const c = runEnvelopePipelineFixed(spec);
        envCohorts[key] = c;
        process.stdout.write(`  ${key.padEnd(24)} scale=${c.scale_N}  w=${c.window_count}\n`);
    }

    // ── Collect all per-scale rows ─────────────────────────────────────────────
    console.log("\nRunning pairwise probes across scales...");
    const perScaleRows = [];

    for (const scale_N of SCALE_SET) {
        const cohorts = cohortsByScale[scale_N];
        for (const pair of PAIR_PLAN) {
            const cA = cohorts[pair.a];
            const cB = cohorts[pair.b];
            for (const stage of STAGES) {
                perScaleRows.push(...probeStageAtScale(cA, cB, stage, scale_N));
            }
            perScaleRows.push(...probeAbsoluteEnergyAtScale(cA, cB, scale_N));
        }
    }

    // Envelope at fixed scale
    for (const pair of PAIR_PLAN) {
        const cA = envCohorts[pair.a];
        const cB = envCohorts[pair.b];
        for (const stage of STAGES) {
            perScaleRows.push(...probeStageAtScale(cA, cB, stage, cA.scale_N));
        }
        perScaleRows.push(...probeAbsoluteEnergyAtScale(cA, cB, cA.scale_N));
    }

    console.log(`  ${perScaleRows.length} per-scale rows emitted`);

    // ── Build cross-scale summary rows (raw_amplitude only — envelope not swept) ──
    console.log("Building cross-scale summary rows...");

    // Group numeric per-scale rows by (tf × pair × stage × metric) key
    const rawPerScaleOnly = perScaleRows.filter(r => r.trace_family === "raw_amplitude" && typeof r.scale_N === "number");
    const groups = new Map();
    for (const row of rawPerScaleOnly) {
        if (row.raw_value == null) continue;
        const key = `${row.trace_family}::${row.pair}::${row.stage}::${row.metric}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
    }
    // Sort each group by scale_N ascending
    for (const rows of groups.values()) rows.sort((a, b) => a.scale_N - b.scale_N);

    const summaryRows = [];
    for (const rows of groups.values()) {
        const s = buildCrossScaleSummary(rows);
        if (s) summaryRows.push(s);
    }
    console.log(`  ${summaryRows.length} cross-scale summary rows emitted`);

    // ── Write outputs ─────────────────────────────────────────────────────────
    console.log();

    const report = {
        probe_type:    "identity_separability_probe_multiscale",
        probe_version: "0.1.0",
        generated_from:
            "Door One pipeline read-side multi-scale probe — no pipeline mutation, no canon, not promotion",
        generated_at:  new Date().toISOString(),
        probe_config: {
            scale_set:       SCALE_SET,
            scale_durations: SCALE_SET.map(n => ({ scale_N: n, duration_ms: parseFloat((n/FS_RAW*1000).toFixed(2)) })),
            cohorts:         Object.keys(COHORT_SPECS),
            pairs:           PAIR_PLAN.map(p => p.label),
            stages:          STAGES,
            trace_families:  { swept: "raw_amplitude", fixed_reference: "rms_envelope" },
            band_edges_raw:  RAW_BAND_EDGES,
            band_edges_env:  ENV_BAND_EDGES,
        },
        disclaimers: {
            not_canon:                     true,
            not_truth:                     true,
            not_promotion:                 true,
            probe_is_read_side_only:       true,
            no_automatic_scale_selection:  true,
            scale_is_recurrence_axis:      true,
            thresholds_are_starting_points: true,
        },
        total_per_scale_rows:  perScaleRows.length,
        total_summary_rows:    summaryRows.length,
        per_scale_rows:        perScaleRows,
        cross_scale_summary:   summaryRows,
    };

    const reportPath = `${OUTPUT_DIR}/multiscale_probe_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`Full report → ${reportPath}`);

    // Summary TSV
    const tsvSummary = [
        ["trace_family","pair","stage","metric","scale_values","scale_stability",
         "scale_consistency_ratio","scale_collapse_point","scale_behavior",
         "interpretation","next_action"].join("\t"),
        ...summaryRows.map(r => [
            r.trace_family, r.pair, r.stage, r.metric,
            r.scale_values?.join(",") ?? "—",
            r.scale_stability ?? "—",
            r.scale_consistency_ratio ?? "—",
            r.scale_collapse_point ?? "none",
            r.scale_behavior,
            r.interpretation, r.next_action,
        ].join("\t")),
    ];
    const tsvPath = `${OUTPUT_DIR}/multiscale_cross_scale_summary.tsv`;
    await writeFile(tsvPath, tsvSummary.join("\n"), "utf8");
    console.log(`Cross-scale summary TSV → ${tsvPath}`);

    // ── Console decision output ───────────────────────────────────────────────

    console.log("\n" + "═".repeat(100));
    console.log("CROSS-SCALE BEHAVIOR SUMMARY — raw_amplitude trace");
    console.log("═".repeat(100));

    // Key pairs × key metrics
    const KEY_METRICS = ["band_profile_distance", "absolute_energy_ratio"];
    const KEY_PAIRS   = PAIR_PLAN.map(p => p.label);

    // Header
    const hdr = `${"pair".padEnd(48)} ${"stage".padEnd(18)} ${"metric".padEnd(32)} ${"behavior".padEnd(28)} ${"consistency".padStart(12)} ${"collapse@".padStart(10)}`;
    console.log(hdr);
    console.log("─".repeat(hdr.length));

    for (const pair of KEY_PAIRS) {
        for (const stage of [...STAGES, "pre_ingest"]) {
            for (const metric of KEY_METRICS) {
                const s = summaryRows.find(r => r.trace_family === "raw_amplitude"
                    && r.pair === pair && r.stage === stage && r.metric === metric);
                if (!s) continue;
                console.log(
                    `${pair.padEnd(48)} ${stage.padEnd(18)} ${metric.padEnd(32)} ` +
                    `${s.scale_behavior.padEnd(28)} ${String(s.scale_consistency_ratio.toFixed(2)).padStart(12)} ` +
                    `${String(s.scale_collapse_point ?? "—").padStart(10)}`
                );
            }
        }
        console.log();
    }

    // Decision questions
    console.log("═".repeat(100));
    console.log("DECISION TARGETS");
    console.log("─".repeat(100));

    const ampPair  = "baseline_amplitude vs amplitude_shift";
    const freqPair = "baseline_amplitude vs baseline_frequency";

    // Energy channel stability
    const energySummary = summaryRows.find(r => r.trace_family === "raw_amplitude"
        && r.pair === ampPair && r.metric === "absolute_energy_ratio" && r.stage === "pre_ingest");
    console.log(`\n  Energy channel (absolute_energy_ratio) across scale:`);
    console.log(`    behavior      : ${energySummary?.scale_behavior ?? "—"}`);
    console.log(`    consistency   : ${energySummary?.scale_consistency_ratio?.toFixed(2) ?? "—"} of scales separated`);
    console.log(`    drift         : ${energySummary?.scale_drift_profile?.direction ?? "—"}`);
    console.log(`    collapse at   : scale_N=${energySummary?.scale_collapse_point ?? "none"}`);

    // Spectral channel stability
    const spectralSummary = summaryRows.find(r => r.trace_family === "raw_amplitude"
        && r.pair === freqPair && r.metric === "band_profile_distance" && r.stage === "post_compress");
    console.log(`\n  Spectral channel (band_profile_distance) across scale:`);
    console.log(`    behavior      : ${spectralSummary?.scale_behavior ?? "—"}`);
    console.log(`    consistency   : ${spectralSummary?.scale_consistency_ratio?.toFixed(2) ?? "—"} of scales separated`);
    console.log(`    drift         : ${spectralSummary?.scale_drift_profile?.direction ?? "—"}`);
    console.log(`    collapse at   : scale_N=${spectralSummary?.scale_collapse_point ?? "none"}`);

    const energyStable   = energySummary?.scale_behavior === "persistence" || energySummary?.scale_behavior === "lawful_transformation";
    const spectralStable = spectralSummary?.scale_behavior === "persistence" || spectralSummary?.scale_behavior === "lawful_transformation";

    console.log(`\n  Is multi-scale sufficient to clarify identity boundary?`);
    console.log(`    energy channel   : ${energyStable  ? "STABLE across scale — no fragmentation" : "UNSTABLE — fragmentation or collapse observed"}`);
    console.log(`    spectral channel : ${spectralStable ? "STABLE across scale — no fragmentation" : "UNSTABLE — fragmentation or collapse observed"}`);

    const needsDerivatives = !energyStable || !spectralStable;
    console.log(`\n  Do we need temporal derivatives next?`);
    console.log(`    ${needsDerivatives
        ? "YES — scale alone does not stabilize at least one channel. Temporal derivatives are the correct next probe."
        : "NOT YET — both channels are scale-stable. Current two-channel base is sufficient before adding derivatives."}`);

    console.log();
    console.log("Done. No pipeline state was mutated by this probe.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
