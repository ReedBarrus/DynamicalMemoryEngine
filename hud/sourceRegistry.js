"use strict";

import {
    RECORDED_SOURCE_FIXTURES,
    loadRecordedSourcePayload,
} from "./recordedSourceFixtures.js";

function slugify(value) {
    return String(value ?? "source")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        || "source";
}

function titleFromFilename(filename) {
    const stem = String(filename ?? "Source")
        .replace(/\.[^.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim();
    if (!stem) return "Source";
    return stem.replace(/\b\w/g, (match) => match.toUpperCase());
}

function durationFromPayload(payload, sampleRateHz) {
    if (payload?.meta?.duration_sec !== undefined && payload?.meta?.duration_sec !== null) {
        return Number(payload.meta.duration_sec);
    }
    if (sampleRateHz && Array.isArray(payload?.values) && payload.values.length > 0) {
        return Number((payload.values.length / sampleRateHz).toFixed(3));
    }
    return null;
}

function cloneRecord(record) {
    return record ? { ...record } : record;
}

export function buildSourceFingerprint({
    fixture = null,
    file = null,
    payload = null,
    adapter = null,
} = {}) {
    if (fixture?.id) {
        return `fixture:${fixture.id}`;
    }
    const filename = file?.name ?? payload?.meta?.original_filename ?? payload?.source_id ?? "source";
    const size = Number(file?.size ?? payload?.values?.length ?? 0) || 0;
    const stamp = Number(file?.lastModified ?? 0) || 0;
    return `${adapter ?? "adapter"}:${slugify(filename)}:${size}:${stamp}`;
}

export function buildRecordedFixtureSourceRecord(fixture) {
    const filename = String(fixture?.relativePath ?? "").split("/").pop() || "recorded_source.wav";
    return {
        source_id: fixture?.sourceId ?? `SRC:recorded:${slugify(filename)}`,
        filename,
        registry_path: fixture?.relativePath ?? `staged/${filename}`,
        source_basis: "recorded_source",
        source_family: fixture?.recordedFamily ?? "manual_unassigned",
        modality: "audio_wav",
        channels: null,
        sample_rate_hz: null,
        duration_s: null,
        decode_posture: "fixture_loader",
        readiness: "ready",
        operator_label: fixture?.shortLabel ?? titleFromFilename(filename),
        notes: fixture?.description ?? "",
        stable_fingerprint: buildSourceFingerprint({ fixture }),
        route_kind: "recorded_fixture",
        route_label: "fixture_loader",
        fixture_id: fixture?.id ?? null,
        entry_kind: "registered_fixture",
    };
}

export function buildInitialSourceRegistry(fixtures = RECORDED_SOURCE_FIXTURES) {
    return Array.isArray(fixtures)
        ? fixtures.map(buildRecordedFixtureSourceRecord)
        : [];
}

export function buildStagedSourceRecord(file, adapterResult, metadata = {}) {
    if (!adapterResult?.ok || !adapterResult?.payload) {
        throw new Error("Cannot build a staged source record from a failed adapter result");
    }

    const payload = adapterResult.payload;
    const payloadMeta = payload.meta ?? {};
    const adapter = adapterResult?.meta?.adapter ?? payloadMeta.adapter ?? "adapter";
    const filename = file?.name ?? payloadMeta.original_filename ?? payload.source_id ?? "staged_source";
    const sourceBasis = metadata.source_basis
        ?? (adapter === "wav" ? "recorded_source" : "imported_source");
    const sampleRateHz = Number(payloadMeta.sample_rate_hz ?? payloadMeta.nominal_sample_rate_hz ?? payloadMeta.Fs_nominal ?? 0) || null;
    const channels = Number(payloadMeta.original_channels ?? payloadMeta.channels ?? 0) || null;
    const sourceId = metadata.source_id
        ?? payload.source_id
        ?? `SRC:${sourceBasis === "recorded_source" ? "recorded" : "imported"}:${slugify(filename)}`;

    return {
        source_id: sourceId,
        filename,
        registry_path: metadata.registry_path ?? `staged/${filename}`,
        source_basis: sourceBasis,
        source_family: metadata.source_family ?? "manual_unassigned",
        modality: metadata.modality ?? (adapter === "wav" ? "audio_wav" : payload.modality ?? "imported_trace"),
        channels,
        sample_rate_hz: sampleRateHz,
        duration_s: durationFromPayload(payload, sampleRateHz),
        decode_posture: metadata.decode_posture ?? (adapter === "wav" ? "decoded" : "adapter_normalized"),
        readiness: metadata.readiness ?? "ready",
        operator_label: metadata.operator_label ?? titleFromFilename(filename),
        notes: metadata.notes ?? "",
        stable_fingerprint: metadata.stable_fingerprint ?? buildSourceFingerprint({ file, payload, adapter }),
        route_kind: "adaptive_ingest",
        route_label: `${adapter}_adapter`,
        fixture_id: null,
        entry_kind: "staged_source",
        adapter_kind: adapter,
    };
}

export function updateSourceRecordMetadata(record, patch = {}) {
    if (!record) return record;
    return {
        ...record,
        source_family: patch.source_family ?? record.source_family,
        operator_label: patch.operator_label ?? record.operator_label,
        notes: patch.notes ?? record.notes,
        readiness: patch.readiness ?? record.readiness,
    };
}

export function upsertSourceRecord(records, nextRecord) {
    const current = Array.isArray(records) ? records.map(cloneRecord) : [];
    const idx = current.findIndex((record) => record?.source_id === nextRecord?.source_id);
    if (idx === -1) {
        return [cloneRecord(nextRecord), ...current];
    }
    current[idx] = { ...current[idx], ...cloneRecord(nextRecord) };
    return current;
}

export function sourceRecordFamilyLabel(record) {
    if (!record) return "Registered Source";
    return `Registered Source · ${record.source_family ?? "manual_unassigned"}`;
}

export function attachSourceRecordToPayload(payload, sourceRecord, options = {}) {
    const meta = payload?.meta ?? {};
    const nextMeta = {
        ...meta,
        source_mode: sourceRecord?.source_basis ?? meta.source_mode ?? "imported_source",
        recorded_family: sourceRecord?.source_family ?? meta.recorded_family ?? null,
        original_filename: sourceRecord?.filename ?? meta.original_filename ?? null,
        source_path: sourceRecord?.registry_path ?? meta.source_path ?? null,
        registry_path: sourceRecord?.registry_path ?? null,
        source_record_id: sourceRecord?.source_id ?? null,
        source_record_label: sourceRecord?.operator_label ?? null,
        source_record_fingerprint: sourceRecord?.stable_fingerprint ?? null,
        source_record_readiness: sourceRecord?.readiness ?? null,
        source_record_route: sourceRecord?.route_label ?? null,
        decode: meta.decode ?? sourceRecord?.decode_posture ?? null,
        nominal_sample_rate_hz: meta.nominal_sample_rate_hz ?? sourceRecord?.sample_rate_hz ?? null,
        original_channels: meta.original_channels ?? sourceRecord?.channels ?? null,
        registry_notes: sourceRecord?.notes ?? "",
    };

    return {
        ...payload,
        stream_id: options.stream_id ?? payload?.stream_id,
        source_id: sourceRecord?.source_id ?? payload?.source_id,
        meta: nextMeta,
    };
}

export async function resolveRegisteredSourcePayload(sourceRecord, {
    payloadCache = {},
    fixtures = RECORDED_SOURCE_FIXTURES,
    loadFixturePayload = loadRecordedSourcePayload,
    runLabel = "registry",
} = {}) {
    if (!sourceRecord?.source_id) {
        throw new Error("Registered source record is missing source_id");
    }

    if (sourceRecord.fixture_id) {
        const fixture = fixtures.find((entry) => entry.id === sourceRecord.fixture_id);
        if (!fixture) {
            throw new Error(`Registered source fixture '${sourceRecord.fixture_id}' is unavailable`);
        }
        const payload = await loadFixturePayload(fixture, {
            stream_id: `registry.stream.${sourceRecord.source_id}.${runLabel}`,
            source_id: sourceRecord.source_id,
        });
        return attachSourceRecordToPayload(payload, sourceRecord);
    }

    const cachedPayload = payloadCache?.[sourceRecord.source_id] ?? null;
    if (!cachedPayload) {
        throw new Error(`Registered source '${sourceRecord.source_id}' is not ready in the current session`);
    }

    return attachSourceRecordToPayload(cachedPayload, sourceRecord, {
        stream_id: `registry.stream.${sourceRecord.source_id}.${runLabel}`,
    });
}
