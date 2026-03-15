# README_ConstitutionAppendix.md
# Dynamical Memory Engine — Constitution Appendix

Compact reference tables. All definitions derive authority from `README_MasterConstitution.md`.

---

## §A. Authority Classes

| Class | Meaning | Examples |
|---|---|---|
| Authoritative | Raw or canonical state; never rewritten | A1, A2 |
| Derived | Deterministic transformation of authoritative state | W1, S1, A3, BN |
| Compressed | Reduced representation preserving declared invariants with receipts | H1 |
| Aggregate | Multi-window structural contraction via phase-aligned superposition | M1 |
| Tooling | Read-side recognition or retrieval result; scores references, does not assert truth | Q |
| Canon | Promoted trusted memory admitted under legitimacy criteria | C1 |

All classes above apply to pipeline artifacts that carry an `artifact_class` field.
Substrate read and report surfaces (`summary()`, `neighborhoodTransitionReport()`,
`TrajectoryBuffer` frame reads) are plain-data, non-canonical outputs — not pipeline
artifacts. They do not belong to an authority class. Their local JSDoc and
`report_type` fields document their non-artifact, non-canonical status.

---

## §B. Artifact Quick-Reference

| Class | Name | Authority | Layer | Produced by |
|---|---|---|---|---|
| A1 | ClockStreamChunk | Authoritative/Raw | Signal | IngestOp |
| A2 | AlignedStreamChunk | Authoritative/Grid | Structural | ClockAlignOp |
| W1 | WindowFrame | Derived/Bounded | Structural | WindowOp |
| S1 | SpectralFrame | Derived/Structural | Structural | TransformOp |
| H1 | HarmonicState | Compressed/Replayable | Runtime Memory | CompressOp |
| An | AnomalyReport | Derived/Guard | Runtime Memory | AnomalyOp |
| M1 | MergedState | Aggregate/Multi-window | Runtime Memory | MergeOp |
| A3 | ReconstructedChunk | Derived/Non-authoritative | Runtime Memory | ReconstructOp |
| Q | QueryResult | Tooling/Recognition | Perception | QueryOp |
| BN | BasinSet | Derived/Geometric index | Substrate | BasinOp |
| C1 | CanonicalState | Canon/Promoted | Canon | ConsensusOp |

---

## §C. Operator Quick-Reference

| Operator | Layer | Input → Output | Authority |
|---|---|---|---|
| IngestOp | Signal | raw → A1 | Authoritative |
| ClockAlignOp | Structural | A1 → A2 | Authoritative (projected) |
| WindowOp | Structural | A2 → W1[] | Derived |
| TransformOp | Structural | W1 → S1 | Derived |
| CompressOp | Runtime Memory | S1 + context → H1 | Compressed |
| AnomalyOp | Runtime Memory | H1+H1+policy → An | Derived/Guard |
| MergeOp | Runtime Memory | H1[] → M1 | Aggregate |
| ReconstructOp | Runtime Memory | H1/M1 → A3 | Derived |
| QueryOp | Perception | corpus + spec → Q | Tooling |
| BasinOp | Substrate | H1[]/M1[] → BN | Derived |
| SegmentTracker | Substrate | An → segment_id | Component |
| TrajectoryBuffer | Substrate | H1/M1 → frames | Component |
| MemorySubstrate | Substrate | commit/query/rebuild | runtime substrate component(non-artifact authority surface)
| ConsensusOp | Canon | M1+epoch → C1 | Canon (stub) |

---

## §D. Door / Layer Matrix

| Layer | Door One | Door Two | Door Three |
|---|---|---|---|
| Signal Space | ✓ active | — | — |
| Structural Space | ✓ active | — | — |
| Runtime Memory Space | ✓ active | — | — |
| Perception Space | ✓ active | — | — |
| Substrate Space | ✓ active | — | — |
| Canon Space | stub only | ✓ active | — |
| Prediction Space | deferred | ✓ active | — |
| Agency Space | deferred | — | ✓ future |
| Ecology Space | deferred | — | ✓ future |
| Symbolic Space | deferred | — | ✓ future |
| Meta Space | deferred | — | ✓ future |

---

## §E. Preferred / Disallowed Phrase Reference

### Preferred phrases

| Context | Preferred |
|---|---|
| Compressed H1/M1 objects | "runtime memory" |
| Basin/trajectory/segment organization | "substrate memory" |
| C1 objects | "canonical memory" or "trusted promoted memory" |
| QueryOp output | "recognition result" or "retrieval result" |
| ConsensusOp output | "canon promotion" or "trusted promoted memory" |
| ReconstructOp output | "replay under declared lens" |
| AnomalyOp output | "novelty detection", "divergence guard" |
| Basin clusters | "structural neighborhood", "proto-basin grouping" |
| Basin proximity | "structural neighborhood proximity", not "basin membership" |

### Disallowed substitutions

| Do not use | When you mean |
|---|---|
| "memory layer" (unqualified) | Runtime Memory Space, Substrate Space, or Canon Space |
| "consensus" | merge behavior |
| "perception" | canon or truth |
| "recognition" | truth |
| "state space" | Substrate Space |
| "intelligence stack" | Door One alone |
| "canonical" | merely recurrent or stable |
| "replay" | denoise/enhance without declared lens |
| "attractor basin" (as proven) | structural neighborhood (proto-basin) |
| "truth" | query matches, anomaly scores, merge outputs, substrate clusters |

---

## §F. Operator Formal Signatures

```
A1 = IngestOp(raw_input, ingest_policy, clock_policy_id)
A2 = ClockAlignOp(A1, GridSpec)
W1 = WindowOp(A2, WindowSpec)
S1 = TransformOp(W1, TransformPolicy)
H1 = CompressOp(S1, CompressionPolicy, context{segment_id, window_span})
An = AnomalyOp(H1_current, H1_baseline, AnomalyPolicy)
M1 = MergeOp(H1[], MergePolicy, PostMergeCompressionPolicy)
A3 = ReconstructOp(H1|M1, ReconstructPolicy)
Q  = QueryOp(corpus[], QuerySpec, QueryPolicy)
BN = BasinOp(H1[]|M1[], BasinPolicy)
C1 = ConsensusOp(M1, EpochContext, SettlementPolicy)  ← stub in Door One
```

---

*This appendix is reference material only. Authority lives in `README_MasterConstitution.md`.*
