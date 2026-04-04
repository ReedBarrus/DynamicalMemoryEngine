// tests/test_door_one_archive_bundle.js
//
// Contract tests for scripts/run_door_one_archive_bundle.js
//
// Scope:
//   - pinned packet loading
//   - bounded archive selection
//   - archive bundle shape
//   - write behavior
//   - boundary integrity (no canon / no truth / no ontology / no promotion)

import { mkdir, mkdtemp, readFile, writeFile, rm, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
    listPinPacketFiles,
    loadPinPackets,
    selectPinPacketsForArchive,
    buildArchiveBundle,
    writeArchiveBundle,
    runArchiveBundle,
} from "../scripts/run_door_one_archive_bundle.js";

let PASS = 0;
let FAIL = 0;

function section(title) {
    console.log(`\n── ${title} ──`);
}

function ok(condition, label) {
    if (condition) {
        PASS += 1;
        console.log(`  ✓ ${label}`);
    } else {
        FAIL += 1;
        console.log(`  ✗ ${label}`);
    }
}

function eq(actual, expected, label) {
    ok(
        Object.is(actual, expected),
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${expected}, got ${actual})`}`
    );
}

function includes(str, sub, label) {
    ok(String(str).includes(sub), label);
}

function notIncludes(str, sub, label) {
    ok(!String(str).includes(sub), label);
}

function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL === 0 ? "  ALL TESTS PASSED ✓" : "  TESTS FAILED ✗");
    if (FAIL > 0) process.exit(1);
}

async function writeJson(filePath, data) {
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function makePinPacket({
    pinLabel,
    purpose = "bounded_review_replay_snapshot",
    cycleMin,
    cycleMax,
    streamIds,
    runLabels,
    sourceModes = ["synthetic"],
    latestReadiness = "medium",
    latestConsensus = "defer",
} = {}) {
    return {
        packet_type: "runtime:door_one_pin_packet",
        packet_version: "0.1.0",
        generated_from:
            "Door One durable provenance receipts with optional digest snapshot; bounded preservation packet, not canon, not promotion",
        created_at: "2026-03-17T00:00:00.000Z",
        packet_metadata: {
            declared_purpose: purpose,
            pin_label: pinLabel,
            provenance_root: "./out_provenance/live",
            receipt_count: 2,
            cycle_index_min: cycleMin,
            cycle_index_max: cycleMax,
            run_labels: runLabels,
            stream_ids: streamIds,
            source_modes: sourceModes,
        },
        disclaimers: {
            not_canon: true,
            not_truth: true,
            not_ontology: true,
            not_promotion: true,
            receipts_outrank_digest: true,
            storage_class_not_authority_class: true,
        },
        preservation_contents: {
            receipts: [
                {
                    file_name: `receipt_cycle_${String(cycleMin).padStart(4, "0")}.json`,
                    cycle_index: cycleMin,
                    run_label: runLabels[0],
                    stream_id: streamIds[0],
                },
                {
                    file_name: `receipt_cycle_${String(cycleMax).padStart(4, "0")}.json`,
                    cycle_index: cycleMax,
                    run_label: runLabels[runLabels.length - 1],
                    stream_id: streamIds[streamIds.length - 1],
                },
            ],
            digest_snapshot: {
                digest_type: "runtime:door_one_live_provenance_digest",
                digest_version: "0.1.0",
            },
        },
        bounded_review_context: {
            latest_readiness: latestReadiness,
            latest_confidence: "developing",
            latest_claim_type: "stable_structural_identity",
            latest_consensus_result: latestConsensus,
            latest_blocker_count: 1,
            latest_insufficiency_count: 1,
        },
        references: {
            durable_surface: "./out_provenance/live/receipt_cycle_*.json",
            latest_live_dir: "./out_live",
        },
    };
}

const TMP_ROOT = await mkdtemp(path.join(os.tmpdir(), "dme-archive-bundle-"));
const PIN_ROOT = path.join(TMP_ROOT, "out_provenance", "pinned");
const ARCHIVE_ROOT = path.join(TMP_ROOT, "out_provenance", "archive");

await mkdir(PIN_ROOT, { recursive: true });
await mkdir(ARCHIVE_ROOT, { recursive: true });

await writeJson(
    path.join(PIN_ROOT, "pin_live_run_2_cycles_0001_0002.json"),
    makePinPacket({
        pinLabel: "pin_live_run_2",
        cycleMin: 1,
        cycleMax: 2,
        streamIds: ["STR:synthetic_live_v1:ch0:voltage:arb:256"],
        runLabels: ["live_run_1", "live_run_2"],
    })
);

await writeJson(
    path.join(PIN_ROOT, "pin_live_run_4_cycles_0003_0004.json"),
    makePinPacket({
        pinLabel: "pin_live_run_4",
        cycleMin: 3,
        cycleMax: 4,
        streamIds: ["STR:synthetic_live_v2:ch0:voltage:arb:256"],
        runLabels: ["live_run_3", "live_run_4"],
    })
);

await writeJson(
    path.join(PIN_ROOT, "pin_live_run_5_cycles_0004_0005.json"),
    makePinPacket({
        pinLabel: "pin_live_run_5",
        cycleMin: 4,
        cycleMax: 5,
        streamIds: ["STR:synthetic_live_v1:ch0:voltage:arb:256"],
        runLabels: ["live_run_4", "live_run_5"],
    })
);

section("A. Pin packet loading and selection");

const pinFiles = await listPinPacketFiles(PIN_ROOT);
eq(pinFiles.length, 3, "A1: pin packet files discovered");
includes(pinFiles[0], ".json", "A2: pin packet file list returned");

const loaded = await loadPinPackets(PIN_ROOT);
eq(loaded.length, 3, "A3: pin packets loaded");

const selectedLatest2 = selectPinPacketsForArchive(loaded, { latestN: 2 });
eq(selectedLatest2.selected.length, 2, "A4: latestN bounded selection works");

const selectedByStream = selectPinPacketsForArchive(loaded, {
    latestN: 5,
    stream_id: "STR:synthetic_live_v1:ch0:voltage:arb:256",
});
eq(selectedByStream.selected.length, 2, "A5: stream filter works");

section("B. Archive bundle shape");

const bundle = buildArchiveBundle({
    selectedPackets: selectedLatest2.selected,
    selectionPolicy: selectedLatest2.selection_policy,
    archiveLabel: "demo_archive",
    archivePurpose: "handoff_archive_bundle",
    archiveRoot: ARCHIVE_ROOT,
});

ok(bundle && typeof bundle === "object", "B1: buildArchiveBundle returns object");
eq(bundle.bundle_type, "runtime:door_one_archive_bundle", "B2: bundle_type correct");
eq(bundle.bundle_version, "0.1.0", "B3: bundle_version correct");
eq(bundle.bundle_metadata.declared_purpose, "handoff_archive_bundle", "B4: purpose preserved");
eq(bundle.bundle_metadata.packet_count, 2, "B5: packet_count correct");
eq(bundle.bundle_metadata.cycle_index_min, 3, "B6: cycle min correct");
eq(bundle.bundle_metadata.cycle_index_max, 5, "B7: cycle max correct");
eq(bundle.archive_contents.pinned_packets.length, 2, "B8: pinned packet summaries embedded");
eq(bundle.disclaimers.not_canon, true, "B9: not_canon disclaimer present");
eq(bundle.disclaimers.not_promotion, true, "B10: not_promotion disclaimer present");

section("C. Archive write and run");

const bundlePath = await writeArchiveBundle({
    archiveRoot: ARCHIVE_ROOT,
    bundle,
});

includes(bundlePath, "demo_archive_cycles_0003_0005.json", "C1: file name deterministic");

const rawBundle = JSON.parse(await readFile(bundlePath, "utf8"));
eq(rawBundle.bundle_metadata.packet_count, 2, "C2: written bundle reloads cleanly");

const runRes = await runArchiveBundle({
    pinRoot: PIN_ROOT,
    archiveRoot: ARCHIVE_ROOT,
    latestN: 2,
    archiveLabel: "auto_archive",
});

eq(runRes.ok, true, "C3: runArchiveBundle ok");
eq(runRes.packet_count, 2, "C4: runArchiveBundle bounded count preserved");
await access(runRes.file_path);
ok(true, "C5: runArchiveBundle writes output file");

section("D. Boundary integrity");

const bundleJson = JSON.stringify(bundle);

notIncludes(bundleJson, '"artifact_class":"C1"', "D1: no C1 artifact class");
notIncludes(bundleJson, '"canonical"', "D2: no canonical key");
notIncludes(bundleJson, '"promoted"', "D3: no promoted key");
notIncludes(bundleJson, '"truth"', "D4: no truth key");
notIncludes(bundleJson, '"ontology"', "D5: no ontology key");
includes(bundle.generated_from, "not canon", "D6: generated_from preserves non-canon boundary");

await rm(TMP_ROOT, { recursive: true, force: true });

finish();