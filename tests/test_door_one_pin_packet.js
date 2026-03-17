// tests/test_door_one_pin_packet.js
//
// Contract tests for scripts/run_door_one_pin_packet.js
//
// Scope:
//   - durable receipt loading
//   - bounded receipt selection
//   - optional digest inclusion
//   - pin packet shape
//   - write behavior
//   - boundary integrity (no canon / no truth / no ontology / no promotion)
//
// Boundary contract:
//   - script-side only
//   - preservation only
//   - receipts outrank digests
//   - does not alter runtime semantics
//   - does not mint canon

import { mkdir, mkdtemp, readFile, writeFile, rm, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
    listReceiptFiles,
    loadReceipts,
    selectReceiptsForPin,
    loadOptionalDigest,
    buildPinPacket,
    writePinPacket,
    runPinPacket,
} from "../scripts/run_door_one_pin_packet.js";

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

function deepEq(a, b, label) {
    const sa = JSON.stringify(a);
    const sb = JSON.stringify(b);
    ok(sa === sb, `${label}${sa === sb ? "" : " (deep mismatch)"}`);
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

function makeReceipt({
    cycleIndex,
    runLabel,
    streamId,
    sourceMode = "synthetic",
    sourceId = "synthetic_live_v1",
    readiness = "medium",
    confidence = "developing",
    claimType = "stable_structural_identity",
    consensusResult = "defer",
} = {}) {
    return {
        receipt_type: "runtime:door_one_live_provenance_receipt",
        receipt_version: "0.1.0",
        generated_from:
            "Door One live cycle summary, workbench scope/runtime summaries, and optional cross-run report only; durable provenance receipt, not canon",
        written_at: "2026-03-17T00:00:00.000Z",
        cycle: {
            cycle_dir: `cycle_${String(cycleIndex).padStart(2, "0")}`,
            cycle_index: cycleIndex,
            run_label: runLabel,
        },
        scope: {
            stream_id: streamId,
            source_mode: sourceMode,
            source_id: sourceId,
            channel: "ch0",
            modality: "voltage",
        },
        structural_summary: {
            state_count: 23,
            basin_count: 5,
            segment_count: 4,
            convergence: "insufficient_data",
            motion: "diffuse",
            occupancy: "recurrent",
            recurrence: "medium",
            continuity: "fragmented",
            transition_selectivity: "medium",
        },
        review_summary: {
            readiness,
            confidence,
            claim_type: claimType,
            consensus_result: consensusResult,
            blocker_count: 1,
            insufficiency_count: 1,
        },
        cross_run_context: {
            available: true,
            run_count: cycleIndex,
        },
        references: {
            live_cycle_dir: `./out_live/cycle_${String(cycleIndex).padStart(2, "0")}`,
            latest_workbench: "./out_live/latest_workbench.json",
            latest_run_result: "./out_live/latest_run_result.json",
            latest_cross_run_report: "./out_live/latest_cross_run_report.json",
            latest_session_summary: "./out_live/session_summary.json",
        },
    };
}

function makeDigest() {
    return {
        digest_type: "runtime:door_one_live_provenance_digest",
        digest_version: "0.1.0",
        generated_from:
            "Door One durable provenance receipts only; derived replay/digest surface, not canon, not promotion",
        scope: {
            receipt_count: 3,
            cycle_index_min: 1,
            cycle_index_max: 3,
            stream_ids: ["STR:synthetic_live_v1:ch0:voltage:arb:256"],
        },
        aggregates: {
            readiness_counts: { low: 1, medium: 2 },
            consensus_counts: { defer: 3 },
        },
        changes: {
            readiness_changed_count: 1,
        },
    };
}

const TMP_ROOT = await mkdtemp(path.join(os.tmpdir(), "dme-pin-packet-"));
const PROV_ROOT = path.join(TMP_ROOT, "out_provenance", "live");
const PIN_ROOT = path.join(TMP_ROOT, "out_provenance", "pinned");

await mkdir(PROV_ROOT, { recursive: true });
await mkdir(PIN_ROOT, { recursive: true });

await writeJson(
    path.join(PROV_ROOT, "receipt_cycle_0001_live_run_1.json"),
    makeReceipt({
        cycleIndex: 1,
        runLabel: "live_run_1",
        streamId: "STR:synthetic_live_v1:ch0:voltage:arb:256",
        readiness: "low",
    })
);
await writeJson(
    path.join(PROV_ROOT, "receipt_cycle_0002_live_run_2.json"),
    makeReceipt({
        cycleIndex: 2,
        runLabel: "live_run_2",
        streamId: "STR:synthetic_live_v1:ch0:voltage:arb:256",
        readiness: "medium",
    })
);
await writeJson(
    path.join(PROV_ROOT, "receipt_cycle_0003_live_run_3.json"),
    makeReceipt({
        cycleIndex: 3,
        runLabel: "live_run_3",
        streamId: "STR:synthetic_live_v2:ch0:voltage:arb:256",
        readiness: "medium",
    })
);
await writeJson(path.join(PROV_ROOT, "live_digest.json"), makeDigest());

section("A. Receipt loading and selection");

const receiptFiles = await listReceiptFiles(PROV_ROOT);
eq(receiptFiles.length, 3, "A1: receipt files discovered");
includes(receiptFiles[0], "receipt_cycle_0001_live_run_1.json", "A2: receipt files sorted");

const loaded = await loadReceipts(PROV_ROOT);
eq(loaded.length, 3, "A3: receipts loaded");
eq(loaded[2].receipt.cycle.cycle_index, 3, "A4: latest receipt is cycle 3");

const selectedLatest2 = selectReceiptsForPin(loaded, { latestN: 2 });
eq(selectedLatest2.selected.length, 2, "A5: latestN selection keeps bounded count");
eq(
    selectedLatest2.selected[0].receipt.cycle.cycle_index,
    2,
    "A6: bounded selection starts at cycle 2"
);

const selectedByStream = selectReceiptsForPin(loaded, {
    latestN: 5,
    stream_id: "STR:synthetic_live_v1:ch0:voltage:arb:256",
});
eq(selectedByStream.selected.length, 2, "A7: stream filter works");

section("B. Optional digest loading");

const digestInfo = await loadOptionalDigest({
    provenanceRoot: PROV_ROOT,
});
eq(digestInfo.found, true, "B1: digest found");
eq(
    digestInfo.digest.digest_type,
    "runtime:door_one_live_provenance_digest",
    "B2: digest type preserved"
);

section("C. Pin packet shape");

const packet = buildPinPacket({
    selectedReceipts: selectedLatest2.selected,
    selectionPolicy: selectedLatest2.selection_policy,
    digestInfo,
    purpose: "handoff_snapshot",
    pinLabel: "demo_pin",
    provenanceRoot: PROV_ROOT,
});

ok(packet && typeof packet === "object", "C1: buildPinPacket returns object");
eq(packet.packet_type, "runtime:door_one_pin_packet", "C2: packet_type correct");
eq(packet.packet_version, "0.1.0", "C3: packet_version correct");
eq(packet.packet_metadata.declared_purpose, "handoff_snapshot", "C4: purpose preserved");
eq(packet.packet_metadata.receipt_count, 2, "C5: packet receipt_count correct");
eq(packet.packet_metadata.cycle_index_min, 2, "C6: cycle min correct");
eq(packet.packet_metadata.cycle_index_max, 3, "C7: cycle max correct");
eq(packet.preservation_contents.receipts.length, 2, "C8: receipts embedded");
ok(packet.preservation_contents.digest_snapshot !== null, "C9: optional digest snapshot included");
eq(packet.disclaimers.not_canon, true, "C10: not_canon disclaimer present");
eq(packet.disclaimers.receipts_outrank_digest, true, "C11: receipt precedence disclaimer present");

section("D. Pin packet write and run");

const packetPath = await writePinPacket({
    pinRoot: PIN_ROOT,
    packet,
});

includes(packetPath, "demo_pin_cycles_0002_0003.json", "D1: file name deterministic");

const rawPacket = JSON.parse(await readFile(packetPath, "utf8"));
eq(rawPacket.packet_metadata.receipt_count, 2, "D2: written packet reloads cleanly");

const runRes = await runPinPacket({
    provenanceRoot: PROV_ROOT,
    pinRoot: PIN_ROOT,
    latestN: 2,
    pinLabel: "auto_pin",
});

eq(runRes.ok, true, "D3: runPinPacket ok");
eq(runRes.packet.packet_metadata.receipt_count, 2, "D4: runPinPacket bounded count preserved");
await access(runRes.file_path);
ok(true, "D5: runPinPacket writes output file");

section("E. Boundary integrity");

const packetJson = JSON.stringify(packet);

notIncludes(packetJson, '"artifact_class":"C1"', "E1: no C1 artifact class");
notIncludes(packetJson, '"canonical"', "E2: no canonical key");
notIncludes(packetJson, '"promoted"', "E3: no promoted key");
notIncludes(packetJson, '"truth"', "E4: no truth key");
notIncludes(packetJson, '"ontology"', "E5: no ontology key");
includes(packet.generated_from, "not canon", "E6: generated_from preserves non-canon boundary");

await rm(TMP_ROOT, { recursive: true, force: true });

finish();