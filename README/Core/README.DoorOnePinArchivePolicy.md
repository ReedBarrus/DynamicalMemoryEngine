# README_DoorOnePinArchivePolicy.md
# Dynamical Memory Engine — Door One Pin / Archive Policy

## Status

This document governs preservation classes for Door One outputs.

It is a supporting implementation and governance note.

It does **not** override:
- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README_ConstitutionAppendix.md`
- `README_RepoPlacementConstitution.md`
- `README_DoorOneRuntimeBoundary.md`
- `README_DoorOneProvenanceRetention.md`
- `README_DoorOneAcceptanceChecklist.md`

Its purpose is narrower:

- define what may remain ephemeral,
- define what must remain durable,
- define what “pinning” means,
- define what “archive” means,
- prevent storage class from being confused with authority class,
- preserve replay honesty while Door One remains below canon.

---

## 1. Constitutional posture

Door One remains below canon.

Pinning and archiving are preservation actions only.

They do **not** imply:
- canon,
- truth,
- ontology,
- promotion,
- legitimacy,
- trusted memory.

Storage class is not authority class.

A file may be preserved longer without becoming more meaningful.

A file may be easier to retrieve without becoming more true.

---

## 2. Why this note exists

Door One now contains multiple preservation surfaces with different lifetimes:

- bounded live cycle outputs,
- durable provenance receipts,
- derived digest summaries,
- latest-pointer convenience files,
- future pinned packets,
- future longer-horizon archive bundles.

Without an explicit policy, these classes can blur together.

The risk is not only accidental deletion.
The risk is accidental semantic inflation:
treating “kept longer” as “more trusted,”
treating “pinned” as “canon,”
or treating a digest as a substitute for its underlying receipts.

This note prevents that drift.

---

## 3. Preservation classes

### A. Ephemeral live outputs

These are bounded working surfaces used for current-cycle inspection and convenience.

Typical examples:
- `out_live/cycle_*`
- top-level latest-pointer files in `out_live/`

Properties:
- may be pruned
- may be overwritten
- useful for immediate inspection
- not sufficient as permanent replay foundation

These are **not** the archive.

### B. Durable provenance receipts

These are the minimum durable replay lineage surfaces for Door One live operation.

Typical examples:
- `out_provenance/live/receipt_cycle_*.json`

Properties:
- survive live-cycle pruning
- retain bounded cycle lineage
- preserve replay-honest references
- remain script-side and below canon

Durable receipts are the minimum preservation baseline for later digest/replay.

### C. Derived digests

These are convenience summaries derived from durable provenance receipts.

Typical examples:
- `out_provenance/live/live_digest.json`

Properties:
- derived only
- convenient for replay overview
- must never replace receipts
- may be regenerated from receipts

A digest is not an archive substitute.
A digest is not a review decision.
A digest is not canon.

### D. Pinned packets

Pinned packets are explicitly preserved bounded review/replay packets.

Their purpose is to freeze a particular bounded state for later inspection, comparison, or handoff.

Pinning means:
- “preserve this packet intentionally”
- not “promote this packet”
- not “declare this packet true”

Pinned packets should be explicit, named, and reproducible from declared inputs where possible.

### E. Archive bundles

Archive bundles are longer-horizon preserved packets intended for later replay, comparison, or historical study.

They may contain:
- pinned packets,
- selected receipts,
- selected digests,
- selected references to live-cycle outputs or exported snapshots.

Archive bundles remain below canon unless promoted elsewhere by an explicit higher-layer process.

Archive is preservation, not legitimacy.

---

## 4. Core rules

### Rule 1 — Preserve authority boundaries

No preservation action may silently alter authority class.

Pinning does not mint canon.
Archiving does not mint truth.
Retention duration does not imply legitimacy.

### Rule 2 — Receipts outrank digests for replay lineage

If a digest and its underlying receipts disagree, the receipts win.

Digests are convenience surfaces only.

### Rule 3 — Live outputs are not the permanent archive

Bounded live outputs may assist current inspection, but they are not sufficient by themselves for durable lineage.

Any replay-honest preservation flow must retain durable receipts or an equivalent explicit receipt-bearing packet.

### Rule 4 — Pinning must be explicit

Nothing is pinned merely because it was visible, recent, or aesthetically important.

Pinning requires an explicit action or explicit script policy.

### Rule 5 — Archive composition must stay declared

Archive bundles should declare:
- what they contain,
- what they reference,
- what they omit,
- what class each included artifact belongs to.

### Rule 6 — Derived summaries must remain marked as derived

Digests, summaries, and convenience reports inside pinned or archived material must remain clearly marked as:
- derived,
- non-authoritative,
- below canon.

### Rule 7 — Review packaging does not imply promotion

If a pinned or archived packet includes:
- readiness,
- dossier,
- consensus review posture,
- candidate claim packaging,

those remain review surfaces only.

Their presence in a pinned or archived packet does not imply promotion.

---

## 5. Minimum durable baseline

For current Door One live operation, the minimum durable baseline is:

1. durable provenance receipts,
2. references needed to interpret those receipts,
3. enough scope metadata to reconstruct cycle order and stream identity.

This is the minimum replay-honest preservation baseline.

Live-cycle directories alone do not satisfy this baseline.

Derived digest files alone do not satisfy this baseline.

---

## 6. Pinning policy

A future pin action should create a bounded packet that preserves enough context for later inspection without depending on unstable live state.

A pinned packet should preferably include:

- packet metadata
  - packet type
  - packet version
  - created_at
  - declared purpose
  - source mode
  - stream_id
  - cycle range or run labels

- preservation contents
  - selected durable receipt files or embedded receipt summaries
  - selected digest snapshot if helpful
  - references to matching live-cycle directories if still present
  - references to latest workbench / run result / cross-run report if intentionally included

- bounded review context if present
  - readiness summary
  - claim type
  - consensus review posture
  - blocker / insufficiency counts

- explicit disclaimers
  - not canon
  - not truth
  - not ontology
  - not promotion

Pinning should favor traceability over convenience.
A smaller packet with clear lineage is better than a larger packet with ambiguous meaning.

---

## 7. Archive policy

A future archive action may group pinned packets and related preserved references into longer-horizon bundles.

Archive bundles should:
- remain explicitly versioned,
- declare their scope,
- retain references back to included packet members,
- avoid silently flattening unlike evidence planes into one implied truth surface.

Archive bundles may be organized by:
- stream,
- run range,
- cycle range,
- source mode,
- review purpose,
- experiment cohort.

Archive bundles must **not** imply:
- canonical settlement,
- trusted memory,
- ontology,
- final interpretation.

---

## 8. Recommended storage posture

For the current phase, the preferred preservation posture is:

### Keep bounded
- `out_live/cycle_*`
- latest live convenience files

### Keep durable
- `out_provenance/live/receipt_cycle_*.json`

### Regenerate as needed
- `out_provenance/live/live_digest.json`

### Add later by explicit action
- pinned packets
- archive bundles

This keeps Door One replay-honest without prematurely treating convenience surfaces as permanent truth surfaces.

---

## 9. Practical implications for future scripts

Future script-side pin/archive helpers may:
- read durable receipts,
- read current digest files,
- gather selected latest-pointer references,
- write explicit packet metadata,
- copy or reference selected files.

They may not:
- reinterpret preservation as promotion,
- infer canon from repeated recurrence,
- infer truth from storage duration,
- replace receipts with digest-only preservation,
- make archive placement itself into authority.

Scripts remain thin.

---

## 10. Drift questions

When reviewing any proposed pin/archive flow, ask:

1. What is being preserved?
2. Why is it being preserved?
3. What underlying receipts remain available?
4. Could this packet be mistaken for canon or truth?
5. Does this preserve lineage, or only convenience?
6. If the digest vanished, would the preserved receipts still support replay?
7. If the live directory vanished, would the packet still remain interpretable?

If these questions cannot be answered cleanly, tighten the policy or the packet shape before implementation.

---

## 11. What this note does not do

This document does **not**:
- activate canon,
- define a Door Two archive model,
- create trusted memory,
- authorize prediction,
- replace provenance retention,
- replace replay/digest notes,
- require a full archive system for Door One acceptance.

It only defines preservation classes and their boundaries.

---

## 12. Current recommendation

For the current phase:

1. treat bounded live outputs as ephemeral,
2. treat durable provenance receipts as the minimum replay-honest preservation layer,
3. treat digests as regenerable convenience surfaces,
4. introduce pinned packets only by explicit script or explicit operator-facing action,
5. introduce archive bundles only after pinned packet shape is stable.

That is the preferred Door One preservation posture.