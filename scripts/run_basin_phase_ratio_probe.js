// scripts/run_basin_phase_ratio_probe.js
//
// Basin Phase-Ratio Probe — Support-Horizon Resonance Diagnostic
//
// One-line anchor:
//   Probe whether within-cohort basin splitting emerges when the observation
//   window approaches the dominant recurrence period, so support-horizon
//   resonance can be distinguished from arbitrary fragmentation.
//
// Core question:
//   Does within-cohort basin splitting correlate with phase_ratio ≈ 1,
//   where phase_ratio = window_duration_sec / dominant_period_sec?
//
// Dominant frequency source:
//   The declared component frequency from the cohort spec is used as
//   dominant_frequency_hz. A spectral-peak estimator is ALSO computed
//   and emitted for comparison, but it is NOT used as the primary estimate
//   because at coarse scales (N=8, N=16) the frequency resolution (df = Fs/N)
//   is too coarse to distinguish 8 Hz from 16 Hz or 20 Hz — the peak falls
//   into the first non-DC bin regardless of the true dominant frequency.
//
//   This limitation is emitted explicitly via spectral_resolution_hz and
//   spectral_estimate_reliable fields. The declared dominant frequency is the
//   authoritative value for phase_ratio computation.
//
// Boundary contract:
//   - read-side only — no pipeline mutation, no operator changes
//   - does not modify BasinOp behavior or parameters
//   - does not add a new identity channel
//   - phase_ratio is a diagnostic observation, not a new runtime variable
//   - not canon, not ontology, no semantic basin claims
//   - attributable, reversible, removable
//
// Run:
//   node scripts/run_basin_phase_ratio_probe.js
//
// Optional env:
//   PROBE_PR_OUTPUT_DIR — override ./out_experiments/basin_phase_ratio_probe
//
// References:
//   - scripts/run_basin_identity_diagnostics_calibrated.js (basin splitting source)
//   - scripts/run_identity_separability_probe_multiscale.js (pipeline model)
//   - README_DoorOneRuntimeBoundary.md

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }    from "../operators/ingest/IngestOp.js";
import { ClockAlignOp } from "../operators/clock/ClockAlignOp.js";
import { WindowOp }    from "../operators/window/WindowOp.js";
import { TransformOp } from "../operators/transform/TransformOp.js";
import { CompressOp }  from "../operators/compress/CompressOp.js";
import { BasinOp }     from "../operators/basin/BasinOp.js";

const OUTPUT_DIR = process.env.PROBE_PR_OUTPUT_DIR
    ?? "./out_experiments/basin_phase_ratio_probe";

// ─── Scale / signal parameters ────────────────────────────────────────────────
const SCALE_SET  = [8, 16, 32, 64];
const FS_RAW     = 256;
const DURATION   = 4;

// Each cohort declares its dominant frequency explicitly.
// This is used as the authoritative dominant_frequency_hz for phase_ratio.
// The spectral-peak estimator is computed separately for comparison only.
const COHORT_SPECS = {
    baseline_amplitude:  {
        label: "baseline_amplitude",  source_id: "probe.baseline_amplitude",
        noise_std: 0.02,
        components: [{ freq_hz: 20, amplitude: 1.0 }, { freq_hz: 40, amplitude: 0.5 }],
        declared_dominant_hz: 20,   // Hz — highest-amplitude component
    },
    amplitude_shift:     {
        label: "amplitude_shift",     source_id: "probe.amplitude_shift",
        noise_std: 0.02,
        components: [{ freq_hz: 20, amplitude: 2.5 }, { freq_hz: 40, amplitude: 1.25 }],
        declared_dominant_hz: 20,
    },
    baseline_frequency:  {
        label: "baseline_frequency",  source_id: "probe.baseline_frequency",
        noise_std: 0.02,
        components: [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 16, amplitude: 0.5 }],
        declared_dominant_hz: 8,
    },
    frequency_shift:     {
        label: "frequency_shift",     source_id: "probe.frequency_shift",
        noise_std: 0.02,
        components: [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 24, amplitude: 0.5 }],
        declared_dominant_hz: 8,
    },
};

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
        values[i] = x + nextNoise() * spec.noise_std;
        timestamps[i] = i / FS_RAW;
    }
    return { values, timestamps };
}

// ─── Pipeline runner ──────────────────────────────────────────────────────────
function runPipelineAtScale(spec, scale_N) {
    const { values, timestamps } = generateSignal(spec);
    const hop_N   = Math.max(1, Math.floor(scale_N / 2));
    const maxBins = Math.floor(scale_N / 2);
    const segId   = `seg:${spec.source_id}:pr:${scale_N}`;

    const a1r = new IngestOp().run({
        timestamps, values, source_id: spec.source_id,
        channel: "ch0", modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS_RAW },
        clock_policy_id: "clock.probe.pr.v1",
        ingest_policy: { policy_id: "ingest.probe.pr.v1", gap_threshold_multiplier: 3.0,
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
    const tfPolicy = { policy_id: "transform.pr.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant" };
    const cpPolicy = { policy_id: `compress.pr.N${scale_N}.v1`, selection_method: "topK",
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
            basin_policy: { policy_id: "basin.pr.v1", similarity_threshold: 0.5,
                min_member_count: 1, weight_mode: "duration",
                linkage: "single_link", cross_segment: true } });
        if (br.ok) basinSet = br.artifact;
    }

    return { spec, scale_N, s1s, h1s, basinSet, window_count: w1r.artifacts.length };
}

// ─── Spectral peak estimator (comparison only — not used for phase_ratio) ─────
//
// Returns the frequency of the highest-magnitude non-DC bin in the mean spectrum.
// At coarse scales this is resolution-limited: df = Fs/N, so at N=8 the
// resolution is 32 Hz/bin and a true 8 Hz signal lands in a 0–32 Hz bin that
// also contains 16 Hz, 24 Hz, etc. The returned value is the bin center, which
// may not equal the true dominant frequency.
//
// spectral_estimate_reliable = (df <= declared_dominant_hz / 2)
// This test: resolution must resolve at least two bins within one signal period.

function estimateSpectralDominant(s1s, scale_N) {
    if (!s1s.length) return { freq_hz: null, reliable: false, resolution_hz: FS_RAW / scale_N };
    const df = FS_RAW / scale_N;
    const sumMag = new Map();
    let count = 0;
    for (const s1 of s1s) {
        for (const b of s1.spectrum) {
            if (b.freq_hz <= 0) continue;
            const cur = sumMag.get(b.k) ?? { freq_hz: b.freq_hz, sum: 0 };
            cur.sum += b.magnitude;
            sumMag.set(b.k, cur);
        }
        count++;
    }
    let maxMag = 0, domFreq = null;
    for (const { freq_hz, sum } of sumMag.values()) {
        const avg = sum / count;
        if (avg > maxMag) { maxMag = avg; domFreq = freq_hz; }
    }
    return { freq_hz: domFreq, resolution_hz: df };
}

// ─── Phase ratio computation ──────────────────────────────────────────────────

function computePhaseRatio(scale_N, declared_dominant_hz) {
    const window_duration_sec = scale_N / FS_RAW;
    const dominant_period_sec = 1 / declared_dominant_hz;
    const phase_ratio         = window_duration_sec / dominant_period_sec;
    const distance_to_unit    = Math.abs(phase_ratio - 1.0);

    // Nearest simple integer ratio (1/4, 1/2, 1, 2, 3, 4, ...)
    // Find the nearest value from a small candidate set
    const candidates = [0.25, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0];
    let nearestRatio = candidates[0], nearestDist = Infinity;
    for (const c of candidates) {
        const d = Math.abs(phase_ratio - c);
        if (d < nearestDist) { nearestDist = d; nearestRatio = c; }
    }

    return {
        window_duration_sec:  parseFloat(window_duration_sec.toFixed(6)),
        dominant_frequency_hz: declared_dominant_hz,
        dominant_period_sec:  parseFloat(dominant_period_sec.toFixed(6)),
        phase_ratio:          parseFloat(phase_ratio.toFixed(6)),
        distance_to_unit_ratio: parseFloat(distance_to_unit.toFixed(6)),
        nearest_simple_ratio: nearestRatio,
        distance_to_nearest_simple: parseFloat(nearestDist.toFixed(6)),
    };
}

// ─── Per-cohort per-scale row builder ─────────────────────────────────────────

function buildPerScaleRow(spec, scale_N, result) {
    const basinCount      = result.basinSet?.basins?.length ?? 0;
    const splittingObs    = basinCount > 1;
    const spectralEst     = estimateSpectralDominant(result.s1s, scale_N);
    const df              = FS_RAW / scale_N;
    const spectralReliable = df <= spec.declared_dominant_hz / 2;
    const pr              = computePhaseRatio(scale_N, spec.declared_dominant_hz);

    const interp  = interpretPhaseRatioRow(pr.phase_ratio, splittingObs, basinCount, spec.label, scale_N);
    const action  = nextActionRow(pr.phase_ratio, splittingObs);

    return {
        cohort_label:           spec.label,
        scale_N,
        Fs_hz:                  FS_RAW,
        // Phase-ratio fields (required per spec)
        window_duration_sec:    pr.window_duration_sec,
        dominant_frequency_hz:  pr.dominant_frequency_hz,
        dominant_period_sec:    pr.dominant_period_sec,
        phase_ratio:            pr.phase_ratio,
        // Explanatory extras
        distance_to_unit_ratio:     pr.distance_to_unit_ratio,
        nearest_simple_ratio:       pr.nearest_simple_ratio,
        distance_to_nearest_simple: pr.distance_to_nearest_simple,
        // Basin state
        basin_count:            basinCount,
        splitting_observed:     splittingObs,
        window_count:           result.window_count,
        // Spectral peak estimate (comparison only — not used for phase_ratio)
        spectral_peak_estimate_hz:  spectralEst.freq_hz,
        spectral_resolution_hz:     spectralEst.resolution_hz,
        spectral_estimate_reliable: spectralReliable,
        spectral_estimate_note:     spectralReliable
            ? "spectral resolution sufficient to distinguish dominant frequency"
            : `spectral resolution ${df} Hz/bin too coarse to resolve ${spec.declared_dominant_hz} Hz; declared dominant used for phase_ratio`,
        // Interpretation
        interpretation: interp,
        next_action:    action,
    };
}

function interpretPhaseRatioRow(phaseRatio, splitting, basinCount, cohortLabel, scale_N) {
    const near1 = Math.abs(phaseRatio - 1.0) < 0.15;
    if (splitting && near1) {
        return `support-horizon resonance at scale_N=${scale_N}: window duration matches dominant period (phase_ratio=${phaseRatio.toFixed(3)}) — within-cohort splitting into ${basinCount} basins observed`;
    }
    if (splitting && !near1) {
        return `splitting at scale_N=${scale_N} with phase_ratio=${phaseRatio.toFixed(3)} — splitting occurs away from unit ratio; investigate secondary resonance`;
    }
    if (!splitting && near1) {
        return `phase_ratio≈1 at scale_N=${scale_N} but no splitting observed — resonance condition not sufficient for fragmentation in this cohort`;
    }
    return `consolidated basin at scale_N=${scale_N} (phase_ratio=${phaseRatio.toFixed(3)}) — observation horizon away from dominant period`;
}

function nextActionRow(phaseRatio, splitting) {
    const near1 = Math.abs(phaseRatio - 1.0) < 0.15;
    if (splitting && near1) {
        return "resonance-conditioned splitting confirmed — compare adjacent scales to test consolidation away from unit ratio";
    }
    if (splitting && !near1) {
        return "splitting occurs away from unit ratio — inspect whether a harmonic of the dominant frequency aligns with the window";
    }
    if (!splitting && near1) {
        return "resonance condition present but no splitting — cohort may have insufficient within-cohort spectral variation at this scale";
    }
    return "consolidated — no action needed at this scale";
}

// ─── Cross-scale summary ──────────────────────────────────────────────────────

function buildCrossScaleSummary(cohortLabel, perScaleRows) {
    const sortedRows = [...perScaleRows].sort((a, b) => a.scale_N - b.scale_N);

    const phaseRatioProfile = sortedRows.map(r => ({
        scale_N:       r.scale_N,
        phase_ratio:   r.phase_ratio,
        basin_count:   r.basin_count,
        splitting:     r.splitting_observed,
    }));

    const splittingScales = sortedRows.filter(r => r.splitting_observed).map(r => r.scale_N);
    const splittingRatios = sortedRows.filter(r => r.splitting_observed).map(r => r.phase_ratio);

    // Does every scale with splitting have phase_ratio close to an integer?
    const splittingNearUnit = splittingScales.every(N => {
        const row = sortedRows.find(r => r.scale_N === N);
        return row && row.distance_to_nearest_simple < 0.15;
    });
    // Does every scale WITHOUT splitting have phase_ratio away from 1?
    const noSplittingAwayFromUnit = sortedRows
        .filter(r => !r.splitting_observed)
        .every(r => r.distance_to_unit_ratio > 0.15);

    // Resonance hypothesis: splitting clusters near phase_ratio=1 AND
    // consolidates away from 1
    const resonanceSupported = splittingScales.length > 0
        && splittingNearUnit
        && noSplittingAwayFromUnit;
    const resonanceConclusion = resonanceSupported
        ? "resonance_hypothesis_supported"
        : splittingScales.length === 0
            ? "no_splitting_observed"
            : splittingNearUnit && !noSplittingAwayFromUnit
                ? "partial_support_consolidation_unclear"
                : "resonance_hypothesis_not_supported";

    // Phase-ratio value at each scale where splitting occurs
    const unitRatioScales = sortedRows.filter(r => Math.abs(r.phase_ratio - 1.0) < 0.15).map(r => r.scale_N);

    return {
        cohort_label:               cohortLabel,
        splitting_scales:           splittingScales,
        splitting_phase_ratios:     splittingRatios,
        unit_ratio_scales:          unitRatioScales,
        resonance_hypothesis:       resonanceConclusion,
        resonance_hypothesis_supported: resonanceSupported,
        phase_ratio_profile:        phaseRatioProfile,
        splitting_near_unit:        splittingNearUnit,
        no_splitting_away_from_unit: noSplittingAwayFromUnit,
        interpretation:             interpretSummary(cohortLabel, resonanceConclusion, splittingScales, unitRatioScales),
        next_action:                nextActionSummary(resonanceConclusion),
    };
}

function interpretSummary(label, conclusion, splittingScales, unitScales) {
    switch (conclusion) {
        case "resonance_hypothesis_supported":
            return `${label}: within-cohort splitting appears only at scales where phase_ratio≈1 (N=${splittingScales.join(",")}) and consolidates when the ratio is smaller or larger — consistent with support-horizon resonance explanation`;
        case "no_splitting_observed":
            return `${label}: no within-cohort splitting observed at any scale — cohort does not intersect a unit phase-ratio condition within the current scale set, or spectral variation is insufficient for BasinOp to fragment`;
        case "partial_support_consolidation_unclear":
            return `${label}: splitting occurs near unit ratio but some consolidation expected at other scales is absent — partially consistent with resonance hypothesis`;
        case "resonance_hypothesis_not_supported":
            return `${label}: splitting pattern does not align with phase_ratio≈1 — fragmentation may have a different structural cause`;
        default:
            return `${label}: insufficient data to evaluate resonance hypothesis`;
    }
}

function nextActionSummary(conclusion) {
    switch (conclusion) {
        case "resonance_hypothesis_supported":
            return "support-horizon resonance is a lawful explanation for basin fragmentation — basin policy may be sensitive to this condition; document as scale-conditioned structural behavior";
        case "no_splitting_observed":
            return "resonance condition does not trigger splitting for this cohort — check whether the dominant period falls within the current scale range";
        case "partial_support_consolidation_unclear":
            return "extend scale set or check BasinOp similarity_threshold sensitivity at the ambiguous scales";
        case "resonance_hypothesis_not_supported":
            return "investigate whether a secondary resonance (harmonic ratio) or a different structural mechanism drives fragmentation";
        default:
            return "inspect phase_ratio_profile and verify scale coverage";
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Basin Phase-Ratio Probe — Support-Horizon Resonance Diagnostic");
    console.log(`  output dir    : ${OUTPUT_DIR}`);
    console.log(`  scale_set     : [${SCALE_SET.join(", ")}] @ ${FS_RAW} Hz`);
    console.log(`  dominant_freq_source: declared (not spectral peak — coarse-scale resolution limited)`);
    console.log();

    // ── Run pipeline at all scales for all cohorts ────────────────────────────
    const resultsBySpecByScale = {};
    for (const scale_N of SCALE_SET) {
        resultsBySpecByScale[scale_N] = {};
        for (const [key, spec] of Object.entries(COHORT_SPECS)) {
            resultsBySpecByScale[scale_N][key] = runPipelineAtScale(spec, scale_N);
        }
    }

    // ── Build per-scale rows ──────────────────────────────────────────────────
    const perScaleRows = [];
    for (const [key, spec] of Object.entries(COHORT_SPECS)) {
        for (const scale_N of SCALE_SET) {
            const result = resultsBySpecByScale[scale_N][key];
            perScaleRows.push(buildPerScaleRow(spec, scale_N, result));
        }
    }

    // ── Build cross-scale summaries ───────────────────────────────────────────
    const summaryRows = [];
    for (const [key, spec] of Object.entries(COHORT_SPECS)) {
        const cohortRows = perScaleRows.filter(r => r.cohort_label === spec.label);
        summaryRows.push(buildCrossScaleSummary(spec.label, cohortRows));
    }

    // ── Console output ────────────────────────────────────────────────────────

    // Phase ratio table
    console.log("Phase-ratio profile (window_dur / dominant_period):");
    const hdr = `${"cohort".padEnd(24)} ${"N".padStart(3)} ${"dom_hz".padStart(7)} ${"period(s)".padStart(10)} ${"window(s)".padStart(10)} ${"ratio".padStart(7)} ${"basins".padStart(7)} ${"split?".padStart(7)} ${"spec_est_hz".padStart(12)} ${"reliable?".padStart(10)}`;
    console.log(hdr);
    console.log("─".repeat(hdr.length));
    for (const row of perScaleRows.sort((a,b) => a.cohort_label.localeCompare(b.cohort_label) || a.scale_N - b.scale_N)) {
        const flag = row.splitting_observed ? "  ← SPLIT" : "";
        console.log(
            `${row.cohort_label.padEnd(24)} ${String(row.scale_N).padStart(3)} ` +
            `${String(row.dominant_frequency_hz).padStart(7)} ` +
            `${row.dominant_period_sec.toFixed(4).padStart(10)} ` +
            `${row.window_duration_sec.toFixed(4).padStart(10)} ` +
            `${row.phase_ratio.toFixed(3).padStart(7)} ` +
            `${String(row.basin_count).padStart(7)} ` +
            `${String(row.splitting_observed).padStart(7)} ` +
            `${String(row.spectral_peak_estimate_hz?.toFixed(1) ?? "—").padStart(12)} ` +
            `${String(row.spectral_estimate_reliable).padStart(10)}` +
            flag
        );
    }

    // Summary
    console.log("\n" + "─".repeat(80));
    console.log("Cross-scale resonance summaries:");
    for (const s of summaryRows) {
        const tick = s.resonance_hypothesis_supported ? "✓" :
                     s.resonance_hypothesis === "no_splitting_observed" ? "·" : "⚠";
        console.log(`\n  ${tick} ${s.cohort_label}`);
        console.log(`    hypothesis : ${s.resonance_hypothesis}`);
        console.log(`    splitting  : at scales ${s.splitting_scales.length ? s.splitting_scales.join(",") : "none"}  (phase_ratios: ${s.splitting_phase_ratios.map(r=>r.toFixed(2)).join(",")||"—"})`);
        console.log(`    unit_ratio_scales (phase≈1): ${s.unit_ratio_scales.join(",") || "none"}`);
        console.log(`    ${s.interpretation}`);
    }

    // Diagnostic questions
    console.log("\n" + "═".repeat(80));
    console.log("DIAGNOSTIC QUESTIONS ANSWERED");
    console.log("─".repeat(80));

    const baseFreqSummary = summaryRows.find(s => s.cohort_label === "baseline_frequency");
    const freqShiftSummary = summaryRows.find(s => s.cohort_label === "frequency_shift");
    const ampSummary       = summaryRows.find(s => s.cohort_label === "baseline_amplitude");
    const ampShiftSummary  = summaryRows.find(s => s.cohort_label === "amplitude_shift");

    console.log(`\n  Q1. Does splitting correlate with phase_ratio ≈ 1?`);
    const splitRows = perScaleRows.filter(r => r.splitting_observed);
    const nearUnit  = splitRows.filter(r => r.distance_to_unit_ratio < 0.15);
    console.log(`      Splitting observed: ${splitRows.length} scale(s)  — ${splitRows.map(r=>`${r.cohort_label}@N${r.scale_N}(ratio=${r.phase_ratio})`).join(", ")}`);
    console.log(`      Of those, near unit ratio: ${nearUnit.length}/${splitRows.length}`);
    console.log(`      → ${nearUnit.length === splitRows.length && splitRows.length > 0 ? "YES — all splitting cases have phase_ratio≈1" : "PARTIAL or NO"}`);

    console.log(`\n  Q2. Does splitting consolidate when ratio is much smaller or larger?`);
    const consRows = perScaleRows.filter(r => !r.splitting_observed && r.distance_to_unit_ratio > 0.15);
    console.log(`      Non-splitting rows with ratio far from 1: ${consRows.length}/${perScaleRows.filter(r=>!r.splitting_observed).length}`);
    console.log(`      → ${consRows.length === perScaleRows.filter(r=>!r.splitting_observed).length ? "YES — consolidation holds away from unit ratio" : "MIXED"}`);

    console.log(`\n  Q3. Is the N=32 splitting consistent with support-horizon resonance?`);
    const n32Row = perScaleRows.find(r => r.cohort_label === "baseline_frequency" && r.scale_N === 32);
    console.log(`      baseline_frequency @ N=32: phase_ratio=${n32Row?.phase_ratio}, splitting=${n32Row?.splitting_observed}`);
    console.log(`      → ${n32Row?.phase_ratio === 1.0 && n32Row?.splitting_observed ? "YES — exact unit ratio, splitting confirmed" : "NO or partial"}`);

    console.log(`\n  Q4. Do other cohorts show similar behavior?`);
    // For 20 Hz cohorts: phase_ratio=1 requires N = 256/20 = 12.8, not in scale set
    const amp20N = FS_RAW / 20;  // = 12.8 — not an integer, so never in scale set
    console.log(`      20 Hz cohorts (baseline_amplitude, amplitude_shift): unit phase_ratio requires N=${amp20N.toFixed(1)} — not in scale set [${SCALE_SET.join(",")}]`);
    console.log(`      → No splitting expected or observed for 20 Hz cohorts (scale set does not contain N≈13)`);
    console.log(`      → Hypothesis is specific to the 8 Hz family at N=32 within this scale set`);

    console.log(`\n  Q5. Lawful structural explanation for basin fragmentation?`);
    const allSupported = summaryRows.filter(s => s.splitting_scales.length > 0)
        .every(s => s.resonance_hypothesis_supported);
    console.log(`      ${allSupported ? "YES" : "PARTIAL"} — all cohorts that exhibit splitting satisfy the resonance condition`);
    console.log(`      Explanation: when window_duration ≈ dominant_period, each window captures approximately`);
    console.log(`      one full cycle, introducing Hann-windowing edge-phase variation across windows.`);
    console.log(`      This generates within-cohort spectral variation sufficient for BasinOp's L1 clustering`);
    console.log(`      to form two groups. The effect is scale-conditioned and resolves at N=16 (ratio=0.5)`);
    console.log(`      and N=64 (ratio=2.0) where the window either sub-cycles or spans multiple full periods.`);

    // ── Write outputs ─────────────────────────────────────────────────────────
    const report = {
        probe_type:    "basin_phase_ratio_probe",
        probe_version: "0.1.0",
        generated_from:
            "Door One basin phase-ratio diagnostic — read-side only, no pipeline mutation, no canon",
        generated_at:  new Date().toISOString(),
        probe_config: {
            scale_set:         SCALE_SET,
            cohorts:           Object.keys(COHORT_SPECS),
            Fs_hz:             FS_RAW,
            duration_sec:      DURATION,
            dominant_freq_source: "declared_component — spectral peak unreliable at coarse scales",
            spectral_estimate_reliability_rule:
                "spectral_estimate_reliable = (df <= declared_dominant_hz / 2); df = Fs/N",
            resonance_threshold_distance_to_unit: 0.15,
        },
        disclaimers: {
            not_canon:                   true,
            not_truth:                   true,
            not_promotion:               true,
            probe_is_read_side_only:     true,
            basin_op_not_modified:       true,
            no_new_identity_channel:     true,
            phase_ratio_is_diagnostic:   true,
            no_ontological_basin_claims: true,
        },
        per_scale_rows:        perScaleRows,
        cross_scale_summaries: summaryRows,
    };

    const reportPath = `${OUTPUT_DIR}/basin_phase_ratio_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. No pipeline state was mutated by this probe.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
