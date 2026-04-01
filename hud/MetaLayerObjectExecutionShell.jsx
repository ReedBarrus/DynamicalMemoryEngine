// hud/MetaLayerObjectExecutionShell.jsx
//
// Meta-Layer Object Execution Shell v0
//
// Constitutional posture:
//   - Execution surface only — triggers lawful runs, does NOT define runtime meaning
//   - Calls DoorOneOrchestrator directly (pure-JS, browser-compatible operator chain)
//   - Display is read-side only — results are inspection surfaces, not authority
//   - Unsupported source families are explicitly labeled, not faked
//   - Request and replay surfaces are explicit fences below canon
//   - Keeps lab HUD and public demo separate
//
// Wired source families (v0):
//   - Synthetic Signal (fully wired — uses makeTestSignal → DoorOneOrchestrator)
//   - File Import (JSON / CSV / WAV — wired through modular adapter seam)
//
// Planned / not yet wired (v0):
//   - Smart Tag / Annotation Lifecycle
//   - Presence Signal Trajectory
//   - Derived Trace / LLM Runtime Metrics
//   - Audio / Real Source Family (daw_mic families — requires separate WAV fixture wiring)
//
// Shell regions:
//   A. Control / Orchestration
//   B. Run Status
//   C. Inspection / Results
//   D. Request Surface
//   E. Replay / Reconstruction

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { makeTestSignal } from "../fixtures/test_signal.js";
import { DoorOneOrchestrator } from "../runtime/DoorOneOrchestrator.js";
import { CrossRunSession } from "../runtime/CrossRunSession.js";
import { DoorOneWorkbench } from "../runtime/DoorOneWorkbench.js";
import { runAdapter, detectAdapter } from "./adapters/ingestAdapters.js";
import {
    buildConsultationRequest,
    buildActivationReviewRequest,
    requestSummaryLine,
    downloadRequestJson,
} from "./requestModel.js";
import { projectBoth } from "./adapters/tandemAdapter.js";
import {
    buildRuntimeReconstructionReplay,
    buildRequestSupportReplay,
    replaySummaryLine,
    downloadReplayJson,
} from "./replayModel.js";

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
        id: "synthetic_signal",
        label: "Synthetic Signal",
        description: "Deterministic multi-segment signal with novelty, frequency shift, dropout, and burst-return phases.",
        wired: true,
        badge: "wired",
    },
    {
        id: "smart_tag_lifecycle",
        label: "Smart Tag / Annotation Lifecycle",
        description: "Creation event + evolution over time (edits, replies, interactions). Structural trajectory + provenance receipt.",
        wired: false,
        badge: "planned",
    },
    {
        id: "presence_signal",
        label: "Presence Signal Trajectory",
        description: "On-page presence updates or interaction stream. Detects subtle baseline degradation while tolerating normal environmental shift.",
        wired: false,
        badge: "planned",
    },
    {
        id: "derived_trace",
        label: "Derived Trace / LLM Runtime Metrics",
        description: "Token-rate, tool-call cadence, latency, or embedding-displacement traces.",
        wired: false,
        badge: "planned",
    },
    {
        id: "audio_real_source",
        label: "Audio / Real Source Family",
        description: "WAV file ingest through existing real-source adapter. daw_mic_sine_400hz and daw_mic_input families.",
        wired: false,
        badge: "planned — WAV adapter needed",
    },
    {
        id: "file_import",
        label: "File Import (JSON / CSV / WAV)",
        description: "Import a local file through the modular adapter seam. Normalizes to the same lawful ingest contract.",
        wired: true,
        badge: "wired",
        isFileFamily: true,
    },
];

// ─── Synthetic signal parameter presets ──────────────────────────────────────
const SIGNAL_PRESETS = [
    { label: "Standard (seed=42, 10s)", seed: 42, durationSec: 10, noiseStd: 0.03 },
    { label: "High noise (seed=42, 10s)", seed: 42, durationSec: 10, noiseStd: 0.12 },
    { label: "Perturbation variant (seed=99)", seed: 99, durationSec: 10, noiseStd: 0.03 },
    { label: "Return variant (seed=7)", seed: 7, durationSec: 10, noiseStd: 0.03 },
];

// ─── Runtime runner ───────────────────────────────────────────────────────────
function runSyntheticPipeline(params) {
    const { seed, durationSec, noiseStd, runLabel } = params;
    const { signal } = makeTestSignal({ seed, durationSec, noiseStd, source_id: `synthetic.seed${seed}` });
    const raw = {
        timestamps: signal.timestamps,
        values: signal.values,
        stream_id: signal.stream_id ?? `stream.${runLabel}`,
        source_id: signal.source_id,
        channel: signal.channel,
        modality: signal.modality,
        meta: signal.meta,
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
    const wb = new DoorOneWorkbench();
    return wb.assemble(runResult, {
        crossRunSession,
    });
}

// Run imported ingest payload through the same lawful pipeline used by synthetic family.
// The adapter has already normalized the file into a lawful raw ingest payload.
// This function does NOT know or care about the source format — only the contract shape.
function runImportedPipeline(ingestPayload, runLabel) {
    const orch = new DoorOneOrchestrator({
        policies: POLICIES,
        substrate_id: `shell.import.substrate.${runLabel}`,
    });
    const result = orch.runBatch(ingestPayload, { query_spec: QUERY_SPEC, query_policy: QUERY_POLICY });
    result.run_label = runLabel;
    return result;
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
    bg: "#0e1117",
    surface: "#161b27",
    surfaceHigh: "#1c2333",
    rule: "#1f2d45",
    ruleLight: "#263449",
    amber: "#f59e0b",
    amberDim: "#92610a",
    amberFaint: "#2a1e06",
    green: "#22c55e",
    greenFaint: "#052e16",
    blue: "#3b82f6",
    blueFaint: "#0c1a3a",
    red: "#ef4444",
    redFaint: "#1f0707",
    yellow: "#eab308",
    text: "#e2e8f0",
    textMid: "#94a3b8",
    textDim: "#475569",
    textMono: "#a8c1e0",
    mono: "'IBM Plex Mono', 'Cascadia Code', monospace",
    sans: "'DM Sans', 'Inter', system-ui, sans-serif",
    serif: "'Crimson Pro', Georgia, serif",
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
        idle: { color: C.textDim, bg: C.surface, label: "idle" },
        running: { color: C.amber, bg: C.amberFaint, label: "running…" },
        complete: { color: C.green, bg: C.greenFaint, label: "complete" },
        error: { color: C.red, bg: C.redFaint, label: "error" },
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

// ─── DropZone — drag-drop + click-to-choose file intake ──────────────────────
//
// Execution-side source intake surface.
// Accepts .json / .csv / .wav via drag/drop or click.
// Routes dropped files through the same onFileSelect handler used by
// the click path — no second ingest ontology, no auto-run.
//
// Constitutional posture:
//   - Source intake belongs to the execution side.
//   - Dropped files are adapter-mediated, not directly authoritative.
//   - A dropped file does NOT auto-run. The run button remains explicit.
//   - dragActive is local UI state only — does not affect adapter meaning.
//   - generic file import is a transport mechanism, not a source-family claim.

function DropZone({ pendingFile, adapterStatus, detectedType, onFileSelect }) {
    const [dragActive, setDragActive] = useState(false);

    function handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        // Only deactivate if leaving the zone itself (not a child)
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragActive(false);
        }
    }
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer?.files?.[0] ?? null;
        if (file) onFileSelect(file);
    }
    function handleInputChange(e) {
        const file = e.target.files?.[0] ?? null;
        if (file) onFileSelect(file);
        // Reset input so the same file can be re-selected
        e.target.value = "";
    }

    const borderColor = dragActive
        ? C.amber
        : pendingFile
            ? (adapterStatus?.ok ? C.green : C.red)
            : C.ruleLight;

    const bgColor = dragActive
        ? C.amberFaint
        : C.surfaceHigh;

    return (
        <div>
            {/* Intake zone */}
            <label
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    width: "100%",
                    padding: "14px 10px",
                    borderRadius: 6,
                    border: `1px dashed ${borderColor}`,
                    background: bgColor,
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    textAlign: "center",
                    minHeight: 72,
                }}
            >
                {/* Hidden file input for click-to-choose */}
                <input
                    type="file"
                    accept=".json,.csv,.wav"
                    style={{ display: "none" }}
                    onChange={handleInputChange}
                />

                {/* Icon / state indicator */}
                <div style={{ fontFamily: C.mono, fontSize: 18, color: dragActive ? C.amber : C.textDim, lineHeight: 1 }}>
                    {dragActive ? "⟱" : pendingFile ? "◉" : "⊡"}
                </div>

                {/* Primary label */}
                <div style={{ fontFamily: C.mono, fontSize: 11, color: dragActive ? C.amber : C.text }}>
                    {dragActive
                        ? "drop to load"
                        : pendingFile
                            ? pendingFile.name
                            : "drag & drop .json / .csv / .wav"}
                </div>

                {/* Secondary hint */}
                {!pendingFile && !dragActive && (
                    <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                        or click to choose
                    </div>
                )}
            </label>

            {/* Adapter detection line */}
            {detectedType && (
                <div style={{ marginTop: 5, fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                    detected adapter: <span style={{ color: C.blue }}>{detectedType}</span>
                </div>
            )}

            {/* Adapter status line */}
            {adapterStatus && (
                <div style={{ marginTop: 4, fontFamily: C.mono, fontSize: 10, color: adapterStatus.ok ? C.green : C.red }}>
                    {adapterStatus.ok
                        ? `✓ ${adapterStatus.meta?.adapter ?? ""} · ${adapterStatus.payload?.timestamps?.length ?? 0} samples normalized`
                        : `✗ ${adapterStatus.reasons?.[0] ?? "adapter error"}`}
                </div>
            )}

            {/* Clear button — only when a file is selected */}
            {pendingFile && (
                <button
                    onClick={e => { e.stopPropagation(); onFileSelect(null); }}
                    style={{
                        marginTop: 5, padding: "2px 10px", borderRadius: 4,
                        border: `1px solid ${C.rule}`, background: "transparent",
                        color: C.textDim, fontFamily: C.mono, fontSize: 10, cursor: "pointer",
                    }}
                >
                    ✕ clear
                </button>
            )}

            {/* Posture note */}
            <div style={{ marginTop: 5, fontFamily: C.mono, fontSize: 9, color: C.textDim }}>
                execution-side intake · adapter-mediated · explicit run required · not authority
            </div>
        </div>
    );
}

// ─── Region A: Control / Orchestration ───────────────────────────────────────
function ControlRegion({ selectedFamily, onSelectFamily, preset, onSelectPreset,
    onRun, onFileSelect, pendingFile, adapterStatus, runStatus }) {
    const family = SOURCE_FAMILIES.find(f => f.id === selectedFamily);
    const isWired = family?.wired ?? false;
    const isFile = family?.isFileFamily ?? false;
    const running = runStatus === "running";

    // For file family: run is ready only when we have a validated payload
    const canRun = isFile
        ? (adapterStatus?.ok === true && !running)
        : (isWired && !running);

    const detectedType = pendingFile ? detectAdapter(pendingFile.name) : null;

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

                {/* Input selector */}
                <div>
                    <Label style={{ marginBottom: 6 }}>
                        {isFile ? "file / object input" : isWired ? "signal preset" : "object / input"}
                    </Label>
                    {isFile ? (
                        <DropZone
                            pendingFile={pendingFile}
                            adapterStatus={adapterStatus}
                            detectedType={detectedType}
                            onFileSelect={onFileSelect}
                        />
                    ) : isWired ? (
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
                    onClick={canRun ? onRun : undefined}
                    disabled={!canRun}
                    style={{
                        padding: "9px 22px", borderRadius: 6,
                        border: `1px solid ${canRun ? C.amber : C.rule}`,
                        background: canRun ? C.amberFaint : C.surface,
                        color: canRun ? C.amber : C.textDim,
                        fontFamily: C.mono, fontSize: 12, fontWeight: 600,
                        cursor: canRun ? "pointer" : "not-allowed",
                        letterSpacing: "0.08em", transition: "all 0.15s",
                    }}
                >
                    {running ? "running…" : "▶  run"}
                </button>
            </div>

            {/* Declared path note */}
            {isWired && !isFile && (
                <div style={{ marginTop: 10, fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                    path: makeTestSignal → DoorOneOrchestrator → CrossRunSession → DoorOneWorkbench
                </div>
            )}
            {isFile && adapterStatus?.ok && (
                <div style={{ marginTop: 10, fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                    path: {adapterStatus.meta?.adapter ?? "adapter"} → DoorOneOrchestrator → CrossRunSession → DoorOneWorkbench
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

    const scope = workbench?.scope ?? {};
    const runtime = workbench?.runtime ?? {};
    const readiness = workbench?.promotion_readiness?.report ?? {};
    const dossier = workbench?.canon_candidate?.dossier ?? {};
    const consensus = workbench?.consensus_review?.review ?? {};

    const planes = [
        { id: "provenance", label: "1 — Provenance" },
        { id: "evidence", label: "2 — Runtime Evidence" },
        { id: "interpretation", label: "3 — Interpretation" },
        { id: "review", label: "4 — Review / Request" },
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
                            ["stream_id", scope?.stream_id ?? "—"],
                            ["run_label", runResult?.run_label ?? "—"],
                            ["source_id", runResult?.artifacts?.a1?.source_id ?? "—"],
                            ["segment_count", String((scope?.segment_ids ?? []).length)],
                            ["cross_run", scope?.cross_run_context?.available
                                ? `yes · runs: ${scope.cross_run_context.run_count}`
                                : "no"],
                            ["ingest_ok", String(runResult?.ok ?? "—")],
                        ]} />
                    )}

                    {/* Plane 2: Runtime Evidence */}
                    {openSection === "evidence" && (
                        <div>
                            <PlaneGrid rows={[
                                ["states", String(runtime?.substrate?.state_count ?? 0)],
                                ["basins", String(runtime?.substrate?.basin_count ?? 0)],
                                ["segments", String(runtime?.substrate?.segment_count ?? 0)],
                                ["h1_artifacts", String(runtime?.artifacts?.h1s?.length ?? 0)],
                                ["anomaly_reports", String(runtime?.artifacts?.anomaly_reports?.length ?? 0)],
                                ["has_query", runtime?.artifacts?.q ? "yes" : "no"],
                                ["overall_readiness", readiness?.readiness_summary?.overall_readiness ?? "—"],
                                ["candidate_claim", dossier?.candidate_claim?.claim_type ?? "—"],
                            ]} />
                            {/* Anomaly events */}
                            {(runtime?.artifacts?.anomaly_reports ?? []).length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                    <Label style={{ marginBottom: 6 }}>anomaly events</Label>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                        {(runtime.artifacts.anomaly_reports ?? []).slice(0, 5).map((a, i) => (
                                            <div key={i} style={{ fontFamily: C.mono, fontSize: 11, color: C.textMono }}>
                                                t={a?.comparison_window?.window_span?.t_start?.toFixed?.(2) ?? "?"}s — {a?.comparison_summary?.dominant_change ?? a?.artifact_type ?? "anomaly"}
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
                                ["consensus_result", consensus?.result ?? "not_run"],
                                ["readiness_summary", readiness?.readiness_summary?.overall_readiness ?? "—"],
                                ["claim_type", dossier?.candidate_claim?.claim_type ?? "—"],
                                ["blockers", String(dossier?.review_posture?.insufficiency_count ?? 0)],
                            ]} />
                        </div>
                    )}

                    {/* Plane 4: Review / Request */}
                    {openSection === "review" && (
                        <div>
                            <PlaneGrid rows={[
                                ["current_status", "below_canon · runtime_only"],
                                ["promotion_status", readiness?.readiness_summary?.overall_readiness ?? "—"],
                                ["consensus_review", consensus?.result ?? "not_run"],
                                ["canon_candidate", dossier?.candidate_claim?.claim_type ?? "—"],
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
function RequestRegion({ hasResult, workbench, runResult, sourceFamilyLabel, onRequest }) {
    const [activeTab, setActiveTab] = useState("consult");
    const [requestedUse, setRequestedUse] = useState("bounded review-anchor consultation under same declared lens");
    const [proposedClaim, setProposedClaim] = useState("");
    const [allowedUse, setAllowedUse] = useState("bounded review consideration only");
    const [notes, setNotes] = useState("");
    const [lastPrepared, setLastPrepared] = useState(null);

    const canPrepare = hasResult;

    const handlePrepare = () => {
        if (!canPrepare) return;
        let req;
        if (activeTab === "consult") {
            req = buildConsultationRequest({
                workbench, runResult, sourceFamilyLabel, requestedUse, notes,
            });
        } else {
            req = buildActivationReviewRequest({
                workbench, runResult, sourceFamilyLabel,
                proposedBoundedClaim: proposedClaim, allowedUse, notes,
            });
        }
        setLastPrepared(req);
        onRequest(req);
    };

    const inputStyle = {
        width: "100%", padding: "6px 9px", borderRadius: 4,
        border: `1px solid ${C.ruleLight}`, background: C.surfaceHigh,
        color: C.textMono, fontFamily: C.mono, fontSize: 11, outline: "none",
        resize: "vertical",
    };

    return (
        <div style={{ padding: "16px 20px" }}>
            {/* Region header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Label style={{ color: C.textDim, letterSpacing: "0.16em" }}>
                    D — Request Surface
                </Label>
                <span style={{ fontFamily: C.mono, fontSize: 10, color: C.amberDim }}>
                    explicit requests only · not automatic · not promotion
                </span>
            </div>

            {!hasResult && (
                <div style={{
                    padding: "10px 14px", borderRadius: 6,
                    border: `1px dashed ${C.rule}`, background: C.surface,
                    fontFamily: C.mono, fontSize: 11, color: C.textDim,
                }}>
                    run a source first to prepare a request
                </div>
            )}

            {hasResult && (
                <div>
                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                        {[
                            { id: "consult", label: "↗ consultation request" },
                            { id: "activation", label: "↗ activation / review request" },
                        ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                                padding: "5px 12px", borderRadius: 4, cursor: "pointer",
                                border: `1px solid ${activeTab === t.id ? C.amber : C.rule}`,
                                background: activeTab === t.id ? C.amberFaint : C.surface,
                                color: activeTab === t.id ? C.amber : C.textDim,
                                fontFamily: C.mono, fontSize: 11,
                            }}>{t.label}</button>
                        ))}
                    </div>

                    {/* Consultation form */}
                    {activeTab === "consult" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div>
                                <Label style={{ marginBottom: 4 }}>requested_use</Label>
                                <input
                                    value={requestedUse}
                                    onChange={e => setRequestedUse(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{
                                padding: "8px 10px", borderRadius: 4,
                                border: `1px solid ${C.rule}`, background: C.surface,
                                fontFamily: C.mono, fontSize: 10, color: C.textDim,
                            }}>
                                auto-populated from run: stream={workbench?.scope?.stream_id ?? "—"} ·
                                segments={(workbench?.scope?.segment_ids ?? []).length} ·
                                readiness={workbench?.promotion_readiness?.report?.readiness_summary?.overall_readiness ?? "—"}
                            </div>
                        </div>
                    )}

                    {/* Activation/review form */}
                    {activeTab === "activation" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div>
                                <Label style={{ marginBottom: 4 }}>proposed_bounded_claim (optional — auto-derived if empty)</Label>
                                <textarea
                                    value={proposedClaim}
                                    onChange={e => setProposedClaim(e.target.value)}
                                    rows={2}
                                    placeholder="leave empty to auto-derive from run context"
                                    style={{ ...inputStyle }}
                                />
                            </div>
                            <div>
                                <Label style={{ marginBottom: 4 }}>allowed_use</Label>
                                <input
                                    value={allowedUse}
                                    onChange={e => setAllowedUse(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{
                                padding: "8px 10px", borderRadius: 4,
                                border: `1px solid ${C.rule}`, background: C.surface,
                                fontFamily: C.mono, fontSize: 10, color: C.textDim,
                            }}>
                                explicit_non_claims will be auto-set ·
                                canonical_status will NOT be changed ·
                                this is a review request, not a promotion
                            </div>
                        </div>
                    )}

                    {/* Notes field */}
                    <div style={{ marginTop: 10 }}>
                        <Label style={{ marginBottom: 4 }}>notes (optional)</Label>
                        <input
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="any additional bounded context"
                            style={inputStyle}
                        />
                    </div>

                    {/* Prepare button */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
                        <button
                            onClick={handlePrepare}
                            style={{
                                padding: "8px 18px", borderRadius: 6, cursor: "pointer",
                                border: `1px solid ${C.amber}`, background: C.amberFaint,
                                color: C.amber, fontFamily: C.mono, fontSize: 12, fontWeight: 600,
                            }}
                        >
                            prepare request
                        </button>
                        {lastPrepared && (
                            <button
                                onClick={() => downloadRequestJson(lastPrepared)}
                                style={{
                                    padding: "8px 14px", borderRadius: 6, cursor: "pointer",
                                    border: `1px solid ${C.ruleLight}`, background: C.surface,
                                    color: C.textMid, fontFamily: C.mono, fontSize: 11,
                                }}
                            >
                                ↓ download JSON
                            </button>
                        )}
                    </div>

                    {/* Last prepared preview */}
                    {lastPrepared && (
                        <div style={{
                            marginTop: 14, padding: "10px 12px", borderRadius: 6,
                            border: `1px solid ${C.ruleLight}`, background: C.surfaceHigh,
                        }}>
                            <Label style={{ marginBottom: 6, color: C.green }}>
                                ✓ request prepared · {lastPrepared.request_id}
                            </Label>
                            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim, display: "flex", flexDirection: "column", gap: 3 }}>
                                <span>type: {lastPrepared.request_type} · status: {lastPrepared.request_status}</span>
                                <span>source: {lastPrepared.source_family_label}</span>
                                <span>run: {lastPrepared.run_label}</span>
                                <span style={{ color: C.amberDim }}>below canon · not automatic · explicit request only</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Region E: Replay / Reconstruction Surface ───────────────────────────────
function ReplayRegion({ hasResult, workbench, runResult, requestLog, sourceFamilyLabel, onReplay }) {
    const [replayTarget, setReplayTarget] = useState("current_run");
    const [lastReplay, setLastReplay] = useState(null);
    const [activePanel, setActivePanel] = useState(null);  // null = no panel open

    // Build the target selector options
    const targetOptions = [
        { value: "current_run", label: "Current run · runtime reconstruction" },
        ...(requestLog ?? []).map((r, i) => ({
            value: `request:${r.request_id}`,
            label: `${r.request_type === "consultation" ? "CONSULT" : "ACT-REV"} · ${r.request_id?.slice(-8) ?? i}`,
        })),
    ];

    const handlePrepareReplay = () => {
        if (!hasResult) return;
        let req;
        if (replayTarget === "current_run") {
            req = buildRuntimeReconstructionReplay({ workbench, runResult, sourceFamilyLabel });
        } else {
            const targetReq = (requestLog ?? []).find(r => `request:${r.request_id}` === replayTarget);
            req = buildRequestSupportReplay({ targetRequest: targetReq, workbench, runResult, sourceFamilyLabel });
        }
        setLastReplay(req);
        setActivePanel(req.replay_request_id);
        onReplay(req);
    };

    return (
        <div style={{ padding: "16px 20px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Label style={{ color: C.textDim, letterSpacing: "0.16em" }}>
                    E — Replay / Reconstruction
                </Label>
                <span style={{ fontFamily: C.mono, fontSize: 10, color: C.amberDim }}>
                    lens-bound support · not truth · not authority · Tier 0 live state
                </span>
            </div>

            {!hasResult && (
                <div style={{
                    padding: "10px 14px", borderRadius: 6,
                    border: `1px dashed ${C.rule}`, background: C.surface,
                    fontFamily: C.mono, fontSize: 11, color: C.textDim,
                }}>
                    run a source first to prepare a replay
                </div>
            )}

            {hasResult && (
                <div>
                    {/* Target selector */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end", marginBottom: 14 }}>
                        <div>
                            <Label style={{ marginBottom: 5 }}>replay target</Label>
                            <select
                                value={replayTarget}
                                onChange={e => setReplayTarget(e.target.value)}
                                style={{
                                    width: "100%", padding: "7px 10px", borderRadius: 5,
                                    border: `1px solid ${C.ruleLight}`, background: C.surfaceHigh,
                                    color: C.text, fontFamily: C.mono, fontSize: 11, outline: "none",
                                }}
                            >
                                {targetOptions.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handlePrepareReplay}
                            style={{
                                padding: "8px 16px", borderRadius: 5, cursor: "pointer",
                                border: `1px solid ${C.blue}`, background: C.blueFaint,
                                color: C.blue, fontFamily: C.mono, fontSize: 12, fontWeight: 600,
                            }}
                        >
                            ⟳ prepare replay
                        </button>
                    </div>

                    {/* Replay panel */}
                    {lastReplay && lastReplay.request_status !== "failed" && (
                        <div style={{
                            border: `1px solid ${C.ruleLight}`,
                            borderRadius: 6,
                            overflow: "hidden",
                            marginBottom: 10,
                        }}>
                            {/* Panel header bar */}
                            <div style={{
                                padding: "8px 12px",
                                background: C.surfaceHigh,
                                borderBottom: `1px solid ${C.rule}`,
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}>
                                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.blue }}>
                                    {lastReplay.replay_type === "runtime_reconstruction"
                                        ? "runtime reconstruction replay"
                                        : "request support replay"}
                                    {" · "}{lastReplay.replay_request_id?.slice(-12)}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        onClick={() => downloadReplayJson(lastReplay)}
                                        style={{
                                            padding: "3px 10px", borderRadius: 4, cursor: "pointer",
                                            border: `1px solid ${C.rule}`, background: "transparent",
                                            color: C.textDim, fontFamily: C.mono, fontSize: 10,
                                        }}
                                    >↓ JSON</button>
                                </div>
                            </div>

                            {/* Panel body — provenance-first ordering */}
                            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

                                {/* Non-authority stamp — always first */}
                                <div style={{
                                    padding: "6px 10px", borderRadius: 4,
                                    border: `1px solid ${C.redFaint}`, background: C.redFaint,
                                    fontFamily: C.mono, fontSize: 10,
                                    color: "#f87171",
                                }}>
                                    {lastReplay.replay_posture}
                                </div>

                                {/* 1. Provenance */}
                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>1 · Provenance</Label>
                                    <ReplayGrid rows={[
                                        ["source_family", lastReplay.source_family ?? "—"],
                                        ["stream_id", lastReplay.stream_id ?? "—"],
                                        ["run_label", lastReplay.run_label ?? "—"],
                                        ["replay_target", lastReplay.replay_target_ref ?? "—"],
                                        ["target_type", lastReplay.replay_target_type ?? "—"],
                                    ]} />
                                </div>

                                {/* 2. Runtime Evidence */}
                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>2 · Runtime Evidence</Label>
                                    <ReplayGrid rows={[
                                        ["support_basis", (lastReplay.support_basis ?? []).join(" · ") || "—"],
                                        ["anomaly_count", String(lastReplay.anomaly_count ?? 0)],
                                        ["cross_run", lastReplay.cross_run_available ? `yes · ${lastReplay.cross_run_count ?? "?"}` : "no"],
                                        ["overall_readiness", lastReplay.overall_readiness ?? "—"],
                                    ]} />
                                </div>

                                {/* 3. Declared Lens */}
                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>3 · Declared Lens</Label>
                                    <ReplayGrid rows={[
                                        ["transform_family", lastReplay.declared_lens?.transform_family ?? "—"],
                                        ["window_N / hop_N", `${lastReplay.declared_lens?.window_N ?? "—"} / ${lastReplay.declared_lens?.hop_N ?? "—"}`],
                                        ["Fs_target", String(lastReplay.declared_lens?.Fs_target ?? "—")],
                                        ["scale_posture", lastReplay.declared_lens?.scale_posture ?? "—"],
                                        ["lens_note", lastReplay.declared_lens?.note ?? "—"],
                                    ]} />
                                </div>

                                {/* 4. Retained Tier */}
                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>4 · Retained Tier</Label>
                                    <ReplayGrid rows={[
                                        ["tier_used", String(lastReplay.retained_tier_used?.tier_used ?? "—")],
                                        ["tier_label", lastReplay.retained_tier_used?.tier_label ?? "—"],
                                        ["honest_posture", lastReplay.retained_tier_used?.honest_posture ?? "—"],
                                        ["higher_tiers", lastReplay.retained_tier_used?.higher_tiers_note ?? "—"],
                                    ]} />
                                </div>

                                {/* 5. Derived / non-claims */}
                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>5 · Derived Posture / Non-Claims</Label>
                                    <div style={{ fontFamily: C.mono, fontSize: 11, color: C.textDim, marginBottom: 6 }}>
                                        {lastReplay.derived_vs_durable}
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                        {(lastReplay.explicit_non_claims ?? []).map((nc, i) => (
                                            <span key={i} style={{
                                                padding: "2px 8px", borderRadius: 4,
                                                border: `1px solid ${C.rule}`, background: "transparent",
                                                color: C.textDim, fontFamily: C.mono, fontSize: 10,
                                            }}>{nc}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Request-not-fulfilled notice for request replays */}
                                {lastReplay.replay_type === "request_support_replay" && (
                                    <div style={{
                                        padding: "6px 10px", borderRadius: 4,
                                        border: `1px solid ${C.amberDim}`, background: C.amberFaint,
                                        fontFamily: C.mono, fontSize: 10, color: C.amberDim,
                                    }}>
                                        replay of support context · the original request has not been fulfilled · this is not fulfillment
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Failed replay notice */}
                    {lastReplay?.request_status === "failed" && (
                        <div style={{
                            padding: "8px 12px", borderRadius: 5,
                            border: `1px solid ${C.red}`, background: C.redFaint,
                            fontFamily: C.mono, fontSize: 11, color: C.red,
                        }}>
                            replay failed: {lastReplay.failure_reason}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ReplayGrid({ rows }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {rows.map(([k, v]) => (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 10 }}>
                    <Label style={{ paddingTop: 1, fontSize: 9 }}>{k}</Label>
                    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.textMono, lineHeight: 1.4, wordBreak: "break-word" }}>{v}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Tandem Strip (shared projection preview) ─────────────────────────────────
// A narrow read-side strip that shows what the tandem adapter emits to both
// HUD and demo surfaces. Read-side only — not authority.
function TandemStrip({ hud, demo }) {
    const [open, setOpen] = useState(false);
    if (!hud?.has_result && !demo?.has_result) return null;
    return (
        <div style={{
            margin: "12px 0",
            border: `1px solid ${C.rule}`,
            borderRadius: 6,
            background: C.surface,
            overflow: "hidden",
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: "100%", padding: "8px 14px",
                    background: "transparent", border: "none",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer",
                }}
            >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Label>tandem projection</Label>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                        shared read-side model · same source · two audience postures
                    </span>
                </div>
                <span style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim }}>{open ? "▲" : "▼"}</span>
            </button>
            {open && (
                <div style={{
                    padding: "10px 14px",
                    borderTop: `1px solid ${C.rule}`,
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
                }}>
                    {/* HUD projection summary */}
                    <div>
                        <Label style={{ color: C.blue, marginBottom: 6 }}>internal_hud projection</Label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {[
                                ["source", hud?.provenance?.source_family ?? "—"],
                                ["object_id", hud?.provenance?.object_id ?? "—"],
                                ["segments", hud?.provenance?.segment_count_label ?? "—"],
                                ["cross_run", hud?.provenance?.cross_run_label ?? "—"],
                                ["readiness", hud?.interpretation?.readiness_label ?? "—"],
                                ["requests", hud?.review_request_replay?.request_log_note ?? "—"],
                                ["replays", hud?.review_request_replay?.replay_log_note ?? "—"],
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 6 }}>
                                    <Label style={{ fontSize: 9 }}>{k}</Label>
                                    <Mono style={{ fontSize: 10 }}>{v}</Mono>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Demo projection summary */}
                    <div>
                        <Label style={{ color: C.amberDim, marginBottom: 6 }}>public_demo projection</Label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {[
                                ["object", demo?.provenance?.object_label ?? "—"],
                                ["family", demo?.provenance?.source_family ?? "—"],
                                ["evidence", (demo?.evidence?.summary_lines ?? []).join(" · ") || "—"],
                                ["request", demo?.review_request_replay?.request_note ?? "—"],
                                ["replay", demo?.review_request_replay?.replay_note ?? "—"],
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 6 }}>
                                    <Label style={{ fontSize: 9 }}>{k}</Label>
                                    <Mono style={{ fontSize: 10, color: C.textDim }}>{v}</Mono>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 6, fontFamily: C.mono, fontSize: 9, color: C.textDim, fontStyle: "italic" }}>
                            calmer · narrower · no raw counts
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main shell component ─────────────────────────────────────────────────────
// onStateChange: optional callback for app-level state threading.
// When provided, called with key shell state whenever workbench, runResult,
// requestLog, replayLog, or sourceFamilyLabel change.
// The shell remains the state owner — this is read-side export only.
export default function MetaLayerObjectExecutionShell({ onStateChange = null } = {}) {
    const [selectedFamily, setSelectedFamily] = useState("synthetic_signal");
    const [presetIdx, setPresetIdx] = useState(0);
    const [runStatus, setRunStatus] = useState("idle");
    const [runError, setRunError] = useState(null);
    const [runResult, setRunResult] = useState(null);
    const [workbench, setWorkbench] = useState(null);
    const [runId, setRunId] = useState(null);
    const [runCount, setRunCount] = useState(0);
    const [requestLog, setRequestLog] = useState([]);
    const [replayLog, setReplayLog] = useState([]);
    const [pendingFile, setPendingFile] = useState(null);
    const [adapterStatus, setAdapterStatus] = useState(null);  // { ok, payload?, reasons?, meta }
    const sessionRef = useRef(null);

    const handleRun = useCallback(() => {
        const isFile = SOURCE_FAMILIES.find(f => f.id === selectedFamily)?.isFileFamily;
        const id = `shell.run.${Date.now()}`;
        setRunStatus("running");
        setRunError(null);
        setRunId(id);

        setTimeout(() => {
            try {
                let result;
                if (isFile) {
                    // Use the already-validated adapter payload
                    if (!adapterStatus?.ok || !adapterStatus?.payload) {
                        throw new Error("No valid adapter payload available — load a file first");
                    }
                    result = runImportedPipeline(adapterStatus.payload, id);
                } else {
                    const preset = SIGNAL_PRESETS[presetIdx];
                    result = runSyntheticPipeline({
                        seed: preset.seed,
                        durationSec: preset.durationSec,
                        noiseStd: preset.noiseStd,
                        runLabel: id,
                    });
                }
                if (!result?.ok) throw new Error(result?.error ?? "orchestrator returned ok=false");

                if (!sessionRef.current) {
                    sessionRef.current = new CrossRunSession({ policies: POLICIES });
                }
                sessionRef.current.addRun(result);

                const wb = buildWorkbench(result, sessionRef.current);
                setRunResult(result);
                setWorkbench(wb);
                console.log("DME runResult", result);
                console.log("DME workbench", wb);
                setRunStatus("complete");
                setRunCount(c => c + 1);
            } catch (err) {
                setRunError(err.message);
                setRunStatus("error");
                console.error("Shell run error:", err);
            }
        }, 0);
    }, [presetIdx, selectedFamily, adapterStatus]);

    // File selection: run adapter immediately, store result for later run trigger
    const handleFileSelect = useCallback(async (file) => {
        setPendingFile(file);
        setAdapterStatus(null);
        if (!file) return;
        const result = await runAdapter(file);
        setAdapterStatus(result);
    }, []);

    // Family change: clear file state when switching away from file family
    const handleFamilySelect = useCallback((fid) => {
        setSelectedFamily(fid);
        if (fid !== "file_import") {
            setPendingFile(null);
            setAdapterStatus(null);
        }
    }, []);

    // Single handler for both request types — receives a prepared request object
    // from RequestRegion. Adds it to the visible log. No canon is minted.
    const handleRequest = useCallback((req) => {
        setRequestLog(l => [req, ...l]);
    }, []);

    const handleReplay = useCallback((req) => {
        setReplayLog(l => [req, ...l]);
    }, []);

    // Derive readable label from the selected family id
    const sourceFamilyLabel = SOURCE_FAMILIES.find(f => f.id === selectedFamily)?.label ?? selectedFamily;

    // Tandem projection — shared read-side model for HUD and demo
    // Computed inline from current shell state; no runtime recomputation
    const tandemProjection = projectBoth({
        runResult, workbench, requestLog, replayLog, sourceFamilyLabel, runStatus,
    });

    // App-level state export — read-side only.
    // Calls onStateChange when key state changes so parent app can thread
    // the live state into other read-side surfaces (lab HUD, demo pane).
    // The shell remains the state owner; this is a read-side callback only.
    useEffect(() => {
        if (typeof onStateChange === "function") {
            onStateChange({ workbench, runResult, requestLog, replayLog, sourceFamilyLabel, runStatus });
        }
    }, [workbench, runResult, requestLog, replayLog, sourceFamilyLabel, runStatus, onStateChange]);

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
                        onSelectFamily={handleFamilySelect}
                        preset={presetIdx}
                        onSelectPreset={setPresetIdx}
                        onRun={handleRun}
                        onFileSelect={handleFileSelect}
                        pendingFile={pendingFile}
                        adapterStatus={adapterStatus}
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
                        workbench={workbench}
                        runResult={runResult}
                        sourceFamilyLabel={sourceFamilyLabel}
                        onRequest={handleRequest}
                    />
                </div>

                {/* Request log */}
                {requestLog.length > 0 && (
                    <div style={{ margin: "16px 0", padding: "12px 16px", background: C.surface, borderRadius: 6, border: `1px solid ${C.rule}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                            <Label>request log</Label>
                            <span style={{ fontFamily: C.mono, fontSize: 10, color: C.amberDim }}>
                                {requestLog.length} prepared · below canon · not automatic
                            </span>
                        </div>
                        {requestLog.map((r, i) => (
                            <div key={i} style={{
                                fontFamily: C.mono, fontSize: 11, color: C.textDim,
                                marginBottom: 4, padding: "4px 8px",
                                borderLeft: `2px solid ${r.request_type === "consultation" ? C.blue : C.amber}`,
                                background: C.surfaceHigh, borderRadius: "0 4px 4px 0",
                            }}>
                                {requestSummaryLine(r)}
                            </div>
                        ))}
                    </div>
                )}

                {/* Region E: Replay / Reconstruction */}
                <div style={{ borderTop: `1px solid ${C.rule}` }}>
                    <ReplayRegion
                        hasResult={!!workbench}
                        workbench={workbench}
                        runResult={runResult}
                        requestLog={requestLog}
                        sourceFamilyLabel={sourceFamilyLabel}
                        onReplay={handleReplay}
                    />
                </div>

                {/* Replay log */}
                {replayLog.length > 0 && (
                    <div style={{ margin: "12px 0", padding: "12px 16px", background: C.surface, borderRadius: 6, border: `1px solid ${C.rule}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <Label>replay log</Label>
                            <span style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                                {replayLog.length} prepared · Tier 0 · lens-bound · not authority
                            </span>
                        </div>
                        {replayLog.map((r, i) => (
                            <div key={i} style={{
                                fontFamily: C.mono, fontSize: 11, color: C.textDim,
                                marginBottom: 3, padding: "3px 8px",
                                borderLeft: `2px solid ${C.blue}`,
                                background: C.surfaceHigh, borderRadius: "0 4px 4px 0",
                            }}>
                                {replaySummaryLine(r)}
                            </div>
                        ))}
                    </div>
                )}

                {/* Tandem projection strip */}
                <TandemStrip
                    hud={tandemProjection.hud}
                    demo={tandemProjection.demo}
                />

                {/* Error display */}
                {runError && (
                    <div style={{ margin: "16px 0", padding: "12px 16px", background: C.redFaint, borderRadius: 6, border: `1px solid ${C.red}`, fontFamily: C.mono, fontSize: 12, color: C.red }}>
                        run error: {runError}
                    </div>
                )}

                {/* Footer */}
                <div style={{ padding: "16px 0 40px", fontFamily: C.mono, fontSize: 10, color: C.textDim, display: "flex", gap: 20, flexWrap: "wrap" }}>
                    <span>execution surface · not authority</span>
                    <span>lab HUD: index.html · public demo: demo.html · composed app: app.html</span>
                    <span>DME v0.1 · Door One below canon</span>
                </div>
            </div>
        </div>
    );
}
