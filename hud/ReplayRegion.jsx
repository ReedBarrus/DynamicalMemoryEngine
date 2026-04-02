// hud/ReplayRegion.jsx

import { useState } from "react";
import {
    buildRuntimeReconstructionReplay,
    buildRequestSupportReplay,
    downloadReplayJson,
} from "./replayModel.js";

export default function ReplayRegion({
    hasResult,
    workbench,
    runResult,
    requestLog,
    sourceFamilyLabel,
    onReplay,
    ui,
}) {
    const { C, Label } = ui;

    const [replayTarget, setReplayTarget] = useState("current_run");
    const [lastReplay, setLastReplay] = useState(null);
    const [activePanel, setActivePanel] = useState(null); // preserved even if currently unused

    const targetOptions = [
        { value: "current_run", label: "Current run · runtime reconstruction" },
        ...((requestLog ?? []).map((r, i) => ({
            value: `request:${r.request_id}`,
            label: `${r.request_type === "consultation" ? "CONSULT" : "ACT-REV"} · ${r.request_id?.slice(-8) ?? i}`,
        }))),
    ];

    const handlePrepareReplay = () => {
        if (!hasResult) return;

        let req;
        if (replayTarget === "current_run") {
            req = buildRuntimeReconstructionReplay({
                workbench,
                runResult,
                sourceFamilyLabel,
            });
        } else {
            const targetReq = (requestLog ?? []).find(
                (r) => `request:${r.request_id}` === replayTarget
            );
            req = buildRequestSupportReplay({
                targetRequest: targetReq,
                workbench,
                runResult,
                sourceFamilyLabel,
            });
        }

        setLastReplay(req);
        setActivePanel(req.replay_request_id);
        onReplay(req);
    };

    return (
        <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Label style={{ color: C.textDim, letterSpacing: "0.16em" }}>
                    E — Replay / Reconstruction
                </Label>
                <span style={{ fontFamily: C.mono, fontSize: 10, color: C.amberDim }}>
                    lens-bound support · not truth · not authority · Tier 0 live state
                </span>
            </div>

            {!hasResult && (
                <div
                    style={{
                        padding: "10px 14px",
                        borderRadius: 6,
                        border: `1px dashed ${C.rule}`,
                        background: C.surface,
                        fontFamily: C.mono,
                        fontSize: 11,
                        color: C.textDim,
                    }}
                >
                    run a source first to prepare a replay
                </div>
            )}

            {hasResult && (
                <div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: 10,
                            alignItems: "end",
                            marginBottom: 14,
                        }}
                    >
                        <div>
                            <Label style={{ marginBottom: 5 }}>replay target</Label>
                            <select
                                value={replayTarget}
                                onChange={(e) => setReplayTarget(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "7px 10px",
                                    borderRadius: 5,
                                    border: `1px solid ${C.ruleLight}`,
                                    background: C.surfaceHigh,
                                    color: C.text,
                                    fontFamily: C.mono,
                                    fontSize: 11,
                                    outline: "none",
                                }}
                            >
                                {targetOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handlePrepareReplay}
                            style={{
                                padding: "8px 16px",
                                borderRadius: 5,
                                cursor: "pointer",
                                border: `1px solid ${C.blue}`,
                                background: C.blueFaint,
                                color: C.blue,
                                fontFamily: C.mono,
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        >
                            ⟳ prepare replay
                        </button>
                    </div>

                    {lastReplay && lastReplay.request_status !== "failed" && (
                        <div
                            style={{
                                border: `1px solid ${C.ruleLight}`,
                                borderRadius: 6,
                                overflow: "hidden",
                                marginBottom: 10,
                            }}
                        >
                            <div
                                style={{
                                    padding: "8px 12px",
                                    background: C.surfaceHigh,
                                    borderBottom: `1px solid ${C.rule}`,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.blue }}>
                                    {lastReplay.replay_type === "runtime_reconstruction"
                                        ? "runtime reconstruction replay"
                                        : "request support replay"}
                                    {" · "}
                                    {lastReplay.replay_request_id?.slice(-12)}
                                </div>

                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        onClick={() => downloadReplayJson(lastReplay)}
                                        style={{
                                            padding: "3px 10px",
                                            borderRadius: 4,
                                            cursor: "pointer",
                                            border: `1px solid ${C.rule}`,
                                            background: "transparent",
                                            color: C.textDim,
                                            fontFamily: C.mono,
                                            fontSize: 10,
                                        }}
                                    >
                                        ↓ JSON
                                    </button>
                                </div>
                            </div>

                            <div
                                style={{
                                    padding: "12px 14px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                }}
                            >
                                <div
                                    style={{
                                        padding: "6px 10px",
                                        borderRadius: 4,
                                        border: `1px solid ${C.redFaint}`,
                                        background: C.redFaint,
                                        fontFamily: C.mono,
                                        fontSize: 10,
                                        color: "#f87171",
                                    }}
                                >
                                    {lastReplay.replay_posture}
                                </div>

                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>
                                        1 · Provenance
                                    </Label>
                                    <ReplayGrid
                                        ui={ui}
                                        rows={[
                                            ["source_family", lastReplay.source_family ?? "—"],
                                            ["stream_id", lastReplay.stream_id ?? "—"],
                                            ["run_label", lastReplay.run_label ?? "—"],
                                            ["replay_target", lastReplay.replay_target_ref ?? "—"],
                                            ["target_type", lastReplay.replay_target_type ?? "—"],
                                        ]}
                                    />
                                </div>

                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>
                                        2 · Runtime Evidence
                                    </Label>
                                    <ReplayGrid
                                        ui={ui}
                                        rows={[
                                            [
                                                "support_basis",
                                                (lastReplay.support_basis ?? []).join(" · ") || "—",
                                            ],
                                            ["anomaly_count", String(lastReplay.anomaly_count ?? 0)],
                                            [
                                                "cross_run",
                                                lastReplay.cross_run_available
                                                    ? `yes · ${lastReplay.cross_run_count ?? "?"}`
                                                    : "no",
                                            ],
                                            [
                                                "overall_readiness",
                                                lastReplay.overall_readiness ?? "—",
                                            ],
                                        ]}
                                    />
                                </div>

                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>
                                        3 · Declared Lens
                                    </Label>
                                    <ReplayGrid
                                        ui={ui}
                                        rows={[
                                            [
                                                "transform_family",
                                                lastReplay.declared_lens?.transform_family ?? "—",
                                            ],
                                            [
                                                "window_N / hop_N",
                                                `${lastReplay.declared_lens?.window_N ?? "—"} / ${lastReplay.declared_lens?.hop_N ?? "—"}`,
                                            ],
                                            [
                                                "Fs_target",
                                                String(lastReplay.declared_lens?.Fs_target ?? "—"),
                                            ],
                                            [
                                                "scale_posture",
                                                lastReplay.declared_lens?.scale_posture ?? "—",
                                            ],
                                            ["lens_note", lastReplay.declared_lens?.note ?? "—"],
                                        ]}
                                    />
                                </div>

                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>
                                        4 · Retained Tier
                                    </Label>
                                    <ReplayGrid
                                        ui={ui}
                                        rows={[
                                            [
                                                "tier_used",
                                                String(lastReplay.retained_tier_used?.tier_used ?? "—"),
                                            ],
                                            [
                                                "tier_label",
                                                lastReplay.retained_tier_used?.tier_label ?? "—",
                                            ],
                                            [
                                                "honest_posture",
                                                lastReplay.retained_tier_used?.honest_posture ?? "—",
                                            ],
                                            [
                                                "higher_tiers",
                                                lastReplay.retained_tier_used?.higher_tiers_note ?? "—",
                                            ],
                                        ]}
                                    />
                                </div>

                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>
                                        5 · Derived Posture / Non-Claims
                                    </Label>
                                    <div
                                        style={{
                                            fontFamily: C.mono,
                                            fontSize: 11,
                                            color: C.textDim,
                                            marginBottom: 6,
                                        }}
                                    >
                                        {lastReplay.derived_vs_durable}
                                    </div>

                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                        {(lastReplay.explicit_non_claims ?? []).map((nc, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    padding: "2px 8px",
                                                    borderRadius: 4,
                                                    border: `1px solid ${C.rule}`,
                                                    background: "transparent",
                                                    color: C.textDim,
                                                    fontFamily: C.mono,
                                                    fontSize: 10,
                                                }}
                                            >
                                                {nc}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {lastReplay.replay_type === "request_support_replay" && (
                                    <div
                                        style={{
                                            padding: "6px 10px",
                                            borderRadius: 4,
                                            border: `1px solid ${C.amberDim}`,
                                            background: C.amberFaint,
                                            fontFamily: C.mono,
                                            fontSize: 10,
                                            color: C.amberDim,
                                        }}
                                    >
                                        replay of support context · the original request has not been
                                        fulfilled · this is not fulfillment
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {lastReplay?.request_status === "failed" && (
                        <div
                            style={{
                                padding: "8px 12px",
                                borderRadius: 5,
                                border: `1px solid ${C.red}`,
                                background: C.redFaint,
                                fontFamily: C.mono,
                                fontSize: 11,
                                color: C.red,
                            }}
                        >
                            replay failed: {lastReplay.failure_reason}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ReplayGrid({ rows, ui }) {
    const { C, Label } = ui;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {rows.map(([k, v]) => (
                <div
                    key={k}
                    style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 10 }}
                >
                    <Label style={{ paddingTop: 1, fontSize: 9 }}>{k}</Label>
                    <span
                        style={{
                            fontFamily: C.mono,
                            fontSize: 11,
                            color: C.textMono,
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                        }}
                    >
                        {v}
                    </span>
                </div>
            ))}
        </div>
    );
}