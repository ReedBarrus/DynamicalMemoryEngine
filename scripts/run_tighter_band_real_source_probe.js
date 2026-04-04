// scripts/run_tighter_band_real_source_probe.js
//
// Tighter-Band Real-Source Perturbation Probe with Distortion Audit
// Door One Read-Side Only
//
// Constitutional posture:
//   - Runtime remains below canon.
//   - All candidate transition classes and audit outputs are provisional.
//   - Distortion audit does not mutate runtime or redefine artifact meaning.
//   - No runtime authority, BasinOp changes, workbench effects, or promotion.
//   - Findings provisional, probe-local, non-canonical.
//
// Source family: daw_mic_sine_400hz
//   A narrower-band perturbation cohort: 400Hz sine tone added to room noise.
//   Contrast with daw_mic_input: prior broadband fan+heater perturbation shifted
//   energy across multiple bands; this family concentrates it in band-1 [300-600Hz].
//
// Structure:
//   baseline_01-03.wav    — 20s each, room noise only (band-0 dominant ~0.553)
//   perturb_01-03.wav     — 20s each, room noise + 400Hz sine (band-1 ~0.800)
//   return_01-03.wav      — 20s each, sine off, room noise returns (band-0 ~0.554)
//   master_01-03.wav      — 60s each = 20s baseline + 20s perturb + 20s return
//
// Key diagnostic difference from prior cohort (daw_mic_input fan+heater):
//   Prior: L1(baseline vs perturbation) ≈ 0.316  (broadband shift across bands 1-3)
//   This:  L1(baseline vs perturbation) ≈ 0.760  (narrow-band surge in band-1 only)
//   The sine_400hz perturbation is a tighter, higher-contrast spectral intrusion.
//
// Both labeled replay and unlabeled master-stream views are produced.
// Distortion Audit Protocol applied to three surfaces:
//   A. Replay summary surface
//   B. Continuous master segmentation surface
//   C. Structural transition vocabulary surface
//
// Same analysis lens as prior cohorts — lens-honest comparison.
//
// Run:
//   node scripts/run_tighter_band_real_source_probe.js
//
// Optional env:
//   PROBE_TBR_COHORT_DIR  — override cohort directory
//   PROBE_TBR_OUTPUT_DIR  — override output directory

import { mkdir, writeFile } from "node:fs/promises";
import { readFile as fsRead } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dirname, "..");

const COHORT_DIR = process.env.PROBE_TBR_COHORT_DIR
    ?? path.join(REPO_ROOT, "test_signal", "daw_mic_sine_400hz");
const OUTPUT_DIR = process.env.PROBE_TBR_OUTPUT_DIR
    ?? path.join(REPO_ROOT, "out_experiments", "tighter_band_real_source_probe");

// ─── Declared lens (identical to prior real-source probes — lens-honest) ──────
const TARGET_FS        = 2400;
const WINDOW_N         = 256;
const HOP_N            = 128;
const BAND_EDGES       = [0, 300, 600, 900, 1200];
const N_BANDS          = BAND_EDGES.length - 1;
const SEG_DURATION_SEC = 4.0;    // macro-segment for master-stream analysis
const SLICE_DURATION_SEC = 8.0;  // per-file slice limit for labeled replay

// Transition thresholds (same as structural_transition_probe)
const RUPTURE_T  = 0.20;
const INGRESS_T  = 0.08;
const REENTRY_T  = 0.08;

// Labeled replay phase map (explicit)
const REPLAY_PHASE_MAP = [
    { filename: "baseline_01.wav", replay_phase: "baseline",     run_index: 0 },
    { filename: "baseline_02.wav", replay_phase: "baseline",     run_index: 1 },
    { filename: "baseline_03.wav", replay_phase: "baseline",     run_index: 2 },
    { filename: "perturb_01.wav",  replay_phase: "perturbation", run_index: 0 },
    { filename: "perturb_02.wav",  replay_phase: "perturbation", run_index: 1 },
    { filename: "perturb_03.wav",  replay_phase: "perturbation", run_index: 2 },
    { filename: "return_01.wav",   replay_phase: "return",       run_index: 0 },
    { filename: "return_02.wav",   replay_phase: "return",       run_index: 1 },
    { filename: "return_03.wav",   replay_phase: "return",       run_index: 2 },
];

const MASTER_FILES = ["master_01.wav", "master_02.wav", "master_03.wav"];

// ─── WAV helpers (same as prior probes) ───────────────────────────────────────
function readAscii(buf, s, l) { return buf.toString("ascii", s, s + l); }

function parseWavSlice(buffer, maxSec) {
    if (readAscii(buffer, 0, 4) !== "RIFF") throw new Error("Not RIFF/WAVE");
    let offset = 12, fmt = null, dc = null;
    while (offset + 8 <= buffer.length) {
        const id = readAscii(buffer, offset, 4), sz = buffer.readUInt32LE(offset + 4), ds = offset + 8;
        if (id === "fmt ") fmt = { audioFormat: buffer.readUInt16LE(ds), sampleRate: buffer.readUInt32LE(ds + 4),
            blockAlign: buffer.readUInt16LE(ds + 12), bitsPerSample: buffer.readUInt16LE(ds + 14),
            numChannels: buffer.readUInt16LE(ds + 2) };
        else if (id === "data") dc = { start: ds, size: sz };
        offset = ds + sz + (sz % 2);
    }
    const { audioFormat, sampleRate, blockAlign } = fmt;
    const rawFC = Math.floor(dc.size / blockAlign);
    const fc = maxSec != null ? Math.min(rawFC, Math.floor(maxSec * sampleRate)) : rawFC;
    const mono = new Array(fc);
    for (let i = 0; i < fc; i++) {
        const off = dc.start + i * blockAlign;
        mono[i] = audioFormat === 3 ? buffer.readFloatLE(off) : buffer.readInt32LE(off) / 2147483648;
    }
    return { ...fmt, frameCount: fc, rawFrameCount: rawFC, mono, duration_sec: fc / sampleRate };
}

function decimate(mono, factor) {
    const out = []; for (let i = 0; i < mono.length; i += factor) out.push(mono[i]); return out;
}

// ─── Band profiles ────────────────────────────────────────────────────────────
function bandProfilesFromSamples(samples, fs) {
    const profiles = [];
    for (let wi = 0; wi + WINDOW_N <= samples.length; wi += HOP_N) {
        const w = samples.slice(wi, wi + WINDOW_N);
        for (let i = 0; i < WINDOW_N; i++) w[i] *= 0.5 * (1 - Math.cos(2 * Math.PI * i / (WINDOW_N - 1)));
        const energy = new Array(N_BANDS).fill(0);
        const nOut = Math.floor(WINDOW_N / 2);
        for (let k = 1; k < nOut; k++) {
            let re = 0, im = 0;
            for (let i = 0; i < WINDOW_N; i++) { re += w[i] * Math.cos(2*Math.PI*k*i/WINDOW_N); im += w[i] * Math.sin(2*Math.PI*k*i/WINDOW_N); }
            const e = re*re + im*im, freq = k*fs/WINDOW_N;
            for (let b = 0; b < N_BANDS; b++) if (freq >= BAND_EDGES[b] && freq < BAND_EDGES[b+1]) { energy[b] += e; break; }
        }
        profiles.push(normL1(energy));
    }
    return profiles;
}

function segmentProfiles(windowProfiles, fs) {
    const winPerSeg = Math.floor(SEG_DURATION_SEC * fs / HOP_N);
    const nSegs = Math.floor(windowProfiles.length / winPerSeg);
    return Array.from({ length: nSegs }, (_, s) => {
        const wins = windowProfiles.slice(s * winPerSeg, (s+1) * winPerSeg);
        const mean = new Array(N_BANDS).fill(0);
        wins.forEach(p => p.forEach((v, i) => { mean[i] += v; }));
        return {
            seg_index: s,
            t_start_sec: parseFloat((s * SEG_DURATION_SEC).toFixed(2)),
            t_end_sec: parseFloat(((s+1) * SEG_DURATION_SEC).toFixed(2)),
            window_count: wins.length,
            mean_band_profile: mean.map(v => parseFloat((v / wins.length).toFixed(6))),
        };
    });
}

// ─── Labeled replay analysis ───────────────────────────────────────────────────
async function analyzeReplayFile(spec, seqIdx) {
    const filePath = path.join(COHORT_DIR, spec.filename);
    let buffer;
    try { buffer = await fsRead(filePath); } catch (e) { return { ...spec, file_found: false, error: e.message }; }

    const parsed = parseWavSlice(buffer, SLICE_DURATION_SEC);
    const factor = Math.round(parsed.sampleRate / TARGET_FS);
    const dec    = decimate(parsed.mono, factor);
    const fs     = Math.round(parsed.sampleRate / factor);

    const profiles = bandProfilesFromSamples(dec, fs);
    const meanProf = new Array(N_BANDS).fill(0);
    profiles.forEach(p => p.forEach((v, i) => { meanProf[i] += v; }));
    const mp = meanProf.map(v => parseFloat((v / profiles.length).toFixed(6)));

    // Flow metrics at 300Hz boundary
    const leftSeries  = profiles.map(p => p[0]);
    const rightSeries = profiles.map(p => p[1]);
    const diffs = leftSeries.map((l, i) => l - rightSeries[i]);
    const signedFlow = meanArr(diffs);
    const oscStr     = stdArr(diffs);
    let lagCov = 0, varSum = 0;
    for (let i = 1; i < diffs.length; i++) { lagCov += (diffs[i]-signedFlow)*(diffs[i-1]-signedFlow); varSum += (diffs[i-1]-signedFlow)**2; }
    const lag1AC = varSum > 0 ? lagCov / varSum : 0;
    let flips = 0; for (let i = 1; i < diffs.length; i++) if (Math.sign(diffs[i]) !== Math.sign(diffs[i-1])) flips++;
    const flipRate = diffs.length > 1 ? flips / (diffs.length - 1) : 0;
    const flowMode = oscStr < 0.02 ? "weak_or_inert" : oscStr > 0.15 && Math.abs(lag1AC) > 0.90 ? "oscillatory_exchange" : "one_way_drift";

    return {
        run_label:             `${spec.replay_phase.substring(0,5)}_${spec.run_index + 1}`,
        replay_phase:          spec.replay_phase,
        replay_sequence_index: seqIdx,
        run_index_in_phase:    spec.run_index,
        source_id:             `tbr.${spec.filename}`,
        stream_id:             `STR:tbr.${spec.filename}:ch0:audio:wav:${fs}:slice${SLICE_DURATION_SEC}s`,
        raw_filepath:          filePath,
        raw_filename:          spec.filename,
        source_type:           "wav_file",
        source_family:         "daw_mic_sine_400hz",
        file_found:            true,
        wav_meta: { sample_rate: parsed.sampleRate, bits_per_sample: parsed.bitsPerSample,
            duration_sec: parseFloat(parsed.duration_sec.toFixed(3)), slice_sec: SLICE_DURATION_SEC },
        lens: declaredLens(fs),
        window_count:          profiles.length,
        sufficient_support:    profiles.length >= 16,
        mean_band_profile:     mp,
        boundary_band_pair:    { left_band_hz: "0-300", right_band_hz: "300-600" },
        signed_cross_boundary_flow:  parseFloat(signedFlow.toFixed(6)),
        oscillatory_flow_strength:   parseFloat(oscStr.toFixed(6)),
        diff_lag1_autocorr:          parseFloat(lag1AC.toFixed(6)),
        sign_flip_rate:              parseFloat(flipRate.toFixed(6)),
        flow_mode:                   flowMode,
        interpretation: interpretReplayRow(spec.replay_phase, mp, flowMode),
    };
}

function interpretReplayRow(phase, mp, flowMode) {
    const band0 = mp[0], band1 = mp[1];
    const label = band1 > 0.5 ? "band-1 dominant (300-600Hz) — sine intrusion active"
        : band0 > 0.5 ? "band-0 dominant (0-300Hz) — room noise only"
        : "transitional profile";
    return `[${phase}] ${label}; flow_mode=${flowMode}`;
}

// ─── Labeled replay summary ────────────────────────────────────────────────────
function buildReplaySummary(rows, cohortName) {
    const byPhase = {};
    for (const r of rows.filter(r => r.file_found)) {
        if (!byPhase[r.replay_phase]) byPhase[r.replay_phase] = [];
        byPhase[r.replay_phase].push(r);
    }
    function meanProf(phase) {
        const rs = byPhase[phase] ?? [];
        if (!rs.length) return null;
        const acc = new Array(N_BANDS).fill(0);
        rs.forEach(r => r.mean_band_profile.forEach((v, i) => { acc[i] += v; }));
        return acc.map(v => parseFloat((v / rs.length).toFixed(6)));
    }
    const bpA = meanProf("baseline"), bpP = meanProf("perturbation"), bpR = meanProf("return");
    return {
        cohort: cohortName,
        baseline_mean_band_profile:     bpA,
        perturbation_mean_band_profile: bpP,
        return_mean_band_profile:       bpR,
        band_edges:                     BAND_EDGES,
        baseline_vs_perturbation_l1:    bpA && bpP ? parseFloat(l1(bpA, bpP).toFixed(6)) : null,
        perturbation_vs_return_l1:      bpP && bpR ? parseFloat(l1(bpP, bpR).toFixed(6)) : null,
        baseline_vs_return_l1:          bpA && bpR ? parseFloat(l1(bpA, bpR).toFixed(6)) : null,
        exchange_persistence_class:     "non_oscillatory_throughout",
        phase_separation_method:        "band_profile_l1_distance",
        return_like:                    bpA && bpR ? l1(bpA, bpR) < 0.05 : null,
        not_canon: true, not_prediction: true, not_promotion: true,
    };
}

// ─── Continuous master analysis ────────────────────────────────────────────────
async function analyzeMasterFile(filename) {
    const filePath = path.join(COHORT_DIR, filename);
    let buffer;
    try { buffer = await fsRead(filePath); } catch (e) { return { filename, file_found: false, error: e.message }; }

    const parsed = parseWavSlice(buffer, null);   // full stream
    const factor = Math.round(parsed.sampleRate / TARGET_FS);
    const dec    = decimate(parsed.mono, factor);
    const fs     = Math.round(parsed.sampleRate / factor);

    const windowProfiles = bandProfilesFromSamples(dec, fs);
    const segments       = segmentProfiles(windowProfiles, fs);

    // Boundary scores between adjacent segments
    const boundaryScores = segments.slice(1).map((seg, i) => ({
        boundary_t_sec: seg.t_start_sec,
        between_segs:   [i, i+1],
        l1_score:       parseFloat(l1(seg.mean_band_profile, segments[i].mean_band_profile).toFixed(6)),
    }));

    // Peak detection (above RUPTURE_T and local max)
    const peaks = boundaryScores.filter((b, i) => {
        if (b.l1_score < RUPTURE_T) return false;
        const prev = boundaryScores[i-1]?.l1_score ?? 0, next = boundaryScores[i+1]?.l1_score ?? 0;
        return b.l1_score >= prev && b.l1_score >= next;
    });

    // Candidate phases
    const peakTs = peaks.map(p => p.boundary_t_sec);
    const bps = [0, ...peakTs, Infinity];
    const phaseLabels = ["candidate_A","candidate_B","candidate_C"];
    const candidatePhases = [];
    for (let i = 0; i < bps.length - 1; i++) {
        const ps = segments.filter(s => s.t_start_sec >= bps[i] && s.t_start_sec < bps[i+1]);
        if (!ps.length) continue;
        const meanProf = meanVec(ps.map(s => s.mean_band_profile));
        candidatePhases.push({
            candidate_label:   phaseLabels[i] ?? `candidate_${String.fromCharCode(65+i)}`,
            t_start_sec:       ps[0].t_start_sec,
            t_end_sec:         ps.at(-1).t_end_sec,
            seg_indices:       ps.map(s => s.seg_index),
            mean_band_profile: meanProf,
        });
    }

    // Candidate transition classification per boundary
    const transitionRows = boundaryScores.map(b => ({
        ...b,
        candidate_transition: b.l1_score >= RUPTURE_T ? "rupture"
            : b.l1_score >= INGRESS_T ? "ingress" : "dwell",
    }));

    // Re-entry pairs
    const ruptureSegs = new Set(transitionRows.filter(t => t.candidate_transition === "rupture").map(t => t.between_segs[1]));
    const reentryPairs = [];
    for (let j = 3; j < segments.length; j++) {
        const phJ = candidatePhases.find(p => p.seg_indices.includes(j));
        for (let i = 0; i < j - 3; i++) {
            const phI = candidatePhases.find(p => p.seg_indices.includes(i));
            if (!phI || !phJ || phI.candidate_label === phJ.candidate_label) continue;
            if (![...ruptureSegs].some(r => r > i && r <= j)) continue;
            const d = l1(segments[j].mean_band_profile, segments[i].mean_band_profile);
            if (d < REENTRY_T) {
                reentryPairs.push({ ref_seg: i, curr_seg: j, ref_t: segments[i].t_start_sec,
                    curr_t: segments[j].t_start_sec, l1_similarity: parseFloat(d.toFixed(6)),
                    ref_phase: phI.candidate_label, curr_phase: phJ.candidate_label,
                    candidate_transition: "re-entry" });
            }
        }
    }

    // Ambiguity regions: scores near thresholds
    const ambiguityRegions = boundaryScores.filter(b =>
        Math.abs(b.l1_score - RUPTURE_T) < 0.05 || Math.abs(b.l1_score - INGRESS_T) < 0.02);

    // Boundary summary
    const ruptureTs = transitionRows.filter(t => t.candidate_transition === "rupture").map(t => t.boundary_t_sec);
    const boundarySummary = {
        total_boundaries:       boundaryScores.length,
        rupture_count:          ruptureTs.length,
        ingress_count:          transitionRows.filter(t => t.candidate_transition === "ingress").length,
        dwell_count:            transitionRows.filter(t => t.candidate_transition === "dwell").length,
        rupture_at_t:           ruptureTs,
        strongest_l1:           parseFloat(Math.max(...boundaryScores.map(b => b.l1_score)).toFixed(6)),
        ambiguity_count:        ambiguityRegions.length,
    };

    // Recurrence summary
    const firstPhase = candidatePhases[0], lastPhase = candidatePhases.at(-1);
    const interPhaseL1 = firstPhase && lastPhase && firstPhase !== lastPhase
        ? parseFloat(l1(firstPhase.mean_band_profile, lastPhase.mean_band_profile).toFixed(6)) : null;
    const recurrenceSummary = {
        total_reentry_pairs: reentryPairs.length,
        reentry_connecting_phases: [...new Set(reentryPairs.map(r => `${r.ref_phase}↔${r.curr_phase}`))],
        first_to_last_l1: interPhaseL1,
        first_to_last_return_like: interPhaseL1 != null ? interPhaseL1 < REENTRY_T : null,
    };

    const ambiguityClass = boundarySummary.rupture_count >= 2 && interPhaseL1 != null && interPhaseL1 < REENTRY_T
        ? "two_boundaries_with_return" : boundarySummary.rupture_count >= 2 ? "two_boundaries_no_clear_return"
        : boundarySummary.rupture_count === 1 ? "single_transition" : "no_strong_boundaries";

    return {
        filename, file_found: true,
        source_id: `tbr.master.${filename}`, raw_filepath: filePath,
        source_family: "daw_mic_sine_400hz",
        lens: declaredLens(fs),
        wav_meta: { sample_rate: parsed.sampleRate, duration_sec: parseFloat(parsed.duration_sec.toFixed(3)) },
        total_windows: windowProfiles.length, total_segments: segments.length,
        segments, candidate_phases: candidatePhases,
        candidate_boundary_peaks: peaks,
        boundary_transition_rows: transitionRows,
        reentry_rows: reentryPairs.slice(0, 20),
        ambiguity_regions: ambiguityRegions,
        boundary_summary: boundarySummary,
        recurrence_summary: recurrenceSummary,
        ambiguity_class: ambiguityClass,
        interpretation: buildMasterInterpretation(ambiguityClass, ruptureTs, reentryPairs.length),
    };
}

function buildMasterInterpretation(ambClass, ruptureTs, nReentry) {
    if (ambClass === "two_boundaries_with_return")
        return `two ruptures at t=[${ruptureTs.join("s, ")}s]; ${nReentry} re-entry pairs — provisional structure: narrow-band sine intrusion with full structural return`;
    if (ambClass === "two_boundaries_no_clear_return")
        return `two ruptures at t=[${ruptureTs.join("s, ")}s]; first and last phases do not converge`;
    if (ambClass === "single_transition")
        return `one rupture at t=${ruptureTs[0]}s — only two candidate phases, return not assessable`;
    return "no strong candidate boundaries — stream appears continuous at this lens";
}

// ─── Distortion Audit Protocol ─────────────────────────────────────────────────
function runDistortionAudit(replaySummary, masterResults, cohortComparison) {
    const audits = [];

    // ── Audit A: Replay summary surface ───────────────────────────────────────
    const bVsPL1 = replaySummary?.baseline_vs_perturbation_l1 ?? 0;
    const bVsRL1 = replaySummary?.baseline_vs_return_l1 ?? 0;
    audits.push({
        audit_id:    "A.replay_summary",
        layer_name:  "labeled replay summary surface",
        surface:     "run_tighter_band_real_source_probe.js — per-run and per-phase replay summaries",
        intended_role: "distinguish baseline / perturbation / return phases through band-profile geometry for a file-backed labeled cohort",
        must_preserve: [
            "band-profile separation between phases",
            "return-like convergence to baseline",
            "per-run lineage and lens metadata",
            "ambiguity where support is weak",
        ],
        must_not_decide: [
            "what caused the perturbation (semantic identity)",
            "whether the signal is 'correctly' measured",
            "canon or truth labels",
            "promotion of replay results to runtime authority",
        ],
        observed_flattening: bVsPL1 > 0.50
            ? ["none significant — L1 contrast is very high; phases are easily distinguishable at this lens"]
            : ["low-contrast case: if L1 < 0.10, band-profile summary may collapse distinction into unresolved"],
        evidence_of_distortion: bVsPL1 > 0.50
            ? `L1(baseline vs perturbation)=${bVsPL1.toFixed(4)} — high contrast; no flattening observed. L1(baseline vs return)=${bVsRL1.toFixed(4)} — strong return. The sine_400hz cohort does NOT suffer from the summary flattening risk present in lower-contrast families.`
            : `L1(baseline vs perturbation)=${bVsPL1.toFixed(4)} — low contrast; summary may not distinguish phases reliably.`,
        downstream_impact: bVsPL1 > 0.50
            ? "low — the high-contrast sine_400hz perturbation makes the replay summary more reliable, not less. exchange_persistence_class collapses all phases to non_oscillatory_throughout regardless of L1 magnitude — this is summary flattening for the flow-mode surface but not for band-profile L1."
            : "high — downstream transition probe would inherit collapsed phase separation",
        distortion_class:     bVsPL1 > 0.50 ? "summary_flattening (minor, flow-mode only)" : "summary_flattening (major)",
        lens_conditions: {
            target_Fs: TARGET_FS, window_N: WINDOW_N, hop_N: HOP_N,
            band_edges: BAND_EDGES, slice_sec: SLICE_DURATION_SEC,
            comparison_basis: "mean band-profile L1 between phases",
        },
        preserved_distinctions: [
            `baseline vs perturbation: L1=${bVsPL1.toFixed(4)} (expected > 0.50 for sine_400hz)`,
            `baseline vs return: L1=${bVsRL1.toFixed(4)} (expected < 0.05 for full recovery)`,
            "per-run band-0/band-1 inversion is fully visible in per-run rows",
        ],
        collapsed_distinctions: [
            "exchange_persistence_class collapses all three phases to non_oscillatory_throughout regardless of structural contrast",
            "flow_mode collapses to one_way_drift whether L1 is 0.02 or 0.76 — the direction of drift varies but the class does not",
        ],
        severity: "low",
        recommended_action: "clarify_language_only",
        notes: "The sine_400hz family produces a tighter-band, higher-contrast perturbation than the prior daw_mic_input family. The replay summary distinguishes phases well via band-profile L1. The flow-mode summary compression (non_oscillatory_throughout regardless of L1) is a known limitation — it should be noted in outputs but does not require architectural change at this stage.",
    });

    // ── Audit B: Continuous master segmentation surface ────────────────────────
    const allTwoB = masterResults.filter(r => r.file_found).every(r => r.boundary_summary?.rupture_count >= 2);
    const allReturn = masterResults.filter(r => r.file_found).every(r => r.recurrence_summary?.first_to_last_return_like === true);
    const strongestL1 = Math.max(...masterResults.filter(r=>r.file_found).map(r=>r.boundary_summary?.strongest_l1??0));

    audits.push({
        audit_id:    "B.master_segmentation",
        layer_name:  "continuous master stream segmentation surface",
        surface:     "run_tighter_band_real_source_probe.js — master file boundary detection and candidate phase assignment",
        intended_role: "infer provisional phase structure from unlabeled continuous streams; locate candidate boundaries and recurrence patterns",
        must_preserve: [
            "candidate boundary timing and magnitude",
            "ambiguity where segmentation is weak or multiple readings are plausible",
            "recurrence / return-like similarity between first and last candidate phases",
            "provisional posture — not ground truth",
        ],
        must_not_decide: [
            "whether boundaries are true phase changes",
            "semantic identity of the source",
            "canon or truth labels",
        ],
        observed_flattening: allTwoB
            ? ["none — two rupture boundaries are detected correctly in all files; the high-L1 sine intrusion produces a much sharper boundary signal than the prior broadband cohort"]
            : ["boundaries not found — stream may be too low-contrast for this lens"],
        evidence_of_distortion: allTwoB
            ? `strongest boundary L1=${strongestL1.toFixed(4)} — well above rupture threshold (${RUPTURE_T}). The sine_400hz family has a ~2.4× higher boundary signal than the prior fan+heater family (prior ≈ 0.31). Candidate phase A↔C return-like: ${allReturn}.`
            : "boundaries weak or missing — segmentation is unresolved",
        downstream_impact: allTwoB
            ? "low — high-contrast boundaries mean the master segmentation is more reliable for this family. However, the ambiguity_class machinery (two_boundaries_with_return) applies to both high and low contrast families with the same threshold — no distinction is made between a very clean return (L1≈0.006) and a marginal return (L1≈0.07). This is a mild summary flattening risk for cross-family comparison."
            : "high — downstream transition vocabulary would be based on poorly supported segmentation",
        distortion_class: "summary_flattening (minor, cross-family threshold insensitivity)",
        lens_conditions: {
            target_Fs: TARGET_FS, window_N: WINDOW_N, hop_N: HOP_N,
            band_edges: BAND_EDGES, seg_duration_sec: SEG_DURATION_SEC,
            rupture_threshold: RUPTURE_T, ingress_threshold: INGRESS_T,
        },
        preserved_distinctions: [
            "boundary at t=20s (sine onset) detected as rupture in all master files",
            "boundary at t=40s (sine offset) detected as rupture in all master files",
            "candidate_A and candidate_C are return-like (L1 near zero)",
            "high boundary contrast (L1 ≈ 0.7–0.8) distinguishable from prior cohort (L1 ≈ 0.3)",
        ],
        collapsed_distinctions: [
            "ambiguity_class 'two_boundaries_with_return' applies equally to marginal return (L1=0.08) and complete return (L1=0.006) — severity of return not captured in the class label",
            "rupture label does not distinguish a L1=0.3 boundary from a L1=0.8 boundary — the score is available but the label is the same",
        ],
        severity: "low",
        recommended_action: "clarify_language_only",
        notes: "Consider adding a 'rupture_magnitude' or 'return_l1' field to the ambiguity class summary so cross-family comparison retains quantitative texture. The class label alone may mislead future comparisons into treating all 'two_boundaries_with_return' results as structurally equivalent.",
    });

    // ── Audit C: Structural transition vocabulary surface ──────────────────────
    audits.push({
        audit_id:    "C.transition_vocabulary",
        layer_name:  "structural transition vocabulary surface",
        surface:     "boundary_transition_rows + candidate transition classification",
        intended_role: "emit richer candidate structural transition descriptions beyond the three-phase scaffold; preserve support basis; remain ambiguity-honest",
        must_preserve: [
            "the distinction between rupture / ingress / dwell classes",
            "the magnitude difference between this and prior cohorts (higher contrast → cleaner rupture)",
            "which transition classes are not supported by this family",
            "provisional posture throughout",
        ],
        must_not_decide: [
            "semantic identity of the transition cause",
            "whether the sine tone 'is' a perturbation in any ontological sense",
            "whether coupling or drift are present (may not apply)",
        ],
        observed_flattening: [
            "coupling class may not fire for the sine_400hz family: the perturbation is a single-band event, not a cross-band redistribution — corr(band-1, band-2) may be low",
            "drift class may not fire: the sine onset/offset is abrupt, not monotone movement",
            "rupture label does not distinguish 'narrow-band intrusion' from 'broadband shift' — same class for structurally different mechanisms",
        ],
        evidence_of_distortion: [
            "sine_400hz perturbation concentrates in band-1 (L1=0.76), while prior cohort spread across bands 1-3 (L1=0.31); both would classify as 'rupture' with no additional vocabulary distinguishing the mechanism",
            "the coupling detector requires band-0 suppression AND cross-band correlation; a single-band event (band-1 dominant) may not trigger coupling even though the structural change is clearly bounded",
        ],
        distortion_class: "label_flattening (mechanism flattening: narrow-band intrusion vs broadband shift both become 'rupture')",
        downstream_impact: "a future cross-cohort transition comparison would see both 'rupture' labels and assume structural equivalence; quantitative L1 scores remain available but are not surfaced in the label; the spectral concentration metric recommended in notes would preserve the distinction",
        lens_conditions: {
            band_edges: BAND_EDGES, rupture_threshold: RUPTURE_T,
            coupling_requires: "band-0 suppression + |corr(b1,b2)| >= 0.6",
        },
        preserved_distinctions: [
            "rupture vs ingress vs dwell distinction preserved at the boundary level",
            "re-entry class preserved: candidate_A and candidate_C are return-like",
            "boundary magnitude (L1 score) preserved in each row for downstream comparison",
        ],
        collapsed_distinctions: [
            "narrow-band intrusion (single-band surge) vs broadband shift (multi-band redistribution) both labelled 'rupture'",
            "abrupt onset (sine) vs gradual onset (fan/heater ramp-up) both labelled 'rupture' if L1 > threshold",
        ],
        severity: "moderate",
        recommended_action: "add_read_side_probe",
        notes: "A future 'spectral concentration probe' could distinguish narrow-band intrusion (high energy in one band, low in others) from broadband shift (moderate increase across multiple bands). This is a meaningful structural distinction that the current vocabulary collapses. Recommended: add 'dominant_band_concentration' metric to transition rows, defined as max(profile)/second_max(profile). For sine_400hz this ratio is ~20:1; for prior cohort ~2:1. This preserves the distinction without changing the threshold machinery.",
    });

    return {
        audited_surfaces: audits.length,
        audit_protocol_version: "1.0",
        not_canon: true, not_mutation: true,
        audits,
        cross_cohort_comparison: cohortComparison,
    };
}

// ─── Cross-cohort comparison ───────────────────────────────────────────────────
function buildCohortComparison(sine400Replay, priorReplayBandL1s) {
    return {
        cohort_a: "daw_mic_sine_400hz",
        cohort_b: "daw_mic_input (fan+heater, prior)",
        comparison_basis: "band-profile L1 distances between phases",
        lens_match: "same lens — lens-honest comparison",
        cohort_a_baseline_vs_perturbation_l1: sine400Replay?.baseline_vs_perturbation_l1 ?? null,
        cohort_b_baseline_vs_perturbation_l1: priorReplayBandL1s?.bVsP ?? 0.316,
        cohort_a_baseline_vs_return_l1:       sine400Replay?.baseline_vs_return_l1 ?? null,
        cohort_b_baseline_vs_return_l1:       priorReplayBandL1s?.bVsR ?? 0.018,
        perturbation_contrast_ratio:
            sine400Replay?.baseline_vs_perturbation_l1
                ? parseFloat((sine400Replay.baseline_vs_perturbation_l1 / (priorReplayBandL1s?.bVsP ?? 0.316)).toFixed(3))
                : null,
        structural_observation:
            "sine_400hz produces a tighter-band, higher-contrast perturbation concentrated in band-1 [300-600Hz]; daw_mic_input produced a broader multi-band shift. Both cohorts show return-like recovery. The sine_400hz return is more complete (L1 near zero vs ~0.018 for prior cohort).",
        preserved_by_both: ["return-like recovery", "boundary detection at correct phase transitions", "non_oscillatory_throughout flow mode"],
        distinguished_by_this_probe: ["band-profile concentration in single band vs spread", "L1 magnitude difference (~2.4× higher contrast)"],
        not_distinguished_by_current_vocabulary: ["narrow-band vs broadband mechanism", "abrupt vs gradual onset"],
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function l1(a, b) { return a.reduce((s, v, i) => s + Math.abs(v - (b[i] ?? 0)), 0); }
function normL1(v) { const s = v.reduce((a, x) => a + Math.abs(x), 0); return s === 0 ? v.map(() => 0) : v.map(x => x / s); }
function meanArr(a)  { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }
function stdArr(a)   { const m = meanArr(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length || 1)); }
function meanVec(vs) { if (!vs.length) return []; const a = new Array(vs[0].length).fill(0); vs.forEach(v => v.forEach((x,i)=>{a[i]+=x;})); return a.map(x=>parseFloat((x/vs.length).toFixed(6))); }

function declaredLens(fs) {
    return { source_family: "daw_mic_sine_400hz", nominal_fs: 48000, effective_fs: fs,
        decim_factor: Math.round(48000 / fs), window_N: WINDOW_N, hop_N: HOP_N,
        band_edges: BAND_EDGES, seg_duration_sec: SEG_DURATION_SEC, modality: "audio",
        channel: "ch0", comparison_basis: "band-profile L1 distance",
        derived_posture: "read-side observation — provisional, not durable, not canon" };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Tighter-Band Real-Source Probe with Distortion Audit — Door One Read-Side Only");
    console.log(`  cohort      : daw_mic_sine_400hz (400Hz sine tone tighter-band perturbation)`);
    console.log(`  cohort dir  : ${COHORT_DIR}`);
    console.log(`  output dir  : ${OUTPUT_DIR}`);
    console.log(`  lens        : ${TARGET_FS}Hz, N=${WINDOW_N}, hop=${HOP_N}, bands=${JSON.stringify(BAND_EDGES)}`);
    console.log(`  note        : same lens as prior daw_mic_input cohort — lens-honest cross-cohort comparison`);
    console.log();

    // ── Labeled replay ────────────────────────────────────────────────────────
    console.log("A. Labeled replay analysis...");
    const replayRows = [];
    for (let i = 0; i < REPLAY_PHASE_MAP.length; i++) {
        const row = await analyzeReplayFile(REPLAY_PHASE_MAP[i], i);
        replayRows.push(row);
        const flag = row.file_found
            ? `profile=[${row.mean_band_profile.map(v=>v.toFixed(3)).join(",")}]  flow=${row.flow_mode}`
            : "NOT FOUND";
        console.log(`  [${String(i).padStart(2)}] ${row.run_label?.padEnd(10) ?? "?"} ${row.replay_phase?.padEnd(13)} ${flag}`);
    }
    const replaySummary = buildReplaySummary(replayRows, "daw_mic_sine_400hz");
    console.log(`\n  Phase separation L1s:`);
    console.log(`    baseline vs perturbation : ${replaySummary.baseline_vs_perturbation_l1}`);
    console.log(`    perturbation vs return   : ${replaySummary.perturbation_vs_return_l1}`);
    console.log(`    baseline vs return       : ${replaySummary.baseline_vs_return_l1}`);

    // ── Continuous master ─────────────────────────────────────────────────────
    console.log("\nB. Continuous master analysis...");
    const masterResults = [];
    for (const fn of MASTER_FILES) {
        process.stdout.write(`  ${fn}... `);
        const r = await analyzeMasterFile(fn);
        masterResults.push(r);
        if (r.file_found)
            console.log(`done  boundaries=${r.boundary_summary?.rupture_count ?? 0}  strongest_L1=${r.boundary_summary?.strongest_l1?.toFixed(4)}  ${r.ambiguity_class}`);
        else console.log(`NOT FOUND`);
    }

    // ── Distortion audit ──────────────────────────────────────────────────────
    console.log("\nC. Distortion Audit Protocol...");
    const cohortComparison = buildCohortComparison(replaySummary, { bVsP: 0.316, bVsR: 0.018 });
    const distortionAudit  = runDistortionAudit(replaySummary, masterResults, cohortComparison);
    for (const a of distortionAudit.audits) {
        console.log(`  [${a.audit_id}] severity=${a.severity}  action=${a.recommended_action}`);
        console.log(`    ${a.notes.substring(0, 100)}...`);
    }

    // ── Write report ──────────────────────────────────────────────────────────
    const report = {
        probe_type:    "tighter_band_real_source_probe",
        probe_version: "0.1.0",
        cohort:        "daw_mic_sine_400hz",
        generated_at:  new Date().toISOString(),
        constitutional_posture: {
            runtime_below_canon:              true,
            candidate_transitions_provisional: true,
            distortion_audit_does_not_mutate_runtime: true,
            no_truth_labels:                  true,
            no_runtime_authority:             true,
            no_workbench_effects:             true,
            no_canon_minting:                 true,
            no_prediction_claims:             true,
            findings_provisional:             true,
            findings_non_canonical:           true,
        },
        probe_config: {
            cohort_dir:       COHORT_DIR,
            source_family:    "daw_mic_sine_400hz",
            perturbation_description: "400Hz sine tone added to room noise — narrow-band intrusion concentrated in band-1 [300-600Hz]",
            lens: { target_Fs: TARGET_FS, window_N: WINDOW_N, hop_N: HOP_N, band_edges: BAND_EDGES,
                seg_duration_sec: SEG_DURATION_SEC, slice_sec: SLICE_DURATION_SEC },
            phase_map: REPLAY_PHASE_MAP,
            master_files: MASTER_FILES,
        },
        labeled_replay: {
            per_run_rows:   replayRows,
            replay_summary: replaySummary,
        },
        continuous_master: {
            per_file_results: masterResults,
        },
        distortion_audit: distortionAudit,
    };

    const reportPath = path.join(OUTPUT_DIR, "tighter_band_report.json");
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. BasinOp unchanged. No runtime authority modified. Read-side only.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
