# DME - Operator Inventory Snapshot - 2026-04-08

## Status

This document records the initial operator inventory baseline produced on 2026-04-08.

It is:

- date-stamped
- repo-state-specific
- a current-reality audit snapshot
- a baseline for later cleanup planning

It is **not**:

- permanent truth
- canon
- a replacement for `README.OperatorInventoryAudit.md`
- a replacement for `README.OperatorRegistry.md`

This snapshot should be read as a bounded audit artifact over the repo state inspected on 2026-04-08.

---

## Source posture

- audit date: `2026-04-08`
- repo posture: current local repo state inspected during the audit
- governing method note: `README.OperatorInventoryAudit.md`
- canonical classification reference: `README.OperatorRegistry.md`
- intended downstream uses: inventory stabilization, retirement planning, and unthreading planning

Files and surfaces inspected for this baseline included:

- core operator seams under `operators/`
- runtime coordinator, report, and cross-run seams under `runtime/`
- HUD, shell, panel, adapter, and legibility seams under `hud/`
- the OperatorExposure README stack, especially `README.OperatorRegistry.md` and `README.OperatorInventoryAudit.md`

---

## Inventory Verdict

Structural core posture: `mostly clean`

Support posture: `mixed`

Review attachment posture: `mixed`

Primary contamination locus: `reports-review`

Recommended next phase: `unthreading planning`

Working answer to the base preservation question:

The structural operator core is sufficiently clean to preserve as the base of the next phase, with the main caveat that the registry's `retention_signature` seam is still under-explicit in code and is partly displaced into support and helper surfaces.

---

## Baseline inventory table

This table records the principal operator-adjacent objects inspected in the baseline pass.

Field key:

- `decl_op` / `act_op` = declared operator id / actual operator id
- `decl_grp` / `act_grp` = declared operator group / actual operator group
- `build` = build class derived from the registry seam
- `prim` / `supp` / `rev` = primary payload touched / support payload touched / review-or-semantic payload touched
- `contam` = contamination posture
- `rec` = status recommendation

| object_id | object_name | object_type | location | decl_op | act_op | decl_grp | act_grp | build | cur_role | act_role | upstream | downstream | prim | supp | rev | contam | rec | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---|---|---|
| ingest | IngestOp | operator | `operators/ingest/IngestOp.js` | ingest | ingest | Structure | Structure | B0 | primary exposure | primary exposure | raw source, sampler | clock_align | Y | N | N | C0 | Keep active | clean first structural seam |
| clock_align | ClockAlignOp | operator | `operators/clock/ClockAlignOp.js` | clock_align | clock_align | Structure | Structure | B0 | primary exposure | primary exposure | ingest | window | Y | N | N | C0 | Keep active | clean alignment seam |
| window | WindowOp | operator | `operators/window/WindowOp.js` | window | window | Structure | Structure | B0 | primary exposure | primary exposure | clock_align | transform | Y | N | N | C0 | Keep active | clean segmentation seam |
| transform | TransformOp | operator | `operators/transform/TransformOp.js` | transform | transform | Structure | Structure | B1 | primary exposure | primary exposure | window | compress, anomaly | Y | N | N | C0 | Keep active | clean remapping seam |
| compress | CompressOp | operator | `operators/compress/CompressOp.js` | compress | compress | Structure | Structure | B1 | primary exposure | primary exposure | transform | anomaly, merge, replay_bounded | Y | Y | N | C0 | Keep active | lawful reduction seam |
| anomaly | AnomalyOp | operator | `operators/anomaly/AnomalyOp.js` | anomaly | anomaly | Structure | Structure | B1 | primary exposure | primary exposure | transform, compress | merge | Y | Y | N | C0 | Keep active | structural deviation seam |
| merge | MergeOp | operator | `operators/merge/MergeOp.js` | merge | merge | Structure | Structure | B2 | primary exposure | primary exposure | anomaly | retention_signature, replay_bounded | Y | Y | N | C0 | Keep active | lawful consolidation seam |
| replay_bounded | ReconstructOp | operator | `operators/reconstruct/ReconstructOp.js` | replay_bounded | replay_bounded | Structure | Structure | B3 | derived inspection | derived inspection | merge, retained support | query, review, HUD | Y | Y | N | C0 | Keep active | bounded replay gate only |
| pre_ingest_family | AnalogSamplerOp + RmsEnvelopeAdapter | support adapters | `operators/sampler/*` | none | ingest | Support | Support | B0 | support exposure | support exposure | raw inputs | ingest | N | Y | N | C0 | Keep active | lawful pre-ingest helpers |
| memory_substrate | MemorySubstrate | support substrate | `operators/substrate/MemorySubstrate.js` | none | retention_signature / query_op | Support | Support | B2 | support exposure | mixed | compress, merge | query, reports, orchestrator | Y | Y | Y | C2 | Keep with narrow fix | retention, query, and reporting are bundled together |
| query_op | QueryOp | review operator | `operators/query/QueryOp.js` | query_op | query_op | Review | Review | B3 | review | review | replay_bounded or earlier seams | review, consultation | N | Y | Y | C0 | Keep active | narrow read-side query seam |
| consensus_family | ConsensusOp + consultC1 | review gate/helper | `operators/consensus/*` | review_matrix | review_matrix | Review | Review | B3 | review | review | dossier or live C1 | explicit review routing | N | Y | Y | C0 | Keep active | explicit review boundary only |
| runtime_overlay_family | trajectory, attention, readiness, dossier reports | runtime reports | `runtime/*Report.js`, `runtime/CanonCandidateDossier.js` | semantic_overlay / review_matrix | semantic_overlay / review_matrix | Review | Review | B3 | review / semantic | review / semantic | substrate, replay, cross-run | workbench, consensus, HUD | N | Y | Y | C1 | Keep active | downstream overlays remain explicit |
| orchestrator | DoorOneOrchestrator | runtime coordinator | `runtime/DoorOneOrchestrator.js` | none | replay_bounded / query_op / semantic_overlay / review_matrix | Support | Support | B3 | shell / routing | mixed | operators, substrate, reports | workbench, HUD, cross-run | Y | Y | Y | C2 | Keep with narrow fix | one result object carries structure plus overlay bundles |
| workbench | DoorOneWorkbench | integration coordinator | `runtime/DoorOneWorkbench.js` | none | semantic_overlay / review_matrix | Support | Support | B3 | support exposure | mixed | orchestrator, cross-run | HUD, viewer adapters | Y | Y | Y | C2 | Keep with narrow fix | compatibility aliases and overlay bundling weaken seam clarity |
| cross_run_family | CrossRunSession + CrossRunDynamicsReport + DoorOneExecutiveLane | runtime review family | `runtime/CrossRun*.js`, `runtime/DoorOneExecutiveLane.js` | review_matrix | review_matrix | Review | Review | B3 | review | review | multiple run results | dossier, HUD | N | Y | Y | C1 | Keep active | evidence-first comparison layer |
| hud_shell_family | MetaLayer shell + HomeRouterShell + SemanticOscilloscopeApp | app shells | `hud/*Shell.jsx`, `hud/SemanticOscilloscopeApp.jsx` | none | replay_bounded / query_op / semantic_overlay / review_matrix | Support | Support | B3 | shell / routing | mixed | orchestrator, workbench, cross-run | user routing, export, and mode selection | Y | Y | Y | C3 | Keep with narrow fix | major mixed shell cluster and likely unthreading target |
| legibility_panel | OperatorLegibilityPanel | panel | `hud/OperatorLegibilityPanel.jsx` | review_matrix | review_matrix | Review | Review | B3 | review / semantic | review / semantic | legibility model, shell state | user inspection | N | Y | Y | C1 | Keep active | downstream display surface |
| legibility_model | operatorLegibilityModel | HUD model | `hud/operatorLegibilityModel.js` | semantic_overlay / review_matrix | semantic_overlay / review_matrix | Review | Review | B3 | review / semantic | mixed | structural payload, replay, readiness, review | panel, HUD | Y | Y | Y | C4 | Rebuild later | strongest role collapse in current set |
| retained_signature_cluster | boundedObjectTracking + memorySupportClassification + sibling helpers | helper cluster | `hud/*retained-signature helpers*` | retention_signature | retention_signature / replay_bounded | Support | Support | B2 | support exposure | mixed | replay data, retained tiers | legibility, HUD | N | Y | Y | C3 | Rebuild later | helper cluster appears to substitute for a missing dedicated retention seam |

---

## Contamination summary

The current contamination pattern is uneven rather than universal.

- `C0-C1` dominates the structural operators and explicit review operators.
- `C2` appears in support and runtime coordinator objects where structure, support, and overlays are bundled together.
- `C3-C4` is concentrated in the HUD shell family, legibility model layer, and retained-signature helper cluster.

Most importantly:

contamination is not centered in the primary structural chain. It is concentrated in attachments, wrappers, shell-routing surfaces, and review-facing read-side models.

---

## Seam-relationship summary

The active seam picture at this snapshot is:

- `ingest -> clock_align -> window -> transform -> compress -> anomaly -> merge` is the cleanest structural line.
- `replay_bounded` is present as a bounded read-side replay gate rather than a primary structural emission seam.
- `query_op` and the consensus/review family remain downstream and mostly explicit.
- the runtime coordinator layer composes structural outputs, support summaries, semantic overlays, readiness overlays, and review overlays into mixed integration surfaces.
- the HUD layer carries the heaviest seam braiding by combining execution, replay, routing, inspection, request, and review surfaces in one active shell family.

Current structural-support-review separation is therefore real, but the later support and HUD layers do not preserve it cleanly enough.

---

## Dependency summary

The main dependency chain visible in this snapshot is:

- structural operators feed `MemorySubstrate`
- `MemorySubstrate` plus runtime reports feed `DoorOneOrchestrator`
- `DoorOneOrchestrator` feeds `DoorOneWorkbench`
- `DoorOneWorkbench`, cross-run comparison, and review overlays feed the active HUD shell family
- the HUD shell family feeds the legibility panel/model and other downstream review-facing surfaces

The most entangled dependency knot is:

`MemorySubstrate -> DoorOneOrchestrator -> DoorOneWorkbench -> HUD shell family -> operatorLegibilityModel`

That knot is the clearest unthreading target because it is where structural, support, replay, semantic, and review surfaces are most tightly bundled.

---

## Recommendation summary

Recommended preservation and cleanup posture from this baseline:

- preserve the structural operator core as the base of the next phase
- keep explicit review operators active where they remain bounded and honest
- narrow the mixed runtime coordinator surfaces rather than treating them as structural truth surfaces
- plan unthreading around the HUD shell family and legibility-model cluster first
- treat retained-signature helper clusters as probable rebuild-later surfaces unless a cleaner dedicated seam is introduced

Recommended next packet family:

`unthreading planning`

Reason:

the inventory is now explicit enough to support separation planning without pretending that retirement or removal decisions have already been justified for every mixed object.

---

## Unresolved items

The main unresolved items still active after this baseline are:

- whether `MemorySubstrate` should continue to carry both retention/topology duties and query/report duties
- whether the displaced `retention_signature` seam should be made explicit before larger cleanup packets proceed
- whether `DoorOneWorkbench` compatibility aliases remain necessary or now preserve avoidable seam blur
- how much of the retained-signature helper cluster should survive once a cleaner support seam exists
- whether any late HUD review surfaces are still substituting for earlier missing exposure seams rather than merely displaying them

These are bounded unresolved items for later packets, not reasons to discard the structural base.

---

## One-line snapshot summary

The 2026-04-08 operator inventory baseline indicates that the structural operator core is mostly clean, while the main contamination pressure sits downstream in mixed support coordinators, shell-routing surfaces, and review-facing HUD/model attachments.
