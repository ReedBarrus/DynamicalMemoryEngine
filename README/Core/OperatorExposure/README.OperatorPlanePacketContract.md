# Dynamical Memory Engine - Operator Plane Packet Contract

## Status

This document defines the bounded packet contract for DME operator-plane work.

It is a supporting instrumentation, workflow, and implementation-governance note.

It does **not** override:

- `README_MasterConstitution.md`
- `README.WorkflowContract.md`
- `README.StructuralIdentityLaw.md`
- `README.DeclaredVsMechanizedAudit.md`
- `README.MechanizationClosureGate.md`
- `README.PacketWorkflowChain.md`
- `README_DoorOneDevelopmentalOutline.md`
- `README.StructuralExposureLaw.md`
- `README.StructuralExposureFailureModes.md`
- `README.SymbolicGravityTaxonomy.md`
- `README.StructuralSurfacePacketContract.md`
- `README.OperatorExposurePlaneLaw.md`
- `README.OperatorPlaneContractTemplate.md`
- `README.OperatorExposurePlaneChain.md`
- `README.OperatorSupportSurfaceLaw.md`
- `README.OperatorPlaneBuildOrder.md`

Its purpose is narrower:

- define how operator-plane work must be packetized,
- constrain implementation packets so they remain seam-local and exposure-first,
- prevent support, semantic, or review drift during operator-plane work,
- define required declarations, deliverables, and acceptance criteria for operator-plane packets,
- and give DME one stable workflow grammar for moving operator planes from declared -> displayed -> mechanized.

This note governs **operator-plane packet posture** only.

It does **not** govern:

- runtime artifact meaning by itself,
- canon activation,
- semantic overlay design by itself,
- full app composition by itself,
- or final product routing.

---

## 1. Why this note exists

DME now has enough operator-plane law, chain definition, support separation, and build-order discipline that one additional workflow need has become clear:

**operator planes will drift unless their implementation packets are constrained as tightly as the seams they are meant to expose.**

Without a dedicated packet contract, several risks become active:

- mixed-seam implementation packets,
- support substitution for primary exposure,
- more legible forms being built before more direct forms,
- shell or route work silently redefining plane scope,
- helper models treating operator-plane work as UI work rather than seam work,
- and acceptance being granted because a plane looks good rather than because it exposes the declared payload.

This note exists to prevent that drift.

One-line summary:

**If operator planes are built through packets, the packets themselves must preserve seam-local exposure law.**

---

## 2. Core rule

**Every operator-plane packet should advance one declared seam through one bounded closure target, with explicit primary emitted output, explicit support scope, explicit forbidden substitutions, and explicit acceptance conditions tied to the operator-plane contract.**

Corollary rules:

- one packet should usually target one seam,
- one seam should usually target one plane class at a time,
- primary exposure packets should not silently become support or review packets,
- support packets should not silently claim primary-plane completion,
- and shell/routing work must not silently redefine what the plane is exposing.

If a packet cannot preserve those distinctions, it should be:

- narrowed,
- split,
- deferred,
- escalated,
- or reclassed.

One-line summary:

**Operator-plane packets must remain seam-local, exposure-specific, and acceptance-explicit.**

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

Accordingly, an operator-plane packet in this note means:

- a bounded workflow object for one operator-plane seam,
- not a general UI request,
- not a broad app-surface redesign request,
- not a permission slip to mix Structure, Support, and Review,
- and not a substitute for seam-local contract definition.

This note remains below canon.

---

## 4. Definition of an operator-plane packet

In DME, an **operator-plane packet** means:

> a bounded implementation or audit packet whose purpose is to specify, build, repair, validate, separate, or retire one operator-plane seam strongly enough that the seam's primary or support exposure becomes more accurate, more inspectable, or more honestly classified without silently widening into semantic, support, or review drift.

This means an operator-plane packet is always:

- seam-relative,
- plane-class-relative,
- output-relative,
- contract-relative,
- closure-target-relative,
- and mechanization-relative where a real path matters.

An operator-plane packet is **not** guaranteed merely because:

- it mentions a plane,
- it mentions a render surface,
- it changes a component,
- or it produces a visible chart.

One-line distinction:

**An operator-plane packet advances seam-local exposure closure, not generic display work.**

---

## 5. Packet classes for operator-plane work

The current workflow should recognize the following packet classes.

---

### 5.1 OP-P0 - Primary exposure packet

#### Purpose

Build, repair, or validate a seam's primary exposure plane.

#### Typical outputs

- sample table
- sample trace
- alignment delta table
- transform matrix/heatmap
- anomaly field plane
- merge map

#### Main rule

This packet class targets first-order emitted output only.

It must not silently complete support, semantic, or review work.

#### One-line summary

**OP-P0 packets are for primary emitted exposure.**

---

### 5.2 OP-P1 - Support surface packet

#### Purpose

Build, repair, or validate a support surface for an already-declared seam.

#### Typical outputs

- numeric sidecar
- support table
- threshold table
- lineage/accounting panel
- seam-local metadata fields

#### Main rule

An OP-P1 packet must not be accepted as an OP-P0 completion.

#### One-line summary

**OP-P1 packets are for support exposure, not primary exposure.**

---

### 5.3 OP-P2 - Derived inspection packet

#### Purpose

Build a later alternate arrangement of already-exposed seam output.

#### Typical outputs

- more legible chart form
- residual plane
- overlay comparison plane
- adjacency/graph view
- alternate transform profile

#### Main rule

OP-P2 should usually come after OP-P0 and usually after OP-P1 where support matters.

#### One-line summary

**OP-P2 packets are for alternate inspection forms, not first exposure.**

---

### 5.4 OP-P3 - Audit / inventory / retirement packet

#### Purpose

Audit current plane state, classify contamination, suspend surfaces, retire surfaces, archive surfaces, or prepare unthreading.

#### Typical outputs

- current vs target inventory
- seam/surface classification
- suspend/archive/remove recommendations
- contamination map
- dependency map

#### Main rule

OP-P3 packets do not claim exposure completion.
They support cleanup, stabilization, or build planning.

#### One-line summary

**OP-P3 packets are for plane audit, inventory, and retirement work.**

---

### 5.5 OP-P4 - Shell/routing support packet

#### Purpose

Patch routing or shell harness only to the extent required to expose a declared operator plane lawfully.

#### Typical outputs

- source -> run -> plane wiring
- active plane selector
- route-specific shell tightening
- null/failure status routing outside the plane

#### Main rule

OP-P4 must not silently redefine the seam, payload, or plane class.

#### One-line summary

**OP-P4 packets support operator planes from outside the plane.**

---

## 6. Required declarations for every operator-plane packet

Every operator-plane packet should explicitly declare all of the following.

---

### 6.1 Active seam

Required:

- primary seam
- operator name
- plane class being targeted
- why this seam is the correct lowest lawful target

Purpose:

This prevents packets from drifting across multiple seams.

---

### 6.2 Active closure target

Required:

- declared -> drafted
- drafted -> displayed
- displayed -> partially mechanized
- partially mechanized -> mechanized
- audit / retire / suspend / split / remove

Purpose:

This prevents packets from trying to do too many closure steps at once.

---

### 6.3 Active emitted output or support output

Required:

- primary emitted output if OP-P0
- support output if OP-P1
- derived source payload if OP-P2
- audited seam/surface object if OP-P3
- shell-to-plane dependency if OP-P4

Purpose:

This keeps the packet tied to the actual payload class it is allowed to touch.

---

### 6.4 Active constraints

Required:

- active exposure constraint
- explicit non-constraints
- relevant boundary/representation limits
- what must remain out of scope

Purpose:

This prevents symbolic or app-composition drift.

---

### 6.5 Files in scope

Required:

- files to modify
- files to read but not modify
- files explicitly out of scope

Purpose:

This keeps packets auditable and bounded.

---

### 6.6 Forbidden substitutions

Required:

- what may not replace the declared payload
- what may not be rendered inside the primary plane
- what later layer must remain absent

Examples:

- no support replacing primary output
- no semantic text inside primary plane
- no review posture
- no mixed dashboard
- no fake payload
- no shell-local prose inside plane

Purpose:

This is the anti-drift center of the packet.

---

### 6.7 Acceptance criteria

Required:

- visible criteria
- numeric/field criteria
- tests required
- manual inspection required
- immediate fail triggers

Purpose:

This makes packet review objective.

---

## 7. Packet requirements by class

### 7.1 OP-P0 requirements

Must declare:

- primary emitted output
- most direct form
- axes and units
- null/failure posture
- forbidden substitutions
- whether support is separate or absent for now

Must not silently include:

- support completion
- semantic overlay
- review posture
- shell redesign beyond what is necessary to mount the plane

### 7.2 OP-P1 requirements

Must declare:

- supported seam
- support class (S0/S1/S2/S3)
- support placement
- why support is not primary
- what primary plane it is not allowed to replace

Must not silently include:

- primary-plane completion claim
- semantic overlay
- review posture

### 7.3 OP-P2 requirements

Must declare:

- already-exposed source payload
- why alternate form is needed
- what direct form it must remain accountable to
- what flattening risk it introduces

Must not silently erase:

- the most direct form
- support distinctions
- earlier seam boundaries

### 7.4 OP-P3 requirements

Must declare:

- audit target
- classification vocabulary
- current vs target posture
- keep / suspend / archive / remove / rebuild recommendation
- reasons for each classification

Must not silently claim:

- mechanization closure
- exposure completion
- redesign approval

### 7.5 OP-P4 requirements

Must declare:

- shell/routing seam
- supported operator plane
- why shell changes are strictly required
- what plane behavior is being unblocked
- what shell behavior is explicitly out of scope

Must not silently change:

- seam payload
- plane class
- support/review composition
- semantic posture

---

## 8. Preferred packet sequence per seam

For a normal seam, the recommended packet sequence is:

1. seam-local contract packet
2. OP-P0 primary exposure packet
3. OP-P1 support packet
4. OP-P2 derived inspection packet later if needed
5. OP-P4 shell/routing packet only if required
6. OP-P3 audit/retirement packet whenever contamination or legacy cleanup is needed

This order should remain stable where practical.

One-line summary:

**Specify first, expose first-order output second, support it third, polish later.**

---

## 9. Packet acceptance rules

An operator-plane packet should not be accepted merely because:

- the route renders,
- a chart appears,
- the panel looks cleaner,
- support fields exist,
- or the packet closes some UI annoyance.

It should be accepted only when:

- the declared seam is still the active seam,
- the declared plane class is still the active plane class,
- the declared payload is what is actually rendered or audited,
- forbidden substitutions did not occur,
- null/failure posture remained honest,
- and the closure target was satisfied without hidden layer inflation.

One-line summary:

**Acceptance belongs to seam-local closure, not surface polish.**

---

## 10. Immediate fail triggers

Any operator-plane packet should fail immediately if any of the following occur:

- support replaces primary emitted output in an OP-P0 packet
- semantic or review content enters a primary exposure plane
- a later seam is used to disguise an earlier missing seam
- fake, placeholder, or disconnected payload is rendered
- shell or routing work silently redefines the operator seam
- a more legible alternate form is built without preserving the more direct form
- a support packet is returned as if it completed primary exposure
- an audit packet silently becomes a redesign packet
- a shell packet silently becomes a semantic composition packet

---

## 11. Packet routing rules

When an operator-plane packet returns, it should be routed explicitly as one of:

- accept
- revise
- narrow
- split
- defer
- escalate
- suspend / archive / remove (for OP-P3 work)
- merge only after acceptance

The packet route should remain explicit.

A useful but misclassed result should usually be:
- revised,
- narrowed,
- or reclassed,

not silently accepted.

---

## 12. Relationship to inventory, retirement, and unthreading

This packet contract should be used directly during:

- current-reality vs target-reality audits
- seam/surface hierarchy stabilization
- contamination mapping
- support/review separation
- shell unthreading
- retirement/suspension/archive decisions
- rebuild planning

In those contexts, OP-P3 packets should be preferred over broad redesign asks.

This keeps cleanup as lawful packet work instead of emotional or vague teardown.

---

## 13. Mechanization posture in packet work

A packet may move a plane from:
- declared
- to displayed
- to partially mechanized
- to mechanized

But no packet should silently round partial closure upward.

For every return, the packet should state:

- what is now true
- what is still not claimed
- what closure target was actually reached
- what later closure still remains

Displayed is not mechanized.
Support is not primary.
Legible is not sufficient.
Routing is not payload.
Audit is not rebuild.

---

## 14. Relationship to adjacent notes

This note pairs most directly with:

- `README.OperatorExposurePlaneLaw.md`
- `README.OperatorPlaneContractTemplate.md`
- `README.OperatorExposurePlaneChain.md`
- `README.OperatorSupportSurfaceLaw.md`
- `README.OperatorPlaneBuildOrder.md`
- `README.StructuralSurfacePacketContract.md`
- `README.PacketWorkflowChain.md`
- `README.MechanizationClosureGate.md`

Suggested seam-local follow-ons:

- per-seam operator-plane packets
- inventory stabilization packets
- retirement/unthreading packet ladders
- shell-to-plane routing packets
- support-plane isolation packets

---

## 15. Recommended packet header template

Use the following bounded header for operator-plane packets.

---

### Operator Plane Packet

- `packet_id:`
- `packet_class:` OP-P0 / OP-P1 / OP-P2 / OP-P3 / OP-P4
- `active seam:`
- `operator:`
- `plane_class:`
- `closure_target:`
- `declared payload:`
- `active exposure/support constraint:`
- `files to modify:`
- `files to read only:`
- `explicit non-goals:`
- `forbidden substitutions:`
- `acceptance criteria:`
- `immediate fail triggers:`

---

## 16. One-line summary

**In DME, operator-plane packets are lawful only when they advance one declared seam through one bounded closure target, with explicit payload, explicit constraints, explicit forbidden substitutions, and explicit acceptance tied to the operator-plane contract.**

