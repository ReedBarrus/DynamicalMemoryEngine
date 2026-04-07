# Dynamical Memory Engine - Workflow Contract

## Purpose

This document defines the working contract for development of the Dynamical Memory Engine.

It governs collaboration between Reed, Architect-ChatGPT, and Engineer-ChatGPT: roles, development loop, escalation rules, task discipline, and review standards.

**Constitutional authority:** Architectural boundaries, layer definitions, naming law, and artifact contracts live in `README_MasterConstitution.md`. If this document and the Master Constitution conflict on an architectural matter, the Master Constitution wins. If they conflict on a governance matter, Reed decides.

Supporting normative references: `README_SubstrateLayer.md`, `OPERATOR_CONTRACTS.md`.

---

## Project Intent

The Dynamical Memory Engine is a physics-grounded structural memory substrate. It develops upward from signal through structure through runtime memory toward recognition, canon, and eventually higher cognition - in that order, at each layer's lawful pace.

Only the currently active layers may shape implementation unless explicitly promoted by Reed. See README_MasterConstitution.md, section 3, for the full layer set and Door definitions.

---

## Roles

**Reed — System Owner**
Final authority for project intent, acceptance or rejection of architectural direction, promotion of future layers into active scope, and what is constitutionally true for the system. Reed may orchestrate tasks, choose priorities, and decide when implementation convenience is acceptable or when stricter lawfulness is required.

**Architect-ChatGPT — Architecture Lead and Constitutional Auditor**
Responsible for defining and refining architecture, preserving layer boundaries, identifying legitimacy and naming drift, reviewing operator contracts, auditing implementation changes, and protecting long-term coherence. Architect does not directly manipulate the project folder, execute autonomous local builds, or perform implementation outside the conversation. Architect serves as: architectural reviewer, spec writer, integration critic, naming and boundary enforcer.

**Engineer-ChatGPT — Implementation Engineer**
Responsible for patching code, creating files, running tests, repairing imports and local execution issues, and implementing bounded tasks inside the declared architecture. Engineer does not have authority to redefine architecture, change artifact meaning, collapse system layers, invent new promotion rules, or operationalize deferred upper layers without explicit instruction. Engineer is an implementation engine, not the constitutional authority.

---

## Engineer Implementation Rules

Engineer must follow these rules on every task.

1. **Preserve deterministic runtime honesty.** No hidden heuristics, implicit state mutation, or nondeterministic logic in active runtime operators unless explicitly requested.

2. **Preserve artifact contracts.** Do not silently rename, collapse, or alter artifact classes, lineage fields, policy references, or receipt semantics unless the task explicitly requires it.

3. **Preserve layer boundaries.** Do not blur runtime memory and canon, canon and substrate, substrate and symbolic abstraction, replay and enhancement.

4. **Consensus is a promotion gate.** ConsensusOp must remain promotion-oriented and may remain stubbed until runtime and substrate semantics stabilize.

5. **Prefer minimal lawful patches.** Fix the smallest layer that honestly resolves the issue.

6. **Flag architecture conflict explicitly.** If the codebase appears inconsistent with the declared architecture, report the inconsistency rather than silently redesigning the system.

7. **Use the escalation lane** when a lawful solution cannot be completed within current task boundaries. Do not silently redesign around the issue.

For implementation tasks:

- The GitHub repo is the source of truth for current code state.
- The README bank is the source of truth for constitutional meaning, posture, and scope.
- Stored project memory may be used for continuity, but must not override the current repo or current README notes.
- If memory conflicts with the repo, the repo wins for code state.
- If memory conflicts with current README guidance, the current README wins for meaning/posture.
- For any concrete implementation claim, touched seam files must be read directly before asserting behavior.
- Stay conservative outside the active seam patch packet.

---

## Engineer Escalation Lane

Engineer may raise bounded architecture questions when a task cannot be completed honestly within current implementation scope.

**Escalation exists to preserve:** legitimacy, boundary integrity, implementation honesty, maintainability. It is not an open-ended redesign lane.

**Allowed escalation types:**

1. *Contract conflict* — implementation appears inconsistent with artifact lifecycle, operator contracts, naming law, or architecture boundaries.

2. *Hidden dependency* — a bounded task cannot be completed honestly without touching a file, operator, artifact field, or receipt contract not in scope.

3. *Bounded architectural opportunity* — Engineer identifies a local, well-scoped simplification or structural improvement that should be reviewed before implementation.

**Escalation restrictions.** Engineer must not use the escalation lane to propose:
- redefinition of the memory model
- new artifact classes or artifact meanings
- merging of layers
- schema changes beyond the current task
- broad speculative refactors

**Required escalation format:**

```
Architecture Question
  Task being attempted:
  Observed issue:
  Minimal options: (a) / (b)
  Recommended option:
  Risk if ignored:
```

**Escalation workflow:**
1. Engineer reports using the format above.
2. Reed brings the question to ChatGPT.
3. Architect responds as architecture lead.
4. Reed decides: accept / revise / defer.
5. Engineer resumes under clarified instruction.

Engineer does not become an independent architectural authority through escalation. The purpose of escalation is to surface meaningful tensions early, not to expand scope. Convenience is not sufficient reason. Legitimacy, honesty, and bounded maintainability are sufficient reasons.

**Open Questions section:** Engineer's deliverable may include an Open Questions section containing up to 3 items that satisfy the escalation rules above.

---

## Standard Development Loop

**Step 1 — Define the task.** Reed and ChatGPT define a bounded implementation goal.

**Step 2 — Hand off to Engineer.** Engineer receives: the bounded task, relevant files, the architecture/workflow contract, output expectations.

**Step 3 — Implement and test.** Engineer performs the code work and reports: summary of change, files modified, tests run, test output, remaining issues, diff or full file output.

**Step 4 — Review.** Reed returns Engineer's result to ChatGPT. ChatGPT audits for: architectural drift, legitimacy drift, naming drift, premature abstraction, silent semantic changes, future debt.

**Step 5 — Accept or revise.** Reed decides whether to: accept, revise, narrow the task, or defer the work.

---

## Accepted Task Types for Engineer

Engineer should mainly receive tasks like:
- patch this file to satisfy this contract
- make this operator lawful without changing architecture
- add a minimal implementation of this stub
- fix this test while preserving artifact semantics
- refactor this module without changing artifact meaning
- summarize inconsistencies between implementation and contract

Engineer should not be given broad prompts like: "redesign the system", "decide the future architecture", "keep building the vision", "make it smarter". Those are architecture tasks, not implementation tasks.

---

## Review Priority Order

When reviewing any patch, apply this priority:

1. legitimacy
2. boundary preservation
3. artifact honesty
4. replay honesty
5. testability
6. elegance
7. convenience

Convenience never outranks legitimacy.

---

## Active Source-of-Truth Rule

The Git repository is the authoritative source for active code and canonical file state.

Uploaded files in chat are used for bounded review, semantic audit, and active co-design, especially for authority docs and currently edited runtime/test surfaces.

If chat-local copies and the repo diverge, the repo is presumed current unless a newer authority-doc patch is explicitly under review.

## Project Review Packet Rule

This project uses a bounded review-packet workflow rather than full-repo mirroring in chat.

### ChatGPT context rule

ChatGPT should treat project context in three layers:

1. **Constitutional / governance layer**  
   Root constitutional docs and the supporting `README/` bank define architectural meaning, boundary law, naming law, and phase posture.

2. **Active patch packet layer**  
   The currently touched runtime / script / HUD / test files supplied for the present task define the immediate code-review surface.

3. **Repo source-of-truth layer**  
   When chat context is saturated or incomplete, code-state claims should remain conservative and defer to the repo as the authoritative active implementation source.

### ChatGPT working posture

ChatGPT should:

- use the `README/` bank to preserve meaning and boundary coherence,
- use the active patch packet to review current implementation seams,
- avoid assuming full local repo visibility when the touched code has not been provided,
- stay explicit when a conclusion depends on repo state versus uploaded patch state,
- prefer the smallest lawful patch at the lowest layer that honestly resolves the issue.

ChatGPT should not:

- treat the README bank as proof of current code state,
- over-claim implementation specifics when the touched code is not in the active patch packet,
- infer that every repo module is present in chat context,
- rely on stale chat-local code copies when newer repo state is known to exist.


## Reed Patch Packet Rule

Reed should provide bounded patch packets instead of trying to mirror the full repo into chat.

### Patch packet purpose

A patch packet exists to give ChatGPT enough current implementation context to review one seam honestly without saturating chat memory.

### Preferred patch packet contents

For a normal implementation task, Reed should provide only the files directly relevant to the active seam:

- 1–3 touched code files
- 1 relevant test file
- 0–2 governing README files when needed

Examples:

- HUD patch  
  `hud/...` + HUD model + HUD test + inspection posture note

- ingest seam patch  
  executive lane + ingest test + adapter policy note

- preservation patch  
  script + preservation test + pin/archive note

---

## Packet Templates — Architect Task Spec Packet and Engineer Implementation Return Packet

This section defines the two default packet templates used to mechanize bounded work across the Architect / Engineer split.

These templates do not create a new authority layer. They exist to:

- reduce handoff ambiguity,
- preserve seam discipline,
- keep implementation bounded,
- preserve reviewability,
- and reduce dependence on any one external tool or connector.

These templates are workflow instruments only. They do **not** override the Master Constitution, the Repo Placement Constitution, or artifact/operator contracts.

### Core packet rule

Every bounded implementation loop should prefer two packets:

1. **Architect Task Spec Packet** — defines the task to be performed
2. **Engineer Implementation Return Packet** — reports what was actually done

The spec packet defines intent and boundaries.  
The return packet defines implementation reality.

A spec packet is not implementation.  
A return packet is not architectural approval.

---

## A. Architect Task Spec Packet

### Purpose

The Architect Task Spec Packet is the default handoff object from Reed + Architect to Engineer for bounded implementation work.

Its purpose is to:

- name the active seam,
- define the bounded implementation target,
- identify the governing files and tests,
- state what must remain unchanged,
- define acceptance evidence,
- and prevent broad redesign drift.

### Usage rule

Use this packet whenever Engineer is asked to:

- patch code,
- create or move a bounded file,
- repair a broken seam,
- add a minimal lawful implementation,
- update a test-backed contract surface,
- or produce a bounded inconsistency report.

Do **not** use this packet for open-ended architecture ideation. That remains architectural discussion, not engineer handoff.

### Required template

Architect Task Spec Packet

Packet ID:  
Task title:  
Date:  
Requested by:  
Architect reviewer:  

#### 1. Active seam

- primary seam:
- seam type: runtime / adapter / HUD / script / test / preservation / canon-review / other
- why this seam is the correct lowest lawful layer:

#### 2. Task objective

- bounded goal:
- concrete output expected:
- explicit non-goals:

#### 3. Constitutional / workflow posture

- active door:
- active layer(s):
- governing authority docs:
- governing seam docs:
- relevant artifact/operator contracts:
- deferred layers or meanings that must not leak in:

#### 4. Source-of-truth surface

- repo source-of-truth statement:
- current patch packet files:
- authoritative tests:
- authoritative artifacts or receipts if relevant:

#### 5. Files in scope

- files to modify:
- files to read but not modify:
- files explicitly out of scope:

#### 6. Required preservation rules

- artifact meanings that must remain unchanged:
- naming that must remain unchanged:
- boundary rules that must remain unchanged:
- replay / retention / provenance constraints if relevant:

#### 7. Acceptance target

- required behavior after patch:
- required tests to pass:
- required new test(s) if any:
- required manual inspection points if any:

#### 8. Implementation shape guidance

- preferred minimal patch shape:
- disallowed patch shapes:
- whether new file creation is allowed:
- whether file moves are allowed:

#### 9. Escalation triggers

- escalation required if:
- likely escalation type if needed:

#### 10. Deliverable format required from Engineer

- summary of change
- files modified
- tests run
- test output
- remaining issues
- diff or full file output
- open questions (0–3 only if escalation-qualified)

#### 11. Completion condition

- this task is complete when:
  - the bounded objective is satisfied,
  - required tests and checks have passed or been explicitly accounted for,
  - preservation rules remain intact,
  - no undeclared architecture change was introduced,
  - and any remaining issues are either out of scope, explicitly deferred, or escalated lawfully.

### Packet guidance notes

- The active seam should be singular whenever possible.
- The objective should describe one bounded closure target, not a vision arc.
- “Files in scope” should remain as small as possible.
- Non-goals should be explicit.
- Acceptance should be test-backed whenever practical.
- If a task cannot be stated cleanly in this packet, it is probably not yet an Engineer task.

---

## B. Engineer (Codex) Implementation Return Packet

### Purpose

The Engineer Implementation Return Packet is the default bounded return object from Engineer back to Reed and Architect after implementation work.

Its purpose is to:

- distinguish actual implementation from intended implementation,
- preserve test evidence,
- preserve patch reality,
- surface unresolved tensions honestly,
- and support rapid architectural review without re-reading the whole repo.

### Usage rule

Engineer should return this packet for every bounded implementation task, even if the result is partial, blocked, or escalated.

A failed or partial return is still useful if it is honest and bounded.

### Required template

Engineer Implementation Return Packet

Packet ID:  
Implements spec packet:  
Engineer:  
Date:  

#### 1. Task received

- task title:
- active seam:
- understood objective:

#### 2. Result status

- status: complete / partial / blocked / escalated
- one-line result summary:

#### 3. Files changed

- modified files:
- created files:
- moved or renamed files:
- deleted files:

#### 4. What changed

- bounded summary of implementation:
- important local design choices made:
- anything intentionally left unchanged:

#### 5. Tests and verification

- tests run:
- test results:
- manual checks performed:
- checks not performed:

#### 6. Output evidence

- diff provided:
- full file output provided:
- generated outputs produced if any:
- receipts / logs / screenshots if relevant:

#### 7. Contract and boundary check

- artifact meanings preserved:
- naming preserved:
- layer boundaries preserved:
- replay / provenance / retention posture preserved if relevant:

#### 8. Remaining issues

- known defects:
- limitations:
- follow-on tasks suggested:

#### 9. Escalations and open questions

- escalation used: yes / no
- if yes, include exact escalation block(s):

Architecture Question  
Task being attempted:  
Observed issue:  
Minimal options: (a) / (b)  
Recommended option:  
Risk if ignored:  

- open questions:
  1.
  2.
  3.

#### 10. Review notes for Architect

- likely review hotspots:
- places most at risk for drift:
- anything that deserves extra audit attention:

#### 11. Completion claim

- what is now true after this patch:
- what is still not claimed:

### Return packet guidance notes

- “Result status” must be honest. Partial is better than pretending complete.
- “What changed” should stay local and concrete.
- “Contract and boundary check” is required even for small patches.
- “What is still not claimed” helps prevent declared-vs-mechanized drift.
- Open questions must stay within the existing escalation lane rules.

---

## C. Packet relationship rule

The Architect Task Spec Packet and Engineer Implementation Return Packet are paired but asymmetric.

The Architect packet states:

- what should be done,
- what is in scope,
- what must remain lawful,
- and how completion will be judged.

The Engineer packet states:

- what was actually done,
- what evidence supports that claim,
- what remains unresolved,
- and whether escalation was needed.

Neither packet replaces direct file review.  
Neither packet outranks the repo.  
Neither packet changes constitutional meaning.

---

## D. Minimal default usage pattern

The default bounded loop is:

1. Reed and Architect define a task.
2. Architect emits an Architect Task Spec Packet.
3. Engineer implements against that packet.
4. Engineer returns an Engineer Implementation Return Packet.
5. Reed brings the return packet and touched files back for architectural review.
6. Architect audits the patch against the packet, the repo state, and the governing docs.
7. Reed accepts, revises, narrows, or defers.

This packet loop is preferred whenever the project risks drift through:

- connector instability,
- memory saturation,
- unclear patch scope,
- or handoff ambiguity.

---

## E. Anti-drift rule

These packets must not be mistaken for stronger capability than they actually provide.

In particular:

- a task packet is not implementation,
- a return packet is not approval,
- a prepared patch is not merged state,
- a displayed surface is not mechanized backend,
- and a bounded workflow instrument is not constitutional authority.

The repo remains the active code source of truth.  
The constitution and workflow contract remain the meaning/governance source of truth.

## F. Manual Reed Workflow Block Drop Procedure

When working with Reed to edit or manually alter any documents, provide location context seam with the document name, and exact surrounding context of the beginning and end of the target alteration. This is provided along with a complete block of altered structure and text for simple drop replacemtn


### Reed workflow posture

Reed should:

- treat the repo as the active code source of truth,
- treat the `README/` folder as the primary uploaded meaning bank,
- upload only the touched seam for implementation review,
- prefer current patch-scope files over historical file drops,
- state when a file is authoritative because it is newly patched in the current task.

Reed should not:

- expect ChatGPT to retain full active repo code state indefinitely in chat,
- overload chat with large unrelated code drops,
- assume a README upload alone is sufficient for code-surface claims,
- treat older uploaded code as current when the repo has moved on.

### Expectation rule

When a task depends on code that is not in the active patch packet, ChatGPT may still give architectural guidance, but implementation-specific claims should remain conservative until the touched code is supplied.

### Human memory decay-

When confusion rises, we will not re-litigate the whole architecture.

We will first:
1. name the active seam,
2. identify the authoritative file/test/artifact for that seam,
3. choose the smallest next action inside that seam.

We only stop for structural revision when there is a specific contradiction, missing proof surface, or boundary violation.
Otherwise, discomfort alone is not evidence that the architecture is broken.

HUD confusion does not invalidate runtime truth.
Retention complexity does not invalidate replay lineage.
Feeling lost means we re-anchor to artifacts, not to abstraction.

## Solo VS Code / Codex / Git Workflow Hygiene

This section defines the default solo development hygiene for Reed working locally in VS Code with Git, GitHub, and Codex.

It exists to preserve bounded packet discipline, branch cleanliness, rollback safety, and lawful implementation flow without requiring heavyweight organizational ceremony.

This section governs:
- local branch hygiene
- Codex execution posture inside a packet branch
- packet-to-branch mapping
- commit / push / merge hygiene
- post-merge local resynchronization
- stop / escalation conditions for local AI-assisted implementation

It does **not** override:
- the Master Constitution
- the Workflow Contract role hierarchy
- packet templates
- architectural authority
- repo placement law
- declared-vs-mechanized closure rules

### Core rule

Each bounded implementation packet should normally execute on its own local branch created from an updated local `main`, with Codex operating only inside that branch, followed by explicit accept / revise / narrow / defer / escalate review before merge and explicit resynchronization of local `main` after the merge.

This preserves:
- rollback safety
- packet isolation
- clean diffs
- lawful branch-to-packet attribution
- and a stable current trunk

---

## G. Suggestion Accounting and Suggestion Drift

### Purpose

This section defines how suggestions should be handled during bounded DME collaboration so helpful next-step guidance does not drift into confusing, premature, or ungrounded motion.

It exists to prevent a recurring workflow failure:

**a suggestion appears plausible conversationally, but is not actually justified by the active seam, packet state, operator condition, or current review need.**

This section governs **workflow suggestions** only.

It does **not**:

- create a new authority layer,
- govern runtime artifact meaning,
- govern canon activation,
- or replace packet routing.

### Core rule

**A suggestion is only lawful when it is materially grounded in the active seam, current packet route, current operator state, or a clearly adjacent bounded review need.**

Corollary rules:

- conversational completion pressure is not enough
- usefulness in some abstract future is not enough
- richness is not enough
- momentum is not enough
- a suggestion that increases confusion without improving routeability is not a good suggestion

### Suggestion classes

#### S0 — Grounded suggestion

A suggestion that:

- reduces immediate ambiguity,
- identifies the smallest lawful next action,
- prevents concrete drift or overclaim,
- or improves packet routing / review clarity.

#### S1 — Optional bounded suggestion

A suggestion that is not necessary for the active seam, but remains clearly adjacent, low-cost, and non-confusing.

It must remain visibly optional.

#### S2 — Suggestion drift

A suggestion that is weakly grounded or ungrounded relative to:

- the active seam,
- the current packet route,
- the current operator condition,
- the current review task,
- or the current developmental pressure order.

Suggestion drift often appears as:

- premature redesign suggestions
- speculative next-stack branching
- convenience suggestions that do not reduce confusion
- generic closing suggestions added out of habit
- future-useful but currently disorienting recommendations

### Suggestion accounting questions

Before giving a suggestion, ask:

1. What active seam is this suggestion attached to?
2. What concrete confusion or route problem does it reduce?
3. Is it required now, or merely optional?
4. Does it preserve the current packet/developmental order?
5. Would omitting it make the current task materially worse?
6. Is the user currently in a state to benefit from this suggestion, or will it add load?

If these cannot be answered clearly, the suggestion should usually be withheld.

### Anti-drift rule

Do not append suggestions merely because a response feels incomplete without them.

When the active seam is already clear, the task is already routed, or the operator is overloaded, it is often more lawful to stop cleanly than to add one more suggestion.

### Human-state rule

Suggestion quality is relative not only to architecture, but also to operator condition.

A suggestion that is useful when the operator is energized may become suggestion drift when the operator is saturated, frustrated, or trying to close one bounded loop.

### Preferred posture

Prefer:

- zero suggestions when the next action is already obvious
- one suggestion when it materially reduces ambiguity
- explicit optionality when a suggestion is not required

Avoid:

- multiple speculative follow-ons
- ornamental “helpful” branching
- future-stack motion that outruns the current closure step

### One-line review question

**Did this suggestion materially improve bounded workflow movement, or did it merely add plausible motion after the real closure point had already been reached?**

### Branch posture

#### Main branch

`main` is the local and remote trunk.

It should remain:
- the current stable integration line
- the branch Reed syncs from before new packet work
- the branch Reed syncs back to after merge

Normal bounded implementation work should not begin directly on `main` unless Reed explicitly intends a direct trunk edit.

#### Packet branch

Each bounded packet should normally use one branch.

Preferred naming posture:

- `packet/<seam>-<goal>`
- `hotfix/<seam>-<issue>`
- `audit/<surface>-<question>`
- `setup/<tooling-change>`

Examples:

- `packet/replay-honesty-gate`
- `packet/reconstruction-support-trace`
- `setup/codex-project-config`

The exact branch label may vary, but it should preserve:
- seam identity
- bounded goal
- enough clarity to map branch ⇄ packet ⇄ PR

### Packet-to-branch mapping rule

A bounded implementation packet should carry an explicit branch name whenever practical.

At minimum, Reed should be able to answer:

- what packet is active?
- what branch is carrying it?
- what seam is being changed?
- what files are in scope?

If a packet and branch drift apart, that should be treated as workflow drift rather than ignored.

## I. Standard Packet Templates

This project uses two standard workflow templates for bounded implementation work:

1. **Architect Task Spec Packet**
2. **Engineer Implementation Return Packet**

The canonical template definitions live in:

- `README/Operational/README.PacketTemplates.md`

These templates are workflow instruments.
They do **not** create a new authority layer.
They exist to reduce handoff ambiguity, preserve bounded seam discipline, and keep implementation reviewable.

### Default usage rule

For normal bounded implementation work:

- Architect/Requester should provide a compact packet prompt that identifies:
  - packet id
  - task title
  - active seam
  - bounded goal
  - files in scope
  - explicit non-goals
  - acceptance target
  - escalation triggers where relevant

- Engineer should return work using the standard **Engineer Implementation Return Packet** shape defined in:
  - `README/Operational/README.PacketTemplates.md`

The full Architect and Engineer templates do **not** need to be pasted into every packet request if the packet clearly references the canonical template source.

### Heavy-template rule

The full expanded packet templates should be pasted directly into a packet request only when one or more of the following are true:

- the seam is new
- the workflow rule is new
- the packet is unusually high-risk
- the packet touches multiple governance surfaces
- prior similar packets have drifted or returned incomplete receipts

Otherwise, prefer the thinner packet form plus explicit reference to the canonical templates.

### Required Engineer return posture

Unless a packet explicitly says otherwise, Engineer return packets should include at minimum:

- result status
- summary of change
- files created / moved / modified
- folders created if any
- tests or checks run
- accounting updates performed
- packet lineage updates performed
- placement-law updates performed if topology changed
- path/reference repairs performed or explicitly left unresolved
- remaining issues
- escalation-qualified open questions only if needed

### Operational hygiene rule

When a packet materially changes workflow-visible structure, Engineer must update the relevant operational surfaces as part of the same packet closure, not as a detached follow-up, unless the packet is explicitly audit-only or blocked.

This includes where applicable:

- `README/Operational/README.RepoAccountingSurface.md`
- `README/Operational/README.PacketLineage.md`
- `README.RepoPlacementConstitution.md` when folder/subfolder topology changes

### Default local execution loop

The normal loop is:

1. sync local `main`
2. create packet branch from local `main`
3. hand packet to Codex inside that branch
4. inspect diff and local results
5. choose: accept / revise / narrow / defer / escalate
6. commit and push the packet branch
7. merge through GitHub when ready
8. resync local `main`
9. close the completed branch when appropriate

Representative command posture:

```bash
git checkout main
git pull origin main
git checkout -b packet/<seam>-<goal>
```
After work is accepted on the branch:
```bash
git add <scoped files or .>
git commit -m "<bounded commit message>"
git push -u origin <branch-name>
```
After merge:
```bash
git checkout main
git pull origin main
Why post-merge resync is required
```
Pushing a packet branch to GitHub does not by itself update local main.

Once a GitHub merge occurs, remote main has changed.
Local main must be explicitly resynchronized before the next packet branch is created.

Otherwise, later packet branches may be created from a stale local trunk.

### Commit posture

Commit messages should remain bounded and legible.

Preferred styles include:

packet: wire replay reconstruction model
packet: tighten replay downgrade posture
setup: add codex repo instructions
audit: narrow replay support claim
docs: clarify structural identity wording

The point is not stylistic purity.
The point is preserving enough signal that history remains searchable and attributable.

### Codex execution posture

Codex should normally operate:

inside the currently checked out packet branch
inside the active repo workspace
under the current AGENTS.md instructions
under the current .codex/config.toml posture
inside bounded packet scope

Codex should not be treated as an independent architectural authority.

Codex is an implementation agent operating under:

  Reed authority
  Architect authority
  the active packet
  and the repo’s governing notes
  Codex stop / escalation conditions

Codex should stop and hand back rather than silently widening scope when any of the following occur:

contract conflict
hidden dependency outside packet scope
destructive operation would be required
broader architectural redesign pressure appears
governance docs or root authority docs would need modification outside explicit scope
broad dependency or package changes would be required
unrelated file drift appears
tests reveal broader seam breakage than the packet admits
the task cannot be completed honestly within the active seam

The correct response is:

stop
summarize the issue
preserve the bounded packet
and request clarification or escalation
Git hygiene rules

Reed should prefer the following hygiene:

start each packet from updated local main
keep working tree clean before major Codex runs
inspect git status and git diff regularly
avoid staging unrelated files
keep generated outputs ignored
avoid force-push unless explicitly intended
avoid branch sprawl once a packet is complete
Acceptance posture on the human side

After Codex completes a bounded pass, Reed should explicitly choose one of:

accept
revise
narrow
defer
escalate

This keeps solo workflow aligned with the same bounded routing grammar used elsewhere in the project.

### Closure note

For each accepted packet pass, the preferred closure summary is:

what is now true
what is still not claimed

This preserves declared-vs-mechanized honesty and reduces upward drift from local implementation convenience.

Scope note

This section exists to make solo local development:

scalable
non-messy
branch-safe
Codex-compatible
and packet-aligned

## Development Sequence

**Phase A — Runtime Honesty** *(complete)*
Replay receipt honesty; H1 vs M1 replay semantics; anomaly event semantics; receipt consistency.

**Phase B — Substrate Integrity** *(complete)*
Segment tracker correctness; trajectory memory behavior; proto-basin semantics; substrate commit/query discipline; read-path honesty; dwell/transition/recurrence instrumentation.

**Phase C — Orchestration**
Clean runners; compact summaries; batch and stream workflows; developer tooling.

**Phase D — Canon Design**
Formal promotion criteria; canonical state contract; true ConsensusOp behavior.

Prediction and all higher layers remain deferred until Phase D is stable.

---

## Completion Standard

A change is acceptable only when it is:
- lawful under the Master Constitution and this contract
- internally coherent
- testable
- minimally sufficient
- honest about what it does and does not yet mean

---

*The layer definitions, boundary rules, naming law, and artifact graph that were previously in this document have been consolidated into `README_MasterConstitution.md`. The four predecessor constitutional files (`README_ArchitectureBoundaryContract.md`, `README_NamingConventions.md`, `README.ArtifactLifecycle.md`, and the prior version of this file) may be archived.*




## Appendix — Task Intent, Composition Lineage, and Authorship Clarity

This appendix exists to preserve coherence, lineage, and scope clarity in active development flow.

As the project matures, the distinction between:
- directing work,
- drafting work,
- approving work,
- revising work,
- and personally composing work

must remain explicit.

The purpose of this appendix is to prevent avoidable confusion such as:
- attributing drafted artifacts to the user when the assistant actually composed them,
- projecting user intent where no explicit user action was stated,
- blurring project authority with line-by-line authorship,
- or losing task momentum through ambiguous action phrasing.

### 1. Core rule

Ownership, direction, approval, and composition are not the same thing.

In this workflow:

- the user may own the project, govern direction, and hold architectural authority
- the assistant may draft specific artifacts, code blocks, contracts, notes, or memos
- either party may amend, refine, or approve an artifact after drafting

These roles must not be collapsed into a single authorship story.

### 2. Task-intent rule

The workflow should prefer explicit task intent.

Examples of explicit task intent:

- “Please write…”
- “Please draft…”
- “Please make…”
- “Please review…”
- “Please revise…”
- “I intend to write…”
- “I intend to edit…”
- “I intend to create…”

These should be treated as materially different signals.

#### 2.1 Assistant action requests
If the user says:
- “please write…”
- “please draft…”
- “please make…”

the assistant should interpret this as a request to perform the drafting/composition task directly.

#### 2.2 User-intended authorship
If the user says:
- “I will write…”
- “I intend to draft…”
- “I am going to edit…”

the assistant should not silently recast that action as assistant authorship.

#### 2.3 Collaborative ambiguity
Phrases such as:
- “let’s do this”
- “let’s make that”
- “we should write…”

may still be used conversationally, but where authorship or execution matters, the workflow should clarify or infer cautiously rather than collapsing direction into user composition.

### 3. Composition lineage rule

Artifacts should be described according to how they were actually produced.

#### 3.1 Assistant-drafted artifact
If the assistant composes the text, code, memo, contract, README, or patch block, it should be treated as:

- drafted by the assistant
- at the user’s direction, within the user’s project authority

It should not be described as though the user personally authored the line-level content unless the user actually did so.

#### 3.2 User-authored artifact
If the user writes or edits the content directly, it should be treated as:

- user-authored
- or user-amended

depending on what occurred.

#### 3.3 Co-developed artifact
If an artifact is iteratively shaped by both parties, it may be described as:

- co-developed
- user-directed and assistant-drafted
- assistant-drafted and user-amended

where relevant.

### 4. Attribution rule

The workflow must not attribute substantial drafted content to the user merely because:

- the user requested it,
- approved it,
- owns the project,
- or supplied the design intent.

Project authority does not equal line-by-line composition.

Likewise, assistant drafting does not transfer project authority away from the user.

### 5. Assistant projection rule

The assistant should avoid avoidable projection of user action.

Examples to avoid when inaccurate:

- “you should write this memo”  
  when the practical next step is for the assistant to draft it

- “you wrote this artifact”  
  when the user only requested or approved it

- “you answered this question”  
  when the user has not actually supplied the answer

Preferred alternatives:

- “I can draft this memo now”
- “This decision still needs your answer”
- “This artifact was assistant-drafted at your direction”
- “This section appears user-amended”
- “This remains undecided and needs your explicit call”

### 6. Lineage-conserving phrasing

Where useful, the workflow should preserve distinctions such as:

- **user-directed**
- **assistant-drafted**
- **user-amended**
- **co-developed**
- **user-approved**
- **assistant-reviewed**

These are not always required in casual conversation, but they should govern how the system internally frames task flow and artifact lineage.

### 7. Scope-preserving collaboration rule

To conserve active signal and avoid false authorship drift:

- the user should explicitly state when they want the assistant to draft or create something
- the assistant should explicitly state when a task still requires a user decision rather than assistant composition
- neither party should silently convert project direction into line-level authorship

This is especially important for:

- large code blocks
- contracts
- README sections
- canon/criteria notes
- architectural memos
- review verdicts
- formal patch text

### 8. Practical shorthand

For this workflow, the following shorthand should be assumed:

- **“Please write / draft / make…”**  
  assistant composes the artifact

- **“I will write / I intend to edit…”**  
  user composes or revises the artifact

- **“Review this…”**  
  assistant evaluates without claiming authorship

- **“Let’s…”**  
  collaborative direction signal, but not sufficient on its own to assign line-level authorship where lineage matters

### 9. Why this matters

Clear authorship and task-intent handling improves:

- lineage fidelity
- scope control
- review honesty
- momentum in active development
- and later interpretive clarity about who did what

It also prevents false compression such as:
- user authority being mistaken for user composition
- assistant drafting being mistaken for user writing
- or ambiguous collaboration language generating avoidable coherence loss

### 10. Working summary

In this workflow:

- the user may own, direct, govern, and approve the system
- the assistant may draft substantial artifacts at the user’s request
- authorship should follow actual composition
- authority should follow actual project governance
- and neither should be collapsed into the other

The workflow should therefore preserve explicit task intent and explicit composition lineage whenever artifact authorship materially matters.

## H. Packet Hygiene and Operational Accounting Updates

This section defines the minimum workflow-hygiene updates expected when a packet materially changes repo/workflow accounting posture.

These updates are workflow instruments only.
They do not create a new authority layer.

### H.1 Current-state accounting update rule

When a packet:

- creates a file
- moves a file
- materially changes a file's status
- materially changes zone classification
- materially changes README grouping
- or materially changes test grouping

Engineer should update:

- `README/Operational/README.RepoAccountingSurface.md`

with the new path/location/classification posture, or explicitly report why no update was made.

### H.2 Packet-lineage update rule

When a packet closes with a meaningful route result, Engineer should update:

- `README/Operational/README.PacketLineage.md`

to record:

- packet identity
- route outcome
- created files/folders
- updated docs
- follow-on packet relations where relevant
- and notable path/reference repairs or unresolved path/reference drift

### H.3 Placement-constitution append rule

Append `README.RepoPlacementConstitution.md` only when:

- a new canonical folder class is legitimized
- a recurring README subzone is legitimized
- or canonical folder/subfolder topology changes materially

Do not append the placement constitution merely to mirror ordinary packet churn, file-status changes, or per-file current-state accounting.

### H.4 Path and reference drift rule

If a packet touches a seam with affected path/reference drift, Engineer should:

- repair the affected references where that repair remains inside packet scope
- or report the unresolved drift explicitly in the return packet

Silence is not an acceptable substitute for path/reference honesty.

### H.5 Return-packet receipt rule

Engineer Implementation Return Packets should include, when relevant:

- accounting surface updates performed
- packet-lineage updates performed
- placement-constitution append status
- path/reference repairs performed
- and unresolved path/reference drift still left open

These receipts exist to keep workflow accounting honest after bounded packets close.
