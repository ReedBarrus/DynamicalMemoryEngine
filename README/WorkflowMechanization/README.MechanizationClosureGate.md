# README.MechanizationClosureGate.md
# Dynamical Memory Engine — Mechanization Closure Gate

## Status

This note is a supporting workflow-facet protocol.

It is not constitutional authority.

It does **not** override:
- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README.DeclaredVsMechanizedAudit.md`
- `README.DeterministicInvarianceThreshold.md`

Its purpose is narrower:
- define a compact closure-gate protocol for capability status,
- prevent declared/displayed surfaces from being mistaken for mechanized function,
- provide one first enforcement target using replay reconstruction,
- and keep workflow mechanization distinct from runtime/canon semantics.

---

## 1. Core rule

A capability is mechanized only when its backend exists, is reachable through a real execution path, is rendered honestly on a user-facing surface, preserves explicit insufficiency/failure posture, and does not claim more than its implemented support justifies.

Generated is not mechanized. Declared is not mechanized. Displayed is not mechanized. A capability remains partially mechanized until backend reachability and honest rendered behavior are both real.

Workflow mechanization does **not** itself imply mechanized engine capability.

---

## 2. Closure-gate statuses

Use the following compact statuses:

- `declared`
- `displayed`
- `partially_mechanized`
- `mechanized`

### `declared`
The capability has posture, naming, or interface language only.

### `displayed`
The capability has a visible UI or object shape, but no proven backend path yet.

### `partially_mechanized`
Some real implementation exists, but one or more closure conditions are still missing.

### `mechanized`
All closure conditions below are satisfied.

---

## 3. Closure conditions for `mechanized`

A capability may be called `mechanized` only when all of the following are true:

1. **backend implementation exists**
2. **reachable from a real execution/model path**
3. **user-facing surface renders backend-produced result fields**
4. **insufficiency/failure path is explicit**
5. **downgrade posture is explicit where applicable**
6. **no stronger semantic claim is made than the backend supports**

If any condition is missing, the capability remains `partially_mechanized`.

---

## 4. Pilot capability: replay reconstruction

Replay reconstruction is the first pilot closure-gate target.

It qualifies as `mechanized` only if:
- the provenance reconstruction backend exists,
- replay model wiring actually calls that backend,
- the active replay surface renders reconstruction-backed fields rather than replay-shaped request fields only,
- failure is visible,
- downgrade is visible where applicable,
- and the replay surface remains support-trace only, lens-bound, retained-tier-honest, and below canon/truth/promotion.

This does **not** uplift canon.
This does **not** make replay restoration.
This does **not** make workflow closure a new authority layer.

---

## 5. Enforcement posture

For v0, closure-gate enforcement may remain capability-specific.

A focused enforcement test is sufficient when it:
- checks the backend seam,
- checks the model/execution reachability seam,
- checks the rendered user-facing seam,
- checks explicit failure posture,
- and checks explicit downgrade posture.

A generic framework is not required yet.

---

## 6. One-line review question

Before calling any capability `mechanized`, ask:

**Can the repo prove that the backend exists, the real path reaches it, the active surface renders it honestly, and insufficiency/failure remain explicit without semantic overclaim?**
