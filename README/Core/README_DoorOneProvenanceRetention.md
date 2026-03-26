Door One live source mode: synthetic

Cycle 1
  run_label: live_run_1
  stream_id: STR:synthetic_live_v1:ch0:voltage:arb:256

  run_health:
    states=23  basins=5  segments=4  skipped=1  merge_failures=1

  structure:
    convergence=insufficient_data
    motion=diffuse
    occupancy=recurrent
    recurrence=medium
    continuity=fragmented
    transition_selectivity=medium

  review:
    readiness=low
    confidence=cautious
    claim=stable_structural_identity
    consensus=defer
    blockers=1
    insufficiencies=2

  delta_vs_prev:
    readiness=n/a
    convergence=n/a
    recurrence=n/a
    consensus=n/a
    cross_run_count=1


Cycle 2
  run_label: live_run_2
  stream_id: STR:synthetic_live_v1:ch0:voltage:arb:256

  run_health:
    states=23  basins=5  segments=4  skipped=1  merge_failures=1

  structure:
    convergence=insufficient_data
    motion=diffuse
    occupancy=recurrent
    recurrence=medium
    continuity=fragmented
    transition_selectivity=medium

  review:
    readiness=medium
    confidence=developing
    claim=stable_structural_identity
    consensus=defer
    blockers=1
    insufficiencies=1

  delta_vs_prev:
    readiness=changed
    convergence=no_change
    recurrence=no_change
    consensus=no_change
    cross_run_count=2


Cycle 3
  run_label: live_run_3
  stream_id: STR:synthetic_live_v2:ch0:voltage:arb:256

  run_health:
    states=23  basins=5  segments=4  skipped=1  merge_failures=1

  structure:
    convergence=insufficient_data
    motion=diffuse
    occupancy=recurrent
    recurrence=medium
    continuity=fragmented
    transition_selectivity=medium

  review:
    readiness=medium
    confidence=developing
    claim=stable_structural_identity
    consensus=defer
    blockers=1
    insufficiencies=1

  delta_vs_prev:
    readiness=no_change
    convergence=no_change
    recurrence=no_change
    consensus=no_change
    cross_run_count=3


Cycle 4
  run_label: live_run_4
  stream_id: STR:synthetic_live_v3:ch0:voltage:arb:256

  run_health:
    states=23  basins=4  segments=4  skipped=1  merge_failures=1

  structure:
    convergence=insufficient_data
    motion=diffuse
    occupancy=recurrent
    recurrence=high
    continuity=fragmented
    transition_selectivity=medium

  review:
    readiness=medium
    confidence=developing
    claim=stable_structural_identity
    consensus=defer
    blockers=1
    insufficiencies=1

  delta_vs_prev:
    readiness=no_change
    convergence=no_change
    recurrence=changed
    consensus=no_change
    cross_run_count=4


Cycle 5
  run_label: live_run_5
  stream_id: STR:synthetic_live_v1:ch0:voltage:arb:256

  run_health:
    states=23  basins=5  segments=4  skipped=1  merge_failures=1

  structure:
    convergence=insufficient_data
    motion=diffuse
    occupancy=recurrent
    recurrence=medium
    continuity=fragmented
    transition_selectivity=medium

  review:
    readiness=medium
    confidence=developing
    claim=stable_structural_identity
    consensus=defer
    blockers=1
    insufficiencies=1

  delta_vs_prev:
    readiness=no_change
    convergence=no_change
    recurrence=changed
    consensus=no_change
    cross_run_count=5

Live outputs written to ./out_live/
  - cycle_01/ ... cycle_05/  (including cycle_summary.json)
  - latest_workbench.json
  - latest_run_result.json
  - latest_cross_run_report.json
  - session_summary.json
PS C:\Users\Admin\OneDrive\Desktop\Dynamical_Project\Dynamical_Memory_Engine\Root> scripts/run_door_one_workbench.js
PS C:\Users\Admin\OneDrive\Desktop\Dynamical_Project\Dynamical_Memory_Engine\Root>

PS C:\Users\Admin\OneDrive\Desktop\Dynamical_Project\Dynamical_Memory_Engine\Root> node scripts/run_door_one_workbench.js

Door One Workbench
  stream_id: STR:synthetic_workbench_v1:ch0:voltage:arb:256
  segments: 5
  cross_run: yes (3)
  readiness: medium
  candidate_claim: stable_structural_identity
  consensus_review: defer

Outputs written to ./out_workbench/
  - orchestrator_result.json
  - workbench.json
  - hud.txt
  - cross_run_report.json
  - promotion_readiness.json
  - canon_candidate_dossier.json
  - consensus_review.json