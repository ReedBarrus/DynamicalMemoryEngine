import React, { useMemo, useState } from "react";
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

function StatCard({ icon: Icon, label, value, sub }) {
    return (
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

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Network className="h-4 w-4" />
                    Neighborhood Field
                </CardTitle>
            </CardHeader>
            <CardContent>
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

function SegmentTimeline({ events }) {
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
                <div className="relative h-28 rounded-2xl border bg-muted/30">
                    <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-border" />

                    {rows.map((e, idx) => {
                        const left = `${((Number(e.t) || 0) / maxT) * 100}%`;

                        return (
                            <div
                                key={idx}
                                className="absolute top-4 -translate-x-1/2"
                                style={{ left }}
                            >
                                <div className="mx-auto h-10 w-px bg-foreground/70" />
                                <div className="mt-2 rounded-xl border bg-background px-2 py-1 text-[10px] shadow-sm">
                                    <div className="font-medium">t={(Number(e.t) || 0).toFixed(2)}</div>
                                    <div className="text-muted-foreground">
                                        div {(Number(e.divergence) || 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

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
            </CardContent>
        </Card>
    );
}

export default function DoorOneStructuralMemoryHUD({
    workbench,
    crossRunReport = null,
}) {
    const data = useMemo(
        () => workbenchToStructuralHudModel(workbench, crossRunReport),
        [workbench, crossRunReport]
    );

    const [filter, setFilter] = useState("");
    const [focusMode, setFocusMode] = useState("current");

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
                            <div className="rounded-2xl border p-3">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Source
                                </div>
                                <div className="mt-1 break-all text-sm font-medium">
                                    {data.provenance.source_id}
                                </div>
                            </div>

                            <div className="rounded-2xl border p-3">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Stream
                                </div>
                                <div className="mt-1 break-all text-sm font-medium">
                                    {data.provenance.stream_id}
                                </div>
                            </div>

                            <div className="rounded-2xl border p-3">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Channel / Modality
                                </div>
                                <div className="mt-1 text-sm font-medium">
                                    {data.provenance.channel} / {data.provenance.modality}
                                </div>
                            </div>

                            <div className="rounded-2xl border p-3">
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
                        />
                        <StatCard
                            icon={Network}
                            label="Basins"
                            value={data.run_health.basins}
                            sub="structural neighborhoods"
                        />
                        <StatCard
                            icon={GitBranch}
                            label="Segments"
                            value={data.run_health.segments}
                            sub="boundary count"
                        />
                        <StatCard
                            icon={AlertTriangle}
                            label="Skipped"
                            value={data.audit.skipped_windows}
                            sub="audit-visible"
                        />
                        <StatCard
                            icon={Repeat}
                            label="Merge Failures"
                            value={data.audit.merge_failures}
                            sub="audit-visible"
                        />
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr",
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
                    </div>
                </SectionShell>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 320px",
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
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                    }}
                >
                    <TransitionFlow transitions={data.transitions} filter={filter} />
                    <SegmentTimeline events={data.segmentTransitions} />
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
                        note="Bounded, downstream, non-authoritative readouts over runtime evidence."
                    >
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(data.structure).map(([k, v]) => (
                                <div key={k} className="rounded-2xl border p-3">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        {k.replaceAll("_", " ")}
                                    </div>
                                    <div className="mt-2">
                                        <LabelBadge label={String(v)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionShell>

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Neighborhood Table</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {data.neighborhoods.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] items-center gap-3 rounded-2xl border p-3 text-sm",
                                        n.current && "border-primary/40 bg-primary/5"
                                    )}
                                >
                                    <div>
                                        <div className="font-medium">{n.id}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {n.current ? "current activity" : "observed neighborhood"}
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
                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Readiness
                            </div>
                            <div className="mt-2">
                                <LabelBadge label={data.review.readiness} />
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Consensus
                            </div>
                            <div className="mt-2">
                                <LabelBadge label={data.review.consensus} />
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Claim
                            </div>
                            <div className="mt-2 break-words text-sm font-medium">
                                {data.review.claim}
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Blockers
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.review.blockers}
                            </div>
                        </div>

                        <div className="rounded-2xl border p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Insufficiencies
                            </div>
                            <div className="mt-2 text-2xl font-semibold">
                                {data.review.insufficiencies}
                            </div>
                        </div>
                    </div>
                </SectionShell>
            </div>
        </div>
    );
}