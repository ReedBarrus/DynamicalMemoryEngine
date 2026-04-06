# README.LiveStaticInspectionSplit.v0.md

## Dynamical Memory Engine — Live / Static / Inspection Split v0

### Status

This document defines the first bounded mode split for DME viewer surfaces.

It is a viewer-mode governance note.

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

Its purpose is narrower:

* distinguish Live, Static, and Inspection viewer modes,
* prevent one viewer surface from silently doing three different jobs,
* preserve mode-specific honesty for runtime timing, bounded inspection, and dense structural analysis,
* and stabilize the next GUI packet arc.

This note governs **viewer-mode posture** only.

It does **not** govern:

* runtime truth by itself,
* canon activation,
* final routing implementation,
* final GUI styling,
* or final public/demo composition.

---

## 1. Why this note exists

The next app transition introduces:

* a Home / Router shell,
* dedicated viewers,
* one shared structural viewer contract,
* and optional overlays above structural evidence.

That transition requires one more distinction:

**not all viewers are doing the same kind of seeing.**

Without a mode split, the app can drift into a confusing hybrid where:

* live runtime surfaces pretend to be static audit surfaces,
* static viewers pretend to represent runtime timing honestly,
* dense forensic panels become the default home surface,
* and inspection logic, playback logic, and real-time observation logic collapse together.

This note exists to prevent that.

One-line summary:

**Live, Static, and Inspection are different viewing jobs and should remain explicitly different modes.**

---

## 2. Core rule

A viewer mode is not just a styling difference.

A viewer mode defines:

* what kind of structural object is being rendered,
* what kind of timing posture applies,
* what kind of telemetry is lawful,
* what kind of interaction the operator should expect,
* and what kind of interpretive density the viewer is allowed to carry.

Corollary rules:

* live is not static with animation added
* static is not live with playback paused
* inspection is not just a denser static view
* and mode switching must not silently change the underlying truth object

One-line summary:

**Mode changes pacing, interaction, and telemetry posture, not the underlying structural truth.**

---

## 3. The three viewer modes

The current bounded split recognizes three primary viewer modes:

* **Live**
* **Static**
* **Inspection**

These should remain explicit.

---

## 4. Live mode

### Definition

A runtime-facing viewer mode that consumes streaming or incrementally updating structural frames and makes runtime timing conditions visible.

### Purpose

Live mode exists to let the operator observe:

* structural evolution in motion
* perturbation and event appearance as they happen
* basin or trajectory motion over time
* timing and render distortion under actual runtime conditions

### Expected qualities

Live mode should be:

* animated or incrementally updating
* timing-aware
* telemetry-bearing
* bounded in semantic density
* visually clear under motion

### Allowed emphasis

Live mode may emphasize:

* spectral evolution
* energy change
* event markers
* basin motion
* trajectory motion
* runtime pacing

### Required honesty

Live mode must not hide:

* latency
* dropped frames
* render jitter
* processing jitter
* queue lag or update cadence when relevant

This is mechanization honesty, not optional polish.

### Not enough for

Live mode is not automatically the best surface for:

* slow forensic comparison
* dense retained support reading
* detailed replay/reconstruction audit
* verbose operator question ladders

### One-line summary

**Live mode is for real-time structural observation under visible runtime conditions.**

---

## 5. Static mode

### Definition

A bounded viewer mode that consumes pre-rendered or otherwise stabilized structural objects for pauseable, inspectable analysis.

### Purpose

Static mode exists to let the operator:

* stop motion
* inspect one object or one bounded slice
* compare bounded structures
* read structure without runtime pacing pressure
* view provenance and generation posture clearly

### Expected qualities

Static mode should be:

* pausable
* bounded
* inspectable
* provenance-forward
* less telemetry-heavy than live mode

### Allowed emphasis

Static mode may emphasize:

* frame comparison
* replay/reconstruction posture
* retained structure
* basin comparison
* segment comparison
* bounded state differences

### Required honesty

Static mode should make clear:

* what source/run/segment/lens is being viewed
* whether the object was generated live or loaded statically
* that it is a bounded structural object, not the live process itself

### Not enough for

Static mode is not automatically the best surface for:

* continuous streaming perception
* low-latency operator intervention
* dense forensic packing of many structural layers at once

### One-line summary

**Static mode is for bounded structural inspection without live timing pressure.**

---

## 6. Inspection mode

### Definition

A dense forensics-oriented viewer mode designed for bounded structural audit, replay/reconstruction comparison, retained-support inspection, and operator questioning.

### Purpose

Inspection mode exists to let the operator:

* inspect HI / MI state relationships
* inspect retained support
* compare replay vs reconstruction posture
* inspect anomalies and merge outputs in context
* ask bounded operator questions against structural evidence
* view dense multi-section audit surfaces without pretending they are live runtime

### Expected qualities

Inspection mode should be:

* dense
* layered
* explicit about posture
* audit-friendly
* slower-paced than live mode
* more structured than general static viewing

### Allowed emphasis

Inspection mode may emphasize:

* retained structure tiers
* replay/reconstruction distinction
* anomaly and merge evidence
* bounded review posture
* structural questions and evidence anchors
* display-vs-mechanization warnings

### Required honesty

Inspection mode must not be mistaken for:

* the top-level home shell
* the live runtime field viewer
* the truth engine of the system
* a semantic closure surface

It is a bounded audit and forensics surface.

### One-line summary

**Inspection mode is for dense bounded structural forensics and operator audit.**

---

## 7. Mode comparison

## 7.1 Live vs Static

Live mode shows:

* motion
* pacing
* timing pressure
* runtime telemetry

Static mode shows:

* bounded object
* paused inspection
* provenance posture
* comparison without motion

### Rule

Do not fake live by simply animating static payloads without runtime honesty.

Do not fake static by freezing a live panel while preserving live-mode assumptions invisibly.

---

## 7.2 Static vs Inspection

Static mode is for:

* bounded viewing
* comparison
* cleaner reading
* lower density

Inspection mode is for:

* dense audit
* replay/reconstruction contrast
* retained-support reasoning
* operator-question framing

### Rule

Do not treat inspection density as the default shape of every static viewer.

---

## 7.3 Live vs Inspection

Live mode is runtime-facing.
Inspection mode is audit-facing.

Live should be lighter and timing-honest.
Inspection can be denser and question-rich.

### Rule

Do not force dense forensics panels into the primary live geometry surface.

---

## 8. Shared truth rule across modes

All three modes must consume the same shared structural base defined in the structural viewer contract.

Mode does **not** authorize:

* a different truth object
* a demo-only truth layer
* a semanticized convenience payload
* a different replay/reconstruction law
* a different structural identity basis

The same structural truth may be:

* streamed in live mode
* frozen in static mode
* densely cross-sectioned in inspection mode

But it remains the same bounded support object.

One-line summary:

**Modes differ by pacing and projection, not by truth source.**

---

## 9. Overlay rule across modes

Semantic, readiness, and review overlays may appear in all three modes, but always under the same constraints:

* optional
* toggleable
* subordinate
* removable
* non-authoritative

### Live mode overlay posture

Overlays should remain light and secondary.

### Static mode overlay posture

Overlays may be more readable and comparative.

### Inspection mode overlay posture

Overlays may be denser, but must still not replace structural evidence.

### Rule

No mode may use overlays as the primary evidence layer.

---

## 10. Telemetry rule across modes

### Live mode

Live telemetry is required where available and relevant.

Examples:

* pipeline latency
* render FPS
* dropped frames
* browser jitter
* processing jitter
* queue depth
* update cadence

### Static mode

Live telemetry is not required by default.
Instead, provenance and generation stamps are more important.

### Inspection mode

Telemetry may appear only when it is directly relevant to the inspected artifact or generation conditions.
Telemetry should not dominate the inspection surface.

### Rule

Telemetry belongs where timing honesty matters.
It should not be sprayed everywhere just because it exists.

---

## 11. Interaction rule across modes

### Live mode interactions

Expected:

* play/stop
* time window follow
* overlay toggle
* event marker focus
* stream focus

### Static mode interactions

Expected:

* pause
* scrub
* compare
* select frame/window
* inspect lineage

### Inspection mode interactions

Expected:

* section expansion/collapse
* operator question toggles
* retained/replay/reconstruction focus
* evidence drilldown
* posture notes

### Rule

Interaction should reinforce mode purpose, not erase it.

---

## 12. Initial viewer mapping

The current preferred mapping is:

### Live mode

* Spectral / Frequency-Time Viewer
* later Energy Viewer

### Static mode

* Static Spectral Viewer
* Static Energy Viewer
* Static Persistence Viewer

### Inspection mode

* bounded state frames inspector
* HI / MI retained-support panels
* replay / reconstruction comparison panels
* operator questioning panels

This mapping may evolve, but the mode purposes should remain stable.

---

## 13. Transition guidance

The recommended next packet order remains:

1. Home / Router shell
2. Shared structural viewer contract implementation
3. Live Spectral Viewer v0
4. Static Spectral Viewer v0
5. later expansion into additional viewer families
6. inspection-viewer migration from current dense bounded-state panels

Do not try to unify all three modes into one page before their purposes are stabilized.

---

## 14. What this split is trying to prevent

This split is designed to prevent:

* live UI pretending to be static analysis
* static UI pretending to carry runtime timing honesty
* dense inspection panels becoming the only app face
* overlay-rich views replacing structural anchoring
* one viewer surface silently doing three different jobs
* mode drift turning usability improvements into authority drift

---

## 15. What is now true

* The next DME GUI stage needs an explicit mode split.
* Live, Static, and Inspection are different viewer jobs.
* The current dense inspection panels are best treated as Inspection mode, not the default app shell.
* Shared structural truth can support all three modes without fragmentation.
* Mode stabilization should happen before large-scale UI growth.

---

## 16. What is still not claimed

* This note does **not** define final routing implementation.
* This note does **not** define the full telemetry schema.
* This note does **not** define the final viewer payload schema by itself.
* This note does **not** finalize all viewer families.
* This note does **not** require the current composed app to disappear immediately.

---

## 17. Working rule for next packets

Ask of each viewer packet:

* is this Live, Static, or Inspection?
* what truth does it consume?
* what pacing honesty is required?
* what telemetry is lawful here?
* what overlay density is appropriate here?

Do not ask:

* how can this one page do all three at once?

One-line rule:

**Stabilize viewer purpose before growing viewer complexity.**
