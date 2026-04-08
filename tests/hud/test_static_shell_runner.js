import {
    STATIC_SOURCE_OPTIONS,
    getStaticSourceOption,
    runStaticShellSource,
} from "../../hud/staticShellRunner.js";

let PASS = 0;
let FAIL = 0;
function section(title) { console.log(`\n-- ${title} --`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ok ${label}`); }
    else { FAIL++; console.error(`  not ok ${label}`); }
}
function eq(actual, expected, label) {
    ok(
        Object.is(actual, expected),
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`
    );
}
function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

function buildUploadPayload() {
    const sampleRate = 256;
    const length = 512;
    const timestamps = [];
    const values = [];

    for (let i = 0; i < length; i += 1) {
        timestamps.push(i / sampleRate);
        values.push(Math.sin((2 * Math.PI * 12 * i) / sampleRate));
    }

    return {
        timestamps,
        values,
        stream_id: "upload.stream.static.runner",
        source_id: "upload.static.runner",
        channel: "mono",
        modality: "numeric_trace",
        clock_policy_id: "clock.file.v1",
        meta: {
            original_filename: "upload.static.runner.json",
        },
    };
}

section("A. Source option seam stays bounded");
eq(Array.isArray(STATIC_SOURCE_OPTIONS), true, "A1: source options are declared as an array");
ok(STATIC_SOURCE_OPTIONS.length >= 4, "A2: static route exposes bounded synthetic + upload choices");
eq(getStaticSourceOption("synthetic_standard")?.kind, "synthetic", "A3: synthetic source resolves");
eq(getStaticSourceOption("file_upload")?.kind, "upload", "A4: upload source resolves");

section("B. Synthetic source runs through the static shell seam");
{
    const result = await runStaticShellSource({
        sourceId: "synthetic_standard",
        runLabel: "test.static.synthetic.001",
    });

    eq(result.sourceFamilyLabel, "Synthetic Signal", "B1: synthetic run preserves synthetic source family");
    eq(result.runResult?.ok, true, "B2: synthetic run completes");
    ok(Array.isArray(result.workbench?.runtime?.artifacts?.h1s), "B3: synthetic run yields H1 states");
    ok((result.workbench?.runtime?.artifacts?.h1s?.length ?? 0) > 0, "B4: synthetic run yields non-empty H1 structure");
}

section("C. Upload payload runs through the same bounded seam");
{
    const result = await runStaticShellSource({
        sourceId: "file_upload",
        adapterPayload: buildUploadPayload(),
        runLabel: "test.static.upload.001",
    });

    eq(result.sourceFamilyLabel, "File Import (JSON / CSV / WAV)", "C1: upload run preserves file-import source family");
    eq(result.runResult?.ok, true, "C2: upload run completes");
    eq(result.runResult?.artifacts?.a1?.source_id, "upload.static.runner", "C3: upload run preserves real source id");
    ok((result.workbench?.runtime?.artifacts?.h1s?.length ?? 0) > 0, "C4: upload run yields structural frames");
}

section("D. Upload run remains explicit when no staged payload exists");
{
    let error = null;
    try {
        await runStaticShellSource({
            sourceId: "file_upload",
            runLabel: "test.static.upload.missing",
        });
    } catch (nextError) {
        error = nextError;
    }

    ok(error instanceof Error, "D1: missing upload payload throws");
    ok(String(error?.message ?? "").includes("No valid adapter payload"), "D2: missing upload payload stays explicit");
}

finish();
