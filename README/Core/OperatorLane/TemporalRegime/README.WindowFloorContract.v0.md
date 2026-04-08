# Dynamical Memory Engine — Window Floor Contract v0

## Status

This document defines the bounded windowing floor contract for the rebuilt Door One temporal regime.

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
* `README/core/OperatorLane/TemporalRegime/README.ClockAlignFloorContract.v0.md`
* `README.PrimaryPipelineArchitecture.v0.md`
* `README.PostTransformAdmissionCriteria.v0.md`

Its purpose is narrower:

* define the bounded windowing floor after clock alignment,
* define the relationship between `P2`, `V2`, `L2`, `A2`, `D2`, `Plane-P2`, and deferred `T2`,
* define what windowing may lawfully do and not do,
* define bounded segmentation as distinct from evaluation,
* and establish one concrete working proof floor for primary multiplicity without primary contamination.

This note governs **window-floor contract posture** only.

It does **not** govern:

* transform semantics,
* downstream primary admission beyond `P2`,
* canon activation,
* or interpretation architecture.

---

## 1. Why this note exists

`P1` defines the aligned temporal slab under declared alignment law.

That means `WindowOp` is the first place where one upstream primary object may lawfully emit many downstream primary objects.

This floor therefore has two pressures at once:

* segmentation pressure,
* and evaluation temptation.

Without an explicit contract, windowing often drifts into:

* salience selection,
* stationarity scoring,
* “meaningful window” language,
* or mixed objects carrying both raw and windowed vectors.

This note exists to block that drift.

One-line summary:

**Window Floor Contract v0 defines windowing as a bounded segmentation problem, not an evaluation problem, and keeps emitted window frames primary-pure even under one-to-many expansion.**

---

## 2. Core windowing rule

**`WindowOp` may lawfully partition aligned temporal structure into bounded primary frames under declared segmentation and windowing policy, but any rationale, evaluation, or quality judgment about those frames must remain outside the primary artifact.**

Corollary rules:

* windowing is segmentation, not evaluation,
* windowing is not salience selection,
* windowing is not stationarity judgment,
* windowing must not smuggle narrative or quality posture onto `P2`,
* and each emitted frame must remain primary-pure and independently consumable.

---

## 3. The window floor classes

The window floor consists of seven distinct classes:

1. `P2` — primary windowed temporal object
2. `V2` — validation companion
3. `L2` — lineage companion
4. `A2` — windowing/accounting companion
5. `D2` — diagnostics companion
6. `Plane-P2` — human-facing read-side projection
7. `T2` — tertiary companion, declared but deferred

Of these:

* `P2`, `V2`, `L2`, `A2`, and `D2` are emitted/runtime-side classes
* `Plane-P2` is a read-side projection class, not a runtime lane
* `T2` is recognized but not active on the current floor

---

## 4. What windowing is allowed to do

`WindowOp` may perform only declared segmentation-local operations.

Allowed operations:

* partition an aligned temporal slab into bounded frames
* apply a declared window function to each emitted frame
* use a declared frame length
* use a declared hop length
* apply a declared boundary policy
* emit one or more bounded primary window frames from one upstream aligned object

Important rule:

Any segmentation policy or frame-construction choice performed by `WindowOp` must be expressible in `A2`, and any mechanical frame-condition facts must be expressible in `D2`.

If that supporting information cannot be made explicit there, it is not lawful here.

---

## 5. What windowing is forbidden to do

`WindowOp` may not:

* silently choose “better” windows
* silently score salience and treat it as structure
* silently score stationarity and treat it as structure
* silently retain both raw and windowed vectors on `P2`
* silently exclude or privilege frames based on evaluative criteria
* hide construction residue or frame-condition facts inside `P2`
* emit accounting, diagnostics, or provenance fields on the primary artifact
* emit interpretive posture as part of the segmented structural object

If such behavior occurs, the floor has failed.

---

## 6. P2 — Primary windowed temporal object

## 6.1 Purpose

`P2` exists to answer:

**What bounded windowed temporal structure was emitted?**

## 6.2 Claim posture

`P2` is descriptive/structural only.

It remains below:

* provenance claims,
* accounting claims,
* diagnostics claims,
* memory claims,
* identity claims,
* and review posture.

`P2` must not imply:

* this is the raw pre-window segment,
* this is the best or most meaningful frame,
* or this frame is privileged by quality judgment.

It should imply only:

* this is the bounded windowed temporal frame emitted under declared segmentation and windowing law from aligned upstream structure.

## 6.3 Allowed P2 shape

```ts
type P2_WindowFrame = {
  lane: "P";
  artifact_class: "P2_WindowFrame";
  primary_handle: string;
  upstream_primary_handle: string;

  window_id: string;

  grid_t0: number;
  Fs: number;
  n: number;

  x: number[];
};
```

## 6.4 Notes

* `x` is the emitted windowed vector only
* the raw pre-window vector does **not** belong on `P2`
* `hop_n` does **not** belong on `P2`; it belongs in `A2` as segmentation/application policy
* `P2` contains only the bounded windowed temporal slab and the minimum local frame identity needed for downstream consumption

## 6.5 Forbidden P2 content

`P2` must not contain:

* raw aligned slice vectors
* provenance blocks
* policy blocks
* window receipts
* `hop_n`
* boundary policy
* segmentation mode
* salience scores
* stationarity scores
* selection reasons
* clipped/padded flags
* gap summaries
* confidence
* uncertainty
* review posture
* semantic labels

---

## 7. V2 — Validation companion

## 7.1 Purpose

`V2` exists to answer:

**Did `P2` satisfy the declared window-floor contract?**

Validation is contract conformance, not diagnostics.

## 7.2 Allowed V2 shape

```ts
type V2_WindowValidation = {
  lane: "V";
  validation_class: "V2_WindowValidation";
  primary_handle: string;

  status: "pass" | "fail";
  checks: {
    required_fields_present: boolean;
    forbidden_fields_absent: boolean;
    fs_positive: boolean;
    grid_t0_finite: boolean;
    n_matches_x_length: boolean;
    x_numeric: boolean;
    window_id_present: boolean;
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
* is `window_id` present?

Validation does **not** answer:

* whether the frame was salient,
* whether the frame was stationary,
* whether padding occurred,
* or whether the frame is high-quality.

Those are diagnostics or deferred interpretation pressures.

---

## 8. L2 — Lineage companion

## 8.1 Purpose

`L2` exists to answer:

**What `P1` did this windowed object come from, and what window event links them?**

## 8.2 Floor-local v0 shape

```ts
type L2_WindowLineage = {
  lane: "L";
  lineage_class: "L2_WindowLineage";
  companion_handle: string;
  primary_handle: string;

  upstream_primary_handle: string;
  upstream_lineage_handle?: string;

  window_event_id: string;
  operator_id: "WindowOp";
  operator_version: string;
};
```

## 8.3 L2 role boundary

`L2` may trace aligned-to-window lineage.
It may not carry:

* accounting,
* diagnostics,
* validation results,
* or interpretation.

---

## 9. A2 — Windowing/accounting companion

## 9.1 Purpose

`A2` exists to answer:

**What segmentation and windowing operation was declared and/or applied at the window boundary?**

## 9.2 Floor-local v0 shape

```ts
type A2_WindowApplication = {
  lane: "A";
  accounting_class: "A2_WindowApplication";
  companion_handle: string;
  primary_handle: string;

  window_function: "hann" | "hamming" | "rectangular" | "other_declared";
  window_length_n: number;
  hop_n: number;
  boundary_policy: "truncate" | "pad" | "drop" | "other_declared";
  segmentation_mode: "sliding" | "fixed" | "other_declared";

  non_claims: ["not_raw_segment", "not_selection_or_quality_by_default"];
};
```

## 9.3 A2 role boundary

`A2` records what segmentation/windowing was declared and/or applied.
It may not carry:

* provenance,
* diagnostics,
* validation,
* or interpretation.

---

## 10. D2 — Diagnostics companion

## 10.1 Purpose

`D2` exists to answer:

**What mechanical frame-condition facts were observed during or after windowing?**

## 10.2 Floor-local v0 shape

```ts
type D2_WindowDiagnostics = {
  lane: "D";
  diagnostics_class: "D2_WindowDiagnostics";
  companion_handle: string;
  primary_handle: string;

  padded: boolean;
  clipped: boolean;
  estimated_gap_count?: number;
  gap_total_duration?: number;
  missing_ratio?: number;
};
```

## 10.3 Diagnostic role boundary

Diagnostics are mechanical observations.
They are not:

* salience judgments,
* stationarity judgments,
* selection narratives,
* provenance,
* accounting,
* validation,
* or interpretation.

One-line distinction:

**`D2` says what mechanical frame-condition facts were observed, not what the frame means or how valuable it is.**

## 10.4 Diagnostics sufficiency rule

`D2` must expose sufficient information to understand the practical construction condition of the emitted frame.

Diagnostics that are technically present but insufficient to reveal whether padding, clipping, or missingness materially affected the frame do not satisfy this floor.

---

## 11. Plane-P2 — Human-facing read-side projection

## 11.1 Purpose

`Plane-P2` exists to answer:

**How can a human inspect `P2` directly as a bounded windowed temporal frame without lane contamination?**

## 11.2 Projection status

`Plane-P2` is a read-side projection class.
It is not a runtime emission lane.

## 11.3 Allowed Plane-P2 shape

```ts
type PlaneP2TemporalView = {
  plane_class: "PlaneP2TemporalView";
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

A human-facing structural projection of `P2` should render the bounded windowed frame directly.

Companion classes such as `V2`, `L2`, `A2`, and `D2` may be shown only as explicitly demoted, toggleable side surfaces.

Primary visual access must not depend on companion-lane hydration.

---

## 12. T2 — Tertiary companion

## 12.1 Purpose

`T2` exists to answer:

**What review, advisory, semantic, or interpretive posture is being expressed about the windowed object?**

## 12.2 v0 posture

At the window floor, `T2` is declared but deferred.

A placeholder declaration shape is sufficient:

```ts
type T2_Deferred = {
  lane: "T";
  tertiary_class: "T2_Deferred";
  companion_handle: string;
  primary_handle: string;

  status: "declared_but_deferred";
};
```

## 12.3 T2 role boundary

`T2` is not active on the current rebuilt floor.

---

## 13. Multiplicity law

Windowing is the first lawful one-to-many primary expansion.

This means:

* one `P1_ClockAlignedFrame` may emit many `P2_WindowFrame` objects,
* each emitted `P2_WindowFrame` must remain individually primary-pure,
* each emitted `P2_WindowFrame` must remain independently consumable by the downstream primary operator,
* and no `P2` frame may rely on a mixed parent object to remain intelligible.

Multiplicity is lawful.
Mixed inheritance is not.

---

## 14. Window-floor handshake rule

At the window floor:

* `P2` is the handoff object to the next primary operator
* `V2` validates that handoff object against contract
* `L2` traces its origin and window event
* `A2` records what segmentation/windowing was declared/applied
* `D2` records mechanical frame-condition facts
* `Plane-P2` lets a human inspect it directly
* `T2` remains declared but deferred

These classes may refer to the same `primary_handle`, but they must not collapse into one another.

---

## 15. Accounting vs diagnostics distinction

This distinction is active law at the window floor.

### Accounting

Asks:

**What segmentation/windowing operation was declared and/or applied?**

Examples:

* window function
* window length
* hop length
* boundary policy
* segmentation mode

### Diagnostics

Asks:

**What mechanical construction facts were observed about the emitted frame?**

Examples:

* padded
* clipped
* missing ratio
* estimated gap count
* gap duration

This distinction must remain explicit.

---

## 16. Window-floor edge law

The downstream primary consumer of `P2` must be able to consume `P2` without consulting `V2`, `L2`, `A2`, `D2`, or `T2`.

If the downstream operator requires a companion object in order to understand the primary windowed structure, the floor has failed.

---

## 17. Deferred pressure notes

The window floor intentionally does **not** solve:

* transform-domain remapping
* salience selection
* stationarity scoring
* semantic posture about frame meaning or importance
* memory/identity claims about segmented continuity

These pressures are real, but they are deferred to later operators or later lanes.

This is a floor discipline choice, not a claim that the deferred pressures are unimportant.

---

## 18. Non-goals

This note does not yet define:

* transform contract,
* evaluative frame metrics,
* final downstream admission beyond `P2`,
* or any review/interpretive window family.

Those require later bounded notes.

---

## 19. One-line operational summary

**Window Floor Contract v0 defines `P2` as a bounded windowed temporal frame emitted under declared segmentation and windowing law, with multiplicity, accounting, diagnostics, lineage, human projection, and deferred tertiary posture kept explicitly distinct from the primary object.**
