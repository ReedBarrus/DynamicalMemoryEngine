// scripts/run_door_one_audio_file_slices_experiment.js
//
// Door One audio-file slice experiment runner
//
// Purpose:
//   - read one WAV file from ./test_signal/
//   - decode to mono sample values
//   - decimate to a lawful Door One ingest lens
//   - carve the source into bounded labeled phase slices
//   - ingest each slice as its own run through DoorOneExecutiveLane
//   - write bounded experiment outputs for cross-run inspection
//
// Boundary posture:
//   - file-backed source
//   - one lawful ingest seam
//   - read-side / experiment runner only
//   - not canon
//   - not promotion
//   - not ontology
//   - not truth
//
// Default source:
//   ./test_signal/220-440hzPulse.wav

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DoorOneExecutiveLane } from "../runtime/DoorOneExecutiveLane.js";

const DEFAULT_AUDIO_PATH = "./test_signal/220-440hzPulse.wav";
const DEFAULT_OUTPUT_DIR = "./out_experiments/door_one_audio_slices_capstone";
const TARGET_SAMPLE_RATE = 2400;

const BASE_POLICIES = {
    clock_policy_id: "clock.audio_file.v1",

    ingest_policy: {
        policy_id: "ingest.audio_file.v1",
        gap_threshold_multiplier: 3.0,
        allow_non_monotonic: false,
        allow_empty: false,
        non_monotonic_mode: "reject",
    },

    grid_spec: {
        Fs_target: TARGET_SAMPLE_RATE,
        t_ref: 0,
        grid_policy: "strict",
        drift_model: "none",
        non_monotonic_policy: "reject",
        interp_method: "linear",
        gap_policy: "interpolate_small",
        small_gap_multiplier: 3.0,
        max_gap_seconds: null,
        anti_alias_filter: false,
    },

    window_spec: {
        mode: "fixed",
        Fs_target: TARGET_SAMPLE_RATE,
        base_window_N: 1024,
        hop_N: 512,
        window_function: "hann",
        overlap_ratio: 0.5,
        stationarity_policy: "tolerant",
        salience_policy: "off",
        gap_policy: "interpolate_small",
        max_missing_ratio: 0.25,
        boundary_policy: "pad",
    },

    transform_policy: {
        policy_id: "transform.audio_file.v1",
        transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum",
        numeric_policy: "tolerant",
    },

    compression_policy: {
        policy_id: "compress.audio_file.v1",
        selection_method: "topK",
        budget_K: 16,
        maxK: 16,
        include_dc: true,
        invariance_lens: "identity",
        numeric_policy: "tolerant",
        respect_novelty_boundary: true,
        thresholds: {
            max_recon_rmse: 0.25,
            max_energy_residual: 0.25,
            max_band_divergence: 0.30,
        },
    },

    anomaly_policy: {
        policy_id: "anomaly.audio_file.v1",
        invariance_mode: "band_profile",
        divergence_metric: "band_l1",
        threshold_value: 0.12,
        frequency_tolerance_hz: 3.0,
        phase_sensitivity_mode: "strict",
        novelty_min_duration: 0,
        segmentation_mode: "strict",
        dominant_bin_threshold: 0.2,
        new_frequency_threshold: 0.15,
        vanished_frequency_threshold: 0.15,
        energy_shift_threshold: 0.12,
    },

    merge_policy: {
        policy_id: "merge.audio_file.v1",
        adjacency_rule: "time_touching",
        phase_alignment_mode: "clock_delta_rotation",
        weights_mode: "duration",
        novelty_gate: "strict",
        merge_mode: "authoritative",
        grid_tolerance: 0,
    },

    post_merge_compression_policy: {
        policy_id: "merge.compress.audio_file.v1",
        selection_method: "topK",
        budget_K: 16,
        maxK: 16,
        include_dc: true,
        invariance_lens: "identity",
        thresholds: {
            max_recon_rmse: 0.30,
            max_energy_residual: 0.30,
            max_band_divergence: 0.30,
        },
    },

    reconstruct_policy: {
        policy_id: "reconstruct.audio_file.v1",
        output_format: "values",
        fill_missing_bins: "ZERO",
        validate_invariants: true,
        window_compensation: "NONE",
        numeric_policy: "tolerant",
    },

    basin_policy: {
        policy_id: "basin.audio_file.v1",
        similarity_threshold: 0.35,
        min_member_count: 1,
        weight_mode: "duration",
        linkage: "single_link",
    },

    consensus_policy: {
        policy_id: "consensus.audio_file.v1",
        promotion_threshold: 0.8,
        max_energy_drift: 0.1,
        max_band_drift: 0.1,
        coherence_tests: ["energy_invariance", "band_profile_invariance"],
        settlement_mode: "single_node",
    },
};

const QUERY_SPEC = {
    query_id: "q.audio_file_slices_capstone",
    kind: "energy_trend",
    mode: "ENERGY",
    scope: { allow_cross_segment: true },
};

const QUERY_POLICY = {
    policy_id: "qp.audio_file_slices_capstone",
    scoring: "energy_delta",
    normalization: "none",
    topK: 5,
};

const EPOCH_CONTEXT = {
    epoch_id: "epoch.audio_file_slices_capstone.1",
    t_start: 0,
    t_end: 20,
    settlement_policy_id: "settlement.audio_file.v1",
    consensus_window: 10,
};

const CONSENSUS_POLICY = {
    policy_id: "consensus.audio_file_slices_capstone.v1",
};

const SLICE_PLAN = [
    { run_label: "baseline_01", phase: "baseline_stable", t_start: 0.0, t_end: 2.5 },
    { run_label: "baseline_02", phase: "baseline_stable", t_start: 2.5, t_end: 5.0 },
    { run_label: "baseline_03", phase: "baseline_stable", t_start: 5.0, t_end: 7.5 },

    { run_label: "perturb_01", phase: "pitch_perturbation", t_start: 7.5, t_end: 8.75 },
    { run_label: "perturb_02", phase: "pitch_perturbation", t_start: 8.75, t_end: 10.0 },

    { run_label: "return_01", phase: "return_stable", t_start: 10.0, t_end: 15.0 },
    { run_label: "return_02", phase: "return_stable", t_start: 15.0, t_end: 20.0 },
];

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

async function writeJson(filePath, data) {
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function readAscii(buffer, start, len) {
    return buffer.toString("ascii", start, start + len);
}

function decimateMono(mono, factor) {
    if (!Number.isInteger(factor) || factor < 1) {
        throw new Error("decimateMono requires an integer factor >= 1");
    }
    if (factor === 1) return mono.slice();

    const out = [];
    for (let i = 0; i < mono.length; i += factor) {
        out.push(mono[i]);
    }
    return out;
}

function parseWav(buffer) {
    if (readAscii(buffer, 0, 4) !== "RIFF" || readAscii(buffer, 8, 4) !== "WAVE") {
        throw new Error("Unsupported file: not a RIFF/WAVE file");
    }

    let offset = 12;
    let fmt = null;
    let dataChunk = null;

    while (offset + 8 <= buffer.length) {
        const chunkId = readAscii(buffer, offset, 4);
        const chunkSize = buffer.readUInt32LE(offset + 4);
        const chunkDataStart = offset + 8;

        if (chunkId === "fmt ") {
            fmt = {
                audioFormat: buffer.readUInt16LE(chunkDataStart + 0),
                numChannels: buffer.readUInt16LE(chunkDataStart + 2),
                sampleRate: buffer.readUInt32LE(chunkDataStart + 4),
                byteRate: buffer.readUInt32LE(chunkDataStart + 8),
                blockAlign: buffer.readUInt16LE(chunkDataStart + 12),
                bitsPerSample: buffer.readUInt16LE(chunkDataStart + 14),
            };
        } else if (chunkId === "data") {
            dataChunk = {
                start: chunkDataStart,
                size: chunkSize,
            };
        }

        offset = chunkDataStart + chunkSize + (chunkSize % 2);
    }

    if (!fmt) throw new Error("WAV decode failed: missing fmt chunk");
    if (!dataChunk) throw new Error("WAV decode failed: missing data chunk");

    const { audioFormat, numChannels, sampleRate, bitsPerSample, blockAlign } = fmt;
    const bytesPerSample = bitsPerSample / 8;
    const frameCount = Math.floor(dataChunk.size / blockAlign);
    const mono = new Array(frameCount);

    function sampleAt(frameIndex, channelIndex) {
        const sampleOffset =
            dataChunk.start + frameIndex * blockAlign + channelIndex * bytesPerSample;

        if (audioFormat === 1) {
            if (bitsPerSample === 8) return (buffer.readUInt8(sampleOffset) - 128) / 128;
            if (bitsPerSample === 16) return buffer.readInt16LE(sampleOffset) / 32768;
            if (bitsPerSample === 24) {
                const b0 = buffer[sampleOffset];
                const b1 = buffer[sampleOffset + 1];
                const b2 = buffer[sampleOffset + 2];
                let int = b0 | (b1 << 8) | (b2 << 16);
                if (int & 0x800000) int |= ~0xffffff;
                return int / 8388608;
            }
            if (bitsPerSample === 32) return buffer.readInt32LE(sampleOffset) / 2147483648;
            throw new Error(`Unsupported PCM bit depth: ${bitsPerSample}`);
        }

        if (audioFormat === 3) {
            if (bitsPerSample === 32) return buffer.readFloatLE(sampleOffset);
            if (bitsPerSample === 64) return buffer.readDoubleLE(sampleOffset);
            throw new Error(`Unsupported float bit depth: ${bitsPerSample}`);
        }

        throw new Error(`Unsupported WAV audio format: ${audioFormat}`);
    }

    for (let i = 0; i < frameCount; i += 1) {
        let sum = 0;
        for (let ch = 0; ch < numChannels; ch += 1) {
            sum += sampleAt(i, ch);
        }
        mono[i] = sum / numChannels;
    }

    return {
        sampleRate,
        numChannels,
        bitsPerSample,
        audioFormat,
        frameCount,
        mono,
    };
}

function buildRawIngestFromMono({
    mono,
    sampleRate,
    source_id,
    channel,
    modality,
    clock_policy_id,
    source_path,
    phase,
    run_label,
    t_start,
    t_end,
} = {}) {
    const timestamps = new Array(mono.length);
    for (let i = 0; i < mono.length; i += 1) {
        timestamps[i] = i / sampleRate;
    }

    const stream_id = `STR:${source_id}:${channel}:${modality}:wav:${sampleRate}:${phase}`;

    return {
        timestamps,
        values: mono,
        stream_id,
        source_id,
        channel,
        modality,
        clock_policy_id,
        meta: {
            source_mode: "file",
            source_format: "wav",
            nominal_sample_rate_hz: sampleRate,
            source_path,
            decode: "mono_average",
            phase,
            run_label,
            source_t_start: t_start,
            source_t_end: t_end,
        },
    };
}

function sliceMonoBySeconds(mono, sampleRate, tStart, tEnd) {
    const startIndex = Math.max(0, Math.floor(tStart * sampleRate));
    const endIndex = Math.min(mono.length, Math.floor(tEnd * sampleRate));
    if (endIndex <= startIndex) {
        throw new Error(`Invalid slice range ${tStart} → ${tEnd}`);
    }
    return mono.slice(startIndex, endIndex);
}

async function runAudioFileSlicesExperiment({
    audioPath = DEFAULT_AUDIO_PATH,
    outputDir = DEFAULT_OUTPUT_DIR,
} = {}) {
    const audioBuffer = await readFile(audioPath);
    const decoded = parseWav(audioBuffer);

    if (decoded.sampleRate % TARGET_SAMPLE_RATE !== 0) {
        throw new Error(
            `Expected source sample rate to divide cleanly into ${TARGET_SAMPLE_RATE} Hz; got ${decoded.sampleRate}`
        );
    }

    const decimationFactor = decoded.sampleRate / TARGET_SAMPLE_RATE;
    const monoForDoorOne = decimateMono(decoded.mono, decimationFactor);

    const source_id = "door1.audio.220_440hz_pulse.v1";
    const channel = "mono_master";
    const modality = "audio_amplitude";
    const clock_policy_id = BASE_POLICIES.clock_policy_id;

    const lane = new DoorOneExecutiveLane({
        policies: clone(BASE_POLICIES),
        querySpec: clone(QUERY_SPEC),
        queryPolicy: clone(QUERY_POLICY),
        epochContext: clone(EPOCH_CONTEXT),
        consensusPolicy: clone(CONSENSUS_POLICY),
        max_runs: 10,
        session_id: "door-one-audio-file-slices-capstone",
    });

    const runs = [];

    for (const slice of SLICE_PLAN) {
        const monoSlice = sliceMonoBySeconds(
            monoForDoorOne,
            TARGET_SAMPLE_RATE,
            slice.t_start,
            slice.t_end
        );

        const rawInput = buildRawIngestFromMono({
            mono: monoSlice,
            sampleRate: TARGET_SAMPLE_RATE,
            source_id,
            channel,
            modality,
            clock_policy_id,
            source_path: audioPath,
            phase: slice.phase,
            run_label: slice.run_label,
            t_start: slice.t_start,
            t_end: slice.t_end,
        });

        const result = lane.ingest(rawInput, {
            run_label: slice.run_label,
        });

        runs.push({
            run_label: slice.run_label,
            phase: slice.phase,
            t_start: slice.t_start,
            t_end: slice.t_end,
            sample_count: rawInput.values.length,
            ok: result.ok === true,
            stream_id: rawInput.stream_id,
            run_result: result.run_result ?? null,
            workbench: result.workbench ?? null,
            cross_run_report: result.cross_run_report ?? null,
            session_summary: result.session_summary ?? null,
        });
    }

    await mkdir(outputDir, { recursive: true });

    const manifest = {
        experiment_type: "door_one_audio_file_slices_capstone",
        source_path: audioPath,
        output_dir: outputDir,
        slice_plan: SLICE_PLAN,
        decode: {
            source_mode: "file",
            source_format: "wav",
            mono_strategy: "channel_average",
            original_sample_rate_hz: decoded.sampleRate,
            ingested_sample_rate_hz: TARGET_SAMPLE_RATE,
            decimation_factor: decimationFactor,
            input_channels: decoded.numChannels,
            bits_per_sample: decoded.bitsPerSample,
            original_frame_count: decoded.frameCount,
            ingested_frame_count: monoForDoorOne.length,
            duration_sec: decoded.frameCount / decoded.sampleRate,
        },
        run_count: runs.length,
        ok_count: runs.filter((r) => r.ok).length,
    };

    await writeJson(path.join(outputDir, "experiment_manifest.json"), manifest);
    await writeJson(
        path.join(outputDir, "runs_summary.json"),
        runs.map((r) => ({
            run_label: r.run_label,
            phase: r.phase,
            t_start: r.t_start,
            t_end: r.t_end,
            sample_count: r.sample_count,
            ok: r.ok,
            stream_id: r.stream_id,
            segment_count: r.run_result?.substrate?.segment_count ?? null,
            basin_count: r.run_result?.substrate?.basin_count ?? null,
            state_count: r.run_result?.substrate?.state_count ?? null,
            transition_count: r.run_result?.substrate?.transition_report?.total_transitions ?? null,
        }))
    );
    await writeJson(path.join(outputDir, "last_cross_run_report.json"), runs[runs.length - 1]?.cross_run_report ?? null);
    await writeJson(path.join(outputDir, "last_session_summary.json"), runs[runs.length - 1]?.session_summary ?? null);

    for (const run of runs) {
        const runDir = path.join(outputDir, run.run_label);
        await mkdir(runDir, { recursive: true });

        await writeJson(path.join(runDir, "run_result.json"), run.run_result);
        await writeJson(path.join(runDir, "workbench.json"), run.workbench);
        await writeJson(path.join(runDir, "cross_run_report.json"), run.cross_run_report);
        await writeJson(path.join(runDir, "session_summary.json"), run.session_summary);
    }

    return {
        ok: runs.every((r) => r.ok),
        decoded,
        runs,
        outputDir,
    };
}

async function main() {
    const res = await runAudioFileSlicesExperiment({
        audioPath: process.env.DOOR_ONE_AUDIO_PATH ?? DEFAULT_AUDIO_PATH,
        outputDir: process.env.DOOR_ONE_AUDIO_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR,
    });

    console.log("");
    console.log("Door One Audio File Slices Capstone");
    console.log(`  ok: ${res.ok}`);
    console.log(`  source: ${process.env.DOOR_ONE_AUDIO_PATH ?? DEFAULT_AUDIO_PATH}`);
    console.log(`  original_sample_rate_hz: ${res.decoded.sampleRate}`);
    console.log(`  ingested_sample_rate_hz: ${TARGET_SAMPLE_RATE}`);
    console.log(`  run_count: ${res.runs.length}`);
    console.log(`  ok_count: ${res.runs.filter((r) => r.ok).length}`);
    console.log(`  output_dir: ${res.outputDir}`);
    console.log("");

    for (const run of res.runs) {
        console.log(
            `  - ${run.run_label} [${run.phase}] ${run.t_start.toFixed(2)} → ${run.t_end.toFixed(2)}  ok=${run.ok}`
        );
    }

    console.log("");
}

const thisFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFilePath) {
    main().catch((err) => {
        console.error("Door One audio file slices experiment failed.");
        console.error(err);
        process.exit(1);
    });
}