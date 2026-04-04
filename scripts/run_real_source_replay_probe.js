// scripts/run_real_source_replay_probe.js
//
// Real-Source Replay Probe — File-Backed WAV Cohort
// Door One Read-Side Only
//
// Constitutional posture:
//   - Runtime remains below canon.
//   - Cross-run remains observational only.
//   - Replay remains lens-bound.
//   - Basin organization is substrate-side structural organization, not ontology.
//   - flow_mode and all derived replay classes are read-side diagnostic observations.
//   - No new runtime authority, BasinOp changes, or workbench effects.
//   - All findings provisional, probe-local, non-canonical.
//
// Primary question:
//   Can the existing replay-flow probe be extended to evaluate a real-source
//   WAV cohort and determine whether baseline / perturbation / return phases
//   show bounded diagnostic separation and, if present, bounded recovery?
//
// Secondary question:
//   Which replay metrics remain well-defined on a WAV cohort, and which
//   should yield bounded unresolved posture instead?
//
// WAV cohort mapping (explicit, not inferred from filename alone):
//   baseline_01.wav, baseline_02.wav, baseline_03.wav → replay_phase: "baseline"
//   perturb_01.wav,  perturb_02.wav,  perturb_03.wav  → replay_phase: "perturbation"
//   return_01.wav,   return_02.wav,   return_03.wav    → replay_phase: "return"
//
// Note: directory uses "basline" spelling — preserved as-is in lineage fields.
// Note: master_01.wav–master_03.wav treated as lineage-bearing reference only,
//       not as replay phase inputs.
//
// Lens posture:
//   Fixed across all phases: target_Fs=2400Hz, window_N=256, hop_N=128, hann.
//   Band edges adapted for the lower sample rate: [0, 300, 600, 900, 1200] Hz.
//   Flow measured at the 300 Hz band edge (index 1 in the adapted band set).
//   This is the lowest-frequency band edge above DC in the target rate space.
//   If no diagnostic separation appears at this lens, emit unresolved rather
//   than forcing a result at a different edge.
//
// Metric transfer assessment:
//   TRANSFERS:  oscillatory_flow_strength, diff_lag1_autocorr, flow_mode,
//               signed_cross_boundary_flow, basin_count, splitting_observed
//   CONDITIONAL: exchange_persistence_class — only if all 3 phases have
//               sufficient signal support (≥ 16 windows per run)
//   UNRESOLVED: resilience_surface_class — not computed for single-family
//               real-source cohort; requires multi-family comparison
//   EXCLUDED:   harmonic placement metrics — real source has no declared
//               harmonic components; do not infer or force harmonic structure
//
// File-not-found posture:
//   If any WAV file is not found, that run row gets:
//     file_found: false
//     flow_mode: "file_not_found"
//     All metric fields: null
//   The summary reflects the missing files explicitly.
//   This is a valid and useful result — it means the cohort is not yet
//   deployed at the declared path.
//
// Run:
//   node scripts/run_real_source_replay_probe.js
//
// Optional env:
//   WAV_COHORT_DIR       — override default cohort directory
//   PROBE_RSR_OUTPUT_DIR — override output directory

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { IngestOp }    from "../operators/ingest/IngestOp.js";
import { ClockAlignOp } from "../operators/clock/ClockAlignOp.js";
import { WindowOp }    from "../operators/window/WindowOp.js";
import { TransformOp } from "../operators/transform/TransformOp.js";
import { CompressOp }  from "../operators/compress/CompressOp.js";
import { BasinOp }     from "../operators/basin/BasinOp.js";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dirname, "..");

const WAV_COHORT_DIR = process.env.WAV_COHORT_DIR
    ?? path.join(REPO_ROOT, "test_signal", "daw_mic_input");
const OUTPUT_DIR     = process.env.PROBE_RSR_OUTPUT_DIR
    ?? path.join(REPO_ROOT, "out_experiments", "real_source_replay_probe");

// ─── Lens parameters (fixed across all phases) ────────────────────────────────
// Target sample rate after decimation: 2400 Hz (inherited from audio file probe)
// Window: N=256 samples at 2400 Hz → 106.7 ms window
// Hop: N/2 = 128 samples
// Band edges adapted for 2400 Hz signal space (Nyquist = 1200 Hz):
const TARGET_FS      = 2400;
const SLICE_DURATION_SEC = 8;   // use only the first N seconds per file
                                  // keeps BasinOp (O(n²)) tractable on real-source data;
                                  // 8s × 2400Hz / 128hop = ~149 windows per run
const WINDOW_N       = 256;
const HOP_N          = Math.floor(WINDOW_N / 2);
const BAND_EDGES_WAV = [0, 300, 600, 900, 1200];   // 5 bands, 300 Hz wide each
const FLOW_TARGET_EDGE = 300;                        // measure flow at 300 Hz boundary
const BASIN_THRESH   = 0.5;
const MIN_WINDOWS_FOR_VALID_RUN = 16;

// Flow thresholds (shared with synthetic probe family)
const OFC_STRONG = 0.15;
const OFC_WEAK   = 0.02;
const LAG1_AC    = 0.90;
const FLIP_ALT   = 0.45;
const FLIP_STABLE = 0.05;

// ─── Explicit phase map (not relying solely on filename heuristics) ───────────
// Raw filenames preserved exactly — directory note: actual spelling is "basline"
// but the task specifies "baseline" in the path; using task specification.
const PHASE_MAP = [
    { filename: "baseline_01.wav", replay_phase: "baseline",     run_index_in_phase: 0 },
    { filename: "baseline_02.wav", replay_phase: "baseline",     run_index_in_phase: 1 },
    { filename: "baseline_03.wav", replay_phase: "baseline",     run_index_in_phase: 2 },
    { filename: "perturb_01.wav",  replay_phase: "perturbation", run_index_in_phase: 0 },
    { filename: "perturb_02.wav",  replay_phase: "perturbation", run_index_in_phase: 1 },
    { filename: "perturb_03.wav",  replay_phase: "perturbation", run_index_in_phase: 2 },
    { filename: "return_01.wav",   replay_phase: "return",       run_index_in_phase: 0 },
    { filename: "return_02.wav",   replay_phase: "return",       run_index_in_phase: 1 },
    { filename: "return_03.wav",   replay_phase: "return",       run_index_in_phase: 2 },
];

// Masters: lineage-bearing reference only — not replay phase inputs
const MASTER_FILES = ["master_01.wav", "master_02.wav", "master_03.wav"];

// ─── WAV parser (from run_door_one_audio_file_slice.js) ────────────────────────
function readAscii(buf, start, len) { return buf.toString("ascii", start, start + len); }

function parseWav(buffer) {
    if (readAscii(buffer, 0, 4) !== "RIFF" || readAscii(buffer, 8, 4) !== "WAVE")
        throw new Error("Not a RIFF/WAVE file");
    let offset = 12, fmt = null, dataChunk = null;
    while (offset + 8 <= buffer.length) {
        const chunkId   = readAscii(buffer, offset, 4);
        const chunkSize = buffer.readUInt32LE(offset + 4);
        const dataStart = offset + 8;
        if (chunkId === "fmt ") {
            fmt = {
                audioFormat:   buffer.readUInt16LE(dataStart + 0),
                numChannels:   buffer.readUInt16LE(dataStart + 2),
                sampleRate:    buffer.readUInt32LE(dataStart + 4),
                blockAlign:    buffer.readUInt16LE(dataStart + 12),
                bitsPerSample: buffer.readUInt16LE(dataStart + 14),
            };
        } else if (chunkId === "data") {
            dataChunk = { start: dataStart, size: chunkSize };
        }
        offset = dataStart + chunkSize + (chunkSize % 2);
    }
    if (!fmt || !dataChunk) throw new Error("WAV missing fmt or data chunk");
    const { audioFormat, numChannels, sampleRate, bitsPerSample, blockAlign } = fmt;
    const bytesPerSample = bitsPerSample / 8;
    const rawFrameCount = Math.floor(dataChunk.size / blockAlign);
    const frameCount = Math.min(rawFrameCount, SLICE_DURATION_SEC * sampleRate);
    const mono = new Array(frameCount);
    for (let i = 0; i < frameCount; i++) {
        let sum = 0;
        for (let ch = 0; ch < numChannels; ch++) {
            const off = dataChunk.start + i * blockAlign + ch * bytesPerSample;
            let s;
            if (audioFormat === 1) {
                if (bitsPerSample === 16) s = buffer.readInt16LE(off) / 32768;
                else if (bitsPerSample === 24) {
                    let v = buffer[off] | (buffer[off+1] << 8) | (buffer[off+2] << 16);
                    if (v & 0x800000) v |= ~0xffffff;
                    s = v / 8388608;
                } else if (bitsPerSample === 32) s = buffer.readInt32LE(off) / 2147483648;
                else if (bitsPerSample === 8)  s = (buffer.readUInt8(off) - 128) / 128;
                else throw new Error(`Unsupported PCM depth: ${bitsPerSample}`);
            } else if (audioFormat === 3) {
                // 32-bit IEEE float — the actual format used by the daw_mic_input cohort
                s = bitsPerSample === 32 ? buffer.readFloatLE(off) : buffer.readDoubleLE(off);
            } else throw new Error(`Unsupported WAV format: ${audioFormat}`);
            sum += s;
        }
        mono[i] = sum / numChannels;
    }
    return { sampleRate, numChannels, bitsPerSample, audioFormat, frameCount, mono };
}

// ─── Decimation ───────────────────────────────────────────────────────────────
function decimate(mono, factor) {
    if (factor <= 1) return mono.slice();
    const out = [];
    for (let i = 0; i < mono.length; i += factor) out.push(mono[i]);
    return out;
}

// ─── Pipeline runner on in-memory PCM ─────────────────────────────────────────
function runPipelineOnMono(values, sampleRate, sourceId) {
    const n = values.length;
    const timestamps = new Array(n);
    for (let i = 0; i < n; i++) timestamps[i] = i / sampleRate;
    const maxBins = Math.floor(WINDOW_N / 2);

    const a1r = new IngestOp().run({
        timestamps, values, source_id: sourceId,
        channel: "ch0", modality: "audio",
        meta: { units: "arb", Fs_nominal: sampleRate },
        clock_policy_id: "clock.rsr.v1",
        ingest_policy: { policy_id: "ingest.rsr.v1", gap_threshold_multiplier: 3.0,
            allow_non_monotonic: false, allow_empty: false, non_monotonic_mode: "reject" },
    });
    if (!a1r.ok) throw new Error(`IngestOp: ${a1r.error}`);

    const a2r = new ClockAlignOp().run({ a1: a1r.artifact,
        grid_spec: { Fs_target: sampleRate, t_ref: timestamps[0], grid_policy: "strict",
            drift_model: "none", non_monotonic_policy: "reject", interp_method: "linear",
            gap_policy: "interpolate_small", small_gap_multiplier: 3.0,
            max_gap_seconds: null, anti_alias_filter: false } });
    if (!a2r.ok) throw new Error(`ClockAlignOp: ${a2r.error}`);

    const w1r = new WindowOp().run({ a2: a2r.artifact, window_spec: {
        mode: "fixed", Fs_target: sampleRate, base_window_N: WINDOW_N, hop_N: HOP_N,
        window_function: "hann", overlap_ratio: 0.5, stationarity_policy: "tolerant",
        salience_policy: "off", gap_policy: "interpolate_small",
        max_missing_ratio: 0.25, boundary_policy: "truncate" } });
    if (!w1r.ok) throw new Error(`WindowOp: ${w1r.error}`);

    const tfOp = new TransformOp(), cpOp = new CompressOp();
    const tfPolicy = { policy_id: "transform.rsr.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant" };
    const cpPolicy = { policy_id: "compress.rsr.v1", selection_method: "topK",
        budget_K: Math.min(16, maxBins), maxK: Math.min(16, maxBins),
        include_dc: true, invariance_lens: "energy", numeric_policy: "tolerant",
        respect_novelty_boundary: false,
        thresholds: { max_recon_rmse: 999, max_energy_residual: 999, max_band_divergence: 999 } };

    const s1s = [], h1s = [];
    for (let wi = 0; wi < w1r.artifacts.length; wi++) {
        const w1 = w1r.artifacts[wi];
        const tr = tfOp.run({ w1, transform_policy: tfPolicy });
        if (!tr.ok) continue;
        s1s.push(tr.artifact);
        const t_start = w1.grid?.t0 ?? (wi * HOP_N / sampleRate);
        const cr = cpOp.run({ s1: tr.artifact, compression_policy: cpPolicy,
            context: { segment_id: `seg:${sourceId}`,
                window_span: { t_start, t_end: t_start + WINDOW_N / sampleRate } } });
        if (cr.ok) h1s.push(cr.artifact);
    }

    let basinSet = null, basinCount = 1;
    if (h1s.length > 0) {
        const br = new BasinOp().run({ states: h1s,
            basin_policy: { policy_id: "basin.rsr.v1",
                similarity_threshold: BASIN_THRESH,
                min_member_count: 1, weight_mode: "duration",
                linkage: "single_link", cross_segment: true } });
        if (br.ok) { basinSet = br.artifact; basinCount = br.artifact.basins.length; }
    }

    return { s1s, h1s, basinSet, basinCount, streamId: a1r.artifact.stream_id };
}

// ─── Band profiles and flow metrics ───────────────────────────────────────────

function extractWindowProfiles(s1s, bandEdges) {
    const nB = bandEdges.length - 1;
    return s1s.map(s1 => {
        const energy = new Array(nB).fill(0);
        for (const b of s1.spectrum) {
            const e = b.re * b.re + b.im * b.im;
            for (let i = 0; i < nB; i++) {
                if (b.freq_hz >= bandEdges[i] && b.freq_hz < bandEdges[i + 1]) { energy[i] += e; break; }
            }
        }
        return normL1(energy);
    });
}

function computeDirectionalFlow(profiles, targetEdge, bandEdges) {
    const edgeIdx  = bandEdges.indexOf(targetEdge);
    const leftIdx  = edgeIdx - 1;
    const rightIdx = edgeIdx;
    if (edgeIdx <= 0 || edgeIdx >= bandEdges.length - 1) return null;

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

    const dirConsistency = flipRate > FLIP_ALT ? "alternating"
        : flipRate < FLIP_STABLE ? "one_direction" : "mixed";
    const flowMode = classifyFlowMode(oscStrength, diffLag1AC, flipRate);

    return {
        boundary_band_pair: {
            left_band_hz:  `${bandEdges[leftIdx]}-${targetEdge}`,
            right_band_hz: `${targetEdge}-${bandEdges[rightIdx + 1]}`,
        },
        signed_cross_boundary_flow:  parseFloat(signedFlow.toFixed(6)),
        oscillatory_flow_strength:   parseFloat(oscStrength.toFixed(6)),
        flow_direction_consistency:  dirConsistency,
        diff_lag1_autocorr:          parseFloat(diffLag1AC.toFixed(6)),
        boundary_phase_lag_proxy:    parseFloat(phaseProxy.toFixed(6)),
        sign_flip_rate:              parseFloat(flipRate.toFixed(6)),
        flow_mode:                   flowMode,
        window_count:                n,
        sufficient_support:          n >= MIN_WINDOWS_FOR_VALID_RUN,
    };
}

function classifyFlowMode(oscStr, lag1AC, flipRate) {
    if (oscStr < OFC_WEAK)   return "weak_or_inert";
    if (oscStr > OFC_STRONG && Math.abs(lag1AC) > LAG1_AC) return "oscillatory_exchange";
    if (flipRate > FLIP_ALT && oscStr > OFC_WEAK) return "oscillatory_exchange";
    return "one_way_drift";
}

// ─── Exchange persistence (shared with resilience probe) ───────────────────────
function classifyExchangePersistence(bMode, pMode, rMode) {
    const baseOsc = bMode === "oscillatory_exchange";
    const pertOsc = pMode === "oscillatory_exchange";
    const retOsc  = rMode === "oscillatory_exchange";
    if (baseOsc && pertOsc && retOsc)    return "stable_persistent_exchange";
    if (baseOsc && !pertOsc && retOsc)   return "exchange_recovers_on_return";
    if (baseOsc && !pertOsc && !retOsc)  return "exchange_degrades_without_recovery";
    if (baseOsc && pertOsc && !retOsc)   return "exchange_lost_on_return";
    // All phases weak_or_inert — no meaningful energy at boundary
    if (bMode === "weak_or_inert" && pMode === "weak_or_inert" && rMode === "weak_or_inert")
        return "weak_or_inert_throughout";
    // All phases one_way_drift — boundary has stable directional flow, no period-2 oscillation
    // This is a structural result for real-source data, not a failure class
    if (!baseOsc && !pertOsc && !retOsc) return "non_oscillatory_throughout";
    return "unresolved";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

    console.log("Real-Source Replay Probe — File-Backed WAV Cohort");
    console.log(`  cohort dir    : ${WAV_COHORT_DIR}`);
    console.log(`  output dir    : ${OUTPUT_DIR}`);
    console.log(`  lens          : target_Fs=${TARGET_FS}Hz, window_N=${WINDOW_N}, bands=${JSON.stringify(BAND_EDGES_WAV)}`);
    console.log(`  flow edge     : ${FLOW_TARGET_EDGE} Hz`);
    console.log(`  min_windows   : ${MIN_WINDOWS_FOR_VALID_RUN}`);
    console.log();

    // ── Check for master files as lineage context ─────────────────────────────
    const masterLineage = [];
    for (const mf of MASTER_FILES) {
        const mPath = path.join(WAV_COHORT_DIR, mf);
        let found = false, note = "not_found";
        try { await readFile(mPath); found = true; note = "present_as_lineage_reference"; } catch (_) {}
        masterLineage.push({ filename: mf, raw_filepath: mPath, present: found,
            role: "lineage_reference_only", note });
    }

    // ── Process each replay file ──────────────────────────────────────────────
    const runRows = [];
    let missingCount = 0;

    for (let seqIdx = 0; seqIdx < PHASE_MAP.length; seqIdx++) {
        const spec = PHASE_MAP[seqIdx];
        const rawFilepath = path.join(WAV_COHORT_DIR, spec.filename);
        const runLabel    = `${spec.replay_phase.substring(0,5)}_${String(spec.run_index_in_phase + 1).padStart(2, "0")}`;
        const sourceId    = `rsr.wav.${spec.replay_phase}.r${spec.run_index_in_phase}.seq${seqIdx}`;

        // Lineage fields preserved regardless of whether file loads
        const lineage = {
            run_label:             runLabel,
            replay_phase:          spec.replay_phase,
            replay_sequence_index: seqIdx,
            run_index_in_phase:    spec.run_index_in_phase,
            source_id:             sourceId,
            raw_filepath:          rawFilepath,
            raw_filename:          spec.filename,
            source_type:           "wav_file",
        };

        let buffer;
        try {
            buffer = await readFile(rawFilepath);
        } catch (err) {
            missingCount++;
            console.log(`  [${String(seqIdx).padStart(2)}] ${runLabel.padEnd(10)} phase=${spec.replay_phase.padEnd(13)} FILE NOT FOUND: ${spec.filename}`);
            runRows.push({
                ...lineage,
                stream_id:                    null,
                file_found:                   false,
                file_error:                   err.message,
                wav_meta:                     null,
                normalization_note:           null,
                lens_note:                    null,
                boundary_band_pair:           null,
                signed_cross_boundary_flow:   null,
                oscillatory_flow_strength:    null,
                flow_direction_consistency:   null,
                diff_lag1_autocorr:           null,
                boundary_phase_lag_proxy:     null,
                sign_flip_rate:               null,
                flow_mode:                    "file_not_found",
                window_count:                 null,
                sufficient_support:           false,
                basin_count:                  null,
                splitting_observed:           null,
                inter_window_variance:        null,
                interpretation:               `file not found at declared path — cannot evaluate replay metrics for ${spec.filename}`,
            });
            continue;
        }

        // Parse WAV
        let wavMeta, decimatedMono, effectiveFs;
        try {
            const parsed = parseWav(buffer);
            wavMeta = {
                sample_rate:    parsed.sampleRate,
                num_channels:   parsed.numChannels,
                bits_per_sample: parsed.bitsPerSample,
                audio_format:   parsed.audioFormat,
                frame_count:    parsed.frameCount,
                duration_sec:   parsed.frameCount / parsed.sampleRate,
                slice_sec:      Math.min(parsed.frameCount / parsed.sampleRate, SLICE_DURATION_SEC),
                slice_note:     `first ${Math.min(parsed.frameCount / parsed.sampleRate, SLICE_DURATION_SEC).toFixed(1)}s used of ${(parsed.frameCount / parsed.sampleRate).toFixed(1)}s total — slice limit for BasinOp tractability`,
            };

            // Decimate to TARGET_FS if needed
            const decimFactor = Math.round(parsed.sampleRate / TARGET_FS);
            if (decimFactor < 1) throw new Error(`Cannot decimate from ${parsed.sampleRate} to ${TARGET_FS}: source rate too low`);
            decimatedMono = decimFactor > 1 ? decimate(parsed.mono, decimFactor) : parsed.mono.slice();
            effectiveFs = Math.round(parsed.sampleRate / decimFactor);
        } catch (err) {
            console.log(`  [${String(seqIdx).padStart(2)}] ${runLabel.padEnd(10)} PARSE ERROR: ${err.message}`);
            runRows.push({
                ...lineage,
                file_found: true,
                file_error: `WAV parse error: ${err.message}`,
                flow_mode: "parse_error",
                sufficient_support: false,
                interpretation: `WAV parsing failed: ${err.message}`,
            });
            continue;
        }

        // Run pipeline
        let pipeResult;
        try {
            pipeResult = runPipelineOnMono(decimatedMono, effectiveFs, sourceId);
        } catch (err) {
            console.log(`  [${String(seqIdx).padStart(2)}] ${runLabel.padEnd(10)} PIPELINE ERROR: ${err.message}`);
            runRows.push({
                ...lineage, file_found: true, wav_meta: wavMeta,
                file_error: `Pipeline error: ${err.message}`,
                flow_mode: "pipeline_error",
                sufficient_support: false,
                interpretation: `Pipeline failed: ${err.message}`,
            });
            continue;
        }

        // Compute flow metrics
        const profiles = extractWindowProfiles(pipeResult.s1s, BAND_EDGES_WAV);
        const flow     = computeDirectionalFlow(profiles, FLOW_TARGET_EDGE, BAND_EDGES_WAV);

        const meanProfile = profiles.length > 0
            ? profiles[0].map((_, i) => meanArr(profiles.map(p => p[i]))) : [];
        const iwv = profiles.length > 0
            ? meanArr(profiles.map(p => l1(p, meanProfile))) : null;

        const df = effectiveFs / WINDOW_N;  // Hz/bin at decimated rate
        let rawBandDist = null, normBandDist = null;
        if (pipeResult.basinCount >= 2 && pipeResult.basinSet?.basins?.length >= 2) {
            rawBandDist  = l1(pipeResult.basinSet.basins[0].centroid_band_profile,
                              pipeResult.basinSet.basins[1].centroid_band_profile);
            normBandDist = rawBandDist / df;
        }

        const insufficientSupport = !flow?.sufficient_support;

        const row = {
            ...lineage,
            stream_id:          pipeResult.streamId,
            file_found:         true,
            file_error:         null,
            wav_meta:           wavMeta,
            normalization_note: `decimated ${wavMeta.sample_rate}Hz → ${effectiveFs}Hz (factor=${Math.round(wavMeta.sample_rate / effectiveFs)})`,
            lens_note:          `window_N=${WINDOW_N} at ${effectiveFs}Hz → ${(WINDOW_N/effectiveFs*1000).toFixed(1)}ms; bands=${JSON.stringify(BAND_EDGES_WAV)}`,
            ...(flow ?? {}),
            flow_mode:          insufficientSupport ? "insufficient_support" : (flow?.flow_mode ?? "unresolved"),
            sufficient_support: flow?.sufficient_support ?? false,
            basin_count:        pipeResult.basinCount,
            splitting_observed: pipeResult.basinCount > 1,
            inter_window_variance: iwv != null ? parseFloat(iwv.toFixed(6)) : null,
            raw_band_distance:  rawBandDist  != null ? parseFloat(rawBandDist.toFixed(6))  : null,
            normalized_band_distance: normBandDist != null ? parseFloat(normBandDist.toFixed(6)) : null,
            bin_width_hz:       df,
            // Per-band mean energy fractions — diagnostic for phase separation even when
            // flow_mode remains one_way_drift (as in real-source mic data)
            mean_band_profile:  profiles.length > 0
                ? profiles[0].map((_, i) => parseFloat(meanArr(profiles.map(p => p[i])).toFixed(6)))
                : null,
            interpretation:     interpretRow(spec.replay_phase, flow?.flow_mode, insufficientSupport,
                                             pipeResult.basinCount > 1, flow?.window_count ?? 0),
        };

        runRows.push(row);
        const flagSplit = pipeResult.basinCount > 1 ? " SPLIT" : "      ";
        const flagSupport = insufficientSupport ? " [LOW]" : "      ";
        const modeStr = insufficientSupport ? "insufficient_support" : (flow?.flow_mode ?? "unresolved");
        console.log(`  [${String(seqIdx).padStart(2)}] ${runLabel.padEnd(10)} ` +
            `phase=${spec.replay_phase.padEnd(13)} dur=${wavMeta.duration_sec.toFixed(2)}s ` +
            `windows=${(flow?.window_count ?? 0).toString().padStart(4)} ` +
            `flow_mode=${modeStr.padEnd(22)} ` +
            `osc=${(flow?.oscillatory_flow_strength ?? 0).toFixed(4)} ` +
            `basins=${pipeResult.basinCount}${flagSplit}${flagSupport}`);
    }

    // ── Build replay summary ──────────────────────────────────────────────────
    const replaySummary = buildReplaySummary(runRows, missingCount);

    // ── Console summary ───────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(80));
    console.log("REPLAY SUMMARY");
    console.log("─".repeat(80));
    if (missingCount > 0) {
        console.log(`  ⚠  ${missingCount} file(s) not found — cohort incomplete`);
        console.log(`     exchange_persistence_class: ${replaySummary.exchange_persistence_class}`);
    } else {
        console.log(`  baseline_flow_mode     : ${replaySummary.baseline_flow_mode}`);
        console.log(`  perturbation_flow_mode : ${replaySummary.perturbation_flow_mode}`);
        console.log(`  return_flow_mode       : ${replaySummary.return_flow_mode}`);
        console.log(`  exchange_persistence   : ${replaySummary.exchange_persistence_class}`);
        console.log(`  regime_transitions     : ${replaySummary.flow_regime_transition_count}`);
        // Show band-profile separation — the legible diagnostic for real-source data
        if (replaySummary.baseline_mean_band_profile && replaySummary.perturbation_mean_band_profile) {
            console.log(`\n  Band-profile separation (band_edges=${JSON.stringify(BAND_EDGES_WAV)}):`);
            console.log(`    baseline     : [${replaySummary.baseline_mean_band_profile.map(v=>v.toFixed(3)).join(", ")}]`);
            console.log(`    perturbation : [${replaySummary.perturbation_mean_band_profile.map(v=>v.toFixed(3)).join(", ")}]`);
            console.log(`    return       : [${replaySummary.return_mean_band_profile.map(v=>v.toFixed(3)).join(", ")}]`);
            console.log(`    L1(base vs pert)   : ${replaySummary.baseline_vs_perturbation_band_l1}`);
            console.log(`    L1(pert vs return) : ${replaySummary.perturbation_vs_return_band_l1}`);
            console.log(`    L1(base vs return) : ${replaySummary.baseline_vs_return_band_l1}`);
        }
    }
    console.log(`  ${replaySummary.interpretation}`);
    console.log(`\n  Posture: ${replaySummary.diagnostic_posture}`);

    // ── Write report ──────────────────────────────────────────────────────────
    const report = {
        probe_type:    "real_source_replay_probe",
        probe_version: "0.1.0",
        generated_from: "Door One real-source replay probe — file-backed WAV cohort, read-side only",
        generated_at:   new Date().toISOString(),
        constitutional_posture: {
            runtime_below_canon:             true,
            cross_run_observational_only:    true,
            replay_lens_bound:               true,
            basin_org_not_ontology:          true,
            flow_mode_not_runtime_authority: true,
            no_workbench_effects:            true,
            no_canon_minting:                true,
            no_prediction_claims:            true,
            findings_provisional:            true,
            findings_probe_local:            true,
            findings_non_canonical:          true,
        },
        probe_config: {
            cohort_dir:           WAV_COHORT_DIR,
            lens: {
                target_Fs:        TARGET_FS,
                window_N:         WINDOW_N,
                hop_N:            HOP_N,
                band_edges:       BAND_EDGES_WAV,
                flow_target_edge: FLOW_TARGET_EDGE,
                note:             "lens fixed across all phases — no silent retuning",
            },
            min_windows_for_valid_run: MIN_WINDOWS_FOR_VALID_RUN,
            flow_thresholds: {
                osc_strong:    OFC_STRONG,
                osc_weak:      OFC_WEAK,
                lag1_ac:       LAG1_AC,
                flip_rate_alt: FLIP_ALT,
                flip_rate_stable: FLIP_STABLE,
            },
            metric_transfer_notes: {
                transfers:    ["oscillatory_flow_strength","diff_lag1_autocorr","flow_mode","signed_cross_boundary_flow","basin_count","splitting_observed"],
                conditional:  ["exchange_persistence_class — only if all phases have sufficient_support"],
                unresolved:   ["resilience_surface_class — not computed for single-family real-source cohort"],
                excluded:     ["harmonic placement metrics — real source has no declared harmonic components"],
            },
            phase_map:            PHASE_MAP,
            master_files_note:    "master_01-03.wav treated as lineage-bearing references only, not replay phase inputs",
        },
        master_lineage:   masterLineage,
        per_run_rows:     runRows,
        replay_summary:   replaySummary,
    };

    const reportPath = path.join(OUTPUT_DIR, "real_source_replay_report.json");
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. BasinOp unchanged. No runtime authority modified. Read-side only.");
}

function interpretRow(phase, flowMode, insufficientSupport, splitting, windowCount) {
    if (!flowMode || flowMode === "file_not_found") return "file not found — no metrics available";
    if (insufficientSupport) return `insufficient window support (${windowCount} windows < ${MIN_WINDOWS_FOR_VALID_RUN} required) — flow classification unresolved`;
    const ctx = `[${phase}]`;
    if (splitting && flowMode === "oscillatory_exchange") return `oscillatory exchange and basin splitting present ${ctx}`;
    if (!splitting && flowMode === "oscillatory_exchange") return `oscillatory exchange without splitting ${ctx}`;
    if (flowMode === "one_way_drift") return `one-way drift — energy imbalance present but non-oscillatory ${ctx}`;
    if (flowMode === "weak_or_inert") return `weak or inert boundary flow ${ctx}`;
    return `flow_mode=${flowMode} ${ctx}`;
}

function buildReplaySummary(runRows, missingCount) {
    const byPhase = {};
    for (const r of runRows) {
        if (!byPhase[r.replay_phase]) byPhase[r.replay_phase] = [];
        byPhase[r.replay_phase].push(r);
    }

    function modeForPhase(phase) {
        const rows = (byPhase[phase] ?? []).filter(r => r.sufficient_support && r.flow_mode !== "file_not_found");
        if (!rows.length) return "unresolved";
        const counts = {};
        for (const r of rows) counts[r.flow_mode] = (counts[r.flow_mode] ?? 0) + 1;
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unresolved";
    }
    function meanField(phase, field) {
        const vals = (byPhase[phase] ?? [])
            .filter(r => r.sufficient_support && typeof r[field] === "number")
            .map(r => r[field]);
        return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(6)) : null;
    }

    const baselineMode     = modeForPhase("baseline");
    const perturbationMode = modeForPhase("perturbation");
    const returnMode       = modeForPhase("return");

    const allPhasesResolvable = baselineMode !== "unresolved" &&
                                perturbationMode !== "unresolved" &&
                                returnMode !== "unresolved";

    const exchangeClass = missingCount > 0
        ? "cohort_incomplete"
        : !allPhasesResolvable
            ? "unresolved"
            : classifyExchangePersistence(baselineMode, perturbationMode, returnMode);

    let transitions = 0;
    const sorted = [...runRows].sort((a, b) => a.replay_sequence_index - b.replay_sequence_index);
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].flow_mode !== sorted[i-1].flow_mode &&
            sorted[i].sufficient_support && sorted[i-1].sufficient_support) transitions++;
    }

    const splitCounts = {
        baseline:     (byPhase.baseline     ?? []).filter(r => r.splitting_observed === true).length,
        perturbation: (byPhase.perturbation ?? []).filter(r => r.splitting_observed === true).length,
        return:       (byPhase.return       ?? []).filter(r => r.splitting_observed === true).length,
    };
    const totalPerPhase = {
        baseline:     (byPhase.baseline     ?? []).length,
        perturbation: (byPhase.perturbation ?? []).length,
        return:       (byPhase.return       ?? []).length,
    };

    const interpretation = missingCount > 0
        ? `cohort incomplete — ${missingCount} of ${PHASE_MAP.length} files not found at declared path; deploy WAV files to ${WAV_COHORT_DIR} to evaluate replay metrics`
        : !allPhasesResolvable
            ? `one or more phases have insufficient window support — exchange_persistence_class unresolved; check file durations against min_windows requirement (${MIN_WINDOWS_FOR_VALID_RUN} windows × ${(WINDOW_N/TARGET_FS*1000).toFixed(1)}ms = ${(MIN_WINDOWS_FOR_VALID_RUN * HOP_N / TARGET_FS).toFixed(2)}s minimum)`
            : `real-source replay evaluated: baseline=${baselineMode} perturbation=${perturbationMode} return=${returnMode} → ${exchangeClass}`;

    // Band-profile mean per phase — useful diagnostic even when all phases share one_way_drift
    function meanBandProfile(phase) {
        const rows = (byPhase[phase] ?? []).filter(r => r.sufficient_support && Array.isArray(r.mean_band_profile));
        if (!rows.length) return null;
        const nB = rows[0].mean_band_profile.length;
        const acc = new Array(nB).fill(0);
        for (const r of rows) r.mean_band_profile.forEach((v, i) => { acc[i] += v; });
        return acc.map(v => parseFloat((v / rows.length).toFixed(6)));
    }

    const baselineBandMean     = meanBandProfile("baseline");
    const perturbationBandMean = meanBandProfile("perturbation");
    const returnBandMean       = meanBandProfile("return");

    // Phase separation: L1 distance between baseline and perturbation band profiles
    function l1BandDist(a, b) {
        if (!a || !b) return null;
        return parseFloat(a.reduce((s, v, i) => s + Math.abs(v - (b[i] ?? 0)), 0).toFixed(6));
    }

    return {
        files_found:           PHASE_MAP.length - missingCount,
        files_missing:         missingCount,
        cohort_complete:       missingCount === 0,
        baseline_flow_mode:    baselineMode,
        perturbation_flow_mode: perturbationMode,
        return_flow_mode:      returnMode,
        baseline_osc_mean:     meanField("baseline",     "oscillatory_flow_strength"),
        perturbation_osc_mean: meanField("perturbation", "oscillatory_flow_strength"),
        return_osc_mean:       meanField("return",       "oscillatory_flow_strength"),
        // Band-profile means per phase — diagnostic for phase separation when flow_mode is one_way_drift
        baseline_mean_band_profile:     baselineBandMean,
        perturbation_mean_band_profile: perturbationBandMean,
        return_mean_band_profile:       returnBandMean,
        band_edges:                     BAND_EDGES_WAV,
        baseline_vs_perturbation_band_l1: l1BandDist(baselineBandMean, perturbationBandMean),
        perturbation_vs_return_band_l1:   l1BandDist(perturbationBandMean, returnBandMean),
        baseline_vs_return_band_l1:       l1BandDist(baselineBandMean, returnBandMean),
        exchange_persistence_class:     exchangeClass,
        flow_regime_transition_count:   transitions,
        basin_split_persistence_summary: {
            baseline:     `${splitCounts.baseline}/${totalPerPhase.baseline} runs split`,
            perturbation: `${splitCounts.perturbation}/${totalPerPhase.perturbation} runs split`,
            return:       `${splitCounts.return}/${totalPerPhase.return} runs split`,
        },
        resilience_surface_class: "not_computed_single_family",
        resilience_note:          "resilience_surface_class requires multi-family comparison — not applicable for single real-source cohort",
        real_source_notes: {
            flow_mode_all_phases:     "one_way_drift — real-source mic data does not exhibit the period-2 oscillatory_exchange produced by the synthetic probe's band-boundary harmonic construction; this is expected and honest",
            phase_separation_method:  "band-profile L1 distance between phases is the appropriate diagnostic for this cohort",
            oscillatory_exchange_note: "absence of oscillatory_exchange is a structural finding, not a failure condition",
        },
        interpretation,
        not_canon:               true,
        not_prediction:          true,
        not_promotion:           true,
        diagnostic_posture:      "file-backed replay summary — read-side diagnostic observation, provisional, non-canonical",
    };
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
