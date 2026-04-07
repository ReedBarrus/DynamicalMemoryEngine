// tests/hud/app_surfaces/test_mode_router_empty_viewers.js
//
// Seam-local contract tests for mode shells and state threading.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildStructuralViewerPayload } from "../../../hud/adapters/structuralViewerPayloadAdapter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let PASS = 0;
let FAIL = 0;
function section(title) { console.log(`\n-- ${title} --`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ok ${label}`); }
    else { FAIL++; console.error(`  not ok ${label}`); }
}
function eq(actual, expected, label) {
    ok(
        Object.is(actual, expected),
        `${label}${Object.is(actual, expected) ? "" : ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`
    );
}
function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const INPUT = {
    mode: "inspection",
    sourceFamilyLabel: "Synthetic Signal",
    runResult: {
        ok: true,
        run_label: "run.viewer.mode-shells.001",
        artifacts: {
            a1: {
                source_id: "synthetic.mode.shells",
                timestamps: [0, 1],
            },
        },
    },
    workbench: {
        scope: {
            stream_id: "stream.mode.shells.001",
            source_id: "synthetic.mode.shells",
        },
        runtime: {
            substrate: {
                basin_count: 1,
                state_count: 2,
            },
            artifacts: {
                h1s: [
                    {
                        state_id: "H1:mode.shell:0",
                        segment_id: "seg-001",
                        window_span: { t_start: 0, t_end: 0.5, duration_sec: 0.5, window_count: 1 },
                        invariants: {
                            energy_norm: 1,
                            band_profile_norm: { band_edges: [0, 4, 8], band_energy: [0.85, 0.15] },
                        },
                    },
                    {
                        state_id: "H1:mode.shell:1",
                        segment_id: "seg-001",
                        window_span: { t_start: 0.5, t_end: 1, duration_sec: 0.5, window_count: 1 },
                        invariants: {
                            energy_norm: 1,
                            band_profile_norm: { band_edges: [0, 4, 8], band_energy: [0.3, 0.7] },
                        },
                    },
                ],
                anomaly_reports: [],
            },
        },
    },
};

let routerSrc = null;
let liveSrc = null;
let staticSrc = null;
let inspectionSrc = null;
let frameSrc = null;
let shellStateRouterSrc = null;
let executionShellSrc = null;
let liveContinuousViewerSrc = null;
let staticSpectralViewerSrc = null;
let staticEnergyViewerSrc = null;

try { routerSrc = await readFile(path.join(ROOT, "hud/HomeRouterShell.jsx"), "utf8"); } catch (_) {}
try { liveSrc = await readFile(path.join(ROOT, "hud/LiveModeShell.jsx"), "utf8"); } catch (_) {}
try { staticSrc = await readFile(path.join(ROOT, "hud/StaticModeShell.jsx"), "utf8"); } catch (_) {}
try { inspectionSrc = await readFile(path.join(ROOT, "hud/InspectionModeShell.jsx"), "utf8"); } catch (_) {}
try { frameSrc = await readFile(path.join(ROOT, "hud/ViewerModeShellFrame.jsx"), "utf8"); } catch (_) {}
try { shellStateRouterSrc = await readFile(path.join(ROOT, "hud/shellStateRouter.js"), "utf8"); } catch (_) {}
try { executionShellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch (_) {}
try { liveContinuousViewerSrc = await readFile(path.join(ROOT, "hud/LiveContinuousStructuralViewer.jsx"), "utf8"); } catch (_) {}
try { staticSpectralViewerSrc = await readFile(path.join(ROOT, "hud/StaticSpectralViewer.jsx"), "utf8"); } catch (_) {}
try { staticEnergyViewerSrc = await readFile(path.join(ROOT, "hud/StaticEnergyViewer.jsx"), "utf8"); } catch (_) {}

section("A. Mode shell files exist and are wired");
ok(routerSrc !== null, "A1: HomeRouterShell exists");
ok(liveSrc !== null, "A2: LiveModeShell exists");
ok(staticSrc !== null, "A3: StaticModeShell exists");
ok(inspectionSrc !== null, "A4: InspectionModeShell exists");
ok(frameSrc !== null, "A5: ViewerModeShellFrame exists");
ok(shellStateRouterSrc !== null, "A6: shellStateRouter exists");
ok(liveContinuousViewerSrc !== null, "A7: LiveContinuousStructuralViewer exists");
ok(staticSpectralViewerSrc !== null, "A8: StaticSpectralViewer exists");
ok(staticEnergyViewerSrc !== null, "A9: StaticEnergyViewer exists");
if (routerSrc) {
    ok(routerSrc.includes('import LiveModeShell from "./LiveModeShell.jsx";'), "A10: router imports LiveModeShell");
    ok(routerSrc.includes('import StaticModeShell from "./StaticModeShell.jsx";'), "A11: router imports StaticModeShell");
    ok(routerSrc.includes('import InspectionModeShell from "./InspectionModeShell.jsx";'), "A12: router imports InspectionModeShell");
    ok(routerSrc.includes("readPublishedShellState"), "A13: router reads published shell state");
    ok(routerSrc.includes("ACTIVE_SHELL_STATE_EVENT"), "A14: router listens for published shell-state updates");
}

section("B. Distinct mode posture stays explicit");
if (liveSrc) {
    ok(liveSrc.includes("Runtime-facing mode shell"), "B1: live shell title is explicit");
    ok(liveSrc.includes("Live Telemetry Rail"), "B2: live shell includes compact telemetry rail");
    ok(liveSrc.includes("Runtime/view timing posture"), "B3: live shell labels telemetry as timing posture");
    ok(liveSrc.includes("Unwired metrics:"), "B4: live shell keeps unavailable telemetry explicit");
    ok(liveSrc.includes("LiveContinuousStructuralViewer"), "B5: live shell mounts the continuous structural viewer");
    ok(liveSrc.includes("Structural priority"), "B6: live shell keeps structural-first posture");
}
if (staticSrc) {
    ok(staticSrc.includes("Bounded structural mode shell"), "B7: static shell title is explicit");
    ok(staticSrc.includes("Static mode is not live playback paused."), "B8: static shell avoids fake live posture");
    ok(staticSrc.includes("Provenance-first reading"), "B9: static shell keeps provenance visible");
    ok(staticSrc.includes("StaticSpectralViewer"), "B10: static shell mounts the static spectral viewer");
    ok(staticSrc.includes("StaticEnergyViewer"), "B11: static shell mounts the static energy viewer");
    ok(staticSrc.includes("Timing boundary"), "B12: static shell keeps timing boundary explicit");
    ok(staticSrc.includes("Energy face"), "B13: static shell keeps the second static face explicit");
    ok(!staticSrc.includes("Live Telemetry Rail"), "B14: static shell does not inherit live telemetry rail");
}
if (inspectionSrc) {
    ok(inspectionSrc.includes("Audit-facing mode shell"), "B15: inspection shell title is explicit");
    ok(inspectionSrc.includes("does not silently become the default top-level face again"), "B16: inspection shell stays non-default");
    ok(inspectionSrc.includes("settlement, identity continuity, or canon posture"), "B17: inspection shell avoids semantic inflation");
    ok(!inspectionSrc.includes("Live Telemetry Rail"), "B18: inspection shell does not inherit live telemetry rail");
}
if (liveContinuousViewerSrc) {
    ok(liveContinuousViewerSrc.includes("Frequency-time structural surface"), "B19: continuous viewer names the frequency-time structural surface");
    ok(liveContinuousViewerSrc.includes("shared structural payload seam"), "B20: continuous viewer keeps the shared payload seam explicit");
    ok(liveContinuousViewerSrc.includes("settlement, identity continuity, or semantic closure"), "B21: continuous viewer avoids semantic overclosure");
    ok(liveContinuousViewerSrc.includes("No H1 spectral frames are currently visible"), "B22: continuous viewer keeps fallback explicit");
}
if (staticSpectralViewerSrc) {
    ok(staticSpectralViewerSrc.includes("Static Spectral Viewer"), "B23: static viewer declares a dedicated static structural face");
    ok(staticSpectralViewerSrc.includes("Bounded frequency-time object"), "B24: static viewer uses bounded object posture");
    ok(staticSpectralViewerSrc.includes("provenance-forward"), "B25: static viewer keeps provenance-forward posture explicit");
    ok(staticSpectralViewerSrc.includes("No bounded spectral frames are currently visible"), "B26: static viewer keeps explicit fallback");
    ok(!staticSpectralViewerSrc.includes("Live Telemetry Rail"), "B27: static viewer does not inherit the live telemetry rail");
}
if (staticEnergyViewerSrc) {
    ok(staticEnergyViewerSrc.includes("Static Energy Viewer"), "B28: energy viewer declares a dedicated static energy face");
    ok(staticEnergyViewerSrc.includes("Bounded energy / amplitude object"), "B29: energy viewer uses bounded energy posture");
    ok(staticEnergyViewerSrc.includes("envelope and amplitude shape"), "B30: energy viewer stays distinct from the spectral face");
    ok(staticEnergyViewerSrc.includes("No energy-capable structural frames are currently visible"), "B31: energy viewer keeps explicit fallback");
    ok(!staticEnergyViewerSrc.includes("Live Telemetry Rail"), "B32: energy viewer does not inherit the live telemetry rail");
}

section("C. Shared payload seam remains the common base");
if (frameSrc) {
    ok(frameSrc.includes("All mode shells consume the same shared payload seam."), "C1: shared frame declares one payload seam");
    ok(frameSrc.includes("Mode changes posture, not truth source."), "C2: frame rejects mode-local truth drift");
    ok(frameSrc.includes("payload.structural"), "C3: frame reads structural payload");
    ok(frameSrc.includes("payload.overlays"), "C4: frame treats overlays as optional");
    ok(frameSrc.includes("payload.telemetry?.placeholder_status"), "C5: frame keeps telemetry placeholder posture shallow");
    ok(frameSrc.includes("payload.source.state_basis"), "C6: frame exposes state basis");
    ok(frameSrc.includes("payload.source.state_availability"), "C7: frame exposes fallback posture when state is absent");
    ok(!frameSrc.includes("Live Telemetry Rail"), "C8: shared frame does not itself become the live telemetry rail");
    ok(!frameSrc.includes("settlement_report"), "C9: frame does not require settlement_report");
    ok(!frameSrc.includes("identity_audit"), "C10: frame does not require identity_audit");
}

section("D. State threading remains honest");
if (routerSrc) {
    ok(routerSrc.includes("runResult: activeShellState?.hasActiveResult ? activeShellState.runResult : null"), "D1: router only threads runResult when active state exists");
    ok(routerSrc.includes("workbench: activeShellState?.hasActiveResult ? activeShellState.workbench : null"), "D2: router only threads workbench when active state exists");
    ok(routerSrc.includes("requestLog: activeShellState?.requestLog ?? []"), "D3: router threads request log through shared payload seam");
    ok(routerSrc.includes("replayLog: activeShellState?.replayLog ?? []"), "D4: router threads replay log through shared payload seam");
    ok(routerSrc.includes('sourceFamilyLabel: activeShellState?.sourceFamilyLabel ?? "unspecified"'), "D5: router keeps explicit source-family fallback");
}
if (executionShellSrc) {
    ok(executionShellSrc.includes("publishActiveShellState(activeShellState)"), "D6: execution shell publishes active state");
}
if (shellStateRouterSrc) {
    ok(shellStateRouterSrc.includes("readPublishedShellState"), "D7: shellStateRouter can read published state");
    ok(shellStateRouterSrc.includes("publishActiveShellState"), "D8: shellStateRouter can publish active state");
}

section("E. Adapter output still feeds the shells honestly");
{
    const livePayload = buildStructuralViewerPayload({ ...INPUT, mode: "live" });
    const staticPayload = buildStructuralViewerPayload({ ...INPUT, mode: "static" });
    const inspectionPayload = buildStructuralViewerPayload({ ...INPUT, mode: "inspection" });

    eq(livePayload.source.source_id, staticPayload.source.source_id, "E1: source header is shared across modes");
    eq(JSON.stringify(staticPayload.lineage.provenance_refs), JSON.stringify(inspectionPayload.lineage.provenance_refs), "E2: lineage provenance stays shared across modes");
    ok(JSON.stringify(livePayload.structural) === JSON.stringify(inspectionPayload.structural), "E3: structural base does not drift by mode");
    eq(livePayload.source.state_basis, "active_shell_state", "E4: active payload exposes active shell state basis");
    eq(livePayload.telemetry?.rail_status, "live_runtime_attached", "E5: live telemetry rail reports attached live runtime");
    eq(livePayload.telemetry?.placeholder_status, "timing_metrics_partially_unwired", "E6: live telemetry keeps unwired metrics explicit");
    ok(Array.isArray(livePayload.telemetry?.unavailable_fields), "E7: live telemetry lists unavailable metrics");
    eq(livePayload.structural.spectral.viewer_kind, "frequency_time_spectral_v0", "E8: live payload exposes a real spectral projection");
    eq(livePayload.structural.spectral.frame_count, 2, "E9: live payload keeps real spectral frame count");
    eq(staticPayload.structural.spectral.viewer_kind, "frequency_time_spectral_v0", "E10: static payload exposes the shared spectral projection");
    eq(staticPayload.structural.energy.viewer_kind, "energy_amplitude_view_v0", "E11: static payload exposes the shared energy projection");
    eq(staticPayload.telemetry, undefined, "E12: static telemetry remains optional");
    eq(inspectionPayload.telemetry, undefined, "E13: inspection telemetry remains optional");
    ok(!JSON.stringify(inspectionPayload).includes('"settlement_report"'), "E14: settlement_report remains non-required");
    ok(!JSON.stringify(inspectionPayload).includes('"identity_audit"'), "E15: identity_audit remains non-required");
}

section("F. Fallback posture remains explicit when real state is absent");
{
    const fallbackPayload = buildStructuralViewerPayload({
        mode: "static",
        sourceFamilyLabel: "Recorded Source (WAV fixture)",
        runStatus: "error",
        runError: "adapter failed",
        hasActiveResult: false,
    });

    eq(fallbackPayload.source.state_basis, "shell_state_fallback", "F1: shell-state fallback remains explicit");
    ok(String(fallbackPayload.source.state_availability).includes("adapter failed"), "F2: fallback status carries current error posture");
    ok(fallbackPayload.lineage.generated_from.includes("shell_state_fallback"), "F3: lineage records shell-state fallback basis");
    ok(JSON.stringify(fallbackPayload.structural) === "{}", "F4: fallback does not fake structural sections");
    eq(fallbackPayload.overlays, undefined, "F5: fallback does not require overlays");
}

finish();
