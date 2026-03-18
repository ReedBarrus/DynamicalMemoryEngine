# Development Pressure Reference

## Purpose

This document guides development pressure, prioritization, and feature admission for the Dynamical Memory Engine.

It does **not** override:
- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- active Door boundaries

Its role is to help answer:

**What should we build next, and why is that complexity justified now?**

---

## 1. Realistic Development Path

This project should grow in a grounded sequence so usefulness and complexity stay coupled.

### Phase 1 — Canonical Substrate
**Timeframe:** now → ~12 months

**Goal:**  
Build a stable structural memory system for dynamical signals.

**Expected deliverables:**
- deterministic ingest pipeline
- trajectory storage
- basin / regime detection
- replayable history
- structural query tools
- trajectory visualization

**What this proves:**
- the system can faithfully capture state evolution
- structural memory can be stored, queried, and inspected honestly

**Possible artifacts:**
- open source library
- research demo
- interactive visualizer

**Likely audience:**
- ML researchers
- control engineers
- simulation developers

---

### Phase 2 — Analytical Tooling
**Timeframe:** ~1–2 years

**Goal:**  
Turn the substrate into a diagnostic instrument.

**Expected capabilities:**
- regime shift detection
- anomaly detection
- trajectory similarity search
- attractor discovery
- trajectory compression

**Example use cases:**
- debugging AI training
- robotics telemetry analysis
- simulation diagnostics
- complex system monitoring

**What this proves:**
- the substrate is not just a memory store
- it can answer meaningful diagnostic questions

**Possible outputs:**
- research tools
- consulting
- collaborations
- niche commercial software

---

### Phase 3 — Agent Substrate
**Timeframe:** ~2–4 years

**Goal:**  
Build agents that operate on structural memory rather than token prediction alone.

**Possible capabilities:**
- prediction loops
- regulation policies
- adaptive behavior
- memory recall
- regime-aware control

**Possible applications:**
- autonomous research agents
- adaptive control systems
- AI training monitors
- intelligent infrastructure

**Meaning:**
This is where phase-controller and agentic architecture become meaningful — but only after the substrate and tooling layers are truly stable.

---

## 2. Complexity Policy

Every new mechanism must justify its existence.

### Rule 1 — Capability Test
A feature must enable a new measurable capability.

Example:  
“detect regime transitions”

If it does not unlock a real new capability, reject or defer it.

### Rule 2 — Simplification Test
A feature may be admitted if it reduces total system complexity.

Example:  
replacing five ad-hoc heuristics with one general mechanism

### Rule 3 — Interpretability Test
A feature should improve one or more of:
- replayability
- explainability
- observability

### Rule 4 — Use-Case Justification
Every feature should connect to a plausible real problem domain.

If no real use case can be named, defer it.

### Rule 5 — Reversibility Principle
New mechanisms should be:
- modular
- removable
- testable

This prevents architectural lock-in.

### Rule 6 — Layer Legitimacy Test
A feature must be admitted at the **lowest lawful layer** and must not import deferred semantics into active scope.

This rule exists to keep development pressure subordinate to constitutional boundary law.

---

### 2.5 Inspection-surface pressure rule

As Door One stabilizes, development pressure may shift from missing runtime law to read-side semantic overhang.

This means a surface can remain code-lawful while still encouraging users to over-read review labels, interpretive summaries, or promotion-adjacent framing more strongly than the underlying provenance and runtime evidence justify.

When this happens, the next justified feature is usually **not** more semantic layering.
It is stronger inspection posture.

### Inspection-surface admission test

Before adding new interpretive, review, or promotion-adjacent display surfaces, ask:

1. Does the new surface preserve provenance visibility?
2. Does it preserve raw/runtime evidence visibility?
3. Does it visually separate runtime evidence from interpretation?
4. Does it visibly fence review posture away from canon or truth?
5. Does it improve replayability, explainability, or observability?

If the answer is no, defer the feature or tighten the inspection surface first.

### Preferred response to inspection-surface drift

When read-side semantic density begins to outrun provenance salience, prefer:

- provenance-first display ordering
- stronger runtime/audit visibility
- explicit derived / non-authoritative labeling
- review-surface demotion or collapse-by-default
- drill-down links from labels back to evidence

Prefer these before adding new semantics, new review packaging, or promotion-adjacent UX.

### Door One visual ordering guideline

For Door One inspection surfaces, the preferred evidence order is:

1. Provenance
2. Runtime Evidence
3. Interpretation
4. Review Surfaces

This ordering is not a new authority layer.
It is a read-side discipline intended to keep provenance and runtime evidence visually primary while Door One remains below canon.

---

## 3. Use-Case Contract

Every major feature should answer a real question.

| System Feature | Question It Answers |
|---|---|
| TrajectoryBuffer | Is the system converging or drifting? |
| Basin detection | Are we revisiting known regimes? |
| Trajectory query | Have we seen this behavior before? |
| Regime shift detection | When did the system change modes? |
| Structural similarity | What past states resemble this one? |

If a feature cannot answer a real question, it waits.

---

## 4. Development Flywheel

The intended loop is:

```text
new substrate capability
      ↓
enable new analysis
      ↓
discover useful questions
      ↓
identify real-world use cases
      ↓
add minimal features
      ↓
repeat