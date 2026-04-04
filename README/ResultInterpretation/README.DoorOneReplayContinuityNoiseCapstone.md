# Door One Replay Continuity + Noise Capstone — Result Note

## Status

This note records the outcome of the bounded Door One continuity-under-noise replay capstone.

It is a supporting experiment note.
It does **not** mint canon, truth, ontology, promotion, or prediction authority.

---

## Experiment posture

This experiment used:

- one source family,
- one shared stream lineage,
- one declared lens family,
- one perturbation axis (`continuity`),
- one bounded 9-run cohort:
  - 3 baseline runs,
  - 3 perturbation runs,
  - 3 return runs.

The source family was a controlled DAW-generated sine-wave cohort rendered as bounded WAV files with a continuous white-noise bed.

The perturbation condition preserved the same noise bed and introduced a continuity break in the sine signal only.

This experiment remained below canon.
Replay remained lens-bound.
Preservation remained preservation-only rather than authority-bearing. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}

---

## Lens

The cohort was run under the established tighter audio lens:

- `Fs_target = 2400`
- `base_window_N = 1024`
- `hop_N = 512`
- `window_function = hann`

This is the same declared lens family used for the earlier continuity capstone, enabling direct comparison between the clean and contaminated continuity cohorts. :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4}

---

## Cohort outcome

The experiment completed successfully as a bounded Door One replay cohort.

The manifest recorded:

- `experiment_type = "door_one_continuity_noise_replay_capstone"`
- `perturbation_axis = "continuity"`
- `source_id = "door1.audio.daw_tone.continuity_noise_v1"`
- `run_count = 9`
- `ok_count = 9`

with three labeled run families:
- `phase_baseline`
- `phase_perturbation`
- `phase_return`. :contentReference[oaicite:5]{index=5}

All 9 runs preserved one shared stream lineage:
`STR:door1.audio.daw_tone.continuity_noise_v1:mono_master:audio_amplitude:wav:2400` :contentReference[oaicite:6]{index=6} :contentReference[oaicite:7]{index=7}

Observed structural pattern:

- all baseline runs showed:
  - `state_count = 33`
  - `basin_count = 1`
  - `segment_count = 1`

- all continuity-break-under-noise runs showed:
  - `state_count = 26`
  - `basin_count = 1`
  - `segment_count = 1`

- all return runs reverted to:
  - `state_count = 33`
  - `basin_count = 1`
  - `segment_count = 1` :contentReference[oaicite:8]{index=8}

This means the continuity perturbation remained detectable under contamination, but not through the same signature that appeared in the clean continuity cohort.

---

## Comparative reading against the clean continuity cohort

The earlier clean continuity cohort showed a perturbation-phase pattern of:

- `state_count = 31`
- `basin_count = 5`
- `segment_count = 3`

with visible transition activity and structural splitting during the continuity break. 

By contrast, the continuity + noise cohort showed:

- `state_count = 26`
- `basin_count = 1`
- `segment_count = 1`
- `total_transitions = 0`

during the perturbation phase. :contentReference[oaicite:10]{index=10}

So the added white-noise bed did **not** erase the perturbation entirely.
Instead, it appears to have changed the *mode of structural expression*:

- in the clean cohort, the continuity break surfaced as multi-segment / multi-basin structure,
- in the noise cohort, the continuity break surfaced primarily as a compressed single-regime state-count reduction.

This is a meaningful robustness result.

---

## Cross-run reading

The cross-run report confirms:

- one stream scope across all 9 runs,
- one shared visible signature family across baseline, perturbation, and return:
  - `occupancy = sticky`
  - `transition_density = low`
  - `continuity = smooth`
  - `attention_concentration = high`
  - `attention_persistence = high`

At the surfaced signature-label level, the cohort still reads as highly similar.
However, the evidence layer clearly shows a repeated and phase-aligned difference:

- baseline and return runs have `state_count = 33`
- perturbation runs have `state_count = 26`

and the pairwise comparisons between baseline and perturbation preserve a `state_count_delta = 7` across all three continuity-break runs. :contentReference[oaicite:11]{index=11}

So the correct reading is:

- the perturbation remained detectable,
- but the higher-order runtime signature labels did not separate,
- and the difference is presently visible in evidence counts rather than in segmentation/basin structure or derived signature language.

This is consistent with Door One’s inspection posture: runtime evidence outranks derived labels when the two differ in specificity or sensitivity. :contentReference[oaicite:12]{index=12}

---

## Replay / retention result

This experiment succeeded at the replay-support layer.

The cohort preserved:

- bounded per-run execution,
- durable provenance receipts,
- a regenerable digest,
- and one pinned packet for the experiment cohort. :contentReference[oaicite:13]{index=13} :contentReference[oaicite:14]{index=14} :contentReference[oaicite:15]{index=15}

This is sufficient to preserve the continuity-under-noise cohort as a lawful comparison packet.

As required by Door One retention posture, this remains a preservation surface only.
It does **not** imply canon, truth, or promotion. :contentReference[oaicite:16]{index=16} :contentReference[oaicite:17]{index=17}

---

## Supported claim

This experiment supports the following bounded claim:

**Under the declared Door One audio ingest/runtime lens (`Fs_target=2400`, `base_window_N=1024`, `hop_N=512`), a continuity break remains detectable under a continuous white-noise bed across a 9-run bounded replay cohort, but its structural signature collapses from the multi-segment / multi-basin form seen in the clean continuity cohort into a single-regime reduced-state form.**

This is a stronger result than either:
- “noise changed nothing,” or
- “noise destroyed the signal entirely.”

Instead, it indicates that contamination changes *how* the perturbation is represented, not merely whether it exists.

---

## Non-claims

This experiment does **not** establish:

- that continuity detection is robust under all noise levels,
- that the current lens is optimal,
- that the reduced-state signature is the only valid contaminated representation,
- that higher or lower contamination levels would behave the same,
- or that the current signature set is final.

It records a bounded result for this contamination level and this declared lens only.

---

## Failure-class reading

This cohort does **not** indicate obvious failure in:

- source repeatability,
- ingest lawfulness,
- replay-support continuity,
- retention integrity.

The most appropriate bounded reading is:

- **continuity remains above the current detection threshold under contamination**, but
- **its structural expression shifts under contamination**, with segmentation/basin sensitivity reduced at the current lens.

If forced into the existing failure map, this is best read not as a full failure, but as a **boundary response**:
the signal remains discriminable, while the richer structural form seen in the clean cohort is no longer preserved under the added noise.

---

## Comparative note

The clean replay cohorts now support an early instrument map:

- **clean continuity perturbation**: clearly separated with multi-segment / multi-basin structure 
- **clean amplitude perturbation**: not separated at the current lens :contentReference[oaicite:19]{index=19}
- **clean frequency perturbation**: not separated at the current lens 
- **continuity + noise perturbation**: still separated, but through reduced state-count expression rather than segmentation/basin splitting 

This supports the working hypothesis that the current Door One configuration is strongly continuity-sensitive, but that its continuity signature is not invariant under contamination.

---

## Disposition

This cohort should be treated as:

**a successful bounded robustness reference packet showing that continuity perturbation remains detectable under contamination, but with changed structural expression at the current Door One lens.**

It is suitable for later comparison against:

- stronger noise levels,
- amplitude + noise,
- frequency + noise,
- stronger amplitude/frequency deltas,
- and future lens upgrades such as passive multi-scale or alternate transform families.