# Dynamical Memory Engine - Operator Plane Contract Template

## Status

This document defines the reusable bounded contract template for DME operator exposure planes.

It is a supporting instrumentation, workflow, and structural-governance note.

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
- `README.ObservabilityAndFeedbackTaxonomy.md`
- `README.BoundaryTaxonomy.md`
- `README.ConstraintTaxonomy.md`
- `README.CompressionTaxonomy.md`
- `README.SemanticOverlayContract.v0.md`

Its purpose is narrower:

- define one repeatable contract shape for operator-plane design,
- force explicit declaration of emitted output, support/derived output, axes, units, exposure form, and failure posture,
- make operator-plane implementation auditable,
- reduce implementation drift,
- and give DME one stable seam-local specification object for building an inspectable evidentiary chain.

This note governs **operator-plane contract posture** only.

It does **not** govern:

- runtime artifact meaning by itself,
- canon activation,
- semantic overlay by itself,
- full app composition by itself,
- or final product polish.

---

## 1. Why this note exists

`README.OperatorExposurePlaneLaw.md` defines what an operator exposure plane is and what it must preserve.

What has still been missing is one practical instrument contract that can be reused across the operator chain.

Without a standard contract shape, several drift risks become active:

- different seams being specified under different implicit standards,
- helpers substituting charts, labels, or summaries for primary emitted output,
- support and primary exposure being mixed inconsistently,
- acceptance becoming subjective,
- and later audits having to reverse-engineer what a plane was supposed to expose.

This note exists to prevent that drift.

One-line summary:

**Every operator plane should be specifiable through one repeatable contract before implementation begins.**

---

## 2. Core rule

**No operator plane should be built, accepted, or called accurate until its seam-local contract explicitly declares what is being exposed, on what axes, in what units, in what form, with what support layers, and under what null/failure posture.**

Corollary rules:

- a chart is not a contract,
- a route is not a contract,
- a screenshot is not a contract,
- a human intuition about "what it should show" is not a contract,
- and a cleaner UI does not excuse missing plane specification.

If any essential contract field is missing, the plane should remain:

- declared,
- drafted,
- displayed,
- partially mechanized,
- or unresolved,

whichever is most honest.

One-line summary:

**If the seam contract is not explicit, the plane is not yet accurate enough to trust for inspection.**

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
- semantic overlay must remain downstream and removable,
- operator planes must expose first-order output before support, semantic, or review layers.

Accordingly, an operator-plane contract in this note means:

- a bounded seam-local specification object,
- not truth by itself,
- not mechanization proof by itself,
- not a product-surface manifesto,
- not a semantic design brief,
- and not permission to overbuild a plane before the seam is understood.

This note remains below canon.

---

## 4. Definition of an operator-plane contract

In DME, an **operator-plane contract** means:

> a bounded seam-local specification that declares the primary emitted output, support/derived output, axes, units, exposure form, null/failure posture, forbidden substitutions, and acceptance conditions for an operator exposure plane strongly enough that the plane can be built, reviewed, and audited without symbolic or semantic drift.

This means an operator-plane contract is always:

- seam-relative,
- output-relative,
- axis-relative,
- representation-relative,
- constraint-relative,
- and mechanization-relative where a real execution path matters.

An operator-plane contract is **not** guaranteed merely because:

- someone says the plane is obvious,
- a prior similar plane exists,
- a chart library is available,
- or a helper produces something that "looks right."

One-line distinction:

**The contract defines what the plane must expose before the plane exists.**

---

## 5. Operator-plane contract functions

Every operator-plane contract exists to serve five functions.

### 5.1 Seam function

It ties the plane to one specific operator seam.

### 5.2 Exposure function

It defines what the seam actually emits as first-order output.

### 5.3 Axis function

It defines how that output lives in inspectable coordinates, tables, or field structure.

### 5.4 Boundary function

It defines what the plane may not be replaced by.

### 5.5 Acceptance function

It defines what must be true before the plane can be accepted as lawful and accurate.

One-line summary:

**A plane contract binds seam, exposure, axes, boundaries, and acceptance in one place.**

---

## 6. Required contract fields

Every operator-plane contract should declare the following fields explicitly.

---

### 6.1 Contract identity block

Required:

- `contract_id`
- `seam_id`
- `plane_name`
- `plane_class`
- `status`

Recommended status values:

- `declared`
- `drafted`
- `displayed`
- `partially_mechanized`
- `mechanized`

Purpose:

This block prevents anonymous or ambiguous plane work.

---

### 6.2 Seam definition block

Required:

- active seam
- operator class / operator name
- why this seam is the correct lowest lawful exposure seam
- upstream seam(s)
- downstream seam(s)

Purpose:

This block keeps the plane tied to the operator chain rather than floating as a generic visualization.

---

### 6.3 Constraint block

Required:

- active exposure constraint
- explicit non-constraints
- relevant declared boundary/representation constraints if any

Purpose:

This block keeps the plane anchored to seam-local emitted output rather than silently widening into support, semantic, or review behavior.

Examples:

- lawful: "ordered samples emitted at ingest under the active source window"
- lawful: "aligned timestamp/frame offsets emitted by clock alignment"
- unlawful: "what is the signal doing?"

---

### 6.4 Primary emitted output block

Required:

- primary emitted output
- output type
- output description
- output shape: scalar / tabular / vector / field / graph / mixed

Purpose:

This block defines what P0 actually is.

Examples:

- ordered samples
- aligned timestamps
- frame boundaries
- transform magnitudes
- anomaly field
- merge mapping

---

### 6.5 Primary axes and units block

Required:

- axis 1 name
- axis 1 units
- axis 2 name if applicable
- axis 2 units if applicable
- value field name
- value field units
- coordinate conventions if applicable

Purpose:

This block makes the plane instrument-like rather than aesthetic.

Examples:

- sample index
- aligned time (ms)
- frame index
- frequency bin
- frequency in Hz
- normalized magnitude
- delta samples
- structural loss percent

---

### 6.6 Support / derived output block

Required if support exists:

- support outputs
- support output type
- why these are support and not primary exposure
- whether they belong in:
  - external numeric sidecar
  - separate support plane
  - later derived plane
  - nowhere yet

Purpose:

This block prevents support from silently replacing primary exposure.

Examples:

- min/max/rms
- alignment mean delta
- jitter statistics
- source/run ids
- threshold values
- counts
- structural loss metrics

---

### 6.7 Support axes and units block

Required if support exists:

- support field names
- support field units
- whether support is tabular / scalar / geometric

Purpose:

This keeps support numeric and inspectable rather than prose-first.

---

### 6.8 Most direct form block

Required:

- most direct exposure form
- why that form is the most direct exposure of the primary emitted output
- what information would be lost by skipping it

Purpose:

This block prevents legibility from outrunning seam exposure.

Examples:

- sample table
- raw bin matrix
- alignment delta table
- pre/post comparison table

---

### 6.9 More legible alternate forms block

Optional but recommended:

- alternate form(s)
- what makes them more legible
- what they risk flattening
- whether the most direct form must remain separately accessible

Purpose:

This block allows human usability without losing rigor.

Examples:

- sample trace over time
- transform heatmap
- line profile
- adjacency graph

---

### 6.10 Forbidden substitutions block

Required:

- what may not replace the primary emitted output
- what may not appear inside the primary plane
- what stronger layer must remain out of scope

Purpose:

This is the anti-drift block.

Examples:

- counts
- semantic labels
- review posture
- support/accounting summaries
- prose explanations
- mixed dashboards
- legends that replace inspectable axes

---

### 6.11 Null / failure posture block

Required:

- lawful null state
- lawful failure state
- what may appear outside the plane
- what is forbidden as fallback

Purpose:

This prevents blank-state panic from turning into semantic contamination.

Examples:
- blank plane
- empty table
- neutral grid shell
- failure metrics outside plane
- no prose-heavy filler

---

### 6.12 Mechanization block

Required:

- backend output exists? yes/no
- real execution path exists? yes/no
- plane fed by real payload? yes/no
- export path exists? yes/no
- current closure status

Purpose:

This block aligns the plane contract with Declared vs Mechanized Audit and the Mechanization Closure Gate.

---

### 6.13 Acceptance criteria block

Required:

- what must be visibly true
- what must be numerically true
- what tests should pass
- what screenshots/manual checks are required
- what immediately fails acceptance

Purpose:

This block makes implementation review objective.

---

## 7. Preferred contract output shape

Every seam-local plane contract should ideally be specifiable in the following order:

1. identity
2. seam
3. constraints
4. primary emitted output
5. primary axes and units
6. support / derived outputs
7. support axes and units
8. most direct form
9. more legible alternate forms
10. forbidden substitutions
11. null/failure posture
12. mechanization posture
13. acceptance criteria

This order should remain stable where practical.

---

## 8. Recommended contract template

Use the following shape for each operator seam.

---

### Operator Plane Contract

#### 1. Contract identity
- `contract_id:`
- `seam_id:`
- `plane_name:`
- `plane_class:` P0 / P1 / P2 / other
- `status:` declared / drafted / displayed / partially_mechanized / mechanized

#### 2. Seam definition
- active seam:
- operator:
- why this seam is the correct lowest lawful exposure seam:
- upstream seam(s):
- downstream seam(s):

#### 3. Constraints
- active exposure constraint:
- explicit non-constraints:
- relevant declared boundary/representation constraints if any:

#### 4. Primary emitted output
- primary emitted output:
- output type:
- output description:
- output shape: scalar / tabular / vector / field / graph / mixed

#### 5. Primary axes and units
- axis 1:
- axis 1 units:
- axis 2:
- axis 2 units:
- value field:
- value units:
- coordinate conventions if relevant:

#### 6. Support / derived outputs
- support outputs:
- support type:
- why these are support and not primary:
- placement: external numeric sidecar / support plane / derived plane / none

#### 7. Support axes and units
- support field 1:
- support field 1 units:
- support field 2:
- support field 2 units:
- support representation type:

#### 8. Most direct exposure form
- direct form:
- why this is the most direct exposure:
- what would be lost if skipped:

#### 9. More legible alternate forms
- alternate form 1:
- why more legible:
- risk introduced:
- must the direct form remain separately accessible? yes/no

#### 10. Forbidden substitutions
- forbidden substitutes for primary output:
- forbidden content inside primary plane:
- out-of-scope stronger layers:

#### 11. Null / failure posture
- lawful null posture:
- lawful failure posture:
- what may appear outside the plane:
- forbidden fallback behavior:

#### 12. Mechanization posture
- backend output exists:
- real execution path exists:
- plane fed by real payload:
- export path exists:
- current closure status:

#### 13. Acceptance criteria
- visible acceptance criteria:
- numeric acceptance criteria:
- tests required:
- manual inspection required:
- immediate fail triggers:

---

## 9. Directness vs legibility rule

Every plane contract must explicitly distinguish:

- what is **most direct**
- what is **more legible**

A legible form is lawful only if it remains accountable to the direct form.

If the legible form becomes the only accessible form and hides distinctions required for inspectability, the plane should be treated as drift-prone or partially distorted.

One-line summary:

**Every operator plane should know what it is showing most directly before it decides how to be easier to read.**

---

## 10. Support rule

Support outputs are allowed and important.

But they must remain explicit as support outputs.

Support may be:
- numerical
- tabular
- derived
- accounting-adjacent
- threshold-related
- lineage-related

Support is not:
- semantic verdict
- identity verdict
- review closure
- readiness posture
- narrative substitute for raw output

If support becomes the primary thing the operator uses to understand the seam, the plane contract has likely been violated.

---

## 11. Primary-plane austerity rule

For primary exposure planes, the default DME posture should be austere.

Prefer:

- raw tables
- raw traces
- raw fields
- minimal numeric labels
- explicit axes
- explicit units
- blank/null honesty

Avoid by default:

- semantic posture text
- explanatory prose
- legends replacing inspectable scales
- mixed dashboards
- multi-layer UI density
- "helpful" summaries inside the plane

This rule exists to preserve inspectability and reduce symbolic gravity.

---

## 12. Mechanization rule

A plane contract is not itself mechanization.

A plane may be called mechanized only when:

1. the seam's real output exists,
2. the output is reachable through a real execution path,
3. the plane renders real payload fields,
4. null/failure posture remains honest,
5. support/derived layers do not silently substitute for primary exposure,
6. and no stronger semantic or review claim is implied than the payload supports.

If any of these fail, the plane should remain:
- declared,
- displayed,
- or partially mechanized,

whichever is most honest.

---

## 13. Failure conditions

A contract should be considered failed or violated when:

- primary emitted output is not explicitly declared,
- axes/units are absent,
- support is presented as primary output,
- the most direct form is undefined,
- forbidden substitutions appear,
- null/failure posture is undefined,
- acceptance criteria are missing,
- or helpers implement a more legible chart without preserving seam-local direct exposure.

---

## 14. Relationship to adjacent notes

This note pairs most directly with:

- `README.OperatorExposurePlaneLaw.md`
- `README.StructuralExposureLaw.md`
- `README.StructuralExposureFailureModes.md`
- `README.SymbolicGravityTaxonomy.md`
- `README.StructuralSurfacePacketContract.md`
- `README.ObservabilityAndFeedbackTaxonomy.md`
- `README.BoundaryTaxonomy.md`
- `README.ConstraintTaxonomy.md`
- `README.CompressionTaxonomy.md`

Suggested companion notes:

- `README.OperatorExposurePlaneChain.md`
- `README.OperatorSupportSurfaceLaw.md`
- `README.OperatorPlaneBuildOrder.md`
- `README.OperatorPlanePacketContract.md`

Suggested seam-local follow-ons:

- `README.OperatorPlane.Ingest.md`
- `README.OperatorPlane.ClockAlign.md`
- `README.OperatorPlane.Window.md`
- `README.OperatorPlane.Transform.md`

---

## 15. One-line summary

**In DME, every operator exposure plane should be governed by an explicit seam-local contract that declares what is exposed, on what axes, in what units, in what form, with what support layers, and under what acceptance conditions before implementation is accepted as accurate and inspectable.**

