# Door One Replay Amplitude Capstone — Result Note

## Status

This note records the outcome of the bounded Door One amplitude replay capstone.

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

The source family was a controlled DAW-generated sine-wave cohort rendered as bounded WAV files.

The perturbation condition used a whole-file amplitude reduction relative to baseline and return while preserving:

- source family,
- waveform type,
- frequency,
- continuity,
- duration,
- and ingest/runtime lens.

The experiment remained below canon and preservation remained preservation-only. Replay remained lens-bound. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}

---

## Lens

The cohort was run under the established tighter audio lens:

- `Fs_target = 2400`
- `base_window_N = 1024`
- `hop_N = 512`

This lens was carried forward from the prior audio slice capstone because the earlier coarser support had under-resolved short perturbation structure. :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4}

---

## Cohort outcome

The experiment completed successfully as a bounded Door One replay cohort.

The manifest recorded:

- `experiment_type = "door_one_amplitude_replay_capstone"`
- `source_id = "door1.audio.daw_tone.amplitude_v1"`
- `run_count = 9`
- `ok_count = 9`

with three labeled run families:
- `phase_baseline`
- `phase_perturbation`
- `phase_return`. :contentReference[oaicite:5]{index=5}

All 9 runs preserved one shared stream lineage:
`STR:door1.audio.daw_tone.amplitude_v1:mono_master:audio_amplitude:wav:2400`

with:

- `sample_count = 12000`
- `duration_sec = 5`
- durable receipt references per run. :contentReference[oaicite:6]{index=6}

Observed structural pattern:

- all baseline runs showed:
  - `state_count = 33`
  - `basin_count = 1`
  - `segment_count = 1`

- all amplitude-shift runs also showed:
  - `state_count = 33`
  - `basin_count = 1`
  - `segment_count = 1`

- all return runs again showed:
  - `state_count = 33`
  - `basin_count = 1`
  - `segment_count = 1` :contentReference[oaicite:7]{index=7}

This means that, at the current declared lens, the amplitude perturbation did **not** produce a distinct structural regime in the same way that the earlier continuity-break cohort did.

---

## Cross-run reading

The session summary confirms that cross-run comparison remained available across the full 9-run cohort, with `cross_run_available = true` and `cross_run_run_count = 9`. :contentReference[oaicite:8]{index=8}

The cross-run surface in the final workbench shows:

- one stream ID across the cohort,
- all 9 run labels present,
- baseline and amplitude-shift entries carrying the same visible signature family:
  - `occupancy = sticky`
  - `transition_density = low`
  - `continuity = smooth`
  - `attention_concentration = high`
  - `attention_persistence = high`

with matching visible evidence counts:
- `state_count = 33`
- `basin_count = 1`
- `segment_count = 1`
- `total_transitions = 0`
- `dominant_dwell_share = 1`. :contentReference[oaicite:9]{index=9}

At the reported runtime/read-side level, the amplitude-shift condition did not separate cleanly from baseline or return.

---

## Replay / retention result

This experiment succeeded at the replay-support layer.

The cohort preserved:

- bounded per-run execution,
- durable provenance receipts,
- a regenerable digest,
- and one pinned packet for the experiment cohort. :contentReference[oaicite:10]{index=10} :contentReference[oaicite:11]{index=11} :contentReference[oaicite:12]{index=12}

This is sufficient to preserve the amplitude cohort as a lawful reference packet for later comparison.

As required by Door One retention posture, this remains a preservation surface only.
It does **not** imply canon, truth, or promotion. :contentReference[oaicite:13]{index=13} :contentReference[oaicite:14]{index=14}

---

## Supported claim

This experiment supports the following bounded claim:

**Under the declared Door One audio ingest/runtime lens (`Fs_target=2400`, `base_window_N=1024`, `hop_N=512`), a whole-file amplitude reduction on an otherwise identical continuous 300 Hz sine source does not produce a distinct structural runtime regime across a 9-run bounded replay cohort.**

This is a useful result.
It establishes that Door One, at the current lens, appears more sensitive to continuity/discontinuity structure than to this moderate amplitude-only perturbation.

---

## Non-claims

This experiment does **not** establish:

- that amplitude is irrelevant to Door One in general,
- that no amplitude-sensitive structure exists at other declared lenses,
- that multi-scale ingest or other transform families would show the same result,
- that the source lacked a real amplitude difference,
- or that Door One has reached a final instrument boundary.

It only records the bounded result for this perturbation class under the current declared lens. Door One remains below canon. :contentReference[oaicite:15]{index=15} :contentReference[oaicite:16]{index=16}

---

## Failure-class reading

This cohort does **not** indicate obvious failure in:

- source repeatability,
- ingest lawfulness,
- replay-support continuity,
- or retention integrity.

The most appropriate bounded reading is:

- **F3 — structural under-resolution / insufficient sensitivity for this perturbation class at the current lens**

That is, the source and ingest path remained lawful, but the present runtime lens did not surface a structural distinction for this amplitude change. This is a diagnostic result, not an architectural invalidation. :contentReference[oaicite:17]{index=17}

---

## Metadata note

One temporary script/manifest inconsistency was observed during the first amplitude run:
the `perturbation_axis` field briefly retained an older continuity value before being corrected in the runner.

This was a metadata carryover issue, not a runtime-result issue.
The experiment should be preserved under the intended amplitude interpretation, with current runner metadata corrected for future reruns. :contentReference[oaicite:18]{index=18} :contentReference[oaicite:19]{index=19}

---

## Disposition

This cohort should be treated as:

**a successful bounded negative-result reference packet for amplitude sensitivity at the current Door One lens.**

It is suitable for later comparison against:

- frequency-only perturbation,
- continuity + noise,
- amplitude + noise,
- and later lens upgrades such as multi-scale or alternate transform families.