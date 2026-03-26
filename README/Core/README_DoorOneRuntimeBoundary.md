# README_DoorOneRuntimeBoundary

## Purpose

This document defines the operational runtime boundary for Door One.

It is a supporting normative reference for implementation discipline.
It does **not** override the Master Constitution, the Constitution Appendix, the Workflow Contract, or repo placement law.

Its role is narrower:

* make Door One seams explicit,
* reduce drift during implementation,
* preserve lawful layer order,
* clarify what may enter Door One,
* clarify what Door One may emit,
* define what remains observational only,
* forbid semantic bypass around the active runtime stack.

## Constitutional posture

Door One remains below canon.

The lawful layer order remains:

measurement → structure → runtime memory → recognition → canon → prediction → agency → ecology → symbolic → meta

For Door One v0.1:

* active layers are limited to measurement, structure, runtime memory, and bounded recognition support,
* runtime is not canon,
* query is not truth,
* substrate is not ontology,
* consensus is promotion-only,
* HUD and scripts are read-side tooling only,
* cross-run accumulation is observational only,
* workbench is an integration and inspection surface only.

## Door One mission

Door One exists to:

* accept lawful raw ingest input,
* derive bounded structural runtime artifacts,
* support repeated-run comparison,
* assemble inspection surfaces for runtime review,
* accumulate evidence for readiness without silently promoting canon.

Door One does **not** exist to:

* mint canon,
* create prediction authority,
* create agency authority,
* reinterpret substrate as ontology,
* treat display surfaces as truth surfaces,
* treat consensus as runtime state.

## Active runtime stack

The active Door One runtime stack is:

raw ingest input
→ DoorOneExecutiveLane
→ DoorOneOrchestrator
→ CrossRunSession
→ DoorOneWorkbench
→ DoorOneHUD / other read-side consumers

Current active files and roles:

* `runtime/DoorOneExecutiveLane.js` — repeated-run runtime coordinator and normalization gate
* `runtime/DoorOneOrchestrator.js` — end-to-end Door One coordinator for a single run
* `runtime/DoorOneWorkbench.js` — integration / inspection assembly surface
* `runtime/CrossRunSession.js` — observational repeated-run accumulation and comparison
* `hud/DoorOneHUD.js` — terminal inspection surface
* `hud/DoorOneStructuralMemoryHud.jsx` — browser inspection surface
* `scripts/run_door_one_live.js` — thin live runner
* `scripts/run_door_one_workbench.js` — thin workbench runner

## Boundary seams

### 1. Input seam

The lawful Door One entry payload is limited to:

* a raw ingest input object, or
* a lawful pre-ingest adapter result that normalizes to raw ingest input.

For v0.1, the accepted upstream shapes are:

* synthetic cycle input producing raw ingest input,
* `AnalogSamplerOp` flush output containing `ingest_input`.

Door One does not accept arbitrary semantic payloads.

Allowed meaning at this seam:

* timestamps,
* values,
* stream identity,
* source identity,
* channel,
* modality,
* ingest-adjacent metadata,
* clock/ingest policy references.

Forbidden at this seam:

* canon claims,
* prediction claims,
* ontology claims,
* promotion decisions,
* UI-derived interpretation,
* symbolic overlays,
* agency instructions.

### 2. Executive seam

`DoorOneExecutiveLane` is the repeated-run coordinator.

Its role is to:

* normalize allowed input shapes,
* validate the raw ingest contract,
* pass one lawful raw ingest shape inward,
* coordinate orchestrator execution,
* add the run to cross-run session context,
* request workbench assembly,
* expose latest runtime inspection surfaces.

It may not:

* reinterpret the meaning of the ingest payload,
* invent new runtime authority,
* silently promote to canon,
* accept arbitrary payload classes,
* bypass orchestrator contracts,
* make HUD/display logic authoritative.

### 3. Orchestrator seam

`DoorOneOrchestrator` is the single-run end-to-end Door One coordinator.

Its role is to:

* execute lawful Door One runtime processing,
* separate artifacts, substrate, summaries, and audit,
* produce deterministic bounded run output,
* preserve audit visibility.

It may not:

* mint canon,
* claim ontology from substrate organization,
* collapse audit into summaries,
* collapse runtime evidence into promotion.

### 4. Cross-run seam

`CrossRunSession` accumulates repeated-run evidence across runs.

Its role is to:

* retain bounded repeated-run context,
* compare run outputs observationally,
* summarize cross-run dynamics,
* support readiness inspection.

It remains:

* observational only,
* non-canonical,
* non-predictive,
* non-agential.

It may not:

* promote canon,
* replace consensus,
* act as prediction,
* define truth,
* overwrite single-run runtime evidence.

### 5. Workbench seam

`DoorOneWorkbench` is the integration and inspection surface for Door One.

Its role is to assemble:

* runtime output,
* interpretation surfaces,
* optional cross-run context,
* promotion readiness evidence,
* canon candidate dossier,
* bounded consensus review output.

It is:

* an inspection surface,
* an integration surface,
* below canon.

It may not:

* mint C1,
* promote on consensus defer,
* redefine runtime meaning,
* act as prediction,
* act as UI truth.

### 6. HUD seam

HUDs are read-side consumers only.

Examples:

* `DoorOneHUD.js`
* `DoorOneStructuralMemoryHud.jsx`

Their role is to:

* render lawful Door One outputs,
* expose provenance / runtime / readiness visibility,
* improve inspection and debugging,
* remain below canon.

HUDs may:

* shorten IDs for display,
* restyle evidence for readability,
* filter visible inspection content,
* choose read-side projection layouts.

HUDs may not:

* alter runtime data,
* alter workbench meaning,
* invent motion not grounded in data updates,
* turn display choices into semantic authority,
* produce promotion outcomes,
* back-feed into runtime meaning.

### 7. Promotion seam

Consensus remains an explicit promotion boundary only.

In Door One v0.1:

* consensus review may inspect bounded candidate material,
* consensus review may emit review posture,
* consensus review does not mint canon,
* defer does not promote,
* readiness does not promote,
* dossier existence does not promote.

Canon remains outside Door One runtime operation.

## Pre-ingest adapter posture

`AnalogSamplerOp` is a pre-ingest adapter.

It is not:

* a runtime authority layer,
* a canon layer,
* a semantic interpretation layer.

Its role is to:

* buffer sample input,
* preserve timing/ordering discipline,
* emit lawful ingest-ready payloads through flush output.

Future device adapters may exist, including:

* phone / web audio sources,
* file import sources,
* IoT numeric sources,
* hardware sensor adapters,
* other physical or synthetic sources.

All such adapters must normalize to the same lawful Door One ingest boundary.

## Script posture

Scripts remain thin wrappers only.

Examples:

* `run_door_one_live.js`
* `run_door_one_workbench.js`

Scripts may:

* choose source mode,
* call the executive lane,
* write inspection artifacts,
* print summaries,
* support bounded developer workflows.

Scripts may not:

* redefine runtime semantics,
* bypass executive/orchestrator contracts,
* create hidden authority,
* mint canon,
* replace workbench or HUD semantics.

## Browser HUD posture

The structural memory HUD is a browser-side read surface over exported Door One outputs.

Its current purpose is limited to:

* structural memory inspection,
* transition visibility,
* segment boundary visibility,
* run health visibility,
* readiness / consensus separation.

It is not an animation target, ontology viewer, or symbolic layer.
Any future visual dynamics should arise from actual data updates, not arbitrary decoration.

## Allowed evidence mappings

The following display mappings are lawful because they remain read-side and evidence-backed:

* node size from dwell / activity,
* node emphasis from current neighborhood,
* edge thickness from transition count or share,
* segment panel from actual segment boundary evidence,
* readiness panel from readiness report,
* consensus panel from bounded review posture,
* short display IDs derived from full IDs without altering stored evidence.

## Forbidden bypasses

The following are explicitly forbidden:

* HUD → runtime semantic backfeed
* HUD → canon inference
* cross-run → canon promotion
* workbench → canon minting
* script-level reinterpretation replacing executive/orchestrator contracts
* arbitrary payload injection into executive lane
* pre-ingest adapter becoming runtime authority
* consensus defer treated as promotion
* display styling treated as evidence
* substrate organization treated as ontology
* query or filter state treated as truth

## Continuous ingest posture

Continuous or quasi-live ingest may be added later.

When it is added:

* runtime behavior must remain lawful under the same Door One seams,
* data retention / output management must remain bounded,
* HUD motion must arise from updated evidence, not decorative animation,
* continuous read surfaces must remain inspection-only.

Continuous ingest does not change Door One’s constitutional scope.

## Stabilization rule

When implementation wobble occurs, the recovery order is:

1. return to the lowest lawful seam,
2. restate the active boundary,
3. patch only the smallest broken surface,
4. avoid aesthetic escalation,
5. preserve provenance and legitimacy separation,
6. resume only after the evidence mapping is correct.

## Practical summary

Door One should currently be thought of as:

* a bounded structural runtime,
* a repeated-run observational memory surface,
* a readiness accumulation environment,
* an inspection-first system below canon.

The correct mental model is:

signal
→ bounded runtime structure
→ repeated-run observational memory
→ workbench inspection surface
→ HUD / runner visibility

not:

signal
→ canon
or
HUD
→ truth
or
cross-run
→ promotion

## Status note for v0.1

Current implementation posture:

* executive lane is active,
* orchestrator is active,
* workbench is active,
* terminal HUD is active,
* browser HUD is active as a read-side structural inspection surface,
* synthetic and sampler-backed ingest paths now converge through the same lawful raw ingest boundary,
* consensus remains explicit and non-promoting in Door One v0.1.

This is the intended stabilized runtime boundary for the current Door One phase.
