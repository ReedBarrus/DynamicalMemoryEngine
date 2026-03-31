README_MetaLayerConsultationDemo.md
Dynamical Memory Engine — Meta-Layer Consultation Demo
Status

This document defines a bounded public-facing demo surface for DME.

It is a supporting design and implementation note.

It does not override:

README_MasterConstitution.md
README_ConstitutionAppendix.md
README_WorkflowContract.md
README_DoorOneRuntimeBoundary.md
README_DoorOneInspectionSurfacePosture.md
README_DoorOneSurfaceMap.md
README.DoorTwoCanonCandidatePacket.md
README.DoorTwoCanonActivationCriteria.md
README.C1_StatusLifecycle.md
README.C1_ChallengeContestSupersession.md

Its purpose is narrower:

define one minimal web-facing demo object for external audiences,
translate DME’s current strengths into a legible public interface story,
preserve provenance-first and replay-honest posture,
expose lifecycle and bounded trust without semantic inflation,
guide a small public demo UI seam without disturbing the lab HUD.
1. Purpose

DME now has enough lawful structure to demonstrate more than substrate mechanics.

The next useful public-facing step is not a broad architecture explanation and not an audio-first social demo.

The next step is a single inspectable web-facing object that shows:

provenance,
lifecycle history,
bounded review / trust posture,
replayability,
and explicit non-claims

in a form that an external audience can understand quickly.

This demo exists to show that DME can act as a provenance-preserving structural memory and consultation substrate for web-facing trust / annotation surfaces.

2. Constitutional posture

This demo remains below ontology inflation and below broad product claims.

It does not authorize:

semantic truth claims,
hidden trust scoring,
prediction authority,
symbolic reinterpretation,
black-box reputation assignment,
broad canon expansion,
public-facing promotion shortcuts.

The governing inherited rules remain:

runtime is not canon,
query is not truth,
substrate is not ontology,
consensus is promotion-only,
inspection surfaces remain read-side,
preservation class is not authority class.

This demo is a translation surface, not a new authority layer.

3. Why this demo exists

The current DME system already demonstrates several properties that are highly legible outside the lab:

stable provenance-bearing object history,
explicit review boundaries,
contestability,
replay-honest inspection,
and bounded trust uplift.

The recent comparative consultation result is especially important because it shows:

an existing live C1 anchor can remain stable under modest same-family environmental change,
subtle baseline contamination can still trigger bounded review pressure,
clean rerun conditions can restore the judgment to keep_promoted.

That means the system is already demonstrating:

sensitivity,
bounded trust,
contestability,
and provenance-linked review posture

without faking invariance.

This demo exists to present that behavior in a public-web legible way.

4. Core demo rule

Show one object lifecycle clearly before showing system sprawl.

The demo should center one bounded consultation object and make its status legible through:

provenance,
evidence,
interpretation,
review / trust posture,
replay history.

The demo should not attempt to expose the entire DME architecture at once.

5. Demo object

The primary public-facing demo object is:

Consultation Object Card

or

Inspectable Trust Tag

or

Provenance Annotation Card

This object should behave like a web-facing annotation / trust-indicator / smart-tag proxy.

Its purpose is to show how a public-facing object can carry:

where it came from,
what it currently claims,
what its status is,
what evidence supports it,
how it changed,
and how to replay or inspect that history.

The object is not itself a truth object.
It is a bounded consultation and review surface.

6. Initial demo target

The first demo should use the existing first live C1 consultation line.

Recommended initial target:

live C1 object: C1_BASELINE_SINE400_001
original same-family consultation
room-change contaminated consultation
room-change clean consultation

This first target is preferred because it already shows a compact, intelligible lifecycle:

original: keep_promoted
contaminated rerun: annotate_for_review_only
clean rerun: keep_promoted

This is stronger than a raw “good vs bad” example because it shows:

lawful reuse,
contamination sensitivity,
preserved return-like convergence,
and honest bounded review pressure.
7. Public demo story

The public-facing story should be:

A web-visible annotation or trust object is not a black-box badge.

It has:

visible provenance,
explicit scope,
inspectable evidence,
bounded review posture,
contestability,
and replayable history.

DME’s role is to supply the lawful structural memory and consultation substrate beneath that object.

The story is not:

“the system knows the truth,”
“the badge is globally valid,”
“the object is authoritative because it is visible,”
or “promotion is permanent.”
8. Required information planes

The public demo object should preserve the same preferred inspection ordering already established for Door One surfaces.

Plane 1 — Provenance

Must remain visually primary.

Typical contents:

object id
source family
declared lens
run / consultation lineage
receipt references
policy references where relevant

Questions answered:

where did this object come from?
under what declared lens was it evaluated?
what evidence chain supports this view?
Plane 2 — Evidence

Must remain visually stronger than interpretation.

Typical contents:

compact comparison facts
support basis
return-vs-baseline relationship
contamination or challenge pressure indicators
relevant comparative outputs

Questions answered:

what actually happened?
what evidence supports the current posture?
Plane 3 — Interpretation

Must remain visibly derived and bounded.

Typical contents:

bounded summary sentence
compact interpretation note
local explanation of why the current posture exists

Questions answered:

how is the system characterizing the evidence?
what bounded reading is being offered?
Plane 4 — Review / Trust Posture

Must remain visibly fenced and lower-authority than provenance and evidence.

Typical contents:

current status badge
allowed use
explicit non-claims
review annotation
contest / challenge note if applicable

Questions answered:

how should this object currently be treated?
what is it allowed to support?
what is it not claiming?
Plane 5 — Replay / History

Should remain easy to access.

Typical contents:

prior consultations
lifecycle transitions
result history
packet / receipt drill-down
preserved comparison records

Questions answered:

how did this object change over time?
can I inspect earlier states rather than trusting the present view blindly?
9. Required fields for the first demo card

The first public demo card should minimally show:

object_label
object_id
current_status
bounded_claim
allowed_use
explicit_non_claims
source_family
declared_lens
consultation_lineage
support_basis
current_evidence_summary
history_entries
replay_entrypoints

Optional fields:

challenge_pressure
review_note
receipt_refs
packet_refs
10. Initial lifecycle posture for the demo

The first demo should expose a simple visible lifecycle.

Recommended states to show for this object:

promoted
review_only_annotation
promoted_reaffirmed

This demo may visually borrow from the broader C1 lifecycle work, but it should not expose more lifecycle complexity than needed for the first public story.

The goal is clarity, not completeness.

11. Design posture

The first public demo should be:

compact,
provenance-first,
inspectable,
replay-linked,
low-drama,
and obviously bounded.

It should not be:

theatrical,
ontology-heavy,
dashboard-sprawling,
or dependent on users already understanding DME vocabulary.

Preferred visual posture:

one primary object card,
one short lifecycle timeline,
one compact evidence section,
one expandable replay/history section.
12. Relationship to the existing HUD

The current DoorOneStructuralMemoryHud.jsx should remain the lab / internal inspection surface.

The public-facing consultation demo should be developed as a separate demo-facing read surface.

Reason:

the lab HUD optimizes for internal structural inspection,
the public demo must optimize for external legibility,
combining both too early risks harming both,
and separation reduces semantic drift pressure on the internal inspection surface.

The public demo may reuse lawful exported outputs and shared model adapters where appropriate, but it should not force the lab HUD to become a public storytelling surface.

13. Recommended implementation posture

Preferred first implementation:

add a separate public-facing browser demo surface,
consume existing lawful consultation / workbench / preserved output surfaces,
add minimal adapter/model shaping only as needed,
avoid runtime semantic changes,
avoid promotion logic changes,
avoid changing canon meaning,
avoid touching operator contracts.

This should remain a read-side implementation seam first.

14. Deferred items

The following should be deferred for now:

broad multi-object web trust fabrics,
generalized page-level overlay systems,
broad public ontology for annotations,
prediction-facing public trust surfaces,
symbolic/public language layers,
major lab HUD redesign,
broad PR integration unless directly useful to the demo seam.

The first goal is one legible object, not a full platform expression.

15. Success condition

This demo is successful if an external viewer can understand, within a short glance:

what the object is,
where it came from,
what its current posture is,
why that posture exists,
what it is allowed to mean,
and how to inspect or replay its history.

A successful result should make DME feel like:

public-memory-capable,
provenance-preserving,
contestable,
and inspectable

without requiring the viewer to first understand the full architecture.

16. One-line summary

This demo translates DME’s current lawful strengths into one web-facing consultation object that makes provenance, bounded trust, lifecycle history, and replayability immediately legible to an external audience.