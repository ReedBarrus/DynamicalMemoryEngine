import { DoorOneOrchestrator } from "./DoorOneOrchestrator.js";
import { DoorOneHUD } from "../hud/DoorOneHUD.js";
import { makeTestSignal } from "../fixtures/test_signal.js";

const POLICIES = {
    // paste the same policy block used in test_door_one_orchestrator.js
};

const { signal } = makeTestSignal({
    durationSec: 4,
    fs: 8,
    seed: 7,
    noiseStd: 0.01,
    source_id: "manual.hud",
    channel: "ch0",
    modality: "voltage",
    units: "arb",
});

const raw = {
    timestamps: signal.timestamps,
    values: signal.values,
    stream_id: signal.stream_id,
    source_id: signal.source_id,
    channel: signal.channel,
    modality: signal.modality,
    meta: signal.meta,
    clock_policy_id: POLICIES.clock_policy_id,
};

const query_spec = {
    query_id: "q.manual",
    kind: "energy_trend",
    mode: "ENERGY",
    scope: { allow_cross_segment: true },
};

const query_policy = {
    policy_id: "qp.manual",
    scoring: "energy_delta",
    normalization: "none",
    topK: 5,
};

const orch = new DoorOneOrchestrator({ policies: POLICIES });
const result = orch.runBatch(raw, { query_spec, query_policy });

const hud = new DoorOneHUD();
console.log(hud.render(result, { mode: "batch", run_label: "manual-run" }));