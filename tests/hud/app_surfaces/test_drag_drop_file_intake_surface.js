// tests/hud/app_surfaces/test_drag_drop_file_intake_surface.js
//
// Contract tests for the drag-drop file intake surface.
//
// Scope:
//   - DropZone component exists in shell source
//   - drag/drop event handlers present and correctly named
//   - click-to-choose fallback still exists
//   - adapter detection and status lines present
//   - clear button present
//   - posture note (execution-side, not authority) visible
//   - no auto-run on drop
//   - same adapter path as click-to-choose
//   - no mintCanon / no ConsensusOp / no promotion
//   - HUD, demo, lab surfaces untouched
//   - intake stays on execution side

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let PASS = 0, FAIL = 0;
function section(t) { console.log(`\n── ${t} ──`); }
function ok(cond, label) {
    if (cond) { PASS++; console.log(`  ✓ ${label}`); }
    else { FAIL++; console.error(`  ✗ ${label}`); }
}
function finish() {
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  ${PASS} passed   ${FAIL} failed`);
    console.log(FAIL === 0 ? "  ALL TESTS PASSED ✓" : "  TESTS FAILED ✗");
    if (FAIL > 0) process.exit(1);
}

let shellSrc = null;
try { shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8"); } catch (_) { }

// ─── A. DropZone component existence ─────────────────────────────────────────
section("A. DropZone component existence and placement");
ok(shellSrc !== null, "A1: shell readable");
if (shellSrc) {
    ok(shellSrc.includes("function DropZone"), "A2: DropZone function defined");
    ok(shellSrc.includes("<DropZone"), "A3: DropZone rendered in ControlRegion");

    // DropZone defined before ControlRegion
    const dzIdx = shellSrc.indexOf("function DropZone");
    const crIdx = shellSrc.indexOf("function ControlRegion");
    ok(dzIdx > 0 && crIdx > 0 && dzIdx < crIdx, "A4: DropZone defined before ControlRegion");

    // ControlRegion passes onFileSelect to DropZone
    ok(shellSrc.includes("onFileSelect={onFileSelect}") ||
        shellSrc.includes("onFileSelect={handleFileSelect}"), "A5: onFileSelect wired to DropZone");
}

// ─── B. Drag/drop event handlers ─────────────────────────────────────────────
section("B. Drag/drop event handlers");
if (shellSrc) {
    ok(shellSrc.includes("onDragEnter"), "B1: onDragEnter handler present");
    ok(shellSrc.includes("onDragLeave"), "B2: onDragLeave handler present");
    ok(shellSrc.includes("onDragOver"), "B3: onDragOver handler present");
    ok(shellSrc.includes("onDrop"), "B4: onDrop handler present");
    ok(shellSrc.includes("handleDrop"), "B5: handleDrop function defined");
    ok(shellSrc.includes("e.dataTransfer"), "B6: dataTransfer read on drop");
    ok(shellSrc.includes("e.preventDefault()"), "B7: preventDefault called (prevents browser default)");

    // Drop calls the same onFileSelect path as click
    ok(shellSrc.includes("onFileSelect(file)"), "B8: drop routes through onFileSelect");

    // Drag state
    ok(shellSrc.includes("dragActive"), "B9: dragActive state present");
    ok(shellSrc.includes("setDragActive(true)"), "B10: setDragActive(true) on enter/over");
    ok(shellSrc.includes("setDragActive(false)"), "B11: setDragActive(false) on leave/drop");
}

// ─── C. Click-to-choose fallback ─────────────────────────────────────────────
section("C. Click-to-choose fallback");
if (shellSrc) {
    ok(shellSrc.includes('type="file"'), "C1: file input present");
    ok(shellSrc.includes('accept=".json,.csv,.wav"'), "C2: accept attribute correct");
    ok(shellSrc.includes("or click to choose"), "C3: click fallback hint text present");
    // Input triggers handleInputChange (not the raw file select)
    ok(shellSrc.includes("handleInputChange"), "C4: handleInputChange defined");
}

// ─── D. Adapter detection and status visibility ───────────────────────────────
section("D. Adapter detection and status visibility");
if (shellSrc) {
    ok(shellSrc.includes("detected adapter"), "D1: 'detected adapter' label present");
    ok(shellSrc.includes("detectedType"), "D2: detectedType prop threaded to DropZone");
    ok(shellSrc.includes("adapterStatus.ok"), "D3: adapterStatus.ok checked for color");
    ok(shellSrc.includes("samples normalized"), "D4: sample count visible on success");
    ok(shellSrc.includes("adapter error"), "D5: error fallback text present");
}

// ─── E. Visual states ─────────────────────────────────────────────────────────
section("E. Visual states");
if (shellSrc) {
    ok(shellSrc.includes("dragActive ? C.amber"), "E1: drag-active amber highlight present");
    ok(shellSrc.includes("drag & drop"), "E2: 'drag & drop' prompt text present");
    ok(shellSrc.includes("drop to load"), "E3: 'drop to load' drag-active text present");
    // Border changes with state (pending file / adapter status)
    ok(shellSrc.includes("borderColor"), "E4: borderColor variable used for state feedback");
    ok(shellSrc.includes("bgColor"), "E5: bgColor variable used for state feedback");
}

// ─── F. Clear button ──────────────────────────────────────────────────────────
section("F. Clear button");
if (shellSrc) {
    ok(shellSrc.includes("clear"), "F1: clear button present");
    ok(shellSrc.includes("onFileSelect(null)"), "F2: clear calls onFileSelect(null)");
    // Only shown when file is pending
    ok(shellSrc.includes("pendingFile && ("), "F3: clear only shown when pendingFile exists");
}

// ─── G. No auto-run on drop ───────────────────────────────────────────────────
section("G. No auto-run on drop");
if (shellSrc) {
    // handleDrop should NOT call handleRun
    const dropFnStart = shellSrc.indexOf("function handleDrop");
    const dropFnEnd = shellSrc.indexOf("\n    }", dropFnStart);
    const dropBody = dropFnStart > 0 ? shellSrc.slice(dropFnStart, dropFnEnd + 6) : "";
    ok(!dropBody.includes("handleRun"), "G1: handleDrop does not call handleRun");
    ok(!dropBody.includes("onRun"), "G2: handleDrop does not call onRun");

    // Explicit run required note
    ok(shellSrc.includes("explicit run required"), "G3: 'explicit run required' posture note visible");
}

// ─── H. Posture / constitutional notes ───────────────────────────────────────
section("H. Constitutional posture in DropZone");
if (shellSrc) {
    ok(shellSrc.includes("execution-side intake") || shellSrc.includes("Source intake belongs"), "H1: execution-side intake note present");
    ok(shellSrc.includes("not authority"), "H2: not-authority note present in DropZone area");
    ok(shellSrc.includes("adapter-mediated"), "H3: adapter-mediated note present");
    ok(!shellSrc.match(/new ConsensusOp|ConsensusOp\(/), "H4: no ConsensusOp invocation");
    ok(!shellSrc.includes("mintCanon"), "H5: no mintCanon");
    ok(!shellSrc.includes("canonical_status ="), "H6: no C1 mutation");
    // Generic file import is transport, not family claim
    ok(shellSrc.includes("generic file import is a transport") ||
        shellSrc.includes("generic file import"), "H7: generic-import posture note present");
}

// ─── I. Same adapter path for drop and click ──────────────────────────────────
section("I. Drop and click use same adapter path");
if (shellSrc) {
    // Both handleInputChange and handleDrop call onFileSelect(file)
    ok(shellSrc.includes("handleInputChange"), "I1: click uses handleInputChange");
    ok(shellSrc.includes("onFileSelect(file)"), "I2: drop calls onFileSelect(file)");
    // Both routes go through runAdapter (in handleFileSelect)
    ok(shellSrc.includes("runAdapter"), "I3: runAdapter still called for all file inputs");
    ok(shellSrc.includes("handleFileSelect"), "I4: handleFileSelect processes all file inputs");
}

// ─── J. Surface separation ────────────────────────────────────────────────────
section("J. Surface separation");
{
    let labHudSrc = null, demoSrc = null;
    try { labHudSrc = await readFile(path.join(ROOT, "hud/DoorOneStructuralMemoryHud.jsx"), "utf8"); } catch (_) { }
    try { demoSrc = await readFile(path.join(ROOT, "hud/MetaLayerConsultationDemo.jsx"), "utf8"); } catch (_) { }

    if (labHudSrc) {
        ok(!labHudSrc.includes("DropZone"), "J1: lab HUD does not contain DropZone");
        ok(!labHudSrc.includes("onDrop"), "J2: lab HUD has no drop handlers");
        ok(labHudSrc.includes("export default function DoorOneStructuralMemoryHUD"), "J3: lab HUD intact");
    }
    if (demoSrc) {
        ok(!demoSrc.includes("DropZone"), "J4: public demo does not contain DropZone");
        ok(!demoSrc.includes("onDrop"), "J5: public demo has no drop handlers");
    }

    // Execution HTML still exists
    let execHtmlSrc = null;
    try { execHtmlSrc = await readFile(path.join(ROOT, "execution.html"), "utf8"); } catch (_) { }
    ok(execHtmlSrc !== null, "J6: execution.html still exists");
}

finish();
