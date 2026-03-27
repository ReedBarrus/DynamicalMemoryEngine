# README_DoorOneSurfaceMap.md
# Dynamical Memory Engine — Door One Surface Map

## Status

This document is the compact accounting surface for Door One.

It is a supporting reference note.

It does **not** override:
- `README_MasterConstitution.md`
- `README_ConstitutionAppendix.md`
- `README_WorkflowContract.md`
- `README_RepoPlacementConstitution.md`
- `README/Core/README_DoorOneRuntimeBoundary.md`
- `README/Core/README_DoorOneAcceptanceChecklist.md`

Its purpose is narrower:

- account for the active Door One system in one place,
- distinguish runtime seams from inspection surfaces,
- distinguish inspection surfaces from preservation surfaces,
- point to the governing note or contract for each surface,
- reduce README sprawl by giving Door One one compact index.

---

## 1. Constitutional posture

Door One remains below canon.

The active constitutional order remains:

```text
measurement → structure → runtime memory → recognition
→ canon → prediction → agency → ecology → symbolic → meta
```

For Door One, the active system remains limited to lower lawful layers plus bounded recognition support.

Inherited boundary rules remain in force:

runtime is not canon,
query is not truth,
substrate is not ontology,
consensus is promotion-only,
scripts and HUDs are read-side only,
preservation class is not authority class.

This document is an accounting surface only.
It does not create a new layer or new authority.

## 2. Door One mission

Door One exists to:

accept lawful raw ingest input,
derive bounded structural runtime artifacts,
support repeated-run comparison,
assemble lawful read-side inspection surfaces,
accumulate bounded evidence for readiness without silently promoting canon.

Door One does not exist to:

mint canon,
create prediction authority,
create agency authority,
reinterpret substrate as ontology,
treat display as truth,
treat preservation as legitimacy.

## 3. Active Door One stack

The active Door One stack is:

raw ingest input
→ DoorOneExecutiveLane
→ DoorOneOrchestrator
→ CrossRunSession
→ DoorOneWorkbench
→ DoorOneHUD / DoorOneStructuralMemoryHud.jsx

This is the current operational chain for repeated-run execution, inspection assembly, and read-side visibility.

The stack is explicitly evidenced in the runtime boundary note and in the current executive lane implementation, where the lane coordinates orchestrator execution, cross-run accumulation, and workbench assembly without minting canon or redefining runtime meaning.

## 4. Runtime seams

These are the active runtime coordinators and bounded execution surfaces.

A. DoorOneExecutiveLane

Role: repeated-run runtime coordinator and normalization gate.

Primary responsibilities:

normalize accepted Door One input shapes,
validate lawful raw ingest input,
coordinate single-run execution through the orchestrator,
add bounded repeated-run context,
request workbench assembly,
expose latest read-side surfaces.

May not:

reinterpret ingest meaning,
mint canon,
create prediction authority,
bypass orchestrator contracts,
turn read-side assembly into semantic authority.

Primary references:

runtime/DoorOneExecutiveLane.js
README/Core/README_DoorOneRuntimeBoundary.md
README/Core/README_DoorOneAdapterPolicy.md
README/Core/README_IngestAdapterMatrix_v0.md
B. DoorOneOrchestrator

Role: single-run end-to-end Door One coordinator.

Primary responsibilities:

execute lawful single-run processing,
separate artifacts / substrate / summaries / audit,
preserve deterministic bounded output,
preserve audit visibility.

May not:

mint canon,
collapse audit into summaries,
claim ontology from substrate organization,
collapse runtime evidence into promotion.

Primary references:

runtime/DoorOneOrchestrator.js
README/Core/README_DoorOneRuntimeBoundary.md
C. CrossRunSession

Role: bounded observational repeated-run accumulation.

Primary responsibilities:

retain bounded run history,
produce observational cross-run comparison,
support readiness inspection.

May not:

promote canon,
define truth,
replace consensus,
overwrite single-run runtime evidence.

Primary references:

runtime/CrossRunSession.js
README/Core/README_DoorOneRuntimeBoundary.md
D. DoorOneWorkbench

Role: integration and inspection assembly surface.

Primary responsibilities:

assemble runtime outputs,
include bounded interpretation,
include optional cross-run context,
include readiness / dossier / bounded consensus review surfaces.

May not:

mint C1,
redefine runtime meaning,
promote on readiness,
promote on defer,
act as prediction or UI truth.

Primary references:

runtime/DoorOneWorkbench.js
README/Core/README_DoorOneRuntimeBoundary.md
README/Core/README_DoorOneInspectionSurfacePosture.md

## 5. Inspection surfaces

These are read-side visibility surfaces only.

A. DoorOneHUD.js

Role: terminal inspection surface.

Purpose: compact textual visibility into lawful Door One runtime and workbench outputs.

B. DoorOneStructuralMemoryHud.jsx

Role: browser inspection surface.

Purpose: browser-side structural memory inspection over lawful exported Door One outputs.

C. Inspection ordering rule

The preferred visual order for Door One inspection surfaces is:

Provenance
Runtime Evidence
Interpretation
Review Surfaces

Inspection surfaces may improve visibility, but they may not create semantic authority, infer canon, or turn styling into evidence. That provenance-first ordering is explicitly required by the inspection posture note.

Primary references:

hud/DoorOneHUD.js
hud/DoorOneStructuralMemoryHud.jsx
hud/DoorOneStructuralMemoryHudModel.js
README/Core/README_DoorOneInspectionSurfacePosture.md
README/Core/README_DoorOneRuntimeBoundary.md

## 6. Preservation surfaces

These are bounded preservation and replay-support surfaces.
They are preservation-only, not promotion.

A. Ephemeral live outputs

Examples:

out_live/cycle_*
out_live/latest_workbench.json
out_live/latest_run_result.json
out_live/latest_cross_run_report.json
out_live/session_summary.json

Role: current-cycle inspection and convenience.

Status: bounded and prunable.

The live runner output posture is already visible in current usage, where live runs write bounded cycle directories, latest pointers, and session summaries into out_live/.

B. Durable provenance receipts

Examples:

durable receipt files under provenance storage

Role: minimum replay-honest durable lineage surface.

Status: survives live pruning.

C. Live provenance digest

Examples:

regenerable digest surfaces over durable receipts

Role: derived replay convenience summary over durable receipts.

Status: regenerable; receipts outrank digest.

D. Pin packets

Example output zone:

pinned provenance packet outputs

Role: explicit bounded preserved replay/review packets.

E. Archive bundles

Example output zone:

archived provenance bundle outputs

Role: longer-horizon preservation bundles built from pinned packets.

Preservation classes, replay posture, and the separation between live outputs, receipts, digest, pinning, and archive are governed by the provenance retention, pin/archive policy, and continuous-ingest retention ladder notes.

Primary references:

README/Core/README_DoorOneProvenanceRetention.md
README/Core/README_DoorOnePinArchivePolicy.md
README/Core/README_ContinuousIngestRetentionLadder.md
scripts/run_door_one_provenance_digest.js
scripts/run_door_one_pin_packet.js
scripts/run_door_one_archive_bundle.js

## 7. Governing Door One notes

Door One currently depends on the following supporting notes.

Core
README/Core/README_DoorOneRuntimeBoundary.md
operational boundary, seams, allowed inputs/outputs, read-side posture
README/Core/README_DoorOneProvenanceRetention.md
bounded live retention and durable provenance receipt posture
README/Core/README_DoorOneAdapterPolicy.md
lawful pre-ingest adapter posture and required ingest boundary
README/Core/README_IngestAdapterMatrix_v0.md
practical ingest / adapter matrix and accepted entry forms
README/Core/README_DoorOneInspectionSurfacePosture.md
provenance-first inspection ordering and semantic-drift prevention
README/Core/README_DoorOnePinArchivePolicy.md
live / receipt / digest / pin / archive preservation classes
README/Core/README_ContinuousIngestRetentionLadder.md
bounded continuous-ingest retention ladder and replay legitimacy posture
README/Core/README_DoorOneAcceptanceChecklist.md
practical Door One acceptance and current freeze line
README/Core/README_DevelopmentPressure.md
development pressure and feature-admission discipline for the current phase
Experiments
README/Experiments/README_DoorOneRealDeviceExperiment.md
README/Experiments/README_DoorOneMultiScaleIngest.md
README/Experiments/README_DoorOneContinuousReplayExperiment.md
Diagnostics
README/Diagnostics/README.MinimalViableChannelSet(MVCS).md
README/Diagnostics/README.BasinIdentityDiagnosticPosture.md
README/Diagnostics/README.MVCS_HarmonicPlacement_Probe.md
README/Diagnostics/README.BoundaryConditionedBasinFormation.md
Result interpretation
README/ResultInterpretation/README_DoorOneAudioSliceInterpretation.md
Placement law
README_RepoPlacementConstitution.md

## 8. Tests by seam

Door One has bounded contract coverage across the major seams.

Runtime seams
tests/test_door_one_orchestrator.js
tests/test_door_one_executive_lane.js
tests/test_door_one_workbench.js
Inspection surfaces
tests/test_door_one_hud_workbench.js
tests/test_door_one_structural_memory_hud.js
Anti-bypass / boundary protection
tests/test_door_one_anti_bypass_contracts.js
Provenance / preservation
tests/test_door_one_live_provenance_retention.js
tests/test_door_one_provenance_digest.js
tests/test_door_one_pin_packet.js
tests/test_door_one_archive_bundle.js
Ingest hardening
tests/test_door_one_ingest_hardening.js

This grouping is by seam responsibility, not chronology.

## 9. Current accepted Door One state

Door One is currently accepted enough for the present phase when read through the practical checklist.

That means, in compact form:

lawful repeated-run execution exists,
lawful single-run orchestration exists,
lawful workbench assembly exists,
lawful terminal and browser inspection surfaces exist,
bounded live runner exists,
durable receipts exist,
bounded digest support exists,
explicit pin / archive policy exists,
bounded pin packet and archive bundle flows exist,
anti-bypass protections are test-backed,
Door One remains below canon.

This matches both the acceptance checklist and current live/workbench behavior, where repeated live runs, workbench assembly, latest pointers, and bounded outputs are already functioning.

This does not mean Door One is finished forever.
It means the current phase is stabilized enough to use without silently leaking upward into Door Two.

## 10. Explicitly deferred beyond Door One

The following remain outside current active Door One authority:

active C1 minting,
trusted canonical memory operation,
prediction loops,
agency logic,
symbolic cognition,
meta-governance.

These may be discussed architecturally, but they do not define current Door One runtime meaning. That remains fixed by the Master Constitution and the Door One runtime boundary.

## 11. Current follow-on pressure

The current follow-on pressure after Door One stabilization is:

real-device usefulness testing,
replay-honest continuous replay evaluation,
passive multi-scale ingest under declared lenses,
transform-lens evaluation only after current findings are absorbed cleanly,
eventual Door Two design packet work.

That ordering is consistent with the development-pressure note, the real-device experiment note, the continuous replay experiment, and the multi-scale ingest posture.

Read-side or preservation convenience must remain subordinate to constitutional boundary law.

## 11A. Current real-source lens outcome

The current real-source evaluation branch has now produced a stable active lens outcome.

For the present experiment families:

- medium FFT/Hann remains the preferred active real-source lens,
- real FFT cleanup remains a future backend/runtime optimization candidate,
- wavelet structural lenses are deferred for the current steady-state families,
- passive short/long scales remain lawful comparison lenses with known caveats, not active defaults.

This means the current real-source probe branch is materially stabilized enough to support a later probe-surface nexus and admission map without silently reopening the transform/scale question.

## 12. How to use this note

Use this note when asking:

what surfaces currently make up Door One?
where does a file or helper belong conceptually?
which README governs this seam?
is this thing runtime, inspection, preservation, experiment, or diagnostic?
what is active now versus deferred?

If a question is still ambiguous after reading this note, defer to:

README_MasterConstitution.md
README/Core/README_DoorOneRuntimeBoundary.md
README/Core/README_DoorOneAcceptanceChecklist.md
README_WorkflowContract.md

in that order for the relevant type of question.