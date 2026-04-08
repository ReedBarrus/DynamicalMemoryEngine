# Dynamical Memory Engine — Clock Align Floor Contract v0

## Status

This document defines the bounded clock-alignment floor contract for the rebuilt Door One temporal regime.

It is a supporting operator-architecture note.

It does **not** override:

* `README_MasterConstitution.md`
* `README_WorkflowContract.md`
* `README.StructuralIdentityLaw.md`
* `README.DeclaredVsMechanizedAudit.md`
* `README.MechanizationClosureGate.md`
* `README.PacketWorkflowChain.md`
* `README_DoorOneDevelopmentalOutline.md`
* `README/core/OperatorLane/README.OperatorLanesContract.md`
* `README/core/OperatorLane/TemporalRegime/README.PrimaryTemporalLaneContract.md`
* `README/core/OperatorLane/TemporalRegime/README.CompanionLaneFamilies.v0.md`
* `README/core/OperatorLane/TemporalRegime/README.IngestFloorContract.v0.md`
* `README.PrimaryPipelineArchitecture.v0.md`
* `README.PostTransformAdmissionCriteria.v0.md`

Its purpose is narrower:

* define the first corrective temporal remap floor after ingest,
* define the relationship between `P1`, `V1`, `L1`, `A1`, `D1`, `Plane-P1`, and deferred `T1`,
* define what clock alignment may lawfully do and not do,
* define the aligned-grid primary artifact as distinct from its accounting and diagnostics companions,
* and establish one concrete working proof floor for temporal remap that later operators can mirror upward.

This note governs **clock-alignment floor contract posture** only.

It does **not** govern:

* windowing semantics,
* transform semantics,
* downstream primary admission beyond `P1`,
* canon activation,
* or interpretation architecture.

---

## 1. Why this note exists

`P0` defines admission without correction, repair, or silent regularization.

That means `ClockAlignOp` is the first place where DME must explicitly answer:

* when admitted temporal structure may be remapped onto a regular grid,
* what kinds of corrective temporal operations are allowed,
* how those operations remain explicit rather than hidden,
* and how aligned primary structure remains separated from accounting, diagnostics, provenance, validation, and interpretation.

This note exists to define that floor directly.

One-line summary:

**Clock Align Floor Contract v0 defines the first lawful corrective temporal remap floor by separating aligned primary structure from declared application, observed residue, lineage, validation, and human projection.**

---

## 2. Core clock-alignment rule

**`ClockAlignOp` may remap admitted temporal structure onto a declared regular grid, including resampling or interpolation where explicitly allowed by declared alignment policy, but any such remap must remain explicit in companion lanes and must not be hidden as unexplained mutation inside primary output.**

Corollary rules:

* clock alignment is not raw admission,
* clock alignment is not interpretation,
* clock alignment is not silent repair,
* aligned output must not be mistaken for identical raw source,
* and alignment cleanliness must not outrun what the companion lanes actually declare and observe.

---

## 3. The clock-align floor classes

The clock-align floor consists of seven distinct classes:

1. `P1` — primary aligned temporal object
2. `V1` — validation companion
3. `L1` — lineage companion
4. `A1` — applied alignment/accounting companion
5. `D1` — diagnostics companion
6. `Plane-P1` — human-facing read-side projection
7. `T1` — tertiary companion, declared but deferred

Of these:

* `P1`, `V1`, `L1`, `A1`, and `D1` are emitted/runtime-side classes
* `Plane-P1` is a read-side projection class, not a runtime lane
* `T1` is recognized but not active on the current floor

---

## 4. What clock alignment is allowed to do

`ClockAlignOp` may perform only declared alignment-local operations.

Allowed operations:

* establish a declared regular temporal grid
* resample to a declared target sample rate
* interpolate missing temporal positions if explicitly allowed
* apply a declared gap policy
* apply a declared edge policy
* remap admitted temporal positions onto a declared alignment basis
* emit an aligned temporal slab under explicit constraint axes

Important rule:

Any corrective temporal remap performed by `ClockAlignOp` must be expressible as declared application in `A1` and observed technical facts in `D1`.

If the remap cannot be made explicit there, it is not lawful here.

---

## 5. What clock alignment is forbidden to do

`ClockAlignOp` may not:

* silently repair
* silently densify
* silently smooth
* silently choose one policy by convenience
* silently collapse irregularity into “clean” output
* imply that aligned output is identical to the raw admitted source
* hide residue in `P1`
* emit accounting, diagnostics, or provenance fields on the primary artifact
* emit interpretive posture as part of the aligned structural object

If such behavior occurs, the floor has failed.

---

## 6. P1 — Primary aligned temporal object

## 6.1 Purpose

`P1` exists to answer:

**What temporal structure exists on the declared aligned grid?**

## 6.2 Claim posture

`P1` is descriptive/structural only.

It remains below:

* provenance claims,
* accounting claims,
* diagnostics claims,
* memory claims,
* identity claims,
* and review posture.

`P1` must not imply:

* this is what the source really was,
* this is the raw admitted object unchanged,
* or this is identity-preserving by default.

It should imply only:

* this is the aligned temporal slab produced under declared alignment policy from admitted upstream structure.

## 6.3 Allowed P1 shape

```ts
type P1_ClockAlignedFrame = {
  lane: "P";
  artifact_class: "P1_ClockAlignedFrame";
  primary_handle: string;
  upstream_primary_handle: string;

  grid_t0: number;
  Fs: number;
  n: number;
  x: number[];
};
```

## 6.4 Notes

* `t` may be omitted if fully and exactly derivable from `grid_t0`, `Fs`, and `n`
* omission of explicit `t` is lawful only if reconstructible without ambiguity
* `P1` contains only aligned primary temporal structure
* alignment method, interpolation method, gap policy, and residual irregularity do **not** belong on `P1`

## 6.5 Forbidden P1 content

`P1` must not contain:

* provenance blocks
* policy blocks
* alignment receipts
* interpolation mode
* gap policy
* edge policy
* drift estimates
* offset estimates
* residuals
* fill counts
* dropped sample counts
* confidence
* uncertainty
* review posture
* semantic labels

---

## 7. V1 — Validation companion

## 7.1 Purpose

`V1` exists to answer:

**Did `P1` satisfy the declared clock-align floor contract?**

Validation is contract conformance, not diagnostics.

## 7.2 Allowed V1 shape

```ts
type V1_ClockAlignValidation = {
  lane: "V";
  validation_class: "V1_ClockAlignValidation";
  primary_handle: string;

  status: "pass" | "fail";
  checks: {
    required_fields_present: boolean;
    forbidden_fields_absent: boolean;
    fs_positive: boolean;
    grid_t0_finite: boolean;
    n_matches_x_length: boolean;
    x_numeric: boolean;
    upstream_primary_handle_present: boolean;
  };

  failure_codes: string[];
};
```

## 7.3 Validation examples

Examples of validation concerns:

* are required fields present?
* are forbidden fields absent?
* is `Fs > 0`?
* is `grid_t0` finite?
* does `n === x.length`?
* is `x` a numeric array?

Validation does **not** answer:

* how much drift was corrected,
* how many fills occurred,
* whether interpolation coverage was heavy,
* or how much residue remains.

Those are diagnostics or accounting questions.

---

## 8. L1 — Lineage companion

## 8.1 Purpose

`L1` exists to answer:

**What `P0` did this aligned object come from, and what alignment event links them?**

## 8.2 Floor-local v0 shape

```ts
type L1_ClockAlignLineage = {
  lane: "L";
  lineage_class: "L1_ClockAlignLineage";
  companion_handle: string;
  primary_handle: string;

  upstream_primary_handle: string;
  upstream_lineage_handle?: string;

  alignment_event_id: string;
  operator_id: "ClockAlignOp";
  operator_version: string;
};
```

## 8.3 L1 role boundary

`L1` may trace source-to-aligned lineage.
It may not carry:

* accounting,
* diagnostics,
* validation results,
* or interpretation.

---

## 9. A1 — Applied alignment/accounting companion

## 9.1 Purpose

`A1` exists to answer:

**What alignment operation was declared and/or applied at the clock-align boundary?**

## 9.2 Floor-local v0 shape

```ts
type A1_ClockAlignApplication = {
  lane: "A";
  accounting_class: "A1_ClockAlignApplication";
  companion_handle: string;
  primary_handle: string;

  target_sample_rate_hz: number;
  alignment_mode: "grid_align" | "resample" | "interpolate_resample";
  interpolation_mode: "none" | "nearest" | "linear" | "sinc" | "other_declared";
  gap_policy: "none" | "hold" | "linear_fill" | "drop" | "other_declared";
  edge_policy: "truncate" | "pad" | "hold" | "other_declared";
  grid_source: "declared" | "derived_from_p0";

  non_claims: ["not_raw_source", "not_identity_preserving_by_default"];
};
```

## 9.3 A1 role boundary

`A1` records what was declared and/or applied.
It may not carry:

* provenance,
* diagnostics,
* validation,
* or interpretation.

If grid_source is derived_from_p0, the derivation rule must be deterministic and declared at the A1 boundary.

---

## 10. D1 — Diagnostics companion

## 10.1 Purpose

`D1` exists to answer:

**What technical facts were observed during or after alignment?**

## 10.2 Floor-local v0 shape

```ts
type D1_ClockAlignDiagnostics = {
  lane: "D";
  diagnostics_class: "D1_ClockAlignDiagnostics";
  companion_handle: string;
  primary_handle: string;

  repeated_timestamp_count?: number;
  non_monotonic_timestamp_count?: number;
  estimated_gap_count?: number;

  drift_estimate_ppm?: number;
  offset_estimate_ms?: number;
  fill_count?: number;
  dropped_sample_count?: number;
  interpolation_coverage_ratio?: number;
  residual_irregularity_score?: number;
};
```

## Diagnostics sufficiency rule

`D1` must expose sufficient information to understand the magnitude and nature of alignment-induced deviation from admitted upstream structure.

Diagnostics that are technically present but insufficient to reveal the practical residue of alignment do not satisfy this floor.

## 10.3 Diagnostic role boundary

Diagnostics are technical observations.
They are not:

* validation pass/fail judgments,
* provenance,
* accounting,
* or interpretation.

One-line distinction:

**`A1` says what alignment was declared/applied. `D1` says what technical residue or corrective activity was observed.**


---

## 11. Plane-P1 — Human-facing read-side projection

## 11.1 Purpose

`Plane-P1` exists to answer:

**How can a human inspect `P1` directly as aligned temporal structure without lane contamination?**

## 11.2 Projection status

`Plane-P1` is a read-side projection class.
It is not a runtime emission lane.

## 11.3 Allowed Plane-P1 shape

```ts
type PlaneP1TemporalView = {
  plane_class: "PlaneP1TemporalView";
  primary_handle: string;

  x_axis: "time";
  y_axis: "signal";

  grid_t0: number;
  Fs: number;
  n: number;
  x: number[];
};
```

## 11.4 Plane rule

A human-facing structural projection of `P1` should render the aligned primary object directly.

Companion classes such as `V1`, `L1`, `A1`, and `D1` may be shown only as explicitly demoted, toggleable side surfaces.

Primary visual access must not depend on companion-lane hydration.

---

## 12. T1 — Tertiary companion

## 12.1 Purpose

`T1` exists to answer:

**What review, advisory, semantic, or interpretive posture is being expressed about the aligned object?**

## 12.2 v0 posture

At the clock-align floor, `T1` is declared but deferred.

A placeholder declaration shape is sufficient:

```ts
type T1_Deferred = {
  lane: "T";
  tertiary_class: "T1_Deferred";
  companion_handle: string;
  primary_handle: string;

  status: "declared_but_deferred";
};
```

## 12.3 T1 role boundary

`T1` is not active on the current rebuilt floor.

---

## 13. Clock-align floor handshake rule

At the clock-align floor:

* `P1` is the handoff object to the next primary operator
* `V1` validates that handoff object against contract
* `L1` traces its origin and alignment event
* `A1` records what was declared/applied
* `D1` records technical observations and residue
* `Plane-P1` lets a human inspect it directly
* `T1` remains declared but deferred

These classes may refer to the same `primary_handle`, but they must not collapse into one another.

---

## 14. Accounting vs diagnostics distinction

This distinction is active law at the clock-align floor.

### Accounting

Asks:

**What was declared and/or applied?**

Examples:

* target sample rate
* alignment mode
* interpolation mode
* gap policy
* edge policy

### Diagnostics

Asks:

**What technical facts or residue were observed?**

Examples:

* repeated timestamps
* estimated gaps
* drift estimate
* fill count
* dropped sample count
* interpolation coverage
* residual irregularity

This distinction must remain explicit.

---

## 15. Clock-align floor edge law

The downstream primary consumer of `P1` must be able to consume `P1` without consulting `V1`, `L1`, `A1`, `D1`, or `T1`.

If the downstream operator requires a companion object in order to understand the primary aligned structure, the floor has failed.

---

## 16. Deferred pressure notes

The clock-align floor intentionally does **not** solve:

* windowing
* transform-domain remapping
* memory/identity claims about alignment continuity
* semantic posture about alignment quality

These pressures are real, but they are deferred to later operators or later lanes.

This is a floor discipline choice, not a claim that the deferred pressures are unimportant.

---

## 17. Non-goals

This note does not yet define:

* exact alignment policy taxonomy,
* exact interpolation policy vocabulary beyond the bounded floor shape,
* windowing contract,
* transform contract,
* or downstream post-transform admission.

Those require later bounded notes.

---

## 18. One-line operational summary

**Clock Align Floor Contract v0 defines `P1` as the aligned temporal slab emitted under declared grid-alignment policy, with application, diagnostics, lineage, validation, human projection, and deferred tertiary posture kept explicitly distinct from the primary object.**
