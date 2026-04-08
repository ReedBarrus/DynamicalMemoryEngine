# Dynamical Memory Engine — Operator Lanes Contract

## Status

This document defines the bounded lane architecture for operator emissions in Door One.

It is a supporting operator-governance note.

It does **not** override:

- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README.StructuralIdentityLaw.md`
- `README.DeclaredVsMechanizedAudit.md`
- `README.MechanizationClosureGate.md`
- `README.PacketWorkflowChain.md`
- `README_DoorOneDevelopmentalOutline.md`

Its purpose is narrower:

- define the lane model for operator emissions,
- prevent mixed artifacts from silently recombining structural, support, and review material,
- define what each lane is allowed to answer,
- define one-way derivation rules between lanes,
- and establish the field-hygiene floor for the first structural rebuild.

This note governs **operator emission lane law** only.

It does **not** govern:

- full artifact taxonomy,
- replay semantics,
- canon activation,
- semantic overlay policy by itself,
- or later Door Two interpretation architecture.

---

## 1. Why this note exists

Recent operator emission mapping showed that the current chain cannot be trusted merely by file role or module naming.

The core issue was not just that some modules were “mixed.”
The deeper problem was that the emitted artifacts themselves cohabited multiple jobs:

- structural exposure,
- provenance,
- policy/accounting,
- diagnostics,
- and later evaluative/review language.

That made purity easy to overread and difficult to verify mechanically.

This note exists to stop that failure mode at the contract level.

One-line summary:

**An operator artifact may not answer more than one lane job.**

---

## 2. Core rule

**Each emitted object in Door One must belong to exactly one lane, and each lane may answer exactly one bounded job.**

Corollary rules:

- primary structure is not provenance,
- provenance is not accounting,
- accounting is not diagnostics,
- diagnostics are not interpretation,
- and interpretation must never ride back onto the primary structural edge.

If an emitted object answers more than one lane question, it is mixed and fails this contract.

---

## 3. Lane family

The current lane family is:

- **P** — Primary structural exposure
- **L** — Lineage / provenance
- **A** — Applied transform / accounting
- **D** — Diagnostics / validation
- **T** — Tertiary review / interpretation

This note treats `L`, `A`, and `D` as a support family, but they must remain distinct from one another.

There is no single undifferentiated “support lane.”

---

## 4. Lane definitions

### 4.1 P — Primary structural exposure

Purpose:

- carry only the direct structural result of the operator’s transformation,
- preserve the structural spine of the pipeline,
- support human-facing structural planes directly,
- remain inspectable without provenance, policy, or review burden.

P answers only:

**What direct structural geometry did this operator emit?**

P must not answer:

- where did this come from?
- what policy was applied?
- how good was the execution?
- what should be inferred from this?

---

### 4.2 L — Lineage / provenance

Purpose:

- carry origin and lineage references only,
- preserve traceability between emitted structural objects,
- support chain auditability without polluting primary geometry.

L answers only:

**Where did this object come from?**

L must not answer:

- what operation was applied?
- how well did it execute?
- what should be concluded?

---

### 4.3 A — Applied transform / accounting

Purpose:

- carry declared and applied operator facts only,
- preserve what transform, alignment, windowing, or remap action was executed,
- keep operator execution description separate from geometry and lineage.

A answers only:

**What operation was declared and/or applied at this operator boundary?**

A must not answer:

- where did this come from?
- how well did it execute?
- what should be inferred?

---

### 4.4 D — Diagnostics / validation

Purpose:

- carry measured mechanical checks, residuals, and validation outcomes,
- support execution auditing and quality/health checks,
- remain removable without breaking primary structure.

D answers only:

**What mechanical checks or residuals were observed during or after execution?**

D must not answer:

- where did this come from?
- what operation was declared?
- what should be inferred semantically?

A diagnostic lane may project alternate diagnostic planes, including time-domain or frequency-domain diagnostic views, provided those projections remain explicitly diagnostic and never replace P.

---

### 4.5 T — Tertiary review / interpretation

Purpose:

- carry advisory, semantic, evaluative, or review-facing outputs,
- remain downstream and removable,
- stay explicitly below structural truth and below canon.

T answers only:

**What bounded review, interpretation, or advisory posture is being expressed?**

T must never feed back into P, L, A, or D as if it were structural fact.

---

## 5. One-way derivation law

Allowed derivations:

- `P -> L`
- `P -> A`
- `P -> D`
- `P -> T`
- `P + L -> T`
- `P + A -> T`
- `P + D -> T`
- `P + L + A + D -> T`

Not allowed:

- `L -> P`
- `A -> P`
- `D -> P`
- `T -> P`
- `T -> L/A/D`
- silent rehydration of `P` with `L`, `A`, `D`, or `T`

Primary structure must remain primary.

---

## 6. Universal lane header rule

Every emitted object must include:

- `lane`
- lane-local object class
- stable local handle
- local upstream handle if applicable

But lane-local fields beyond that must remain lane-specific.

A shared header is allowed.
A shared mixed body is not.

---

## 7. Primary lane purity rule

A P object may contain only:

- lane header,
- minimum stable identity handles,
- direct structural geometry emitted by the operator.

A P object must not contain:

- provenance fields,
- policy ids,
- declared/applied transform accounting fields,
- receipts,
- residuals,
- validation scores,
- confidence,
- uncertainty,
- gates,
- posture language,
- recommendations,
- semantic labels,
- explicit non-claims,
- review fields.

If such fields appear on a P object, the object fails lane purity.

---

## 8. Support family split rule

`L`, `A`, and `D` must never be collapsed into one “support object” by default.

If a surface wants all support-family material, it must request them explicitly as separate companions.

Examples:

- lawful: `P + L`
- lawful: `P + A + D`
- lawful: `P + L + A + D + T`
- unlawful: one bundled mixed artifact pretending to be “support”

---

## 9. Human-facing plane binding rule

Human-facing structural planes must bind to `P` by default.

Additional overlays or panes may bind to `L`, `A`, `D`, or `T`, but those must remain visibly distinct and removable.

Structural visibility must not depend on support or interpretation lanes being present.

---

## 10. Contract failure conditions

A lane contract fails if any of the following occur:

1. one emitted object answers more than one lane question,
2. a P object carries L/A/D/T fields,
3. an L object carries A/D/T content,
4. an A object carries L/D/T content,
5. a D object carries L/A/T content,
6. a T object is treated as structural fact,
7. a downstream operator silently consumes mixed-lane artifacts as if they were pure.

---

## 11. Initial bounded scope

This first lane contract applies directly to the rebuild floor for:

- IngestOp
- ClockAlignOp
- WindowOp
- TransformOp

Later operators may inherit this lane model only after the primary floor is stabilized.

---

## 12. One-line operational summary

**Each operator emission must belong to exactly one lane, and each lane must answer exactly one bounded job.**