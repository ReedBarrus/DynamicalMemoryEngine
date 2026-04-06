# README.StructuralViewerContract.v0.md

## Dynamical Memory Engine — Structural Viewer Contract v0

### Status

This document defines the first bounded viewer contract for DME structural app surfaces.

It is a viewer/data-surface governance note.

It does **not** override:

* `README_MasterConstitution.md`
* `README.WorkflowContract.md`
* `README.StructuralIdentityLaw.md`
* `README.DeclaredVsMechanizedAudit.md`
* `README.MechanizationClosureGate.md`
* `README.PacketWorkflowChain.md`
* `README_DoorOneDevelopmentalOutline.md`
* `README.SemanticOverlayContract.v0.md`
* `README.AppSurfaceTransitionPlan.v0.md`

Its purpose is narrower:

* define the shared structural payload that dedicated viewers should consume,
* preserve one structural truth across multiple lawful projections,
* prevent per-viewer truth drift,
* define how overlays attach without replacing structural evidence,
* and stabilize packet work for Live, Static, and Inspection viewers.

This note governs **viewer contract posture** only.

It does **not** govern:

* runtime truth by itself,
* canon activation,
* final GUI styling,
* final public/demo composition,
* or full runtime operator contracts.

---

## 1. Why this note exists

The app surface transition has now been green-lit toward:

* a thin Home / Router shell,
* dedicated Live, Static, and Inspection viewers,
* and a more explicit separation between structural evidence and overlay layers.

That transition creates a new risk:

**viewer drift.**

Without a shared structural viewer contract, the system could gradually develop:

* one truth payload for live viewers,
* another truth payload for static viewers,
* a demo-specific truth payload,
* a semanticized convenience payload for read-side surfaces,
* or viewer-local projections that quietly stop matching each other.

That would reintroduce the same kind of drift the semantic overlay turnaround just cleaned out.

This note exists to prevent that.

One-line summary:

**All viewers should consume one shared structural truth and differ only by lawful projection, mode, and bounded overlay posture.**

---

## 2. Core rule

DME viewers must not each define their own truth.

Instead:

* one shared **structural viewer payload** is the primary source for viewer rendering,
* multiple viewers may project that structural payload differently,
* live/static/inspection differences are mode differences, not truth differences,
* and semantic/readiness/review layers remain optional attachments above the same structural base.

Corollary rules:

* multiple views do not imply multiple truths,
* convenience projection is not a license for truth drift,
* semantic summary is not structural payload,
* demo-facing simplification is not a new source of truth,
* and viewer-local shaping must not outrun mechanized structural support.

One-line summary:

**One structural stream, multiple lawful projections.**

---

## 3. What this contract is for

This contract exists to stabilize the viewer layer so that:

* Home / Router shell packets have a stable destination shape,
* Live and Static viewer packets build on the same base,
* Inspection surfaces remain inspection surfaces rather than turning into ad hoc alternate runtimes,
* semantic overlays remain removable and subordinate,
* and future viewer expansion does not fragment the architecture.

This note is intentionally below styling, below routing polish, and below public/demo packaging.

It is a contract for **what a viewer receives**, not how it looks.

---

## 4. Viewer classes supported by this contract

This contract is intended to support at least the following viewer classes:

### 4.1 Live Structural Viewer

Purpose:

* consume streaming structural frames,
* show structural evolution in motion,
* include runtime telemetry,
* preserve mechanization honesty under live timing pressure.

### 4.2 Static Structural Viewer

Purpose:

* consume bounded structural objects,
* pause, inspect, compare, annotate,
* emphasize provenance and generation posture over live timing metrics.

### 4.3 Inspection / Forensics Viewer

Purpose:

* show dense HI / MI / replay / reconstruction / retained-support surfaces,
* support bounded review and operator questioning,
* remain an explicit inspection surface rather than the default home shell.

These viewers may differ strongly in presentation, but they should all read from the same structural base.

---

## 5. Shared structural viewer rule

Every viewer must consume the same **structural base contract**.

Do **not** create:

* one “live truth” contract,
* one “static truth” contract,
* one “inspection truth” contract,
* one “semantic demo” contract,
* or any other viewer-local truth model that cannot be reconciled back to the same structural base.

A viewer may:

* omit fields it does not need,
* focus on one structural family,
* compress or summarize structurally,
* add bounded overlay layers,
* add mode-specific telemetry,

but it must not redefine what the structural object fundamentally is.

---

## 6. Top-level viewer payload shape

The preferred top-level payload is:

```ts
type ViewerPayload = {
  source: SourceHeader;
  mode: "live" | "static" | "inspection";
  lineage: LineageHeader;
  structural: StructuralFrameSet;
  overlays?: ViewerOverlayBundle;
  telemetry?: RuntimeTelemetry;
};
```

This is a target contract, not necessarily the exact immediate implementation shape.

The important part is the separation of:

* source framing
* lineage/provenance posture
* structural payload
* optional overlays
* optional live telemetry

---

## 7. Source header

```ts
type SourceHeader = {
  source_id: string;
  source_family: string;
  run_id?: string;
  segment_id?: string;
  lens_id?: string;
  timestamp_range?: [number, number];
  mode_posture?: string;
};
```

### Purpose

The source header exists to answer:

* what source is being viewed?
* what run/segment/lens is active?
* what bounded time window is in scope?
* what mode is the viewer actually showing?

### Rules

* source framing must stay explicit
* source framing must remain below truth/authority
* source framing must not be inferred solely from view choice

---

## 8. Lineage header

```ts
type LineageHeader = {
  provenance_refs: string[];
  retained_tier?: string;
  replay_posture?: string;
  reconstruction_posture?: string;
  generated_from?: string[];
  explicit_non_claims?: string[];
};
```

### Purpose

The lineage header exists to preserve:

* provenance visibility
* retained-tier posture
* replay vs reconstruction distinction
* generated-from traceability
* explicit non-claims when needed

### Rules

* lineage must remain visible enough for bounded inspection
* replay posture must not silently become reconstruction posture
* viewer convenience must not hide the actual support basis

---

## 9. Structural frame set

```ts
type StructuralFrameSet = {
  spectral?: SpectralFrames;
  energy?: EnergyFrames;
  persistence?: PersistenceFrames;
  anomalies?: StructuralEvent[];
  trajectories?: TrajectorySet;
  basins?: BasinSet;
  retained?: RetainedStructureSet;
  replay?: ReplayStructureSet;
  reconstruction?: ReconstructionStructureSet;
};
```

This is the heart of the viewer contract.

The exact internal typing may evolve, but the governing rule is stable:

**the structural section must contain structural truth, not semantic closure.**

### 9.1 Spectral frames

Expected role:

* frequency-time structure
* HI structural states
* basin-like distribution
* transform-space geometry
* perturbation markers where structurally justified

### 9.2 Energy frames

Expected role:

* envelope / RMS / amplitude behavior
* redistribution
* collapse / sustain / peak behavior
* energy-side continuity without semantic inflation

### 9.3 Persistence frames

Expected role:

* recurrence
* retained-vs-live support relations
* support persistence
* bounded continuity surfaces below identity overclaim

### 9.4 Structural events

Expected role:

* anomaly evidence
* threshold posture
* merge-basis posture
* transition / event markers
* structural routing receipts where applicable

These remain structural/evidence objects, not semantic verdicts.

### 9.5 Trajectories / basins / retained / replay / reconstruction

These are lawful structural projections as long as:

* replay remains replay
* reconstruction remains reconstruction
* retained support remains support-bearing
* viewer rendering does not flatten them into one truth object

---

## 10. Overlay bundle

```ts
type ViewerOverlayBundle = {
  semantic?: SemanticOverlayBundle;
  readiness?: ReadinessOverlayBundle;
  review?: ReviewOverlayBundle;
};
```

The semantic overlay turnaround established the governing rule already:

* overlays are late-bound
* overlays are removable
* overlays are non-authoritative
* overlays are not primary structural substance

This viewer contract inherits that rule.

### 10.1 Semantic overlay

Expected posture:

* bounded semantic lens
* descriptor-backed
* query-bound
* claim-ceiling-aware
* optional and toggleable

### 10.2 Readiness overlay

Expected posture:

* advisory only
* downstream only
* non-promotional by default

### 10.3 Review overlay

Expected posture:

* evaluative only
* bounded review packaging
* not approval
* not canon
* not runtime truth

### 10.4 Future optional interpretive attachments

Future read-side seams may later attach alongside the structural payload and overlay bundle when separately authorized.

Examples include:

* a post-perturbation `settlement_report`
* a separate `identity_audit`

These are **not** required v0 viewer fields.

They remain:

* optional
* read-side
* removable
* below identity closure unless independently mechanized
* structurally traceable back to the same shared base

The current contract must therefore leave room for these attachments without treating them as already implemented.

### Overlay rule

A viewer must remain useful when overlays are off.

If overlays are on, structural evidence must remain visibly primary.

---

## 11. Runtime telemetry

```ts
type RuntimeTelemetry = {
  input_rate_hz?: number;
  pipeline_latency_ms?: number;
  render_fps?: number;
  dropped_frames?: number;
  browser_jitter_ms?: number;
  processing_jitter_ms?: number;
  queue_depth?: number;
  update_cadence_ms?: number;
};
```

Telemetry is mode-sensitive.

### Live mode

Live viewers should be allowed to carry runtime telemetry because live display is a runtime-facing surface and must preserve mechanization honesty.

### Static mode

Static viewers do not need live telemetry by default. They may carry provenance/generation stamps instead.

### Rule

Telemetry is not decorative.

It exists to make timing and render distortion visible rather than hidden.

---

## 12. Viewer-specific projection rule

A viewer may lawfully project only part of the structural payload.

Examples:

* Spectral Viewer may emphasize `structural.spectral`, `anomalies`, `trajectories`, and live telemetry
* Energy Viewer may emphasize `structural.energy`
* Persistence Viewer may emphasize `structural.persistence`, `retained`, and replay/reconstruction posture
* Inspection Viewer may expose a denser mix of retained, replay, reconstruction, and operator-facing audit surfaces

This is lawful as long as:

* the projection stays traceable to the same structural base
* omitted fields are omitted, not replaced with contradictory truth
* the viewer does not invent stronger semantics to fill omitted structure

---

## 13. Viewer mode rule

Mode is a property of the viewer payload, not an excuse for truth drift.

### Live mode

* streaming
* animated
* timing-aware
* telemetry-bearing

### Static mode

* bounded
* pausable
* inspectable
* provenance-forward

### Inspection mode

* dense
* forensics-oriented
* explicit about replay/reconstruction/read-side posture
* not the same thing as live runtime display

A mode changes the way the same structural base is handled.
It does not authorize a different truth model.

---

## 14. Viewer contract boundary rules

The viewer contract must preserve the following boundaries:

### 14.1 Structural is not semantic

No semantic field belongs in the structural payload just because it is useful in the UI.

### 14.2 Replay is not reconstruction

Replay and reconstruction must remain distinguishable in both payload and rendering.

### 14.3 Overlays are not primary

Semantic/readiness/review overlays must remain optional and subordinate.

### 14.4 Display is not authority

Viewer clarity must not be mistaken for stronger support, readiness, approval, or truth.

### 14.5 One payload, many projections

Viewer specialization must not create multiple truth contracts.

### 14.6 Structural perturbation facts remain separate from later interpretation

The viewer contract must preserve three-way separation between:

* anomaly or perturbation evidence
* later settlement interpretation
* later identity continuity judgment

Accordingly:

* anomaly evidence is not settlement by default
* settlement interpretation, if later attached, is not identity continuity by default
* basin migration or continuity labels must not silently become preserved same-object claims

---

## 15. Minimal acceptance tests for this contract

A viewer contract implementation is acceptable only when:

1. all viewers can trace back to the same structural base
2. overlays can be removed without breaking structural use
3. live telemetry appears only where mode requires it
4. replay/reconstruction posture remains distinguishable
5. source and lineage remain visible enough for bounded inspection
6. no viewer introduces semantic closure as structural payload
7. no viewer-local convenience model becomes a hidden truth source

---

## 16. v0 implementation guidance

This note should drive the next app packets in this order:

1. Home / Router shell
2. shared structural viewer payload implementation or adapter
3. Live Spectral Viewer v0
4. Static Spectral Viewer v0

Do not use this note as an excuse to build every viewer at once.

And do not treat the contract as requiring full type-system perfection before packets can start.

It is a stabilizing target, not an excuse for over-design.

---

## 17. What is now true

* The app surface transition now has a bounded shared viewer contract direction.
* Dedicated viewers can be developed without fragmenting structural truth.
* Live, Static, and Inspection viewers can differ by mode and projection while sharing the same structural base.
* Semantic overlays can remain lawful and subordinate inside the new viewer stack.

---

## 18. What is still not claimed

* This note does **not** finalize exact TypeScript or JSON schemas.
* This note does **not** define final viewer styling.
* This note does **not** define final routing implementation.
* This note does **not** replace runtime operator contracts.
* This note does **not** authorize semantic fusion into structural payload.
* This note does **not** require `settlement_report` or `identity_audit` to exist now.
* This note does **not** treat perturbation, settlement, and identity as one merged viewer verdict.

---

## 19. Working rule for next packets

Use this contract to ask:

* what structural base does this viewer consume?
* what projection does it apply?
* what mode does it run in?
* what overlays are allowed?
* what telemetry is lawful here?

Do not ask:

* what new truth should this viewer invent?

One-line rule:

**A viewer is a lawful projection surface over shared structural truth, not a new truth engine.**
