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
                                        2 · Reconstruction Summary
                                    </Label>
                                    <ReplayGrid
                                        ui={ui}
                                        rows={[
                                            ["reconstruction_type", lastReplay.reconstruction_type ?? "—"],
                                            ["reconstruction_status", lastReplay.reconstruction_status ?? "—"],
                                            ["reconstruction_class", lastReplay.reconstruction_summary?.reconstruction_class ?? "—"],
                                            ["evidence_refs", String(lastReplay.reconstruction_summary?.evidence_refs ?? 0)],
                                            ["support_basis_count", String(lastReplay.reconstruction_summary?.support_basis_count ?? 0)],
                                            ["runtime_available", String(lastReplay.reconstruction_summary?.runtime_available ?? "—")],
                                            ["latency_posture", lastReplay.latency_posture ?? "—"],
                                            ["fidelity_posture", lastReplay.fidelity_posture ?? "—"],
                                        ]}
                                    />
                                </div>

                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>
                                        3 · Threshold Posture / Downgrade
                                    </Label>
                                    <ReplayGrid
                                        ui={ui}
                                        rows={[
                                            ["local_invariance", lastReplay.threshold_posture?.local_invariance ?? "—"],
                                            ["compression_survival", lastReplay.threshold_posture?.compression_survival ?? "—"],
                                            ["distortion_posture", lastReplay.threshold_posture?.distortion_posture ?? "—"],
                                            ["retained_tier_sufficiency", lastReplay.threshold_posture?.retained_tier_sufficiency ?? "—"],
                                            ["downgrade_output", lastReplay.threshold_posture?.downgrade_output ?? "none"],
                                            ["threshold_notes", lastReplay.threshold_posture?.notes ?? "—"],
                                        ]}
                                    />
                                    {lastReplay.threshold_posture?.downgrade_output && (
                                        <div
                                            style={{
                                                marginTop: 8,
                                                padding: "6px 10px",
                                                borderRadius: 4,
                                                border: `1px solid ${C.amberDim}`,
                                                background: C.amberFaint,
                                                fontFamily: C.mono,
                                                fontSize: 10,
                                                color: C.amberDim,
                                            }}
                                        >
                                            explicit downgrade: {lastReplay.threshold_posture.downgrade_output}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>
                                        4 · Reconstruction Trace
                                    </Label>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {(lastReplay.reconstruction_trace ?? []).map((step, i) => (
                                            <div
                                                key={`${step.step_index ?? i}-${step.step_type ?? "trace"}`}
                                                style={{
                                                    padding: "8px 10px",
                                                    borderRadius: 4,
                                                    border: `1px solid ${C.rule}`,
                                                    background: C.surface,
                                                }}
                                            >
                                                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.blue, marginBottom: 3 }}>
                                                    {step.step_index ?? i} · {step.step_type ?? "trace_step"} · {step.status ?? "—"}
                                                </div>
                                                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.textMono, marginBottom: 3 }}>
                                                    {step.label ?? "—"}
                                                </div>
                                                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim, lineHeight: 1.5 }}>
                                                    {step.detail ?? "—"}
                                                </div>
                                                {step.non_authority_note && (
                                                    <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, marginTop: 4 }}>
                                                        {step.non_authority_note}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label style={{ marginBottom: 6, color: C.amber }}>
                                        5 · Non-Claims / Request Posture
                                    </Label>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
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
