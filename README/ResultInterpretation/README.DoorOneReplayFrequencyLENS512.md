# Door One Replay Frequency Capstone Lens512 — Result Note

## Status

This note records the outcome of the bounded Door One frequency replay capstone under the smaller declared lens:

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
- one perturbation axis (`frequency`),
- one bounded 9-run cohort:
  - 3 baseline runs,
  - 3 perturbation runs,
  - 3 return runs.

The perturbation condition used a whole-file alternate frequency while preserving:

- waveform type,
- amplitude,
- continuity,
- duration,
- and ingest/runtime path.

---

## Lens

This lens pass used:

- `Fs_target = 2400`
- `base_window_N = 512`
- `hop_N = 256`

The purpose of the pass was to test whether the smaller temporal support would make the stationary frequency perturbation structurally visible after the earlier `1024/512` frequency cohort remained flat. :contentReference[oaicite:14]{index=14}

---

## Cohort outcome

The experiment completed successfully as a bounded Door One replay cohort.

The manifest recorded:

- `experiment_type = "door_one_frequency_replay_capstone_lens512"`
- `perturbation_axis = "frequency"`
- `run_count = 9`
- `ok_count = 9` :contentReference[oaicite:15]{index=15}

Observed structural pattern:

- all baseline runs showed:
  - `state_count = 67`
  - `basin_count = 1`
  - `segment_count = 1`

- all frequency-shift runs also showed:
  - `state_count = 67`
  - `basin_count = 1`
  - `segment_count = 1`

- all return runs again showed:
  - `state_count = 67`
  - `basin_count = 1`
  - `segment_count = 1` :contentReference[oaicite:16]{index=16}

This means the smaller lens did **not** make the frequency perturbation structurally visible.

---

## Comparative reading against prior frequency cohort

The earlier frequency cohort at `1024/512` already showed no structural separation between baseline, perturbation, and return. 

Under the smaller `512/256` lens, the state density increased for all runs (`33 → 67`), but the frequency perturbation still did not separate from baseline or return.

So, as with amplitude, the smaller lens changed representational density but **not** perturbation discriminability.

---

## Cross-run reading

The cross-run report remained completely flat at the surfaced level:

- one stream scope across all 9 runs,
- visible signature labels unchanged across baseline, perturbation, and return,
- `similarity = high` throughout,
- surfaced evidence deltas all zero. :contentReference[oaicite:18]{index=18}

At the declared runtime/read-side level, the frequency perturbation did not separate cleanly from baseline or return.

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

**Under the smaller declared Door One lens (`Fs_target=2400`, `base_window_N=512`, `hop_N=256`), a whole-file frequency shift on an otherwise identical continuous sine source still does not produce a distinct structural runtime regime across a 9-run replay cohort.**

This indicates that the earlier frequency flatness is not explained solely by the larger `1024/512` support size.

---

## Non-claims

This experiment does **not** establish:

- that frequency is irrelevant to Door One in general,
- that no frequency-sensitive structure exists at other declared lenses or modalities,
- or that larger frequency separations would necessarily behave the same.

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

The smaller temporal lens did not resolve the frequency perturbation into a distinct runtime regime.

---

## Comparative note

Taken together with the continuity lens512 control, this frequency lens512 cohort supports the following early lens-pass conclusion:

- smaller support enriches continuity perturbation representation,
- but smaller support alone does **not** rescue amplitude or frequency perturbation sensitivity in the current Door One representation.  

---

## Disposition

This cohort should be treated as:

**a successful bounded negative-result lens-comparison packet for frequency sensitivity, showing that shrinking temporal support alone does not rescue stationary frequency discrimination in the current Door One representation.**