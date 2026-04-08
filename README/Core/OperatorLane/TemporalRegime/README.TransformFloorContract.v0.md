# Dynamical Memory Engine — Transform Floor Contract v0

## Status

This document defines the bounded transform floor contract for the rebuilt Door One temporal regime.

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
* `README/core/OperatorLane/TemporalRegime/README.WindowFloorContract.v0.md`
* `README.PrimaryPipelineArchitecture.v0.md`
* `README.PostTransformAdmissionCriteria.v0.md`

Its purpose is narrower:

* define the bounded transform floor after windowing,
* define the relationship between `P3`, `V3`, `L3`, `A3`, `D3`, `Plane-P3`, `Plane-D3`, and deferred `T3`,
* define what transform may lawfully do and not do,
* define direct transform-domain geometry as distinct from transform accounting, diagnostics, and convenience-derived views,
* and establish one concrete working proof floor for representational remap without primary contamination.

This note governs **transform-floor contract posture** only.

It does **not** govern:

* downstream primary admission beyond `P3`,
* canon activation,
* or interpretation architecture.

---

## 1. Why this note exists

`P2` defines bounded windowed temporal structure under declared segmentation and windowing law.

That means `TransformOp` is the first place where the rebuilt temporal regime crosses into a new representational geometry.

This floor therefore has two simultaneous pressures:

* remap pressure,
* and convenience-view pressure.

Without an explicit contract, transform often drifts into:

* mixed primary artifacts carrying both direct and derived geometry,
* transform-quality fields riding on the main structural object,
* convenience-derived magnitude/phase being mistaken for primary substance,
* or transform-side interpretation appearing too early.

This note exists to block that drift.

One-line summary:

**Transform Floor Contract v0 defines transform as a representational remap problem, not an interpretation problem, and keeps emitted transform frames primary-pure even while allowing derived diagnostic geometry outside the primary object.**

---

## 2. Core transform rule

**`TransformOp` may remap a bounded windowed temporal frame into declared transform-domain geometry under explicit transform policy, but the transform description, diagnostics, validation residue, and convenience-derived views must remain outside the primary artifact.**

Corollary rules:

* transform is remap, not interpretation,
* transform is not quality judgment,
* transform must not smuggle convenience-derived views onto `P3`,
* and transform-side diagnostics or projection richness must not inflate primary substance.

---

## 3. Direct-vs-derived geometry rule

**`P3` must contain only direct transform-domain geometry emitted by the transform operation. Convenience-derived views of that geometry, including polar-form projections such as magnitude and phase, must remain outside the primary artifact unless later law explicitly promotes them.**

At this floor:

* `re` and `im` are primary transform-domain geometry,
* `magnitude` and `phase` are diagnostic/read-side derived geometry,
* and derived vector or phase-space projection is not primary structure.

---

## 4. The transform floor classes

The transform floor consists of eight distinct classes:

1. `P3` — primary transform-domain object
2. `V3` — validation companion
3. `L3` — lineage companion
4. `A3` — transform/accounting companion
5. `D3` — diagnostics companion
6. `Plane-P3` — human-facing read-side projection of primary Cartesian geometry
7. `Plane-D3` — human-facing read-side projection of derived diagnostic geometry
8. `T3` — tertiary companion, declared but deferred

Of these:

* `P3`, `V3`, `L3`, `A3`, and `D3` are emitted/runtime-side classes
* `Plane-P3` and `Plane-D3` are read-side projection classes, not runtime lanes
* `T3` is recognized but not active on the current floor

---

## 5. What transform is allowed to do

`TransformOp` may perform only declared transform-local operations.

Allowed operations:

* apply a declared transform kind to a bounded windowed frame
* emit direct transform-domain Cartesian geometry
* establish transform-local frequency/bin coordinates
* use a declared normalization mode
* use a declared numeric precision regime
* emit one transform-domain primary object from one bounded upstream window frame

Important rule:

Any transform policy or execution-mode choice performed by `TransformOp` must be expressible in `A3`, and any transform-side residue or technical facts must be expressible in `D3`.

If that supporting information cannot be made explicit there, it is not lawful here.

---

## 6. What transform is forbidden to do

`TransformOp` may not:

* silently attach convenience-derived magnitude/phase to `P3`
* silently attach transform-quality posture to `P3`
* silently attach Parseval or leakage fields to `P3`
* silently restate upstream window policy as if it were transform substance
* silently choose convenience projections as primary output
* emit accounting, diagnostics, provenance, or interpretation fields on the primary artifact
* emit semantic posture as part of the transform structural object

If such behavior occurs, the floor has failed.

---

## 7. P3 — Primary transform-domain object

## 7.1 Purpose

`P3` exists to answer:

**What direct transform-domain structure was emitted from the bounded windowed frame?**

## 7.2 Claim posture

`P3` is descriptive/structural only.

It remains below:

* provenance claims,
* accounting claims,
* diagnostics claims,
* memory claims,
* identity claims,
* and review posture.

`P3` must not imply:

* this is the best or most readable transform view,
* this is already a polar-form projection,
* or this output carries transform-quality judgment by default.

It should imply only:

* this is the direct Cartesian transform-domain geometry emitted under declared transform law from a bounded upstream window frame.

## 7.3 Allowed P3 shape

```ts
type P3_SpectralFrame = {
  lane: "P";
  artifact_class: "P3_SpectralFrame";
  primary_handle: string;
  upstream_primary_handle: string;

  window_id: string;

  Fs: number;
  n: number;
  df: number;

  bins: Array<{
    k: number;
    f: number;
    re: number;
    im: number;
  }>;
};
```

## 7.4 Notes

* `P3` keeps only Cartesian transform-domain components: `re` and `im`
* `magnitude` and `phase` do **not** belong on `P3`
* `P3` contains only direct transform-domain geometry plus minimum frame identity needed for downstream consumption
* transform quality, convenience views, and transform-side residue remain outside `P3`

## 7.5 Forbidden P3 content

`P3` must not contain:

* `magnitude`
* `phase`
* provenance blocks
* policy blocks
* transform receipts
* Parseval error
* leakage estimate
* padded length
* NaN/Inf flags
* confidence
* uncertainty
* review posture
* semantic labels

---

## 8. V3 — Validation companion

## 8.1 Purpose

`V3` exists to answer:

**Did `P3` satisfy the declared transform-floor contract?**

Validation is contract conformance, not transform-quality evaluation.

## 8.2 Allowed V3 shape

```ts
type V3_TransformValidation = {
  lane: "V";
  validation_class: "V3_TransformValidation";
  primary_handle: string;

  status: "pass" | "fail";
  checks: {
    required_fields_present: boolean;
    forbidden_fields_absent: boolean;
    fs_positive: boolean;
    n_positive: boolean;
    df_positive: boolean;
    bins_present: boolean;
    bins_numeric: boolean;
    window_id_present: boolean;
    upstream_primary_handle_present: boolean;
  };

  failure_codes: string[];
};
```

## 8.3 Validation examples

Examples of validation concerns:

* are required fields present?
* are forbidden fields absent?
* is `Fs > 0`?
* is `n > 0`?
* is `df > 0`?
* is `bins` present?
* are bin values numeric?
* is `window_id` present?

Validation does **not** answer:

* how much leakage occurred,
* whether energy was well preserved,
* whether the transform is visually clear,
* or whether a polar projection would be more readable.

Those are diagnostics or read-side projection questions.

---

## 9. L3 — Lineage companion

## 9.1 Purpose

`L3` exists to answer:

**What `P2` did this transform object come from, and what transform event links them?**

## 9.2 Floor-local v0 shape

```ts
type L3_TransformLineage = {
  lane: "L";
  lineage_class: "L3_TransformLineage";
  companion_handle: string;
  primary_handle: string;

  upstream_primary_handle: string;
  upstream_lineage_handle?: string;

  transform_event_id: string;
  operator_id: "TransformOp";
  operator_version: string;
};
```

## 9.3 L3 role boundary

`L3` may trace window-to-transform lineage.
It may not carry:

* accounting,
* diagnostics,
* validation results,
* or interpretation.

---

## 10. A3 — Transform/accounting companion

## 10.1 Purpose

`A3` exists to answer:

**What transform operation was declared and/or applied at the transform boundary?**

## 10.2 Floor-local v0 shape

```ts
type A3_TransformApplication = {
  lane: "A";
  accounting_class: "A3_TransformApplication";
  companion_handle: string;
  primary_handle: string;

  transform_kind: "dft" | "fft" | "rfft" | "other_declared";
  transform_domain: "complex_cartesian";
  normalization_mode: "none" | "unitary" | "forward" | "inverse" | "other_declared";
  numeric_precision: "float32" | "float64" | "other_declared";
  bin_generation_mode: "full" | "half_spectrum" | "other_declared";

  non_claims: ["not_interpretation", "not_quality_by_default", "not_polar_view_by_default"];
};
```

## 10.3 A3 role boundary

`A3` records what transform was declared and/or applied.
It may not carry:

* provenance,
* diagnostics,
* validation,
* or interpretation.

---

## 11. D3 — Diagnostics companion

## 11.1 Purpose

`D3` exists to answer:

**What transform-side technical facts and optional derived diagnostic geometry were observed during or after transform emission?**

## 11.2 Floor-local v0 shape

```ts
type D3_TransformDiagnostics = {
  lane: "D";
  diagnostics_class: "D3_TransformDiagnostics";
  companion_handle: string;
  primary_handle: string;

  residue: {
    parseval_error?: number;
    leakage_estimate?: number;
    padded_length?: number;
    nan_detected?: boolean;
    inf_detected?: boolean;
  };

  derived_geometry?: {
    magnitude: Array<{ k: number; f: number; value: number }>;
    phase: Array<{ k: number; f: number; value: number }>;
  };
};
```

## 11.3 Diagnostic role boundary

Diagnostics are technical observations and optional derived diagnostic geometry.
They are not:

* primary structure,
* provenance,
* accounting,
* validation,
* or interpretation.

One-line distinction:

**`D3` may expose transform-side residue and optional derived diagnostic geometry, but it does not redefine what `P3` is.**

## 11.4 Diagnostics sufficiency rule

`D3` must expose sufficient information to understand practical transform-side residue where transform health is at issue.

Diagnostics that are technically present but insufficient to reveal meaningful transform-side deviation or boundary artifacts do not satisfy this floor.

Derived diagnostic geometry, if present, must remain clearly subordinate to the primary Cartesian object.

---

## 12. Plane-P3 — Human-facing read-side projection of primary geometry

## 12.1 Purpose

`Plane-P3` exists to answer:

**How can a human inspect `P3` directly as Cartesian transform-domain structure without lane contamination?**

## 12.2 Projection status

`Plane-P3` is a read-side projection class.
It is not a runtime emission lane.

## 12.3 Allowed Plane-P3 shape

```ts
type PlaneP3SpectralView = {
  plane_class: "PlaneP3SpectralView";
  primary_handle: string;

  x_axis: "frequency";
  y_axis: "complex_component";

  Fs: number;
  n: number;
  df: number;

  bins: Array<{
    k: number;
    f: number;
    re: number;
    im: number;
  }>;
};
```

## 12.4 Plane rule

A human-facing structural projection of `P3` should render Cartesian primary geometry directly.

Companion classes such as `V3`, `L3`, `A3`, and `D3` may be shown only as explicitly demoted, toggleable side surfaces.

Primary visual access must not depend on companion-lane hydration.

---

## 13. Plane-D3 — Human-facing read-side projection of diagnostic geometry

## 13.1 Purpose

`Plane-D3` exists to answer:

**How can a human inspect derived diagnostic geometry and transform-side threshold/boundary artifacts without mistaking them for primary structure?**

## 13.2 Projection status

`Plane-D3` is a read-side projection class.
It is not a runtime emission lane.

## 13.3 Allowed Plane-D3 shape

```ts
type PlaneD3DiagnosticView = {
  plane_class: "PlaneD3DiagnosticView";
  primary_handle: string;
  diagnostics_handle: string;

  x_axis: "frequency";
  y_axis: "derived_diagnostic_value";

  magnitude?: Array<{ k: number; f: number; value: number }>;
  phase?: Array<{ k: number; f: number; value: number }>;

  nan_detected?: boolean;
  inf_detected?: boolean;
};
```

## 13.4 Plane rule

`Plane-D3` may render optional derived diagnostic geometry such as magnitude and phase, and may render diagnostic threshold or boundary artifacts such as NaN/Inf conditions.

It must remain explicitly diagnostic and demoted relative to `Plane-P3`.

`Plane-D3` must not imply that the rendered diagnostic geometry is primary transform substance.

---

## 14. T3 — Tertiary companion

## 14.1 Purpose

`T3` exists to answer:

**What review, advisory, semantic, or interpretive posture is being expressed about the transform object?**

## 14.2 v0 posture

At the transform floor, `T3` is declared but deferred.

A placeholder declaration shape is sufficient:

```ts
type T3_Deferred = {
  lane: "T";
  tertiary_class: "T3_Deferred";
  companion_handle: string;
  primary_handle: string;

  status: "declared_but_deferred";
};
```

## 14.3 T3 role boundary

`T3` is not active on the current rebuilt floor.

---

## 15. Transform-floor handshake rule

At the transform floor:

* `P3` is the handoff object to the post-transform boundary
* `V3` validates that handoff object against contract
* `L3` traces its origin and transform event
* `A3` records what transform was declared/applied
* `D3` records transform-side residue and optional derived diagnostic geometry
* `Plane-P3` lets a human inspect the primary Cartesian object directly
* `Plane-D3` lets a human inspect derived diagnostic geometry explicitly as diagnostics
* `T3` remains declared but deferred

These classes may refer to the same `primary_handle`, but they must not collapse into one another.

---

## 16. Accounting vs diagnostics distinction

This distinction is active law at the transform floor.

### Accounting

Asks:

**What transform operation was declared and/or applied?**

Examples:

* transform kind
* normalization mode
* numeric precision
* bin generation mode

### Diagnostics

Asks:

**What transform-side residue or optional derived diagnostic geometry was observed?**

Examples:

* Parseval error
* leakage estimate
* padded length
* NaN/Inf conditions
* derived magnitude
* derived phase

This distinction must remain explicit.

---

## 17. Transform-floor edge law

The downstream post-transform admission boundary must be able to consume `P3` without consulting `V3`, `L3`, `A3`, `D3`, `Plane-P3`, `Plane-D3`, or `T3`.

If a downstream structural consumer requires a companion or plane object in order to understand the primary transform structure, the floor has failed.

---

## 18. Deferred pressure notes

The transform floor intentionally does **not** solve:

* post-transform compression admission
* post-transform merge admission
* anomaly interpretation
* semantic posture about spectral meaning
* memory/identity claims about transform continuity

These pressures are real, but they are deferred to later operators, later lanes, or later admission notes.

This is a floor discipline choice, not a claim that the deferred pressures are unimportant.

---

## 19. Non-goals

This note does not yet define:

* post-transform primary artifact families beyond `P3`,
* final downstream admission after transform,
* or any review/interpretive transform family.

Those require later bounded notes.

---

## 20. One-line operational summary

**Transform Floor Contract v0 defines `P3` as direct transform-domain Cartesian geometry emitted under declared transform law, with validation, lineage, transform accounting, diagnostics, human projection, derived diagnostic projection, and deferred tertiary posture kept explicitly distinct from the primary object.**
