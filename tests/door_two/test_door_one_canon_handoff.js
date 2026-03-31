// tests/test_door_one_canon_handoff.js
//
// Fail-closed test suite for the C1 consultation handoff seam.
//
// Scope:
//   - load the live C1 instance for Packet 1
//   - test all seven required cases from the task spec
//   - verify posture fields (status, challenge_posture) are always visible
//   - verify no mutation occurs
//
// Boundary contract:
//   - consultC1 is read-only
//   - does not promote, mint, or alter runtime meaning
//   - C1 object is loaded but never mutated by tests
//   - all mutations in tests use a local copy only

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consultC1 } from "../canon/consultC1.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const C1_PATH   = path.resolve(__dirname, "../canon/C1_BASELINE_SINE400_001.json");

// ─── Minimal test harness (matches existing repo style) ───────────────────

let PASS = 0;
let FAIL = 0;

function section(title) {
    console.log(`\n── ${title} ──`);
}

function ok(condition, label) {
    if (condition) {
        PASS += 1;
        console.log(`  ✓ ${label}`);
    } else {
        FAIL += 1;
        console.log(`  ✗ ${label}`);
    }
}

function eq(actual, expected, label) {
    ok(Object.is(actual, expected),
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`);
}

function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL === 0 ? "  ALL TESTS PASSED ✓" : "  TESTS FAILED ✗");
    if (FAIL > 0) process.exit(1);
}

// ─── Load live C1 instance ────────────────────────────────────────────────

const raw   = await readFile(C1_PATH, "utf8");
const C1    = Object.freeze(JSON.parse(raw));  // freeze to verify no mutation occurs

// Helper: deep-copy the canonical C1 with selective field overrides for test variants
function variant(overrides) {
    return { ...C1, ...overrides };
}

// ─── Section A: C1 instance shape integrity ───────────────────────────────

section("A. C1 instance shape integrity");

ok(C1.canonical_id     === "C1_BASELINE_SINE400_001",        "A1: canonical_id correct");
ok(C1.canonical_version === 1,                                "A2: canonical_version = 1");
ok(C1.canonical_status  === "promoted",                       "A3: canonical_status = promoted");
ok(C1.claim_type        === "baseline_reference_claim",       "A4: claim_type correct");
ok(typeof C1.promoted_claim === "string" && C1.promoted_claim.length > 20,
                                                              "A5: promoted_claim is non-trivial string");
ok(C1.runtime_handoff_enabled === true,                       "A6: runtime_handoff_enabled = true");
ok(Array.isArray(C1.allowed_use) && C1.allowed_use.length >= 1,
                                                              "A7: allowed_use is non-empty array");
ok(Array.isArray(C1.forbidden_use) && C1.forbidden_use.length >= 1,
                                                              "A8: forbidden_use is non-empty array");
ok(typeof C1.source_family_scope === "string",                "A9: source_family_scope is string");
ok(typeof C1.lens_scope          === "string",                "A10: lens_scope is string");
ok(typeof C1.challenge_posture   === "string",                "A11: challenge_posture is string");
ok(C1.supersession_ref  === null,                             "A12: supersession_ref = null (not yet used)");
ok(C1.revocation_ref    === null,                             "A13: revocation_ref = null (not yet used)");
ok(C1.origin_candidate_packet_id === "CAND-BASELINE-REALSOURCE-SINE400-V1",
                                                              "A14: origin_candidate_packet_id correct");
ok(typeof C1.promotion_memo_ref === "string",                 "A15: promotion_memo_ref present");

// ─── Case 1: same-family + same-lens + allowed use → allowed ─────────────

section("Case 1: same-family + same-lens + allowed use → allowed");

const case1 = consultC1(
    C1,
    "same-family baseline comparison",
    { sourceFamily: "daw_mic_sine_400hz", lensScope: "medium FFT/Hann" }
);

eq(case1.decision,         "allow",   "C1.1: decision = allow");
eq(case1.canonical_id,     "C1_BASELINE_SINE400_001", "C1.2: canonical_id echoed");
eq(case1.canonical_status, "promoted", "C1.3: canonical_status visible");
ok(typeof case1.reason === "string" && case1.reason.length > 0, "C1.4: reason is non-empty string");
ok(case1.effective_scope_note !== null,                          "C1.5: effective_scope_note echoed on allow");
eq(case1.challenge_posture, "none_active",                       "C1.6: challenge_posture echoed");

// ─── Case 2: cross-family use → denied ────────────────────────────────────

section("Case 2: cross-family use → denied");

const case2 = consultC1(
    C1,
    "same-family baseline comparison",
    { sourceFamily: "daw_mic_input", lensScope: "medium FFT/Hann" }
);

eq(case2.decision,         "deny",    "C2.1: decision = deny");
eq(case2.canonical_status, "promoted", "C2.2: canonical_status still visible on deny");
ok(case2.reason.toLowerCase().includes("family"),               "C2.3: reason mentions family mismatch");
eq(case2.effective_scope_note, null,                            "C2.4: effective_scope_note = null on deny");

// ─── Case 3: undeclared / wrong lens → denied ─────────────────────────────

section("Case 3: undeclared/wrong lens → denied");

const case3 = consultC1(
    C1,
    "same-family baseline comparison",
    { sourceFamily: "daw_mic_sine_400hz", lensScope: "short wavelet lens" }
);

eq(case3.decision, "deny",   "C3.1: decision = deny for wrong lens");
ok(case3.reason.toLowerCase().includes("lens"),                 "C3.2: reason mentions lens mismatch");
eq(case3.canonical_status, "promoted",                          "C3.3: canonical_status still visible");

// ─── Case 4: forbidden use (prediction) → denied ─────────────────────────

section("Case 4: forbidden use (prediction) → denied");

const case4 = consultC1(
    C1,
    "prediction",
    { sourceFamily: "daw_mic_sine_400hz", lensScope: "medium FFT/Hann" }
);

eq(case4.decision, "deny",   "C4.1: decision = deny for prediction");
ok(case4.reason.toLowerCase().includes("forbidden"),            "C4.2: reason mentions forbidden");

// Also test a use that contains the forbidden term as substring
const case4b = consultC1(
    C1,
    "use for prediction model training",
    { sourceFamily: "daw_mic_sine_400hz", lensScope: "medium FFT/Hann" }
);
eq(case4b.decision, "deny",  "C4.3: decision = deny for use containing forbidden term");

// ─── Case 5: missing required field → denied ──────────────────────────────

section("Case 5: missing required field → denied");

// Missing runtime_handoff_enabled
const case5a = consultC1(
    variant({ runtime_handoff_enabled: undefined }),
    "same-family baseline comparison",
    {}
);
eq(case5a.decision, "deny",  "C5.1: missing runtime_handoff_enabled → deny");
ok(case5a.reason.toLowerCase().includes("required field"),      "C5.2: reason mentions required field");

// Missing allowed_use
const case5b = consultC1(
    variant({ allowed_use: undefined }),
    "same-family baseline comparison",
    {}
);
eq(case5b.decision, "deny",  "C5.3: missing allowed_use → deny");

// Missing forbidden_use
const case5c = consultC1(
    variant({ forbidden_use: undefined }),
    "same-family baseline comparison",
    {}
);
eq(case5c.decision, "deny",  "C5.4: missing forbidden_use → deny (fail closed)");

// runtime_handoff_enabled = false
const case5d = consultC1(
    variant({ runtime_handoff_enabled: false }),
    "same-family baseline comparison",
    {}
);
eq(case5d.decision, "deny",  "C5.5: runtime_handoff_enabled = false → deny");
ok(case5d.reason.toLowerCase().includes("runtime_handoff_enabled"),
                             "C5.6: reason explains handoff not enabled");

// Null C1 object
const case5e = consultC1(null, "same-family baseline comparison", {});
eq(case5e.decision, "deny",  "C5.7: null C1 object → deny");

// ─── Case 6: status = contested → consultation possible, posture visible ──

section("Case 6: status = contested → allow but posture visible");

const case6 = consultC1(
    variant({ canonical_status: "contested", challenge_posture: "challenge_active" }),
    "same-family baseline comparison",
    { sourceFamily: "daw_mic_sine_400hz", lensScope: "medium FFT/Hann" }
);

eq(case6.decision,         "allow",            "C6.1: contested status → allow is still possible");
eq(case6.canonical_status, "contested",        "C6.2: canonical_status = contested is visible");
eq(case6.challenge_posture, "challenge_active", "C6.3: challenge_posture visible in result");
ok(case6.reason.toLowerCase().includes("contested"),            "C6.4: reason flags contested posture");

// ─── Case 7: status = suspended → denied ──────────────────────────────────

section("Case 7: status = suspended → denied");

const case7 = consultC1(
    variant({ canonical_status: "suspended" }),
    "same-family baseline comparison",
    { sourceFamily: "daw_mic_sine_400hz", lensScope: "medium FFT/Hann" }
);

eq(case7.decision,         "deny",      "C7.1: suspended status → deny");
eq(case7.canonical_status, "suspended", "C7.2: canonical_status = suspended is still visible on deny");
ok(case7.reason.toLowerCase().includes("suspended") || case7.reason.toLowerCase().includes("consultable"),
                                        "C7.3: reason explains suspension");

// Also verify other non-consultable statuses
for (const badStatus of ["proposed", "deferred", "revoked", "superseded"]) {
    const r = consultC1(variant({ canonical_status: badStatus }), "same-family baseline comparison", {});
    eq(r.decision, "deny", `C7.4: status='${badStatus}' → deny`);
}

// ─── Section B: boundary integrity ────────────────────────────────────────

section("B. Boundary integrity");

// C1 object was frozen — verify it is unchanged
ok(C1.canonical_status === "promoted",                          "B1: C1 object not mutated by tests");
ok(C1.runtime_handoff_enabled === true,                         "B2: runtime_handoff_enabled not mutated");

// Decision is always allow or deny — nothing else
for (const r of [case1, case2, case3, case4, case5a, case6, case7]) {
    ok(r.decision === "allow" || r.decision === "deny",
        `B3: decision is allow or deny (got '${r.decision}')`);
}

// canonical_id and canonical_status are always echoed in the result
// even on deny (so callers can log which object was consulted)
ok(case2.canonical_id === "C1_BASELINE_SINE400_001",            "B4: canonical_id echoed on deny");
ok(case3.canonical_status !== undefined && case3.canonical_status !== null,
                                                                "B5: canonical_status non-null on deny");

// effective_scope_note is null on all deny results
for (const r of [case2, case3, case4, case5a, case5b, case7]) {
    ok(r.effective_scope_note === null, `B6: effective_scope_note = null on deny`);
}

// effective_scope_note is non-null on allow
ok(case1.effective_scope_note !== null && typeof case1.effective_scope_note === "string",
                                                                "B7: effective_scope_note string on allow");

// ─── Finish ────────────────────────────────────────────────────────────────

finish();
