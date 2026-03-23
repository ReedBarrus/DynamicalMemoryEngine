import React, { useMemo, useState } from "react";

import liveWorkbench from "../out_live/latest_workbench.json";
import liveCrossRun from "../out_live/latest_cross_run_report.json";

import baseline01Workbench from "../out_experiments/door_one_audio_slices_capstone/baseline_01/workbench.json";
import baseline02Workbench from "../out_experiments/door_one_audio_slices_capstone/baseline_02/workbench.json";
import baseline03Workbench from "../out_experiments/door_one_audio_slices_capstone/baseline_03/workbench.json";
import perturb01Workbench from "../out_experiments/door_one_audio_slices_capstone/perturb_01/workbench.json";
import perturb02Workbench from "../out_experiments/door_one_audio_slices_capstone/perturb_02/workbench.json";
import return01Workbench from "../out_experiments/door_one_audio_slices_capstone/return_01/workbench.json";
import return02Workbench from "../out_experiments/door_one_audio_slices_capstone/return_02/workbench.json";

import audioSlicesCrossRun from "../out_experiments/door_one_audio_slices_capstone/last_cross_run_report.json";

import DoorOneStructuralMemoryHUD from "./DoorOneStructuralMemoryHud.jsx";

const SOURCES = {
    live_latest: {
        label: "Live / Latest",
        crossRun: liveCrossRun,
        runs: {
            latest: {
                label: "latest",
                workbench: liveWorkbench,
            },
        },
    },

    audio_slices_capstone: {
        label: "Audio Slices Capstone",
        crossRun: audioSlicesCrossRun,
        runs: {
            baseline_01: { label: "baseline_01", workbench: baseline01Workbench },
            baseline_02: { label: "baseline_02", workbench: baseline02Workbench },
            baseline_03: { label: "baseline_03", workbench: baseline03Workbench },
            perturb_01: { label: "perturb_01", workbench: perturb01Workbench },
            perturb_02: { label: "perturb_02", workbench: perturb02Workbench },
            return_01: { label: "return_01", workbench: return01Workbench },
            return_02: { label: "return_02", workbench: return02Workbench },
        },
    },
};

function Select({ label, value, options, onChange }) {
    return (
        <label
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                minWidth: "220px",
            }}
        >
            <span
                style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#94a3b8",
                }}
            >
                {label}
            </span>

            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #334155",
                    background: "#0f172a",
                    color: "#e2e8f0",
                    outline: "none",
                }}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

export default function DoorOneStructuralMemoryHudDemo() {
    const [sourceKey, setSourceKey] = useState("audio_slices_capstone");
    const [runKey, setRunKey] = useState("baseline_01");

    const sourceOptions = useMemo(
        () =>
            Object.entries(SOURCES).map(([value, cfg]) => ({
                value,
                label: cfg.label,
            })),
        []
    );

    const runOptions = useMemo(() => {
        const source = SOURCES[sourceKey];
        return Object.entries(source.runs).map(([value, cfg]) => ({
            value,
            label: cfg.label,
        }));
    }, [sourceKey]);

    const selectedSource = SOURCES[sourceKey];

    const selectedRun = selectedSource.runs[runKey] ?? Object.values(selectedSource.runs)[0];

    const selectedWorkbench = selectedRun.workbench;
    const selectedCrossRun = selectedSource.crossRun;

    function handleSourceChange(nextSourceKey) {
        const nextSource = SOURCES[nextSourceKey];
        const firstRunKey = Object.keys(nextSource.runs)[0];
        setSourceKey(nextSourceKey);
        setRunKey(firstRunKey);
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#0b1020",
            }}
        >
            <div
                style={{
                    maxWidth: "1400px",
                    margin: "0 auto",
                    padding: "20px 20px 0 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: "16px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            color: "#94a3b8",
                            marginBottom: "6px",
                        }}
                    >
                        Door One HUD Demo
                    </div>
                    <div
                        style={{
                            fontSize: "14px",
                            color: "#cbd5e1",
                        }}
                    >
                        Read-side run selector for lawful inspection only.
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                    }}
                >
                    <Select
                        label="Source bundle"
                        value={sourceKey}
                        options={sourceOptions}
                        onChange={handleSourceChange}
                    />

                    <Select
                        label="Run label"
                        value={runKey}
                        options={runOptions}
                        onChange={setRunKey}
                    />
                </div>
            </div>

            <DoorOneStructuralMemoryHUD
                key={`${sourceKey}:${runKey}`}
                workbench={selectedWorkbench}
                crossRunReport={selectedCrossRun}
            />
        </div>
    );
}