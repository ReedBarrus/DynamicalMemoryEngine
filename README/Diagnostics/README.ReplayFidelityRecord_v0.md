Replay fidelity record v0

This should be emitted on every replay/reconstruction result surface, because the invariance note already says a future reconstruction pipeline should emit at minimum: declared lens, retained tier, support basis, reconstruction trace, latency posture, fidelity posture, reconstruction summary, explicit non-claims, and threshold outcome or downgrade posture.

Proposed shape:

{
  "bounded_question": "",
  "reconstruction_class": "",
  "declared_lens": "",
  "retained_tier": "",
  "support_basis": [],
  "reconstruction_trace": [],
  "mechanization_status": "",
  "fidelity_posture": "",
  "threshold_outcome": "",
  "downgrade_posture": "",
  "latency_posture": "",
  "reconstruction_summary": "",
  "explicit_non_claims": [],
  "failure_posture": ""
}
Field meanings

bounded_question
The exact replay question being answered. Deterministic invariance is only evaluable relative to a bounded question.

reconstruction_class
Use the invariance note’s three reconstruction classes:

support_trace_reconstruction
derived_structural_reminting
source_adjacent_reconstitution

For current DME, only the first is required and active by default; source-adjacent reconstitution is deferred.

declared_lens
The active replay lens. Replay is lens-bound and should never imply stronger continuity than the declared lens justifies.

retained_tier
Which retention tier is being used. The retained-tier sufficiency test is first-class, and a higher tier is not automatically “the same thing, only smaller.”

support_basis
Compact lineage/support descriptors. This is what keeps replay support auditable instead of merely persuasive. The replay surface is already expected to expose support basis extraction.

reconstruction_trace
What lineage path and reconstruction steps were actually used.

mechanization_status
One of:

mechanized
partially_mechanized
failed

That keeps replay truth tied to actual backend reachability instead of shaped surface comfort. The current audit still classifies replay and reconstruction as partially mechanized overall.

fidelity_posture
One of:

high
bounded
weak
insufficient

This is not a universal truth score. It is a bounded posture relative to the active question, lens, and tier. That matches the invariance note’s local-first, tier-honest approach.

threshold_outcome
One of:

conserved
narrowed
support_degraded
retained_tier_insufficient
reconstruction_not_justified
unresolved

These come directly from the downgrade/output vocabulary in the invariance note.

downgrade_posture
Short explanation of what weaker claim is still lawful.

latency_posture
Compact statement of reconstruction cost/timing at the current scale. The invariance note explicitly calls for latency posture declaration.

reconstruction_summary
Human-readable compact summary of what was reconstructed.

explicit_non_claims
At minimum, current replay surfaces must stay below raw restoration, truth, canon, and promotion.

failure_posture
If failed, say so plainly instead of emitting something replay-like. That aligns with both invariance and declared-vs-mechanized anti-overclaim posture.

Per-tier success thresholding for current scope

I’d keep this strict and asymmetrical.

Tier 0 — live/runtime replay support

Target outcome: real support-trace reconstruction

Success threshold:

backend reached
declared lens preserved
retained tier declared
support basis present
reconstruction trace present
explicit non-claims present
threshold outcome is not inflated
failure does not degrade decoratively

Expected fidelity posture:

high or bounded

Allowed reconstruction class:

support_trace_reconstruction

Not claimed:

raw restoration
source equivalence

This is the strongest active target because the replay surface already claims reconstruction-backed fields and should be judged there.

Tier 1 — durable receipts

Target outcome: receipt-backed lineage replay

Success threshold:

all Tier 0 lineage fields recoverable where relevant
receipt references survive
same bounded replay/provenance question still answerable
downgrade occurs explicitly if full replay continuity is no longer justified

Expected fidelity posture:

bounded by default
high only when the bounded question is genuinely still answerable at this tier

Allowed reconstruction class:

support_trace_reconstruction
possibly later derived_structural_reminting, but not required in Packet A

This tier is still a real reconstruction target in Packet A. Receipts are the minimum durable replay-honest lineage surface.

Tier 2 — digest

Target outcome: derived replay convenience with explicit downgrade discipline

Success threshold:

digest can identify relevant support lineage
digest never outranks receipts
if the bounded question exceeds digest support, threshold outcome must be support_degraded, retained_tier_insufficient, or unresolved

Expected fidelity posture:

weak or bounded
never silently treated as equivalent to receipts

Allowed reconstruction class:

support_trace_reconstruction only in a narrowed sense
no source-like implication

Packet A should test honesty here, not strong replay maturity. The invariance note explicitly warns that digest convenience must not overwrite receipt-grounded distinctions.

Tier 3 — pinned packet

Target outcome: review-ready bounded replay/support object

Success threshold:

packet can expose declared lens, retained tier, support basis, reconstruction summary, and non-claims
packet can justify only the bounded review/support question it carries
stronger continuity must downgrade explicitly if absent

Expected fidelity posture:

bounded or weak, question-relative

Allowed reconstruction class:

derived_structural_reminting may become lawful here later
but Packet A only needs honest support/review replay posture
Tier 4 — archive bundle

Target outcome: preserved historical support bundle with honest replay limits

Success threshold:

archive can recover bounded lineage/support path
archive never implies immediate high-fidelity replay merely because it is preserved
insufficiency is explicit when lower-tier support would be required

Expected fidelity posture:

weak or insufficient unless proven otherwise for a narrow question

Allowed reconstruction class:

support-trace only for Packet A

So for current context, only Tier 0 and Tier 1 need full active success-path testing in Packet A. Tiers 2–4 need explicit thresholding, downgrade posture, and refusal behavior, but not full-maturity reconstruction claims yet. That matches the current partial-mechanization posture and prevents composed surfaces from outrunning backend truth.

Threshold decision rule v0

For any replay request, apply these in order:

Mechanization test
Did real backend reconstruction occur? If no: failed or partially_mechanized.
Local invariance test
Is the same bounded identity still preserved under same lens and tier?
Compression survival test
Did the required lineage/invariants survive at this tier?
Retained-tier sufficiency test
Is this tier actually strong enough for the question being asked?
Distortion threshold test
Would preserving the stronger replay claim now mislead later interpretation?

Then emit one of:

conserved
narrowed
support_degraded
retained_tier_insufficient
reconstruction_not_justified
unresolved
What “proper reconstruction” means right now

For current DME, proper reconstruction does not mean perfect remake. It means:

support-trace lineage was actually reconstructed,
the same bounded question remains answerable,
the replay stays lens-bound and tier-honest,
fidelity posture is declared,
downgrade/failure is explicit when support weakens,
and no stronger identity claim is made than the seam justifies