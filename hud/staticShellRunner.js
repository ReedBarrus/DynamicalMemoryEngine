import { makeTestSignal } from "../fixtures/test_signal.js";
import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { DoorOneWorkbench } from "../runtime/DoorOneWorkbench.js";

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
        Fs_target: 256,
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
        Fs_target: 256,
        base_window_N: 256,
        hop_N: 128,
        window_function: "hann",
        overlap_ratio: 0.5,
        stationarity_policy: "tolerant",
        salience_policy: "off",
        gap_policy: "interpolate_small",
        max_missing_ratio: 0.25,
        boundary_policy: "pad",
    },
    transform_policy: {
        policy_id: "transform.synthetic.v1",
        transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum",
        numeric_policy: "tolerant",
    },
    compression_policy: {
        policy_id: "compress.synthetic.v1",
        selection_method: "topK",
        budget_K: 8,
        maxK: 8,
        include_dc: true,
        invariance_lens: "identity",
        numeric_policy: "tolerant",
        respect_novelty_boundary: true,
        thresholds: { max_recon_rmse: 0.25, max_energy_residual: 0.25, max_band_divergence: 0.30 },
    },
    anomaly_policy: {
        policy_id: "anomaly.synthetic.v1",
        invariance_mode: "band_profile",
        divergence_metric: "band_l1",
        threshold_value: 0.15,
        frequency_tolerance_hz: 1.0,
        phase_sensitivity_mode: "strict",
        novelty_min_duration: 0,
        segmentation_mode: "strict",
        dominant_bin_threshold: 0.2,
        new_frequency_threshold: 0.15,
        vanished_frequency_threshold: 0.15,
        energy_shift_threshold: 0.15,
    },
    merge_policy: {
        policy_id: "merge.synthetic.v1",
        adjacency_rule: "time_touching",
        phase_alignment_mode: "clock_delta_rotation",
        weights_mode: "duration",
        novelty_gate: "strict",
        merge_mode: "authoritative",
        grid_tolerance: 0,
    },
    post_merge_compression_policy: {
        policy_id: "merge.compress.synthetic.v1",
        selection_method: "topK",
        budget_K: 8,
        maxK: 8,
        include_dc: true,
        invariance_lens: "identity",
        numeric_policy: "tolerant",
        respect_novelty_boundary: true,
        thresholds: { max_recon_rmse: 0.25, max_energy_residual: 0.25, max_band_divergence: 0.30 },
    },
    reconstruct_policy: {
        policy_id: "reconstruct.synthetic.v1",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum",
    },
    query_policy: { policy_id: "query.synthetic.v1", query_mode: "similarity", top_k: 3 },
    basin_policy: {
        policy_id: "basin.synthetic.v1",
        method: "adaptive_threshold",
        max_basins: 8,
        min_basin_size: 2,
        merge_threshold: 0.12,
        entry_threshold: 0.15,
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

export const STATIC_SOURCE_OPTIONS = [
    {
        id: "synthetic_standard",
        label: "Synthetic Standard",
        kind: "synthetic",
        sourceFamilyLabel: "Synthetic Signal",
        seed: 42,
        durationSec: 10,
        noiseStd: 0.03,
    },
    {
        id: "synthetic_high_noise",
        label: "Synthetic High Noise",
        kind: "synthetic",
        sourceFamilyLabel: "Synthetic Signal",
        seed: 42,
        durationSec: 10,
        noiseStd: 0.12,
    },
    {
        id: "synthetic_return_variant",
        label: "Synthetic Return Variant",
        kind: "synthetic",
        sourceFamilyLabel: "Synthetic Signal",
        seed: 7,
        durationSec: 10,
        noiseStd: 0.03,
    },
    {
        id: "file_upload",
        label: "Upload JSON / CSV / WAV",
        kind: "upload",
        sourceFamilyLabel: "File Import (JSON / CSV / WAV)",
    },
];

export function getStaticSourceOption(sourceId) {
    return STATIC_SOURCE_OPTIONS.find((option) => option.id === sourceId) ?? STATIC_SOURCE_OPTIONS[0];
}

function buildWorkbench(runResult) {
    const workbench = new DoorOneWorkbench();
    return workbench.assemble(runResult);
}

function runImportedPipeline(ingestPayload, runLabel) {
    const orchestrator = new DoorOneOrchestrator({
        policies: POLICIES,
        substrate_id: `shell.import.substrate.${runLabel}`,
    });
    const result = orchestrator.runBatch(ingestPayload, {
        query_spec: QUERY_SPEC,
        query_policy: QUERY_POLICY,
    });
    result.run_label = runLabel;
    return result;
}

function runSyntheticPipeline(option, runLabel) {
    const { signal } = makeTestSignal({
        seed: option.seed,
        durationSec: option.durationSec,
        noiseStd: option.noiseStd,
        source_id: `synthetic.seed${option.seed}`,
    });

    const raw = {
        timestamps: signal.timestamps,
        values: signal.values,
        stream_id: signal.stream_id ?? `stream.${runLabel}`,
        source_id: signal.source_id,
        channel: signal.channel,
        modality: signal.modality,
        meta: signal.meta,
        clock_policy_id: POLICIES.clock_policy_id,
    };

    const orchestrator = new DoorOneOrchestrator({
        policies: POLICIES,
        substrate_id: `shell.substrate.${runLabel}`,
    });
    const result = orchestrator.runBatch(raw, {
        query_spec: QUERY_SPEC,
        query_policy: QUERY_POLICY,
    });
    result.run_label = runLabel;
    return result;
}

export async function runStaticShellSource({
    sourceId,
    adapterPayload = null,
    runLabel,
} = {}) {
    const option = getStaticSourceOption(sourceId);
    let runResult = null;

    if (option.kind === "upload") {
        if (!adapterPayload) {
            throw new Error("No valid adapter payload is staged for upload");
        }
        runResult = runImportedPipeline(adapterPayload, runLabel);
    } else {
        runResult = runSyntheticPipeline(option, runLabel);
    }

    if (!runResult?.ok) {
        throw new Error(runResult?.error ?? "orchestrator returned ok=false");
    }

    return {
        runResult,
        workbench: buildWorkbench(runResult),
        sourceFamilyLabel: option.sourceFamilyLabel,
        selectedSourceLabel: option.label,
    };
}
