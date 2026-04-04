# README_IngestAdapterMatrix_v0.md

# Dynamical Memory Engine — Ingest / Adapter Matrix v0

## Status

This document defines the current ingest input / adapter matrix for Door One.

It is a supporting implementation note.
It does **not** override:

- `README_MasterConstitution.md`
- `README_ConstitutionAppendix.md`
- `README_WorkflowContract.md`
- `README_RepoPlacementConstitution.md`
- `README_DoorOneRuntimeBoundary.md`
- `README_DoorOneAdapterPolicy.md`
- `README_DoorOneAcceptanceChecklist.md`

Its purpose is narrower:

- define the lawful Door One ingest boundary in practical terms,
- define the currently accepted adapter classes,
- define the raw ingest contract that all sources must normalize into,
- define flush posture and failure posture,
- reduce future hand-carving by establishing a reusable ingest matrix,
- guide the next implementation step for reusable file/device/derived-trace adapters.

---

## Constitutional posture

Door One remains below canon.

Inherited rules remain:

- runtime is not canon,
- query is not truth,
- substrate is not ontology,
- consensus is promotion-only,
- scripts and HUDs are read-side tooling only,
- pre-ingest adapters are not runtime authority.

Nothing in this note authorizes:

- canon minting,
- prediction authority,
- ontology claims,
- semantic elevation by adapter convenience,
- symbolic reinterpretation,
- agency instructions,
- bypassing the executive ingest seam.

---

## Core rule

All source diversity must collapse into one lawful Door One ingest boundary.

In practical terms:

source / file / device / socket / sampler / derived trace  
→ pre-ingest adapter or direct raw producer  
→ lawful raw ingest input  
or lawful flush result containing ingest-ready payload  
→ `DoorOneExecutiveLane`  
→ Door One runtime

The matrix is therefore **not** “one ontology for all sources.”

It is:

- many source-specific front ends,
- one bounded ingest contract,
- one executive acceptance gate.

---

## One boundary, two accepted entry forms

### A. Raw ingest object

A source may enter Door One directly if it already provides a lawful raw ingest object.

This is the canonical ingest boundary.

### B. Lawful pre-ingest flush result

A source may also enter Door One through a lawful pre-ingest adapter result that exposes `ingest_input`.

This is a wrapper around the same ingest contract, not a second ontology.

A flush result exists to support buffering, ordering, batching, import staging, or device timing discipline.

---

## Canonical raw ingest contract v0

A lawful raw ingest payload must preserve enough measurement context for bounded structural runtime processing.

### Required fields

- `timestamps`
- `values`
- `stream_id`
- `source_id`
- `channel`
- `modality`
- `clock_policy_id`

### Expected supporting metadata

- `meta`
- units if available
- nominal sampling rate if available
- actual sampling context if available
- adapter or import context when useful
- bounded source-format details when useful

### Required contract properties

A lawful raw ingest payload must:

- preserve ordering,
- preserve timestamp / sequence discipline,
- preserve stable stream identity,
- preserve source identity,
- preserve channel identity,
- preserve modality identity,
- remain below semantic authority.

A lawful raw ingest payload may include more metadata than the minimum contract, but extra metadata must not change ingest meaning.

---

## Executive-lane acceptance rule

`DoorOneExecutiveLane` is the active acceptance gate for Door One ingest.

The executive seam may accept:

- a lawful raw ingest object, or
- a lawful pre-ingest adapter result containing `ingest_input`.

The executive seam may reject:

- arbitrary semantic payloads,
- malformed flush objects,
- failed flushes,
- missing required raw ingest fields,
- inputs that bypass the bounded ingest contract.

The executive seam is an execution boundary, not a semantic promotion boundary.

---

## Source classes in the matrix

### 1. Synthetic sources

Examples:

- deterministic test signal generators,
- fixture-based synthetic traces,
- bounded live synthetic runners.

Allowed role:

- produce lawful raw ingest input directly,
- support deterministic testing,
- exercise the same Door One ingest boundary used by real sources.

Typical entry form:

- raw ingest object

Notes:

- useful for control, regression, and bounded live testing,
- must not receive extra semantic privilege just because they are easy to generate.

---

### 2. Sampler-backed sources

Examples:

- `AnalogSamplerOp`,
- microphone capture,
- browser-side sensor streams,
- sampled physical telemetry,
- buffered hardware readers.

Allowed role:

- buffer or order samples,
- preserve timing discipline,
- emit lawful ingest-ready flush output,
- remain pre-ingest only.

Typical entry form:

- lawful flush result containing `ingest_input`

Notes:

- flush mode exists for bounded collection and timing control,
- sampler-backed input must still converge to the same raw ingest contract.

---

### 3. File-backed sources

Examples:

- WAV-derived sampled traces,
- CSV numeric time series,
- structured numeric logs,
- bounded imported measurement traces.

Allowed role:

- parse a file into lawful timestamps / values / source metadata,
- normalize imported structure into the same ingest boundary,
- preserve file provenance,
- preserve import/decode context in metadata.

Typical entry form:

- raw ingest object
- or lawful flush result if staging/buffering is used

Notes:

- file-backed ingest is lawful when it remains measurement-adjacent,
- scripts should stay thin; reusable normalization logic should migrate toward adapter/helper surfaces.

---

### 4. Device / IoT / socket-backed sources

Examples:

- hardware sensor feeds,
- serial telemetry,
- socket-backed numeric streams,
- networked sampled device signals,
- bounded remote sensor adapters.

Allowed role:

- preserve signal ordering,
- preserve stream/source identity,
- preserve bounded timing context,
- normalize to lawful raw ingest input or lawful flush result.

Typical entry form:

- raw ingest object
- or lawful flush result

Notes:

- transport diversity is allowed,
- transport semantics do not create runtime authority.

---

### 5. Derived-trace sources

Examples:

- LLM runtime metrics,
- tool-call cadence traces,
- token-count or latency traces,
- embedding displacement magnitude over time,
- external numeric projections of non-physical systems.

Allowed role:

- emit ordered, bounded, measurement-like traces,
- preserve source/extractor provenance,
- remain below canon and below ontology.

Typical entry form:

- raw ingest object
- or lawful flush result

Notes:

- Door One does **not** ingest semantic authority here,
- derived traces must still behave like lawful sampled observation,
- “LLM ingest” in Door One means bounded numeric or declared symbolic trace projection, not cognition authority.

---

## Adapter obligations

A lawful Door One adapter must:

- preserve source provenance,
- preserve ordering discipline,
- preserve signal identity,
- preserve bounded timing context,
- normalize to the established ingest seam,
- fail explicitly when it cannot produce lawful ingest-ready payloads,
- remain pre-ingest only.

Adapters may:

- enrich metadata,
- expose import/decode context,
- expose nominal or actual sampling context,
- expose bounded flush receipts.

Adapters may **not**:

- mint canon,
- assign truth status,
- reinterpret substrate as ontology,
- create prediction authority,
- create agency instructions,
- silently inject symbolic meaning,
- bypass the executive ingest boundary,
- collapse multiple semantic layers into adapter output.

Adapters are measurement-adjacent normalization tools, not cognition authorities.

---

## Flush posture

If an adapter uses a flush model, the flush result must remain bounded and lawful.

### A lawful flush result may:

- indicate success or failure explicitly,
- expose `ingest_input` when successful,
- expose bounded reasons when unsuccessful,
- expose bounded flush metadata when useful.

### A lawful flush result may not:

- claim canon,
- claim truth,
- claim semantic promotion,
- bypass ingest normalization,
- mutate runtime meaning.

### Minimal lawful flush pattern

```js
{
  ok: true,
  ingest_input: {
    timestamps: [...],
    values: [...],
    stream_id: "...",
    source_id: "...",
    channel: "...",
    modality: "...",
    clock_policy_id: "...",
    meta: { ... }
  }
}