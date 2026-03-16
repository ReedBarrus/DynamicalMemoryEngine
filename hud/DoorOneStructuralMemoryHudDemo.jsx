import React from "react";
import workbench from "../out_live/latest_workbench.json";
import crossRun from "../out_live/latest_cross_run_report.json";
import DoorOneStructuralMemoryHUD from "./DoorOneStructuralMemoryHud.jsx";

export default function DoorOneStructuralMemoryHudDemo() {
    return (
        <DoorOneStructuralMemoryHUD
            workbench={workbench}
            crossRunReport={crossRun}
        />
    );
}