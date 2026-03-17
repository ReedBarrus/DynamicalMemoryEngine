// scripts/run_door_one_pin_packet.js
//
// Door One pin packet runner
//
// Purpose:
//   - create an explicit bounded pin packet from durable provenance receipts
//   - optionally include the current digest snapshot if present
//   - preserve replay-honest references to latest live pointers
//
// Boundary contract:
//   - thin script-side helper only
//   - preservation only, not promotion
//   - not canon
//   - not truth
//   - not ontology
//   - receipts outrank digests
//   - does not alter runtime semantics
//
// References:
//   - README_DoorOnePinArchivePolicy.md
//   - README_DoorOneProvenanceRetention.md
//   - README_DoorOneRuntimeBoundary.md
//   - scripts/run_door_one_provenance_digest.js
//   - scripts/run_door_one_live.js

import { mkdir, readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_PROVENANCE_ROOT = "./out_provenance/live";
export const DEFAULT_PIN_ROOT = "./out_provenance/pinned";
export const DEFAULT_DIGEST_FILENAME = "live_digest.json";
export const DEFAULT_PIN_BASENAME = "pin_packet";
export const RECEIPT_FILE_RE = /^receipt_cycle_(\d+)_.*\.json$/;

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function uniqSorted(values) {
    return [...new Set(values.map((v) => (v == null ? "unknown" : String(v))))].sort();
}

async function pathExists(targetPath) {
    try {
        await stat(targetPath);
        return true;
    } catch (err) {
        if (err && err.code === "ENOENT") return false;
        throw err;
    }
}

async function readJson(filePath) {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
}

async function writeJson(filePath, data) {
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function basename(filePath) {
    return path.basename(filePath);
}

function parseReceiptCycleIndexFromName(name) {
    const m = String(name).match(RECEIPT_FILE_RE);
    if (!m) return null;
    const n = Number.parseInt(m[1], 10);
    return Number.isFinite(n) ? n : null;
}

export async function listReceiptFiles(provenanceRoot = DEFAULT_PROVENANCE_ROOT) {
    if (!(await pathExists(provenanceRoot))) return [];

    const entries = await readdir(provenanceRoot, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && RECEIPT_FILE_RE.test(entry.name))
        .map((entry) => path.join(provenanceRoot, entry.name))
        .sort((a, b) => {
            const ai = parseReceiptCycleIndexFromName(path.basename(a)) ?? 0;
            const bi = parseReceiptCycleIndexFromName(path.basename(b)) ?? 0;
            return ai - bi;
        });
}

export async function loadReceipts(provenanceRoot = DEFAULT_PROVENANCE_ROOT) {
    const files = await listReceiptFiles(provenanceRoot);
    const loaded = [];

    for (const filePath of files) {
        loaded.push({
            file_path: filePath,
            file_name: basename(filePath),
            receipt: await readJson(filePath),
        });
    }

    return loaded;
}

export function selectReceiptsForPin(loadedReceipts, opts = {}) {
    const receipts = asArray(loadedReceipts);
    const latestN = Math.max(1, Number.parseInt(String(opts.latestN ?? 3), 10) || 3);
    const streamId = opts.stream_id ?? null;
    const runLabel = opts.run_label ?? null;

    let filtered = receipts;

    if (streamId) {
        filtered = filtered.filter((entry) => entry?.receipt?.scope?.stream_id === streamId);
    }

    if (runLabel) {
        filtered = filtered.filter((entry) => entry?.receipt?.cycle?.run_label === runLabel);
    }

    const selected = filtered.slice(-latestN);

    return {
        selected,
        selection_policy: {
            latest_n: latestN,
            stream_id: streamId,
            run_label: runLabel,
        },
    };
}

export async function loadOptionalDigest({
    provenanceRoot = DEFAULT_PROVENANCE_ROOT,
    digestFilename = DEFAULT_DIGEST_FILENAME,
} = {}) {
    const digestPath = path.join(provenanceRoot, digestFilename);
    if (!(await pathExists(digestPath))) {
        return { found: false, digest_path: digestPath, digest: null };
    }

    return {
        found: true,
        digest_path: digestPath,
        digest: await readJson(digestPath),
    };
}

export function buildPinPacket({
    selectedReceipts,
    selectionPolicy,
    digestInfo = null,
    purpose = "bounded_review_replay_snapshot",
    pinLabel = null,
    provenanceRoot = DEFAULT_PROVENANCE_ROOT,
} = {}) {
    const selected = asArray(selectedReceipts);

    const receiptRows = selected.map((entry) => {
        const receipt = entry?.receipt ?? {};
        return {
            file_name: entry?.file_name ?? null,
            file_path: entry?.file_path ?? null,
            cycle_index: receipt?.cycle?.cycle_index ?? null,
            cycle_dir: receipt?.cycle?.cycle_dir ?? null,
            run_label: receipt?.cycle?.run_label ?? null,
            stream_id: receipt?.scope?.stream_id ?? null,
            source_mode: receipt?.scope?.source_mode ?? null,
            source_id: receipt?.scope?.source_id ?? null,

            readiness: receipt?.review_summary?.readiness ?? "unknown",
            confidence: receipt?.review_summary?.confidence ?? "unknown",
            claim_type: receipt?.review_summary?.claim_type ?? null,
            consensus_result: receipt?.review_summary?.consensus_result ?? "not_reviewed",
            blocker_count: receipt?.review_summary?.blocker_count ?? 0,
            insufficiency_count: receipt?.review_summary?.insufficiency_count ?? 0,

            references: {
                live_cycle_dir: receipt?.references?.live_cycle_dir ?? null,
                latest_workbench: receipt?.references?.latest_workbench ?? "./out_live/latest_workbench.json",
                latest_run_result: receipt?.references?.latest_run_result ?? "./out_live/latest_run_result.json",
                latest_cross_run_report:
                    receipt?.references?.latest_cross_run_report ?? "./out_live/latest_cross_run_report.json",
                latest_session_summary:
                    receipt?.references?.latest_session_summary ?? "./out_live/session_summary.json",
            },
        };
    });

    const cycleIndices = receiptRows
        .map((r) => r.cycle_index)
        .filter((n) => Number.isFinite(n));

    const runLabels = uniqSorted(receiptRows.map((r) => r.run_label));
    const streamIds = uniqSorted(receiptRows.map((r) => r.stream_id));
    const sourceModes = uniqSorted(receiptRows.map((r) => r.source_mode));

    const latest = receiptRows[receiptRows.length - 1] ?? null;

    return {
        packet_type: "runtime:door_one_pin_packet",
        packet_version: "0.1.0",
        generated_from:
            "Door One durable provenance receipts with optional digest snapshot; bounded preservation packet, not canon, not promotion",
        created_at: new Date().toISOString(),

        packet_metadata: {
            declared_purpose: purpose,
            pin_label:
                pinLabel ??
                (latest?.run_label
                    ? `pin_${String(latest.run_label).replace(/[^a-zA-Z0-9._-]/g, "_")}`
                    : "pin_packet"),
            provenance_root: provenanceRoot,
            receipt_count: receiptRows.length,
            cycle_index_min: cycleIndices.length ? Math.min(...cycleIndices) : null,
            cycle_index_max: cycleIndices.length ? Math.max(...cycleIndices) : null,
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

        selection_policy: {
            latest_n: selectionPolicy?.latest_n ?? null,
            stream_id: selectionPolicy?.stream_id ?? null,
            run_label: selectionPolicy?.run_label ?? null,
        },

        preservation_contents: {
            receipts: receiptRows,
            digest_snapshot:
                digestInfo?.found && digestInfo?.digest
                    ? {
                        digest_path: digestInfo.digest_path,
                        digest_type: digestInfo.digest?.digest_type ?? null,
                        digest_version: digestInfo.digest?.digest_version ?? null,
                        scope: digestInfo.digest?.scope ?? null,
                        aggregates: digestInfo.digest?.aggregates ?? null,
                        changes: digestInfo.digest?.changes ?? null,
                    }
                    : null,
        },

        bounded_review_context: latest
            ? {
                latest_readiness: latest.readiness,
                latest_confidence: latest.confidence,
                latest_claim_type: latest.claim_type,
                latest_consensus_result: latest.consensus_result,
                latest_blocker_count: latest.blocker_count,
                latest_insufficiency_count: latest.insufficiency_count,
            }
            : {
                latest_readiness: "unknown",
                latest_confidence: "unknown",
                latest_claim_type: null,
                latest_consensus_result: "not_reviewed",
                latest_blocker_count: 0,
                latest_insufficiency_count: 0,
            },

        references: {
            durable_surface: `${provenanceRoot}/receipt_cycle_*.json`,
            latest_live_dir: "./out_live",
            latest_workbench: "./out_live/latest_workbench.json",
            latest_run_result: "./out_live/latest_run_result.json",
            latest_cross_run_report: "./out_live/latest_cross_run_report.json",
            latest_session_summary: "./out_live/session_summary.json",
        },
    };
}

export async function writePinPacket({
    pinRoot = DEFAULT_PIN_ROOT,
    packet,
    fileBasename = DEFAULT_PIN_BASENAME,
} = {}) {
    await mkdir(pinRoot, { recursive: true });

    const cycleMin = packet?.packet_metadata?.cycle_index_min;
    const cycleMax = packet?.packet_metadata?.cycle_index_max;
    const label = packet?.packet_metadata?.pin_label ?? fileBasename;

    const safeLabel = String(label).replace(/[^a-zA-Z0-9._-]/g, "_");
    const cyclePart =
        cycleMin == null || cycleMax == null
            ? "cycles_none"
            : `cycles_${String(cycleMin).padStart(4, "0")}_${String(cycleMax).padStart(4, "0")}`;

    const filePath = path.join(pinRoot, `${safeLabel}_${cyclePart}.json`);
    await writeJson(filePath, packet);
    return filePath;
}

export async function runPinPacket({
    provenanceRoot = DEFAULT_PROVENANCE_ROOT,
    pinRoot = DEFAULT_PIN_ROOT,
    digestFilename = DEFAULT_DIGEST_FILENAME,
    latestN = 3,
    stream_id = null,
    run_label = null,
    purpose = "bounded_review_replay_snapshot",
    pinLabel = null,
} = {}) {
    const loaded = await loadReceipts(provenanceRoot);
    const selection = selectReceiptsForPin(loaded, {
        latestN,
        stream_id,
        run_label,
    });

    const digestInfo = await loadOptionalDigest({
        provenanceRoot,
        digestFilename,
    });

    const packet = buildPinPacket({
        selectedReceipts: selection.selected,
        selectionPolicy: selection.selection_policy,
        digestInfo,
        purpose,
        pinLabel,
        provenanceRoot,
    });

    const filePath = await writePinPacket({
        pinRoot,
        packet,
    });

    return {
        ok: true,
        packet,
        file_path: filePath,
        receipt_count: packet?.packet_metadata?.receipt_count ?? 0,
    };
}

async function main() {
    const res = await runPinPacket({
        provenanceRoot: process.env.DOOR_ONE_PROVENANCE_ROOT ?? DEFAULT_PROVENANCE_ROOT,
        pinRoot: process.env.DOOR_ONE_PIN_ROOT ?? DEFAULT_PIN_ROOT,
        digestFilename: process.env.DOOR_ONE_PROVENANCE_DIGEST_FILENAME ?? DEFAULT_DIGEST_FILENAME,
        latestN: Number.parseInt(process.env.DOOR_ONE_PIN_LATEST_N ?? "3", 10) || 3,
        stream_id: process.env.DOOR_ONE_PIN_STREAM_ID ?? null,
        run_label: process.env.DOOR_ONE_PIN_RUN_LABEL ?? null,
        purpose: process.env.DOOR_ONE_PIN_PURPOSE ?? "bounded_review_replay_snapshot",
        pinLabel: process.env.DOOR_ONE_PIN_LABEL ?? null,
    });

    console.log("");
    console.log("Door One Pin Packet");
    console.log(`  receipts: ${res.receipt_count}`);
    console.log(`  file: ${res.file_path}`);
    console.log(
        `  cycles: ${res.packet?.packet_metadata?.cycle_index_min ?? "—"} → ${res.packet?.packet_metadata?.cycle_index_max ?? "—"}`
    );
    console.log(
        `  streams: ${JSON.stringify(res.packet?.packet_metadata?.stream_ids ?? [])}`
    );
    console.log("");
}

const thisFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFilePath) {
    main().catch((err) => {
        console.error("Door One pin packet failed.");
        console.error(err);
        process.exit(1);
    });
}