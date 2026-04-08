# Dynamical Memory Engine — Companion Lane Families v0

## Status

This document defines the bounded companion-lane families for the rebuilt Door One operator floor.

It is a supporting operator-architecture note.

It does **not** override:

* `README_MasterConstitution.md`
* `README_WorkflowContract.md`
* `README.StructuralIdentityLaw.md`
* `README.DeclaredVsMechanizedAudit.md`
* `README.MechanizationClosureGate.md`
* `README.PacketWorkflowChain.md`
* `README_DoorOneDevelopmentalOutline.md`
* `README/core/OperatorLane/README.OperatorLanesContract.md`
* `README.PrimaryPipelineArchitecture.v0.md`
* `README.IngestFloorContract.v0.md`

Its purpose is narrower:

* define the companion emission families adjacent to the primary lane,
* make lineage, accounting, diagnostics, and tertiary interpretation explicit,
* prevent companion-lane jobs from collapsing into one mixed support bucket,
* define narrow floor-local shapes for the first temporal admission use case,
* and give later floor contracts stable companion families to mirror upward.

This note governs **companion-lane family posture** only.

It does **not** govern:

* primary-lane artifacts,
* human-facing read-side planes,
* full future regime-general schemas,
* canon activation,
* or final interpretation architecture.

---

## 1. Why this note exists

The rebuilt floor already distinguishes:

* `P` — primary structural emission,
* `V` — validation,
* and read-side projection planes.

What remained fuzzy were the companion families adjacent to the primary lane.

Without explicit companion-family law, the system risks rebuilding the old mixed bundle problem one level over by letting provenance, accounting, diagnostics, and interpretation recombine into one generic support object.

This note exists to stop that drift.

One-line summary:

**Companion lanes are a split family, not a junk drawer: lineage is not accounting, accounting is not diagnostics, diagnostics are not interpretation.**

---

## 2. Core companion rule

**Every companion object must answer exactly one bounded companion question.**

Corollary rules:

* lineage is not accounting,
* accounting is not diagnostics,
* diagnostics are not validation,
* interpretation is not any of the above,
* and no companion object may silently inherit multiple jobs because “support” feels close enough.

If a companion object answers more than one lane-family question, it fails this contract.

---

## 3. Active companion families

The current rebuilt floor recognizes four companion families:

* `L` — lineage / provenance
* `A` — applied transform / accounting
* `D` — diagnostics / validation-adjacent technical observation
* `T` — tertiary review / interpretation

At v0:

* `L`, `A`, and `D` are active companion families
* `T` is declared but deferred from active implementation

Validation (`V`) remains separate and is **not** part of the companion family set.

---

## 4. Shared companion header

All active companion objects should share a narrow header:

```ts
type CompanionHeader = {
  primary_handle: string;
  companion_handle: string;
};
```

This shared header exists only to preserve explicit attachment to one primary artifact.

It does **not** justify shared mixed bodies.

---

## 5. L — Lineage / provenance family

## 5.1 Core question

`L` answers:

**Where did this primary object come from?**

## 5.2 Family role

Lineage/provenance exists to preserve source-local and chain-local origin references.

It may include:

* source handles,
* ingest event ids,
* operator ids,
* operator versions,
* source-local channel identity,
* source-local modality identity,
* and later chain linkage.

It may not include:

* diagnostics,
* accounting,
* validation,
* or interpretation.

## 5.3 Floor-local v0 shape

For the first temporal regime use case (`.wav` and live microphone stream):

```ts
type L0_IngestLineage = {
  lane: "L";
  lineage_class: "L0_IngestLineage";
  companion_handle: string;
  primary_handle: string;

  source_kind: "wav" | "live_stream";
  source_ref: string;

  channel_ref?: string;
  modality_ref: "audio";

  ingest_event_id: string;
  operator_id: "IngestOp";
  operator_version: string;
};
```

## 5.4 Notes

* `source_ref` is the source-local anchor for the admitted signal
* `.wav` burden lives here more than in `P0`
* live stream source identity also lives here
* lineage is allowed to identify the source; it is not allowed to evaluate it

---

## 6. A — Applied transform / accounting family

## 6.1 Core question

`A` answers:

**What operation was declared and/or applied at this operator boundary?**

## 6.2 Family role

Accounting exists to record declared and applied operator facts without putting them on the primary object.

It may include:

* admission mode,
* timestamp mode,
* encoding mode,
* declared mutation posture,
* declared alignment mode,
* declared transform mode,
* and later operator-local configuration records.

It may not include:

* provenance,
* diagnostics,
* validation,
* or interpretation.

## 6.3 Floor-local v0 shape

For the first temporal regime use case:

```ts
type A0_IngestAccounting = {
  lane: "A";
  accounting_class: "A0_IngestAccounting";
  companion_handle: string;
  primary_handle: string;

  admission_mode: "file_decode" | "stream_capture";
  value_encoding: "pcm16" | "float32" | "float64" | "unknown";
  timestamp_mode: "source_provided" | "capture_assigned";

  declared_mutation: "none";
};
```

## 6.4 Notes

* this object records how admission occurred
* it also records that ingest itself performed no corrective mutation
* later operators can widen `A` only by staying inside the same accounting question

---

## 7. D — Diagnostics family

## 7.1 Core question

`D` answers:

**What technical facts were observed about the primary object or emission event?**

## 7.2 Family role

Diagnostics exists for measured technical observations.

It may include:

* sample counts,
* signal summaries,
* timestamp irregularity indicators,
* clipping indicators,
* gap indicators,
* optional diagnostic projections,
* and later operator-local residual or health observations.

It may not include:

* provenance,
* accounting,
* validation pass/fail judgment,
* or interpretation.

## 7.3 Floor-local v0 shape

For the first temporal regime use case:

```ts
type D0_IngestDiagnostics = {
  lane: "D";
  diagnostics_class: "D0_IngestDiagnostics";
  companion_handle: string;
  primary_handle: string;

  sample_count: number;

  value_min?: number;
  value_max?: number;
  value_rms?: number;

  repeated_timestamp_count?: number;
  non_monotonic_timestamp_count?: number;
  estimated_gap_count?: number;

  clipping_detected?: boolean;
};
```

## 7.4 Notes

* repeated timestamps, missed-sample suspicion, and jitter-like irregularity indicators belong here rather than in `V`
* diagnostics may later project alternate technical planes, including time/frequency previews, but those remain diagnostic, not primary

One-line distinction:

**Diagnostics ask what technical facts were observed. Validation asks whether the contract was satisfied.**

---

## 8. T — Tertiary review / interpretation family

## 8.1 Core question

`T` answers:

**What review, advisory, semantic, or interpretive posture is being expressed about the object?**

## 8.2 Family role

`T` is the future family for:

* semantic overlays,
* review packets,
* query/review objects,
* language-kernel frames,
* canon-candidate support objects,
* and bounded advisory/readiness outputs.

It must remain explicitly separate from `L`, `A`, and `D`.

## 8.3 v0 posture

At v0, `T` is declared but deferred.

A placeholder declaration shape is sufficient:

```ts
type T0_Deferred = {
  lane: "T";
  tertiary_class: "T0_Deferred";
  companion_handle: string;
  primary_handle: string;

  status: "declared_but_deferred";
};
```

## 8.4 Notes

This family is intentionally not active on the current rebuilt floor.

At the floor-contract level, this deferred posture should be mirrored explicitly as the pipeline rises:

* `T0` declared but deferred at ingest
* `T1` declared but deferred at clock alignment
* `T2` declared but deferred at windowing
* `T3` declared but deferred at transform

This keeps tertiary posture expected and bounded without silently admitting interpretation into the active structural floor.

---

## 9. TemporalRegime v0 scope note

The companion shapes in this note are floor-local and regime-local.

They are written specifically for the current TemporalRegime rebuild, using:

* `.wav` as the first file admission case
* live microphone stream as the first stream admission case
* audio modality as the initial active modality

These shapes should not yet be mistaken for universal multi-regime schemas.

DerivedRegime and SymbolicRegime may later require their own companion variants.

---

## 10. Companion-family failure conditions

A companion-family object fails this note if:

1. it answers more than one family question,
2. it mixes provenance with diagnostics,
3. it mixes accounting with provenance,
4. it mixes diagnostics with validation judgment,
5. it carries review/semantic posture while pretending to be `L`, `A`, or `D`,
6. or it attempts to replace the primary object rather than remain explicitly attached to it.

---

## 11. Relationship to validation and planes

Companion families are adjacent to the primary lane, but they are not the same as:

* `V` — validation objects, which answer contract-conformance questions
* read-side planes, which project emitted objects for human inspection

This distinction remains active law.

---

## 12. Non-goals

This note does not yet define:

* universal regime-agnostic companion schemas,
* exact `L1/A1/D1` or later shapes,
* final tertiary lane architecture,
* or any read-side plane contract.

Those require later bounded notes.

---

## 13. One-line operational summary

**Companion Lane Families v0 defines `L`, `A`, `D`, and deferred `T` as separate single-job attachment families keyed to one primary object, preventing provenance, accounting, diagnostics, and interpretation from collapsing back into one mixed support artifact.**
