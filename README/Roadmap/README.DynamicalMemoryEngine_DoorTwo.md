# Dynamical Memory Engine — Door Two Canon Schema (Suggestive Draft)

## Status

This document is a **suggestive draft** for Door Two canon schema design.

It is a forward-design note.

It is **not yet authoritative**.

It does **not** override:

* `README_MasterConstitution.md`
* `README_ConstitutionAppendix.md`
* `README_WorkflowContract.md`
* `README_DevelopmentPressure.md`
* `README_DoorOneAcceptanceChecklist.md`
* `README_DoorThreeLanguageTranslationAndSymbolicInterface.md`

Its purpose is narrower:

* sketch what a future `C1` canonical object may need to contain,
* clarify the difference between runtime recurrence and trusted canon,
* define a clean Door Two seam for prediction,
* expose future attachment points for symbolic and language layers,
* support Door One completion by reducing future schema ambiguity.

---

## 1. Constitutional posture

Door Two is the activation of:

* Canon Space
* Prediction Space

Door One remains below canon.

Therefore, any future canon schema must preserve the inherited rules:

* runtime is not canon,
* query is not truth,
* substrate is not ontology,
* consensus is promotion-only,
* symbolic and language layers remain downstream.

This draft assumes that a canonical object is a **promoted trusted memory object**, not:

* a runtime artifact,
* a HUD summary,
* a review convenience packet,
* a symbolic label,
* a language output.

---

## 2. Why this note exists

Once Door One stabilization is complete, the project will need a cleaner answer to:

**What exactly becomes canonical, in what form, and with what legitimacy surface?**

Without a schema note, Door Two pressure can become vague.

That vagueness can create drift such as:

* treating recurrence as canon,
* treating review posture as settlement,
* treating labels as truth,
* treating prediction inputs as if canon were already stable.

A schema draft helps by separating:

* what is observed,
* what is reviewed,
* what is promoted,
* what becomes predictive input,
* what later symbolic/language layers may attach to.

---

## 3. Core principle

**Canon is trusted promoted structure, not merely repeated structure.**

A future `C1` object should represent a memory that has crossed a legitimacy threshold and is stable enough to function as trusted system reference.

That means a canonical object should be:

* evidence-backed,
* promotion-bounded,
* provenance-preserving,
* revision-capable,
* prediction-usable,
* distinct from runtime and review surfaces.

---

## 4. What canon is for

Door Two canon should answer questions like:

* What structural pattern is trusted enough to stabilize as system memory?
* What class of event or regime has been promoted beyond runtime recurrence?
* What reference objects may future prediction operate over?
* What settled memory should later symbolic or language layers point at?

Canon should **not** answer:

* What looks similar right now?
* What was convenient to summarize?
* What label feels intuitive?
* What should language call this before it is structurally settled?

---

## 5. Recommended canon object posture

A future `C1` object should be treated as:

* a promoted object,
* a stable reference object,
* a truth-bearing object within system scope,
* a prediction anchor,
* a future symbolic attachment target.

A `C1` object should **not** be treated as:

* immutable forever,
* unchallengeable,
* equivalent to ontology,
* equivalent to a word or phrase,
* equivalent to a raw source artifact.

---

## 6. Proposed schema shape

A suggestive minimal future `C1` object might contain the following top-level sections:

```json
{
  "artifact_type": "CanonicalState",
  "artifact_class": "C1",
  "canonical_id": "C1_0001",
  "canonical_version": 1,
  "canonical_status": "active",
  "structural_identity": {},
  "promotion_record": {},
  "evidence_basis": {},
  "prediction_handles": {},
  "revision_policy": {},
  "provenance": {},
  "external_bindings": {},
  "meta": {}
}
```

This is only a posture sketch.
It is not yet a finalized contract.

---

## 7. Top-level field suggestions

### A. `artifact_type`

Suggested value:

* `CanonicalState`

Purpose:

* human-readable artifact kind

### B. `artifact_class`

Suggested value:

* `C1`

Purpose:

* preserve the class distinction between canon and other artifact classes

### C. `canonical_id`

Examples:

* `C1_0001`
* `C1_regime_0042`

Purpose:

* stable system reference identity for the promoted object

### D. `canonical_version`

Examples:

* `1`
* `2`

Purpose:

* preserve revision lineage without overwriting prior canonical meaning silently

### E. `canonical_status`

Suggested values:

* `active`
* `superseded`
* `deprecated`
* `contested`
* `withdrawn`

Purpose:

* allow canon to remain governable rather than frozen

---

## 8. `structural_identity` suggestions

This section should describe **what the canon object structurally is**.

Possible contents:

* promoted pattern family
* stable transition archetype
* recurrence class
* return class
* divergence class
* lens-robust structure type
* runtime-origin structural summary

Example posture:

```json
{
  "type": "stable_returning_regime",
  "origin_family": "runtime_candidate_family_07",
  "defining_features": {
    "recurrence_profile": "high",
    "continuity_profile": "stable",
    "transition_signature": "baseline_perturb_return"
  },
  "lens_scope": {
    "declared_scales": ["short", "medium"],
    "transform_family": ["fft"],
    "lens_robust": true
  }
}
```

Important rule:
This section should remain structural first, not linguistic first.

---

## 9. `promotion_record` suggestions

This section should describe **how the object became canon**.

Possible contents:

* promotion time
* promotion policy id
* consensus or legitimacy decision id
* reviewer / process scope
* admission criteria met
* open caveats at promotion time

Example posture:

```json
{
  "promoted_at": "2026-03-22T20:00:00Z",
  "promotion_policy_id": "consensus.door2.v1",
  "promotion_mode": "explicit",
  "decision_posture": "accepted",
  "criteria_met": [
    "cross_run_recurrence",
    "retention_honesty",
    "lens_robustness"
  ],
  "caveats": []
}
```

This is important because canon should be auditable as a promotion event, not only as a settled object.

---

## 10. `evidence_basis` suggestions

This section should describe **what evidence supports the canon object**.

Possible contents:

* supporting runtime candidates
* supporting receipts or receipt ranges
* cross-run evidence summary
* lens comparison summary
* transform comparison summary
* ambiguity notes
* retained justification for legitimacy

Example posture:

```json
{
  "supporting_runtime_candidates": ["candidate_07", "candidate_12"],
  "receipt_refs": ["receipt_cycle_04", "receipt_cycle_09"],
  "cross_run_support": {
    "run_count": 9,
    "recurrence_strength": "high"
  },
  "ambiguity_notes": [],
  "review_summary": "stable across declared lens family"
}
```

This section should make canon inspectable without collapsing canon back into raw runtime.

---

## 11. `prediction_handles` suggestions

This is the main Door Two bridge forward.

Purpose:

* expose how canon can be used by prediction without forcing symbolic or language layers into scope yet

Possible contents:

* likely successor classes
* expected transitions
* dwell expectations
* divergence triggers
* confidence bounds
* prediction-scope constraints

Example posture:

```json
{
  "expected_successors": ["C1_0002", "C1_0005"],
  "expected_predecessors": ["C1_0000"],
  "transition_confidence": {
    "C1_0002": 0.82,
    "C1_0005": 0.31
  },
  "divergence_conditions": [
    "continuity_break",
    "new_transition_cluster"
  ],
  "prediction_scope": "bounded_declared_lens_only"
}
```

This should remain non-linguistic and non-agentic in early Door Two.

---

## 12. `revision_policy` suggestions

Canon should not be treated as permanently infallible.

Possible contents:

* revision eligibility
* supersession rule
* contradiction handling
* challenge conditions
* deprecation rule

Example posture:

```json
{
  "may_be_revised": true,
  "supersession_rule": "explicit_promotion_only",
  "challenge_conditions": [
    "lens_breakdown",
    "retention_inconsistency",
    "contradictory_prediction_failure"
  ]
}
```

This helps keep canon strong without making it brittle.

---

## 13. `provenance` suggestions

Canon should preserve its own provenance posture.

Possible contents:

* operator / promotion process identity
* policy refs
* upstream evidence lineage refs
* canon-generation context

Example posture:

```json
{
  "promotion_operator": "ConsensusOp",
  "promotion_operator_version": "0.1.0",
  "policy_refs": [
    "consensus.door2.v1",
    "prediction.door2.v1"
  ],
  "input_refs": [
    "candidate_07",
    "candidate_12"
  ]
}
```

This should preserve legitimacy without pretending canon came from nowhere.

---

## 14. `external_bindings` suggestions

This section is especially important for future Door Three work.

The key rule is:

**bindings are attachment points, not canon-makers.**

Possible contents:

* symbolic tokens
* human labels
* language handles
* external aliases
* query aliases

Example posture:

```json
{
  "symbolic_bindings": [],
  "language_handles": [],
  "external_labels": [],
  "query_aliases": []
}
```

In early Door Two, these may remain empty.
That is fine.

---

## 15. `meta` suggestions

This is the lowest-priority section.

Possible contents:

* freeform notes
* migration info
* implementation comments
* non-authoritative convenience fields

This section should not carry legitimacy-critical meaning.

---

## 16. Suggested minimal canon example

```json
{
  "artifact_type": "CanonicalState",
  "artifact_class": "C1",
  "canonical_id": "C1_0001",
  "canonical_version": 1,
  "canonical_status": "active",
  "structural_identity": {
    "type": "stable_returning_regime",
    "origin_family": "runtime_candidate_family_07",
    "defining_features": {
      "recurrence_profile": "high",
      "transition_signature": "baseline_perturb_return"
    },
    "lens_scope": {
      "declared_scales": ["short", "medium"],
      "transform_family": ["fft"],
      "lens_robust": true
    }
  },
  "promotion_record": {
    "promotion_policy_id": "consensus.door2.v1",
    "promotion_mode": "explicit",
    "decision_posture": "accepted",
    "criteria_met": [
      "cross_run_recurrence",
      "retention_honesty",
      "lens_robustness"
    ]
  },
  "evidence_basis": {
    "supporting_runtime_candidates": ["candidate_07", "candidate_12"],
    "receipt_refs": ["receipt_cycle_04", "receipt_cycle_09"],
    "cross_run_support": {
      "run_count": 9,
      "recurrence_strength": "high"
    },
    "ambiguity_notes": []
  },
  "prediction_handles": {
    "expected_successors": ["C1_0002"],
    "transition_confidence": {
      "C1_0002": 0.82
    },
    "prediction_scope": "bounded_declared_lens_only"
  },
  "revision_policy": {
    "may_be_revised": true,
    "supersession_rule": "explicit_promotion_only"
  },
  "provenance": {
    "promotion_operator": "ConsensusOp",
    "policy_refs": ["consensus.door2.v1"],
    "input_refs": ["candidate_07", "candidate_12"]
  },
  "external_bindings": {
    "symbolic_bindings": [],
    "language_handles": [],
    "external_labels": [],
    "query_aliases": []
  },
  "meta": {}
}
```

---

## 17. Suggested promotion input posture

The canon gate should likely consume something like:

* runtime candidate packet,
* review packet,
* cross-run support,
* retention / replay legitimacy check,
* lens / transform robustness summary,
* explicit policy context.

This means Door Two should probably promote from a **pre-canon candidate packet**, not directly from arbitrary runtime artifacts.

That can help preserve the distinction between:

* observation,
* review,
* settlement.

---

## 18. Suggested non-goals for the first canon schema

The first canon schema should **not** try to solve all future needs at once.

It should not yet attempt to encode:

* full symbolic meaning,
* rich natural language outputs,
* agentic decision policy,
* ontology-level commitments,
* universal semantic graphing.

It should remain focused on:

* trusted promoted structure,
* prediction readiness,
* revision legality,
* future attachment points.

---

## 19. Product relevance note

A clean canon schema matters for product direction because it is the first layer where the system can offer:

* trusted persistent memory,
* explainable identity continuity,
* stable multi-run reference objects,
* prediction over grounded memory,
* future shared memory for AI systems or agents.

This is likely the first layer where the system begins to look like a meaningful memory-native product substrate rather than only an instrument.

Language and symbolic surfaces can later make this accessible, but the actual product integrity begins here.

---

## 20. Recommended near-term posture

For now:

* keep this schema suggestive,
* do not let it pull Door Two prematurely into active implementation,
* use it to reduce future ambiguity,
* return to Door One completion,
* revisit after the Door One capstone, multi-scale passes, and transform comparisons are complete.

That keeps the project moving in the correct order while still giving future design a cleaner target.

---

## 21. One-sentence summary

Door Two canon should be designed as a promoted, evidence-backed, prediction-usable structural memory object with clean future attachment points for symbolic and language layers, while remaining clearly distinct from runtime recurrence, review packaging, and later user-facing translation.
