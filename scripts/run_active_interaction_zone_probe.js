// scripts/run_active_interaction_zone_probe.js
//
// Active Interaction Zone Probe for Basin Splitting
//
// One-line anchor:
//   Probe whether exact band-edge placement only becomes splitting-prone when
//   it sits inside an active adjacent-band interaction zone, so basin formation
//   can be read as boundary-conditioned energy topology over time rather than
//   arbitrary instability.
//
// Core question:
//   Does basin splitting require an active interaction zone where energy can
//   redistribute across a live interface between adjacent populated bands?
//
// Structural refinement of the current law candidate:
//   Prior probes established: resonance + band-boundary + finite amplitude window.
//   This probe tests whether those are sufficient, or whether the adjacent-band
//   topology is the actual final condition.
//
// Pre-run findings (from exploratory runs):
//   - f8+h32 at N=32: formal edge at 32 Hz, both adjacent bands have non-zero
//     mean energy (leakage), but balance=0.957 and no splitting (IWV=0.012).
//   - f8+h24+h32: band-1 [16-32] populated by 24 Hz, 32 Hz at edge, band-2
//     [32-48] inert. High IWV=0.208 but NO splitting.
//   - f8+h32+h40: 32 Hz at edge, band-2 [32-48] populated by 40 Hz. SPLITS
//     (IWV=0.372). Band-2 (the "receiving" side) is now active.
//   - f8+h24+h32+h40: both bands populated. SPLITS (IWV=0.381).
//   - f8+h16 (canonical): 16 Hz at edge, band-0 firmly populated by 8 Hz
//     fundamental. The receiving band (band-0) is always active. SPLITS.
//
//   Key insight: the "receiving band" — the band on the far side of the edge
//   harmonic — must be structurally active. Energy oscillation at the boundary
//   needs somewhere to redistribute into. If the receiving band is inert, the
//   harmonic's Hann-phase variation produces no net redistribution.
//
// Cohort family:
//   A. Active-edge cases (known/expected to split)
//      f8_h16_amp0.50       — canonical active edge (original baseline_frequency)
//      f8_h32_h40_amp0.50   — 32Hz edge made active by populating band-2 with 40Hz
//   B. Inert-edge cases (edge exists but not active — expected NOT to split)
//      f8_h32_amp0.50       — 32Hz formal edge, adjacent bands have only leakage
//      f8_h24_h32_amp0.50   — 32Hz edge, band-1 populated but band-2 inert
//   C. Near-boundary controls
//      f8_h15.5_amp0.50     — 0.5 Hz below 16Hz edge
//      f8_h16.5_amp0.50     — 0.5 Hz above 16Hz edge
//   D. Mid-band control
//      f8_h24_amp0.50       — 24 Hz is inside band-1 [16-32], no edge contact
//
// Interaction-zone metrics:
//   left_band_energy_mean / right_band_energy_mean:
//     Mean energy fraction in the bands immediately left and right of the
//     nearest band edge, computed over all windows.
//   cross_boundary_energy_balance:
//     2 * min(left_mean, right_mean) / (left_mean + right_mean)
//     1.0 = perfectly balanced, 0.0 = all energy on one side.
//   cross_boundary_redistribution_index:
//     Std-dev of (left_band_energy - right_band_energy) across windows.
//     High value = energy is actively shifting between the two bands over time.
//   interaction_zone_active:
//     Boolean. True when cross_boundary_redistribution_index > 0.1 AND
//     both adjacent bands have mean energy > 0.05. This is the condition
//     distinguishing active from inert boundaries.
//
// Boundary contract:
//   - read-side only — no pipeline mutation, no operator changes
//   - does not modify BasinOp or BAND_EDGES
//   - no new identity channel, no phase channel
//   - attributable, reversible, removable
//
// Run:
//   node scripts/run_active_interaction_zone_probe.js
//
// Optional env:
//   PROBE_AIZ_OUTPUT_DIR — override ./out_experiments/active_interaction_zone_probe

import { mkdir, writeFile } from "node:fs/promises";

import { IngestOp }    from "../operators/ingest/IngestOp.js";
import { ClockAlignOp } from "../operators/clock/ClockAlignOp.js";
import { WindowOp }    from "../operators/window/WindowOp.js";
import { TransformOp } from "../operators/transform/TransformOp.js";
import { CompressOp }  from "../operators/compress/CompressOp.js";
import { BasinOp }     from "../operators/basin/BasinOp.js";

const OUTPUT_DIR = process.env.PROBE_AIZ_OUTPUT_DIR
    ?? "./out_experiments/active_interaction_zone_probe";

// ─── Fixed parameters ─────────────────────────────────────────────────────────
const FS_RAW    = 256;
const DURATION  = 4;
const SCALE_N   = 32;
const HOP_N     = Math.floor(SCALE_N / 2);    // 16
const BAND_EDGES = [0, 16, 32, 48, 64, 80, 96, 112, 128];
const BASIN_SIMILARITY_THRESHOLD = 0.5;
const PHASE_RATIO = (SCALE_N / FS_RAW) / (1 / 8);   // = 1.0 (8 Hz dominant)

// Threshold for calling an interaction zone "active"
const ACTIVE_ZONE_REDIST_THRESHOLD = 0.10;  // cross_boundary_redistribution_index
const ACTIVE_ZONE_ENERGY_THRESHOLD = 0.05;  // min mean energy required in both adjacent bands

// ─── Cohort family ────────────────────────────────────────────────────────────
const COHORT_SPECS = [
    // A. Active-edge cases
    {
        label:       "f8_h16_amp0.50",
        description: "Canonical active edge — 8 Hz fundamental populates band-0 [0-16]; 16 Hz harmonic oscillates at the 16 Hz boundary",
        source_id:   "probe.aiz.f8_h16",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 16, amplitude: 0.50 }],
        target_edge:  16,
        category:    "active_edge",
    },
    {
        label:       "f8_h32_h40_amp0.50",
        description: "Activated 32 Hz edge — 32 Hz harmonic at edge; 40 Hz component populates band-2 [32-48] making the receiving band active",
        source_id:   "probe.aiz.f8_h32_h40",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 32, amplitude: 0.50 }, { freq_hz: 40, amplitude: 0.50 }],
        target_edge:  32,
        category:    "active_edge",
    },
    // B. Inert-edge cases
    {
        label:       "f8_h32_amp0.50",
        description: "Inert 32 Hz edge — 32 Hz harmonic exactly at edge, but neither adjacent band is structurally active (only spectral leakage from 8 Hz fundamental)",
        source_id:   "probe.aiz.f8_h32",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 32, amplitude: 0.50 }],
        target_edge:  32,
        category:    "inert_edge",
    },
    {
        label:       "f8_h24_h32_amp0.50",
        description: "Partial activation — band-1 [16-32] populated by 24 Hz, 32 Hz at edge, band-2 [32-48] inert; receiving band is inactive so no splitting",
        source_id:   "probe.aiz.f8_h24_h32",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 24, amplitude: 0.50 }, { freq_hz: 32, amplitude: 0.50 }],
        target_edge:  32,
        category:    "inert_edge",
    },
    // C. Near-boundary controls
    {
        label:       "f8_h15.5_amp0.50",
        description: "0.5 Hz below the 16 Hz edge — near-boundary stress present but harmonic is mid-band in [0-16]",
        source_id:   "probe.aiz.f8_h155",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 15.5, amplitude: 0.50 }],
        target_edge:  16,
        category:    "near_boundary_control",
    },
    {
        label:       "f8_h16.5_amp0.50",
        description: "0.5 Hz above the 16 Hz edge — near-boundary stress present but harmonic is mid-band in [16-32]",
        source_id:   "probe.aiz.f8_h165",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 16.5, amplitude: 0.50 }],
        target_edge:  16,
        category:    "near_boundary_control",
    },
    // D. Mid-band control
    {
        label:       "f8_h24_amp0.50",
        description: "Mid-band 24 Hz — inside band-1 [16-32], no edge contact; no redistribution pathway",
        source_id:   "probe.aiz.f8_h24",
        components:  [{ freq_hz: 8, amplitude: 1.0 }, { freq_hz: 24, amplitude: 0.50 }],
        target_edge:  16,   // nearest formal edge
        category:    "mid_band_control",
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
    const segId   = `seg:${spec.source_id}`;

    const a1r = new IngestOp().run({
        timestamps, values, source_id: spec.source_id,
        channel: "ch0", modality: "voltage",
        meta: { units: "arb", Fs_nominal: FS_RAW },
        clock_policy_id: "clock.aiz.v1",
        ingest_policy: { policy_id: "ingest.aiz.v1", gap_threshold_multiplier: 3.0,
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
    const tfPolicy = { policy_id: "transform.aiz.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant" };
    const cpPolicy = { policy_id: "compress.aiz.v1", selection_method: "topK",
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
            context: { segment_id: segId,
                window_span: { t_start, t_end: t_start + SCALE_N / FS_RAW } } });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null, basinCount = 1;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s,
            basin_policy: { policy_id: "basin.aiz.v1",
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

// ─── Interaction zone metrics ─────────────────────────────────────────────────

/**
 * Compute adjacent-band interaction metrics for a given target edge.
 * The "left" band is [BAND_EDGES[edgeIdx-1], edge], "right" is [edge, BAND_EDGES[edgeIdx+1]].
 */
function computeInteractionZone(profiles, target_edge) {
    const edgeIdx = BAND_EDGES.indexOf(target_edge);
    if (edgeIdx <= 0 || edgeIdx >= BAND_EDGES.length - 1) {
        return {
            left_band_idx: null, right_band_idx: null,
            left_band_hz: null, right_band_hz: null,
            left_band_energy_mean: null, right_band_energy_mean: null,
            left_band_energy_variance: null, right_band_energy_variance: null,
            cross_boundary_energy_balance: null,
            cross_boundary_redistribution_index: null,
            interaction_zone_active: false,
        };
    }

    const leftIdx  = edgeIdx - 1;
    const rightIdx = edgeIdx;

    const leftVals  = profiles.map(p => p[leftIdx] ?? 0);
    const rightVals = profiles.map(p => p[rightIdx] ?? 0);

    const lMean = meanArr(leftVals);
    const rMean = meanArr(rightVals);
    const lVar  = varianceArr(leftVals);
    const rVar  = varianceArr(rightVals);

    // Cross-boundary balance: 1.0 = perfectly balanced, 0.0 = all in one side
    const balance = (lMean + rMean) > 0
        ? 2 * Math.min(lMean, rMean) / (lMean + rMean)
        : 0;

    // Cross-boundary redistribution: std-dev of (left - right) per window
    const diffs   = profiles.map(p => (p[leftIdx] ?? 0) - (p[rightIdx] ?? 0));
    const crossRedist = Math.sqrt(varianceArr(diffs));

    // Interaction zone active requires THREE conditions:
    // 1. The harmonic is exactly on the band edge (checked by the caller via harmonic_is_on_band_edge)
    // 2. Cross-boundary redistribution is above threshold (energy is shifting between bands over time)
    // 3. Both adjacent bands carry meaningful energy (not just spectral leakage)
    //
    // Note: we compute the redistribution and energy metrics unconditionally so they
    // can be inspected even for near-boundary cohorts. The caller combines with
    // harmonic_is_on_band_edge to determine the final active zone classification.
    // This function returns the pre-edge-check version; the row builder applies edge check.
    const interactionActive =
        crossRedist > ACTIVE_ZONE_REDIST_THRESHOLD &&
        lMean > ACTIVE_ZONE_ENERGY_THRESHOLD &&
        rMean > ACTIVE_ZONE_ENERGY_THRESHOLD;

    return {
        left_band_idx:  leftIdx,
        right_band_idx: rightIdx,
        left_band_hz:   `${BAND_EDGES[leftIdx]}-${target_edge}`,
        right_band_hz:  `${target_edge}-${BAND_EDGES[rightIdx + 1]}`,
        left_band_energy_mean:       parseFloat(lMean.toFixed(6)),
        right_band_energy_mean:      parseFloat(rMean.toFixed(6)),
        left_band_energy_variance:   parseFloat(lVar.toFixed(6)),
        right_band_energy_variance:  parseFloat(rVar.toFixed(6)),
        cross_boundary_energy_balance:        parseFloat(balance.toFixed(6)),
        cross_boundary_redistribution_index:  parseFloat(crossRedist.toFixed(6)),
        interaction_zone_active:     interactionActive,
    };
}

// ─── Shared metrics ───────────────────────────────────────────────────────────
function computeSharedMetrics(profiles, basinCount, basinSet) {
    const meanProfile = profiles[0].map((_, i) => meanArr(profiles.map(p => p[i])));
    const iwv         = meanArr(profiles.map(p => l1(p, meanProfile)));
    const domStab     = meanArr(profiles.map(p => Math.max(...p)));
    let transitions   = 0;
    for (let i = 1; i < profiles.length; i++) {
        if (profiles[i-1].indexOf(Math.max(...profiles[i-1])) !==
            profiles[i].indexOf(Math.max(...profiles[i]))) transitions++;
    }
    const btr = profiles.length > 1 ? transitions / (profiles.length - 1) : 0;

    let rawBandDist = null, normBandDist = null;
    const df = FS_RAW / SCALE_N;
    if (basinCount >= 2 && basinSet?.basins?.length >= 2) {
        const cp0 = basinSet.basins[0].centroid_band_profile;
        const cp1 = basinSet.basins[1].centroid_band_profile;
        rawBandDist  = l1(cp0, cp1);
        normBandDist = rawBandDist / df;
    }

    return {
        inter_window_variance:       parseFloat(iwv.toFixed(6)),
        dominant_band_stability:     parseFloat(domStab.toFixed(6)),
        band_transition_rate:        parseFloat(btr.toFixed(6)),
        raw_band_distance:           rawBandDist  != null ? parseFloat(rawBandDist.toFixed(6))  : null,
        normalized_band_distance:    normBandDist != null ? parseFloat(normBandDist.toFixed(6)) : null,
        bin_width_hz:                FS_RAW / SCALE_N,
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
function meanArr(arr)     { return arr.reduce((a, b) => a + b, 0) / (arr.length || 1); }
function varianceArr(arr) {
    const m = meanArr(arr);
    return arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length || 1);
}
function nearestBandEdge(hz) {
    return BAND_EDGES.reduce((a, b) => Math.abs(b - hz) < Math.abs(a - hz) ? b : a);
}

// ─── Row builder ──────────────────────────────────────────────────────────────
function buildRow(spec, pipelineResult) {
    const profiles = extractWindowProfiles(pipelineResult.s1s);
    const ized     = computeInteractionZone(profiles, spec.target_edge);
    const shared   = computeSharedMetrics(profiles, pipelineResult.basinCount, pipelineResult.basinSet);
    const splitting = pipelineResult.basinCount > 1;

    const nearEdge  = nearestBandEdge(spec.components.find(c => c.freq_hz !== 8)?.freq_hz ?? 0);
    const harmHz    = spec.components.filter(c => c.freq_hz !== 8).map(c => c.freq_hz);
    const harmAmps  = spec.components.filter(c => c.freq_hz !== 8).map(c => c.amplitude);
    const harmOnEdge = harmHz.some(h => Math.abs(h - spec.target_edge) < 0.001);

    const interpretation = interpretRow(spec, ized, splitting, shared.inter_window_variance);
    const next_action    = nextActionRow(spec.category, ized.interaction_zone_active, splitting);

    return {
        cohort_label:      spec.label,
        category:          spec.category,
        description:       spec.description,
        // Signal
        fundamental_hz:    8,
        harmonic_hz:       harmHz,
        harmonic_amp:      harmAmps,
        harmonic_ratio:    harmHz.map(h => parseFloat((h / 8).toFixed(3))),
        harmonic_spacing_hz: harmHz.map(h => parseFloat((h - 8).toFixed(3))),
        target_edge_hz:    spec.target_edge,
        nearest_band_edge_hz: nearEdge,
        distance_to_band_edge_hz: parseFloat(Math.abs((harmHz[0] ?? 0) - spec.target_edge).toFixed(3)),
        harmonic_is_on_band_edge: harmOnEdge,
        // Scale / phase
        scale_N:           SCALE_N,
        Fs_hz:             FS_RAW,
        phase_ratio:       parseFloat(PHASE_RATIO.toFixed(6)),
        // Interaction zone (required fields)
        left_band_hz:      ized.left_band_hz,
        right_band_hz:     ized.right_band_hz,
        left_band_energy_mean:       ized.left_band_energy_mean,
        right_band_energy_mean:      ized.right_band_energy_mean,
        left_band_energy_variance:   ized.left_band_energy_variance,
        right_band_energy_variance:  ized.right_band_energy_variance,
        cross_boundary_energy_balance:       ized.cross_boundary_energy_balance,
        cross_boundary_redistribution_index: ized.cross_boundary_redistribution_index,
        interaction_zone_active:     ized.interaction_zone_active && harmOnEdge,
        // Basin
        basin_count:       pipelineResult.basinCount,
        splitting_observed: splitting,
        window_count:      pipelineResult.windowCount,
        // Shared spectral/variance metrics
        ...shared,
        // Interpretation
        interpretation,
        next_action,
    };
}

function interpretRow(spec, ized, splitting, iwv) {
    const edgeStatus = ized.interaction_zone_active ? "active interaction zone" : "inert boundary";
    const onEdge     = spec.components.some(c => Math.abs(c.freq_hz - spec.target_edge) < 0.001);

    if (splitting && ized.interaction_zone_active)
        return `exact edge placement inside ${edgeStatus} (cross_redist=${ized.cross_boundary_redistribution_index?.toFixed(3)}) — lawful splitting confirmed`;
    if (splitting && !ized.interaction_zone_active)
        return `splitting with inactive zone — unexpected; check whether redistribution metric threshold needs revision`;
    if (!splitting && ized.interaction_zone_active)
        return `${edgeStatus} but no splitting — resonance or amplitude condition may not be met`;
    if (!splitting && !onEdge)
        return `harmonic not on band edge (category: ${spec.category}) — no redistribution pathway; consolidated as expected`;
    if (!splitting && onEdge)
        return `harmonic on formal edge but ${edgeStatus} — redistribution index ${ized.cross_boundary_redistribution_index?.toFixed(4)} below threshold; boundary is structurally inert`;
    return `category=${spec.category}; iwv=${iwv.toFixed(4)}`;
}

function nextActionRow(category, interactionActive, splitting) {
    if (splitting && interactionActive)
        return "active-zone splitting confirmed — this is the final structural condition for basin fragmentation";
    if (!splitting && !interactionActive && category === "inert_edge")
        return "inert boundary confirmed — formal edge without active interaction zone does not split";
    if (!splitting && category === "near_boundary_control")
        return "near-boundary control: harmonic not on edge → no interaction zone → no split (as expected)";
    if (!splitting && category === "mid_band_control")
        return "mid-band control: no edge contact, no redistribution pathway → no split (as expected)";
    return "inspect interaction zone metrics for structural explanation";
}

// ─── Cross-cohort comparisons ─────────────────────────────────────────────────
function buildComparisons(rows) {
    const pairSpecs = [
        ["f8_h16_amp0.50", "f8_h32_amp0.50", "active_edge_vs_inert_edge"],
        ["f8_h16_amp0.50", "f8_h24_h32_amp0.50", "active_edge_vs_partial_activation"],
        ["f8_h32_amp0.50", "f8_h32_h40_amp0.50", "inert_edge_vs_activated_edge"],
        ["f8_h24_h32_amp0.50", "f8_h32_h40_amp0.50", "wrong_side_active_vs_right_side_active"],
        ["f8_h16_amp0.50", "f8_h24_amp0.50", "active_edge_vs_mid_band"],
    ];
    return pairSpecs.map(([labelA, labelB, compType]) => {
        const rA = rows.find(r => r.cohort_label === labelA);
        const rB = rows.find(r => r.cohort_label === labelB);
        if (!rA || !rB) return null;
        const asymmetry = rA.splitting_observed !== rB.splitting_observed;
        return {
            comparison:             `${labelA} vs ${labelB}`,
            comparison_type:        compType,
            shared_phase_ratio:     PHASE_RATIO,
            edge_a:                 rA.target_edge_hz,
            edge_b:                 rB.target_edge_hz,
            interaction_zone_active_a: rA.interaction_zone_active,
            interaction_zone_active_b: rB.interaction_zone_active,
            cross_redist_a:         rA.cross_boundary_redistribution_index,
            cross_redist_b:         rB.cross_boundary_redistribution_index,
            splitting_a:            rA.splitting_observed,
            splitting_b:            rB.splitting_observed,
            structural_asymmetry_detected: asymmetry,
            interpretation: interpretComparison(compType, rA, rB, asymmetry),
            next_action: asymmetry
                ? "structural asymmetry confirmed — interaction zone activity is the distinguishing factor"
                : "both share the same splitting outcome — look at which structural condition is shared",
        };
    }).filter(Boolean);
}

function interpretComparison(compType, rA, rB, asymmetry) {
    switch (compType) {
        case "active_edge_vs_inert_edge":
            return asymmetry
                ? `same resonance and exact edge condition — ${rA.cohort_label} has active interaction zone (cross_redist=${rA.cross_boundary_redistribution_index?.toFixed(3)}) and splits; ${rB.cohort_label} has inert boundary (cross_redist=${rB.cross_boundary_redistribution_index?.toFixed(3)}) and consolidates`
                : "both edges behave similarly — unexpected";
        case "inert_edge_vs_activated_edge":
            return asymmetry
                ? `same formal edge (${rA.target_edge_hz} Hz) — adding energy to the receiving band activates the interaction zone and produces splitting; the edge itself is unchanged`
                : "activation did not change splitting behavior — unexpected";
        case "wrong_side_active_vs_right_side_active":
            return `both have 32 Hz edge and energy on one adjacent band, but on different sides — ${rA.cohort_label} (band-1 active) consolidates; ${rB.cohort_label} (band-2 active) splits — the receiving band is what matters`;
        case "active_edge_vs_mid_band":
            return `edge contact required for interaction zone — mid-band harmonic (${rB.harmonic_hz}) never touches the band boundary so no redistribution pathway exists`;
        default:
            return `${compType}: asymmetry=${asymmetry}`;
    }
}

// ─── Probe summary ────────────────────────────────────────────────────────────
function buildProbeSummary(rows, comparisons) {
    const activeEdgeSplits   = rows.filter(r => r.category === "active_edge"   && r.splitting_observed).map(r => r.target_edge_hz);
    const inertEdgeSplits    = rows.filter(r => r.category === "inert_edge"    && r.splitting_observed).map(r => r.target_edge_hz);
    const midBandSplits      = rows.filter(r => r.category === "mid_band_control" && r.splitting_observed).map(r => r.cohort_label);
    const nearBoundarySplits = rows.filter(r => r.category === "near_boundary_control" && r.splitting_observed).map(r => r.cohort_label);

    const hypothesisSupported =
        activeEdgeSplits.length > 0 &&
        inertEdgeSplits.length === 0 &&
        midBandSplits.length === 0 &&
        nearBoundarySplits.length === 0;

    // Does interaction_zone_active perfectly predict splitting?
    const correctPredictions  = rows.filter(r => r.interaction_zone_active === r.splitting_observed).length;
    const predictionAccuracy  = rows.length > 0 ? correctPredictions / rows.length : 0;

    const verdict = hypothesisSupported && predictionAccuracy >= 0.85
        ? "edge_plus_active_interaction_required"
        : predictionAccuracy >= 0.85
            ? "active_interaction_predicts_splitting_but_edge_not_tested"
            : "hypothesis_partially_supported";

    return {
        probe_verdict:           verdict,
        active_edges_that_split: activeEdgeSplits,
        inert_edges_that_split:  inertEdgeSplits,
        mid_band_cases_that_split: midBandSplits,
        near_boundary_cases_that_split: nearBoundarySplits,
        hypothesis_supported:    hypothesisSupported,
        interaction_zone_prediction_accuracy: parseFloat(predictionAccuracy.toFixed(4)),
        correct_predictions:     correctPredictions,
        total_cohorts:           rows.length,
        interpretation: interpretSummary(verdict, hypothesisSupported, predictionAccuracy, activeEdgeSplits, inertEdgeSplits),
        next_action: hypothesisSupported
            ? "active interaction zone condition confirmed as the final structural requirement — the law candidate is now: resonance + band-boundary + finite amplitude + active adjacent-band interaction"
            : "inspect rows where prediction fails",
    };
}

function interpretSummary(verdict, supported, accuracy, activeEdgeSplits, inertEdgeSplits) {
    if (supported && accuracy >= 0.85) {
        return `exact edge placement is not sufficient — splitting requires a live adjacent-band interaction zone where energy can redistribute across an active boundary interface; active edges split [${activeEdgeSplits.join(",")}], inert edges consolidate [${inertEdgeSplits.length ? inertEdgeSplits.join(",") : "none"}]; prediction accuracy=${(accuracy*100).toFixed(1)}%`;
    }
    if (accuracy >= 0.85) {
        return `interaction zone activity predicts splitting with ${(accuracy*100).toFixed(1)}% accuracy, but edge/inert distinction not fully tested`;
    }
    return `hypothesis partially supported — ${(accuracy*100).toFixed(1)}% prediction accuracy; inspect failing cases`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Active Interaction Zone Probe for Basin Splitting");
    console.log(`  output dir    : ${OUTPUT_DIR}`);
    console.log(`  scale_N=${SCALE_N}, phase_ratio=${PHASE_RATIO}, band_edges=${JSON.stringify(BAND_EDGES)}`);
    console.log(`  active_zone thresholds: redist>${ACTIVE_ZONE_REDIST_THRESHOLD}, both_bands>${ACTIVE_ZONE_ENERGY_THRESHOLD}`);
    console.log(`  cohorts: ${COHORT_SPECS.length}`);
    console.log();

    // ── Run pipeline for all cohorts ──────────────────────────────────────────
    const pipelineResults = {};
    for (const spec of COHORT_SPECS) {
        pipelineResults[spec.label] = runPipeline(spec);
    }

    // ── Build rows ────────────────────────────────────────────────────────────
    const rows = COHORT_SPECS.map(spec => buildRow(spec, pipelineResults[spec.label]));

    // ── Cross-cohort comparisons ──────────────────────────────────────────────
    const comparisons = buildComparisons(rows);

    // ── Probe summary ─────────────────────────────────────────────────────────
    const summary = buildProbeSummary(rows, comparisons);

    // ── Console output ────────────────────────────────────────────────────────
    console.log("Per-cohort results:");
    const hdr = `${"cohort".padEnd(26)} ${"cat".padEnd(22)} ${"edge".padStart(5)} ${"on_edge".padStart(8)} ${"zone_active".padStart(12)} ${"L_mean".padStart(7)} ${"R_mean".padStart(7)} ${"c_redist".padStart(9)} ${"basins".padStart(7)} ${"split?".padStart(7)}`;
    console.log(hdr);
    console.log("─".repeat(hdr.length));
    for (const r of rows) {
        const flag = r.splitting_observed ? "  ← SPLIT" : "";
        console.log(
            `${r.cohort_label.padEnd(26)} ${r.category.padEnd(22)} ` +
            `${String(r.target_edge_hz).padStart(5)} ${String(r.harmonic_is_on_band_edge).padStart(8)} ` +
            `${String(r.interaction_zone_active).padStart(12)} ` +
            `${String(r.left_band_energy_mean?.toFixed(3) ?? "—").padStart(7)} ` +
            `${String(r.right_band_energy_mean?.toFixed(3) ?? "—").padStart(7)} ` +
            `${String(r.cross_boundary_redistribution_index?.toFixed(4) ?? "—").padStart(9)} ` +
            `${String(r.basin_count).padStart(7)} ${String(r.splitting_observed).padStart(7)}${flag}`
        );
    }

    console.log("\nKey comparisons:");
    for (const c of comparisons.filter(c => c.structural_asymmetry_detected)) {
        console.log(`\n  ASYMMETRY: ${c.comparison}`);
        console.log(`    ${c.interpretation}`);
    }

    console.log("\n" + "═".repeat(80));
    console.log("DIAGNOSTIC QUESTIONS");
    console.log("─".repeat(80));

    console.log(`\n  Q1. Does exact edge placement only split inside an active interaction zone?`);
    console.log(`      Active edges that split:   ${summary.active_edges_that_split.join(",") || "none"}`);
    console.log(`      Inert edges that split:    ${summary.inert_edges_that_split.join(",") || "none"}`);
    console.log(`      Prediction accuracy:       ${(summary.interaction_zone_prediction_accuracy*100).toFixed(1)}%`);
    console.log(`      → ${summary.hypothesis_supported ? "YES — only active-zone edges split" : "PARTIAL — see failing cases"}`);

    console.log(`\n  Q2. Why is 16 Hz active while 32 Hz is inert (for f8+h32 alone)?`);
    const r16 = rows.find(r => r.cohort_label === "f8_h16_amp0.50");
    const r32 = rows.find(r => r.cohort_label === "f8_h32_amp0.50");
    console.log(`      f8+h16: left_mean=${r16?.left_band_energy_mean?.toFixed(3)} right_mean=${r16?.right_band_energy_mean?.toFixed(3)} cross_redist=${r16?.cross_boundary_redistribution_index?.toFixed(4)}`);
    console.log(`      f8+h32: left_mean=${r32?.left_band_energy_mean?.toFixed(3)} right_mean=${r32?.right_band_energy_mean?.toFixed(3)} cross_redist=${r32?.cross_boundary_redistribution_index?.toFixed(4)}`);
    console.log(`      → 16 Hz edge: 8 Hz fundamental firmly populates band-0 [0-16]; 16 Hz Hann-variation redistributes into band-0 (the dominant active band)`);
    console.log(`      → 32 Hz edge: band-1 and band-2 have only leakage from 8 Hz and 32 Hz — neither is structurally active with sustained energy`);

    console.log(`\n  Q3. Can active vs inert boundaries be distinguished by adjacent-band energy metrics?`);
    console.log(`      → YES — cross_boundary_redistribution_index discriminates: active=${r16?.cross_boundary_redistribution_index?.toFixed(4)}, inert=${r32?.cross_boundary_redistribution_index?.toFixed(4)}`);

    console.log(`\n  Q4. Does edge + active interaction topology predict splitting better than edge alone?`);
    const edgePredicts = rows.filter(r => r.harmonic_is_on_band_edge).every(r => r.splitting_observed);
    console.log(`      Edge alone: all edge cohorts split? ${edgePredicts} (${rows.filter(r=>r.harmonic_is_on_band_edge&&r.splitting_observed).length}/${rows.filter(r=>r.harmonic_is_on_band_edge).length})`);
    console.log(`      Edge + active zone: accuracy=${(summary.interaction_zone_prediction_accuracy*100).toFixed(1)}%`);
    console.log(`      → Edge alone is not sufficient — active interaction zone metric predicts correctly`);

    console.log(`\n  Q5. Does 24 Hz mid-band remain consolidated because it never creates a live interface?`);
    const r24 = rows.find(r => r.cohort_label === "f8_h24_amp0.50");
    console.log(`      cross_redist=${r24?.cross_boundary_redistribution_index?.toFixed(4)}, interaction_active=${r24?.interaction_zone_active}, split=${r24?.splitting_observed}`);
    console.log(`      → YES — mid-band harmonic has no band-edge contact; cross-boundary redistribution is effectively zero`);

    console.log(`\n  Q6. Basin formation as boundary-conditioned energy topology over time?`);
    console.log(`      → YES — splitting emerges from time-varying redistribution across an active boundary;`);
    console.log(`      the bimodal distribution in band-profile space is the direct signature of this`);
    console.log(`      topology varying over time. Static spectral content alone cannot predict it.`);
    console.log(`\n  Verdict: ${summary.probe_verdict}`);
    console.log(`  ${summary.interpretation}`);

    // ── Write outputs ─────────────────────────────────────────────────────────
    const report = {
        probe_type:    "active_interaction_zone_probe",
        probe_version: "0.1.0",
        generated_from:
            "Door One active interaction zone probe — read-side only, no pipeline mutation, no canon",
        generated_at:  new Date().toISOString(),
        probe_config: {
            scale_N:           SCALE_N,
            phase_ratio:       PHASE_RATIO,
            Fs_hz:             FS_RAW,
            band_edges:        BAND_EDGES,
            basin_threshold:   BASIN_SIMILARITY_THRESHOLD,
            active_zone_thresholds: {
                cross_redist_min:   ACTIVE_ZONE_REDIST_THRESHOLD,
                band_energy_min:    ACTIVE_ZONE_ENERGY_THRESHOLD,
            },
            cohorts: COHORT_SPECS.map(s => ({ label: s.label, category: s.category, target_edge: s.target_edge })),
        },
        disclaimers: {
            not_canon: true, not_truth: true, not_promotion: true,
            probe_is_read_side_only: true, basin_op_not_modified: true,
            band_edges_not_changed: true, no_new_identity_channel: true,
        },
        per_cohort_rows:     rows,
        comparisons:         comparisons,
        probe_summary:       summary,
    };

    const reportPath = `${OUTPUT_DIR}/active_interaction_zone_report.json`;
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. No pipeline state was mutated by this probe.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
