# README_DoorOneSurfaceMap.md
# Dynamical Memory Engine — Door One Surface Map

## Status

This document is the compact accounting surface for Door One.

It is a supporting reference note.

It does **not** override:
- `README_MasterConstitution.md`
- `README_ConstitutionAppendix.md`
- `README_WorkflowContract.md`
- `README_RepoPlacementConstitution.md`
- `README/README_DoorOneRuntimeBoundary.md`
- `README/README_DoorOneAcceptanceChecklist.md`

Its purpose is narrower:

- account for the active Door One system in one place,
- distinguish runtime seams from inspection surfaces,
- distinguish inspection surfaces from preservation surfaces,
- point to the governing note or contract for each surface,
- reduce README sprawl by giving Door One one compact index.

---

## 1. Constitutional posture

Door One remains below canon.

The active constitutional order remains:

measurement → structure → runtime memory → recognition → canon → prediction → agency → ecology → symbolic → meta

For Door One, the active stack remains limited to lower lawful layers and bounded recognition support.

Inherited boundary rules remain in force:

- runtime is not canon,
- query is not truth,
- substrate is not ontology,
- consensus is promotion-only,
- scripts and HUDs are read-side only,
- preservation class is not authority class.

This document is an accounting surface only.
It does not create a new layer or new authority. 

---

## 2. Door One mission

Door One exists to:

- accept lawful raw ingest input,
- derive bounded structural runtime artifacts,
- support repeated-run comparison,
- assemble lawful read-side inspection surfaces,
- accumulate bounded evidence for readiness without silently promoting canon.

Door One does **not** exist to:

- mint canon,
- create prediction authority,
- create agency authority,
- reinterpret substrate as ontology,
- treat display as truth,
- treat preservation as legitimacy.

---

## 3. Active Door One stack

The active Door One stack is:

raw ingest input  
→ `DoorOneExecutiveLane`  
→ `DoorOneOrchestrator`  
→ `CrossRunSession`  
→ `DoorOneWorkbench`  
→ `DoorOneHUD` / `DoorOneStructuralMemoryHud.jsx`

This is the current operational chain for repeated-run execution, inspection assembly, and read-side visibility.

---

## 4. Runtime seams

These are the active runtime coordinators and bounded execution surfaces.

### A. `DoorOneExecutiveLane`
**Role:** repeated-run runtime coordinator and normalization gate.  
**Primary responsibilities:**
- normalize accepted Door One input shapes,
- validate lawful raw ingest input,
- coordinate single-run execution through the orchestrator,
- accumulate bounded repeated-run context,
- request workbench assembly,
- expose latest read-side surfaces.

**May not:**
- reinterpret ingest meaning,
- mint canon,
- create prediction authority,
- bypass orchestrator contracts.

**Primary references:**
- `runtime/DoorOneExecutiveLane.js`
- `README/README_DoorOneRuntimeBoundary.md`
- `README/README_DoorOneAdapterPolicy.md`

### B. `DoorOneOrchestrator`
**Role:** single-run end-to-end Door One coordinator.  
**Primary responsibilities:**
- execute lawful single-run processing,
- separate artifacts / substrate / summaries / audit,
- preserve deterministic output and audit visibility.

**May not:**
- mint canon,
- collapse audit into summaries,
- claim ontology from substrate organization.

**Primary references:**
- `runtime/DoorOneOrchestrator.js`
- `README/README_DoorOneRuntimeBoundary.md`

### C. `CrossRunSession`
**Role:** bounded observational repeated-run accumulation.  
**Primary responsibilities:**
- retain run history up to bounded max,
- produce observational cross-run comparison,
- support readiness inspection.

**May not:**
- promote canon,
- define truth,
- replace consensus.

**Primary references:**
- `runtime/CrossRunSession.js`
- `README/README_DoorOneRuntimeBoundary.md`

### D. `DoorOneWorkbench`
**Role:** integration and inspection assembly surface.  
**Primary responsibilities:**
- assemble runtime outputs,
- include bounded interpretation,
- include optional cross-run context,
- include readiness / dossier / bounded consensus review surfaces.

**May not:**
- mint C1,
- redefine runtime meaning,
- promote on readiness or defer.

**Primary references:**
- `runtime/DoorOneWorkbench.js`
- `README/README_DoorOneRuntimeBoundary.md`

---

## 5. Inspection surfaces

These are read-side visibility surfaces only.

### A. `DoorOneHUD.js`
**Role:** terminal inspection surface.  
**Purpose:** compact textual visibility into lawful Door One runtime/workbench outputs.

### B. `DoorOneStructuralMemoryHud.jsx`
**Role:** browser inspection surface.  
**Purpose:** browser-side structural memory inspection over lawful exported Door One outputs.

The preferred visual order for Door One inspection surfaces is:

1. Provenance  
2. Runtime Evidence  
3. Interpretation  
4. Review Surfaces

Inspection surfaces may improve visibility, but they may not create semantic authority.

**Primary references:**
- `hud/DoorOneHUD.js`
- `hud/DoorOneStructuralMemoryHud.jsx`
- `hud/DoorOneStructuralMemoryHudModel.js`
- `README/README_DoorOneInspectionSurfacePosture.md`
- `README/README_DoorOneRuntimeBoundary.md`

---

## 6. Preservation surfaces

These are bounded preservation and replay-support surfaces.  
They are preservation-only, not promotion.

### A. Ephemeral live outputs
**Examples:**
- `out_live/cycle_*`
- `out_live/latest_workbench.json`
- `out_live/latest_run_result.json`
- `out_live/latest_cross_run_report.json`
- `out_live/session_summary.json`

**Role:** current-cycle inspection and convenience.  
**Status:** bounded and prunable.

### B. Durable provenance receipts
**Examples:**
- `out_provenance/live/receipt_cycle_*.json`

**Role:** minimum replay-honest durable lineage surface.  
**Status:** survives live pruning.

### C. Live provenance digest
**Example:**
- `out_provenance/live/live_digest.json`

**Role:** derived replay convenience summary over durable receipts.  
**Status:** regenerable; receipts outrank digest.

### D. Pin packets
**Example output zone:**
- `out_provenance/pinned/*.json`

**Role:** explicit bounded preserved replay/review packets.

### E. Archive bundles
**Example output zone:**
- `out_provenance/archive/*.json`

**Role:** longer-horizon preservation bundles built from pinned packets.

**Primary references:**
- `README/README_DoorOneProvenanceRetention.md`
- `README/README_DoorOnePinArchivePolicy.md`
- `scripts/run_door_one_provenance_digest.js`
- `scripts/run_door_one_pin_packet.js`
- `scripts/run_door_one_archive_bundle.js`

---

## 7. Governing Door One notes

Door One currently depends on the following supporting notes:

- `README/README_DoorOneRuntimeBoundary.md`  
  operational boundary, seams, allowed inputs/outputs, read-side posture

- `README/README_DoorOneProvenanceRetention.md`  
  bounded live retention and durable provenance receipt posture

- `README/README_DoorOneAdapterPolicy.md`  
  lawful pre-ingest adapter posture and required ingest boundary

- `README/README_DoorOneInspectionSurfacePosture.md`  
  provenance-first inspection ordering and semantic-drift prevention

- `README/README_DoorOnePinArchivePolicy.md`  
  live / receipt / digest / pin / archive preservation classes

- `README/README_DoorOneAcceptanceChecklist.md`  
  practical Door One acceptance and current freeze line

- `README_RepoPlacementConstitution.md`  
  file placement and repo-topology law

---

## 8. Tests by seam

Door One now has bounded contract coverage across the major seams.

### Runtime seams
- `tests/test_door_one_orchestrator.js`
- `tests/test_door_one_executive_lane.js` *(if present in repo)*
- `tests/test_door_one_workbench.js` *(if present in repo)*

### Inspection surfaces
- `tests/test_door_one_hud_workbench.js` *(if present in repo)*
- `tests/test_door_one_structural_memory_hud.js`

### Anti-bypass / boundary protection
- `tests/test_door_one_anti_bypass_contracts.js`

### Provenance / preservation
- `tests/test_door_one_live_provenance_retention.js`
- `tests/test_door_one_provenance_digest.js`
- `tests/test_door_one_pin_packet.js`
- `tests/test_door_one_archive_bundle.js`

### Ingest hardening
- `tests/test_door_one_ingest_hardening.js`

This test grouping is by seam responsibility, not by chronology.

---

## 9. Current accepted Door One state

Door One is currently accepted enough for the present phase when read through the practical checklist.

That means, in compact form:

- lawful repeated-run execution exists,
- lawful single-run orchestration exists,
- lawful workbench assembly exists,
- lawful terminal and browser inspection surfaces exist,
- bounded live runner exists,
- durable receipts exist,
- digest exists,
- explicit pin / archive policy exists,
- bounded pin packet and archive bundle flows exist,
- anti-bypass protections are test-backed,
- Door One remains below canon.

This does **not** mean Door One is fully finished forever.
It means the current phase is stabilized enough to use without silently leaking upward into Door Two.

---

## 10. Explicitly deferred beyond Door One

The following remain outside current active Door One authority:

- active C1 minting,
- trusted canonical memory operation,
- prediction loops,
- agency logic,
- symbolic cognition,
- meta-governance.

These may be discussed architecturally, but they do not define current Door One runtime meaning.

---

## 11. Current follow-on pressure

The current follow-on pressure after Door One stabilization is:

1. Real-Device Testing
2. Multi-scale ingest + FFT/wavelet from DFT
3. eventual Door Two design packet work.

Read-side or preservation convenience must remain subordinate to constitutional boundary law.

---

## 12. How to use this note

Use this note when asking:

- what surfaces currently make up Door One?
- where does a file or helper belong conceptually?
- which README governs this seam?
- is this thing runtime, inspection, or preservation?
- what is active now versus deferred?

If a question is still ambiguous after reading this note, defer to:

1. `README_MasterConstitution.md`
2. `README/README_DoorOneRuntimeBoundary.md`
3. `README/README_DoorOneAcceptanceChecklist.md`
4. `README_WorkflowContract.md`

in that order for the relevant type of question.