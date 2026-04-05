import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    RECORDED_SOURCE_FIXTURES,
    buildRecordedSourcePayloadFromArrayBuffer,
} from "../../hud/recordedSourceFixtures.js";
import {
    buildInitialSourceRegistry,
    buildRecordedFixtureSourceRecord,
    buildStagedSourceRecord,
    updateSourceRecordMetadata,
    upsertSourceRecord,
    sourceRecordFamilyLabel,
    resolveRegisteredSourcePayload,
} from "../../hud/sourceRegistry.js";
import { DoorOneOrchestrator } from "../../runtime/DoorOneOrchestrator.js";
import { DoorOneWorkbench } from "../../runtime/DoorOneWorkbench.js";

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
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`
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
    query_policy: { policy_id: "query.synthetic.v1", query_mode: "similarity", top_k: 3 },
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

const ROOM_CHANGE = RECORDED_SOURCE_FIXTURES.find(
    (fixture) => fixture.id === "recorded_room_change_baseline_001"
);

section("A. recorded fixtures seed the initial source registry");
{
    const registry = buildInitialSourceRegistry();
    ok(registry.length >= 2, "A1: initial registry seeds recorded fixtures");
    const roomRecord = registry.find((record) => record.fixture_id === ROOM_CHANGE.id);
    eq(roomRecord.source_basis, "recorded_source", "A2: seeded record keeps recorded source basis");
    eq(roomRecord.registry_path, ROOM_CHANGE.relativePath, "A3: seeded record preserves fixture path");
    eq(roomRecord.readiness, "ready", "A4: seeded fixture is marked ready");
    eq(roomRecord.decode_posture, "fixture_loader", "A5: seeded fixture keeps fixture-loader posture");
}

section("B. staged adapter payload becomes a reusable source record");
{
    const file = new File(["fake wav"], "example_001.wav", { type: "audio/wav", lastModified: 12345 });
    const adapterResult = {
        ok: true,
        meta: { adapter: "wav" },
        payload: {
            timestamps: [0, 0.5, 1.0],
            values: [0.1, 0.2, 0.3],
            stream_id: "wav.stream.example_001",
            source_id: "example_001.wav",
            channel: "ch0_left_or_mono",
            modality: "audio_sample",
            clock_policy_id: "clock.file.v1",
            meta: {
                adapter: "wav",
                original_filename: "example_001.wav",
                sample_rate_hz: 2400,
                original_channels: 1,
                duration_sec: 1.0,
            },
        },
    };

    const record = buildStagedSourceRecord(file, adapterResult);
    eq(record.filename, "example_001.wav", "B1: staged record preserves filename");
    eq(record.registry_path, "staged/example_001.wav", "B2: staged record gets registry-relative path");
    eq(record.source_basis, "recorded_source", "B3: WAV staging is classified as recorded source");
    eq(record.modality, "audio_wav", "B4: staged record exposes audio modality");
    eq(record.sample_rate_hz, 2400, "B5: sample rate is lifted into the record");
    eq(record.channels, 1, "B6: channel count is lifted into the record");
    eq(record.decode_posture, "decoded", "B7: staged WAV is marked decoded");
    eq(record.readiness, "ready", "B8: staged payload is ready once normalized");
    eq(record.operator_label, "Example 001", "B9: staged record gets an operator label");
}

section("C. metadata update persists on the source record shape");
{
    const initial = buildRecordedFixtureSourceRecord(ROOM_CHANGE);
    const updated = updateSourceRecordMetadata(initial, {
        source_family: "manual_room_change_review",
        operator_label: "Room Change Review",
        notes: "operator note",
    });
    const registry = upsertSourceRecord([initial], updated);

    eq(updated.source_family, "manual_room_change_review", "C1: source family is editable");
    eq(updated.operator_label, "Room Change Review", "C2: operator label is editable");
    eq(updated.notes, "operator note", "C3: notes are editable");
    eq(registry[0].source_family, "manual_room_change_review", "C4: registry update preserves edited family");
    eq(sourceRecordFamilyLabel(updated), "Registered Source · manual_room_change_review", "C5: family label is derived from the source record");
}

section("D. registered source payload resolves through the real ingest contract");
{
    const fixtureRecord = buildRecordedFixtureSourceRecord(ROOM_CHANGE);
    const loadFixturePayload = async (fixture, options = {}) => {
        const bytes = await readFile(path.join(ROOT, fixture.relativePath));
        return buildRecordedSourcePayloadFromArrayBuffer(bytes, fixture, options);
    };
    const payload = await resolveRegisteredSourcePayload(fixtureRecord, {
        fixtures: [ROOM_CHANGE],
        loadFixturePayload,
        runLabel: "registry.test",
    });
    const result = new DoorOneOrchestrator({
        policies: POLICIES,
        substrate_id: "registry.substrate.test",
    }).runBatch(payload, {
        query_spec: QUERY_SPEC,
        query_policy: QUERY_POLICY,
    });
    const workbench = new DoorOneWorkbench().assemble(result);

    eq(payload.source_id, fixtureRecord.source_id, "D1: payload source_id comes from the registry record");
    eq(payload.meta.source_record_id, fixtureRecord.source_id, "D2: payload carries the source record id");
    eq(payload.meta.source_mode, "recorded_source", "D3: payload keeps explicit recorded-source basis");
    eq(payload.meta.recorded_family, fixtureRecord.source_family, "D4: payload carries source family from the registry record");
    eq(result.ok, true, "D5: registry payload runs through DoorOneOrchestrator");
    ok(Array.isArray(workbench.scope.segment_ids), "D6: workbench assembles from registry-driven ingest");
}

section("E. staged registry payload resolves freshly per run without recursive wrapping");
{
    const cachedPayload = {
        timestamps: [0, 0.25, 0.5, 0.75],
        values: [0.0, 0.3, -0.2, 0.1],
        stream_id: "wav.stream.staged",
        source_id: "SRC:staged:80hz",
        channel: "ch0_left_or_mono",
        modality: "audio_sample",
        clock_policy_id: "clock.file.v1",
        meta: {
            adapter: "wav",
            original_filename: "80hz_Sine.wav",
            sample_rate_hz: 2400,
            original_channels: 1,
            duration_sec: 1.0,
        },
    };
    const sourceRecord = buildStagedSourceRecord(
        new File(["fake wav"], "80hz_Sine.wav", { type: "audio/wav", lastModified: 54321 }),
        { ok: true, meta: { adapter: "wav" }, payload: cachedPayload },
        { source_id: "SRC:staged:80hz" }
    );

    const first = await resolveRegisteredSourcePayload(sourceRecord, {
        payloadCache: { [sourceRecord.source_id]: cachedPayload },
        runLabel: "first",
    });
    first.meta.registry_notes = "mutated in first run";

    const second = await resolveRegisteredSourcePayload(sourceRecord, {
        payloadCache: { [sourceRecord.source_id]: cachedPayload },
        runLabel: "second",
    });

    eq(cachedPayload.meta.source_record_id, undefined, "E1: cached payload is not wrapped in place");
    eq(first === second, false, "E2: each run gets a fresh payload object");
    eq(first.meta === second.meta, false, "E3: each run gets a fresh meta object");
    eq(second.meta.registry_notes, "", "E4: first-run mutation does not leak into the next run");
    eq(second.stream_id, `registry.stream.${sourceRecord.source_id}.second`, "E5: stream id is resolved once per run");
    eq(second.meta.source_record_id, sourceRecord.source_id, "E6: staged source record id is still attached");
}

section("F. shell exposes the source registry lane without per-file rewiring");
{
    const shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8");

    includes(shellSrc, 'id: "source_registry"', "F1: shell defines a source registry family");
    includes(shellSrc, "buildInitialSourceRegistry", "F2: shell seeds a registry from helper state");
    includes(shellSrc, "buildStagedSourceRecord", "F3: shell stages selected files into source records");
    includes(shellSrc, "resolveRegisteredSourcePayload", "F4: shell resolves runs from registered source objects");
    includes(shellSrc, "selectedRegistrySourceId", "F5: shell tracks the selected registered source");
    includes(shellSrc, "source record", "F6: shell exposes source-record fields");
    includes(shellSrc, "stage / add source", "F7: shell exposes bounded staging UI");
    includes(shellSrc, "setSourceRegistry((records) => upsertSourceRecord(records, record))", "F8: shell registers new sources without adding per-file branches");
    includes(shellSrc, "runImportedPipeline(registryPayload, id)", "F9: registered sources reuse the existing imported ingest path");
}

finish();
