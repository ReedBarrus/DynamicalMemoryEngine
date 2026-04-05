import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { makeTestSignal } from "../../fixtures/test_signal.js";
import { DoorOneOrchestrator } from "../../runtime/DoorOneOrchestrator.js";
import { DoorOneWorkbench } from "../../runtime/DoorOneWorkbench.js";
import { annotateShellRecord, buildActiveShellState } from "../../hud/shellStateRouter.js";
import { buildOperatorLegibilityModel } from "../../hud/operatorLegibilityModel.js";
import { buildRuntimeReconstructionReplay } from "../../hud/replayModel.js";
import {
    RECORDED_SOURCE_FIXTURES,
    buildRecordedSourcePayloadFromArrayBuffer,
} from "../../hud/recordedSourceFixtures.js";

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

function runWorkbench(raw, runLabel) {
    const result = new DoorOneOrchestrator({
        policies: POLICIES,
        substrate_id: `compare.substrate.${runLabel}`,
    }).runBatch(raw, { query_spec: QUERY_SPEC, query_policy: QUERY_POLICY });
    result.run_label = runLabel;
    const workbench = new DoorOneWorkbench().assemble(result);
    return { result, workbench };
}

async function buildSyntheticCase() {
    const { signal } = makeTestSignal({
        seed: 42,
        durationSec: 10,
        noiseStd: 0.12,
        source_id: "synthetic.seed42",
    });
    const raw = {
        timestamps: signal.timestamps,
        values: signal.values,
        stream_id: signal.stream_id,
        source_id: signal.source_id,
        channel: signal.channel,
        modality: signal.modality,
        meta: signal.meta,
        clock_policy_id: POLICIES.clock_policy_id,
    };
    const { result, workbench } = runWorkbench(raw, "synthetic.compare.001");
    const replay = buildRuntimeReconstructionReplay({
        workbench,
        runResult: result,
        sourceFamilyLabel: "Synthetic Signal",
    });

    return {
        runId: "synthetic.compare.001",
        runLabel: result.run_label,
        sourceFamilyLabel: "Synthetic Signal",
        runResult: result,
        workbench,
        replay,
    };
}

async function buildRecordedCase() {
    const fixture = RECORDED_SOURCE_FIXTURES.find((entry) => entry.id === "recorded_room_change_baseline_001");
    const bytes = await readFile(path.join(ROOT, fixture.relativePath));
    const payload = buildRecordedSourcePayloadFromArrayBuffer(bytes, fixture, {
        stream_id: "recorded.compare.001",
    });
    const { result, workbench } = runWorkbench(payload, "recorded.compare.001");
    const replay = buildRuntimeReconstructionReplay({
        workbench,
        runResult: result,
        sourceFamilyLabel: fixture.sourceFamilyLabel,
    });

    return {
        runId: "recorded.compare.001",
        runLabel: result.run_label,
        sourceFamilyLabel: fixture.sourceFamilyLabel,
        runResult: result,
        workbench,
        replay,
    };
}

const syntheticCase = await buildSyntheticCase();
const recordedCase = await buildRecordedCase();

const replayLog = [
    annotateShellRecord(syntheticCase.replay, {
        runId: syntheticCase.runId,
        runResult: syntheticCase.runResult,
        sourceFamilyLabel: syntheticCase.sourceFamilyLabel,
    }),
    annotateShellRecord(recordedCase.replay, {
        runId: recordedCase.runId,
        runResult: recordedCase.runResult,
        sourceFamilyLabel: recordedCase.sourceFamilyLabel,
    }),
];

const shellState = buildActiveShellState({
    runId: syntheticCase.runId,
    runResult: syntheticCase.runResult,
    workbench: syntheticCase.workbench,
    requestLog: [],
    replayLog,
    runHistory: [syntheticCase, recordedCase],
    sourceFamilyLabel: syntheticCase.sourceFamilyLabel,
    runStatus: "complete",
});

const model = buildOperatorLegibilityModel(shellState);

section("A. shell state exports a bounded synthetic-vs-recorded comparison pair");
{
    eq(shellState.sourceComparison.synthetic.runLabel, syntheticCase.runLabel, "A1: shell state preserves synthetic comparison case");
    eq(shellState.sourceComparison.recorded.runLabel, recordedCase.runLabel, "A2: shell state preserves recorded comparison case");
    eq(shellState.sourceComparison.synthetic.replay.context_run_label, syntheticCase.runLabel, "A3: synthetic replay stays bound to its run");
    eq(shellState.sourceComparison.recorded.replay.context_run_label, recordedCase.runLabel, "A4: recorded replay stays bound to its run");
}

section("B. operator model keeps source basis explicit and asymmetry visible");
{
    ok(!!model.sourceComparison, "B1: operator model exposes source comparison");
    eq(model.sourceComparison.synthetic.kind, "synthetic", "B2: synthetic case stays labeled synthetic");
    eq(model.sourceComparison.recorded.kind, "recorded", "B3: recorded case stays labeled recorded");
    includes(model.sourceComparison.synthetic.sourceProfile, "noise std 0.12", "B4: synthetic profile stays explicit");
    includes(model.sourceComparison.recorded.sourceProfile, "recorded source", "B5: recorded profile stays explicit");
    includes(model.sourceComparison.recorded.sourceProfile, "baseline_001.wav", "B6: recorded filename stays explicit");
    ok(
        model.sourceComparison.synthetic.counts.h1 !== model.sourceComparison.recorded.counts.h1 ||
        model.sourceComparison.synthetic.counts.m1 !== model.sourceComparison.recorded.counts.m1 ||
        model.sourceComparison.synthetic.counts.anomalies !== model.sourceComparison.recorded.counts.anomalies,
        "B7: comparison preserves run-relative asymmetry instead of flattening counts"
    );
    ok(
        model.sourceComparison.summary.includes("local session comparison") ||
        model.sourceComparison.summary.includes("bounded to the current compared runs"),
        "B8: comparison summary stays bounded rather than global"
    );
}

section("C. operator panel source declares bounded synthetic-vs-recorded comparison");
{
    const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");
    const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");
    const shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8");
    const routerSrc = await readFile(path.join(ROOT, "hud/shellStateRouter.js"), "utf8");

    includes(panelSrc, "source-basis comparison", "C1: panel renders comparison block");
    includes(panelSrc, "synthetic vs recorded", "C2: panel labels bounded source-basis comparison");
    includes(panelSrc, "without flattening richer and coarser replay posture", "C3: panel preserves asymmetry warning");
    includes(modelSrc, "sourceComparison", "C4: operator model emits source comparison");
    includes(shellSrc, "setRunHistory", "C5: shell preserves comparison run history");
    includes(routerSrc, "buildSourceComparison", "C6: shell router derives comparison from session-backed history");
}

finish();
