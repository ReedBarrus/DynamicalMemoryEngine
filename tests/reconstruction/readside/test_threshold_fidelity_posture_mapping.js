import { deriveOperatorThresholdPosture, deriveOperatorFidelityPosture } from "../../../hud/replayThresholdFidelityPosture.js";
import { buildRuntimeReconstructionReplay } from "../../../hud/replayModel.js";

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

function eq(actual, expected, label) {
    ok(
        Object.is(actual, expected),
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${expected}, got ${actual})`}`
    );
}

function includes(text, pattern, label) {
    ok(String(text).includes(pattern), label);
}

function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const RUN_RESULT = {
    ok: true,
    run_label: "shell.run.threshold.001",
    artifacts: {
        a1: { source_id: "synthetic.seed42", stream_id: "stream.threshold.001" },
        h1s: [{ artifact_class: "H1" }],
        m1s: [{ artifact_class: "M1" }],
        q: { artifact_class: "Q" },
        anomaly_reports: [{ artifact_class: "An" }],
    },
};

const HOLLOW_RUN = {
    ok: true,
    run_label: "shell.run.threshold.hollow",
    artifacts: {},
};

const WORKBENCH = {
    scope: {
        stream_id: "stream.threshold.001",
        segment_ids: ["s0", "s1", "s2", "s3"],
        cross_run_context: { available: false, run_count: 1 },
    },
    runtime: { artifacts: RUN_RESULT.artifacts },
    interpretation: { trajectory: {} },
    promotion_readiness: { report: { readiness_summary: { overall_readiness: "insufficient" } } },
    canon_candidate: { dossier: { candidate_claim: { claim_type: "bounded_structural_claim" } } },
    consensus_review: { review: { result: "defer" } },
};

const HOLLOW_WORKBENCH = {
    ...WORKBENCH,
    runtime: { artifacts: HOLLOW_RUN.artifacts },
};

const TIER1 = {
    tier_used: 1,
    tier_label: "Tier 1 - durable receipts",
    honest_posture: "receipt-backed lineage support only",
};

const TIER2 = {
    tier_used: 2,
    tier_label: "Tier 2 - regenerable digest",
    honest_posture: "declared-only posture",
};

const RECEIPT_SUPPORT = {
    receipt_refs: ["receipt_cycle_0001_live_run_1.json"],
    receipt_lineage: ["out_provenance/live/receipt_cycle_0001_live_run_1.json"],
    receipt_count: 1,
    provenance_complete: true,
    replayable_support_present: true,
    lineage_summary: "durable provenance receipt lineage",
};

const TIER0_REPLAY = buildRuntimeReconstructionReplay({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
});

const TIER1_REPLAY = buildRuntimeReconstructionReplay({
    workbench: HOLLOW_WORKBENCH,
    runResult: HOLLOW_RUN,
    sourceFamilyLabel: "Synthetic Signal",
    retainedTierOverride: TIER1,
    receiptSupport: RECEIPT_SUPPORT,
});

const TIER2_REPLAY = buildRuntimeReconstructionReplay({
    workbench: WORKBENCH,
    runResult: RUN_RESULT,
    sourceFamilyLabel: "Synthetic Signal",
    retainedTierOverride: TIER2,
    receiptSupport: RECEIPT_SUPPORT,
});

section("A. threshold mapping stays consistent for stronger supported cases");
{
    const tier0 = deriveOperatorThresholdPosture(TIER0_REPLAY);
    const tier1 = deriveOperatorThresholdPosture(TIER1_REPLAY);

    eq(tier0.classCode, "conserved", "A1: Tier 0 maps to conserved threshold posture");
    includes(tier0.note, "conserved by surviving live runtime support", "A2: Tier 0 note stays live-runtime specific");
    eq(tier1.classCode, "narrowed", "A3: Tier 1 maps to narrowed threshold posture");
    includes(tier1.note, "narrower retained receipt-lineage form", "A4: Tier 1 note stays retained-lineage specific");
}

section("B. fidelity mapping stays consistent for stronger supported cases");
{
    const tier0 = deriveOperatorFidelityPosture(TIER0_REPLAY);
    const tier1 = deriveOperatorFidelityPosture(TIER1_REPLAY);

    eq(tier0.classCode, "conserved_support_trace", "B1: Tier 0 maps to conserved support-trace fidelity");
    includes(tier0.note, "strongest here within the active seam", "B2: Tier 0 fidelity note stays bounded");
    eq(tier1.classCode, "narrowed_support_trace", "B3: Tier 1 maps to narrowed support-trace fidelity");
    includes(tier1.note, "narrower retained form", "B4: Tier 1 fidelity note stays retained-specific");
}

section("C. insufficient mapping stays separate from stronger supported cases");
{
    const tier2Threshold = deriveOperatorThresholdPosture(TIER2_REPLAY);
    const tier2Fidelity = deriveOperatorFidelityPosture(TIER2_REPLAY);

    eq(tier2Threshold.classCode, "insufficient", "C1: Tier 2 maps to insufficient threshold posture");
    includes(tier2Threshold.note, "does not justify lawful replay legitimacy", "C2: Tier 2 threshold note stays explicit");
    eq(tier2Fidelity.classCode, "insufficient_support_trace", "C3: Tier 2 maps to insufficient support-trace fidelity");
    includes(tier2Fidelity.note, "not enough to justify lawful replay / reconstruction quality", "C4: Tier 2 fidelity note stays explicit");
}

finish();
