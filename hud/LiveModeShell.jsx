import ViewerModeShellFrame from "./ViewerModeShellFrame.jsx";
import LiveContinuousStructuralViewer from "./LiveContinuousStructuralViewer.jsx";

function SignalCard({ title, note }) {
    return (
        <div
            style={{
                border: "1px solid #334155",
                borderRadius: "14px",
                padding: "14px",
                background: "#111827",
            }}
        >
            <div style={{ color: "#e2e8f0", fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>
                {title}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.5 }}>
                {note}
            </div>
        </div>
    );
}

function TelemetryChip({ label, value, tone = "#60a5fa" }) {
    return (
        <div
            style={{
                display: "grid",
                gap: "4px",
                minWidth: "140px",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1px solid #334155",
                background: "#0b1220",
            }}
        >
            <div
                style={{
                    color: "#64748b",
                    fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                }}
            >
                {label}
            </div>
            <div style={{ color: tone, fontSize: "13px", lineHeight: 1.4 }}>
                {value}
            </div>
        </div>
    );
}

function formatTimestamp(value) {
    if (!Number.isFinite(value)) return null;
    return new Date(value).toLocaleTimeString();
}

function formatMs(value) {
    return Number.isFinite(value) ? `${Math.round(value)} ms` : null;
}

function formatSourceWindow(windowRange) {
    if (!windowRange || typeof windowRange !== "object") return null;
    if (!Number.isFinite(windowRange.t_start) || !Number.isFinite(windowRange.t_end)) return null;
    return `${windowRange.t_start} -> ${windowRange.t_end}`;
}

function LiveTelemetryRail({ telemetry }) {
    const chips = [
        { label: "rail status", value: telemetry?.rail_status },
        { label: "run status", value: telemetry?.run_status },
        { label: "active run", value: telemetry?.active_run_label ?? telemetry?.run_id },
        { label: "shell export", value: telemetry?.publication_source },
        { label: "published at", value: formatTimestamp(telemetry?.published_at_ms) },
        { label: "export age", value: formatMs(telemetry?.export_age_ms) },
        { label: "source window", value: formatSourceWindow(telemetry?.source_window) },
    ].filter((item) => item.value);

    const missingMetrics = Array.isArray(telemetry?.unavailable_fields) ? telemetry.unavailable_fields : [];

    return (
        <div
            style={{
                display: "grid",
                gap: "12px",
                padding: "14px",
                borderRadius: "16px",
                border: "1px solid #334155",
                background: "#0b1220",
            }}
        >
            <div style={{ display: "grid", gap: "6px" }}>
                <div
                    style={{
                        color: "#60a5fa",
                        fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                        fontSize: "11px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                    }}
                >
                    Live Telemetry Rail
                </div>
                <div style={{ color: "#e2e8f0", fontSize: "15px", fontWeight: 600 }}>
                    Runtime/view timing posture
                </div>
                <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.55 }}>
                    {telemetry?.visibility_note}
                </div>
            </div>

            {chips.length > 0 ? (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {chips.map((chip) => (
                        <TelemetryChip
                            key={chip.label}
                            label={chip.label}
                            value={chip.value}
                        />
                    ))}
                </div>
            ) : null}

            <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5 }}>
                {telemetry?.availability_note}
            </div>

            {missingMetrics.length > 0 ? (
                <div style={{ color: "#64748b", fontSize: "11px", lineHeight: 1.5 }}>
                    Unwired metrics:
                    {" "}
                    {missingMetrics.join(", ")}
                </div>
            ) : null}
        </div>
    );
}

export default function LiveModeShell({ payload, onGoHome, onOpenLegacy }) {
    return (
        <ViewerModeShellFrame
            modeLabel="Live"
            modeTitle="Runtime-facing mode shell"
            modeNote="Live mode is timing-aware and runtime-facing. This shell now exposes a bounded telemetry rail while keeping telemetry secondary to a real continuous structural surface."
            payload={payload}
            onGoHome={onGoHome}
            onOpenLegacy={onOpenLegacy}
        >
            <div
                style={{
                    display: "grid",
                    gap: "14px",
                }}
            >
                <LiveTelemetryRail telemetry={payload.telemetry} />

                <LiveContinuousStructuralViewer payload={payload} />

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: "14px",
                    }}
                >
                <SignalCard
                    title="Live identity"
                    note="Use this shell for runtime-facing viewing. Motion and pacing belong here, and the continuous surface now projects shared structural windows without creating a second truth seam."
                />
                <SignalCard
                    title="Telemetry honesty"
                    note="Telemetry now has a bounded rail in Live mode only. It stays operational and secondary rather than turning into a dense dashboard or replacing the structural face."
                />
                <SignalCard
                    title="Structural priority"
                    note="The shared structural payload remains primary. The frequency-time surface reads H1 structure directly and does not imply settlement, identity continuity, or semantic closure."
                />
                </div>
            </div>
        </ViewerModeShellFrame>
    );
}
