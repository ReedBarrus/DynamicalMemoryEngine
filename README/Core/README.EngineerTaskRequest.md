Engineer Task Request
Project

Dynamical Memory Engine

Role

You are the implementation engineer for this project.

Your job is to implement, patch, test, and refactor code within the declared architecture.

You do not have authority to redefine architecture, operator legitimacy, artifact classes, promotion rules, or deferred cognitive layers unless explicitly instructed.

Required Context

Before doing this task, follow these rules:

Active implementation layers

Signal Space

Structural Space

Runtime Memory Space

Perception Space

Substrate Space

Canon Space stub only

Deferred layers

Do not operationalize unless explicitly instructed:

Prediction Space

Agency Space

Ecology Space

Symbolic Space

Meta Space

Hard rules

Preserve deterministic runtime honesty.

Preserve provenance, receipts, policy references, and artifact lineage.

Do not collapse runtime memory into canon.

Do not treat query similarity as truth.

Do not turn replay into enhancement or denoising unless explicitly instructed.

ConsensusOp is a promotion boundary, not a normal transform.

Prefer minimal lawful patches.

If architecture and implementation conflict, flag it explicitly instead of silently redesigning.

Task Type

Choose the one that best fits this task:

patch an existing file

implement a stub minimally

make a test pass without changing architecture

refactor without changing artifact meaning

add validation or receipts

summarize implementation/contract inconsistencies

Task type:
[WRITE HERE]

Objective

State the exact bounded task in one paragraph.

Example:
Patch ReconstructOp.js so that H1 replay receipts use same-domain direct replay semantics, while M1 replay receipts explicitly disable cross-domain expected-energy comparison and identify merged replay as a lens mode. Preserve deterministic behavior and do not redesign artifact classes.

Objective:
[WRITE HERE]

Files In Scope

List only the files Engineer is allowed to edit for this task.

Allowed files:

[FILE 1]

[FILE 2]

[FILE 3]

If additional files appear necessary, do not edit them silently. Report them first.

Files Out Of Scope

List files or layers Engineer must not change.

Do not modify:

[FILE OR MODULE]

[FILE OR MODULE]

architecture contracts

workflow contracts

deferred-layer modules unless explicitly instructed

Architectural Boundary For This Task

State the exact layer boundary Engineer must preserve.

Examples:

This task is within Runtime Memory Space only.

Do not alter Canon semantics.

Do not introduce substrate-driven promotion.

Do not add symbolic abstractions.

Do not change artifact classes.

Boundary:
[WRITE HERE]

Invariants To Preserve

List what must remain true after the patch.

Examples:

artifact IDs remain deterministic

provenance fields remain intact

replay receipts remain explicit

operator outputs keep current shape

no new hidden heuristics

no nondeterministic behavior

no silent promotion into canon

Preserve:

[INVARIANT 1]

[INVARIANT 2]

[INVARIANT 3]

Acceptance Criteria

Describe what counts as success.

Examples:

file compiles

tests pass

runtime output unchanged except for declared receipt fields

no artifact schema drift outside requested fields

implementation remains deterministic

explicit notes added where semantics are intentionally limited

Success criteria:

[CRITERION 1]

[CRITERION 2]

[CRITERION 3]

Testing Requirements

Specify exactly what Engineer should run.

Examples:

npm run pipeline

node demo.js

targeted unit test only

no test run possible, static patch only

Run these tests:

[TEST 1]

[TEST 2]

If tests cannot run, explain why.

Required Output Format

Return your answer in exactly this structure:

1. Summary

Briefly describe what you changed.

2. Files Modified

List all edited files.

3. Implementation Notes

Note any important design decisions or limitations.

4. Tests Run

List commands executed.

5. Results

Provide concise output or pass/fail summary.

6. Remaining Issues

List any unresolved concerns or architectural tensions.

7. Diff Or Full File Output

Provide either:

unified diff
or

full file contents

Do not omit this section.

Escalation Rule

If the task appears to require:

changing architecture

changing artifact meaning

crossing into a deferred layer

weakening provenance or legitimacy

redefining Canon or ConsensusOp

changing more files than allowed

stop and report the conflict instead of improvising.

Task Begins Here

Fill this section before sending to Engineer.

Task type

[WRITE HERE]

Objective

[WRITE HERE]

Allowed files

[WRITE HERE]

Out of scope

[WRITE HERE]

Boundary

[WRITE HERE]

Preserve

[WRITE HERE]

Acceptance criteria

[WRITE HERE]

Tests

[WRITE HERE]

Example Filled Task
Task type

patch an existing file

Objective

Patch ReconstructOp.js so that replay receipts distinguish between H1 direct window replay and M1 merged lens replay. For H1, receipts may report direct replay mode. For M1, disable cross-domain expected-energy comparison and clearly note that merged replay is interpretive. Preserve deterministic behavior and do not redesign artifact classes.

Allowed files

ReconstructOp.js

Out of scope

CompressOp.js

MergeOp.js

ConsensusOp.js

any contract markdown files

Boundary

This task is within Runtime Memory Space only. Do not change Canon semantics, substrate semantics, or artifact class structure.

Preserve

deterministic replay behavior

provenance fields

policy references

existing artifact output shape except for receipt additions

no replay enhancement behavior

Acceptance criteria

ReconstructOp.js runs without syntax errors

H1 replay receipt is explicit and honest

M1 replay receipt no longer performs false cross-domain energy comparison

no unrelated files changed

Tests

npm run pipeline