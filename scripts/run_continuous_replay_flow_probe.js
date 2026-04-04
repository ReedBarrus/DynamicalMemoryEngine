// scripts/run_continuous_replay_flow_probe.js
//
// Continuous Replay Flow Probe — Door One Read-Side Only
//
// Constitutional posture:
//   - Runtime remains below canon.
//   - Cross-run remains observational only.
//   - Replay remains lens-bound.
//   - Basin organization is substrate-side structural organization, not ontology.
//   - flow_mode is a read-side diagnostic observation; it does not enter runtime
//     authority, BasinOp contracts, workbench readiness, or promotion logic.
//   - "classification" / "diagnostic separation" language only — not "prediction".
//
// Primary question:
//   Does oscillatory exchange persist, weaken, disappear, or reappear across
//   baseline → perturbation → return under continuous replay?
//
// Replay structure (mirrors README_DoorOneContinuousReplayExperiment.md §7):
//   Phase A — baseline:     3 runs  — canonical splitting configuration
//   Phase B — perturbation: 3 runs  — one controlled perturbation axis (amplitude)
//   Phase C — return:       3 runs  — return to baseline configuration
//
//   Perturbation axis: harmonic amplitude shift from the splitting window (0.50)
//   to outside the splitting window (0.75). This is the single bounded perturbation
//   already characterised in the harmonic placement resonance probe.
//
// Each run uses an independent noise seed (derived from run_index + phase) to
// simulate repeated measurement runs while remaining deterministic and honest.
// All runs share the same signal structure; variation is noise-level only within
// each phase, and structural (amplitude) across phases.
//
// Source lineage:
//   All runs are synthetic (no real device). Provenance is declared per run via
//   source_id, run_label, phase_label, and replay_sequence_index. Receipt
//   references are the source_ids that uniquely identify each run.
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
//   node scripts/run_continuous_replay_flow_probe.js
//
// Optional env:
//   PROBE_CRP_OUTPUT_DIR — override ./out_experiments/continuous_replay_flow_probe

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }    from "../operators/ingest/IngestOp.js";
import { ClockAlignOp } from "../operators/clock/ClockAlignOp.js";
import { WindowOp }    from "../operators/window/WindowOp.js";
import { TransformOp } from "../operators/transform/TransformOp.js";
import { CompressOp }  from "../operators/compress/CompressOp.js";
import { BasinOp }     from "../operators/basin/BasinOp.js";

const OUTPUT_DIR = process.env.PROBE_CRP_OUTPUT_DIR
    ?? "./out_experiments/continuous_replay_flow_probe";

// ─── Fixed parameters (identical to directional flow probe — same lens) ───────
const FS_RAW    = 256;
const DURATION  = 4;
const SCALE_N   = 32;
const HOP_N     = Math.floor(SCALE_N / 2);
const BAND_EDGES = [0, 16, 32, 48, 64, 80, 96, 112, 128];
const BASIN_SIMILARITY_THRESHOLD = 0.5;
const PHASE_RATIO = (SCALE_N / FS_RAW) / (1 / 8);   // = 1.0

// Flow thresholds (identical to directional flow probe — same classification rule)
const OFC_STRONG_THRESHOLD = 0.15;
const OFC_WEAK_THRESHOLD   = 0.02;
const LAG1_AC_THRESHOLD    = 0.90;
const FLIP_RATE_ALT        = 0.45;
const FLIP_RATE_STABLE     = 0.05;

// ─── Replay session definition ────────────────────────────────────────────────
//
// Each run spec declares its phase, configuration, and a unique source_id that
// serves as the run's lineage anchor (receipt reference).
//
// Perturbation axis: harmonic amplitude.
//   Baseline:     amp = 0.50  (inside the splitting window [0.35, 0.60])
//   Perturbation: amp = 0.75  (outside the splitting window — one_way_drift expected)
//   Return:       amp = 0.50  (back to baseline — oscillatory_exchange expected to recover)
//
// Run count: 3 per phase = 9 runs total (minimum per README §7).
// Each run has a distinct noise seed (run_index-derived) for honest independence.

const REPLAY_PHASES = [
    {
        phase_label: "baseline",
        replay_phase: "baseline",
        runs: 3,
        config: { harmonic_hz: 16, harmonic_amp: 0.50 },
        description: "Canonical splitting configuration — oscillatory_exchange expected",
    },
    {
        phase_label: "perturbation",
        replay_phase: "perturbation",
        runs: 3,
        config: { harmonic_hz: 16, harmonic_amp: 0.75 },
        description: "Amplitude moved outside splitting window — exchange_lost_under_perturbation expected",
    },
    {
        phase_label: "return",
        replay_phase: "return",
        runs: 3,
        config: { harmonic_hz: 16, harmonic_amp: 0.50 },
        description: "Return to baseline amplitude — exchange_recovers_on_return expected",
    },
];

// Build the full run sequence
function buildRunSequence() {
    const runs = [];
    let seqIdx = 0;
    for (const phase of REPLAY_PHASES) {
        for (let ri = 0; ri < phase.runs; ri++) {
            runs.push({
                replay_phase:           phase.replay_phase,
                phase_label:            phase.phase_label,
                replay_sequence_index:  seqIdx,
                run_index_in_phase:     ri,
                run_label:              `${phase.phase_label}_run${ri + 1}`,
                source_id:              `replay.crp.${phase.phase_label}.r${ri}.seed${seqIdx}`,
                harmonic_hz:            phase.config.harmonic_hz,
                harmonic_amp:           phase.config.harmonic_amp,
                description:            phase.description,
                target_edge:            16,
            });
            seqIdx++;
        }
    }
    return runs;
}

// ─── Signal generator with run-specific noise seed ────────────────────────────
function generateSignalForRun(run) {
    const { harmonic_hz, harmonic_amp, source_id } = run;
    const n = Math.floor(DURATION * FS_RAW);
    const values = new Array(n), timestamps = new Array(n);
    // Deterministic seed from source_id (each run gets distinct noise)
    let ns = 0;
    for (let c = 0; c < source_id.length; c++) ns = (ns * 31 + source_id.charCodeAt(c)) >>> 0;
    function nextNoise() { ns = (ns * 1664525 + 1013904223) >>> 0; return (ns / 4294967296 - 0.5) * 2; }
    for (let i = 0; i < n; i++) {
        const t = i / FS_RAW;
        values[i] = 1.0 * Math.sin(2 * Math.PI * 8 * t)
                  + harmonic_amp * Math.sin(2 * Math.PI * harmonic_hz * t)
                  + nextNoise() * 0.02;
        timestamps[i] = t;
    }
    return { values, timestamps };
}

// ─── Pipeline runner ──────────────────────────────────────────────────────────
function runPipelineForRun(run) {
    const { values, timestamps } = generateSignalForRun(run);
    const maxBins = Math.floor(SCALE_N / 2);

    const a1r = new IngestOp().run({
        timestamps, values, source_id: run.source_id,
        channel: "ch0", modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS_RAW, replay_phase: run.replay_phase },
        clock_policy_id: "clock.crp.v1",
        ingest_policy: { policy_id: "ingest.crp.v1", gap_threshold_multiplier: 3.0,
            allow_non_monotonic: false, allow_empty: false, non_monotonic_mode: "reject" },
    });
    if (!a1r.ok) throw new Error(`IngestOp run ${run.run_label}: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({ a1: a1r.artifact,
        grid_spec: { Fs_target: FS_RAW, t_ref: timestamps[0], grid_policy: "strict",
            drift_model: "none", non_monotonic_policy: "reject", interp_method: "linear",
            gap_policy: "interpolate_small", small_gap_multiplier: 3.0,
            max_gap_seconds: null, anti_alias_filter: false } });
    if (!a2r.ok) throw new Error(`ClockAlignOp run ${run.run_label}: ${a2r.error}`);

    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: {
        mode: "fixed", Fs_target: FS_RAW, base_window_N: SCALE_N, hop_N: HOP_N,
        window_function: "hann", overlap_ratio: 0.5, stationarity_policy: "tolerant",
        salience_policy: "off", gap_policy: "interpolate_small",
        max_missing_ratio: 0.25, boundary_policy: "truncate" } });
    if (!w1r.ok) throw new Error(`WindowOp run ${run.run_label}: ${w1r.error}`);

    const tfOp = new TransformOp(), cpOp = new CompressOp();
    const s1s = [], h1s = [];
    const tfPolicy = { policy_id: "transform.crp.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant" };
    const cpPolicy = { policy_id: "compress.crp.v1", selection_method: "topK",
        budget_K: Math.min(16, maxBins), maxK: Math.min(16, maxBins),
        include_dc: false, invariance_lens: "energy", numeric_policy: "tolerant",
        respect_novelty_boundary: false,
        thresholds: { max_recon_rmse: 999, max_energy_residual: 999, max_band_divergence: 999 } };

    for (let wi = 0; wi < w1r.artifacts.length; wi++) {
        const w1 = w1r.artifacts[wi];
        const tr = tfOp.run({ w1, transform_policy: tfPolicy });
        if (!tr.ok) continue;
        s1s.push(tr.artifact);
        const t_start = w1.grid?.t0 ?? (wi * HOP_N / FS_RAW);
        const cr = cpOp.run({ s1: tr.artifact, compression_policy: cpPolicy,
            context: { segment_id: `seg:${run.source_id}`,
                window_span: { t_start, t_end: t_start + SCALE_N / FS_RAW } } });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null, basinCount = 1;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s,
            basin_policy: { policy_id: "basin.crp.v1",
                similarity_threshold: BASIN_SIMILARITY_THRESHOLD,
                min_member_count: 1, weight_mode: "duration",
                linkage: "single_link", cross_segment: true } });
        if (br.ok) { basinSet = br.artifact; basinCount = br.artifact.basins.length; }
    }

    return { run, s1s, basinSet, basinCount, streamId: a1r.artifact.stream_id };
}

// ─── Band profiles and flow metrics (identical logic to directional flow probe) ─

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

function computeDirectionalFlow(profiles, target_edge) {
    const edgeIdx  = BAND_EDGES.indexOf(target_edge);
    const leftIdx  = edgeIdx - 1;
    const rightIdx = edgeIdx;
    if (edgeIdx <= 0 || edgeIdx >= BAND_EDGES.length - 1) return null;

    const leftSeries  = profiles.map(p => p[leftIdx] ?? 0);
    const rightSeries = profiles.map(p => p[rightIdx] ?? 0);
    const n = leftSeries.length;
    const diffs = leftSeries.map((l, i) => l - rightSeries[i]);

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
    const flowMode = classifyFlowMode(oscStrength, diffLag1AC, flipRate);

    return {
        boundary_band_pair: {
            left_band_hz:  `${BAND_EDGES[leftIdx]}-${target_edge}`,
            right_band_hz: `${target_edge}-${BAND_EDGES[rightIdx + 1]}`,
        },
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
    if (oscStrength < OFC_WEAK_THRESHOLD)    return "weak_or_inert";
    if (oscStrength > OFC_STRONG_THRESHOLD && Math.abs(diffLag1AC) > LAG1_AC_THRESHOLD)
        return "oscillatory_exchange";
    if (flipRate > FLIP_RATE_ALT && oscStrength > OFC_WEAK_THRESHOLD)
        return "oscillatory_exchange";
    return "one_way_drift";
}

// ─── Per-run row builder ──────────────────────────────────────────────────────

function buildRunRow(pipelineResult) {
    const { run, s1s, basinSet, basinCount, streamId } = pipelineResult;
    const profiles = extractWindowProfiles(s1s);
    const flow     = computeDirectionalFlow(profiles, run.target_edge);

    const meanProfile = profiles[0].map((_, i) => meanArr(profiles.map(p => p[i])));
    const iwv = meanArr(profiles.map(p => l1(p, meanProfile)));
    const df = FS_RAW / SCALE_N;
    let rawBandDist = null, normBandDist = null;
    if (basinCount >= 2 && basinSet?.basins?.length >= 2) {
        rawBandDist  = l1(basinSet.basins[0].centroid_band_profile, basinSet.basins[1].centroid_band_profile);
        normBandDist = rawBandDist / df;
    }

    return {
        // Lineage / replay fields
        run_label:             run.run_label,
        replay_phase:          run.replay_phase,
        replay_sequence_index: run.replay_sequence_index,
        run_index_in_phase:    run.run_index_in_phase,
        source_id:             run.source_id,   // receipt reference
        stream_id:             streamId,
        // Configuration
        harmonic_hz:           run.harmonic_hz,
        harmonic_amp:          run.harmonic_amp,
        target_edge_hz:        run.target_edge,
        scale_N:               SCALE_N,
        phase_ratio:           parseFloat(PHASE_RATIO.toFixed(6)),
        harmonic_is_on_band_edge: BAND_EDGES.includes(run.harmonic_hz),
        // Flow fields
        ...(flow ?? {}),
        // Basin context
        basin_count:           basinCount,
        splitting_observed:    basinCount > 1,
        inter_window_variance: parseFloat(iwv.toFixed(6)),
        raw_band_distance:     rawBandDist != null ? parseFloat(rawBandDist.toFixed(6)) : null,
        normalized_band_distance: normBandDist != null ? parseFloat(normBandDist.toFixed(6)) : null,
        bin_width_hz:          df,
        window_count:          s1s.length,
        // Interpretation (structural, non-canonical)
        interpretation: interpretRunRow(run.replay_phase, flow?.flow_mode, basinCount > 1),
    };
}

function interpretRunRow(phase, flowMode, splitting) {
    const phaseNote = `[${phase}]`;
    if (splitting && flowMode === "oscillatory_exchange")
        return `oscillatory cross-boundary exchange sustained ${phaseNote} — basin splitting present`;
    if (!splitting && flowMode === "oscillatory_exchange")
        return `oscillatory exchange without splitting ${phaseNote} — unexpected; inspect amplitude`;
    if (!splitting && flowMode === "one_way_drift")
        return `one-way drift ${phaseNote} — energy imbalance stable, no oscillatory structure; basin consolidation expected`;
    if (!splitting && flowMode === "weak_or_inert")
        return `weak or inert boundary ${phaseNote} — near-zero redistribution`;
    return `flow_mode=${flowMode}, splitting=${splitting} ${phaseNote}`;
}

// ─── Replay summary builder ───────────────────────────────────────────────────

function buildReplaySummary(runRows) {
    // Group by phase
    const byPhase = {};
    for (const row of runRows) {
        if (!byPhase[row.replay_phase]) byPhase[row.replay_phase] = [];
        byPhase[row.replay_phase].push(row);
    }

    // Mode per phase: majority vote
    function modeForPhase(phaseRows) {
        const counts = {};
        for (const r of phaseRows) counts[r.flow_mode] = (counts[r.flow_mode] ?? 0) + 1;
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";
    }
    function meanOfField(rows, field) {
        const vals = rows.map(r => r[field]).filter(v => typeof v === "number");
        return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(6)) : null;
    }

    const baselineMode     = modeForPhase(byPhase.baseline     ?? []);
    const perturbationMode = modeForPhase(byPhase.perturbation ?? []);
    const returnMode       = modeForPhase(byPhase.return       ?? []);

    // exchange_persistence_class
    const exchangeClass = classifyExchangePersistence(
        baselineMode, perturbationMode, returnMode);

    // Flow regime transitions (consecutive run pairs that change flow_mode)
    const allSorted = [...runRows].sort((a, b) => a.replay_sequence_index - b.replay_sequence_index);
    let transitions = 0;
    for (let i = 1; i < allSorted.length; i++) {
        if (allSorted[i].flow_mode !== allSorted[i-1].flow_mode) transitions++;
    }

    // Basin split persistence
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
        replay_session_id:           `crp.session.${Date.now()}`,
        total_runs:                  runRows.length,
        phases_observed:             Object.keys(byPhase),
        // Per-phase flow modes
        baseline_flow_mode:          baselineMode,
        perturbation_flow_mode:      perturbationMode,
        return_flow_mode:            returnMode,
        // Per-phase flow metric means
        baseline_osc_strength_mean:     meanOfField(byPhase.baseline     ?? [], "oscillatory_flow_strength"),
        perturbation_osc_strength_mean: meanOfField(byPhase.perturbation ?? [], "oscillatory_flow_strength"),
        return_osc_strength_mean:       meanOfField(byPhase.return       ?? [], "oscillatory_flow_strength"),
        baseline_lag1_ac_mean:     meanOfField(byPhase.baseline     ?? [], "diff_lag1_autocorr"),
        perturbation_lag1_ac_mean: meanOfField(byPhase.perturbation ?? [], "diff_lag1_autocorr"),
        return_lag1_ac_mean:       meanOfField(byPhase.return       ?? [], "diff_lag1_autocorr"),
        // Exchange persistence
        exchange_persistence_class: exchangeClass,
        flow_regime_transition_count: transitions,
        // Basin split persistence
        basin_split_persistence_summary: {
            baseline:     `${splitCounts.baseline}/${totalPerPhase.baseline} runs split`,
            perturbation: `${splitCounts.perturbation}/${totalPerPhase.perturbation} runs split`,
            return:       `${splitCounts.return}/${totalPerPhase.return} runs split`,
        },
        // Structural interpretation (bounded, non-canonical)
        interpretation: interpretReplaySummary(exchangeClass, baselineMode, perturbationMode, returnMode),
        // Explicit posture
        not_canon:                    true,
        not_prediction:               true,
        not_promotion:                true,
        diagnostic_posture:           "read-side structural observation — flow_mode is a diagnostic classification, not a runtime authority or canon marker",
    };
}

function classifyExchangePersistence(baselineMode, perturbationMode, returnMode) {
    const baseOsc   = baselineMode     === "oscillatory_exchange";
    const pertOsc   = perturbationMode === "oscillatory_exchange";
    const retOsc    = returnMode       === "oscillatory_exchange";

    if (baseOsc && pertOsc && retOsc)   return "stable_persistent_exchange";
    if (baseOsc && !pertOsc && retOsc)  return "exchange_recovers_on_return";
    if (baseOsc && !pertOsc && !retOsc) return "exchange_lost_under_perturbation";
    if (!baseOsc && !pertOsc && !retOsc) return "weak_or_inert_throughout";
    if (baseOsc && pertOsc && !retOsc)  return "exchange_lost_on_return";
    return "unresolved";
}

function interpretReplaySummary(exchangeClass, baselineMode, perturbationMode, returnMode) {
    switch (exchangeClass) {
        case "stable_persistent_exchange":
            return "oscillatory cross-boundary exchange persists across all phases — structural flow topology unchanged by the perturbation";
        case "exchange_recovers_on_return":
            return `oscillatory exchange present in baseline (${baselineMode}), absent under perturbation (${perturbationMode}), recovers on return (${returnMode}) — perturbation disrupts and return restores the exchange condition`;
        case "exchange_lost_under_perturbation":
            return `oscillatory exchange present in baseline, lost under perturbation and not recovered — return does not restore the exchange condition`;
        case "exchange_lost_on_return":
            return `exchange persists through perturbation but is lost on return — unexpected; inspect return configuration`;
        case "weak_or_inert_throughout":
            return "no oscillatory exchange at any phase — boundary remains structurally inert across all replay conditions";
        default:
            return `unresolved exchange persistence — inspect per-run flow_mode values; baseline=${baselineMode}, perturbation=${perturbationMode}, return=${returnMode}`;
    }
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

    const runs = buildRunSequence();

    console.log("Continuous Replay Flow Probe — Door One Read-Side Only");
    console.log(`  output dir : ${OUTPUT_DIR}`);
    console.log(`  total runs : ${runs.length}  (3 baseline, 3 perturbation, 3 return)`);
    console.log(`  perturbation axis: harmonic amplitude  0.50 → 0.75 → 0.50`);
    console.log(`  scale_N=${SCALE_N}, phase_ratio=${PHASE_RATIO}, target_edge=16Hz`);
    console.log();

    // ── Run all ───────────────────────────────────────────────────────────────
    const runRows = [];
    for (const run of runs) {
        const result = runPipelineForRun(run);
        const row    = buildRunRow(result);
        runRows.push(row);
        const flag = row.splitting_observed ? " SPLIT" : "      ";
        console.log(`  [${String(row.replay_sequence_index).padStart(2)}] ${row.run_label.padEnd(22)} ` +
            `phase=${row.replay_phase.padEnd(13)} amp=${row.harmonic_amp} ` +
            `flow_mode=${row.flow_mode.padEnd(22)} osc=${row.oscillatory_flow_strength.toFixed(4)} ` +
            `basins=${row.basin_count}${flag}`);
    }

    // ── Build replay summary ──────────────────────────────────────────────────
    const replaySummary = buildReplaySummary(runRows);

    // ── Console ───────────────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(80));
    console.log("REPLAY SUMMARY");
    console.log("─".repeat(80));
    console.log(`  baseline_flow_mode     : ${replaySummary.baseline_flow_mode}`);
    console.log(`  perturbation_flow_mode : ${replaySummary.perturbation_flow_mode}`);
    console.log(`  return_flow_mode       : ${replaySummary.return_flow_mode}`);
    console.log(`  exchange_persistence   : ${replaySummary.exchange_persistence_class}`);
    console.log(`  regime_transitions     : ${replaySummary.flow_regime_transition_count}`);
    console.log(`  basin_splits:`);
    for (const [ph, s] of Object.entries(replaySummary.basin_split_persistence_summary)) {
        console.log(`    ${ph.padEnd(14)}: ${s}`);
    }
    console.log(`\n  ${replaySummary.interpretation}`);
    console.log(`\n  Posture: ${replaySummary.diagnostic_posture}`);

    // ── Write outputs ─────────────────────────────────────────────────────────
    const report = {
        probe_type:    "continuous_replay_flow_probe",
        probe_version: "0.1.0",
        generated_from:
            "Door One continuous replay flow probe — read-side only, not canon, not prediction",
        generated_at:  new Date().toISOString(),
        constitutional_posture: {
            runtime_below_canon:              true,
            cross_run_observational_only:     true,
            replay_lens_bound:                true,
            basin_org_not_ontology:           true,
            flow_mode_not_runtime_authority:  true,
            no_workbench_effects:             true,
            no_canon_minting:                 true,
            no_prediction_claims:             true,
        },
        probe_config: {
            scale_N:             SCALE_N,
            phase_ratio:         PHASE_RATIO,
            Fs_hz:               FS_RAW,
            band_edges:          BAND_EDGES,
            target_edge_hz:      16,
            basin_threshold:     BASIN_SIMILARITY_THRESHOLD,
            perturbation_axis:   "harmonic_amplitude",
            baseline_config:     { harmonic_hz: 16, harmonic_amp: 0.50 },
            perturbation_config: { harmonic_hz: 16, harmonic_amp: 0.75 },
            return_config:       { harmonic_hz: 16, harmonic_amp: 0.50 },
            runs_per_phase:      3,
            flow_thresholds: {
                osc_strong:    OFC_STRONG_THRESHOLD,
                osc_weak:      OFC_WEAK_THRESHOLD,
                lag1_ac:       LAG1_AC_THRESHOLD,
                flip_rate_alt: FLIP_RATE_ALT,
                flip_rate_stable: FLIP_RATE_STABLE,
            },
            source_note: "synthetic signal — noise seed varies per run for honest independence; structural config (harmonic_hz, harmonic_amp) is constant within phase",
        },
        per_run_rows:   runRows,
        replay_summary: replaySummary,
    };

    const reportPath = `${OUTPUT_DIR}/continuous_replay_flow_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. No pipeline state was mutated. BasinOp unchanged. No runtime authority modified.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
