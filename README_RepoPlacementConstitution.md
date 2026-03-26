# README_RepoPlacementConstitution.md
# Dynamical Memory Engine — Repo Placement Constitution

## Status

This document governs file placement and repo topology for the Dynamical Memory Engine.

It is authoritative for:
- where files belong
- how new files should be placed
- how import paths should be interpreted
- how repo growth should be coordinated

It is **not** authoritative for:
- artifact meaning
- layer meaning
- promotion/canon semantics
- runtime ontology

Those remain governed by:
- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README_ConstitutionAppendix.md`

---

## 1. Placement Principle

Repo topology is coordination, not ontology.

File location does not change layer meaning or artifact authority. Placement exists to keep the implementation legible, runnable, and stable.

New files must be placed by **primary responsibility**, not convenience.

---

## 2. Canonical Repo Zones

### Root

Root is reserved for:
- constitutional / governance docs
- package/runtime config
- true top-level entry metadata only

Allowed examples:
- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README_ConstitutionAppendix.md`
- `README_RepoPlacementConstitution.md`
- `package.json`
- `vite.config.js`
- `index.html`

Runtime code, tests, helpers, and scripts should not normally live at root.

### `README/`

This directory contains supporting reference notes, boundary notes, phase checklists, policy notes, surface maps, implementation-governance notes, and operator handoff templates that are not themselves constitutional authority.

Intended placements:
- `README/README_DevelopmentPressure.md`
- `README/README_ClaudeTaskRequest.md`
- `README/README_DoorOneAcceptanceChecklist.md`
- `README/README_DoorOneAdapterPolicy.md`
- `README/README_DoorOneInspectionSurfacePosture.md`
- `README/README_DoorOnePinArchivePolicy.md`
- `README/README_DoorOneProvenanceRetention.md`
- `README/README_DoorOneRuntimeBoundary.md`
- `README/README_DoorOneSurfaceMap.md`
- `README/README_DynamicalMemorySystemGlossary.md`
- `README/README_DoorOneMultiScaleIngest.md`

Placement note:
`README_ClaudeTaskRequest.md` is an operator handoff template for bounded implementation transfer. It is not constitutional authority and does not override the workflow contract.

### `operators/`

This directory contains deterministic runtime operators and closely related substrate components.

Subdirectories:

```text
operators/
  ingest/
  clock/
  window/
  transform/
  compress/
  anomaly/
  merge/
  reconstruct/
  query/
  basin/
  consensus/
  sampler/
  trajectory/
  substrate/
```

Canonical intended placements:
- `operators/ingest/IngestOp.js`
- `operators/clock/ClockAlignOp.js`
- `operators/window/WindowOp.js`
- `operators/transform/TransformOp.js`
- `operators/compress/CompressOp.js`
- `operators/anomaly/AnomalyOp.js`
- `operators/merge/MergeOp.js`
- `operators/reconstruct/ReconstructOp.js`
- `operators/query/QueryOp.js`
- `operators/basin/BasinOp.js`
- `operators/consensus/ConsensusOp.js`
- `operators/sampler/AnalogSamplerOp.js`
- `operators/trajectory/SegmentTracker.js`
- `operators/trajectory/TrajectoryBuffer.js`
- `operators/substrate/MemorySubstrate.js`

Placement rule:
place a file in the folder matching its primary responsibility, not merely who imports it.

### `runtime/`

This directory contains importable runtime coordinators.

These files may orchestrate existing operators and substrate calls, but must not become new semantic authority layers.

Canonical intended placements:
- `runtime/DoorOneOrchestrator.js`
- `runtime/TrajectoryInterpretationReport.js`
- `runtime/run_hud_demo.js`
- `runtime/AttentionMemoryReport.js`
- `runtime/CrossRunDynamicsReport.js`
- `runtime/CrossRunSession.js`
- `runtime/PromotionReadinessReport.js`
- `runtime/CanonCandidateDossier.js`
- `runtime/DoorOneWorkbench.js`
- `runtime/DoorOneExecutiveLane.js`

### `hud/`

This directory contains inspection tooling and display surfaces.

HUD code is read-side tooling only. It must consume lawful runtime outputs and must not define runtime meaning.

Canonical intended placements:
- `hud/DoorOneHUD.js`
- `hud/DoorOneStructuralMemoryHud.jsx`
- `hud/DoorOneStructuralMemoryHudDemo.jsx`
- `hud/DoorOneStructuralMemoryHudModel.js`
- `hud/main.jsx`
- `styles.css`

### `scripts/`

This directory contains standalone executable entrypoints, demos, and developer-facing runners.

Scripts should be thin wrappers around importable runtime code whenever possible.

Canonical intended placements:
- `scripts/run_pipeline_substrate.js`
- `scripts/run_door_one_workbench.js`
- `scripts/run_door_one_live.js`
- `scripts/run_door_one_provenance_digest.js`
- `scripts/run_door_one_pin_packet.js`
- `scripts/run_door_one_archive_bundle.js`
- `scripts/run_door_one_audio_file_experiment.js`
- `scripts/run_door_one_audio_file_slice.js`

### `tests/`

This directory contains bounded contract and regression suites.

Canonical intended placements:
- `tests/test_substrate_contracts.js`
- `tests/test_door_one_orchestrator.js`
- `tests/test_door_one_hud.js`
- `tests/test_door_one_contracts.js`
- `tests/test_trajectory_interpretation_report.js`
- `tests/test_attention_memory_report.js`
- `tests/test_cross_run_dynamics_report.js`
- `tests/test_cross_run_session.js`
- `tests/test_promotion_readiness_report.js`
- `tests/test_canon_candidate_dossier.js`
- `tests/test_consensus_op.js`
- `tests/test_door_one_workbench.js`
- `tests/test_door_one_hud_workbench.js`
- `tests/test_door_one_executive_lane.js`
- `tests/test_door_one_live_provenance_retention.js`
- `tests/test_door_one_anti_bypass_contracts.js`
- `tests/test_door_one_structural_memory_hud.js`
- `tests/test_door_one_provenance_digest.js`
- `tests/test_door_one_pin_packet.js`
- `tests/test_door_one_archive_bundle.js`
- `tests/test_door_one_ingest_hardening.js`

Rule:
new test files should be grouped by what they verify, not appended indefinitely to unrelated suites.

### `fixtures/`

This directory contains synthetic inputs, reusable test signals, and other development fixtures.

Canonical intended placements:
- `fixtures/test_signal.js`

If a helper is imported by multiple tests or runners, it belongs here instead of root.

### `out/`

Generated outputs only.

Examples:
- batch pipeline output
- debug exports
- HUD captures
- temporary inspection dumps

Generated outputs are never authority surfaces.

---

## 3. Canonical Current Target Layout

```text
/
  README_MasterConstitution.md
  README_WorkflowContract.md
  README_ConstitutionAppendix.md
  README_RepoPlacementConstitution.md
  package.json
  vite.config.js
  index.html

  README/
    README_DevelopmentPressure.md
    README_ClaudeTaskRequest.md
    README.DynamicalMemoryEngineDoorThree.md
    README.DynamicalMemoryEngine_DoorTwo.md
    README_DoorOneContinuousReplayExperiment.md
    README_DoorOneRealDeviceExperiment.md
    README_DoorOneMultiScaleIngest.md
    README_ContinuousIngestRetentionLadder.md
    README_DoorOneAcceptanceChecklist.md
    README_DoorOneAdapterPolicy.md
    README_DoorOneInspectionSurfacePosture.md
    README_DoorOnePinArchivePolicy.md
    README_DoorOneProvenanceRetention.md
    README_DoorOneRuntimeBoundary.md
    README_DoorOneSurfaceMap.md
    README_DynamicalMemorySystemGlossary.md
    README_DoorOneMultiScaleIngest.md
    README_IngestAdapterMatrix_v0.md

  operators/
    ingest/IngestOp.js
    clock/ClockAlignOp.js
    window/WindowOp.js
    transform/TransformOp.js
    compress/CompressOp.js
    anomaly/AnomalyOp.js
    merge/MergeOp.js
    reconstruct/ReconstructOp.js
    query/QueryOp.js
    basin/BasinOp.js
    consensus/ConsensusOp.js
    sampler/AnalogSamplerOp.js
    sampler/RmsEnvelopeAdapter.js
    trajectory/SegmentTracker.js
    trajectory/TrajectoryBuffer.js
    substrate/MemorySubstrate.js

  runtime/
    DoorOneOrchestrator.js
    run_hud_demo.js
    TrajectoryInterpretationReport.js
    AttentionMemoryReport.js
    CrossRunDynamicsReport.js
    CrossRunSession.js
    PromotionReadinessReport.js
    CanonCandidateDossier.js
    DoorOneWorkbench.js
    DoorOneExecutiveLane.js

  hud/
    DoorOneHUD.js
    DoorOneStructuralMemoryHud.jsx
    DoorOneStructuralMemoryHudDemo.jsx
    DoorOneStructuralMemoryHudModel.js
    main.jsx
    styles.css

  scripts/
    run_pipeline_substrate.js
    run_door_one_workbench.js
    run_door_one_live.js
    run_door_one_provenance_digest.js
    run_door_one_pin_packet.js
    run_door_one_archive_bundle.js
    run_door_one_audio_file_experiment.js
    run_door_one_audio_file_slice.js
    run_door_one_continuous_replay_capstone.js
    run_identity_separability_probe.js
    run_door_one_amplitude_replay_capstone.js
    run_door_one_frequency_replay_capstone.js
    run_identity_separability_probe_rms_envelope.js
    run_identity_separability_probe_multiscale.js
    run_identity_separability_probe_scale_calibrated.js
    run_basin_identity_diagnostics_calibrated.js
    run_active_interaction_zone_probe.js


  tests/
    test_substrate_contracts.js
    test_door_one_orchestrator.js
    test_door_one_hud.js
    test_door_one_contracts.js
    test_trajectory_interpretation_report.js
    test_attention_memory_report.js
    test_cross_run_dynamics_report.js
    test_cross_run_session.js
    test_promotion_readiness_report.js
    test_canon_candidate_dossier.js
    test_consensus_op.js
    test_door_one_workbench.js
    test_door_one_hud_workbench.js
    test_door_one_executive_lane.js
    test_door_one_live_provenance_retention.js
    test_door_one_anti_bypass_contracts.js
    test_door_one_structural_memory_hud.js
    test_door_one_provenance_digest.js
    test_door_one_pin_packet.js
    test_door_one_archive_bundle.js
    test_door_one_ingest_hardening.js
    test_rms_envelope_adapter.js
    test_identity_probe_multiscale.js
    test_identity_probe_scale_calibrated.js
    test_basin_identity_diagnostics_calibrate.js
    test_active_interaction_zone_probe.js

  test_signal/
    daw_tone_continuity/baseline_01.wav
    daw_tone_continuity/baseline_02.wav
    daw_tone_continuity/baseline_03.wav
    daw_tone_continuity/continuity_break_01.wav
    daw_tone_continuity/continuity_break_02.wav
    daw_tone_continuity/continuity_break_03.wav
    daw_tone_continuity/return_01.wav
    daw_tone_continuity/return_02.wav
    daw_tone_continuity/return_03.wav
    daw_tone_amplitude/baseline_01.wav
    daw_tone_amplitude/baseline_02.wav
    daw_tone_amplitude/baseline_03.wav
    daw_tone_amplitude/amplitude_shift_01.wav
    daw_tone_amplitude/amplitude_shift_02.wav
    daw_tone_amplitude/amplitude_shift_03.wav
    daw_tone_amplitude/return_01.wav
    daw_tone_amplitude/return_02.wav
    daw_tone_amplitude/return_03.wav
    daw_tone_frequency/baseline_01.wav
    daw_tone_frequency/baseline_02.wav
    daw_tone_frequency/baseline_03.wav
    daw_tone_frequency/frequency_shift_01.wav
    daw_tone_frequency/frequency_shift_02.wav
    daw_tone_frequency/frequency_shift_03.wav
    daw_tone_frequency/return_01.wav
    daw_tone_frequency/return_02.wav
    daw_tone_frequency/return_03.wav
    220-440hzPulse.wav

  fixtures/
    test_signal.js

  out/
```

---

## 4. Import Law

Import paths must reflect canonical placement.

Rules:
1. Import from the canonical zone path, not from temporary duplicate copies.
2. Do not preserve flat-root imports once canonical placement exists.
3. Runtime code should import operators from `operators/...`
4. HUD code should import runtime outputs or formatter-local helpers only.
5. Scripts should import from `runtime/`, `hud/`, `operators/`, or `fixtures/` as needed, but should remain thin.

Example canonical imports:
- `../operators/query/QueryOp.js`
- `../operators/substrate/MemorySubstrate.js`
- `../runtime/DoorOneOrchestrator.js`
- `../fixtures/test_signal.js`

---

## 5. New File Admission Rules

Before adding a new file, answer:

1. Is this governance/reference, operator code, substrate code, runtime coordination, HUD/tooling, script, test, fixture, or generated output?
2. Which canonical zone already owns that responsibility?
3. Is this importable code or executable wrapper code?
4. Would placing this at root create future clutter or ambiguous imports?

If an existing zone fits, use it.
Do not create a new top-level zone without a bounded architecture reason.

---

## 6. Reorganization Rules

Reorganization is a bounded task, not opportunistic cleanup.

Rules:
- do not reorganize during unrelated semantic or bug-fix tasks
- prefer one coherent migration pass over many small moves
- when moving files, update imports and run the full test suite
- remove temporary duplicate copies once canonical placement is working

---

## 7. Temporary Duplication Rule

During migration, temporary duplicate copies may exist only to preserve execution continuity.

But once canonical placement is verified:
- duplicates must be removed
- imports must point only to canonical paths
- the repo must run from a single consistent topology

No long-term shadow copies.

---

## 8. Relation to Constitutional Authority

This document controls placement only.

If a placement choice appears to conflict with:
- layer meaning
- artifact meaning
- canon/promotion law
- deferred boundary law

the higher constitutional surface wins.

---

## 9. Final Rule

The repo must have one obvious place for each kind of thing.

If placement is ambiguous, resolve the ambiguity here before further growth.
