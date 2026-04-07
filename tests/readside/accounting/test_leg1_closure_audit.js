// Leg 1 closure audit support test.
//
// Purpose:
//   - verify the composed app surface preserves provenance-first/read-side posture
//   - verify request and replay surfaces keep explicit partial-vs-mechanized honesty
//   - verify demo/HUD/app composition remain fenced below authority

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    buildRuntimeReconstructionReplay,
} from "../../../hud/replayModel.js";
import {
    buildConsultationRequest,
} from "../../../hud/requestModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let PASS = 0;
let FAIL = 0;

function section(title) {
    console.log(`\n-- ${title} --`);
}

function ok(condition, label) {
    if (condition) {
        PASS += 1;
        console.log(`  ok ${label}`);
    } else {
        FAIL += 1;
        console.error(`  not ok ${label}`);
    }
}

function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const RUN_RESULT = {
    ok: true,
    run_label: "shell.run.audit.001",
    artifacts: {
        a1: {
            source_id: "synthetic.audit.001",
            stream_id: "stream.audit.001",
            meta: { seed: 42, noiseStd: 0.03, durationSec: 10 },
        },
        h1s: [{ id: "h1" }, { id: "h2" }],
        m1s: [{ id: "m1" }],
        anomaly_reports: [{ anomaly_type: "energy_shift" }],
        q: { receipts: { query: { query_policy_id: "query.synthetic.v1" } } },
    },
};

const WORKBENCH = {
    scope: {
        stream_id: "stream.audit.001",
        segment_ids: ["seg.0", "seg.1"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: {
        artifacts: RUN_RESULT.artifacts,
        substrate: {
            state_count: 3,
            basin_count: 1,
            segment_count: 2,
            trajectory_frames: 12,
            transition_report: {
                total_transitions: 1,
                total_re_entries: 0,
                current_neighborhood_id: "NBHD-AUDIT",
                current_dwell_count: 4,
                current_dwell_duration_sec: 0.8,
                dwell: [{ basin_id: "NBHD-AUDIT", total_frames: 4, total_duration_sec: 0.8, dwell_runs: 1 }],
                transitions: [{ from: "NBHD-AUDIT", to: "NBHD-AUDIT", count: 1 }],
            },
            segment_transitions: [
                { t_transition: 0.8, divergence_score: 0.2, detected_event_types: ["energy_shift"] },
            ],
        },
        audit: {
            skipped_windows: [],
            merge_failures: [],
            consensus_receipts: [],
        },
    },
    interpretation: {
        trajectory: {
            trajectory_character: { convergence: "moderate", motion: "stable" },
            neighborhood_character: {
                occupancy: "sticky",
                recurrence_strength: "low",
                evidence: {
                    total_re_entries: 0,
                    current_dwell_count: 4,
                    current_dwell_duration_sec: 0.8,
                    dominant_dwell_share: 0.82,
                },
            },
            segment_character: { continuity: "smooth" },
        },
    },
    promotion_readiness: {
        report: {
            readiness_summary: { overall_readiness: "insufficient", confidence: "low" },
            evidence_domains: { transition_selectivity: { label: "bounded" } },
        },
    },
    canon_candidate: {
        dossier: {
            candidate_claim: { claim_type: "bounded_structural_claim" },
            blockers: [],
            insufficiencies: ["bounded_support_only"],
        },
    },
    consensus_review: {
        review: { result: "defer" },
    },
};

section("A. request and replay objects preserve explicit bounded status");
{
    const request = buildConsultationRequest({
        workbench: WORKBENCH,
        runResult: RUN_RESULT,
        sourceFamilyLabel: "Synthetic Signal",
    });
    const replay = buildRuntimeReconstructionReplay({
        workbench: WORKBENCH,
        runResult: RUN_RESULT,
        sourceFamilyLabel: "Synthetic Signal",
    });

    ok(request.request_status === "prepared", "A1: request remains prepared");
    ok(request.fulfillment_status === "not_fulfilled", "A2: request explicitly not fulfilled");
    ok(
        request.mechanization_status === "partially_mechanized_request_preparation_only",
        "A3: request mechanization stays explicitly partial"
    );
    ok(replay.request_status === "prepared", "A4: replay remains prepared on positive path");
    ok(
        replay.replay_fidelity_record_v0?.mechanization_status === "mechanized",
        "A5: replay positive path is explicitly mechanized at the active seam"
    );
    ok(
        replay.explicit_non_claims.includes("not raw restoration"),
        "A6: replay preserves explicit non-restoration posture"
    );
}

section("B. composed surfaces preserve non-authority labels");
{
    const appSrc = await readFile(path.join(ROOT, "hud/SemanticOscilloscopeApp.jsx"), "utf8");
    const shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8");
    const demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8");
    const hudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8");

    ok(appSrc.includes("composed environment") && appSrc.includes("not authority"),
        "B1: app remains explicitly compositional and non-authoritative");
    ok(shellSrc.includes("execution surface only") || shellSrc.includes("Execution surface only"),
        "B2: shell remains execution-only");
    ok(shellSrc.includes("display is read-side only") || shellSrc.includes("read-side only"),
        "B3: shell preserves read-side display posture");
    ok(demoSrc.includes("Read-side only") && demoSrc.includes("Not authority"),
        "B4: demo remains fenced as read-side and non-authoritative");
    ok(hudSrc.includes("Read-side inspection surface") || hudSrc.includes("Read-side only"),
        "B5: HUD remains read-side inspection");
}

section("C. provenance-first ordering remains source-visible");
{
    const appSrc = await readFile(path.join(ROOT, "hud/SemanticOscilloscopeApp.jsx"), "utf8");
    const demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8");
    const hudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8");

    ok(
        appSrc.includes("Provenance remains visually prior to evidence") &&
        appSrc.includes("Evidence remains visually prior to interpretation"),
        "C1: app composition states provenance-first ordering"
    );

    const demoP1 = demoSrc.indexOf("Plane 1");
    const demoP2 = demoSrc.indexOf("Plane 2");
    const demoP3 = demoSrc.indexOf("Plane 3");
    const demoP4 = demoSrc.indexOf("Plane 4");
    ok(demoP1 > 0 && demoP2 > demoP1 && demoP3 > demoP2 && demoP4 > demoP3,
        "C2: demo planes remain provenance -> evidence -> interpretation -> review");

    const hudP1 = hudSrc.indexOf('eyebrow="Plane 1');
    const hudP2 = hudSrc.indexOf('eyebrow="Plane 2');
    const hudP3 = hudSrc.indexOf('eyebrow="Plane 3');
    const hudP4 = hudSrc.indexOf('eyebrow="Plane 4');
    ok(hudP1 > 0 && hudP2 > hudP1 && hudP3 > hudP2 && hudP4 > hudP3,
        "C3: HUD planes remain provenance -> runtime evidence -> interpretation -> review");
}

finish();
