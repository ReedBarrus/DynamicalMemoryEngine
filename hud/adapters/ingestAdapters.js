// hud/adapters/ingestAdapters.js
//
// Modular Object Ingest Adapter Seam — Browser-side
//
// Constitutional posture:
//   - Adapters are pre-ingest only. They normalize source diversity into the same
//     lawful Door One ingest contract. They do NOT define runtime meaning.
//   - All adapters must produce a lawful raw ingest payload or an explicit failure.
//   - No adapter may assign truth, claim canon, or elevate semantics.
//   - Adapters are pre-ingest only. They may not become semantic authority.
//   - Failure is explicit and local — it must not advance runtime state.
//
// Required ingest contract fields (from README_IngestAdapterMatrix_v0.md):
//   timestamps, values, stream_id, source_id, channel, modality, clock_policy_id
//
// Adapters implemented:
//   - jsonAdapter    (JSON object → lawful ingest payload)
//   - csvAdapter     (CSV text → lawful ingest payload)
//   - wavAdapter     (WAV File → lawful ingest payload via Web Audio API)
//
// Adapter result shape:
//   { ok: true,  payload: <lawful raw ingest object>, meta: { ... } }
//   { ok: false, reasons: string[], meta: { ... } }

"use strict";

// ─── Shared defaults ─────────────────────────────────────────────────────────
const CLOCK_POLICY_ID = "clock.file.v1";
const DEFAULT_CHANNEL  = "ch0";
const DEFAULT_MODALITY = "numeric";

// ─── Shared validation ────────────────────────────────────────────────────────
export function validateIngestPayload(payload) {
    const required = ["timestamps", "values", "stream_id", "source_id", "channel", "modality", "clock_policy_id"];
    const missing  = required.filter(f => payload[f] === undefined || payload[f] === null);
    if (missing.length > 0) {
        return { ok: false, reasons: [`missing required ingest fields: ${missing.join(", ")}`] };
    }
    if (!Array.isArray(payload.timestamps) || payload.timestamps.length === 0) {
        return { ok: false, reasons: ["timestamps must be a non-empty array"] };
    }
    if (!Array.isArray(payload.values) || payload.values.length === 0) {
        return { ok: false, reasons: ["values must be a non-empty array"] };
    }
    if (payload.timestamps.length !== payload.values.length) {
        return { ok: false, reasons: [`timestamps and values must have the same length (got ${payload.timestamps.length} vs ${payload.values.length})`] };
    }
    if (!payload.timestamps.every(t => Number.isFinite(t))) {
        return { ok: false, reasons: ["all timestamps must be finite numbers"] };
    }
    if (!payload.values.every(v => Number.isFinite(v))) {
        return { ok: false, reasons: ["all values must be finite numbers"] };
    }
    // Monotonicity check (strict non-decreasing)
    for (let i = 1; i < payload.timestamps.length; i++) {
        if (payload.timestamps[i] < payload.timestamps[i - 1]) {
            return { ok: false, reasons: [`timestamps are not monotonically non-decreasing at index ${i}`] };
        }
    }
    return { ok: true };
}

function adapterFail(reasons, meta = {}) {
    return { ok: false, reasons: Array.isArray(reasons) ? reasons : [reasons], meta };
}

function adapterOk(payload, meta = {}) {
    const v = validateIngestPayload(payload);
    if (!v.ok) return adapterFail(v.reasons, meta);
    return { ok: true, payload, meta };
}

// ─── JSON Adapter ─────────────────────────────────────────────────────────────
//
// Accepts two forms:
//   Form A: object already has all required ingest fields
//           → pass through with validation
//   Form B: object has { timestamps?, values, [signal fields...] }
//           → normalize declared fields where unambiguous
//
// Does NOT interpret semantics — only normalizes declared structure.
//
export function jsonAdapter(jsonText, options = {}) {
    let obj;
    try {
        obj = typeof jsonText === "string" ? JSON.parse(jsonText) : jsonText;
    } catch (e) {
        return adapterFail([`JSON parse error: ${e.message}`], { adapter: "json" });
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        return adapterFail(["JSON input must be a non-array object"], { adapter: "json" });
    }

    // Try Form A: object already looks like a raw ingest payload
    const hasIngestShape = obj.timestamps !== undefined && obj.values !== undefined;
    if (hasIngestShape) {
        const payload = {
            timestamps:      obj.timestamps,
            values:          obj.values,
            stream_id:       obj.stream_id  ?? options.stream_id  ?? `json.stream.${Date.now()}`,
            source_id:       obj.source_id  ?? options.source_id  ?? "json_import",
            channel:         obj.channel    ?? options.channel    ?? DEFAULT_CHANNEL,
            modality:        obj.modality   ?? options.modality   ?? DEFAULT_MODALITY,
            clock_policy_id: obj.clock_policy_id ?? CLOCK_POLICY_ID,
            meta: {
                ...(obj.meta ?? {}),
                adapter:        "json",
                adapter_form:   "A_direct_ingest",
                import_context: options.filename ?? "json_text",
                Fs_nominal:     obj.meta?.Fs_nominal ?? null,
            },
        };
        return adapterOk(payload, { adapter: "json", form: "A" });
    }

    // Try Form B: object has a numeric trace array under a recognizable key
    // Accepted field names: values, data, signal, samples, trace, measurements
    const TRACE_KEYS = ["values", "data", "signal", "samples", "trace", "measurements"];
    const traceKey = TRACE_KEYS.find(k => Array.isArray(obj[k]) && obj[k].length > 0);
    if (!traceKey) {
        return adapterFail([
            "JSON object does not contain a recognizable timestamps+values pair or numeric trace array.",
            `Expected either { timestamps, values, ... } or a numeric array under one of: ${TRACE_KEYS.join(", ")}`,
        ], { adapter: "json" });
    }
    const rawValues = obj[traceKey];
    if (!rawValues.every(v => Number.isFinite(Number(v)))) {
        return adapterFail([`Trace array under '${traceKey}' contains non-numeric values`], { adapter: "json" });
    }
    const values     = rawValues.map(Number);
    const Fs         = obj.Fs ?? obj.sample_rate ?? obj.fs ?? 1.0;
    const timestamps = values.map((_, i) => i / Fs);
    const payload = {
        timestamps,
        values,
        stream_id:       obj.stream_id  ?? options.stream_id  ?? `json.stream.${Date.now()}`,
        source_id:       obj.source_id  ?? options.source_id  ?? "json_import",
        channel:         obj.channel    ?? options.channel    ?? DEFAULT_CHANNEL,
        modality:        obj.modality   ?? options.modality   ?? DEFAULT_MODALITY,
        clock_policy_id: CLOCK_POLICY_ID,
        meta: {
            adapter:        "json",
            adapter_form:   "B_trace_array",
            trace_key:      traceKey,
            Fs_nominal:     Fs,
            import_context: options.filename ?? "json_text",
            ...(obj.meta ?? {}),
        },
    };
    return adapterOk(payload, { adapter: "json", form: "B" });
}

// ─── CSV Adapter ──────────────────────────────────────────────────────────────
//
// Accepts:
//   - 2-column CSV with header row: time,value  OR  timestamp,value  OR  index,value
//   - 2-column CSV without header: treated as (col0=time, col1=value)
//   - Also accepts 1-column CSV (value only) — timestamps become sequence index / Fs
//
// Does NOT interpret what the values represent semantically.
//
export function csvAdapter(csvText, options = {}) {
    if (typeof csvText !== "string" || csvText.trim().length === 0) {
        return adapterFail(["CSV input is empty or not a string"], { adapter: "csv" });
    }

    const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
        return adapterFail(["CSV must contain at least one header line and one data line"], { adapter: "csv" });
    }

    // Parse header
    const header = lines[0].split(",").map(h => h.trim().toLowerCase());
    const dataLines = lines.slice(1);

    // Detect column layout
    const TIME_SYNONYMS  = ["time", "timestamp", "t", "index", "i", "ts"];
    const VALUE_SYNONYMS = ["value", "v", "val", "values", "signal", "x", "data", "y"];

    let tsCol = -1, valCol = -1;
    if (header.length === 1) {
        // Single-column: values only, index → timestamp
        valCol = 0;
    } else if (header.length >= 2) {
        // Two+ columns: look for time+value headers, or use positional default
        tsCol  = header.findIndex(h => TIME_SYNONYMS.includes(h));
        valCol = header.findIndex(h => VALUE_SYNONYMS.includes(h));
        if (tsCol === -1 && valCol === -1) {
            // No recognized headers → assume first col = time, second = value
            tsCol = 0; valCol = 1;
        } else if (tsCol === -1) {
            // Found value column but no time column → use sequence index
            tsCol = -1;
        } else if (valCol === -1) {
            // Found time but no value column → use second column
            valCol = tsCol === 0 ? 1 : 0;
        }
    } else {
        return adapterFail(["CSV must have at least one column"], { adapter: "csv" });
    }

    // Check if first data line is actually a second header (common in some exports)
    const firstDataCols = dataLines[0].split(",");
    if (firstDataCols.some(c => isNaN(Number(c.trim())))) {
        // Skip a second header-like row
        dataLines.shift();
        if (dataLines.length === 0) {
            return adapterFail(["CSV contains no numeric data rows after header"], { adapter: "csv" });
        }
    }

    const timestamps = [], values = [];
    const errors = [];
    const Fs = options.Fs ?? 1.0;

    for (let i = 0; i < dataLines.length; i++) {
        const cols = dataLines[i].split(",");
        const valRaw = cols[valCol]?.trim();
        const val    = Number(valRaw);
        if (!Number.isFinite(val)) {
            errors.push(`row ${i + 2}: value '${valRaw}' is not a finite number`);
            continue;
        }
        let ts;
        if (tsCol >= 0) {
            const tsRaw = cols[tsCol]?.trim();
            ts = Number(tsRaw);
            if (!Number.isFinite(ts)) {
                errors.push(`row ${i + 2}: timestamp '${tsRaw}' is not a finite number`);
                continue;
            }
        } else {
            ts = i / Fs;
        }
        timestamps.push(ts);
        values.push(val);
    }

    if (errors.length > 0 && values.length === 0) {
        return adapterFail([`CSV parsing produced no valid rows. First error: ${errors[0]}`], { adapter: "csv", parse_errors: errors });
    }
    if (values.length === 0) {
        return adapterFail(["CSV contained no parseable numeric rows"], { adapter: "csv" });
    }

    const payload = {
        timestamps,
        values,
        stream_id:       options.stream_id  ?? `csv.stream.${Date.now()}`,
        source_id:       options.source_id  ?? options.filename ?? "csv_import",
        channel:         options.channel    ?? DEFAULT_CHANNEL,
        modality:        options.modality   ?? DEFAULT_MODALITY,
        clock_policy_id: CLOCK_POLICY_ID,
        meta: {
            adapter:        "csv",
            Fs_nominal:     tsCol >= 0 ? null : Fs,  // only meaningful for sequence-indexed
            import_context: options.filename ?? "csv_text",
            header,
            row_count:      values.length,
            parse_warnings: errors.length > 0 ? errors.slice(0, 5) : undefined,
        },
    };
    return adapterOk(payload, { adapter: "csv", warnings: errors.slice(0, 5) });
}

// ─── WAV Adapter ──────────────────────────────────────────────────────────────
//
// Accepts: browser File object or ArrayBuffer containing a WAV file.
// Uses Web Audio API (AudioContext.decodeAudioData) for robust decoding.
// Handles all common WAV variants: PCM 8/16/24/32-bit, 32-bit float, mono/stereo.
// Multi-channel: uses channel 0 (left/mono) only. Records original channel count.
//
// This is a sampled-measurement adapter, not an audio understanding layer.
// The decoded samples are a numeric trace — no frequency/semantic interpretation.
//
// Returns a Promise<AdapterResult>.
//
export async function wavAdapter(fileOrBuffer, options = {}) {
    let arrayBuffer;
    let filename = options.filename ?? "wav_import";

    if (fileOrBuffer instanceof File) {
        filename = fileOrBuffer.name;
        try {
            arrayBuffer = await fileOrBuffer.arrayBuffer();
        } catch (e) {
            return adapterFail([`Could not read file: ${e.message}`], { adapter: "wav" });
        }
    } else if (fileOrBuffer instanceof ArrayBuffer) {
        arrayBuffer = fileOrBuffer;
    } else {
        return adapterFail(["WAV adapter requires a File object or ArrayBuffer"], { adapter: "wav" });
    }

    // Validate it looks like a WAV (RIFF header check)
    if (arrayBuffer.byteLength < 44) {
        return adapterFail(["File too small to be a valid WAV (< 44 bytes)"], { adapter: "wav" });
    }
    const headerView = new Uint8Array(arrayBuffer, 0, 4);
    const riffMagic  = String.fromCharCode(...headerView);
    if (riffMagic !== "RIFF") {
        return adapterFail([`File does not start with RIFF header (got '${riffMagic}'). Is this a WAV file?`], { adapter: "wav" });
    }

    // Use Web Audio API to decode
    let audioBuffer;
    try {
        const ctx = new OfflineAudioContext(1, 1, 44100);
        audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    } catch (e) {
        return adapterFail([`Web Audio API could not decode WAV: ${e.message}. File may be corrupt or unsupported.`], { adapter: "wav" });
    }

    const sampleRate  = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const numSamples  = audioBuffer.length;

    if (numSamples === 0) {
        return adapterFail(["WAV file decoded to zero samples"], { adapter: "wav" });
    }

    // Use channel 0 (left/mono). Record original channel count.
    const rawSamples = audioBuffer.getChannelData(0);  // Float32Array

    // Optional: trim to maxDurationSec
    const maxDuration = options.maxDurationSec ?? null;
    const endSample   = maxDuration ? Math.min(numSamples, Math.floor(maxDuration * sampleRate)) : numSamples;
    const trimmed     = endSample < numSamples;

    const values     = Array.from(rawSamples.subarray(0, endSample));
    const timestamps = values.map((_, i) => i / sampleRate);

    const payload = {
        timestamps,
        values,
        stream_id:       options.stream_id  ?? `wav.stream.${filename.replace(/\W/g,"_")}.${Date.now()}`,
        source_id:       options.source_id  ?? filename,
        channel:         options.channel    ?? "ch0_left_or_mono",
        modality:        "audio_sample",
        clock_policy_id: CLOCK_POLICY_ID,
        meta: {
            adapter:          "wav",
            original_filename: filename,
            sample_rate_hz:   sampleRate,
            Fs_nominal:       sampleRate,
            original_channels: numChannels,
            channel_used:     0,
            original_samples: numSamples,
            samples_used:     endSample,
            trimmed,
            duration_sec:     endSample / sampleRate,
            import_context:   filename,
        },
    };
    return adapterOk(payload, { adapter: "wav" });
}

// ─── Adapter registry ─────────────────────────────────────────────────────────
// Maps file extension / type to the correct adapter.
// Returns { adapter, adapterType } or null if unsupported.
export function detectAdapter(filename) {
    if (!filename) return null;
    const ext = filename.split(".").pop().toLowerCase();
    if (ext === "json") return "json";
    if (ext === "csv" || ext === "tsv") return "csv";
    if (ext === "wav") return "wav";
    return null;
}

// Run the correct adapter based on file type.
// Returns Promise<AdapterResult>.
export async function runAdapter(file, options = {}) {
    const type = detectAdapter(file?.name ?? "");
    if (!type) {
        return adapterFail(
            [`Unsupported file type: '${file?.name ?? "unknown"}'. Supported: .json, .csv, .wav`],
            { adapter: "unknown" }
        );
    }
    const opts = { ...options, filename: file.name };
    if (type === "json") {
        const text = await file.text();
        return jsonAdapter(text, opts);
    }
    if (type === "csv") {
        const text = await file.text();
        return csvAdapter(text, opts);
    }
    if (type === "wav") {
        return wavAdapter(file, opts);
    }
    return adapterFail([`No adapter registered for type '${type}'`], { adapter: type });
}
