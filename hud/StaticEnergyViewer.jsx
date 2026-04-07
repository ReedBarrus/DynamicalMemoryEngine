function MetricPill({ label, value }) {
    return (
        <div
            style={{
                display: "grid",
                gap: "4px",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1px solid #334155",
                background: "#0f1714",
                minWidth: "120px",
            }}
        >
            <div
                style={{
                    color: "#6b7280",
                    fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                }}
            >
                {label}
            </div>
            <div style={{ color: "#f8fafc", fontSize: "13px", lineHeight: 1.4 }}>
                {value}
            </div>
        </div>
    );
}

function clamp01(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function formatRange(start, end) {
    if (!Number.isFinite(start) || !Number.isFinite(end)) return "unbound";
    return `${start} -> ${end}`;
}

function summarizeList(values, fallback) {
    const items = Array.isArray(values) ? values.filter(Boolean) : [];
    return items.length > 0 ? items.join(", ") : fallback;
}

function formatNumber(value) {
    return Number.isFinite(value) ? `${Math.round(value * 1000) / 1000}` : "unbound";
}

function slotContainsFrame(slot, frame) {
    const slotStart = Number.isFinite(slot?.t_start) ? slot.t_start : null;
    const slotEnd = Number.isFinite(slot?.t_end) ? slot.t_end : null;
    const frameStart = Number.isFinite(frame?.t_start) ? frame.t_start : null;
    const frameEnd = Number.isFinite(frame?.t_end) ? frame.t_end : null;

    if (slotStart === null || slotEnd === null || frameStart === null || frameEnd === null) return false;
    return frameEnd > slotStart && frameStart < slotEnd;
}

function EnergyPlot({ frames, maxEnergyValue, maxAmplitude, compact = false }) {
    const chartWidth = compact ? 240 : 720;
    const chartHeight = compact ? 150 : 230;
    const leftGutter = compact ? 38 : 56;
    const rightGutter = compact ? 12 : 20;
    const topGutter = compact ? 12 : 16;
    const bottomGutter = compact ? 24 : 34;
    const plotWidth = chartWidth - leftGutter - rightGutter;
    const plotHeight = chartHeight - topGutter - bottomGutter;
    const barStep = frames.length > 1 ? plotWidth / frames.length : plotWidth;
    const barWidth = Math.max(compact ? 12 : 18, barStep * (compact ? 0.55 : 0.62));
    const energyAreaPoints = frames.map((frame, index) => {
        const value = frame.energy_raw ?? frame.energy_norm ?? 0;
        const x = leftGutter + index * barStep + barStep * 0.5;
        const y = topGutter + plotHeight - clamp01(value / maxEnergyValue) * plotHeight;
        return `${x},${y}`;
    });
    const energyAreaPath = [
        `M ${leftGutter},${topGutter + plotHeight}`,
        ...energyAreaPoints.map((point) => `L ${point}`),
        `L ${leftGutter + plotWidth},${topGutter + plotHeight}`,
        "Z",
    ].join(" ");
    const amplitudePath = frames.map((frame, index) => {
        const value = frame.amplitude_estimate ?? 0;
        const x = leftGutter + index * barStep + barStep * 0.5;
        const y = topGutter + plotHeight - clamp01(value / maxAmplitude) * plotHeight;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");

    return (
        <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{
                display: "block",
                width: "100%",
                minWidth: `${chartWidth}px`,
                height: "auto",
            }}
        >
            <rect x="0" y="0" width={chartWidth} height={chartHeight} fill={compact ? "#0d1a15" : "#08150f"} rx="16" />

            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = topGutter + plotHeight - ratio * plotHeight;
                return (
                    <g key={`guide-${ratio}`}>
                        <line
                            x1={leftGutter}
                            x2={leftGutter + plotWidth}
                            y1={y}
                            y2={y}
                            stroke="#17352b"
                            strokeWidth="1"
                        />
                        <text
                            x={leftGutter - 8}
                            y={y + 4}
                            textAnchor="end"
                            fill="#6b7280"
                            fontSize={compact ? "8" : "10"}
                            fontFamily="'IBM Plex Mono', 'Cascadia Code', monospace"
                        >
                            {formatNumber(maxEnergyValue * ratio)}
                        </text>
                    </g>
                );
            })}

            <path d={energyAreaPath} fill="rgba(52, 211, 153, 0.18)" stroke="none" />
            <path d={amplitudePath} fill="none" stroke="#fbbf24" strokeWidth={compact ? "2" : "2.5"} />

            {frames.map((frame, index) => {
                const energyValue = frame.energy_raw ?? frame.energy_norm ?? 0;
                const amplitudeValue = frame.amplitude_estimate ?? 0;
                const x = leftGutter + index * barStep + barStep * 0.5;
                const barHeight = clamp01(energyValue / maxEnergyValue) * plotHeight;
                const barY = topGutter + plotHeight - barHeight;
                const amplitudeY = topGutter + plotHeight - clamp01(amplitudeValue / maxAmplitude) * plotHeight;

                return (
                    <g key={frame.state_id}>
                        <rect
                            x={x - barWidth * 0.5}
                            y={barY}
                            width={barWidth}
                            height={barHeight}
                            rx="6"
                            fill="rgba(52, 211, 153, 0.62)"
                            stroke="#34d399"
                            strokeWidth="1"
                        />
                        <circle cx={x} cy={amplitudeY} r={compact ? "3" : "4"} fill="#fbbf24" />
                        <text
                            x={x}
                            y={chartHeight - 12}
                            textAnchor="middle"
                            fill="#6b7280"
                            fontSize={compact ? "8" : "9"}
                            fontFamily="'IBM Plex Mono', 'Cascadia Code', monospace"
                        >
                            {formatRange(frame.t_start, frame.t_end)}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

function EvidenceSlotPanel({ label, frames, maxEnergyValue, maxAmplitude }) {
    return (
        <div
            style={{
                display: "grid",
                gap: "8px",
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid #1f3b32",
                background: "#0d1a15",
            }}
        >
            <div
                style={{
                    color: "#f8fafc",
                    fontSize: "12px",
                    fontWeight: 600,
                }}
            >
                {label}
            </div>
            <div style={{ overflowX: "auto" }}>
                <EnergyPlot
                    frames={frames}
                    maxEnergyValue={maxEnergyValue}
                    maxAmplitude={maxAmplitude}
                    compact
                />
            </div>
        </div>
    );
}

export default function StaticEnergyViewer({ payload }) {
    const energy = payload?.structural?.energy;
    const evidenceWindows = payload?.structural?.evidence_windows;
    const source = payload?.source ?? {};
    const lineage = payload?.lineage ?? {};
    const stateAvailability =
        source.state_availability ?? "awaiting exported runtime/workbench state";

    if (!energy || !Array.isArray(energy.frames) || energy.frames.length === 0) {
        return (
            <div
                style={{
                    display: "grid",
                    gap: "10px",
                    padding: "16px",
                    borderRadius: "16px",
                    border: "1px solid #334155",
                    background: "linear-gradient(145deg, #0f172a 0%, #0f1714 100%)",
                }}
            >
                <div
                    style={{
                        color: "#34d399",
                        fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                        fontSize: "11px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                    }}
                >
                    Static Energy Viewer
                </div>
                <div style={{ color: "#f8fafc", fontSize: "17px", fontWeight: 600 }}>
                    Bounded energy / amplitude object
                </div>
                <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>
                    No energy-capable structural frames are currently visible through the shared payload seam.
                    Fallback remains explicit until bounded energy or amplitude support is available.
                </div>
                <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5 }}>
                    Current state posture: {stateAvailability}
                </div>
            </div>
        );
    }

    const frames = energy.frames;
    const maxEnergyValue = Number.isFinite(energy.max_energy_value) && energy.max_energy_value > 0
        ? energy.max_energy_value
        : 1;
    const maxAmplitude = Number.isFinite(energy.max_amplitude_estimate) && energy.max_amplitude_estimate > 0
        ? energy.max_amplitude_estimate
        : 1;
    const slotPanels = Array.isArray(evidenceWindows?.slots)
        ? evidenceWindows.slots
            .map((slot) => ({
                label: slot.label,
                frames: frames.filter((frame) => slotContainsFrame(slot, frame)),
            }))
            .filter((slot) => slot.frames.length > 0)
        : [];

    return (
        <div
            style={{
                display: "grid",
                gap: "12px",
                padding: "14px",
                borderRadius: "18px",
                border: "1px solid #334155",
                background: "linear-gradient(165deg, #08150f 0%, #0f172a 58%, #10231b 100%)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                }}
            >
                <div style={{ display: "grid", gap: "4px" }}>
                    <div
                        style={{
                            color: "#34d399",
                            fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
                            fontSize: "11px",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                        }}
                    >
                        Static Energy Viewer
                    </div>
                    <div style={{ color: "#f8fafc", fontSize: "16px", fontWeight: 600 }}>
                        Bounded energy / amplitude object
                    </div>
                </div>
                <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5, maxWidth: "460px" }}>
                    Envelope and amplitude shape remain structural only. No Live timing posture or semantic closure.
                </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <MetricPill label="frames" value={frames.length} />
                <MetricPill label="peak energy" value={formatNumber(energy.max_energy_value)} />
                <MetricPill label="peak amplitude" value={formatNumber(energy.max_amplitude_estimate)} />
                <MetricPill label="source" value={source.source_id ?? "unbound"} />
            </div>

            <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5 }}>
                Baseline / Perturbation / Return panels appear only when anomaly-window timing and shared energy frames support a lawful comparison triptych.
            </div>

            <div
                style={{
                    borderRadius: "14px",
                    border: "1px solid #1f3b32",
                    background: "#08150f",
                    padding: "10px",
                    overflowX: "auto",
                }}
            >
                <EnergyPlot
                    frames={frames}
                    maxEnergyValue={maxEnergyValue}
                    maxAmplitude={maxAmplitude}
                />
            </div>

            {slotPanels.length === 3 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
                    {slotPanels.map((slot) => (
                        <EvidenceSlotPanel
                            key={slot.label}
                            label={slot.label}
                            frames={slot.frames}
                            maxEnergyValue={maxEnergyValue}
                            maxAmplitude={maxAmplitude}
                        />
                    ))}
                </div>
            ) : null}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                    color: "#94a3b8",
                    fontSize: "12px",
                    lineHeight: 1.5,
                }}
            >
                <div>Source: {source.source_family ?? "unbound"} / {source.source_id ?? "unbound"}</div>
                <div>Lineage: {summarizeList(lineage.generated_from, "generated_from pending")}</div>
                <div>State availability: {stateAvailability}</div>
            </div>
        </div>
    );
}
