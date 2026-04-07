// tests/door_two/test_demo_lab_source_differentiation.js
//
// Focused differentiation tests for the demo/lab read-side seam.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { projectForDemo } from "../../../hud/adapters/tandemAdapter.js";
import { workbenchToStructuralHudModel } from "../../../hud/DoorOneStructuralMemoryHudModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let PASS = 0;
let FAIL = 0;
function section(title) { console.log(`\n-- ${title} --`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ok ${label}`); }
    else { FAIL++; console.error(`  not ok ${label}`); }
}
function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

function makeWorkbench({ noiseStd, harmonicCount, mergedCount, streamId }) {
    return {
        scope: {
            stream_id: streamId,
            segment_ids: ["seg.0", "seg.1", "seg.2"],
            cross_run_context: { available: false, run_count: 1 },
        },
        runtime: {
            artifacts: {
                a1: {
                    source_id: "synthetic.seed42",
                    stream_id: streamId,
                    meta: { seed: 42, noiseStd, durationSec: 10 },
                },
                h1s: Array.from({ length: harmonicCount }, (_, idx) => ({ id: `h${idx}` })),
                m1s: Array.from({ length: mergedCount }, (_, idx) => ({ id: `m${idx}` })),
            },
            substrate: {
                state_count: harmonicCount + mergedCount,
                basin_count: Math.max(1, mergedCount),
                segment_count: 3,
            },
        },
        promotion_readiness: {
            report: { readiness_summary: { overall_readiness: "insufficient" } },
        },
        canon_candidate: {
            dossier: { candidate_claim: { claim_type: "bounded_structural_claim" } },
        },
        interpretation: {
            trajectory: {
                trajectory_character: { convergence: "fragmented", motion: "active" },
                neighborhood_character: { occupancy: "developing", recurrence_strength: "low" },
                segment_character: { continuity: "broken" },
            },
        },
    };
}

function makeInput({ noiseStd, harmonicCount, mergedCount, streamId, runLabel }) {
    return {
        runResult: {
            ok: true,
            run_label: runLabel,
            artifacts: {
                a1: {
                    source_id: "synthetic.seed42",
                    stream_id: streamId,
                    meta: { seed: 42, noiseStd, durationSec: 10 },
                },
            },
        },
        workbench: makeWorkbench({ noiseStd, harmonicCount, mergedCount, streamId }),
        requestLog: [],
        replayLog: [],
        sourceFamilyLabel: "Synthetic Signal",
        runStatus: "complete",
    };
}

const NORMAL_INPUT = makeInput({
    noiseStd: 0.03,
    harmonicCount: 8,
    mergedCount: 3,
    streamId: "stream.normal.001",
    runLabel: "shell.run.normal.001",
});

const NOISY_INPUT = makeInput({
    noiseStd: 0.12,
    harmonicCount: 13,
    mergedCount: 6,
    streamId: "stream.noisy.001",
    runLabel: "shell.run.noisy.001",
});

section("A. demo projection differentiates differing source conditions");
{
    const normalDemo = projectForDemo(NORMAL_INPUT);
    const noisyDemo = projectForDemo(NOISY_INPUT);

    ok(normalDemo.provenance.source_profile_note !== noisyDemo.provenance.source_profile_note,
        "A1: demo provenance distinguishes source metadata");
    ok(normalDemo.evidence.summary_lines.join(" | ") !== noisyDemo.evidence.summary_lines.join(" | "),
        "A2: demo evidence summaries differ when source/evidence differs");
    ok(normalDemo.provenance.object_label !== noisyDemo.provenance.object_label,
        "A3: demo object label stays tied to active run identity");
}

section("B. lab HUD model preserves source differentiation");
{
    const normalHud = workbenchToStructuralHudModel(NORMAL_INPUT.workbench);
    const noisyHud = workbenchToStructuralHudModel(NOISY_INPUT.workbench);

    ok(normalHud.provenance.source_profile_note !== noisyHud.provenance.source_profile_note,
        "B1: HUD provenance exposes differing source profile notes");
    ok(normalHud.provenance.stream_id !== noisyHud.provenance.stream_id,
        "B2: HUD provenance stays tied to active stream identity");
}

section("C. demo source renders live projection content as primary body");
{
    const demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8");

    ok(demoSrc.includes("const isLiveMode = !!liveProjection?.has_result;"),
        "C1: demo detects live projection mode");
    ok(demoSrc.includes("LiveProjectionPlanes projection={liveProjection}"),
        "C2: live projection planes replace the static body when active state exists");
    ok(demoSrc.includes("source_profile_note"),
        "C3: live demo source surfaces source-profile differentiation");
}

section("D. lab HUD source card surfaces source profile note");
{
    const hudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8");
    const hudModelSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHudModel.js"), "utf8");

    ok(hudModelSrc.includes("source_profile_note"), "D1: HUD model emits source_profile_note");
    ok(hudSrc.includes("source_profile_note"), "D2: HUD source card uses source_profile_note");
}

finish();
