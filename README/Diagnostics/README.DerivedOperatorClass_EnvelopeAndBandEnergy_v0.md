# README_DerivedOperatorClass_EnvelopeAndBandEnergy_v0.md

# Dynamical Memory Engine — Derived Operator Class v0
## RMS / Energy Envelope and Band-Energy Preview

## Status

This document defines a new supporting implementation posture for **derived operators** in Door One.

It is a supporting reference and implementation-guidance note.

It does **not** override:

- `README_MasterConstitution.md`
- `README_ConstitutionAppendix.md`
- `README_WorkflowContract.md`
- `README_RepoPlacementConstitution.md`
- `README_DoorOneRuntimeBoundary.md`
- `README_DoorOneAdapterPolicy.md`
- `README_DoorOneAcceptanceChecklist.md`
- `README_IngestAdapterMatrix_v0.md`
- `README_DoorOneMultiScaleIngest.md`
- `README_ContinuousIngestRetentionLadder.md`

Its purpose is narrower:

- define the constitutional role of a **derived operator class**,
- define the first derived trace candidate: **RMS / energy envelope**,
- preview the second likely derived trace candidate: **band-energy distribution**,
- define where these operators belong in the architecture,
- define how they remain lawful and provenance-preserving,
- define the experimental pathway by which such traces may later inform stronger recognition or canon layers,
- without smuggling in semantics, truth, or promotion.

---

## 1. Constitutional posture

Door One remains below canon.

A derived operator is:

- **not** raw source,
- **not** canon,
- **not** trusted interpretation,
- **not** prediction,
- **not** ontology,
- **not** a semantic meaning layer.

A derived operator is:

- a declared, deterministic, pre-ingest derivation,
- preserving lawful lineage back to a raw source family,
- producing an additional bounded observational trace,
- for replay-honest structural comparison.

This means:

- runtime is not canon,
- substrate is not ontology,
- replay remains lens-bound,
- preservation remains preservation-only,
- derived traces remain derived.

If a derived trace later contributes to stronger recognition or canon work, that occurs only through later explicit layers.
The existence of a derived trace does **not** by itself uplift authority.

---

## 2. Why a derived operator class is needed

The recent replay capstones established an early instrument map:

- continuity perturbation separates clearly,
- continuity under noise remains detectable but changes structural expression,
- whole-file amplitude shifts remain structurally flat,
- whole-file frequency shifts remain structurally flat,
- smaller declared temporal support enriches continuity representation,
- but does not by itself rescue amplitude or frequency separation.

This suggests that the current Door One audio path is stronger at preserving **temporal organization / rupture geometry** than **stationary scale geometry**.

The likely issue is not that the source contains no amplitude or frequency difference.
The likely issue is that the current declared observation layer — a single mono amplitude trace — does not preserve stationary scale as a first-class explicit observation strongly enough for the current runtime summaries to surface it.

Therefore, the next smallest lawful expansion is not a semantic layer.
It is a **new declared derived observation**.

---

## 3. Definition — Derived operator class

A **derived operator** is a deterministic operator that:

- takes a lawful upstream signal representation,
- computes a bounded derived observational trace,
- preserves explicit lineage to the source family and derivation policy,
- emits a new lawful ingest candidate or lawful intermediate trace,
- and remains fully below runtime semantic authority.

### Derived operators are not:

- adapters that redefine source meaning,
- hidden transforms that silently alter runtime semantics,
- compression logic,
- anomaly judgments,
- canon candidates,
- read-side summaries,
- promotion signals.

### Derived operators are:

- declared observation constructors,
- pre-ingest or pre-runtime derivation tools,
- lineage-preserving feature generators.

A derived trace must remain legible as:

- **what source family it came from**
- **what derivation policy created it**
- **what modality it now represents**
- **what declared lens or window family was used**
- **what is raw vs what is derived**

---

## 4. Placement rule

New derived operators should live in `operators/` by primary responsibility, not convenience. :contentReference[oaicite:3]{index=3}

### Recommended placement

Preferred new zone:

```text
operators/derived/

Initial candidate files:

operators/derived/EnergyEnvelopeOp.js
operators/derived/BandEnergyOp.js

If repo growth policy prefers not to add a new top-level operator zone immediately, the conservative fallback is:

operators/transform/EnergyEnvelopeOp.js
operators/transform/BandEnergyOp.js
Placement intent

The purpose of the derived class is to keep these traces:

explicit,
reusable,
provenance-preserving,
and visibly separate from compression, anomaly, or read-side interpretation.

This is important because compression should not silently decide what the observation is, and read-side layers should not be the place where new observational geometry is created.

5. Chain placement

The intended chain is:

source waveform / numeric source
  → lawful raw source normalization
  → primary trace
  → derived operator(s)
  → additional lawful ingest candidate(s)
  → DoorOneExecutiveLane
  → Door One runtime

For audio, the immediate target is:

source WAV
  → mono amplitude trace
  → raw amplitude ingest candidate
  → EnergyEnvelopeOp
  → RMS / energy envelope ingest candidate
  → DoorOneExecutiveLane

This means the RMS/envelope trace is parallel to the amplitude trace, not hidden inside it.

This preserves the ability to compare:

what the raw amplitude trace conserves,
what the derived envelope trace conserves,
what each one loses,
and what later fusion is justified.

That is the correct posture while the architecture is still experimentally grounding its observational basis.

6. RMS / energy envelope — first derived trace
Purpose

The first derived trace should answer the simplest broad question:

How much signal is present over time?

That makes RMS / energy envelope the most reasonable next derived operator because it is:

the smallest conceptual expansion,
broadly applicable across audio, IoT, analog telemetry, biosignals, and many other scalar sources,
directly relevant to current amplitude sensitivity blind spots,
useful for later uncertainty / salience / stability modeling,
and still safely below semantics.
Why RMS / energy envelope first

The current replay experiments suggest that whole-file amplitude changes are not becoming structurally legible through the current amplitude-only observation layer.

An energy envelope makes signal magnitude an explicit first-class trace rather than leaving it implicit inside the waveform.

This is the smallest lawful way to test whether scale-awareness can be improved without jumping to heavy spectral machinery.

7. RMS / energy envelope operator contract
Operator name

Recommended:

EnergyEnvelopeOp
Primary responsibility

Given one scalar source trace, produce one scalar derived trace representing local energy / RMS / envelope over time under a declared window policy.

Input

A lawful upstream scalar trace with recoverable source identity and timing context.

For the first audio experiments, this means:

timestamps
mono amplitude values
source family metadata
declared sample-rate context
declared derivation window policy
Output

A lawful derived scalar trace preserving:

timestamps for the envelope samples,
values representing energy / RMS / envelope magnitude,
source lineage,
derivation policy metadata,
explicit derived modality.
Recommended modality name

Examples:

audio_rms_envelope
audio_energy_envelope

Choose one canonical term and keep it stable.

Provenance requirements

The derived trace must preserve at minimum:

original source_id
derived stream_id
source modality
derived modality
source channel identity
derivation operator id
derivation policy id
derivation window policy
declared lens context when relevant
bounded reference to the source trace family

This matches the general requirement that later preservation must keep source_id, stream_id, modality identity, lens context, and explicit derived-vs-durable status recoverable.

8. Stream and source semantics for derived traces

The source/stream distinction remains important.

Source identity

The derived envelope trace should preserve the same source family root as the raw trace.

Example source family root:

door1.audio.daw_tone.amplitude_delta12_v1
Stream identity

The derived trace should use a different stream lineage from the raw amplitude trace, because it is a different observation.

The raw amplitude trace and the derived envelope trace are related, but they are not the same stream.

Recommended pattern

Keep:

source family continuity in metadata
explicit derivation identity in the derived stream/modality

For example:

raw modality: audio_amplitude
derived modality: audio_rms_envelope

This lets downstream replay and comparison say:

same source family,
different declared observational trace.

That is the correct semantics.

9. Ingest posture for derived traces

A derived trace is still required to converge through the same lawful ingest seam.

That means a derived ingest candidate must still preserve:

timestamps
values
stream_id
source_id
channel
modality
clock_policy_id
bounded metadata

A derived trace is not a second ingest ontology.

It is a new lawful trace entering the same bounded ingest boundary.

This preserves the rule:

Door One supports source diversity.
Door One does not support ingest-boundary diversity.

10. What this first pass is and is not trying to solve
This pass is trying to test:
whether explicit energy/scale awareness makes stationary amplitude changes more legible,
whether a parallel derived trace preserves useful geometry absent from the raw amplitude-only path,
whether the current runtime becomes more informative when fed a lawful scale-aware observation.
This pass is not trying to solve:
speech modeling,
canon formation,
semantic content recognition,
high-dimensional anomaly geometry,
full uncertainty modeling,
final multi-scale policy,
fused multi-trace runtime semantics.

Those remain later steps.

11. Experimental pathway for RMS / energy envelope
First experiment target

Use the derived envelope trace on a cohort that is currently flat in the raw amplitude path.

Recommended first cohort:

amplitude_delta12

Reason:

it is the blind spot the new trace is most directly meant to address.
Comparison posture

Run:

raw amplitude cohort result
derived energy/envelope cohort result

using the same:

source files,
run labels,
retention flow,
replay posture,
and declared experiment framing

Then compare:

whether the derived trace separates perturbation from baseline/return,
whether control remains stable,
whether the new trace changes runtime structure or merely density,
whether replay support remains equally lawful.
Acceptance question

The question is not:

“did we make the model smarter?”

The question is:

Did the new declared observational trace preserve a scale difference that the raw amplitude trace did not surface?

That is the right first test.

12. Band-energy — second derived trace preview

If RMS / energy envelope is the first derived scale-aware trace, the likely next derived trace is:

BandEnergyOp
Purpose

Band-energy answers a different question:

Where in the signal is the activity distributed?

That is the next useful trace for:

stationary frequency sensitivity,
spectral distribution shifts,
speech-like form changes,
broader signal family differentiation.
Why band-energy follows RMS / envelope

Because band-energy is:

richer than a single envelope,
more directly relevant to the current frequency blind spot,
but also more complex.

RMS/envelope is the smaller, broader first step.
Band-energy is the next justified step once the scale question is made explicit.

Constitutional posture

Band-energy should follow the same rules:

explicit derivation,
explicit modality,
same lawful ingest seam,
explicit source lineage,
no semantic uplift,
no hidden fusion.
13. Relationship to multi-scale

This document does not activate passive multi-scale ingest by itself.

However, derived traces and declared multi-scale are likely complementary.

A derived trace answers:

what observational family is being preserved?

A multi-scale comparison answers:

at what support size is that family legible?

So the long-run trajectory may be:

raw amplitude
derived energy/envelope
derived band-energy
declared multi-scale comparison across one or more of those traces

But the current step is only:

define and test one new derived trace lawfully and explicitly.

14. Constitutional pathway toward later canon relevance

A derived trace can later contribute to stronger recognition or canon work only through explicit later layers.

The pathway remains:

source
  → lawful raw / derived traces
  → Door One runtime comparison
  → replay-honest repeated evidence
  → later recognition / review layers
  → explicit promotion boundary
  → canon only if legitimacy criteria are met elsewhere

This means:

derived traces can strengthen evidence,
derived traces can improve replay-honest discrimination,
derived traces can support later canon work,

but:

derived traces do not themselves mint canon,
derived traces do not themselves prove ontology,
derived traces do not themselves create truth.

That is the lawful staircase.

15. Practical next implementation steps
Step 1

Stabilize the concept of a derived operator class in repo placement and README guidance.

Step 2

Implement the smallest EnergyEnvelopeOp.

Step 3

Emit one derived envelope trace as a first-class sibling ingest candidate.

Step 4

Run one bounded replay experiment on amplitude_delta12 using the envelope trace.

Step 5

Compare:

raw amplitude result
envelope-derived result
Step 6

Only after that, decide whether BandEnergyOp has earned implementation.

16. Summary

The next lawful representation expansion for Door One is not a semantic layer.

It is:

a declared derived operator class,
beginning with RMS / energy envelope,
preserving lineage explicitly,
entering through the same lawful ingest seam,
and tested first as a parallel sibling observation to the existing amplitude trace.

This is the smallest reasonable step toward richer scale-awareness while preserving:

provenance,
replay honesty,
boundedness,
and constitutional discipline.

Band-energy is the likely next derived trace after that, but remains a preview until the envelope pass is experimentally grounded.