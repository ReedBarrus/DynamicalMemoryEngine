function MetricPill({ label, value }) {
    return (
        <div
            style={{
                display: "grid",
                gap: "4px",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1px solid #334155",
                background: "#16120d",
                minWidth: "120px",
            }}
        >
            <div
                style={{
                    color: "#78716c",
                    fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                }}
            >
                {label}
            </div>
            <div style={{ color: "#f1f5f9", fontSize: "13px", lineHeight: 1.4 }}>
                {value}
            </div>
        </div>
    );
}

function clamp01(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function toCellColor(value) {
    const normalized = clamp01(value);
    const hue = 34 - normalized * 18;
    const saturation = 58 + normalized * 12;
    const lightness = 14 + normalized * 46;
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function formatBandLabel(spectral, bandIndex) {
    const edges = Array.isArray(spectral?.band_edges) ? spectral.band_edges : [];
    if (edges.length >= bandIndex + 2) {
        return `${edges[bandIndex]}-${edges[bandIndex + 1]}`;
    }
    return `band ${bandIndex}`;
}

function formatRange(start, end) {
    if (!Number.isFinite(start) || !Number.isFinite(end)) return "unbound";
    return `${start} -> ${end}`;
}

function summarizeList(values, fallback) {
    const items = Array.isArray(values) ? values.filter(Boolean) : [];
    return items.length > 0 ? items.join(", ") : fallback;
}

export default function StaticSpectralViewer({ payload }) {
    const spectral = payload?.structural?.spectral;
    const source = payload?.source ?? {};
    const lineage = payload?.lineage ?? {};
    const stateAvailability =
        source.state_availability ?? "awaiting exported runtime/workbench state";

    if (!spectral || !Array.isArray(spectral.frames) || spectral.frames.length === 0) {
        return (
            <div
                style={{
                    display: "grid",
                    gap: "10px",
                    padding: "16px",
                    borderRadius: "16px",
                    border: "1px solid #334155",
                    background: "linear-gradient(145deg, #1c1917 0%, #111827 100%)",
                }}
            >
                <div
                    style={{
                        color: "#f59e0b",
                        fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                        fontSize: "11px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                    }}
                >
                    Static Spectral Viewer
                </div>
                <div style={{ color: "#f8fafc", fontSize: "17px", fontWeight: 600 }}>
                    Bounded frequency-time object
                </div>
                <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>
                    No bounded spectral frames are currently visible through the shared structural payload seam.
                    Fallback remains explicit until a static or exported spectral object is available for inspection.
                </div>
                <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5 }}>
                    Current state posture: {stateAvailability}
                </div>
            </div>
        );
    }

    const frames = spectral.frames;
    const bandCount = Math.max(1, spectral.band_count ?? 1);
    const frameCount = frames.length;
    const cellWidth = 52;
    const cellHeight = 24;
    const plotWidth = frameCount * cellWidth;
    const plotHeight = bandCount * cellHeight;
    const leftGutter = 72;
    const topGutter = 26;
    const rightGutter = 18;
    const bottomGutter = 34;
    const viewBoxWidth = leftGutter + plotWidth + rightGutter;
    const viewBoxHeight = topGutter + plotHeight + bottomGutter;
    const maxBandEnergy = Number.isFinite(spectral.max_band_energy) ? spectral.max_band_energy : 1;

    return (
        <div
            style={{
                display: "grid",
                gap: "14px",
                padding: "16px",
                borderRadius: "18px",
                border: "1px solid #334155",
                background: "linear-gradient(160deg, #1c1917 0%, #172033 58%, #0f172a 100%)",
            }}
        >
            <div style={{ display: "grid", gap: "6px" }}>
                <div
                    style={{
                        color: "#f59e0b",
                        fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                        fontSize: "11px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                    }}
                >
                    Static Spectral Viewer
                </div>
                <div style={{ color: "#f8fafc", fontSize: "18px", fontWeight: 600 }}>
                    Bounded frequency-time object
                </div>
                <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>
                    This surface projects shared H1 band-profile windows as a bounded inspectable object.
                    It is provenance-forward, non-live, and does not imply settlement, identity continuity, or semantic closure.
                </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <MetricPill label="frames" value={frameCount} />
                <MetricPill label="bands" value={bandCount} />
                <MetricPill label="source" value={source.source_id ?? "unbound"} />
                <MetricPill
                    label="provenance refs"
                    value={Array.isArray(lineage.provenance_refs) ? lineage.provenance_refs.length : 0}
                />
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.5fr) minmax(240px, 0.9fr)",
                    gap: "16px",
                    alignItems: "start",
                }}
            >
                <div
                    style={{
                        borderRadius: "14px",
                        border: "1px solid #312e2b",
                        background: "#15110c",
                        padding: "12px",
                        overflowX: "auto",
                    }}
                >
                    <svg
                        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                        style={{
                            display: "block",
                            width: "100%",
                            minWidth: `${viewBoxWidth}px`,
                            height: "auto",
                        }}
                    >
                        <rect
                            x="0"
                            y="0"
                            width={viewBoxWidth}
                            height={viewBoxHeight}
                            fill="#15110c"
                            rx="16"
                        />

                        {Array.from({ length: bandCount }, (_, bandIndex) => {
                            const y = topGutter + (bandCount - bandIndex - 1) * cellHeight;
                            return (
                                <g key={`row-${bandIndex}`}>
                                    <text
                                        x={leftGutter - 8}
                                        y={y + cellHeight * 0.66}
                                        textAnchor="end"
                                        fill="#78716c"
                                        fontSize="10"
                                        fontFamily="'IBM Plex Mono', 'Cascadia Code', monospace"
                                    >
                                        {formatBandLabel(spectral, bandIndex)}
                                    </text>
                                    <line
                                        x1={leftGutter}
                                        x2={leftGutter + plotWidth}
                                        y1={y}
                                        y2={y}
                                        stroke="#292524"
                                        strokeWidth="1"
                                    />
                                </g>
                            );
                        })}

                        {frames.map((frame, frameIndex) => {
                            const x = leftGutter + frameIndex * cellWidth;
                            return (
                                <g key={frame.state_id}>
                                    {Array.from({ length: bandCount }, (_, bandIndex) => {
                                        const energy = frame.band_energy[bandIndex] ?? 0;
                                        const y = topGutter + (bandCount - bandIndex - 1) * cellHeight;
                                        return (
                                            <rect
                                                key={`${frame.state_id}-${bandIndex}`}
                                                x={x + 2}
                                                y={y + 2}
                                                width={cellWidth - 4}
                                                height={cellHeight - 4}
                                                rx="5"
                                                fill={toCellColor(energy / maxBandEnergy)}
                                                stroke="#0f172a"
                                                strokeWidth="1"
                                            />
                                        );
                                    })}
                                    <text
                                        x={x + cellWidth * 0.5}
                                        y={viewBoxHeight - 12}
                                        textAnchor="middle"
                                        fill="#78716c"
                                        fontSize="9"
                                        fontFamily="'IBM Plex Mono', 'Cascadia Code', monospace"
                                    >
                                        {formatRange(frame.t_start, frame.t_end)}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                <div
                    style={{
                        display: "grid",
                        gap: "10px",
                        padding: "12px",
                        borderRadius: "14px",
                        border: "1px solid #312e2b",
                        background: "#16120d",
                    }}
                >
                    <div style={{ color: "#f8fafc", fontSize: "15px", fontWeight: 600 }}>
                        Static reading notes
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>
                        Static mode is bounded and inspectable. The grid shows shared structural frames without Live timing pressure or a telemetry rail.
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>
                        Source: {source.source_family ?? "unbound"} / {source.source_id ?? "unbound"}.
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>
                        Lineage: {summarizeList(lineage.generated_from, "generated_from pending")}.
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>
                        State availability: {stateAvailability}.
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5 }}>
                        Replay and reconstruction remain distinct when they appear. Overlays may attach later,
                        but this static view stays structurally primary even with overlays absent.
                    </div>
                </div>
            </div>
        </div>
    );
}
