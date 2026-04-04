// hud/app_main.jsx
//
// Semantic Oscilloscope App entry point.
// Composed environment: execution + lab HUD + public demo in one browser surface.
//
// Entry separation:
//   index.html     → hud/main.jsx          → DoorOneStructuralMemoryHudDemo (lab)
//   demo.html      → hud/demo_main.jsx     → MetaLayerConsultationDemo (public)
//   execution.html → hud/execution_main.jsx → MetaLayerObjectExecutionShell (operator)
//   app.html       → hud/app_main.jsx      → SemanticOscilloscopeApp (composed)
//
// The composed app does not replace the individual surfaces.
// It presents them in one bounded environment for demonstration and operator use.

import React from "react";
import ReactDOM from "react-dom/client";
import SemanticOscilloscopeApp from "./SemanticOscilloscopeApp.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <SemanticOscilloscopeApp />
    </React.StrictMode>
);
