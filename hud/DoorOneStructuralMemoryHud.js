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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const sampleData = {
    source_mode: "synthetic",
    cycle: 5,
    run_label: "live_run_5",
    stream_id: "STR:synthetic_live_v1:ch0:voltage:arb:256",
    run_health: {
        states: 23,
        basins: 5,
        segments: 4,
        skipped: 1,
        merge_failures: 1,
    },
    structure: {
        convergence: "insufficient_data",
        motion: "diffuse",
        occupancy: "recurrent",
        recurrence: "medium",
        continuity: "fragmented",
        transition_selectivity: "medium",
    },
    review: {
        readiness: "medium",
        confidence: "developing",
        claim: "stable_structural_identity",
        consensus: "defer",
        blockers: 1,
        insufficiencies: 1,
    },
    neighborhoods: [
        { id: "NBHD-01", dwellFrames: 9, dwellSec: 4.5, reEntries: 2, activity: 0.92, current: false },
        { id: "NBHD-02", dwellFrames: 15, dwellSec: 7.5, reEntries: 4, activity: 0.68, current: true },
        { id: "NBHD-03", dwellFrames: 6, dwellSec: 3.0, reEntries: 1, activity: 0.34, current: false },
        { id: "NBHD-04", dwellFrames: 10, dwellSec: 5.0, reEntries: 3, activity: 0.54, current: false },
        { id: "NBHD-05", dwellFrames: 4, dwellSec: 2.0, reEntries: 0, activity: 0.2, current: false },
    ],
    transitions: [
        { from: "NBHD-01", to: "NBHD-02", count: 4, share: 0.29 },
        { from: "NBHD-02", to: "NBHD-04", count: 3, share: 0.21 },
        { from: "NBHD-04", to: "NBHD-02", count: 2, share: 0.14 },
        { from: "NBHD-02", to: "NBHD-03", count: 2, share: 0.14 },
        { from: "NBHD-03", to: "NBHD-02", count: 1, share: 0.07 },
        { from: "NBHD-02", to: "NBHD-05", count: 2, share: 0.14 },
    ],
    segmentTransitions: [
        { t: 2.5, divergence: 0.17, events: ["new_frequency", "energy_shift"] },
        { t: 5.0, divergence: 0.22, events: ["new_frequency"] },
        { t: 7.5, divergence: 0.19, events: ["vanished_frequency"] },
        { t: 9.2, divergence: 0.2, events: ["energy_shift"] },
    ],
};

function cn(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

function StatCard({ icon: Icon, label, value, sub }: any) {
    return (
        <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
                        <div className="mt-1 text-2xl font-semibold">{value}</div>
                        {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
                    </div>
                    <div className="rounded-2xl border p-2 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function LabelBadge({ label }: { label: string }) {
    const tone =
        label === "high"
            ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
            : label === "medium" || label === "developing" || label === "recurrent"
                ? "bg-amber-500/10 text-amber-700 border-amber-200"
                : label === "low" || label === "defer" || label === "fragmented" || label === "diffuse"
                    ? "bg-rose-500/10 text-rose-700 border-rose-200"
                    : "bg-slate-500/10 text-slate-700 border-slate-200";

    return <Badge variant="outline" className={cn("capitalize rounded-xl", tone)}>{label.replaceAll("_", " ")}</Badge>;
}

function NeighborhoodField({ neighborhoods, focusId }: any) {
    const nodes = useMemo(() => {
        const count = neighborhoods.length;
        const cx = 50;
        const cy = 50;
        const radius = 32;
        return neighborhoods.map((n: any, i: number) => {
            const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
            return {
                ...n,
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
            };
        });
    }, [neighborhoods]);

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Network className="h-4 w-4" />
                    Neighborhood Field
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="aspect-square w-full rounded-2xl border bg-gradient-to-br from-background to-muted/40 p-3">
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                        <defs>
                            <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                            </radialGradient>
                        </defs>

                        {nodes.map((n: any, i: number) => {
                            const next = nodes[(i + 1) % nodes.length];
                            return (
                                <line
                                    key={`ring-${n.id}`}
                                    x1={n.x}
                                    y1={n.y}
                                    x2={next.x}
                                    y2={next.y}
                                    stroke="currentColor"
                                    opacity={0.12}
                                    strokeWidth={0.4}
                                />
                            );
                        })}

                        {nodes.map((n: any) => {
                            const active = n.current || focusId === n.id;
                            const r = 4 + n.activity * 5;
                            return (
                                <g key={n.id}>
                                    {active ? (
                                        <motion.circle
                                            cx={n.x}
                                            cy={n.y}
                                            r={r + 6}
                                            fill="url(#pulse)"
                                            className="text-primary"
                                            animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.25, 0.55, 0.25] }}
                                            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                    ) : null}
                                    <circle
                                        cx={n.x}
                                        cy={n.y}
                                        r={r}
                                        className={cn(active ? "fill-primary/90" : "fill-foreground/70")}
                                    />
                                    <text x={n.x} y={n.y + r + 4} textAnchor="middle" fontSize="3.2" className="fill-muted-foreground">
                                        {n.id}
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

function TransitionFlow({ transitions, filter }: any) {
    const filtered = transitions.filter((t: any) => !filter || t.from.includes(filter) || t.to.includes(filter));

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <GitBranch className="h-4 w-4" />
                    Transition Flow
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {filtered.map((t: any) => (
                    <div key={`${t.from}-${t.to}`} className="rounded-2xl border p-3">
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <div className="font-medium">{t.from} → {t.to}</div>
                            <div className="text-muted-foreground">count {t.count} · {(t.share * 100).toFixed(0)}%</div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <motion.div
                                className="h-full rounded-full bg-foreground/80"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(8, t.share * 100)}%` }}
                                transition={{ duration: 0.8 }}
                            />
                        </div>
                    </div>
                ))}
                {filtered.length === 0 ? <div className="text-sm text-muted-foreground">No transitions match the current filter.</div> : null}
            </CardContent>
        </Card>
    );
}

function SegmentTimeline({ events }: any) {
    const maxT = Math.max(...events.map((e: any) => e.t), 1);
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
                    {events.map((e: any, idx: number) => {
                        const left = `${(e.t / maxT) * 100}%`;
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
                                    <div className="font-medium">t={e.t.toFixed(2)}</div>
                                    <div className="text-muted-foreground">div {e.divergence.toFixed(2)}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {events.flatMap((e: any) => e.events).slice(0, 8).map((ev: string, idx: number) => (
                        <Badge key={`${ev}-${idx}`} variant="outline" className="rounded-xl">{ev}</Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function DoorOneStructuralMemoryHUD() {
    const [data] = useState(sampleData);
    const [filter, setFilter] = useState("");
    const [focusMode, setFocusMode] = useState("current");

    const focusId = useMemo(() => {
        if (focusMode === "current") return data.neighborhoods.find((n) => n.current)?.id ?? null;
        if (focusMode === "highest-activity") return [...data.neighborhoods].sort((a, b) => b.activity - a.activity)[0]?.id ?? null;
        if (focusMode === "highest-reentry") return [...data.neighborhoods].sort((a, b) => b.reEntries - a.reEntries)[0]?.id ?? null;
        return null;
    }, [data.neighborhoods, focusMode]);

    return (
        <div className="min-h-screen bg-background p-4 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                    <Card className="rounded-2xl shadow-sm">
                        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
                            <div className="space-y-2">
                                <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Door One Visual HUD</div>
                                <div className="text-3xl font-semibold tracking-tight">Structural Memory Field</div>
                                <div className="text-sm text-muted-foreground">
                                    Read-side observational surface for neighborhoods, transitions, recurrence, and segment activity.
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="rounded-xl">{data.source_mode}</Badge>
                                <Badge variant="outline" className="rounded-xl">cycle {data.cycle}</Badge>
                                <Badge variant="outline" className="rounded-xl">{data.run_label}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                        <CardContent className="space-y-3 p-5">
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Stream</div>
                                <div className="mt-1 break-all text-sm font-medium">{data.stream_id}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-xl border p-3">
                                    <div className="text-muted-foreground">Readiness</div>
                                    <div className="mt-1"><LabelBadge label={data.review.readiness} /></div>
                                </div>
                                <div className="rounded-xl border p-3">
                                    <div className="text-muted-foreground">Consensus</div>
                                    <div className="mt-1"><LabelBadge label={data.review.consensus} /></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard icon={Waves} label="States" value={data.run_health.states} sub="runtime memory objects" />
                    <StatCard icon={Network} label="Basins" value={data.run_health.basins} sub="structural neighborhoods" />
                    <StatCard icon={GitBranch} label="Segments" value={data.run_health.segments} sub="boundary count" />
                    <StatCard icon={AlertTriangle} label="Skipped" value={data.run_health.skipped} sub="audit-visible" />
                    <StatCard icon={Repeat} label="Merge Failures" value={data.run_health.merge_failures} sub="audit-visible" />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <NeighborhoodField neighborhoods={data.neighborhoods} focusId={focusId} />

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
                                <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="NBHD-02" className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Focus lens</div>
                                <Select value={focusMode} onValueChange={setFocusMode}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="current">Current neighborhood</SelectItem>
                                        <SelectItem value="highest-activity">Highest activity</SelectItem>
                                        <SelectItem value="highest-reentry">Highest re-entry</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" className="w-full rounded-xl" onClick={() => setFilter("")}>Clear filter</Button>
                            <div className="rounded-2xl border p-3 text-sm text-muted-foreground">
                                This surface is display-only. It should consume exported runtime/workbench JSON and not define new authority.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <TransitionFlow transitions={data.transitions} filter={filter} />
                    <SegmentTimeline events={data.segmentTransitions} />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Structural Posture</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(data.structure).map(([k, v]) => (
                                <div key={k} className="rounded-2xl border p-3">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.replaceAll("_", " ")}</div>
                                    <div className="mt-2"><LabelBadge label={String(v)} /></div>
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
                                    className={cn("grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] items-center gap-3 rounded-2xl border p-3 text-sm", n.current && "border-primary/40 bg-primary/5")}
                                >
                                    <div>
                                        <div className="font-medium">{n.id}</div>
                                        <div className="text-xs text-muted-foreground">{n.current ? "current activity" : "observed neighborhood"}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Dwell</div>
                                        <div>{n.dwellFrames}f / {n.dwellSec}s</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Re-entry</div>
                                        <div>{n.reEntries}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Activity</div>
                                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                                            <div className="h-full rounded-full bg-foreground/80" style={{ width: `${Math.round(n.activity * 100)}%` }} />
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
                        <div className="rounded-2xl border p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Readiness</div><div className="mt-2"><LabelBadge label={data.review.readiness} /></div></div>
                        <div className="rounded-2xl border p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Confidence</div><div className="mt-2"><LabelBadge label={data.review.confidence} /></div></div>
                        <div className="rounded-2xl border p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Claim</div><div className="mt-2 text-sm font-medium break-words">{data.review.claim}</div></div>
                        <div className="rounded-2xl border p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Blockers</div><div className="mt-2 text-2xl font-semibold">{data.review.blockers}</div></div>
                        <div className="rounded-2xl border p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Insufficiencies</div><div className="mt-2 text-2xl font-semibold">{data.review.insufficiencies}</div></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
