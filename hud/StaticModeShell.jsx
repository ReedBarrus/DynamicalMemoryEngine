import ViewerModeShellFrame from "./ViewerModeShellFrame.jsx";
import StaticEnergyViewer from "./StaticEnergyViewer.jsx";
import StaticSpectralViewer from "./StaticSpectralViewer.jsx";

export default function StaticModeShell({ payload, onGoHome, onOpenLegacy }) {
    return (
        <ViewerModeShellFrame
            modeLabel="Static"
            modeTitle="Bounded structural mode shell"
            modeNote="Static mode is for bounded objects, comparison, and provenance-forward reading without live pacing pressure or Live telemetry posture."
            payload={payload}
            onGoHome={onGoHome}
            onOpenLegacy={onOpenLegacy}
        >
            <div style={{ display: "grid", gap: "12px" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                        alignItems: "baseline",
                    }}
                >
                    <div
                        style={{
                            color: "#e2e8f0",
                            fontSize: "14px",
                            fontWeight: 600,
                        }}
                    >
                        Static Evidence Body
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5 }}>
                        Static mode is not live playback paused. Structure first. Provenance visible. No Live telemetry import.
                    </div>
                </div>

                <StaticSpectralViewer payload={payload} />
                <StaticEnergyViewer payload={payload} />
            </div>
        </ViewerModeShellFrame>
    );
}
