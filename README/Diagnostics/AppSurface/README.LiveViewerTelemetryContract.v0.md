# README.LiveViewerTelemetryContract.v0.md

## Dynamical Memory Engine — Live Viewer Telemetry Contract v0

### Status

This document defines the first bounded telemetry contract for DME live viewer surfaces.

It is a viewer-telemetry governance note.

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
* `README.StructuralViewerContract.v0.md`
* `README.LiveStaticInspectionSplit.v0.md`

Its purpose is narrower:

* define what telemetry belongs to live structural viewers,
* preserve mechanization honesty in runtime-facing app surfaces,
* distinguish runtime/render telemetry from structural evidence and overlays,
* prevent timing distortion from being visually invisible,
* and stabilize the next GUI packet arc for live viewers.

This note governs **live viewer telemetry posture** only.

It does **not** govern:

* runtime truth by itself,
* structural payload meaning,
* final GUI styling,
* final public/demo presentation,
* or runtime operator contracts.

---

## 1. Why this note exists

The app surface transition now separates:

* Home / Router shell
* shared structural viewer contract
* Live, Static, and Inspection viewer modes
* optional overlay layers

That creates a new requirement:

**live viewers must remain honest about timing conditions.**

Without a bounded telemetry contract, live app surfaces can drift into a misleading shape where:

* streaming visuals look cleaner than the runtime actually is,
* dropped frames are invisible,
* latency is hidden,
* browser render instability is mistaken for structural behavior,
* and operator trust is shaped by a display that does not reveal its own timing distortion.

This note exists to prevent that.

One-line summary:

**Live telemetry exists to make runtime and render distortion visible rather than silently absorbed into the structural display.**

---

## 2. Core rule

Telemetry in DME live viewers is not decorative.

Telemetry is a bounded read-side surface that reveals timing, pacing, and display conditions affecting a live runtime-facing viewer.

Telemetry must remain:

* live-mode-specific by default
* distinct from structural evidence
* distinct from semantic overlay
* distinct from readiness/review packaging
* below truth and below authority
* visible enough to preserve mechanization honesty

Corollary rules:

* smoother animation is not automatically more truthful
* visual continuity is not automatically runtime continuity
* render lag is not structural behavior
* pipeline lag is not the same thing as basin drift
* browser jitter is not anomaly evidence

One-line summary:

**Telemetry tells the operator how the viewer is behaving, not what the structure means.**

---

## 3. What telemetry is for

The telemetry layer exists to answer bounded questions like:

* how fast is the pipeline updating?
* how fast is the viewer rendering?
* are frames being dropped?
* is the browser introducing jitter?
* is queue/backlog pressure growing?
* is the live surface keeping pace with the incoming stream?
* is the operator seeing structural behavior or a timing artifact?

Telemetry is allowed to:

* reveal runtime pacing
* reveal render pacing
* reveal lag and instability
* reveal bounded throughput pressure
* support operator judgment about live-view trustworthiness

Telemetry is **not** allowed to:

* replace structural evidence
* explain semantic meaning
* silently classify structural continuity
* imply readiness, approval, or canon posture
* become a new truth layer over the structural payload

---

## 4. Telemetry is not structure

Telemetry is tightly coupled to live viewing, but it is not part of the structural truth object.

### Structural payload asks:

* what structure is present?
* how is it evolving?
* what support/anomaly/trajectory/basin relations are present?

### Telemetry asks:

* how faithfully is the live viewer presenting that evolving structure right now?

This distinction must remain explicit.

Structural evidence may remain clean while telemetry is bad.

Telemetry may be clean while structural evidence is weak.

One-line distinction:

**Structure describes the object. Telemetry describes the live viewing conditions around that object.**

---

## 5. Live-only default rule

Telemetry belongs to **Live mode** by default.

### Live mode

Telemetry is expected.

### Static mode

Telemetry is usually omitted, except perhaps for generation/provenance stamps.

### Inspection mode

Telemetry may appear only when directly relevant to the inspected artifact or generation conditions. It should not dominate the surface.

This prevents telemetry from being sprayed into surfaces where it does not help.

---

## 6. Preferred telemetry payload

The preferred live telemetry payload is:

```ts id="ikqv6u"
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

This is a target contract, not necessarily the exact immediate implementation shape.

The important part is the posture:

* bounded
* mode-appropriate
* operationally useful
* clearly separate from structural meaning

---

## 7. Telemetry fields

## 7.1 `input_rate_hz`

### Purpose

Represents the incoming cadence of structural updates or source input.

### Why it matters

Lets the operator know whether the live viewer is receiving data at the pace expected.

### Non-role

Does not describe structural quality or semantic importance.

---

## 7.2 `pipeline_latency_ms`

### Purpose

Represents the delay between source-side processing and viewer-available structural update.

### Why it matters

Shows whether the live surface is lagging behind the active process.

### Non-role

Does not itself imply anomaly, degradation, or continuity loss in the structural object.

---

## 7.3 `render_fps`

### Purpose

Represents browser/UI rendering rate.

### Why it matters

Makes display smoothness or choppiness visible as a presentation property.

### Non-role

Does not describe structural event frequency directly.

---

## 7.4 `dropped_frames`

### Purpose

Counts or approximates rendering frames the viewer failed to present.

### Why it matters

Prevents the operator from mistaking skipped visual updates for smooth structural continuity.

### Non-role

Does not imply structural discontinuity by itself.

---

## 7.5 `browser_jitter_ms`

### Purpose

Represents timing instability introduced by the browser/rendering environment.

### Why it matters

Prevents browser instability from being mistaken for signal or structural behavior.

### Non-role

Not structural anomaly evidence.

---

## 7.6 `processing_jitter_ms`

### Purpose

Represents instability in processing cadence or pipeline timing.

### Why it matters

Shows when runtime update pacing itself is unstable.

### Non-role

Does not automatically imply identity drift, anomaly class, or support collapse.

---

## 7.7 `queue_depth`

### Purpose

Represents backlog or buffer accumulation.

### Why it matters

Shows whether the live viewer is falling behind the incoming stream.

### Non-role

Does not by itself classify structural continuity.

---

## 7.8 `update_cadence_ms`

### Purpose

Represents actual interval between updates delivered to the viewer.

### Why it matters

Helps separate intended source cadence from effective delivered cadence.

### Non-role

Not structural truth by itself.

---

## 8. Telemetry presentation rules

Telemetry should be:

* compact
* readable
* secondary to structure
* visible enough to matter
* not hidden behind multiple clicks if live mode depends on it

Telemetry should **not**:

* dominate the main viewer canvas
* drown out structural evidence
* be styled as if it were the main insight layer
* be converted into semantic verdicts

Good posture:

* top bar summary
* side rail compact metrics
* expandable detail panel

Bad posture:

* giant dense telemetry wall as the primary live experience
* no telemetry at all
* semantic labels derived directly from timing wobble

---

## 9. Telemetry severity posture

Telemetry may later support bounded severity cues, but those cues must remain operational, not semantic.

Examples of lawful operational posture:

* nominal
* elevated lag
* frame instability
* backlog growing

Examples to avoid:

* degraded identity
* failing memory
* unstable structure
* semantic migration

Telemetry severity is about **viewer/runtime conditions**, not object meaning.

---

## 10. Telemetry and overlays

Telemetry must remain separate from:

* semantic overlay
* readiness overlay
* review overlay

It may appear alongside them, but it is not one of them.

This matters because live runtime conditions can degrade while semantic overlays remain unchanged, and semantic overlays can change while telemetry remains clean.

Do not fuse them.

---

## 11. Telemetry and provenance

Telemetry is not a substitute for provenance.

However, live viewers should preserve enough traceability to answer:

* which source was active?
* which run/segment/lens is being viewed?
* what was the timing environment?

That means telemetry should remain associated with:

* source header
* mode posture
* time window or update window

without becoming the main record of structural truth.

---

## 12. Minimal acceptance tests for live telemetry

A live telemetry implementation is acceptable only when:

1. telemetry is present in live mode where relevant
2. telemetry remains distinct from structural payload
3. telemetry does not become semantic or review closure
4. dropped frames / lag / jitter are not silently hidden
5. the absence of telemetry in static mode is not treated as failure
6. the operator can tell whether apparent smoothness may be presentation-induced

---

## 13. What this contract is trying to prevent

This contract is designed to prevent:

* live viewers hiding render lag
* browser jitter masquerading as structure
* pipeline backlog being invisible
* animation smoothness being mistaken for truth
* structural evidence and telemetry collapsing into one layer
* UI trust being earned by polish alone rather than honest timing visibility

---

## 14. What is now true

* DME live viewers need an explicit telemetry contract.
* Telemetry is part of live-view honesty, not decorative instrumentation.
* Telemetry belongs primarily in live mode, not everywhere.
* Structural evidence and live telemetry must remain distinct surfaces.

---

## 15. What is still not claimed

* This note does **not** define final telemetry UI styling.
* This note does **not** require every telemetry field immediately.
* This note does **not** define runtime operator measurement implementation by itself.
* This note does **not** authorize semantic conclusions from timing instability.
* This note does **not** replace provenance or structural evidence.

---

## 16. Working rule for next packets

For each live viewer packet, ask:

* what timing conditions affect trust in this surface?
* what telemetry makes those conditions visible?
* how is telemetry kept separate from structural evidence?
* how is telemetry kept secondary but visible?

Do not ask:

* how can telemetry make the surface look more advanced?

One-line rule:

**If live timing conditions can distort what the operator sees, the viewer should reveal that distortion rather than hide it.**
