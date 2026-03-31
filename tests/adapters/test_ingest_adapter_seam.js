// tests/door_two/test_ingest_adapter_seam.js
//
// Contract tests for hud/adapters/ingestAdapters.js
//
// Scope:
//   - file placement and seam separation
//   - jsonAdapter: valid ingest-shaped JSON, valid trace array, malformed inputs
//   - csvAdapter: valid 2-col, valid single-col, malformed rows, empty input
//   - wavAdapter: RIFF header validation, unsupported type rejection
//     (Web Audio API not available in Node — test validation paths only)
//   - validateIngestPayload: required fields, monotonicity, type checks
//   - detectAdapter: extension routing
//   - constitutional posture in source
//   - no authority drift, no semantic elevation

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// Import adapters (pure JS, no browser deps except wavAdapter which uses Web Audio)
import {
    jsonAdapter,
    csvAdapter,
    wavAdapter,
    detectAdapter,
    validateIngestPayload,
    runAdapter,
} from "../../hud/adapters/ingestAdapters.js";

let PASS = 0, FAIL = 0;
function section(t) { console.log(`\n── ${t} ──`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ✓ ${label}`); }
    else       { FAIL++; console.error(`  ✗ ${label}`); }
}
function eq(a, b, label) { ok(Object.is(a,b), `${label}${Object.is(a,b)?"":" (expected "+JSON.stringify(b)+", got "+JSON.stringify(a)+")"}`); }
function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL===0?"  ALL TESTS PASSED ✓":"  TESTS FAILED ✗");
    if(FAIL>0) process.exit(1);
}

const REQUIRED_FIELDS = ["timestamps","values","stream_id","source_id","channel","modality","clock_policy_id"];

function checkPayloadShape(payload, label) {
    ok(typeof payload === "object" && payload !== null, `${label}: payload is object`);
    for (const f of REQUIRED_FIELDS) {
        ok(f in payload && payload[f] !== undefined && payload[f] !== null, `${label}: has field '${f}'`);
    }
    ok(Array.isArray(payload.timestamps) && payload.timestamps.length > 0, `${label}: timestamps non-empty`);
    ok(Array.isArray(payload.values) && payload.values.length > 0,         `${label}: values non-empty`);
    eq(payload.timestamps.length, payload.values.length,                   `${label}: lengths match`);
    ok(payload.timestamps.every(t => Number.isFinite(t)),                  `${label}: timestamps all finite`);
    ok(payload.values.every(v => Number.isFinite(v)),                      `${label}: values all finite`);
}

// ─── A. File placement ────────────────────────────────────────────────────────
section("A. File placement");
let adapterSrc = null;
try { adapterSrc = await readFile(path.join(ROOT, "hud/adapters/ingestAdapters.js"), "utf8"); } catch(_){}
ok(adapterSrc !== null, "A1: hud/adapters/ingestAdapters.js exists");
if (adapterSrc) {
    ok(adapterSrc.includes("pre-ingest only"),              "A2: pre-ingest posture declared");
    ok(adapterSrc.includes("not authority") || adapterSrc.includes("not a second ontology") || adapterSrc.includes("may not"), "A3: not-authority posture");
    ok(!adapterSrc.includes("mintCanon"),                   "A4: no mintCanon");
    ok(!adapterSrc.includes("canonical_status ="),          "A5: no C1 mutation");
    ok(adapterSrc.includes("explicit"),                     "A6: explicit failure posture declared");
}

// ─── B. validateIngestPayload ─────────────────────────────────────────────────
section("B. validateIngestPayload");
{
    const good = { timestamps:[0,1,2], values:[1.0,2.0,3.0], stream_id:"s", source_id:"src",
                   channel:"ch0", modality:"numeric", clock_policy_id:"ck" };
    const r = validateIngestPayload(good);
    eq(r.ok, true, "B1: valid payload passes");

    const missing = { ...good }; delete missing.stream_id;
    eq(validateIngestPayload(missing).ok, false, "B2: missing stream_id fails");

    const emptyTs = { ...good, timestamps: [] };
    eq(validateIngestPayload(emptyTs).ok, false, "B3: empty timestamps fails");

    const mismatch = { ...good, values: [1.0, 2.0] };  // length mismatch
    eq(validateIngestPayload(mismatch).ok, false, "B4: length mismatch fails");

    const nonMonotone = { ...good, timestamps: [0, 2, 1] };
    eq(validateIngestPayload(nonMonotone).ok, false, "B5: non-monotone timestamps fails");

    const nonFinite = { ...good, values: [1.0, NaN, 3.0] };
    eq(validateIngestPayload(nonFinite).ok, false, "B6: NaN values fails");
}

// ─── C. JSON adapter ─────────────────────────────────────────────────────────
section("C. JSON adapter");
{
    // Form A: direct ingest shape
    const formA = JSON.stringify({
        timestamps: [0, 0.5, 1.0],
        values: [1.0, 2.0, 3.0],
        stream_id: "json.test",
        source_id: "test_src",
        channel: "ch0",
        modality: "numeric",
        clock_policy_id: "clock.test",
    });
    const rA = jsonAdapter(formA);
    eq(rA.ok, true, "C1: Form A (direct ingest shape) passes");
    if (rA.ok) checkPayloadShape(rA.payload, "C1-shape");
    eq(rA.meta?.form, "A", "C2: Form A detected");

    // Form B: trace array
    const formB = JSON.stringify({ values: [1.0, 2.0, 3.0, 4.0], Fs: 10 });
    const rB = jsonAdapter(formB);
    eq(rB.ok, true, "C3: Form B (trace array) passes");
    if (rB.ok) {
        checkPayloadShape(rB.payload, "C3-shape");
        eq(rB.meta?.form, "B", "C4: Form B detected");
        ok(rB.payload.timestamps.length === 4, "C5: timestamps generated from Fs");
    }

    // Form B: alternate key names
    const formBSignal = JSON.stringify({ signal: [0.5, 0.8, 0.3] });
    const rBSignal = jsonAdapter(formBSignal);
    eq(rBSignal.ok, true, "C6: 'signal' key accepted as trace array");

    // Malformed: not an object
    const rArr = jsonAdapter(JSON.stringify([1,2,3]));
    eq(rArr.ok, false, "C7: array JSON fails");
    ok(Array.isArray(rArr.reasons) && rArr.reasons.length > 0, "C8: failure has reasons");

    // Malformed: parse error
    const rParse = jsonAdapter("{ bad json ]");
    eq(rParse.ok, false, "C9: malformed JSON text fails");

    // Empty object
    const rEmpty = jsonAdapter("{}");
    eq(rEmpty.ok, false, "C10: empty object fails");

    // Non-numeric values in trace
    const rNaN = jsonAdapter(JSON.stringify({ values: [1, "hello", 3] }));
    eq(rNaN.ok, false, "C11: non-numeric trace values fail");
}

// ─── D. CSV adapter ──────────────────────────────────────────────────────────
section("D. CSV adapter");
{
    // Standard 2-column header
    const csv2col = `time,value\n0,1.0\n0.5,2.0\n1.0,3.0`;
    const r2 = csvAdapter(csv2col);
    eq(r2.ok, true, "D1: 2-column time,value CSV passes");
    if (r2.ok) checkPayloadShape(r2.payload, "D1-shape");

    // Synonym headers
    const csvTs = `timestamp,signal\n0,0.5\n1,0.8\n2,0.3`;
    eq(csvAdapter(csvTs).ok, true, "D2: timestamp,signal headers accepted");

    const csvIdx = `index,data\n0,1.1\n1,2.2\n2,3.3`;
    eq(csvAdapter(csvIdx).ok, true, "D3: index,data headers accepted");

    // No recognized headers → positional
    const csvPos = `a,b\n0,1.5\n1,2.5\n2,3.5`;
    eq(csvAdapter(csvPos).ok, true, "D4: unrecognized headers → positional fallback");

    // Single column (values only)
    const csv1col = `value\n1.0\n2.0\n3.0`;
    const r1 = csvAdapter(csv1col, { Fs: 10 });
    eq(r1.ok, true, "D5: single-column values CSV passes");
    if (r1.ok) {
        ok(r1.payload.timestamps[1] > 0, "D6: timestamps generated from Fs for single-column");
    }

    // Malformed: non-numeric value
    const csvBad = `time,value\n0,1.0\n0.5,hello\n1.0,3.0`;
    const rBad = csvAdapter(csvBad);
    // Should still parse the valid rows and warn
    if (rBad.ok) {
        ok((rBad.payload?.values?.length ?? 0) < 3, "D7: non-numeric rows skipped");
    } else {
        ok(rBad.reasons?.length > 0, "D7: or explicit failure with reasons");
    }

    // Empty CSV
    const rEmpty = csvAdapter("");
    eq(rEmpty.ok, false, "D8: empty CSV fails");
    ok(rEmpty.reasons?.length > 0, "D9: empty CSV has reasons");

    // Only header, no data
    const rHeaderOnly = csvAdapter("time,value");
    eq(rHeaderOnly.ok, false, "D10: header-only CSV fails");

    // 3-column CSV (takes first two recognized columns)
    const csv3col = `time,value,extra\n0,1.0,9\n1,2.0,8\n2,3.0,7`;
    eq(csvAdapter(csv3col).ok, true, "D11: 3-column CSV with recognized headers passes");
}

// ─── E. WAV adapter (Node.js — validation paths only) ─────────────────────────
section("E. WAV adapter (validation paths — Web Audio not available in Node)");
{
    // Not an ArrayBuffer
    const rNull = await wavAdapter(null);
    eq(rNull.ok, false, "E1: null input fails");
    ok(rNull.reasons?.length > 0, "E2: null input has reasons");

    const rStr = await wavAdapter("not a buffer");
    eq(rStr.ok, false, "E3: string input fails");

    // ArrayBuffer too small
    const tiny = new ArrayBuffer(10);
    const rTiny = await wavAdapter(tiny);
    eq(rTiny.ok, false, "E4: too-small buffer fails");

    // ArrayBuffer with wrong magic
    const notWav = new ArrayBuffer(100);
    const view = new Uint8Array(notWav);
    view[0] = 0x50; view[1] = 0x4B;  // PK (ZIP magic)
    const rNotWav = await wavAdapter(notWav);
    eq(rNotWav.ok, false, "E5: non-RIFF magic fails");
    ok(rNotWav.reasons?.[0]?.includes("RIFF"), "E6: failure mentions RIFF header");

    // Valid RIFF header but invalid WAV body (decodeAudioData will fail in Node where AudioContext is absent)
    const fakeRiff = new ArrayBuffer(100);
    const riffView = new Uint8Array(fakeRiff);
    "RIFF".split("").forEach((ch, i) => { riffView[i] = ch.charCodeAt(0); });
    const rFakeRiff = await wavAdapter(fakeRiff);
    // Either decodeAudioData fails (expected in Node) or passes RIFF check — either is acceptable
    ok(typeof rFakeRiff.ok === "boolean", "E7: fake RIFF returns boolean ok (not crash)");
    ok(Array.isArray(rFakeRiff.reasons) || rFakeRiff.ok, "E8: fake RIFF either fails with reasons or succeeds");
}

// ─── F. detectAdapter ────────────────────────────────────────────────────────
section("F. detectAdapter");
{
    eq(detectAdapter("data.json"), "json",  "F1: .json → json");
    eq(detectAdapter("trace.csv"), "csv",   "F2: .csv → csv");
    eq(detectAdapter("trace.tsv"), "csv",   "F3: .tsv → csv");
    eq(detectAdapter("audio.wav"), "wav",   "F4: .wav → wav");
    eq(detectAdapter("audio.mp3"), null,    "F5: .mp3 → null (unsupported)");
    eq(detectAdapter("data.xlsx"), null,    "F6: .xlsx → null (unsupported)");
    eq(detectAdapter(""), null,             "F7: empty string → null");
    eq(detectAdapter(null), null,           "F8: null → null");
}

// ─── G. runAdapter (file type detection and routing) ────────────────────────
section("G. runAdapter routing");
{
    // Simulate File-like object for JSON
    const jsonFile = new File([JSON.stringify({ values:[1,2,3,4], Fs: 10 })], "test.json", { type: "application/json" });
    const rJson = await runAdapter(jsonFile);
    eq(rJson.ok, true, "G1: .json file routes to jsonAdapter and succeeds");
    if (rJson.ok) checkPayloadShape(rJson.payload, "G1-shape");

    // Simulate CSV file
    const csvFile = new File(["time,value\n0,1.0\n1,2.0\n2,3.0"], "test.csv", { type: "text/csv" });
    const rCsv = await runAdapter(csvFile);
    eq(rCsv.ok, true, "G2: .csv file routes to csvAdapter and succeeds");
    if (rCsv.ok) checkPayloadShape(rCsv.payload, "G2-shape");

    // Unsupported extension
    const pdfFile = new File(["fake pdf"], "doc.pdf", { type: "application/pdf" });
    const rPdf = await runAdapter(pdfFile);
    eq(rPdf.ok, false, "G3: .pdf file fails with unsupported type");
    ok(rPdf.reasons?.[0]?.includes("Unsupported"), "G4: unsupported type says 'Unsupported'");

    // Bad JSON content via runAdapter
    const badJson = new File(["{bad json}"], "bad.json", { type: "application/json" });
    const rBadJson = await runAdapter(badJson);
    eq(rBadJson.ok, false, "G5: malformed .json content fails explicitly");
    ok(!rBadJson.ok, "G6: malformed json does not advance with ok=true");
}

// ─── H. Shell files updated ──────────────────────────────────────────────────
section("H. Shell file integrity");
let shellSrc = null;
try { shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch(_){}
if (shellSrc) {
    ok(shellSrc.includes("runAdapter"),                   "H1: shell imports runAdapter");
    ok(shellSrc.includes("file_import"),                  "H2: file_import family present in shell");
    ok(shellSrc.includes("isFileFamily"),                 "H3: isFileFamily flag present");
    ok(shellSrc.includes("adapterStatus"),                "H4: adapterStatus state present");
    ok(shellSrc.includes("handleFileSelect"),             "H5: handleFileSelect handler present");
    ok(shellSrc.includes("runImportedPipeline"),          "H6: runImportedPipeline function present");
    ok(shellSrc.includes("DoorOneOrchestrator"),          "H7: still calls DoorOneOrchestrator");
    ok(shellSrc.includes(".json,.csv,.wav"),              "H8: file picker accepts .json .csv .wav");
    ok(!shellSrc.includes("mintCanon"),                   "H9: no mintCanon in shell");
    // Synthetic family still present
    ok(shellSrc.includes("synthetic_signal"),             "H10: synthetic family still present");
    ok(shellSrc.includes("runSyntheticPipeline"),         "H11: synthetic pipeline still callable");
}

// Lab HUD and public demo untouched
let labHudSrc = null, demoSrc = null;
try { labHudSrc = await readFile(path.join(ROOT, "DoorOneStructuralMemoryHud.jsx"), "utf8"); } catch(_){}
try { demoSrc   = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch(_){}
if (labHudSrc) {
    ok(!labHudSrc.includes("ingestAdapters"),             "H12: lab HUD not modified");
}
if (demoSrc) {
    ok(!demoSrc.includes("ingestAdapters"),               "H13: public demo not modified");
}

finish();
