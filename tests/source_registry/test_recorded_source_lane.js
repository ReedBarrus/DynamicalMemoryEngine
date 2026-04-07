import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    RECORDED_SOURCE_FIXTURES,
    buildRecordedSourcePayloadFromArrayBuffer,
} from "../../hud/recordedSourceFixtures.js";
import { DoorOneOrchestrator } from "../../runtime/DoorOneOrchestrator.js";
import { DoorOneWorkbench } from "../../runtime/DoorOneWorkbench.js";
import { workbenchToStructuralHudModel } from "../../hud/DoorOneStructuralMemoryHudModel.js";
import { buildOperatorLegibilityModel } from "../../hud/operatorLegibilityModel.js";

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

function includes(text, pattern, label) {
    ok(String(text).includes(pattern), label);
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

async function loadFixtureRun(fixture) {
    const bytes = await readFile(path.join(ROOT, fixture.relativePath));
    const payload = buildRecordedSourcePayloadFromArrayBuffer(bytes, fixture, {
        stream_id: `recorded.test.${fixture.id}`,
    });
    const result = new DoorOneOrchestrator({
        policies: POLICIES,
        substrate_id: `recorded.substrate.${fixture.id}`,
    }).runBatch(payload, {
        query_spec: QUERY_SPEC,
        query_policy: QUERY_POLICY,
    });
    result.run_label = fixture.id;

    const workbench = new DoorOneWorkbench().assemble(result);
    const hud = workbenchToStructuralHudModel(workbench);
    const operator = buildOperatorLegibilityModel({
        runId: fixture.id,
        activeRunLabel: fixture.id,
        workbench,
        runResult: result,
        activeRequest: null,
        requestLog: [],
        replayLog: [],
        requestHistoryCount: 0,
        replayHistoryCount: 0,
        sourceFamilyLabel: fixture.sourceFamilyLabel,
        runStatus: "complete",
        runError: null,
        hasActiveResult: true,
    });

    return { fixture, payload, result, workbench, hud, operator };
}

const ROOM_CHANGE = RECORDED_SOURCE_FIXTURES.find(
    (fixture) => fixture.id === "recorded_room_change_baseline_001"
);
const CONTINUITY_NOISE = RECORDED_SOURCE_FIXTURES.find(
    (fixture) => fixture.id === "recorded_continuity_noise_break_01"
);

const roomChangeRun = await loadFixtureRun(ROOM_CHANGE);
const continuityNoiseRun = await loadFixtureRun(CONTINUITY_NOISE);

section("A. shell exposes a bounded recorded-source lane");
{
    const shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8");
    const helperSrc = await readFile(path.join(ROOT, "hud/recordedSourceFixtures.js"), "utf8");

    includes(shellSrc, 'id: "recorded_source_lane"', "A1: shell defines a recorded-source family");
    includes(shellSrc, "RECORDED_SOURCE_FIXTURES", "A2: shell imports recorded source fixtures");
    includes(shellSrc, "loadRecordedSourcePayload", "A3: shell loads recorded fixtures through the helper seam");
    includes(shellSrc, "recorded source fixture", "A4: control region labels the recorded selector explicitly");
    includes(shellSrc, "runImportedPipeline(recordedPayload, id)", "A5: recorded fixtures route through the same imported ingest path");
    includes(shellSrc, "runSyntheticPipeline", "A6: synthetic lane remains present");
    includes(helperSrc, "source_mode: \"recorded_source\"", "A7: helper marks recorded-source basis explicitly");
}

section("B. recorded fixtures normalize into lawful ingest payloads");
{
    eq(ROOM_CHANGE.relativePath, "test_signal/daw_tone_sine_400hz_RoomChange/baseline_001.wav", "B1: room-change fixture path pinned");
    eq(CONTINUITY_NOISE.relativePath, "test_signal/daw_tone_continuity_noise/continuity_break_01.wav", "B2: continuity-noise fixture path pinned");
    eq(roomChangeRun.payload.meta.source_mode, "recorded_source", "B3: room-change payload marks recorded source mode");
    eq(continuityNoiseRun.payload.meta.source_mode, "recorded_source", "B4: continuity-noise payload marks recorded source mode");
    eq(roomChangeRun.payload.meta.original_filename, "baseline_001.wav", "B5: room-change filename preserved in payload meta");
    eq(continuityNoiseRun.payload.meta.original_filename, "continuity_break_01.wav", "B6: continuity-noise filename preserved in payload meta");
    eq(roomChangeRun.payload.meta.recorded_family, "daw_tone_sine_400hz_RoomChange", "B7: room-change family preserved in payload meta");
    eq(continuityNoiseRun.payload.meta.recorded_family, "daw_tone_continuity_noise", "B8: continuity-noise family preserved in payload meta");
    eq(roomChangeRun.payload.meta.nominal_sample_rate_hz, 2400, "B9: room-change payload is normalized to target sample rate");
    eq(continuityNoiseRun.payload.meta.nominal_sample_rate_hz, 2400, "B10: continuity-noise payload is normalized to target sample rate");
}

section("C. the two recorded sources produce meaningfully different downstream state");
{
    eq(roomChangeRun.workbench.runtime.artifacts.h1s.length, 0, "C1: room-change run stays structurally sparse at the current seam");
    ok(continuityNoiseRun.workbench.runtime.artifacts.h1s.length > 0, "C2: continuity-noise run produces H1 structural evidence");
    eq(roomChangeRun.workbench.runtime.artifacts.m1s.length, 0, "C3: room-change run yields no retained states here");
    ok(continuityNoiseRun.workbench.runtime.artifacts.m1s.length > 0, "C4: continuity-noise run yields retained states");
    eq(roomChangeRun.workbench.runtime.artifacts.anomaly_reports.length, 0, "C5: room-change run yields no anomaly reports here");
    ok(continuityNoiseRun.workbench.runtime.artifacts.anomaly_reports.length > 0, "C6: continuity-noise run yields anomaly reports");
    eq(roomChangeRun.hud.runtime_evidence.artifact_counts.h1s, 0, "C7: room-change HUD reflects sparse runtime evidence honestly");
    ok(continuityNoiseRun.hud.runtime_evidence.artifact_counts.h1s > 0, "C8: continuity-noise HUD reflects active runtime evidence");
    ok(
        JSON.stringify(roomChangeRun.hud.runtime_evidence.anomaly_type_counts) !==
        JSON.stringify(continuityNoiseRun.hud.runtime_evidence.anomaly_type_counts),
        "C9: HUD evidence differs across the two recorded runs"
    );
}

section("D. operator surface marks recorded basis explicitly");
{
    const roomSourceStage = roomChangeRun.operator.stages.find((stage) => stage.id === "source");
    const continuitySpectralStage = continuityNoiseRun.operator.stages.find((stage) => stage.id === "spectral_state");

    eq(roomChangeRun.operator.sourceBasis.sourceFamily, "Recorded Source (WAV fixture)", "D1: operator source family is recorded-source explicit");
    includes(roomChangeRun.operator.sourceBasis.sourceProfile, "recorded source", "D2: operator source profile says recorded source");
    includes(roomChangeRun.operator.sourceBasis.sourceProfile, "baseline_001.wav", "D3: operator source profile exposes room-change filename");
    includes(continuityNoiseRun.operator.sourceBasis.sourceProfile, "continuity_break_01.wav", "D4: operator source profile exposes continuity-noise filename");
    includes(roomSourceStage.dependsOn, "family daw_tone_sine_400hz_RoomChange", "D5: source stage keeps recorded family inspectable");
    includes(continuitySpectralStage.currentStatus, "8 H1 states", "D6: spectral stage shows continuity-noise structural evidence");
    eq(roomChangeRun.operator.evidenceDepth.code, "bounded_runtime_support", "D7: recorded room-change posture stays bounded rather than inflated");
    eq(continuityNoiseRun.operator.evidenceDepth.code, "bounded_runtime_support", "D8: recorded continuity-noise posture stays bounded rather than inflated");
}

finish();
