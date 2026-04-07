import { useEffect, useState } from "react";
import { buildStructuralViewerPayload } from "./adapters/structuralViewerPayloadAdapter.js";
import InspectionModeShell from "./InspectionModeShell.jsx";
import LiveModeShell from "./LiveModeShell.jsx";
import SemanticOscilloscopeApp from "./SemanticOscilloscopeApp.jsx";
import { ACTIVE_SHELL_STATE_EVENT, readPublishedShellState } from "./shellStateRouter.js";
import StaticModeShell from "./StaticModeShell.jsx";

const ROUTES = {
    home: "/home",
    live: "/live",
    static: "/static",
    inspection: "/inspection",
    legacy: "/legacy-composed",
};

const C = {
    bg: "#0b1020",
    surface: "#121a2b",
    surfaceAlt: "#0f172a",
    rule: "#243047",
    ruleStrong: "#334155",
    amber: "#f59e0b",
    amberFaint: "#2b1d08",
    blue: "#60a5fa",
    text: "#e2e8f0",
    textMid: "#94a3b8",
    textDim: "#64748b",
    mono: "'IBM Plex Mono', 'Cascadia Code', monospace",
    sans: "'DM Sans', 'Inter', system-ui, sans-serif",
};

const VIEWER_ROUTES = [
    {
        id: "live",
        path: ROUTES.live,
        label: "Live",
        note: "Runtime-facing destination reserved for timing-honest structural viewing.",
        guidance:
            "Live viewers belong here once shared viewer payload and live telemetry wiring are introduced.",
    },
    {
        id: "static",
        path: ROUTES.static,
        label: "Static",
        note: "Bounded structural viewing route reserved for pauseable, provenance-forward inspection.",
        guidance:
            "Static viewers belong here once bounded structural objects are routed through the shared viewer payload seam.",
    },
    {
        id: "inspection",
        path: ROUTES.inspection,
        label: "Inspection",
        note: "Dense audit-facing route reserved for workbench-native forensics and structural questioning.",
        guidance:
            "Inspection migration belongs here later; the current composed surface remains the transitional legacy route for now.",
    },
];

function normalizeHash(hash) {
    const trimmed = String(hash ?? "").trim();
    if (!trimmed || trimmed === "#") return ROUTES.home;

    const candidate = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
    if (Object.values(ROUTES).includes(candidate)) return candidate;
    return ROUTES.home;
}

function routeHref(path) {
    return `#${path}`;
}

function navigate(path) {
    const nextHash = routeHref(path);
    if (window.location.hash === nextHash) return;
    window.location.hash = nextHash;
}

function openStandalone(path) {
    window.location.href = path;
}

function buildRoutePayload(mode, shellState) {
    const activeShellState = shellState && typeof shellState === "object" ? shellState : null;
    return buildStructuralViewerPayload({
        mode,
        runResult: activeShellState?.hasActiveResult ? activeShellState.runResult : null,
        workbench: activeShellState?.hasActiveResult ? activeShellState.workbench : null,
        requestLog: activeShellState?.requestLog ?? [],
        replayLog: activeShellState?.replayLog ?? [],
        sourceFamilyLabel: activeShellState?.sourceFamilyLabel ?? "unspecified",
        runStatus: activeShellState?.runStatus ?? "idle",
        runError: activeShellState?.runError ?? null,
        hasActiveResult: activeShellState?.hasActiveResult ?? false,
    });
}

function NavPill({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "8px 12px",
                borderRadius: "999px",
                border: `1px solid ${active ? C.amber : C.ruleStrong}`,
                background: active ? C.amberFaint : "transparent",
                color: active ? C.amber : C.textMid,
                cursor: "pointer",
                fontFamily: C.mono,
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
            }}
        >
            {label}
        </button>
    );
}

function SectionCard({ eyebrow, title, note, children }) {
    return (
        <div
            style={{
                border: `1px solid ${C.rule}`,
                borderRadius: "18px",
                background: C.surface,
                padding: "18px",
                boxShadow: "0 12px 28px rgba(0, 0, 0, 0.18)",
            }}
        >
            {eyebrow ? (
                <div
                    style={{
                        marginBottom: "8px",
                        color: C.textDim,
                        fontFamily: C.mono,
                        fontSize: "11px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                    }}
                >
                    {eyebrow}
                </div>
            ) : null}
            <div style={{ color: C.text, fontSize: "22px", fontWeight: 600, marginBottom: "8px" }}>
                {title}
            </div>
            {note ? (
                <div style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.5, marginBottom: "16px" }}>
                    {note}
                </div>
            ) : null}
            {children}
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "150px 1fr",
                gap: "10px",
                padding: "10px 0",
                borderBottom: `1px solid ${C.rule}`,
            }}
        >
            <div
                style={{
                    color: C.textDim,
                    fontFamily: C.mono,
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                }}
            >
                {label}
            </div>
            <div style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.5 }}>
                {value}
            </div>
        </div>
    );
}

function RouteCard({ title, note, path, onOpen }) {
    return (
        <div
            style={{
                border: `1px solid ${C.ruleStrong}`,
                borderRadius: "16px",
                padding: "16px",
                background: C.surfaceAlt,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    width: "fit-content",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    border: `1px solid ${C.blue}`,
                    color: C.blue,
                    fontFamily: C.mono,
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                }}
            >
                {path}
            </div>
            <div style={{ color: C.text, fontSize: "18px", fontWeight: 600 }}>
                {title}
            </div>
            <div style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.5 }}>
                {note}
            </div>
            <button
                onClick={onOpen}
                style={{
                    width: "fit-content",
                    marginTop: "auto",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: `1px solid ${C.ruleStrong}`,
                    background: C.surface,
                    color: C.text,
                    cursor: "pointer",
                    fontSize: "13px",
                }}
            >
                Open route
            </button>
        </div>
    );
}

function HomeRoute({ shellState }) {
    const currentSourceContext = shellState?.hasActiveResult
        ? `${shellState.sourceFamilyLabel} / ${shellState.activeRunLabel ?? "active run"}`
        : "Awaiting exported runtime/workbench state from execution surfaces.";
    const currentRunPosture = shellState?.hasActiveResult
        ? "Active runtime/workbench state is available to viewer routes through the shared payload seam."
        : shellState?.runError
        ? `No active result. Last shell state reported error: ${shellState.runError}`
        : `No active result. Current shell state posture: ${shellState?.runStatus ?? "idle"}`;

    return (
        <div style={{ display: "grid", gap: "18px" }}>
            <SectionCard
                eyebrow="Home / Router Shell"
                title="Thin top-level app face"
                note="This shell frames route choice and posture only. It does not become the dense inspection surface, the truth wall, or the runtime control room."
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 0.8fr",
                        gap: "18px",
                    }}
                >
                    <div
                        style={{
                            border: `1px solid ${C.ruleStrong}`,
                            borderRadius: "16px",
                            background: C.surfaceAlt,
                            padding: "16px",
                        }}
                    >
                        <div style={{ color: C.text, fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>
                            Session / source context
                        </div>
                        <DetailRow
                            label="Source context"
                            value={currentSourceContext}
                        />
                        <DetailRow
                            label="Mode choices"
                            value="Live, Static, and Inspection remain explicit route families rather than being collapsed into one mixed top-level page."
                        />
                        <DetailRow
                            label="Current state"
                            value={currentRunPosture}
                        />
                        <DetailRow
                            label="Overlay posture"
                            value="Overlay decisions remain downstream and optional. The home shell only states that display remains below authority."
                        />
                        <DetailRow
                            label="Legacy path"
                            value="The current composed browser surface remains reachable as a transitional route while dedicated viewer routes are introduced."
                        />
                    </div>

                    <div
                        style={{
                            border: `1px solid ${C.ruleStrong}`,
                            borderRadius: "16px",
                            background: C.surfaceAlt,
                            padding: "16px",
                        }}
                    >
                        <div style={{ color: C.text, fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>
                            Shell posture
                        </div>
                        <div style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6 }}>
                            Routing surface only.
                            <br />
                            Display below authority.
                            <br />
                            Structural evidence remains primary downstream.
                            <br />
                            Legacy composition remains transitional.
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard
                eyebrow="Viewer Routes"
                title="Live / Static / Inspection entry points"
                note="These routes establish top-level purpose split now, while deeper viewer rendering remains deferred to later packets."
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: "16px",
                    }}
                >
                    {VIEWER_ROUTES.map((route) => (
                        <RouteCard
                            key={route.id}
                            title={route.label}
                            note={route.note}
                            path={route.path}
                            onOpen={() => navigate(route.path)}
                        />
                    ))}
                </div>
            </SectionCard>

            <SectionCard
                eyebrow="Transitional Reachability"
                title="Legacy and standalone surfaces"
                note="Existing functionality remains reachable while the old composed app is demoted from main face to transitional route."
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        gap: "16px",
                    }}
                >
                    <RouteCard
                        title="Legacy composed"
                        note="Transitional mixed surface preserved for continuity while the router-shell split is established."
                        path={ROUTES.legacy}
                        onOpen={() => navigate(ROUTES.legacy)}
                    />
                    <RouteCard
                        title="Execution"
                        note="Standalone operational shell remains reachable for source intake and lawful runs."
                        path="/execution.html"
                        onOpen={() => openStandalone("/execution.html")}
                    />
                    <RouteCard
                        title="Lab HUD"
                        note="Standalone structural inspection surface remains reachable below the new top-level shell."
                        path="/index.html"
                        onOpen={() => openStandalone("/index.html")}
                    />
                    <RouteCard
                        title="Demo"
                        note="Standalone public/demo surface remains reachable without being promoted into the new shell."
                        path="/demo.html"
                        onOpen={() => openStandalone("/demo.html")}
                    />
                </div>
            </SectionCard>
        </div>
    );
}

function LegacyRoute() {
    return (
        <div style={{ display: "grid", gap: "16px" }}>
            <SectionCard
                eyebrow="Transitional Legacy Route"
                title="Legacy composed environment"
                note="This route preserves the current composed browser surface for continuity. It remains reachable, but it is no longer the intended top-level face."
            >
                <div
                    style={{
                        border: `1px solid ${C.ruleStrong}`,
                        borderRadius: "16px",
                        background: C.surfaceAlt,
                        padding: "16px",
                    }}
                >
                    <DetailRow label="Route path" value={ROUTES.legacy} />
                    <DetailRow label="Posture" value="Transitional legacy composition. Useful, reachable, and explicitly demoted from top-level home status." />
                    <DetailRow label="Boundary" value="Composition only. This preserved route does not gain new authority through continued reachability." />
                </div>
            </SectionCard>
            <SemanticOscilloscopeApp />
        </div>
    );
}

function RouteBody({ route, shellState }) {
    if (route === ROUTES.live) {
        const payload = buildRoutePayload("live", shellState);
        return (
            <LiveModeShell
                payload={payload}
                onGoHome={() => navigate(ROUTES.home)}
                onOpenLegacy={() => navigate(ROUTES.legacy)}
            />
        );
    }

    if (route === ROUTES.static) {
        const payload = buildRoutePayload("static", shellState);
        return (
            <StaticModeShell
                payload={payload}
                onGoHome={() => navigate(ROUTES.home)}
                onOpenLegacy={() => navigate(ROUTES.legacy)}
            />
        );
    }

    if (route === ROUTES.inspection) {
        const payload = buildRoutePayload("inspection", shellState);
        return (
            <InspectionModeShell
                payload={payload}
                onGoHome={() => navigate(ROUTES.home)}
                onOpenLegacy={() => navigate(ROUTES.legacy)}
            />
        );
    }

    if (route === ROUTES.legacy) {
        return <LegacyRoute />;
    }

    return <HomeRoute shellState={shellState} />;
}

export default function HomeRouterShell() {
    const [route, setRoute] = useState(() => normalizeHash(window.location.hash));
    const [shellState, setShellState] = useState(() => readPublishedShellState());

    useEffect(() => {
        if (!window.location.hash) {
            window.location.hash = routeHref(ROUTES.home);
        }

        function handleHashChange() {
            setRoute(normalizeHash(window.location.hash));
        }

        window.addEventListener("hashchange", handleHashChange);
        handleHashChange();
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    useEffect(() => {
        function handlePublishedShellState(event) {
            setShellState(event?.detail ?? readPublishedShellState());
        }

        window.addEventListener(ACTIVE_SHELL_STATE_EVENT, handlePublishedShellState);
        setShellState(readPublishedShellState());
        return () => window.removeEventListener(ACTIVE_SHELL_STATE_EVENT, handlePublishedShellState);
    }, []);

    const navRoutes = [
        { label: "Home", path: ROUTES.home },
        { label: "Live", path: ROUTES.live },
        { label: "Static", path: ROUTES.static },
        { label: "Inspection", path: ROUTES.inspection },
        { label: "Legacy", path: ROUTES.legacy },
    ];

    return (
        <div
            style={{
                minHeight: "100vh",
                background: `radial-gradient(circle at top, rgba(96, 165, 250, 0.16), transparent 32%), ${C.bg}`,
                color: C.text,
                fontFamily: C.sans,
            }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; }
                body { margin: 0; }
                button { font: inherit; }
            `}</style>

            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    padding: "24px",
                    display: "grid",
                    gap: "20px",
                }}
            >
                <header
                    style={{
                        border: `1px solid ${C.rule}`,
                        borderRadius: "20px",
                        background: "rgba(10, 15, 29, 0.88)",
                        backdropFilter: "blur(12px)",
                        padding: "18px 20px",
                        display: "grid",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "16px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    color: C.amber,
                                    fontFamily: C.mono,
                                    fontSize: "11px",
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    marginBottom: "8px",
                                }}
                            >
                                DME Home Router Shell
                            </div>
                            <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
                                Thin top-level routing face
                            </div>
                            <div style={{ color: C.textMid, maxWidth: "760px", lineHeight: 1.6 }}>
                                Home / Router shell above dedicated viewer routes. Routing surface only.
                                Display below authority. Live / Static / Inspection remain explicit route families.
                            </div>
                        </div>

                        <div
                            style={{
                                minWidth: "260px",
                                border: `1px solid ${C.ruleStrong}`,
                                borderRadius: "16px",
                                background: C.surfaceAlt,
                                padding: "14px",
                            }}
                        >
                            <div
                                style={{
                                    color: C.textDim,
                                    fontFamily: C.mono,
                                    fontSize: "11px",
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    marginBottom: "10px",
                                }}
                            >
                                Route posture
                            </div>
                            <div style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6 }}>
                                Current route: <span style={{ color: C.text }}>{route}</span>
                                <br />
                                Shell is routing/context, not truth/inspection authority.
                                <br />
                                Legacy composed surface remains transitional.
                            </div>
                        </div>
                    </div>

                    <nav
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                        }}
                    >
                        {navRoutes.map((entry) => (
                            <NavPill
                                key={entry.path}
                                label={entry.label}
                                active={route === entry.path}
                                onClick={() => navigate(entry.path)}
                            />
                        ))}
                    </nav>
                </header>

                <main>
                    <RouteBody route={route} shellState={shellState} />
                </main>

                <footer
                    style={{
                        border: `1px solid ${C.rule}`,
                        borderRadius: "18px",
                        background: C.surface,
                        padding: "16px 18px",
                        color: C.textMid,
                        fontSize: "13px",
                        lineHeight: 1.6,
                    }}
                >
                    Footer posture:
                    <br />
                    Display below authority.
                    <br />
                    Structural evidence remains primary downstream.
                    <br />
                    Overlays remain optional and subordinate.
                    <br />
                    The shell stays thin and routes to Live / Static / Inspection or transitional legacy surfaces without becoming the dense inspection wall.
                </footer>
            </div>
        </div>
    );
}
