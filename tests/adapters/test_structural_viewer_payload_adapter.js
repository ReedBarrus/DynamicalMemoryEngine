// tests/adapters/test_structural_viewer_payload_adapter.js
//
// Contract tests for hud/adapters/structuralViewerPayloadAdapter.js

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildStructuralViewerPayload } from "../../hud/adapters/structuralViewerPayloadAdapter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

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
function deepEq(actual, expected, label) {
    eq(JSON.stringify(actual), JSON.stringify(expected), label);
}
function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const FULL_INPUT = {
    mode: "live",
    sourceFamilyLabel: "Synthetic Signal",
    runResult: {
        ok: true,
        run_label: "run.viewer.001",
        artifacts: {
            a1: {
                source_id: "synthetic.viewer",
                stream_id: "stream.viewer.001",
                timestamps: [0, 0.5, 1.0],
                meta: {
                    source_id: "synthetic.viewer",
                    source_mode: "synthetic",
                    source_format: "json",
                },
                clock_policy_id: "clock.synthetic.v1",
            },
        },
    },
    workbench: {
        scope: {
            stream_id: "stream.viewer.001",
            source_id: "synthetic.viewer",
            segment_ids: ["seg-001", "seg-002"],
            cross_run_context: { available: true, run_count: 2 },
        },
        runtime: {
            substrate: {
                state_count: 4,
                basin_count: 1,
                segment_count: 2,
                segment_transitions: [
                    { t_transition: 0.5, detected_event_types: ["frequency_shift"] },
                ],
                transition_report: {
                    total_transitions: 1,
                    current_neighborhood_id: "BN:alpha",
                },
            },
            artifacts: {
                a1: {
                    timestamps: [0, 0.5, 1.0],
                    clock_policy_id: "clock.synthetic.v1",
                },
                q: {
                    receipts: {
                        query: {
                            query_policy_id: "query.synthetic.v1",
                        },
                    },
                },
                anomaly_reports: [
                    {
                        artifact_type: "anomaly",
                        comparison_window: {
                            window_span: { t_start: 0.5, t_end: 1.0 },
                        },
                    },
                ],
                basin_sets: [{ basin_id: "BN:alpha" }],
                h1s: [{ id: "h1.1" }],
                m1s: [{ id: "m1.1" }],
            },
        },
        semantic_overlay: {
            trajectory: {
                trajectory_character: { motion: "oscillatory" },
                neighborhood_character: { occupancy: "focused" },
                segment_character: { continuity: "bounded" },
            },
            attention_memory: {
                support_band: "retained",
            },
        },
        readiness_overlay: {
            promotion_readiness: {
                readiness_summary: { overall_readiness: "insufficient" },
            },
        },
        review_overlay: {
            canon_candidate: {
                candidate_claim: { claim_type: "bounded_structural_claim" },
            },
            consensus_review: {
                result: "defer",
            },
        },
    },
    requestLog: [
        {
            request_id: "req.viewer.001",
            explicit_non_claims: ["not canon", "not truth"],
        },
    ],
    replayLog: [
        {
            replay_request_id: "replay.viewer.001",
            replay_type: "runtime_reconstruction",
            replay_posture: "lens-bound support",
            retained_tier_used: { tier_label: "Tier 0" },
            reconstruction_class: "runtime_reconstruction",
        },
    ],
};

const NO_OVERLAY_INPUT = {
    mode: "static",
    sourceFamilyLabel: "Synthetic Signal",
    runResult: {
        ok: true,
        run_label: "run.viewer.002",
        artifacts: {
            a1: {
                source_id: "synthetic.viewer.minimal",
                timestamps: [0, 1],
            },
        },
    },
    workbench: {
        scope: {
            stream_id: "stream.viewer.002",
            source_id: "synthetic.viewer.minimal",
        },
        runtime: {
            artifacts: {
                anomaly_reports: [],
            },
            substrate: {},
        },
    },
};

const SHELL_STATE_FALLBACK_INPUT = {
    mode: "inspection",
    sourceFamilyLabel: "Recorded Source (WAV fixture)",
    runStatus: "error",
    runError: "adapter failed",
    hasActiveResult: false,
};

section("A. File placement and source posture");
{
    let src = null;
    try { src = await readFile(path.join(ROOT, "hud/adapters/structuralViewerPayloadAdapter.js"), "utf8"); } catch (_) {}
    ok(src !== null, "A1: structuralViewerPayloadAdapter exists");
    if (src) {
        ok(src.includes("one shared read-side viewer payload") || src.includes("shared structural viewer payload"), "A2: shared payload posture declared");
        ok(src.includes("Overlays remain optional and subordinate"), "A3: optional overlay posture declared");
        ok(!src.includes("mintCanon"), "A4: no mintCanon");
        ok(!src.match(/new ConsensusOp|ConsensusOp\(/), "A5: no ConsensusOp invocation");
    }
}

section("B. Shared payload shape is present");
{
    const payload = buildStructuralViewerPayload(FULL_INPUT);
    ok(payload && typeof payload === "object", "B1: payload returns object");
    eq(payload.mode, "live", "B2: mode preserved");
    ok(payload.source && typeof payload.source === "object", "B3: source header present");
    ok(payload.lineage && typeof payload.lineage === "object", "B4: lineage header present");
    ok(payload.structural && typeof payload.structural === "object", "B5: structural section present");
    ok(payload.overlays && typeof payload.overlays === "object", "B6: overlays present when available");
    ok(payload.telemetry && typeof payload.telemetry === "object", "B7: live telemetry placeholder present");
    eq(payload.source.source_id, "synthetic.viewer", "B8: source_id mapped");
    eq(payload.source.source_family, "Synthetic Signal", "B9: source_family mapped");
    eq(payload.source.state_basis, "active_shell_state", "B10: active shell state basis exposed when runResult/workbench are present");
}

section("C. Same structural base across modes");
{
    const live = buildStructuralViewerPayload({ ...FULL_INPUT, mode: "live" });
    const staticPayload = buildStructuralViewerPayload({ ...FULL_INPUT, mode: "static" });
    const inspection = buildStructuralViewerPayload({ ...FULL_INPUT, mode: "inspection" });

    eq(live.mode, "live", "C1: live mode preserved");
    eq(staticPayload.mode, "static", "C2: static mode preserved");
    eq(inspection.mode, "inspection", "C3: inspection mode preserved");

    deepEq(live.source.source_id, staticPayload.source.source_id, "C4: source_id does not drift by mode");
    deepEq(live.lineage.provenance_refs, inspection.lineage.provenance_refs, "C5: provenance refs shared across modes");
    deepEq(live.structural, staticPayload.structural, "C6: structural section shared across live/static");
    deepEq(live.overlays, inspection.overlays, "C7: overlays shared across live/inspection");
    ok(live.telemetry?.placeholder_status === "live_telemetry_unwired", "C8: live telemetry placeholder is explicit");
    eq(staticPayload.telemetry, undefined, "C9: static telemetry omitted by default");
    eq(inspection.telemetry, undefined, "C10: inspection telemetry omitted by default");
    eq(inspection.source.state_basis, "active_shell_state", "C11: active shell state basis preserved across modes");
}

section("D. Overlays remain optional");
{
    const payload = buildStructuralViewerPayload(NO_OVERLAY_INPUT);
    ok(payload.structural && typeof payload.structural === "object", "D1: structural section present without overlays");
    eq(payload.overlays, undefined, "D2: overlays omitted when unavailable");
    eq(payload.mode, "static", "D3: mode still preserved without overlays");
}

section("E. Future optional seams remain non-required");
{
    const payload = buildStructuralViewerPayload(NO_OVERLAY_INPUT);
    const payloadJson = JSON.stringify(payload);
    ok(!payloadJson.includes('"settlement_report"'), "E1: settlement_report not required");
    ok(!payloadJson.includes('"identity_audit"'), "E2: identity_audit not required");
    ok(Array.isArray(payload.lineage.explicit_non_claims), "E3: explicit_non_claims remains available");
}

section("F. Fallback posture remains explicit");
{
    const payload = buildStructuralViewerPayload(SHELL_STATE_FALLBACK_INPUT);
    eq(payload.source.state_basis, "shell_state_fallback", "F1: shell-state fallback basis exposed");
    ok(String(payload.source.state_availability).includes("adapter failed"), "F2: fallback status carries the current error posture");
    ok(payload.lineage.generated_from.includes("shell_state_fallback"), "F3: lineage records shell-state fallback basis");
    ok(payload.structural && typeof payload.structural === "object", "F4: structural section remains present even when empty");
    eq(payload.overlays, undefined, "F5: overlays remain optional during fallback");
}

finish();
