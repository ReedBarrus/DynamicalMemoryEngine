import React, { useEffect, useMemo, useState } from "react";
import {
    Activity,
    GitBranch,
    Network,
    Repeat,
    Waves,
    AlertTriangle,
    TimerReset,
    Eye,
} from "lucide-react";
import {
    shortId,
    workbenchToStructuralHudModel,
} from "./DoorOneStructuralMemoryHudModel.js";
// --- Minimal UI wrappers (replace shadcn components) ---

function Card({ children, className = "" }) {
    return (
        <div
            className={className}
            style={{
                border: "1px solid #243047",
                background: "#121a2b",
                borderRadius: "16px",
                padding: "16px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
            }}
        >
            {children}
        </div>
    );
}


function CardHeader({ children }) {
    return <div style={{ marginBottom: "12px" }}>{children}</div>;
}

function CardTitle({ children }) {
    return (
        <h3
            style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                color: "#f8fafc",
            }}
        >
            {children}
        </h3>
    );
}

function CardContent({ children }) {
    return <div style={{ fontSize: "14px", color: "#dbe4f0" }}>{children}</div>;
}

function Badge({ children }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 10px",
                borderRadius: "999px",
                border: "1px solid #334155",
                background: "#182235",
                color: "#dbe4f0",
                fontSize: "12px",
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </span>
    );
}

function Input(props) {
    return (
        <input
            {...props}
            style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#e2e8f0",
                outline: "none",
            }}
        />
    );
}

function Button({ children, ...props }) {
    return (
        <button
            {...props}
            style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #334155",
                background: "#1e293b",
                color: "#e2e8f0",
            }}
        >
            {children}
        </button>
    );
}

function cn(...parts) {
    return parts.filter(Boolean).join(" ");
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function StatCard({ icon: Icon, label, value, sub, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{ cursor: onClick ? "pointer" : "default" }}
        >
            <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                {label}
                            </div>
                            <div className="mt-1 text-2xl font-semibold">{value}</div>
                            {sub ? (
                                <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
                            ) : null}
                        </div>
                        <div className="rounded-2xl border p-2 text-muted-foreground">
                            <Icon className="h-4 w-4" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function SectionShell({ eyebrow, title, note, children }) {
    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <div className="space-y-1">
                    {eyebrow ? (
                        <div
                            style={{
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.14em",
                                color: "#94a3b8",
                            }}
                        >
                            {eyebrow}
                        </div>
                    ) : null}
                    <CardTitle>{title}</CardTitle>
                    {note ? (
                        <div style={{ fontSize: "13px", color: "#94a3b8" }}>{note}</div>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function DetailRow({ label, value }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: "10px",
                padding: "8px 0",
                borderBottom: "1px solid #243047",
            }}
        >
            <div
                style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#94a3b8",
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: "13px",
                    color: "#e2e8f0",
                    wordBreak: "break-word",
                }}
            >
                {Array.isArray(value)
                    ? value.length
                        ? value.join(", ")
                        : "—"
                    : value == null || value === ""
                        ? "—"
                        : String(value)}
            </div>
        </div>
    );
}

function EvidenceDetailPanel({ detail }) {
    if (!detail) {
        return (
            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Evidence Detail</CardTitle>
                </CardHeader>
                <CardContent>
                    <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                        Select a provenance card, runtime stat, segment boundary, interpretation label,
                        or review card to inspect bounded evidence detail.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <div className="space-y-1">
                    <div
                        style={{
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.14em",
                            color: "#94a3b8",
                        }}
                    >
                        Evidence Detail
                    </div>
                    <CardTitle className="text-base">{detail.title ?? "Selection"}</CardTitle>
                    {detail.note ? (
                        <div style={{ fontSize: "13px", color: "#94a3b8" }}>{detail.note}</div>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent>
                <div
                    style={{
                        border: "1px solid #243047",
                        borderRadius: "12px",
                        padding: "10px 12px",
                        background: "#0f172a",
                    }}
                >
                    {Object.entries(detail.fields ?? {}).map(([k, v]) => (
                        <DetailRow key={k} label={k.replaceAll("_", " ")} value={v} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function LabelBadge({ label }) {
    const text = String(label ?? "unknown");
    const tone =
        text === "high"
            ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
            : text === "medium" || text === "developing" || text === "recurrent"
                ? "bg-amber-500/10 text-amber-700 border-amber-200"
                : text === "low" ||
                    text === "defer" ||
                    text === "fragmented" ||
                    text === "diffuse"
                    ? "bg-rose-500/10 text-rose-700 border-rose-200"
                    : "bg-slate-500/10 text-slate-700 border-slate-200";

    return (
        <Badge variant="outline" className={cn("capitalize rounded-xl", tone)}>
            {text.replaceAll("_", " ")}
        </Badge>
    );
}

function formatPercent(value) {
    const numeric = Number(value ?? 0);
    return `${Math.round(numeric * 100)}%`;
}

function buildBoundedNeighborhoodDetail(data) {
    return {
        title: "Evidence Detail - Bounded neighborhood availability",
        note: "No structural-neighborhood evidence is available for the current run context.",
        fields: {
            detail_status: "bounded_insufficient",
            neighborhoods_observed: data?.neighborhoods?.length ?? 0,
            transitions_observed: data?.transitions?.length ?? 0,
            segment_boundary_events: data?.runtime_evidence?.segment_boundary_events ?? 0,
            current_neighborhood_id: data?.runtime_evidence?.current_neighborhood_id,
        },
    };
}

function buildNeighborhoodDetail(neighborhood, data) {
    if (!neighborhood) {
        return buildBoundedNeighborhoodDetail(data);
    }

    return {
        title: `Runtime Evidence - Neighborhood ${shortId(neighborhood.id)}`,
        note: "Plane 2 structural-neighborhood evidence. Read-side only.",
        fields: {
            projected_id: neighborhood.id,
            current: neighborhood.current,
            dwell_frames: neighborhood.dwellFrames,
            dwell_sec: neighborhood.dwellSec,
            re_entries: neighborhood.reEntries,
            activity: Number(neighborhood.activity || 0).toFixed(3),
            total_re_entries: data?.runtime_evidence?.total_re_entries ?? 0,
            dominant_dwell_share: formatPercent(data?.runtime_evidence?.dominant_dwell_share ?? 0),
            current_neighborhood_id: data?.runtime_evidence?.current_neighborhood_id,
            raw_neighborhood_label: neighborhood.evidence?.neighborhood_label,
            raw_label: neighborhood.evidence?.label,
            raw_neighborhood_name: neighborhood.evidence?.neighborhood_name,
            raw_name: neighborhood.evidence?.name,
            raw_neighborhood_id: neighborhood.evidence?.neighborhood_id,
            raw_basin_id: neighborhood.evidence?.basin_id,
            raw_id: neighborhood.evidence?.id,
        },
    };
}

function buildFocusedNeighborhoodDetail(data, focusId) {
    const neighborhoods = safeArray(data?.neighborhoods);
    if (neighborhoods.length === 0) {
        return buildBoundedNeighborhoodDetail(data);
    }

    const focused =
        neighborhoods.find((n) => n.id === focusId) ??
        neighborhoods.find((n) => n.current) ??
        neighborhoods[0];

    return buildNeighborhoodDetail(focused, data);
}

function NeighborhoodField({ neighborhoods, transitions, focusId }) {
    const nodes = useMemo(() => {
        const items = safeArray(neighborhoods);
        const count = Math.max(items.length, 1);
        const cx = 50;
        const cy = 50;
        const radius = 28;

        return items.map((n, i) => {
            const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
            return {
                ...n,
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
            };
        });
    }, [neighborhoods]);

    const activeNodeId = focusId ?? nodes.find((n) => n.current)?.id ?? null;
    const hasNeighborhoods = nodes.length > 0;

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Network className="h-4 w-4" />
                    Neighborhood Field
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!hasNeighborhoods ? (
                    <div
                        style={{
                            border: "1px dashed #334155",
                            borderRadius: "18px",
                            padding: "16px",
                            background: "#0b1020",
                            color: "#94a3b8",
                            fontSize: "13px",
                        }}
                    >
                        No neighborhood evidence is available for the active run context. This pane
                        stays bounded until runtime support exists.
                    </div>
                ) : (
                    <div
                        style={{
                            aspectRatio: "1 / 1",
                            width: "100%",
                            borderRadius: "18px",
                            border: "1px solid #243047",
                            background: "#0b1020",
                            padding: "12px",
                        }}
                    >
                        <svg
                            viewBox="0 0 100 100"
                            className="h-full w-full"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            {nodes.length > 1
                                ? nodes.map((n, i) => {
                                    const next = nodes[(i + 1) % nodes.length];
                                    return (
                                        <line
                                            key={`ring-${n.id}`}
                                            x1={n.x}
                                            y1={n.y}
                                            x2={next.x}
                                            y2={next.y}
                                            stroke="#22304a"
                                            opacity={0.45}
                                            strokeWidth={0.35}
                                        />
                                    );
                                })
                                : null}

                            {safeArray(transitions).map((t, idx) => {
                                const fromNode = nodes.find((n) => n.id === t.from);
                                const toNode = nodes.find((n) => n.id === t.to);
                                if (!fromNode || !toNode) return null;

                                const count = Number(t.count || 0);
                                const share = Number(t.share || 0);
                                const strokeWidth = 0.4 + Math.min(2.4, count * 0.45);
                                const opacity = 0.18 + Math.min(0.55, share * 1.2);

                                return (
                                    <line
                                        key={`transition-${idx}-${t.from}-${t.to}`}
                                        x1={fromNode.x}
                                        y1={fromNode.y}
                                        x2={toNode.x}
                                        y2={toNode.y}
                                        stroke="#60a5fa"
                                        strokeWidth={strokeWidth}
                                        opacity={opacity}
                                    />
                                );
                            })}

                            {nodes.map((n) => {
                                const activity = Number(n.activity || 0);
                                const nodeRadius = 3.8 + activity * 4.4;
                                const isActive = n.id === activeNodeId;

                                return (
                                    <g key={n.id}>
                                        <circle
                                            cx={n.x}
                                            cy={n.y}
                                            r={nodeRadius}
                                            fill="#0f172a"
                                            stroke={isActive ? "#7dd3fc" : "#475569"}
                                            strokeWidth={isActive ? 1.6 : 1.0}
                                        />
                                        <text
                                            x={n.x}
                                            y={n.y + nodeRadius + 4}
                                            textAnchor="middle"
                                            fontSize="3.2"
                                            className="fill-muted-foreground"
                                        >
                                            {shortId(n.id)}
                                            {n.current ? " [current]" : ""}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TransitionFlow({ transitions, filter }) {
    const filtered = safeArray(transitions).filter(
        (t) =>
            !filter ||
            String(t.from).includes(filter) ||
            String(t.to).includes(filter) ||
            shortId(t.from).includes(filter) ||
            shortId(t.to).includes(filter)
    );

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <GitBranch className="h-4 w-4" />
                    Transition Flow
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {filtered.map((t) => {
                    const sharePct = Math.round((Number(t.share || 0) || 0) * 100);

                    return (
                        <div
                            key={`${t.from}-${t.to}`}
                            style={{
                                border: "1px solid #243047",
                                borderRadius: "12px",
                                padding: "10px 12px",
                                background: "#0f172a",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "12px",
                                    marginBottom: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#e2e8f0",
                                    }}
                                >
                                    {shortId(t.from)} → {shortId(t.to)}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#94a3b8",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    count {t.count} · {sharePct}%
                                </div>
                            </div>

                            <div
                                style={{
                                    height: "8px",
                                    borderRadius: "999px",
                                    background: "#172033",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${Math.max(8, sharePct)}%`,
                                        borderRadius: "999px",
                                        background: "#60a5fa",
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}

                {filtered.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                        No transitions match the current filter.
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

function SegmentTimeline({ events, onSelectEvent }) {
    const rows = safeArray(events);
    const maxT = Math.max(...rows.map((e) => Number(e.t) || 0), 1);

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <TimerReset className="h-4 w-4" />
                    Segment Boundaries
                </CardTitle>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                        No segment-boundary evidence is available for the active run context.
                    </div>
                ) : (
                    <div className="relative h-28 rounded-2xl border bg-muted/30">
                        <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-border" />

                        {rows.map((e, idx) => {
                            const left = `${((Number(e.t) || 0) / maxT) * 100}%`;

                            return (
                                <div
                                    key={idx}
                                    className="absolute top-4 -translate-x-1/2"
                                    style={{ left, cursor: "pointer" }}
                                    onClick={() =>
                                        onSelectEvent?.({
                                            title: "Segment Boundary",
                                            note: "Plane 2 segment-boundary evidence.",
                                            fields: {
                                                t: (Number(e.t) || 0).toFixed(2),
                                                divergence: (Number(e.divergence) || 0).toFixed(2),
                                                events: safeArray(e.events),
                                            },
                                        })
                                    }
                                >
                                    <div className="mx-auto h-10 w-px bg-foreground/70" />
                                    <div className="mt-2 rounded-xl border bg-background px-2 py-1 text-[10px] shadow-sm">
                                        <div className="font-medium">t={Number(e.t || 0).toFixed(2)}</div>
                                        <div className="text-muted-foreground">
                                            div {Number(e.divergence || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="mt-3 flex flex-wrap gap-2">
                            {rows
                                .flatMap((e) => safeArray(e.events))
                                .slice(0, 8)
                                .map((ev, idx) => (
                                    <Badge key={`${ev}-${idx}`} variant="outline" className="rounded-xl">
                                        {ev}
                                    </Badge>
                                ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


// ─── C1 Consultation Strip ────────────────────────────────────────────────────
// Plane 5 — Door Two Canon Consultation
//
// Read-side only. Consumes a pre-computed consultation result record.
// Does NOT consult the live C1 object directly. Does NOT mutate canon.
// Does NOT represent authority. Fails gracefully when no result is loaded.
//
// Fields shown (per task spec):
//   canonical_id, canonical_status, requested_use, decision, reason,
//   challenge_posture, effective_scope_note

const C1_DECISION_COLORS = {
    allow: { border: "#166534", background: "#052e16", badge: "#16a34a", text: "#dcfce7" },
    deny: { border: "#7f1d1d", background: "#2a0a0a", badge: "#dc2626", text: "#fee2e2" },
    _default: { border: "#1e3a5f", background: "#0a1628", badge: "#334155", text: "#cbd5e1" },
};

const C1_STATUS_COLORS = {
    promoted: "#16a34a",
    contested: "#f59e0b",
    narrowed: "#3b82f6",
    suspended: "#dc2626",
    deferred: "#94a3b8",
    _default: "#64748b",
};

const C1_PRESSURE_COLORS = {
    none: "#16a34a",
    weak: "#f59e0b",
    material: "#dc2626",
    _default: "#64748b",
};

function C1ConsultationStrip({ consultationResult }) {
    // Graceful empty state
    if (!consultationResult || typeof consultationResult !== "object") {
        return (
            <SectionShell
                eyebrow="Plane 5 — Door Two Canon Consultation"
                title="C1 Consultation Surface"
                note="Read-side only. Not authority. Door Two consultation result below canon."
            >
                <div style={{
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px dashed #1e3a5f",
                    background: "#0a1628",
                    color: "#64748b",
                    fontSize: "13px",
                    textAlign: "center",
                }}>
                    No consultation result loaded.
                    Place a result record in <code style={{ color: "#94a3b8" }}>out_canon/</code> to populate this surface.
                </div>
            </SectionShell>
        );
    }

    const cA = consultationResult.consultation_A ?? {};
    const ct = consultationResult.consultation_target ?? {};
    const decision = (cA.decision ?? "").toLowerCase();
    const colors = C1_DECISION_COLORS[decision] ?? C1_DECISION_COLORS._default;
    const statusColor = C1_STATUS_COLORS[ct.canonical_status] ?? C1_STATUS_COLORS._default;
    const pressure = consultationResult.challenge_pressure ?? "unknown";
    const pressureColor = C1_PRESSURE_COLORS[pressure] ?? C1_PRESSURE_COLORS._default;
    const judgment = consultationResult.review_judgment ?? "—";

    return (
        <SectionShell
            eyebrow="Plane 5 — Door Two Canon Consultation"
            title="C1 Consultation Surface"
            note="Read-side only. Consumes pre-computed consultation result. Not authority. Not canon activation."
        >
            {/* Decision banner */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "10px",
                border: `1px solid ${colors.border}`,
                background: colors.background,
                marginBottom: "16px",
            }}>
                <span style={{
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: colors.badge,
                    color: colors.text,
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    flexShrink: 0,
                }}>
                    {decision || "—"}
                </span>
                <span style={{ fontSize: "13px", color: "#cbd5e1", wordBreak: "break-word" }}>
                    {cA.reason ?? "—"}
                </span>
            </div>

            {/* Fields grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "10px",
            }}>
                {/* canonical_id */}
                <C1Field label="canonical_id" value={ct.canonical_id ?? "—"} mono />

                {/* canonical_status */}
                <C1Field
                    label="canonical_status"
                    value={ct.canonical_status ?? "—"}
                    valueStyle={{ color: statusColor, fontWeight: 600 }}
                />

                {/* requested_use */}
                <C1Field label="requested_use" value={cA.requested_use ?? "—"} />

                {/* challenge_posture */}
                <C1Field label="challenge_posture" value={ct.challenge_posture ?? "—"} />

                {/* challenge_pressure */}
                <C1Field
                    label="challenge_pressure"
                    value={pressure}
                    valueStyle={{ color: pressureColor, fontWeight: 600 }}
                />

                {/* review_judgment */}
                <C1Field label="review_judgment" value={judgment} />
            </div>

            {/* effective_scope_note — full width */}
            <div style={{
                marginTop: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #1e3a5f",
                background: "#0a1628",
            }}>
                <div style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#64748b",
                    marginBottom: "5px",
                }}>
                    effective_scope_note
                </div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                    {cA.effective_scope_note ?? "—"}
                </div>
            </div>

            {/* Provenance footer */}
            <div style={{
                marginTop: "12px",
                fontSize: "11px",
                color: "#475569",
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
            }}>
                <span>source: out_canon/</span>
                {consultationResult.generated_at && (
                    <span>generated: {new Date(consultationResult.generated_at).toISOString().slice(0, 19)}Z</span>
                )}
                <span style={{ color: "#dc2626" }}>read-side only — not authority</span>
            </div>
        </SectionShell>
    );
}

function C1Field({ label, value, mono = false, valueStyle = {} }) {
    return (
        <div style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #1a2d47",
            background: "#0d1829",
        }}>
            <div style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#64748b",
                marginBottom: "5px",
            }}>
                {label}
            </div>
            <div style={{
                fontSize: "13px",
                color: "#cbd5e1",
                fontFamily: mono ? "monospace" : "inherit",
                wordBreak: "break-all",
                ...valueStyle,
            }}>
                {value}
            </div>
        </div>
    );
}

export default function DoorOneStructuralMemoryHUD({
    workbench,
    crossRunReport = null,
    c1ConsultationResult = null,
}) {
    const data = useMemo(
        () => workbenchToStructuralHudModel(workbench, crossRunReport),
        [workbench, crossRunReport]
    );

    const [filter, setFilter] = useState("");
    const [focusMode, setFocusMode] = useState("current");
    const [selectedDetail, setSelectedDetail] = useState(null);
    const activeContextSignature = useMemo(
        () =>
            JSON.stringify({
                stream_id: data?.provenance?.stream_id ?? null,
                source_id: data?.provenance?.source_id ?? null,
                source_profile_note: data?.provenance?.source_profile_note ?? null,
                states: data?.run_health?.states ?? 0,
                basins: data?.run_health?.basins ?? 0,
                segments: data?.run_health?.segments ?? 0,
                transition_count: data?.runtime_evidence?.transition_count ?? 0,
                total_re_entries: data?.runtime_evidence?.total_re_entries ?? 0,
                current_neighborhood_id: data?.runtime_evidence?.current_neighborhood_id ?? null,
                dominant_neighborhood_id: data?.runtime_evidence?.dominant_neighborhood_id ?? null,
                segment_boundary_events: data?.runtime_evidence?.segment_boundary_events ?? 0,
            }),
        [
            data?.provenance?.stream_id,
            data?.provenance?.source_id,
            data?.provenance?.source_profile_note,
            data?.run_health?.states,
            data?.run_health?.basins,
            data?.run_health?.segments,
            data?.runtime_evidence?.transition_count,
            data?.runtime_evidence?.total_re_entries,
            data?.runtime_evidence?.current_neighborhood_id,
            data?.runtime_evidence?.dominant_neighborhood_id,
            data?.runtime_evidence?.segment_boundary_events,
        ]
    );
    useEffect(() => {
        setFilter("");
        setFocusMode("current");
        setSelectedDetail(null);
    }, [activeContextSignature]);
    useEffect(() => {
        if (!filter) return;

        const neighborhoodIds = new Set(
            (data?.neighborhoods ?? []).map((n) => n?.id).filter(Boolean)
        );

        if (!neighborhoodIds.has(filter)) {
            setFilter("");
        }
    }, [filter, data?.neighborhoods]);
    const focusId = useMemo(() => {
        if (focusMode === "current") {
            return data.neighborhoods.find((n) => n.current)?.id ?? null;
        }
        if (focusMode === "highest-activity") {
            return [...data.neighborhoods].sort((a, b) => b.activity - a.activity)[0]?.id ?? null;
        }
        if (focusMode === "highest-reentry") {
            return [...data.neighborhoods].sort((a, b) => b.reEntries - a.reEntries)[0]?.id ?? null;
        }
        return null;
    }, [data.neighborhoods, focusMode]);
    const autoDetail = useMemo(
        () => buildFocusedNeighborhoodDetail(data, focusId),
        [data, focusId]
    );
    const detailPanelDetail = selectedDetail ?? autoDetail;

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#0b1020",
                padding: "20px",
            }}
        >
            <div
                style={{
                    maxWidth: "1400px",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                <SectionShell
                    eyebrow="Plane 1 — Provenance"
                    title="Door One Structural Memory HUD"
                    note="Read-side inspection surface. Provenance stays visually primary; display is not authority."
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: "16px",
                                flexWrap: "wrap",
                            }}
                        >
                            <div style={{ maxWidth: "820px" }}>
                                <div
                                    style={{
                                        fontSize: "28px",
                                        fontWeight: 700,
                                        color: "#f8fafc",
                                        marginBottom: "6px",
                                    }}
                                >
                                    Provenance-first inspection surface
                                </div>
                                <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                                    Structural, runtime, interpretive, and review surfaces remain
                                    separated. Door One stays below canon.
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <Badge>{data.provenance.source_mode}</Badge>
                                <Badge>cycle {data.cycle ?? "—"}</Badge>
                                <Badge>stream {data.provenance.stream_badge}</Badge>
                                <Badge>
                                    cross-run {data.provenance.cross_run_available ? data.provenance.cross_run_count : 0}
                                </Badge>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                                gap: "12px",
                            }}
                        >
                            <div
                                className="rounded-2xl border p-3"
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                    setSelectedDetail({
                                        title: "Provenance — Source",
                                        note: "Plane 1 provenance detail. Read-side only.",
                                        fields: {
                                            source_id: data.provenance.source_id,
                                            source_mode: data.provenance.source_mode,
                                            source_format: data.provenance.source_format,
                                            source_profile_note: data.provenance.source_profile_note,
                                            source_seed: data.provenance.source_seed,
                                            source_noise_std: data.provenance.source_noise_std,
                                            stream_id: data.provenance.stream_id,
                                            cross_run_available: data.provenance.cross_run_available,
                                            cross_run_count: data.provenance.cross_run_count,
                                        },
                                    })
                                }
                            >
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Source
                                </div>
                                <div className="mt-1 break-all text-sm font-medium">
                                    {data.provenance.source_id}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    {data.provenance.source_mode}
                                    {data.provenance.source_format && data.provenance.source_format !== "—"
                                        ? ` / ${data.provenance.source_format}`
                                        : ""}
                                </div>
                                {data.provenance.source_profile_note && data.provenance.source_profile_note !== "—" ? (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {data.provenance.source_profile_note}
                                    </div>
                                ) : null}
                            </div>

                            <div
                                className="rounded-2xl border p-3"
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                    setSelectedDetail({
                                        title: "Provenance — Stream",
                                        note: "Declared stream identity and scope detail.",
                                        fields: {
                                            stream_id: data.provenance.stream_id,
                                            stream_badge: data.provenance.stream_badge,
                                            segment_count: data.provenance.segment_count,
                                            t_start: data.provenance.t_start,
                                            t_end: data.provenance.t_end,
                                        },
                                    })
                                }
                            >
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Stream
                                </div>
                                <div className="mt-1 break-all text-sm font-medium">
                                    {data.provenance.stream_id}
                                </div>
                            </div>

                            <div
                                className="rounded-2xl border p-3"
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                    setSelectedDetail({
                                        title: "Provenance — Channel / Modality",
                                        note: "Measurement-adjacent identity only.",
                                        fields: {
                                            channel: data.provenance.channel,
                                            modality: data.provenance.modality,
                                            source_id: data.provenance.source_id,
                                        },
                                    })
                                }
                            >
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Channel / Modality
                                </div>
                                <div className="mt-1 text-sm font-medium">
                                    {data.provenance.channel} / {data.provenance.modality}
                                </div>
                            </div>

                            <div
                                className="rounded-2xl border p-3"
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                    setSelectedDetail({
                                        title: "Provenance — Policies",
                                        note: "Declared policy references. Not semantic authority.",
                                        fields: {
                                            clock_policy_id: data.provenance.clock_policy_id,
                                            query_policy_id: data.provenance.query_policy_id,
                                        },
                                    })
                                }
                            >
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Policies
                                </div>
                                <div className="mt-1 text-sm font-medium">
                                    clock {data.provenance.clock_policy_id}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    query {data.provenance.query_policy_id}
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                gap: "12px",
                            }}
                        >
                            <div className="rounded-2xl border p-3">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Time span
                                </div>
                                <div className="mt-1 text-sm font-medium">
                                    {String(data.provenance.t_start)} → {String(data.provenance.t_end)}
                                </div>
                            </div>

                            <div className="rounded-2xl border p-3">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Segments in scope
                                </div>
                                <div className="mt-1 text-2xl font-semibold">
                                    {data.provenance.segment_count}
                                </div>
                            </div>

                            <div className="rounded-2xl border p-3">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Inspection note
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    This surface consumes lawful workbench output and does not mint canon,
                                    truth, ontology, or promotion.
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionShell>

                <SectionShell
                    eyebrow="Plane 2 — Runtime Evidence"
                    title="Runtime Evidence and Audit"
                    note="Non-interpretive execution facts remain visually prior to derived labels."
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                            gap: "16px",
                            marginBottom: "16px",
                        }}
                    >
                        <StatCard
                            icon={Waves}
                            label="States"
                            value={data.run_health.states}
                            sub="runtime memory objects"
                            onClick={() =>
                                setSelectedDetail({
                                    title: "Runtime Evidence — States",
                                    note: "Plane 2 runtime evidence detail.",
                                    fields: {
                                        states: data.run_health.states,
                                        trajectory_frames: data.runtime_evidence.trajectory_frames,
                                        h1s: data.runtime_evidence.artifact_counts.h1s,
                                        m1s: data.runtime_evidence.artifact_counts.m1s,
                                        current_neighborhood_id: data.runtime_evidence.current_neighborhood_id,
                                    },
                                })
                            }
                        />

                        <StatCard
                            icon={Network}
                            label="Basins"
                            value={data.run_health.basins}
                            sub="structural neighborhoods"
                            onClick={() =>
                                setSelectedDetail({
                                    title: "Runtime Evidence — Basins",
                                    note: "Bounded structural-neighborhood evidence only.",
                                    fields: {
                                        basins: data.run_health.basins,
                                        basin_sets: data.runtime_evidence.artifact_counts.basin_sets,
                                        total_re_entries: data.runtime_evidence.total_re_entries,
                                        dominant_neighborhood_id: data.runtime_evidence.dominant_neighborhood_id,
                                        dominant_dwell_share: formatPercent(data.runtime_evidence.dominant_dwell_share),
                                    },
                                })
                            }
                        />

                        <StatCard
                            icon={GitBranch}
                            label="Segments"
                            value={data.run_health.segments}
                            sub="bounded trajectory regions"
                            onClick={() =>
                                setSelectedDetail({
                                    title: "Runtime Evidence — Segments",
                                    note: "Segment count and boundary evidence.",
                                    fields: {
                                        segments: data.run_health.segments,
                                        segment_boundary_events: data.segmentTransitions.length,
                                        transition_count: data.runtime_evidence.transition_count,
                                        segment_event_types: Object.keys(data.runtime_evidence.segment_event_types ?? {}).length
                                            ? Object.entries(data.runtime_evidence.segment_event_types)
                                                .map(([eventType, count]) => `${eventType}:${count}`)
                                            : [],
                                    },
                                })
                            }
                        />

                        <StatCard
                            icon={TimerReset}
                            label="Skipped"
                            value={data.run_health.skipped}
                            sub="audit-visible skipped windows"
                            onClick={() =>
                                setSelectedDetail({
                                    title: "Audit — Skipped Windows",
                                    note: "Audit visibility is runtime honesty.",
                                    fields: {
                                        skipped_windows: data.audit.skipped_windows,
                                    },
                                })
                            }
                        />

                        <StatCard
                            icon={AlertTriangle}
                            label="Merge Failures"
                            value={data.run_health.merge_failures}
                            sub="audit-visible merge warnings"
                            onClick={() =>
                                setSelectedDetail({
                                    title: "Audit — Merge Failures",
                                    note: "Audit visibility is runtime honesty.",
                                    fields: {
                                        merge_failures: data.audit.merge_failures,
                                    },
                                })
                            }
                        />
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                            gap: "12px",
                        }}
                    >
                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                H1 artifacts
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.runtime_evidence.artifact_counts.h1s}
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Anomaly reports
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.runtime_evidence.artifact_counts.anomaly_reports}
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Transition count
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.runtime_evidence.transition_count}
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Consensus receipts
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.audit.consensus_receipts}
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                M1 artifacts
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.runtime_evidence.artifact_counts.m1s}
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Re-entry count
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.runtime_evidence.total_re_entries}
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Current neighborhood
                            </div>
                            <div className="mt-2 text-lg font-semibold break-all">
                                {data.runtime_evidence.current_neighborhood_id
                                    ? shortId(data.runtime_evidence.current_neighborhood_id)
                                    : "bounded"}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground break-all">
                                {data.runtime_evidence.current_neighborhood_id ?? "No current neighborhood observed"}
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Boundary events
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.runtime_evidence.segment_boundary_events}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                {Object.keys(data.runtime_evidence.segment_event_types ?? {}).length
                                    ? Object.entries(data.runtime_evidence.segment_event_types)
                                        .map(([eventType, count]) => `${eventType}:${count}`)
                                        .join(" · ")
                                    : "No boundary event types observed"}
                            </div>
                        </div>
                    </div>
                </SectionShell>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 320px 360px",
                        gap: "16px",
                        alignItems: "start",
                    }}
                >
                    <NeighborhoodField
                        neighborhoods={data.neighborhoods}
                        transitions={data.transitions}
                        focusId={focusId}
                    />

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Eye className="h-4 w-4" />
                                Field Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Transition filter</div>
                                <Input
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    placeholder="NBHD-02"
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">Focus lens</div>
                                <select
                                    value={focusMode}
                                    onChange={(e) => setFocusMode(e.target.value)}
                                    className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 w-full"
                                >
                                    <option value="current">Current neighborhood</option>
                                    <option value="highest-activity">Highest activity</option>
                                    <option value="highest-reentry">Highest re-entry</option>
                                </select>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full rounded-xl"
                                onClick={() => setFilter("")}
                            >
                                Clear filter
                            </Button>

                            <div className="rounded-2xl border p-3 text-sm text-muted-foreground">
                                Read-side only. This plane visualizes lawful runtime evidence and audit
                                surfaces without defining truth, canon, ontology, or promotion.
                            </div>
                        </CardContent>
                    </Card>
                    <EvidenceDetailPanel detail={detailPanelDetail} />
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                    }}
                >
                    <TransitionFlow transitions={data.transitions} filter={filter} />
                    <SegmentTimeline
                        events={data.segmentTransitions}
                        onSelectEvent={setSelectedDetail}
                    />
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.05fr 0.95fr",
                        gap: "16px",
                        alignItems: "start",
                    }}
                >
                    <SectionShell
                        eyebrow="Plane 3 — Interpretation"
                        title="Derived Structural Interpretation"
                        note="Bounded, downstream, non-authoritative readouts over runtime evidence. Structural continuity here is not settlement or identity closure."
                    >
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(data.structure).map(([k, v]) => (
                                <div
                                    key={k}
                                    className="rounded-2xl border p-3"
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        setSelectedDetail({
                                            title: `Interpretation — ${k.replaceAll("_", " ")}`,
                                            note: "Bounded derived readout over runtime evidence. Non-authoritative.",
                                            fields: {
                                                label: String(v),
                                                derived_plane: "interpretation",
                                            },
                                        })
                                    }
                                >
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        {k.replaceAll("_", " ")}
                                    </div>
                                    <div className="mt-2">
                                        <LabelBadge label={String(v)} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div
                            className="rounded-2xl border p-3"
                            style={{
                                marginTop: "12px",
                                background: "#111827",
                                color: "#94a3b8",
                                fontSize: "13px",
                            }}
                        >
                            Future optional read-side attachments may appear here for a post-perturbation
                            settlement report or identity audit. They remain separate from anomaly evidence,
                            separate from current structural continuity labels, and unimplemented in this
                            surface today.
                        </div>
                    </SectionShell>

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Neighborhood Table</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {data.neighborhoods.length === 0 ? (
                                <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                                    No neighborhood evidence is available for the active run context.
                                    Detail remains bounded until runtime support exists.
                                </div>
                            ) : null}
                            {data.neighborhoods.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] items-center gap-3 rounded-2xl border p-3 text-sm",
                                        n.current && "border-primary/40 bg-primary/5"
                                    )}
                                    style={{
                                        cursor: "pointer",
                                        transition: "border-color 120ms ease, background 120ms ease",
                                    }}
                                    onClick={() =>
                                        setSelectedDetail({
                                            title: `Runtime Evidence — Neighborhood ${shortId(n.id)}`,
                                            note: "Plane 2 structural-neighborhood evidence. Read-side only.",
                                            fields: {
                                                projected_id: n.id,
                                                current: n.current,
                                                dwell_frames: n.dwellFrames,
                                                dwell_sec: n.dwellSec,
                                                re_entries: n.reEntries,
                                                activity: Number(n.activity || 0).toFixed(3),

                                                raw_neighborhood_label: n.evidence?.neighborhood_label,
                                                raw_label: n.evidence?.label,
                                                raw_neighborhood_name: n.evidence?.neighborhood_name,
                                                raw_name: n.evidence?.name,
                                                raw_neighborhood_id: n.evidence?.neighborhood_id,
                                                raw_basin_id: n.evidence?.basin_id,
                                                raw_id: n.evidence?.id,
                                            },
                                        })
                                    }
                                >
                                    <div>
                                        <div className="font-medium">{shortId(n.id)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {n.current ? "current activity" : "observed neighborhood"}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground/80 break-all">
                                            {n.id}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Dwell</div>
                                        <div>
                                            {n.dwellFrames}f / {n.dwellSec}s
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Re-entry</div>
                                        <div>{n.reEntries}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Activity</div>
                                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-foreground/80"
                                                style={{ width: `${Math.round((n.activity || 0) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <SectionShell
                    eyebrow="Plane 4 — Review Surfaces"
                    title="Bounded Review Posture"
                    note="Evidence packaging only. Not canon, not truth, not ontology, not promotion."
                >
                    <div
                        className="rounded-2xl border p-3"
                        style={{
                            marginBottom: "12px",
                            background: "#111827",
                            color: "#94a3b8",
                            fontSize: "13px",
                        }}
                    >
                        Review surfaces remain lower-authority than provenance, runtime evidence, and
                        bounded interpretation. Visibility here does not imply canon activation or trusted truth.
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div
                            className="rounded-2xl border p-3"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                                setSelectedDetail({
                                    title: "Review Surface — Readiness",
                                    note: "Review posture only. Not canon or promotion.",
                                    fields: {
                                        readiness: data.review.readiness,
                                        confidence: data.review.confidence,
                                        blockers: data.review.blockers,
                                        insufficiencies: data.review.insufficiencies,
                                    },
                                })
                            }
                        >
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Readiness
                            </div>
                            <div className="mt-2">
                                <LabelBadge label={data.review.readiness} />
                            </div>
                        </div>

                        <div
                            className="rounded-2xl border p-3"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                                setSelectedDetail({
                                    title: "Review Surface — Consensus",
                                    note: "Review posture only. Not canon or promotion.",
                                    fields: {
                                        consensus: data.review.consensus,
                                        claim: data.review.claim,
                                    }
                                })
                            }
                        >
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Consensus
                            </div>
                            <div className="mt-2">
                                <LabelBadge label={data.review.consensus} />
                            </div>
                        </div>

                        <div
                            className="rounded-2xl border p-3"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                                setSelectedDetail({
                                    title: "Review Surface — Claim",
                                    note: "Review posture only. Not canon or promotion.",
                                    fields: {
                                        claim: data.review.claim,
                                        readiness: data.review.readiness,
                                    }
                                })
                            }
                        >
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Claim
                            </div>
                            <div className="mt-2 break-words text-sm font-medium">
                                {data.review.claim}
                            </div>
                        </div>

                        <div
                            className="rounded-2xl border p-3"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                                setSelectedDetail({
                                    title: "Review Surface — Blockers",
                                    note: "Review posture only. Not canon or promotion.",
                                    fields: {
                                        blockers: data.review.blockers,
                                    }
                                })
                            }
                        >
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Blockers
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.review.blockers}
                            </div>
                        </div>

                        <div
                            className="rounded-2xl border p-3"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                                setSelectedDetail({
                                    title: "Review Surface — Insufficiencies",
                                    note: "Review posture only. Not canon or promotion.",
                                    fields: {
                                        insufficiencies: data.review.insufficiencies,
                                    }
                                })
                            }
                        >
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Insufficiencies
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.review.insufficiencies}
                            </div>
                        </div>
                    </div>
                </SectionShell>

                <C1ConsultationStrip consultationResult={c1ConsultationResult} />

            </div>
        </div>
    );
}
