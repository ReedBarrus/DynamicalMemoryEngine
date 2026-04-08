# Dynamical Memory Engine - Packet Lineage

## Status

This document defines the first bounded packet-lineage surface for DME workflow routing continuity.

It is a workflow instrument.

It does **not** override:

- `README.MasterConstitution.md`
- `README.WorkflowContract.md`
- `README.RepoPlacementConstitution.md`
- `README/WorkflowMechanization/README.PacketWorkflowChain.md`
- `README/Operational/README.RepoAccountingSurface.md`

Its purpose is narrower:

- record packet routing continuity,
- preserve packet ancestry/follow-on relations,
- track route results and document-touch receipts,
- and support later cleanup packetization without mistaking lineage for present-state inventory.

This note governs **packet lineage and route continuity** only.

It does **not** govern:

- present-state repo placement registry,
- runtime artifact meaning,
- canon status,
- architectural acceptance,
- or full review history by itself.

This is a lineage surface.
It is not a current-state placement registry.
It is not an authority uplift surface.

---

## 1. Purpose

Packet lineage exists to answer a narrow workflow-history question:

**What packet happened, what did it touch, how did it route, and what follow-on work does it point toward?**

This surface should preserve continuity without pretending that every prior packet outcome is fully proven merely because it was discussed.

If a prior packet artifact is missing from the current workspace, that gap should be stated explicitly rather than silently rounded into closure.

---

## 2. Entry Model

Each entry should preserve at minimum:

- `packet_id`
- `task_title`
- `date`
- `parent_packet_id` or `ancestry`
- `route_result`
- `files_created`
- `files_moved`
- `folders_created`
- `docs_updated`
- `supersedes`
- `split_from`
- `merged_into`
- `follow_on_packets`
- `receipts`
- `notes`
- `explicit_non_claims`

This surface may remain compact as long as those continuity fields stay honest.

---

## 3. Update Triggers

Update this surface when:

- a packet begins a new bounded lineage worth tracking,
- a packet closes with a route result,
- a packet creates files or folders,
- a packet materially updates workflow/placement documents,
- a packet splits into follow-on packets,
- a packet supersedes or narrows earlier packet intent,
- or a notable path/reference repair materially changes later routing.

---

## 4. Seed Entries


---

## 5. Use Rule

Use this surface when the question is:

- what packet preceded this one,
- what packet this one follows from,
- what workflow documents it touched,
- what route result it reached,
- and what follow-on packets are suggested.

Do not use this surface when the question is:

- what currently lives in a zone,
- what a file's present status is,
- or whether placement law has already been updated for a future move.

Those belong to present-state accounting or placement law, not packet lineage.

---

## 6. One-Line Summary

This note is the bounded packet-history and route-continuity surface for workflow lineage; it is not the present-state accounting registry and not a substitute for live repo inspection.
