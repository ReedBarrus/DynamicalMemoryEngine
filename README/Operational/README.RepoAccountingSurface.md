# Dynamical Memory Engine - Repo Accounting Surface

## Status

This document defines the first bounded operational accounting surface for current-state repo/workflow placement and status tracking in DME.

It is a workflow instrument.

It does **not** override:

- `README.MasterConstitution.md`
- `README.WorkflowContract.md`
- `README.RepoPlacementConstitution.md`
- `README/Core/README.AddressRegistryModel.md`

Its purpose is narrower:

- record current-state repo/workflow placement and status,
- keep compact operational accounting in contact with live repo reality,
- provide one bounded surface for material zone/grouping/status changes,
- and support future cleanup packets without turning placement law into exhaustive inventory prose.

This note governs **present-state operational accounting** only.

It does **not** govern:

- packet lineage history,
- runtime artifact meaning,
- canon policy,
- operator contracts,
- architectural truth,
- or acceptance by itself.

This is a current-state accounting surface.
It is not a lineage log.
It is not a truth engine.
It is not a substitute for the repo.

---

## 1. Purpose

The repo accounting surface exists to answer a narrow current-state question:

**What currently lives where, what function does it serve, and where is placement/grouping pressure materially visible right now?**

This surface should remain compact.

It is allowed to track:

- active repo zones,
- live README groupings,
- material test grouping posture,
- known placement strength or placement pressure,
- and workflow-relevant status notes.

It should not be inflated into:

- a historical packet ledger,
- a full document registry replacement,
- or a file-by-file claim that outruns live repo inspection.

---

## 2. Entry Model

Each entry should preserve at minimum:

- `path`
- `current_zone`
- `object_class`
- `status`
- `door_scope`
- `function_group`
- `governing_surface`
- `placement_strength`
- `notes`

Optional fields may be added later when useful, but this surface should prefer compact operational legibility over exhaustive schema growth.

---

## 3. Update Triggers

Update this surface when any of the following become materially true:

- a file is created
- a file is moved
- a file status changes materially
- a zone classification changes materially
- a test grouping changes materially
- a README grouping changes materially
- a recurring path/reference drift hotspot becomes important enough to route cleanup

Do not update this surface merely to mirror decorative churn.

---

## 4. Starter Entries

These starter entries are intentionally compact.
They exist to seed the operational surface around the current cleanup pressure identified by recent workflow review.

| path | current_zone | object_class | status | door_scope | function_group | governing_surface | placement_strength | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `README/Operational/` | `README/Operational/` | operational_note_bank | active | cross-door | workflow accounting and packet lineage support | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | strong | Canonical home for present-state operational accounting and packet lineage surfaces introduced in this packet. |
| `README/Operational/README.RepoAccountingSurface.md` | `README/Operational/` | accounting_note | active | cross-door | current-state repo/workflow accounting | `README.WorkflowContract.md`; `README.RepoPlacementConstitution.md` | strong | This note records present-state accounting only. |
| `README/Operational/README.PacketLineage.md` | `README/Operational/` | workflow_note | active | cross-door | packet lineage and route continuity | `README.WorkflowContract.md`; `README/WorkflowMechanization/README.PacketWorkflowChain.md` | strong | This note records packet lineage rather than current placement state. |
| `README/Operational/README.ActiveTrajectories.md` | `README/Operational/` | workflow_note | active | cross-door | active and projected trajectory accounting across developmental legs | `README.WorkflowContract.md`; `README/Operational/README.PacketLineage.md`; `README/Core/README.DoorOneDevelopmentalOutline.md` | strong | This note bridges packet lineage, developmental pressure order, and current strategic motion without becoming a roadmap or a new authority layer. |
| `hud/shellStateRouter.js` | `hud/` | app_state_threading_helper | active | door_one | read-side shell-state export/import support across execution and viewer routes | `README.WorkflowContract.md`; `README/Diagnostics/AppSurface/README.StructuralViewerContract.v0.md` | medium | Existing shell-state helper now also carries bounded published-state synchronization so viewer routes can consume current execution state without minting a second truth seam. |
| `hud/adapters/structuralViewerPayloadAdapter.js` | `hud/adapters/` | viewer_payload_adapter | active | door_one | one shared structural viewer payload seam across dedicated routes | `README/Diagnostics/AppSurface/README.StructuralViewerContract.v0.md`; `README.WorkflowContract.md` | strong | Shared viewer payload adapter remains the one base route seam; current Live continuous-view pass projects H1 band-profile windows into a bounded spectral/frequency-time structural section while keeping telemetry separate from structure and overlays. |
| `README/WorkflowMechanization/` | `README/WorkflowMechanization/` | workflow_note_bank | active | cross-door | workflow law, packet flow, and mechanization-support notes | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | strong | Real live README zone for workflow governance/support notes; now explicitly accounted as part of README compression hygiene. |
| `README/Cleanup/` | `README/Cleanup/` | cleanup_note_bank | active | door_one | cleanup backlog and unresolved placement/accounting pressure | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | medium | Real live zone; retained provisionally pending later compression or regrouping review. |
| `README/Transformer/LanguageKernel/` | `README/Transformer/LanguageKernel/` | experimental_doc_bank | experimental | cross-door | Language Kernel contract, schemas, and benchmark posture | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | medium | Real live zone; retained provisionally pending later compression/accounting review. |
| `Transformer/LanguageKernel/` | `Transformer/LanguageKernel/` | experimental_exec_bank | active | cross-door | Language Kernel executable seam for validator, benchmark, invocation, examples, and outputs | `README.RepoPlacementConstitution.md`; `README/Transformer/LanguageKernel/README.LanguageKernelContract.v0.md`; `README/Transformer/LanguageKernel/README.LanguageKernelEarlyOperation.v0.md` | medium | Seam-local executable companion to the README contract bank. This is the live mechanized lane for bounded Language Kernel work and remains below runtime/HUD integration. |
| `Transformer/LanguageKernel/invocation/` | `Transformer/LanguageKernel/invocation/` | invocation_subgroup | active | cross-door | seam-local Ollama prompt build, response capture, receipt-chain mechanization, run assembly, and bounded two-model comparison summary emission | `README/Transformer/LanguageKernel/README.LanguageKernelContract.v0.md`; `README/Transformer/LanguageKernel/README.LanguageKernelEarlyOperation.v0.md`; `README.RepoPlacementConstitution.md` | medium | Houses the bounded local-model invocation runner and its same-input compare-panel helper only. It does not become repo-global model orchestration or runtime infrastructure. |
| `Transformer/LanguageKernel/outputs/` | `Transformer/LanguageKernel/outputs/` | generated_example_bank | active | cross-door | bounded Language Kernel receipts, run objects, benchmark outputs, manual/real invocation captures, and comparative panel artifacts | `README/Transformer/LanguageKernel/README.LanguageKernelBenchmarkContract.v0.md`; `README.RepoPlacementConstitution.md` | medium | Mixed seam-local generated surface used for examples and verification. It now includes a refreshed Hermes real first-run chain, blocked Meta invocation artifacts when local model availability fails, and a comparative panel summary; all remain audit/evaluation outputs rather than authority objects. |
| `tests/` | `tests/` | verification_bank | active | cross-door | repo verification surface | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | medium | Function-first grouping improved by PKT-TEST-GROUPING-003; some tests may still remain outside the newly legitimized high-confidence families. |
| `tests/consultation/` | `tests/consultation/` | verification_subgroup | active | door_one | consultation and handoff verification | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | strong | High-confidence consultation-family tests moved here from the rhetorical `tests/door_two/` bucket; includes the repaired canon-handoff path case. |
| `tests/hud/app_surfaces/` | `tests/hud/app_surfaces/` | verification_subgroup | active | door_one | HUD app-surface routing, mode-shell, state-threading, live-telemetry, continuous-structural-view, and intake verification | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | strong | High-confidence app-surface tests now grouped by verification function rather than future-door rhetoric; current coverage includes router-shell, explicit mode-shell split, published shell-state threading, Live-only telemetry rail verification, and the first Live continuous structural face. |
| `hud/HomeRouterShell.jsx` | `hud/` | app_surface_shell | active | door_one | top-level home/router posture above dedicated viewer routes | `README/Diagnostics/AppSurface/README.AppSurfaceTransitionPlan.v0.md`; `README.WorkflowContract.md` | medium | Thin routing surface introduced for app-face split; current state-threading pass lets the shell and routes read published execution context without embedding execution controls directly. |
| `hud/ViewerModeShellFrame.jsx`; `hud/LiveModeShell.jsx`; `hud/StaticModeShell.jsx`; `hud/InspectionModeShell.jsx`; `hud/LiveContinuousStructuralViewer.jsx` | `hud/` | viewer_mode_shell_family | active | door_one | explicit Live / Static / Inspection route shells over one shared payload seam | `README/Diagnostics/AppSurface/README.LiveStaticInspectionSplit.v0.md`; `README/Diagnostics/AppSurface/README.StructuralViewerContract.v0.md`; `README/Diagnostics/AppSurface/README.LiveViewerTelemetryContract.v0.md`; `README/Diagnostics/AppSurface/README.AppSurfaceTransitionPlan.v0.md` | medium | Mode-shell family remains in the existing hud zone without creating a new folder; Live mode now contains one real continuous structural viewer over H1 spectral windows while Static and Inspection remain shell-level. |
| `tests/reconstruction/readside/` | `tests/reconstruction/readside/` | verification_subgroup | active | door_one | reconstruction replay and read-side verification | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | strong | High-confidence replay/reconstruction read-side tests moved here; one panel-string expectation mismatch remains a separate test-content issue rather than a path-resolution blocker. |
| `tests/readside/accounting/` | `tests/readside/accounting/` | verification_subgroup | active | door_one | read-side accounting and closure-audit verification | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | strong | High-confidence read-side accounting visibility tests moved here from `tests/door_two/`. |
| `tests/source_registry/` | `tests/source_registry/` | verification_subgroup | active | door_one | source-registry and source-basis verification | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | strong | High-confidence source-registry tests moved here from `tests/door_two/` with their existing root-relative path posture preserved. |
| `test_signal/` | `root/` | shared_fixture_bank | active | door_one | shared recorded audio fixture bank | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | weak | Functionally fixture-like but still top-level and heavily path-coupled. |
| `README/WorkflowMechanization/GitHub_VSCode_CheatSheet.md` | `README/WorkflowMechanization/` | workflow_tooling_note | supporting | cross-door | local git/GitHub/VSCode workflow support | `README.WorkflowContract.md`; `README.RepoPlacementConstitution.md` | strong | High-confidence README compression move from the README root into the workflow-mechanization zone; file meaning preserved and no content rewrite performed. |

---

## 5. Operational Use Rule

Use this surface when the question is:

- what currently exists,
- how it is currently grouped,
- where placement pressure is currently visible,
- or what workflow-facing cleanup seam is presently active.

Do not use this surface when the question is:

- how a packet flowed historically,
- whether a patch was accepted,
- what runtime behavior is true,
- or whether a seam is architecturally legitimate by itself.

Those questions belong elsewhere.

---

## 6. One-Line Summary

This note is the bounded current-state operational accounting surface for repo/workflow placement and grouping posture; it is not lineage history, runtime meaning, or canon policy.
