# Door One Replay Frequency Capstone — Result Note

## Status

This note records the outcome of the bounded Door One frequency replay capstone.

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

The source family was a controlled DAW-generated sine-wave cohort rendered as bounded WAV files.

The perturbation condition used a whole-file alternate frequency relative to baseline and return while preserving:

- source family,
- waveform type,
- amplitude,
- continuity,
- duration,
- and ingest/runtime lens. :contentReference[oaicite:0]{index=0}

This experiment remained below canon.
Replay remained lens-bound.
Preservation remained preservation-only rather than authority-bearing. 

---

## Lens

The cohort was run under the established tighter audio lens:

- `Fs_target = 2400`
- `base_window_N = 1024`
- `hop_N = 512`

This lens was carried forward from the earlier successful continuity capstone because it was the first declared lens that made short perturbation structure representable as runtime state. 

---

## Cohort outcome

The experiment completed successfully as a bounded Door One replay cohort.

The manifest recorded:

- `experiment_type = "door_one_frequency_replay_capstone"`
- `perturbation_axis = "frequency"`
- `source_id = "door1.audio.daw_tone.frequency_v1"`
- `run_count = 9`
- `ok_count = 9`

with three labeled run families:
- `phase_baseline`
- `phase_perturbation`
- `phase_return`. :contentReference[oaicite:3]{index=3}

All 9 runs preserved one shared stream lineage:
`STR:door1.audio.daw_tone.frequency_v1:mono_master:audio_amplitude:wav:2400` :contentReference[oaicite:4]{index=4}

Observed structural pattern:

- all baseline runs showed:
  - `state_count = 33`
  - `basin_count = 1`
  - `segment_count = 1`

- all frequency-shift runs also showed:
  - `state_count = 33`
  - `basin_count = 1`
  - `segment_count = 1`

- all return runs again showed:
  - `state_count = 33`
  - `basin_count = 1`
  - `segment_count = 1` 

This means that, at the current declared lens, the frequency perturbation did **not** produce a distinct structural runtime regime in the same way that the earlier continuity-break cohort did. The continuity cohort, by contrast, produced `state_count = 31`, `basin_count = 5`, and `segment_count = 3` in the perturbation phase while baseline and return remained at the simpler single-regime pattern. 

---

## Cross-run reading

The session summary confirms that cross-run comparison remained available across the full 9-run cohort, with `cross_run_available = true` and `cross_run_run_count = 9`. :contentReference[oaicite:7]{index=7}

The cross-run report showed one stream scope across all 9 runs and, at the surfaced runtime/read-side level, no meaningful visible separation between baseline, perturbation, and return.
The visible signature family remained the same across the cohort, including:

- `occupancy = sticky`
- `transition_density = low`
- `continuity = smooth`
- `attention_concentration = high`
- `attention_persistence = high`

with pairwise similarity still reported as `high` and the surfaced evidence counts remaining unchanged at the reported level. :contentReference[oaicite:8]{index=8}

At the declared runtime/read-side level, the frequency-shift condition did not separate cleanly from baseline or return.

---

## Replay / retention result

This experiment succeeded at the replay-support layer.

The cohort preserved:

- bounded per-run execution,
- durable provenance receipts,
- a regenerable digest,
- and one pinned packet for the experiment cohort. 

This is sufficient to preserve the frequency cohort as a lawful reference packet for later comparison.

As required by Door One retention posture, this remains a preservation surface only.
It does **not** imply canon, truth, or promotion. 

---

## Supported claim

This experiment supports the following bounded claim:

**Under the declared Door One audio ingest/runtime lens (`Fs_target=2400`, `base_window_N=1024`, `hop_N=512`), a whole-file frequency shift on an otherwise identical continuous sine source does not produce a distinct structural runtime regime across a 9-run bounded replay cohort.**

This is a useful result.
It establishes that Door One, at the current lens, appears more sensitive to continuity/discontinuity structure than to this whole-file frequency-only perturbation. That reading is also consistent with the amplitude cohort, which likewise preserved the same single-regime pattern across baseline, perturbation, and return. 

---

## Non-claims

This experiment does **not** establish:

- that frequency is irrelevant to Door One in general,
- that no frequency-sensitive structure exists at other declared lenses,
- that multi-scale ingest or alternate transform families would show the same result,
- that the source lacked a real frequency difference,
- or that Door One has reached a final instrument boundary.

It only records the bounded result for this perturbation class under the current declared lens.

---

## Failure-class reading

This cohort does **not** indicate obvious failure in:

- source repeatability,
- ingest lawfulness,
- replay-support continuity,
- or retention integrity.

The most appropriate bounded reading is:

- **F3 — structural under-resolution / insufficient sensitivity for this perturbation class at the current lens**

That is, the source and ingest path remained lawful, but the present runtime lens did not surface a structural distinction for this frequency change.

This is a diagnostic result, not an architectural invalidation.

---

## Comparative note

The first three clean replay cohorts now give a useful early instrument map:

- **continuity perturbation**: clearly separated under the current lens 
- **amplitude perturbation**: not separated at the current lens 
- **frequency perturbation**: not separated at the current lens 

This supports the working hypothesis that the current Door One configuration is presently more continuity-sensitive than scale-sensitive.

---

## Disposition

This cohort should be treated as:

**a successful bounded negative-result reference packet for frequency sensitivity at the current Door One lens.**

It is suitable for later comparison against:

- continuity + noise,
- amplitude + noise,
- frequency + noise,
- stronger amplitude/frequency deltas,
- and later lens upgrades such as multi-scale or alternate transform families.