// hud/demo_main.jsx
//
// Demo entry point for the MetaLayer public consultation demo.
// Separate from hud/main.jsx (lab HUD) — does not import or affect it.
//
// This file is the Vite entry for the public demo surface.
// Lab HUD remains at index.html → hud/main.jsx.
// Public demo is at demo.html → hud/demo_main.jsx.

import React from "react";
import ReactDOM from "react-dom/client";
import MetaLayerConsultationDemo from "./MetaLayerConsultationDemo.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <MetaLayerConsultationDemo />
    </React.StrictMode>
);
