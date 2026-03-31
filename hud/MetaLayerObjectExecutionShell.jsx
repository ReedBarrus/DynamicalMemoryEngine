// hud/MetaLayerObjectExecutionShell.jsx
//
// Meta-Layer Object Execution Shell v0
//
// Constitutional posture:
//   - Execution surface only — triggers lawful runs, does NOT define runtime meaning
//   - Calls DoorOneOrchestrator directly (pure-JS, browser-compatible operator chain)
//   - Display is read-side only — results are inspection surfaces, not authority
//   - Unsupported source families are explicitly labeled, not faked
//   - Consultation and activation actions are visibly fenced stubs
//   - Keeps lab HUD (DoorOneStructuralMemoryHud) and public demo (MetaLayerConsultationDemo) separate
//
// Wired source families (v0):
//   - Synthetic Signal (fully wired — uses makeTestSignal → DoorOneOrchestrator)
//
// Planned / not yet wired (v0):
//   - Smart Tag / Annotation Lifecycle
//   - Presence Signal Trajectory
//   - Derived Trace / LLM Runtime Metrics
//   - Audio / Real Source Family (WAV adapter needed)
//
// Shell regions:
//   A. Control / Orchestration  — source selector, params, run button
//   B. Run Status               — idle / running / complete / error + run id
//   C. Inspection / Results     — provenance → evidence → interpretation → review
//   D. Request Surface          — consultation + activation fences (stubs)

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { makeTestSignal } from "../fixtures/test_signal.js";
import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { CrossRunSession } from "../runtime/CrossRunSession.js";
import { DoorOneWorkbench } from "../runtime/DoorOneWorkbench.js";

// ─── Policies (mirrors run_door_one_workbench.js) ─────────────────────────────
const POLICIES = {
    clock_policy_id: "clock.synthetic.v1",
    ingest_policy: {
        policy_id: "ingest.synthetic.v1",
        gap_threshold_multiplier: 3.0,
        allow_non_monotonic: false,
        allow_empty: false,
        non_monotonic_mode: "reject",
    },
    grid_spec: {
        Fs_target: 256, t_ref: 0, grid_policy: "strict",
        drift_model: "none", non_monotonic_policy: "reject",
        interp_method: "linear", gap_policy: "interpolate_small",
        small_gap_multiplier: 3.0, max_gap_seconds: null, anti_alias_filter: false,
    },
    window_spec: {
        mode: "fixed", Fs_target: 256, base_window_N: 256, hop_N: 128,
        window_function: "hann", overlap_ratio: 0.5,
        stationarity_policy: "tolerant", salience_policy: "off",
        gap_policy: "interpolate_small", max_missing_ratio: 0.25, boundary_policy: "pad",
    },
    transform_policy: {
        policy_id: "transform.synthetic.v1", transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum", numeric_policy: "tolerant",
    },
    compression_policy: {
        policy_id: "compress.synthetic.v1", selection_method: "topK",
        budget_K: 8, maxK: 8, include_dc: true, invariance_lens: "identity",
        numeric_policy: "tolerant", respect_novelty_boundary: true,
        thresholds: { max_recon_rmse: 0.25, max_energy_residual: 0.25, max_band_divergence: 0.30 },
    },
    anomaly_policy: {
        policy_id: "anomaly.synthetic.v1", invariance_mode: "band_profile",
        divergence_metric: "band_l1", threshold_value: 0.15,
        frequency_tolerance_hz: 1.0, phase_sensitivity_mode: "strict",
        novelty_min_duration: 0, segmentation_mode: "strict",
        dominant_bin_threshold: 0.2, new_frequency_threshold: 0.15,
        vanished_frequency_threshold: 0.15, energy_shift_threshold: 0.15,
    },
    merge_policy: {
        policy_id: "merge.synthetic.v1", adjacency_rule: "time_touching",
        phase_alignment_mode: "clock_delta_rotation", weights_mode: "duration",
        novelty_gate: "strict", merge_mode: "authoritative", grid_tolerance: 0,
    },
    post_merge_compression_policy: {
        policy_id: "merge.compress.synthetic.v1", selection_method: "topK",
        budget_K: 8, maxK: 8, include_dc: true, invariance_lens: "identity",
        numeric_policy: "tolerant", respect_novelty_boundary: true,
        thresholds: { max_recon_rmse: 0.25, max_energy_residual: 0.25, max_band_divergence: 0.30 },
    },
    reconstruct_policy: {
        policy_id: "reconstruct.synthetic.v1", normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum",
    },
    query_policy: { policy_id: "query.synthetic.v1", query_mode: "similarity", top_k: 3 },
    basin_policy: {
        policy_id: "basin.synthetic.v1", method: "adaptive_threshold",
        max_basins: 8, min_basin_size: 2, merge_threshold: 0.12, entry_threshold: 0.15,
    },
};
const QUERY_SPEC = {
    type: "similarity",
    reference_window_index: 0,
    top_k: 3,
    metric: "cosine",
};
const QUERY_POLICY = {
    policy_id: "query.synthetic.v1",
    query_mode: "similarity",
    top_k: 3,
};

// ─── Source family catalog ─────────────────────────────────────────────────────
const SOURCE_FAMILIES = [
    {
        id:          "synthetic_signal",
        label:       "Synthetic Signal",
        description: "Deterministic multi-segment signal with novelty, frequency shift, dropout, and burst-return phases.",
        wired:       true,
        badge:       "wired",
    },
    {
        id:          "smart_tag_lifecycle",
        label:       "Smart Tag / Annotation Lifecycle",
        description: "Creation event + evolution over time (edits, replies, interactions). Structural trajectory + provenance receipt.",
        wired:       false,
        badge:       "planned",
    },
    {
        id:          "presence_signal",
        label:       "Presence Signal Trajectory",
        description: "On-page presence updates or interaction stream. Detects subtle baseline degradation while tolerating normal environmental shift.",
        wired:       false,
        badge:       "planned",
    },
    {
        id:          "derived_trace",
        label:       "Derived Trace / LLM Runtime Metrics",
        description: "Token-rate, tool-call cadence, latency, or embedding-displacement traces.",
        wired:       false,
        badge:       "planned",
    },
    {
        id:          "audio_real_source",
        label:       "Audio / Real Source Family",
        description: "WAV file ingest through existing real-source adapter. daw_mic_sine_400hz and daw_mic_input families.",
        wired:       false,
        badge:       "planned — WAV adapter needed",
    },
];

// ─── Synthetic signal parameter presets ──────────────────────────────────────
const SIGNAL_PRESETS = [
    { label: "Standard (seed=42, 10s)",      seed: 42,  durationSec: 10, noiseStd: 0.03 },
    { label: "High noise (seed=42, 10s)",     seed: 42,  durationSec: 10, noiseStd: 0.12 },
    { label: "Perturbation variant (seed=99)",seed: 99,  durationSec: 10, noiseStd: 0.03 },
    { label: "Return variant (seed=7)",       seed: 7,   durationSec: 10, noiseStd: 0.03 },
];

// ─── Runtime runner ───────────────────────────────────────────────────────────
function runSyntheticPipeline(params) {
    const { seed, durationSec, noiseStd, runLabel } = params;
    const { signal } = makeTestSignal({ seed, durationSec, noiseStd, source_id: `synthetic.seed${seed}` });
    const raw = {
        timestamps: signal.timestamps,
        values:     signal.values,
        stream_id:  signal.stream_id ?? `stream.${runLabel}`,
        source_id:  signal.source_id,
        channel:    signal.channel,
        modality:   signal.modality,
        meta:       signal.meta,
        clock_policy_id: POLICIES.clock_policy_id,
    };
    const orch = new DoorOneOrchestrator({
        policies: POLICIES,
        substrate_id: `shell.substrate.${runLabel}`,
    });
    const result = orch.runBatch(raw, { query_spec: QUERY_SPEC, query_policy: QUERY_POLICY });
    result.run_label = runLabel;
    return result;
}

function buildWorkbench(runResult, crossRunSession) {
    const wb = new DoorOneWorkbench({
        runResult,
        crossRunSession,
        policies: POLICIES,
    });
    return wb.assemble();
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
    bg:          "#0e1117",
    surface:     "#161b27",
    surfaceHigh: "#1c2333",
    rule:        "#1f2d45",
    ruleLight:   "#263449",
    amber:       "#f59e0b",
    amberDim:    "#92610a",
    amberFaint:  "#2a1e06",
    green:       "#22c55e",
    greenFaint:  "#052e16",
    blue:        "#3b82f6",
    blueFaint:   "#0c1a3a",
    red:         "#ef4444",
    redFaint:    "#1f0707",
    yellow:      "#eab308",
    text:        "#e2e8f0",
    textMid:     "#94a3b8",
    textDim:     "#475569",
    textMono:    "#a8c1e0",
    mono:        "'IBM Plex Mono', 'Cascadia Code', monospace",
    sans:        "'DM Sans', 'Inter', system-ui, sans-serif",
    serif:       "'Crimson Pro', Georgia, serif",
};

// ─── Micro primitives ─────────────────────────────────────────────────────────
const Rule = ({ style }) => <div style={{ height: 1, background: C.rule, ...style }} />;

const Mono = ({ children, style }) =>
    <span style={{ fontFamily: C.mono, color: C.textMono, fontSize: 12, ...style }}>{children}</span>;

const Label = ({ children, style }) => (
    <div style={{
        fontFamily: C.mono, fontSize: 10, textTransform: "uppercase",
        letterSpacing: "0.12em", color: C.textDim, ...style,
    }}>{children}</div>
);

const StatusBadge = ({ status }) => {
    const map = {
        idle:     { color: C.textDim,  bg: C.surface,     label: "idle" },
        running:  { color: C.amber,    bg: C.amberFaint,  label: "running…" },
        complete: { color: C.green,    bg: C.greenFaint,  label: "complete" },
        error:    { color: C.red,      bg: C.redFaint,    label: "error" },
    };
    const s = map[status] ?? map.idle;
    return (
        <span style={{
            padding: "3px 10px", borderRadius: 4,
            background: s.bg, color: s.color,
            fontFamily: C.mono, fontSize: 11, letterSpacing: "0.06em",
        }}>{s.label}</span>
    );
};

const FenceButton = ({ children, onClick, style }) => (
    <button
        onClick={onClick}
        style={{
            padding: "8px 16px", borderRadius: 6,
            border: `1px solid ${C.ruleLight}`, background: C.surface,
            color: C.textMid, fontFamily: C.mono, fontSize: 12,
            cursor: "pointer", letterSpacing: "0.04em",
            opacity: 0.7,
            ...style,
        }}
    >{children}</button>
);

// ─── Region A: Control / Orchestration ───────────────────────────────────────
function ControlRegion({ selectedFamily, onSelectFamily, preset, onSelectPreset, onRun, runStatus }) {
    const family = SOURCE_FAMILIES.find(f => f.id === selectedFamily);
    const isWired = family?.wired ?? false;
    const running = runStatus === "running";

    return (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.rule}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.amber, boxShadow: `0 0 8px ${C.amber}` }} />
                <Label style={{ color: C.amber, letterSpacing: "0.16em" }}>A — Control / Orchestration</Label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
                {/* Source family */}
                <div>
                    <Label style={{ marginBottom: 6 }}>source family</Label>
                    <select
                        value={selectedFamily}
                        onChange={e => onSelectFamily(e.target.value)}
                        style={{
                            width: "100%", padding: "8px 10px", borderRadius: 6,
                            border: `1px solid ${C.ruleLight}`, background: C.surfaceHigh,
                            color: C.text, fontFamily: C.mono, fontSize: 12, outline: "none",
                        }}
                    >
                        {SOURCE_FAMILIES.map(f => (
                            <option key={f.id} value={f.id}>
                                {f.label}{f.wired ? "" : " [planned]"}
                            </option>
                        ))}
                    </select>
                    {!isWired && (
                        <div style={{ marginTop: 5, fontFamily: C.mono, fontSize: 10, color: C.amberDim }}>
                            ⚠ not yet wired · {family?.badge}
                        </div>
                    )}
                </div>

                {/* Signal preset (only for synthetic) */}
                <div>
                    <Label style={{ marginBottom: 6 }}>
                        {isWired ? "signal preset" : "object / input"}
                    </Label>
                    {isWired ? (
                        <select
                            value={preset}
                            onChange={e => onSelectPreset(Number(e.target.value))}
                            style={{
                                width: "100%", padding: "8px 10px", borderRadius: 6,
                                border: `1px solid ${C.ruleLight}`, background: C.surfaceHigh,
                                color: C.text, fontFamily: C.mono, fontSize: 12, outline: "none",
                            }}
                        >
                            {SIGNAL_PRESETS.map((p, i) => (
                                <option key={i} value={i}>{p.label}</option>
                            ))}
                        </select>
                    ) : (
                        <div style={{
                            padding: "8px 10px", borderRadius: 6,
                            border: `1px dashed ${C.rule}`, background: C.surface,
                            color: C.textDim, fontFamily: C.mono, fontSize: 11,
                        }}>
                            adapter required
                        </div>
                    )}
                </div>

                {/* Run button */}
                <button
                    onClick={isWired ? onRun : undefined}
                    disabled={!isWired || running}
                    style={{
                        padding: "9px 22px", borderRadius: 6,
                        border: `1px solid ${isWired && !running ? C.amber : C.rule}`,
                        background: isWired && !running ? C.amberFaint : C.surface,
                        color: isWired && !running ? C.amber : C.textDim,
                        fontFamily: C.mono, fontSize: 12, fontWeight: 600,
                        cursor: isWired && !running ? "pointer" : "not-allowed",
                        letterSpacing: "0.08em",
                        transition: "all 0.15s",
                    }}
                >
                    {running ? "running…" : "▶  run"}
                </button>
            </div>

            {/* Declared path note */}
            {isWired && (
                <div style={{ marginTop: 10, fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                    path: makeTestSignal → DoorOneOrchestrator → CrossRunSession → DoorOneWorkbench
                </div>
            )}
        </div>
    );
}

// ─── Region B: Run Status ─────────────────────────────────────────────────────
function StatusRegion({ runStatus, runId, runCount, seam }) {
    return (
        <div style={{
            padding: "10px 20px",
            borderBottom: `1px solid ${C.rule}`,
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
            <Label style={{ color: C.textDim, letterSpacing: "0.16em" }}>B — Run Status</Label>
            <StatusBadge status={runStatus} />
            {runId && <Mono style={{ fontSize: 11, color: C.textDim }}>run: {runId}</Mono>}
            {runCount > 0 && <Mono style={{ fontSize: 11, color: C.textDim }}>total runs: {runCount}</Mono>}
            {seam && <Mono style={{ fontSize: 11, color: C.textDim }}>seam: {seam}</Mono>}
        </div>
    );
}

// ─── Region C: Inspection / Results ──────────────────────────────────────────
function ResultsRegion({ workbench, runResult }) {
    const [openSection, setOpenSection] = useState("provenance");
    if (!workbench) {
        return (
            <div style={{ padding: "24px 20px", borderBottom: `1px solid ${C.rule}` }}>
                <Label style={{ color: C.textDim, letterSpacing: "0.16em", marginBottom: 12 }}>C — Inspection / Results</Label>
                <div style={{
                    padding: "16px", borderRadius: 6,
                    border: `1px dashed ${C.rule}`, background: C.surface,
                    color: C.textDim, fontFamily: C.mono, fontSize: 12, textAlign: "center",
                }}>
                    no results yet · select a source family and run
                </div>
            </div>
        );
    }

    const scope     = workbench?.scope ?? {};
    const evidence  = workbench?.runtime_evidence ?? {};
    const readiness = workbench?.promotion_readiness?.report ?? {};
    const dossier   = workbench?.canon_candidate?.dossier ?? {};
    const consensus = workbench?.consensus_review?.review ?? {};

    const planes = [
        { id: "provenance",     label: "1 — Provenance" },
        { id: "evidence",       label: "2 — Runtime Evidence" },
        { id: "interpretation", label: "3 — Interpretation" },
        { id: "review",         label: "4 — Review / Request" },
    ];

    return (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.rule}` }}>
            <Label style={{ color: C.textDim, letterSpacing: "0.16em", marginBottom: 14 }}>C — Inspection / Results</Label>

            {/* Plane tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
                {planes.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setOpenSection(p.id)}
                        style={{
                            padding: "5px 12px", borderRadius: 4,
                            border: `1px solid ${openSection === p.id ? C.blue : C.rule}`,
                            background: openSection === p.id ? C.blueFaint : C.surface,
                            color: openSection === p.id ? C.blue : C.textDim,
                            fontFamily: C.mono, fontSize: 11, cursor: "pointer",
                        }}
                    >{p.label}</button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={openSection}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Plane 1: Provenance */}
                    {openSection === "provenance" && (
                        <PlaneGrid rows={[
                            ["stream_id",     scope?.stream_id ?? "—"],
                            ["run_label",     runResult?.run_label ?? "—"],
                            ["source_id",     runResult?.ingest?.artifact?.source_id ?? "—"],
                            ["segment_count", String((scope?.segment_ids ?? []).length)],
                            ["cross_run",     scope?.cross_run_context?.available
                                ? `yes · runs: ${scope.cross_run_context.run_count}`
                                : "no"],
                            ["ingest_ok",     String(runResult?.ingest?.ok ?? "—")],
                        ]} />
                    )}

                    {/* Plane 2: Runtime Evidence */}
                    {openSection === "evidence" && (
                        <div>
                            <PlaneGrid rows={[
                                ["anomaly_count",    String(evidence?.anomaly_count ?? 0)],
                                ["harmonic_states",  String(evidence?.harmonic_state_count ?? 0)],
                                ["merged_states",    String(evidence?.merged_state_count ?? 0)],
                                ["query_results",    String(evidence?.query_result_count ?? 0)],
                                ["overall_readiness",readiness?.readiness_summary?.overall_readiness ?? "—"],
                                ["candidate_claim",  dossier?.candidate_claim?.claim_type ?? "—"],
                            ]} />
                            {/* Anomaly events */}
                            {(runResult?.anomalies ?? []).length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                    <Label style={{ marginBottom: 6 }}>anomaly events</Label>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                        {(runResult.anomalies ?? []).slice(0, 5).map((a, i) => (
                                            <div key={i} style={{ fontFamily: C.mono, fontSize: 11, color: C.textMono }}>
                                                t={a?.time_start?.toFixed(2) ?? "?"}s — {a?.anomaly_type ?? "anomaly"}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Plane 3: Interpretation */}
                    {openSection === "interpretation" && (
                        <div>
                            <div style={{
                                padding: "12px 14px", borderRadius: 6,
                                border: `1px solid ${C.ruleLight}`, background: C.surfaceHigh,
                                marginBottom: 12,
                            }}>
                                <div style={{ fontFamily: C.serif, fontSize: 14, lineHeight: 1.6, color: C.text, marginBottom: 8 }}>
                                    {readiness?.readiness_summary?.overall_readiness === "insufficient"
                                        ? "Current evidence is insufficient for promotion. Runtime memory is structured and lawful. Further cross-run evidence is needed before canon review."
                                        : readiness?.readiness_summary?.overall_readiness === "deferred"
                                        ? "Deferred. The run produced structural evidence but additional review conditions must be met before activation."
                                        : "Structural evidence is present. Readiness posture and candidate dossier are available for review."}
                                </div>
                                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim, borderTop: `1px solid ${C.rule}`, paddingTop: 8 }}>
                                    derived · bounded · read-side only · not authority
                                </div>
                            </div>
                            <PlaneGrid rows={[
                                ["consensus_result",  consensus?.result ?? "not_run"],
                                ["readiness_summary", readiness?.readiness_summary?.overall_readiness ?? "—"],
                                ["claim_type",        dossier?.candidate_claim?.claim_type ?? "—"],
                                ["blockers",          String(dossier?.review_posture?.insufficiency_count ?? 0)],
                            ]} />
                        </div>
                    )}

                    {/* Plane 4: Review / Request */}
                    {openSection === "review" && (
                        <div>
                            <PlaneGrid rows={[
                                ["current_status",   "below_canon · runtime_only"],
                                ["promotion_status", readiness?.readiness_summary?.overall_readiness ?? "—"],
                                ["consensus_review", consensus?.result ?? "not_run"],
                                ["canon_candidate",  dossier?.candidate_claim?.claim_type ?? "—"],
                            ]} />
                            <div style={{
                                marginTop: 14, padding: "10px 12px", borderRadius: 6,
                                border: `1px solid ${C.amberDim}`, background: C.amberFaint,
                                fontFamily: C.mono, fontSize: 10, color: C.amberDim,
                            }}>
                                review / request actions below are explicit fences — not automatic promotions
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function PlaneGrid({ rows }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map(([k, v]) => (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 12 }}>
                    <Label style={{ paddingTop: 1 }}>{k}</Label>
                    <Mono style={{ lineHeight: 1.5 }}>{v}</Mono>
                </div>
            ))}
        </div>
    );
}

// ─── Region D: Request Surface ────────────────────────────────────────────────
function RequestRegion({ hasResult, onConsult, onActivation }) {
    return (
        <div style={{ padding: "16px 20px" }}>
            <Label style={{ color: C.textDim, letterSpacing: "0.16em", marginBottom: 14 }}>
                D — Request Surface
                <span style={{ marginLeft: 8, color: C.amberDim, fontWeight: 400 }}>
                    (explicit requests only · not automatic)
                </span>
            </Label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <FenceButton
                    onClick={hasResult ? onConsult : undefined}
                    style={{ opacity: hasResult ? 0.8 : 0.35, cursor: hasResult ? "pointer" : "not-allowed" }}
                >
                    ↗ request consultation
                </FenceButton>
                <FenceButton
                    onClick={hasResult ? onActivation : undefined}
                    style={{ opacity: hasResult ? 0.8 : 0.35, cursor: hasResult ? "pointer" : "not-allowed" }}
                >
                    ↗ request activation / review
                </FenceButton>
            </div>
            <div style={{ marginTop: 10, fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                consultation and activation requests are fenced stubs in v0 ·
                they will invoke the bounded consultation seam and canon handoff when wired
            </div>
        </div>
    );
}

// ─── Main shell component ─────────────────────────────────────────────────────
export default function MetaLayerObjectExecutionShell() {
    const [selectedFamily, setSelectedFamily] = useState("synthetic_signal");
    const [presetIdx,  setPresetIdx]  = useState(0);
    const [runStatus,  setRunStatus]  = useState("idle");
    const [runError,   setRunError]   = useState(null);
    const [runResult,  setRunResult]  = useState(null);
    const [workbench,  setWorkbench]  = useState(null);
    const [runId,      setRunId]      = useState(null);
    const [runCount,   setRunCount]   = useState(0);
    const [requestLog, setRequestLog] = useState([]);
    const sessionRef = useRef(null);

    const handleRun = useCallback(() => {
        const preset = SIGNAL_PRESETS[presetIdx];
        const id = `shell.run.${Date.now()}`;
        setRunStatus("running");
        setRunError(null);
        setRunId(id);

        // setTimeout(0) yields to the browser render before the synchronous pipeline run
        setTimeout(() => {
            try {
                const result = runSyntheticPipeline({
                    seed:        preset.seed,
                    durationSec: preset.durationSec,
                    noiseStd:    preset.noiseStd,
                    runLabel:    id,
                });
                if (!result?.ok) throw new Error(result?.error ?? "orchestrator returned ok=false");

                // Accumulate cross-run session
                if (!sessionRef.current) {
                    sessionRef.current = new CrossRunSession({ policies: POLICIES });
                }
                sessionRef.current.addRun(result);

                const wb = buildWorkbench(result, sessionRef.current);
                setRunResult(result);
                setWorkbench(wb);
                setRunStatus("complete");
                setRunCount(c => c + 1);
            } catch (err) {
                setRunError(err.message);
                setRunStatus("error");
                console.error("Shell run error:", err);
            }
        }, 0);
    }, [presetIdx]);

    const handleConsult = useCallback(() => {
        const entry = {
            type:      "consultation_request",
            timestamp: new Date().toISOString(),
            run_id:    runId,
            note:      "stub · consultation seam not yet wired in v0",
        };
        setRequestLog(l => [entry, ...l]);
        console.log("Consultation request (stub):", entry);
    }, [runId]);

    const handleActivation = useCallback(() => {
        const entry = {
            type:      "activation_request",
            timestamp: new Date().toISOString(),
            run_id:    runId,
            note:      "stub · activation/review seam not yet wired in v0",
        };
        setRequestLog(l => [entry, ...l]);
        console.log("Activation request (stub):", entry);
    }, [runId]);

    return (
        <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.sans }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                select { appearance: none; }
                button { border: none; }
            `}</style>

            <div style={{ maxWidth: 940, margin: "0 auto" }}>
                {/* Shell header */}
                <div style={{ padding: "20px 20px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.amber, boxShadow: `0 0 10px ${C.amber}` }} />
                        <span style={{ fontFamily: C.mono, fontSize: 11, color: C.amber, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                            DME · Object Execution Shell v0
                        </span>
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim, marginBottom: 12 }}>
                        execution surface · not authority · runtime is not canon · display is read-side only
                    </div>
                    <Rule />
                </div>

                {/* Shell body */}
                <div style={{
                    margin: "0 0 0",
                    border: `1px solid ${C.rule}`,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: C.surface,
                }}>
                    <ControlRegion
                        selectedFamily={selectedFamily}
                        onSelectFamily={setSelectedFamily}
                        preset={presetIdx}
                        onSelectPreset={setPresetIdx}
                        onRun={handleRun}
                        runStatus={runStatus}
                    />
                    <StatusRegion
                        runStatus={runStatus}
                        runId={runId}
                        runCount={runCount}
                        seam={runStatus !== "idle" ? "DoorOneOrchestrator → DoorOneWorkbench" : null}
                    />
                    <ResultsRegion workbench={workbench} runResult={runResult} />
                    <RequestRegion
                        hasResult={!!workbench}
                        onConsult={handleConsult}
                        onActivation={handleActivation}
                    />
                </div>

                {/* Request log */}
                {requestLog.length > 0 && (
                    <div style={{ margin: "16px 0", padding: "12px 16px", background: C.surface, borderRadius: 6, border: `1px solid ${C.rule}` }}>
                        <Label style={{ marginBottom: 8 }}>request log (stubs)</Label>
                        {requestLog.map((r, i) => (
                            <div key={i} style={{ fontFamily: C.mono, fontSize: 11, color: C.textDim, marginBottom: 3 }}>
                                {r.timestamp.slice(11, 19)} · {r.type} · {r.note}
                            </div>
                        ))}
                    </div>
                )}

                {/* Error display */}
                {runError && (
                    <div style={{ margin: "16px 0", padding: "12px 16px", background: C.redFaint, borderRadius: 6, border: `1px solid ${C.red}`, fontFamily: C.mono, fontSize: 12, color: C.red }}>
                        run error: {runError}
                    </div>
                )}

                {/* Footer */}
                <div style={{ padding: "16px 0 40px", fontFamily: C.mono, fontSize: 10, color: C.textDim, display: "flex", gap: 20, flexWrap: "wrap" }}>
                    <span>execution surface · not authority</span>
                    <span>lab HUD: index.html · public demo: demo.html</span>
                    <span>DME v0.1 · Door One below canon</span>
                </div>
            </div>
        </div>
    );
}
