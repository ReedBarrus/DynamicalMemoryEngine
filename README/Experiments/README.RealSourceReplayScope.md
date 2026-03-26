## README.RealSourceReplayScope.md
Real-Source Replay Resilience Scope

Door One — Read-Side Experimental Seam Only

## 1. Purpose

This document defines the first real-source experiment scope for replay-flow and replay-resilience probing in Door One.

The immediate goal is to carry the current replay-flow probe posture into an honest real-source family and test whether the exchange-regime behavior observed in synthetic cohorts survives provenance-bearing source conditions without altering runtime authority or basin semantics. This remains a read-side diagnostic only. Runtime stays below canon.

This README does not introduce new runtime meaning, new authority classes, or new promotion logic.

## 2. Current Experimental Basis

The synthetic replay-resilience probe currently supports four isolated perturbation families:

amplitude
boundary_detuning
harmonic_offset
noise_depth

Across the current synthetic fixtures, all four families show:

baseline: oscillatory_exchange
perturbation: separated regime (one_way_drift or weak_or_inert)
return: oscillatory_exchange
family class: exchange_recovers_on_return

The current cross-family synthetic summary therefore supports the probe-local class:

resilience_surface_class = broad_recovery_pattern

This finding is useful, but remains:

provisional
probe-local
synthetic-family scoped
non-canonical

It is not yet a claim about real-source resilience.

## 3. Constitutional Posture
3.1 This experiment is allowed because it remains:
read-side
script-side
lineage-bound
reversible
observational only
3.2 This experiment must not:
modify BasinOp clustering logic
change runtime operator contracts
change workbench readiness or promotion scoring
add flow_mode, resilience classes, or derived interpretations to authoritative runtime artifacts
treat replay classification as canon, ontology, truth, or trusted prediction
silently replace structural metrics with semantic language

These remain hard boundaries for the experiment seam.

3.3 Language discipline

Use:

classification
diagnostic separation
replay resilience summary
recovery on return
probe-local resilience hint

Do not use:

prediction
truth
understanding
semantic identity
canon
validated knowledge

## 4. Primary Question

Under an honest real-source acquisition path, does the exchange condition:

persist,
weaken,
disappear,
recover on return,
or fail to recover,

when exposed to isolated perturbation families that have already shown bounded structural separation in synthetic replay?

## 5. Secondary Question

Is recovery in real-source conditions:

axis-specific,
mixed,
fragile,
or suggestive of a broader resilience surface,

while still remaining bounded to a read-side diagnostic posture?

## 6. First Real-Source Family
6.1 Selected source family

The first real-source family is:

mic_ambient_audio

This means local microphone capture on the computer is the primary real-source input.

6.2 Why microphone is first

Microphone input is selected because it is:

easy to acquire honestly
naturally continuous
repeatable with minimal integration burden
compatible with single-axis perturbation design
less entangled than CPU telemetry for a first resilience checkpoint

CPU telemetry remains a valid later source family, but is not the first real-source checkpoint because scheduler effects, background activity, and bursty operating-system behavior make perturbation isolation harder to interpret cleanly. This scope prefers the simplest provenance-bearing source that preserves experimental clarity.

6.3 Role of the phone

The phone may be used as:

a controlled perturbation source
a tone generator
a broadband noise source

The phone is not the primary capture device for the first real-source cohort.

## 7. Real-Source Acquisition Posture
7.1 Capture path

Preferred first path:

local computer microphone
mono capture
fixed sample rate
bounded run duration
explicit run labeling per replay phase
7.2 Required lineage fields

Each run should preserve enough lineage to keep replay honest, including at minimum:

- source_family
- source_device_label
- source_id
- stream_id or equivalent source identifier
- channel / modality identity
- run_label
- perturbation_family
- perturbation_label
- replay_phase
- replay_sequence_index
- acquisition timestamp or bounded cohort time range
- declared lens metadata needed to interpret the probe output
- explicit derived-vs-durable status where relevant

7.3 Non-goal

This phase is not attempting to maximize richness or realism.
It is attempting to establish a clean real-source checkpoint with declared perturbation axes and honest return conditions.

Temporal window family and hop policy must be declared per cohort. If temporal support is later tightened for short event capture, that change must be recorded as an explicit lens change and must not be hidden inside the replay comparison.

## 8. Real-Source Replay Structure

Each cohort should use the same three-phase structure already established in synthetic replay:

baseline
perturbation
return

Recommended initial timing:

baseline: 20–30 seconds
perturbation: 20–30 seconds
return: 20–30 seconds

Each perturbation family should be run separately.
Do not mix perturbation families in the same first-wave cohort.

## 9. First-Wave Real-Source Perturbation Families
9.1 Amplitude

Status: first-wave approved

Baseline:

quiet room tone

Perturbation:

repeated voice phrase, finger taps, soft claps, or controlled short energy bursts

Return:

quiet room tone again

Purpose:

test whether the exchange condition separates under simple amplitude/energy intrusion and recovers when the intrusion is removed

This is the recommended first real-source family to run.

9.2 Harmonic Offset

Status: first-wave approved

Baseline:

quiet room tone

Perturbation:

phone-generated sustained tone or hum at a declared frequency and fixed approximate volume

Return:

tone removed, quiet room tone again

Purpose:

test whether a narrow-band external source can shift the observed flow regime and whether the regime returns when the offset source is removed

Synthetic work already established an important classifier hygiene rule here: the measurement lens should remain fixed while the signal changes. The originally tempting f=10, h=20 family was rejected because it triggered oscillatory_exchange through the high flip-rate path despite lacking coherent period-2 behavior. The 8/24 redesign was adopted because it collapses honestly to weak_or_inert while preserving comparability. This same discipline should carry into real-source use: do not change the measuring frame mid-family merely to chase the perturbation.

9.3 Noise Depth

Status: first-wave approved

Baseline:

quiet room tone

Perturbation:

broadband noise introduced by phone playback, fan-like source, or other declared diffuse noise source

Return:

quiet room tone again

Purpose:

test whether increasing diffuse perturbation depth weakens, collapses, or merely distorts the exchange condition, and whether the condition recovers on return
9.4 Boundary Detuning

Status: deferred for first real-source pass unless honestly realizable

Synthetic fixtures support boundary_detuning as a lawful perturbation family. However, this is less natural at the raw microphone source level unless there is already a clear and honest way to realize boundary-targeted detuning without silently changing the lens, band definitions, or comparison basis mid-run.

Therefore, for the first real-source pass:

boundary_detuning is acknowledged
boundary_detuning is not required
boundary_detuning should be deferred unless it can be expressed without forced or weak implementation

This follows the existing experiment instruction to leave an axis out rather than force a poor one.

## 10. Recommended First Execution Order

Run first-wave real-source families in this order:

amplitude
harmonic_offset
noise_depth
boundary_detuning only if later justified

This order is preferred because amplitude is the simplest to inspect, harmonic offset is the cleanest next spectral family, and noise depth is useful once basic replay separation is already established.

## 11. Expected Outputs

The real-source replay experiment should preserve the current read-side metrics where available, including:

run_label
perturbation_family
perturbation_label
replay_phase
replay_sequence_index
boundary_band_pair
signed_cross_boundary_flow
oscillatory_flow_strength
diff_lag1_autocorr
sign_flip_rate
boundary_phase_lag_proxy
flow_mode
basin_count if already available read-side
splitting_observed if already available read-side
lineage references sufficient for replay honesty

Family-level summaries should continue to compute:

baseline_flow_mode
perturbation_flow_mode
return_flow_mode
exchange_persistence_class
flow_regime_transition_count
basin_split_persistence_summary
resilience_surface_hint

Cross-family summary may continue to compute:

perturbation_families_tested
recovery_families
non_recovery_families
resilience_surface_class
interpretation

All such outputs remain derived experiment results only.

## 12. Success Condition

The first real-source checkpoint is considered successful if:

microphone capture is integrated without runtime contract changes
baseline / perturbation / return runs are cleanly labeled and lineage-preserving
at least one real-source perturbation family shows diagnostic phase separation
return condition is meaningfully comparable to baseline
all findings remain explicitly read-side, provisional, probe-local, and non-canonical

A successful result does not require exact replay symmetry.
It requires honest separation and interpretable return behavior.

## 13. Failure Interpretations

Failure is still useful.
The following outcomes should be treated as informative, not catastrophic:

13.1 No stable baseline anchor

Possible meaning:

room source too unstable
capture chain too noisy
run duration too short
lens not yet robust enough for the source family
13.2 Perturbation does not separate from baseline

Possible meaning:

perturbation too weak
perturbation not aligned with the active interaction zone
source family insufficiently distinguishable under current basis
13.3 Return does not recover

Possible meaning:

source memory is more entangled than synthetic families
perturbation leaves persistent structural residue
real-source regime is fragile under that axis
capture posture changed between phases
13.4 Mixed or unstable classification

Possible meaning:

current flow_mode classes compress distinct behaviors too aggressively
more classifier refinement may be needed before stronger interpretation

This last point is already partially supported by the harmonic-offset family design decision: not every oscillatory-looking regime is structurally the same.

## 14. Relationship to RSI

This scope is compatible with the current DME↔RSI bridge only because it remains on allowed experimental surfaces:

- read-side interpretation
- post-run analysis
- strictly observational reflection

The experiment may provide structural evidence relevant to persistence, recurrence, continuity, and perturbation resistance.

It does not justify:
- semantic identity claims,
- canonical dimensions,
- ontology injection,
- or automatic promotion of DME features into RSI objects.

## 15. Immediate Action Plan
Step 1

Wire local mic capture into a bounded input path.

Step 2

Record source metadata and replay-phase labels for each run.

Step 3

Run one amplitude-family cohort:

baseline
perturbation
return
Step 4

Inspect:

per-run rows
family-level summary
whether return is closer to baseline than perturbation
Step 5

Only after amplitude is interpretable, run:

harmonic_offset
then noise_depth
Step 6

Defer boundary_detuning unless an honest real-source implementation becomes clear.

16. One-Line Summary

This scope moves replay-resilience probing from synthetic cohorts into first-wave real-source microphone input using isolated, declared perturbation families, while preserving Door One’s read-side-only, non-canonical, non-promotive posture.