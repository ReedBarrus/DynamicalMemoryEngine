# README.SeamRegistryModel.md
# Dynamical Memory Engine — Seam Registry Model

## Status

This document defines the first bounded seam-registry model for the Workflow Mechanization facet in DME.

It is a supporting workflow-facet note.

It does **not** override:

- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README_RepoPlacementConstitution.md`
- `README.WorkflowMechanizationScope.md`
- `README.MechanizationClosureGate.md`
- `README.PacketWorkflowChain.md`
- `README.StructuralIdentityLaw.md`
- `README.EmissionAdmissionGrammar_v0.md`

Its purpose is narrower:

- define what a seam registry is,
- define what a seam entry must preserve,
- define the minimum status fields needed for closure/accounting,
- define how packets and regimes attach to seams,
- and provide a lawful bookkeeping object for workflow mechanization without creating a new authority layer.

This note governs **workflow seam accounting** only.

It does **not** govern:

- runtime artifact meaning,
- operator contracts,
- canon activation,
- architectural truth,
- merge authority,
- or autonomous workflow progression.

---

## 1. Why this note exists

The Workflow Mechanization facet now has:

- a closure gate,
- a scope law,
- a packet workflow chain,
- a structural identity kernel,
- and an emission/admission grammar.

That is enough to make a new practical need real:

**the workflow needs a compact way to remember what seams exist, what state they are in, what packets have acted on them, and what pressure is accumulating around them.**

Without a seam registry, several kinds of drift become likely:

- the same seam gets rediscovered under new names,
- packet history becomes hard to recover,
- mechanization status becomes conversational instead of inspectable,
- regimes accumulate in memory but not in workflow objects,
- and helper tools lose the ability to reason about active seams without overreading the repo.

The seam registry exists to prevent that drift.

It is an accounting surface.
It is not a truth surface.
It is not an architecture engine.

---

## 2. Core rule

**A seam registry entry is a bounded workflow accounting object that records the declared identity, active status, packet lineage, closure posture, and regime pressure of one bounded seam without inflating the seam into authority.**

Corollary rules:

- a seam entry is not the seam itself
- registry presence is not mechanization
- registry status is not truth
- registry convenience is not authority
- registry memory must not outrank the underlying seam evidence

If the registry and the actual seam disagree, the actual seam evidence wins.

---

## 3. What counts as a seam

A seam is a bounded place where workflow pressure can lawfully act.

Examples:

- one model seam
- one rendering seam
- one runtime coordinator seam
- one closure-gate seam
- one README/law seam
- one adapter seam
- one test seam
- one preservation seam
- one bounded cross-file integration seam

A seam should be small enough that:

- it can be named clearly,
- its files can be identified,
- its bounded question can be stated,
- its closure target can be reviewed,
- and its packet history can be accounted for.

If a “seam” is too large to preserve those, it is probably multiple seams.

---

## 4. Seam registry purpose

The seam registry should let the workflow answer questions like:

- what seam is active right now?
- what packet most recently touched it?
- is the seam declared, displayed, partially mechanized, or mechanized?
- what remains blocked or unresolved?
- what regimes are accumulating around it?
- has this seam already been split/fissioned?
- what notes govern its closure?
- what should be reviewed before work resumes?

The registry exists to make those questions auditable without making them magical.

---

## 5. Minimal seam entry model

A seam entry should preserve the following minimum fields.

## 5.1 Identity fields

### `seam_id`
Stable identifier for the seam.

### `seam_label`
Short human-readable seam name.

### `seam_type`
Examples:
- runtime
- model
- HUD
- test
- closure_gate
- README_law
- adapter
- preservation
- integration
- other_bounded_type

### `bounded_question`
The exact bounded development question this seam is supposed to answer.

### `declared_role`
What this seam exists to do.

### `explicit_non_role`
What this seam must not silently become.

---

## 5.2 Placement fields

### `repo_zone`
Primary repo zone.

Examples:
- `runtime/`
- `hud/`
- `operators/`
- `tests/`
- `README/WorkflowMechanization/`

### `files_in_scope`
The current primary files that define or carry the seam.

### `governing_notes`
The minimum notes that must be read to work on the seam honestly.

---

## 5.3 Closure fields

### `closure_status`
Valid values:

- `declared`
- `displayed`
- `partially_mechanized`
- `mechanized`

This should follow the closure-gate vocabulary already established elsewhere. :contentReference[oaicite:4]{index=4}

### `closure_target`
What condition would make the next closure step lawful.

### `explicit_non_claims`
What must still not be claimed about the seam.

### `failure_posture_present`
Boolean or explicit note.

### `downgrade_posture_present`
Boolean or explicit note where applicable.

---

## 5.4 Packet lineage fields

### `active_packet_id`
The packet currently responsible for this seam, if any.

### `packet_history`
Ordered list of bounded packet references that have acted on the seam.

### `last_accepted_packet`
Most recent accepted packet touching the seam.

### `fission_parent`
If the seam work was split from a larger packet, reference the parent packet.

### `fission_children`
If this seam produced multiple child packets, list them.

These fields exist because packet fission is now a real workflow pattern and should remain visible rather than conversational. :contentReference[oaicite:5]{index=5}

---

## 5.5 Audit fields

### `audit_posture`
Short current audit stance.

Examples:
- clean
- partial
- blocked
- lane_blocked
- unresolved
- under_review

### `dominant_telemetry`
One or more of:
- distortion
- drift
- uncertainty

### `known_risks`
Short list of bounded current risks.

### `what_is_now_true`
What the workflow can honestly say is real now.

### `what_is_still_not_claimed`
What remains explicitly below claim.

These fields should preserve audit honesty rather than compress it into a false green light.

---

## 5.6 Regime fields

### `regime_signals`
Observed repeating pressures attached to the seam.

Examples:
- stable_advance
- repair_pressure
- mutation_pressure
- false_readiness
- premature_expansion
- lane_insufficiency
- route_oscillation
- seam_overmixing

### `regime_notes`
Short explanatory note on why the regime signal exists.

### `review_threshold`
Whether stronger review is justified yet.

The registry should not decide regimes automatically in v0.
It should only preserve the possibility of tracking them explicitly.

---

## 5.7 Authority posture fields

### `owner_authority`
Usually Reed.

### `architect_posture`
What architectural stance currently applies.

### `engineer_posture`
What implementation posture currently applies.

### `helper_posture`
What helper/tool support is allowed.

These fields exist to preserve hierarchy and prevent helper memory from silently outranking role authority. 

---

## 6. Structural identity rule for seam entries

A seam entry must not preserve “same seam” language unless structural identity remains honest.

A seam entry is still the same seam only while it preserves:

- the same bounded question,
- the same declared role,
- the same repo-zone responsibility,
- the same authority posture,
- and the same lawful route class,

strongly enough that packet history and closure state still refer to the same bounded workflow object.

If those fail, the correct action is not silent continuity.
It is:

- rename,
- split,
- narrow,
- or mark new seam required.

This applies the structural identity law to workflow accounting objects. :contentReference[oaicite:7]{index=7}

---

## 7. Seam registry outputs

A seam registry entry should support these bounded output questions:

- what is this seam?
- where does it live?
- what governs it?
- what state is it in?
- what packet owns it?
- what has already been done?
- what is blocked?
- what regime pressure is accumulating?
- what still must not be claimed?

That is enough for v0.

The registry is not meant to be an autonomous planning engine.

---

## 8. Minimal v0 registry object example

```json
{
  "seam_id": "replay_reconstruction_surface",
  "seam_label": "Replay reconstruction surface",
  "seam_type": "HUD",
  "bounded_question": "Can the active replay surface render reconstruction-backed replay honestly under the declared support-trace posture?",
  "declared_role": "Read-side replay rendering seam",
  "explicit_non_role": "Not canon, not truth, not raw restoration",
  "repo_zone": "hud/",
  "files_in_scope": [
    "hud/replayModel.js",
    "hud/ReplayRegion.jsx",
    "tests/reconstruction/readside/test_reconstruction_replay_surface.js"
  ],
  "governing_notes": [
    "README.MechanizationClosureGate.md",
    "README.PacketWorkflowChain.md",
    "README.StructuralIdentityLaw.md"
  ],
  "closure_status": "mechanized",
  "closure_target": "Render reconstruction-backed replay with explicit failure and downgrade posture",
  "explicit_non_claims": [
    "not canon",
    "not truth",
    "not raw restoration"
  ],
  "failure_posture_present": true,
  "downgrade_posture_present": true,
  "active_packet_id": null,
  "packet_history": [
    "Packet A",
    "Packet B1",
    "Packet B2",
    "Packet B3",
    "Packet C"
  ],
  "last_accepted_packet": "Packet C",
  "fission_parent": "Packet B",
  "fission_children": [
    "Packet B1",
    "Packet B2",
    "Packet B3"
  ],
  "audit_posture": "clean",
  "dominant_telemetry": [
    "uncertainty_resolved"
  ],
  "known_risks": [
    "higher-tier replay remains deferred"
  ],
  "what_is_now_true": [
    "backend exists",
    "model reaches backend",
    "active surface renders reconstruction-backed fields"
  ],
  "what_is_still_not_claimed": [
    "full retention-tier-aware replay engine",
    "canon uplift",
    "truth"
  ],
  "regime_signals": [
    "stable_advance",
    "lane_insufficiency_resolved_by_fission"
  ],
  "regime_notes": [
    "Original replay packet exceeded safe seam capacity and was resolved through lawful packet fission"
  ],
  "review_threshold": false,
  "owner_authority": "Reed",
  "architect_posture": "accepted",
  "engineer_posture": "complete",
  "helper_posture": "support_only"
}
```

This is illustrative, not yet a mandatory repo data file.

## 9. v0 implementation posture

For v0, the seam registry model should remain:

README-defined
optionally mirrored in a tiny JSON or JS object later
manually maintained at first if needed
subordinate to actual packet/test/repo evidence

Do not yet turn it into:

a hidden workflow database
a self-updating authority engine
a merge gate by itself
a substitute for architectural review

The first correct use is simple:
define the model, then try it on one or two seams.

## 10. Relationship to emission/admission grammar

The seam registry does not replace emission/admission grammar.

Relationship:

emission/admission grammar defines what kinds of workflow objects may be produced and admitted
the seam registry defines how long-lived seams are accounted for across packets, closure states, and regime pressure

So:

emission/admission grammar governs object entry
seam registry governs seam memory

These should remain distinct.

## 11. Relationship to packet chain

The seam registry depends directly on the packet workflow chain.

Packets act on seams.
The registry remembers:

which seam,
under which packet,
with what closure result,
and under what ongoing regime pressure.

This note therefore makes packet history inspectable without turning packet history into authority.

## 12. Small-scope rule

This model must remain small in v0.

Do not expand it yet into:

global automation orchestration
autonomous packet planning
hidden merge policy
tool-first agent governance
a replacement for Reed / Architect / Engineer judgment

The first lawful use is:

define seam entry shape
define seam-state fields
try the model on one or two real seams
only later consider a lightweight machine-readable registry file
## 13. One-line review question

Before recording or updating a seam entry, ask:

Is this still the same bounded seam with the same governing question, role, authority posture, and closure state, or has it drifted enough that the registry should split, rename, narrow, or defer rather than silently preserving continuity?

## 14. One-line summary

The seam registry model defines how DME may account for bounded seams, closure state, packet lineage, and regime pressure without mistaking workflow memory for authority, mechanism, or truth.
