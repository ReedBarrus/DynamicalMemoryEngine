# README.SemanticOscilloscopeAppSurface.md

# Dynamical Memory Engine — Semantic Oscilloscope App Surface

## Status

This document defines the bounded app/site posture for the usable semantic oscilloscope.

It is a supporting roadmap / implementation-governance note.

It does **not** override:

- `README_MasterConstitution.md`
- `README_ConstitutionAppendix.md`
- `README_WorkflowContract.md`
- `README_RepoPlacementConstitution.md`
- `README/Core/README_DoorOneRuntimeBoundary.md`
- `README/Core/README_DoorOneInspectionSurfacePosture.md`
- `README/Core/README_DoorOneAdapterPolicy.md`
- `README/Core/README.IngestAdapterMatrix_v0.md`
- `README/Core/README.ContinuousIngestRetentionLadder.md`
- `README/Core/README.SourceFamilyWorkflowTypes.md`
- `README/Core/README.ReconstructionReplaySurface.md`
- `README/Roadmap/demo/README.UsableSemanticOscilloscope.md`
- `README/Roadmap/demo/README.MetaLayerConsultationDemo.md`

Its purpose is narrower:

- define the bounded app/site as the composed browser environment for DME’s current usable surfaces,
- distinguish execution, inspection, and public-demo roles clearly,
- define how mode-switching should work without creating a new authority layer,
- define where source intake belongs,
- preserve lawful separation while allowing one coherent operator environment.

This note defines a **surface composition posture**.
It does not create a new runtime layer.
It does not create a new canon surface.
It does not authorize UI-level semantic uplift.

---

## 1. Why this note exists

DME now has enough browser-facing surfaces that “the site” needs a bounded definition.

The project already has or now expects:

- an execution shell,
- a lab/internal inspection HUD,
- a public-facing consultation/demo surface,
- bounded request preparation,
- bounded replay/reconstruction surfaces,
- and future drag-drop or direct file-intake capability.

Without an app-surface note, these can drift into feeling like:

- separate mini-products,
- conflicting control planes,
- or visually adjacent surfaces without explicit authority boundaries.

This note exists to prevent that drift.

---

## 2. Core rule

**The app/site is a composed environment, not a new authority layer.**

The app may unify multiple lawful surfaces in one browser environment.

It may not:

- turn composition into truth,
- turn convenience into canon,
- let display density redefine runtime meaning,
- or hide which surface is execution versus inspection versus public legibility.

The app is coordination.
It is not ontology.

---

## 3. Constitutional posture

The active staircase remains:

measurement → structure → runtime memory → recognition → canon → prediction → agency → ecology → symbolic → meta

No higher layer may be silently projected downward.

Accordingly:

- runtime remains below canon,
- query remains below truth,
- substrate remains below ontology,
- consensus remains promotion-only,
- adapters remain pre-ingest only,
- replay remains lens-bound,
- HUD and demo surfaces remain read-side,
- preservation class remains distinct from authority class.

The app/site may coordinate lawful surfaces.
It may not collapse their meanings.

---

## 4. The app/site in one sentence

The semantic oscilloscope app is the bounded browser environment that lets an operator ingest or select lawful sources, run them through the execution shell, inspect provenance and runtime evidence, prepare bounded requests, invoke bounded replay, and optionally view the same lawful outputs through a calmer public/demo mode.

---

## 5. Surface classes inside the app

The app should explicitly distinguish three surface classes.

### A. Execution surface

Purpose:

- select source family or source workflow
- choose adapter or import path
- perform bounded source intake
- trigger lawful runs
- prepare explicit consultation / activation requests
- prepare explicit replay requests

This surface is operational.

It may trigger lawful actions.
It may not become hidden semantic authority.

### B. Inspection surface

Purpose:

- expose provenance
- expose runtime evidence
- expose bounded interpretation
- expose request posture
- expose replay posture
- expose lineage / history / retained-tier visibility

This is the denser internal surface.

It remains read-side even when co-located with execution controls.

### C. Public/demo surface

Purpose:

- present the same lawful outputs more calmly
- preserve provenance-first public legibility
- support external explanation / socialization
- remain bounded and non-authoritative

This surface is not the main operator control plane.

---

## 6. Mode rule

The app may expose modes, but mode-switching must change **presentation posture**, not **truth conditions**.

The preferred early modes are:

### 6.1 Lab mode

Lab mode should expose:

- execution shell controls
- denser inspection surfaces
- request preparation
- replay preparation
- richer provenance / runtime evidence visibility
- request and replay logs
- bounded drill-down posture

Lab mode is for:
- operator use
- development
- inspection
- architecture demonstration
- bounded diagnostic work

### 6.2 Demo mode

Demo mode should expose:

- calmer object-focused presentation
- visible provenance
- visible runtime evidence summary
- bounded interpretation
- current request/review posture
- replay/history visibility at lower tempo
- explicit non-authority posture

Demo mode is for:
- external explanation
- public legibility
- collaboration conversations
- socialization with non-operators

### 6.3 Mode-switch rule

Mode-switching must **not**:

- recompute runtime meaning differently,
- alter request or replay object meaning,
- change what is authoritative,
- silently promote review posture,
- or hide the declared lens / retained-tier posture where replay is involved.

The same lawful outputs should feed both modes through a shared read-side shaping seam.

---

## 7. Shared tandem-adapter rule

The app should prefer one lawful tandem adapter/model seam that:

- accepts shell-emitted result/request/replay state,
- preserves provenance and lineage,
- shapes one internal/HUD-facing projection,
- shapes one public/demo-facing projection.

The tandem adapter may vary:

- pacing,
- density,
- section emphasis,
- drill-down posture,
- audience language tightness.

It may not vary:

- underlying evidence basis,
- declared lens,
- retained-tier posture,
- request/replay object identity,
- or authority boundary.

The rule is:

**same source, same lineage, same support basis, different audience posture.**

---

## 8. Source intake rule

Source intake belongs to the **execution side** of the app.

This includes future:

- drag-drop file intake,
- file chooser import,
- browser mic/device selection,
- workflow-specific source intake controls,
- source-family declaration where needed.

Source intake does **not** belong primarily to:

- the public demo surface,
- the read-side internal HUD,
- or any presentation-only object card.

This follows the active rule that source diversity may be coordinated in UI/frontend, but must normalize into the same lawful ingest boundary and remain below semantic authority.

---

## 9. Drag-drop intake posture

Future drag-drop intake is explicitly allowed inside the app so long as it remains:

- part of the execution surface,
- adapter-mediated,
- provenance-preserving,
- explicit about source family vs import format,
- and below runtime authority.

The drag-drop path should be understood as:

drag/drop or file selection  
→ adapter detection / validation  
→ lawful ingest-ready payload  
→ execution shell  
→ runtime / workbench / request / replay surfaces

It should **not** be treated as:
- “the demo ingests truth,”
- “the HUD owns runtime,”
- or “file import creates semantic authority.”

---

## 10. Entry surfaces and composition posture

The repo may continue to expose multiple top-level browser entries such as:

- `index.html`
- `execution.html`
- `demo.html`

These may remain separate entry surfaces during development.

The long-term app/site posture may still present them as one coherent semantic oscilloscope environment, provided their meanings remain explicit.

This means:

- multiple browser entrypoints are acceptable,
- one conceptual app/site is acceptable,
- one hidden authority blob is not acceptable.

Composition is allowed.
Authority collapse is not.

---

## 11. Read-side ordering rule across the app

All inspection-capable app surfaces should preserve the same preferred visual ordering:

1. Provenance
2. Runtime Evidence
3. Interpretation
4. Review / Request / Replay Surfaces

This applies in both lab mode and demo mode.

Differences in pacing or visual density are allowed.
Reversal of authority salience is not.

---

## 12. Request and replay posture inside the app

The app should preserve explicit surfaces for:

- consultation request preparation
- activation / review request preparation
- replay request preparation
- request history
- replay history

These objects remain:

- explicit
- bounded
- below canon
- below truth
- lineage-preserving
- inspectable

They may be visible in the app.
They do not become authority by visibility.

---

## 13. Relationship to retention and preserved outputs

The app may surface:

- current run state
- live workbench surfaces
- prepared request objects
- prepared replay objects
- later receipt-backed or packet-backed references

But it must remain explicit about:

- live vs durable posture,
- derived vs durable posture,
- retained tier used,
- replay support vs promotion,
- and preservation vs authority.

The app may help navigate preserved outputs.
It may not treat preservation duration as truth uplift.

---

## 14. What the app/site is not

The semantic oscilloscope app is not:

- a hidden canon engine
- a trust oracle
- a page-level ontology layer
- a semantic truth browser
- a public reputation system
- a replacement for runtime law
- a justification for blurring execution, inspection, and demo roles

It is a bounded composed environment for lawful operation and lawful viewing.

---

## 15. Immediate implementation posture

For the current phase, the app/site should evolve in this order:

### Step 1
Execution shell

### Step 2
Modular ingest adapter seam

### Step 3
Handoff / activation request surface

### Step 4
Reconstruction / replay surface

### Step 5
HUD / demo tandem adapter

### Step 6
Drag-drop or direct file-intake surface on the execution side

### Step 7
Mode-aware app composition polish for lab/demo usage

This keeps usability increasing without collapsing surface meaning.

---

## 16. Success condition

The app/site is successful when it can present one coherent operator environment in which:

- a source is selected or dropped,
- the source is normalized lawfully,
- a run is triggered explicitly,
- provenance and runtime evidence remain primary,
- bounded request and replay actions are visible,
- lab mode and demo mode show the same lawful outputs at different tempos,
- and no surface silently becomes truth, canon, or ontology.

---

## 17. One-line summary

The semantic oscilloscope app is the bounded browser environment that composes execution, inspection, replay, and public-demo surfaces into one lawful operator site while keeping source intake on the execution side, preserving provenance-first ordering, and preventing mode-switching or UI convenience from becoming a new authority layer.