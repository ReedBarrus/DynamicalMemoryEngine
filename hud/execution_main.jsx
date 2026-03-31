// hud/execution_main.jsx
//
// Execution shell entry point — separate from lab HUD (main.jsx) and public demo (demo_main.jsx)
// Three surfaces remain explicitly separated:
//   index.html     → hud/main.jsx          → DoorOneStructuralMemoryHudDemo (lab)
//   demo.html      → hud/demo_main.jsx     → MetaLayerConsultationDemo (public)
//   execution.html → hud/execution_main.jsx → MetaLayerObjectExecutionShell (operator)

import React from "react";
import ReactDOM from "react-dom/client";
import MetaLayerObjectExecutionShell from "./MetaLayerObjectExecutionShell.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <MetaLayerObjectExecutionShell />
    </React.StrictMode>
);
