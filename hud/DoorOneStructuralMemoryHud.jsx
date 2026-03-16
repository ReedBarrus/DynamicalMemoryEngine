import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
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

function shortId(id) {
    if (!id) return "—";

    const text = String(id);

    if (text.startsWith("NBHD-")) return text;

    const parts = text.split(":");
    const last = parts[parts.length - 1] ?? text;

    if (last.length <= 12) return last;
    return `${last.slice(0, 4)}…${last.slice(-4)}`;
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
        const cy = 54;
        const radius = 26;

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
                    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
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
                            const radius = 3.8 + activity * 4.4;
                            const isActive = n.id === activeNodeId;

                            return (
                                <g key={n.id}>
                                    <circle
                                        cx={n.x}
                                        cy={n.y}
                                        r={radius}
                                        fill="#0f172a"
                                        stroke={isActive ? "#7dd3fc" : "#475569"}
                                        strokeWidth={isActive ? 1.6 : 1.0}
                                    />
                                    <text
                                        x={n.x}
                                        y={n.y + radius + 4}
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
                            <motion.div
                                key={idx}
                                className="absolute top-4 -translate-x-1/2"
                                style={{ left }}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <div className="mx-auto h-10 w-px bg-foreground/70" />
                                <div className="mt-2 rounded-xl border bg-background px-2 py-1 text-[10px] shadow-sm">
                                    <div className="font-medium">t={(Number(e.t) || 0).toFixed(2)}</div>
                                    <div className="text-muted-foreground">
                                        div {(Number(e.divergence) || 0).toFixed(2)}
                                    </div>
                                </div>
                            </motion.div>
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

export function workbenchToStructuralHudModel(workbench, crossRunReport = null) {
    const tr = workbench?.runtime?.substrate?.transition_report ?? {};
    const segTransitions = safeArray(workbench?.runtime?.substrate?.segment_transitions);
    const readiness = workbench?.promotion_readiness?.report?.readiness_summary ?? {};
    const trajectory = workbench?.interpretation?.trajectory ?? {};

    const dwell = Array.isArray(tr.neighborhood_dwell)
        ? tr.neighborhood_dwell
        : Array.isArray(tr.dwell)
            ? tr.dwell
            : [];

    const maxDwellCount = Math.max(
        1,
        ...dwell.map((n) => Number(n.dwell_count ?? n.frames ?? 0) || 0)
    );

    const neighborhoods = dwell.map((n, idx) => {
        const neighborhoodId =
            n.neighborhood_id ?? n.id ?? `NBHD-${String(idx + 1).padStart(2, "0")}`;
        const dwellFrames = Number(n.dwell_count ?? n.frames ?? 0) || 0;
        const dwellSec = Number(n.dwell_duration_sec ?? n.duration_sec ?? 0) || 0;
        const reEntries = Number(n.re_entry_count ?? n.re_entries ?? n.runs ?? 0) || 0;

        return {
            id: neighborhoodId,
            dwellFrames,
            dwellSec,
            reEntries,
            activity: Math.min(1, dwellFrames / maxDwellCount),
            current: neighborhoodId === tr.current_neighborhood_id,
        };
    });

    const totalTransitions = Number(tr.total_transitions ?? 0) || 0;

    const transitions = safeArray(tr.transitions).map((t) => ({
        from: t.from ?? "—",
        to: t.to ?? "—",
        count: Number(t.count ?? 0) || 0,
        share: totalTransitions > 0 ? (Number(t.count ?? 0) || 0) / totalTransitions : 0,
    }));

    return {
        source_mode: workbench?.scope?.cross_run_context?.available ? "session" : "single_run",
        cycle: null,
        run_label: workbench?.runtime?.artifacts?.a1?.stream_id ?? "—",
        stream_id: workbench?.scope?.stream_id ?? "—",

        run_health: {
            states: workbench?.runtime?.substrate?.state_count ?? 0,
            basins: workbench?.runtime?.substrate?.basin_count ?? 0,
            segments: workbench?.runtime?.substrate?.segment_count ?? 0,
            skipped: safeArray(workbench?.runtime?.audit?.skipped_windows).length,
            merge_failures: safeArray(workbench?.runtime?.audit?.merge_failures).length,
        },

        structure: {
            convergence: trajectory?.trajectory_character?.convergence ?? "unknown",
            motion: trajectory?.trajectory_character?.motion ?? "unknown",
            occupancy: trajectory?.neighborhood_character?.occupancy ?? "unknown",
            recurrence: trajectory?.neighborhood_character?.recurrence_strength ?? "unknown",
            continuity: trajectory?.segment_character?.continuity ?? "unknown",
            transition_selectivity:
                workbench?.promotion_readiness?.report?.evidence_domains?.transition_selectivity?.label ??
                "unknown",
        },

        review: {
            readiness: readiness?.overall_readiness ?? "unknown",
            confidence: readiness?.confidence ?? "unknown",
            claim: workbench?.canon_candidate?.dossier?.candidate_claim?.claim_type ?? "—",
            consensus: workbench?.consensus_review?.review?.result ?? "not_reviewed",
            blockers: safeArray(workbench?.canon_candidate?.dossier?.blockers).length,
            insufficiencies: safeArray(workbench?.canon_candidate?.dossier?.insufficiencies).length,
        },

        neighborhoods,
        transitions,
        segmentTransitions: segTransitions.map((t) => ({
            t: Number(t.t_transition ?? 0) || 0,
            divergence: Number(t.divergence_score ?? 0) || 0,
            events: safeArray(t.detected_event_types),
        })),

        cross_run: crossRunReport,
    };
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
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr",
                        gap: "16px",
                    }}
                >
                    <Card className="rounded-2xl shadow-sm">
                        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
                            <div className="space-y-2">
                                <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                                    Door One Visual HUD
                                </div>
                                <div className="text-3xl font-semibold tracking-tight">
                                    Structural Memory Field
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Read-side observational surface for neighborhoods, transitions,
                                    recurrence, and segment activity.
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="rounded-xl">
                                    {data.source_mode}
                                </Badge>
                                <Badge variant="outline" className="rounded-xl">
                                    cycle {data.cycle ?? "—"}
                                </Badge>
                                <Badge variant="outline" className="rounded-xl">
                                    {data.run_label}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                        <CardContent className="space-y-3 p-5">
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Stream
                                </div>
                                <div className="mt-1 break-all text-sm font-medium">
                                    {data.stream_id}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-xl border p-3">
                                    <div className="text-muted-foreground">Readiness</div>
                                    <div className="mt-1">
                                        <LabelBadge label={data.review.readiness} />
                                    </div>
                                </div>
                                <div className="rounded-xl border p-3">
                                    <div className="text-muted-foreground">Consensus</div>
                                    <div className="mt-1">
                                        <LabelBadge label={data.review.consensus} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                        gap: "16px",
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
                        value={data.run_health.skipped}
                        sub="audit-visible"
                    />
                    <StatCard
                        icon={Repeat}
                        label="Merge Failures"
                        value={data.run_health.merge_failures}
                        sub="audit-visible"
                    />
                </div>

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
                                This surface is display-only. It consumes exported runtime/workbench
                                JSON and does not define new authority.
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
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Structural Posture</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Neighborhood Table</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {data.neighborhoods.map((n) => (
                                <motion.div
                                    key={n.id}
                                    layout
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
                                </motion.div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-4 w-4" />
                            Review Surface
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                                Confidence
                            </div>
                            <div className="mt-2">
                                <LabelBadge label={data.review.confidence} />
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}