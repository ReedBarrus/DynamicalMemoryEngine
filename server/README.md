# DoorOneApiServer — API Documentation

**Authority class: `tooling`**
**Is authoritative: `false`**

This server is an observational HTTP inspection surface over `DoorOneExecutiveLane`.
It does not mint, modify, or promote artifacts. It is not the substrate.

Every response includes `authority_class: "tooling"` and `is_authoritative: false`.
Every response carries the server-level header `X-DME-Authority-Class: tooling`.

---

## Running the server

```bash
npm run serve
# or
node server/DoorOneApiServer.js
# or with a custom port
PORT=8080 node server/DoorOneApiServer.js
```

Default port: **3141**

---

## Endpoints

### `GET /health`

Liveness check.

```bash
curl http://localhost:3141/health
```

Response:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "door": "one",
  "authority_class": "tooling",
  "is_authoritative": false
}
```

---

### `POST /ingest`

Ingest a raw signal. Delegates to `DoorOneExecutiveLane.ingest()`.
This is the only write operation exposed by this API.

**Body fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `stream_id` | string | yes | Stream identifier |
| `source_id` | string | no | Source device/fixture (default: `"api_ingest"`) |
| `channel` | string | no | Signal channel (default: `"ch0"`) |
| `modality` | string | no | Signal modality e.g. `"voltage"` (default: `"unknown"`) |
| `clock_policy_id` | string | no | Clock policy ID (default: `"clock.api.v1"`) |
| `samples` | number[] | yes* | Raw sample values |
| `sample_rate` | number | yes* | Samples per second; used to derive timestamps |
| `timestamp_ms` | number | no | Wall-clock reference for t=0 (metadata only) |
| `timestamps` | number[] | no | Explicit timestamps in seconds (overrides sample_rate derivation) |

*Either `samples`+`sample_rate` or `timestamps`+`values` must be provided.

```bash
curl -X POST http://localhost:3141/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "stream_id": "test.stream.v1",
    "source_id": "synthetic_fixture_v1",
    "channel": "ch0",
    "modality": "voltage",
    "clock_policy_id": "clock.synthetic.v1",
    "sample_rate": 256,
    "samples": [0.1, 0.3, 0.5, 0.3, 0.1, -0.1, -0.3, -0.5, -0.3, -0.1]
  }'
```

Response:
```json
{
  "authority_class": "tooling",
  "is_authoritative": false,
  "generated_by": "DoorOneApiServer",
  "note": "This response is an observational, non-authoritative read-side surface...",
  "ok": true,
  "run_id": "executive_run_1",
  "summary": {
    "run_count": 1,
    "cross_run_available": false
  },
  "substrate_metrics": {
    "state_count": 0,
    "basin_count": 0,
    "segment_count": 0,
    "trajectory_frames": 0
  }
}
```

Note: Small sample arrays may produce zero states (not enough windows to compress).
Use at least one full window worth of samples (e.g. 256 samples at 256 Hz = 1 second).

---

### `GET /workbench`

Returns the full current workbench state — the read-side integration view assembled
by `DoorOneWorkbench` after the most recent ingest.

Returns `404` if no ingest has been performed.

```bash
curl http://localhost:3141/workbench
```

Response:
```json
{
  "authority_class": "tooling",
  "is_authoritative": false,
  "ok": true,
  "workbench": {
    "workbench_type": "runtime:door_one_workbench",
    "generated_from": "Door One runtime, interpretation, cross-run, readiness, dossier...",
    "scope": { ... },
    "runtime": { ... },
    "interpretation": { ... },
    "cross_run": { ... },
    "promotion_readiness": { ... },
    "canon_candidate": { ... },
    "consensus_review": { ... },
    "notes": [ ... ]
  }
}
```

---

### `GET /session`

Returns the session summary — run count and cross-run comparison availability.

```bash
curl http://localhost:3141/session
```

Response:
```json
{
  "authority_class": "tooling",
  "is_authoritative": false,
  "ok": true,
  "session": {
    "run_count": 3,
    "runs": [ ... ],
    "cross_run_available": true,
    "cross_run_run_count": 3
  }
}
```

---

### `GET /substrate/metrics`

Returns substrate size, basin count, and trajectory length from the most recent run.
Does not re-run any pipeline step.

Returns `404` if no ingest has been performed.

```bash
curl http://localhost:3141/substrate/metrics
```

Response:
```json
{
  "authority_class": "tooling",
  "is_authoritative": false,
  "ok": true,
  "substrate_metrics": {
    "state_count": 12,
    "basin_count": 3,
    "segment_count": 2,
    "trajectory_frames": 24,
    "t_span": { "t_start": 0, "t_end": 9.996, "duration_sec": 9.996 },
    "segment_ids": ["seg_0", "seg_1"]
  }
}
```

---

### `GET /trajectory`

Returns the trajectory summary and segment transition view from the most recent run.
Accepts `?limit=N` query parameter (default: 50) — note that the full frame buffer
is held in-process by `MemorySubstrate`; use `/workbench` for the full interpretation.

Returns `404` if no ingest has been performed.

```bash
curl "http://localhost:3141/trajectory?limit=10"
```

Response:
```json
{
  "authority_class": "tooling",
  "is_authoritative": false,
  "ok": true,
  "limit": 10,
  "trajectory": {
    "summary": { ... },
    "trajectory_frames": 24,
    "t_span": { ... },
    "segment_ids": ["seg_0", "seg_1"],
    "segment_transitions": [ ... ],
    "note": "..."
  }
}
```

---

### `GET /consensus/readiness`

Returns the current `PromotionReadinessReport` from the latest workbench.
Observational only — does not trigger `ConsensusOp` or mint `C1`.

Returns `404` if no ingest has been performed.

```bash
curl http://localhost:3141/consensus/readiness
```

Response:
```json
{
  "authority_class": "tooling",
  "is_authoritative": false,
  "ok": true,
  "promotion_readiness": {
    "report": { ... }
  },
  "note": "PromotionReadinessReport is observational. It does not trigger ConsensusOp..."
}
```

---

### `POST /reset`

Resets the `DoorOneExecutiveLane` session. Clears all run history and cached workbench state.
Does not affect any external canonical memory (none exists in Door One scope).

```bash
curl -X POST http://localhost:3141/reset
```

Response:
```json
{
  "authority_class": "tooling",
  "is_authoritative": false,
  "ok": true,
  "reset": true,
  "timestamp_ms": 1711324800000
}
```

---

## Constitutional boundaries

This API enforces the following boundaries from `README_MasterConstitution.md §5`:

- **Rule 1 — Runtime is not canon.** No endpoint promotes runtime artifacts to canon.
- **Rule 2 — Query is not truth.** All recognition results are labelled non-authoritative.
- **Rule 5 — Consensus is promotion-only.** The `/consensus/readiness` endpoint is read-only observation. It does not invoke ConsensusOp.
- **Rule 7 — Lowest lawful layer.** The server is a tooling-layer surface only.

The server itself is not the substrate. It is not an authority-bearing component.
It delegates all computation to `DoorOneExecutiveLane` and surfaces the results
as observational plain-data JSON.
