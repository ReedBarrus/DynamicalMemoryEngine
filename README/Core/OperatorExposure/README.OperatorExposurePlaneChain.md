# Dynamical Memory Engine - Operator Exposure Plane Chain

## Status

This document defines the bounded operator exposure-plane chain for DME.

It is a supporting instrumentation, structural-governance, and developmental note.

It does **not** override:

- `README_MasterConstitution.md`
- `README.WorkflowContract.md`
- `README.StructuralIdentityLaw.md`
- `README.DeclaredVsMechanizedAudit.md`
- `README.MechanizationClosureGate.md`
- `README.PacketWorkflowChain.md`
- `README_DoorOneDevelopmentalOutline.md`
- `README.StructuralExposureLaw.md`
- `README.StructuralExposureFailureModes.md`
- `README.SymbolicGravityTaxonomy.md`
- `README.StructuralSurfacePacketContract.md`
- `README.OperatorExposurePlaneLaw.md`
- `README.OperatorPlaneContractTemplate.md`
- `README.ObservabilityAndFeedbackTaxonomy.md`
- `README.BoundaryTaxonomy.md`
- `README.ConstraintTaxonomy.md`
- `README.CompressionTaxonomy.md`
- `README.SemanticOverlayContract.v0.md`

Its purpose is narrower:

- define the exposure-plane chain that should exist across the operator stack,
- identify which operator seams belong to Structure, Support, and Review,
- define the evidentiary order in which operator outputs should become inspectable,
- prevent downstream surfaces from being treated as substitutes for upstream inspection,
- preserve one lawful path from emitted structural output to later support and review layers,
- and provide a stable map for inventory, retirement, unthreading, and implementation planning.

This note governs **operator exposure-plane chain posture** only.

It does **not** govern:

- runtime artifact meaning by itself,
- canon activation,
- semantic overlay by itself,
- full app composition by itself,
- or final product-surface design.

---

## 1. Why this note exists

DME now has enough runtime, support, overlay, and workflow pressure that a specific problem has become clear:

**the system cannot be developed as a lawful instrument unless the operator chain itself becomes inspectable in order.**

Recent surface work exposed several risks:

- downstream views being used without upstream inspection,
- support surfaces being mistaken for structural output,
- aggregated render planes being mistaken for sufficient evidence,
- mixed surfaces hiding where one seam stops and another begins,
- and app composition drifting ahead of seam-local inspectability.

The correct answer is not to project a bigger app.

The correct answer is to define the operator exposure-plane chain and then build it in order.

This note exists to do that.

One-line summary:

**The operator exposure-plane chain defines the inspectable evidentiary ladder from emitted structural output upward through support and later review.**

---

## 2. Core rule

**The operator chain should become inspectable seam-by-seam in operator order, with each seam exposing its first-order emitted output before later seams, support surfaces, or review layers are allowed to stand in for it.**

Corollary rules:

- downstream usefulness is not a substitute for upstream inspectability,
- support is not a substitute for primary emitted output,
- review is not a substitute for support,
- semantic overlay is not a substitute for primary or support exposure,
- and a later plane may not silently claim authority over an earlier unseen seam.

If a seam has not yet been exposed lawfully, downstream planes must remain visibly below stronger closure.

One-line summary:

**No later seam can compensate for a missing earlier exposure seam.**

---

## 3. Constitutional posture

This note operates under already-active inherited rules:

- runtime is not canon,
- query is not truth,
- substrate is not ontology,
- declared is not mechanized,
- displayed is not mechanized,
- replay-shaped is not reconstructed,
- structural exposure must remain direct, pre-semantic, and inspectable,
- operator exposure planes must expose first-order emitted output before support, semantic, or review layers,
- and bounded work should advance one seam through one closure target at the lowest lawful layer.

Accordingly, the operator exposure-plane chain in this note means:

- a bounded evidentiary and developmental order,
- not semantic hierarchy by default,
- not review priority by default,
- not product polish order by default,
- and not permission to overbuild later surfaces before early seams are inspectable.

This note remains below canon.

---

## 4. Definition of the operator exposure-plane chain

In DME, the **operator exposure-plane chain** means:

> the ordered family of operator seams whose emitted outputs should become directly inspectable as planes or support surfaces, in operator order, strongly enough that the runtime chain can be inspected as an evidentiary stack rather than inferred from final surface behavior alone.

This means the chain is always:

- order-relative,
- seam-relative,
- output-relative,
- and mechanization-relative where a real path matters.

The chain is **not** guaranteed merely because:

- a final route exists,
- a structural-looking view exists,
- downstream output is useful,
- or a later plane appears coherent.

One-line distinction:

**The chain is the order in which runtime outputs become inspectable, not the order in which a UI happens to look convenient.**

---

## 5. The three operator groups

The current operator reorganization should distinguish three groups explicitly.

---

### 5.1 Structure group

These are pure structural operators.

They receive input, transform state, and emit output.

They do **not** ask questions.

They do **not** perform review.

They do **not** generate semantic closure.

Typical members:

- ingest
- clock align
- window
- transform
- compress
- anomaly
- merge
- retention / signature shaping where still structural
- replay-support shaping where still structural

One-line summary:

**Structure operators emit state.**

---

### 5.2 Support group

These are support or derived structural/accounting seams.

They expose fields adjacent to structure:

- counts
- timings
- thresholds
- lineage
- ids
- source/run descriptors
- support traces
- retained-tier/accounting posture where numerical or categorical support is required

Support is not prose.

Support is not semantics.

Support is second-order or adjacent exposure.

One-line summary:

**Support seams expose derived structural/accounting fields.**

---

### 5.3 Review group

These are query-bearing, inspection-bearing, evaluative, or closure-bearing seams.

Typical members:

- QueryOp
- review surfaces
- semantic overlay
- consultation/readiness surfaces
- interpretation reports
- classification and routing layers

These are properly downstream.

One-line summary:

**Review seams interrogate or classify exposed output; they do not replace operator emission.**

---

## 6. Chain order rule

This note is the single canonical owner of operator sequencing for the OperatorExposure stack.

Any adjacent note may reference this order for build planning, packet scoping, or seam-local contract work.

No adjacent note may redefine, reorder, or compete with this canonical sequence unless a bounded escalation is raised explicitly.

The chain should be developed and inspected in the following order unless a bounded seam audit justifies a narrower local exception:

1. ingest
2. clock align
3. window
4. transform
5. compress
6. anomaly
7. merge
8. retention / signature
9. replay / reconstruction-bounded output

This order reflects runtime evidentiary dependence, not final product glamour.

A later seam may depend on earlier seams.

An earlier seam does not depend on a later seam to become inspectable.

One-line summary:

**This section owns canonical operator order for the OperatorExposure README set.**

---

## 7. Chain members

The following chain members are the current default targets.

---

### 7.1 Ingest seam

#### Chain role

First structural contact seam.

#### What should become inspectable

- ordered emitted samples
- source-local sample frames
- timestamp or sample-index ordering
- source window extents if present

#### Typical primary plane candidates

- sample table
- sample trace over ordered time/sample axis

#### Typical support outputs

- source id
- channel id
- sample count
- source duration
- min/max/rms if lawful

#### Why early

If ingest is not inspectable, all later seams are already partially opaque.

---

### 7.2 Clock align seam

#### Chain role

Time/grid regularization seam.

#### What should become inspectable

- aligned timestamps or frame positions
- alignment deltas
- shifts / padding / drop behavior if present
- grid relationship

#### Typical primary plane candidates

- alignment delta table
- raw vs aligned position table
- alignment grid relation plane

#### Typical support outputs

- mean offset
- max offset
- jitter/latency fields
- dropped/padded counts

#### Why early

Clock regularity must be inspectable before transformed downstream structure can be meaningfully interpreted.

---

### 7.3 Window seam

#### Chain role

Segmentation seam.

#### What should become inspectable

- window boundaries
- frame extents
- hop/overlap relation
- source-to-window mapping

#### Typical primary plane candidates

- window boundary table
- segmentation timeline
- source trace with overlaid window blocks

#### Typical support outputs

- window size
- hop size
- total window count
- overlap ratio

#### Why early

Transform outputs cannot be read correctly if the segmentation seam remains implicit.

---

### 7.4 Transform seam

#### Chain role

Representational remapping seam.

#### What should become inspectable

- window-indexed transform values
- bin-indexed or frequency-indexed magnitudes
- transform-space field geometry

#### Typical primary plane candidates

- raw bin matrix
- time x frequency heatmap
- single-window spectral profile

#### Typical support outputs

- transform family
- frame index
- frequency axis info
- magnitude scale info
- lens parameters

#### Why early

This is often the first visually rich seam, but it must remain accountable to ingest, alignment, and windowing.

---

### 7.5 Compression seam

#### Chain role

Reduction/remapping seam.

#### What should become inspectable

- reduced structure
- retained vs discarded relation
- residual or loss-bearing relation

#### Typical primary plane candidates

- pre/post comparison table
- retained-structure matrix
- residual plane

#### Typical support outputs

- structural loss metrics
- retained field counts
- threshold values
- compression-class/accounting fields

#### Why early enough

Compression can create clean-looking distortion, so it must become inspectable before its outputs are treated as reliable structure.

---

### 7.6 Anomaly seam

#### Chain role

Difference / deviation exposure seam.

#### What should become inspectable

- anomaly field
- threshold crossings
- scored deviations
- event-local deltas

#### Typical primary plane candidates

- anomaly score table
- anomaly field plane
- threshold crossing map

#### Typical support outputs

- anomaly thresholds
- flagged window ids
- anomaly magnitudes
- local support fields

#### Why early enough

Anomaly outputs should remain structural/deviation-bearing, not semantic verdicts.

---

### 7.7 Merge seam

#### Chain role

Grouping/consolidation seam.

#### What should become inspectable

- merge mapping
- pre/post grouping relation
- adjacency or merge relationship

#### Typical primary plane candidates

- merge table
- adjacency graph
- pre/post region map

#### Typical support outputs

- merge count
- merge criteria
- upstream ids
- region sizes

#### Why later

Merge depends on prior seam inspectability and is easier to misread if earlier seams are still opaque.

---

### 7.8 Retention / signature seam

#### Chain role

Preservation seam.

#### What should become inspectable

- retained signature structure
- preserved support traces
- retained-vs-live relation where lawful

#### Typical primary plane candidates

- retained signature table
- retained-vs-live comparison view
- signature overlay plane

#### Typical support outputs

- lineage fields
- receipt refs
- retention tier
- support sufficiency/accounting fields

#### Why later

Retention is easy to overread as memory or identity unless earlier structural seams are already inspectable.

---

### 7.9 Replay / reconstruction-bounded seam

#### Chain role

Later bounded continuity seam.

#### What should become inspectable

- replay support output
- reconstruction-bounded structural relation
- replay vs retained relation
- residual/delta where lawful

#### Typical primary plane candidates

- replay-vs-retained table
- replay comparison plane
- residual plane

#### Typical support outputs

- retained tier
- replay posture
- threshold/fidelity fields
- reconstruction/accounting fields

#### Why last in the current chain

Replay is especially vulnerable to overclaim and must remain downstream of the rest of the structural evidentiary chain.

---

## 8. Plane family rule per seam

Each seam may eventually support up to four surface elements.

### 8.1 Primary exposure plane

The first-order emitted output.

### 8.2 Support exposure surface or plane

Second-order numeric/accounting exposure.

### 8.3 Derived inspection plane

A later alternate arrangement of already-exposed output.

### 8.4 Review/semantic layer later if needed

Explicitly downstream and removable.

The lawful default posture is:

- primary first
- support second
- derived later
- review/semantic last

---

## 9. No-substitution rule across the chain

The following substitutions are unlawful across the chain:

- downstream planes standing in for missing upstream planes
- support tables standing in for primary emitted output
- review or semantic surfaces standing in for support
- compression outputs standing in for transform outputs when the transform seam is not inspectable
- replay outputs standing in for retained or emitted structure
- final-route coherence standing in for seam-local exposure

One-line summary:

**The chain may be traversed upward. It may not be short-circuited downward.**

---

## 10. Build-order relation

This note owns canonical operator order.

`README.OperatorPlaneBuildOrder.md` is derivative of this note and may define developmental tiers, packet priority, and closure sequencing only by referencing the canonical order declared in Section 6.

The build-order note may not redefine canonical operator membership or reorder the chain.

If a local packet needs an exception, that exception should remain packet-local, explicit, and justified without mutating chain ownership here.

---

## 11. Inventory and retirement use

This chain should be used directly for:

- seam inventory stabilization
- current-reality vs target-reality mapping
- retirement/suspension of contaminated surfaces
- unthreading mixed seams
- reattachment planning
- rebuild planning
- packet scoping

When auditing current surfaces, ask for each:

1. what seam does this belong to?
2. is it primary, support, derived, or review?
3. what upstream seam does it depend on?
4. is it substituting for a missing earlier seam?
5. should it remain active, be suspended, archived, removed, or rebuilt later?

---

## 12. Mechanization posture across the chain

The whole chain is **not** mechanized merely because one or two planes are displayed.

Each seam should be evaluated locally.

A later plane does not prove earlier mechanization.

A rendered route does not prove seam-local payload accuracy.

A displayed chain is not a mechanized chain.

Mechanization should remain seam-local and explicit.

---

## 13. Null / failure posture across the chain

A missing seam should remain visibly missing.

Acceptable posture:

- no plane yet
- blank plane
- empty table
- declared-only status
- displayed-only status
- partially mechanized status

Unacceptable posture:

- semantic filler replacing missing exposure
- support-only surface treated as if the seam is inspectable
- downstream plane used to disguise upstream opacity

One-line summary:

**A visible gap in the chain is more lawful than a hidden substitution.**

---

## 14. Chain failure modes

Common chain failures include:

- ingest skipped and transform trusted anyway
- clock align implicit and transform overread
- support presented before primary output
- legible later seam replacing direct earlier seam
- replay treated as enough without retained/support inspection
- mixed route collapsing multiple chain roles together
- semantic or review overlay appearing before support/accounting is even clear

These should be treated as real evidentiary failures, not just UI taste issues.

---

## 15. Relationship to adjacent notes

This note pairs most directly with:

- `README.OperatorExposurePlaneLaw.md`
- `README.OperatorPlaneContractTemplate.md`
- `README.StructuralExposureLaw.md`
- `README.StructuralExposureFailureModes.md`
- `README.SymbolicGravityTaxonomy.md`
- `README.StructuralSurfacePacketContract.md`
- `README.ObservabilityAndFeedbackTaxonomy.md`
- `README.BoundaryTaxonomy.md`
- `README.ConstraintTaxonomy.md`
- `README.CompressionTaxonomy.md`

Suggested companion notes:

- `README.OperatorSupportSurfaceLaw.md`
- `README.OperatorPlaneBuildOrder.md`
- `README.OperatorPlanePacketContract.md`

Suggested seam-local follow-ons:

- `README.OperatorPlane.Ingest.md`
- `README.OperatorPlane.ClockAlign.md`
- `README.OperatorPlane.Window.md`
- `README.OperatorPlane.Transform.md`
- `README.OperatorPlane.Compress.md`
- `README.OperatorPlane.Anomaly.md`
- `README.OperatorPlane.Merge.md`
- `README.OperatorPlane.Retention.md`
- `README.OperatorPlane.Replay.md`

---

## 16. One-line summary

**In DME, the operator exposure-plane chain is the ordered evidentiary ladder by which operator-emitted output becomes inspectable seam-by-seam, before support, semantic, or review layers are allowed to stand in for what the runtime actually emitted.**


