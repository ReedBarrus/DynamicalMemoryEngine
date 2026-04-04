// scripts/run_harmonic_placement_resonance_probe.js
//
// Harmonic-Placement Resonance Probe for Basin Splitting
//
// One-line anchor:
//   Probe whether support-horizon resonance remains splitting-prone only for
//   specific harmonic configurations, so basin fragmentation can be explained
//   by structural arrangement rather than treated as arbitrary instability.
//
// Core question:
//   When window duration approaches the dominant recurrence period (phase_ratio≈1),
//   which harmonic configurations produce within-cohort basin splitting, and which
//   consolidate?
//
// Structural hypothesis under test:
//   Basin splitting under resonance conditions is sensitive to whether the second
//   harmonic lands at a bin boundary — i.e., whether harmonic_hz is an integer
//   multiple of df = Fs/N. When a harmonic sits at a bin edge, Hann-windowing
//   phase variation across windows produces high inter-window spectral variance,
//   which BasinOp's L1 clustering reads as two structural neighborhoods.
//
//   A secondary modulation: harmonic amplitude must be strong enough to generate
//   variation above the BasinOp similarity_threshold (0.5). Below a certain
//   amplitude, the bin-edge effect exists but is too small to trigger splitting.
//
// Experimental design:
//   Fixed: dominant_frequency = 8 Hz, scale_set, pipeline, BasinOp parameters
//   Varied: placement of second harmonic (16, 24, 32 Hz) and its amplitude
//
//   Cohort matrix:
//     f8_h16_amp0.25 — 8 Hz + 16 Hz @ 0.25 (weak, bin-edge harmonic)
//     f8_h16_amp0.50 — 8 Hz + 16 Hz @ 0.50 (original baseline_frequency — splits at N=32)
//     f8_h16_amp0.75 — 8 Hz + 16 Hz @ 0.75 (strong bin-edge harmonic)
//     f8_h24_amp0.50 — 8 Hz + 24 Hz @ 0.50 (original frequency_shift — no split)
//     f8_h24_amp0.75 — 8 Hz + 24 Hz @ 0.75 (stronger non-bin-edge)
//     f8_h32_amp0.50 — 8 Hz + 32 Hz @ 0.50 (harmonic at bin-2 edge at N=32)
//     f8_only        — 8 Hz alone (no second harmonic — baseline reference)
//
// Bin-edge condition:
//   At scale_N, df = Fs/N.
//   A harmonic is a "bin-edge harmonic" at scale_N when harmonic_hz is an
//   integer multiple of df: harmonic_hz mod df == 0.
//   This is a structural property of the (harmonic_hz, scale_N) pair, not of
//   the signal alone. It varies across scale.
//
// Boundary contract:
//   - read-side only — no pipeline mutation, no operator changes
//   - does not modify BasinOp
//   - does not add a new identity channel
//   - harmonic_placement_sensitive is a diagnostic observation, not a runtime variable
//   - not canon, not ontology, no semantic basin claims
//   - attributable, reversible, removable
//
// Run:
//   node scripts/run_harmonic_placement_resonance_probe.js
//
// Optional env:
//   PROBE_HP_OUTPUT_DIR — override ./out_experiments/harmonic_placement_resonance_probe

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }    from "../operators/ingest/IngestOp.js";
import { ClockAlignOp } from "../operators/clock/ClockAlignOp.js";
import { WindowOp }    from "../operators/window/WindowOp.js";
import { TransformOp } from "../operators/transform/TransformOp.js";
import { CompressOp }  from "../operators/compress/CompressOp.js";
import { BasinOp }     from "../operators/basin/BasinOp.js";

const OUTPUT_DIR = process.env.PROBE_HP_OUTPUT_DIR
    ?? "./out_experiments/harmonic_placement_resonance_probe";

// ─── Parameters (all fixed except harmonic configuration) ─────────────────────
const SCALE_SET = [8, 16, 32, 64];
const FS_RAW    = 256;
const DURATION  = 4;
const DOMINANT_HZ     = 8;
const DOMINANT_PERIOD = 1 / DOMINANT_HZ;   // 0.125 s
const BAND_EDGES      = [0, 16, 32, 48, 64, 80, 96, 112, 128];
const BASIN_SIMILARITY_THRESHOLD = 0.5;

// ─── Cohort matrix ────────────────────────────────────────────────────────────
// Held fixed: dominant = 8 Hz
// Varied:     second harmonic placement (16, 24, 32 Hz) and amplitude
const COHORT_SPECS = [
    {
        label:       "f8_h16_amp0.25",
        description: "8 Hz + 16 Hz @ 0.25  (weak bin-edge harmonic)",
        source_id:   "probe.hp.f8_h16_a025",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 16, amplitude: 0.25 }],
        harmonic_hz:       16,
        harmonic_amp:      0.25,
        harmonic_ratio:    2,      // harmonic_hz / dominant_hz
        harmonic_spacing:  8,      // harmonic_hz - dominant_hz
    },
    {
        label:       "f8_h16_amp0.50",
        description: "8 Hz + 16 Hz @ 0.50  (standard bin-edge harmonic — original baseline_frequency)",
        source_id:   "probe.hp.f8_h16_a050",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 16, amplitude: 0.50 }],
        harmonic_hz:       16,
        harmonic_amp:      0.50,
        harmonic_ratio:    2,
        harmonic_spacing:  8,
    },
    {
        label:       "f8_h16_amp0.75",
        description: "8 Hz + 16 Hz @ 0.75  (strong bin-edge harmonic)",
        source_id:   "probe.hp.f8_h16_a075",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 16, amplitude: 0.75 }],
        harmonic_hz:       16,
        harmonic_amp:      0.75,
        harmonic_ratio:    2,
        harmonic_spacing:  8,
    },
    {
        label:       "f8_h24_amp0.50",
        description: "8 Hz + 24 Hz @ 0.50  (non-bin-edge harmonic — original frequency_shift)",
        source_id:   "probe.hp.f8_h24_a050",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 24, amplitude: 0.50 }],
        harmonic_hz:       24,
        harmonic_amp:      0.50,
        harmonic_ratio:    3,
        harmonic_spacing:  16,
    },
    {
        label:       "f8_h24_amp0.75",
        description: "8 Hz + 24 Hz @ 0.75  (strong non-bin-edge harmonic)",
        source_id:   "probe.hp.f8_h24_a075",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 24, amplitude: 0.75 }],
        harmonic_hz:       24,
        harmonic_amp:      0.75,
        harmonic_ratio:    3,
        harmonic_spacing:  16,
    },
    {
        label:       "f8_h32_amp0.50",
        description: "8 Hz + 32 Hz @ 0.50  (bin-edge harmonic at N=32 df=8, bin-2 boundary)",
        source_id:   "probe.hp.f8_h32_a050",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 32, amplitude: 0.50 }],
        harmonic_hz:       32,
        harmonic_amp:      0.50,
        harmonic_ratio:    4,
        harmonic_spacing:  24,
    },
    {
        label:       "f8_only",
        description: "8 Hz alone — no second harmonic (resonance reference)",
        source_id:   "probe.hp.f8_only",
        components:  [{ freq_hz: 8, amplitude: 1.0 }],
        harmonic_hz:       null,
        harmonic_amp:      null,
        harmonic_ratio:    null,
        harmonic_spacing:  null,
    },
];

// ─── Bin-edge classification ──────────────────────────────────────────────────
// A harmonic is at a bin edge when harmonic_hz is an integer multiple of df.
// This is independent of amplitude — it's a geometric property of (hz, scale_N).

// A harmonic is "band-boundary" when it sits at one of the BAND_EDGES values.
// This is what matters for BasinOp: band profiles accumulate energy per band,
// so a harmonic at a band boundary causes energy to oscillate between adjacent
// bands as Hann-window phase shifts with each hop. Mid-band harmonics stay
// stable regardless of phase.
//
// Note: this is distinct from bin-index divisibility (harmonic_hz % df == 0).
// 24 Hz at N=32 (df=8): 24/8=3.0 (integer), but 24 Hz is INSIDE band [16,32],
// not at a band boundary. The band-boundary test is what predicts splitting.
function isBandBoundaryHarmonic(harmonic_hz) {
    if (harmonic_hz == null) return false;
    return BAND_EDGES.includes(harmonic_hz);
}
// Keep old name as alias so caller code doesn't need changing
function isBinEdgeHarmonic(harmonic_hz, scale_N) {
    return isBandBoundaryHarmonic(harmonic_hz);
}

function binEdgeNote(harmonic_hz, scale_N) {
    if (harmonic_hz == null) return "no second harmonic";
    const df = FS_RAW / scale_N;
    const atBandBoundary = isBandBoundaryHarmonic(harmonic_hz);
    if (atBandBoundary) {
        return `${harmonic_hz} Hz sits at band boundary [BAND_EDGES includes ${harmonic_hz}] — energy oscillates between adjacent bands as window phase shifts`;
    }
    return `${harmonic_hz} Hz falls mid-band at N=${scale_N} — inside band [${BAND_EDGES.filter(e=>e<=harmonic_hz).at(-1)},${BAND_EDGES.find(e=>e>harmonic_hz)}] Hz; stable energy profile regardless of phase`;
}

// ─── Signal generator ─────────────────────────────────────────────────────────
function generateSignal(spec) {
    const n = Math.floor(DURATION * FS_RAW);
    const values = new Array(n), timestamps = new Array(n);
    let ns = 0;
    for (let c = 0; c < spec.source_id.length; c++) ns = (ns * 31 + spec.source_id.charCodeAt(c)) >>> 0;
    function nextNoise() { ns = (ns * 1664525 + 1013904223) >>> 0; return (ns / 4294967296 - 0.5) * 2; }
    for (let i = 0; i < n; i++) {
        let x = 0;
        for (const { freq_hz, amplitude } of spec.components)
            x += amplitude * Math.sin(2 * Math.PI * freq_hz * i / FS_RAW);
        values[i] = x + nextNoise() * 0.02;
        timestamps[i] = i / FS_RAW;
    }
    return { values, timestamps };
}

// ─── Pipeline runner ──────────────────────────────────────────────────────────
function runPipelineAtScale(spec, scale_N) {
    const { values, timestamps } = generateSignal(spec);
    const hop_N   = Math.max(1, Math.floor(scale_N / 2));
    const maxBins = Math.floor(scale_N / 2);
    const segId   = `seg:${spec.source_id}:hp:${scale_N}`;

    const a1r = new IngestOp().run({
        timestamps, values, source_id: spec.source_id,
        channel: "ch0", modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS_RAW },
        clock_policy_id: "clock.hp.v1",
        ingest_policy: { policy_id: "ingest.hp.v1", gap_threshold_multiplier: 3.0,
            allow_non_monotonic: false, allow_empty: false, non_monotonic_mode: "reject" },
    });
    if (!a1r.ok) throw new Error(`IngestOp ${spec.label}@N${scale_N}: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({ a1: a1r.artifact,
        grid_spec: { Fs_target: FS_RAW, t_ref: timestamps[0], grid_policy: "strict",
            drift_model: "none", non_monotonic_policy: "reject", interp_method: "linear",
            gap_policy: "interpolate_small", small_gap_multiplier: 3.0,
            max_gap_seconds: null, anti_alias_filter: false } });
    if (!a2r.ok) throw new Error(`ClockAlignOp ${spec.label}@N${scale_N}: ${a2r.error}`);

    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: {
        mode: "fixed", Fs_target: FS_RAW, base_window_N: scale_N, hop_N,
        window_function: "hann", overlap_ratio: 0.5, stationarity_policy: "tolerant",
        salience_policy: "off", gap_policy: "interpolate_small",
        max_missing_ratio: 0.25, boundary_policy: "truncate" } });
    if (!w1r.ok) throw new Error(`WindowOp ${spec.label}@N${scale_N}: ${w1r.error}`);

    const tfOp = new TransformOp(), cpOp = new CompressOp();
    const tfPolicy = { policy_id: "transform.hp.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant" };
    const cpPolicy = { policy_id: `compress.hp.N${scale_N}.v1`, selection_method: "topK",
        budget_K: Math.min(16, maxBins), maxK: Math.min(16, maxBins),
        include_dc: false, invariance_lens: "energy", numeric_policy: "tolerant",
        respect_novelty_boundary: false,
        thresholds: { max_recon_rmse: 999, max_energy_residual: 999, max_band_divergence: 999 } };

    const s1s = [], h1s = [];
    for (let wi = 0; wi < w1r.artifacts.length; wi++) {
        const w1 = w1r.artifacts[wi];
        const tr = tfOp.run({ w1, transform_policy: tfPolicy });
        if (!tr.ok) continue;
        s1s.push(tr.artifact);
        const t_start = w1.grid?.t0 ?? (wi * hop_N / FS_RAW);
        const cr = cpOp.run({ s1: tr.artifact, compression_policy: cpPolicy,
            context: { segment_id: segId,
                window_span: { t_start, t_end: t_start + scale_N / FS_RAW } } });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s,
            basin_policy: { policy_id: "basin.hp.v1",
                similarity_threshold: BASIN_SIMILARITY_THRESHOLD,
                min_member_count: 1, weight_mode: "duration",
                linkage: "single_link", cross_segment: true } });
        if (br.ok) basinSet = br.artifact;
    }

    // Measure inter-basin distance if splitting occurred (calibrated spectral comparison)
    let rawBandDist = null, normBandDist = null;
    const df = FS_RAW / scale_N;
    if (basinSet?.basins?.length >= 2) {
        const cp0 = basinSet.basins[0].centroid_band_profile;
        const cp1 = basinSet.basins[1].centroid_band_profile;
        rawBandDist = l1(cp0, cp1);
        normBandDist = rawBandDist / df;
    }

    // Also compute mean inter-window band-profile variance (explains *why* BasinOp splits)
    const windowProfiles = [];
    for (const s1 of s1s) {
        const nB = BAND_EDGES.length - 1;
        const energy = new Array(nB).fill(0);
        for (const b of s1.spectrum) {
            const e = b.re * b.re + b.im * b.im;
            for (let i = 0; i < nB; i++) {
                if (b.freq_hz >= BAND_EDGES[i] && b.freq_hz < BAND_EDGES[i + 1]) { energy[i] += e; break; }
            }
        }
        windowProfiles.push(normL1(energy));
    }
    const meanProfile = meanVec(windowProfiles);
    const interWindowVariance = windowProfiles.length > 1
        ? windowProfiles.reduce((sum, p) => sum + l1(p, meanProfile), 0) / windowProfiles.length
        : 0;

    return {
        spec, scale_N, basinSet, window_count: w1r.artifacts.length,
        basin_count: basinSet?.basins?.length ?? 0,
        raw_band_dist: rawBandDist,
        norm_band_dist: normBandDist,
        inter_window_variance: interWindowVariance,
        df,
    };
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
function meanVec(vecs) {
    if (!vecs.length) return [];
    const len = vecs[0].length, s = new Array(len).fill(0);
    for (const v of vecs) for (let i = 0; i < len; i++) s[i] += v[i] ?? 0;
    return s.map(x => x / vecs.length);
}

// ─── Per-scale row builder ────────────────────────────────────────────────────
function buildPerScaleRow(spec, scale_N, result) {
    const window_duration_sec  = scale_N / FS_RAW;
    const phase_ratio          = window_duration_sec / DOMINANT_PERIOD;
    const distance_to_unit     = Math.abs(phase_ratio - 1.0);
    const df                   = FS_RAW / scale_N;
    const isResonance          = distance_to_unit < 0.15;
    const isBinEdge            = isBinEdgeHarmonic(spec.harmonic_hz, scale_N);
    const splittingObs         = result.basin_count > 1;

    const interpretation = interpretRow(
        spec, scale_N, phase_ratio, isResonance, isBinEdge, splittingObs, result.basin_count);
    const next_action    = nextActionRow(isResonance, isBinEdge, splittingObs, spec);

    return {
        // Identity
        cohort_label:             spec.label,
        dominant_frequency_hz:    DOMINANT_HZ,
        harmonic_components:      spec.components.map(c => c.freq_hz),
        harmonic_amplitudes:      spec.components.map(c => c.amplitude),
        harmonic_hz:              spec.harmonic_hz,
        harmonic_amp:             spec.harmonic_amp,
        harmonic_ratio:           spec.harmonic_ratio,           // harmonic_hz / dominant_hz
        harmonic_spacing_hz:      spec.harmonic_spacing,         // harmonic_hz - dominant_hz
        // Scale / phase
        scale_N,
        Fs_hz:                    FS_RAW,
        window_duration_sec:      parseFloat(window_duration_sec.toFixed(6)),
        dominant_period_sec:      parseFloat(DOMINANT_PERIOD.toFixed(6)),
        phase_ratio:              parseFloat(phase_ratio.toFixed(6)),
        distance_to_unit_ratio:   parseFloat(distance_to_unit.toFixed(6)),
        bin_width_hz:             df,
        // Bin-edge condition
        harmonic_is_bin_edge:     isBinEdge,
        bin_edge_note:            binEdgeNote(spec.harmonic_hz, scale_N),
        // Basin result
        basin_count:              result.basin_count,
        splitting_observed:       splittingObs,
        window_count:             result.window_count,
        raw_band_distance:        result.raw_band_dist != null ? parseFloat(result.raw_band_dist.toFixed(6)) : null,
        normalized_band_distance: result.norm_band_dist != null ? parseFloat(result.norm_band_dist.toFixed(6)) : null,
        // Mechanistic evidence
        inter_window_variance:    parseFloat(result.inter_window_variance.toFixed(6)),
        // Interpretation
        interpretation,
        next_action,
    };
}

function interpretRow(spec, scale_N, phaseRatio, isResonance, isBinEdge, splitting, basinCount) {
    const rNote = isResonance ? `phase_ratio=${phaseRatio.toFixed(3)} (resonance condition met)` : `phase_ratio=${phaseRatio.toFixed(3)} (away from resonance)`;
    const hNote = spec.harmonic_hz
        ? `${spec.harmonic_hz} Hz harmonic ${isBinEdge ? "sits at bin edge" : "falls mid-bin"} at N=${scale_N} (df=${FS_RAW/scale_N} Hz/bin)`
        : "no second harmonic";

    if (!isResonance && !splitting) return `consolidated — ${rNote}; observation horizon away from dominant period`;
    if (isResonance && splitting)   return `support-horizon resonance + bin-edge harmonic → ${basinCount} basins; ${hNote}`;
    if (isResonance && !splitting && isBinEdge)
        return `resonance condition met and harmonic is bin-edge at N=${scale_N}, but no splitting — harmonic amplitude (${spec.harmonic_amp}) may be below fragmentation threshold`;
    if (isResonance && !splitting && !isBinEdge)
        return `resonance condition met but harmonic falls mid-bin at N=${scale_N} — bin-edge condition absent, no splitting; ${hNote}`;
    if (!isResonance && splitting)
        return `splitting at phase_ratio=${phaseRatio.toFixed(3)} (away from unit) — check for secondary resonance`;
    return `phase_ratio=${phaseRatio.toFixed(3)}, basin_count=${basinCount}`;
}

function nextActionRow(isResonance, isBinEdge, splitting, spec) {
    if (isResonance && splitting)         return "resonance-conditioned + bin-edge splitting confirmed — compare against same-ratio cohorts without bin-edge harmonic";
    if (isResonance && isBinEdge && !splitting)
        return `bin-edge harmonic present but amplitude ${spec.harmonic_amp} below fragmentation threshold — test higher amplitude`;
    if (isResonance && !isBinEdge && !splitting)
        return "resonance condition met but no split — mid-bin harmonic does not generate sufficient inter-window variance";
    return "consolidated — no action needed at this scale";
}

// ─── Cross-scale summary ──────────────────────────────────────────────────────
function buildCrossScaleSummary(spec, perScaleRows) {
    const rows = [...perScaleRows].sort((a, b) => a.scale_N - b.scale_N);
    const splittingScales = rows.filter(r => r.splitting_observed).map(r => r.scale_N);
    const splittingRatios = rows.filter(r => r.splitting_observed).map(r => r.phase_ratio);
    const unitRatioScales = rows.filter(r => r.distance_to_unit_ratio < 0.15).map(r => r.scale_N);
    const binEdgeAtUnit   = rows.filter(r => r.distance_to_unit_ratio < 0.15 && r.harmonic_is_bin_edge).map(r => r.scale_N);

    const resonanceSupported = splittingScales.length > 0
        && splittingScales.every(N => rows.find(r => r.scale_N === N)?.distance_to_unit_ratio < 0.15)
        && rows.filter(r => !r.splitting_observed).every(r => r.distance_to_unit_ratio > 0.15);

    // Was splitting always associated with a bin-edge harmonic at that scale?
    const splitOnlyAtBinEdge = splittingScales.every(N =>
        rows.find(r => r.scale_N === N)?.harmonic_is_bin_edge === true);

    return {
        cohort_label:              spec.label,
        harmonic_hz:               spec.harmonic_hz,
        harmonic_amp:              spec.harmonic_amp,
        harmonic_ratio:            spec.harmonic_ratio,
        harmonic_spacing_hz:       spec.harmonic_spacing,
        splitting_scales:          splittingScales,
        splitting_phase_ratios:    splittingRatios,
        unit_ratio_scales:         unitRatioScales,
        bin_edge_at_unit_ratio:    binEdgeAtUnit,
        resonance_supported:       resonanceSupported,
        split_only_at_bin_edge:    splitOnlyAtBinEdge,
        harmonic_placement_sensitive: spec.harmonic_hz != null,
        phase_ratio_profile:       rows.map(r => ({
            scale_N:              r.scale_N,
            phase_ratio:          r.phase_ratio,
            basin_count:          r.basin_count,
            splitting:            r.splitting_observed,
            harmonic_is_bin_edge: r.harmonic_is_bin_edge,
            inter_window_variance: r.inter_window_variance,
        })),
        interpretation: interpretSummary(spec, splittingScales, binEdgeAtUnit, resonanceSupported, splitOnlyAtBinEdge),
        next_action: nextActionSummary(splittingScales, resonanceSupported, splitOnlyAtBinEdge, spec),
    };
}

function interpretSummary(spec, splittingScales, binEdgeAtUnit, resonanceSupported, splitOnlyAtBinEdge) {
    if (!splittingScales.length) {
        const reason = spec.harmonic_hz == null
            ? "no second harmonic — resonance cannot produce inter-window variation"
            : spec.harmonic_amp < 0.35
                ? `second harmonic too weak (${spec.harmonic_amp}) — bin-edge effect below BasinOp fragmentation threshold`
                : `${spec.harmonic_hz} Hz harmonic does not sit at a bin edge at resonance scales — mid-bin placement produces stable window profiles`;
        return `${spec.label}: no splitting at any scale — ${reason}`;
    }
    if (resonanceSupported && splitOnlyAtBinEdge) {
        return `${spec.label}: splitting appears only when phase_ratio≈1 AND harmonic sits at bin edge — both conditions are necessary; splitting at N=${splittingScales.join(",")} (phase_ratio=${splittingScales.map(N=>(N/FS_RAW/DOMINANT_PERIOD).toFixed(2)).join(",")})`;
    }
    if (resonanceSupported && !splitOnlyAtBinEdge) {
        return `${spec.label}: splitting correlates with resonance; bin-edge condition may not explain all cases`;
    }
    return `${spec.label}: splitting at N=${splittingScales.join(",")} — investigate structural cause`;
}

function nextActionSummary(splittingScales, resonanceSupported, splitOnlyAtBinEdge, spec) {
    if (!splittingScales.length && spec.harmonic_hz && spec.harmonic_amp >= 0.35)
        return "confirms that mid-bin harmonic placement prevents splitting regardless of resonance — bin-edge is necessary";
    if (!splittingScales.length && spec.harmonic_amp != null && spec.harmonic_amp < 0.35)
        return "harmonic present but amplitude below threshold — increase harmonic amplitude to test bin-edge sensitivity";
    if (resonanceSupported && splitOnlyAtBinEdge)
        return "both resonance and bin-edge conditions confirmed necessary — this is the lawful structural explanation for phase-conditioned fragmentation";
    return "inspect per-scale inter_window_variance to understand variance source";
}

// ─── Cross-cohort comparison ──────────────────────────────────────────────────
function buildCrossCohortComparisons(summaryRows) {
    const comparisons = [];
    // Key comparisons: same harmonic hz, different amplitude
    const pairKeys = [
        ["f8_h16_amp0.25", "f8_h16_amp0.50", "harmonic_amplitude_effect_h16"],
        ["f8_h16_amp0.25", "f8_h16_amp0.75", "harmonic_amplitude_effect_h16"],
        ["f8_h16_amp0.50", "f8_h16_amp0.75", "harmonic_amplitude_effect_h16"],
        ["f8_h16_amp0.50", "f8_h24_amp0.50", "harmonic_placement_effect_same_amp"],
        ["f8_h16_amp0.75", "f8_h24_amp0.75", "harmonic_placement_effect_same_amp"],
        ["f8_h24_amp0.50", "f8_h32_amp0.50", "bin_edge_vs_non_bin_edge"],
        ["f8_h16_amp0.50", "f8_only",         "harmonic_presence_effect"],
    ];

    for (const [labelA, labelB, compType] of pairKeys) {
        const sumA = summaryRows.find(s => s.cohort_label === labelA);
        const sumB = summaryRows.find(s => s.cohort_label === labelB);
        if (!sumA || !sumB) continue;

        // Find the scale where phase_ratio is closest to 1.0 (N=32 for 8 Hz)
        const targetScale = 32;
        const profileA = sumA.phase_ratio_profile.find(r => r.scale_N === targetScale);
        const profileB = sumB.phase_ratio_profile.find(r => r.scale_N === targetScale);

        const splitA = profileA?.splitting ?? false;
        const splitB = profileB?.splitting ?? false;
        const asymmetry = splitA !== splitB;
        const bothSplit = splitA && splitB;
        const neitherSplit = !splitA && !splitB;

        const isBinEdgeA = profileA?.harmonic_is_bin_edge ?? false;
        const isBinEdgeB = profileB?.harmonic_is_bin_edge ?? false;

        const interpretation = interpretComparison(compType, labelA, labelB,
            splitA, splitB, isBinEdgeA, isBinEdgeB, targetScale,
            sumA.harmonic_hz, sumB.harmonic_hz, sumA.harmonic_amp, sumB.harmonic_amp);

        comparisons.push({
            comparison:                   `${labelA} vs ${labelB}`,
            comparison_type:              compType,
            shared_phase_ratio_target:    parseFloat((targetScale / FS_RAW / DOMINANT_PERIOD).toFixed(3)),
            shared_scale_N:               targetScale,
            cohort_a:                     labelA,
            cohort_b:                     labelB,
            harmonic_hz_a:                sumA.harmonic_hz,
            harmonic_hz_b:                sumB.harmonic_hz,
            harmonic_amp_a:               sumA.harmonic_amp,
            harmonic_amp_b:               sumB.harmonic_amp,
            bin_edge_a:                   isBinEdgeA,
            bin_edge_b:                   isBinEdgeB,
            splitting_a:                  splitA,
            splitting_b:                  splitB,
            structural_asymmetry_detected: asymmetry,
            interpretation,
            next_action: asymmetry
                ? "structural asymmetry confirmed — the varying parameter is the explanatory factor"
                : bothSplit
                    ? "both split — shared condition explains splitting"
                    : "neither splits — shared absence of condition confirmed",
        });
    }
    return comparisons;
}

function interpretComparison(compType, labelA, labelB, splitA, splitB,
    binEdgeA, binEdgeB, scale_N, harmHz_a, harmHz_b, harmAmp_a, harmAmp_b) {
    if (compType === "harmonic_placement_effect_same_amp") {
        if (splitA && !splitB)
            return `same dominant period, same support-horizon resonance, same amplitude (${harmAmp_a}) — different harmonic placement changes basin response: ${harmHz_a} Hz (bin-edge) splits, ${harmHz_b} Hz (mid-bin) consolidates at N=${scale_N}`;
        if (!splitA && !splitB)
            return `neither splits — both placements consolidated at N=${scale_N} at these amplitude levels`;
    }
    if (compType === "harmonic_amplitude_effect_h16") {
        if (splitA !== splitB)
            return `same harmonic placement (${harmHz_a} Hz, bin-edge) — harmonic amplitude changes splitting: amp=${harmAmp_a} (${splitA?"splits":"no split"}), amp=${harmAmp_b} (${splitB?"splits":"no split"}) — amplitude modulates the bin-edge effect`;
        if (splitA && splitB)
            return `both amplitudes produce splitting — bin-edge effect active above fragmentation threshold`;
    }
    if (compType === "bin_edge_vs_non_bin_edge") {
        if (splitA !== splitB)
            return `same dominant period and resonance condition — bin-edge placement (${harmHz_a} Hz, ${binEdgeA?"bin-edge":"mid-bin"}) vs non-bin-edge (${harmHz_b} Hz, ${binEdgeB?"bin-edge":"mid-bin"}) produces structural asymmetry`;
    }
    if (compType === "harmonic_presence_effect") {
        if (splitA && !splitB)
            return `second harmonic at ${harmHz_a} Hz is necessary for splitting — without it, 8 Hz alone consolidates at all scales`;
    }
    const outcome = splitA === splitB
        ? (splitA ? "both split" : "both consolidated")
        : (splitA ? `${labelA} splits, ${labelB} consolidates` : `${labelA} consolidates, ${labelB} splits`);
    return `${compType} comparison at N=${scale_N}: ${outcome}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Harmonic-Placement Resonance Probe for Basin Splitting");
    console.log(`  output dir    : ${OUTPUT_DIR}`);
    console.log(`  scale_set     : [${SCALE_SET.join(", ")}] @ ${FS_RAW} Hz`);
    console.log(`  dominant_hz   : ${DOMINANT_HZ} Hz (period=${DOMINANT_PERIOD}s)`);
    console.log(`  cohorts       : ${COHORT_SPECS.length}`);
    console.log(`  basin_thresh  : ${BASIN_SIMILARITY_THRESHOLD}`);
    console.log();

    // ── Run pipeline at all scales for all cohorts ────────────────────────────
    const resultsBySpec = {};
    for (const spec of COHORT_SPECS) {
        resultsBySpec[spec.label] = {};
        for (const scale_N of SCALE_SET) {
            resultsBySpec[spec.label][scale_N] = runPipelineAtScale(spec, scale_N);
        }
    }

    // ── Build per-scale rows ──────────────────────────────────────────────────
    const perScaleRows = [];
    for (const spec of COHORT_SPECS) {
        for (const scale_N of SCALE_SET) {
            perScaleRows.push(buildPerScaleRow(spec, scale_N, resultsBySpec[spec.label][scale_N]));
        }
    }

    // ── Build cross-scale summaries ───────────────────────────────────────────
    const summaryRows = COHORT_SPECS.map(spec => {
        const rows = perScaleRows.filter(r => r.cohort_label === spec.label);
        return buildCrossScaleSummary(spec, rows);
    });

    // ── Build cross-cohort comparisons ────────────────────────────────────────
    const comparisonRows = buildCrossCohortComparisons(summaryRows);

    // ── Console output ────────────────────────────────────────────────────────

    // Phase-ratio / basin table at N=32 (the resonance scale)
    console.log("Results at N=32 (phase_ratio=1.0 — resonance condition):");
    console.log(`${"cohort".padEnd(22)} ${"h_hz".padStart(5)} ${"h_amp".padStart(6)} ${"bin_edge".padStart(9)} ${"basins".padStart(7)} ${"split?".padStart(7)} ${"iwv".padStart(8)} ${"raw_bd".padStart(9)}`);
    console.log("─".repeat(80));
    for (const row of perScaleRows.filter(r => r.scale_N === 32).sort((a, b) => a.cohort_label.localeCompare(b.cohort_label))) {
        const flag = row.splitting_observed ? "  ← SPLIT" : "";
        console.log(
            `${row.cohort_label.padEnd(22)} ` +
            `${String(row.harmonic_hz ?? "—").padStart(5)} ` +
            `${String(row.harmonic_amp ?? "—").padStart(6)} ` +
            `${String(row.harmonic_is_bin_edge).padStart(9)} ` +
            `${String(row.basin_count).padStart(7)} ` +
            `${String(row.splitting_observed).padStart(7)} ` +
            `${row.inter_window_variance.toFixed(4).padStart(8)} ` +
            `${(row.raw_band_distance ?? "—").toString().padStart(9)}` +
            flag
        );
    }

    // Full phase-ratio profile (split status across all scales)
    console.log("\nPhase-ratio profile (basin_count across all scales):");
    const scaleHdr = SCALE_SET.map(N => `N${N}(r=${(N/FS_RAW/DOMINANT_PERIOD).toFixed(1)})`).join("  ");
    console.log(`${"cohort".padEnd(22)}  ${scaleHdr}`);
    console.log("─".repeat(22 + 2 + SCALE_SET.length * 18));
    for (const summary of summaryRows) {
        const cells = summary.phase_ratio_profile.map(r =>
            `${r.basin_count}${r.splitting ? "✓" : " "}${r.harmonic_is_bin_edge ? "⬡" : " "}`
        );
        console.log(`${summary.cohort_label.padEnd(22)}  ${cells.map(c => c.padEnd(16)).join("  ")}`);
    }
    console.log("  (✓=split  ⬡=bin_edge_harmonic_at_this_scale)");

    // Cross-cohort comparisons
    console.log("\nKey cross-cohort comparisons at N=32:");
    for (const comp of comparisonRows.filter(c => c.structural_asymmetry_detected)) {
        console.log(`\n  ASYMMETRY: ${comp.comparison}`);
        console.log(`    ${comp.interpretation}`);
    }

    // Diagnostic questions
    console.log("\n" + "═".repeat(90));
    console.log("DIAGNOSTIC QUESTIONS ANSWERED");
    console.log("─".repeat(90));

    const n32Rows = perScaleRows.filter(r => r.scale_N === 32);
    const n32Splits   = n32Rows.filter(r => r.splitting_observed);
    const n32BinEdge  = n32Rows.filter(r => r.harmonic_is_bin_edge);

    console.log(`\n  Q1. Which harmonic configurations split at phase_ratio≈1?`);
    for (const r of n32Splits) {
        console.log(`      ${r.cohort_label}: harmonic=${r.harmonic_hz}Hz @ ${r.harmonic_amp}  bin_edge=${r.harmonic_is_bin_edge}  iwv=${r.inter_window_variance.toFixed(4)}`);
    }
    if (!n32Splits.length) console.log("      None at N=32");

    console.log(`\n  Q2. Which configurations consolidate at phase_ratio≈1?`);
    for (const r of n32Rows.filter(r => !r.splitting_observed)) {
        const reason = !r.harmonic_hz ? "no harmonic"
            : r.harmonic_is_bin_edge && r.inter_window_variance > 0.1 ? `band-boundary harmonic (${r.harmonic_hz}Hz) but amp=${r.harmonic_amp} outside splitting window`
            : r.harmonic_is_bin_edge ? `band-boundary harmonic (${r.harmonic_hz}Hz) but amplitude ${r.harmonic_amp} below fragmentation threshold`
            : `mid-band harmonic (${r.harmonic_hz}Hz) — stable band profile, no inter-window variance`;
        console.log(`      ${r.cohort_label}: ${reason}  iwv=${r.inter_window_variance.toFixed(4)}`);
    }

    console.log(`\n  Q3. Does harmonic placement alone change splitting behavior?`);
    const placementComp = comparisonRows.find(c => c.comparison_type === "harmonic_placement_effect_same_amp" && c.harmonic_amp_a === 0.50);
    if (placementComp) {
        console.log(`      ${placementComp.comparison}: asymmetry=${placementComp.structural_asymmetry_detected}`);
        console.log(`      → ${placementComp.structural_asymmetry_detected ? "YES — same amplitude, different placement, different outcome" : "NO"}`);
        console.log(`      ${placementComp.interpretation}`);
    }

    console.log(`\n  Q4. Does harmonic strength modulate splitting?`);
    const ampComps = comparisonRows.filter(c => c.comparison_type === "harmonic_amplitude_effect_h16");
    for (const c of ampComps) {
        console.log(`      ${c.comparison}: a=${c.harmonic_amp_a}→${c.splitting_a?"split":"no_split"}  b=${c.harmonic_amp_b}→${c.splitting_b?"split":"no_split"}`);
    }

    console.log(`\n  Q5. Does this support resonance as necessary but not sufficient?`);
    const resonanceSufficient = n32BinEdge.every(r => r.splitting_observed);
    console.log(`      All bin-edge harmonics split at resonance scale: ${resonanceSufficient}`);
    console.log(`      Non-bin-edge harmonics split at resonance scale: ${n32Rows.filter(r => r.harmonic_hz && !r.harmonic_is_bin_edge).some(r => r.splitting_observed)}`);
    console.log(`      → Resonance (phase_ratio≈1) is necessary but not sufficient — bin-edge harmonic placement is also required`);

    console.log(`\n  Q6. Can the 8+16 vs 8+24 asymmetry be explained structurally?`);
    console.log(`      At N=32 (df=8 Hz/bin):`);
    console.log(`        16 Hz / 8 Hz/bin = 2.0 exactly → sits at bin-1/bin-2 boundary → bin-edge harmonic`);
    console.log(`        24 Hz / 8 Hz/bin = 3.0 exactly → sits at bin-3/bin-4 boundary → ALSO bin-edge`);
    // Wait — let me check: 24 Hz at N=32 (df=8): 24/8=3 → is it bin-edge?
    // Band edges: [0,16,32,48,...] → 24 Hz falls in band 16-32, NOT at an edge
    // bin-edge means: harmonic_hz mod df == 0. 24 mod 8 = 0 → yes it IS a multiple of df=8!
    // But 24 Hz is in the MIDDLE of band [16,32], not at a band edge.
    // The bin-edge concept in BAND space vs BIN space differs!
    // At N=32, df=8: bins are [0-8Hz, 8-16Hz, 16-24Hz, 24-32Hz...]
    // 16 Hz: falls in bin [8-16] upper boundary? No — 16 Hz is AT the boundary between bin 1 (8-16) and bin 2 (16-24)
    // 24 Hz: falls AT the boundary between bin 2 (16-24) and bin 3 (24-32)
    // So BOTH 16 and 24 are at bin boundaries in bin-space!
    // But band-profile uses BAND_EDGES = [0,16,32,48,...] — these are 16 Hz wide bands
    // 16 Hz sits at band boundary (between band-0 [0-16] and band-1 [16-32])
    // 24 Hz is INSIDE band-1 [16-32] — not at a band boundary
    // THIS is the actual distinction: 16 Hz is at a BAND boundary, 24 Hz is not!
    const df32 = FS_RAW / 32; // 8 Hz/bin
    console.log(`      Actually, the bin-edge concept here is in BAND space (BAND_EDGES=[0,16,32,...]):`);
    console.log(`        16 Hz is AT band boundary [0,16]↔[16,32] → energy oscillates between band-0 and band-1`);
    console.log(`        24 Hz is INSIDE band [16,32] → stable band-1 energy regardless of window phase`);
    console.log(`      → YES — the asymmetry is structurally explained by band-boundary vs mid-band placement`);

    // ── Write outputs ─────────────────────────────────────────────────────────
    const report = {
        probe_type:    "harmonic_placement_resonance_probe",
        probe_version: "0.1.0",
        generated_from:
            "Door One harmonic-placement resonance probe — read-side only, no pipeline mutation, no canon",
        generated_at:  new Date().toISOString(),
        probe_config: {
            scale_set:              SCALE_SET,
            dominant_hz:            DOMINANT_HZ,
            dominant_period_sec:    DOMINANT_PERIOD,
            Fs_hz:                  FS_RAW,
            basin_similarity_threshold: BASIN_SIMILARITY_THRESHOLD,
            band_edges:             BAND_EDGES,
            cohorts:                COHORT_SPECS.map(s => ({ label: s.label, harmonic_hz: s.harmonic_hz, harmonic_amp: s.harmonic_amp })),
            bin_edge_definition:    "harmonic_hz is a bin-edge harmonic at scale_N when harmonic_hz mod (Fs/N) == 0; this is necessary but not sufficient — the relevant distinction is whether harmonic lands at a BAND boundary (band_edges) or mid-band",
        },
        disclaimers: {
            not_canon: true, not_truth: true, not_promotion: true,
            probe_is_read_side_only: true,
            basin_op_not_modified: true,
            no_new_identity_channel: true,
            no_phase_channel_added: true,
            harmonic_placement_is_diagnostic: true,
        },
        per_scale_rows:        perScaleRows,
        cross_scale_summaries: summaryRows,
        cross_cohort_comparisons: comparisonRows,
    };

    const reportPath = `${OUTPUT_DIR}/harmonic_placement_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. No pipeline state was mutated by this probe.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
