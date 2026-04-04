# README.HelperWrappersAndSupportTooling_v0.md
# Dynamical Memory Engine — Helper Wrappers and Support Tooling v0

## Status

This document defines the first bounded helper-wrapper and support-tooling posture for the Workflow Mechanization facet in DME.

It is a supporting workflow-facet note.

It does **not** override:

- `README_MasterConstitution.md`
- `README_WorkflowContract.md`
- `README_RepoPlacementConstitution.md`
- `README.WorkflowMechanizationScope.md`
- `README.MechanizationClosureGate.md`
- `README.PacketWorkflowChain.md`
- `README.StructuralIdentityLaw.md`
- `README.EmissionAdmissionGrammar_v0.md`
- `README.SeamRegistryModel.md`
- `README.AgentEcologyAndHelperPosture.md`
- `README.AddressLattice_v0.md`

Its purpose is narrower:

- define the first lawful classes of helper wrappers and support tooling,
- define what those wrappers may read, write, and preserve,
- define what kinds of state they may carry,
- define their relationship to seams, packets, registries, audits, and helpers,
- and prepare future local-tool, import, and model-wrapper support without inflating helper authority.

This note governs **helper-wrapper posture and support-tooling boundaries** only.

It does **not** govern:

- runtime artifact meaning,
- operator contracts,
- canon activation,
- merge authority,
- architectural truth,
- or autonomous workflow government.

---

## 1. Why this note exists

The Workflow Mechanization facet now has enough structure that helper work is becoming real rather than hypothetical.

The project now has or expects:

- packetized implementation flow,
- seam-local closure state,
- registry-like workflow accounting,
- helper roles,
- addressing handles,
- reconstruction-backed replay surfaces,
- future CSV/file import helpers,
- future local-model wrappers such as Ollama,
- and future bounded schema/stub support.

Without an explicit helper-wrapper posture, several problems become likely:

- useful wrappers begin to act like authority engines,
- local convenience scripts become hidden policy,
- helper-local memory outranks seam evidence,
- model wrappers become mistaken for cognition authority,
- import helpers silently assign source meaning,
- and one wrapper accumulates too many responsibilities without declared limits.

This note exists to prevent that drift.

Its purpose is not to suppress tools.
Its purpose is to keep tools lawful.

---

## 2. Core rule

**A helper wrapper or support tool is lawful only when it performs a bounded support function over declared workflow objects, remains subordinate to role hierarchy and seam evidence, preserves explicit non-claims, and does not silently absorb architectural, runtime, canon, or merge authority through convenience alone.**

Corollary rules:

- helper tooling is not governing authority
- wrapper memory is not seam truth
- wrapper execution is not architectural legitimacy
- import convenience is not source-family truth
- local-model access is not cognition authority
- support state is not promotion state

The wrapper must remain smaller than the role it assists.

---

## 3. What a helper wrapper is

A helper wrapper is a bounded tool surface that assists one or more lawful workflow operations without redefining the workflow’s authority order.

Examples:

- registry updater
- packet formatter
- audit recorder
- note bundle assembler
- retrieval context builder
- import normalizer
- local-model invocation wrapper
- CSV/object trace ingest helper
- bounded comparison helper
- replay request helper
- support-state inspector

A wrapper is not “whatever helps.”

A wrapper must have:

- a declared bounded role,
- a declared object class it may act on,
- a declared non-role,
- explicit input/output posture,
- and explicit escalation limits.

If those are missing, the wrapper is too vague to be lawful.

---

## 4. Wrapper classes for v0

The following wrapper classes are allowed in v0.

## 4.1 Registry wrapper

Purpose:
assist seam-entry creation, updating, and reading.

May:
- create or update seam entries,
- attach packet references,
- update closure-state fields,
- preserve what is now true / still not claimed,
- attach bounded regime signals,
- preserve role/ownership posture fields.

May not:
- decide seam meaning,
- infer mechanization without seam evidence,
- infer acceptance from branch existence,
- upgrade status based on convenience alone.

Typical objects touched:
- seam registry entries
- packet lineage records
- audit snapshots

---

## 4.2 Packet wrapper

Purpose:
assist packet creation, packet formatting, packet lineage visibility, and packet accounting.

May:
- materialize packet templates,
- preserve packet ids,
- bind seams to packets,
- preserve fission lineage,
- record route outcomes,
- preserve completion/non-claim summaries.

May not:
- silently rewrite packet scope,
- convert a return packet into approval,
- auto-upgrade packet status to accepted,
- erase non-goals or escalation history.

Typical objects touched:
- Architect Task Spec Packets
- Engineer Return Packets
- packet lineage fields
- bounded review packets

---

## 4.3 Audit wrapper

Purpose:
assist audit visibility over bounded workflow objects.

May:
- record dominant telemetry,
- preserve distortion / drift / uncertainty posture,
- summarize what is now true,
- summarize what is still not claimed,
- point back to seam evidence,
- format bounded audit outputs for review.

May not:
- convert summary into authority,
- erase ambiguity for readability,
- silently convert uncertainty into acceptance,
- claim mechanization from surface clarity alone.

Typical objects touched:
- audit objects
- seam audit fields
- packet review notes
- closure-readiness surfaces

---

## 4.4 Retrieval/context wrapper

Purpose:
assemble bounded context bundles for lawful work on seams, packets, or notes.

May:
- gather governing notes,
- recover seam-related files,
- recover packet lineage,
- bind task-relevance handles,
- distinguish durable from ephemeral context,
- provide bounded source bundles for review.

May not:
- treat retrieval convenience as proof,
- replace underlying seam evidence,
- blur repo source-of-truth and helper-local memory,
- silently broaden the question being answered.

Typical objects touched:
- governing README sets
- seam-related source files
- packet history
- context bundles for Architect or Engineer

---

## 4.5 Import / normalization wrapper

Purpose:
normalize bounded external objects into lawful pre-ingest or workflow-entry shapes.

May:
- parse CSV / JSON / WAV / trace objects,
- preserve source provenance,
- preserve family/workflow type metadata,
- normalize into declared input shapes,
- fail explicitly and locally,
- attach import context where declared.

May not:
- assign truth,
- assign source-family meaning beyond declared workflow rules,
- silently reinterpret semantics,
- bypass the lawful ingest or workflow boundary.

This must remain consistent with existing adapter and source-family rules. 

Typical objects touched:
- raw ingest objects
- flush results
- bounded workflow import objects
- declared trace families

---

## 4.6 Local-model wrapper

Purpose:
invoke a local model or bounded external model surface as a support tool, not as a governing authority.

Examples:
- Ollama wrapper
- local summary model
- local comparison model
- bounded embedding or metric extraction model

May:
- run bounded local inference,
- summarize within declared compression posture,
- produce derived support objects,
- support retrieval or comparison helpers,
- expose explicit model/version/runtime metadata,
- preserve whether outputs are durable or ephemeral.

May not:
- speak as canon,
- silently assign architectural truth,
- auto-approve workflow closure,
- convert model output into seam authority,
- bypass declared review or role hierarchy.

Typical objects touched:
- derived support objects
- audit-helper surfaces
- retrieval-support objects
- ephemeral helper-local state

---

## 4.7 Replay / reconstruction wrapper

Purpose:
support replay requests, reconstruction support assembly, and retained-tier-aware helper inspection.

May:
- prepare replay requests,
- assemble support bundles,
- declare lens/tier posture,
- expose replay trace access,
- preserve explicit non-claims,
- support bounded inspection and review workflows.

May not:
- imply raw restoration,
- imply canon,
- silently strengthen retained-tier support,
- suppress downgrade posture,
- replace the underlying reconstruction seam.

This must remain consistent with replay-is-lens-bound, retained-tier honesty, and mechanization closure rules. 

---

## 5. Wrapper input/output posture

Every wrapper should declare:

### `input_object_classes`
What kinds of bounded objects it may read.

### `output_object_classes`
What kinds of bounded objects it may emit.

### `durable_state`
What durable state, if any, it may preserve.

### `ephemeral_state`
What temporary or session-local state it may preserve.

### `explicit_non_claims`
What the wrapper must never imply.

### `escalation_boundary`
What kinds of unresolved pressure must be escalated rather than absorbed.

This posture should be explicit even if the wrapper is small.

---

## 6. Durable vs ephemeral wrapper state

Wrappers may hold state, but state class must remain explicit.

### Durable wrapper state

Allowed examples:
- seam ids
- packet ids
- declared schema version
- wrapper config version
- support-tier posture
- declared import family metadata
- cached registry/accounting snapshots if clearly subordinate

Durable wrapper state must remain:
- attributable
- inspectable
- subordinate to repo/seam evidence
- safe to compare over time

### Ephemeral wrapper state

Allowed examples:
- session-local context bundle
- local inference cache
- current branch-local scratch state
- temporary retrieval neighborhood
- temporary normalization buffers

Ephemeral wrapper state must remain:
- local
- disposable
- non-authoritative
- never silently promoted into durable seam identity

This aligns with the address-lattice distinction between durable and ephemeral axes.

---

## 7. Wrapper relationship to seam registry

Wrappers should prefer acting through seam handles where possible.

A lawful wrapper should be able to say:

- what seam it is acting on,
- what packet or packet family it is assisting,
- what registry object it is reading or updating,
- what closure posture applies,
- what remains unclaimed.

If it cannot relate its action to those bounded handles, it is likely operating too loosely for v0.

The seam registry is therefore the preferred accounting surface for wrapper interaction, not conversational memory alone.

---

## 8. Wrapper relationship to agent ecology

Wrappers are subordinate to the Reed / Architect / Engineer / Helper hierarchy.

That means:

- Reed remains governing authority
- Architect remains boundary/review authority
- Engineer remains bounded implementation authority
- wrappers remain helper-class support objects

Wrappers may strengthen support.
They may not flatten the hierarchy.

This remains especially important for repeated-use helpers, because repeated usefulness can easily masquerade as legitimacy if not fenced explicitly. 

---

## 9. Wrapper relationship to structural identity

A wrapper must not silently preserve object continuity when structural identity has drifted.

If a wrapper changes:
- the bounded question,
- declared constraints,
- support basis,
- route class,
- or authority posture,

then it must not continue speaking as if it handled “the same object” unchanged.

The correct action is:
- narrow,
- split,
- remint under new object class,
- downgrade,
- or escalate.

This note therefore inherits the structural identity law directly for wrapper-mediated transformations. :contentReference[oaicite:6]{index=6}

---

## 10. Wrapper relationship to distortion audit

Wrappers are especially vulnerable to convenience distortion.

Likely risks include:
- summary flattening
- scope theft
- ambiguity erasure
- basis drift
- helper overclaim
- ontology leakage through rich labels

So wrappers should be audited using the same distortion logic already active elsewhere in DME:
preserve ambiguity where support is weak, refine only at the right layer, and do not turn compression into misleading sameness. :contentReference[oaicite:7]{index=7}

---

## 11. Allowed v0 wrapper outputs

Lawful wrapper outputs in v0 include:

- seam-entry updates
- packet templates
- packet lineage updates
- audit summaries
- context bundles
- import-normalized objects
- replay request helpers
- bounded derived support objects
- local-model support artifacts
- explicit escalation/request objects

These outputs remain support objects only.

They do not become runtime truth, canon, or merge approval.

---

## 12. Forbidden wrapper inflations

Wrappers must not become:

- hidden workflow government
- automatic merge approval
- automatic canon gate
- silent architectural policy engines
- semantic truth assigners
- source-family ontologists
- replay legitimacy engines by themselves
- implicit memory authority through caching alone
- autonomous redesign loops

The most important anti-collapse rule is:

**a wrapper may increase support power without increasing authority class.**

---

## 13. Development-order rule for wrappers

Wrappers should be developed in this order:

1. registry/accounting wrappers
2. packet wrappers
3. audit/retrieval wrappers
4. import/normalization wrappers
5. local-model wrappers
6. replay/reconstruction wrappers
7. only later, schema/stub progression helpers

This order matters because wrappers should first support:
- lawful bookkeeping
- lawful packet flow
- lawful audit visibility

before they begin assisting richer generation or local-model compression surfaces.

---

## 14. Local-model / Ollama posture note

A local-model wrapper such as Ollama should be treated as:

- a bounded helper surface,
- below canon,
- below architecture authority,
- below merge authority,
- and below seam truth.

Its lawful uses likely include:
- local summarization
- bounded comparison support
- helper-local retrieval compression
- derived trace generation for experimental support
- workflow assistance under declared non-claims

Its unlawful uses would include:
- deciding acceptance
- deciding canon
- silently mutating packet scope
- acting as workflow governor
- turning latent similarity into structural identity proof

This is especially important because local-model availability can make unjustified mechanization pressure feel cheaper than it is.

---

## 15. Relationship to schema-stub protocol

This note comes before schema-driven stub progression.

Why:
- wrappers need lawful posture before they generate anything
- support tooling needs declared boundaries before automation pressure increases
- otherwise schema/stub generation would inherit unbounded helper authority by default

So:
- wrappers first
- schema-stub protocol later

That sequencing preserves legitimacy.

---

## 16. Small-scope rule

This note must remain small in v0.

Do **not** expand it yet into:
- full automation framework
- multi-agent autonomy engine
- generalized tool orchestration OS
- universal model-routing layer
- workflow government by wrappers

The first lawful use is:
- define wrapper classes
- define state posture
- define allowed/forbidden actions
- prepare specific helper/tool notes later

---

## 17. One-line review question

Before introducing any new wrapper or helper tool, ask:

**Is this wrapper still performing a bounded support function over declared workflow objects under explicit hierarchy and seam evidence, or is it beginning to absorb authority, identity, or policy that belongs elsewhere?**

---

## 18. One-line summary

**Helper wrappers and support tooling in DME exist to strengthen bounded workflow support over seams, packets, audits, imports, and local-model assistance without allowing convenience, memory, or local inference to silently become architectural, runtime, canon, or merge authority.**