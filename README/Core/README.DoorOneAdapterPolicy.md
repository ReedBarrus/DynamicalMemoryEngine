# README_DoorOneAdapterPolicy

## Purpose

This document defines the adapter policy for Door One pre-ingest sources.

It is a supporting implementation note.
It does **not** override the Master Constitution, Constitution Appendix, Workflow Contract, Repo Placement Constitution, Door One Runtime Boundary, Door One Provenance Retention note, or Door One Acceptance Checklist.

Its purpose is narrower:

* define which source classes may feed Door One,
* define the lawful pre-ingest adapter posture,
* define the required normalization boundary,
* preserve provenance across source diversity,
* prevent adapters from becoming semantic authority,
* stabilize future file / phone / IoT / device ingest work.

## Constitutional posture

Door One remains below canon.

The relevant inherited rules remain:

* runtime is not canon,
* query is not truth,
* substrate is not ontology,
* consensus is promotion-only,
* scripts and HUDs are read-side tooling only,
* pre-ingest adapters are not runtime authority.

Nothing in this note authorizes:

* canon minting,
* prediction authority,
* agency authority,
* symbolic reinterpretation,
* ontology claims,
* semantic elevation by adapter convenience.

## Core rule

All source diversity must collapse into one lawful Door One ingest boundary.

That means Door One may support many upstream sources, but they must normalize to the same bounded raw-ingest contract before entering the executive/orchestrator runtime path.

In practical terms:

source / device / file / stream
→ pre-ingest adapter
→ lawful raw ingest input (or lawful adapter flush result containing ingest-ready payload)
→ DoorOneExecutiveLane
→ Door One runtime

## Adapter classes allowed in Door One

### A. Synthetic sources

Examples:

* deterministic test signal generators,
* fixture-based signal streams,
* development-only simulated sources.

Allowed role:

* produce lawful raw ingest input directly,
* support deterministic testing and development,
* exercise the same ingest boundary used by real sources.

### B. Sampler-backed physical or semi-physical sources

Examples:

* `AnalogSamplerOp` buffered signal input,
* phone or web-audio microphone capture,
* browser-side sensor streams,
* sampled hardware telemetry.

Allowed role:

* buffer or order samples,
* preserve timing discipline,
* emit lawful ingest-ready flush output.

### C. File-backed sources

Examples:

* CSV numeric time series,
* WAV-derived sampled signals,
* structured numeric logs,
* bounded imported measurement traces.

Allowed role:

* parse a file into lawful timestamps / values / source metadata,
* normalize imported structure into the same ingest boundary,
* preserve source provenance in metadata.

### D. IoT / device / socket-backed sources

Examples:

* numeric hardware sensor feeds,
* device telemetry sockets,
* serial or networked sampled streams,
* bounded remote sensor adapters.

Allowed role:

* preserve signal ordering and source identity,
* normalize to lawful raw ingest input,
* remain below runtime semantic authority.

## Required ingest boundary

The lawful Door One ingest boundary is one of:

* a raw ingest input object, or
* a lawful pre-ingest adapter result that exposes an ingest-ready payload.

For current Door One v0.1 practice, the accepted shapes are:

* raw ingest input,
* `AnalogSamplerOp` flush result containing `ingest_input`.

## Required raw ingest fields

A lawful raw ingest payload must preserve enough measurement context for bounded structural runtime processing.

Required fields:

* `timestamps`
* `values`
* `stream_id`
* `source_id`
* `channel`
* `modality`
* `clock_policy_id`

Expected supporting metadata:

* `meta`
* source-side units if available
* sampling-rate or nominal sampling metadata if available
* adapter or import context when useful

Adapters may carry additional bounded metadata, but they must not change the semantic meaning of the ingest contract.

## Adapter obligations

A lawful Door One adapter must:

* preserve source provenance,
* preserve ordering discipline,
* preserve signal identity,
* preserve bounded timing context,
* normalize to the established ingest seam,
* fail explicitly when it cannot produce lawful ingest-ready payloads,
* remain pre-ingest only.

## Adapter prohibitions

A Door One adapter may **not**:

* mint canon,
* assign truth status,
* reinterpret substrate as ontology,
* create prediction authority,
* create agency instructions,
* silently inject symbolic meaning,
* bypass the executive ingest boundary,
* mutate runtime meaning through UI convenience,
* collapse multiple semantic layers into the adapter output.

Adapters are measurement-adjacent normalization tools, not cognition authorities.

## Provenance obligations

Adapters must preserve enough source identity that later provenance remains meaningful.

At minimum, an adapter should preserve:

* `source_id`
* `stream_id`
* channel identity
* modality identity
* relevant sampling / import context

If an adapter transforms input into a lawful flush result, that flush result must still preserve a recoverable link to the original source identity.

This supports later provenance receipts, replay reconstruction, and archive work without forcing Door One to retain every raw source forever.

## Flush-output posture

If an adapter uses a flush model, the flush result must remain bounded and lawful.

A lawful flush result may:

* indicate success/failure explicitly,
* expose `ingest_input` when successful,
* expose bounded reasons when unsuccessful.

A lawful flush result may **not**:

* claim canon,
* claim truth,
* claim semantic promotion,
* bypass ingest normalization.

## Script posture for adapters

Live runners or development scripts may choose source mode, but they may not change adapter meaning.

That means scripts may:

* select synthetic mode,
* select sampler mode,
* later select file/device/IoT adapter mode,
* feed the resulting lawful payload into the same live ingest path.

Scripts may not:

* redefine the ingest contract,
* reinterpret adapter outputs semantically,
* turn adapter selection into a higher-order runtime authority.

## Browser / UI posture for adapters

Browser or device UI may act as a source frontend, but not as a semantic authority.

Examples:

* choosing a microphone input,
* selecting a file,
* choosing a device source,
* showing adapter status.

UI may not:

* assign truth status to source selection,
* add semantic authority to adapters,
* bypass the same ingest boundary used by other sources.

## Failure posture

When an adapter cannot produce lawful ingest-ready output, it should fail explicitly and locally.

Preferred behavior:

* return a bounded error surface,
* include compact reasons,
* avoid partial semantic output,
* do not advance runtime state.

Failure at the adapter seam should not create fake runtime artifacts.

## Adapter acceptance rule

A new Door One adapter is acceptable only when all of the following are true:

* it normalizes to the lawful ingest boundary,
* it preserves source provenance,
* it remains pre-ingest only,
* it does not add semantic authority,
* it does not bypass the executive seam,
* it can be exercised through bounded tests or deterministic development workflows.

## Near-term approved direction

The following direction is explicitly supported by current Door One posture:

* synthetic sources,
* `AnalogSamplerOp` sampler-backed sources,
* future file-backed numeric sources,
* future device / IoT numeric sources,
* future phone / browser capture sources.

All of them must converge through the same bounded ingest seam.

## Explicitly not solved here

This note does **not** yet define:

* long-term replay digest design,
* archive pinning policy,
* canonical compression,
* prediction-layer source semantics,
* symbolic or agentic interpretation of adapters.

Those belong to later layers or later supporting notes.

## Practical summary

Door One supports source diversity.
Door One does **not** support ingest-boundary diversity.

That is the rule.

Many upstream sources are allowed.
One lawful ingest seam is allowed.

That is the adapter policy.
