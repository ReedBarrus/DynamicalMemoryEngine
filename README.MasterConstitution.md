# README_MasterConstitution.md
# Dynamical Memory Engine — Master Constitution

---
## Metadata
```yaml
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
```
## 1. Purpose and Authority Order

This document is the single constitutional authority for the Dynamical Memory Engine.

It supersedes and absorbs the meaning of:
- `README_ArchitectureBoundaryContract.md`
- `README_NamingConventions.md`
- `README.ArtifactLifecycle.md`

The following remain active as supporting normative references, but do not override this document:
- `README_SubstrateLayer.md` — substrate component contracts
- `OPERATOR_CONTRACTS.md` — per-operator determinism and receipt rules
- Operator-local JSDoc headers — local contract surface for each `.js` file

The workflow contract (`README_WorkflowContract.md`) governs roles, development loop, and escalation. It is a peer document, not subordinate to this one.

**Authority resolution rule:** If any operator doc, README, or JSDoc comment conflicts with this document, this document wins. If this document and the Workflow Contract conflict on a governance matter, Reed decides.

---

## 2. Core Principle

The system must develop upward from grounded signal interaction. The lawful order is:

```
measurement → structure → runtime memory → recognition
→ canon → prediction → agency → ecology → symbolic → meta
```

Each higher layer must inherit from stable lower layers. No layer may be projected downward as premature abstraction. Higher-layer language may appear in roadmap discussion but must not silently shape active code.

---

## 3. Canonical Layer Definitions

### Active Layers (Door One scope)

**1. Signal Space**
Function: measurement and provenance anchoring.
Operators: `IngestOp`
Artifacts: `RawSignal`, `A1 ClockStreamChunk`
Answers: *What was measured, from where, at what time?*
Must not: infer meaning, normalize semantics, classify events, compress source ambiguity.

**2. Structural Space**
Function: policy-bound structural transformation of signal into stable geometric identity.
Operators: `ClockAlignOp`, `WindowOp`, `TransformOp`
Artifacts: `A2 AlignedStreamChunk`, `W1 WindowFrame`, `S1 SpectralFrame`
Answers: *What pattern occurred?*
Must not: decide what matters, promote memory, impose semantic abstraction, silently repair declared data loss.

**3. Runtime Memory Space**
Function: compressible, replayable structural memory states.
Operators: `CompressOp`, `MergeOp`, `AnomalyOp`, `ReconstructOp`
Artifacts: `H1 HarmonicState`, `M1 MergedState`, `A3 ReconstructedChunk`, `AnomalyReport`
Answers: *What stable structures recur, and how can they be replayed or compared?*
Must not: silently promote runtime memory into trusted knowledge, redefine source truth, enhance replay beyond declared lens, treat merged replay as equivalent to raw replay unless explicitly defined.

**4. Perception Space**
Function: recognition through comparison against runtime memory.
Operators: `QueryOp`
Artifacts: `Q QueryResult`
Answers: *What does this resemble?*
Must not: assert truth, promote canon, collapse similarity into identity, classify beyond declared comparison lens.

**5. Substrate Space**
Function: organize runtime structural memory across time, recurrence, proto-basins, and trajectories.
Components: `SegmentTracker`, `TrajectoryBuffer`, `BasinOp`, `MemorySubstrate`
Artifacts: `BN BasinSet` (derived geometric index)
Answers: *How is the trajectory organized across time? What neighborhoods recur?*
Must not: rewrite canon, silently promote trust, override operator receipts, replace lawful runtime artifacts with inferred abstractions, claim true dynamical basin membership from structural proximity alone.

**6. Canon Space**
Function: truth stabilization through explicit promotion only.
Operators: `ConsensusOp` (Door One stub — deferred)
Artifacts: `C1 CanonicalState`
Status: declared, not yet fully active; promotion-only boundary; must remain separate from normal runtime transforms.
Answers: *What memory is trusted enough to stabilize as system truth?*
Must not: behave like a normal transform, run opportunistically, collapse perception into canon, bypass explicit legitimacy criteria.

### Deferred Layers (Door Two / Door Three)

These layers are valid long-term architecture. They must not silently reshape active code.

| Layer | Function | Dependency |
|---|---|---|
| Prediction Space | Temporal inference over stable/canonical memory | Stable runtime memory + canon |
| Agency Space | Intervention and action selection | Perception + prediction + policy |
| Ecology Space | Multi-agent interaction and shared memory | Agency + canon + shared memory |
| Symbolic Space | Higher-order abstraction and meaning compression | Stable substrate + trusted canon |
| Meta Space | Self-observation and self-governance | All lower layers stable |

---

## 4. Door Definitions

**Door One — Deterministic structural memory and recognition runtime**
Includes: Signal, Structural, Runtime Memory, Perception, Substrate.
Produces: lawful replayable structural memory objects, recognition capability, organized runtime memory ecology.
Does not include: active canon as system truth, prediction, agency, symbolic abstraction, meta-cognition.

**Door Two — Trusted temporal cognition stack**
Includes: Canon Space (active), Prediction Space.
Produces: trusted promoted memory, state transition intelligence, temporal inference over canon and stable memory.
Does not yet include: full autonomous agency, symbolic cognition, self-governance.

**Door Three — Participatory intelligence ecology**
Includes: Agency, Ecology, Symbolic, Meta.
Produces: intervention capacity, agent interaction, symbolic abstraction, reflective/self-governing behavior.

---

## 5. Boundary Rules

These rules are non-negotiable. No implementation convenience justifies crossing them.

**Rule 1 — Runtime is not canon.**
No runtime artifact becomes canon merely because it is stable, merged, or frequently queried.

**Rule 2 — Query is not truth.**
Similarity and recognition are perception. They are not trusted knowledge and do not imply canonical authority.

**Rule 3 — Substrate is not ontology.**
Basins, trajectories, and segment structures are runtime organizational constructs. Proto-basin proximity does not prove dynamical basin membership. True dynamical basin detection is deferred to future trajectory-convergence, dwell, and transition analysis.

**Rule 4 — Replay is lens-bound.**
All replay must declare its lens. Replay is not raw restoration unless explicitly defined as such. No denoising, beautification, or enhancement unless the lens permits it and the receipt says so.

**Rule 5 — Consensus is promotion-only.**
`ConsensusOp` is not a standard data transform. It is a promotion boundary and must remain separate from runtime pipeline operation.

**Rule 6 — Deferred layers stay deferred.**
Prediction, agency, ecology, symbolic, and meta layers may appear in roadmap discussion but must not silently reshape active code until explicitly authorized.

**Rule 7 — Lowest lawful layer.**
When implementing anything, default to the lowest lawful layer that honestly resolves the problem. Do not jump upward into symbolic interpretation, prediction logic, ontology building, or autonomous policy unless explicitly authorized.

---

## 6. Canonical Naming Law

**Precision outranks poetic convenience** in constitutional documentation.

### Memory type distinctions (always qualify "memory")

| Term | Meaning | Examples |
|---|---|---|
| Runtime Memory | Replayable compressed structural states from pipeline | H1, M1 |
| Substrate Memory | Organized ecology over runtime memory (segments, basins, trajectories) | BasinSet, trajectory frames |
| Canonical Memory | Promoted trusted memory admitted under legitimacy criteria | C1 |

### Special-meaning terms

**Perception** — use to mean recognition through comparison against stored runtime memory. Not truth, not canon, not symbolic interpretation.

**Consensus** — use to mean promotion into canon under legitimacy criteria. Not generic averaging, not merge behavior.

**Replay** — use to mean reconstruction under an explicit declared lens. Not raw restoration, not denoising, not enhancement unless declared.

**Truth** — use only in Canon context or legitimacy discussion. Never for query matches, anomaly hits, merge outputs, or substrate clusters.

### Disallowed ambiguous substitutions

Do not silently substitute:
- "memory layer" for Runtime Memory Space, Substrate Space, or Canon Space interchangeably
- "consensus" for merge
- "perception" for canon
- "recognition" for truth
- "state space" when Substrate Space is intended
- "canonical" when meaning only recurrent or stable
- "replay" when meaning denoise/reconstruct/enhance without declared lens

### Project identity

Core docs describe the Dynamical Memory Engine on its own terms. External systems (Resonance, Ultralife, etc.) may be referenced as inspiration, comparison, or adjacent work only. They must not define the project's core architectural language.

### Name introduction rule

Before introducing a new term, ask: what layer? is there already a canonical term? does this blur runtime/substrate/canon? will it be misread? does it preserve the Door staircase? If unclear, do not introduce the term yet.

---

## 7. Artifact Authority Graph

The canonical object graph. If any operator or README conflicts with this, this wins.

```
A1 ClockStreamChunk    (Authoritative / Raw)
   ↓ ClockAlignOp
A2 AlignedStreamChunk  (Authoritative / Canonical Time Grid)
   ↓ WindowOp
W1 WindowFrame         (Derived / Bounded)
   ↓ TransformOp
S1 SpectralFrame       (Derived / Structural Identity)
   ↓ CompressOp
H1 HarmonicState       (Compressed / Replayable)
   ↓ AnomalyOp → AnomalyReport (An)
   ↓ MergeOp
M1 MergedState         (Aggregate / Multi-window Identity)
   ↓ QueryOp
Q  QueryResult         (Tooling / Recognition)

H1 or M1 → ReconstructOp → A3 ReconstructedChunk (Derived / Non-authoritative Replay)
M1 + EpochContext → ConsensusOp → C1 CanonicalState (Canon / Promoted Trusted Memory)
```

Authority classes: see `README_ConstitutionAppendix.md §A`.

### Key artifact contracts (summary)

**A1** — never modified; raw timestamps and values preserved exactly; provenance.input_refs intentionally absent (IngestOp is provenance root); provenance.stream_id_resolution records identity establishment method.

**A2** — authoritative on canonical grid; drift/gap handling logged; raw A1 always stored for audit.

**W1** — derived; exact samples fed to transform preserved; taper declared; partial-window handling declared.

**S1** — derived structural identity; full bin structure; complex coefficients; Parseval energy equivalence.

**H1** — compressed; invariants (energy_raw, energy_norm, band_profile_norm) preserved with proof receipts; replayable; mergeable; segment_id required at compression time.

**M1** — aggregate; phase-aligned; weighted invariance accounting; provenance list required; uncertainty.replay fields null at emit (M1 does not reconstruct at merge time).

**Q** — tooling/recognition; never rewrites upstream artifacts; query_policy_id inside receipts.query (not top-level) to make non-authoritative status explicit.

**A3** — derived/non-authoritative replay; exists only for audit/visualization/downstream; does not update runtime memory.

**C1** — canon/promoted trusted memory; produced only by ConsensusOp; requires explicit legitimacy promotion.

**BN** — derived geometric index; proto-basin grouping; not authoritative; structural neighborhood only.

---

## 8. Implementation Litmus

Before adding any feature, answer:

1. What layer does this belong to?
2. Does it violate a lower-layer boundary?
3. Is it runtime memory, canon, or deferred cognition?
4. Is it honest about what it claims to know?
5. Is it being added too early?

If any answer is unclear, the feature is not yet ready.

The system must rise from grounded signal reality into cognition — not descend from abstraction into convenience. All higher intelligence must inherit lawfully from lower layers. That is what this architecture protects.

---

*This document supersedes `README_ArchitectureBoundaryContract.md`, `README_NamingConventions.md`, and `README.ArtifactLifecycle.md`. Those files may be archived.*
