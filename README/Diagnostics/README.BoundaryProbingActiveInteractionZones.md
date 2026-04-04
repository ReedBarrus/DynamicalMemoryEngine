📘 README: Boundary-Probing & Active Interaction Zones (Door One)
Purpose

This note formalizes the boundary-conditioned basin splitting behavior observed during harmonic probing, and defines the minimum structural conditions required for attractor bifurcation within Door One.

This is not a feature.
This is a discovered constraint of the substrate.

Core Finding

Basin splitting is not caused by frequency placement alone.

It emerges only when edge placement is coupled with active cross-band energy exchange over time.

The Law (v0.1)

Basin splitting occurs if and only if all four conditions are satisfied:

1. Phase Alignment
   phase_ratio ≈ 1
   (window duration aligns with signal periodicity)

2. Edge Coincidence
   harmonic_is_on_band_edge == true

3. Finite Amplitude Window
   amplitude ∈ [0.35, 0.60]

4. Active Interaction Zone
   cross_boundary_redistribution_index > threshold
   AND harmonic_is_on_band_edge == true
Key Insight

Edges are not inherently active.
They become active only when energy can move across them over time.

Interaction Zone Definition

An interaction zone is present when:

Two adjacent bands share time-varying energy exchange
Energy redistribution across the boundary is non-trivial
The system exhibits inter-window variance across bands
Operational Metric
interaction_zone_active =
    harmonic_is_on_band_edge
    AND cross_boundary_redistribution_index > τ

Where:

τ ≈ 0.10 (empirically derived threshold)
Critical Asymmetry (Receiving Band Principle)

Not all “adjacent band activation” is equivalent.

Observed Behavior
Configuration	Result
f8 + h24 + h32	❌ No split
f8 + h32 + h40	✅ Split
Why?

The receiving band must be active.

Energy at the edge oscillates across the boundary
If the destination band is inert, energy consolidates
If the destination band is active, energy redistributes → bifurcation
Interpretation

This reveals a deeper principle:

Basin formation is governed by temporal energy flow, not static spectral structure.

Static spectrum:

Shows where energy is

Dynamic redistribution:

Determines what the system becomes
Active vs Inert Boundaries
Boundary Type	cross_redist	Behavior
Active	~0.20–0.30	Splitting
Inert	~0.008	Consolidation

~38× separation observed

Failure Modes (Important)
1. Edge Without Interaction
harmonic_is_on_band_edge = true
cross_redist ≈ 0
→ NO SPLIT
2. Interaction Without Edge
cross_redist > threshold
harmonic_is_on_band_edge = false
→ NO SPLIT
3. Wrong-Side Activation
only non-receiving band active
→ NO SPLIT
Minimal Activation Configurations
Canonical Split (16 Hz Edge)
f8 + h16
Fundamental energizes band-0
Edge harmonic oscillates across boundary
Immediate interaction zone
Activated Higher Edge (32 Hz)
f8 + h32 + h40
Band-2 activated
Edge becomes dynamic
Splitting emerges
Inert Edge Case
f8 + h32
No adjacent band activation
No redistribution
No split
System-Level Interpretation

This establishes that:

Attractors are not static structures.
They are time-resolved redistribution regimes.

And:

Boundaries are not geometric—they are dynamical.

Implications for DME
1. BasinOp is NOT detecting frequency clusters

It is detecting:

stable regimes of cross-window energy redistribution

2. Pre-Ingest Design Direction

We can now justify:

Boundary-sensitive probes
Cross-band redistribution tracking
Interaction-zone detection as a first-class signal
3. New Operator Direction (Future)

InteractionZoneOp (proposed)

Inputs:

Band energy time series

Outputs:

cross_boundary_redistribution_index
interaction_zone_active flag
directional flow signature (← / → / oscillatory)
4. Multi-Scale Implication

This phenomenon will likely:

Scale across frequency hierarchies
Define recursive attractor interfaces
Enable controlled bifurcation engineering
Probe Status
Prediction accuracy: 100%
Cohorts tested: 7
Total test suite: 968 passing
Final Statement

Basin splitting is not a property of frequency.
It is a property of energy movement across a boundary over time.