# README_DoorOneAcceptanceChecklist

## Purpose

This document defines the practical acceptance checklist for Door One.

It is a supporting operational reference.
It does **not** override the Master Constitution, Constitution Appendix, Workflow Contract, Repo Placement Constitution, Door One Runtime Boundary, or Door One Provenance Retention note.

Its purpose is narrower:

* define what counts as "Door One complete enough" for the current phase,
* distinguish stabilized scope from deferred scope,
* reduce drift by making acceptance explicit,
* provide a bounded freeze line before Door Two design pressure begins.

## Constitutional posture

Door One remains below canon.

Door One includes:

* measurement,
* structure,
* runtime memory,
* perception / bounded recognition,
* substrate organization,
* read-side runtime inspection,
* readiness evidence accumulation.

Door One does **not** include:

* canon minting,
* prediction authority,
* agency,
* ecology,
* symbolic authority,
* meta-governance.

Acceptance in this document means:

* stabilized enough for current phase use,
* not fully finished forever,
* not promoted into Door Two.

## Acceptance rule

Door One is "accepted enough" when all required checklist groups below are true:

* runtime seams are lawful,
* inspection surfaces are lawful,
* provenance and retention are lawful,
* anti-bypass protections are test-backed,
* active scripts remain thin,
* deferred layers remain deferred,
* the remaining open items are explicitly named rather than silently leaking upward.

---

## A. Runtime seam acceptance

### Required

* [x] `DoorOneOrchestrator` runs lawful Door One batches successfully.
* [x] `DoorOneExecutiveLane` accepts only lawful raw ingest input or normalized pre-ingest adapter output.
* [x] repeated-run accumulation through `CrossRunSession` is functioning.
* [x] `DoorOneWorkbench` assembles a lawful inspection surface from runtime outputs.
* [x] no active Door One surface mints canon.
* [x] no active Door One surface promotes on stability or recurrence alone.

### Evidence of acceptance

* [x] orchestrator contract tests pass.
* [x] executive lane contract tests pass.
* [x] workbench contract tests pass.
* [x] anti-bypass contract suite passes.

---

## B. Input seam acceptance

### Required

* [x] synthetic raw ingest path is working.
* [x] `AnalogSamplerOp` flush output can enter through the same lawful raw ingest boundary.
* [x] pre-ingest adapters remain pre-ingest only.
* [x] arbitrary semantic payloads are rejected at the executive seam.

### Evidence of acceptance

* [x] synthetic live runner works.
* [x] sampler-backed executive ingest path works.
* [x] anti-bypass suite verifies sampler flush acceptance and arbitrary semantic payload rejection.

---

## C. Inspection surface acceptance

### Required

* [x] terminal HUD renders lawful runtime/workbench inspection surfaces.
* [x] browser HUD exists as a lawful read-side structural inspection surface.
* [x] HUDs do not alter runtime meaning.
* [x] HUDs do not imply truth, canon, or ontology.
* [x] workbench remains integration-only and below canon.

### Evidence of acceptance

* [x] HUD runtime tests pass.
* [x] HUD workbench tests pass.
* [x] anti-bypass suite verifies HUD non-authority posture.

---

## D. Provenance / retention acceptance

### Required

* [x] live output is bounded.
* [x] top-level latest pointers remain available.
* [x] durable provenance receipts survive live cycle pruning.
* [x] provenance retention remains script-side only and does not alter runtime semantics.
* [x] live snapshots are not treated as the permanent archive.

### Evidence of acceptance

* [x] `README_DoorOneProvenanceRetention.md` exists and matches current script behavior.
* [x] live runner writes receipts into durable provenance storage.
* [x] provenance retention test suite passes.

---

## E. Promotion boundary acceptance

### Required

* [x] `ConsensusOp` remains explicit promotion boundary only.
* [x] consensus review outputs review posture only in Door One v0.1.
* [x] defer does not promote.
* [x] readiness does not promote.
* [x] dossier existence does not promote.

### Evidence of acceptance

* [x] consensus contract tests pass.
* [x] anti-bypass suite verifies non-minting / review-only behavior.

---

## F. Anti-bypass acceptance

### Required

* [x] executive seam cannot be bypassed with semantic payloads.
* [x] workbench cannot mint canon by assembly.
* [x] cross-run cannot promote.
* [x] readiness remains evidence only.
* [x] HUD remains read-side only.
* [x] consensus remains explicit review boundary only.

### Evidence of acceptance

* [x] `tests/test_door_one_anti_bypass_contracts.js` passes.

---

## G. Repo and placement acceptance

### Required

* [x] runtime coordinators live in `runtime/`.
* [x] deterministic operators / pre-ingest adapters live in `operators/`.
* [x] HUDs live in `hud/`.
* [x] runners live in `scripts/`.
* [x] tests are grouped by what they verify.
* [x] generated outputs are not treated as authority surfaces.

### Evidence of acceptance

* [x] repo placement matches the active target layout closely enough for the current phase.
* [x] recent runtime boundary docs and tests reference correct active file paths.

---

## H. Current accepted deliverables

Door One may be considered accepted enough only if all of the following are present and working:

* [x] lawful repeated-run execution via `DoorOneExecutiveLane`
* [x] lawful single-run runtime via `DoorOneOrchestrator`
* [x] lawful workbench assembly via `DoorOneWorkbench`
* [x] lawful terminal HUD inspection via `DoorOneHUD`
* [x] browser structural inspection surface present in `hud/`
* [x] bounded live runner
* [x] durable provenance receipts
* [x] anti-bypass suite
* [x] runtime boundary note
* [x] provenance retention note

---

## I. Explicitly not required yet

The following are **not** required for Door One acceptance:

* [ ] active canon minting
* [ ] C1 emission
* [ ] prediction loops
* [ ] agency logic
* [ ] symbolic cognition
* [ ] meta-governance
* [x] bounded Door One live provenance digest tested
* [ ] final long-term replay digest pipeline
* [x] bounded archive/pinning system
* [ ] polished browser HUD aesthetics
* [ ] continuous ingest production hardening

These may be prepared conceptually, but they are not acceptance requirements for the current phase.

---

## J. Known follow-on items after acceptance

These are legitimate next-phase or near-next-phase items, but they do not block Door One acceptance:

* [x] adapter policy note for file / device / IoT pre-ingest sources
* [x] bounded replay/digest pipeline
* [x] explicit pinning / archive packet policy
* [ ] continuous ingest retention hardening beyond pseudo-live mode
* [ ] finalized long-horizon archive/replay system
* [ ] Door Two design packet for canon activation criteria
* [ ] real-device Door One usefulness experiment with bounded success threshold
* [ ] passive multi-scale ingest test seam
* [ ] transform-lens evaluation note (e.g. real FFT / wavelet structural lens)
* [ ] evidence drill-down / provenance-hover pass for browser HUD

---

## K. Acceptance decision rule

Door One should be treated as accepted enough for the current phase when:

1. all required groups A–H are satisfied,
2. nothing in group I is being silently smuggled in as if already active,
3. group J remains explicitly labeled as follow-on work.

If a desired feature pressures Door One upward into canon, prediction, agency, symbolic meaning, or ontology, that pressure does **not** count as a Door One incompleteness defect by itself.

---

## L. Practical summary

Door One is complete enough when it is:

* lawful,
* replay-honest,
* provenance-conscious,
* inspection-first,
* bounded,
* test-backed,
* and still clearly below canon.

That is the acceptance line.

---

## M. Current phase note

At the current checkpoint, Door One is materially stabilized at the runtime, provenance, and anti-bypass seam levels.

Still intentionally open before a stronger acceptance freeze:

* explicit checklist confirmation for any remaining unchecked runtime evidence items,

These open items remain follow-on work unless explicitly promoted into current blocking scope.
