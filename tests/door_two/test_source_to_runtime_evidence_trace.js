import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { makeTestSignal } from "../../fixtures/test_signal.js";
import { DoorOneOrchestrator } from "../../runtime/DoorOneOrchestrator.js";
import { DoorOneWorkbench } from "../../runtime/DoorOneWorkbench.js";
import { workbenchToStructuralHudModel } from "../../hud/DoorOneStructuralMemoryHudModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

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
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${expected}, got ${actual})`}`
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
        thresholds: {
            max_recon_rmse: 0.25,
            max_energy_residual: 0.25,
            max_band_divergence: 0.30,
        },
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
        thresholds: {
            max_recon_rmse: 0.25,
            max_energy_residual: 0.25,
            max_band_divergence: 0.30,
        },
    },
    reconstruct_policy: {
        policy_id: "reconstruct.synthetic.v1",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum",
    },
    query_policy: {
        policy_id: "query.synthetic.v1",
        query_mode: "similarity",
        top_k: 3,
    },
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

function runPreset({ seed, durationSec, noiseStd, runLabel }) {
    const { signal } = makeTestSignal({
        seed,
        durationSec,
        noiseStd,
        source_id: `synthetic.seed${seed}`,
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

    const result = new DoorOneOrchestrator({
        policies: POLICIES,
        substrate_id: `trace.substrate.${runLabel}`,
    }).runBatch(raw, {
        query_spec: QUERY_SPEC,
        query_policy: QUERY_POLICY,
    });

    const workbench = new DoorOneWorkbench().assemble(result);
    const hud = workbenchToStructuralHudModel(workbench);

    return { signal, result, workbench, hud };
}

function segmentDivergenceTrace(run) {
    return (run.result?.substrate?.segment_transitions ?? []).map((row) =>
        Number(row?.divergence_score ?? 0).toFixed(6)
    );
}

function hudSegmentDivergenceTrace(run) {
    return (run.hud?.segmentTransitions ?? []).map((row) =>
        Number(row?.divergence ?? 0).toFixed(2)
    );
}

const BASELINE = runPreset({
    seed: 42,
    durationSec: 10,
    noiseStd: 0.03,
    runLabel: "baseline",
});

const HIGH_NOISE = runPreset({
    seed: 42,
    durationSec: 10,
    noiseStd: 0.12,
    runLabel: "high_noise",
});

section("A. source presets remain distinct at ingest");
eq(BASELINE.signal.meta.seed, 42, "A1: baseline seed preserved");
eq(HIGH_NOISE.signal.meta.seed, 42, "A2: high-noise seed preserved");
eq(BASELINE.signal.meta.noiseStd, 0.03, "A3: baseline noise preset preserved");
eq(HIGH_NOISE.signal.meta.noiseStd, 0.12, "A4: high-noise preset preserved");
ok(
    BASELINE.signal.meta.noiseStd !== HIGH_NOISE.signal.meta.noiseStd,
    "A5: the compared presets are materially different at source"
);

section("B. downstream runtime support is partly distinct and partly honestly flat");
eq(
    BASELINE.workbench.runtime.artifacts.h1s.length,
    HIGH_NOISE.workbench.runtime.artifacts.h1s.length,
    "B1: H1 count stays flat across the compared presets"
);
eq(
    BASELINE.workbench.runtime.artifacts.m1s.length,
    HIGH_NOISE.workbench.runtime.artifacts.m1s.length,
    "B2: merged-state count stays flat across the compared presets"
);
eq(
    BASELINE.workbench.runtime.substrate.state_count,
    HIGH_NOISE.workbench.runtime.substrate.state_count,
    "B3: state_count is honestly flat at the runtime seam"
);
eq(
    BASELINE.workbench.runtime.substrate.transition_report.total_transitions,
    HIGH_NOISE.workbench.runtime.substrate.transition_report.total_transitions,
    "B4: neighborhood transition count is honestly flat for these runs"
);
ok(
    JSON.stringify(segmentDivergenceTrace(BASELINE)) !== JSON.stringify(segmentDivergenceTrace(HIGH_NOISE)),
    "B5: segment-transition divergence scores differ downstream"
);
ok(
    JSON.stringify(BASELINE.workbench.runtime.substrate.segment_transitions) !==
    JSON.stringify(HIGH_NOISE.workbench.runtime.substrate.segment_transitions),
    "B6: segment-boundary evidence differs downstream"
);
ok(
    JSON.stringify(BASELINE.workbench.runtime.artifacts.anomaly_reports.map((row) => row.divergence_score)) !==
    JSON.stringify(HIGH_NOISE.workbench.runtime.artifacts.anomaly_reports.map((row) => row.divergence_score)),
    "B7: anomaly divergence evidence differs downstream"
);
ok(
    JSON.stringify(BASELINE.workbench.runtime.substrate.segment_transitions.map((row) => row.detected_event_types)) !==
    JSON.stringify(HIGH_NOISE.workbench.runtime.substrate.segment_transitions.map((row) => row.detected_event_types)),
    "B8: detected segment-event types differ downstream"
);

section("C. HUD model consumes per-run runtime support without generic reuse");
eq(
    BASELINE.hud.provenance.source_noise_std,
    BASELINE.workbench.runtime.artifacts.a1.meta.noiseStd,
    "C1: baseline HUD provenance uses the active run noise metadata"
);
eq(
    HIGH_NOISE.hud.provenance.source_noise_std,
    HIGH_NOISE.workbench.runtime.artifacts.a1.meta.noiseStd,
    "C2: high-noise HUD provenance uses the active run noise metadata"
);
eq(
    BASELINE.hud.runtime_evidence.artifact_counts.m1s,
    BASELINE.workbench.runtime.artifacts.m1s.length,
    "C3: baseline HUD merged-state count comes from workbench runtime state"
);
eq(
    HIGH_NOISE.hud.runtime_evidence.artifact_counts.m1s,
    HIGH_NOISE.workbench.runtime.artifacts.m1s.length,
    "C4: high-noise HUD merged-state count comes from workbench runtime state"
);
eq(
    BASELINE.hud.runtime_evidence.segment_boundary_events,
    BASELINE.workbench.runtime.substrate.segment_transitions.length,
    "C5: baseline HUD segment-boundary count comes from runtime evidence"
);
eq(
    HIGH_NOISE.hud.runtime_evidence.segment_boundary_events,
    HIGH_NOISE.workbench.runtime.substrate.segment_transitions.length,
    "C6: high-noise HUD segment-boundary count comes from runtime evidence"
);
ok(
    JSON.stringify(BASELINE.hud.runtime_evidence.segment_event_types) !==
    JSON.stringify(HIGH_NOISE.hud.runtime_evidence.segment_event_types),
    "C7: HUD preserves the differing segment-event summary"
);
ok(
    JSON.stringify(hudSegmentDivergenceTrace(BASELINE)) !==
    JSON.stringify(hudSegmentDivergenceTrace(HIGH_NOISE)),
    "C8: HUD detail-path segment divergence remains per-run rather than stale"
);
eq(
    BASELINE.hud.runtime_evidence.transition_count,
    BASELINE.workbench.runtime.substrate.transition_report.total_transitions,
    "C9: baseline HUD keeps runtime flatness honest when transitions are absent"
);
eq(
    HIGH_NOISE.hud.runtime_evidence.transition_count,
    HIGH_NOISE.workbench.runtime.substrate.transition_report.total_transitions,
    "C10: high-noise HUD keeps runtime flatness honest when transitions are absent"
);

section("D. HUD source stays workbench-native at the composed seam");
{
    const hudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8");

    ok(
        hudSrc.includes("() => workbenchToStructuralHudModel(workbench, crossRunReport)") &&
        hudSrc.includes("[workbench, crossRunReport]"),
        "D1: HUD model is recomputed from the active workbench and cross-run inputs"
    );
    ok(
        hudSrc.includes("const activeContextSignature = useMemo("),
        "D2: HUD reset/detail routing keys off a run-relative active context signature"
    );
    ok(
        hudSrc.includes("detailPanelDetail = selectedDetail ?? autoDetail"),
        "D3: detail pane stays live to active evidence instead of remaining dead local state"
    );
}

finish();
