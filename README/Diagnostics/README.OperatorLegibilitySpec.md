Tight Operator Legibility Spec

Use this as a bounded design note / packet seed.

# Purpose

Define the minimum operator-facing visual grammar needed to make the current Door One object path legible enough for honest audit.

This spec is a read-side legibility note.
It does not:

redefine runtime semantics
mint authority
activate canon
replace replay/reconstruction law
or add new ontology

Its purpose is narrower:

make bounded object transitions visible
reduce operator identity blur
preserve provenance-first auditability
and clarify replay / reconstruction / retention posture at a glance

This supports:

Leg 1 app surface stabilization
Leg 2 reconstruction fidelity and replay honesty
later Leg 3 identity/compression tracking

That sequencing is already aligned with the current developmental line.

# Core problem

The current system may be lawful while still not being operator-legible.

The main failure modes are:

the operator cannot easily see what object is currently active
replay / reconstruction / retention are not visually distinct enough
interpretation can feel richer than the underlying structural path
identity continuity across the object path is hard to audit intuitively

This creates:

legibility pressure
audit fatigue
overreliance on theory
and risk of “system wrong” projection when the real issue is representation
Core legibility rule

Every primary visible object in the operator view must answer, at a glance:

what object am I?
how was I produced?
what do I depend on?
what is my current status?
what can I legally claim?
what can happen next?

If a surface cannot answer those, it is too abstract for primary operator use.

# Primary operator path

The primary view should render one bounded causal strip:

Source → Spectral State → Retained Signature → Replay / Reconstruction → Interpretation Overlay → Review Gate

This is not a promotion chain.
It is a visibility chain.

Each stage should remain visually distinct and explicitly labeled.

Primary object classes to expose
## 1. Source object

Represents the currently selected source window or source region.

Must show:

source identity
time span
source availability status
declared lens/window context
## 2. Spectral state object

Represents the structural state derived from the source window.

Must be the main structural anchor for operator understanding.

Must show:

time span
frequency distribution
local state identity
selected-window context
## 3. Retained signature object

Represents the compressed / retained structural trace derived from the spectral state.

Must show:

retention/compression status
retained support class
what survives
what is explicitly not preserved
## 4. Replay object

Represents re-exposure of available source/support under declared replay posture.

Must show:

replay source
live-source vs retained-source basis
explicit bounded claims
downgrade posture if applicable
## 5. Reconstruction object

Represents support-trace unfolding from retained structure back into bounded spectral/support form.

Must show:

reconstruction basis
source-available vs trace-only mode
explicit non-restoration posture
insufficiency/failure if present
## 6. Interpretation overlay

Represents higher-order regimes, anomaly labels, transition hints, or structural readings.

Must be overlaid on the structural path, not substituted for it.

Must show:

interpretive status
explicit lower authority than structural evidence
no stronger claims than the underlying support justifies
7. Review gate

Represents downstream request / dossier / consultation-prep surfaces.

Must remain visibly fenced from the primary structural path.

Must show:

below-authority status
candidate / request preparation posture
explicit non-canon / non-fulfillment posture

This aligns directly with the anti-overclaim and packet-movement rules.

## Primary layout rule

The first bounded operator view should prefer:

Band 1 — Source + structural anchor
waveform/source pane
spectrogram/time-frequency pane
selected time window
Band 2 — Retention / replay / reconstruction
retained signature view
replay object status
reconstruction object status
source-available vs trace-only mode
Band 3 — Interpretation overlay
regime labels
transitions
anomaly / continuity hints
Downstream gated area
request prep
candidate dossier
review support

Do not collapse all of these into a single visually undifferentiated surface.

Timeline rule

The view should use one shared active timeline / window selector.

The timeline should:

move source and spectral state together
update retained signature context
update replay / reconstruction comparison surfaces
update interpretation overlays

Do not begin with multiple competing timeline controls.

One bounded time slider is enough for the first legibility pass.

Visualization rule for spectral state
Primary spectral-state view

Use a spectrogram-like time-frequency heatmap as the main structural visualization.

Reason:

preserves time evolution
preserves frequency distribution
stays closer to actual signal structure
makes replay / reconstruction comparison possible
avoids overly interpretive geometry
Secondary spectral-state view

Add a selected-window spectrum (EQ-like slice) for the currently highlighted window.

Reason:

lets the operator inspect the current local state more directly
complements the time-frequency view
supports per-window audit without replacing the main timeline
Not primary yet

Do not make cymatic / geometric renderings the primary operator truth view.

Those may be useful later as lab views, but for current audit they are too easy to overread.

## Replay / reconstruction branching rule

The interface should make the following modes explicit:

Live source available

Primary action:

replay from source/support

Optional action:

reconstruct from retained trace for comparison or retention-study purposes
Live source unavailable / retained trace only

Primary action:

reconstruct from retained trace
replay under explicit retained/support posture

Do not collapse replay and reconstruction into one button or one object state.

This is directly required by declared-vs-mechanized and replay-honesty posture.

Status vocabulary to expose visually

Each visible object should carry a simple status badge such as:

available
retained
replayable
reconstructable
partial
insufficient_support
review_ready
candidate_only

Avoid stronger language like:

promoted
authoritative
canonical
restored

unless and until a later lawful seam truly supports it.

## First-leg non-goals

This first operator-legibility pass should not attempt to solve:

full live-stream timestamp architecture
complete retention-tier navigation
full cross-session continuity
full canon/consultation protocol
full symbolic interpretation system
semantic fusion of all panes
generalized workflow engine logic

Those are later concerns.

The current goal is narrower:

make the active object path visible enough for Reed to audit it honestly
Gate question for this spec

Before adding a new operator surface, ask:

Does this new surface make the current bounded object path more causally legible, or does it merely add richer display without clarifying object identity, provenance, support status, and next lawful action?

If it does not improve causal legibility, it should not be primary.

## One-line summary

The first operator-legibility surface should render one bounded causal path from source to spectral state to retained signature to replay/reconstruction, with interpretation as overlay and review as gated downstream surface, so Door One becomes operator-legible without inflating authority or collapsing structural distinctions.

---

## Placement and implementation notes

This section defines how the Operator Legibility surface should be introduced into the app.

It is a bounded implementation-guidance addendum.

It does **not**:
- replace existing replay/demo/request surfaces immediately,
- define a final app-wide UI architecture,
- authorize broader shell redesign by itself,
- or uplift the Operator Legibility surface into a stronger authority class.

Its purpose is narrower:
- define where the surface belongs,
- define how it should be staged in,
- preserve shell coherence during adoption,
- and prevent the legibility surface from becoming just another parallel pane without reducing operator blur.

### Placement rule

The Operator Legibility surface should live inside the main app shell as the primary operator-facing mode.

It should not begin as:
- a detached diagnostics-only page,
- a hidden lab-only surface,
- or a full replacement of all existing panes on first introduction.

The intended posture is:

- one app shell
- one primary operator mode
- existing demo/replay/request surfaces retained as secondary modes during transition

### Initial shell posture

During the first implementation pass, the shell should prefer a mode structure such as:

- `Operator`
- `Replay / Demo`
- `Request / Review`

Other existing lab or tandem surfaces may remain available where still useful, but they should not compete equally with the primary operator path if doing so preserves the same current blur.

### Adoption rule

The Operator Legibility surface should be introduced in three stages.

#### Stage 1 — Introduce as bounded mode

Add the surface as a selectable mode inside the existing shell.

Goal:
- make the causal object path visible
- compare its usefulness against current panes
- avoid destructive replacement too early

#### Stage 2 — Make default if proven

If the surface becomes useful enough for routine operator understanding, make it the default shell landing mode.

This should happen only after:
- bounded operator usefulness is demonstrated,
- the view remains provenance-first and non-authoritative,
- and the shell remains compositionally stable.

#### Stage 3 — Reduce or absorb older surfaces later

Only after the Operator view has proven itself should older demo/read-side surfaces be:
- reduced,
- absorbed,
- relabeled,
- or retired.

Do not force this early.

### Why this placement is preferred

This placement is preferred because current development pressure already prioritizes:

- app surface stabilization,
- mode coherence,
- provenance-first rendering order,
- shell composition stability,
- and drift reduction across panes. 

The Operator Legibility surface should reduce blur in those exact areas rather than becoming another equal-weight pane that increases shell sprawl. :contentReference[oaicite:1]{index=1}

### Non-replacement rule

The Operator Legibility surface is initially a legibility aid and bounded primary-view candidate.

It is not yet:
- proof that older surfaces are obsolete,
- proof that app architecture is finalized,
- or proof that all read/runtime tensions are resolved.

The first correct use is:
- a bounded primary-view prototype
- tested against current seams
- compared against the existing shell
- and refined until object-path clarity improves materially

### Implementation rule

Implementation should prefer:

- smallest lawful shell change
- minimal new routing complexity
- no hidden authority uplift
- explicit mode labeling
- explicit non-claims
- reuse of real backend/runtime state rather than local-only shape
- visible relationship to current replay/reconstruction/retention seams

Do not use this surface to smuggle in:
- semantic reinterpretation,
- canon-adjacent behavior,
- hidden workflow authority,
- or a broader UI redesign than the packet admits.

### First-pass success condition

The first pass is successful enough when Reed can answer, from the new primary surface and without heavy theory reconstruction:

1. what object is active
2. where it came from
3. what transform produced the next object
4. what is source-available vs retained-only
5. what replay and reconstruction each mean here
6. what the interpretation layer is adding
7. what remains below review / consultation / authority

If those questions are still hard to answer, the surface should be refined further before it becomes the unquestioned shell center.

### Relationship to development order

This surface should be completed as a bounded closure step near the end of Leg 1 and then used as an operator aid for:

- Leg 2 — reconstruction fidelity and replay honesty
- Leg 3 — identity / memory / compression tracking
- later legs only after those relationships become clearer

This keeps the surface aligned with the current developmental order instead of turning it into a premature future-leg expansion. 

### One-line placement summary

The Operator Legibility surface should be introduced inside the existing main app shell as a bounded primary operator mode, retained alongside current secondary demo/replay/review modes until it proves materially better at making the active object path causally legible without increasing authority or pane sprawl.

## Operator Audit and Review Questions

