import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runAdapter } from "./adapters/ingestAdapters.js";
import { buildStructuralViewerPayload } from "./adapters/structuralViewerPayloadAdapter.js";
import {
    buildActiveShellState,
    publishActiveShellState,
} from "./shellStateRouter.js";
import {
    getStaticSourceOption,
    runStaticShellSource,
    STATIC_SOURCE_OPTIONS,
} from "./staticShellRunner.js";
import StaticSpectralViewer from "./StaticSpectralViewer.jsx";
import ViewerModeShellFrame from "./ViewerModeShellFrame.jsx";

function PlaneButton({ active, label, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "10px 14px",
                borderRadius: "999px",
                border: `1px solid ${active ? "#f59e0b" : "#334155"}`,
                background: active ? "#2b1d08" : "#0f172a",
                color: active ? "#f59e0b" : "#cbd5e1",
                cursor: "pointer",
                fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
            }}
        >
            {label}
        </button>
    );
}

function ControlLabel({ children }) {
    return (
        <div
            style={{
                color: "#64748b",
                fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "8px",
            }}
        >
            {children}
        </div>
    );
}

function SupportRow({ label, value }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: "12px",
                padding: "10px 0",
                borderBottom: "1px solid #243047",
            }}
        >
            <div
                style={{
                    color: "#64748b",
                    fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                }}
            >
                {label}
            </div>
            <div style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.55 }}>
                {value}
            </div>
        </div>
    );
}

function formatRange(range) {
    return Array.isArray(range) && range.length === 2 ? `${range[0]} -> ${range[1]}` : "unbound";
}

function summarizeList(values, fallback) {
    const items = Array.isArray(values) ? values.filter(Boolean) : [];
    return items.length > 0 ? items.join(", ") : fallback;
}

function publishShellState(nextState) {
    return publishActiveShellState(nextState);
}

function buildShellState({
    runId = null,
    runResult = null,
    workbench = null,
    sourceFamilyLabel = "unspecified",
    runStatus = "idle",
    runError = null,
} = {}) {
    return buildActiveShellState({
        runId,
        runResult,
        workbench,
        requestLog: [],
        replayLog: [],
        runHistory: [],
        sourceFamilyLabel,
        runStatus,
        runError,
    });
}

function buildStaticPayload(shellState) {
    return buildStructuralViewerPayload({
        mode: "static",
        runId: shellState?.runId ?? null,
        activeRunLabel: shellState?.activeRunLabel ?? null,
        runResult: shellState?.hasActiveResult ? shellState.runResult : null,
        workbench: shellState?.hasActiveResult ? shellState.workbench : null,
        requestLog: shellState?.requestLog ?? [],
        replayLog: shellState?.replayLog ?? [],
        sourceFamilyLabel: shellState?.sourceFamilyLabel ?? "unspecified",
        runStatus: shellState?.runStatus ?? "idle",
        runError: shellState?.runError ?? null,
        hasActiveResult: shellState?.hasActiveResult ?? false,
        publishedAtMs: shellState?.publishedAtMs ?? null,
        publicationSource: shellState?.publicationSource ?? null,
        viewObservedAtMs: Date.now(),
    });
}

function SupportPlane({
    payload,
    selectedSource,
    pendingFile,
    adapterStatus,
    runStatus,
    runError,
}) {
    const adapterWarnings = summarizeList(adapterStatus?.meta?.warnings, "none");

    return (
        <div
            style={{
                border: "1px solid #334155",
                borderRadius: "18px",
                background: "#0f172a",
                padding: "16px",
            }}
        >
            <SupportRow label="source" value={selectedSource.label} />
            <SupportRow
                label="uploaded file"
                value={pendingFile?.name ?? "none staged"}
            />
            <SupportRow
                label="adapter"
                value={
                    adapterStatus
                        ? adapterStatus.ok
                            ? adapterStatus.meta?.adapter ?? "ready"
                            : summarizeList(adapterStatus.reasons, "adapter failed")
                        : "not staged"
                }
            />
            <SupportRow label="adapter warnings" value={adapterWarnings} />
            <SupportRow label="run status" value={runError ? `${runStatus} | ${runError}` : runStatus} />
            <SupportRow label="active source" value={`${payload.source.source_family} / ${payload.source.source_id}`} />
            <SupportRow label="state basis" value={payload.source.state_basis ?? "unbound"} />
            <SupportRow label="state status" value={payload.source.state_availability ?? "awaiting exported runtime/workbench state"} />
            <SupportRow label="run id" value={payload.source.run_id ?? "unbound"} />
            <SupportRow label="timestamp range" value={formatRange(payload.source.timestamp_range)} />
            <SupportRow label="lineage" value={summarizeList(payload.lineage.generated_from, "generated_from pending")} />
            <SupportRow label="provenance refs" value={summarizeList(payload.lineage.provenance_refs, "none visible")} />
        </div>
    );
}

export default function StaticModeShell({
    shellState = null,
    onGoHome,
    onOpenLegacy,
}) {
    const [selectedSourceId, setSelectedSourceId] = useState(STATIC_SOURCE_OPTIONS[0].id);
    const [activePlane, setActivePlane] = useState("structural");
    const [pendingFile, setPendingFile] = useState(null);
    const [adapterStatus, setAdapterStatus] = useState(null);
    const [activeShellState, setActiveShellState] = useState(() =>
        shellState ?? buildShellState()
    );
    const fileInputRef = useRef(null);

    useEffect(() => {
        setActiveShellState(shellState ?? buildShellState());
    }, [shellState]);

    const selectedSource = useMemo(
        () => getStaticSourceOption(selectedSourceId),
        [selectedSourceId]
    );
    const isUploadSource = selectedSource.kind === "upload";
    const payload = useMemo(
        () => buildStaticPayload(activeShellState),
        [activeShellState]
    );

    const handleFileSelect = useCallback(async (event) => {
        const file = event.target.files?.[0] ?? null;
        setPendingFile(file);
        setAdapterStatus(null);
        if (file) {
            const result = await runAdapter(file);
            setAdapterStatus(result);
        }
        event.target.value = "";
    }, []);

    const handleRun = useCallback(async () => {
        const runId = `app.static.${Date.now()}`;
        const runningState = publishShellState(buildShellState({
            runId,
            sourceFamilyLabel: selectedSource.sourceFamilyLabel,
            runStatus: "running",
        }));
        setActiveShellState(runningState);
        setActivePlane("structural");

        try {
            const result = await runStaticShellSource({
                sourceId: selectedSourceId,
                adapterPayload: adapterStatus?.ok ? adapterStatus.payload : null,
                runLabel: runId,
            });

            const completeState = publishShellState(buildShellState({
                runId,
                runResult: result.runResult,
                workbench: result.workbench,
                sourceFamilyLabel: result.sourceFamilyLabel,
                runStatus: "complete",
            }));
            setActiveShellState(completeState);
        } catch (error) {
            const errorState = publishShellState(buildShellState({
                runId,
                sourceFamilyLabel: selectedSource.sourceFamilyLabel,
                runStatus: "error",
                runError: error.message,
            }));
            setActiveShellState(errorState);
        }
    }, [adapterStatus, selectedSource, selectedSourceId]);

    const runDisabled = activeShellState?.runStatus === "running"
        || (isUploadSource && !adapterStatus?.ok);

    return (
        <ViewerModeShellFrame
            modeLabel="Static"
            modeTitle="Bounded structural mode shell"
            modeNote="Static mode keeps source intake, explicit run, and one active render-plane switch inside the browser shell without mixing semantic or review surfaces into the plane."
            payload={payload}
            onGoHome={onGoHome}
            onOpenLegacy={onOpenLegacy}
            showPayloadPanels={false}
            showRouteActions={false}
        >
            <div style={{ display: "grid", gap: "18px" }}>
                <div
                    style={{
                        display: "grid",
                        gap: "16px",
                        border: "1px solid #334155",
                        borderRadius: "18px",
                        background: "#0f172a",
                        padding: "16px",
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1.2fr) minmax(220px, 0.8fr)",
                            gap: "16px",
                        }}
                    >
                        <div>
                            <ControlLabel>Source Select</ControlLabel>
                            <select
                                value={selectedSourceId}
                                onChange={(event) => setSelectedSourceId(event.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    borderRadius: "12px",
                                    border: "1px solid #334155",
                                    background: "#08111f",
                                    color: "#e2e8f0",
                                    fontSize: "14px",
                                }}
                            >
                                {STATIC_SOURCE_OPTIONS.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <ControlLabel>Route Actions</ControlLabel>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                <button
                                    onClick={onGoHome}
                                    style={{
                                        padding: "12px 14px",
                                        borderRadius: "12px",
                                        border: "1px solid #334155",
                                        background: "#121a2b",
                                        color: "#e2e8f0",
                                        cursor: "pointer",
                                    }}
                                >
                                    Home
                                </button>
                                <button
                                    onClick={onOpenLegacy}
                                    style={{
                                        padding: "12px 14px",
                                        borderRadius: "12px",
                                        border: "1px solid #334155",
                                        background: "#121a2b",
                                        color: "#e2e8f0",
                                        cursor: "pointer",
                                    }}
                                >
                                    Legacy
                                </button>
                            </div>
                        </div>
                    </div>

                    {isUploadSource ? (
                        <div>
                            <ControlLabel>Upload Source</ControlLabel>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,.csv,.wav"
                                    onChange={handleFileSelect}
                                    style={{ display: "none" }}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        padding: "12px 14px",
                                        borderRadius: "12px",
                                        border: "1px solid #334155",
                                        background: "#08111f",
                                        color: "#e2e8f0",
                                        cursor: "pointer",
                                    }}
                                >
                                    Choose File
                                </button>
                                <div style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.5 }}>
                                    {pendingFile?.name ?? "No file staged"}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "16px",
                            flexWrap: "wrap",
                            alignItems: "end",
                        }}
                    >
                        <div>
                            <ControlLabel>Active Render Plane</ControlLabel>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                <PlaneButton
                                    active={activePlane === "structural"}
                                    label="Structural Plane"
                                    onClick={() => setActivePlane("structural")}
                                />
                                <PlaneButton
                                    active={activePlane === "support"}
                                    label="Support Plane"
                                    onClick={() => setActivePlane("support")}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleRun}
                            disabled={runDisabled}
                            style={{
                                padding: "12px 18px",
                                borderRadius: "12px",
                                border: `1px solid ${runDisabled ? "#334155" : "#f59e0b"}`,
                                background: runDisabled ? "#0f172a" : "#2b1d08",
                                color: runDisabled ? "#64748b" : "#f59e0b",
                                cursor: runDisabled ? "not-allowed" : "pointer",
                                fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                                fontSize: "11px",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            Explicit Run
                        </button>
                    </div>
                </div>

                {activePlane === "structural" ? (
                    <div
                        data-render-plane="structural"
                        style={{
                            minHeight: "420px",
                            borderRadius: "20px",
                            border: "1px solid #243047",
                            background: "#050b14",
                            padding: "16px",
                            display: "grid",
                            alignItems: "center",
                        }}
                    >
                        <StaticSpectralViewer payload={payload} />
                    </div>
                ) : (
                    <div data-render-plane="support">
                        <SupportPlane
                            payload={payload}
                            selectedSource={selectedSource}
                            pendingFile={pendingFile}
                            adapterStatus={adapterStatus}
                            runStatus={activeShellState?.runStatus ?? "idle"}
                            runError={activeShellState?.runError ?? null}
                        />
                    </div>
                )}
            </div>
        </ViewerModeShellFrame>
    );
}
