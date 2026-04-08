# Dynamical Memory Engine - Operator Plane Build Order

## Status

This document defines the bounded build order for DME operator planes.

It is a supporting instrumentation, developmental, and workflow note.

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
- `README.OperatorExposurePlaneChain.md`
- `README.OperatorSupportSurfaceLaw.md`

Its purpose is narrower:

- define the recommended developmental order for operator planes,
- prevent later or cleaner planes from being built before earlier seams are inspectable,
- preserve one lawful evidentiary ladder from early structure to later continuity surfaces,
- define the difference between foundational planes, later planes, and deferred planes,
- and give DME one stable plane-building sequence for inventory, retirement, unthreading, and implementation planning.

This note governs **operator-plane build-order posture** only.

It does **not** govern:

- runtime artifact meaning by itself,
- canon activation,
- semantic overlay design,
- final app composition,
- or final product routing.

---

## 1. Why this note exists

DME now has enough runtime, support, routing, and visualization pressure that one development risk has become active:

**planes can be built in the order of visual excitement rather than in the order of evidentiary necessity.**

That creates several failure modes:

- downstream planes being built before upstream seams are inspectable,
- support surfaces being polished before primary emitted output exists,
- transform or replay planes being used to compensate for missing ingest/alignment inspection,
- implementation effort going into app composition before the operator chain is legible,
- and final-surface coherence being mistaken for a lawful instrument stack.

This note exists to prevent that drift.

One-line summary:

**Operator planes should be built in the order required to inspect the emitted operator chain, not in the order that feels most visually rewarding.**

---

## 2. Core rule

**The build order for operator planes should follow the operator exposure-plane chain from earliest emitted structure toward later derived, retained, and replay-bounded surfaces, with primary exposure planes built before support planes and support planes built before later derived or review-adjacent layers.**

Corollary rules:

- earlier seams outrank later convenience,
- primary exposure outranks support polishing,
- support outranks derived inspection polish,
- structural inspectability outranks app richness,
- and a missing foundational plane must not be hidden by building a more dramatic downstream plane.

If a later plane is being proposed while an earlier dependency seam remains unexposed, the earlier seam should usually take priority.

One-line summary:

**Build what the chain depends on first.**

Chain-ownership note:

`README.OperatorExposurePlaneChain.md` owns the canonical operator sequence for the OperatorExposure README set.

This note is derivative. It may assign build priority, tiers, and recommended immediate sequencing only by referencing that canonical chain order.

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
- operator planes must expose first-order emitted output before support, semantic, or review layers,
- support surfaces must remain support rather than semantic or review substitutes,
- bounded work should advance one seam through one closure target at the lowest lawful layer.

Accordingly, build order in this note means:

- bounded developmental sequencing,
- not global importance ranking,
- not final product navigation order,
- not semantic significance ranking,
- and not permission to skip early seams because downstream outputs look compelling.

This note remains below canon.

---

## 4. Definition of build order

In DME, **operator-plane build order** means:

> the bounded developmental sequence in which operator exposure planes and their associated support surfaces should be specified, audited, and mechanized so that the operator chain becomes inspectable from earlier seams upward without hidden dependency gaps.

This means build order is always:

- chain-relative,
- dependency-relative,
- seam-relative,
- closure-relative,
- and mechanization-relative.

Build order is **not** guaranteed merely because:

- a route already exists,
- a component is easier to code,
- a chart is visually appealing,
- or a later seam feels more interesting.

One-line distinction:

**Build order is the order in which inspectability should be earned, not the order in which surfaces happen to be imagined.**

---

## 5. Build-order principles

Every operator-plane build decision should be governed by the following principles.

### 5.1 Earliest emitted structure first

If a seam emits earlier structure that later seams depend on, that seam should generally be exposed first.

### 5.2 Primary before support

A primary exposure plane should generally be built before its support surface unless a narrow support-only packet is required to unblock mechanization.

### 5.3 Support before derived

A support surface should generally exist before derived inspection planes or alternate arrangements are built.

### 5.4 Upstream before downstream

When two seams are connected, the upstream seam should generally become inspectable before the downstream seam is relied upon.

### 5.5 Blank is better than substitution

If a plane is not yet ready, it should remain absent, blank, or declared-only rather than be substituted by support, semantics, or later-seam output.

### 5.6 One closure target at a time

A plane packet should usually advance one seam from declared -> displayed -> partially mechanized -> mechanized, not jump across multiple seams at once.

One-line summary:

**Build order should preserve dependency clarity, inspectability, and seam-local closure.**

---

## 6. Build-order tiers

The current recommended build order is organized into four tiers derived from the canonical operator sequence in `README.OperatorExposurePlaneChain.md`.

---

## Tier 1 - Foundational structural exposure

These are the first planes that should be stabilized because everything later depends on them.

### 6.1 Ingest plane

#### Why here

This is the first emitted structural contact seam.

If ingest is not inspectable, all later surfaces begin from partially opaque input.

#### Recommended first build

- primary plane first
- support surface second
- no derived plane yet unless necessary

#### Typical forms

- sample table
- sample trace over time/sample index
- support fields for count, duration, min/max/rms

---

### 6.2 Clock align plane

#### Why here

Time/grid regularization should be inspectable before segmentation and transform outputs are trusted.

#### Recommended first build

- primary plane first
- support fields for delta/jitter/offset second
- grid visualization later if useful

#### Typical forms

- alignment delta table
- raw vs aligned timestamp table
- support fields for mean/max offset, latency, jitter

---

### 6.3 Window plane

#### Why here

Windowing determines the units of later transform interpretation.

#### Recommended first build

- primary exposure first
- support for window count, overlap, hop, extents second
- more geometric segmentation view later

#### Typical forms

- window boundary table
- segmentation timeline
- source trace with window overlays

One-line summary for Tier 1:

**Tier 1 makes raw time-domain and segmentation seams inspectable before representational remapping begins.**

---

## Tier 2 - Core representational exposure

These are the planes that expose the first major remapping and reduction seams.

### 6.4 Transform plane

#### Why here

This is often the first visually rich plane, but it must remain accountable to ingest, clock align, and window seams.

#### Recommended first build

- most direct exposure form first
- more legible alternate form second
- support fields after or alongside as needed
- no semantic/helpers inside primary plane

#### Typical forms

- raw bin matrix
- time x frequency heatmap
- spectral line profile
- support fields for transform family, bin units, scale, lens parameters

---

### 6.5 Compression plane

#### Why here

Compression introduces structured reduction risk and must be inspectable before reduced surfaces are treated as safe.

#### Recommended first build

- pre/post direct comparison first
- support fields for loss metrics second
- derived residual view later

#### Typical forms

- pre/post table
- reduced-structure matrix
- residual plane
- support fields for retained count, loss %, thresholds

---

### 6.6 Anomaly plane

#### Why here

Anomaly output is still structural/deviation-bearing and should remain below semantic labeling.

#### Recommended first build

- anomaly field or score exposure first
- support fields second
- event maps or more legible displays later

#### Typical forms

- anomaly score table
- anomaly field plane
- threshold crossing map
- support fields for threshold values, anomaly magnitudes, flagged ids

One-line summary for Tier 2:

**Tier 2 makes transform, reduction, and deviation seams inspectable in their own emitted terms before later grouping or continuity surfaces appear.**

---

## Tier 3 - Consolidation and preservation exposure

These seams depend on Tier 1 and Tier 2 becoming inspectable first.

### 6.7 Merge plane

#### Why here

Merge and grouping should not be overread until the pre-merge structure is visible.

#### Recommended first build

- direct merge mapping first
- support fields second
- adjacency/graph view later

#### Typical forms

- merge table
- pre/post region map
- adjacency graph
- support fields for merge count, region size, criteria

---

### 6.8 Retention / signature plane

#### Why here

Retention is easy to overread as memory or identity unless upstream structural seams are already exposed.

#### Recommended first build

- retained signature exposure first
- support/accounting fields second
- derived comparison later

#### Typical forms

- retained signature table
- retained-vs-live comparison
- support fields for lineage, receipt refs, retained tier, support metrics

One-line summary for Tier 3:

**Tier 3 makes structural consolidation and preserved support inspectable before replay-like continuity surfaces are allowed to matter much.**

---

## Tier 4 - Continuity-bounded later surfaces

These are the latest structural surfaces in the current chain and should remain heavily downstream.

### 6.9 Replay / reconstruction-bounded plane

#### Why here

Replay is especially vulnerable to overclaim and should remain downstream of the rest of the chain.

#### Recommended first build

- direct replay-support relation first
- support/accounting fields second
- comparison overlays later
- no semantic or review substitution

#### Typical forms

- replay-vs-retained table
- replay comparison plane
- residual/delta view
- support fields for retained tier, fidelity posture, threshold posture

One-line summary for Tier 4:

**Tier 4 should remain bounded and visibly downstream of the full structural evidentiary chain.**

---

## 7. Build order within each seam

For each seam, the recommended order is:

1. seam-local contract
2. primary exposure plane
3. support surface
4. null/failure posture
5. mechanized path verification
6. more legible alternate form
7. derived inspection plane later
8. any semantic/review-adjacent layer much later if ever

This order should remain stable wherever practical.

One-line summary:

**Build the contract first, then the first-order plane, then support, then polish.**

---

## 8. Build-order classes

The current build-order law recognizes four practical build classes.

### 8.1 B0 - Foundational

Must be built early because downstream seams depend on them.

Examples:
- ingest
- clock align
- window

### 8.2 B1 - Core structural

Should be built after foundational planes but before consolidation or continuity surfaces.

Examples:
- transform
- compress
- anomaly

### 8.3 B2 - Consolidation / preservation

Should be built only after earlier seams become inspectable.

Examples:
- merge
- retention / signature

### 8.4 B3 - Continuity-bounded later surfaces

Should be built last in the current structural chain.

Examples:
- replay / reconstruction-bounded plane

One-line summary:

**Build classes help keep later surfaces from outrunning foundational inspectability.**

---

## 9. What should usually be deferred

The following should usually be deferred until the structural operator chain is inspectable enough:

- semantic overlays
- interpretation reports
- review/readiness surfaces
- broad dashboards
- mixed multi-seam panes
- final product composition polish
- later convenience views that flatten seam distinctions
- any surface whose main value depends on seams that are not yet exposed

This is not a ban.
It is build-order discipline.

---

## 10. Exceptions rule

A local deviation from the default build order may be lawful only when:

- a narrow support surface is required to unblock primary-plane mechanization,
- a shell/control seam must be patched to allow source -> run -> plane routing,
- a diagnostic plane is required to detect why an earlier seam is failing,
- or a bounded inventory/unthreading/retirement packet requires temporary out-of-order inspection.

Such deviations must remain:

- explicit,
- narrow,
- and justified in packet terms.

They should not silently redefine the general build order.

---

## 11. Inventory and retirement relation

This build-order note should be used directly during:

- current-reality vs target-reality audits
- seam/surface inventory stabilization
- contaminated-surface retirement
- shell unthreading
- support/review separation
- implementation planning

When deciding whether to retire, suspend, archive, or keep a surface, ask:

1. what build tier does this surface belong to?
2. is it being built before its dependencies?
3. is it standing in for an earlier missing seam?
4. does it belong to Structure, Support, or Review?
5. is it helping inspectability or hiding missing inspectability?

---

## 12. Mechanization posture across build order

Displayed order is not mechanized order.

A later seam may be displayed before an earlier seam is mechanized.

That is a risk, not a success.

For each tier and each seam, ask separately:

- is the contract declared?
- is the plane displayed?
- is the payload real?
- is the path mechanized?
- is support separate?
- is null/failure posture honest?

The build order should help reduce these ambiguities, not hide them.

---

## 13. Failure modes specific to build order

Common build-order failures include:

- transform plane built before ingest/clock/window are inspectable
- support surfaces built instead of primary planes
- later continuity surfaces used to justify earlier opacity
- shell polish outrunning seam-local exposure
- support and review planes built before support/structure distinction is stable
- more legible alternate forms built before most direct forms
- broad app composition attempted before the operator chain is inspectable
- inventory or retirement skipped because "the app mostly works"

These should be treated as real developmental failures, not mere prioritization preferences.

---

## 14. Recommended immediate build sequence

This immediate sequence is derivative guidance only.

It does not replace the canonical operator order owned by `README.OperatorExposurePlaneChain.md`.

Under the current posture, the recommended immediate sequence is:

1. ingest contract
2. ingest primary plane
3. ingest support surface
4. clock align contract
5. clock align primary plane
6. clock align support surface
7. window contract
8. window primary plane
9. window support surface
10. transform contract
11. transform primary plane
12. transform support surface

Only after those should broader compression/anomaly/merge/retention/replay plane work be treated as the main active build.

This sequence may be interrupted by inventory/unthreading/retirement work if current contamination makes direct implementation unsafe.

---

## 15. Relationship to adjacent notes

This note pairs most directly with:

- `README.OperatorExposurePlaneLaw.md`
- `README.OperatorPlaneContractTemplate.md`
- `README.OperatorExposurePlaneChain.md`
- `README.OperatorSupportSurfaceLaw.md`
- `README.StructuralExposureLaw.md`
- `README.StructuralExposureFailureModes.md`
- `README.SymbolicGravityTaxonomy.md`
- `README.StructuralSurfacePacketContract.md`

Suggested companion notes:

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

**In DME, operator planes should be built in the order required to make the emitted operator chain inspectable seam-by-seam, with primary exposure before support, support before derived forms, and early seams before later continuity surfaces.**


