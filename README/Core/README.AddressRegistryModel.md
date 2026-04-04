# README.AddressRegistryModel.md
# Dynamical Memory Engine — Address Registry Model

## Status

This document defines the first bounded address-registry model for the Workflow Mechanization facet in DME.

It is a supporting workflow-facet note.

It does **not** override:

- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README_RepoPlacementConstitution.md`
- `README.DeclaredVsMechanizedAudit.md`
- `README.DeterministicInvarianceThreshold.md`
- `README.DistortionAuditProtocol.md`
- `README.StructuralIdentityLaw.md`
- `README.WorkflowMechanizationScope.md`
- `README.PacketWorkflowChain.md`
- `README.MechanizationClosureGate.md`

Its purpose is narrower:

- define a registry model for bounded governance, workflow, seam, packet, and support objects,
- provide stable addresses for tracking object identity across development,
- preserve scope coverage, known omissions, cross-check posture, and audit status,
- reduce silent drift in accounting and governing documents as the repo evolves,
- and create a lawful support substrate for later seam review, packet tracking, and helper tooling.

This note governs **workflow-object addressing and audit accounting** only.

It does **not** govern:

- runtime artifact meaning,
- canon activation,
- operator contracts,
- substrate semantics,
- architectural truth,
- or hidden authority transfer to registry memory.

The registry is a support surface.
It is not a truth engine.
It is not a substitute for repo evidence.

---

## 1. Why this note exists

DME now has enough:

- constitutional notes,
- accounting notes,
- workflow notes,
- surface maps,
- acceptance and developmental outlines,
- active seams,
- and mechanized sub-surfaces

that one recurring risk has become operationally dangerous:

**a document or accounting surface can remain useful while drifting out of full contact with the evolving system around it.**

This drift may appear as:

- scope compression,
- stale inventory assumptions,
- missing current seams,
- implied completeness where only partial coverage exists,
- authority overread from older but still “official” notes,
- or repeated conversational compression masking what the repo now actually contains.

This note exists to reduce that drift.

The address registry gives bounded workflow objects a stable identity and audit posture so the system can say:

- what this object is,
- what slice of the system it actually covers,
- what it omits,
- when it was last cross-checked,
- what authority posture it holds,
- and whether it is currently fit to be used as an accounting base.

---

## 2. Core rule

**A bounded workflow object may serve as a lawful accounting, governance, seam, or review reference only when it carries a stable address, explicit scope coverage, explicit known omissions, explicit authority posture, and explicit audit/cross-check status rather than being treated as complete merely because it is useful, familiar, or historically central.**

Corollary rules:

- address is not authority
- registry presence is not truth
- usefulness is not coverage
- older authority does not immunize a document from fidelity drift
- accounting surface is not completeness proof
- registry memory must remain subordinate to repo state, seam evidence, accepted tests, and active governing law

If the registry and current repo evidence disagree, repo evidence wins.

---

## 3. What the address registry tracks

The address registry is broader than a seam registry.

In v0, it may track any bounded workflow object that benefits from:

- stable identity,
- explicit scope accounting,
- explicit drift/audit posture,
- and later retrieval/helper support.

Allowed early object classes include:

- `governance_note`
- `accounting_note`
- `surface_map`
- `audit_note`
- `workflow_note`
- `acceptance_checklist`
- `developmental_outline`
- `seam_entry`
- `packet_entry`
- `helper_wrapper_entry`
- `registry_entry`
- `review_object`

The registry is not intended to describe “everything in the repo.”
It is intended to track the bounded objects whose drift would materially distort development, review, or stabilization.

---

## 4. Registry purpose

The address registry should let the workflow answer questions such as:

- what is this object?
- what kind of object is it?
- where does it live?
- what is it supposed to cover?
- what does it explicitly not cover?
- how authoritative is it?
- when was it last cross-checked against repo reality?
- what seams, packets, or notes does it relate to?
- is it fit to serve as an accounting or review base right now?
- what drift or omission risks are already known?

This is an accountability surface.
It is not a legitimacy shortcut.

---

## 5. Address principle

Every registered object should carry a stable address that is rich enough to preserve:

- identity,
- location,
- declared role,
- scope boundary,
- audit posture,
- and time-relative review status.

The registry should prefer:

- explicit address fields,
- explicit omissions,
- explicit audit status,
- and explicit non-claims

over relying on one human memory, one thread, or one compressed summary.

---

## 6. Registry entry model v0

A lawful registry entry should preserve the following fields.

## 6.1 Identity fields

### `address_id`
Stable registry identifier for the object.

Format may remain human-readable in v0.

Examples:
- `core.surface_map.door_one.v1`
- `workflow.closure_gate.replay_reconstruction.v1`
- `core.acceptance_checklist.door_one.current`
- `workflow.address_registry_model.v0`

### `object_class`
The registry-tracked class.

Examples:
- `surface_map`
- `workflow_note`
- `acceptance_checklist`
- `governance_note`
- `seam_entry`

### `object_label`
Short human-readable label.

### `file_path`
Current repo path of the object.

### `repo_zone`
Primary repo zone.

Examples:
- `README/Core/`
- `README/WorkflowMechanization/`
- `runtime/`
- `hud/`
- `tests/`

---

## 6.2 Role and scope fields

### `bounded_question`
What bounded question this object is meant to answer.

### `declared_role`
What this object exists to do.

### `explicit_non_role`
What this object must not silently become.

### `scope_coverage`
What system slice this object actually covers.

Examples:
- lower runtime coordination only
- compact Door One accounting only
- replay reconstruction closure only
- packet workflow law only

### `known_omissions`
What important current surfaces, seams, or concerns are not fully covered by this object.

This field is load-bearing.

It exists specifically to prevent compact or aging documents from being overread as complete inventory.

---

## 6.3 Authority posture fields

### `authority_posture`
Examples:
- constitutional
- workflow_governance
- supporting_accounting
- supporting_audit
- implementation_governance
- read_side_only
- review_only

### `explicit_non_claims`
What this object must still not be used to claim.

Examples:
- not full inventory proof
- not runtime truth
- not canon
- not full app-surface map
- not mechanization proof by itself

---

## 6.4 Status and audit fields

### `current_status`
Examples:
- active
- active_but_partial
- under_audit
- needs_crosscheck
- stale_risk
- superseded
- deprecated_reference

### `audit_status`
Examples:
- unaudited
- lightly_reviewed
- crosschecked_against_repo
- crosschecked_against_tests
- known_drift_detected
- revision_required

### `dominant_telemetry`
One or more of:
- distortion
- drift
- uncertainty

### `known_risks`
Short current risk list.

Examples:
- compact map may omit newer app seams
- declared coverage outruns repo reality
- partially mechanized seam treated as complete
- stale path references possible

---

## 6.5 Cross-check fields

### `last_crosscheck_date`
Date of most recent explicit cross-check.

### `last_crosscheck_basis`
What the object was cross-checked against.

Examples:
- current repo topology
- touched seam files
- active tests
- current app surface files
- repo placement constitution
- declared-vs-mechanized audit

### `crosscheck_notes`
Short note describing what was actually checked and what still was not.

---

## 6.6 Relationship fields

### `related_objects`
Bounded list of related registry ids, seam ids, packet ids, or governing notes.

### `related_seams`
Optional explicit seam references.

### `related_tests`
Optional test references used to validate or challenge this object’s coverage.

### `related_packets`
Optional packet references if the object is under active packet work.

---

## 6.7 Truthfulness fields

### `what_is_now_true`
What the workflow can honestly say this object currently does or covers.

### `what_is_still_not_claimed`
What this object must still not be overread to claim.

These fields are required because the registry exists partly to mechanize anti-overclaim posture.

---

## 7. Required v0 rules for registry use

### Rule 1 — Coverage honesty

A registered object must explicitly state what slice it covers and what it omits. 

### Rule 2 — Repo contact rule

No registered object may be treated as a current inventory base unless it has been cross-checked against current repo reality at the relevant seam.

### Rule 3 — Accounting is not completeness

An accounting note may remain useful while being partial.

Registry entries must preserve that distinction rather than flattening it.

### Rule 4 — Drift is recordable

If drift or omission is detected, that object should not silently remain “good enough.”
The registry should record the drift posture explicitly.

### Rule 5 — Registry is subordinate

Registry entries do not outrank:
- github repo state
- current seam files
- active tests
- accepted constitutional law

Always refer to the github repo main branch: https://github.com/ReedBarrus/DynamicalMemoryEngine/ for authoritative surface accounting

### Rule 6 — Cross-examination is lawful

An authoritative or central document may still be audited, perturbed, or found partial.
Authority posture does not make an object immune to fidelity review.

---

## 8. Structural identity rule for registry objects

A registry entry may preserve “same object” language only while the object still preserves:

- the same bounded question,
- the same declared role,
- the same scope coverage posture,
- the same authority posture,
- and enough support/contact with the repo/system slice it claims to account for.

If those drift materially, the correct action is not silent continuity.
It is:

- mark `active_but_partial`
- mark `needs_crosscheck`
- mark `known_drift_detected`
- supersede
- split into narrower entries
- or emit revision-required posture

This applies the Structural Identity Law to governance/accounting objects themselves. :contentReference[oaicite:0]{index=0}

---

## 9. Compression-accountability rule

The address registry exists partly to resist compression drift.

A registry entry should therefore make visible when an object is:

- compact by design,
- partial by design,
- stale by repo evolution,
- or misleading because it compresses distinct current system realities into one outdated accounting surface.

This is especially important for:

- surface maps
- acceptance checklists
- developmental outlines
- declared-vs-mechanized audits
- repo topology references

The registry should therefore preserve not only what an object says, but what it no longer sees clearly.

This composes directly with the Distortion Audit Protocol. :contentReference[oaicite:1]{index=1}

---

## 10. Registry relationship to workflow mechanization

The address registry is a support substrate for workflow mechanization.

It helps the workflow facet preserve:

- bounded object identity,
- explicit audit posture,
- packet/seam/accounting continuity,
- and time-relative drift visibility.

It does **not** become:
- workflow government,
- architectural authority,
- or automatic review outcome.

This remains consistent with the Workflow Mechanization Scope note:
workflow mechanization exists to help DME develop lawfully, not to define runtime meaning or constitutional truth. :contentReference[oaicite:2]{index=2}

## 10.5 Repo-authority accounting rule

The GitHub repository is the authority space for current file reality and active seam existence.

This means:

- repo topology is the first source for what files and surfaces currently exist,
- the address registry is the first source for bounded accounting posture over those objects,
- and supporting notes remain bounded interpretation/accounting views rather than completeness proofs by themselves.

Accordingly:

- if a document inventory and current repo topology disagree, repo topology wins for current file reality,
- if a document claims broader coverage than its registered scope and omissions justify, the registry should mark that drift explicitly,
- and if review is in doubt about active surface reality, the repo must be checked directly before the document is used as a complete accounting base.

The address registry therefore treats the repo as authority space for current seam reality,
while treating registry entries as authority-indexed accounting objects rather than truth engines.

This rule exists to prevent:
- compact accounting surfaces from being mistaken for complete current inventories,
- older but still useful notes from being overread as repo-complete,
- and workflow review from drifting into document-memory authority without repo contact.

---

## 11. Registry relationship to packet workflow

Packet workflow acts on bounded seams and objects.

The registry makes it easier to know:
- what the object is,
- what it claims to cover,
- whether it has already drifted,
- and whether a packet is operating on the same lawful object or a silently changed one.

This is a workflow support memory surface, not a substitute for packet review. :contentReference[oaicite:3]{index=3}

---

## 12. Registry relationship to repo placement

Registry entries should preserve repo placement explicitly.

This matters because:
- placement is coordination, not ontology,
- but misplaced or unstated placement still causes workflow confusion. :contentReference[oaicite:4]{index=4}

A registry entry that cannot identify:
- current file path
- current repo zone
- and current placement role

is not yet fit to serve as a strong accounting object.

---

## 13. v0 entry template

Use the following template for early manual registry entries.

```yaml
address_id:
object_class:
object_label:
file_path:
repo_zone:

bounded_question:
declared_role:
explicit_non_role:

scope_coverage:
known_omissions:

authority_posture:
explicit_non_claims:

current_status:
audit_status:
dominant_telemetry:
known_risks:

last_crosscheck_date:
last_crosscheck_basis:
crosscheck_notes:

related_objects:
related_seams:
related_tests:
related_packets:

what_is_now_true:
what_is_still_not_claimed:
```

This template is intentionally manual and lightweight in v0.

## 14. Self-address of this note

This note should register itself as a first-class workflow object.

Suggested self-entry:
```yaml
address_id: core.address_registry_model.v0
object_class: workflow_note
object_label: Address Registry Model
file_path: README/WorkflowMechanization/README.AddressRegistryModel.md
repo_zone: README/WorkflowMechanization/

bounded_question: How should DME assign stable addresses and audit posture to governance, accounting, seam, packet, and support objects so document drift and coverage drift remain visible?
declared_role: Define the v0 address-registry model for workflow/accounting objects.
explicit_non_role: Not a truth engine, not runtime authority, not automatic registry updater.

scope_coverage: Workflow/accounting object identity and audit metadata model.
known_omissions:
  - No automated registry sync yet
  - No full seam population yet
  - No packet population yet
  - No machine-enforced coverage checks yet

authority_posture: workflow_governance
explicit_non_claims:
  - Not full implementation
  - Not runtime meaning
  - Not authority completeness proof

current_status: active_but_partial
audit_status: lightly_reviewed
dominant_telemetry:
  - uncertainty
known_risks:
  - Schema may need narrowing once first real entries are populated
  - Field set may be slightly overcomplete for earliest usage

last_crosscheck_date: YYYY-MM-DD
last_crosscheck_basis:
  - Workflow mechanization notes
  - Repo placement constitution
  - Current drift incident from surface-map overread
crosscheck_notes: Initial model authored before live population pass.

related_objects:
  - workflow.packet_chain.v0
  - workflow.mechanization_closure_gate.v0
  - workflow.workflow_mechanization_scope.v0

related_seams: []
related_tests: []
related_packets: []

what_is_now_true:
  - Defines a lawful v0 registry schema for bounded workflow/accounting objects
  - Makes scope coverage and omissions first-class fields
  - Supports later seam audit and document drift tracking
what_is_still_not_claimed:
  - That the registry is populated
  - That registry tooling is mechanized
  - That coverage drift is already fully controlled
  ```
## 15. First recommended population order

Populate the registry manually for these objects first:

README_DoorOneSurfaceMap.md
README.DeclaredVsMechanizedAudit.md
README_DoorOneAcceptanceChecklist.md
README_DoorOneDevelopmentalOutline.md
README_DoorOneInspectionSurfacePosture.md
README_RepoPlacementConstitution.md
README_WorkflowContract.md
current active app-surface seams after the first true accounting pass

This order is recommended because these objects currently shape interpretation of stabilization and surface truthfulness.

## Active Seam Families

## 16. Small-scope rule

This registry must remain small in v0.

Do not expand it yet into:

auto-updating governance memory
hidden workflow government
automatic drift scoring engine
universal repo ontology
autonomous helper authority
automatic merge/review control

The first lawful use is:

define the model
manually register a few high-impact objects
use the registry during app-surface accounting
only then decide whether helper support is justified

## 16.1 Structural accounting

Structural accounting belongs in one compact accounting surface per active Door unless a second note answers a different bounded question.
New docs should prefer appending or narrowing existing accounting notes before creating a fresh inventory-style note.

## 17. One-line review question

Before trusting any document, seam note, or accounting surface as a current base for review, ask:

Does this object carry a stable address, explicit scope coverage, explicit omissions, explicit audit posture, and recent enough repo contact to justify using it as a present accounting surface, or am I overreading a useful but partial object as if it were complete?

## 18. One-line summary

The address registry model gives DME bounded workflow and accounting objects stable identity, scope, omission, and audit metadata so document drift, seam drift, and compression-driven overread can be made visible before they silently distort development or review.

## 19. Registry Surface

### 19.1 Active Seam Families

Runtime coordination
    DoorOneExecutiveLane
    DoorOneOrchestrator
    CrossRunSession
    DoorOneWorkbench

App / shell composition
    SemanticOscilloscopeApp
    MetaLayerObjectExecutionShell
    app_main
    execution_main
    demo_main

Read-side / shaping
    DoorOneHUD
    DoorOneStructuralMemoryHud
    DoorOneStructuralMemoryHudModel
    tandemAdapter
    ReplayRegion

Request / replay shaping
    requestModel
    replayModel
    replay rendering seam
    request preparation seam

Ingest / adapter seams
    ingestAdapters
    adapter normalization seam
    source-family/workflow seam
    file/device/sampler intake seam

Preservation / retention seams
    live outputs
    receipts
    digest
    pin/archive
    retained-tier replay posture

### 19.2 Object Accounts
```yaml
####  README.DoorOneSurfaceMap.md  #######################################################
address_id: core.surface_map.door_one.current
object_class: surface_map
object_label: Door One Surface Map
file_path: README/Core/README_DoorOneSurfaceMap.md
repo_zone: README/Core/

bounded_question: What is the compact current accounting map of Door One runtime, app/composition, inspection, replay, request, and preservation surfaces?
declared_role: Compact accounting surface for Door One.
explicit_non_role: Not full repo inventory proof, not runtime truth, not mechanization proof by itself.

scope_coverage:
  - lower runtime coordination seams
  - app/composition seams
  - read-side inspection surfaces
  - replay/request shaping surfaces
  - preservation/retention surfaces
known_omissions:
  - full per-file deep seam contracts
  - exhaustive helper/wrapper surfaces
  - full packet lineage for each seam

authority_posture: supporting_accounting
explicit_non_claims:
  - not full completeness proof
  - not constitutional authority
  - not proof of backend maturity by itself

current_status: under_audit
audit_status: crosschecked_against_repo
dominant_telemetry:
  - drift
known_risks:
  - compactness can collapse newer app seams into lower runtime spine
  - partially mechanized seams may be overread as mature if not called out explicitly
########################################################################################

#### README.md #############################################################
address_id: root.project_readme.current
object_class: governance_note
object_label: Root Project README
file_path: README.md
repo_zone: root/

bounded_question: What is the top-level project identity and how should readers navigate current constitutional, core, diagnostic, and workflow notes without overreading root as a second surface map?
declared_role: Top-level project orientation and navigation note.
explicit_non_role: Not full surface inventory, not runtime boundary, not status audit.

scope_coverage:
  - project identity
  - current Door posture
  - navigation to authoritative/core notes
  - repo-authority reminder
known_omissions:
  - full seam inventory
  - full capability-status map
  - detailed runtime contracts

authority_posture: supporting_accounting
explicit_non_claims:
  - not full implementation proof
  - not full app-surface map
  - not closure proof by itself

current_status: under_audit
audit_status: crosschecked_against_repo
dominant_telemetry:
  - drift
known_risks:
  - root can regrow duplicate surface accounting
###########################################################################

########## README.DeclaredVsMechanicalAudit.md ##########################################
address_id: core.declared_vs_mechanized_audit.current
object_class: audit_note
object_label: Declared vs Mechanized Audit
file_path: README/Core/README.DeclaredVsMechanizedAudit.md
repo_zone: README/Core/

bounded_question: What DME capabilities are only declared, only displayed, partially mechanized, or truly mechanized at their bounded seam?
declared_role: Capability-status audit note for preventing surface clarity from being mistaken for functional attainment.
explicit_non_role: Not a full current surface inventory, not runtime truth, not a replacement for the Surface Map.

scope_coverage:
  - capability-status vocabulary
  - bounded status map for active Door One surfaces/seams
  - anti-overclaim distortion classes
  - stronger-claim admission posture
known_omissions:
  - full seam inventory and full repo topology
  - deep per-file seam contracts
  - complete product-surface narrative
  - full retention/canon workflow details

authority_posture: supporting_audit
explicit_non_claims:
  - not full inventory proof
  - not runtime meaning
  - not canon policy
  - not closure proof by itself

current_status: active_but_partial
audit_status: crosschecked_against_repo
dominant_telemetry:
  - drift
known_risks:
  - audit entries can drift into duplicate surface accounting
  - partially mechanized seams can be overread as mature if inventory language grows too rich
###########################################################################

################ README_DoorOneAcceptanceChecklist.md ##############################
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
###########################################################################

########## README.DoorOneInspectionSurfacePosture.md #############################
address_id: core.door_one.inspection_surface_posture.current
object_class: governance_note
object_label: Door One Inspection Surface Posture
file_path: README/Core/README_DoorOneInspectionSurfacePosture.md
repo_zone: README/Core/

bounded_question: How must Door One read-side inspection surfaces present provenance, runtime evidence, interpretation, and review posture so display does not become hidden authority?
declared_role: Read-side discipline note for Door One inspection surfaces.
explicit_non_role: Not a full surface inventory, not runtime boundary, not capability-status audit.

scope_coverage:
  - provenance-first inspection ordering
  - evidence plane definitions
  - visual posture rules
  - read-side drift questions
  - current HUD/read-side tightening guidance
known_omissions:
  - full seam inventory
  - full current capability-status map
  - runtime contract details
  - detailed app composition topology

authority_posture: implementation_governance
explicit_non_claims:
  - not runtime truth
  - not canon policy
  - not full app-surface accounting
  - not mechanization proof

current_status: active
audit_status: crosschecked_against_repo
dominant_telemetry:
  - drift
known_risks:
  - practical examples could regrow into duplicate surface accounting
  - inspection guidance could be overread as broader runtime authority

what_is_now_true:
  - defines the active provenance/runtime/interpretation/review ordering
  - governs read-side anti-overread posture for Door One
  - remains consistent with current development-pressure guidance
what_is_still_not_claimed:
  - full current surface inventory
  - capability-status classification
  - runtime semantics or canon authority
###########################################################################

########## README.MasterConstitutionl.md ####################################
address_id: root.master_constitution.current
object_class: governance_note
object_label: Master Constitution
file_path: README_MasterConstitution.md
repo_zone: root/

bounded_question: What is the single constitutional authority for DME layer law, boundary law, naming law, and Door definitions?
declared_role: Constitutional authority for architecture, layer order, and boundary rules.
explicit_non_role: Not repo topology authority, not workflow packet grammar, not a surface inventory.

scope_coverage:
  - layer order
  - canonical layer definitions
  - Door definitions
  - boundary rules
  - canonical naming law
known_omissions:
  - repo topology details
  - bounded workflow packet grammar
  - current seam inventory
  - current capability-status map

authority_posture: constitutional
explicit_non_claims:
  - not repo placement law
  - not current surface accounting
  - not current implementation proof by itself

current_status: active
audit_status: crosschecked_against_repo
dominant_telemetry:
  - drift
known_risks:
  - can be overread as current code-state proof
  - roadmap language can be pulled downward if not checked against active scope

last_crosscheck_date: 2026-04-03
last_crosscheck_basis:
  - current root authority set
  - current core governance notes
crosscheck_notes: Root constitutional authority confirmed.

related_objects:
  - root.constitution_appendix.current
  - root.workflow_contract.current
  - root.repo_placement_constitution.current

what_is_now_true:
  - defines the active constitutional staircase and boundary rules
  - remains the single authority for architecture/layer meaning
what_is_still_not_claimed:
  - current code-state completeness
  - current seam inventory
  - repo placement truth
###########################################################################

########## README.ConsitutionAppendix.md ###############################################
address_id: root.constitution_appendix.current
object_class: governance_note
object_label: Constitution Appendix
file_path: README_ConstitutionAppendix.md
repo_zone: root/

bounded_question: What compact reference tables derive from the Master Constitution for artifact classes, operators, layer-door matrix, and preferred/disallowed phrase guidance?
declared_role: Compact derived constitutional reference.
explicit_non_role: Not independent constitutional authority, not current implementation proof, not surface inventory.

scope_coverage:
  - authority classes
  - artifact quick-reference
  - operator quick-reference
  - door/layer matrix
  - preferred/disallowed phrase reference
known_omissions:
  - full constitutional reasoning
  - current seam inventory
  - current capability-status posture

authority_posture: constitutional_support
explicit_non_claims:
  - not peer authority over Master Constitution
  - not repo topology law
  - not active code-state proof

current_status: active
audit_status: crosschecked_against_repo
dominant_telemetry:
  - drift
known_risks:
  - quick-reference tables can drift from current code/docs if not refreshed
  - can be overread as exhaustive implementation inventory

last_crosscheck_date: YYYY-MM-DD
last_crosscheck_basis:
  - README_MasterConstitution.md
crosscheck_notes: Derived reference posture confirmed.

related_objects:
  - root.master_constitution.current

what_is_now_true:
  - provides compact constitutional lookup tables
what_is_still_not_claimed:
  - independent constitutional authority
  - current surface/state accounting
###########################################################################

################ README.WorkflowContract.md ###################
address_id: root.workflow_contract.current
object_class: governance_note
object_label: Workflow Contract
file_path: README_WorkflowContract.md
repo_zone: root/

bounded_question: How do Reed, Architect-ChatGPT, and Engineer-ChatGPT collaborate lawfully, and what are the active source-of-truth and patch-packet rules?
declared_role: Governance contract for roles, handoff, review, escalation, and packet discipline.
explicit_non_role: Not architecture authority over the Master Constitution, not runtime meaning, not repo topology law.

scope_coverage:
  - roles
  - engineer rules
  - escalation lane
  - standard development loop
  - review priority
  - active source-of-truth rule
  - patch packet rules
known_omissions:
  - layer definitions
  - artifact meaning
  - current seam inventory
  - repo zone placement details

authority_posture: workflow_governance
explicit_non_claims:
  - not constitutional override on architecture
  - not runtime authority
  - not surface accounting

current_status: active
audit_status: crosschecked_against_repo
dominant_telemetry:
  - drift
known_risks:
  - packet templates can be overread as architecture authority
  - chat-local memory can be overread if repo-contact rule is ignored

last_crosscheck_date: YYYY-MM-DD
last_crosscheck_basis:
  - root governance docs
  - address registry model
crosscheck_notes: Repo source-of-truth and patch-packet posture confirmed.

related_objects:
  - root.master_constitution.current
  - root.repo_placement_constitution.current

what_is_now_true:
  - defines active collaboration and review law
  - states the repo is authoritative for active code state
what_is_still_not_claimed:
  - architectural supremacy over the Master Constitution
  - current seam inventory
###########################################################################

########### README.RepoPlacementConstitution###########################################
address_id: root.repo_placement_constitution.current
object_class: governance_note
object_label: Repo Placement Constitution
file_path: README_RepoPlacementConstitution.md
repo_zone: root/

bounded_question: Where do files belong in the DME repo, how should repo growth be coordinated, and what is the canonical current target layout?
declared_role: Authoritative repo topology and file-placement law.
explicit_non_role: Not artifact meaning, not layer meaning, not canon semantics, not runtime ontology.

scope_coverage:
  - root vs subfolder placement
  - canonical repo zones
  - canonical target layout
  - README subfolder rules
known_omissions:
  - runtime artifact meaning
  - current capability-status posture
  - full seam contract semantics

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

last_crosscheck_date: YYYY-MM-DD
last_crosscheck_basis:
  - current repo topology
crosscheck_notes: Root/topology authority confirmed.

related_objects:
  - root.master_constitution.current
  - root.workflow_contract.current
  - core.address_registry_model.current

what_is_now_true:
  - governs placement and topology
  - includes canonical current target layout
what_is_still_not_claimed:
  - artifact/layer meaning
  - runtime semantics
###########################################################################



```