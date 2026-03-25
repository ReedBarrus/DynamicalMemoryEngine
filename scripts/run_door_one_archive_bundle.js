// scripts/run_door_one_archive_bundle.js
//
// Door One archive bundle runner
//
// Purpose:
//   - create an explicit longer-horizon archive bundle from pinned packets
//   - preserve declared packet membership and references
//   - optionally include compact packet summaries for replay convenience
//
// Boundary contract:
//   - thin script-side helper only
//   - preservation only, not promotion
//   - not canon
//   - not truth
//   - not ontology
//   - not promotion
//   - does not alter runtime semantics
//
// References:
//   - README_DoorOnePinArchivePolicy.md
//   - README_DoorOneProvenanceRetention.md
//   - README_DoorOneRuntimeBoundary.md
//   - scripts/run_door_one_pin_packet.js

import { mkdir, readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_PIN_ROOT = "./out_provenance/pinned";
export const DEFAULT_ARCHIVE_ROOT = "./out_provenance/archive";
export const DEFAULT_ARCHIVE_BASENAME = "archive_bundle";
export const PIN_FILE_RE = /\.json$/;

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

export async function listPinPacketFiles(pinRoot = DEFAULT_PIN_ROOT) {
    if (!(await pathExists(pinRoot))) return [];

    const entries = await readdir(pinRoot, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && PIN_FILE_RE.test(entry.name))
        .map((entry) => path.join(pinRoot, entry.name))
        .sort();
}

export async function loadPinPackets(pinRoot = DEFAULT_PIN_ROOT) {
    const files = await listPinPacketFiles(pinRoot);
    const loaded = [];

    for (const filePath of files) {
        loaded.push({
            file_path: filePath,
            file_name: basename(filePath),
            packet: await readJson(filePath),
        });
    }

    return loaded;
}

export function selectPinPacketsForArchive(loadedPackets, opts = {}) {
    const packets = asArray(loadedPackets);
    const latestN = Math.max(1, Number.parseInt(String(opts.latestN ?? 3), 10) || 3);
    const streamId = opts.stream_id ?? null;
    const pinLabel = opts.pin_label ?? null;
    const declaredPurpose = opts.declared_purpose ?? null;

    let filtered = packets;

    if (streamId) {
        filtered = filtered.filter((entry) =>
            asArray(entry?.packet?.packet_metadata?.stream_ids).includes(streamId)
        );
    }

    if (pinLabel) {
        filtered = filtered.filter(
            (entry) => entry?.packet?.packet_metadata?.pin_label === pinLabel
        );
    }

    if (declaredPurpose) {
        filtered = filtered.filter(
            (entry) => entry?.packet?.packet_metadata?.declared_purpose === declaredPurpose
        );
    }

    const selected = filtered.slice(-latestN);

    return {
        selected,
        selection_policy: {
            latest_n: latestN,
            stream_id: streamId,
            pin_label: pinLabel,
            declared_purpose: declaredPurpose,
        },
    };
}

export function buildArchiveBundle({
    selectedPackets,
    selectionPolicy,
    archiveLabel = null,
    archivePurpose = "longer_horizon_replay_bundle",
    archiveRoot = DEFAULT_ARCHIVE_ROOT,
} = {}) {
    const selected = asArray(selectedPackets);

    const packetRows = selected.map((entry) => {
        const packet = entry?.packet ?? {};
        const meta = packet?.packet_metadata ?? {};
        const review = packet?.bounded_review_context ?? {};
        const preservation = packet?.preservation_contents ?? {};

        return {
            file_name: entry?.file_name ?? null,
            file_path: entry?.file_path ?? null,
            packet_type: packet?.packet_type ?? null,
            packet_version: packet?.packet_version ?? null,
            pin_label: meta?.pin_label ?? null,
            declared_purpose: meta?.declared_purpose ?? null,
            receipt_count: meta?.receipt_count ?? 0,
            cycle_index_min: meta?.cycle_index_min ?? null,
            cycle_index_max: meta?.cycle_index_max ?? null,
            run_labels: meta?.run_labels ?? [],
            stream_ids: meta?.stream_ids ?? [],
            source_modes: meta?.source_modes ?? [],
            latest_readiness: review?.latest_readiness ?? "unknown",
            latest_consensus_result: review?.latest_consensus_result ?? "not_reviewed",
            digest_included: preservation?.digest_snapshot != null,
            receipt_refs: asArray(preservation?.receipts).map((r) => ({
                file_name: r?.file_name ?? null,
                file_path: r?.file_path ?? null,
                cycle_index: r?.cycle_index ?? null,
                run_label: r?.run_label ?? null,
                stream_id: r?.stream_id ?? null,
            })),
        };
    });

    const cycleMins = packetRows.map((r) => r.cycle_index_min).filter(Number.isFinite);
    const cycleMaxs = packetRows.map((r) => r.cycle_index_max).filter(Number.isFinite);

    return {
        bundle_type: "runtime:door_one_archive_bundle",
        bundle_version: "0.1.0",
        generated_from:
            "Door One pinned packets only; longer-horizon preservation bundle, not canon, not promotion",
        created_at: new Date().toISOString(),

        bundle_metadata: {
            archive_label:
                archiveLabel ??
                (packetRows.length > 0
                    ? `archive_${String(packetRows[packetRows.length - 1].pin_label ?? "bundle")}`
                    : "archive_bundle"),
            declared_purpose: archivePurpose,
            archive_root: archiveRoot,
            packet_count: packetRows.length,
            cycle_index_min: cycleMins.length ? Math.min(...cycleMins) : null,
            cycle_index_max: cycleMaxs.length ? Math.max(...cycleMaxs) : null,
            stream_ids: uniqSorted(packetRows.flatMap((r) => asArray(r.stream_ids))),
            run_labels: uniqSorted(packetRows.flatMap((r) => asArray(r.run_labels))),
            source_modes: uniqSorted(packetRows.flatMap((r) => asArray(r.source_modes))),
        },

        disclaimers: {
            not_canon: true,
            not_truth: true,
            not_ontology: true,
            not_promotion: true,
            pinned_packets_remain_below_canon: true,
            storage_class_not_authority_class: true,
        },

        selection_policy: {
            latest_n: selectionPolicy?.latest_n ?? null,
            stream_id: selectionPolicy?.stream_id ?? null,
            pin_label: selectionPolicy?.pin_label ?? null,
            declared_purpose: selectionPolicy?.declared_purpose ?? null,
        },

        archive_contents: {
            pinned_packets: packetRows,
        },

        references: {
            pin_root: DEFAULT_PIN_ROOT,
            archive_root: archiveRoot,
        },
    };
}

export async function writeArchiveBundle({
    archiveRoot = DEFAULT_ARCHIVE_ROOT,
    bundle,
    fileBasename = DEFAULT_ARCHIVE_BASENAME,
} = {}) {
    await mkdir(archiveRoot, { recursive: true });

    const cycleMin = bundle?.bundle_metadata?.cycle_index_min;
    const cycleMax = bundle?.bundle_metadata?.cycle_index_max;
    const label = bundle?.bundle_metadata?.archive_label ?? fileBasename;

    const safeLabel = String(label).replace(/[^a-zA-Z0-9._-]/g, "_");
    const cyclePart =
        cycleMin == null || cycleMax == null
            ? "cycles_none"
            : `cycles_${String(cycleMin).padStart(4, "0")}_${String(cycleMax).padStart(4, "0")}`;

    const filePath = path.join(archiveRoot, `${safeLabel}_${cyclePart}.json`);
    await writeJson(filePath, bundle);
    return filePath;
}

export async function runArchiveBundle({
    pinRoot = DEFAULT_PIN_ROOT,
    archiveRoot = DEFAULT_ARCHIVE_ROOT,
    latestN = 3,
    stream_id = null,
    pin_label = null,
    declared_purpose = null,
    archiveLabel = null,
    archivePurpose = "longer_horizon_replay_bundle",
} = {}) {
    const loaded = await loadPinPackets(pinRoot);
    const selection = selectPinPacketsForArchive(loaded, {
        latestN,
        stream_id,
        pin_label,
        declared_purpose,
    });

    const bundle = buildArchiveBundle({
        selectedPackets: selection.selected,
        selectionPolicy: selection.selection_policy,
        archiveLabel,
        archivePurpose,
        archiveRoot,
    });

    const filePath = await writeArchiveBundle({
        archiveRoot,
        bundle,
    });

    return {
        ok: true,
        bundle,
        file_path: filePath,
        packet_count: bundle?.bundle_metadata?.packet_count ?? 0,
    };
}

async function main() {
    const res = await runArchiveBundle({
        pinRoot: process.env.DOOR_ONE_PIN_ROOT ?? DEFAULT_PIN_ROOT,
        archiveRoot: process.env.DOOR_ONE_ARCHIVE_ROOT ?? DEFAULT_ARCHIVE_ROOT,
        latestN: Number.parseInt(process.env.DOOR_ONE_ARCHIVE_LATEST_N ?? "3", 10) || 3,
        stream_id: process.env.DOOR_ONE_ARCHIVE_STREAM_ID ?? null,
        pin_label: process.env.DOOR_ONE_ARCHIVE_PIN_LABEL ?? null,
        declared_purpose: process.env.DOOR_ONE_ARCHIVE_DECLARED_PURPOSE ?? null,
        archiveLabel: process.env.DOOR_ONE_ARCHIVE_LABEL ?? null,
        archivePurpose: process.env.DOOR_ONE_ARCHIVE_PURPOSE ?? "longer_horizon_replay_bundle",
    });

    console.log("");
    console.log("Door One Archive Bundle");
    console.log(`  packets: ${res.packet_count}`);
    console.log(`  file: ${res.file_path}`);
    console.log(
        `  cycles: ${res.bundle?.bundle_metadata?.cycle_index_min ?? "—"} → ${res.bundle?.bundle_metadata?.cycle_index_max ?? "—"}`
    );
    console.log(
        `  streams: ${JSON.stringify(res.bundle?.bundle_metadata?.stream_ids ?? [])}`
    );
    console.log("");
}

const thisFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFilePath) {
    main().catch((err) => {
        console.error("Door One archive bundle failed.");
        console.error(err);
        process.exit(1);
    });
}