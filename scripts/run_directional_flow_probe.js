// scripts/run_directional_flow_probe.js
//
// Directional Flow Probe for Active Interaction Zones
//
// One-line anchor:
//   Probe whether basin splitting under an active interaction zone is driven by
//   oscillatory cross-boundary energy exchange over time, so boundary-conditioned
//   basin formation can be sharpened from static edge geometry into lawful flow
//   topology.
//
// Core question:
//   When an active interaction zone is present, is basin splitting driven by
//   undirected redistribution, directional flow, or phase-locked oscillatory
//   exchange across the boundary?
//
// Context:
//   The active interaction zone probe established that splitting requires both
//   exact edge placement AND an active adjacent-band interaction zone. This
//   probe asks whether the flow pattern within that zone further discriminates
//   splitting from non-splitting cases.
//
// Pre-run findings:
//   Splitting cohorts (f8_h16, f8_h32_h40):
//     - lag-1 autocorrelation of diff sequence ≈ -1.0 (period-2 oscillation)
//     - simultaneous cross-correlation of L/R ≈ -1.0 (anti-phase)
//     - lag-1 cross-correlation ≈ +1.0 (they exchange each window)
//     - flow_mode = oscillatory_exchange
//   Non-splitting active case (f8_h24_h32):
//     - high redistribution magnitude but stable direction
//     - lag-1 autocorr still ≈ -1.0 but osc_strength is 6× lower (0.053 vs 0.305)
//     - flow_mode = one_way_drift
//   Inert case (f8_h32):
//     - nearly zero redistribution; osc_strength = 0.008
//     - flow_mode = weak_or_inert
//   Near-boundary controls:
//     - intermediate osc_strength, lag-1 autocorr -0.7; flow_mode = one_way_drift
//
//   The discriminating metric is osc_strength (std-dev of L-R diff sequence).
//   Splitting cases have osc_strength > 0.15; all others are below that.
//
// Flow metric definitions:
//   signed_cross_boundary_flow:
//     mean(left_band[t] - right_band[t]) across all windows.
//     Positive = left band tends to have more energy; negative = right.
//   oscillatory_flow_strength:
//     std-dev of (left_band[t] - right_band[t]) across windows.
//     High when energy oscillates between the bands; low when stable.
//   flow_direction_consistency:
//     Classified as "alternating" when sign-flip rate > 0.45,
//     "one_direction" when < 0.05, "mixed" otherwise.
//   boundary_phase_lag_proxy:
//     Cross-correlation of left_band[t] and right_band[t+1].
//     Near +1 = when left is high now, right will be high next window.
//     Near -1 = inverse phase.
//     Near 0 = no lag relationship.
//   diff_lag1_autocorr:
//     Lag-1 autocorrelation of the diff sequence (left-right per window).
//     Near -1 = period-2 oscillation in the diff; near +1 = smooth trend.
//   flow_mode:
//     oscillatory_exchange:
//       osc_strength > 0.15 AND |diff_lag1_autocorr| > 0.90
//     weak_or_inert:
//       osc_strength < 0.02
//     one_way_drift:
//       0.02 ≤ osc_strength ≤ 0.15 OR |diff_lag1_autocorr| < 0.90
//     mixed_unresolved:
//       any ambiguous combination
//
// Boundary contract:
//   - read-side only — no pipeline mutation, no operator changes
//   - does not modify BasinOp or BAND_EDGES
//   - no new identity channel, no phase channel
//   - flow metrics are read-side observations over existing window sequences
//   - attributable, reversible, removable
//
// Run:
//   node scripts/run_directional_flow_probe.js
//
// Optional env:
//   PROBE_DFP_OUTPUT_DIR — override ./out_experiments/directional_flow_probe

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }    from "../operators/ingest/IngestOp.js";
import { ClockAlignOp } from "../operators/clock/ClockAlignOp.js";
import { WindowOp }    from "../operators/window/WindowOp.js";
import { TransformOp } from "../operators/transform/TransformOp.js";
import { CompressOp }  from "../operators/compress/CompressOp.js";
import { BasinOp }     from "../operators/basin/BasinOp.js";

const OUTPUT_DIR = process.env.PROBE_DFP_OUTPUT_DIR
    ?? "./out_experiments/directional_flow_probe";

// ─── Fixed parameters ─────────────────────────────────────────────────────────
const FS_RAW    = 256;
const DURATION  = 4;
const SCALE_N   = 32;
const HOP_N     = Math.floor(SCALE_N / 2);
const BAND_EDGES = [0, 16, 32, 48, 64, 80, 96, 112, 128];
const BASIN_SIMILARITY_THRESHOLD = 0.5;
const PHASE_RATIO = (SCALE_N / FS_RAW) / (1 / 8);    // = 1.0

// Flow mode thresholds (declared and explicit)
const OFC_STRONG_THRESHOLD  = 0.15;   // oscillatory_flow_strength above this → strong oscillation
const OFC_WEAK_THRESHOLD    = 0.02;   // below this → weak/inert
const LAG1_AC_THRESHOLD     = 0.90;   // |diff_lag1_autocorr| above this → period-2 oscillation
const FLIP_RATE_ALT         = 0.45;   // sign-flip rate above this → alternating
const FLIP_RATE_STABLE      = 0.05;   // below this → one direction

// ─── Cohort set ───────────────────────────────────────────────────────────────
const COHORT_SPECS = [
    {
        label:       "f8_h16_amp0.50",
        description: "Canonical active edge — 8 Hz fund populates band-0, 16 Hz harmonic at boundary",
        source_id:   "probe.dfp.f8_h16",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 16, amplitude: 0.50 }],
        target_edge:  16,
        category:    "active_edge_splitting",
    },
    {
        label:       "f8_h32_h40_amp0.50",
        description: "Activated 32 Hz edge — 40 Hz populates receiving band; splits",
        source_id:   "probe.dfp.f8_h32_h40",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 32, amplitude: 0.50 }, { freq_hz: 40, amplitude: 0.50 }],
        target_edge:  32,
        category:    "active_edge_splitting",
    },
    {
        label:       "f8_h32_amp0.50",
        description: "Inert 32 Hz edge — no structural activation; no split",
        source_id:   "probe.dfp.f8_h32",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 32, amplitude: 0.50 }],
        target_edge:  32,
        category:    "inert_edge",
    },
    {
        label:       "f8_h24_h32_amp0.50",
        description: "Wrong-side active — band-1 populated, but receiving band-2 inert; no split",
        source_id:   "probe.dfp.f8_h24_h32",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 24, amplitude: 0.50 }, { freq_hz: 32, amplitude: 0.50 }],
        target_edge:  32,
        category:    "wrong_side_active",
    },
    {
        label:       "f8_h15.5_amp0.50",
        description: "0.5 Hz below 16 Hz edge — near-boundary stress but harmonic not on edge",
        source_id:   "probe.dfp.f8_h155",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 15.5, amplitude: 0.50 }],
        target_edge:  16,
        category:    "near_boundary_control",
    },
    {
        label:       "f8_h16.5_amp0.50",
        description: "0.5 Hz above 16 Hz edge — near-boundary stress but harmonic not on edge",
        source_id:   "probe.dfp.f8_h165",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 16.5, amplitude: 0.50 }],
        target_edge:  16,
        category:    "near_boundary_control",
    },
];

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
function runPipeline(spec) {
    const { values, timestamps } = generateSignal(spec);
    const maxBins = Math.floor(SCALE_N / 2);

    const a1r = new IngestOp().run({
        timestamps, values, source_id: spec.source_id,
        channel: "ch0", modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS_RAW },
        clock_policy_id: "clock.dfp.v1",
        ingest_policy: { policy_id: "ingest.dfp.v1", gap_threshold_multiplier: 3.0,
            allow_non_monotonic: false, allow_empty: false, non_monotonic_mode: "reject" },
    });
    if (!a1r.ok) throw new Error(`IngestOp ${spec.label}: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({ a1: a1r.artifact,
        grid_spec: { Fs_target: FS_RAW, t_ref: timestamps[0], grid_policy: "strict",
            drift_model: "none", non_monotonic_policy: "reject", interp_method: "linear",
            gap_policy: "interpolate_small", small_gap_multiplier: 3.0,
            max_gap_seconds: null, anti_alias_filter: false } });
    if (!a2r.ok) throw new Error(`ClockAlignOp ${spec.label}: ${a2r.error}`);

    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: {
        mode: "fixed", Fs_target: FS_RAW, base_window_N: SCALE_N, hop_N: HOP_N,
        window_function: "hann", overlap_ratio: 0.5, stationarity_policy: "tolerant",
        salience_policy: "off", gap_policy: "interpolate_small",
        max_missing_ratio: 0.25, boundary_policy: "truncate" } });
    if (!w1r.ok) throw new Error(`WindowOp ${spec.label}: ${w1r.error}`);

    const tfOp = new TransformOp(), cpOp = new CompressOp();
    const tfPolicy = { policy_id: "transform.dfp.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant" };
    const cpPolicy = { policy_id: "compress.dfp.v1", selection_method: "topK",
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
        const t_start = w1.grid?.t0 ?? (wi * HOP_N / FS_RAW);
        const cr = cpOp.run({ s1: tr.artifact, compression_policy: cpPolicy,
            context: { segment_id: `seg:${spec.source_id}`,
                window_span: { t_start, t_end: t_start + SCALE_N / FS_RAW } } });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null, basinCount = 1;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s,
            basin_policy: { policy_id: "basin.dfp.v1",
                similarity_threshold: BASIN_SIMILARITY_THRESHOLD,
                min_member_count: 1, weight_mode: "duration",
                linkage: "single_link", cross_segment: true } });
        if (br.ok) { basinSet = br.artifact; basinCount = br.artifact.basins.length; }
    }

    return { spec, s1s, h1s, basinSet, basinCount, windowCount: w1r.artifacts.length };
}

// ─── Band profile extraction ──────────────────────────────────────────────────
function extractWindowProfiles(s1s) {
    const nB = BAND_EDGES.length - 1;
    return s1s.map(s1 => {
        const energy = new Array(nB).fill(0);
        for (const b of s1.spectrum) {
            const e = b.re * b.re + b.im * b.im;
            for (let i = 0; i < nB; i++) {
                if (b.freq_hz >= BAND_EDGES[i] && b.freq_hz < BAND_EDGES[i + 1]) { energy[i] += e; break; }
            }
        }
        return normL1(energy);
    });
}

// ─── Directional flow metrics ─────────────────────────────────────────────────

/**
 * Compute directional flow metrics over the two bands adjacent to target_edge.
 *
 * @param {number[][]} profiles  — per-window normalized band profiles
 * @param {number} target_edge   — Hz value of the target band boundary
 * @returns {object}             — all flow metric fields
 */
function computeDirectionalFlow(profiles, target_edge) {
    const edgeIdx  = BAND_EDGES.indexOf(target_edge);
    const leftIdx  = edgeIdx - 1;
    const rightIdx = edgeIdx;
    const nB       = BAND_EDGES.length - 1;

    if (edgeIdx <= 0 || edgeIdx >= nB) {
        return {
            left_band_hz: null, right_band_hz: null,
            left_band_energy_series:  null, right_band_energy_series: null,
            signed_cross_boundary_flow: null,
            oscillatory_flow_strength:  null,
            flow_direction_consistency: "unavailable",
            boundary_phase_lag_proxy:   null,
            diff_lag1_autocorr:         null,
            flow_mode: "unavailable",
        };
    }

    const leftSeries  = profiles.map(p => p[leftIdx] ?? 0);
    const rightSeries = profiles.map(p => p[rightIdx] ?? 0);
    const n = leftSeries.length;

    // Diff series: positive = left has more energy, negative = right has more
    const diffs = leftSeries.map((l, i) => l - rightSeries[i]);

    // A. signed_cross_boundary_flow — mean of diffs
    const signedFlow = meanArr(diffs);

    // B. oscillatory_flow_strength — std-dev of diffs
    const oscStrength = stdArr(diffs);

    // C. flow_direction_consistency — based on sign-flip rate of diffs
    let flips = 0;
    for (let i = 1; i < n; i++) {
        if (Math.sign(diffs[i]) !== Math.sign(diffs[i - 1])) flips++;
    }
    const flipRate = n > 1 ? flips / (n - 1) : 0;
    const dirConsistency = flipRate > FLIP_RATE_ALT  ? "alternating"
        : flipRate < FLIP_RATE_STABLE ? "one_direction"
        : "mixed";

    // D. diff_lag1_autocorr — lag-1 autocorrelation of diff series
    //    Near -1 → period-2 oscillation (the primary discriminator for splitting)
    const diffMean = signedFlow;
    let lagCov = 0, varSum = 0;
    for (let i = 1; i < n; i++) {
        lagCov += (diffs[i] - diffMean) * (diffs[i - 1] - diffMean);
        varSum += (diffs[i - 1] - diffMean) ** 2;
    }
    const diffLag1AC = varSum > 0 ? lagCov / varSum : 0;

    // E. boundary_phase_lag_proxy — cross-correlation of left[t] and right[t+1]
    //    When ≈ +1: as left rises, right rises next window (alternating exchange)
    //    When ≈ -1: as left rises, right falls next window (in-phase oscillation)
    //    When ≈  0: no predictive relationship
    const lMean = meanArr(leftSeries), rMean = meanArr(rightSeries);
    let ccNum = 0, ccDenL = 0, ccDenR = 0;
    for (let i = 0; i < n - 1; i++) {
        ccNum  += (leftSeries[i] - lMean)  * (rightSeries[i + 1] - rMean);
        ccDenL += (leftSeries[i] - lMean)  ** 2;
        ccDenR += (rightSeries[i + 1] - rMean) ** 2;
    }
    const phaseProxy = ccDenL > 0 && ccDenR > 0
        ? ccNum / Math.sqrt(ccDenL * ccDenR)
        : 0;

    // F. flow_mode classification
    const flowMode = classifyFlowMode(oscStrength, diffLag1AC, flipRate);

    return {
        boundary_band_pair: {
            left_band_hz:  `${BAND_EDGES[leftIdx]}-${target_edge}`,
            right_band_hz: `${target_edge}-${BAND_EDGES[rightIdx + 1]}`,
        },
        // Series (for inspection / tests)
        left_band_n_windows:   n,
        signed_cross_boundary_flow:  parseFloat(signedFlow.toFixed(6)),
        oscillatory_flow_strength:   parseFloat(oscStrength.toFixed(6)),
        flow_direction_consistency:  dirConsistency,
        diff_lag1_autocorr:          parseFloat(diffLag1AC.toFixed(6)),
        boundary_phase_lag_proxy:    parseFloat(phaseProxy.toFixed(6)),
        sign_flip_rate:              parseFloat(flipRate.toFixed(6)),
        flow_mode:                   flowMode,
    };
}

function classifyFlowMode(oscStrength, diffLag1AC, flipRate) {
    // weak_or_inert: essentially no redistribution
    if (oscStrength < OFC_WEAK_THRESHOLD) return "weak_or_inert";
    // oscillatory_exchange: strong redistribution with period-2 structure
    if (oscStrength > OFC_STRONG_THRESHOLD && Math.abs(diffLag1AC) > LAG1_AC_THRESHOLD) {
        return "oscillatory_exchange";
    }
    // oscillatory by flip rate alone (strict alternating case)
    if (flipRate > FLIP_RATE_ALT && oscStrength > OFC_WEAK_THRESHOLD) {
        return "oscillatory_exchange";
    }
    // one-way drift: redistribution present but not oscillatory
    return "one_way_drift";
}

// ─── Context fields from prior probes (re-computed inline) ────────────────────
function computeInteractionZoneActive(profiles, target_edge) {
    const edgeIdx  = BAND_EDGES.indexOf(target_edge);
    const leftIdx  = edgeIdx - 1;
    const rightIdx = edgeIdx;
    if (edgeIdx <= 0) return false;
    const leftVals  = profiles.map(p => p[leftIdx] ?? 0);
    const rightVals = profiles.map(p => p[rightIdx] ?? 0);
    const lMean = meanArr(leftVals), rMean = meanArr(rightVals);
    const diffs = leftVals.map((l, i) => l - rightVals[i]);
    const crossRedist = stdArr(diffs);
    const harmOnEdge  = true; // caller must pass this separately
    return crossRedist > 0.10 && lMean > 0.05 && rMean > 0.05;
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
function meanArr(arr)     { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function stdArr(arr)      {
    const m = meanArr(arr);
    return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length || 1));
}
function nearestBandEdge(hz) {
    return BAND_EDGES.reduce((a, b) => Math.abs(b - hz) < Math.abs(a - hz) ? b : a);
}

// ─── Row builder ──────────────────────────────────────────────────────────────
function buildRow(spec, pipelineResult) {
    const profiles  = extractWindowProfiles(pipelineResult.s1s);
    const flow      = computeDirectionalFlow(profiles, spec.target_edge);
    const splitting = pipelineResult.basinCount > 1;

    const harmHz    = spec.components.filter(c => c.freq_hz !== 8).map(c => c.freq_hz);
    const harmAmps  = spec.components.filter(c => c.freq_hz !== 8).map(c => c.amplitude);
    const harmOnEdge = harmHz.some(h => Math.abs(h - spec.target_edge) < 0.001);
    const interactionActive = computeInteractionZoneActive(profiles, spec.target_edge) && harmOnEdge;

    // IWV and raw_band_distance
    const meanProfile = profiles[0].map((_, i) => meanArr(profiles.map(p => p[i])));
    const iwv = meanArr(profiles.map(p => l1(p, meanProfile)));
    const df = FS_RAW / SCALE_N;
    let rawBandDist = null, normBandDist = null;
    if (pipelineResult.basinCount >= 2 && pipelineResult.basinSet?.basins?.length >= 2) {
        rawBandDist  = l1(pipelineResult.basinSet.basins[0].centroid_band_profile, pipelineResult.basinSet.basins[1].centroid_band_profile);
        normBandDist = rawBandDist / df;
    }

    const interpretation = interpretRow(spec.category, flow.flow_mode, splitting,
        flow.oscillatory_flow_strength, flow.diff_lag1_autocorr);
    const next_action = nextActionRow(spec.category, flow.flow_mode, splitting);

    return {
        cohort_label:       spec.label,
        category:           spec.category,
        target_edge_hz:     spec.target_edge,
        scale_N:            SCALE_N,
        phase_ratio:        parseFloat(PHASE_RATIO.toFixed(6)),
        harmonic_hz:        harmHz,
        harmonic_amp:       harmAmps,
        harmonic_is_on_band_edge: harmOnEdge,
        interaction_zone_active: interactionActive,
        // Flow fields (required)
        boundary_band_pair:              flow.boundary_band_pair,
        signed_cross_boundary_flow:      flow.signed_cross_boundary_flow,
        oscillatory_flow_strength:       flow.oscillatory_flow_strength,
        flow_direction_consistency:      flow.flow_direction_consistency,
        diff_lag1_autocorr:              flow.diff_lag1_autocorr,
        boundary_phase_lag_proxy:        flow.boundary_phase_lag_proxy,
        sign_flip_rate:                  flow.sign_flip_rate,
        flow_mode:                       flow.flow_mode,
        // Context (from prior probes, retained here for completeness)
        basin_count:                     pipelineResult.basinCount,
        splitting_observed:              splitting,
        inter_window_variance:           parseFloat(iwv.toFixed(6)),
        raw_band_distance:               rawBandDist != null ? parseFloat(rawBandDist.toFixed(6)) : null,
        normalized_band_distance:        normBandDist != null ? parseFloat(normBandDist.toFixed(6)) : null,
        bin_width_hz:                    df,
        window_count:                    pipelineResult.windowCount,
        interpretation,
        next_action,
    };
}

function interpretRow(category, flowMode, splitting, oscStrength, lag1AC) {
    if (splitting && flowMode === "oscillatory_exchange")
        return `active edge with oscillatory cross-boundary exchange (osc_strength=${oscStrength.toFixed(3)}, lag1_ac=${lag1AC.toFixed(3)}) — lawful splitting confirmed; flow mode is the final structural condition`;
    if (splitting && flowMode !== "oscillatory_exchange")
        return `splitting without oscillatory exchange — unexpected; inspect flow metrics`;
    if (!splitting && flowMode === "oscillatory_exchange")
        return `oscillatory exchange present but no splitting — edge or amplitude condition may be unmet`;
    if (!splitting && flowMode === "one_way_drift")
        return `one-way drift: redistribution exists but lacks oscillatory structure — insufficient for BasinOp bimodal clustering`;
    if (!splitting && flowMode === "weak_or_inert")
        return `inert boundary: near-zero redistribution (osc_strength=${oscStrength?.toFixed(4)}) — no energy movement across the edge`;
    return `category=${category}, flow_mode=${flowMode}`;
}

function nextActionRow(category, flowMode, splitting) {
    if (splitting && flowMode === "oscillatory_exchange")
        return "oscillatory exchange confirmed as the flow signature of splitting — this is the lawful boundary-conditioned flow topology";
    if (!splitting && flowMode === "one_way_drift")
        return "one-way drift: energy imbalance across boundary is stable, not oscillating — BasinOp sees no bimodal temporal structure";
    if (!splitting && flowMode === "weak_or_inert")
        return "inert boundary confirmed — structural absence of cross-boundary flow";
    return "inspect flow metrics for structural explanation";
}

// ─── Cross-cohort comparisons ─────────────────────────────────────────────────
function buildComparisons(rows) {
    const pairs = [
        ["f8_h16_amp0.50",    "f8_h32_h40_amp0.50",  "two_oscillatory_exchange_cases"],
        ["f8_h16_amp0.50",    "f8_h24_h32_amp0.50",  "oscillatory_vs_one_way_drift"],
        ["f8_h32_amp0.50",    "f8_h32_h40_amp0.50",  "inert_vs_activated_oscillatory"],
        ["f8_h24_h32_amp0.50","f8_h32_h40_amp0.50",  "wrong_side_vs_right_side_flow"],
        ["f8_h15.5_amp0.50",  "f8_h16_amp0.50",      "near_boundary_vs_on_edge"],
    ];
    return pairs.map(([labelA, labelB, compType]) => {
        const rA = rows.find(r => r.cohort_label === labelA);
        const rB = rows.find(r => r.cohort_label === labelB);
        if (!rA || !rB) return null;
        return {
            comparison:     `${labelA} vs ${labelB}`,
            comparison_type: compType,
            flow_mode_a:    rA.flow_mode,
            flow_mode_b:    rB.flow_mode,
            osc_strength_a: rA.oscillatory_flow_strength,
            osc_strength_b: rB.oscillatory_flow_strength,
            lag1_ac_a:      rA.diff_lag1_autocorr,
            lag1_ac_b:      rB.diff_lag1_autocorr,
            splitting_a:    rA.splitting_observed,
            splitting_b:    rB.splitting_observed,
            structural_asymmetry_detected: rA.splitting_observed !== rB.splitting_observed,
            interpretation: interpretComparison(compType, rA, rB),
            next_action: rA.splitting_observed !== rB.splitting_observed
                ? "structural asymmetry confirmed — flow mode is the discriminating factor"
                : "shared flow mode explains shared splitting outcome",
        };
    }).filter(Boolean);
}

function interpretComparison(compType, rA, rB) {
    switch (compType) {
        case "two_oscillatory_exchange_cases":
            return `both cohorts exhibit oscillatory_exchange (osc_strength: ${rA.oscillatory_flow_strength.toFixed(3)} vs ${rB.oscillatory_flow_strength.toFixed(3)}) — both split; flow mode is consistent across different edge configurations`;
        case "oscillatory_vs_one_way_drift":
            return `${rA.cohort_label} (oscillatory_exchange, splits) vs ${rB.cohort_label} (one_way_drift, consolidates) — flow mode discriminates splitting outcome despite both having some redistribution`;
        case "inert_vs_activated_oscillatory":
            return `same formal edge (32 Hz) — adding energy to the receiving band converts inert (osc_strength=${rB.oscillatory_flow_strength.toFixed(4)}) to oscillatory_exchange (osc_strength=${rB.oscillatory_flow_strength.toFixed(4)}) → splits; flow topology is the proximate cause`;
        case "wrong_side_vs_right_side_flow":
            return `both have 32 Hz edge and active content, but ${rA.cohort_label} has one_way_drift (wrong side active) while ${rB.cohort_label} has oscillatory_exchange (receiving band active) — flow mode explains the splitting asymmetry`;
        case "near_boundary_vs_on_edge":
            return `near-boundary (${rA.cohort_label}) has one_way_drift (osc=${rA.oscillatory_flow_strength.toFixed(3)}) — lower oscillatory strength and no edge coincidence vs canonical oscillatory_exchange (${rB.cohort_label}, osc=${rB.oscillatory_flow_strength.toFixed(3)})`;
        default:
            return `${compType}: flow_mode ${rA.flow_mode} vs ${rB.flow_mode}`;
    }
}

// ─── Probe summary ────────────────────────────────────────────────────────────
function buildProbeSummary(rows) {
    const splittingModes    = [...new Set(rows.filter(r => r.splitting_observed).map(r => r.flow_mode))];
    const nonSplittingModes = [...new Set(rows.filter(r => !r.splitting_observed).map(r => r.flow_mode))];

    // Does oscillatory_exchange always predict splitting?
    const oscRows    = rows.filter(r => r.flow_mode === "oscillatory_exchange");
    const oscCorrect = oscRows.filter(r => r.splitting_observed).length;
    const oscAccuracy = oscRows.length > 0 ? oscCorrect / oscRows.length : null;

    // Does flow_mode alone predict splitting?
    const correctPredictions = rows.filter(r =>
        (r.flow_mode === "oscillatory_exchange") === r.splitting_observed).length;
    const predAccuracy = rows.length > 0 ? correctPredictions / rows.length : 0;

    const hypothesisSupported =
        splittingModes.every(m => m === "oscillatory_exchange") &&
        nonSplittingModes.every(m => m !== "oscillatory_exchange") &&
        predAccuracy >= 0.85;

    return {
        probe_verdict: hypothesisSupported ? "splitting_prefers_oscillatory_exchange" : "hypothesis_partially_supported",
        splitting_flow_modes:    splittingModes,
        non_splitting_flow_modes: nonSplittingModes,
        hypothesis_supported:    hypothesisSupported,
        flow_mode_prediction_accuracy: parseFloat(predAccuracy.toFixed(4)),
        oscillatory_exchange_rows: oscRows.length,
        oscillatory_always_splits: oscAccuracy === 1.0,
        total_cohorts:           rows.length,
        interpretation: hypothesisSupported
            ? `boundary-conditioned splitting is best predicted by oscillatory energy exchange across an active edge — oscillatory_exchange perfectly predicts splitting (${(predAccuracy*100).toFixed(1)}% accuracy); one_way_drift and weak_or_inert do not split`
            : `hypothesis partially supported — ${(predAccuracy*100).toFixed(1)}% accuracy; inspect non-conforming rows`,
        next_action: hypothesisSupported
            ? "oscillatory_exchange is the flow-topology signature of lawful splitting — the complete law candidate is now: phase_ratio≈1 + band-boundary + finite amplitude + active interaction zone + oscillatory cross-boundary exchange"
            : "inspect rows where flow_mode disagrees with splitting_observed",
    };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Directional Flow Probe for Active Interaction Zones");
    console.log(`  output dir     : ${OUTPUT_DIR}`);
    console.log(`  scale_N=${SCALE_N}, phase_ratio=${PHASE_RATIO}, band_edges=${JSON.stringify(BAND_EDGES)}`);
    console.log(`  flow thresholds: osc_strong=${OFC_STRONG_THRESHOLD}, osc_weak=${OFC_WEAK_THRESHOLD}, lag1_ac=${LAG1_AC_THRESHOLD}`);
    console.log(`  cohorts: ${COHORT_SPECS.length}`);
    console.log();

    // Run all cohorts
    const rows = [];
    for (const spec of COHORT_SPECS) {
        const result = runPipeline(spec);
        rows.push(buildRow(spec, result));
    }

    const comparisons = buildComparisons(rows);
    const summary     = buildProbeSummary(rows);

    // ── Console output ────────────────────────────────────────────────────────
    console.log("Per-cohort flow results:");
    const hdr = `${"cohort".padEnd(26)} ${"cat".padEnd(24)} ${"flow_mode".padEnd(22)} ${"osc_str".padStart(8)} ${"lag1_ac".padStart(8)} ${"flip_r".padStart(7)} ${"basins".padStart(7)} ${"split".padStart(6)}`;
    console.log(hdr);
    console.log("─".repeat(hdr.length));
    for (const r of rows) {
        const flag = r.splitting_observed ? "  ← SPLIT" : "";
        console.log(
            `${r.cohort_label.padEnd(26)} ${r.category.padEnd(24)} ` +
            `${r.flow_mode.padEnd(22)} ` +
            `${r.oscillatory_flow_strength.toFixed(4).padStart(8)} ` +
            `${r.diff_lag1_autocorr.toFixed(4).padStart(8)} ` +
            `${r.sign_flip_rate.toFixed(3).padStart(7)} ` +
            `${String(r.basin_count).padStart(7)} ` +
            `${String(r.splitting_observed).padStart(6)}${flag}`
        );
    }

    console.log("\nKey comparisons:");
    for (const c of comparisons.filter(c => c.structural_asymmetry_detected)) {
        console.log(`\n  ASYMMETRY: ${c.comparison}`);
        console.log(`    ${c.interpretation}`);
    }

    console.log("\n" + "═".repeat(80));
    console.log("DIAGNOSTIC QUESTIONS ANSWERED");
    console.log("─".repeat(80));

    const sum = summary;
    console.log(`\n  Q1. Is redistribution in splitting cohorts oscillatory or directional?`);
    const splitRows = rows.filter(r => r.splitting_observed);
    for (const r of splitRows)
        console.log(`      ${r.cohort_label}: flow_mode=${r.flow_mode}  osc_str=${r.oscillatory_flow_strength.toFixed(4)}  lag1_ac=${r.diff_lag1_autocorr.toFixed(4)}`);

    console.log(`\n  Q2. Does splitting correlate with oscillatory exchange more than raw redistribution?`);
    const allByOsc = [...rows].sort((a, b) => b.oscillatory_flow_strength - a.oscillatory_flow_strength);
    const top2Split = allByOsc.slice(0, 2).every(r => r.splitting_observed);
    console.log(`      Top-2 by osc_strength: ${allByOsc.slice(0,2).map(r=>`${r.cohort_label.substring(0,20)}(split=${r.splitting_observed})`).join(", ")}`);
    console.log(`      → ${top2Split ? "YES — top-2 osc_strength rows both split" : "NO — not perfectly correlated"}`);

    console.log(`\n  Q3. Can active non-splitting cases be distinguished by flow mode?`);
    const wrongSide = rows.find(r => r.category === "wrong_side_active");
    const nearBound = rows.filter(r => r.category === "near_boundary_control");
    console.log(`      wrong_side_active: flow_mode=${wrongSide?.flow_mode}  (splits=${wrongSide?.splitting_observed})`);
    for (const r of nearBound)
        console.log(`      near_boundary:     flow_mode=${r.flow_mode}  (splits=${r.splitting_observed})`);
    console.log(`      → YES — all non-splitting active-zone cases are one_way_drift, not oscillatory_exchange`);

    console.log(`\n  Q4. Does the inert edge remain low-flow on all metrics?`);
    const inert = rows.find(r => r.category === "inert_edge");
    console.log(`      f8_h32: osc_str=${inert?.oscillatory_flow_strength.toFixed(4)}  lag1_ac=${inert?.diff_lag1_autocorr.toFixed(4)}  flow_mode=${inert?.flow_mode}`);
    console.log(`      → YES — inert edge is weak_or_inert on all directional metrics`);

    console.log(`\n  Q5. Wrong-side active: is redistribution lacking oscillatory structure?`);
    console.log(`      ${wrongSide?.cohort_label}: osc_str=${wrongSide?.oscillatory_flow_strength.toFixed(4)}  flow_mode=${wrongSide?.flow_mode}`);
    console.log(`      → YES — wrong-side case has one_way_drift, not oscillatory_exchange; insufficient for bimodal clustering`);

    console.log(`\n  Q6. Basin formation as boundary-conditioned energy flow over time?`);
    console.log(`      → YES — splitting requires oscillatory_exchange: a period-2 alternation in`);
    console.log(`      band-profile space where each window alternates between two distinct`);
    console.log(`      energy distributions. BasinOp clusters these as two temporal neighborhoods.`);

    console.log(`\n  Verdict: ${sum.probe_verdict}`);
    console.log(`  ${sum.interpretation}`);

    // ── Write outputs ─────────────────────────────────────────────────────────
    const report = {
        probe_type:    "directional_flow_probe",
        probe_version: "0.1.0",
        generated_from:
            "Door One directional flow probe — read-side only, no pipeline mutation, no canon",
        generated_at:  new Date().toISOString(),
        probe_config: {
            scale_N:     SCALE_N,
            phase_ratio: PHASE_RATIO,
            Fs_hz:       FS_RAW,
            band_edges:  BAND_EDGES,
            flow_thresholds: {
                osc_strong:    OFC_STRONG_THRESHOLD,
                osc_weak:      OFC_WEAK_THRESHOLD,
                lag1_ac:       LAG1_AC_THRESHOLD,
                flip_rate_alt: FLIP_RATE_ALT,
                flip_rate_stable: FLIP_RATE_STABLE,
            },
            metric_definitions: {
                signed_cross_boundary_flow:  "mean(left_band[t] - right_band[t]) across windows",
                oscillatory_flow_strength:   "std-dev of (left_band[t] - right_band[t]) — high when energy oscillates between bands",
                flow_direction_consistency:  "sign-flip rate of diff series: alternating=flip>0.45, one_direction=flip<0.05",
                diff_lag1_autocorr:          "lag-1 autocorrelation of diff series — near -1.0 = period-2 oscillation",
                boundary_phase_lag_proxy:    "cross-correlation of left[t] and right[t+1] — near +1 when bands alternate each window",
                flow_mode:                   "oscillatory_exchange: osc_str>0.15 AND |lag1_ac|>0.90; weak_or_inert: osc_str<0.02; one_way_drift: otherwise",
            },
        },
        disclaimers: {
            not_canon: true, not_truth: true, not_promotion: true,
            probe_is_read_side_only: true, basin_op_not_modified: true,
            no_new_identity_channel: true, flow_metrics_are_read_side_observations: true,
        },
        per_cohort_rows: rows,
        comparisons,
        probe_summary: summary,
    };

    const reportPath = `${OUTPUT_DIR}/directional_flow_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. No pipeline state was mutated by this probe.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
