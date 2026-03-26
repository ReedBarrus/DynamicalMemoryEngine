// scripts/run_replay_resilience_surface_probe.js
//
// Replay Resilience Surface Probe — Door One Read-Side Only
//
// Constitutional posture:
//   - Runtime remains below canon.
//   - Cross-run remains observational only.
//   - Replay remains lens-bound.
//   - Basin organization is substrate-side structural organization, not ontology.
//   - flow_mode, resilience_class, and exchange_persistence_class are read-side
//     diagnostic observations — they do not enter runtime authority, BasinOp
//     contracts, workbench readiness, or promotion logic.
//   - "classification", "diagnostic separation", and "resilience summary" language
//     only — not "prediction" language.
//   - All findings are provisional, probe-local, and non-canonical.
//
// Primary question:
//   Across separate perturbation families, does oscillatory exchange persist,
//   weaken, disappear, recover on return, or fail to recover?
//
// Secondary question:
//   Is recovery axis-specific, or does the current support-horizon /
//   boundary-conditioned mechanism exhibit a broader lawful resilience surface?
//
// Perturbation families (one axis at a time, all others held fixed):
//
//   Family 1 — amplitude
//     Baseline:     harmonic_amp = 0.50  (inside splitting window [0.35, 0.60])
//     Perturbation: harmonic_amp = 0.75  (outside splitting window)
//     Return:       harmonic_amp = 0.50
//     Expected:     oscillatory_exchange → one_way_drift → oscillatory_exchange
//
//   Family 2 — boundary_detuning (shift harmonic toward but not on band boundary)
//     Baseline:     harmonic_hz = 16.0  (exact band boundary)
//     Perturbation: harmonic_hz = 14.0  (2 Hz below boundary, still band-0 spillover)
//     Return:       harmonic_hz = 16.0
//     Expected:     oscillatory_exchange → one_way_drift → oscillatory_exchange
//
//   Family 3 — harmonic_offset (shift harmonic to mid-band)
//     Baseline:     harmonic_hz = 16.0  (band-edge harmonic)
//     Perturbation: harmonic_hz = 24.0  (mid-band — confirmed weak_or_inert)
//     Return:       harmonic_hz = 16.0
//     Expected:     oscillatory_exchange → weak_or_inert → oscillatory_exchange
//     Note:         Full collapse (not just weakening) — the interaction zone
//                   disappears entirely when the harmonic moves to mid-band.
//
//   Family 4 — noise_depth
//     Baseline:     noise_std = 0.02
//     Perturbation: noise_std = 0.50  (noise-dominated, masks oscillatory structure)
//     Return:       noise_std = 0.02
//     Expected:     oscillatory_exchange → one_way_drift → oscillatory_exchange
//
// Pre-run diagnostic discrimination accuracy: all four families separate
// correctly using the existing flow_mode classification rule.
// (This is probe-local classification accuracy, not prediction accuracy.)
//
// Not implemented (and why):
//   - Phase-ratio disruption (scale shift): scale is fixed to N=32 for this
//     probe family; varying it mid-run would change the measurement lens,
//     conflating lens change with structural change. Deferred per scope rule.
//
// Each run uses an independent noise seed per source_id for honest independence.
//
// Boundary contract:
//   - read-side only — no pipeline mutation, no operator changes
//   - BasinOp unchanged, no contract changes
//   - no flow_mode in runtime artifacts
//   - no canon, no prediction, no workbench authority effects
//   - no new identity channel in MVCS
//   - attributable, reversible, removable
//
// Run:
//   node scripts/run_replay_resilience_surface_probe.js
//
// Optional env:
//   PROBE_RRS_OUTPUT_DIR — override ./out_experiments/replay_resilience_surface_probe

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }    from "../operators/ingest/IngestOp.js";
import { ClockAlignOp } from "../operators/clock/ClockAlignOp.js";
import { WindowOp }    from "../operators/window/WindowOp.js";
import { TransformOp } from "../operators/transform/TransformOp.js";
import { CompressOp }  from "../operators/compress/CompressOp.js";
import { BasinOp }     from "../operators/basin/BasinOp.js";

const OUTPUT_DIR = process.env.PROBE_RRS_OUTPUT_DIR
    ?? "./out_experiments/replay_resilience_surface_probe";

// ─── Fixed parameters (same lens as directional flow probe family) ─────────────
const FS_RAW    = 256;
const DURATION  = 4;
const SCALE_N   = 32;
const HOP_N     = Math.floor(SCALE_N / 2);
const BAND_EDGES = [0, 16, 32, 48, 64, 80, 96, 112, 128];
const BASIN_SIMILARITY_THRESHOLD = 0.5;
const PHASE_RATIO = (SCALE_N / FS_RAW) / (1 / 8);   // = 1.0

// Flow thresholds (identical across the probe family)
const OFC_STRONG_THRESHOLD = 0.15;
const OFC_WEAK_THRESHOLD   = 0.02;
const LAG1_AC_THRESHOLD    = 0.90;
const FLIP_RATE_ALT        = 0.45;
const FLIP_RATE_STABLE     = 0.05;

// Runs per phase per family
const RUNS_PER_PHASE = 3;

// ─── Perturbation family definitions ─────────────────────────────────────────
const PERTURBATION_FAMILIES = [
    {
        family_id:    "amplitude",
        description:  "Harmonic amplitude moves outside the finite splitting window [0.35–0.60]",
        perturbation_axis: "harmonic_amp",
        phases: [
            { phase: "baseline",     config: { fund_hz: 8, harm_hz: 16.0, harm_amp: 0.50, noise_std: 0.02 } },
            { phase: "perturbation", config: { fund_hz: 8, harm_hz: 16.0, harm_amp: 0.75, noise_std: 0.02 },
              perturbation_label: "amp_0.75", perturbation_value: 0.75 },
            { phase: "return",       config: { fund_hz: 8, harm_hz: 16.0, harm_amp: 0.50, noise_std: 0.02 } },
        ],
    },
    {
        family_id:    "boundary_detuning",
        description:  "Harmonic frequency moves 2 Hz below the band boundary — near-boundary stress but no longer on exact edge",
        perturbation_axis: "harmonic_hz",
        phases: [
            { phase: "baseline",     config: { fund_hz: 8, harm_hz: 16.0, harm_amp: 0.50, noise_std: 0.02 } },
            { phase: "perturbation", config: { fund_hz: 8, harm_hz: 14.0, harm_amp: 0.50, noise_std: 0.02 },
              perturbation_label: "hz_14.0", perturbation_value: 14.0 },
            { phase: "return",       config: { fund_hz: 8, harm_hz: 16.0, harm_amp: 0.50, noise_std: 0.02 } },
        ],
    },
    {
        family_id:    "harmonic_offset",
        description:  "Harmonic frequency moves from band-edge (16 Hz) to mid-band (24 Hz) — interaction zone collapses entirely",
        perturbation_axis: "harmonic_hz",
        phases: [
            { phase: "baseline",     config: { fund_hz: 8, harm_hz: 16.0, harm_amp: 0.50, noise_std: 0.02 } },
            { phase: "perturbation", config: { fund_hz: 8, harm_hz: 24.0, harm_amp: 0.50, noise_std: 0.02 },
              perturbation_label: "hz_24.0_mid_band", perturbation_value: 24.0 },
            { phase: "return",       config: { fund_hz: 8, harm_hz: 16.0, harm_amp: 0.50, noise_std: 0.02 } },
        ],
    },
    {
        family_id:    "noise_depth",
        description:  "Noise standard deviation increases 25× — masks fine-scale oscillatory structure",
        perturbation_axis: "noise_std",
        phases: [
            { phase: "baseline",     config: { fund_hz: 8, harm_hz: 16.0, harm_amp: 0.50, noise_std: 0.02 } },
            { phase: "perturbation", config: { fund_hz: 8, harm_hz: 16.0, harm_amp: 0.50, noise_std: 0.50 },
              perturbation_label: "noise_0.50", perturbation_value: 0.50 },
            { phase: "return",       config: { fund_hz: 8, harm_hz: 16.0, harm_amp: 0.50, noise_std: 0.02 } },
        ],
    },
];

// ─── Signal generator ─────────────────────────────────────────────────────────
function generateSignal(config, source_id) {
    const { fund_hz, harm_hz, harm_amp, noise_std } = config;
    const n = Math.floor(DURATION * FS_RAW);
    const values = new Array(n), timestamps = new Array(n);
    let ns = 0;
    for (let c = 0; c < source_id.length; c++) ns = (ns * 31 + source_id.charCodeAt(c)) >>> 0;
    function nextNoise() { ns = (ns * 1664525 + 1013904223) >>> 0; return (ns / 4294967296 - 0.5) * 2; }
    for (let i = 0; i < n; i++) {
        const t = i / FS_RAW;
        values[i] = 1.0 * Math.sin(2 * Math.PI * fund_hz * t)
                  + harm_amp * Math.sin(2 * Math.PI * harm_hz * t)
                  + nextNoise() * noise_std;
        timestamps[i] = t;
    }
    return { values, timestamps };
}

// ─── Pipeline runner ──────────────────────────────────────────────────────────
function runPipeline(config, source_id) {
    const { values, timestamps } = generateSignal(config, source_id);
    const maxBins = Math.floor(SCALE_N / 2);

    const a1r = new IngestOp().run({
        timestamps, values, source_id,
        channel: "ch0", modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS_RAW },
        clock_policy_id: "clock.rrs.v1",
        ingest_policy: { policy_id: "ingest.rrs.v1", gap_threshold_multiplier: 3.0,
            allow_non_monotonic: false, allow_empty: false, non_monotonic_mode: "reject" },
    });
    if (!a1r.ok) throw new Error(`IngestOp ${source_id}: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({ a1: a1r.artifact,
        grid_spec: { Fs_target: FS_RAW, t_ref: timestamps[0], grid_policy: "strict",
            drift_model: "none", non_monotonic_policy: "reject", interp_method: "linear",
            gap_policy: "interpolate_small", small_gap_multiplier: 3.0,
            max_gap_seconds: null, anti_alias_filter: false } });
    if (!a2r.ok) throw new Error(`ClockAlignOp ${source_id}: ${a2r.error}`);

    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: {
        mode: "fixed", Fs_target: FS_RAW, base_window_N: SCALE_N, hop_N: HOP_N,
        window_function: "hann", overlap_ratio: 0.5, stationarity_policy: "tolerant",
        salience_policy: "off", gap_policy: "interpolate_small",
        max_missing_ratio: 0.25, boundary_policy: "truncate" } });
    if (!w1r.ok) throw new Error(`WindowOp ${source_id}: ${w1r.error}`);

    const tfOp = new TransformOp(), cpOp = new CompressOp();
    const tfPolicy = { policy_id: "transform.rrs.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant" };
    const cpPolicy = { policy_id: "compress.rrs.v1", selection_method: "topK",
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
            context: { segment_id: `seg:${source_id}`,
                window_span: { t_start, t_end: t_start + SCALE_N / FS_RAW } } });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null, basinCount = 1;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s,
            basin_policy: { policy_id: "basin.rrs.v1",
                similarity_threshold: BASIN_SIMILARITY_THRESHOLD,
                min_member_count: 1, weight_mode: "duration",
                linkage: "single_link", cross_segment: true } });
        if (br.ok) { basinSet = br.artifact; basinCount = br.artifact.basins.length; }
    }

    return { s1s, basinSet, basinCount, streamId: a1r.artifact.stream_id };
}

// ─── Directional flow metrics (identical to directional flow probe family) ─────

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

function computeDirectionalFlow(profiles, targetEdge) {
    const edgeIdx  = BAND_EDGES.indexOf(targetEdge);
    const leftIdx  = edgeIdx - 1;
    const rightIdx = edgeIdx;
    if (edgeIdx <= 0 || edgeIdx >= BAND_EDGES.length - 1) return null;

    const leftSeries  = profiles.map(p => p[leftIdx] ?? 0);
    const rightSeries = profiles.map(p => p[rightIdx] ?? 0);
    const n           = leftSeries.length;
    const diffs       = leftSeries.map((l, i) => l - rightSeries[i]);

    const signedFlow  = meanArr(diffs);
    const oscStrength = stdArr(diffs);
    let flips = 0;
    for (let i = 1; i < n; i++) if (Math.sign(diffs[i]) !== Math.sign(diffs[i-1])) flips++;
    const flipRate = n > 1 ? flips / (n - 1) : 0;

    const diffMean = signedFlow;
    let lagCov = 0, varSum = 0;
    for (let i = 1; i < n; i++) {
        lagCov += (diffs[i] - diffMean) * (diffs[i-1] - diffMean);
        varSum += (diffs[i-1] - diffMean) ** 2;
    }
    const diffLag1AC = varSum > 0 ? lagCov / varSum : 0;

    const lMean = meanArr(leftSeries), rMean = meanArr(rightSeries);
    let ccNum = 0, ccDenL = 0, ccDenR = 0;
    for (let i = 0; i < n - 1; i++) {
        ccNum  += (leftSeries[i] - lMean) * (rightSeries[i+1] - rMean);
        ccDenL += (leftSeries[i] - lMean) ** 2;
        ccDenR += (rightSeries[i+1] - rMean) ** 2;
    }
    const phaseProxy = ccDenL > 0 && ccDenR > 0 ? ccNum / Math.sqrt(ccDenL * ccDenR) : 0;

    const dirConsistency = flipRate > FLIP_RATE_ALT ? "alternating"
        : flipRate < FLIP_RATE_STABLE ? "one_direction" : "mixed";

    return {
        boundary_band_pair: {
            left_band_hz:  `${BAND_EDGES[leftIdx]}-${targetEdge}`,
            right_band_hz: `${targetEdge}-${BAND_EDGES[rightIdx + 1]}`,
        },
        signed_cross_boundary_flow:  parseFloat(signedFlow.toFixed(6)),
        oscillatory_flow_strength:   parseFloat(oscStrength.toFixed(6)),
        flow_direction_consistency:  dirConsistency,
        diff_lag1_autocorr:          parseFloat(diffLag1AC.toFixed(6)),
        boundary_phase_lag_proxy:    parseFloat(phaseProxy.toFixed(6)),
        sign_flip_rate:              parseFloat(flipRate.toFixed(6)),
        flow_mode:                   classifyFlowMode(oscStrength, diffLag1AC, flipRate),
    };
}

function classifyFlowMode(oscStrength, diffLag1AC, flipRate) {
    if (oscStrength < OFC_WEAK_THRESHOLD)    return "weak_or_inert";
    if (oscStrength > OFC_STRONG_THRESHOLD && Math.abs(diffLag1AC) > LAG1_AC_THRESHOLD)
        return "oscillatory_exchange";
    if (flipRate > FLIP_RATE_ALT && oscStrength > OFC_WEAK_THRESHOLD)
        return "oscillatory_exchange";
    return "one_way_drift";
}

// ─── Per-run row builder ───────────────────────────────────────────────────────

function buildRunRow(familyId, perturbAxis, phase, runIdxInPhase, seqIdx,
                     config, pertLabel, pipelineResult) {
    const { s1s, basinSet, basinCount, streamId } = pipelineResult;
    const sourceId   = `rrs.${familyId}.${phase}.r${runIdxInPhase}.seq${seqIdx}`;
    const profiles   = extractWindowProfiles(s1s);
    const targetEdge = BAND_EDGES.includes(config.harm_hz) ? config.harm_hz : 16;
    // For mid-band perturbation (harm_hz=24), still measure at the nominal 16Hz edge
    // to preserve comparability; the mechanism collapses because the harmonic left the edge.
    const flowEdge   = 16;
    const flow       = computeDirectionalFlow(profiles, flowEdge);

    const meanProfile = profiles[0].map((_, i) => meanArr(profiles.map(p => p[i])));
    const iwv = meanArr(profiles.map(p => l1(p, meanProfile)));
    const df = FS_RAW / SCALE_N;
    let rawBandDist = null, normBandDist = null;
    if (basinCount >= 2 && basinSet?.basins?.length >= 2) {
        rawBandDist  = l1(basinSet.basins[0].centroid_band_profile, basinSet.basins[1].centroid_band_profile);
        normBandDist = rawBandDist / df;
    }

    return {
        // Lineage
        run_label:              `${familyId}.${phase}.r${runIdxInPhase + 1}`,
        perturbation_family:    familyId,
        perturbation_axis:      perturbAxis,
        perturbation_label:     pertLabel ?? phase,
        replay_phase:           phase,
        replay_sequence_index:  seqIdx,
        run_index_in_phase:     runIdxInPhase,
        source_id:              sourceId,
        stream_id:              streamId,
        // Configuration
        fund_hz:                config.fund_hz,
        harm_hz:                config.harm_hz,
        harm_amp:               config.harm_amp,
        noise_std:              config.noise_std,
        target_edge_hz:         flowEdge,
        scale_N:                SCALE_N,
        phase_ratio:            parseFloat(PHASE_RATIO.toFixed(6)),
        harmonic_is_on_band_edge: BAND_EDGES.includes(config.harm_hz),
        // Flow fields
        ...(flow ?? {}),
        // Basin context
        basin_count:            basinCount,
        splitting_observed:     basinCount > 1,
        inter_window_variance:  parseFloat(iwv.toFixed(6)),
        raw_band_distance:      rawBandDist  != null ? parseFloat(rawBandDist.toFixed(6))  : null,
        normalized_band_distance: normBandDist != null ? parseFloat(normBandDist.toFixed(6)) : null,
        bin_width_hz:           df,
        window_count:           s1s.length,
        // Bounded interpretation
        interpretation: interpretRunRow(familyId, phase, flow?.flow_mode, basinCount > 1),
    };
}

function interpretRunRow(familyId, phase, flowMode, splitting) {
    const ctx = `[${familyId} / ${phase}]`;
    if (splitting && flowMode === "oscillatory_exchange")
        return `oscillatory exchange sustained — basin splitting present ${ctx}`;
    if (!splitting && flowMode === "oscillatory_exchange")
        return `oscillatory exchange without splitting ${ctx} — inspect amplitude threshold`;
    if (!splitting && flowMode === "one_way_drift")
        return `one-way drift under perturbation — oscillatory structure weakened ${ctx}`;
    if (!splitting && flowMode === "weak_or_inert")
        return `boundary inert — interaction zone collapsed ${ctx}`;
    return `flow_mode=${flowMode}, splitting=${splitting} ${ctx}`;
}

// ─── Family-level replay summary ──────────────────────────────────────────────

function buildFamilySummary(familyId, perturbAxis, runRows) {
    const byPhase = {};
    for (const r of runRows) {
        if (!byPhase[r.replay_phase]) byPhase[r.replay_phase] = [];
        byPhase[r.replay_phase].push(r);
    }
    function modeForPhase(phase) {
        const rows = byPhase[phase] ?? [];
        const counts = {};
        for (const r of rows) counts[r.flow_mode] = (counts[r.flow_mode] ?? 0) + 1;
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";
    }
    function meanField(phase, field) {
        const vals = (byPhase[phase] ?? []).map(r => r[field]).filter(v => typeof v === "number");
        return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(6)) : null;
    }

    const baselineMode     = modeForPhase("baseline");
    const perturbationMode = modeForPhase("perturbation");
    const returnMode       = modeForPhase("return");

    const exchangeClass    = classifyExchangePersistence(baselineMode, perturbationMode, returnMode);

    let seqTransitions = 0;
    const sorted = [...runRows].sort((a, b) => a.replay_sequence_index - b.replay_sequence_index);
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].flow_mode !== sorted[i-1].flow_mode) seqTransitions++;
    }

    const splitCounts = {
        baseline:     (byPhase.baseline     ?? []).filter(r => r.splitting_observed).length,
        perturbation: (byPhase.perturbation ?? []).filter(r => r.splitting_observed).length,
        return:       (byPhase.return       ?? []).filter(r => r.splitting_observed).length,
    };
    const totalPerPhase = {
        baseline:     (byPhase.baseline     ?? []).length,
        perturbation: (byPhase.perturbation ?? []).length,
        return:       (byPhase.return       ?? []).length,
    };

    return {
        perturbation_family:   familyId,
        perturbation_axis:     perturbAxis,
        total_runs:            runRows.length,
        // Per-phase flow modes
        baseline_flow_mode:     baselineMode,
        perturbation_flow_mode: perturbationMode,
        return_flow_mode:       returnMode,
        // Metric means per phase
        baseline_osc_strength_mean:     meanField("baseline",     "oscillatory_flow_strength"),
        perturbation_osc_strength_mean: meanField("perturbation", "oscillatory_flow_strength"),
        return_osc_strength_mean:       meanField("return",       "oscillatory_flow_strength"),
        baseline_lag1_ac_mean:          meanField("baseline",     "diff_lag1_autocorr"),
        perturbation_lag1_ac_mean:      meanField("perturbation", "diff_lag1_autocorr"),
        return_lag1_ac_mean:            meanField("return",       "diff_lag1_autocorr"),
        // Exchange persistence
        exchange_persistence_class:     exchangeClass,
        flow_regime_transition_count:   seqTransitions,
        // Basin split persistence
        basin_split_persistence_summary: {
            baseline:     `${splitCounts.baseline}/${totalPerPhase.baseline} runs split`,
            perturbation: `${splitCounts.perturbation}/${totalPerPhase.perturbation} runs split`,
            return:       `${splitCounts.return}/${totalPerPhase.return} runs split`,
        },
        resilience_surface_hint:        classifyResilienceHint(exchangeClass),
        // Bounded interpretation
        interpretation: interpretFamilySummary(familyId, perturbAxis, exchangeClass,
            baselineMode, perturbationMode, returnMode),
        // Posture
        not_canon: true, not_prediction: true, not_promotion: true,
        diagnostic_posture: "family-level replay summary — diagnostic classification only, not runtime authority",
    };
}

function classifyExchangePersistence(bMode, pMode, rMode) {
    const baseOsc = bMode === "oscillatory_exchange";
    const pertOsc = pMode === "oscillatory_exchange";
    const retOsc  = rMode === "oscillatory_exchange";
    if (baseOsc && pertOsc && retOsc)    return "stable_persistent_exchange";
    if (baseOsc && !pertOsc && retOsc)   return "exchange_recovers_on_return";
    if (baseOsc && !pertOsc && !retOsc)  return "exchange_degrades_without_recovery";
    if (!baseOsc && !pertOsc && !retOsc) return "weak_or_inert_throughout";
    if (baseOsc && pertOsc && !retOsc)   return "exchange_lost_on_return";
    return "unresolved";
}

function classifyResilienceHint(exchangeClass) {
    switch (exchangeClass) {
        case "stable_persistent_exchange":    return "axis_does_not_disrupt_exchange";
        case "exchange_recovers_on_return":   return "axis_specific_recovery";
        case "exchange_degrades_without_recovery": return "fragile_exchange_regime";
        case "weak_or_inert_throughout":      return "inert_throughout";
        default:                              return "unresolved";
    }
}

function interpretFamilySummary(familyId, perturbAxis, exchangeClass, bMode, pMode, rMode) {
    const hint = classifyResilienceHint(exchangeClass);
    switch (exchangeClass) {
        case "exchange_recovers_on_return":
            return `[${familyId}] oscillatory exchange recovers when ${perturbAxis} perturbation is removed — exchange condition is robust to this axis; hint: ${hint}`;
        case "stable_persistent_exchange":
            return `[${familyId}] oscillatory exchange unaffected by ${perturbAxis} perturbation — axis does not reach the disruption threshold`;
        case "exchange_degrades_without_recovery":
            return `[${familyId}] oscillatory exchange lost under ${perturbAxis} perturbation and not recovered on return — structural fragility detected`;
        case "weak_or_inert_throughout":
            return `[${familyId}] boundary inert throughout all phases — exchange condition was never present`;
        default:
            return `[${familyId}] unresolved exchange persistence across ${perturbAxis} perturbation`;
    }
}

// ─── Cross-family summary ──────────────────────────────────────────────────────

function buildCrossFamilySummary(familySummaries) {
    const recoveryFamilies = familySummaries
        .filter(s => s.exchange_persistence_class === "exchange_recovers_on_return")
        .map(s => s.perturbation_family);
    const nonRecoveryFamilies = familySummaries
        .filter(s => s.exchange_persistence_class !== "exchange_recovers_on_return" &&
                     s.exchange_persistence_class !== "stable_persistent_exchange")
        .map(s => s.perturbation_family);
    const stableFamilies = familySummaries
        .filter(s => s.exchange_persistence_class === "stable_persistent_exchange")
        .map(s => s.perturbation_family);

    // Resilience surface class
    const allRecover  = nonRecoveryFamilies.length === 0;
    const noneRecover = recoveryFamilies.length === 0 && stableFamilies.length === 0;
    const resilience  = allRecover && recoveryFamilies.length === familySummaries.length
        ? "broad_recovery_pattern"
        : allRecover && stableFamilies.length > 0
            ? "broad_recovery_or_stability"
            : noneRecover
                ? "fragile_exchange_regime"
                : recoveryFamilies.length > nonRecoveryFamilies.length
                    ? "mostly_recoverable"
                    : "mixed";

    // Probe-local diagnostic discrimination note (not prediction accuracy)
    const totalRuns = familySummaries.reduce((s, f) => s + f.total_runs, 0);
    const correctPhaseSeparations = familySummaries.filter(s =>
        s.baseline_flow_mode     === "oscillatory_exchange" &&
        s.return_flow_mode       === "oscillatory_exchange" &&
        s.perturbation_flow_mode !== "oscillatory_exchange"
    ).length;
    const diagnosticDiscrimination = familySummaries.filter(
        s => s.exchange_persistence_class === "exchange_recovers_on_return").length;

    return {
        perturbation_families_tested: familySummaries.map(s => s.perturbation_family),
        recovery_families:            recoveryFamilies,
        non_recovery_families:        nonRecoveryFamilies,
        stable_families:              stableFamilies,
        resilience_surface_class:     resilience,
        families_with_clean_phase_separation: correctPhaseSeparations,
        total_families:               familySummaries.length,
        total_runs:                   totalRuns,
        interpretation:               interpretCrossFamilySummary(resilience, recoveryFamilies, nonRecoveryFamilies, familySummaries),
        not_canon:                    true,
        not_prediction:               true,
        not_promotion:                true,
        diagnostic_posture:           "cross-family replay resilience summary — provisional, probe-local, non-canonical",
        deferred_axes: [
            "phase_ratio_disruption — scale is fixed to N=32 for this probe family; varying it mid-run would conflate lens change with structural change",
        ],
    };
}

function interpretCrossFamilySummary(resilienceClass, recoveryFamilies, nonRecovery, summaries) {
    if (resilienceClass === "broad_recovery_pattern") {
        return `oscillatory exchange recovers from all tested perturbation families [${recoveryFamilies.join(", ")}] — the exchange condition is structurally robust across multiple independent disruption axes; recovery is not axis-specific but reflects a broader resilience surface (provisional, probe-local, non-canonical)`;
    }
    if (resilienceClass === "fragile_exchange_regime") {
        return `oscillatory exchange does not recover from any tested perturbation — exchange condition is structurally fragile`;
    }
    if (resilienceClass === "mostly_recoverable") {
        return `oscillatory exchange recovers from most families (${recoveryFamilies.join(", ")}) but not from [${nonRecovery.join(", ")}] — partial resilience surface`;
    }
    return `mixed resilience — inspect individual family summaries`;
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
function meanArr(arr)  { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function stdArr(arr)   {
    const m = meanArr(arr);
    return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length || 1));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    const totalFamilies = PERTURBATION_FAMILIES.length;
    const totalRuns     = totalFamilies * 3 * RUNS_PER_PHASE;

    console.log("Replay Resilience Surface Probe — Door One Read-Side Only");
    console.log(`  output dir   : ${OUTPUT_DIR}`);
    console.log(`  families     : ${totalFamilies}  [amplitude, boundary_detuning, harmonic_offset, noise_depth]`);
    console.log(`  runs total   : ${totalRuns}  (${RUNS_PER_PHASE}/phase × 3 phases × ${totalFamilies} families)`);
    console.log(`  scale_N=${SCALE_N}, phase_ratio=${PHASE_RATIO}, target_edge=16Hz`);
    console.log();

    const allRunRows       = [];
    const familySummaries  = [];
    let globalSeqIdx = 0;

    for (const family of PERTURBATION_FAMILIES) {
        console.log(`Family: ${family.family_id}  [axis: ${family.perturbation_axis}]`);
        const familyRows = [];

        for (const phaseSpec of family.phases) {
            for (let ri = 0; ri < RUNS_PER_PHASE; ri++) {
                const sourceId = `rrs.${family.family_id}.${phaseSpec.phase}.r${ri}.seq${globalSeqIdx}`;
                const result   = runPipeline(phaseSpec.config, sourceId);
                const row      = buildRunRow(
                    family.family_id, family.perturbation_axis,
                    phaseSpec.phase, ri, globalSeqIdx,
                    phaseSpec.config, phaseSpec.perturbation_label,
                    result
                );
                familyRows.push(row);
                allRunRows.push(row);
                globalSeqIdx++;
                const flag = row.splitting_observed ? " SPLIT" : "      ";
                console.log(`  [${String(row.replay_sequence_index).padStart(3)}] ` +
                    `${row.run_label.padEnd(30)} flow=${row.flow_mode.padEnd(22)} ` +
                    `osc=${row.oscillatory_flow_strength.toFixed(4)} basins=${row.basin_count}${flag}`);
            }
        }

        const summary = buildFamilySummary(family.family_id, family.perturbation_axis, familyRows);
        familySummaries.push(summary);
        console.log(`  → ${summary.exchange_persistence_class}  [hint: ${summary.resilience_surface_hint}]\n`);
    }

    const crossFamilySummary = buildCrossFamilySummary(familySummaries);

    // ── Console cross-family output ───────────────────────────────────────────
    console.log("═".repeat(80));
    console.log("CROSS-FAMILY RESILIENCE SUMMARY");
    console.log("─".repeat(80));
    console.log(`  resilience_surface_class : ${crossFamilySummary.resilience_surface_class}`);
    console.log(`  recovery_families        : [${crossFamilySummary.recovery_families.join(", ")}]`);
    console.log(`  non_recovery_families    : [${crossFamilySummary.non_recovery_families.join(", ")}]`);
    console.log();
    for (const s of familySummaries) {
        console.log(`  [${s.perturbation_family.padEnd(20)}] ${s.exchange_persistence_class.padEnd(35)} ` +
            `baseline:${s.baseline_flow_mode.substring(0,4)} pert:${s.perturbation_flow_mode.substring(0,4)} return:${s.return_flow_mode.substring(0,4)}`);
    }
    console.log();
    console.log(`  ${crossFamilySummary.interpretation}`);
    console.log(`\n  Posture: ${crossFamilySummary.diagnostic_posture}`);
    console.log(`  Deferred: ${crossFamilySummary.deferred_axes[0]}`);

    // ── Write outputs ─────────────────────────────────────────────────────────
    const report = {
        probe_type:    "replay_resilience_surface_probe",
        probe_version: "0.1.0",
        generated_from:
            "Door One replay resilience surface probe — read-side only, not canon, not prediction",
        generated_at:  new Date().toISOString(),
        constitutional_posture: {
            runtime_below_canon:              true,
            cross_run_observational_only:     true,
            replay_lens_bound:                true,
            basin_org_not_ontology:           true,
            flow_mode_not_runtime_authority:  true,
            resilience_class_not_runtime:     true,
            no_workbench_effects:             true,
            no_canon_minting:                 true,
            no_prediction_claims:             true,
            findings_provisional:             true,
            findings_probe_local:             true,
            findings_non_canonical:           true,
        },
        probe_config: {
            scale_N:           SCALE_N,
            phase_ratio:       PHASE_RATIO,
            Fs_hz:             FS_RAW,
            band_edges:        BAND_EDGES,
            target_edge_hz:    16,
            basin_threshold:   BASIN_SIMILARITY_THRESHOLD,
            runs_per_phase:    RUNS_PER_PHASE,
            perturbation_families: PERTURBATION_FAMILIES.map(f => ({
                family_id: f.family_id, axis: f.perturbation_axis,
                phases: f.phases.map(p => ({
                    phase: p.phase,
                    config: p.config,
                    perturbation_label: p.perturbation_label ?? p.phase,
                })),
            })),
            flow_thresholds: {
                osc_strong:    OFC_STRONG_THRESHOLD,
                osc_weak:      OFC_WEAK_THRESHOLD,
                lag1_ac:       LAG1_AC_THRESHOLD,
                flip_rate_alt: FLIP_RATE_ALT,
                flip_rate_stable: FLIP_RATE_STABLE,
            },
            deferred_axes: crossFamilySummary.deferred_axes,
        },
        per_run_rows:         allRunRows,
        family_summaries:     familySummaries,
        cross_family_summary: crossFamilySummary,
    };

    const reportPath = `${OUTPUT_DIR}/replay_resilience_surface_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. BasinOp unchanged. No runtime authority modified. Read-side only.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
