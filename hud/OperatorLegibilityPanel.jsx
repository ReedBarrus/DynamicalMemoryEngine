import { buildOperatorLegibilityModel } from "./operatorLegibilityModel.js";

const C = {
    bg: "#0e1117",
    surface: "#161b27",
    surfaceHigh: "#1c2333",
    rule: "#1f2d45",
    ruleLight: "#263449",
    amber: "#f59e0b",
    amberDim: "#92610a",
    amberFaint: "#2a1e06",
    blue: "#3b82f6",
    blueFaint: "#0c1a3a",
    slate: "#94a3b8",
    slateDim: "#475569",
    slateFaint: "#111827",
    green: "#22c55e",
    greenFaint: "#052e16",
    red: "#ef4444",
    redFaint: "#2a0a0a",
    text: "#e2e8f0",
    textMid: "#94a3b8",
    textDim: "#475569",
    mono: "'IBM Plex Mono', 'Cascadia Code', monospace",
    sans: "'DM Sans', 'Inter', system-ui, sans-serif",
};

function tone(status) {
    if (
        status === "mechanized" ||
        status === "available" ||
        status === "retained" ||
        status === "replayable" ||
        status === "reconstructable" ||
        status === "memory_bearing" ||
        status === "directly_retained" ||
        status === "compressed_retained" ||
        status === "tier_0_live" ||
        status === "identity_conserved" ||
        status === "conserved" ||
        status === "conserved_support_trace"
    ) {
        return { fg: C.green, bg: C.greenFaint, border: C.green };
    }
    if (
        status === "awaiting_run" ||
        status === "candidate_only" ||
        status === "noise" ||
        status === "distortion" ||
        status === "coarse_runtime_support" ||
        status === "bounded_runtime_support" ||
        status === "partial_runtime_differentiation" ||
        status === "available_if_requested" ||
        status === "trace_available_if_requested" ||
        status === "downgraded" ||
        status === "partially_mechanized" ||
        status === "tier_2_plus_insufficient" ||
        status === "insufficient" ||
        status === "insufficient_support_trace" ||
        status === "degraded_residue" ||
        status === "retained_tier_insufficient" ||
        status === "replay_not_justified" ||
        status === "identity_degraded"
    ) {
        return { fg: C.amber, bg: C.amberFaint, border: C.amberDim };
    }
    if (
        status === "tier_1_receipt" ||
        status === "recurrence" ||
        status === "identity_narrowed" ||
        status === "memory_supporting" ||
        status === "degraded" ||
        status === "degraded_support_trace" ||
        status === "reconstructable_only" ||
        status === "narrowed" ||
        status === "narrowed_support_trace"
    ) {
        return { fg: C.blue, bg: C.blueFaint, border: C.blue };
    }
    if (
        status === "replay_support_only" ||
        status === "review_only" ||
        status === "reminted" ||
        status === "uncertainty" ||
        status === "identity_unresolved" ||
        status === "unresolved" ||
        status === "unresolved_support_trace" ||
        status === "review_required"
    ) {
        return { fg: C.slate, bg: C.slateFaint, border: C.slateDim };
    }
    if (status === "reconstructed") {
        return { fg: C.blue, bg: C.blueFaint, border: C.blue };
    }
    if (status === "failed" || status === "identity_broken" || status === "rupture") {
        return { fg: C.red, bg: C.redFaint, border: C.red };
    }
    return { fg: C.blue, bg: C.blueFaint, border: C.blue };
}

function Badge({ children, status }) {
    const t = tone(status);
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 999,
                border: `1px solid ${t.border}`,
                background: t.bg,
                color: t.fg,
                fontFamily: C.mono,
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </span>
    );
}

function Label({ children, style }) {
    return (
        <div
            style={{
                fontFamily: C.mono,
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: C.textDim,
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function AnswerRow({ label, value }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "110px minmax(0, 1fr)",
                gap: 10,
                alignItems: "start",
            }}
        >
            <div
                style={{
                    fontFamily: C.mono,
                    fontSize: 10,
                    color: C.textDim,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontFamily: C.sans,
                    fontSize: 13,
                    color: C.textMid,
                    lineHeight: 1.45,
                }}
            >
                {value}
            </div>
        </div>
    );
}

function ObjectCard({
    title,
    status,
    objectName,
    producedBy,
    dependsOn,
    currentStatus,
    legalClaim,
    nextAction,
    auditFacts = [],
    postureChips = [],
    postureNote = "",
}) {
    return (
        <div
            style={{
                border: `1px solid ${C.ruleLight}`,
                borderRadius: 12,
                background: C.surfaceHigh,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minWidth: 260,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                <div>
                    <Label style={{ marginBottom: 6 }}>{title}</Label>
                    <div style={{ fontFamily: C.sans, fontSize: 18, color: C.text, lineHeight: 1.2 }}>
                        {objectName}
                    </div>
                </div>
                <Badge status={status}>{status}</Badge>
            </div>

            <AnswerRow label="what object am I" value={objectName} />
            <AnswerRow label="how produced" value={producedBy} />
            <AnswerRow label="depends on" value={dependsOn} />
            <AnswerRow label="current status" value={currentStatus} />
            <AnswerRow label="legal claim" value={legalClaim} />
            <AnswerRow label="what next" value={nextAction} />

            {postureChips.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {postureChips.map((chip) => (
                        <Badge key={chip} status={chip}>{chip}</Badge>
                    ))}
                </div>
            )}

            {auditFacts.length > 0 && (
                <div
                    style={{
                        borderTop: `1px solid ${C.rule}`,
                        paddingTop: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}
                >
                    <Label style={{ color: C.amber }}>operator object audit</Label>
                    {auditFacts.map(([label, value]) => (
                        <AnswerRow key={label} label={label} value={value} />
                    ))}
                </div>
            )}

            {postureNote && (
                <div
                    style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: `1px solid ${C.rule}`,
                        background: C.surface,
                        fontFamily: C.sans,
                        fontSize: 13,
                        color: C.textMid,
                        lineHeight: 1.45,
                    }}
                >
                    {postureNote}
                </div>
            )}
        </div>
    );
}

function StageCard({ stage }) {
    if (Array.isArray(stage.objects)) {
        return (
            <div
                style={{
                    border: `1px solid ${C.rule}`,
                    borderRadius: 14,
                    background: C.surface,
                    padding: 16,
                    minWidth: 570,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                        <Label style={{ marginBottom: 6 }}>stage</Label>
                        <div style={{ fontFamily: C.sans, fontSize: 22, color: C.text }}>{stage.title}</div>
                    </div>
                    <Badge status={stage.status}>{stage.status}</Badge>
                </div>
                <div style={{ fontFamily: C.sans, fontSize: 14, color: C.textMid, lineHeight: 1.5 }}>
                    Replay and Reconstruction remain distinct bounded objects. Source-available versus retained-only basis,
                    fidelity posture, threshold posture, downgrade posture, and failure posture stay explicit here.
                    Structural identity remains grounded in bounded question, declared constraints, support survival,
                    and mechanized basis.
                    Memory-bearing status is support-grounded, not semantic or conversational.
                    Reminting is distinct from direct preservation. Compression convenience is not continuity proof.
                    Object handles aid tracking, but they are not full identity by themselves.
                    Tier 0 live support, Tier 1 receipt lineage, and Tier 2+ insufficiency are not equivalent.
                    Preserved does not mean equivalent.
                    Conserved, narrowed, degraded, insufficient, unresolved, and failed are separate bounded postures.
                    Noise, distortion, uncertainty, insufficiency, degradation, rupture, and recurrence are separate bounded accounting classes.
                    Semantic usefulness does not make an object memory-bearing.
                    Failure is not weak success. Insufficiency is not almost replayable. Unresolved is not degraded.
                    Displayed coherence is not preserved identity.
                    This surface uses a weak-state lattice, not a global confidence score.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {stage.objects.map((obj) => (
                        <ObjectCard key={obj.id} {...obj} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                border: `1px solid ${C.rule}`,
                borderRadius: 14,
                background: C.surface,
                padding: 16,
                minWidth: 320,
                display: "flex",
                flexDirection: "column",
                gap: 14,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                    <Label style={{ marginBottom: 6 }}>stage</Label>
                    <div style={{ fontFamily: C.sans, fontSize: 22, color: C.text }}>{stage.title}</div>
                </div>
                <Badge status={stage.status}>{stage.status}</Badge>
            </div>
            <AnswerRow label="what object am I" value={stage.objectName} />
            <AnswerRow label="how produced" value={stage.producedBy} />
            <AnswerRow label="depends on" value={stage.dependsOn} />
            <AnswerRow label="current status" value={stage.currentStatus} />
            <AnswerRow label="legal claim" value={stage.legalClaim} />
            <AnswerRow label="what next" value={stage.nextAction} />

            {stage.postureChips?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {stage.postureChips.map((chip) => (
                        <Badge key={chip} status={chip}>{chip}</Badge>
                    ))}
                </div>
            )}

            {stage.auditFacts?.length > 0 && (
                <div
                    style={{
                        borderTop: `1px solid ${C.rule}`,
                        paddingTop: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}
                >
                    <Label style={{ color: C.amber }}>operator class audit</Label>
                    {stage.auditFacts.map(([label, value]) => (
                        <AnswerRow key={label} label={label} value={value} />
                    ))}
                </div>
            )}

            {stage.postureNote && (
                <div
                    style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: `1px solid ${C.rule}`,
                        background: C.surface,
                        fontFamily: C.sans,
                        fontSize: 13,
                        color: C.textMid,
                        lineHeight: 1.45,
                    }}
                >
                    {stage.postureNote}
                </div>
            )}
        </div>
    );
}

function StageArrow() {
    return (
        <div
            aria-hidden="true"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.textDim,
                fontFamily: C.mono,
                fontSize: 18,
                minWidth: 24,
            }}
        >
            ->
        </div>
    );
}

function ComparisonCaseCard({ label, item }) {
    if (!item) {
        return (
            <div
                style={{
                    border: `1px solid ${C.ruleLight}`,
                    borderRadius: 12,
                    background: C.surfaceHigh,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <Label>{label}</Label>
                    <Badge status="awaiting_run">not in session</Badge>
                </div>
                <div style={{ fontFamily: C.sans, fontSize: 14, color: C.textMid, lineHeight: 1.5 }}>
                    No bounded comparison case of this source basis is currently present in session-backed history.
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                border: `1px solid ${C.ruleLight}`,
                borderRadius: 12,
                background: C.surfaceHigh,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Label>{label}</Label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge status="available">{item.sourceFamilyLabel}</Badge>
                    <Badge status={item.evidenceDepth.code}>{item.evidenceDepth.label}</Badge>
                </div>
            </div>
            <AnswerRow label="run" value={item.runLabel ?? "unknown"} />
            <AnswerRow label="profile" value={item.sourceProfile} />
            <AnswerRow label="runtime counts" value={`H1 ${item.counts.h1} | M1 ${item.counts.m1} | anomalies ${item.counts.anomalies}`} />
            <AnswerRow label="replay" value={`${item.replayStatus} | ${item.replayThresholdClass}`} />
            <AnswerRow label="reconstruction" value={`${item.reconstructionStatus} | ${item.reconstructionFidelityClass}`} />
            <AnswerRow label="support basis" value={item.supportBasis} />
        </div>
    );
}

export default function OperatorLegibilityPanel({ shellState }) {
    const model = buildOperatorLegibilityModel(shellState);

    return (
        <div
            style={{
                minHeight: "100%",
                background: C.bg,
                padding: "18px 18px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
            }}
        >
            <div
                style={{
                    border: `1px solid ${C.rule}`,
                    borderRadius: 14,
                    background: C.surface,
                    padding: 16,
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
                    gap: 14,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <Label>operator mode</Label>
                        <Badge status={model.hasActiveResult ? "available" : "awaiting_run"}>
                            {model.hasActiveResult ? "active path visible" : "awaiting active run"}
                        </Badge>
                    </div>
                    <div style={{ fontFamily: C.sans, fontSize: 24, color: C.text, lineHeight: 1.2 }}>
                        One bounded Door One object path, rendered for operator audit.
                    </div>
                    <div style={{ fontFamily: C.sans, fontSize: 14, color: C.textMid, lineHeight: 1.5 }}>
                        Source basis, structural anchor, retained support, replay and reconstruction posture,
                        interpretation overlay, and downstream review gate remain distinct and read-side.
                    </div>
                </div>

                <div
                    style={{
                        border: `1px solid ${C.ruleLight}`,
                        borderRadius: 12,
                        background: C.surfaceHigh,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <Label>source basis</Label>
                        <Badge status={model.hasActiveResult ? "available" : "awaiting_run"}>
                            {model.sourceBasis.sourceFamily}
                        </Badge>
                        <Badge status={model.evidenceDepth.code}>{model.evidenceDepth.label}</Badge>
                    </div>
                    <AnswerRow
                        label="active run"
                        value={model.sourceBasis.runLabel ?? "No active run is present in the shell yet."}
                    />
                    <AnswerRow
                        label="source id"
                        value={model.sourceBasis.sourceId ?? "No active source id yet."}
                    />
                    <AnswerRow
                        label="stream"
                        value={model.sourceBasis.streamId ?? "No active stream id yet."}
                    />
                    <AnswerRow
                        label="profile"
                        value={model.sourceBasis.sourceProfile}
                    />
                    <AnswerRow
                        label="evidence depth"
                        value={model.evidenceDepth.note}
                    />
                </div>
            </div>

            {model.sourceComparison && (
                <div
                    style={{
                        border: `1px solid ${C.rule}`,
                        borderRadius: 14,
                        background: C.surface,
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <Label>source-basis comparison</Label>
                        <Badge status="available">synthetic vs recorded</Badge>
                    </div>
                    <div style={{ fontFamily: C.sans, fontSize: 14, color: C.textMid, lineHeight: 1.5 }}>
                        Compare one bounded synthetic case and one bounded recorded case without flattening richer and coarser replay posture into one generic maturity story.
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <ComparisonCaseCard label="synthetic case" item={model.sourceComparison.synthetic} />
                        <ComparisonCaseCard label="recorded case" item={model.sourceComparison.recorded} />
                    </div>
                    <div
                        style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: `1px solid ${C.ruleLight}`,
                            background: C.surfaceHigh,
                            fontFamily: C.sans,
                            fontSize: 13,
                            color: C.textMid,
                            lineHeight: 1.5,
                        }}
                    >
                        {model.sourceComparison.summary}
                    </div>
                </div>
            )}

            <div
                style={{
                    border: `1px solid ${C.rule}`,
                    borderRadius: 14,
                    background: C.surface,
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                }}
            >
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Label>causal strip</Label>
                    <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                        Source -> Spectral State -> Retained Signature -> Replay / Reconstruction -> Interpretation Overlay -> Review Gate
                    </div>
                </div>
                <div style={{ fontFamily: C.sans, fontSize: 14, color: C.textMid, lineHeight: 1.5 }}>
                    Each stage answers the same six operator questions at a glance without collapsing replay,
                    reconstruction, retention, interpretation, and review into one vague story.
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 14,
                    overflowX: "auto",
                    paddingBottom: 6,
                    alignItems: "stretch",
                }}
            >
                {model.stages.map((stage, idx) => (
                    <div key={stage.id} style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
                        <StageCard stage={stage} />
                        {idx < model.stages.length - 1 ? <StageArrow /> : null}
                    </div>
                ))}
            </div>

            <div
                style={{
                    border: `1px solid ${C.rule}`,
                    borderRadius: 14,
                    background: C.surface,
                    padding: 16,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                }}
            >
                <div>
                    <Label style={{ marginBottom: 8 }}>operator audit block</Label>
                    <div style={{ fontFamily: C.sans, fontSize: 14, color: C.textMid, lineHeight: 1.55 }}>
                        Ask this surface: what object is active, where it came from, what transform produced
                        the next object, what remains source-available versus retained-only, what can legally
                        be claimed, and what can happen next.
                    </div>
                </div>
                <div>
                    <Label style={{ marginBottom: 8 }}>non-claims</Label>
                    <div style={{ fontFamily: C.sans, fontSize: 14, color: C.textMid, lineHeight: 1.55 }}>
                        Read-side only. Not authority. Replay is not fused with reconstruction. Prepared request
                        is not fulfilled review. Replay is not raw restoration. Reconstruction is not source
                        equivalence. Preserved does not mean equivalent. Current synthetic preset evidence can
                        remain coarse at top-line runtime counters and should be read that way. Failure remains
                        explicit failure. Insufficiency remains bounded insufficiency. Semantic summaries remain
                        interpretive and do not carry preservation by themselves. Semantic usefulness does not
                        make an object memory-bearing. Compression convenience does not prove direct preservation.
                        Reminting must not silently read as direct retention. One handle does not stand in for
                        full structural identity. Noise is not uncertainty. Distortion is not insufficiency.
                        This panel does not collapse weak states into one confidence score.
                    </div>
                </div>
            </div>
        </div>
    );
}
