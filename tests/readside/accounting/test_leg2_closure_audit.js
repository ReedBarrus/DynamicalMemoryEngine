import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let PASS = 0;
let FAIL = 0;

function section(title) {
    console.log(`\n-- ${title} --`);
}

function ok(condition, label) {
    if (condition) {
        PASS += 1;
        console.log(`  ok ${label}`);
    } else {
        FAIL += 1;
        console.error(`  not ok ${label}`);
    }
}

function includes(text, pattern, label) {
    ok(String(text).includes(pattern), label);
}

function finish() {
    console.log(`\n${PASS} passed   ${FAIL} failed`);
    if (FAIL > 0) process.exit(1);
}

const panelSrc = await readFile(path.join(ROOT, "hud/OperatorLegibilityPanel.jsx"), "utf8");
const modelSrc = await readFile(path.join(ROOT, "hud/operatorLegibilityModel.js"), "utf8");
const thresholdSrc = await readFile(path.join(ROOT, "hud/replayThresholdFidelityPosture.js"), "utf8");
const shellSrc = await readFile(path.join(ROOT, "hud/MetaLayerObjectExecutionShell.jsx"), "utf8");
const routerSrc = await readFile(path.join(ROOT, "hud/shellStateRouter.js"), "utf8");

section("A. replay and reconstruction remain distinct bounded operator objects");
{
    includes(panelSrc, "Replay and Reconstruction remain distinct bounded objects.", "A1: panel keeps replay and reconstruction distinct");
    includes(modelSrc, 'title: "Replay"', "A2: model emits replay object");
    includes(modelSrc, 'title: "Reconstruction"', "A3: model emits reconstruction object");
    includes(panelSrc, "Replay is not fused with reconstruction", "A4: panel preserves replay/reconstruction non-fusion");
}

section("B. retained-tier sufficiency and legitimacy remain explicit");
{
    includes(panelSrc, "Tier 0 live support, Tier 1 receipt lineage, and Tier 2+ insufficiency are not equivalent.", "B1: panel keeps tier non-equivalence visible");
    includes(modelSrc, "Tier 0 live replay legitimacy", "B2: model keeps Tier 0 legitimacy explicit");
    includes(modelSrc, "Tier 1 replay legitimacy", "B3: model keeps Tier 1 legitimacy explicit");
    includes(modelSrc, "replay legitimacy not established - explicit insufficiency", "B4: model keeps higher-tier insufficiency explicit");
    includes(modelSrc, '"preserved"', "B5: model emits preserved posture");
    includes(modelSrc, '"not preserved"', "B6: model emits not-preserved posture");
}

section("C. threshold, fidelity, downgrade, and failure posture remain auditable");
{
    includes(thresholdSrc, 'classCode: "conserved"', "C1: threshold helper keeps conserved class");
    includes(thresholdSrc, 'classCode: "narrowed"', "C2: threshold helper keeps narrowed class");
    includes(thresholdSrc, 'classCode: "degraded"', "C3: threshold helper keeps degraded class");
    includes(thresholdSrc, 'classCode: "insufficient"', "C4: threshold helper keeps insufficient class");
    includes(thresholdSrc, 'classCode: "unresolved"', "C5: threshold helper keeps unresolved class");
    includes(thresholdSrc, 'classCode: "failed"', "C6: threshold helper keeps failed class");
    includes(modelSrc, '"threshold class"', "C7: operator model emits threshold class");
    includes(modelSrc, '"fidelity class"', "C8: operator model emits fidelity class");
    includes(modelSrc, '"downgrade / failure"', "C9: operator model emits downgrade/failure posture");
}

section("D. weak-state discipline stays separate from weak success");
{
    includes(thresholdSrc, "deriveOperatorWeakStateDiscipline", "D1: weak-state discipline helper exists");
    includes(thresholdSrc, 'nextActionCode: "review_required"', "D2: helper maps weak states to review_required when needed");
    includes(thresholdSrc, 'nextActionCode: "retained_tier_insufficient"', "D3: helper maps insufficiency to retained-tier insufficiency");
    includes(thresholdSrc, 'nextActionCode: "reconstructable_only"', "D4: helper maps degraded support to reconstructable_only");
    includes(panelSrc, "Failure is not weak success.", "D5: panel keeps failure distinct from weak success");
    includes(panelSrc, "Insufficiency is not almost replayable.", "D6: panel keeps insufficiency non-decorative");
    includes(panelSrc, "Unresolved is not degraded.", "D7: panel keeps unresolved distinct from degraded");
}

section("E. synthetic-vs-recorded comparison remains bounded and honest");
{
    includes(shellSrc, "setRunHistory", "E1: shell preserves bounded session-backed run history");
    includes(routerSrc, "buildSourceComparison", "E2: router derives source comparison from real run history");
    includes(modelSrc, "sourceComparison", "E3: operator model emits source comparison");
    includes(panelSrc, "source-basis comparison", "E4: panel renders source-basis comparison block");
    includes(panelSrc, "synthetic vs recorded", "E5: panel labels synthetic-vs-recorded comparison explicitly");
    includes(panelSrc, "without flattening richer and coarser replay posture", "E6: panel keeps asymmetry warning explicit");
    includes(modelSrc, "local session comparison", "E7: model keeps comparison bounded to current session cases");
}

section("F. non-authority and non-restoration posture remain intact");
{
    includes(panelSrc, "Read-side only. Not authority.", "F1: panel keeps read-side non-authority posture");
    includes(panelSrc, "Replay is not raw restoration.", "F2: panel keeps replay non-restoration posture");
    includes(panelSrc, "Reconstruction is not source", "F3: panel keeps reconstruction non-equivalence posture");
    includes(panelSrc, "Prepared request", "F4: panel keeps request downstream");
    includes(panelSrc, "not fulfilled review", "F5: panel keeps request/review non-fulfillment posture");
}

finish();
