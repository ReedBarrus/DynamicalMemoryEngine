## README_ContinuousIngestRetentionLadder.md
Status

    define bounded continuous-ingest retention, replay legitimacy, preservation class boundaries, and the minimum replay-honest path from ingest receipts through pin/archive without crossing the promotion boundary

It is a supporting implementation note.

It does not override:

    README_MasterConstitution.md

    README_DoorOneAcceptanceChecklist.md

    README_DoorOneAdapterPolicy.md

    README_DoorOnePinArchivePolicy.md

    README_DoorOneRealDeviceExperiment.md

Its purpose is narrower:

    define a bounded retention posture for continuous ingest,

    prevent unbounded receipt/archive recursion,

    preserve replay honesty and provenance continuity,

    define the smallest useful real-world loop target before heavier scale-up.

Door One remains below canon, and continuous ingest hardening is still a follow-on item rather than an acceptance prerequisite.

## 1. Constitutional posture

    Door One already includes:

    measurement,

    structure,

    runtime memory,

    bounded recognition,

    substrate organization,

    lawful inspection,

    bounded live output,

    durable provenance receipts.

    Door One does not require:

    active canon minting,

    prediction loops,

    agency logic,

    final long-term replay digest design,

    full continuous-ingest production hardening.

    Therefore, continuous ingest must be solved first as a retention and replay geometry problem, not as a canon problem.

## 2. Core rule

    Retain raw enough to stay honest.
    Compress enough to stay bounded.
    Declare what each retained layer can still replay.

    Durable receipts remain the minimum replay-honest preservation layer. Live outputs are ephemeral. Digests are convenience surfaces. Pin/archive remain preservation-only and must not be confused with truth or promotion.

## 2.5 Replay legitimacy rule

    Replay in Door One is always lens-bound.

    A retained layer is lawful only if it stays honest about what kind of replay it can still support.

    This means:

    - preservation does not uplift authority,
    - replay support does not imply truth,
    - retention duration does not imply legitimacy,
    - packet assembly does not imply promotion,
    - review packaging does not imply canon,
    - replayable support is not the same as canonical settlement.

    Door One therefore distinguishes between:

    - **replay-honest lineage** — enough durable support to reconstruct or inspect a bounded history under a declared lens,
    - **derived continuity support** — summaries or digests that accelerate navigation but do not outrank receipts,
    - **preservation support** — pinned or archived packets that retain bounded context for later inspection,
    - **promotion** — an explicit later boundary that remains outside normal retention and replay handling.

    A retained surface may be useful for replay without being authoritative.
    A preserved packet may be durable without becoming more true.
    A dossier or review packet may be replay-supported without becoming canon.

    The governing rule is simple:

    **each tier must declare what it can lawfully replay, and what it must not claim.**

## 3. Continuous ingest retention ladder
    Tier 0 — Live working state

        Purpose:

        support current runtime,

        support HUD/workbench visibility,

        support latest-pointer convenience.

        Keep:

            bounded live cycle outputs,

            latest pointers,

            current workbench-facing convenience surfaces.

        Policy:

            prune aggressively,

            do not treat as archive,

            do not depend on this tier for long-horizon replay.

    Tier 1 — Durable receipts

        Purpose:

            preserve minimum replay-honest lineage,

            preserve cycle/run/session provenance after live pruning.

        Keep:

            durable receipt files,

            run labels / cycle lineage,

            source and stream identity,

            ingest boundary facts,

            timing context.

        Policy:

            this is the minimum layer that must survive live cleanup,

            digest-only preservation is insufficient.

    Tier 2 — Regenerable digest

        Purpose:

            compress recent receipt history for quick inspection and continuity,

            accelerate bounded replay/navigation.

        Keep:

            rolling digest over recent receipts,

            compact continuity summaries,

            bounded references back to receipt ranges.

        Policy:

            always marked derived,

            always rebuildable from receipts,

            never treated as authority.

    Tier 3 — Pinned packet

        Purpose:

            preserve a bounded experiment slice, incident, or review cohort.

        Keep:

            explicit packet metadata,

            selected receipt references or summaries,

            selected digest snapshot if helpful,

            selected latest/report references if intentionally included,

            explicit “not canon / not truth” disclaimer.

        Policy:

            create only by explicit action,

            favor traceability over size,

            preserve enough context for later inspection without unstable live dependence.

    Tier 4 — Archive bundle

        Purpose:

            preserve longer-horizon experiment groups or session cohorts.

        Keep:

            grouped pinned packets,

            bounded receipt references,

            explicit scope/version metadata.

        Policy:

            preservation only,

            no implied settlement,

            no ontology or trust uplift from storage duration.

## 4. Required invariants across compression

    Every upward compression or preservation step must preserve, at minimum:

        - `source_id`
        - `stream_id`
        - channel / modality identity
        - bounded time range
        - run/session/cycle lineage
        - recoverable receipt references
        - declared replay lens context when relevant
        - explicit derived-vs-durable status
        - receipt precedence over summaries
        - explicit preservation-only or review-only status when applicable

    Additional rule:

        - if a higher tier includes digest, dossier, readiness, workbench, or review context, it must remain clear which parts are authoritative lineage support and which parts are derived or review-only convenience.

    Compression is lawful only if replay honesty survives the step.

    A retained higher tier does not need to preserve every lower-tier byte inline, but it must preserve enough lineage to answer the declared replay question without silently inflating authority.

    This follows the ingest contract, adapter provenance obligations, replay-is-lens-bound constitutional rule, and the requirement that storage class must not be confused with authority class.

## 4.5 Replay / legitimacy matrix by tier

    Each retention tier supports a different class of lawful replay or inspection.

    ### Tier 0 — Live working state

        Lawful use:

        - current-cycle inspection,
        - HUD/workbench convenience,
        - latest-pointer navigation,
        - transient operator-facing visibility.

        May support:

        - immediate local inspection,
        - short-horizon comparison while the live state still exists.

        Must not imply:

        - durable lineage,
        - stable replay baseline,
        - preservation legitimacy,
        - promotion,
        - truth,
        - ontology.

    ### Tier 1 — Durable receipts

        Lawful use:

        - minimum replay-honest lineage,
        - bounded run/cycle/session reconstruction,
        - provenance audit,
        - receipt-grounded replay under declared lens.

        May support:

        - replay-honest reconstruction of what was measured, transformed, compressed, or reviewed,
        - durable verification when live outputs are pruned.

        Must not imply:

        - final interpretation,
        - canon,
        - trust uplift,
        - ontology,
        - promotion by existence.

    ### Tier 2 — Regenerable digest

        Lawful use:

        - bounded continuity review,
        - navigation across recent receipts,
        - compact replay support when backed by receipts.

        May support:

        - recent overview,
        - continuity summaries,
        - recent cohort inspection,
        - faster read-side replay navigation.

        Must not imply:

        - authority over receipts,
        - replacement of receipt lineage,
        - settlement of ambiguity,
        - canon,
        - truth.

        If a digest and receipts disagree, receipts win.

    ### Tier 3 — Pinned packet

        Lawful use:

        - bounded experiment preservation,
        - explicit review/replay handoff,
        - cohort freezing for later inspection,
        - stable packetized support for comparison.

        May support:

        - replay-backed experiment or incident review,
        - bounded preservation without dependence on unstable live state,
        - selected inclusion of receipts, digests, workbench refs, and review posture.

        Must not imply:

        - promotion,
        - truth,
        - canon,
        - ontology,
        - authority uplift from pinning.

        Pinned review context remains review context only.

    ### Tier 4 — Archive bundle

        Lawful use:

        - long-horizon preservation of declared cohorts,
        - later comparison across experiments or sessions,
        - historical replay support through included packet lineage.

        May support:

        - later inspection,
        - cohort comparison,
        - archived packet retrieval,
        - longitudinal preservation.

        Must not imply:

        - canonical settlement,
        - final interpretation,
        - trusted memory,
        - ontology,
        - legitimacy uplift from storage duration.

        Archive is preservation, not promotion.

    ### Promotion boundary note

        No tier in this retention ladder mints canon.

        If a retained packet contains:

        - readiness,
        - dossier packaging,
        - candidate claims,
        - consensus review posture,
        - replayable support flags,

        those remain below canon unless an explicit higher-layer promotion process says otherwise.

        Retention supports later review.
        Retention does not decide review.
        Review does not itself mint canon.

## 5. Pruning rule

    A lower tier may be pruned only when the next retained tier still preserves the declared replay question.

    Examples:

    If the question is audit lineage, Tier 1 may be enough.

    If the question is recent continuity review, Tier 2 may be enough.

    If the question is “what happened in this bounded experiment?”, Tier 3 should exist.

    If the question is long-horizon cohort preservation, Tier 4 should exist.

    Do not keep infinite recursive receipts by default.
    Do not replace durable receipts with digest-only surfaces.

    A pruning decision is lawful only if the retained next tier still preserves both:

    1. the declared replay question, and
    2. the correct legitimacy posture for that question.

    Examples:

        - audit lineage requires receipt-grounded support,
        - continuity review may use digest support if receipts remain recoverable,
        - bounded experiment replay may rely on a pinned packet only if receipt lineage is still preserved or embedded,
        - archive preservation remains insufficient for canon unless explicit promotion occurs elsewhere.

## 6. Minimal first real-world ingest target

    The first real-world loop should remain as small and honest as possible.

    Recommended source class

    Use one real numeric source that is easiest to repeat honestly:

    microphone/audio,

    analog sampler-backed signal,

    simple device/sensor source.

    Minimal ingest shape

    Each bounded run should preserve:

    timestamps

    values

    stream_id

    source_id

    channel

    modality

    clock_policy_id

    bounded metadata with nominal sampling / source context where available.

    Minimal regime pattern

    Use three bounded phases:

    stable baseline

    deliberate perturbation

    return or alternate stable regime

    Preferred minimum run count

    3 baseline runs

    2 perturbation runs

    2 return or alternate-regime runs

    Minimal retention target for the first loop

    For this first real-world loop, preserve only:

    Keep bounded

    live cycle outputs for the current run window only

    Keep durable

    all receipts for the experiment run set

    Keep regenerable

    one rolling digest for the current experiment window

    Pin explicitly

    one pinned packet for the full experiment cohort

    Archive later only if worth preserving

    one archive bundle only if the experiment becomes a reference baseline for later transform or multi-scale comparison.

    This is enough to stabilize the first real-world loop without pretending continuous ingest is fully solved.

## 7. Minimal success threshold for this retention target

    The first real-world loop retention posture is good enough if all of the following are true:

    provenance can be reconstructed clearly from receipts,

    baseline / perturbation / return remain distinguishable through lawful inspection,

    live pruning does not destroy replay honesty,

    digest loss does not destroy core lineage,

    one pinned packet can preserve the experiment without dependence on unstable live state.

    - pinned or archived preservation does not cause review, replay, or readiness surfaces to be misread as promotion or canon.

## 8. Immediate engineering target

    Before large-scale continuous ingest, implement the smallest practical hardening step:

    bounded rolling live window,

    durable receipt persistence,

    rolling digest regeneration from receipts,

    one explicit packet writer for bounded experiment cohorts,

    pruning rules tied to replay questions rather than ad hoc storage pressure.

    This matches the current constitutional direction: solve continuous-ingest retention as bounded preservation and replay support before importing later-layer semantics.

## 9. Practical summary

    Door One does not need infinite retention.
    Door One needs a lawful retention ladder.

    For the first real-world loop:

        keep live state small,

        keep receipts durable,

        keep digest rebuildable,

        pin the experiment explicitly,

    archive only when a cohort becomes worth preserving.

    That is the minimal retention geometry for stabilizing real-world ingest without prematurely invoking canon.