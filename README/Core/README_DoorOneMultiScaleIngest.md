# README_DoorOneMultiScaleIngest.md
# Dynamical Memory Engine — Door One Multi-Scale Ingest

## Status

This document defines the bounded multi-scale ingest posture for Door One.

It is a supporting implementation note.

It does **not** override:
- `README_MasterConstitution.md`
- `README_ConstitutionAppendix.md`
- `README_WorkflowContract.md`
- `README_RepoPlacementConstitution.md`
- `README/README_DoorOneRuntimeBoundary.md`
- `README/README_DoorOneAdapterPolicy.md`
- `README/README_DoorOneAcceptanceChecklist.md`

Its purpose is narrower:

- define what “multi-scale ingest” means in Door One,
- keep multi-scale work below canon,
- preserve one lawful ingest seam across multiple declared temporal lenses,
- define what is allowed now versus deferred,
- prevent probing/prediction/agency semantics from leaking into ingest work.

---

## 1. Constitutional posture

Door One remains below canon.

Multi-scale ingest is a lower-layer extension of:

- measurement,
- structure,
- runtime memory support,
- bounded recognition support.

It does **not** authorize:

- canon minting,
- prediction authority,
- active probing policy,
- intervention logic,
- symbolic reinterpretation,
- substrate ontology claims.

Multi-scale ingest is still ingest.

It is not a Door Two cognition surface.

---

## 2. Why this note exists

Door One is now stable enough that the next meaningful pressure is not only more source classes, but richer temporal observation across multiple declared scales.

Examples of this pressure include:

- coarse and fine sample-rate views,
- short-window and long-window parallel observation,
- multi-horizon segment visibility,
- cross-scale replay and comparison,
- temporal modulation analysis without yet performing active directed probing.

Without a note like this, multi-scale work can become ambiguous and drift upward into:

- prediction,
- probing,
- operational commitment,
- agentic observation strategy.

This note keeps the scope bounded.

---

## 3. Core rule

Door One may support multiple declared temporal lenses.

Door One may **not** silently turn multi-scale observation into:

- prediction,
- intervention,
- active probe control,
- canon,
- truth.

In practical terms:

source
→ lawful ingest boundary
→ one or more declared temporal lenses
→ lawful Door One runtime processing
→ bounded cross-scale comparison / inspection

The system may look at multiple scales.
It may not pretend that looking at multiple scales is already temporal intelligence.

---

## 4. What multi-scale ingest means

For Door One, multi-scale ingest means any lawful ingest or structural-processing posture where the same source is observed through more than one declared temporal lens.

Examples:

- different declared sample-rate views,
- short / medium / long window families,
- multiple hop sizes,
- multiple canonical grid resolutions,
- coarse/fine segmentation support derived from declared lenses.

The key property is:

**all scales must remain declared, provenance-preserving, and replay-honest.**

---

## 5. Allowed Door One multi-scale directions

### A. Multiple declared sampling lenses

Examples:

- nominal high-rate ingest with a lower-rate derived lens,
- imported file sampled at one rate but evaluated under more than one declared alignment/window lens,
- device input observed under different lawful time-grid choices.

Allowed purpose:

- improve observability,
- compare structural stability across scales,
- reveal whether a pattern is stable only at one timescale or across several.

### B. Parallel structural window families

Examples:

- short windows for transients,
- medium windows for local recurrence,
- long windows for regime continuity.

Allowed purpose:

- reveal different structural persistence horizons,
- support bounded comparison across temporal granularity.

### C. Cross-scale comparison as inspection

Examples:

- whether a segment boundary appears only at one scale,
- whether recurrence is robust across scales,
- whether basin grouping is scale-sensitive.

Allowed purpose:

- improve diagnostic honesty,
- support replayability and explainability,
- remain read-side or bounded-report oriented.

---

## 6. Required constraints

A lawful Door One multi-scale extension must preserve all of the following:

### Rule 1 — One ingest boundary

Multiple scales do not create multiple ingest contracts.

All source diversity and all scale diversity must still collapse through the same lawful Door One ingest boundary.

### Rule 2 — Explicit declared lenses

Every scale must be declared by policy or configuration.

No hidden scale inference.

No silent “best scale” selection masquerading as neutral ingest.

### Rule 3 — Provenance per scale

Cross-scale processing must preserve enough provenance to answer:

- what source produced this?
- which lens produced this view?
- which policy or window family was used?
- what scale relationships are declared rather than inferred?

### Rule 4 — Replay honesty per scale

If replay or reconstruction is shown at different scales, the lens for each replay must remain explicit.

No scale may be shown as “truer” merely because it is smoother, prettier, or more stable.

### Rule 5 — No authority inflation by scale count

Seeing the same pattern at more than one scale may strengthen confidence for inspection,
but it does not by itself mint canon or truth.

### Rule 6 — No probing semantics

Door One multi-scale ingest may passively compare declared lenses.

It may not:

- choose probes dynamically,
- alter observation policy based on inferred future behavior,
- manipulate source conditions,
- become a predictive control loop.

---

## 7. Explicitly allowed in Door One

The following are allowed as Door One work:

- multi-scale ingest notes and tests,
- declared parallel window families,
- cross-scale replay/hud/readout comparisons,
- scale-labeled runtime summaries,
- scale-aware provenance receipts,
- structural drift comparison across scales.

These are still lower-layer extensions.

---

## 8. Explicitly not authorized here

This note does **not** authorize:

- active temporal probing,
- adaptive probe cadence,
- intervention based on expected future structure,
- prediction authority from cross-scale recurrence,
- canon promotion from scale robustness alone,
- agency-like observation policy.

Those belong to later layers or later design packets.

---

## 9. Relation to Door Two

Door Two begins when trusted temporal cognition becomes active.

That includes:

- active canon,
- prediction,
- stronger temporal inference over trusted memory.

Multi-scale ingest may support Door Two later,
but it is not itself Door Two.

The crossing point occurs when scale handling becomes:

- active prediction,
- directed probing,
- or operational control over observation conditions.

That boundary must remain explicit.

---

## 10. Recommended first implementation posture

The preferred first multi-scale implementation posture is:

1. one lawful source,
2. one lawful ingest seam,
3. multiple declared structural lenses,
4. bounded cross-scale summaries,
5. read-side comparison first.

The preferred order is:

- note
- test seam
- bounded implementation
- inspection/readout
- only later consider stronger temporal cognition

---

## 11. Minimum useful experiment standard

A Door One multi-scale experiment is useful only if it can answer at least one real question such as:

- does a recurring pattern remain stable across more than one timescale?
- does a boundary only appear at short scale or also at long scale?
- does recurrence strengthen, weaken, or disappear across declared lenses?
- does a coarse lens hide instability that a fine lens reveals?

If the experiment cannot answer a real question, defer it.

---

## 12. Current recommendation

For the current phase:

1. treat multi-scale ingest as a late Door One extension,
2. keep it provenance-first and replay-honest,
3. implement passive declared lenses before any probing logic,
4. defer temporal modulative probing to Door Two design.

That is the preferred bounded direction.