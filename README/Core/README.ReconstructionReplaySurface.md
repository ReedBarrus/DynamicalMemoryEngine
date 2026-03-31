# README.ReconstructionReplaySurface.md

# Dynamical Memory Engine — Reconstruction / Replay Surface

## Status

This document defines the bounded reconstruction / replay surface posture for DME.

It is a supporting core implementation-governance note.

It does **not** override:

- `README_MasterConstitution.md`
- `README_ConstitutionAppendix.md`
- `README_WorkflowContract.md`
- `README_RepoPlacementConstitution.md`
- `README/Core/README_DoorOneRuntimeBoundary.md`
- `README/Core/README_DoorOneInspectionSurfacePosture.md`
- `README/Core/README_DoorOneAdapterPolicy.md`
- `README/Core/README.IngestAdapterMatrix_v0.md`
- `README/Core/README.ContinuousIngestRetentionLadder.md`
- `README/Roadmap/demo/README.UsableSemanticOscilloscope.md`
- `README/Roadmap/README.DoorTwoCanonCandidatePacket.md`
- `README/Roadmap/README.DoorTwoCanonActivationCriteria.md`

Its purpose is narrower:

- define what replay and reconstruction mean in DME,
- distinguish runtime reconstruction from retention-backed replay and review/canon-support replay,
- preserve replay honesty across retained tiers,
- define replay as a declared-lens, declared-tier, non-authoritative surface,
- guide future replay requests in the execution shell, HUD, and public demo,
- prevent replay convenience from being mistaken for truth, canon, or ontology.

This note is about a **surface and seam**, not a new layer.
It is not a canon note.
It is not a truth note.
It is not a permission slip for semantic uplift.

---

## 1. Why this note exists

Replay and reconstruction are already present throughout DME, but they are currently distributed across several notes and seams.

The system already has:

- replay-capable runtime artifacts,
- declared replay-under-lens posture,
- durable provenance receipts,
- replay-honest retention tiers,
- bounded review packaging,
- and execution/inspection surfaces that increasingly want explicit replay behavior.

As DME becomes more usable, a new question becomes practical:

**How does the system let an operator reconstruct or replay what happened without turning replay into hidden authority?**

This note exists to answer that question.

---

## 2. Core rule

**Replay is lens-bound support, not truth restoration.**

Replay or reconstruction in DME may:

- reconstruct or re-present prior measured/derived structure under a declared lens,
- support inspection,
- support review,
- support consultation,
- support challenge,
- support bounded candidate/canon evidence use,

but it may **not** by itself imply:

- truth,
- canon,
- ontology,
- universal equivalence to raw source,
- authority uplift from retention,
- or promotion.

This follows the constitutional replay rule: replay is lens-bound and must not silently become raw restoration, beautification, or truth. :contentReference[oaicite:0]{index=0}

---

## 3. Constitutional posture

Door One remains below canon.

Inherited rules remain:

- runtime is not canon,
- query is not truth,
- substrate is not ontology,
- consensus is promotion-only,
- adapters are pre-ingest only,
- HUDs are read-side only,
- preservation class is not authority class.

Accordingly, replay/reconstruction surfaces may:

- expose declared lens,
- expose retained-tier posture,
- expose provenance lineage,
- expose evidence-backed reconstruction or replay support,
- expose derived-vs-durable posture,
- support bounded review and challenge handling.

They may **not**:

- mint canon,
- assign truth,
- bypass explicit review,
- collapse retained tiers into one apparent authority class,
- silently convert convenience surfaces into evidence,
- or hide the replay lens.

---

## 4. Distinction rule: reconstruction vs replay

For current DME purposes, two terms should remain close but distinct.

### A. Reconstruction

Reconstruction refers to producing a replay-capable or inspection-capable rendering from runtime memory artifacts under a declared lens.

Typical basis:
- `ReconstructOp`
- A3
- runtime replay surfaces

Reconstruction is a runtime-derived product.

### B. Replay

Replay refers more broadly to any lawful re-presentation of prior structure, lineage, or support under a declared lens and retained-tier posture.

Replay may be based on:
- runtime reconstruction,
- durable receipts,
- digest-backed navigation,
- pinned packets,
- archive bundles,
- candidate/canon support surfaces,
- or other bounded preserved lineage.

Reconstruction is one way to support replay.
Replay is the broader operator-facing seam.

---

## 5. Three replay classes

The replay surface should distinguish at least three classes.

### 5.1 Runtime reconstruction replay

Purpose:
- reconstruct structure from runtime memory artifacts under a declared lens

Examples:
- replay from H1 or M1 through A3
- structural inspection of a bounded run
- runtime-derived comparison rendering

Properties:
- declared-lens
- runtime-derived
- below canon
- below truth
- may differ from raw source
- must not be over-claimed as raw restoration

### 5.2 Retention-backed replay

Purpose:
- replay or inspect a bounded history using retained lineage tiers

Examples:
- receipt-grounded run replay
- pinned packet replay support
- archive-backed experiment review
- digest-assisted navigation back to receipts

Properties:
- tier-bound
- lineage-backed
- receipt precedence preserved
- may support inspection without reconstructing every lower-tier byte inline
- must declare what kind of replay each tier still supports

This follows the retention ladder’s replay-legitimacy rule: each retained tier must declare what it can lawfully replay and what it must not claim. :contentReference[oaicite:1]{index=1}

### 5.3 Review / canon-support replay

Purpose:
- support consultation, candidate review, activation review, challenge, contest, narrowing, supersession, or revocation

Examples:
- replay of evidence supporting a bounded canon candidate claim
- replay of comparative consultation context
- replay of challenge evidence against an active C1
- replay of packet lineage for review

Properties:
- claim-supporting
- review-scoped
- below promotion unless an explicit later boundary says otherwise
- must preserve support basis, scope, and non-claims
- must not be mistaken for canon by attachment

This aligns with the candidate-packet and activation-criteria posture that canon promotes bounded claims backed by evidence, scope, and governability — not vibes or convenience packets. 

---

## 6. Retained tier and replay affordance

Replay must remain explicit about which retained tier is being used.

### Tier 0 — Live working state

Supports:
- current-cycle inspection
- short-horizon local visibility
- immediate operator convenience

Does **not** imply:
- durable lineage
- stable replay legitimacy
- preservation support
- promotion

### Tier 1 — Durable receipts

Supports:
- minimum replay-honest lineage
- bounded reconstruction of what was measured, transformed, compressed, or reviewed
- provenance audit

Does **not** imply:
- final interpretation
- canon
- trust uplift
- ontology

### Tier 2 — Regenerable digest

Supports:
- bounded continuity review
- recent replay navigation
- quicker inspection over receipt-backed history

Does **not** imply:
- authority over receipts
- replacement of receipt lineage
- settlement of ambiguity

If digest and receipts disagree, receipts win. :contentReference[oaicite:3]{index=3}

### Tier 3 — Pinned packet

Supports:
- bounded experiment preservation
- replay-backed review handoff
- stable comparison support
- selected inclusion of receipts, digests, workbench refs, and review posture

Does **not** imply:
- promotion
- truth
- canon
- ontology

### Tier 4 — Archive bundle

Supports:
- longer-horizon preservation
- later comparison across experiments or sessions
- retrieval of archived replay support

Does **not** imply:
- canonical settlement
- final interpretation
- trusted memory
- authority uplift from storage duration

---

## 7. Replay request rule

A replay or reconstruction action should be treated as an **explicit request surface**, not a silent background convenience.

A replay request should preserve at minimum:

- `replay_request_id`
- `replay_type`
- `request_status`
- `requested_at`
- `source_family`
- `source_ids`
- `stream_ids`
- `run_lineage`
- `declared_lens`
- `retained_tier_used`
- `support_basis`
- `replay_target_ref`
- `derived_vs_durable_posture`
- `allowed_use`
- `explicit_non_claims`
- `notes`

Replay requests remain:
- request objects
- not canon objects
- not truth objects

---

## 8. Lens declaration rule

Every replay surface must preserve the active lens.

At minimum, replay should expose where relevant:

- sample-rate posture
- effective sample rate / decimation
- transform family
- window family
- window / hop
- band partition
- segmentation rule
- comparison basis
- replay/reconstruction lens
- scale posture if relevant

A replay surface without declared lens invites false equivalence.

This aligns with the constitutional rule that replay is always lens-bound. 

---

## 9. Derived-vs-durable rule

Replay surfaces must preserve whether the visible material is:

- derived from runtime artifacts,
- directly supported by durable receipts,
- digest-assisted,
- packet-preserved,
- archive-preserved,
- or mixed.

Suggested posture field:
- `derived`
- `durable`
- `mixed`

This does **not** create a new authority class.
It is a replay-honesty and inspection-honesty surface.

---

## 10. Support-basis rule

Where practical, a replay surface should preserve a compact support basis.

Examples:
- `receipt_lineage`
- `runtime_reconstruction`
- `return_similarity`
- `cross_run_support`
- `review_packet_support`
- `challenge_evidence`
- `weak_support_only`

This keeps replay auditable rather than merely persuasive.

This matches the broader read-side accountability rule that higher-order summaries and labels should remain traceable back to evidence. 

---

## 11. Replay and source-family workflow

Replay should preserve the distinction between:

- source family
- format / transport
- workflow preprocessing posture

Examples:
- generic WAV import replay is not identical to replay of a declared real-world audio family workflow
- JSON replay is not automatically a smart-tag family replay
- CSV replay may represent a generic numeric trace or a family-specific imported telemetry workflow

Replay surfaces should therefore preserve:
- source-family identity where known
- generic import mechanism where relevant
- workflow preprocessing context where it materially shapes interpretation

This follows `README.SourceFamilyWorkflowTypes.md`. :contentReference[oaicite:6]{index=6}

---

## 12. Replay and inspection surfaces

Replay belongs downstream of lawful outputs.

Replay surfaces should preserve the preferred read-side ordering:

1. Provenance
2. Runtime Evidence
3. Interpretation
4. Review Surfaces

Replay UI may:
- add a replay panel
- add tier/lens declaration
- add lineage drill-down
- add request history
- add comparison toggles

Replay UI may **not**:
- visually outrank provenance/evidence with style alone
- hide the retained tier
- imply that replay is stronger than evidence
- infer truth from ease of re-display

This follows the inspection surface posture note. :contentReference[oaicite:7]{index=7}

---

## 13. Replay and candidate/canon support

Replay is likely to become an important support surface for:

- consultation requests
- activation/review requests
- candidate packets
- challenge workflows
- contest/suspension/narrowing/supersession/revocation review

But replay support does not equal promotion.

A candidate or canon-support replay should preserve at minimum:

- bounded claim or bounded use
- claim scope
- explicit non-claims
- evidence refs
- receipt refs
- support basis
- retained tier used
- contestability posture where relevant

This aligns with the candidate-packet and activation-criteria requirements for bounded claims, explicit scope, evidence basis, and governability. 

---

## 14. Failure posture

When a replay request cannot be fulfilled honestly, it should fail explicitly and locally.

Examples:
- declared lens unavailable
- insufficient retained lineage at the selected tier
- replay target ref missing
- request scope overbroad for current replay support
- requested surface is review-only and not reconstructable under current tier

Preferred behavior:
- explicit failure
- compact reason
- no fake replay
- no silent fallback that changes meaning

---

## 15. Recommended immediate implementation posture

The next practical replay/reconstruction seam should likely be:

### Step A — Replay request object
Add explicit replay request preparation in the execution shell.

### Step B — Tier/lens declaration
Make every replay request declare:
- requested replay type
- lens
- retained tier
- target reference
- support basis

### Step C — Local replay surface
Expose one bounded replay/result panel in the execution shell for inspection and lineage drill-down.

### Step D — Later tandem reuse
Allow the lab HUD and public demo to consume the same lawful replay/result references later, with audience-appropriate pacing.

This keeps replay downstream of runtime/request law rather than making it a hidden always-on behavior.

---

## 16. Relation to the usable semantic oscilloscope

The usable semantic oscilloscope should eventually support, in one bounded operator environment:

- source selection
- lawful ingest / execution
- runtime/result inspection
- explicit consultation/review request
- explicit replay / reconstruction request
- lineage and retained-tier visibility
- and separate lab/public read-side surfaces over the same lawful outputs

Replay is therefore part of the intended end-state of the oscilloscope, but should remain explicit, bounded, and non-authoritative. :contentReference[oaicite:9]{index=9}

---

## 17. What this seam is not

This seam is not:

- raw truth restoration
- ontology replay
- automatic canon support
- a hidden summary beautifier
- a justification for retention inflation
- an excuse to blur runtime, review, and promotion boundaries

It is a bounded support seam for lawful reconstruction and replay.

---

## 18. One-line summary

The reconstruction / replay surface formalizes how DME may explicitly reconstruct or replay runtime, retained, and review-support structure under declared lens and retained-tier posture — while preserving provenance, replay honesty, and the separation between support, review, and authority.