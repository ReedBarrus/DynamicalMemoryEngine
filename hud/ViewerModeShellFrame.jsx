function ShellCard({ eyebrow, title, note, children }) {
    return (
        <div
            style={{
                border: "1px solid #334155",
                borderRadius: "16px",
                background: "#0f172a",
                padding: "16px",
            }}
        >
            {eyebrow ? (
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
                    {eyebrow}
                </div>
            ) : null}
            <div style={{ color: "#e2e8f0", fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
                {title}
            </div>
            {note ? (
                <div style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.55, marginBottom: "12px" }}>
                    {note}
                </div>
            ) : null}
            {children}
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "150px 1fr",
                gap: "10px",
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

function summarizeKeys(value, fallback) {
    const keys = Object.keys(value ?? {});
    return keys.length > 0 ? keys.join(", ") : fallback;
}

function summarizeList(values, fallback) {
    const items = Array.isArray(values) ? values.filter(Boolean) : [];
    return items.length > 0 ? items.join(", ") : fallback;
}

function summarizeTimestampRange(range) {
    return Array.isArray(range) && range.length === 2 ? `${range[0]} -> ${range[1]}` : "unbound";
}

export default function ViewerModeShellFrame({
    modeLabel,
    modeTitle,
    modeNote,
    payload,
    onGoHome,
    onOpenLegacy,
    children,
}) {
    return (
        <div style={{ display: "grid", gap: "18px" }}>
            <ShellCard
                eyebrow={`${modeLabel} Mode Shell`}
                title={modeTitle}
                note={modeNote}
            >
                {children}
            </ShellCard>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 0.9fr",
                    gap: "18px",
                    alignItems: "start",
                }}
            >
                <ShellCard
                    eyebrow="Shared Payload"
                    title="Source, lineage, and structural base"
                    note="All mode shells consume the same shared payload seam. Mode changes posture, not truth source."
                >
                    <DetailRow label="route path" value={`/${payload.mode}`} />
                    <DetailRow label="source" value={`${payload.source.source_family} / ${payload.source.source_id}`} />
                    <DetailRow label="state basis" value={payload.source.state_basis ?? "unbound"} />
                    <DetailRow label="state status" value={payload.source.state_availability ?? "awaiting exported runtime/workbench state"} />
                    <DetailRow label="run id" value={payload.source.run_id ?? "unbound"} />
                    <DetailRow label="segment id" value={payload.source.segment_id ?? "unbound"} />
                    <DetailRow label="timestamp range" value={summarizeTimestampRange(payload.source.timestamp_range)} />
                    <DetailRow label="lineage" value={summarizeList(payload.lineage.generated_from, "generated_from pending")} />
                    <DetailRow label="provenance refs" value={summarizeList(payload.lineage.provenance_refs, "none visible")} />
                    <DetailRow label="structural sections" value={summarizeKeys(payload.structural, "structural payload present with no active sections yet")} />
                </ShellCard>

                <ShellCard
                    eyebrow="Optional Layers"
                    title="Overlay and telemetry posture"
                    note="Overlays remain optional and subordinate. Telemetry belongs only where mode posture lawfully requires it."
                >
                    <DetailRow label="overlays" value={summarizeKeys(payload.overlays, "optional and currently absent")} />
                    <DetailRow
                        label="telemetry"
                        value={
                            payload.telemetry?.placeholder_status ??
                            (payload.telemetry ? "telemetry attached" : "not required for this mode")
                        }
                    />
                    <DetailRow
                        label="non-claims"
                        value={summarizeList(payload.lineage.explicit_non_claims, "none declared")}
                    />
                </ShellCard>
            </div>

            <ShellCard
                eyebrow="Route Actions"
                title="Next lawful move"
                note="These shells stay shallow so later viewer packets can grow inside them without changing the shared payload seam."
            >
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                        onClick={onGoHome}
                        style={{
                            padding: "10px 14px",
                            borderRadius: "12px",
                            border: "1px solid #334155",
                            background: "#121a2b",
                            color: "#e2e8f0",
                            cursor: "pointer",
                        }}
                    >
                        Return to home shell
                    </button>
                    <button
                        onClick={onOpenLegacy}
                        style={{
                            padding: "10px 14px",
                            borderRadius: "12px",
                            border: "1px solid #334155",
                            background: "#121a2b",
                            color: "#e2e8f0",
                            cursor: "pointer",
                        }}
                    >
                        Open transitional legacy route
                    </button>
                </div>
            </ShellCard>
        </div>
    );
}
