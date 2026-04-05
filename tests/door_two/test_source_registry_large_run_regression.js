import {
    buildStagedSourceRecord,
    resolveRegisteredSourcePayload,
} from "../../hud/sourceRegistry.js";
import { DoorOneOrchestrator } from "../../runtime/DoorOneOrchestrator.js";
import { DoorOneWorkbench } from "../../runtime/DoorOneWorkbench.js";

let PASS = 0;
let FAIL = 0;

function section(title) {
    console.log(`\n-- ${title} --`);
}

function ok(condition, label) {
    if (condition) {
        PASS += 1;
        console.log(`  ok ${label}`);
    } else {
        FAIL += 1;
        console.error(`  not ok ${label}`);
    }
}

function eq(actual, expected, label) {
    ok(
        Object.is(actual, expected),
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`
    );
}

function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const POLICIES = {
    clock_policy_id: "clock.synthetic.v1",
    ingest_policy: {
        policy_id: "ingest.synthetic.v1",
        gap_threshold_multiplier: 3.0,
        allow_non_monotonic: false,
        allow_empty: false,
        non_monotonic_mode: "reject",
    },
    grid_spec: {
        Fs_target: 256, t_ref: 0, grid_policy: "strict",
        drift_model: "none", non_monotonic_policy: "reject",
        interp_method: "linear", gap_policy: "interpolate_small",
        small_gap_multiplier: 3.0, max_gap_seconds: null, anti_alias_filter: false,
    },
    window_spec: {
        mode: "fixed", Fs_target: 256, base_window_N: 256, hop_N: 128,
        window_function: "hann", overlap_ratio: 0.5,
        stationarity_policy: "tolerant", salience_policy: "off",
        gap_policy: "interpolate_small", max_missing_ratio: 0.25, boundary_policy: "pad",
    },
    transform_policy: {
        policy_id: "transform.synthetic.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant",
    },
    compression_policy: {
        policy_id: "compress.synthetic.v1", selection_method: "topK",
        budget_K: 8, maxK: 8, include_dc: true, invariance_lens: "identity",
        numeric_policy: "tolerant", respect_novelty_boundary: true,
        thresholds: { max_recon_rmse: 0.25, max_energy_residual: 0.25, max_band_divergence: 0.30 },
    },
    anomaly_policy: {
        policy_id: "anomaly.synthetic.v1", invariance_mode: "band_profile",
        divergence_metric: "band_l1", threshold_value: 0.15,
        frequency_tolerance_hz: 1.0, phase_sensitivity_mode: "strict",
        novelty_min_duration: 0, segmentation_mode: "strict",
        dominant_bin_threshold: 0.2, new_frequency_threshold: 0.15,
        vanished_frequency_threshold: 0.15, energy_shift_threshold: 0.15,
    },
    merge_policy: {
        policy_id: "merge.synthetic.v1", adjacency_rule: "time_touching",
        phase_alignment_mode: "clock_delta_rotation", weights_mode: "duration",
        novelty_gate: "strict", merge_mode: "authoritative", grid_tolerance: 0,
    },
    post_merge_compression_policy: {
        policy_id: "merge.compress.synthetic.v1", selection_method: "topK",
        budget_K: 8, maxK: 8, include_dc: true, invariance_lens: "identity",
        numeric_policy: "tolerant", respect_novelty_boundary: true,
        thresholds: { max_recon_rmse: 0.25, max_energy_residual: 0.25, max_band_divergence: 0.30 },
    },
    reconstruct_policy: {
        policy_id: "reconstruct.synthetic.v1", normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum",
    },
    query_policy: {
        policy_id: "query.synthetic.v1",
        query_mode: "similarity",
        top_k: 3,
    },
    basin_policy: {
        policy_id: "basin.synthetic.v1", method: "adaptive_threshold",
        max_basins: 8, min_basin_size: 2, merge_threshold: 0.12, entry_threshold: 0.15,
    },
};

const QUERY_SPEC = {
    type: "similarity",
    reference_window_index: 0,
    top_k: 3,
    metric: "cosine",
};

const QUERY_POLICY = {
    policy_id: "query.synthetic.v1",
    query_mode: "similarity",
    top_k: 3,
};

function buildLargeCachedPayload(sampleCount = 150000) {
    const values = Array.from({ length: sampleCount }, (_, i) => Math.sin(i / 40));
    const timestamps = values.map((_, i) => i / 2400);
    return {
        timestamps,
        values,
        stream_id: "wav.stream.staged.large",
        source_id: "SRC:staged:80hz_large",
        channel: "ch0_left_or_mono",
        modality: "audio_sample",
        clock_policy_id: "clock.file.v1",
        meta: {
            adapter: "wav",
            original_filename: "80hz_Sine.wav",
            sample_rate_hz: 2400,
            original_channels: 1,
            duration_sec: Number((sampleCount / 2400).toFixed(3)),
        },
    };
}

function runDoorOne(payload, runLabel) {
    const result = new DoorOneOrchestrator({
        policies: POLICIES,
        substrate_id: `registry.large.substrate.${runLabel}`,
    }).runBatch(payload, {
        query_spec: QUERY_SPEC,
        query_policy: QUERY_POLICY,
    });
    result.run_label = runLabel;
    return result;
}

section("A. staged selected registry source runs without stack overflow");
{
    const cachedPayload = buildLargeCachedPayload();
    const sourceRecord = buildStagedSourceRecord(
        new File(["fake wav"], "80hz_Sine.wav", { type: "audio/wav", lastModified: 777 }),
        { ok: true, meta: { adapter: "wav" }, payload: cachedPayload },
        { source_id: "SRC:staged:80hz_large" }
    );

    const payload = await resolveRegisteredSourcePayload(sourceRecord, {
        payloadCache: { [sourceRecord.source_id]: cachedPayload },
        runLabel: "first",
    });
    const result = runDoorOne(payload, "registry.large.first");
    const workbench = new DoorOneWorkbench().assemble(result);

    eq(result.ok, true, "A1: large staged registry payload completes orchestrator run");
    ok(Array.isArray(result.artifacts?.h1s), "A2: runtime artifacts are present");
    ok(!!workbench?.scope, "A3: workbench returns a lawful plain workbench object");
    eq(workbench.scope.source_id, sourceRecord.source_id, "A4: workbench scope preserves staged source id");
}

section("B. repeated runs on the same staged source stay stable");
{
    const cachedPayload = buildLargeCachedPayload();
    const sourceRecord = buildStagedSourceRecord(
        new File(["fake wav"], "80hz_Sine.wav", { type: "audio/wav", lastModified: 888 }),
        { ok: true, meta: { adapter: "wav" }, payload: cachedPayload },
        { source_id: "SRC:staged:80hz_large_repeat" }
    );

    const payloadA = await resolveRegisteredSourcePayload(sourceRecord, {
        payloadCache: { [sourceRecord.source_id]: cachedPayload },
        runLabel: "run_a",
    });
    const resultA = runDoorOne(payloadA, "registry.large.run_a");

    const payloadB = await resolveRegisteredSourcePayload(sourceRecord, {
        payloadCache: { [sourceRecord.source_id]: cachedPayload },
        runLabel: "run_b",
    });
    const resultB = runDoorOne(payloadB, "registry.large.run_b");

    eq(resultA.ok, true, "B1: first repeated run succeeds");
    eq(resultB.ok, true, "B2: second repeated run succeeds");
    eq(payloadA === payloadB, false, "B3: repeated runs do not reuse the same resolved payload object");
    eq(cachedPayload.meta.source_record_id, undefined, "B4: cached payload remains unwrapped after repeated runs");
    eq(resultB.artifacts?.a1?.source_id, sourceRecord.source_id, "B5: repeated run preserves staged source id");
}

finish();
