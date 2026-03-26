# Door One Replay Amplitude Delta12 Capstone Lens512 — Result Note

## Status

This note records the outcome of the bounded Door One amplitude-delta12 replay capstone under the smaller declared lens:

- `Fs_target = 2400`
- `base_window_N = 512`
- `hop_N = 256`

It is a supporting experiment note.
It does **not** mint canon, truth, ontology, promotion, or prediction authority.

---

## Experiment posture

This experiment used:

- one source family,
- one shared stream lineage,
- one declared lens family,
- one perturbation axis (`amplitude`),
- one bounded 9-run cohort:
  - 3 baseline runs,
  - 3 perturbation runs,
  - 3 return runs.

The perturbation condition used a stronger whole-file amplitude shift:
baseline / return at `-6 dB` and perturbation at `-18 dB`, for a total delta of `12 dB`.

---

## Lens

This lens pass used:

- `Fs_target = 2400`
- `base_window_N = 512`
- `hop_N = 256`

The purpose of the pass was to test whether the smaller temporal support would make a stronger amplitude perturbation structurally visible after amplitude remained flat at the earlier `1024/512` lens. :contentReference[oaicite:8]{index=8}

---

## Cohort outcome

The experiment completed successfully as a bounded Door One replay cohort.

The manifest recorded:

- `experiment_type = "door_one_amplitude_delta12_replay_capstone_lens512"`
- `perturbation_axis = "amplitude"`
- `run_count = 9`
- `ok_count = 9` :contentReference[oaicite:9]{index=9}

Observed structural pattern:

- all baseline runs showed:
  - `state_count = 67`
  - `basin_count = 1`
  - `segment_count = 1`

- all amplitude-shift runs also showed:
  - `state_count = 67`
  - `basin_count = 1`
  - `segment_count = 1`

- all return runs again showed:
  - `state_count = 67`
  - `basin_count = 1`
  - `segment_count = 1` :contentReference[oaicite:10]{index=10}

This means the smaller lens did **not** make the amplitude-delta12 perturbation structurally visible.

---

## Comparative reading against prior amplitude cohorts

The earlier amplitude cohorts already showed no structural separation at `1024/512` for:

- a moderate amplitude shift
- and a stronger `delta12` amplitude shift. 

Under the smaller `512/256` lens, the state density increased for all runs (`33 → 67`), but the perturbation still did not separate from baseline or return.

So the smaller lens changed representational density, but **not** amplitude discriminability.

---

## Cross-run reading

The cross-run report remained completely flat at the surfaced level:

- one stream scope across all 9 runs,
- visible signature labels unchanged across baseline, perturbation, and return,
- pairwise similarity still `high`,
- surfaced evidence deltas all zero. :contentReference[oaicite:12]{index=12}

At the declared runtime/read-side level, the amplitude perturbation did not separate cleanly from baseline or return.

---

## Replay / retention result

This experiment succeeded at the replay-support layer.

The cohort preserved:

- bounded per-run execution,
- durable provenance receipts,
- a regenerable digest,
- and one pinned packet for the experiment cohort. 

This remains a preservation surface only.
It does **not** imply canon, truth, or promotion.

---

## Supported claim

This experiment supports the following bounded claim:

**Under the smaller declared Door One lens (`Fs_target=2400`, `base_window_N=512`, `hop_N=256`), a whole-file 12 dB amplitude shift on an otherwise identical continuous sine source still does not produce a distinct structural runtime regime across a 9-run replay cohort.**

This indicates that the earlier amplitude flatness is not explained solely by the larger `1024/512` support size.

---

## Non-claims

This experiment does **not** establish:

- that amplitude is irrelevant to Door One in general,
- that no amplitude-sensitive structure exists at other declared lenses or modalities,
- or that stronger amplitude shifts would necessarily behave the same.

It records the bounded result for this perturbation class under this declared lens only.

---

## Failure-class reading

This cohort does **not** indicate obvious failure in:

- source repeatability,
- ingest lawfulness,
- replay-support continuity,
- or retention integrity.

The most appropriate bounded reading remains:

- **F3 — structural under-resolution / insufficient sensitivity for this perturbation class in the current representation**

The smaller temporal lens did not resolve the amplitude perturbation into a distinct runtime regime.

---

## Disposition

This cohort should be treated as:

**a successful bounded negative-result lens-comparison packet for amplitude sensitivity, showing that shrinking temporal support alone does not rescue amplitude-delta12 discrimination in the current Door One representation.**