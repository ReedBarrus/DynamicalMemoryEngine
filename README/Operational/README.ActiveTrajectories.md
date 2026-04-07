# Dynamical Memory Engine - Active Trajectories

## Status

This document defines a bounded operational surface for active and projected development trajectories in DME.

It is a workflow instrument.

It does **not** override:

- `README.MasterConstitution.md`
- `README.WorkflowContract.md`
- `README.RepoPlacementConstitution.md`
- `README/Operational/README.RepoAccountingSurface.md`
- `README/Operational/README.PacketLineage.md`
- `README/Core/README.DoorOneDevelopmentalOutline.md`

Its purpose is narrower:

- bridge packet lineage, developmental pressure order, and current strategic motion
- show which packet families are advancing which live line
- distinguish active lines from projected lines
- and keep the next expected packet movement legible without turning into a roadmap

This note governs **active trajectory accounting** only.

It does **not** govern:

- architectural truth
- runtime correctness
- packet-history replacement
- roadmap authority
- benchmark policy by itself
- or Door posture by itself

This is a triangulation surface.
It is not a new law layer.
It is not a roadmap replacement.
It is not a substitute for repo inspection.

---

## A. Purpose

This note exists to bridge three bounded surfaces that answer different questions:

- `README/Operational/README.PacketLineage.md`
  what packets happened and how they routed
- `README/Core/README.DoorOneDevelopmentalOutline.md`
  what developmental pressure order governs Door One
- current active strategic trajectories
  what is actually live now, what is projected next, and what is parked

This bridge is needed because packet lineage is narrower than current strategic motion, while the developmental outline is broader than the currently active packet families.

Operational path note:

- the live developmental-outline path in this workspace is `README/Core/README.DoorOneDevelopmentalOutline.md`
- a standalone `README/WorkflowMechanization/README.ActiveLawKernel.md` is not present in the current workspace, so active-law-kernel posture is taken from current workflow notes and `AGENTS.md` without creating a new authority note here

---

## B. Core Rule

A trajectory is a bounded active line of development connecting packet movement to developmental pressure order without replacing either.

Corollaries:

- a trajectory is broader than one packet but narrower than a full roadmap
- a trajectory may be `active`, `projected`, `parked`, or `review_only`
- a trajectory must keep its purpose, leg relation, next packet expectation, and non-goals explicit
- a trajectory must not be treated as code-state proof or architectural authority

---

## C. Entry Model

Each trajectory entry should preserve at minimum:

- `trajectory_id`
- `trajectory_name`
- `purpose`
- `developmental_leg_served`
- `status`
- `related_packets`
- `current_packet`
- `next_expected_packet`
- `dependencies`
- `blockers`
- `explicit_non_goals`
- `park_condition_or_completion_condition`

The model should remain compact.
It should explain movement, not narrate the whole project.

---

## D. Active Trajectories

| trajectory_id | trajectory_name | purpose | developmental_leg_served | status | related_packets | current_packet | next_expected_packet | dependencies | blockers | explicit_non_goals | park_condition_or_completion_condition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TRJ-LK-001` | `Language Kernel loop instantiation` | Bound a local-model recursion loop over export packets with validator-backed receipts, lawful frame contracts, benchmark posture, and a seam-local invocation path that all stay below canon and memory authority. | `Leg 3 primary; bridge pressure toward Leg 4` | `active` | `PKT-REORG-CLOSEOUT-AUDIT-007`; `PKT-ACTIVE-TRAJECTORIES-008`; `LK-CHECK-001`; `LK-VALIDATOR-001`; `LK-BENCH-RUNNER-001`; `LK-PKT-001`; `LK-PKT-002` | `LK-PKT-002` | `bounded Language Kernel comparison/review packet over the current two-model panel after the new invocation path is exercised further` | `README/Transformer/LanguageKernel/README.LanguageKernelContract.v0.md`; `README/Transformer/LanguageKernel/README.LanguageKernelBenchmarkContract.v0.md`; `README/Transformer/LanguageKernel/README.LanguageKernelEarlyOperation.v0.md`; `Transformer/LanguageKernel/validator/`; `Transformer/LanguageKernel/benchmarks/`; `Transformer/LanguageKernel/invocation/`; current run and benchmark outputs | benchmark interpretation must stay below authority uplift; only Hermes 3 Llama 3.2 3B is mechanized end-to-end so far; broader panel reliability and repeated first-turn conformance are not yet established | no canon activation; no runtime truth uplift; no broad Door Two language architecture | park when the bounded two-model comparison line is stable enough that the next pressure shifts to comparative review rather than seam instantiation and first-turn contract hardening |
| `TRJ-APP-001` | `App surface remodeling` | Move toward a thin router/home shell above dedicated live, static, and inspection viewers while keeping structural evidence primary and overlays subordinate. | `Leg 1 primary; depends into Legs 2 and 3` | `active` | `PKT-REORG-CLOSEOUT-AUDIT-007`; `PKT-ACTIVE-TRAJECTORIES-008`; `D1.UI.HOME_ROUTER_SHELL_013`; `D1.UI.SHARED_VIEWER_PAYLOAD_ADAPTER_014`; `D1.UI.MODE_ROUTER_EMPTY_VIEWERS_015`; `D1.UI.MODE_SHELL_STATE_THREADING_016`; `D1.UI.LIVE_TELEMETRY_RAIL_017`; `D1.UI.CONTINUOUS_STRUCTURAL_VIEWER_018`; `D1.UI.STATIC_SPECTRAL_VIEWER_019`; `D1.UI.STATIC_ENERGY_VIEWER_020` | `D1.UI.STATIC_ENERGY_VIEWER_020` | `first static persistence / recurrence viewer packet over the shared structural viewer seam` | `README/Diagnostics/AppSurface/README.AppSurfaceTransitionPlan.v0.md`; `README/Diagnostics/AppSurface/README.StructuralViewerContract.v0.md`; `README/Diagnostics/AppSurface/README.LiveStaticInspectionSplit.v0.md`; `README/Diagnostics/AppSurface/README.LiveViewerTelemetryContract.v0.md`; current HUD/app surfaces; published shell-state seam in hud/shellStateRouter.js | richer viewer growth still needs bounded packets; current Live and Static views are real but still limited to H1 spectral and energy projections; legacy composed route should stay transitional until dedicated viewers are stronger | no roadmap rewrite; no styling-first rewrite; no overlay authority uplift; no per-viewer truth drift; no semantic interpretation from telemetry | park when the thin router, shared payload seam, explicit mode shells, state-threading posture, bounded live telemetry rail, and the first real Live/Static multi-face viewer set are stable enough that later packets are mostly incremental viewer hardening |
| `TRJ-BENCH-001` | `Mechanization benchmark/testing` | Keep validator-backed testing and seam-local benchmarking explicit across DME function and helper posture so shaped surfaces do not outrun mechanized support. | `Legs 1-3` | `active` | `PKT-REORG-CLOSEOUT-AUDIT-007`; `PKT-ACTIVE-TRAJECTORIES-008` | `PKT-ACTIVE-TRAJECTORIES-008` (accounting only) | `benchmark/mechanization review packet spanning DME and Language Kernel seams` | `README/WorkflowMechanization/README.MechanizationClosureGate.md`; `README/Core/README.DeclaredVsMechanizedAudit.md`; Language Kernel benchmark receipts; existing tests | benchmark scope must stay seam-local enough to avoid turning into generic model scoring or architecture overclaim | no benchmark policy uplift; no hidden runtime semantics claim; no broad CI redesign by implication | park when the currently active benchmark families are explicit enough that later packets can compare regimes without rearguing what is being tested |

### Recently Parked Trajectory

| trajectory_id | trajectory_name | purpose | developmental_leg_served | status | related_packets | current_packet | next_expected_packet | dependencies | blockers | explicit_non_goals | park_condition_or_completion_condition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TRJ-REORG-001` | `Repo reorganization and workflow hygiene` | Establish operational accounting, packet lineage, cleaner test grouping, initial README compression, checkpoint routing, safe cleanup, and closeout posture before benchmark/Ollama review work. | `workflow support enabling Legs 1-3` | `parked` | `PKT-ACCOUNTING-LAW-002`; `PKT-TEST-GROUPING-003`; `PKT-README-COMPRESSION-004`; `PKT-REORG-CHECKPOINT-AUDIT-005`; `PKT-SAFE-CLEANUP-006`; `PKT-REORG-CLOSEOUT-AUDIT-007`; `PKT-ACTIVE-TRAJECTORIES-008` | `PKT-ACTIVE-TRAJECTORIES-008` (accounting only) | `none unless a deferred cleanup seam is reopened by dedicated packet` | operational accounting surface; packet lineage; closeout audit; current repo grouping state | empty `tests/door_two/` removal remains environment-blocked; several cleanup seams remain intentionally deferred | no runtime redesign; no benchmark implementation; no authority uplift from cleaner placement | parked once repo posture is stable enough that next-phase packets no longer need to reopen the whole reorg lane |

---

## E. Projected Trajectories

| trajectory_id | trajectory_name | purpose | developmental_leg_served | status | related_packets | current_packet | next_expected_packet | dependencies | blockers | explicit_non_goals | park_condition_or_completion_condition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TRJ-CONT-001` | `Cross-session continuity` | Develop lawful continuity handles and workflow-visible support across sessions and threads without mistaking continuity posture for truth or trust. | `Leg 4` | `projected` | `PKT-ACTIVE-TRAJECTORIES-008` | `none currently declared` | `dedicated Leg 4 continuity packet after current Leg 3 pressure stabilizes further` | `README/Core/README.DoorOneDevelopmentalOutline.md`; structural identity law; packet/workflow handles | current active pressure is still lower-leg and benchmark-oriented | no trust engine; no recollection inflation; no authority uplift from continuity language | activate only when current Leg 3 identity/memory/compression pressure is stable enough to support lawful continuity work |
| `TRJ-RET-001` | `Retention-spectrum hardening` | Make retained tiers and replay/retention distinctions operationally stronger without letting retention posture outrun retention mechanics. | `Leg 5` | `projected` | `PKT-ACTIVE-TRAJECTORIES-008` | `none currently declared` | `dedicated retention-hardening packet after Leg 4 support is clearer` | `README/Core/README.DoorOneDevelopmentalOutline.md`; retention-related core and taxonomy notes | later-leg seam; current mechanics should not be overclaimed | no canon from retention alone; no memory-truth uplift; no archive policy by implication | activate only when replay/retention posture can gain real mechanized support rather than language-first clarity alone |
| `TRJ-LKUI-001` | `Language Kernel plugin to UI/source selection` | Explore whether Language Kernel calls should later plug into router/home-shell source selection without collapsing UI convenience into architecture or authority. | `Leg 1 / Leg 3 bridge; possible Leg 4 pressure later` | `projected` | `PKT-ACTIVE-TRAJECTORIES-008` | `none currently declared` | `dedicated bridge packet if both app routing and Language Kernel loop posture stabilize` | app-surface transition plan; source-selection seams; Language Kernel loop posture | both parent seams are still active independently; coupling them too early would widen scope | no premature UI integration; no Ollama wiring by implication; no plugin authority layer | activate only after app routing and Language Kernel loop posture are both stable enough to bridge without hiding seam boundaries |
| `TRJ-NEG-001` | `Negative-space operator proposal` | Preserve a placeholder for review of a possible operator seam that would characterize absence, insufficiency, or off-shape conditions without inflating it into an active implementation line yet. | `review across Legs 2-5; not yet a declared live leg` | `review_only` | `PKT-ACTIVE-TRAJECTORIES-008` | `none currently declared` | `review-only packet if and when a concrete proposal artifact exists` | none beyond current law posture and later-leg review need | no dedicated repo artifact or packet family is currently present in workspace | no activation by mention alone; no operator minting; no semantic authority | remain review-only unless a dedicated bounded packet and concrete seam artifact are declared |

---

## F. Use Rule

Use this surface when the question is:

- what is active now
- which packet families are advancing which strategic line
- what is next
- what is projected
- or what has recently been parked

Do not use this surface when the question is:

- what happened in exact packet history
- what the full project roadmap is
- what runtime truth has been proven
- what the developmental outline says in full
- or what is architecturally true by authority

Those questions belong to packet lineage, the developmental outline, runtime evidence, or governing notes instead.

---

## 1. One-Line Summary

This note is the bounded operational surface for current active, projected, and parked development trajectories so packet movement and developmental pressure order can be read together without turning either into roadmap or authority.
