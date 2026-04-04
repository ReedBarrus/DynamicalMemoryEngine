# README_DoorOneAcceptanceChecklist.md
# Dynamical Memory Engine — Door One Acceptance Checklist

## Metadata
```yaml
address_id: core.acceptance_checklist.door_one.current
object_class: acceptance_checklist
object_label: Door One Acceptance Checklist
file_path: README/Core/README_DoorOneAcceptanceChecklist.md
repo_zone: README/Core/

bounded_question: What counts as Door One accepted enough for the current phase without silently promoting Door Two pressure into current scope?
declared_role: Freeze-line checklist for current Door One acceptance.
explicit_non_role: Not a full surface inventory, not a development roadmap, not a canon note.

scope_coverage:
  - current Door One acceptance rule
  - required acceptance groups
  - evidence of acceptance
  - explicit deferrals
known_omissions:
  - full current seam inventory
  - full capability-status audit
  - developmental sequencing after acceptance

authority_posture: supporting_accounting
explicit_non_claims:
  - not full implementation proof by itself
  - not current app-surface map
  - not Door Two activation
  - not development roadmap

current_status: active
audit_status: crosschecked_against_repo
dominant_telemetry:
  - drift
known_risks:
  - freeze-line can regrow duplicated seam accounting
  - accepted enough can be overread as fully complete

  ```

## Purpose

This document defines the practical acceptance checklist for Door One.

It is a supporting operational reference.

It does not override:

README_MasterConstitution.md
README_ConstitutionAppendix.md
README_WorkflowContract.md
README_RepoPlacementConstitution.md
README_DoorOneRuntimeBoundary.md
README_DoorOneProvenanceRetention.md

Its purpose is narrower:

define what counts as “Door One accepted enough” for the current phase,
distinguish stabilized scope from deferred scope,
reduce drift by making the freeze-line explicit,
and preserve a bounded stopping point before Door Two design pressure begins.

This note is the freeze-line.
It is not the growth-line.
For the next lawful development legs, see:

README_DoorOneDevelopmentalOutline.md

For compact current Door One structural accounting, see:

README_DoorOneSurfaceMap.md

For current capability-status posture, see:

README.DeclaredVsMechanizedAudit.md
## 1. Constitutional posture

Door One remains below canon.

Door One includes:

measurement
structure
runtime memory
perception / bounded recognition
substrate organization
read-side runtime inspection
readiness evidence accumulation

Door One does not include:

canon minting
prediction authority
agency
ecology
symbolic authority
meta-governance

Acceptance in this document means:

stabilized enough for current phase use,
not fully finished forever,
not promoted into Door Two.
## 2. Acceptance rule

Door One is “accepted enough” when all required checklist groups below are true:

runtime seams are lawful
inspection surfaces are lawful
provenance and retention are lawful
anti-bypass protections are test-backed
active scripts remain thin
deferred layers remain deferred
remaining open items are named explicitly rather than silently leaking upward.

This note should be read together with:

README_DoorOneRuntimeBoundary.md for runtime seam law
README_DoorOneInspectionSurfacePosture.md for read-side law
README_DoorOneSurfaceMap.md for compact current seam accounting
README.DeclaredVsMechanizedAudit.md for declared / displayed / partial / mechanized status posture.
# 3. Acceptance groups
## A. Runtime seam acceptance
Required
 lawful repeated-run execution through DoorOneExecutiveLane
 lawful single-run runtime through DoorOneOrchestrator
 repeated-run accumulation through CrossRunSession
 lawful inspection assembly through DoorOneWorkbench
 no active Door One surface mints canon
 no active Door One surface promotes on stability or recurrence alone.
Evidence of acceptance
 orchestrator contract tests pass
 executive lane contract tests pass
 workbench contract tests pass
 anti-bypass contract suite passes.

Reference:

README_DoorOneRuntimeBoundary.md
README_DoorOneSurfaceMap.md
## B. Input seam acceptance
Required
 synthetic raw ingest path is working
 AnalogSamplerOp flush output can enter through the same lawful ingest boundary
 pre-ingest adapters remain pre-ingest only
 arbitrary semantic payloads are rejected at the executive seam.
Evidence of acceptance
 synthetic live runner works
 sampler-backed executive ingest path works
 anti-bypass suite verifies sampler flush acceptance and arbitrary semantic payload rejection.

Reference:

README_DoorOneAdapterPolicy.md
README_IngestAdapterMatrix_v0.md
README_SourceFamilyWorkflowTypes.md
## C. Inspection surface acceptance
Required
 terminal HUD renders lawful runtime/workbench inspection surfaces
 browser HUD exists as a lawful read-side structural inspection surface
 HUDs do not alter runtime meaning
 HUDs do not imply truth, canon, or ontology
 workbench remains integration-only and below canon.
Evidence of acceptance
 HUD runtime tests pass
 HUD workbench tests pass
 anti-bypass suite verifies HUD non-authority posture.

Reference:

README_DoorOneInspectionSurfacePosture.md
README_DoorOneSurfaceMap.md
README.DeclaredVsMechanizedAudit.md
## D. Provenance / retention acceptance
Required
 live output is bounded
 top-level latest pointers remain available
 durable provenance receipts survive live cycle pruning
 provenance retention remains script-side only and does not alter runtime semantics
 live snapshots are not treated as the permanent archive.
Evidence of acceptance
 README_DoorOneProvenanceRetention.md exists and matches current script behavior
 live runner writes receipts into durable provenance storage
 provenance retention test suite passes.

Reference:

README_ContinuousIngestRetentionLadder.md
README_DeterministicInvarianceThreshold.md
## E. Promotion boundary acceptance
Required
 ConsensusOp remains explicit promotion boundary only
 consensus review outputs review posture only in Door One
 defer does not promote
 readiness does not promote
 dossier existence does not promote.
Evidence of acceptance
 consensus contract tests pass
 anti-bypass suite verifies non-minting / review-only behavior.

Reference:

README_MasterConstitution.md
README_ConstitutionAppendix.md
## F. Anti-bypass acceptance
Required
 executive seam cannot be bypassed with semantic payloads
 workbench cannot mint canon by assembly
 cross-run cannot promote
 readiness remains evidence only
 HUD remains read-side only
 consensus remains explicit review boundary only.
Evidence of acceptance
 tests/test_door_one_anti_bypass_contracts.js passes.
G. Repo and placement acceptance
Required
 runtime coordinators live in runtime/
 deterministic operators / pre-ingest adapters live in operators/
 HUDs live in hud/
 runners live in scripts/
 tests are grouped by what they verify
 generated outputs are not treated as authority surfaces.
Evidence of acceptance
 repo placement matches the active target layout closely enough for the current phase
 recent runtime boundary docs and tests reference correct active file paths.

Reference:

README_RepoPlacementConstitution.md
## H. Current accepted deliverables

Door One may be considered accepted enough only if all of the following are present and working:

 lawful repeated-run execution via DoorOneExecutiveLane
 lawful single-run runtime via DoorOneOrchestrator
 lawful workbench assembly via DoorOneWorkbench
 lawful terminal HUD inspection via DoorOneHUD
 browser structural inspection surface present in hud/
 bounded live runner
 durable provenance receipts
 anti-bypass suite
 runtime boundary note
 provenance retention note.

For present structural accounting of these deliverables, use:

README_DoorOneSurfaceMap.md

For present capability-status posture of these deliverables, use:

README.DeclaredVsMechanizedAudit.md
## I. Explicitly not required yet

The following are not required for Door One acceptance:

 active canon minting
 C1 emission
 prediction loops
 agency logic
 symbolic cognition
 meta-governance
 bounded Door One live provenance digest tested
 final long-term replay digest pipeline
 bounded archive/pinning system
 polished browser HUD aesthetics
 continuous ingest production hardening.

These may be prepared conceptually, but they are not required to keep Door One accepted enough for the present phase.

## J. Follow-on items that do not currently block acceptance

The following may be useful next, but do not invalidate current Door One acceptance:

stronger replay/reconstruction fidelity hardening
query expansion beyond current-run artifact support
retained-tier retrieval/navigation hardening
richer app-surface composition and continuity
consultation lifecycle hardening
canon-support preparation below actual promotion.

These belong to the developmental line, not to the acceptance freeze-line.

Reference:

README_DoorOneDevelopmentalOutline.md
# 4. One-line review question

Before saying Door One is “done enough,” ask:

Are the active runtime, ingest, inspection, provenance, anti-bypass, and placement boundaries lawful and test-backed enough for the current phase, while all higher-order pressure remains explicitly deferred rather than silently leaking upward?

# 5. One-line summary

The Door One Acceptance Checklist defines the bounded freeze-line at which Door One is lawful and stable enough for current-phase use without mistaking that stabilization for Door Two activation, canon authority, or permanent completion.