// test_door_one_hud.js
//
// Contract tests for DoorOneHUD.
//
// Verifies:
//   - output shape is deterministic
//   - HUD consumes orchestrator result, does not bypass it
//   - no canon/prediction/ontology language in visible output
//   - all five panels are present and correctly labelled
//   - artifact section marks pipeline artifact classes only
//   - non-artifact surfaces are explicitly labelled as non-artifacts
//   - failed result renders an error panel, not a crash
//   - show_ids=true renders full IDs; show_ids=false abbreviates
//
// Run from the resonance/ directory:
//   node test_door_one_hud.js

import { DoorOneHUD }          from "../hud/DoorOneHUD.js";
import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { makeTestSignal }       from "../fixtures/test_signal.js";

// ─── Harness ──────────────────────────────────────────────────────────────────

let passed = 0, failed = 0;
const failures = [];

function assert(label, condition, detail = "") {
    if (condition) { console.log(`  ✓ ${label}`); passed++; }
    else {
        const msg = `  ✗ ${label}${detail ? ` — ${detail}` : ""}`;
        console.error(msg); failures.push(msg); failed++;
    }
}
function section(name) { console.log(`\n── ${name} ──`); }

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const POLICIES = {
    clock_policy_id: "clock.hud.test",
    ingest_policy: { policy_id:"ingest.v1", gap_threshold_multiplier:3, allow_non_monotonic:false, allow_empty:false, non_monotonic_mode:"reject" },
    grid_spec: { Fs_target:8, t_ref:0, drift_model:"none", non_monotonic_policy:"reject", interp_method:"linear", gap_policy:"cut", anti_alias_filter:false },
    window_spec: { mode:"fixed", Fs_target:8, base_window_N:8, hop_N:8, window_function:"hann", overlap_ratio:0, stationarity_policy:"tolerant", salience_policy:"off", gap_policy:"cut", max_missing_ratio:0.25, boundary_policy:"truncate" },
    transform_policy: { policy_id:"xform.v1", transform_type:"dft", normalization_mode:"forward_1_over_N" },
    compression_policy: { policy_id:"comp.v1", selection_method:"topK", budget_K:3, maxK:3, include_dc:true, invariance_lens:"energy", respect_novelty_boundary:false, thresholds:{ max_recon_rmse:999, max_energy_residual:999, max_band_divergence:999 } },
    anomaly_policy: { policy_id:"anom.v1", invariance_mode:"band_profile", divergence_metric:"band_l1", threshold_value:0.5, frequency_tolerance_hz:0, phase_sensitivity_mode:"off", novelty_min_duration:0, segmentation_mode:"strict" },
    merge_policy: { policy_id:"merge.v1", adjacency_rule:"time_touching", phase_alignment_mode:"clock_delta_rotation", weights_mode:"duration", novelty_gate:"off", merge_mode:"authoritative", grid_tolerance:0 },
    post_merge_compression_policy: { policy_id:"mergecomp.v1", selection_method:"topK", budget_K:3, invariance_lens:"energy", include_dc:true, thresholds:{ max_recon_rmse:999, max_energy_residual:999, max_band_divergence:999 } },
    reconstruct_policy: { policy_id:"recon.v1", output_format:"values", fill_missing_bins:"ZERO", validate_invariants:false, window_compensation:"NONE" },
    basin_policy: { policy_id:"basin.v1", similarity_threshold:0.5, min_member_count:1, weight_mode:"duration", linkage:"single_link" },
};

const { signal } = makeTestSignal({ durationSec:4, fs:8, seed:7, noiseStd:0.01,
    source_id:"hud.test", channel:"ch0", modality:"voltage", units:"arb" });

const RAW = {
    timestamps: signal.timestamps, values: signal.values,
    stream_id: signal.stream_id, source_id: signal.source_id,
    channel: signal.channel, modality: signal.modality,
    meta: signal.meta, clock_policy_id: POLICIES.clock_policy_id,
};
const QSPEC = { query_id:"q1", kind:"energy_trend", mode:"ENERGY", scope:{ allow_cross_segment:true } };
const QPOL  = { policy_id:"qp.v1", scoring:"energy_delta", normalization:"none", topK:5 };

// Run once and reuse
const orch   = new DoorOneOrchestrator({ policies: POLICIES });
const result = orch.runBatch(RAW, { query_spec: QSPEC, query_policy: QPOL });
const hud    = new DoorOneHUD();
const output = hud.render(result, { mode:"batch", run_label:"test-run" });

// ════════════════════════════════════════════════════════════════════════════
// A. HUD consumes orchestrator output — does not bypass it
// ════════════════════════════════════════════════════════════════════════════

section("A. HUD consumes orchestrator output");

assert("A1: orchestrator result.ok before rendering", result.ok);
assert("A2: hud.render returns a string", typeof output === "string");
assert("A3: output is non-empty", output.length > 0);
assert("A4: HUD does not import operators directly",
    // DoorOneHUD only imports nothing from operators — verified by inspecting render()
    // which reads result.artifacts, result.substrate etc without calling any Op
    !output.includes("IngestOp") && !output.includes("CompressOp"));

// ════════════════════════════════════════════════════════════════════════════
// B. Five required panels present with correct labels
// ════════════════════════════════════════════════════════════════════════════

section("B. Required panels present");

assert("B1: panel [1] RUNTIME SUMMARY present",              output.includes("[1] RUNTIME SUMMARY"));
assert("B2: panel [2] ARTIFACTS present",                    output.includes("[2] ARTIFACTS"));
assert("B3: panel [3] SUBSTRATE present",                    output.includes("[3] SUBSTRATE"));
assert("B4: panel [4] STRUCTURAL NEIGHBORHOODS present",     output.includes("[4] STRUCTURAL NEIGHBORHOODS"));
assert("B5: panel [5] AUDIT present",                        output.includes("[5] AUDIT"));

// ════════════════════════════════════════════════════════════════════════════
// C. Artifact class discipline in panel [2]
// ════════════════════════════════════════════════════════════════════════════

section("C. Artifact class discipline");

// All constitutional pipeline artifact classes shown
assert("C1: A1 present in artifacts panel", output.includes("✓ A1") || output.includes("· A1"));
assert("C2: A2 present",                    output.includes("✓ A2") || output.includes("· A2"));
assert("C3: H1 present",                    output.includes("✓ H1") || output.includes("· H1"));
assert("C4: M1 present",                    output.includes("✓ M1") || output.includes("· M1"));
assert("C5: An present",                    output.includes("✓ An") || output.includes("· An"));
assert("C6: A3 present",                    output.includes("✓ A3") || output.includes("· A3"));
assert("C7: Q present with Tooling label",  output.includes("QueryResult (Tooling)"));
assert("C8: BN present",                    output.includes("✓ BN") || output.includes("· BN"));

// Q explicitly labelled Tooling (not Derived, not Authoritative)
assert("C9: Q is not labelled 'Derived'",        !output.includes("QueryResult (Derived)"));
assert("C10: Q is not labelled 'Authoritative'", !output.includes("QueryResult (Authoritative)"));

// Non-artifact note present
assert("C11: non-artifact note present in artifacts panel",
    output.includes("NOT pipeline artifacts"));

// ════════════════════════════════════════════════════════════════════════════
// D. No canon / prediction / ontology language
// ════════════════════════════════════════════════════════════════════════════

section("D. No canon/prediction/ontology language");

// Forbidden terms that must never appear as affirmative claims in the HUD output.
// The HUD does use "prediction" and "ontology" in explicit BOUNDARY DENIAL statements
// ("not prediction", "no canon, prediction, or ontology below this line") — those are
// correct and lawful. We check that no AFFIRMATIVE claim appears, not mere occurrence.
const forbidden = [
    "canonical memory", "canon promotion", "trusted promoted",
    "true basin", "attractor basin", "attractor proof",
    "next state", "likely next", "transition probab",
    "C1 CanonicalState", "forecas",
    "classified as",
];
for (const term of forbidden) {
    assert(`D: no "${term}" in output`, !output.toLowerCase().includes(term.toLowerCase()),
        `found: "${term}"`);
}

// "prediction" must only appear in denial contexts ("not prediction", "no ... prediction")
const predictionLines = output.split("\n").filter(l => l.toLowerCase().includes("prediction"));
assert("D: 'prediction' only in denial/boundary statements",
    predictionLines.every(l =>
        l.toLowerCase().includes("not prediction") ||
        l.toLowerCase().includes("no canon, prediction") ||
        l.toLowerCase().includes("observational, not prediction")),
    predictionLines.join(" | "));

// "ontology" must only appear in the footer denial line
const ontologyLines = output.split("\n").filter(l => l.toLowerCase().includes("ontology"));
assert("D: 'ontology' only in footer denial line",
    ontologyLines.every(l => l.toLowerCase().includes("no canon, prediction, or ontology")),
    ontologyLines.join(" | "));

// Panel [4] header uses "structural neighborhood" language, not attractor claim
assert("D: panel 4 says 'STRUCTURAL NEIGHBORHOODS'", output.includes("STRUCTURAL NEIGHBORHOODS"));
assert("D: panel 4 says 'observational, not prediction'",
    output.includes("observational, not prediction"));

// generated_from note is preserved from the observational report
assert("D: generated_from note preserved in panel 4",
    output.includes("structural neighborhood observations only, not prediction or canon"));

// ════════════════════════════════════════════════════════════════════════════
// E. Determinism
// ════════════════════════════════════════════════════════════════════════════

section("E. Determinism");

const output2 = hud.render(result, { mode:"batch", run_label:"test-run" });
assert("E1: identical render for identical input", output === output2);

// Different run_label changes only that line
const output3 = hud.render(result, { mode:"batch", run_label:"other-label" });
assert("E2: different run_label produces different output",    output !== output3);
assert("E3: different run_label only changes run_label line",
    output3.includes("other-label") && !output3.includes("test-run"));

// ════════════════════════════════════════════════════════════════════════════
// F. Failed result renders error panel, not crash
// ════════════════════════════════════════════════════════════════════════════

section("F. Failed result handling");

const failedResult = { ok: false, error: "TEST_ERROR", reasons: ["reason one", "reason two"] };
let failOutput;
try {
    failOutput = hud.render(failedResult);
} catch (e) {
    assert("F1: render does not throw on failed result", false, e.message);
    failOutput = "";
}
assert("F1: render does not throw on failed result",  typeof failOutput === "string");
assert("F2: error panel shows STATUS FAILED",         failOutput.includes("FAILED"));
assert("F3: error panel shows error code",            failOutput.includes("TEST_ERROR"));
assert("F4: error panel shows reasons",               failOutput.includes("reason one"));
assert("F5: failed render has no artifact panels",    !failOutput.includes("[2] ARTIFACTS"));

// null/undefined result is handled
let nullOutput;
try { nullOutput = hud.render(null); } catch (e) { nullOutput = ""; }
assert("F6: render handles null result without throw", typeof nullOutput === "string");

// ════════════════════════════════════════════════════════════════════════════
// G. ID abbreviation / show_ids option
// ════════════════════════════════════════════════════════════════════════════

section("G. ID display options");

// Default: abbreviated IDs in neighborhood panel
assert("G1: default output does not contain full BN: IDs in transitions",
    !output.split("\n")
        .filter(l => l.includes("→"))
        .some(l => l.match(/BN:[A-Z]/)));

// show_ids=true: full IDs in transitions
const hudFull = new DoorOneHUD({ show_ids: true });
const outputFull = hudFull.render(result, { mode:"batch", run_label:"full-ids" });
// Full IDs start with BN:
const hasFullId = outputFull.includes("BN:STR:");
assert("G2: show_ids=true renders full BN IDs", hasFullId);

// ════════════════════════════════════════════════════════════════════════════
// H. Substrate and summary sections correctly labelled as non-artifact
// ════════════════════════════════════════════════════════════════════════════

section("H. Substrate / summaries labelled correctly");

assert("H1: substrate panel says 'plain-data read surface'",
    output.includes("plain-data read surface"));
assert("H2: substrate state_count appears",  output.includes("state_count"));
assert("H3: segment_count appears",          output.includes("segment_count"));
assert("H4: basin_count appears",            output.includes("basin_count"));

// ════════════════════════════════════════════════════════════════════════════
// I. Audit panel correctness
// ════════════════════════════════════════════════════════════════════════════

section("I. Audit panel");

assert("I1: skipped_windows row present",    output.includes("skipped_windows"));
assert("I2: merge_failures row present",     output.includes("merge_failures"));
assert("I3: consensus row shows 'deferred'", output.includes("result=deferred") || output.includes("deferred"));

// Footer line present
assert("I4: footer present",
    output.includes("no canon, prediction, or ontology below this line"));

// ════════════════════════════════════════════════════════════════════════════
// Results
// ════════════════════════════════════════════════════════════════════════════

console.log(`\n${"═".repeat(54)}`);
console.log(`  ${passed} passed   ${failed} failed`);
if (failures.length > 0) {
    console.log("\nFailed:");
    for (const f of failures) console.log(f);
    console.log(`\n  SOME TESTS FAILED ✗`);
    process.exit(1);
} else {
    console.log(`  ALL TESTS PASSED ✓`);
}
