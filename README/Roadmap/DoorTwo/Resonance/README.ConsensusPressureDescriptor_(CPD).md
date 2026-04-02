# Consensus Pressure Descriptor (CPD) Specification

## Status

**Status:** Draft specification
**Role:** Bounded support artifact
**Placement intent:** Door Two README subfolder
**Purpose:** Define a lawful artifact class for carrying Resonance-derived coherence and consensus-pressure observations inside DME without granting authority, settlement, or canon status.

---

## Purpose

The **Consensus Pressure Descriptor (CPD)** is a bounded DME-side artifact for recording, comparing, and reviewing **consensus-pressure signals** derived from field, geometric, harmonic, or coherence-oriented analysis.

It exists to solve a specific problem:

> DME needs a lawful place to hold “agreement pressure” observations without allowing those observations to silently become authority.

The CPD is that place.

It is intentionally:

* below canon,
* below settlement,
* below minting,
* non-self-authorizing,
* lens-bound,
* challengeable,
* reversible,
* support-oriented rather than truth-claiming.

---

## Core Definition

A **Consensus Pressure Descriptor** is a structured, non-authoritative artifact that records how strongly a candidate object, transition, or structural proposal appears to exhibit coherence, compatibility, convergence, or other agreement-pressure characteristics under a declared lens.

It does **not** say:

* the candidate is true,
* the candidate is valid,
* the candidate is promoted,
* the candidate is canonical,
* the candidate has settled.

It says only:

* under declared conditions,
* these support signals appeared,
* with this scope,
* with these limits,
* and with these challenge hooks.

---

## Why CPD Exists

Resonance introduces a compact language for how candidate structures may align, lock, amplify, stabilize, or decay.

DME cannot allow those signals to flow directly into authority.

Therefore CPD exists as a **quarantine-and-translation class**:

* **quarantine**, because the signals are held below promotion,
* **translation**, because they are re-expressed in DME-safe terms,
* **comparison**, because multiple candidate structures can be reviewed side-by-side,
* **challengeability**, because every CPD must expose contest surfaces.

In this sense, the CPD is not merely a scorecard. It is a constitutional buffer.

---

## Constitutional Posture

Every CPD inherits the following posture:

* **A CPD is not canon.**
* **A CPD is not a consensus result.**
* **A CPD is not a truth claim.**
* **A CPD is not a minting artifact.**
* **A CPD is not a substitute for challenge or promotion review.**
* **A CPD may inform review but cannot settle review.**
* **A CPD is always lens-bound and interpretation-dependent.**

If a proposed use violates any of these, the CPD is being misused.

---

## Intended Use Cases

CPDs are intended for:

1. **Probe-side analysis**
   Compare candidate structures under different field/coherence interpretations.

2. **Review-side support**
   Provide structured evidence about convergence pressure, compatibility pressure, or instability risk.

3. **Candidate packet support**
   Supply bounded descriptors that help explain why a candidate appears stable, fragile, or lens-specific.

4. **Challenge and contest**
   Reveal weak assumptions, cavity-specific fitting, conservation failures, or inflated coherence claims.

5. **Mechanization planning**
   Identify which pressure signals may later be useful for lawful runtime or post-runtime review surfaces.

6. **Translation between field ontology and structural memory governance**
   Allow Resonance-derived explanations to be carried safely inside DME.

---

## Explicit Non-Use Cases

CPDs must **not** be used for:

* automatic settlement,
* automatic promotion,
* automatic canon minting,
* ontology declaration,
* runtime override,
* hidden confidence laundering,
* UI authority amplification,
* replacing candidate packet review,
* replacing supersession logic,
* bypassing challenge workflows.

A CPD is support, not decision.

---

## Artifact Class Overview

### Artifact name

`CPD`

### Expanded name

`Consensus Pressure Descriptor`

### Scope unit

A CPD may describe any of the following:

* a candidate object,
* a proposed transition,
* a basin relationship,
* a structural recurrence pattern,
* a replay-derived support pattern,
* a comparison between two or more candidate structures.

### Position in stack

CPDs belong in the **review / interpretation / candidate-support zone**, not in substrate authority or canon.

---

## Minimal Required Fields

Every CPD must include at least the following fields.

### Identity and context

* `cpd_id`
  Unique identifier for the descriptor artifact.

* `subject_type`
  What is being described. Examples: `candidate_object`, `transition`, `basin_relation`, `support_pattern`, `comparison`.

* `subject_ref`
  Reference to the artifact, candidate, run, or support family being described.

* `created_at`
  Timestamp of CPD creation.

* `created_by`
  Operator, process, or probe family responsible for emission.

### Lens and posture

* `declared_lens`
  Explicit statement of the interpretive lens used.

* `source_family`
  Origin family of the descriptor inputs. Examples: replay, comparison, harmonic probe, basin review, candidate packet review.

* `support_posture`
  Must explicitly declare that the artifact is support-only and non-authoritative.

* `reversibility_posture`
  Statement of whether and how the descriptor can be revised, withdrawn, or invalidated.

### Core support surfaces

* `harmonic_compatibility_support`
* `phase_alignment_support`
* `basin_convergence_support`
* `interference_amplification_support`
* `symmetry_preservation_support`
* `boundary_fit_support`
* `coherence_decay_risk`

These may be numeric, categorical, or hybrid, but the scoring scheme must be declared.

### Constraints and challenge

* `inflation_risk`
  Risk that the descriptor will be overread into authority or ontology.

* `failure_modes`
  Known conditions under which the CPD loses meaning or reliability.

* `challenge_hooks`
  Specific ways the descriptor may be contested, stress-tested, or superseded.

* `promotion_blockers`
  Reasons this CPD cannot directly justify promotion.

### Narrative fields

* `why_it_matters_now`
  Why this descriptor was created at this stage.

* `present_allowed_use`
  Clear statement of what the CPD may currently be used for.

* `present_disallowed_use`
  Clear statement of what it may not be used for.

---

## Recommended Extended Fields

These are optional but strongly recommended for richer review.

* `comparative_baseline_ref`
  Reference object or family used as baseline.

* `conserved_distinctions`
  What distinctions appear preserved under the declared lens.

* `lens_sensitivity`
  How much the descriptor shifts when the lens changes.

* `scale_sensitivity`
  Whether the signal appears only at a certain timescale/window/aggregation.

* `retained_tier_dependency`
  Whether the descriptor depends on a specific replay tier or retention level.

* `support_evidence_summary`
  Short structured summary of evidence used.

* `counterevidence_summary`
  Short structured summary of tensions or contradictions.

* `cross_run_stability`
  Whether the support signal appears across multiple runs or only locally.

* `cavity_specificity`
  Whether the support appears globally or only under narrow boundary conditions.

* `operator_notes`
  Human notes preserved explicitly as notes, not authority.

---

## Scoring Posture

CPDs may contain quantitative values, but all numeric scoring must obey the following rules:

1. **No numeric field may imply settlement by itself.**
2. **Scales must be declared.** A score without an interpretation scale is invalid.
3. **Thresholds are advisory unless separately ratified.**
4. **Composite scores must remain decomposable.**
5. **Derived aggregates must not erase raw support surfaces.**
6. **Low inflation posture is preferred over pseudo-precision.**

### Preferred scoring modes

Allowed scoring styles include:

* bounded scalar `0.0 – 1.0`,
* bounded scalar `0 – 100`,
* categorical labels such as `low`, `moderate`, `high`,
* qualitative structured labels such as `stable-under-lens`, `cavity-specific`, `fragile`, `conflicted`.

### Discouraged scoring modes

* opaque aggregate scores with no decomposition,
* single “truth-like” scores,
* unbounded confidence claims,
* hidden weighting,
* scores presented as universal rather than lens-bound.

---

## Recommended Core Support Surfaces

Below are the core CPD surfaces and their intended meaning.

### 1. Harmonic Compatibility Support

Describes whether the candidate appears structurally compatible with existing support families under the declared harmonic or relational lens.

**Meaning:** fit pressure, not validity.

---

### 2. Phase Alignment Support

Describes whether the candidate appears to align in timing, phase relation, or relational coordination with surrounding structures.

**Meaning:** synchrony tendency, not settlement.

---

### 3. Basin Convergence Support

Describes whether the candidate appears to move toward stable recurrence neighborhoods rather than persistent structural dispersion.

**Meaning:** convergence tendency, not ontology.

---

### 4. Interference Amplification Support

Describes whether the candidate gains reinforcement through structural interaction or whether it tends to cancel, fragment, or diffuse.

**Meaning:** amplification pressure, not acceptance.

---

### 5. Symmetry Preservation Support

Describes whether relevant distinctions, relationships, or invariants appear preserved under the candidate’s transformation path.

**Meaning:** conserved distinction support, useful in challenge and governability review.

---

### 6. Boundary Fit Support

Describes whether the candidate appears stable only under specific boundary conditions or broadly across declared conditions.

**Meaning:** cavity-fit or condition-fit profile, not general truth.

---

### 7. Coherence Decay Risk

Describes how likely the candidate is to lose apparent support when conditions broaden, replay posture changes, or comparison families expand.

**Meaning:** fragility warning surface.

---

## Artifact Emission Rules

A CPD may be emitted only when all of the following are satisfied:

1. The subject is clearly identified.
2. The declared lens is explicit.
3. The support posture is explicitly non-authoritative.
4. At least one challenge hook is provided.
5. At least one inflation risk statement is provided.
6. Present allowed use and present disallowed use are both stated.

If these are not present, the CPD should not be minted.

---

## Artifact Review Rules

Every CPD review should ask:

* What exactly is this descriptor claiming?
* Is that claim narrower than it sounds?
* What lens is doing the work?
* What would break the claim?
* What support surfaces agree or disagree?
* Is the descriptor broad or cavity-specific?
* Is the descriptor stable across runs, scales, and replay tiers?
* Is the descriptor being overread into authority?

A CPD that cannot survive these questions should remain weak, provisional, or retireable.

---

## CPD Lifecycle

Recommended status values:

* `draft`
  Newly emitted, not yet reviewed.

* `reviewed`
  Reviewed for posture and structural clarity.

* `contested`
  Under active challenge or conflicting interpretation.

* `stabilized`
  Repeatedly useful as support under bounded conditions.

* `retired`
  No longer useful, superseded, or invalid under later findings.

* `superseded`
  Replaced by a stronger, clearer, or more lawful descriptor.

Important:

> Even a stabilized CPD is not canon.

Stability of support is not equivalent to authority.

---

## CPD and Candidate Packets

A CPD may be attached to a candidate packet as a support appendix.

When attached, it must be treated as:

* a bounded explanatory aid,
* one support family among others,
* explicitly contestable,
* insufficient by itself for activation or minting.

Candidate packet review may use CPDs to help answer:

* Does this object appear broadly coherent or narrowly fitted?
* Does it preserve distinctions or merely compress them away?
* Does it show convergent support across runs?
* What are the major inflation risks?

But a candidate packet must not say:

* “The CPD proves legitimacy.”
* “The CPD proves canon-worthiness.”
* “The CPD settles the dispute.”

---

## CPD and Canon Minting

CPDs are relevant to future canon minting only indirectly.

They may inform:

* review preparation,
* challenge structuring,
* support-family comparison,
* legitimacy discussion.

They may not act as:

* minting keys,
* direct activation criteria,
* canon substitutes,
* hidden pre-consensus settlement surfaces.

This is especially important because CPDs will often feel compelling before they are truly promotion-safe.

---

## Example Minimal CPD Skeleton

```yaml
cpd_id: CPD_0001
status: draft
subject_type: candidate_object
subject_ref: CCD_014
created_at: 2026-04-02T00:00:00Z
created_by: operator_review

declared_lens: resonant-field interpretation under bounded replay comparison
source_family: candidate_packet_support
support_posture: support_only_non_authoritative
reversibility_posture: fully revisable_and_retirable

harmonic_compatibility_support: 0.71
phase_alignment_support: 0.64
basin_convergence_support: 0.78
interference_amplification_support: 0.53
symmetry_preservation_support: 0.69
boundary_fit_support: cavity_specific_moderate
coherence_decay_risk: 0.42

inflation_risk: moderate
failure_modes:
  - broad lens expansion may reduce support
  - retention tier change may alter pattern fit
challenge_hooks:
  - compare against alternate basin family
  - re-evaluate under looser replay lens
promotion_blockers:
  - support remains cavity-specific
  - insufficient cross-run stability

why_it_matters_now: clarifies why candidate appears stable in current review family
present_allowed_use: support_appendix_for_candidate_review
present_disallowed_use: not_for_promotion_or_canon_justification
```

---

## Mechanization Guidance

Because the user intends to complete mechanization and stabilize the app surface before integrating coherence pressure, CPDs should initially be treated as **paper artifacts first**.

Recommended order:

1. define the schema,
2. stabilize interpretation language,
3. test manually on real candidate objects,
4. observe inflation and ambiguity failure modes,
5. only then consider mechanized generation or UI surfacing.

This sequencing matters.

A premature mechanized CPD emitter would likely overstate confidence, blur posture, and encourage authority leakage.

---

## UI / Surface Rules

If CPDs are ever shown in the UI, the surface must obey all of the following:

* clearly label them as support descriptors,
* show declared lens,
* show inflation risk,
* show challenge hooks,
* forbid visual styling that implies settled status,
* avoid rank-order presentations that look like truth ladders,
* preserve decomposability of support fields.

No CPD surface should look like a scorecard of “what is true.”

---

## Failure Modes

The most important CPD failure modes are:

### 1. Authority laundering

Support scores begin behaving like hidden decisions.

### 2. Ontology inflation

A candidate explanatory model begins being treated as settled reality.

### 3. Aesthetic capture

Beautiful coherence visualization is mistaken for epistemic warrant.

### 4. Compression confusion

Compact description is mistaken for strong justification.

### 5. Threshold creep

Advisory thresholds silently become settlement rules.

### 6. Lens erasure

n
Users forget the descriptor depends on declared interpretation choices.

These must be actively monitored.

---

## Recommended Companion Documents

This specification pairs naturally with:

1. **Resonance–DME Integration Boundary**
   Defines what CPD is allowed to import.

2. **Resonance Vocabulary Translation Table**
   Maps Resonance terms into DME-safe language.

3. **CPD Review Checklist**
   Practical operator guide for manual review.

4. **CPD Risk Register**
   Tracks inflation, misuse, and supersession patterns.

---

## One-Sentence Rule

> A CPD is a declared, challengeable, non-authoritative descriptor of structural agreement pressure under a bounded lens, and may inform review without ever settling review by itself.

---

## Closing

The CPD is intentionally modest.

That modesty is its strength.

It gives DME a lawful way to begin working with coherence pressure, field interpretation, and consensus-adjacent structure **before** those ideas are mature enough to touch authority.

That is exactly the right posture for this phase.
