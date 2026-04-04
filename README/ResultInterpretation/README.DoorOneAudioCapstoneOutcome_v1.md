# README_DoorOneAudioCapstoneOutcome_v1.md
# Dynamical Memory Engine — Door One Audio Capstone Outcome v1

## Source

Source file:
`./test_signal/220-440hzPulse.wav`

Declared source posture:
- source_mode: file
- source_id: `door1.audio.220_440hz_pulse.v1`
- channel: `mono_master`
- modality: `audio_amplitude`

Declared ingest lens:
- original sample rate: 48000 Hz
- ingested sample rate: 2400 Hz
- decimation factor: 20

---

## Whole-file run result

The full 20-second file completed lawfully through Door One.

Observed result:
- one basin
- one segment
- zero transitions
- coherent single-run structural output

Interpretation:
At the current 2400 Hz ingest lens, the full file is treated as one smooth evolving structural event rather than as a hard regime break.

This is informative, not a failure.

---

## Sliced run result

Seven bounded runs were produced:

- baseline_01
- baseline_02
- baseline_03
- perturb_01
- perturb_02
- return_01
- return_02

### Stable findings

Baseline slices were structurally identical at the current lens.

Return slices were also internally reproducible.

Cross-run comparison showed:
- baseline ↔ baseline = high similarity
- baseline ↔ perturb = medium similarity
- baseline ↔ return = high similarity

This means Door One already distinguishes:
- stable baseline
- perturbation
- return-like recurrence

without needing canon, prediction, or semantic inflation.

### Key limitation exposed

Both perturb slices produced zero structural state output at the current lens.

Most likely reason:
the perturbation slices are shorter than the current analysis window.

Current ingest lens:
- sample rate = 2400 Hz
- base_window_N = 4096
- window duration ≈ 1.7067 s

Perturbation slices:
- duration = 1.25 s each

This means each perturb slice is shorter than one full analysis window, so Door One does not yet have enough temporal support to form a stable structured state for that phase.

---

## Current conclusion

Door One is already useful enough to:
- preserve provenance from a real file-backed source,
- distinguish baseline / perturbation / return at the cross-run level,
- remain below canon and inspection-honest.

However, the current windowing lens is too coarse to represent the perturbation phase as its own stable structured state.

---

## Recommended next move

Before changing transforms or adding multi-scale ingest:

1. keep the same source,
2. tighten the temporal lens for the experiment,
3. rerun the same slices.

Preferred first adjustment:
- reduce window size for the experiment slice runner
- or enlarge perturbation slice duration

The goal is not to change meaning.
The goal is to let the perturbation exist long enough, relative to the current lens, to become representable as structure.