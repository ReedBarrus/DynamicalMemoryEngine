function clamp01(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function toCellColor(value) {
    const normalized = clamp01(value);
    const hue = 36 - normalized * 20;
    const saturation = 58 + normalized * 16;
    const lightness = 12 + normalized * 54;
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export default function StaticSpectralViewer({ payload }) {
    const spectral = payload?.structural?.spectral;
    const frames = Array.isArray(spectral?.frames) ? spectral.frames : [];

    if (!spectral || frames.length === 0) {
        return null;
    }

    const bandCount = Math.max(1, spectral.band_count ?? 1);
    const frameCount = frames.length;
    const cellWidth = 74;
    const cellHeight = 54;
    const gap = 4;
    const width = frameCount * cellWidth + Math.max(0, frameCount - 1) * gap;
    const height = bandCount * cellHeight + Math.max(0, bandCount - 1) * gap;
    const maxBandEnergy = Number.isFinite(spectral.max_band_energy) ? spectral.max_band_energy : 1;

    return (
        <div
            data-viewer-kind="static-spectral-heatmap"
            style={{
                display: "grid",
                placeItems: "center",
                width: "100%",
                padding: 0,
                margin: 0,
            }}
        >
            <svg
                viewBox={`0 0 ${width} ${height}`}
                style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    maxWidth: `${width}px`,
                }}
            >
                <rect
                    x="0"
                    y="0"
                    width={width}
                    height={height}
                    fill="#0b0b0b"
                    rx="14"
                />

                {frames.map((frame, frameIndex) =>
                    Array.from({ length: bandCount }, (_, bandIndex) => {
                        const energy = frame.band_energy?.[bandIndex] ?? 0;
                        const x = frameIndex * (cellWidth + gap);
                        const y = (bandCount - bandIndex - 1) * (cellHeight + gap);
                        return (
                            <rect
                                key={`${frame.state_id}-${bandIndex}`}
                                x={x}
                                y={y}
                                width={cellWidth}
                                height={cellHeight}
                                rx="8"
                                fill={toCellColor(energy / maxBandEnergy)}
                                stroke="#050505"
                                strokeWidth="1.5"
                            />
                        );
                    })
                )}
            </svg>
        </div>
    );
}
