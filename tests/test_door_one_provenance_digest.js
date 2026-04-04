// tests/test_door_one_provenance_digest.js
//
// Contract tests for scripts/run_door_one_provenance_digest.js
//
// Scope:
//   - durable receipt discovery
//   - digest shape and sorted timeline behavior
//   - aggregate and change summaries
//   - digest write behavior
//   - boundary integrity (no canon / no truth / no ontology / no promotion)
//
// Boundary contract:
//   - script-side only
//   - consumes durable provenance receipts only
//   - does not alter runtime semantics
//   - does not mint canon
//   - does not promote
//
// References:
//   - scripts/run_door_one_provenance_digest.js
//   - scripts/run_door_one_live.js
//   - README_DoorOneRuntimeBoundary.md
//   - README_DoorOneProvenanceRetention.md
//   - README_WorkflowContract.md
//   - README_MasterConstitution.md

import { mkdir, mkdtemp, readdir, readFile, writeFile, rm, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
    listReceiptFiles,
    loadProvenanceReceipts,
    buildProvenanceDigest,
    writeProvenanceDigest,
    runProvenanceDigest,
} from "../scripts/run_door_one_provenance_digest.js";

// ─────────────────────────────────────────────────────────────────────────────
// Minimal test harness
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

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
    recurrence = "medium",
    convergence = "insufficient_data",
    basinCount = 5,
    segmentCount = 4,
    stateCount = 23,
    blockerCount = 1,
    insufficiencyCount = 1,
    crossRunCount = 1,
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
            state_count: stateCount,
            basin_count: basinCount,
            segment_count: segmentCount,
            convergence,
            motion: "diffuse",
            occupancy: "recurrent",
            recurrence,
            continuity: "fragmented",
            transition_selectivity: "medium",
        },

        review_summary: {
            readiness,
            confidence,
            claim_type: claimType,
            consensus_result: consensusResult,
            blocker_count: blockerCount,
            insufficiency_count: insufficiencyCount,
        },

        cross_run_context: {
            available: true,
            run_count: crossRunCount,
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

// ─────────────────────────────────────────────────────────────────────────────
// Temp dirs
// ─────────────────────────────────────────────────────────────────────────────

const TMP_ROOT = await mkdtemp(path.join(os.tmpdir(), "dme-prov-digest-"));
const PROV_ROOT = path.join(TMP_ROOT, "out_provenance", "live");

await mkdir(PROV_ROOT, { recursive: true });

// Write receipts intentionally out of order to verify sorting by cycle index.
await writeJson(
    path.join(PROV_ROOT, "receipt_cycle_0003_live_run_3.json"),
    makeReceipt({
        cycleIndex: 3,
        runLabel: "live_run_3",
        streamId: "STR:synthetic_live_v2:ch0:voltage:arb:256",
        readiness: "medium",
        recurrence: "medium",
        consensusResult: "defer",
        crossRunCount: 3,
    })
);

await writeJson(
    path.join(PROV_ROOT, "receipt_cycle_0001_live_run_1.json"),
    makeReceipt({
        cycleIndex: 1,
        runLabel: "live_run_1",
        streamId: "STR:synthetic_live_v1:ch0:voltage:arb:256",
        readiness: "low",
        recurrence: "medium",
        consensusResult: "defer",
        crossRunCount: 1,
    })
);

await writeJson(
    path.join(PROV_ROOT, "receipt_cycle_0002_live_run_2.json"),
    makeReceipt({
        cycleIndex: 2,
        runLabel: "live_run_2",
        streamId: "STR:synthetic_live_v1:ch0:voltage:arb:256",
        readiness: "medium",
        recurrence: "high",
        consensusResult: "defer",
        crossRunCount: 2,
    })
);

// Non-receipt file should be ignored.
await writeJson(path.join(PROV_ROOT, "live_digest.json"), { note: "ignore me" });

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

section("A. Receipt discovery");

const receiptFiles = await listReceiptFiles(PROV_ROOT);
eq(receiptFiles.length, 3, "A1: only receipt_cycle_*.json files discovered");
includes(receiptFiles[0], "receipt_cycle_0001_live_run_1.json", "A2: receipt files sorted by cycle index");
includes(receiptFiles[2], "receipt_cycle_0003_live_run_3.json", "A3: highest cycle receipt last");

const loaded = await loadProvenanceReceipts(PROV_ROOT);
eq(loaded.length, 3, "A4: loadProvenanceReceipts loads all receipts");
eq(loaded[0].receipt.cycle.cycle_index, 1, "A5: first loaded receipt is cycle 1");
eq(loaded[2].receipt.cycle.cycle_index, 3, "A6: last loaded receipt is cycle 3");

section("B. Digest shape");

const digest = buildProvenanceDigest({
    loadedReceipts: loaded,
    provenanceRoot: PROV_ROOT,
});

ok(digest && typeof digest === "object", "B1: buildProvenanceDigest returns object");
eq(
    digest.digest_type,
    "runtime:door_one_live_provenance_digest",
    "B2: digest_type correct"
);
eq(digest.digest_version, "0.1.0", "B3: digest_version correct");
includes(digest.generated_from, "not canon", "B4: generated_from preserves non-canon boundary");
eq(digest.scope.receipt_count, 3, "B5: receipt_count correct");
eq(digest.scope.cycle_index_min, 1, "B6: cycle_index_min correct");
eq(digest.scope.cycle_index_max, 3, "B7: cycle_index_max correct");
deepEq(
    digest.scope.source_modes,
    ["synthetic"],
    "B8: source_modes collapsed and sorted"
);
eq(digest.timelines.cycle_rows.length, 3, "B9: timeline rows present");

section("C. Timeline and aggregate behavior");

eq(digest.timelines.cycle_rows[0].cycle_index, 1, "C1: timeline sorted ascending");
eq(digest.timelines.cycle_rows[1].cycle_index, 2, "C2: middle cycle preserved");
eq(digest.timelines.cycle_rows[2].cycle_index, 3, "C3: final cycle preserved");

eq(digest.aggregates.readiness_counts.low, 1, "C4: readiness_counts.low correct");
eq(digest.aggregates.readiness_counts.medium, 2, "C5: readiness_counts.medium correct");
eq(digest.aggregates.recurrence_counts.medium, 2, "C6: recurrence_counts.medium correct");
eq(digest.aggregates.recurrence_counts.high, 1, "C7: recurrence_counts.high correct");
eq(digest.aggregates.consensus_counts.defer, 3, "C8: consensus_counts.defer correct");
eq(digest.changes.readiness_changed_count, 1, "C9: readiness change count correct");
eq(digest.changes.recurrence_changed_count, 2, "C10: recurrence change count correct");
eq(digest.changes.consensus_changed_count, 0, "C11: consensus change count correct");
eq(digest.changes.stream_switch_count, 1, "C12: stream switch count correct");

section("D. Digest write behavior");

const digestPath = await writeProvenanceDigest({
    provenanceRoot: PROV_ROOT,
    digest,
});

includes(digestPath, "live_digest.json", "D1: digest written to expected filename");

const digestRaw = await readFile(digestPath, "utf8");
const digestReloaded = JSON.parse(digestRaw);

eq(digestReloaded.scope.receipt_count, 3, "D2: written digest reloads cleanly");
deepEq(digestReloaded.aggregates, digest.aggregates, "D3: written digest preserves aggregates");

const runRes = await runProvenanceDigest({
    provenanceRoot: PROV_ROOT,
});

eq(runRes.ok, true, "D4: runProvenanceDigest returns ok=true");
eq(runRes.receipt_count, 3, "D5: runProvenanceDigest receipt_count correct");
deepEq(runRes.digest.aggregates, digest.aggregates, "D6: runProvenanceDigest deterministic");

section("E. Empty and missing provenance root behavior");

const EMPTY_ROOT = path.join(TMP_ROOT, "empty_out_provenance", "live");
await mkdir(EMPTY_ROOT, { recursive: true });

const emptyFiles = await listReceiptFiles(EMPTY_ROOT);
eq(emptyFiles.length, 0, "E1: empty provenance directory yields zero receipt files");

const emptyLoaded = await loadProvenanceReceipts(EMPTY_ROOT);
eq(emptyLoaded.length, 0, "E2: empty provenance directory loads zero receipts");

const emptyDigest = buildProvenanceDigest({
    loadedReceipts: emptyLoaded,
    provenanceRoot: EMPTY_ROOT,
});

eq(emptyDigest.scope.receipt_count, 0, "E3: empty digest receipt_count is zero");
eq(emptyDigest.scope.cycle_index_min, null, "E4: empty digest cycle_index_min is null");
eq(emptyDigest.scope.cycle_index_max, null, "E5: empty digest cycle_index_max is null");
eq(emptyDigest.timelines.cycle_rows.length, 0, "E6: empty digest has zero timeline rows");

const MISSING_ROOT = path.join(TMP_ROOT, "missing_out_provenance", "live");

const missingFiles = await listReceiptFiles(MISSING_ROOT);
eq(missingFiles.length, 0, "E7: missing provenance directory yields zero receipt files");

const missingLoaded = await loadProvenanceReceipts(MISSING_ROOT);
eq(missingLoaded.length, 0, "E8: missing provenance directory loads zero receipts");

const missingRun = await runProvenanceDigest({
    provenanceRoot: MISSING_ROOT,
    filename: "empty_live_digest.json",
});

eq(missingRun.ok, true, "E9: runProvenanceDigest succeeds on missing provenance root");
eq(missingRun.receipt_count, 0, "E10: missing provenance root digest has zero receipts");
eq(
    missingRun.digest.timelines.cycle_rows.length,
    0,
    "E11: missing provenance root digest has zero timeline rows"
);

await access(missingRun.file_path);
ok(true, "E12: missing provenance root still writes digest output");

section("F. Boundary integrity");

const digestJson = JSON.stringify(digest);

notIncludes(digestJson, '"artifact_class":"C1"', "F1: digest has no C1 artifact class");
notIncludes(digestJson, '"canonical"', "F2: digest has no canonical key");
notIncludes(digestJson, '"promoted"', "F3: digest has no promoted key");
notIncludes(digestJson, '"truth"', "F4: digest has no truth key");
notIncludes(digestJson, '"ontology"', "F5: digest has no ontology key");
includes(
    digest.references.durable_surface,
    "receipt_cycle_*.json",
    "F6: digest references durable receipt surface"
);

await rm(TMP_ROOT, { recursive: true, force: true });

finish();