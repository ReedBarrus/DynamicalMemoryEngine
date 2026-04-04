// scripts/run_continuous_master_phase_probe.js
//
// Continuous Master-Stream Phase Discernment Probe — Door One Read-Side Only
//
// Constitutional posture:
//   - Runtime remains below canon.
//   - This probe produces provisional structural hypotheses, not truth labels.
//   - Candidate segment boundaries, phase labels, and recurrence groupings are
//     bounded structural observations, not validated ground truth.
//   - No runtime authority, BasinOp contracts, workbench effects, or promotion.
//   - All findings provisional, probe-local, non-canonical.
//
// Primary question:
//   Can Door One infer useful provisional phase structure from an unlabeled
//   continuous real-source master stream, including candidate segment boundaries,
//   recurrence groupings, and return-like similarity, without depending on
//   hand-labeled baseline / perturbation / return files?
//
// Source family:
//   test_signal/daw_mic_input/master_01.wav through master_03.wav
//   48000 Hz, 1 channel, 32-bit float, ~96-97s each
//   Decimated to 2400 Hz (factor 20) for analysis
//
// Pre-run findings (from exploratory analysis):
//   All three master files share the same two-boundary structure:
//     t≈0–31s:  structural regime A (band-0 dominant ~0.53–0.56)
//     t≈32–63s: structural regime B (band-0 drops ~0.20, mid-bands rise)
//     t≈64–96s: structural regime C (band-0 recovers, similar to regime A)
//   Regime A and C show return-like similarity (L1 < 0.10).
//   The t=32s boundary is the strongest transition in all three files.
//   The t=64s boundary is the second strongest.
//   This is a structural finding, not a semantic label.
//
// Algorithm:
//   1. Parse + decimate WAV to 2400 Hz
//   2. Compute per-window band profiles (N=256, hop=128, bands=[0,300,600,900,1200])
//   3. Group windows into macro-segments (SEG_SEC=4s each)
//   4. Compute boundary scores (L1 between adjacent segment mean profiles)
//   5. Detect boundary peaks (score > BOUNDARY_THRESHOLD and local maximum)
//   6. Assign windows between peaks as candidate structural segments
//   7. Compute segment-level recurrence matrix (pairwise L1)
//   8. Identify return-like pairs (later segments similar to early, L1 < RETURN_THRESHOLD)
//   9. Emit all outputs with explicit posture flags
//
// Reuse:
//   WAV parsing and decimation are thin helpers mirrored from
//   run_real_source_replay_probe.js — no new ingest ontology.
//
// Run:
//   node scripts/run_continuous_master_phase_probe.js [--file master_01.wav]
//   node scripts/run_continuous_master_phase_probe.js [--all]
//
// Optional env:
//   PROBE_CMP_DIR        — override cohort directory
//   PROBE_CMP_OUTPUT_DIR — override output directory

import { mkdir, writeFile } from "node:fs/promises";
import { readFile as nodeReadFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dirname, "..");

const COHORT_DIR  = process.env.PROBE_CMP_DIR
    ?? path.join(REPO_ROOT, "test_signal", "daw_mic_input");
const OUTPUT_DIR  = process.env.PROBE_CMP_OUTPUT_DIR
    ?? path.join(REPO_ROOT, "out_experiments", "continuous_master_phase_probe");

// Parse --file and --all from argv
const argv      = process.argv.slice(2);
const fileArg   = argv[argv.indexOf("--file") + 1];
const runAll    = argv.includes("--all");
// Default: process all master files
const MASTER_FILES = ["master_01.wav", "master_02.wav", "master_03.wav"];
const FILES_TO_RUN = fileArg ? [fileArg]
    : (runAll || argv.length === 0) ? MASTER_FILES
    : MASTER_FILES;   // default = all

// ─── Lens parameters (fixed, declared) ────────────────────────────────────────
const TARGET_FS     = 2400;       // target sample rate after decimation
const WINDOW_N      = 256;        // FFT window size (samples)
const HOP_N         = 128;        // hop size (samples)
const BAND_EDGES    = [0, 300, 600, 900, 1200];
const N_BANDS       = BAND_EDGES.length - 1;
const SEG_DURATION_SEC = 4.0;    // macro-segment duration for boundary detection
const BOUNDARY_THRESHOLD = 0.08; // L1 threshold for calling a segment boundary a candidate
const RETURN_THRESHOLD   = 0.08; // L1 threshold for calling two segments "return-like"
const MIN_WINDOWS_PER_SEG = 8;   // minimum windows required for a valid segment summary

// ─── WAV parser (same helper as run_real_source_replay_probe.js) ──────────────
function readAscii(buf, s, l) { return buf.toString("ascii", s, s + l); }

function parseWav(buffer) {
    if (readAscii(buffer, 0, 4) !== "RIFF" || readAscii(buffer, 8, 4) !== "WAVE")
        throw new Error("Not a RIFF/WAVE file");
    let offset = 12, fmt = null, dataChunk = null;
    while (offset + 8 <= buffer.length) {
        const id = readAscii(buffer, offset, 4);
        const sz = buffer.readUInt32LE(offset + 4);
        const ds = offset + 8;
        if (id === "fmt ") {
            fmt = {
                audioFormat:   buffer.readUInt16LE(ds),
                numChannels:   buffer.readUInt16LE(ds + 2),
                sampleRate:    buffer.readUInt32LE(ds + 4),
                blockAlign:    buffer.readUInt16LE(ds + 12),
                bitsPerSample: buffer.readUInt16LE(ds + 14),
            };
        } else if (id === "data") {
            dataChunk = { start: ds, size: sz };
        }
        offset = ds + sz + (sz % 2);
    }
    if (!fmt || !dataChunk) throw new Error("WAV missing fmt or data chunk");
    const { audioFormat, sampleRate, blockAlign } = fmt;
    const frameCount = Math.floor(dataChunk.size / blockAlign);
    const mono = new Array(frameCount);
    for (let i = 0; i < frameCount; i++) {
        const off = dataChunk.start + i * blockAlign;
        mono[i] = audioFormat === 3
            ? buffer.readFloatLE(off)
            : buffer.readInt32LE(off) / 2147483648;
    }
    return { ...fmt, frameCount, mono, duration_sec: frameCount / sampleRate };
}

function decimate(mono, factor) {
    if (factor <= 1) return mono.slice();
    const out = [];
    for (let i = 0; i < mono.length; i += factor) out.push(mono[i]);
    return out;
}

// ─── Band profile computation ──────────────────────────────────────────────────
function computeWindowProfiles(samples, fs) {
    const profiles = [];
    for (let wi = 0; wi + WINDOW_N <= samples.length; wi += HOP_N) {
        const w = samples.slice(wi, wi + WINDOW_N);
        for (let i = 0; i < WINDOW_N; i++)
            w[i] *= 0.5 * (1 - Math.cos(2 * Math.PI * i / (WINDOW_N - 1)));
        const energy = new Array(N_BANDS).fill(0);
        const nOut = Math.floor(WINDOW_N / 2);
        for (let k = 1; k < nOut; k++) {
            let re = 0, im = 0;
            for (let i = 0; i < WINDOW_N; i++) {
                re += w[i] * Math.cos(2 * Math.PI * k * i / WINDOW_N);
                im += w[i] * Math.sin(2 * Math.PI * k * i / WINDOW_N);
            }
            const e = re * re + im * im;
            const freq = k * fs / WINDOW_N;
            for (let b = 0; b < N_BANDS; b++) {
                if (freq >= BAND_EDGES[b] && freq < BAND_EDGES[b + 1]) { energy[b] += e; break; }
            }
        }
        profiles.push(normL1(energy));
        // per-window t_sec
        profiles[profiles.length - 1]._t_sec = wi / fs;
    }
    return profiles;
}

// ─── Macro-segment mean profiles ──────────────────────────────────────────────
function buildSegmentProfiles(windowProfiles, fs) {
    const winPerSeg = Math.floor(SEG_DURATION_SEC * fs / HOP_N);
    const nSegs     = Math.floor(windowProfiles.length / winPerSeg);
    const segments  = [];

    for (let s = 0; s < nSegs; s++) {
        const wins = windowProfiles.slice(s * winPerSeg, (s + 1) * winPerSeg);
        const mean = new Array(N_BANDS).fill(0);
        wins.forEach(p => p.forEach((v, i) => { mean[i] += v; }));
        const meanProf = mean.map(v => v / wins.length);

        // Mean energy (proxy for overall signal level)
        const energyProxy = wins.reduce((s, p) => s + Math.max(...p), 0) / wins.length;

        segments.push({
            seg_index:   s,
            t_start_sec: parseFloat((s * SEG_DURATION_SEC).toFixed(2)),
            t_end_sec:   parseFloat(((s + 1) * SEG_DURATION_SEC).toFixed(2)),
            window_count: wins.length,
            mean_band_profile: meanProf.map(v => parseFloat(v.toFixed(6))),
            dominant_band_hz:  BAND_EDGES[meanProf.indexOf(Math.max(...meanProf))],
            energy_proxy:      parseFloat(energyProxy.toFixed(6)),
            valid:             wins.length >= MIN_WINDOWS_PER_SEG,
        });
    }
    return segments;
}

// ─── Boundary detection ────────────────────────────────────────────────────────
function detectBoundaries(segments) {
    const boundaryScores = segments.slice(1).map((seg, i) => ({
        between_segs:    [i, i + 1],
        boundary_t_sec:  seg.t_start_sec,
        l1_score:        parseFloat(l1(seg.mean_band_profile, segments[i].mean_band_profile).toFixed(6)),
    }));

    // Simple peak detection: score is a local maximum within a ±1 segment window AND above threshold
    const peaks = boundaryScores.filter((b, i) => {
        if (b.l1_score < BOUNDARY_THRESHOLD) return false;
        const prev = boundaryScores[i - 1]?.l1_score ?? 0;
        const next = boundaryScores[i + 1]?.l1_score ?? 0;
        return b.l1_score >= prev && b.l1_score >= next;
    });

    return { all_scores: boundaryScores, candidate_peaks: peaks };
}

// ─── Candidate phase segments (regions between boundary peaks) ─────────────────
function buildCandidatePhases(segments, peaks) {
    if (!peaks.length) {
        return [{
            phase_index:       0,
            candidate_label:   "candidate_A",
            t_start_sec:       segments[0]?.t_start_sec ?? 0,
            t_end_sec:         segments.at(-1)?.t_end_sec ?? 0,
            seg_indices:       segments.map(s => s.seg_index),
            mean_band_profile: meanVec(segments.map(s => s.mean_band_profile)),
            boundary_note:     "no_strong_boundaries",
        }];
    }

    const phaseLabels = ["candidate_A", "candidate_B", "candidate_C", "candidate_D", "candidate_E"];
    const peakTs = peaks.map(p => p.boundary_t_sec);
    const breakpoints = [0, ...peakTs, Infinity];
    const phases = [];

    for (let i = 0; i < breakpoints.length - 1; i++) {
        const t0 = breakpoints[i], t1 = breakpoints[i + 1];
        const phaseSegs = segments.filter(s => s.t_start_sec >= t0 && s.t_start_sec < t1);
        if (!phaseSegs.length) continue;
        const meanProf = meanVec(phaseSegs.map(s => s.mean_band_profile));
        phases.push({
            phase_index:       i,
            candidate_label:   phaseLabels[i] ?? `candidate_${String.fromCharCode(65 + i)}`,
            t_start_sec:       phaseSegs[0].t_start_sec,
            t_end_sec:         phaseSegs.at(-1).t_end_sec,
            duration_sec:      parseFloat((phaseSegs.at(-1).t_end_sec - phaseSegs[0].t_start_sec).toFixed(2)),
            seg_count:         phaseSegs.length,
            seg_indices:       phaseSegs.map(s => s.seg_index),
            mean_band_profile: meanProf.map(v => parseFloat(v.toFixed(6))),
            dominant_band_hz:  BAND_EDGES[meanProf.indexOf(Math.max(...meanProf))],
            boundary_note:     i === 0 ? "starts_at_stream_begin"
                : i === breakpoints.length - 2 ? "ends_at_stream_end"
                : "bounded_by_candidate_boundaries",
        });
    }
    return phases;
}

// ─── Recurrence matrix ────────────────────────────────────────────────────────
function buildRecurrenceMatrix(segments) {
    const n = segments.length;
    // Compact: only keep L1 distances (upper triangle + diagonal)
    const matrix = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = i; j < n; j++) {
            row.push(parseFloat(l1(segments[i].mean_band_profile, segments[j].mean_band_profile).toFixed(5)));
        }
        matrix.push({ seg_i: i, t_i: segments[i].t_start_sec, l1_to_j: row });
    }
    return matrix;
}

// ─── Return-like pairs ────────────────────────────────────────────────────────
function findReturnPairs(segments, candidatePhases) {
    if (candidatePhases.length < 2) return [];
    const pairs = [];
    // Compare each later segment to earlier segments — flag pairs with L1 < threshold
    // Focus especially on pairs where the later segment comes from a different candidate phase
    for (let j = 1; j < segments.length; j++) {
        for (let i = 0; i < j; i++) {
            const dist = l1(segments[j].mean_band_profile, segments[i].mean_band_profile);
            if (dist < RETURN_THRESHOLD) {
                // Only record if they are not immediately adjacent
                if (j - i > 2) {
                    const phaseI = candidatePhases.find(p => p.seg_indices.includes(i));
                    const phaseJ = candidatePhases.find(p => p.seg_indices.includes(j));
                    // Most interesting: return-like pairs across different candidate phases
                    if (phaseI && phaseJ && phaseI.candidate_label !== phaseJ.candidate_label) {
                        pairs.push({
                            seg_i:          i,
                            seg_j:          j,
                            t_i_sec:        segments[i].t_start_sec,
                            t_j_sec:        segments[j].t_start_sec,
                            l1_similarity:  parseFloat(dist.toFixed(6)),
                            phase_i:        phaseI.candidate_label,
                            phase_j:        phaseJ.candidate_label,
                            return_note:    `seg ${j} (t=${segments[j].t_start_sec}s, ${phaseJ.candidate_label}) is structurally similar to seg ${i} (t=${segments[i].t_start_sec}s, ${phaseI.candidate_label}) — provisional return-like similarity`,
                        });
                    }
                }
            }
        }
    }
    // Deduplicate: for each (j, phase_i) pair, keep only the closest match
    const seen = new Set();
    return pairs.filter(p => {
        const key = `${p.seg_j}:${p.phase_i}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, 50); // cap at 50 pairs
}

// ─── Ambiguity assessment ─────────────────────────────────────────────────────
function assessAmbiguity(segments, peaks, candidatePhases) {
    const maxScore = Math.max(...peaks.map(p => p.l1_score), 0);
    const nPeaks   = peaks.length;

    if (nPeaks === 0) return { class: "no_strong_boundaries", note: "boundary scores all below threshold — continuous_drift or weak_boundary_signal" };
    if (maxScore < 0.15) return { class: "weak_boundary_signal", note: "boundary scores present but low — phase separation exists but is not sharp" };
    if (nPeaks === 1) return { class: "single_transition", note: "one strong boundary — two candidate phases, no return structure inferrable" };
    if (nPeaks >= 2 && maxScore >= 0.15) {
        // Check if the last phase is similar to the first
        const firstPhase = candidatePhases[0];
        const lastPhase  = candidatePhases.at(-1);
        if (firstPhase && lastPhase && firstPhase !== lastPhase) {
            const dist = l1(firstPhase.mean_band_profile, lastPhase.mean_band_profile);
            if (dist < 0.08)
                return { class: "two_boundaries_with_return", note: "two strong boundaries with return-like similarity between first and last candidate phases" };
            return { class: "two_boundaries_no_clear_return", note: "two strong boundaries; first and last candidate phases diverge" };
        }
        return { class: "multi_boundary", note: `${nPeaks} boundary peaks detected` };
    }
    return { class: "unresolved", note: "ambiguous boundary structure" };
}

// ─── Metric helpers ────────────────────────────────────────────────────────────
function l1(a, b) {
    return a.reduce((s, v, i) => s + Math.abs(v - (b[i] ?? 0)), 0);
}
function normL1(v) {
    const s = v.reduce((a, x) => a + Math.abs(x), 0);
    return s === 0 ? v.map(() => 0) : v.map(x => x / s);
}
function meanVec(vecs) {
    if (!vecs.length) return [];
    const len = vecs[0].length;
    const acc = new Array(len).fill(0);
    for (const v of vecs) v.forEach((x, i) => { acc[i] += x; });
    return acc.map(x => parseFloat((x / vecs.length).toFixed(6)));
}

// ─── Interpretation string ────────────────────────────────────────────────────
function buildInterpretation(ambiguity, peaks, candidatePhases, returnPairs) {
    const nReturn = returnPairs.filter(p => p.phase_i !== p.phase_j).length;
    switch (ambiguity.class) {
        case "two_boundaries_with_return":
            return `${peaks.length} candidate boundary peaks at t=[${peaks.map(p=>p.boundary_t_sec+"s").join(", ")}]; ${candidatePhases.length} candidate phases; ${nReturn} return-like segment pairs between first and last candidate phase — provisional structure: one mid-stream disruption with later return-like convergence`;
        case "two_boundaries_no_clear_return":
            return `${peaks.length} candidate boundary peaks; ${candidatePhases.length} candidate phases; first and last phase profiles diverge — no clear return structure`;
        case "single_transition":
            return `1 candidate boundary peak at t=${peaks[0]?.boundary_t_sec}s; two candidate phases — insufficient for return assessment`;
        case "weak_boundary_signal":
            return `weak boundary scores throughout (max L1=${Math.max(...peaks.map(p=>p.l1_score),0).toFixed(3)}) — continuous drift or low-contrast perturbation`;
        case "no_strong_boundaries":
            return "no strong boundary candidates — stream appears structurally continuous at this lens";
        default:
            return `ambiguity class: ${ambiguity.class}`;
    }
}

// ─── Process one file ─────────────────────────────────────────────────────────
async function processFile(filename) {
    const filePath = path.join(COHORT_DIR, filename);
    let buffer;
    try {
        buffer = await nodeReadFile(filePath);
    } catch (err) {
        return { filename, file_found: false, error: err.message };
    }

    const parsed = parseWav(buffer);
    const decimFactor = Math.round(parsed.sampleRate / TARGET_FS);
    const decimated   = decimate(parsed.mono, decimFactor);
    const effectiveFs = Math.round(parsed.sampleRate / decimFactor);

    // Declared lens metadata
    const lens = {
        nominal_fs:    parsed.sampleRate,
        decim_factor:  decimFactor,
        effective_fs:  effectiveFs,
        window_N:      WINDOW_N,
        hop_N:         HOP_N,
        band_edges:    BAND_EDGES,
        seg_duration_sec: SEG_DURATION_SEC,
        boundary_threshold: BOUNDARY_THRESHOLD,
        return_threshold:   RETURN_THRESHOLD,
        audio_format:  parsed.audioFormat === 3 ? "float32" : `pcm_${parsed.bitsPerSample}bit`,
        num_channels:  parsed.numChannels,
        slice_rule:    "full_stream",
        derived_posture: "read-side observation — not durable, not canon",
    };

    const t0 = Date.now();
    const windowProfiles = computeWindowProfiles(decimated, effectiveFs);
    const segments       = buildSegmentProfiles(windowProfiles, effectiveFs);
    const { all_scores: boundaryScores, candidate_peaks: peaks } = detectBoundaries(segments);
    const candidatePhases = buildCandidatePhases(segments, peaks);
    const recurrenceMatrix = buildRecurrenceMatrix(segments);
    const returnPairs     = findReturnPairs(segments, candidatePhases);
    const ambiguity       = assessAmbiguity(segments, peaks, candidatePhases);
    const interpretation  = buildInterpretation(ambiguity, peaks, candidatePhases, returnPairs);
    const elapsed_ms      = Date.now() - t0;

    // Stream-level lineage
    const streamId = `STR:cmp.${filename}:ch0:audio:wav:${effectiveFs}:full`;

    return {
        filename,
        raw_filepath:       filePath,
        file_found:         true,
        source_id:          `cmp.${filename}`,
        stream_id:          streamId,
        channel:            "ch0",
        modality:           "audio",
        clock_policy_id:    "clock.cmp.v1",
        wav_meta: {
            duration_sec:   parseFloat(parsed.duration_sec.toFixed(3)),
            frame_count:    parsed.frameCount,
            sample_rate:    parsed.sampleRate,
            bits_per_sample: parsed.bitsPerSample,
            audio_format:   parsed.audioFormat,
        },
        lens,
        total_windows:      windowProfiles.length,
        total_segments:     segments.length,
        elapsed_ms,
        // Outputs
        segments,
        boundary_scores:    boundaryScores,
        candidate_boundary_peaks: peaks,
        candidate_phases:   candidatePhases,
        recurrence_matrix:  recurrenceMatrix,
        return_pairs:       returnPairs,
        ambiguity:          ambiguity,
        interpretation,
    };
}

// ─── Cross-file summary ───────────────────────────────────────────────────────
function buildCrossSummary(results) {
    const valid = results.filter(r => r.file_found);
    if (!valid.length) return { class: "no_valid_files", note: "no master files could be loaded" };

    // Count files that have 2+ boundary peaks
    const twoBoundary = valid.filter(r => r.candidate_boundary_peaks?.length >= 2);
    const withReturn  = valid.filter(r => r.ambiguity?.class === "two_boundaries_with_return");

    // Check if all files agree on boundary timing (within 4s tolerance)
    const peakTimes   = valid.map(r => r.candidate_boundary_peaks?.map(p => p.boundary_t_sec) ?? []);
    const majorPeakTs = peakTimes.filter(ts => ts.length >= 2);
    const allAgreeBoundary1 = majorPeakTs.length > 0 && majorPeakTs.every(ts =>
        Math.abs(ts[0] - majorPeakTs[0][0]) < SEG_DURATION_SEC);
    const allAgreeBoundary2 = majorPeakTs.length > 0 && majorPeakTs.every(ts =>
        ts.length >= 2 && Math.abs(ts[1] - majorPeakTs[0][1]) < SEG_DURATION_SEC);

    return {
        files_processed:            valid.length,
        files_with_two_boundaries:  twoBoundary.length,
        files_with_return_structure: withReturn.length,
        cross_file_boundary_agreement: allAgreeBoundary1 && allAgreeBoundary2,
        approximate_boundary_1_sec:  majorPeakTs[0]?.[0] ?? null,
        approximate_boundary_2_sec:  majorPeakTs[0]?.[1] ?? null,
        resilience_class:           withReturn.length === valid.length
            ? "consistent_return_structure_across_cohort"
            : withReturn.length > 0
                ? "partial_return_structure"
                : "no_return_structure",
        cross_file_interpretation:  twoBoundary.length === valid.length && allAgreeBoundary1 && allAgreeBoundary2
            ? `all ${valid.length} master files show two consistent candidate boundary peaks near t≈${majorPeakTs[0]?.[0]}s and t≈${majorPeakTs[0]?.[1]}s — structural three-phase pattern is stable across the cohort (provisional, non-canonical)`
            : `mixed boundary structure across ${valid.length} files`,
        not_canon:         true,
        not_prediction:    true,
        not_promotion:     true,
        diagnostic_posture: "cross-file structural comparison — provisional, probe-local, non-canonical",
    };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Continuous Master-Stream Phase Discernment Probe — Door One Read-Side Only");
    console.log(`  cohort dir    : ${COHORT_DIR}`);
    console.log(`  output dir    : ${OUTPUT_DIR}`);
    console.log(`  files         : ${FILES_TO_RUN.join(", ")}`);
    console.log(`  lens          : ${TARGET_FS}Hz, N=${WINDOW_N}, hop=${HOP_N}, seg=${SEG_DURATION_SEC}s, bands=${JSON.stringify(BAND_EDGES)}`);
    console.log(`  thresholds    : boundary=${BOUNDARY_THRESHOLD}, return=${RETURN_THRESHOLD}`);
    console.log();

    const results = [];
    for (const filename of FILES_TO_RUN) {
        process.stdout.write(`Processing ${filename}... `);
        const result = await processFile(filename);
        results.push(result);

        if (!result.file_found) {
            console.log(`FILE NOT FOUND`);
            continue;
        }
        console.log(`done (${result.elapsed_ms}ms, ${result.total_segments} segs, ${result.candidate_boundary_peaks?.length ?? 0} boundary peaks)`);

        // Per-file console summary
        console.log(`  Ambiguity: ${result.ambiguity.class}`);
        console.log(`  Candidate boundaries:`);
        for (const p of result.candidate_boundary_peaks ?? []) {
            console.log(`    t=${p.boundary_t_sec}s  L1=${p.l1_score}`);
        }
        console.log(`  Candidate phases:`);
        for (const ph of result.candidate_phases ?? []) {
            console.log(`    ${ph.candidate_label}  t=[${ph.t_start_sec}–${ph.t_end_sec}s]  band_profile=[${ph.mean_band_profile.map(v=>v.toFixed(3)).join(", ")}]`);
        }
        console.log(`  Return pairs (cross-phase): ${(result.return_pairs ?? []).filter(p=>p.phase_i!==p.phase_j).length}`);
        console.log(`  → ${result.interpretation}`);
        console.log();
    }

    const crossSummary = buildCrossSummary(results);

    console.log("═".repeat(80));
    console.log("CROSS-FILE SUMMARY");
    console.log("─".repeat(80));
    console.log(`  resilience_class : ${crossSummary.resilience_class}`);
    console.log(`  boundary 1 ≈ t=${crossSummary.approximate_boundary_1_sec}s`);
    console.log(`  boundary 2 ≈ t=${crossSummary.approximate_boundary_2_sec}s`);
    console.log(`  cross_file_agreement: ${crossSummary.cross_file_boundary_agreement}`);
    console.log(`  ${crossSummary.cross_file_interpretation}`);
    console.log(`\n  Posture: ${crossSummary.diagnostic_posture}`);

    // Write outputs
    const report = {
        probe_type:    "continuous_master_phase_probe",
        probe_version: "0.1.0",
        generated_from: "Door One continuous master phase discernment probe — read-side only, non-canonical",
        generated_at:   new Date().toISOString(),
        constitutional_posture: {
            runtime_below_canon:                  true,
            candidate_boundaries_are_provisional: true,
            no_truth_labels:                      true,
            no_runtime_authority:                 true,
            no_workbench_effects:                 true,
            no_canon_minting:                     true,
            no_prediction_claims:                 true,
            findings_provisional:                 true,
            findings_probe_local:                 true,
            findings_non_canonical:               true,
            not_promotion:                        true,
        },
        probe_config: {
            cohort_dir:      COHORT_DIR,
            files_processed: FILES_TO_RUN,
            lens: {
                target_Fs:         TARGET_FS,
                window_N:          WINDOW_N,
                hop_N:             HOP_N,
                band_edges:        BAND_EDGES,
                seg_duration_sec:  SEG_DURATION_SEC,
                boundary_threshold: BOUNDARY_THRESHOLD,
                return_threshold:   RETURN_THRESHOLD,
            },
            algorithm_notes: {
                segmentation:   "L1 distance between adjacent macro-segment mean profiles; local peak detection above boundary_threshold",
                recurrence:     "pairwise L1 distances between all segment mean profiles",
                return_pairs:   "segment pairs from different candidate phases with L1 < return_threshold and non-adjacent (gap > 2 segs)",
                phase_labels:   "candidate_A, candidate_B, candidate_C — provisional labels based on boundary peak positions; not ground truth",
            },
        },
        per_file_results: results,
        cross_file_summary: crossSummary,
    };

    const reportPath = path.join(OUTPUT_DIR, "continuous_master_phase_report.json");
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. BasinOp unchanged. No runtime authority modified. Read-side only.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
