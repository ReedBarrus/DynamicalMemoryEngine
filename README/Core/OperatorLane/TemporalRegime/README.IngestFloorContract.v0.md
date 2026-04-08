# Dynamical Memory Engine — Ingest Floor Contract v0

## Status

This document defines the bounded ingest-floor contract for the rebuilt Door One base node.

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
* `README/core/OperatorLane/README.PrimaryTemporalLaneContract.md`
* `README.PrimaryPipelineArchitecture.v0.md`

Its purpose is narrower:

* define the first rebuilt operator floor at `IngestOp`,
* define the base-node relationship between `P0`, `V0`, `L0`, `D0`, and the primary human-facing projection,
* define what ingest is allowed to do and not do,
* define the constraint axes present at admission,
* and establish one concrete working proof floor that later operators can mirror.

This note governs **ingest-floor contract posture** only.

It does **not** govern:

* alignment semantics,
* windowing semantics,
* transform semantics,
* downstream primary admission beyond `P0`,
* canon activation,
* or interpretation architecture.

---

## 1. Why this note exists

The rebuilt pipeline now has lane law, primary-lane contracts, and a bounded primary architecture note.

What it still needs is a true base-node contract.

That base node must define:

* what ingest is,
* what ingest is not,
* what the first primary object actually contains,
* what validation does at the base,
* what lineage does at the base,
* what diagnostics do at the base,
* and how a human sees the base structure without contaminating it.

This note exists to provide that first concrete floor.

One-line summary:

**Ingest Floor Contract v0 defines the first rebuilt base node as one primary temporal admission object (`P0`) with explicit validation (`V0`), lineage (`L0`), diagnostics (`D0`), and a read-side projection plane that does not count as a runtime lane.**

---

## 2. Core ingest-floor rule

**`IngestOp` admits measurement into the system as bounded temporal structure under declared constraint axes, without corrective transformation, interpretation, or repair.**

Corollary rules:

* ingest is admission, not correction,
* ingest is ordering, not alignment,
* ingest is exposure, not inference,
* ingest is bounded structure, not support/report bundling,
* and ingest may not silently perform work that belongs to later operators.

---

## 3. The ingest-floor classes

The ingest floor consists of five distinct classes:

1. `P0` — primary structural admission object
2. `V0` — validation companion
3. `L0` — lineage companion
4. `D0` — diagnostics companion
5. `Plane-P0` — human-facing read-side projection

Of these:

* `P0`, `V0`, `L0`, and `D0` are emitted/runtime-side classes
* `Plane-P0` is a read-side projection class, not a runtime lane

---

## 4. Constraint-axis framing

The ingest floor is best understood through constraint axes rather than generic field names.

At v0, the ingest floor recognizes three base constraint axes:

* **time axis**
* **value axis**
* **source axis**

These do not all play the same role.

### 4.1 Time axis

The time axis answers:

**How is the admitted structure ordered and temporally located?**

Typical content:

* timestamps
* ordering relation
* temporal extent
* temporal spacing as admitted (not yet repaired)

### 4.2 Value axis

The value axis answers:

**What measured values occupy the admitted temporal positions?**

Typical content:

* sample values
* measurement amplitude/intensity/value sequence
* the actual scalar or vector payload being admitted

### 4.3 Source axis

The source axis answers:

**What source-local constraint anchor does this admitted structure belong to?**

Typical content:

* source-local reference handle
* source-local channel identity if needed
* source-local modality identity if needed
* source-local admission anchor

The source axis is not the same thing as the value axis.

The value axis describes **what values are present**.
The source axis describes **what source-bounded stream those values belong to**.

One-line distinction:

**The value axis carries the measured signal. The source axis carries the source-local identity constraint that tells the system which stream that signal belongs to.**

---

## 5. What ingest is allowed to do

`IngestOp` may perform only admission-local operations.

Allowed operations:

* acquisition/admission
* timestamp capture or acceptance
* ordering
* bounded framing identity
* lossless encoding or representation shaping that does not alter measured values
* explicit admission of already source-shaped data

Important clarification:

A real source object such as a `.wav` file may already embody source-side shaping or normalization before DME sees it.
That does **not** authorize `IngestOp` to perform new normalization itself.
It only changes what `L0` and `D0` may need to record about the source-local admission context.

---

## 6. What ingest is forbidden to do

`IngestOp` may not perform operations that alter, repair, interpret, or structurally upgrade the admitted measurement.

Forbidden operations:

* normalization performed by DME at ingest
* filtering
* interpolation
* resampling
* denoising
* repair
* semantic classification
* structural inference
* alignment
* windowing
* transform-domain remapping

If one of these occurs, the work belongs to another operator and not to `P0`.

---

## 7. P0 — Primary structural admission object

## 7.1 Purpose

`P0` exists to answer:

**What bounded temporal structure has been admitted into the rebuilt primary chain?**

## 7.2 Claim posture

`P0` is descriptive/structural only.

It remains below:

* support claims,
* memory claims,
* identity claims,
* diagnostics claims,
* and review posture.

## 7.3 Allowed P0 shape

```ts
type P0_IngestFrame = {
  lane: "P";
  artifact_class: "P0_IngestFrame";
  primary_handle: string;

  source_axis_ref: string;
  time_axis_ref: string;

  t: number[];
  x: number[];
};
```

## 7.4 Notes

* `source_axis_ref` is a minimal source-local identity anchor, not a full provenance bundle
* `time_axis_ref` is a local temporal constraint reference, not a global aligned master clock
* `t` preserves the admitted temporal structure as received/accepted
* `x` preserves the admitted measured values as received/accepted
* `P0` may preserve source-native irregularity; it is not yet aligned or repaired

## 7.5 Forbidden P0 content

`P0` must not contain:

* provenance blocks
* policy blocks
* receipts
* diagnostics
* residuals
* gap summaries
* duplicate timestamp summaries
* jitter summaries
* confidence
* uncertainty
* review posture
* semantic labels
* repaired or interpolated values
* normalized values produced by DME at ingest

---

## 8. V0 — Validation companion

## 8.1 Purpose

`V0` exists to answer:

**Did `P0` satisfy the declared ingest-floor contract?**

Validation is contract conformance, not diagnostics.

## 8.2 Allowed V0 shape

```ts
type V0_IngestValidation = {
  lane: "V";
  validation_class: "V0_IngestValidation";
  primary_handle: string;

  status: "pass" | "fail";
  checks: {
    required_fields_present: boolean;
    forbidden_fields_absent: boolean;
    t_x_same_length: boolean;
    t_numeric: boolean;
    x_numeric: boolean;
    time_axis_ref_present: boolean;
    source_axis_ref_present: boolean;
  };

  failure_codes: string[];
};
```

## 8.3 Validation examples

Examples of validation concerns:

* does `P0` contain only allowed fields?
* are required fields present?
* do `t` and `x` have the same length?
* are the arrays numeric?
* are the required axis refs present?

Validation does **not** answer:

* how much jitter exists,
* whether samples were likely missed,
* whether timestamps were repeated,
* or whether the source looks noisy.

Those are diagnostics questions.

---

## 9. L0 — Lineage companion

## 9.1 Purpose

`L0` exists to answer:

**Where did this admitted primary object come from?**

## 9.2 Allowed L0 content

Examples of lawful `L0` content:

* `primary_handle`
* source handle
* ingest event id
* operator id
* operator version
* source-local channel identity where needed
* source-local modality identity where needed

## 9.3 L0 role boundary

`L0` may trace origin.
It may not carry:

* diagnostics,
* accounting,
* validation results,
* or interpretation.

---

## 10. D0 — Diagnostics companion

## 10.1 Purpose

`D0` exists to answer:

**What measured technical facts can be observed about the admitted temporal structure or admission event?**

## 10.2 Diagnostics examples

Examples of lawful `D0` content:

* sample count
* min/max
* RMS
* repeated timestamp count
* non-monotonic timestamp count
* estimated gaps
* temporal irregularity indicators
* clipping indicators
* optional diagnostic frequency preview

## 10.3 Diagnostic role boundary

Diagnostics are technical observations.
They are not:

* validation pass/fail judgments,
* provenance,
* policy accounting,
* or interpretation.

One-line distinction:

**Validation asks whether the contract was satisfied. Diagnostics ask what technical facts were observed.**

---

## 11. Plane-P0 — Human-facing read-side projection

## 11.1 Purpose

`Plane-P0` exists to answer:

**How can a human inspect `P0` directly as temporal structure without lane contamination?**

## 11.2 Projection status

`Plane-P0` is a read-side projection class.
It is not a runtime emission lane.

## 11.3 Allowed Plane-P0 shape

```ts
type PlaneP0TemporalView = {
  plane_class: "PlaneP0TemporalView";
  primary_handle: string;

  x_axis: "time";
  y_axis: "signal";

  t: number[];
  x: number[];
};
```

## 11.4 Plane rule

A human-facing structural projection of `P0` should render the primary object directly.

Companion lanes such as `V0`, `L0`, and `D0` may be shown only as explicitly demoted, toggleable side surfaces.

Primary visual access must not depend on support or validation hydration.

---

## 12. Ingest-floor handshake rule

At the ingest floor:

* `P0` is the handoff object to the next primary operator
* `V0` validates that handoff object against contract
* `L0` traces its origin
* `D0` records technical observations
* `Plane-P0` lets a human inspect it directly

These classes may refer to the same `primary_handle`, but they must not collapse into one another.

---

## 13. Validation vs diagnostics distinction

This distinction is active law at the ingest floor.

### Validation

Asks:

**Did the object satisfy the contract?**

Examples:

* required fields present
* forbidden fields absent
* shape/type checks pass

### Diagnostics

Asks:

**What technical facts are observable about the admitted object or event?**

Examples:

* repeated timestamps
* missing-sample suspicion
* temporal irregularity
* clipping indicators
* signal summary facts

Repeated timestamps, missed samples, and jitter belong primarily to diagnostics, not validation.

---

## 14. Ingest-floor edge law

The downstream primary consumer of `P0` must be able to consume `P0` without consulting `V0`, `L0`, or `D0`.

If the downstream operator requires a companion object in order to understand the primary structure, the ingest floor has failed.

---

## 15. Deferred pressure notes

The ingest floor intentionally does **not** solve:

* alignment
* repair of irregular timing
* interpolation of gaps
* transform readiness by mutation of `P0`

Those pressures are real, but they are deferred to later operators.

This is a floor discipline choice, not a claim that the deferred pressures are unimportant.

---

## 16. Non-goals

This note does not yet define:

* exact `L0` full schema,
* exact `D0` diagnostic schema,
* exact operator implementation details,
* alignment policy,
* windowing policy,
* transform policy,
* or downstream post-transform admission.

Those require later bounded notes and packets.

---

## 17. One-line operational summary

**Ingest Floor Contract v0 defines `P0` as bounded temporal admission under time, value, and source constraint axes, with validation, lineage, diagnostics, and human-facing projection kept explicitly distinct from the primary object.**
