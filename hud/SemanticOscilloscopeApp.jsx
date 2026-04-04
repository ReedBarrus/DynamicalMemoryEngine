// hud/SemanticOscilloscopeApp.jsx
//
// Semantic Oscilloscope App — composed browser environment
//
// Constitutional posture:
//   - Composition only. This component does not define runtime meaning,
//     request meaning, replay meaning, or canon status.
//   - The execution shell remains the state owner and the only trigger
//     for runtime operations.
//   - Mode switching changes presentation posture, NOT truth conditions.
//   - Provenance remains visually prior to evidence in both modes.
//   - Evidence remains visually prior to interpretation.
//   - Review/request/replay surfaces remain visually downstream.
//   - The tandem adapter is the shared parity seam — not a truth engine.
//   - The lab HUD remains the deeper workbench-native inspection surface.
//   - The demo surface remains read-side and calmer.
//
// Modes:
//   lab  — execution shell primary + lab HUD + tandem summary
//   demo — demo surface primary + collapsed execution + tandem summary
//
// State threading:
//   execution shell → (onStateChange callback) → app state
//   app state → tandem adapter → HUD pane + demo pane
//   execution shell keeps its own internal state; app mirrors key fields
//
// App surface rule (README.SemanticOscilloscopeAppSurface.md):
//   Same source. Same lineage. Same evidence basis.
//   Different audience posture. No hidden truth uplift.

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MetaLayerObjectExecutionShell from "./MetaLayerObjectExecutionShell.jsx";
import MetaLayerConsultationDemo from "./MetaLayerConsultationDemo.jsx";
import DoorOneStructuralMemoryHUD from "./DoorOneStructuralMemoryHud.jsx";
import { projectBoth } from "./adapters/tandemAdapter.js";

// ─── Colors (matches shell palette) ──────────────────────────────────────────
const C = {
    bg: "#0e1117",
    surface: "#161b27",
    surfaceHigh: "#1c2333",
    rule: "#1f2d45",
    ruleLight: "#263449",
    amber: "#f59e0b",
    amberDim: "#92610a",
    amberFaint: "#2a1e06",
    blue: "#3b82f6",
    blueFaint: "#0c1a3a",
    green: "#22c55e",
    text: "#e2e8f0",
    textMid: "#94a3b8",
    textDim: "#475569",
    textMono: "#a8c1e0",
    mono: "'IBM Plex Mono', 'Cascadia Code', monospace",
    sans: "'DM Sans', 'Inter', system-ui, sans-serif",
};

const MODES = [
    { id: "lab", label: "Lab", note: "execution + inspection" },
    { id: "demo", label: "Demo", note: "public / external posture" },
];

// ─── Tandem Summary Bar ───────────────────────────────────────────────────────
// A narrow status bar between surfaces that shows the shared parity projection.
// Read-side only. Not authority. Does not trigger runtime.
function TandemSummaryBar({ tandem }) {
    const hud = tandem?.hud;
    if (!hud?.has_result) return null;
    return (
        <div style={{
            padding: "6px 16px",
            borderTop: `1px solid ${C.rule}`,
            borderBottom: `1px solid ${C.rule}`,
            background: C.surface,
            display: "flex", gap: 24, alignItems: "center",
            flexWrap: "wrap",
            fontFamily: C.mono, fontSize: 10, color: C.textDim,
        }}>
            <span style={{ color: C.amberDim, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                tandem
            </span>
            <span>{hud.provenance.source_family}</span>
            <span>run: {hud.provenance.run_label}</span>
            <span>{hud.provenance.segment_count_label}</span>
            <span>{hud.provenance.cross_run_label !== "no" ? hud.provenance.cross_run_label : "single run"}</span>
            <span style={{ color: C.textDim }}>readiness: {hud.interpretation?.readiness_label ?? "—"}</span>
            <span style={{ color: C.textDim }}>requests: {hud.review_request_replay?.request_count ?? 0}</span>
            <span style={{ color: C.textDim }}>replays: {hud.review_request_replay?.replay_count ?? 0}</span>
            <span style={{ marginLeft: "auto", color: C.amberDim }}>
                same source · both modes · not authority
            </span>
        </div>
    );
}

// ─── Mode Header ──────────────────────────────────────────────────────────────
function ModeHeader({ mode, onMode }) {
    return (
        <div style={{
            padding: "10px 20px",
            borderBottom: `1px solid ${C.rule}`,
            background: C.bg,
            display: "flex", alignItems: "center", gap: 16,
        }}>
            {/* Brand / title */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.amber, boxShadow: `0 0 8px ${C.amber}` }} />
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.amber, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    DME Semantic Oscilloscope
                </span>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 4 }}>
                {MODES.map(m => (
                    <button
                        key={m.id}
                        onClick={() => onMode(m.id)}
                        title={m.note}
                        style={{
                            padding: "4px 14px", borderRadius: 4, cursor: "pointer",
                            border: `1px solid ${mode === m.id ? C.amber : C.rule}`,
                            background: mode === m.id ? C.amberFaint : "transparent",
                            color: mode === m.id ? C.amber : C.textDim,
                            fontFamily: C.mono, fontSize: 11, letterSpacing: "0.08em",
                        }}
                    >{m.label}</button>
                ))}
            </div>

            {/* Mode note */}
            <span style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                {MODES.find(m => m.id === mode)?.note}
            </span>

            {/* Constitution note */}
            <span style={{ fontFamily: C.mono, fontSize: 9, color: C.amberDim }}>
                composed environment · not authority
            </span>
        </div>
    );
}

// ─── Lab HUD Pane ─────────────────────────────────────────────────────────────
// Wraps DoorOneStructuralMemoryHUD with a minimal shell.
// In v0 it uses the workbench from the live shell state when available,
// falling back to null (HUD gracefully shows empty state).

function LabHUDPane({ workbench, crossRunReport }) {
    if (!workbench) {
        return (
            <div style={{
                padding: "24px 20px",
                fontFamily: C.mono, fontSize: 11, color: C.textDim,
                textAlign: "center",
            }}>
                <div style={{ marginBottom: 6, color: C.amberDim }}>lab HUD</div>
                run a source in the execution shell to populate the lab inspection surface
            </div>
        );
    }
    return (
        <DoorOneStructuralMemoryHUD
            workbench={workbench}
            crossRunReport={crossRunReport ?? null}
            c1ConsultationResult={null}
        />
    );
}

// ─── Demo Pane ────────────────────────────────────────────────────────────────
// Wraps MetaLayerConsultationDemo with live shell state when available.
// The hardcoded C1 story always renders below; the live banner shows on top
// when state is present.
function DemoPane({ liveShellState }) {
    return (
        <MetaLayerConsultationDemo liveShellState={liveShellState} />
    );
}

// ─── Main App Component ───────────────────────────────────────────────────────
export default function SemanticOscilloscopeApp() {
    const [mode, setMode] = useState("lab");

    // App-level mirror of key shell state — populated by the shell via callback.
    // Shell remains state owner; app mirrors for read-side surfaces.
    const [shellState, setShellState] = useState({
        workbench: null,
        runResult: null,
        requestLog: [],
        replayLog: [],
        sourceFamilyLabel: "unspecified",
        runStatus: "idle",
    });

    // Tandem projection — derived from mirrored shell state
    const tandem = projectBoth(shellState);

    // Callback for shell to push state updates
    const handleShellStateChange = useCallback((nextState) => {
        console.log("APP shellState update", nextState);
        setShellState(prev => ({ ...prev, ...nextState }));
    }, []);

    // liveShellState for the demo pane (same shape as projectForDemo expects)
    const liveShellStateForDemo = shellState.workbench ? shellState : null;

    return (
        <div style={{
            minHeight: "100vh",
            background: C.bg,
            fontFamily: C.sans,
            display: "flex", flexDirection: "column",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                select { appearance: none; }
                button { border: none; }
            `}</style>

            {/* Mode header */}
            <ModeHeader mode={mode} onMode={setMode} />

            {/* Tandem summary bar — always visible when result exists */}
            <TandemSummaryBar tandem={tandem} />

            {/* Pane layout — changes by mode */}
            <div
                style={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: mode === "lab"
                        ? "minmax(400px, 55fr) minmax(320px, 45fr)"
                        : "minmax(240px, 28fr) minmax(400px, 72fr)",
                    minHeight: 0,
                }}
            >
                {/* Left pane: execution shell — always mounted */}
                <div
                    style={{
                        borderRight: `1px solid ${C.rule}`,
                        overflowY: "auto",
                        minHeight: 0,
                        opacity: mode === "demo" ? 0.75 : 1,
                    }}
                >
                    <div
                        style={{
                            padding: mode === "demo" ? "4px 12px" : "4px 16px",
                            fontFamily: C.mono,
                            fontSize: 9,
                            color: C.textDim,
                            borderBottom: `1px solid ${C.rule}`,
                            background: C.surface,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                        }}
                    >
                        {mode === "lab"
                            ? "Execution Surface · operational · source intake · run control"
                            : "Execution · secondary in demo mode"}
                    </div>

                    <ExecutionShellWithStateExport
                        onStateChange={handleShellStateChange}
                    />
                </div>

                {/* Right pane: lab HUD or demo */}
                <div style={{ overflowY: "auto", minHeight: 0 }}>
                    <div
                        style={{
                            padding: "4px 16px",
                            fontFamily: C.mono,
                            fontSize: 9,
                            color: C.textDim,
                            borderBottom: `1px solid ${C.rule}`,
                            background: C.surface,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                        }}
                    >
                        {mode === "lab"
                            ? "Inspection Surface · read-side · workbench-native · not authority"
                            : "Demo Surface · read-side · calmer · public posture · not authority"}
                    </div>

                    <AnimatePresence mode="wait">
                        {mode === "lab" ? (
                            <motion.div
                                key="lab-pane"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <LabHUDPane
                                    workbench={shellState.workbench}
                                    crossRunReport={null}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="demo-pane"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <DemoPane liveShellState={liveShellStateForDemo} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function ExecutionShellWithStateExport({ onStateChange }) {
    // We inject a callback into the shell via an onStateChange prop.
    // The shell calls this whenever workbench, runResult, requestLog,
    // replayLog, or sourceFamilyLabel change.
    return (
        <MetaLayerObjectExecutionShell
            onStateChange={onStateChange}
        />
    );
}
