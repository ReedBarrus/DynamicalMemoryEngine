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
- compact layer/reference docs
- package/runtime config
- true top-level entry metadata only

Allowed examples:
- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README_ConstitutionAppendix.md`
- `README_SubstrateLayer.md`
- `README_DevelopmentPressure.md`
- `README_RepoPlacementConstitution.md`
- `package.json`

Runtime code, tests, helpers, and scripts should not normally live at root.

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

### `scripts/`

This directory contains standalone executable entrypoints, demos, and developer-facing runners.

Scripts should be thin wrappers around importable runtime code whenever possible.

Canonical intended placements:
- `scripts/run_pipeline_substrate.js`
- `run_door_one_workbench.js`

### `tests/`

This directory contains bounded contract and regression suites.

Canonical intended placements:
- `tests/test_substrate_contracts.js`
- `tests/test_door_one_orchestrator.js`
- `tests/test_door_one_hud.js`
- `tests/test_door_one_contracts.js`
- `tests/test_trajectory_interpretation_report.js`
- `tests/test_attention_memory_report.js`
- `test_cross_run_dynamics_report.js`
- `test_cross_run_session.js`
- `test_promotion_readiness_report.js`
- `test_canon_candidate_dossier.js`
- `test_consensus_op.js`
- `test_door_one_workbench.js`
- `test_door_one_hud_workbench.js`
- `test_door_one_executive_lane.js`

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
  README_SubstrateLayer.md
  README_DevelopmentPressure.md
  README_RepoPlacementConstitution.md
  package.json

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

  scripts/
    run_pipeline_substrate.js
    run_door_one_workbench.js

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
