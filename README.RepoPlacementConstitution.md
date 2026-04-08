# README_RepoPlacementConstitution.md
# Dynamical Memory Engine — Repo Placement Constitution

## Metadata
```yaml
address_id: root.repo_placement_constitution.current
object_class: governance_note
object_label: Repo Placement Constitution
file_path: README_RepoPlacementConstitution.md
repo_zone: root/

bounded_question: Where do files belong in the DME repo, how should repo growth be coordinated, and how should placement references relate to live repo reality?
declared_role: Authoritative repo topology and file-placement law.
explicit_non_role: Not artifact meaning, not layer meaning, not canon semantics, not runtime ontology.

scope_coverage:
  - root vs subfolder placement
  - canonical repo zones
  - target layout as placement/accounting aid
  - README subfolder rules
known_omissions:
  - runtime artifact meaning
  - current capability-status posture
  - full seam contract semantics
  - workflow sequencing/history

authority_posture: placement_governance
explicit_non_claims:
  - not architecture authority
  - not current code behavior proof by itself
  - not surface-inventory interpretation law

current_status: active
audit_status: crosschecked_against_repo
dominant_telemetry:
  - drift
known_risks:
  - target layout can outpace live repo if not refreshed
  - placement can be mistaken for ontology
  - filename conventions can silently drift if not normalized

last_crosscheck_date: YYYY-MM-DD
last_crosscheck_basis:
  - current GitHub repo topology
crosscheck_notes: Placement/topology authority confirmed against live repo reality.

related_objects:
  - root.master_constitution.current
  - root.workflow_contract.current
  - core.address_registry_model.current

what_is_now_true:
  - governs placement and topology
  - defines canonical repo zones
  - defines how placement references should relate to live repo state
what_is_still_not_claimed:
  - artifact/layer meaning
  - runtime semantics
  - full current seam inventory by itself
  ```

## Status

This document governs file placement and repo topology for the Dynamical Memory Engine.

It is authoritative for:

where files belong
how new files should be placed
how repo growth should be coordinated
how placement references should be interpreted relative to live repo state

It is not authoritative for:

artifact meaning
layer meaning
promotion/canon semantics
runtime ontology
current capability status
full seam interpretation

Those remain governed by:

README_MasterConstitution.md
README_WorkflowContract.md
README_ConstitutionAppendix.md
## 1. Core placement principle

Repo topology is coordination, not ontology.

File location does not change layer meaning, artifact authority, or truth status.

Placement exists to keep the implementation:

legible
runnable
reviewable
and stable under growth

New files must be placed by primary responsibility, not convenience.

## 2. Repo-authority rule

The GitHub repo main branch is the authority for:

current file reality
active file existence
current path truth
current repo topology

This placement constitution is therefore a placement/reference authority, not a substitute for live repo contact.

Accordingly:

if this document’s target layout and the live repo disagree, the repo wins for current file reality
if a file is moved or renamed in the repo, this document must be updated to restore alignment
if review is in doubt about what currently exists, check the GitHub repo directly before treating this document as a complete inventory base

This rule keeps placement law subordinate to live repo reality.

## 3. Filename normalization rule

The preferred naming convention for active README notes is:

README.FileName.md

This rule applies to:

root governance/constitutional/support notes
README/ subfolder notes
future README additions unless a legacy exception is explicitly preserved

When older underscore-style names still exist or appear in transitional references, they should be treated as normalization debt and aligned over time.

Placement references in this document should prefer the normalized dot-style naming convention.

## 4. Canonical repo zones
Root

Root is reserved for:

constitutional / governance docs
package/runtime config
true top-level entry metadata only

Allowed examples:

README.md
README.MasterConstitution.md
README.WorkflowContract.md
README.ConstitutionAppendix.md
README.RepoPlacementConstitution.md
package.json
vite.config.js
index.html
app.html
execution.html
demo.html

Runtime code, tests, helper code, and scripts should not normally live at root.

README/

This directory contains supporting reference notes, boundary notes, checklists, policy notes, surface maps, implementation-governance notes, and other non-root supporting documents.

Canonical subzones:

README/Core/ — core Door One accounting/governance/support notes
README/Diagnostics/ — diagnostic posture, probes, and investigative writeups
README/Experiments/ — experiment framing, methods, and experiment-specific notes
README/ResultInterpretation/ — result interpretation writeups and experiment conclusions
README/Roadmap/ — forward-facing architecture, adjacent-field, and future-door notes
README/WorkflowMechanization/ — workflow-facet notes for bounded development closure/progression
README subfolder rule

Prefer adding a new note to an existing README/ subfolder by document type and primary responsibility.

Create a new README subfolder only when:

a recurring document class appears
and the existing subfolders no longer preserve legibility
README/Core/

This subfolder should hold the most load-bearing active Door One support notes.

Typical examples include:

surface/accounting notes
runtime boundary notes
inspection posture notes
acceptance/developmental notes
ingest/adapter notes
provenance/retention notes
registry/accounting notes

This is where active Door One core governance/accounting should concentrate.

README/Diagnostics/

This subfolder should hold:

distortion/fidelity diagnostics
probe posture docs
channel-selection notes
transition vocabularies
basin-facing diagnostics
other investigative refinement notes

These notes are diagnostic/read-side support, not primary structural accounting.

README/Experiments/

This subfolder should hold:

experiment design notes
replay-scope notes
device/real-source experiment notes
experiment framing and bounded methodology notes
README/ResultInterpretation/

This subfolder should hold:

capstone outcomes
replay conclusions
result summaries
experiment interpretation records
bounded read-side interpretation outputs
README/Roadmap/

This subfolder should hold:

Door Two / Door Three forward notes
adjacent field maps
cross-field schema notes
frontier maps
demo-facing roadmap notes
superseded development-arc notes preserved for lineage if still worth keeping

Roadmap notes must not silently govern active runtime meaning.

README/WorkflowMechanization/

This subfolder holds supporting workflow-facet notes.

It exists to govern:

bounded development-object progression
closure discipline
packet sequencing
audit/review posture
schema/stub/workflow support notes
helper/wrapper/workflow support posture

It does not govern:

runtime artifact meaning
operator contracts
canon activation
substrate semantics
architectural truth

Workflow mechanization is a support facet.
It is not a new runtime layer.

operators/

This directory contains deterministic runtime operators and closely related substrate components.

Subdirectories may include:

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

Placement rule:

Place a file in the folder matching its primary responsibility, not merely whichever module happens to import it.

runtime/

This directory contains importable runtime coordinators and runtime-adjacent integration/report surfaces.

These files may orchestrate existing operators and substrate calls, but must not become new semantic authority layers.

Typical examples include:

orchestrators
workbench assemblers
executive lanes
cross-run coordinators
readiness / dossier / report objects
hud/

This directory contains inspection tooling, app surfaces, composition shells, shaping adapters, and read-side display surfaces.

HUD/app code is read-side or execution-surface tooling only.
It must consume lawful runtime outputs and must not define runtime meaning.

Typical examples include:

terminal HUDs
browser HUDs
app shells
replay/request shaping models
tandem/read-side adapters
entry surfaces
scripts/

This directory contains standalone executable entrypoints, demos, and developer-facing runners.

Scripts should be thin wrappers around importable runtime code whenever possible.

tests/

This directory contains bounded contract and regression suites.

Rule:

New tests should be grouped by what they verify, not appended indefinitely to unrelated suites.

Subfolders are allowed when they improve seam clarity.

packets/

This directory contains bounded review materials and packetized review objects.

These are not runtime authority.
They are not canon.
They are not generated outputs.

They are bounded workflow/review materials.

fixtures/

This directory contains reusable development fixtures, synthetic inputs, and shared test helpers.

If a reusable helper is imported by multiple tests or runners, prefer fixtures/ over root placement.

out/ and out_*

Generated outputs only.

Examples:

pipeline output
debug exports
inspection dumps
temporary captures
derived run artifacts

Generated outputs are never authority surfaces.

## 5. Placement guidance by primary responsibility

Use the following decision rule:

A. Constitutional / root governance meaning

→ root

B. Active Door One core accounting / boundary / support note

→ README/Core/

C. Diagnostic / probe / refinement note

→ README/Diagnostics/

D. Experiment framing / replay scope / methodology note

→ README/Experiments/

E. Result writeup / interpretation note

→ README/ResultInterpretation/

F. Forward architecture / adjacent field / roadmap note

→ README/Roadmap/

G. Workflow-facet support note

→ README/WorkflowMechanization/

H. Deterministic operator or substrate component

→ operators/

I. Runtime coordinator / integration object

→ runtime/

J. App shell / HUD / shaping adapter / read-side surface

→ hud/

K. Thin runner / executable wrapper

→ scripts/

L. Contract / regression / seam validation

→ tests/

M. Reusable development input / helper

→ fixtures/

N. Generated output

→ out/ or out_*

## 6. Import-path interpretation rule

Imports should follow placement responsibility.

Do not infer deeper authority or semantic meaning from path depth alone.

Examples:

importing from runtime/ does not make a file authoritative for architecture
importing from hud/ does not make a surface runtime truth
importing from README/ does not prove current implementation state
importing from packets/ does not imply runtime or canon authority

Paths are coordination handles, not truth classes.

## 7. Target layout posture

The canonical target layout is a placement/accounting aid.

It exists to:

provide a stable placement reference
reduce repo-sprawl drift
help catch misplaced files
support cleanup toward normalized repo topology

It does not replace live repo inspection.

If the target layout and the GitHub repo main branch disagree, the repo wins for current file reality.

The layout block below should therefore be maintained as a cross-check surface, not overread as self-sufficient proof.



## 8. Drift and alignment rule

Placement drift should be corrected when it becomes materially confusing.

Typical examples:

root files that belong in README/
workflow notes that belong in README/WorkflowMechanization/
roadmap notes mixed into core accounting
diagnostic notes mixed into runtime governance
app/read-side shaping code placed as if it were runtime authority
generated outputs being treated like durable authority surfaces

The correct remedy is:

move the file
update imports/refs
update this constitution if needed
preserve role clarity

Do not preserve misplaced structure just because it is familiar.

## 9. One-line review question

Before creating or moving any file, ask:

What is this file’s primary responsibility, and what repo zone preserves that responsibility most honestly without implying stronger semantic authority than the file actually has?

## 10. One-line summary

This document governs repo topology and file placement for DME, while treating the GitHub repo main branch as the authority for current file reality and using the target layout as a placement/accounting aid rather than as a substitute for live repo contact.

## 11. Operational Accounting Clarification and Projected Hierarchy Posture

This constitution governs:

- folder hierarchy
- repo zones
- placement law
- and when canonical folder/subfolder classes are legitimate

It does **not** serve as exhaustive current-state accounting.

Current-state operational accounting should instead live in:

- `README/Operational/README.RepoAccountingSurface.md`

Packet-history continuity should instead live in:

- `README/Operational/README.PacketLineage.md`

Those surfaces are workflow instruments only.
They do not replace placement law, runtime evidence, or constitutional meaning.

### 12.1 Canonical Operational subzone

`README/Operational/` is a lawful README subzone for:

- current-state operational accounting
- packet lineage continuity
- and compact workflow hygiene surfaces whose primary role is keeping repo/workflow position legible over time

It is not a runtime layer.
It is not an architecture authority.

### 12.2 Current live-zone acknowledgment

The following README zones are currently real in the repo and should be treated honestly in placement review:

- `README/Cleanup/`
- `README/Transformer/LanguageKernel/`
- `Transformer/LanguageKernel/`

Their current existence does not by itself settle their long-term compression or regrouping posture.
They may remain provisional until later cleanup packets decide otherwise.

### 12.3 Constitution append rule

Append this constitution when a new canonical folder or recurring subfolder class is legitimized.

Do not append it merely to mirror every current file or transient status change.

### 12.4 Projected target hierarchy posture

The sketches below are design-level grouping posture only.

They do **not** approve immediate file moves.
They do **not** overrule live repo reality.

Projected tests posture:

```text
tests/
  runtime/
    core/
    substrate/
    reporting/
  operators/
    contracts/
    posture/
  adapters/
  hud/
    door_one/
    app_surfaces/
    optional adapters/
  reconstruction/
    backend/
    readside/
  provenance/
  probes/
    diagnostics/
    replay_real_source/
    identity_calibration/
  consultation/
  readside/
    accounting/
  source_registry/
  workflow/
```

Projected README posture:

```text
README/
  Core/
  Operational/
  WorkflowMechanization/
  Diagnostics/
  Experiments/
  ResultInterpretation/
  Roadmap/
  Cleanup/                  
  Transformer/LanguageKernel/ 
```

### 12.5 Legitimized test subgroup classes

Packet `PKT-TEST-GROUPING-003` legitimizes the following function-first test subgroup classes:

- `tests/consultation/`
- `tests/hud/app_surfaces/`
- `tests/reconstruction/readside/`
- `tests/readside/accounting/`
- `tests/source_registry/`

These subgroup names describe verification function.
They do not create a new authority layer.
They do not imply Door Two activation.

`tests/door_two/` should not be treated as a canonical organizing principle for future test placement.

If a test family remains ambiguous, leave it outside these subgroup classes until a later cleanup packet can classify it honestly.

### 12.6 Transformer executable seam acknowledgment

`Transformer/LanguageKernel/` is a lawful top-level executable seam for the bounded Language Kernel experiment.

Its role is narrow:

- seam-local validator code
- seam-local benchmark runner code
- seam-local invocation/mechanization helpers
- seam-local examples and generated verification outputs

It is not:

- runtime integration
- HUD integration
- repo-global model orchestration
- canon or truth authority

`README/Transformer/LanguageKernel/` remains the companion contract/spec zone.

`Transformer/LanguageKernel/` remains the executable companion zone.

This split is lawful because it preserves:

- README-side contract posture
- executable seam-local mechanization
- bounded adjacency without smuggling the seam into runtime/
