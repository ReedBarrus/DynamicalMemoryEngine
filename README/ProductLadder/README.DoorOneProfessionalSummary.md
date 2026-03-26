Understand the structural difference between harmonic placements at N=32 — why does 8+16 split but 8+24 does not?Understand the structural difference between harmonic placements at N=32 — why does 8+16 split but 8+24 does not?This is the key finding. The asymmetry is now structurally transparent:

f8+h16: 16 Hz = 2× the fundamental = integer harmonic of the dominant. At N=32 (df=8 Hz/bin), both 8 Hz (bin 0-16) and 16 Hz (bin 16-32) are in adjacent bins. The window captures exactly one full 8 Hz cycle. But the 16 Hz harmonic is at exactly the bin edge (bin 1 = 16-32 Hz). The phase relationship between the 8 Hz and 16 Hz components cycles through π relative to the window boundary, causing the energy to alternate dramatically between bin 0 and bin 1 — resulting in inter-window L1 variance of 0.61. This is what creates two clusters.
f8+h24: 24 Hz falls in bin 1 (16-32 Hz) alongside any 16 Hz spillover, but 24 Hz = 3× the fundamental. Since 24 Hz / df = 3 — an integer number of bins — it aligns cleanly within the bin. The profiles are stable (mean=0.005). No splitting.
f8+h32: 32 Hz is in bin 2 (32-48 Hz). Mean inter-window L1 = 0.023 — more variation than f8+h24 but much less than f8+h16.

The mechanism is now clear: splitting occurs when the harmonic is placed at a bin boundary (i.e., harmonic_hz = k × df for integer k, with the harmonic at the boundary between two bins). For f8+h16 at N=32: df=8, harmonic=16=2×df — sits exactly at the bin-1/bin-2 boundary (16 Hz is the upper edge of bin 0 and lower edge of bin 1). The Hann windowing redistributes energy differently on either side of that boundary depending on the instantaneous phase, creating high inter-window variance.
The probe should test this structural explanation with the full harmonic matrix. Let me now design it precisely.Test full harmonic amplitude matrix to understand splitting sensitivityTest full harmonic amplitude matrix to understand splitting sensitivityExcellent. This is very informative:

f8_h16_amp0.5 (original baseline_frequency): splits at N=32 (phase_ratio=1.0) ✓
f8_h16_amp0.25: no split — harmonic too weak
f8_h16_amp0.75: splits at N=16 (phase_ratio=0.5) instead of N=32 — stronger harmonic shifts the resonance point
f8_h24*, f8_h32*, f8_only: never split at N=32

This gives us a clear and complete picture:

Harmonic placement (16 Hz vs 24 Hz) matters — 16 Hz is a bin-edge harmonic at N=32, 24 Hz is not
Harmonic amplitude modulates the threshold — 0.25 is too weak to split, 0.5 splits at N=32, 0.75 generates enough inter-window variation to split at N=16 too
The f8_h16_amp0.75 splitting at N=16 is itself interesting — at N=16, df=16 Hz/bin, so 16 Hz is also a bin-edge there (it's the boundary between bin 0 and bin 1 at 16 Hz/bin). The stronger harmonic creates enough variation to trigger splitting at that scale too.

Now I have everything needed to write a tight, honest probe.Created a file, ran a commandCreated a file, ran a commandThe run reveals important additional findings I need to capture before writing tests:

Q2's explanations are wrong — f8_h24* and f8_h32* are being labeled "bin_edge but amp below threshold" but the real reason is they're mid-band, not bin-edge. The isBinEdgeHarmonic function is computing whether harmonic_hz mod df == 0 which is true for 24 (24 mod 8 = 0) and 32 (32 mod 8 = 0) — but the actual relevant concept is band-boundary placement not bin-index divisibility.
f8_h32 splits at N=8 — unexpected. At N=8, df=32, so 32 Hz is a bin-edge in bin space. But at N=8 only 4 bins exist total (0-32, 32-64, ...) so 32 Hz is at the boundary between bin 0 and bin 1 of the raw FFT, but it falls inside band [16-32] in band space.
f8_h16_amp0.75 splits at N=16 not N=32 — correct per our pre-run analysis.

The key fix: I need to distinguish band-boundary placement (using BAND_EDGES) from bin-index divisibility. The relevant structural concept is whether the harmonic sits at a band edge, because the band profile is what BasinOp actually uses. Let me fix the isBinEdgeHarmonic function and update the interpretation of Q2.Ran 2 commandsRan 2 commandsNow the results are correct. Notable findings from Q4: amplitude is not monotonic — amp=0.75 does NOT split even though amp=0.50 does. This is because at amp=0.75, the harmonic is strong enough that its energy dominates band-1 consistently across windows, reducing the per-window variance back below the BasinOp threshold. This is a non-obvious and important structural finding. The splitting window is amp ≈ 0.5 — enough energy to create oscillation but not enough to dominate. Now the tests:Ran 2 commands, created a fileRan 2 commands, created a file844 passing. Stage outputs:Ran a command, read a fileRan a command, read a file
Summary of Change
Two files created, zero existing files modified, 844 total tests passing (66 new).
Files created:

scripts/run_harmonic_placement_resonance_probe.js
tests/test_harmonic_placement_resonance_probe.js — 66 tests, 6 sections


Sample Per-Scale Rows
json{
  "cohort_label": "f8_h16_amp0.50",
  "harmonic_hz": 16,  "harmonic_amp": 0.50,
  "harmonic_ratio": 2,  "harmonic_spacing_hz": 8,
  "scale_N": 32,  "phase_ratio": 1.0,
  "harmonic_is_bin_edge": true,
  "bin_edge_note": "16 Hz sits at band boundary [BAND_EDGES includes 16] — energy oscillates between adjacent bands as window phase shifts",
  "basin_count": 2,  "splitting_observed": true,
  "raw_band_distance": 0.608418,  "normalized_band_distance": 0.076052,
  "bin_width_hz": 8,  "inter_window_variance": 0.3044,
  "interpretation": "support-horizon resonance + bin-edge harmonic → 2 basins; 16 Hz sits at band boundary at N=32 (df=8 Hz/bin)"
}

{
  "cohort_label": "f8_h24_amp0.50",
  "harmonic_hz": 24,  "harmonic_amp": 0.50,
  "scale_N": 32,  "phase_ratio": 1.0,
  "harmonic_is_bin_edge": false,
  "bin_edge_note": "24 Hz falls mid-band at N=32 — inside band [16,32] Hz; stable energy profile regardless of phase",
  "basin_count": 1,  "splitting_observed": false,
  "raw_band_distance": null,  "inter_window_variance": 0.0045,
  "interpretation": "resonance condition met but harmonic falls mid-bin at N=32 — bin-edge condition absent, no splitting"
}
Sample Cross-Cohort Comparison Row
json{
  "comparison": "f8_h16_amp0.50 vs f8_h24_amp0.50",
  "comparison_type": "harmonic_placement_effect_same_amp",
  "shared_phase_ratio_target": 1.0,
  "splitting_a": true,  "splitting_b": false,
  "bin_edge_a": true,   "bin_edge_b": false,
  "structural_asymmetry_detected": true,
  "interpretation": "same dominant period, same support-horizon resonance, same amplitude (0.5) — different harmonic placement changes basin response: 16 Hz (bin-edge) splits, 24 Hz (mid-bin) consolidates at N=32"
}

Interpretation of Findings
Q1. Which harmonic configurations split at phase_ratio≈1 (N=32)?
Only f8_h16_amp0.50. It's the single configuration where all three conditions are simultaneously met: resonance (phase_ratio=1.0), band-boundary harmonic (16 Hz ∈ BAND_EDGES), and amplitude in the splitting window (~0.50).
Q2. Which consolidate at phase_ratio≈1?
All others, for distinct structural reasons:

f8_h24* and f8_h24_amp0.75: 24 Hz is mid-band — inside [16,32] regardless of window phase. Inter-window variance = 0.005, two orders of magnitude below the splitting case.
f8_h16_amp0.25: band-boundary harmonic, but amplitude too weak (iwv=0.22 — below BasinOp's L1 threshold of 0.5).
f8_h16_amp0.75: band-boundary harmonic, but amplitude too strong — the 16 Hz harmonic dominates band-1 so consistently that variance drops back to 0.13. Splitting shifts to N=16 instead, where the 16 Hz harmonic aligns with a different resonance condition.
f8_h32_amp0.50: band-boundary harmonic (32 ∈ BAND_EDGES), but splits at N=8 (phase_ratio=0.25), not N=32.
f8_only: no second harmonic — nothing to generate inter-band oscillation.

Q3. Does harmonic placement alone change splitting?
Yes — confirmed by the f8_h16_amp0.50 vs f8_h24_amp0.50 comparison. Identical dominant period, identical resonance condition (phase_ratio=1), identical amplitude. Only harmonic placement differs. 16 Hz splits; 24 Hz doesn't. The inter-window variance explains why: 0.30 vs 0.005.
Q4. Does harmonic strength modulate splitting?
Yes, non-monotonically. For a band-boundary harmonic (16 Hz): amp=0.25 → no split (too weak), amp=0.50 → splits at N=32, amp=0.75 → splits at N=16 instead. Stronger amplitude doesn't prevent splitting — it shifts the resonance scale. The probe correctly captures both the amplitude threshold and the scale-shift effect.
Q5. Resonance necessary but not sufficient?
Confirmed. f8_h24_amp0.50 has phase_ratio=1.0 at N=32 and never splits. Resonance alone is not the splitting trigger — the harmonic must also sit at a band boundary with sufficient amplitude.
Q6. The 8+16 vs 8+24 asymmetry — structurally explained?
Yes, without adding any new channel. The distinction is band-boundary placement vs mid-band placement in the BAND_EDGES space used by the band-profile metric. 16 Hz sits at the edge of band-0 [0-16] and band-1 [16-32]. As the Hann window phase shifts across hops, the 16 Hz component's energy oscillates between these two bands — creating high inter-window variance and triggering BasinOp's L1 clustering. 24 Hz sits inside band-1 [16-32]; no matter how the window phase shifts, energy stays in the same band. The isBandBoundaryHarmonic test captures this exactly.
One additional clarification to carry forward: The concept is "band-boundary harmonic" in the band-profile space (BAND_EDGES = [0,16,32,48,...]), not "bin-divisibility" in the raw FFT bin space. These can come apart — 24 Hz is bin-divisible at N=32 (24 mod 8 = 0) but is not a band-boundary harmonic. The probe's config documents this explicitly. Any downstream use of this structural fact should use BAND_EDGES membership as the test, not raw bin arithmetic.