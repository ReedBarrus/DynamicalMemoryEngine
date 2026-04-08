# Dynamical Memory Engine — Operator Registry

## Status

This document defines the canonical operator registry currently used for DME operator classification, chain ordering, build-order reference, seam-local contract reference, and packet routing.

It is a supporting instrumentation, governance, and registry note.

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

Its purpose is narrower:

- define one canonical registry for operator classification,
- separate operator group from build class,
- stabilize chain position and dependency references,
- prevent README restatement drift across the OperatorExposure stack,
- provide one routing/reference object for contracts and packets,
- and delay premature repo-topology movement until seam disentangling is more mature.

This note governs **operator-registry posture** only.

It does **not** govern:

- runtime artifact meaning by itself,
- canon activation,
- final codebase folder topology,
- semantic overlay by itself,
- or final app composition.

---

## 1. Why this note exists

DME now has enough operator-plane law, chain logic, support separation, build-order logic, and packet-routing logic that one stabilizing object is needed:

**a single canonical registry for operator classification and reference.**

Without a registry, several drift risks become active:

- operator grouping being restated differently across notes,
- chain position being redefined in multiple places,
- build-order classes being treated as if they were the same as operator type,
- packets routing differently depending on which note is cited,
- and repo-topology changes being made before the epistemic/operator classification is stable.

This note exists to prevent that drift.

One-line summary:

**The operator registry is the single canonical reference surface for operator classification, relation, and routing.**

---

## 2. Core rule

**Operator classification, chain position, build class, and dependency reference should be owned canonically by this registry and referenced by adjacent notes rather than being re-specified independently in multiple places.**

Corollary rules:

- group is not the same as build class,
- build class is not the same as repo folder placement,
- chain order is not the same as final UI order,
- and local contract detail is not the same as canonical registry membership.

If a note needs operator classification, it should point to the registry unless it is the registry.

One-line summary:

**This note owns canonical operator reference. Other notes should derive from it.**

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

Accordingly, the operator registry in this note means:

- a canonical classification and reference surface,
- not a final ontology of all future operators,
- not forced code-module placement,
- not proof that the underlying seams are fully disentangled,
- and not permission to reorganize runtime folders prematurely.

This note remains below canon.

---

## 4. Definition of the operator registry

In DME, the **operator registry** means:

> the canonical table of operator-seam entries used to define operator group, build class, chain position, emitted output, support outputs, and dependency references strongly enough that law notes, contracts, and packets can reference one stable source instead of restating these assignments independently.

This means the registry is always:

- seam-relative,
- classification-relative,
- dependency-relative,
- and revision-controlled.

The registry is **not** guaranteed merely because:

- operators exist in code,
- a chain note exists,
- or a build-order note exists.

One-line distinction:

**The registry is where operator assignments are declared canonically, not where they are argued repeatedly.**

---

## 5. Two-axis classification rule

The registry keeps two different classifications explicit.

### 5.1 Operator group

This answers:

**What kind of seam is this?**

Allowed current values:

- `Structure`
- `Support`
- `Review`

These should remain explicit and not be collapsed into build priority.

### 5.2 Build class

This answers:

**How early does this seam need to become inspectable in the current exposure-plane program?**

Allowed current values:

- `B0` — Foundational
- `B1` — Core structural
- `B2` — Consolidation / preservation
- `B3` — Continuity-bounded later surface

These should remain explicit and not be collapsed into operator group.

One-line summary:

**Operator group classifies seam type. Build class classifies developmental priority.**

---

## 6. Registry fields

Each registry entry should define at minimum:

- `operator_id`
- `operator_name`
- `operator_group`
- `build_class`
- `chain_position`
- `primary_emitted_output`
- `support_outputs`
- `upstream_dependencies`
- `downstream_dependencies`
- `primary_plane_required`
- `support_surface_allowed`
- `derived_plane_allowed`
- `review_layer_allowed`
- `current_status`
- `notes`

These fields are the minimum stable reference surface.

---

## 7. Field definitions

### 7.1 `operator_id`
Stable canonical identifier for the seam.

Example:
- `ingest`
- `clock_align`
- `window`
- `transform`
- `compress`
- `anomaly`
- `merge`
- `retention_signature`
- `replay_bounded`

### 7.2 `operator_name`
Human-readable operator/seam name.

### 7.3 `operator_group`
One of:
- `Structure`
- `Support`
- `Review`

### 7.4 `build_class`
One of:
- `B0`
- `B1`
- `B2`
- `B3`

### 7.5 `chain_position`
Canonical order position in the operator exposure-plane chain.

### 7.6 `primary_emitted_output`
The seam’s first-order emitted output.

### 7.7 `support_outputs`
Derived/support/accounting outputs adjacent to the seam.

### 7.8 `upstream_dependencies`
Registry ids this seam depends on for lawful exposure.

### 7.9 `downstream_dependencies`
Registry ids that depend on this seam.

### 7.10 `primary_plane_required`
Whether a P0 plane is required for this seam in the current program.

### 7.11 `support_surface_allowed`
Whether a support surface is lawful/expected for this seam.

### 7.12 `derived_plane_allowed`
Whether a later P2/alternate inspection plane is lawful later.

### 7.13 `review_layer_allowed`
Whether review/query/semantic layers may later attach to this seam’s output.

### 7.14 `current_status`
Suggested values:
- `declared`
- `drafted`
- `displayed`
- `partially_mechanized`
- `mechanized`
- `suspended`
- `retired`

### 7.15 `notes`
Short bounded clarifications only.

---

## 8. Canonical registry table

The following is the current recommended registry baseline.

| operator_id | operator_name | operator_group | build_class | chain_position | primary_emitted_output | support_outputs | upstream_dependencies | downstream_dependencies | primary_plane_required | support_surface_allowed | derived_plane_allowed | review_layer_allowed | current_status | notes |
|---|---|---:|---:|---:|---|---|---|---|---|---|---|---|---|---|
| ingest | Ingest | Structure | B0 | 1 | ordered samples / source-local sample frames | source id, channel id, sample count, min/max/rms, duration | none | clock_align | yes | yes | yes | later only | declared | first structural contact seam |
| clock_align | Clock Align | Structure | B0 | 2 | aligned timestamps / frame positions / alignment deltas | mean/max offset, jitter, latency, dropped/padded counts | ingest | window | yes | yes | yes | later only | declared | regularization seam |
| window | Window | Structure | B0 | 3 | window boundaries / frame extents / source-to-window mapping | window count, hop, overlap, extents | clock_align | transform | yes | yes | yes | later only | declared | segmentation seam |
| transform | Transform | Structure | B1 | 4 | window-indexed transform-space values / bin or frequency magnitudes | transform family, scale fields, lens params, bin axis descriptors | window | compress, anomaly | yes | yes | yes | later only | declared | first major remapping seam |
| compress | Compress | Structure | B1 | 5 | reduced structure / retained-vs-discarded relation / residual relation | loss metrics, retained counts, thresholds | transform | anomaly, merge, retention_signature | yes | yes | yes | later only | declared | reduction seam |
| anomaly | Anomaly | Structure | B1 | 6 | anomaly field / deviation scores / thresholded differences | thresholds, anomaly magnitudes, flagged ids | transform, compress | merge | yes | yes | yes | later only | declared | structural deviation seam |
| merge | Merge | Structure | B2 | 7 | merge mapping / grouped region relation / adjacency relation | merge count, criteria, region sizes, upstream ids | anomaly | retention_signature | yes | yes | yes | later only | declared | grouping/consolidation seam |
| retention_signature | Retention / Signature | Structure | B2 | 8 | retained signature structure / preserved support relation | lineage fields, receipt refs, retained tier, support metrics | merge | replay_bounded | yes | yes | yes | later only | declared | preservation seam |
| replay_bounded | Replay / Reconstruction-Bounded | Structure | B3 | 9 | replay-support relation / retained-vs-replay structural relation / residual relation | retained tier, threshold posture, fidelity fields, replay accounting | retention_signature | review/query seams | yes | yes | yes | yes | declared | latest structural seam in current chain |
| query_op | QueryOp | Review | B3 | later | bounded question activation over exposed output | query class, routing/accounting | replay_bounded and/or earlier exposed seams | review / claim / consultation | no | yes | yes | yes | declared | downstream read/review seam |
| semantic_overlay | Semantic Overlay | Review | B3 | later | n/a as primary emission | descriptor-backed interpretation fields | exposed structural/support seams | review / consultation | no | no primary support role | yes | yes | declared | removable and downstream only |
| review_matrix | Review / Classification | Review | B3 | later | n/a as primary emission | classification posture, downgrade posture, blockers | exposed structural/support/query seams | consultation / minting-readiness | no | yes | yes | yes | declared | evaluation seam |

---

## 9. Registry ownership rules

The registry should own:

- canonical operator ids
- operator group assignments
- build class assignments
- canonical chain position
- dependency references

The registry should **not** try to own:

- full seam-local contract detail
- full packet acceptance logic
- full app routing detail
- semantic overlay law
- final code-module placement

One-line summary:

**The registry owns canonical assignments, not every local detail.**

---

## 10. Relationship to adjacent notes

### 10.1 Chain note relation

`README.OperatorExposurePlaneChain.md` should describe:
- upstream/downstream relation
- chain membership
- evidentiary order

It should reference the registry for canonical assignments where possible.

### 10.2 BuildOrder note relation

`README.OperatorPlaneBuildOrder.md` should describe:
- developmental priority
- implementation batching
- staged sequencing

It should derive from registry `build_class` and chain position rather than restating incompatible ownership.

### 10.3 Template note relation

`README.OperatorPlaneContractTemplate.md` should define:
- seam-local contract fields

It should reference registry values when instantiating seam-local contracts.

### 10.4 Packet note relation

`README.OperatorPlanePacketContract.md` should define:
- workflow packet shape

It should reference registry ids and class assignments for routing.

---

## 11. Registry update rule

The registry may be updated when:

- a new operator seam is introduced,
- an operator’s group assignment changes,
- build-class staging changes,
- canonical dependencies change,
- or a seam is retired/suspended.

Registry updates should remain:

- explicit,
- diffable,
- justified,
- and reviewed before adjacent notes are updated to match.

No note should silently diverge from the registry once the registry exists.

One-line summary:

**Update the registry first, then let adjacent notes derive from it.**

---

## 12. Registry and repo topology

The registry should guide:
- law,
- contracts,
- packets,
- README references,
- inventory,
- retirement,
- and unthreading

before it guides filesystem placement.

This is important because:

- build class is not automatically a folder boundary,
- group is not automatically a module boundary,
- orchestration may cut across multiple groups,
- support/utilities may remain shared,
- and premature topology moves can create churn before seams are actually disentangled.

Therefore:

**registry first, repo movement later where real seams support it.**

---

## 13. Registry and cleanup/inventory work

This note should be used directly during:

- current-reality vs target-reality audit
- operator inventory stabilization
- contamination mapping
- support/review separation
- retirement/suspension/archive decisions
- unthreading planning
- packet scoping

For each current surface or component, ask:

1. what `operator_id` does it belong to?
2. what `operator_group` should govern it?
3. what `build_class` should govern priority?
4. is it primary exposure, support, derived, or review?
5. is it substituting for a missing earlier seam?

---

## 14. Failure modes specific to the registry

Common registry failures include:

- group and build class being collapsed into one field
- chain position being redefined outside the registry
- README notes restating incompatible operator assignments
- repo folders being moved as if the registry were already a code-placement law
- support/review seams being classified as Structure just because they touch structural output
- downstream seams being given earlier build class because they are visually appealing
- “later only” review/query seams being treated as if they are part of the primary operator emission chain

These should be treated as real governance drift.

---

## 15. Relationship to adjacent notes

This note pairs most directly with:

- `README.OperatorExposurePlaneLaw.md`
- `README.OperatorPlaneContractTemplate.md`
- `README.OperatorExposurePlaneChain.md`
- `README.OperatorSupportSurfaceLaw.md`
- `README.OperatorPlaneBuildOrder.md`
- `README.OperatorPlanePacketContract.md`

Suggested future usage:

- seam-local plane contracts
- cleanup packet ladders
- retirement/unthreading plans
- later repo-placement audit after disentangling work

---

## 16. One-line summary

**In DME, the operator registry is the canonical reference surface for operator group, build class, chain position, emitted output, support outputs, and dependency relations, so adjacent notes can derive from one stable assignment source instead of drifting independently.**