# DME Repo Reorganization Checkpoint Audit

Packet ID: `PKT-REORG-CHECKPOINT-AUDIT-005`  
Date: `2026-04-06`

## Status

This note is a conservative checkpoint audit after:

- operational accounting and packet lineage establishment
- function-first regrouping of 32 tests
- initial README compression into `README/WorkflowMechanization/`

It classifies remaining repo-organization pressure into routing buckets only.

It does **not** approve removal, movement, archival, or semantic rewrite by itself.

---

## 1. Basis Checked

This audit was checked against the current visible workspace state, including:

- top-level repo tree
- current `README/` tree
- current `tests/` tree
- `README/Operational/README.RepoAccountingSurface.md`
- `README/Operational/README.PacketLineage.md`
- `README.RepoPlacementConstitution.md`
- `README.WorkflowContract.md`

Observed checkpoint facts:

- `tests/consultation/`, `tests/hud/app_surfaces/`, `tests/reconstruction/readside/`, `tests/readside/accounting/`, and `tests/source_registry/` are present.
- `tests/door_two/` still exists on disk but is empty.
- `README/WorkflowMechanization/GitHub_VSCode_CheatSheet.md` is present.
- `README/Cleanup/`, `README/Operational/`, `README/WorkflowMechanization/`, and `README/Transformer/LanguageKernel/` are all real live README zones.
- `dist/` still exists as a generated build-output folder even though `.gitignore` already treats `dist/` as disposable output.

---

## 2. Classification Summary

### A. Safe remove

| candidate | observed state | why this is low risk | next routing note |
| --- | --- | --- | --- |
| `dist/` | generated build output with bundled `index.html` and `assets/`; `.gitignore` already contains `dist/` | placement role is non-authoritative and disposable; direct repo references to `dist/` were not found beyond packaging lockfile text and accounting notes | remove in a tiny clutter-cleanup packet; no semantic review needed |
| `tests/door_two/` | directory still exists but `(Get-ChildItem tests/door_two -Force).Count = 0` | empty residue only; the functional test content already moved out | remove the empty directory in the same packet that normalizes stale path references |

### B. Safe move

No additional high-confidence safe-move candidate is visible at this checkpoint.

Reason:

- the most obvious README workflow-tooling move has already been completed
- remaining weak placements are either semantics-heavy, reference-heavy, or target-ambiguous

### C. Safe normalize

| candidate | observed state | normalization needed | why this does not require a broad packet |
| --- | --- | --- | --- |
| `package.json` `test:app-surface` script | still points at `tests/door_two/test_semantic_oscilloscope_app_surface.js` | repoint to `tests/hud/app_surfaces/test_semantic_oscilloscope_app_surface.js` | single stale path repair; no meaning change |
| moved test header comments | multiple moved tests still begin with comments like `// tests/door_two/...` | normalize header comments to current locations | comment/header drift only |
| `README/WorkflowMechanization/README.SeamRegistryModel.md` | still contains an example path under `tests/door_two/` | update stale example path to the current regrouped location | doc path repair only |
| `README.WorkflowContract.md` top block | visible header/metadata drift and mojibake remain in the top section | normalize the top header/metadata block without changing workflow meaning | active governance note, but the drift itself is formatting/header-level rather than architectural |

### D. Needs dedicated packet

| candidate | observed state | why this is not knife-cut safe | recommended packet shape |
| --- | --- | --- | --- |
| `test_signal/` | large real-source fixture bank with many references from tests, scripts, and result notes | moving, renaming, or pruning it would trigger broad path churn across active seams | dedicated fixture-placement / reference-repair packet |
| remaining flat root `tests/*.js` bank | many tests still live directly under `tests/` with mixed functions | regrouping requires family-by-family review instead of one rhetorical sweep | dedicated test-grouping follow-on packet |
| `README.ClaudeWorkflowContract.md` | root-level singleton governance note with overlapping workflow-contract semantics and no direct repo references found | archive/remove/move judgment would implicitly choose a supersession posture for governance surfaces | dedicated governance-note reconciliation packet |
| `README/ResultInterpretation/door_two/` | live subzone with active records and door-scoped meaning | the folder name is rhetorically loaded and the notes are meaning-bearing, not just misplaced | dedicated README compression packet if later revisited |
| `README/Roadmap/door_two/` | live roadmap subzone with multiple Door Two planning notes and cross-links | renaming/compressing it would be structure-plus-meaning sensitive | dedicated roadmap README packet if later revisited |
| retained audit-history gap around `PKT-REPO-AUDIT-001` | packet lineage still records that the standalone earlier audit artifact is not present in the current workspace | resolving this honestly may require recovery from another source or explicit lineage normalization | dedicated workflow-history normalization packet |

### E. Leave in place

| candidate | observed state | why it should stay for now |
| --- | --- | --- |
| `README/Cleanup/` | live cleanup bank with active backlog/audit notes | currently lawful and useful as the cleanup-routing surface |
| `README/Operational/` | live accounting/lineage/template bank | already legitimized and actively serving workflow hygiene |
| `README/WorkflowMechanization/` | live workflow-governance/support bank | now clearer after packet 4; no immediate pressure remains |
| `README/Transformer/LanguageKernel/` | real experimental/doc/schema zone | placement pressure exists, but no low-risk compression move is currently evident |
| root HTML entrypoints: `index.html`, `demo.html`, `execution.html`, `app.html` | heavily referenced by package scripts, tests, HUD router code, and placement law | not clutter; these are active entry surfaces |
| `out/`, `out_canon/`, `out_experiments/`, `out_live/`, `out_provenance/`, `out_substrate/`, `out_workbench/` | declared output surfaces and kept separately from `dist/` | unlike `dist/`, these are already part of declared retained-output posture |

---

## 3. Explicit Empty / Stale / Orphaned Surfaces

### Empty residue

- `tests/door_two/` is present but empty.

### Stale path/header/comment drift

- `package.json` still contains a `tests/door_two/` script path.
- multiple regrouped tests still contain first-line comments naming the old `tests/door_two/` location.
- `README/WorkflowMechanization/README.SeamRegistryModel.md` still contains a `tests/door_two/` example path.
- `README.WorkflowContract.md` still shows top-of-file header/metadata drift.

### Orphaned or weak singleton pressure

- `README.ClaudeWorkflowContract.md` remains a weak root-level singleton with overlapping workflow-contract semantics and no direct repo references found during this audit.

---

## 4. High-Reference Seams To Avoid Casual Touches

These seams should remain conservative unless a dedicated packet is opened:

| seam | why it is reference-heavy |
| --- | --- |
| `test_signal/` | referenced from many tests, multiple scripts, and result-interpretation notes |
| root HTML entrypoints | referenced from package scripts, HUD routing code, tests, and placement-law notes |
| `README/Roadmap/door_two/` | cross-linked roadmap notes with future-door meaning |
| `README/ResultInterpretation/door_two/` | live result records whose folder meaning is not merely cosmetic |

---

## 5. Recommended Next Knife-Cut Packets

### Recommended Packet A

`PKT-LOW-RISK-CLUTTER-NORMALIZATION`

Scope:

- remove `dist/`
- remove empty `tests/door_two/`
- repoint `package.json` stale test path
- normalize moved-test header comments
- update stale `tests/door_two/` doc example paths

### Recommended Packet B

`PKT-HIGH-REFERENCE-FIXTURE-AND-GOVERNANCE-REVIEW`

Scope:

- classify `test_signal/` placement strategy
- reconcile `README.ClaudeWorkflowContract.md`
- decide whether `README/Roadmap/door_two/` and `README/ResultInterpretation/door_two/` stay as named or enter a dedicated compression pass
- resolve the retained-audit-history gap around `PKT-REPO-AUDIT-001`

---

## 6. One-Line Summary

After packets 2-4, the remaining low-risk cleanup seams are mostly `dist/`, empty `tests/door_two/`, and stale path/header drift; the major remaining risky seams are `test_signal/`, root-flat tests, governance-note overlap, and meaning-bearing `door_two` README subzones.
