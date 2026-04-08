# DME — Runtime Language Evaluation

## Status

This document evaluates runtime language options for the next rebuild phase of the Dynamical Memory Engine, with special attention to the newly declared operator-lane architecture.

It is a supporting implementation-strategy note.

It does **not** override:

* `README_MasterConstitution.md`
* `README_WorkflowContract.md`
* `README.StructuralIdentityLaw.md`
* `README.DeclaredVsMechanizedAudit.md`
* `README.MechanizationClosureGate.md`
* `README.PacketWorkflowChain.md`
* `README_DoorOneDevelopmentalOutline.md`
* `README/core/OperatorLane/README.OperatorLanesContract.md`
* `README/core/OperatorLane/README.PrimaryTemporalLaneContract.md`
* `README/core/OperatorLane/README.PrimaryTransformLaneContract.md`

Its purpose is narrower:

* evaluate whether JavaScript remains a lawful host for the next rebuild,
* identify what pressures might justify migration of the operator core,
* distinguish shell/runtime/UI concerns from structural operator concerns,
* compare plausible language/runtime options under DME priorities,
* and recommend a bounded posture rather than a premature full-stack rewrite.

This note governs **runtime language evaluation posture** only.

It does **not** govern:

* architectural truth by itself,
* operator contracts by itself,
* canon activation,
* future product packaging by itself,
* or a mandatory migration decision.

---

## 1. Why this note exists

DME is beginning a structural rebuild from the bottom of the operator spine upward.

That makes the language question newly relevant.

The system is no longer asking only:

* can the current code run,
* can the current shell display,
* or can the current repo keep moving.

It is now asking:

* what runtime is most lawful for a lane-pure operator spine,
* what runtime best preserves deterministic operator contracts,
* what runtime makes contamination harder rather than easier,
* and whether the current JavaScript host is a temporary scaffold or a durable substrate.

This note exists so that the migration question can be evaluated explicitly instead of being answered indirectly by convenience, frustration, or tool familiarity.

One-line summary:

**DME should choose runtime language based on contract truth, determinism, auditability, and future operator pressure — not only on current familiarity or hype.**

---

## 2. Core evaluation rule

**A runtime language is a good fit for DME only to the degree that it helps preserve lane purity, deterministic operator behavior, auditable transformations, bounded dataflow, and scalable implementation honesty under the declared operator contracts.**

Corollary rules:

* familiarity is not enough,
* speed is not enough,
* strict typing is not enough,
* research convenience is not enough,
* ecosystem size is not enough,
* and a migration is not justified if it only rehosts the same mixed seam behavior.

If a language change does not materially improve the operator rebuild posture, it should remain deferred.

---

## 3. Current decision posture

The current best posture is:

**stabilize the lane contracts first, then choose whether JavaScript remains the operator host, becomes only the shell host, or is replaced in the operator core.**

This means:

* migration is a live question,
* migration is not yet mandatory,
* and contract stabilization outranks language migration in immediate priority.

Reason:

If DME migrates languages before operator lanes, artifact boundaries, and field purity are stabilized, then the same architectural mixing may simply be rebuilt inside a stricter or faster language.

That would be a high-cost migration without real seam improvement.

---

## 4. What the language decision is actually about

The language question is not one flat question.

It is really five questions:

1. what should host the **operator core**?
2. what should host the **shell/orchestration layer**?
3. what should host the **UI / app surface**?
4. what should host **scientific experimentation / benchmarking**?
5. what should host **validation / audit tooling**?

DME does not necessarily need one answer for all five.

A split-runtime architecture may be more lawful than a single-language ideology.

---

## 5. The evaluation axes

Each candidate language/runtime should be evaluated against the following DME-specific axes.

### 5.1 Contract clarity

How well does the language help express:

* lane purity,
* operator input/output contracts,
* explicit object shapes,
* forbidden fields,
* and deterministic boundaries?

### 5.2 Determinism support

How easy is it to preserve:

* identical input + identical policy -> identical output,
* no hidden mutation,
* bounded dataflow,
* and auditable stage-local behavior?

### 5.3 Data structure discipline

How well does the language help prevent:

* mixed artifacts,
* accidental optional-field creep,
* ambient object mutation,
* silent widening of object shape,
* and lane contamination by convenience?

### 5.4 Numeric / signal-processing fitness

How strong is the runtime for:

* array-heavy signal flow,
* transform operations,
* performance under repeated runs,
* memory efficiency,
* and later DSP/numeric pressure?

### 5.5 Tooling and observability

How easy is it to:

* test operator seams,
* benchmark deterministically,
* inspect exact emissions,
* validate schemas/contracts,
* and instrument runtime failures honestly?

### 5.6 UI / shell integration

How well does the language integrate with:

* browser HUDs,
* orchestration surfaces,
* CLI tools,
* local app surfaces,
* and later demo/product shells?

### 5.7 Migration cost

What is the real cost in:

* time,
* rewrite pressure,
* new tooling,
* build complexity,
* dependency overhead,
* and loss of current momentum?

### 5.8 Long-run maintainability

How likely is the language/runtime choice to support:

* future operator expansion,
* future performance needs,
* future testing rigor,
* and future multi-person collaboration?

---

## 6. Current JavaScript posture

### 6.1 What JavaScript currently does well for DME

JavaScript is currently strong for:

* rapid iteration,
* low-friction scripting,
* shell and app wiring,
* browser-facing inspection surfaces,
* JSON-native artifact handling,
* easy local tooling,
* and short feedback loops.

It is especially useful for:

* HUD and viewer work,
* shell orchestration,
* export/import tooling,
* test harnesses,
* and bounded operator prototyping.

### 6.2 What JavaScript currently does poorly for DME

JavaScript is weak where DME increasingly cares about:

* strong compile-time contract enforcement,
* preventing object-shape drift,
* preventing optional-field creep,
* making mixed seams hard to express,
* numeric-performance ceiling,
* and long-run operator-core rigidity.

Its biggest risk is not that it is “bad.”
Its biggest risk is that it is permissive.

That permissiveness makes it easy to:

* attach extra fields casually,
* mutate objects quietly,
* widen artifacts by convenience,
* and preserve mixed bundles longer than intended.

That is directly relevant to the contamination problem DME just surfaced.

### 6.3 Current JavaScript verdict

**JavaScript remains a lawful host for the rebuild only if contracts become much stricter than the language naturally enforces.**

This means JavaScript is viable, but it requires discipline to compensate for its permissive default posture.


### 6.4 TypeScript vs plain JavaScript

Because DME is currently implemented in JavaScript-family tooling, one immediate decision matters before any broader migration question:

Should the next rebuild stay in plain JavaScript, or tighten immediately into TypeScript?

This is a narrower and more immediate question than full runtime migration.

### Plain JavaScript
Strengths
lowest friction
fastest raw iteration
no compile step burden beyond the current toolchain
easiest continuity with the existing repo state
Weaknesses
weakest shape enforcement
easiest environment for accidental mixed artifacts
optional-field creep is too easy
lane contamination can hide inside ordinary object extension
contract truth depends heavily on discipline, tests, and review rather than language assistance
DME verdict

Plain JavaScript is the weakest acceptable option for the rebuild.

It is still possible to use, but only if DME deliberately accepts that almost all lane-purity enforcement must come from validators, tests, comments, and review discipline rather than from the language itself.

### TypeScript
Strengths
much stronger object-shape discipline
better expression of operator input/output contracts
easier enforcement of lane-specific object families
better tooling for forbidden-field pressure and refactor safety
better fit for the newly declared lane model than plain JavaScript
preserves continuity with the current browser/shell stack
Weaknesses
still not enough by itself to guarantee runtime purity
runtime validators are still required
can create false confidence if types are treated as stronger than actual runtime enforcement
adds some build and typing overhead during rapid experimentation
DME verdict

TypeScript is the preferred JavaScript-family host for the next rebuild.

It does not solve the whole problem, but it materially improves the rebuild floor without forcing an immediate cross-language migration.

### Immediate recommendation

If DME stays in the JavaScript family for the first rebuild pass, it should prefer:

TypeScript for operator contracts and artifact types
runtime validators for actual lane enforcement
plain JavaScript only for narrow legacy carryover or small utility seams

### One-line summary:

If the question is plain JavaScript vs TypeScript, DME should choose TypeScript unless there is a very specific short-term reason not to.
---

## 7. Candidate runtime postures

## 7.1 JavaScript / TypeScript

### Best fit

* shell/orchestration
* browser/UI surfaces
* JSON packet handling
* early contract prototyping
* validation tooling

### Strengths

* fastest current path from contract to working code
* strong UI integration
* excellent iteration speed
* TypeScript can improve shape discipline substantially over plain JavaScript
* good enough for early operator implementations if dataflow is kept simple and test-backed

### Weaknesses

* plain JavaScript is too permissive for long-run operator-core trust
* even TypeScript cannot fully guarantee runtime purity without disciplined validation
* numeric stack is weaker than Python/Julia and lower-level than Rust/C++
* easy to accidentally mix structural and support fields on the same object

### DME verdict

**Good shell language. Acceptable early operator language. Unclear best long-run core language unless paired with stronger contract/runtime validation.**

---

## 7.2 Python

### Best fit

* research experiments
* numeric prototyping
* benchmarking
* data analysis
* scientific exploration around operators

### Strengths

* strongest practical experimentation ecosystem
* easy DSP/numeric exploration
* fast benchmarking iteration
* rich plotting/analysis stack
* excellent for trying alternate transforms, windows, compression rules, and audit tools

### Weaknesses

* not ideal for browser shell/UI
* still dynamically typed by default
* can drift semantically if discipline is weak
* deployment/runtime packaging can get messy
* not necessarily the best fit for a strict deterministic product core without additional rigor

### DME verdict

**Excellent research-side companion language. Good for experimentation and benchmarks. Not obviously the best single-language replacement for the full operator runtime by itself.**

---

## 7.3 Rust

### Best fit

* long-run operator core
* deterministic transform spine
* strict artifact/lane enforcement
* high-performance DSP/numeric operators
* audited local libraries with strong contracts

### Strengths

* strong type system
* ownership/immutability patterns help prevent accidental mutation
* good fit for explicit operator contracts
* good performance ceiling
* better long-run confidence for lane-pure artifact families
* easier to make mixed artifacts painful rather than convenient

### Weaknesses

* slower iteration early on
* higher implementation complexity
* heavier learning and tooling burden
* UI/shell work still less natural than JS/TS
* may slow exploratory development if adopted too early or too broadly

### DME verdict

**Strongest candidate for a future operator-core language if DME wants contract rigidity, performance, and reduced seam drift. Best used after the contracts themselves are stabilized.**

---

## 7.4 Julia

### Best fit

* transform-heavy numeric experimentation
* mathematical modeling
* signal-processing exploration
* performance-conscious research prototypes

### Strengths

* very strong numeric ergonomics
* expressive for array-heavy transforms
* attractive for mathematical operator research
* potentially excellent for transform/compression experimentation

### Weaknesses

* smaller general tooling ecosystem than Python
* less natural fit for shell/UI layers
* weaker team/common-tool familiarity pressure in many environments
* may increase integration complexity if adopted as the primary runtime too early

### DME verdict

**Interesting research-side option, especially for numeric operator exploration. Less compelling as the default whole-project runtime unless DME becomes strongly math-first and shell-light.**

---

## 7.5 C++

### Best fit

* maximum low-level DSP control
* highly optimized signal-processing core
* performance-critical libraries

### Strengths

* excellent performance ceiling
* deep DSP ecosystem possibilities
* maximal low-level control

### Weaknesses

* high complexity cost
* slower development loop
* greater risk of implementation burden overwhelming architectural progress
* less attractive for rapid contract iteration
* harder to keep bounded patches small during early rebuild

### DME verdict

**Too heavy as the immediate rebuild language. Potential future backend layer only if DME later proves it needs that level of control/performance.**

---

## 8. Plausible architecture options

## Option A — Stay in JavaScript/TypeScript for now

### Shape

* operator core in JS/TS
* shell/orchestration in JS/TS
* UI in JS/TS
* tests/validation in JS/TS

### Advantages

* lowest migration cost
* fastest rebuild start
* easiest current continuity

### Risks

* contract drift remains easier unless validation is extremely strict
* long-run operator core may stay too permissive

### Best use

Use this if the immediate goal is fastest rebuild under newly strict lane contracts.

---

## Option B — JS/TS shell, Rust operator core

### Shape

* operator core in Rust
* shell/orchestration in TS
* UI in TS/React
* validation split across Rust + TS

### Advantages

* best long-run discipline split
* shell remains fast and ergonomic
* operator core gains strictness and performance
* lane law becomes easier to encode as real types/contracts

### Risks

* integration complexity
* more initial setup
* slower first implementation wave

### Best use

Use this if DME wants the strongest long-run operator substrate without sacrificing browser/app ergonomics.

---

## Option C — JS/TS shell, Python research lane, decide core later

### Shape

* operator rebuild initially in TS
* benchmark and alternate operator experiments in Python
* shell/UI remain in TS
* migration decision deferred until benchmark and pressure data accumulate

### Advantages

* keeps momentum
* gains research-side strength immediately
* avoids premature full rewrite
* lets the language decision be evidence-backed

### Risks

* two-language complexity begins early
* core migration can still be deferred too long
* architectural duplication risk if contracts are not shared cleanly

### Best use

Use this if DME wants to preserve current build speed while opening a serious research-side lane for comparison.

---

## Option D — Full Rust migration now

### Shape

* operator core in Rust
* shell potentially in Rust or mixed
* UI bridged separately

### Advantages

* maximum immediate discipline
* one strong language story for the core

### Risks

* very high near-term rebuild friction
* may slow architecture stabilization rather than help it
* risks converting a contract problem into a tooling burden

### Best use

Use this only if contract confidence is already high and the team is ready to absorb the migration cost now.

---

## 9. Migration triggers

A migration away from JS/TS for the operator core becomes more justified if one or more of the following become true:

1. lane contamination keeps recurring despite clear contracts and tests,
2. operator performance becomes a serious bottleneck,
3. artifact-shape drift remains too easy to introduce,
4. deterministic validation becomes too fragile in the current runtime,
5. operator-core complexity grows enough that stronger type discipline materially reduces risk,
6. or benchmarking shows clear runtime advantages for another core language.

If none of these pressures are active yet, migration should remain optional rather than mandatory.

---

## 10. Recommended current posture

The current recommended posture is:

### Phase 1

* finalize lane and primary contracts
* rebuild the first four operators against those contracts
* enforce strict object-shape validation
* observe whether JS/TS is sufficient under the stricter contract regime

### Phase 2

* run bounded benchmarking and implementation-comparison passes
* compare JS/TS implementation cost vs Rust and/or Python experimental versions
* identify real pressure: correctness, performance, or maintainability

### Phase 3

* choose one of three outcomes:

  * stay in TS for the operator core,
  * move the operator core to Rust,
  * or keep TS shell + Python experimental lane while postponing core migration slightly longer

This keeps the language decision subordinate to evidence.

---

## 11. Current recommendation by layer

If DME had to choose today, the best provisional split would be:

* **UI / app surface:** TypeScript / React
* **Shell / orchestration:** TypeScript
* **Operator core (immediate rebuild):** TypeScript with strict contracts and validators
* **Operator core (long-run strongest candidate):** Rust
* **Benchmarking / scientific experimentation:** Python
* **Heavy numeric research alternative:** Julia (optional, not primary)

This is not a final mandate.
It is the cleanest current provisional posture.

---

## 12. Non-goals

This note does not yet decide:

* packaging/deployment strategy,
* exact FFI bridge shape,
* exact crate/module boundaries,
* exact Python benchmarking stack,
* or whether any migration should happen before the first four operators are rebuilt cleanly.

---

## 13. One-line operational summary

**Stabilize the contracts first, rebuild the first four operators under strict lane law, then let measured pressure decide whether JavaScript remains the operator host or yields the operator core to a stricter runtime such as Rust.**
