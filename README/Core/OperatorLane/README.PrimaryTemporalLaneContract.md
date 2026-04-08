# Dynamical Memory Engine — Primary Temporal Lane Contract

## Status

This document defines the primary temporal lane contract for the first three Door One operators:

- IngestOp
- ClockAlignOp
- WindowOp

It is a supporting operator-governance note.

It does **not** override:

- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README.OperatorLanesContract.md`
- `README.StructuralIdentityLaw.md`
- `README.DeclaredVsMechanizedAudit.md`

Its purpose is narrower:

- define the primary structural object grammar for temporal operators,
- ensure the temporal primary lane remains boring and uncontaminated,
- define allowed primary fields for ingest, alignment, and windowing,
- and establish the first clean structural spine for operator rebuild.

This note governs **P-lane temporal artifacts** only.

It does **not** govern:

- lineage companions,
- accounting companions,
- diagnostics companions,
- transform-domain primary artifacts,
- or interpretation outputs.

---

## 1. Why this note exists

The temporal operators are the first floor of the structural spine.

If they emit mixed artifacts, every downstream seam inherits contamination pressure.
If they emit clean primary temporal slabs, later seams can be built on something inspectable and mechanically auditable.

This note exists to keep the temporal primary lane minimal and trustworthy.

---

## 2. Core rule

**A temporal primary artifact may expose only the direct temporal geometry emitted by its operator, plus the minimum stable handles required for chain continuity.**

Corollary rules:

- temporal structure is not provenance,
- temporal structure is not policy accounting,
- temporal structure is not diagnostics,
- and temporal structure is not review posture.

---

## 3. Shared temporal primary grammar

All temporal primary artifacts must include:

- `lane: "P"`
- `artifact_class`
- `primary_handle`
- `upstream_primary_handle` where applicable

All temporal primary artifacts may include only operator-local temporal geometry fields.

Allowed temporal geometry field families:

- bounded time/grid coordinates
- sample vectors
- local frame/window identity fields required to preserve temporal segmentation as structure

Forbidden on temporal primary artifacts:

- provenance
- source metadata blobs
- policy ids
- receipts
- support summaries
- diagnostics
- residuals
- confidence
- uncertainty
- gates
- posture fields
- semantic labels
- recommendations

---

## 4. IngestOp primary contract

### Bounded role

IngestOp emits the first primary temporal exposure object.

### P output question

**What raw accepted temporal structure entered the structural pipeline?**

### Allowed P fields

```js
{
  lane: "P",
  artifact_class: "P0_IngestFrame",
  primary_handle: string,

  stream_ref: string,
  t: number[],
  x: number[]
}
```

Notes
stream_ref is allowed as a minimal structural identity handle
source metadata, ingest policy, and provenance do not belong here
normalization or acceptance shaping is allowed only if declared as part of the primary temporal exposure boundary and reflected in the emitted t / x
Forbidden examples
source_id
meta
ingest_receipt
sequence_receipt
policies
provenance
## 5. ClockAlignOp primary contract
Bounded role

ClockAlignOp emits the aligned temporal primary object.

P output question

What temporal structure exists after alignment onto the active grid?

Allowed P fields
```js
{
  lane: "P",
  artifact_class: "P1_AlignedFrame",
  primary_handle: string,
  upstream_primary_handle: string,

  grid_t0: number,
  Fs: number,
  n: number,
  x: number[]
}
```
Notes
t may be omitted if fully determined by grid_t0, Fs, and n
alignment method, drift model, interpolation method, and residuals are not primary-lane content
Forbidden examples
alignment_receipt
policies
provenance
drift_ppm
offset_ms
post_align_jitter
## 6. WindowOp primary contract
Bounded role

WindowOp emits bounded temporal frame objects.

P output question

What bounded temporal frame structure was emitted from the aligned stream?

Allowed P fields
```js
{
  lane: "P",
  artifact_class: "P2_WindowFrame",
  primary_handle: string,
  upstream_primary_handle: string,

  window_id: string,
  grid_t0: number,
  Fs: number,
  n: number,
  hop_n: number,

  x: number[]
}
```

### Notes

- `x` is the emitted primary **windowed** sample vector
- the raw pre-window vector does **not** belong on the P artifact
- if retained, the raw vector must travel only through a non-primary companion lane, such as diagnostics or lineage/provenance accounting
- WindowOp primary output is therefore the bounded windowed temporal exposure only

Forbidden examples
window_receipt
selection_reason
stationarity_score
salience_score
clipped
padded
missing_ratio
policies
provenance
`aligned_values_raw`
## 7. Temporal lane continuity rule

Temporal P artifacts must remain chainable by primary handles alone.

A downstream operator consuming temporal P artifacts must not require L/A/D/T companions in order to interpret the temporal geometry.

If temporal P cannot stand alone as structure, the contract has failed.

## 8. Edge validation rule

A temporal primary edge fails if:

any forbidden field appears on a P artifact,
required temporal geometry is absent,
chain continuity requires a support-family companion,
or the artifact answers more than one lane question.
## 9. Initial bounded non-goals

This note does not yet define:

L companions
A companions
D companions
transform-domain P artifacts
compression
anomaly
merge
reconstruction
10. One-line operational summary

The temporal primary lane emits only raw, aligned, and windowed temporal geometry plus minimum chain handles, with no support-family or interpretation fields attached.

---

