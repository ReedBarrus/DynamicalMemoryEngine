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
| `README/Cleanup/` | `README/Cleanup/` | cleanup_note_bank | active | door_one | cleanup backlog and unresolved placement/accounting pressure | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | medium | Real live zone; retained provisionally pending later compression or regrouping review. |
| `README/Transformer/LanguageKernel/` | `README/Transformer/LanguageKernel/` | experimental_doc_bank | experimental | cross-door | Language Kernel contract, schemas, and benchmark posture | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | medium | Real live zone; retained provisionally pending later compression/accounting review. |
| `tests/` | `tests/` | verification_bank | active | cross-door | repo verification surface | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | medium | Current tree is only partially function-grouped. |
| `tests/door_two/` | `tests/door_two/` | verification_subgroup | active | door_two | consultation/read-side/source-registry/app-surface tests under one rhetorical folder | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | weak | Current grouping is rhetorically named rather than verification-function-first. |
| `test_signal/` | `root/` | shared_fixture_bank | active | door_one | shared recorded audio fixture bank | `README.RepoPlacementConstitution.md`; `README.WorkflowContract.md` | weak | Functionally fixture-like but still top-level and heavily path-coupled. |
| `dist/` | `root/` | generated_build_output | supporting | unclear | local build artifact output | `README.RepoPlacementConstitution.md` | weak | Generated output role overlaps with declared `out/` and `out_*` posture. |
| `README/GitHub_VSCode_CheatSheet.md` | `README/` root | workflow_tooling_note | supporting | cross-door | local workflow/tooling support | `README.WorkflowContract.md`; `README.RepoPlacementConstitution.md` | weak | Useful note, but currently bypasses a more specific README subzone. |

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
