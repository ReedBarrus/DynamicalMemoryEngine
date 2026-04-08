# Dynamical Memory Engine — Primary Pipeline Architecture v0

## Status

This document defines the bounded rebuilt-floor architecture for the Door One primary pipeline.

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
* `README/core/OperatorLane/README.PrimaryTransformLaneContract.md`

Its purpose is narrower:

* define the active rebuilt-floor primary chain,
* anchor the first four operators in one concrete architectural note,
* define the relationship between the primary lane and companion lane family,
* make active scope and deferred scope explicit,
* define the lawful edge grammar for the rebuilt floor,
* and provide one non-philosophical implementation anchor for the next rebuild pass.

This note governs **rebuilt-floor pipeline architecture** only.

It does **not** govern:

* the full future pipeline,
* compression, anomaly, merge, or reconstruct semantics,
* canon activation,
* interpretation architecture,
* or later Door Two promotion surfaces.

---

## 1. Why this note exists

The current rebuild has already defined:

* lane law,
* temporal primary-lane contract,
* and transform primary-lane contract.

What remained missing was one compact architectural anchor that states, in direct implementation terms:

* what the rebuilt floor currently is,
* which operators are in scope,
* which object classes exist,
* what each edge is allowed to carry,
* and what is explicitly deferred.

Without that anchor, implementation pressure drifts back into the operators themselves, and architecture remains implicit, distributed, or recoverable only through code reading.

This note exists to stop that drift.

One-line summary:

**Primary Pipeline Architecture v0 defines the first rebuilt operator spine as a bounded four-operator primary chain with explicitly parallel companion lanes and explicit deferment of everything beyond that floor.**

---

## 2. Core architectural rule

**The rebuilt-floor primary pipeline consists only of the first four operators, connected by primary-lane artifacts that carry direct structural geometry only, while lineage, accounting, diagnostics, and interpretation remain parallel, lane-distinct, and non-substituting.**

Corollary rules:

* the rebuilt floor is not the whole future pipeline,
* the primary chain is not allowed to carry companion-lane burden,
* companion lanes must remain parallel and explicit,
* and no deferred operator may silently shape the rebuilt floor before it is explicitly admitted.

---

## 3. Active bounded scope

The active rebuilt-floor scope is exactly:

* `IngestOp`
* `ClockAlignOp`
* `WindowOp`
* `TransformOp`

The active primary artifact classes are exactly:

* `P0_IngestFrame`
* `P1_AlignedFrame`
* `P2_WindowFrame`
* `P3_SpectralFrame`

No other primary operator or primary artifact class is active in this architecture note.

---

## 4. Primary chain

The current rebuilt-floor primary chain is:

`P0 -> P1 -> P2 -> P3`

Expanded by operator:

* `IngestOp` emits `P0_IngestFrame`
* `ClockAlignOp` consumes `P0_IngestFrame` and emits `P1_AlignedFrame`
* `WindowOp` consumes `P1_AlignedFrame` and emits `P2_WindowFrame` (one or more bounded window frames)
* `TransformOp` consumes `P2_WindowFrame` and emits `P3_SpectralFrame`

This is the only active primary chain at v0.

---

## 5. Companion lane family

The rebuilt floor recognizes the following companion lane family:

* `L` — lineage / provenance
* `A` — applied transform / accounting
* `D` — diagnostics / validation
* `T` — tertiary review / interpretation

At v0:

* `L`, `A`, and `D` are recognized as lawful companion families,
* `T` is recognized but remains deferred from active implementation,
* and none of these companion lanes may contaminate the primary lane.

There is no single undifferentiated support lane.

---

## 6. Primary-lane role

The primary lane exists to answer one question only:

**What direct structural geometry did this operator emit?**

Accordingly, each primary artifact must contain only:

* lane-local header fields,
* minimum stable chain handles,
* and direct operator-local structural geometry.

Primary artifacts must not contain:

* provenance,
* policy chains,
* accounting/receipt blocks,
* diagnostics,
* residuals,
* quality scores,
* confidence,
* uncertainty,
* posture language,
* semantic labels,
* recommendations,
* or review-facing fields.

The primary lane is intentionally boring.

---

## 7. Companion-lane roles

## 7.1 L — lineage / provenance

`L` exists to answer:

**Where did this primary object come from?**

It may carry:

* origin handles,
* upstream references,
* operator identity,
* version identity,
* chain lineage references,
* deterministic chain hashes,
* and bounded source linkage.

It may not carry accounting, diagnostics, or interpretation.

---

## 7.2 A — applied transform / accounting

`A` exists to answer:

**What operation was declared and/or applied at this operator boundary?**

It may carry:

* declared transform mode,
* applied transform mode,
* declared alignment mode,
* applied alignment mode,
* window function identity,
* normalization identity,
* FFT size,
* bounded operator execution facts,
* and operator-local declared/applied configuration records.

It may not carry provenance, diagnostics, or interpretation.

---

## 7.3 D — diagnostics / validation

`D` exists to answer:

**What mechanical checks or residuals were observed during or after execution?**

It may carry:

* residuals,
* validation outputs,
* bounded quality/health checks,
* clipping flags,
* missingness metrics,
* alignment residuals,
* transform validation values,
* and diagnostic projections.

A diagnostic projection may include alternate time-domain or frequency-domain diagnostic planes, provided the projection remains explicitly diagnostic and does not replace or redefine the primary lane.

It may not carry provenance, accounting, or interpretation.

---

## 7.4 T — tertiary review / interpretation

`T` exists to answer:

**What bounded review or interpretive posture is being expressed?**

At v0, this lane is declared but deferred.

No `T` artifact is part of the active rebuilt floor.

---

## 8. One-way derivation structure

Allowed at v0:

* `P -> L`
* `P -> A`
* `P -> D`

Declared but deferred:

* `P -> T`
* `P + L -> T`
* `P + A -> T`
* `P + D -> T`
* `P + L + A + D -> T`

Not allowed:

* `L -> P`
* `A -> P`
* `D -> P`
* `T -> P`
* silent rehydration of `P` with companion-lane fields

Primary structure must remain primary.

---

## 9. Operator-by-operator architectural placement

## 9.1 IngestOp

### Role

Admit raw accepted temporal structure into the rebuilt primary chain.

### Primary emission

* `P0_IngestFrame`

### Companion eligibility

* `L0` lineage companion allowed
* `A0` ingest-boundary accounting companion allowed
* `D0` ingest diagnostics companion allowed

### Architectural note

The primary emission is the raw accepted temporal slab only.
Any source metadata, provenance chain, acceptance accounting, or ingest diagnostics must remain outside `P0`.

---

## 9.2 ClockAlignOp

### Role

Remap `P0` temporal structure onto the active alignment grid.

### Primary emission

* `P1_AlignedFrame`

### Companion eligibility

* `L1` lineage companion allowed
* `A1` alignment accounting companion allowed
* `D1` alignment diagnostics companion allowed

### Architectural note

The primary emission is the aligned temporal slab only.
Drift models, interpolation declarations, residuals, and post-alignment checks must remain outside `P1`.

---

## 9.3 WindowOp

### Role

Emit bounded temporal frames from aligned temporal structure.

### Primary emission

* `P2_WindowFrame`

### Companion eligibility

* `L2` lineage companion allowed
* `A2` window accounting companion allowed
* `D2` window diagnostics companion allowed

### Architectural note

The primary emission is the **windowed** temporal vector only.
The raw pre-window vector is intentionally excluded from `P2` and may exist only through a lawful companion lane.

---

## 9.4 TransformOp

### Role

Emit the first primary transform-domain structure from a bounded temporal frame.

### Primary emission

* `P3_SpectralFrame`

### Companion eligibility

* `L3` lineage companion allowed
* `A3` transform accounting companion allowed
* `D3` transform diagnostics companion allowed

### Architectural note

The primary emission contains only direct transform-domain Cartesian geometry.
Derived polar-form quantities such as magnitude and phase are intentionally excluded from `P3` and may exist only through a lawful companion lane.

Transform remains in the primary lane, but it is the first representational remap boundary.

---

## 10. Active edge grammar

The rebuilt-floor active primary edges are:

* `IngestOp -> ClockAlignOp`
* `ClockAlignOp -> WindowOp`
* `WindowOp -> TransformOp`

Each active primary edge must obey all of the following:

1. the downstream operator consumes exactly one primary-lane artifact class admitted by contract,
2. the upstream operator emits exactly one primary-lane artifact class admitted by contract,
3. the edge is readable as structural geometry without companion-lane consultation,
4. companion lanes remain parallel and explicit,
5. no mixed artifact may masquerade as a primary edge object.

Windowing is the only multiplicity exception:

* `WindowOp` may emit multiple `P2_WindowFrame` objects from one `P1_AlignedFrame`
* each emitted `P2_WindowFrame` must still remain individually primary-pure

---

## 11. Active validation floor

At v0, the rebuilt floor should be validated against these minimum conditions:

### 11.1 Primary purity validation

A primary artifact fails if it contains any companion-lane field class.

### 11.2 Chain continuity validation

A downstream primary consumer must be able to read the upstream primary artifact without consulting `L`, `A`, `D`, or `T`.

### 11.3 Lane singularity validation

Any emitted object that answers more than one lane question fails.

### 11.4 Scope validation

No deferred operator or deferred semantic/review seam may shape the rebuilt floor implicitly.

---

## 12. Deferred scope

The following are explicitly deferred from Primary Pipeline Architecture v0:

* `CompressOp`
* `AnomalyOp`
* `MergeOp`
* `ReconstructOp`
* `QueryOp`
* substrate surfaces
* workbench/orchestrator rebuild decisions
* semantic overlay integration
* review/readiness/posture lanes
* any full forward-chain definition beyond `P3`

These are not denied.
They are simply outside the active rebuilt floor.

---
### Deferred downstream structural pressure

The first major deferred downstream structural pressure after `P3` is `MergeOp`.

`MergeOp` is not active in Primary Pipeline Architecture v0 because:

- the rebuilt floor has not yet defined post-transform primary object law beyond `P3`,
- merge depends on downstream decisions about what may count as lawful primary input after transform,
- and previous emission mapping showed that merge was one of the first points where structural output and review-like posture became entangled.

Accordingly, `MergeOp` is recognized as an anticipated downstream operator, but it is explicitly not part of the active rebuilt floor.

## 13. Deferred pressure notes

The rebuilt floor intentionally excludes certain convenience or support-bearing quantities from the primary lane.

### 13.1 Raw temporal vector at WindowOp

The raw pre-window vector is excluded from `P2`.

Reason:

* keep the primary temporal frame singular,
* prevent dual-vector primary artifacts,
* and keep the emitted frame limited to the actual bounded windowed exposure consumed downstream.

If retained, the raw vector must live in a lawful companion lane.

### 13.2 Magnitude / phase at TransformOp

Magnitude and phase are excluded from `P3`.

Reason:

* keep the primary transform artifact limited to minimum direct transform-domain geometry,
* prevent convenience derivatives from widening the primary object,
* and force future downstream operators to declare whether polar-form quantities are truly required as native structural inputs.

If retained or projected, magnitude and phase must live in a lawful companion lane.

These exclusions are intentional v0 discipline choices, not claims that the deferred quantities are unimportant.

---

## 14. Human-facing architecture rule

A human-facing structural plane may bind directly to the primary chain:

* `P0`
* `P1`
* `P2`
* `P3`

Any additional display of provenance, accounting, or diagnostics must remain explicitly lane-distinct.

Human-facing structural visibility must not require support-family hydration.

---

## 15. Initial implementation posture

The next implementation wave should rebuild the first four operators against this note and the lane contracts together.

Implementation should prefer:

* strict TypeScript object families,
* runtime validators,
* explicit forbidden-field checks,
* narrow bounded operator patches,
* and no admission of deferred operators into the rebuilt floor.

---

## 16. Non-goals

This note does not yet define:

* the full companion object schemas,
* the compression boundary,
* anomaly branch architecture,
* replay/reconstruction law,
* or the final long-run operator chain.

Those require later packets.

## Deferred admission note — MergeOp

`MergeOp` is the first major downstream operator expected to pressure the rebuilt primary architecture after `TransformOp`.

Its admission is deferred until all of the following exist:

1. a lawful post-transform primary artifact family beyond `P3`,
2. a decision about whether post-transform downstream primary consumers operate on Cartesian-only geometry or a later promoted structural form,
3. explicit merge-lane law that prevents review posture, support posture, and structural consolidation from cohabiting one emitted object.

Until then, merge remains outside the active architecture.
---

## 17. One-line operational summary

**Primary Pipeline Architecture v0 defines the rebuilt floor as a four-operator primary chain (`P0 -> P1 -> P2 -> P3`) with explicitly parallel companion lanes and explicit deferment of everything beyond that floor.**
