# README.DeterministicInvarianceThreshold.md

# Dynamical Memory Engine — Deterministic Invariance Threshold

## Status

This note defines the threshold posture for deterministic invariance across retention, compression, replay, reconstruction, and query in DME.

It is a supporting implementation-governance note.

It does **not** override:

- `README_MasterConstitution.md`
- `README_ConstitutionAppendix.md`
- `README_WorkflowContract.md`
- `README_DoorOneRuntimeBoundary.md`
- `README_DoorOneInspectionSurfacePosture.md`
- `README_ContinuousIngestRetentionLadder.md`
- `README.DistortionAuditProtocol.md`
- `README.DeclaredVsMechanizedAudit.md`

Its purpose is narrower:

- define when deterministic identity is still being conserved,
- define when a retained/reconstructed object has crossed a threshold and should no longer be treated as “the same” bounded identity,
- define how replay, retention, reconstruction, and query should behave when deterministic invariance weakens or fails,
- define a small vocabulary for lawful downgrade posture,
- provide a compact rule surface for future reconstruction-fidelity and retention-honesty work.

This note is not a canon policy.
It is not an ontology note.
It is not a permission slip for symbolic reinterpretation.

It is a bounded continuity and threshold note.

---

## 1. Why this note exists

DME now has enough runtime, retention, replay, request, and inspection structure that one important danger has become visible:

**declared or displayed continuity can outrun actual conserved deterministic identity.**

Examples of this danger include:

- replay-shaped objects being mistaken for true reconstruction,
- retained tiers being treated as if they preserve more than they actually do,
- query surfaces being treated as if similarity or retrieval preserves the same bounded identity question,
- compressed or preserved objects being treated as “the same thing” when the conditions that made them the same have materially degraded.

This note exists to prevent that drift.

---

## 2. Core rule

**Deterministic invariance is conserved only while the declared lens, retained tier, compression path, and reconstruction posture preserve enough structure to answer the same bounded replay, lineage, or comparison question without inventing support or collapsing materially distinct realities.**

**Conversely:**

When the declared question can no longer be answered honestly under the active lens / tier / compression posture, the system must not silently preserve identity language. It must narrow scope, downgrade the claim, emit unresolved posture, or admit a new identity/dynamic class.

**One-line summary:**

Deterministic invariance in DME is conserved only while a retained or reconstructed surface can still answer the same bounded replay, provenance, or identity question under the declared lens and retained tier without invented support or authority inflation; when that threshold fails, the system must narrow, downgrade, or rename the resulting object rather than silently pretending continuity remains intact.

---

## 3. Constitutional posture

This note operates under the already active rules:

- runtime is not canon,
- query is not truth,
- substrate is not ontology,
- replay is lens-bound,
- consensus is promotion-only,
- retention duration does not uplift authority,
- preservation class is not authority class.

Accordingly, deterministic invariance in this note means:

- bounded identity continuity under declared constraints,
- not absolute metaphysical sameness,
- not truth,
- not canon,
- not ontology,
- not silent semantic persistence.

This note remains below canon.

---

## 4. Fractal-local principle

The lower DME pipeline already works by lawful deterministic transformation:

measurement → structure → runtime memory → recognition

Retention and reconstruction introduce a higher-order mirror of that same problem:

- preserve,
- compress,
- compare,
- reconstruct,
- audit continuity,
- detect divergence,
- decide whether the same bounded identity still survives.

This note therefore allows a **fractal-local continuity posture**:

- not a blind rerun of the whole lower pipeline at every tier,
- not silent operator reversal,
- but a bounded continuity audit at each retained or reconstructed layer.

The governing rule is:

**reconstruction must itself obey the same local deterministic principle that the original runtime obeyed, within the declared lens and retained-tier boundary.**

This means reconstruction should:

- remain local-first,
- remain tier-honest,
- avoid inventing support,
- declare its scale/latency/fidelity posture,
- and remain explicit about what it cannot yet justify.

---

## 5. What deterministic invariance means here

In DME, deterministic invariance does **not** mean:

- perfect byte-for-byte persistence forever,
- raw source restoration at every tier,
- immunity to compression,
- or universal identity across all lenses.

Instead, it means:

- the same bounded question is still answerable,
- the same declared lens is still the active interpretive boundary,
- the retained tier still supports the declared replay or lineage claim,
- support has not been invented,
- and the compression / preservation step has not collapsed distinctions strongly enough to mislead later interpretation.

---

## 6. The bounded question rule

Deterministic invariance can only be evaluated relative to a **bounded question**.

Examples:

- Can this retained surface still support provenance reconstruction for this run?
- Can this replay trace still support same-family comparison under the declared lens?
- Can this preserved packet still justify the bounded review claim it carries?
- Can this retained structure still support the declared anomaly / continuity / recurrence comparison?
- Can this query still preserve the same structural identity question without drifting into broad similarity claims?

Without a bounded question, deterministic invariance is too vague to audit honestly.

---

## 7. Five threshold tests

## 7.1 Local invariance test

Question:

**Does the current representation still preserve the same bounded identity under the same declared lens and same retained-tier posture?**

If yes:
- local deterministic invariance is still conserved.

If no:
- the system must not silently continue calling the object “the same” under the old posture.

This is the first and smallest threshold test.

---

## 7.2 Compression survival test

Question:

**After compression, pruning, preservation, or replay preparation, do the required invariants still survive?**

At minimum, the following should remain recoverable where relevant:

- `source_id`
- `stream_id`
- channel / modality identity
- bounded time range
- run / session / cycle lineage
- receipt references or other recoverable lineage support
- declared replay lens context
- derived-vs-durable posture
- retained-tier posture

If these survive and the declared question remains answerable:
- invariance may still be considered conserved.

If these do not survive:
- the system must explicitly downgrade what it claims the surface can still support.

---

## 7.3 Distortion threshold test

Question:

**Has the current layer or retained surface collapsed distinct structural realities strongly enough that downstream interpretation becomes misleading?**

This is the point where compression or summarization becomes structurally dangerous.

Examples:
- multiple lawful transition realities collapse into one summary story,
- replay support is displayed as if it were stronger than the retained evidence justifies,
- query begins returning similarity without preserving deterministic lineage,
- digest or packet convenience begins to overwrite receipt-grounded distinctions.

If this occurs:
- deterministic invariance is no longer being honestly conserved at that layer.

The remedy is not necessarily to rebuild everything.
The remedy may be:
- unresolved posture,
- a narrower scope,
- a richer derived seam,
- a summary refinement,
- or a new identity/dynamic class.

---

## 7.4 Retained-tier sufficiency test

Question:

**Does the active retained tier still support the replay, lineage, or review question being asked?**

Each retained tier must be judged only by what it can still lawfully replay.

If the tier still supports the declared question:
- deterministic invariance may still be conserved at that tier.

If the tier does not:
- the object should not silently retain the same replay / continuity claim.

This means a higher preserved tier is not automatically “the same thing, only smaller.”
It may instead be:
- a replay-honest lineage support surface,
- a derived continuity convenience surface,
- a preservation-only packet,
- or an unresolved historical remnant.

Retention honesty outranks continuity convenience.

---

## 7.5 Query equivalence test

Question:

**Does the query or comparison path still preserve deterministic structure under a declared lens, or has it drifted into broad similarity judgment?**

This matters because query usefulness can feel like continuity even when it is no longer preserving the same lawful comparison question.

If the query path remains:
- declared-lens bound,
- lineage-accountable,
- and honest about its retained support,

then invariance may still be conserved for the narrow question being asked.

If query begins relying on underdeclared similarity, weak analogy, or hidden comparison drift:
- it has crossed from conserved deterministic identity into a different class of dynamic support and must be labeled accordingly.

Door One query remains current-run scoped and below truth; any broader structural query must pass these tests or be labeled as a new dynamic.

---

## 8. Deterministic invariance depth

A useful higher-order property for DME is:

**deterministic invariance depth**

### Definition

Deterministic invariance depth is the maximum number of declared retention / reconstruction / replay transitions an artifact lineage can survive while still answering the same bounded replay, provenance, or identity question without invented support or authority inflation.

This is not merely “how many times it can be compressed.”

It is:

- question-relative,
- lens-relative,
- retention-relative,
- replay-honesty-relative.

A deeper invariance depth indicates that the artifact lineage remains structurally usable through more preservation and reconstruction steps without silently ceasing to be the same bounded object of inquiry.

---

## 9. Reconstruction classes

Not all replay/reconstruction should be treated as the same thing.

This note distinguishes three classes.

## 9.1 Support-trace reconstruction

Definition:
Reconstructing support lineage from retained evidence and declared lens/tier context.

This includes:
- replay request resolution,
- lineage binding,
- support-basis reassembly,
- retained-tier declaration,
- reconstruction trace emission,
- latency / fidelity posture declaration at the active local scale.

This is the first required reconstruction class.

It does **not** imply:
- raw source restoration,
- full operator reversal,
- or source-equivalent replay.

---

## 9.2 Derived structural reminting

Definition:
Reconstituting a new derived inspection/support object from retained structural lineage under declared rules.

Examples:
- receipt-backed support replay artifact
- packet-backed re-presented support object
- declared-lens reminting of a bounded inspection surface

This is a later class than support-trace reconstruction.

It must remain honest about derivation.

---

## 9.3 Source-adjacent reconstitution

Definition:
Attempting to reconstruct something closer to source-adjacent structure from retained lower-tier evidence.

This is the most dangerous class.

It should remain heavily fenced.
It must never be implied by default.
It requires explicit declared limits and explicit non-claims about source equivalence.

For current DME, this class is deferred.

---

## 10. What counts as invariance failure

Deterministic invariance should be treated as failed or materially degraded when one or more of the following are true:

- support must be invented,
- the declared replay question has silently changed,
- the retained tier cannot support the declared claim,
- distinct structural realities have been collapsed into one convenient output,
- query has crossed into underdeclared similarity judgment,
- reconstruction would require authority inflation,
- the old identity language can only be preserved by semantic overreach.

Failure here does not necessarily mean the whole system failed.

It means:
the same bounded identity should no longer be claimed under the previous posture.

---

## 11. Lawful outputs when invariance weakens or fails

When deterministic invariance is no longer strong enough, preferred outputs include:

- `unresolved`
- `narrowed_scope`
- `support_degraded`
- `retained_tier_insufficient`
- `reconstruction_not_justified`
- `new_identity_required`
- `multiple_local_readings`
- `insufficient_support`

These outputs are not weakness.
They are structural honesty.

---

## 12. What the system must do instead of silently preserving sameness

When the threshold is crossed, DME should prefer one or more of the following:

### A. Narrow scope
Reduce:
- family scope
- lens scope
- temporal scope
- allowed use

### B. Downgrade the replay or support claim
Say explicitly that:
- support remains,
- but high-fidelity reconstruction is no longer justified

### C. Emit unresolved posture
Keep ambiguity visible instead of forcing a neat identity continuation.

### D. Admit a new identity or dynamic class
If the original bounded identity no longer survives, the system may need to treat the new object as:
- a new support class,
- a new continuity class,
- a new reconstruction class,
- or a new retained-tier object class.

### E. Request stronger retention
If the retained tier is too weak, the right move may be:
- preserve more,
- preserve differently,
- or explicitly require a lower-tier reference surface.

---

## 13. Relation to retention

This note complements the retention ladder.

The retention ladder defines:
- tiers,
- replay legitimacy,
- preservation boundaries,
- and replay-honest lineage.

This note defines:
- when those tiers still conserve the same deterministic identity question,
- and when they must stop pretending they do.

A retained tier may remain lawful and useful while no longer preserving the same bounded invariance claim as a lower tier.

That is acceptable.
What is not acceptable is failing to declare it.

---

## 14. Relation to distortion audit

The distortion audit asks:

- what distinctions are being collapsed,
- whether that collapse matters downstream,
- and where the fix belongs.

This note asks the companion question:

- has the collapse crossed the threshold where deterministic invariance should no longer be treated as conserved?

The two notes should therefore be used together:

- distortion audit to locate flattening,
- deterministic invariance threshold to decide whether continuity language may still stand.

---

## 15. Relation to replay and reconstruction

Replay is lens-bound.

Therefore:
a replay surface should never imply stronger continuity than the declared lens and retained tier justify.

A future reconstruction pipeline should therefore emit, at minimum:

- declared lens
- retained tier
- support basis
- reconstruction trace
- latency posture
- fidelity posture
- reconstruction summary
- explicit non-claims
- threshold outcome or downgrade posture when applicable

This ensures replay honesty remains stronger than replay convenience.

---

## 16. Relation to canon pressure

This note remains below canon.

It does not determine whether something should promote.

It does, however, provide one important precondition for future canon safety:

A claim should not be considered promotable if the system cannot even state clearly whether deterministic invariance has survived the retention, replay, and support path needed to justify the claim.

In that sense, invariance thresholding is a pre-canon discipline.

---

## 17. Minimal audit questions

When evaluating any retained or reconstructed surface, ask:

1. What bounded question is this surface still claiming to answer?
2. Under what declared lens?
3. Under what retained tier?
4. Which invariants still survive?
5. Which distinctions have been collapsed?
6. Is the same identity still honestly conserved?
7. If not, what downgrade posture is required?

---

## Structural Identity Coupling Note

This document should be read together with `README.StructuralIdentityLaw.md`.

The relationship is complementary, but not symmetrical.

- `README.StructuralIdentityLaw.md` defines **what structural identity is** in DME:
  - the same bounded question,
  - under the same declared constraints,
  - with sufficient surviving support,
  - and a real mechanized basis.

- `README.DeterministicInvarianceThreshold.md` defines **when that identity has degraded far enough that it can no longer be treated as conserved**.

In practical terms:

- Structural Identity Law defines the **qualitative identity conditions**.
- Deterministic Invariance Threshold defines the **threshold posture** for continuity, degradation, narrowing, or break under compression, retention, replay, reconstruction, and query.

This means deterministic threshold evaluation must never float free from identity definition.

**Threshold evaluation without a defined structural identity is undefined behavior.**

Accordingly, any invariance judgment in DME should be read in this order:

1. define the bounded identity being preserved,
2. declare the active lens / tier / route / scope constraints,
3. evaluate whether enough support survives,
4. then apply deterministic threshold judgment,
5. then emit the lawful resulting posture:
   - conserved
   - narrowed
   - degraded
   - unresolved
   - broken
   - or new identity required

This note therefore does **not** define identity by itself.

It defines the boundary at which an already-declared structural identity can no longer be treated as conserved honestly.

One-line coupling summary:

**Structural Identity Law defines the target of continuity; Deterministic Invariance Threshold defines the boundary where that continuity no longer holds.**