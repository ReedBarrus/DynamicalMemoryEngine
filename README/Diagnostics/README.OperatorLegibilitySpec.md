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

---

## Operator legibility audit and review block

This section defines the bounded operator-audit block for the Operator Legibility surface.

It is a supporting read-side audit addendum.

It does **not**:
- override the Master Constitution,
- override the Workflow Contract,
- replace the Active Law Kernel,
- replace the Declared vs Mechanized Audit,
- replace the Mechanization Closure Gate,
- or create a new authority layer.

Its purpose is narrower:
- evaluate whether the Operator Legibility surface is actually making the active object path more causally legible,
- detect display richness that outruns operator understanding,
- detect compression-bloat and seam blur,
- and preserve honest status visibility while the primary operator surface is being developed.

This section should remain small and practical.

### Why this section exists

A system may be lawful while still failing operator legibility.

In that condition:
- structural support may exist,
- runtime seams may be bounded,
- replay/reconstruction/retention posture may be real,
- and yet the operator still cannot tell what object is active, how it was produced, what it is allowed to claim, or what should happen next.

This creates a real development risk:
- theory reconstruction replaces direct audit,
- rich surfaces begin to feel stronger than the mechanism beneath them,
- object identity blurs across the read/runtime boundary,
- and the operator starts projecting “system wrong” when the more precise issue is “system not yet legible.”

This audit block exists to prevent that drift.

### Core audit rule

The Operator Legibility surface is successful only when it improves the operator’s ability to track one bounded object path through the current Door One seam without requiring heavy theory reconstruction, silent overclaim, or visual seam fusion.

If the surface becomes richer without becoming clearer, it has not yet passed the audit.

### Audit 1 — Operator legibility audit

#### Bounded question

Can Reed look at the active Operator surface and correctly narrate the current bounded object path without rebuilding the architecture from memory?

#### Audit questions

1. What object is active right now?
2. Where did it come from?
3. What transform produced the next visible object?
4. What support tier or support status is visible?
5. What is source-available versus retained-only?
6. What can this object legally claim?
7. What is the next lawful action from here?

#### Failure signal

If these questions cannot be answered from the surface itself, the surface is still too opaque for primary operator use.

### Audit 2 — Object-path continuity audit

#### Bounded question

Does the surface make the causal path across active Door One objects visible enough that identity continuity and downgrade posture can be followed directly?

#### Audit target path

The primary object path should remain visually and semantically distinguishable across:

- source object
- spectral state object
- retained signature object
- replay object
- reconstruction object
- interpretation overlay
- review/request gate

#### Audit questions

1. Can the operator see where one object ends and the next begins?
2. Can the operator tell which objects are structural and which are interpretive?
3. Can the operator tell which objects are support-bearing and which are review-facing?
4. Can the operator tell when the same bounded object is preserved versus narrowed, downgraded, or split?

#### Failure signal

If multiple distinct object classes blur into one display story, the surface is preserving visual convenience at the cost of lawful identity clarity.

This audit should remain aligned with Structural Identity Law. :contentReference[oaicite:0]{index=0}

### Audit 3 — Status-honesty audit

#### Bounded question

Is each visible object or feature being presented at the right status level?

#### Status vocabulary

Use the declared-vs-mechanized and closure-gate posture directly:

- declared
- displayed
- partially_mechanized
- mechanized

Where relevant, visible object states may also include:

- available
- retained
- replayable
- reconstructable
- insufficient_support
- review_ready
- candidate_only

#### Audit questions

1. Is this feature only declared?
2. Is it merely displayed?
3. Is it partially mechanized?
4. Is it actually mechanized at the declared seam?
5. Is the UI language stronger than the current seam support justifies?

#### Failure signal

If a visible surface feels more complete, authoritative, or reconstructive than the backend actually supports, the surface has failed status honesty.

This audit should remain aligned with the Declared vs Mechanized Audit and the Mechanization Closure Gate. 

### Audit 4 — Compression-bloat audit

#### Bounded question

Is the Operator surface preserving real new distinctions, or merely restating nearby structure in richer visual form?

#### Audit questions

1. What new bounded distinction does this new pane, overlay, badge, or object preserve?
2. What existing surface already preserves that distinction?
3. Is this addition increasing capability, or only increasing repetition?
4. Is this addition improving accountability, or only making the app feel denser?
5. Is this a real new object, or a restatement of a nearby one?

#### Preferred actions when bloat is detected

- reduce
- merge
- narrow
- relink instead of restating
- downgrade to reference-only posture
- defer until a real distinction appears

#### Failure signal

If a new surface increases apparent richness without increasing bounded understanding, auditability, or support visibility, it is compression-bloat and should not remain primary.

This keeps the legibility surface aligned with the compression-audit posture in the Door One developmental line. :contentReference[oaicite:2]{index=2}

### Audit 5 — Seam-boundary audit

#### Bounded question

Is the surface still representing one bounded operator seam, or has it silently mixed multiple seams into one convenience layer?

#### Audit questions

1. Is this still one bounded operator-legibility seam?
2. Has runtime meaning been fused with read-side interpretation?
3. Has replay been fused with reconstruction?
4. Has retention been fused with authority posture?
5. Has review/request preparation been fused with fulfillment or promotion?

#### Failure signal

If the surface requires multiple real seams to be interpreted as one object, it has likely crossed from legibility aid into seam fusion.

If that happens, prefer:
- split
- narrow
- relabel
- or gate more clearly

This audit should remain aligned with the Packet Workflow Chain’s one-seam / one-closure-target rule. :contentReference[oaicite:3]{index=3}

### Audit 6 — Review-boundary audit

#### Bounded question

Does the surface preserve a clear downstream gate between operator understanding and authority-adjacent preparation?

#### Audit questions

1. Is request/review/candidate posture visually fenced from the primary structural path?
2. Is prepared request still clearly distinct from fulfilled review?
3. Is candidate posture still clearly distinct from canon?
4. Is the downstream review gate presented as a request path rather than an authority path?

#### Failure signal

If the operator view makes review preparation feel like authority attainment, the downstream gate is not clear enough.

This audit should remain below canon and below consultation fulfillment posture. 

### Recommended review cadence

Run this operator audit block:

- after each meaningful Operator-surface packet,
- after any new object-path visualization change,
- after any new replay/reconstruction/retention UI change,
- and before making the Operator surface the unquestioned default shell landing mode.

### Minimal audit summary template

Use the following summary when reviewing the Operator surface:

```text
Operator Legibility Audit — [surface/version]

Bounded question
[what exact operator understanding this surface is supposed to provide]

What is now clearly visible
- ...
- ...

What remains blurred
- ...
- ...

Status honesty check
- declared / displayed / partial / mechanized issues:
- ...

Compression-bloat check
- new distinctions preserved:
- duplicate/restated surfaces:
- ...

Seam-boundary check
- still one bounded seam? yes / no
- if no, where does fusion appear?

Review-boundary check
- request/review/candidate fence clear? yes / no
- notes:
- ...

Operator outcome
- accept
- revise
- narrow
- defer
- escalate

What is now true
- ...

What is still not claimed
- ...

