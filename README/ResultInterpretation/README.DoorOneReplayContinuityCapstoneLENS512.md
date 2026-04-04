# Door One Replay Continuity Capstone Lens512 — Result Note

## Status

This note records the outcome of the bounded Door One continuity replay capstone under the smaller declared lens:

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
- one perturbation axis (`continuity`),
- one bounded 9-run cohort:
  - 3 baseline runs,
  - 3 perturbation runs,
  - 3 return runs.

The source family remained the same as the clean continuity control cohort.
Only the declared temporal support was changed relative to the earlier continuity capstone.

---

## Lens

This lens pass used:

- `Fs_target = 2400`
- `base_window_N = 512`
- `hop_N = 256`

The purpose of the pass was to test whether smaller temporal support would:

- preserve the stable control regime,
- preserve the return regime,
- and enrich or distort the continuity perturbation signature. :contentReference[oaicite:0]{index=0}

---

## Cohort outcome

The experiment completed successfully as a bounded Door One replay cohort.

The manifest recorded a 9-run cohort under the smaller declared lens, and all runs completed successfully with durable receipts, digest regeneration, and a pinned packet. :contentReference[oaicite:1]{index=1}

Observed structural pattern:

- all baseline runs showed:
  - `state_count = 67`
  - `basin_count = 1`
  - `segment_count = 1`

- all continuity-break runs showed:
  - `state_count = 61`
  - `basin_count = 6`
  - `segment_count = 3`

- all return runs reverted to:
  - `state_count = 67`
  - `basin_count = 1`
  - `segment_count = 1` :contentReference[oaicite:2]{index=2}

This means the smaller lens did **not** destabilize the control or return conditions, and it preserved clear continuity-break separation.

---

## Comparative reading against the prior continuity cohort

The earlier continuity cohort at `1024/512` showed:

- baseline / return:
  - `state_count = 33`
  - `basin_count = 1`
  - `segment_count = 1`

- perturbation:
  - `state_count = 31`
  - `basin_count = 5`
  - `segment_count = 3` 

Under the smaller lens, the qualitative regime separation stayed the same, but the representation became denser and slightly richer:

- baseline / return state density increased (`33 → 67`)
- perturbation state density increased (`31 → 61`)
- perturbation basin complexity increased slightly (`5 → 6`)
- perturbation remained multi-segment with `total_transitions = 7` and `total_re_entries = 2` :contentReference[oaicite:4]{index=4}

This indicates that the smaller lens enriched the continuity readout without collapsing the control.

---

## Cross-run reading

The cross-run report confirms:

- one stream scope across all 9 runs,
- baseline-to-baseline and baseline-to-return similarity at `high`,
- baseline-to-perturbation similarity reduced to `medium`,
- and a stable difference in occupancy and continuity labels between the perturbation family and the baseline/return family. :contentReference[oaicite:5]{index=5}

The visible signature family remains coherent:

- baseline / return:
  - `occupancy = sticky`
  - `continuity = smooth`
  - `transition_density = low`

- perturbation:
  - `occupancy = hopping`
  - `continuity = gapped`
  - `transition_density = medium` :contentReference[oaicite:6]{index=6}

So the smaller lens preserved the same structural story while increasing evidence density.

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

**Under the smaller declared Door One lens (`Fs_target=2400`, `base_window_N=512`, `hop_N=256`), the continuity perturbation remains clearly detectable across a 9-run replay cohort, and its structural expression becomes denser and slightly richer without destabilizing the baseline or return regimes.**

This is a positive lens-comparison result.

---

## Non-claims

This experiment does **not** establish:

- that smaller support is universally better,
- that this is the final or optimal lens,
- or that all perturbation families will benefit equally from this smaller support.

It only records the bounded result for the continuity cohort.

---

## Disposition

This cohort should be treated as:

**a successful lens-comparison control packet showing that the `512/256` lens is lawful, stable on control/return, and richer for continuity perturbation representation.**