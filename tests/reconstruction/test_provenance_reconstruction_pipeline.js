// tests/reconstruction/test_provenance_reconstruction_pipeline.js
//
// Contract tests for runtime/reconstruction/ProvenanceReconstructionPipeline.js

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

import {
    reconstructFromReplayRequest,
} from "../../runtime/reconstruction/ProvenanceReconstructionPipeline.js";

let PASS = 0, FAIL = 0;
function section(t) { console.log(`\n── ${t} ──`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ✓ ${label}`); }
    else { FAIL++; console.error(`  ✗ ${label}`); }
}
function eq(a, b, label) {
    ok(Object.is(a, b), `${label}${Object.is(a, b) ? "" : ` (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`}`);
}
function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL === 0 ? "  ALL TESTS PASSED ✓" : "  TESTS FAILED ✗");
    if (FAIL > 0) process.exit(1);
}

const MOCK_DECLARED_LENS = {
    transform_family: "FFT/Hann",
    window_N: 256,
    hop_N: 128,
    Fs_target: 256,
};

const TIER0 = {
    tier_used: 0,
    tier_label: "Tier 0 — live working state",
    honest_posture: "Tier 0 only · not receipt-backed · session-scoped",
};

const TIER2 = {
    tier_used: 2,
    tier_label: "Tier 2 — regenerable digest",
    honest_posture: "declared-only posture",
};

const BASE_REQUEST = {
    replay_request_id: "RPLY-RT-test-001",
    replay_type: "runtime_reconstruction",
    request_status: "prepared",
    replay_target_type: "current_run_workbench",
    replay_target_ref: "shell.run.test.001",
    source_family: "Synthetic Signal",
    run_label: "shell.run.test.001",
    stream_id: "stream.test.001",
    source_id: "synthetic.test",
    declared_lens: MOCK_DECLARED_LENS,
    retained_tier_used: TIER0,
    support_basis: ["harmonic_state_evidence"],
    explicit_non_claims: ["not canon", "not truth", "not raw restoration"],
    derived_vs_durable: "derived · Tier 0",
};

const VALID_RUN = {
    ok: true,
    run_label: "shell.run.test.001",
    artifacts: {
        a1: { artifact_class: "A1", stream_id: "stream.test.001" },
        h1s: [{ artifact_class: "H1" }],
        m1s: [{ artifact_class: "M1" }],
        q: { artifact_class: "Q" },
    },
};

const HOLLOW_RUN = {
    ok: true,
    run_label: "shell.run.test.001",
    artifacts: {},
};

const WORKBENCH_ONLY = {
    scope: { stream_id: "stream.test.001" },
    runtime: { substrate: { state_count: 1 } },
    interpretation: { trajectory: {} },
};

section("A. Pipeline source constitutional posture");
{
    const src = await readFile(path.join(ROOT, "runtime/reconstruction/ProvenanceReconstructionPipeline.js"), "utf8");
    ok(src.includes("support-trace reconstruction"), "A1: support-trace class declared");
    ok(src.includes("not raw restoration"), "A2: not-raw-restoration declared");
    ok(src.includes("not truth"), "A3: not-truth declared");
    ok(src.includes("not canon"), "A4: not-canon declared");
    ok(!src.includes('from "../../hud/') && !src.includes('from "../hud/') && !src.includes('from "./hud/'), "A5: no hud/ imports");
    ok(!src.match(/import.*DoorOneOrchestrator|new DoorOneOrchestrator/), "A6: no orchestrator import\/instantiation");
    ok(!src.match(/import.*ConsensusOp|new ConsensusOp/), "A7: no ConsensusOp import\/instantiation");
    ok(!src.includes("mintCanon"), "A8: no canon minting helper");
    ok(src.includes("runtimeRefs.length > 0"), "A9: runtime support availability requires real runtime refs");
}

section("B. Valid Tier 0 runtime reconstruction");
{
    const r = reconstructFromReplayRequest({
        replayRequest: BASE_REQUEST,
        runResult: VALID_RUN,
        workbench: WORKBENCH_ONLY,
    });

    eq(r.ok, true, "B1: ok = true");
    eq(r.reconstruction_type, "support_trace", "B2: reconstruction_type = support_trace");
    eq(r.reconstruction_status, "completed", "B3: reconstruction_status = completed");
    eq(r.threshold_posture.retained_tier_sufficiency, "pass", "B4: Tier 0 sufficiency passes");
    eq(r.threshold_posture.downgrade_output, null, "B5: Tier 0 valid replay has no downgrade");
    const completed = r.reconstruction_trace.find((s) => s.step_type === "reconstruction_completed");
    ok(!!completed, "B6: reconstruction_completed step present");
    ok(r.reconstruction_summary.non_authority_note.includes("Tier 0"), "B7: summary non-authority note is tier-specific");
    ok(r.explicit_non_claims.includes("not source-adjacent reconstitution"), "B8: support-trace non-claim preserved");
}

section("C. Hollow runResult.ok does not simulate runtime support");
{
    const r = reconstructFromReplayRequest({
        replayRequest: BASE_REQUEST,
        runResult: HOLLOW_RUN,
        workbench: WORKBENCH_ONLY,
    });

    eq(r.ok, false, "C1: hollow ok run fails runtime_reconstruction");
    ok(r.failure_reason.includes("meaningful runtime support") || r.failure_reason.includes("sufficient runtime artifacts"), "C2: failure reason names meaningful runtime support");
    ok(!r.reconstruction_trace.some((s) => s.step_type === "reconstruction_completed"), "C3: no completed step on hollow runtime failure");
}

section("D. Higher-tier insufficiency is explicit");
{
    const r = reconstructFromReplayRequest({
        replayRequest: { ...BASE_REQUEST, retained_tier_used: TIER2, derived_vs_durable: "derived · Tier 2" },
        runResult: VALID_RUN,
        workbench: WORKBENCH_ONLY,
    });

    eq(r.ok, true, "D1: higher-tier declared replay still returns bounded output");
    eq(r.threshold_posture.retained_tier_sufficiency, "fail", "D2: tierUsed > 0 forces retained_tier_sufficiency = fail");
    eq(r.threshold_posture.downgrade_output, "retained_tier_insufficient", "D3: tierUsed > 0 forces retained_tier_insufficient downgrade");
    ok(r.threshold_posture.notes.includes("Tier 2"), "D4: threshold notes remain tier-honest");
}

section("E. Reconstruction-completed detail is tier-honest");
{
    const r = reconstructFromReplayRequest({
        replayRequest: { ...BASE_REQUEST, retained_tier_used: TIER2, derived_vs_durable: "derived · Tier 2" },
        runResult: VALID_RUN,
        workbench: WORKBENCH_ONLY,
    });

    const completed = r.reconstruction_trace.find((s) => s.step_type === "reconstruction_completed");
    ok(!!completed, "E1: completed step exists");
    ok(completed.detail.includes(TIER2.tier_label), "E2: completed detail reflects declared higher tier label");
    ok(!completed.detail.endsWith("Tier 0") && !completed.detail.includes("· Tier 0"), "E3: completed detail no longer hardcodes Tier 0");
    ok(completed.non_authority_note.includes("not raw restoration"), "E4: non-authority posture remains explicit");
}

section("F. Workbench context alone does not simulate runtime support");
{
    const r = reconstructFromReplayRequest({
        replayRequest: BASE_REQUEST,
        runResult: { ok: true, artifacts: {} },
        workbench: WORKBENCH_ONLY,
    });

    eq(r.ok, false, "F1: workbench presence alone is insufficient for runtime_reconstruction");
    ok(r.failure_reason.includes("runtime support") || r.failure_reason.includes("runtime artifacts"), "F2: failure reason rejects context-only support");
}

section("G. Support-trace posture remains explicit");
{
    const r = reconstructFromReplayRequest({
        replayRequest: BASE_REQUEST,
        runResult: VALID_RUN,
        workbench: WORKBENCH_ONLY,
    });

    eq(r.reconstruction_summary.reconstruction_class, "support_trace", "G1: reconstruction summary class = support_trace");
    ok(r.reconstruction_summary.non_authority_note.includes("not canon"), "G2: summary notes remain non-canonical");
    ok(r.reconstruction_trace.every((s) => typeof s.non_authority_note === "string" && s.non_authority_note.length > 0), "G3: every trace step carries non-authority note");
}

finish();
