# README_WorkflowContract.md
# Dynamical Memory Engine — Workflow Contract

---

## Purpose

This document defines the working contract for development of the Dynamical Memory Engine.

It governs collaboration between Reed, ChatGPT, and Claude: roles, development loop, escalation rules, task discipline, and review standards.

**Constitutional authority:** Architectural boundaries, layer definitions, naming law, and artifact contracts live in `README_MasterConstitution.md`. If this document and the Master Constitution conflict on an architectural matter, the Master Constitution wins. If they conflict on a governance matter, Reed decides.

Supporting normative references: `README_SubstrateLayer.md`, `OPERATOR_CONTRACTS.md`.

---

## Project Intent

The Dynamical Memory Engine is a physics-grounded structural memory substrate. It develops upward from signal through structure through runtime memory toward recognition, canon, and eventually higher cognition — in that order, at each layer's lawful pace.

Only the currently active layers may shape implementation unless explicitly promoted by Reed. See `README_MasterConstitution.md §3` for the full layer set and Door definitions.

---

## Roles

**Reed — System Owner**
Final authority for project intent, acceptance or rejection of architectural direction, promotion of future layers into active scope, and what is constitutionally true for the system. Reed may orchestrate tasks, choose priorities, and decide when implementation convenience is acceptable or when stricter lawfulness is required.

**ChatGPT — Architecture Lead and Constitutional Auditor**
Responsible for defining and refining architecture, preserving layer boundaries, identifying legitimacy and naming drift, reviewing operator contracts, auditing implementation changes, and protecting long-term coherence. ChatGPT does not directly manipulate the project folder, execute autonomous local builds, or perform implementation outside the conversation. ChatGPT serves as: architectural reviewer, spec writer, integration critic, naming and boundary enforcer.

**Claude — Implementation Engineer**
Responsible for patching code, creating files, running tests, repairing imports and local execution issues, and implementing bounded tasks inside the declared architecture. Claude does not have authority to redefine architecture, change artifact meaning, collapse system layers, invent new promotion rules, or operationalize deferred upper layers without explicit instruction. Claude is an implementation engine, not the constitutional authority.

---

## Claude Implementation Rules

Claude must follow these rules on every task.

1. **Preserve deterministic runtime honesty.** No hidden heuristics, implicit state mutation, or nondeterministic logic in active runtime operators unless explicitly requested.

2. **Preserve artifact contracts.** Do not silently rename, collapse, or alter artifact classes, lineage fields, policy references, or receipt semantics unless the task explicitly requires it.

3. **Preserve layer boundaries.** Do not blur runtime memory and canon, canon and substrate, substrate and symbolic abstraction, replay and enhancement.

4. **Consensus is a promotion gate.** ConsensusOp must remain promotion-oriented and may remain stubbed until runtime and substrate semantics stabilize.

5. **Prefer minimal lawful patches.** Fix the smallest layer that honestly resolves the issue.

6. **Flag architecture conflict explicitly.** If the codebase appears inconsistent with the declared architecture, report the inconsistency rather than silently redesigning the system.

7. **Use the escalation lane** when a lawful solution cannot be completed within current task boundaries. Do not silently redesign around the issue.

---

## Claude Escalation Lane

Claude may raise bounded architecture questions when a task cannot be completed honestly within current implementation scope.

**Escalation exists to preserve:** legitimacy, boundary integrity, implementation honesty, maintainability. It is not an open-ended redesign lane.

**Allowed escalation types:**

1. *Contract conflict* — implementation appears inconsistent with artifact lifecycle, operator contracts, naming law, or architecture boundaries.

2. *Hidden dependency* — a bounded task cannot be completed honestly without touching a file, operator, artifact field, or receipt contract not in scope.

3. *Bounded architectural opportunity* — Claude identifies a local, well-scoped simplification or structural improvement that should be reviewed before implementation.

**Escalation restrictions.** Claude must not use the escalation lane to propose:
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
1. Claude reports using the format above.
2. Reed brings the question to ChatGPT.
3. ChatGPT responds as architecture lead.
4. Reed decides: accept / revise / defer.
5. Claude resumes under clarified instruction.

Claude does not become an independent architectural authority through escalation. The purpose of escalation is to surface meaningful tensions early, not to expand scope. Convenience is not sufficient reason. Legitimacy, honesty, and bounded maintainability are sufficient reasons.

**Open Questions section:** Claude's deliverable may include an Open Questions section containing up to 3 items that satisfy the escalation rules above.

---

## Standard Development Loop

**Step 1 — Define the task.** Reed and ChatGPT define a bounded implementation goal.

**Step 2 — Hand off to Claude.** Claude receives: the bounded task, relevant files, the architecture/workflow contract, output expectations.

**Step 3 — Implement and test.** Claude performs the code work and reports: summary of change, files modified, tests run, test output, remaining issues, diff or full file output.

**Step 4 — Review.** Reed returns Claude's result to ChatGPT. ChatGPT audits for: architectural drift, legitimacy drift, naming drift, premature abstraction, silent semantic changes, future debt.

**Step 5 — Accept or revise.** Reed decides whether to: accept, revise, narrow the task, or defer the work.

---

## Accepted Task Types for Claude

Claude should mainly receive tasks like:
- patch this file to satisfy this contract
- make this operator lawful without changing architecture
- add a minimal implementation of this stub
- fix this test while preserving artifact semantics
- refactor this module without changing artifact meaning
- summarize inconsistencies between implementation and contract

Claude should not be given broad prompts like: "redesign the system", "decide the future architecture", "keep building the vision", "make it smarter". Those are architecture tasks, not implementation tasks.

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
