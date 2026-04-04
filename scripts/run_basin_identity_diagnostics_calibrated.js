// scripts/run_basin_identity_diagnostics_calibrated.js
//
// Basin Identity Diagnostics under Calibrated Spectral Comparison
//
// One-line anchor:
//   Re-evaluate basin identity only after calibrated spectral comparison, so
//   apparent fragmentation can be distinguished from true basin instability,
//   threshold artifact, and lawful support-horizon collapse.
//
// Core question:
//   When spectral comparison is calibrated (bin-width normalization), does
//   basin splitting still persist as a lawful structural phenomenon, or was
//   it a threshold artifact?
//
// Context:
//   The scale-calibrated probe showed that the global spectral threshold (0.20)
//   misclassifies the freq vs freq_shift pair at N=8 and N=64 — calling it
//   borderline when calibrated comparison says separated. This probe re-examines
//   all basin-facing outputs with that calibration in place and asks:
//
//   1. After calibrated spectral comparison, does basin splitting still appear?
//   2. If splitting remains: lawful fragmentation, support-horizon sensitivity,
//      or BasinOp identity-resolution pressure?
//   3. If splitting disappears: was it threshold artifact?
//   4. Does the energy channel remain cleanly separate from the spectral channel?
//   5. Under calibrated comparison, where do basin boundaries actually form?
//
// Spectral comparison rule (per MVCS freeze):
//   Use bin-width-normalized spectral distance: raw_distance / (Fs/N)
//   Emit both raw_band_distance AND normalized_band_distance in all basin rows.
//   Per-scale thresholds are also computed for cross-verification.
//   Relative within-scale ranking alone is NOT sufficient.
//
// Boundary contract:
//   - read-side only — no pipeline mutation, no operator changes
//   - do not mint canon, do not claim true attractor basins
//   - BasinOp groupings remain structural proto-basins, not semantic entities
//   - energy and spectral channels remain attributable and separate
//   - attributable, reversible, removable
//
// Run:
//   node scripts/run_basin_identity_diagnostics_calibrated.js
//
// Optional env:
//   PROBE_BD_OUTPUT_DIR — override ./out_experiments/basin_identity_diagnostics_calibrated
//
// References:
//   - scripts/run_identity_separability_probe_scale_calibrated.js (calibrated thresholds)
//   - scripts/run_identity_separability_probe_multiscale.js (prior basin observations)
//   - README_DoorOneRuntimeBoundary.md

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }    from "../operators/ingest/IngestOp.js";
import { ClockAlignOp } from "../operators/clock/ClockAlignOp.js";
import { WindowOp }    from "../operators/window/WindowOp.js";
import { TransformOp } from "../operators/transform/TransformOp.js";
import { CompressOp }  from "../operators/compress/CompressOp.js";
import { BasinOp }     from "../operators/basin/BasinOp.js";

const OUTPUT_DIR = process.env.PROBE_BD_OUTPUT_DIR
    ?? "./out_experiments/basin_identity_diagnostics_calibrated";

// ─── Scale / signal parameters (identical across the probe family) ────────────
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

const GROUND_TRUTH = {
    "baseline_amplitude vs amplitude_shift":    "similar",
    "baseline_frequency vs frequency_shift":    "separated",
    "baseline_amplitude vs baseline_frequency": "separated",
    "amplitude_shift vs frequency_shift":       "separated",
};

// ─── Calibrated spectral comparison posture ───────────────────────────────────
// Bin-width normalization: normalize raw L1 band-profile distance by df = Fs/N.
// A single globally-fitted threshold applies to the normalized distance.
// Source: run_identity_separability_probe_scale_calibrated.js Strategy 2 result.
const BW_NORM_THRESHOLD = 0.001800;  // derived from clean gap fit across all scales

// Per-scale thresholds (Strategy 1 backup, for cross-verification only):
const PER_SCALE_THRESHOLDS = {
    8:  0.050132,
    16: 0.116566,
    32: 0.229296,
    64: 0.055482,
};

// Global uncalibrated threshold — retained as baseline for comparison only
const GLOBAL_RAW_THRESHOLD = 0.20;

// ─── Signal generator (deterministic) ────────────────────────────────────────
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

// ─── Pipeline runner at scale ─────────────────────────────────────────────────
function runPipelineAtScale(spec, scale_N) {
    const { values, timestamps } = generateSignal(spec);
    const hop_N   = Math.max(1, Math.floor(scale_N / 2));
    const maxBins = Math.floor(scale_N / 2);
    const segId   = `seg:${spec.source_id}:bd:${scale_N}`;
    const topK    = Math.min(8, maxBins);

    const a1r = new IngestOp().run({
        timestamps, values, source_id: spec.source_id,
        channel: "ch0", modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS_RAW },
        clock_policy_id: "clock.probe.bd.v1",
        ingest_policy: { policy_id: "ingest.probe.bd.v1", gap_threshold_multiplier: 3.0,
            allow_non_monotonic: false, allow_empty: false, non_monotonic_mode: "reject" },
    });
    if (!a1r.ok) throw new Error(`IngestOp ${spec.label}@N${scale_N}: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({ a1: a1r.artifact,
        grid_spec: { Fs_target: FS_RAW, t_ref: timestamps[0], grid_policy: "strict",
            drift_model: "none", non_monotonic_policy: "reject", interp_method: "linear",
            gap_policy: "interpolate_small", small_gap_multiplier: 3.0, max_gap_seconds: null, anti_alias_filter: false } });
    if (!a2r.ok) throw new Error(`ClockAlignOp ${spec.label}@N${scale_N}: ${a2r.error}`);

    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: {
        mode: "fixed", Fs_target: FS_RAW, base_window_N: scale_N, hop_N,
        window_function: "hann", overlap_ratio: 0.5, stationarity_policy: "tolerant",
        salience_policy: "off", gap_policy: "interpolate_small",
        max_missing_ratio: 0.25, boundary_policy: "truncate" } });
    if (!w1r.ok) throw new Error(`WindowOp ${spec.label}@N${scale_N}: ${w1r.error}`);

    const tfOp = new TransformOp(), cpOp = new CompressOp();
    const tfPolicy = { policy_id: "transform.bd.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N", scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant" };
    const cpPolicy = { policy_id: `compress.bd.N${scale_N}.v1`, selection_method: "topK",
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
            context: { segment_id: segId, window_span: { t_start, t_end: t_start + scale_N / FS_RAW } } });
        if (cr.ok) h1s.push(cr.artifact);
    }

    // BasinOp over all H1s in this cohort at this scale
    let basinSet = null;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s,
            basin_policy: { policy_id: "basin.bd.v1", similarity_threshold: 0.5,
                min_member_count: 1, weight_mode: "duration", linkage: "single_link", cross_segment: true } });
        if (br.ok) basinSet = br.artifact;
    }

    // Absolute energy stats
    const rawEnergyStats = computeRawEnergyStats(values, scale_N);

    return {
        spec, scale_N, s1s, h1s, basinSet,
        source_trace_identity: a1r.artifact.stream_id,
        parent_source_identity: spec.source_id,
        band_edges: [0, 16, 32, 48, 64, 80, 96, 112, 128],
        top_k: topK,
        freq_resolution_hz: FS_RAW / scale_N,
        raw_energy_stats: rawEnergyStats,
        window_count: w1r.artifacts.length,
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
function meanVec(vecs) {
    if (!vecs.length) return [];
    const len = vecs[0].length;
    const s = new Array(len).fill(0);
    for (const v of vecs) for (let i = 0; i < len; i++) s[i] += v[i] ?? 0;
    return s.map(x => x / vecs.length);
}
function computeRawEnergyStats(values, windowN) {
    const fc = Math.floor(values.length / windowN);
    let sumE = 0;
    for (let f = 0; f < fc; f++) {
        let sq = 0; for (let i = 0; i < windowN; i++) { const v = values[f * windowN + i] ?? 0; sq += v * v; }
        sumE += sq / windowN;
    }
    const meanE = fc > 0 ? sumE / fc : 0;
    return { mean_energy: meanE, mean_rms: Math.sqrt(meanE), frame_count: fc };
}

// ─── Calibrated spectral classification ──────────────────────────────────────

function classifyCalibrated(rawDist, scale_N) {
    const df       = FS_RAW / scale_N;
    const normDist = rawDist / df;
    const clBW     = normDist > BW_NORM_THRESHOLD ? "separated" : "similar";
    const clPS     = rawDist  > (PER_SCALE_THRESHOLDS[scale_N] ?? GLOBAL_RAW_THRESHOLD) ? "separated" : "similar";
    const clGlobal = rawDist  > GLOBAL_RAW_THRESHOLD ? "separated" : rawDist > 0.08 ? "borderline" : "similar";
    return {
        raw_band_distance:        parseFloat(rawDist.toFixed(6)),
        normalized_band_distance: parseFloat(normDist.toFixed(6)),
        bin_width_hz:             df,
        scale_N,
        classification_calibrated_bw:    clBW,
        classification_per_scale:        clPS,
        classification_global_uncal:     clGlobal,
        calibration_changed_result:      clBW !== clGlobal.replace("borderline", "similar"),
    };
}

function classifyAbsoluteEnergy(ratioValue) {
    if (ratioValue == null) return "unknown";
    return ratioValue >= 1.5 ? "separated" : ratioValue >= 1.1 ? "borderline" : "similar";
}

// ─── Basin structure extractor ────────────────────────────────────────────────
// Extracts per-basin band profiles and centroid data from a BasinSet.

function extractBasinProfiles(cohort) {
    if (!cohort.basinSet?.basins?.length) return [];
    return cohort.basinSet.basins.map((basin, bi) => ({
        basin_index:            bi,
        basin_id:               basin.basin_id,
        member_count:           basin.member_count,
        centroid_band_profile:  basin.centroid_band_profile,
        centroid_energy_raw:    basin.centroid_energy_raw,
        total_duration_sec:     basin.total_duration_sec,
        radius:                 basin.radius,
        mean_distance:          basin.mean_distance,
        span:                   basin.span,
    }));
}

// ─── Core diagnostics ────────────────────────────────────────────────────────

/**
 * For a pair of cohorts at a given scale, produce the full basin-facing
 * diagnostic row, using calibrated spectral comparison.
 *
 * Returns:
 *   { per_scale_row, within_cohort_rows }
 *
 * per_scale_row: between-cohort basin comparison (centroid A vs centroid B)
 * within_cohort_rows: per-cohort basin structure (splitting within one cohort)
 */
function diagnoseBasinAtScale(cohortA, cohortB, scale_N, pairLabel) {
    const df           = FS_RAW / scale_N;
    const bandEdges    = cohortA.band_edges;

    const basinsA      = extractBasinProfiles(cohortA);
    const basinsB      = extractBasinProfiles(cohortB);
    const nBasinsA     = basinsA.length;
    const nBasinsB     = basinsB.length;

    const base = {
        trace_family:           "raw_amplitude",
        pair:                   pairLabel,
        stage:                  "post_basin",
        scale_N,
        bin_width_hz:           df,
        basin_count_a:          nBasinsA,
        basin_count_b:          nBasinsB,
        source_trace_identity:  cohortA.source_trace_identity,
        parent_source_identity: cohortA.parent_source_identity,
    };

    // ── Between-cohort: primary centroid vs primary centroid ──────────────────
    let betweenRow;
    if (!nBasinsA || !nBasinsB) {
        betweenRow = {
            ...base,
            row_type: "between_cohort",
            metric: "centroid_distance",
            raw_band_distance:        null,
            normalized_band_distance: null,
            raw_value:                null,
            classification_calibrated_bw: "insufficient_basins",
            classification_global_uncal:  "insufficient_basins",
            interpretation: `insufficient basins at scale_N=${scale_N} — window support may be too short`,
            next_action: "extend signal duration or reduce basin min_member_count",
        };
    } else {
        // Use primary (index 0) centroid for cross-cohort comparison
        const cpA = basinsA[0].centroid_band_profile;
        const cpB = basinsB[0].centroid_band_profile;
        const rawDist = l1(cpA, cpB);
        const cal  = classifyCalibrated(rawDist, scale_N);

        betweenRow = {
            ...base,
            row_type: "between_cohort",
            metric: "centroid_distance",
            ...cal,
            raw_value: cal.raw_band_distance,
            classification: cal.classification_calibrated_bw,
            interpretation: interpretBetween(cal.classification_calibrated_bw, cal.calibration_changed_result, pairLabel, scale_N),
            next_action: nextActionBetween(cal.classification_calibrated_bw, cal.calibration_changed_result),
        };
    }

    // ── Absolute energy channel (between-cohort) ──────────────────────────────
    const sA = cohortA.raw_energy_stats, sB = cohortB.raw_energy_stats;
    const maxE = Math.max(sA.mean_energy, sB.mean_energy);
    const minE = Math.min(sA.mean_energy, sB.mean_energy);
    const energyRatio = maxE > 0 && minE > 0 ? maxE / minE : null;
    const energyRow = {
        ...base,
        row_type: "between_cohort",
        metric: "absolute_energy_ratio",
        raw_band_distance: null,          // not a spectral metric
        normalized_band_distance: null,
        raw_value: energyRatio != null ? parseFloat(energyRatio.toFixed(6)) : null,
        classification: classifyAbsoluteEnergy(energyRatio),
        extra: { mean_energy_a: sA.mean_energy, mean_energy_b: sB.mean_energy },
        interpretation: interpretEnergy(classifyAbsoluteEnergy(energyRatio), pairLabel, scale_N),
        next_action: nextActionEnergy(classifyAbsoluteEnergy(energyRatio)),
    };

    // ── Within-cohort: basin splitting diagnostic ─────────────────────────────
    const withinRows = [];
    for (const [label, cohort, basins] of [
        [cohortA.spec.label, cohortA, basinsA],
        [cohortB.spec.label, cohortB, basinsB],
    ]) {
        if (basins.length <= 1) {
            withinRows.push({
                trace_family: "raw_amplitude",
                pair: pairLabel,
                stage: "within_cohort",
                scale_N,
                bin_width_hz: df,
                row_type: "within_cohort_basin_structure",
                cohort_label: label,
                basin_count: basins.length,
                splitting_observed: false,
                raw_band_distance: null,
                normalized_band_distance: null,
                interpretation: `single basin at scale_N=${scale_N} — no internal splitting`,
                next_action: "basin structure is consolidated at this scale",
            });
            continue;
        }

        // Multiple basins: measure intra-cohort basin distance
        // Primary vs secondary centroid — minimum inter-basin distance
        const interBasinDists = [];
        for (let i = 0; i < basins.length; i++) {
            for (let j = i + 1; j < basins.length; j++) {
                interBasinDists.push({
                    basin_i: i, basin_j: j,
                    dist: l1(basins[i].centroid_band_profile, basins[j].centroid_band_profile),
                });
            }
        }
        const minInterDist = Math.min(...interBasinDists.map(d => d.dist));
        const calIntra = classifyCalibrated(minInterDist, scale_N);

        // Splitting classification
        const splittingType = classifySplitting(calIntra.classification_calibrated_bw, calIntra.calibration_changed_result);

        withinRows.push({
            trace_family: "raw_amplitude",
            pair: pairLabel,
            stage: "within_cohort",
            scale_N,
            bin_width_hz: df,
            row_type: "within_cohort_basin_structure",
            cohort_label: label,
            basin_count: basins.length,
            splitting_observed: true,
            min_inter_basin_dist: calIntra.raw_band_distance,
            ...calIntra,
            splitting_type: splittingType,
            interpretation: interpretSplitting(splittingType, label, scale_N, basins.length),
            next_action: nextActionSplitting(splittingType),
        });
    }

    return { betweenRow, energyRow, withinRows };
}

// ─── Interpretation helpers ───────────────────────────────────────────────────

function classifySplitting(calibratedClass, calibrationChangedResult) {
    if (calibratedClass === "separated") {
        return calibrationChangedResult
            ? "threshold_artifact_resolved"   // splitting disappears after calibration
            : "lawful_fragmentation";          // splitting persists even after calibration
    }
    if (calibratedClass === "similar") {
        return "support_horizon_collapse";     // basins are close together — likely scale noise
    }
    return "borderline_fragmentation";
}

function interpretBetween(cl, calibrationChanged, pair, scale_N) {
    const note = calibrationChanged
        ? ` [calibration changed result vs global threshold at N=${scale_N}]`
        : ` [consistent with global threshold at N=${scale_N}]`;
    if (cl === "separated") return `basin grouping persists under calibrated comparison — pair ${pair} structurally distinct${note}`;
    if (cl === "similar")   return `basin groupings overlap under calibrated comparison — pair ${pair} structurally similar${note}`;
    return `marginal separation after calibration — pair ${pair} at scale boundary${note}`;
}

function nextActionBetween(cl, calibrationChanged) {
    if (cl === "separated" && calibrationChanged)  return "earlier borderline was threshold artifact — identity confirmed after calibration";
    if (cl === "separated")                        return "basin separation is robust to calibration — proceed to cross-scale summary";
    if (cl === "similar" && calibrationChanged)    return "calibration did not help — identity absent at this stage/scale";
    if (cl === "similar")                          return "basin groupings overlap — expected for same-frequency-structure pair";
    return "inspect raw and normalized distances; consider per-scale threshold cross-check";
}

function interpretEnergy(cl, pair, scale_N) {
    if (cl === "separated") return `energy channel clearly separated at scale_N=${scale_N} — amplitude identity present in pair ${pair}`;
    if (cl === "similar")   return `energy channel similar at scale_N=${scale_N} — pair ${pair} shares amplitude level`;
    return `marginal energy difference — pair ${pair} near energy threshold`;
}

function nextActionEnergy(cl) {
    if (cl === "separated") return "energy channel is scale-invariant and separable — use as anchor";
    if (cl === "similar")   return "energy channel confirms same-amplitude pairs — expected behavior";
    return "check signal generation — marginal energy difference may be noise";
}

function interpretSplitting(splittingType, cohortLabel, scale_N, nBasins) {
    switch (splittingType) {
        case "lawful_fragmentation":
            return `${cohortLabel} splits into ${nBasins} basins at scale_N=${scale_N} — inter-basin distance remains separated after calibration; splitting is a genuine support-horizon effect`;
        case "threshold_artifact_resolved":
            return `${cohortLabel} splits into ${nBasins} basins at scale_N=${scale_N} — but inter-basin distance collapses after calibration; splitting was a threshold artifact`;
        case "support_horizon_collapse":
            return `${cohortLabel} splits into ${nBasins} basins at scale_N=${scale_N} — inter-basin distance is similar after calibration; likely scale noise at this window support`;
        case "borderline_fragmentation":
            return `${cohortLabel} splits into ${nBasins} basins at scale_N=${scale_N} — inter-basin distance is borderline; indeterminate fragmentation`;
        default:
            return `${cohortLabel} splits into ${nBasins} basins at scale_N=${scale_N}`;
    }
}

function nextActionSplitting(splittingType) {
    switch (splittingType) {
        case "lawful_fragmentation":
            return "basin splitting is scale-conditioned but lawful — the support horizon exposes real structural variation within the cohort";
        case "threshold_artifact_resolved":
            return "splitting disappears after calibration — earlier fragmentation was measurement artifact; consolidate basin representation";
        case "support_horizon_collapse":
            return "splitting is likely noise at this scale — try larger N or verify signal stationarity";
        case "borderline_fragmentation":
            return "inspect inter-basin distance at adjacent scales to determine stability";
        default:
            return "inspect raw_band_distance and normalized_band_distance against calibrated threshold";
    }
}

// ─── Cross-scale basin summary ────────────────────────────────────────────────
// For each pair, summarize basin behavior across all scales.

function buildBasinCrossScaleSummary(pairLabel, allBetweenRows, allWithinRows) {
    const betweenByScale  = {};
    const withinByScale   = {};
    const energyByScale   = {};

    for (const row of allBetweenRows) {
        if (row.metric === "centroid_distance") betweenByScale[row.scale_N] = row;
        if (row.metric === "absolute_energy_ratio") energyByScale[row.scale_N] = row;
    }
    for (const row of allWithinRows) {
        if (!withinByScale[row.scale_N]) withinByScale[row.scale_N] = [];
        withinByScale[row.scale_N].push(row);
    }

    // Between-cohort spectral: how many scales separated after calibration?
    const betweenScales = SCALE_SET.filter(N => betweenByScale[N]);
    const nSepCalibrated  = betweenScales.filter(N =>
        betweenByScale[N]?.classification_calibrated_bw === "separated").length;
    const nSepGlobal      = betweenScales.filter(N =>
        ["separated"].includes(betweenByScale[N]?.classification_global_uncal)).length;
    const calibrationGain = nSepCalibrated - nSepGlobal;

    // Was any global-threshold borderline/similar resolved to separated by calibration?
    const artifactsResolved = betweenScales.filter(N =>
        betweenByScale[N]?.calibration_changed_result === true);

    // Energy: consistent across scales?
    const energyClassifs = SCALE_SET.map(N => energyByScale[N]?.classification).filter(Boolean);
    const energyConsistent = new Set(energyClassifs).size <= 1;
    const energySeparated  = energyClassifs[0] === "separated";

    // Within-cohort splitting
    const splittingByScale = {};
    for (const N of SCALE_SET) {
        const rows = withinByScale[N] ?? [];
        const splitRows = rows.filter(r => r.splitting_observed);
        splittingByScale[N] = {
            any_splitting:    splitRows.length > 0,
            splitting_types:  splitRows.map(r => ({ cohort: r.cohort_label, type: r.splitting_type })),
        };
    }
    const scalesWithSplitting = SCALE_SET.filter(N => splittingByScale[N]?.any_splitting);

    // Overall basin identity verdict
    const verdict = computeBasinVerdict(nSepCalibrated, betweenScales.length, scalesWithSplitting,
        calibrationGain, GROUND_TRUTH[pairLabel]);

    return {
        row_type: "basin_cross_scale_summary",
        pair: pairLabel,
        ground_truth_expected: GROUND_TRUTH[pairLabel],
        between_cohort: {
            scales_evaluated:         betweenScales,
            n_separated_global:       nSepGlobal,
            n_separated_calibrated:   nSepCalibrated,
            calibration_gain_scales:  calibrationGain,
            artifacts_resolved_at:    artifactsResolved,
            consistency_ratio_calibrated: betweenScales.length > 0 ? nSepCalibrated / betweenScales.length : null,
        },
        energy_channel: {
            consistent_across_scale: energyConsistent,
            classification:          energyClassifs[0] ?? "unknown",
            scale_invariant:         energyConsistent && energyClassifs.length === SCALE_SET.length,
        },
        within_cohort_splitting: {
            scales_with_splitting:   scalesWithSplitting,
            splitting_detail:        scalesWithSplitting.map(N => ({
                scale_N: N,
                cohorts: splittingByScale[N].splitting_types,
            })),
        },
        basin_verdict:   verdict.verdict,
        interpretation:  verdict.interpretation,
        next_action:     verdict.next_action,
    };
}

function computeBasinVerdict(nSepCalibrated, nTotal, scalesWithSplitting, calibrationGain, expected) {
    if (nTotal === 0) return { verdict: "insufficient_data",
        interpretation: "no basin rows available for this pair",
        next_action: "check pipeline run" };

    const sepRatio = nSepCalibrated / nTotal;

    if (expected === "similar") {
        if (sepRatio === 0) return {
            verdict: "correctly_similar",
            interpretation: "basin groupings overlap under calibrated comparison — as expected for same-structure pair",
            next_action: "no action needed — basin behavior matches ground truth" };
        return {
            verdict: "unexpected_separation",
            interpretation: `basin appears separated at ${nSepCalibrated}/${nTotal} scales despite expected similarity`,
            next_action: "inspect signal generation — unexpected basin separation suggests signal anomaly" };
    }

    // Expected separated
    if (sepRatio === 1.0 && scalesWithSplitting.length === 0) return {
        verdict: "robust_separation",
        interpretation: "basin grouping persists under calibrated comparison at all scales — no splitting observed",
        next_action: "identity channel is confirmed and scale-stable" };

    if (sepRatio === 1.0 && scalesWithSplitting.length > 0) return {
        verdict: "separated_with_within_cohort_splitting",
        interpretation: `between-cohort separation holds at all scales; within-cohort splitting at N=${scalesWithSplitting.join(",")} suggests support-horizon fragmentation inside one or both cohorts`,
        next_action: calibrationGain > 0
            ? `splitting ${calibrationGain > 0 ? "partially" : "not"} resolved by calibration — residual splitting is a genuine scale-horizon effect`
            : "splitting persists under calibration — lawful fragmentation at this window support" };

    if (sepRatio >= 0.5 && calibrationGain > 0) return {
        verdict: "calibration_resolved_fragmentation",
        interpretation: `calibration resolved ${calibrationGain} scale(s) from borderline/similar to separated — earlier fragmentation was partially threshold artifact`,
        next_action: "adopt calibrated comparison; residual non-separation is scale-conditioned" };

    if (sepRatio >= 0.5) return {
        verdict: "mostly_separated",
        interpretation: `basin separation holds at ${nSepCalibrated}/${nTotal} scales — mostly separated but scale-sensitive`,
        next_action: "check which scales fail and whether they correspond to support-horizon collapse" };

    return {
        verdict: "fragmented_or_collapsed",
        interpretation: `basin separation holds at only ${nSepCalibrated}/${nTotal} scales — significant fragmentation or collapse`,
        next_action: "diagnose whether failure is scale-specific or systematic" };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Basin Identity Diagnostics — Calibrated Spectral Comparison");
    console.log(`  output dir    : ${OUTPUT_DIR}`);
    console.log(`  scale_set     : [${SCALE_SET.join(", ")}] @ ${FS_RAW} Hz`);
    console.log(`  bw_threshold  : ${BW_NORM_THRESHOLD} (bin-width normalized)`);
    console.log(`  global_thresh : ${GLOBAL_RAW_THRESHOLD} (uncalibrated, comparison only)`);
    console.log();

    // ── Run pipeline at all scales ────────────────────────────────────────────
    console.log("Running pipeline...");
    const cohortsByScale = {};
    for (const scale_N of SCALE_SET) {
        cohortsByScale[scale_N] = {};
        for (const [key, spec] of Object.entries(COHORT_SPECS)) {
            cohortsByScale[scale_N][key] = runPipelineAtScale(spec, scale_N);
        }
        process.stdout.write(`  N=${String(scale_N).padStart(2)} done  `);
        for (const key of Object.keys(COHORT_SPECS)) {
            const c = cohortsByScale[scale_N][key];
            process.stdout.write(`${key.substring(0,4)}:basins=${c.basinSet?.basins?.length ?? 0}  `);
        }
        console.log();
    }

    // ── Collect all basin diagnostic rows ─────────────────────────────────────
    const allBetweenRows = [];
    const allWithinRows  = [];

    for (const pair of PAIR_PLAN) {
        for (const scale_N of SCALE_SET) {
            const cA = cohortsByScale[scale_N][pair.a];
            const cB = cohortsByScale[scale_N][pair.b];
            const { betweenRow, energyRow, withinRows } = diagnoseBasinAtScale(cA, cB, scale_N, pair.label);
            allBetweenRows.push(betweenRow, energyRow);
            allWithinRows.push(...withinRows);
        }
    }

    // ── Build cross-scale summaries ────────────────────────────────────────────
    const summaryRows = PAIR_PLAN.map(pair => {
        const between = allBetweenRows.filter(r => r.pair === pair.label);
        const within  = allWithinRows.filter(r => r.pair === pair.label);
        return buildBasinCrossScaleSummary(pair.label, between, within);
    });

    // ── Console output ────────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(100));
    console.log("BASIN IDENTITY DIAGNOSTICS — CALIBRATED SPECTRAL COMPARISON");
    console.log("═".repeat(100));

    // Per-scale between-cohort spectral rows
    console.log("\nBetween-cohort centroid distance (band_profile_distance @ post_basin):");
    console.log(`${"pair".padEnd(48)} ${"N".padStart(3)} ${"raw".padStart(10)} ${"norm".padStart(10)} ${"global".padStart(9)} ${"calibrated".padStart(11)} ${"changed?".padStart(9)}`);
    console.log("─".repeat(100));
    for (const pair of PAIR_PLAN) {
        for (const scale_N of SCALE_SET) {
            const row = allBetweenRows.find(r => r.pair === pair.label && r.scale_N === scale_N && r.metric === "centroid_distance");
            if (!row) continue;
            const changed = row.calibration_changed_result ? "  ← changed" : "";
            console.log(
                `${pair.label.padEnd(48)} ${String(scale_N).padStart(3)} ` +
                `${String(row.raw_band_distance?.toFixed(5) ?? "—").padStart(10)} ` +
                `${String(row.normalized_band_distance?.toFixed(5) ?? "—").padStart(10)} ` +
                `${String(row.classification_global_uncal ?? "—").padStart(9)} ` +
                `${String(row.classification_calibrated_bw ?? "—").padStart(11)}${changed}`
            );
        }
        console.log();
    }

    // Within-cohort splitting
    console.log("\nWithin-cohort basin splitting:");
    const splitRows = allWithinRows.filter(r => r.splitting_observed);
    if (!splitRows.length) {
        console.log("  None observed.");
    } else {
        for (const r of splitRows) {
            console.log(`  N=${String(r.scale_N).padStart(2)} ${r.cohort_label.padEnd(24)} basins=${r.basin_count}  inter_dist_raw=${r.raw_band_distance?.toFixed(5)}  norm=${r.normalized_band_distance?.toFixed(5)}  type=${r.splitting_type}`);
        }
    }

    // Cross-scale verdicts
    console.log("\n" + "─".repeat(100));
    console.log("Cross-scale basin verdicts:");
    for (const s of summaryRows) {
        const tick = s.basin_verdict === "correctly_similar" || s.basin_verdict === "robust_separation" || s.basin_verdict === "separated_with_within_cohort_splitting" || s.basin_verdict === "calibration_resolved_fragmentation" ? "✓" : "⚠";
        console.log(`\n  ${tick} [exp:${s.ground_truth_expected.padEnd(9)}] ${s.pair}`);
        console.log(`    verdict      : ${s.basin_verdict}`);
        console.log(`    sep_global   : ${s.between_cohort.n_separated_global}/${s.between_cohort.scales_evaluated.length}   sep_calibrated: ${s.between_cohort.n_separated_calibrated}/${s.between_cohort.scales_evaluated.length}   calibration_gain=${s.between_cohort.calibration_gain_scales}`);
        console.log(`    energy_ch    : ${s.energy_channel.classification}  scale_invariant=${s.energy_channel.scale_invariant}`);
        console.log(`    splitting    : ${s.within_cohort_splitting.scales_with_splitting.length ? `at N=${s.within_cohort_splitting.scales_with_splitting.join(",")}` : "none"}`);
        console.log(`    ${s.interpretation}`);
    }

    // Five diagnostic questions
    console.log("\n" + "═".repeat(100));
    console.log("DIAGNOSTIC QUESTIONS ANSWERED");
    console.log("─".repeat(100));

    const freqShiftSummary = summaryRows.find(s => s.pair === "baseline_frequency vs frequency_shift");
    const ampSummary       = summaryRows.find(s => s.pair === "baseline_amplitude vs amplitude_shift");

    console.log(`\n  Q1. Does basin splitting still appear after calibrated spectral comparison?`);
    const splitAtN32 = splitRows.filter(r => r.scale_N === 32);
    const splitAfterCalib = splitRows.filter(r => r.splitting_type === "lawful_fragmentation");
    console.log(`      Splitting at N=32: ${splitAtN32.length > 0 ? "YES" : "NO"}`);
    console.log(`      Lawful fragmentation (persists after calibration): ${splitAfterCalib.length > 0 ? splitAfterCalib.map(r => `${r.cohort_label}@N${r.scale_N}`).join(", ") : "none"}`);

    console.log(`\n  Q2. If splitting remains, what type?`);
    for (const r of splitRows) {
        console.log(`      ${r.cohort_label} @ N=${r.scale_N}: ${r.splitting_type}`);
    }

    console.log(`\n  Q3. If splitting disappears, was it threshold artifact?`);
    const artifactRows = splitRows.filter(r => r.splitting_type === "threshold_artifact_resolved");
    console.log(`      Threshold artifacts resolved: ${artifactRows.length}`);
    const betweenArtifacts = allBetweenRows.filter(r => r.calibration_changed_result === true && r.metric === "centroid_distance");
    console.log(`      Between-cohort artifacts resolved: ${betweenArtifacts.length} cases — ${betweenArtifacts.map(r => `${r.pair}@N${r.scale_N}`).join(", ") || "none"}`);

    console.log(`\n  Q4. Does energy channel remain separate from spectral channel?`);
    for (const s of summaryRows) {
        const specClass = allBetweenRows.find(r => r.pair === s.pair && r.metric === "centroid_distance" && r.scale_N === 16)?.classification_calibrated_bw ?? "—";
        const eneClass  = s.energy_channel.classification;
        const independent = specClass !== eneClass || (specClass === "similar" && eneClass === "similar");
        console.log(`      ${s.pair.padEnd(48)} spectral=${specClass}  energy=${eneClass}  ${independent ? "channels informative" : "channels agree"}`);
    }

    console.log(`\n  Q5. Under calibrated comparison, where do basin boundaries form?`);
    for (const s of summaryRows) {
        if (s.ground_truth_expected === "separated") {
            const separatedAt = SCALE_SET.filter(N =>
                allBetweenRows.find(r => r.pair === s.pair && r.scale_N === N && r.metric === "centroid_distance")
                    ?.classification_calibrated_bw === "separated"
            );
            console.log(`      ${s.pair.padEnd(48)} basin boundary present at N=${separatedAt.join(",")}`);
        } else {
            console.log(`      ${s.pair.padEnd(48)} no basin boundary expected (same structure)`);
        }
    }

    // ── Write outputs ─────────────────────────────────────────────────────────
    const report = {
        probe_type:    "basin_identity_diagnostics_calibrated",
        probe_version: "0.1.0",
        generated_from:
            "Door One basin identity diagnostic under calibrated spectral comparison — read-side only, no canon",
        generated_at:  new Date().toISOString(),
        probe_config: {
            scale_set:              SCALE_SET,
            cohorts:                Object.keys(COHORT_SPECS),
            pairs:                  PAIR_PLAN.map(p => p.label),
            spectral_calibration: {
                method:             "bin_width_normalization",
                bw_norm_threshold:  BW_NORM_THRESHOLD,
                per_scale_thresholds: PER_SCALE_THRESHOLDS,
                global_uncal_threshold: GLOBAL_RAW_THRESHOLD,
                note: "bin-width normalization is the primary calibration posture; per-scale thresholds cross-verify; global threshold retained for comparison only",
            },
        },
        disclaimers: {
            not_canon:                       true,
            not_truth:                       true,
            not_promotion:                   true,
            probe_is_read_side_only:         true,
            basins_are_proto_basins:         true,
            no_ontological_basin_claims:     true,
            channels_remain_separate:        true,
        },
        between_cohort_rows:   allBetweenRows,
        within_cohort_rows:    allWithinRows,
        cross_scale_summaries: summaryRows,
    };

    const reportPath = `${OUTPUT_DIR}/basin_diagnostics_calibrated_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. No pipeline state was mutated by this probe.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
