README.C1_RoomChangeComparativeConsultationRecord.md
Dynamical Memory Engine — Comparative Room-Change Consultation Record
Status

This document is a Door Two result-interpretation note.

It is not constitutional authority.

It does not override:

README_MasterConstitution.md
README.DoorTwoCanonActivationCriteria.md
README.C1_StatusLifecycle.md
README.C1_ChallengeContestSupersession.md
README.C1_ActivationRuntimeHandoff.md

Its purpose is narrower:

record the comparative outcome of three bounded consultations against the first live C1 object,
preserve the distinction between environmental shift and baseline contamination,
state the resulting review posture clearly,
and support later demo/socialization with one compact evidence note.
1. Consultation target

Live C1 object: C1_BASELINE_SINE400_001

Declared use: same-family baseline comparison

Declared lens: medium FFT/Hann baseline lens only

Family scope: daw_mic_sine_400hz

All consultations in this note remained inside the same bounded consultation seam and preserved the same cross-family negative-control deny path.

2. Comparative cohorts

Three consultation states are compared:

A. Original consultation

The original Packet 1 consultation against the original same-family cohort used at promotion time.

B. Room-change contaminated consultation

A motel-room rerun with same-family structure, but with baseline contamination present during recording.

C. Room-change clean consultation

A motel-room rerun with the same family and same declared lens, but with the baseline recorded cleanly.

3. Comparative outcomes
Cohort	bVsP	bVsR	Return closer to baseline	Challenge pressure	Review judgment
Original	1.237983	0.010871	true	none	keep_promoted
Room-change contaminated	0.856604	0.020502	true	weak	annotate_for_review_only
Room-change clean	1.11536	0.01618	true	none	keep_promoted
4. Key comparative result

The room-change rerun did not by itself break the live C1 anchor.

What changed the review posture was baseline contamination.

Evidence:

the contaminated motel-room rerun reduced bVsP below the active challenge floor and produced weak challenge pressure,
the clean motel-room rerun restored bVsP above the challenge floor and returned the judgment to keep_promoted,
both motel-room runs preserved return convergence (return closer to baseline = true).

This means the current live C1 object is:

robust enough to survive a modest environmental room shift inside the same family,
but sensitive enough to detect subtle baseline contamination as bounded review pressure.
5. Review interpretation

The strongest current interpretation is:

the first live C1 anchor is environment-tolerant within this bounded same-family seam, but contamination-sensitive at baseline.

That is a stronger and more useful result than either of the motel-room reruns alone.

It shows that the consultation seam can distinguish between:

lawful same-family reuse,
subtle baseline degradation,
and preserved return-like convergence.
6. Current review posture

The appropriate current posture remains:

keep the live C1 object as promoted
do not mint a second C1 from the motel-room reruns
preserve the contaminated rerun as a bounded review-pressure example
preserve the clean rerun as evidence that room change alone did not materially break the anchor

No contested or suspended status is justified by the current evidence.

7. Practical significance

This comparative result demonstrates that the system is not merely reproducing one exact recording environment.

Instead, it is showing a more useful property:

same-family structural consultation remains lawful,
modest environmental change is tolerated,
but subtle contamination can still be detected and surfaced honestly.

That is strong evidence for DME as a provenance-preserving structural instrument.

8. Working summary

The first live C1 anchor held across a real room change.

The weak challenge pressure observed in the first motel-room rerun is best explained primarily by baseline contamination, not by room change alone.

The comparative outcome is therefore:

original: keep_promoted
room-change contaminated: annotate_for_review_only
room-change clean: keep_promoted

This is a strong bounded result for early Door Two consultation behavior.

Where the result files should live

For long-term organization, I’d keep them in two places:

Live working outputs

Keep the generated JSON results in:

out_canon/original_uploads/original_uploads_result.json
out_canon/room_change/room_change_result.json
out_canon/room_change_contaminated/room_change_contaminated_result.json

That matches the placement rule that generated outputs should live in generated-output zones, not beside authority objects in canon/.

Archived experimental packet

Copy all three JSON files, plus the comparative README, into your archive/preservation flow as an experiment packet. I’d suggest a folder like:

out_archive/c1_room_change_comparison_v1/

or if you’re using your packet/archive conventions more strictly:

a pinned packet / archive bundle that contains:
the 3 result JSONs
this comparative README
the live C1 JSON reference path only, not a duplicate unless you want snapshot preservation
optionally the two motel-room source folder names and the original source folder reference

That also aligns with the preservation-vs-authority separation in your retention ladder and repo topology: preserved packets are preservation support, not canon themselves.

Small practical recommendation

Also save the terminal logs you pasted into one plain text file in that archive packet. The JSONs are the core artifacts, but the raw console output is nice provenance for demo prep.