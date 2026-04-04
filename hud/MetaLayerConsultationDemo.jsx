// hud/MetaLayerConsultationDemo.jsx
//
// Public-facing consultation demo surface — Meta-Layer / Founding Wave
//
// Constitutional posture:
//   - Read-side only. Does not alter runtime, consultation law, or canon meaning.
//   - All demo data is embedded as a static model from documented consultation records.
//   - Provenance stays visually primary per Door One inspection posture.
//   - Review/trust posture is visibly fenced and lower-authority than evidence.
//   - Separated from the lab HUD (DoorOneStructuralMemoryHud.jsx) entirely.
//   - Not authority. Not prediction. Not semantic truth.
//
// Data sources:
//   - Original consultation: README_C1_FirstConsultationRecord.md
//   - Room-change comparatives: README.C1_RoomChangeComparativeConsultationRecord.md
//
// Design direction: precision instrument / lab notebook
//   IBM Plex Mono for all provenance + evidence data
//   Crimson Pro for reading text
//   Deep charcoal background (#0e1117) — feels like a terminal or oscilloscope readout
//   Amber accent (#f59e0b) — "instrument active" indicator
//   Stacked planes with hard ruled dividers, not card shadows
//   Lifecycle timeline is the memorable centerpiece

import { motion } from "framer-motion";
import { useState } from "react";
import { projectForDemo } from "./adapters/tandemAdapter.js";

// ─── Static demo model ────────────────────────────────────────────────────────
// Values from README.C1_RoomChangeComparativeConsultationRecord.md
// and README_C1_FirstConsultationRecord.md
const DEMO_OBJECT = {
    object_id: "C1_BASELINE_SINE400_001",
    object_label: "Consultation Object",
    current_status: "promoted",
    bounded_claim: "Under the declared medium FFT/Hann lens and within the daw_mic_sine_400hz cohort scope, the baseline phase profile is a stable comparison anchor for distinguishing perturbation and return-like recurrence in this family.",
    source_family: "daw_mic_sine_400hz",
    declared_lens: "medium FFT/Hann · N=256 · hop=128 · Fs=2400Hz · bands=[0–300, 300–600, 600–900, 900–1200Hz]",
    lineage: "Packet 1 promotion → first live C1 object → three bounded consultations",
    receipt_refs: "cohort receipts + pinned packet refs · bounded real-source replay support",
    allowed_use: [
        "same-family baseline comparison",
        "same-family perturbation-vs-baseline comparison",
        "same-family narrow return-vs-perturb reference",
        "bounded review-anchor consultation under same declared lens",
    ],
    explicit_non_claims: [
        "not semantic identity",
        "not universal across families",
        "not prediction authority",
        "not ontology inference",
        "not event truth",
        "not policy/control input",
    ],
    support_basis: ["replay_legitimacy_confirmed", "cross_run_stability", "return_similarity", "concentration_support"],
    interpretation: "Environment-tolerant within this bounded same-family seam; contamination-sensitive at baseline. The consultation seam distinguished lawful same-family reuse from subtle baseline degradation — while preserving return-like convergence across all three runs.",
};

// Reference thresholds
const REF_bVsP = 1.24;
const REF_bVsR = 0.01;
const CHALLENGE_FLOOR = 0.992;
const CHALLENGE_CEIL = 0.050;

const HISTORY = [
    {
        id: "original",
        label: "Original consultation",
        when: "2026-03-31",
        environment: "original recording environment",
        bVsP: 1.237983,
        bVsR: 0.010871,
        return_close: true,
        pressure: "none",
        judgment: "keep_promoted",
        judgment_note: "Anchor behavior preserved at 99.8% of reference. No challenge dimension crossed.",
        status: "promoted",
    },
    {
        id: "room_change_contaminated",
        label: "Room-change · contaminated baseline",
        when: "2026-04-xx",
        environment: "motel room · ambient contamination present",
        bVsP: 0.856604,
        bVsR: 0.020502,
        return_close: true,
        pressure: "weak",
        judgment: "annotate_for_review_only",
        judgment_note: "bVsP below challenge floor (0.857 < 0.992). Return convergence preserved. Contamination, not room change alone, is the primary driver.",
        status: "review_annotation",
    },
    {
        id: "room_change_clean",
        label: "Room-change · clean baseline",
        when: "2026-04-xx",
        environment: "motel room · clean recording",
        bVsP: 1.11536,
        bVsR: 0.01618,
        return_close: true,
        pressure: "none",
        judgment: "keep_promoted",
        judgment_note: "bVsP restored above floor (1.115 > 0.992). Room change alone did not break the anchor.",
        status: "promoted",
    },
];

// ─── Color / token helpers ────────────────────────────────────────────────────
const C = {
    bg: "#0e1117",
    surface: "#161b27",
    surfaceHigh: "#1c2333",
    rule: "#1f2d45",
    ruleLight: "#263449",
    amber: "#f59e0b",
    amberDim: "#92610a",
    amberFaint: "#2a1e06",
    green: "#22c55e",
    greenFaint: "#052e16",
    yellow: "#eab308",
    yellowFaint: "#1c1500",
    red: "#ef4444",
    redFaint: "#1f0707",
    text: "#e2e8f0",
    textMid: "#94a3b8",
    textDim: "#475569",
    textMono: "#a8c1e0",
    mono: "'IBM Plex Mono', 'Cascadia Code', 'Fira Code', monospace",
    serif: "'Crimson Pro', 'Georgia', 'Times New Roman', serif",
    sans: "'DM Sans', 'Inter', system-ui, sans-serif",
};

const JUDGMENT_STYLES = {
    keep_promoted: { color: C.green, bg: C.greenFaint, border: "#15803d", label: "keep_promoted" },
    annotate_for_review_only: { color: C.yellow, bg: C.yellowFaint, border: "#a16207", label: "review annotation" },
    _default: { color: C.textMid, bg: C.surface, border: C.rule, label: "—" },
};

const PRESSURE_STYLES = {
    none: { color: C.green, dot: "●" },
    weak: { color: C.yellow, dot: "◆" },
    material: { color: C.red, dot: "■" },
    _default: { color: C.textDim, dot: "○" },
};

// ─── Small primitives ─────────────────────────────────────────────────────────
function Rule({ style }) {
    return <div style={{ height: 1, background: C.rule, ...style }} />;
}

function Label({ children, style }) {
    return (
        <div style={{
            fontFamily: C.mono,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: C.textDim,
            ...style,
        }}>
            {children}
        </div>
    );
}

function Mono({ children, style }) {
    return (
        <span style={{ fontFamily: C.mono, color: C.textMono, ...style }}>
            {children}
        </span>
    );
}

function PlaneHeader({ plane, title }) {
    return (
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
            <span style={{
                fontFamily: C.mono,
                fontSize: 10,
                color: C.amberDim,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
            }}>
                {plane}
            </span>
            <span style={{
                fontFamily: C.sans,
                fontSize: 13,
                fontWeight: 600,
                color: C.textMid,
                letterSpacing: "0.04em",
            }}>
                {title}
            </span>
        </div>
    );
}

function Pill({ children, color, bg, border }) {
    return (
        <span style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: 4,
            border: `1px solid ${border}`,
            background: bg,
            color,
            fontFamily: C.mono,
            fontSize: 11,
            letterSpacing: "0.04em",
        }}>
            {children}
        </span>
    );
}

// ─── Plane 1: Provenance ──────────────────────────────────────────────────────
function ProvenancePlane({ obj }) {
    const rows = [
        ["object_id", obj.object_id],
        ["source_family", obj.source_family],
        ["declared_lens", obj.declared_lens],
        ["lineage", obj.lineage],
        ["receipt_refs", obj.receipt_refs],
    ];
    return (
        <section>
            <PlaneHeader plane="Plane 1" title="Provenance" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {rows.map(([key, val]) => (
                    <div key={key} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, alignItems: "start" }}>
                        <Label style={{ paddingTop: 1 }}>{key}</Label>
                        <Mono style={{ fontSize: 12, lineHeight: 1.6 }}>{val}</Mono>
                    </div>
                ))}
            </div>
            <div style={{
                marginTop: 16,
                padding: "8px 12px",
                background: C.amberFaint,
                border: `1px solid ${C.amberDim}`,
                borderRadius: 4,
                fontFamily: C.mono,
                fontSize: 11,
                color: C.amber,
            }}>
                support_basis: {obj.support_basis.join(" · ")}
            </div>
        </section>
    );
}

// ─── Plane 2: Evidence ────────────────────────────────────────────────────────
function EvidencePlane({ history }) {
    const barMax = REF_bVsP * 1.05;
    return (
        <section>
            <PlaneHeader plane="Plane 2" title="Evidence" />
            {/* Column headers */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 80px 80px 100px 90px",
                gap: 8,
                paddingBottom: 8,
                borderBottom: `1px solid ${C.rule}`,
                marginBottom: 8,
            }}>
                {["consultation", "bVsP", "bVsR", "ret_close", "pressure", "judgment"].map(h => (
                    <Label key={h}>{h}</Label>
                ))}
            </div>
            {history.map((row, i) => {
                const js = JUDGMENT_STYLES[row.judgment] ?? JUDGMENT_STYLES._default;
                const ps = PRESSURE_STYLES[row.pressure] ?? PRESSURE_STYLES._default;
                const bVsP_pct = Math.min(row.bVsP / barMax, 1);
                const floor_pct = CHALLENGE_FLOOR / barMax;
                return (
                    <motion.div
                        key={row.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i, duration: 0.4 }}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 90px 80px 80px 100px 90px",
                            gap: 8,
                            alignItems: "center",
                            padding: "12px 0",
                            borderBottom: `1px solid ${C.rule}`,
                        }}
                    >
                        {/* label */}
                        <div>
                            <div style={{ fontFamily: C.sans, fontSize: 12, color: C.text, marginBottom: 4 }}>
                                {row.label}
                            </div>
                            {/* bVsP bar */}
                            <div style={{ position: "relative", height: 4, background: C.surfaceHigh, borderRadius: 2, width: "100%", maxWidth: 200 }}>
                                <div style={{
                                    position: "absolute", left: 0, top: 0, height: "100%",
                                    width: `${bVsP_pct * 100}%`,
                                    background: row.pressure === "none" ? C.green : C.yellow,
                                    borderRadius: 2,
                                    transition: "width 0.6s ease",
                                }} />
                                {/* floor marker */}
                                <div style={{
                                    position: "absolute",
                                    left: `${floor_pct * 100}%`,
                                    top: -2,
                                    bottom: -2,
                                    width: 1,
                                    background: C.red,
                                    opacity: 0.6,
                                }} />
                            </div>
                        </div>
                        {/* bVsP */}
                        <Mono style={{
                            fontSize: 12,
                            color: row.bVsP >= CHALLENGE_FLOOR ? C.green : C.yellow,
                            fontWeight: 600,
                        }}>
                            {row.bVsP.toFixed(4)}
                        </Mono>
                        {/* bVsR */}
                        <Mono style={{
                            fontSize: 12,
                            color: row.bVsR <= CHALLENGE_CEIL ? C.green : C.yellow,
                        }}>
                            {row.bVsR.toFixed(4)}
                        </Mono>
                        {/* return_close */}
                        <Mono style={{ fontSize: 12, color: row.return_close ? C.green : C.red }}>
                            {row.return_close ? "true" : "false"}
                        </Mono>
                        {/* pressure */}
                        <div style={{ fontFamily: C.mono, fontSize: 11, color: ps.color }}>
                            {ps.dot} {row.pressure}
                        </div>
                        {/* judgment */}
                        <Pill color={js.color} bg={js.bg} border={js.border}>
                            {js.label}
                        </Pill>
                    </motion.div>
                );
            })}
            <div style={{
                marginTop: 10,
                fontFamily: C.mono,
                fontSize: 10,
                color: C.textDim,
                display: "flex",
                gap: 20,
            }}>
                <span>ref bVsP = {REF_bVsP} · floor = {CHALLENGE_FLOOR}</span>
                <span>ref bVsR = {REF_bVsR} · ceil = {CHALLENGE_CEIL}</span>
                <span>red tick = challenge floor</span>
            </div>
        </section>
    );
}

// ─── Plane 3: Interpretation ──────────────────────────────────────────────────
function InterpretationPlane({ obj }) {
    return (
        <section>
            <PlaneHeader plane="Plane 3" title="Interpretation" />
            <div style={{
                padding: "14px 18px",
                background: C.surfaceHigh,
                border: `1px solid ${C.ruleLight}`,
                borderRadius: 6,
            }}>
                <div style={{
                    fontFamily: C.serif,
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: C.text,
                    marginBottom: 10,
                }}>
                    {obj.interpretation}
                </div>
                <div style={{
                    fontFamily: C.mono,
                    fontSize: 10,
                    color: C.textDim,
                    borderTop: `1px solid ${C.rule}`,
                    paddingTop: 8,
                }}>
                    derived · bounded · non-authoritative · not event truth · not prediction
                </div>
            </div>
        </section>
    );
}

// ─── Plane 4: Review / Trust Posture ─────────────────────────────────────────
function ReviewPlane({ obj }) {
    return (
        <section>
            <PlaneHeader plane="Plane 4" title="Review / Trust Posture" />
            <div style={{
                padding: "14px 18px",
                border: `1px solid ${C.rule}`,
                borderRadius: 6,
                background: C.surface,
                opacity: 0.9,  // intentionally slightly muted — lower authority than evidence
            }}>
                <div style={{ marginBottom: 14 }}>
                    <Label style={{ marginBottom: 6 }}>current_status</Label>
                    <Pill color={C.green} bg={C.greenFaint} border="#15803d">
                        {obj.current_status}
                    </Pill>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <Label style={{ marginBottom: 6 }}>allowed_use</Label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {obj.allowed_use.map((u, i) => (
                            <div key={i} style={{ fontFamily: C.mono, fontSize: 11, color: C.textMono }}>
                                ✓ {u}
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <Label style={{ marginBottom: 6 }}>explicit_non_claims</Label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {obj.explicit_non_claims.map((nc, i) => (
                            <Pill key={i} color={C.textDim} bg="transparent" border={C.rule}>
                                {nc}
                            </Pill>
                        ))}
                    </div>
                </div>
                <div style={{
                    marginTop: 14,
                    fontFamily: C.mono,
                    fontSize: 10,
                    color: C.amberDim,
                    borderTop: `1px solid ${C.rule}`,
                    paddingTop: 10,
                }}>
                    fenced · lower-authority than provenance/evidence · contestable · not permanent
                </div>
            </div>
        </section>
    );
}

// ─── Plane 5: Replay / History Timeline ──────────────────────────────────────
function HistoryPlane({ history }) {
    const [expanded, setExpanded] = useState(null);

    return (
        <section>
            <PlaneHeader plane="Plane 5" title="Replay / History" />
            <div style={{ position: "relative" }}>
                {/* Vertical line */}
                <div style={{
                    position: "absolute",
                    left: 11,
                    top: 8,
                    bottom: 8,
                    width: 1,
                    background: `linear-gradient(to bottom, ${C.amber}, ${C.amberDim})`,
                }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {history.map((entry, i) => {
                        const js = JUDGMENT_STYLES[entry.judgment] ?? JUDGMENT_STYLES._default;
                        const isOpen = expanded === entry.id;
                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 * i + 0.3, duration: 0.45, ease: "easeOut" }}
                                style={{ paddingLeft: 32, paddingBottom: 24, position: "relative" }}
                            >
                                {/* Timeline dot */}
                                <div style={{
                                    position: "absolute",
                                    left: 5,
                                    top: 4,
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    background: js.bg,
                                    border: `2px solid ${js.color}`,
                                    boxShadow: `0 0 8px ${js.color}44`,
                                }} />

                                {/* Entry header */}
                                <button
                                    onClick={() => setExpanded(isOpen ? null : entry.id)}
                                    style={{
                                        all: "unset",
                                        cursor: "pointer",
                                        display: "block",
                                        width: "100%",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                                        <span style={{
                                            fontFamily: C.sans,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: C.text,
                                        }}>
                                            {entry.label}
                                        </span>
                                        <Pill color={js.color} bg={js.bg} border={js.border}>
                                            {js.label}
                                        </Pill>
                                    </div>
                                    <div style={{ fontFamily: C.mono, fontSize: 11, color: C.textDim }}>
                                        {entry.environment} · {entry.when}
                                    </div>
                                </button>

                                {/* Expandable detail */}
                                {isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        style={{
                                            marginTop: 10,
                                            padding: "12px 14px",
                                            background: C.surfaceHigh,
                                            border: `1px solid ${C.ruleLight}`,
                                            borderRadius: 6,
                                        }}
                                    >
                                        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "6px 16px" }}>
                                            {[
                                                ["bVsP", entry.bVsP.toFixed(6)],
                                                ["bVsR", entry.bVsR.toFixed(6)],
                                                ["ret_close", String(entry.return_close)],
                                                ["pressure", entry.pressure],
                                                ["judgment", entry.judgment],
                                            ].map(([k, v]) => (
                                                <>
                                                    <Label key={`k-${k}`}>{k}</Label>
                                                    <Mono key={`v-${k}`} style={{ fontSize: 12 }}>{v}</Mono>
                                                </>
                                            ))}
                                        </div>
                                        <div style={{
                                            marginTop: 10,
                                            fontFamily: C.serif,
                                            fontSize: 13,
                                            lineHeight: 1.55,
                                            color: C.textMid,
                                        }}>
                                            {entry.judgment_note}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
            <div style={{
                fontFamily: C.mono,
                fontSize: 10,
                color: C.textDim,
                marginTop: 4,
            }}>
                click any entry to inspect · data from out_canon/ · read-side only
            </div>
        </section>
    );
}

// ─── Main demo component ──────────────────────────────────────────────────────
// MetaLayerConsultationDemo may be used in two modes:
//   1. Standalone (default): renders the hardcoded C1 room-change story.
//      This is the Internet Society demo mode — static, always available.
//   2. Live (when liveShellState prop is provided): renders the public_demo
//      projection from the tandem adapter over current shell state.
//      The static story is replaced with live run provenance and evidence.
//
// Mode 2 does NOT change the constitutional posture of the demo.
// Both modes are read-side only, non-authoritative, and provenance-first.
export default function MetaLayerConsultationDemo({ liveShellState = null } = {}) {
    // If live shell state is provided, compute the demo projection
    const liveProjection = liveShellState ? projectForDemo(liveShellState) : null;
    return (
        <div style={{
            minHeight: "100vh",
            background: C.bg,
            fontFamily: C.sans,
            padding: "40px 24px 80px",
        }}>
            {/* Font imports via style injection */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                button { font-family: inherit; }
            `}</style>

            <div style={{ maxWidth: 860, margin: "0 auto" }}>

                {/* Live shell state banner — only shown when tandem adapter provides live data */}
                {liveProjection && (
                    <div style={{
                        marginBottom: 20, padding: "10px 14px",
                        borderRadius: 6, border: `1px solid ${C.amberDim}`,
                        background: C.amberFaint,
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                        display: "flex", flexDirection: "column", gap: 4,
                    }}>
                        <div style={{ color: C.amber, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            live shell state · tandem adapter · public_demo projection
                        </div>
                        <div style={{ color: "#cbd5e1" }}>
                            {liveProjection.provenance?.object_label}
                        </div>
                        <div style={{ color: "#64748b" }}>
                            {(liveProjection.evidence?.summary_lines ?? []).join(" · ")}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 10 }}>
                            {liveProjection.interpretation?.derived_note}
                        </div>
                    </div>
                )}

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: 40 }}
                >
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 6,
                    }}>
                        {/* Active indicator */}
                        <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: C.amber,
                            boxShadow: `0 0 10px ${C.amber}`,
                        }} />
                        <span style={{
                            fontFamily: C.mono,
                            fontSize: 11,
                            color: C.amber,
                            textTransform: "uppercase",
                            letterSpacing: "0.16em",
                        }}>
                            Dynamical Memory Engine · {DEMO_OBJECT.object_label}
                        </span>
                    </div>
                    <h1 style={{
                        fontFamily: C.serif,
                        fontSize: 28,
                        fontWeight: 600,
                        color: C.text,
                        lineHeight: 1.3,
                        marginBottom: 10,
                        maxWidth: 680,
                    }}>
                        {DEMO_OBJECT.bounded_claim}
                    </h1>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <Pill color={C.green} bg={C.greenFaint} border="#15803d">
                            {DEMO_OBJECT.current_status}
                        </Pill>
                        <Mono style={{ fontSize: 11, color: C.textDim }}>
                            {DEMO_OBJECT.object_id}
                        </Mono>
                    </div>
                </motion.div>

                {/* ── Planes ── */}
                {[
                    { key: "provenance", delay: 0.1, content: <ProvenancePlane obj={DEMO_OBJECT} /> },
                    { key: "evidence", delay: 0.2, content: <EvidencePlane history={HISTORY} /> },
                    { key: "interpretation", delay: 0.25, content: <InterpretationPlane obj={DEMO_OBJECT} /> },
                    { key: "review", delay: 0.3, content: <ReviewPlane obj={DEMO_OBJECT} /> },
                    { key: "history", delay: 0.35, content: <HistoryPlane history={HISTORY} /> },
                ].map(({ key, delay, content }) => (
                    <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay, duration: 0.45, ease: "easeOut" }}
                        style={{ marginBottom: 32 }}
                    >
                        <Rule style={{ marginBottom: 24 }} />
                        {content}
                    </motion.div>
                ))}

                {/* ── Footer ── */}
                <Rule style={{ marginTop: 16 }} />
                <div style={{
                    marginTop: 20,
                    fontFamily: C.mono,
                    fontSize: 10,
                    color: C.textDim,
                    display: "flex",
                    gap: 24,
                    flexWrap: "wrap",
                }}>
                    <span>read-side only · not authority</span>
                    <span>Door Two canon consultation seam · DME v0.1</span>
                    <span>provenance stays primary · review posture stays bounded</span>
                </div>

            </div>
        </div>
    );
}
