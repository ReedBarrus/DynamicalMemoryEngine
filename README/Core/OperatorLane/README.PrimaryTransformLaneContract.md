# `README.PrimaryTransformLaneContract.md`

```md
# Dynamical Memory Engine — Primary Transform Lane Contract

## Status

This document defines the primary transform lane contract for Door One `TransformOp`.

It is a supporting operator-governance note.

It does **not** override:

- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README.OperatorLanesContract.md`
- `README.StructuralIdentityLaw.md`
- `README.DeclaredVsMechanizedAudit.md`

Its purpose is narrower:

- define the primary structural object grammar for the transform boundary,
- distinguish transform-lane structure from temporal-lane structure,
- prevent transform artifacts from carrying support, diagnostics, or review burden,
- and stabilize the first lawful remap boundary in the primary lane.

This note governs **P-lane transform artifacts** only.

It does **not** govern:

- temporal P artifacts,
- lineage companions,
- accounting companions,
- diagnostics companions,
- or interpretation outputs.

---

## 1. Why this note exists

Transform is the first explicit representational remap boundary in the primary lane.

It should remain in the primary lane, but it should not be forced into temporal field grammar.
A lawful transform primary artifact must expose only the direct transform-domain structure emitted by the operator.

This note exists to define that transform-specific primary grammar cleanly.

---

## 2. Core rule

**A transform primary artifact may expose only the direct transform-domain geometry emitted by TransformOp, plus the minimum stable handles required for chain continuity.**

Corollary rules:

- transform geometry is not provenance,
- transform geometry is not transform accounting,
- transform geometry is not diagnostics,
- transform geometry is not semantic interpretation.

---

## 3. Transform primary grammar

A transform primary artifact must include:

- `lane: "P"`
- `artifact_class`
- `primary_handle`
- `upstream_primary_handle`

A transform primary artifact may include only:

- frame identity needed for continuity from the upstream temporal object
- transform-domain geometric coordinates
- transform-domain value vectors/components

Forbidden on transform primary artifacts:

- policy ids
- transform receipts
- algorithm notes
- residuals
- parseval checks
- leakage estimates
- confidence
- uncertainty
- provenance
- posture fields
- semantic labels
- recommendations

---

## 4. TransformOp primary contract

### Bounded role

TransformOp emits the first primary transform-domain object.

### P output question

**What direct transform-domain structure was emitted from the bounded temporal frame?**

### Allowed P fields

```js
{
  lane: "P",
  artifact_class: "P3_SpectralFrame",
  primary_handle: string,
  upstream_primary_handle: string,

  window_id: string,
  Fs: number,
  n: number,
  df: number,

  bins: Array<{
    k: number,
    f: number,
    re: number,
    im: number
  }>
}
```
### Notes

- the transform primary artifact keeps only Cartesian spectral components: `re` and `im`
- derived polar-form quantities such as `magnitude` and `phase` do **not** belong on the P artifact
- if retained or projected, `magnitude` and `phase` must travel only through a non-primary companion lane, such as diagnostics
- this keeps the transform primary lane limited to the minimum direct transform-domain geometry

forbidden fields (must be routed to diagnostics or other non-primary lanes)
- `magnitude`
- `phase`

## 5. Transform-lane continuity rule

A downstream structural consumer must be able to read the transform artifact as a pure transform-domain structure without consulting L/A/D/T companions.

If transform interpretation depends on receipts or diagnostics, the primary transform contract has failed.

## 6. Edge validation rule

A transform primary edge fails if:

any forbidden field appears on the P artifact,
transform-domain geometry is mixed with accounting or diagnostics,
chain continuity requires support-family companions,
or the artifact answers more than one lane question.
## 7. Initial bounded non-goals

This note does not yet define:

transform lineage companions
transform accounting companions
transform diagnostics companions
compression
anomaly
merge
reconstruction
## 8. One-line operational summary

The transform primary lane emits only transform-domain geometry plus minimum chain handles, with no provenance, accounting, diagnostics, or interpretation burden attached.
