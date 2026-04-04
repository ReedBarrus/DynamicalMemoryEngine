README.MVCS_HarmonicPlacement_Probe.md
Purpose

This probe establishes a minimal viable separability condition for basin splitting under harmonic interference.

It tests whether phase-ratio resonance alone is sufficient to induce structural separation, or whether additional constraints govern basin formation.

Core Finding

Basin splitting is governed by a three-factor interaction:

Support-Horizon Resonance
phase_ratio ≈ 1.0
Window length matches dominant period
Band-Boundary Harmonic Placement
Harmonic frequency lies on a BAND_EDGES boundary
Not equivalent to FFT bin divisibility
Amplitude Within a Finite Splitting Window
Too weak → no effect
Too strong → stabilizes into dominance
Intermediate → induces oscillatory variance
Minimal Cohort Matrix
Cohort	Description
f8_only	baseline frequency
f8_h16_amp0.25	weak boundary harmonic
f8_h16_amp0.50	critical splitting case
f8_h16_amp0.75	dominant harmonic
f8_h24_amp0.50	mid-band harmonic
f8_h32_amp0.50	higher boundary harmonic
Observed Behavior
Condition	Result
Resonance only	❌ insufficient
Resonance + mid-band harmonic	❌ no split
Resonance + boundary harmonic (amp≈0.5)	✅ split
Boundary harmonic + low amp	❌ no split
Boundary harmonic + high amp	⚠️ split shifts scale
Structural Interpretation

Basin splitting emerges from:

Inter-window redistribution of energy across adjacent bands

When a harmonic lies on a band boundary:

Window phase shifts cause energy to alternate between bands
This produces high inter-window variance
BasinOp detects this as distinct clusters

Mid-band harmonics:

Keep energy localized within a band
Produce stable profiles
Do not trigger splitting
Key Distinction

Correct concept:

band-boundary harmonic (based on BAND_EDGES)

Incorrect proxy:

FFT bin divisibility (harmonic_hz % df == 0)

These are not equivalent.

Law (Provisional)

Basin splitting occurs when:

phase_ratio ≈ 1
harmonic ∈ BAND_EDGES
amplitude ∈ (A_min, A_max)

Otherwise, basin structure remains consolidated.

MVCS Implication

This defines the first minimal separability condition:

Spectral content becomes structurally distinguishable only when boundary-induced variance exceeds stability thresholds.

This is the first reliable mechanism for:

identity divergence
attractor branching
structural bifurcation
2. Basin Diagnostic Probe Note

This one is more “forward-facing” — it tells Engineer what to do next.

README.BasinDiagnostic_Probe.md
Objective

To formalize why BasinOp splits vs consolidates, and convert observed behavior into diagnostic metrics that generalize beyond the harmonic test.

Diagnostic Axes

We now treat basin formation as a function of:

1. Inter-Window Variance (IWV)
Primary driver of splitting
Measured via L1 distance between band profiles
2. Energy Localization
Does energy remain within a band?
Or redistribute across adjacent bands?
3. Phase Sensitivity
Does window phase shift alter band assignment?
Derived Metrics

Engineer should compute:

inter_window_variance
band_transition_rate
dominant_band_stability
energy_redistribution_index
Diagnostic Conditions
Splitting Regime

Occurs when:

inter_window_variance > threshold
band_transition_rate > 0
dominant_band_stability < 1

Interpretation:
→ Energy is oscillating across bands

Consolidation Regime

Occurs when:

inter_window_variance ≈ 0
band_transition_rate ≈ 0
dominant_band_stability ≈ 1

Interpretation:
→ Energy is stable within a band

Structural Mechanisms
Mechanism A — Boundary Oscillation
Harmonic sits on band edge
Phase shifts move energy across boundary
Produces alternating profiles
Mechanism B — Mid-Band Stability
Harmonic sits inside band
Phase shifts do not change band assignment
Profiles remain consistent
Mechanism C — Dominance Collapse
Harmonic too strong
One band dominates across all windows
Variance collapses → no split
Required Probe Extensions

Engineer should now extend testing to:

1. Multi-Harmonic Systems
Add 3rd and 4th harmonics
Observe interference stacking
2. Non-Integer Ratios
Slight detuning (e.g., 15 Hz instead of 16 Hz)
Test robustness of boundary condition
3. Window Function Variants
Hann vs Rectangular vs Blackman
Measure sensitivity of boundary oscillation
4. Band Resolution Variants
Modify BAND_EDGES granularity
Test whether splitting is representation-dependent
Core Question Going Forward

Is basin splitting a property of the signal,
or a property of the measurement geometry?

This probe is the first place where that question becomes experimentally tractable.

Expected Outcome

We are moving toward defining:

Basin formation as a function of energy topology over time, not just spectral content