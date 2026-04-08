# Dynamical Memory Engine — Operator Inventory Audit

## Status

This document defines the bounded audit posture for inventorying operator-adjacent seams, surfaces, components, helpers, and attachments in DME.

It is a supporting instrumentation, governance, cleanup, and planning note.

It does **not** override:

- `README_MasterConstitution.md`
- `README.WorkflowContract.md`
- `README.StructuralIdentityLaw.md`
- `README.DeclaredVsMechanizedAudit.md`
- `README.MechanizationClosureGate.md`
- `README.PacketWorkflowChain.md`
- `README_DoorOneDevelopmentalOutline.md`
- `README.OperatorExposurePlaneLaw.md`
- `README.OperatorPlaneContractTemplate.md`
- `README.OperatorExposurePlaneChain.md`
- `README.OperatorSupportSurfaceLaw.md`
- `README.OperatorPlaneBuildOrder.md`
- `README.OperatorPlanePacketContract.md`
- `README.OperatorRegistry.md`

Its purpose is narrower:

- define how current-reality operator inventory should be performed,
- define the classification fields used to audit operator-adjacent objects,
- distinguish structural, support, review, shell, and mixed objects,
- identify contamination, orphaning, substitution, and role confusion,
- support retirement, suspension, archive, removal, and rebuild planning,
- and create one stable bridge from the OperatorExposure README stack into cleanup and unthreading work.

This note governs **operator inventory audit posture** only.

It does **not** govern:

- runtime artifact meaning by itself,
- canon activation,
- semantic overlay law by itself,
- final codebase folder topology,
- or final rebuild decisions by itself.

---

## 1. Why this note exists

DME now has enough operator-plane law, support separation, chain logic, build-order logic, packet discipline, and registry stabilization that the next real need is no longer another abstract note.

The next need is:

**to inspect current reality against the intended seam/surface/plane architecture before deciding what to keep, suspend, archive, remove, or rebuild.**

Without a bounded inventory audit, several risks become active:

- tearing down surfaces that are still useful and lawful,
- preserving contaminated surfaces because they appear coherent,
- confusing mixed-role objects for structural operator objects,
- moving repo topology before seam classification is stable,
- and making unthreading decisions without knowing what each current object actually does.

This note exists to prevent that.

One-line summary:

**Inventory comes before teardown because classification must become explicit before separation can be lawful.**

---

## 2. Core rule

**No operator-adjacent object should be preserved, retired, suspended, archived, removed, or rebuilt until it has been classified against the canonical registry and audited for actual role, actual seam, actual dependencies, and contamination posture.**

Corollary rules:

- useful is not automatically lawful,
- visible is not automatically structural,
- adjacent to runtime is not automatically part of Structure,
- support is not automatically contamination,
- and contamination is not automatically proof that full stripdown is required.

If an object cannot be classified clearly, it should remain:

- unresolved,
- mixed,
- or requires-further-audit,

whichever is most honest.

One-line summary:

**Inventory must classify before cleanup can decide.**

---

## 3. Constitutional posture

This note operates under already-active inherited rules:

- runtime is not canon,
- query is not truth,
- substrate is not ontology,
- declared is not mechanized,
- displayed is not mechanized,
- replay-shaped is not reconstructed,
- structural exposure must remain direct, pre-semantic, and inspectable,
- operator planes must expose first-order emitted output before support, semantic, or review layers,
- support surfaces must remain support rather than semantic or review substitutes,
- bounded work should advance one seam through one closure target at the lowest lawful layer.

Accordingly, inventory in this note means:

- bounded current-reality classification,
- not a justification for immediate deletion,
- not a semantic judgment of past work,
- not a final rebuild verdict by itself,
- and not permission to collapse operator group, build class, and code topology into one thing.

This note remains below canon.

---

## 4. Definition of an operator inventory audit

In DME, an **operator inventory audit** means:

> a bounded classification pass over current operator-adjacent objects in which each object is assigned a seam, operator group, build class, current role, actual role, dependency posture, contamination posture, and cleanup recommendation strongly enough that later retirement and unthreading work can proceed without role confusion.

This means inventory is always:

- object-relative,
- seam-relative,
- registry-relative,
- contamination-sensitive,
- and current-reality-focused.

The inventory audit is **not** guaranteed merely because:

- a file tree exists,
- components are named,
- the shell renders,
- or a helper says the architecture is understood.

One-line distinction:

**Inventory says what the object actually is and does now, not what it was meant to be.**

---

## 5. Canonical reference rule

The inventory audit should derive operator classification from `README.OperatorRegistry.md`.

This means inventory should reference the registry for:

- `operator_id`
- `operator_group`
- `build_class`
- `chain_position`
- upstream/downstream relation

The inventory audit should not redefine those assignments independently unless a bounded conflict is being surfaced explicitly.

One-line summary:

**The registry is the canonical classification source; the inventory audit is the current-reality comparison against it.**

---

## 6. Inventory objects

The inventory audit may classify any current object that participates in or touches the operator chain, including:

- runtime operator files
- helper/adaptor files
- shell/frame files
- render-plane components
- support surfaces
- derived inspection surfaces
- report surfaces
- query/review helpers
- mixed workbench objects
- export objects
- local composition helpers

This note is intentionally broader than “operators only.”

Why:
because contamination often lives in attachments, wrappers, reports, and mixed surfaces rather than in the pure operator core.

---

## 7. Required inventory fields

Every audited object should define at minimum:

- `object_id`
- `object_name`
- `object_type`
- `file_or_surface_location`
- `declared_operator_id`
- `actual_operator_id`
- `declared_operator_group`
- `actual_operator_group`
- `build_class`
- `current_role`
- `actual_role`
- `upstream_dependencies`
- `downstream_dependencies`
- `primary_payload_touched`
- `support_payload_touched`
- `review_or_semantic_payload_touched`
- `contamination_posture`
- `status_recommendation`
- `notes`

These fields are the minimum stable audit surface.

---

## 8. Field definitions

### 8.1 `object_id`
Stable audit identifier for the current object.

### 8.2 `object_name`
Readable object name.

### 8.3 `object_type`
Examples:
- operator
- helper
- adapter
- shell
- frame
- primary plane
- support surface
- derived plane
- report
- query/review object
- mixed object

### 8.4 `file_or_surface_location`
Path or surface location being audited.

### 8.5 `declared_operator_id`
The operator/seam this object is said to belong to, if any.

### 8.6 `actual_operator_id`
The operator/seam this object actually serves after audit.

### 8.7 `declared_operator_group`
Structure / Support / Review as currently implied or claimed.

### 8.8 `actual_operator_group`
Structure / Support / Review as determined by audit.

### 8.9 `build_class`
B0 / B1 / B2 / B3 as derived from the registry seam.

### 8.10 `current_role`
What the object appears to be doing according to current naming or placement.

### 8.11 `actual_role`
What the object is actually doing after audit.

Examples:
- primary exposure
- support exposure
- derived inspection
- shell/routing
- semantic overlay
- review
- mixed

### 8.12 `upstream_dependencies`
What earlier seams or objects must exist for this object to be lawful.

### 8.13 `downstream_dependencies`
What later seams or objects depend on this object.

### 8.14 `primary_payload_touched`
Does this object render or manipulate first-order emitted output?

### 8.15 `support_payload_touched`
Does this object render or manipulate support/derived fields?

### 8.16 `review_or_semantic_payload_touched`
Does this object introduce query/review/semantic behavior?

### 8.17 `contamination_posture`
See section 10 below.

### 8.18 `status_recommendation`
See section 11 below.

### 8.19 `notes`
Short bounded observations only.

---

## 9. Role vocabulary

The inventory audit should use the following role vocabulary.

### 9.1 Primary exposure
Directly exposes first-order emitted output.

### 9.2 Support exposure
Exposes derived structural/accounting output.

### 9.3 Derived inspection
Rearranges already-exposed output into later alternate form.

### 9.4 Shell / routing
Controls source selection, run, mode, or plane selection outside the plane.

### 9.5 Review / semantic
Introduces query, classification, interpretation, or readiness behavior.

### 9.6 Mixed
Combines more than one of the above in a way that weakens seam clarity.

One-line summary:

**Current-role and actual-role should be described using one stable role vocabulary.**

---

## 10. Contamination posture classes

The inventory audit should classify contamination explicitly.

### 10.1 C0 — Clean
Object serves one lawful role and does not import stronger layers.

### 10.2 C1 — Mild contamination
Object is mostly lawful but contains minor role bleed or naming drift.

### 10.3 C2 — Mixed-role contamination
Object combines multiple roles strongly enough that seam clarity is weakened.

### 10.4 C3 — Substitution contamination
Object stands in for a missing earlier seam or stronger layer.

### 10.5 C4 — Severe contamination
Object collapses Structure, Support, and/or Review enough that it is unsafe to preserve as active without separation.

One-line summary:

**Contamination posture measures role confusion and substitution risk, not aesthetic quality.**

---

## 11. Status recommendation classes

After inventory, each object should receive one recommendation.

### 11.1 Keep active
Object is lawful enough to remain active as-is.

### 11.2 Keep with narrow fix
Object is mostly lawful but needs small correction.

### 11.3 Suspend
Object should be removed from active routes until revalidated.

### 11.4 Archive
Object should be preserved for reference only, not active mounting.

### 11.5 Remove
Object should be deleted because it is misleading or no longer serves lawful structure.

### 11.6 Rebuild later
Object should not be preserved as-is, but its function may return later under a cleaner seam.

### 11.7 Unresolved
Object needs more audit before status can be assigned.

One-line summary:

**Inventory does not only say what something is; it says what should happen to it next.**

---

## 12. Audit procedure

For each object, ask in order:

1. What seam does this object claim to belong to?
2. What seam does it actually belong to?
3. Is it Structure, Support, or Review?
4. Is it primary exposure, support, derived inspection, shell/routing, review/semantic, or mixed?
5. What upstream seams must already be inspectable for this object to be lawful?
6. Is it touching first-order emitted output, support fields, review logic, or more than one?
7. Is it substituting for a missing earlier seam?
8. What contamination class does it fall into?
9. Should it be kept, fixed, suspended, archived, removed, rebuilt later, or left unresolved?

This procedure should remain stable.

---

## 13. Recommended inventory table shape

Use the following shape where practical.

| object_id | object_name | object_type | location | declared_operator_id | actual_operator_id | declared_group | actual_group | build_class | current_role | actual_role | upstream_dependencies | downstream_dependencies | primary_payload_touched | support_payload_touched | review_or_semantic_payload_touched | contamination_posture | status_recommendation | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

This table is intentionally dense.
It is meant to support cleanup decisions, not to read like prose.

---

## 14. Inventory principles

### 14.1 Classify reality, not intention
Audit what the object does now, not what it was originally for.

### 14.2 Prefer specific contamination over vague discomfort
Name the contamination class rather than saying “feels wrong.”

### 14.3 Separate role confusion from code quality
An object may be well-coded and still be role-contaminated.

### 14.4 Separate support from review
Support is not automatically contamination. Review attached to support often is.

### 14.5 Prefer bounded recommendations
“Keep,” “suspend,” “archive,” “remove,” and “rebuild later” are better than vague unease.

### 14.6 Do not force repo movement from audit alone
Inventory informs topology decisions later; it does not automatically compel them now.

---

## 15. Relationship to unthreading

Inventory should happen before unthreading.

Why:
because unthreading needs to know:

- what is actually mixed,
- what is merely adjacent,
- what is safely separable,
- what is orphaned,
- and what is worth preserving.

The inventory audit does not itself perform unthreading.
It prepares the ladder.

One-line summary:

**Inventory classifies the knots. Unthreading unties them later.**

---

## 16. Relationship to retirement

Inventory should also happen before retirement.

Why:
because retirement decisions need to know whether an object is:

- contaminated but salvageable
- contaminated and actively misleading
- useful but misplaced
- clean enough to keep
- or not yet understandable enough to decide

The inventory audit should therefore feed retirement packet planning directly.

---

## 17. Failure modes specific to inventory

Common inventory failures include:

- classifying by filename instead of actual role
- treating all support as contamination
- treating all mixed objects as automatic deletion
- assuming shell objects are structural just because they route structural planes
- assuming operator-adjacent reports are harmless because they are downstream
- preserving objects because they are visually useful even when they substitute for missing seams
- overfitting future repo topology from present audit results
- skipping unresolved classification and forcing false clarity

These should be treated as real audit failures.

---

## 18. Relationship to adjacent notes

This note pairs most directly with:

- `README.OperatorRegistry.md`
- `README.OperatorExposurePlaneLaw.md`
- `README.OperatorExposurePlaneChain.md`
- `README.OperatorSupportSurfaceLaw.md`
- `README.OperatorPlaneBuildOrder.md`
- `README.OperatorPlanePacketContract.md`

Suggested next companion:

- `README.OperatorUnthreadingLadder.md`

Suggested future packet uses:

- current-reality audit packets
- contamination mapping packets
- retirement/suspension/archive packets
- unthreading packets
- rebuild planning packets

---

## 19. Dated baseline snapshots

This note should remain the audit-law and method note for operator inventory work.

Actual audit findings should normally be recorded in:

- dated sibling snapshot files
- repo-state-specific packet outputs
- bounded appendices when a local packet explicitly requires them

This prevents the method note from silently becoming a living registry or permanent current-reality surface.

Current baseline snapshot:

- `README.OperatorInventorySnapshot.2026-04-08.md` - initial current-reality audit baseline recorded on 2026-04-08; repo-state-specific, audit-only, and not permanent truth

---

## 20. One-line summary

**In DME, an operator inventory audit classifies current operator-adjacent objects against the canonical registry and role vocabulary so cleanup, retirement, and unthreading decisions can be made from explicit reality rather than intuition.**
