// Focused runtime-evidence / structural-detail tests for Packet E.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { workbenchToStructuralHudModel } from "../../../hud/DoorOneStructuralMemoryHudModel.js";

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

function makeWorkbench({
    noiseStd,
    h1Count,
    m1Count,
    anomalyRows,
    transitionReport,
    segmentTransitions,
    streamId = "stream.runtime.shared.001",
}) {
    return {
        scope: {
            stream_id: streamId,
            segment_ids: ["seg.0", "seg.1"],
            cross_run_context: { available: false, run_count: 1 },
        },
        runtime: {
            artifacts: {
                a1: {
                    source_id: "synthetic.runtime.packetE",
                    stream_id: streamId,
                    meta: { seed: 42, noiseStd, durationSec: 12 },
                },
                h1s: Array.from({ length: h1Count }, (_, idx) => ({ id: `h${idx}` })),
                m1s: Array.from({ length: m1Count }, (_, idx) => ({ id: `m${idx}` })),
                anomaly_reports: anomalyRows,
                basin_sets: Array.from({ length: Math.max(1, m1Count) }, (_, idx) => ({ id: `bn${idx}` })),
            },
            substrate: {
                state_count: h1Count + m1Count,
                basin_count: Math.max(1, m1Count),
                segment_count: 2,
                trajectory_frames: transitionReport.total_frames_considered,
                transition_report: transitionReport,
                segment_transitions: segmentTransitions,
            },
            audit: {
                skipped_windows: [],
                merge_failures: [],
                consensus_receipts: [],
            },
        },
        interpretation: {
            trajectory: {
                trajectory_character: { convergence: "fragmented", motion: "active" },
                neighborhood_character: {
                    occupancy: "developing",
                    recurrence_strength: "medium",
                    evidence: {
                        total_re_entries: transitionReport.total_re_entries,
                        current_dwell_count: transitionReport.current_dwell_count,
                        current_dwell_duration_sec: transitionReport.current_dwell_duration_sec,
                        dominant_dwell_share: noiseStd > 0.1 ? 0.41 : 0.68,
                    },
                },
                segment_character: { continuity: noiseStd > 0.1 ? "mixed" : "smooth" },
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
}

const BASELINE = makeWorkbench({
    noiseStd: 0.02,
    h1Count: 8,
    m1Count: 2,
    anomalyRows: [{ anomaly_type: "energy_shift" }],
    transitionReport: {
        total_frames_considered: 24,
        total_transitions: 2,
        total_re_entries: 1,
        current_neighborhood_id: "NBHD-A",
        current_dwell_count: 8,
        current_dwell_duration_sec: 1.5,
        dwell: [
            { basin_id: "NBHD-A", total_frames: 8, total_duration_sec: 1.5, dwell_runs: 1 },
            { basin_id: "NBHD-B", total_frames: 4, total_duration_sec: 0.7, dwell_runs: 1 },
        ],
        transitions: [{ from: "NBHD-A", to: "NBHD-B", count: 2 }],
    },
    segmentTransitions: [
        { t_transition: 1.25, divergence_score: 0.18, detected_event_types: ["energy_shift"] },
    ],
});

const HIGH_NOISE = makeWorkbench({
    noiseStd: 0.19,
    h1Count: 13,
    m1Count: 6,
    anomalyRows: [
        { detected_event_types: ["new_frequency", "energy_shift"] },
        { anomaly_type: "vanished_frequency" },
    ],
    transitionReport: {
        total_frames_considered: 24,
        total_transitions: 5,
        total_re_entries: 4,
        current_neighborhood_id: "NBHD-C",
        current_dwell_count: 3,
        current_dwell_duration_sec: 0.6,
        dwell: [
            { basin_id: "NBHD-C", total_frames: 3, total_duration_sec: 0.6, dwell_runs: 2 },
            { basin_id: "NBHD-D", total_frames: 7, total_duration_sec: 1.0, dwell_runs: 2 },
            { basin_id: "NBHD-E", total_frames: 5, total_duration_sec: 0.8, dwell_runs: 1 },
        ],
        transitions: [
            { from: "NBHD-C", to: "NBHD-D", count: 3 },
            { from: "NBHD-D", to: "NBHD-E", count: 2 },
        ],
    },
    segmentTransitions: [
        { t_transition: 0.9, divergence_score: 0.27, detected_event_types: ["new_frequency"] },
        { t_transition: 1.8, divergence_score: 0.34, detected_event_types: ["energy_shift", "vanished_frequency"] },
    ],
});

section("A. runtime evidence differentiates materially different runs");
{
    const baselineModel = workbenchToStructuralHudModel(BASELINE);
    const noisyModel = workbenchToStructuralHudModel(HIGH_NOISE);

    ok(
        baselineModel.provenance.stream_id === noisyModel.provenance.stream_id,
        "A1: comparison holds stream constant to catch run-relative flattening"
    );
    ok(
        baselineModel.runtime_evidence.artifact_counts.m1s !== noisyModel.runtime_evidence.artifact_counts.m1s,
        "A2: merged-state count differs across runs"
    );
    ok(
        baselineModel.runtime_evidence.total_re_entries !== noisyModel.runtime_evidence.total_re_entries,
        "A3: re-entry evidence differs across runs"
    );
    ok(
        baselineModel.runtime_evidence.current_neighborhood_id !== noisyModel.runtime_evidence.current_neighborhood_id,
        "A4: current neighborhood stays tied to active run state"
    );
    ok(
        JSON.stringify(baselineModel.runtime_evidence.segment_event_types) !==
        JSON.stringify(noisyModel.runtime_evidence.segment_event_types),
        "A5: segment event profile differs when boundary evidence differs"
    );
    ok(
        JSON.stringify(baselineModel.runtime_evidence.anomaly_type_counts) !==
        JSON.stringify(noisyModel.runtime_evidence.anomaly_type_counts),
        "A6: anomaly type profile differs when anomaly evidence differs"
    );
    ok(
        baselineModel.runtime_evidence.dominant_transition?.count !==
        noisyModel.runtime_evidence.dominant_transition?.count,
        "A7: dominant transition summary differs across runs"
    );
    ok(
        JSON.stringify(baselineModel.neighborhoods) !== JSON.stringify(noisyModel.neighborhoods),
        "A8: neighborhood table data does not flatten distinct runtime structure"
    );
}

section("B. HUD source keeps detail panes live or explicitly bounded");
{
    const hudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8");

    ok(hudSrc.includes("const activeContextSignature = useMemo("),
        "B1: detail/reset path keys off a run-relative context signature");
    ok(hudSrc.includes("const detailPanelDetail = selectedDetail ?? autoDetail;"),
        "B2: detail panel falls back to live focused detail");
    ok(hudSrc.includes("No structural-neighborhood evidence is available for the current run context."),
        "B3: detail pane exposes explicit bounded insufficiency when support is absent");
    ok(hudSrc.includes("No neighborhood evidence is available for the active run context."),
        "B4: neighborhood field/table expose explicit bounded posture when support is absent");
    ok(hudSrc.includes("No segment-boundary evidence is available for the active run context."),
        "B5: segment pane exposes explicit bounded posture when support is absent");
    ok(hudSrc.includes("M1 artifacts") && hudSrc.includes("Re-entry count") &&
        hudSrc.includes("Current neighborhood") && hudSrc.includes("Boundary events"),
    "B6: runtime evidence cards surface additional run-relative differentiators");
}

section("C. provenance-first plane ordering remains intact");
{
    const hudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8");

    const p1 = hudSrc.indexOf('eyebrow="Plane 1');
    const p2 = hudSrc.indexOf('eyebrow="Plane 2');
    const p3 = hudSrc.indexOf('eyebrow="Plane 3');
    const p4 = hudSrc.indexOf('eyebrow="Plane 4');

    ok(p1 > 0, "C1: Plane 1 remains present");
    ok(p2 > p1, "C2: Plane 2 remains after Plane 1");
    ok(p3 > p2, "C3: Plane 3 remains after Plane 2");
    ok(p4 > p3, "C4: Plane 4 remains after Plane 3");
}

finish();
