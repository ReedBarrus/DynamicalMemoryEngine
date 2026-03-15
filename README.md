# Dynamical Memory Engine

Dynamical Memory Engine is a provenance-conserving framework for transforming live or recorded signals into auditable dynamical memory over time.

It is designed to preserve lawful lineage across ingest, alignment, windowing, transformation, compression, anomaly detection, segmentation, substrate memory, and higher-order interpretation without collapsing the distinction between raw signal, derived state, observational memory, and promoted consensus.

## Core Idea

Most signal and modeling systems are good at producing outputs, but weak at preserving the full lawful story of how those outputs came to be.

Dynamical Memory Engine is built around a different priority:

- preserve provenance across every transformation layer
- keep authority boundaries explicit
- treat derived state as distinct from observational/query surfaces
- preserve rupture and segment boundaries rather than smearing them
- allow higher-order interpretation without pretending interpretation is canon

The result is a framework for dynamical modeling that can say not only **what** a state is, but also:

- where it came from
- under what policy it was formed
- what segment context it belonged to
- what later layers are allowed to claim about it

## Current Status

This repository currently centers on **Door One**, the foundational layer of lawful state formation and substrate memory.

Door One covers the base path from signal intake through compressed dynamical state, anomaly-driven segmentation, substrate organization, and observational reporting.

Later layers are planned as separate architectural doors:

- **Door One** — lawful state formation, segmentation, substrate memory, provenance conservation
- **Door Two** — interpretation, prediction, explanatory layering, non-canonical read models
- **Door Three** — action, agency, control, and higher-order operational loops

## Design Principles

- **Provenance first** — every transformation should preserve lawful lineage
- **Bounded authority** — no layer may claim more than it has earned
- **State is not signal** — derived state must remain distinct from raw input
- **Query is not truth** — observational read models are not canonical artifacts
- **Runtime is not canon** — orchestration and storage do not create authority by themselves
- **Consensus is promotion-only** — canonical promotion must remain explicit and bounded
- **Rupture matters** — novelty and segmentation boundaries must be preserved rather than blurred

## Repository Structure

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

  hud/
    DoorOneHUD.js

  scripts/
    run_pipeline_substrate.js

  tests/
    test_substrate_contracts.js
    test_door_one_orchestrator.js
    test_door_one_hud.js
    test_door_one_contracts.js
    test_trajectory_interpretation_report.js

  fixtures/
    test_signal.js

  out/
```
