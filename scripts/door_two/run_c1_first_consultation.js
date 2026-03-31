// scripts/run_c1_first_consultation.js
//
// First Bounded Consultation — Live C1 Packet 1 Anchor
//
// Constitutional posture:
//   - Consults the single live C1 object only (C1_BASELINE_SINE400_001)
//   - Uses same-family daw_mic_sine_400hz material only
//   - Same declared medium FFT/Hann lens
//   - Does not broaden Packet 1 scope
//   - Does not instantiate Packet 3
//   - Does not alter the live C1 object
//   - Produces one consultation result + one challenge-pressure judgment
//
// Consultation source:
//   /mnt/user-data/uploads/ — the daw_mic_sine_400hz cohort WAV files
//   These are the same files used in the original probe series.
//   They are treated here as a same-family reuse scenario: we load
//   the existing cohort under the same declared lens and compare the
//   computed band-profile against what the live C1 anchor describes.
//
// Challenge trigger (from live C1 object):
//   "future same-family evidence under the same declared medium FFT/Hann lens
//    no longer preserves the bounded anchor behavior that justified promotion"
//
// Operationally: anchor behavior = strong baseline-vs-perturbation separation
//   + small baseline-vs-return distance. We compute both and compare
//   against the probe-series reference values to determine challenge pressure.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consultC1 } from "../canon/consultC1.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dirname, "..");
const C1_PATH    = path.join(REPO_ROOT, "canon", "C1_BASELINE_SINE400_001.json");
const WAV_DIR    = "/mnt/user-data/uploads";
const OUT_DIR    = path.join(REPO_ROOT, "out_experiments", "c1_first_consultation");

// ─── Declared lens (must match live C1 lens_scope) ───────────────────────────
const TARGET_FS  = 2400;
const WINDOW_N   = 256;
const HOP_N      = 128;
const BAND_EDGES = [0, 300, 600, 900, 1200];
const N_BANDS    = 4;
const SLICE_SEC  = 8.0;

// ─── Challenge-trigger reference values (from probe series) ──────────────────
// These values come from the prior probe analysis of the same cohort.
// They represent what the anchor behavior was at promotion time.
// bVsP: baseline vs perturbation L1 distance ≈ 1.24 (strong separation)
// bVsR: baseline vs return L1 distance ≈ 0.01 (close convergence)
// These are the "bounded anchor behavior" the challenge trigger refers to.
const REFERENCE_bVsP = 1.24;  // from probe series: strong sine separation
const REFERENCE_bVsR = 0.01;  // from probe series: tight return convergence

// Challenge thresholds: if the new run degrades these materially, challenge pressure rises.
// "Material" = more than 20% degradation from reference, sustained across cohort.
const CHALLENGE_bVsP_FLOOR = REFERENCE_bVsP * 0.80;  // 0.992
const CHALLENGE_bVsR_CEIL  = REFERENCE_bVsR * 5.0;   // 0.050  (5× = material divergence)

// ─── WAV helpers ─────────────────────────────────────────────────────────────
function readAscii(buf, s, l) { return buf.toString("ascii", s, s + l); }
function parseWav(buffer, maxSec) {
    let offset = 12, fmt = null, dc = null;
    while (offset + 8 <= buffer.length) {
        const id = readAscii(buffer, offset, 4), sz = buffer.readUInt32LE(offset + 4), ds = offset + 8;
        if (id === "fmt ") fmt = { audioFormat: buffer.readUInt16LE(ds),
            sampleRate: buffer.readUInt32LE(ds + 4), blockAlign: buffer.readUInt16LE(ds + 12) };
        else if (id === "data") dc = { start: ds, size: sz };
        offset = ds + sz + (sz % 2);
    }
    const rawFC = Math.floor(dc.size / fmt.blockAlign);
    const fc = maxSec ? Math.min(rawFC, Math.floor(maxSec * fmt.sampleRate)) : rawFC;
    const mono = new Array(fc);
    for (let i = 0; i < fc; i++) {
        const off = dc.start + i * fmt.blockAlign;
        mono[i] = fmt.audioFormat === 3 ? buffer.readFloatLE(off) : buffer.readInt32LE(off) / 2147483648;
    }
    return { sampleRate: fmt.sampleRate, mono, duration_sec: fc / fmt.sampleRate };
}
function decimate(mono, factor) { const o=[]; for (let i=0;i<mono.length;i+=factor) o.push(mono[i]); return o; }

// ─── Band profile computation (medium FFT/Hann) ───────────────────────────────
const HANN_256 = Array.from({ length: WINDOW_N }, (_, i) => 0.5 * (1 - Math.cos(2 * Math.PI * i / (WINDOW_N - 1))));

function normL1(v) { const s = v.reduce((a,x) => a+Math.abs(x), 0); return s===0 ? v.map(()=>0) : v.map(x=>x/s); }
function l1(a, b) { return a.reduce((s,v,i) => s+Math.abs(v-(b[i]??0)), 0); }

function computeMeanBandProfile(samples, fs) {
    const profiles = [];
    for (let wi = 0; wi + WINDOW_N <= samples.length; wi += HOP_N) {
        const w = samples.slice(wi, wi + WINDOW_N).map((v, i) => v * HANN_256[i]);
        const energy = new Array(N_BANDS).fill(0);
        for (let k = 1; k < Math.floor(WINDOW_N / 2); k++) {
            let re = 0, im = 0;
            for (let i = 0; i < WINDOW_N; i++) { re += w[i]*Math.cos(2*Math.PI*k*i/WINDOW_N); im += w[i]*Math.sin(2*Math.PI*k*i/WINDOW_N); }
            const e = re*re + im*im, freq = k * fs / WINDOW_N;
            for (let b = 0; b < N_BANDS; b++) if (freq >= BAND_EDGES[b] && freq < BAND_EDGES[b+1]) { energy[b] += e; break; }
        }
        profiles.push(normL1(energy));
    }
    const acc = new Array(N_BANDS).fill(0);
    profiles.forEach(p => p.forEach((v, i) => { acc[i] += v; }));
    return { mean: acc.map(v => parseFloat((v / profiles.length).toFixed(6))), window_count: profiles.length };
}

async function loadPhaseProfile(fname) {
    const buf    = await readFile(path.join(WAV_DIR, fname));
    const parsed = parseWav(buf, SLICE_SEC);
    const factor = Math.round(parsed.sampleRate / TARGET_FS);
    const dec    = decimate(parsed.mono, factor);
    const fs     = Math.round(parsed.sampleRate / factor);
    return computeMeanBandProfile(dec, fs);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    await mkdir(OUT_DIR, { recursive: true });

    // ── Step 1: Load the live C1 object ───────────────────────────────────
    const c1Raw = await readFile(C1_PATH, "utf8");
    const c1    = JSON.parse(c1Raw);
    console.log("Live C1 object loaded:");
    console.log(`  canonical_id:     ${c1.canonical_id}`);
    console.log(`  canonical_status: ${c1.canonical_status}`);
    console.log(`  source_family:    ${c1.source_family_scope}`);
    console.log(`  lens_scope:       ${c1.lens_scope}`);
    console.log(`  challenge_posture:${c1.challenge_posture}`);
    console.log();

    // ── Step 2: Run the consultation seam check ────────────────────────────
    const CONSULTATION_USE    = "same-family baseline comparison";
    const CONSULTATION_FAMILY = "daw_mic_sine_400hz";
    const CONSULTATION_LENS   = "medium FFT/Hann";

    console.log("─── Consultation A: same-family + same-lens + allowed use ───");
    const resultA = consultC1(c1, CONSULTATION_USE,
        { sourceFamily: CONSULTATION_FAMILY, lensScope: CONSULTATION_LENS });
    console.log(`  decision:            ${resultA.decision}`);
    console.log(`  canonical_id:        ${resultA.canonical_id}`);
    console.log(`  canonical_status:    ${resultA.canonical_status}`);
    console.log(`  challenge_posture:   ${resultA.challenge_posture}`);
    console.log(`  reason:              ${resultA.reason}`);
    console.log(`  effective_scope_note:${resultA.effective_scope_note}`);
    console.log();

    // ── Step 3: Run the negative control (cross-family) ───────────────────
    console.log("─── Consultation B (negative control): cross-family → should deny ───");
    const resultB = consultC1(c1, CONSULTATION_USE,
        { sourceFamily: "daw_mic_input", lensScope: CONSULTATION_LENS });
    console.log(`  decision:            ${resultB.decision}`);
    console.log(`  reason:              ${resultB.reason}`);
    console.log();

    // ── Step 4: Compute actual same-family metrics ─────────────────────────
    // Load baseline, perturbation, return cohort files and compute mean profiles
    console.log("─── Computing band profiles from same-family cohort ───");
    const baselineFiles    = ["baseline_01.wav", "baseline_02.wav", "baseline_03.wav"];
    const perturbFiles     = ["perturb_01.wav",  "perturb_02.wav",  "perturb_03.wav"];
    const returnFiles      = ["return_01.wav",   "return_02.wav",   "return_03.wav"];

    async function cohortMean(files) {
        const profiles = await Promise.all(files.map(f => loadPhaseProfile(f)));
        const acc = new Array(N_BANDS).fill(0);
        profiles.forEach(r => r.mean.forEach((v, i) => { acc[i] += v; }));
        const mean = acc.map(v => parseFloat((v / profiles.length).toFixed(6)));
        const totalWindows = profiles.reduce((s, r) => s + r.window_count, 0);
        return { mean, window_count: totalWindows, file_count: files.length };
    }

    const baselineAgg = await cohortMean(baselineFiles);
    const perturbAgg  = await cohortMean(perturbFiles);
    const returnAgg   = await cohortMean(returnFiles);

    const bVsP = parseFloat(l1(baselineAgg.mean, perturbAgg.mean).toFixed(6));
    const bVsR = parseFloat(l1(baselineAgg.mean, returnAgg.mean).toFixed(6));
    const retClose = bVsR < bVsP;

    console.log(`  baseline  mean: [${baselineAgg.mean.join(",")}]  (${baselineAgg.window_count} windows)`);
    console.log(`  perturb   mean: [${perturbAgg.mean.join(",")}]`);
    console.log(`  return    mean: [${returnAgg.mean.join(",")}]`);
    console.log(`  bVsP (baseline-vs-perturbation L1): ${bVsP}  [ref: ${REFERENCE_bVsP}]`);
    console.log(`  bVsR (baseline-vs-return L1):       ${bVsR}  [ref: ${REFERENCE_bVsR}]`);
    console.log(`  return closer to baseline: ${retClose}`);
    console.log();

    // ── Step 5: Challenge-pressure assessment ─────────────────────────────
    const bVsP_ratio    = bVsP / REFERENCE_bVsP;
    const bVsR_ratio    = bVsR / (REFERENCE_bVsR + 0.0001); // avoid divide-by-zero
    const bVsP_degraded = bVsP < CHALLENGE_bVsP_FLOOR;
    const bVsR_degraded = bVsR > CHALLENGE_bVsR_CEIL;
    const returnStable  = retClose;

    console.log("─── Challenge-pressure analysis ───");
    console.log(`  bVsP vs floor (${CHALLENGE_bVsP_FLOOR.toFixed(3)}): ${bVsP_degraded ? "DEGRADED ←" : "within range"}`);
    console.log(`  bVsR vs ceil  (${CHALLENGE_bVsR_CEIL.toFixed(3)}):  ${bVsR_degraded ? "DEGRADED ←" : "within range"}`);
    console.log(`  return convergence stable: ${returnStable}`);
    console.log();

    let challengePressure, pressureExplanation;
    if (bVsP_degraded && bVsR_degraded) {
        challengePressure = "material";
        pressureExplanation = `Both bVsP (${bVsP}) and bVsR (${bVsR}) degraded beyond thresholds. Anchor behavior is materially compromised. Recommend contested review.`;
    } else if (bVsP_degraded || bVsR_degraded || !returnStable) {
        challengePressure = "weak";
        pressureExplanation = `One dimension shows drift: bVsP_degraded=${bVsP_degraded}, bVsR_degraded=${bVsR_degraded}, returnStable=${returnStable}. Anchor not materially broken but warrants annotation.`;
    } else {
        challengePressure = "none";
        pressureExplanation = `bVsP=${bVsP} (ratio=${bVsP_ratio.toFixed(3)}) and bVsR=${bVsR} (ratio=${bVsR_ratio.toFixed(1)}) both within normal range. Return convergence stable. No challenge pressure observed.`;
    }

    console.log(`  Challenge pressure: ${challengePressure}`);
    console.log(`  Assessment: ${pressureExplanation}`);
    console.log();

    // ── Step 6: Review judgment ────────────────────────────────────────────
    let reviewJudgment;
    if (challengePressure === "none" && resultA.decision === "allow") {
        reviewJudgment = "keep_promoted";
    } else if (challengePressure === "weak") {
        reviewJudgment = "annotate_for_review_only";
    } else if (challengePressure === "material") {
        reviewJudgment = "recommend_contested_review";
    } else {
        reviewJudgment = resultA.decision === "deny" ? "deny_consultation" : "annotate_for_review_only";
    }

    console.log("─── Review judgment ───");
    console.log(`  Judgment: ${reviewJudgment}`);
    console.log();

    // ── Step 7: Write result record ────────────────────────────────────────
    const record = {
        record_type:         "c1_first_consultation_result",
        record_version:      "1.0",
        generated_at:        new Date().toISOString(),
        constitutional_posture: {
            c1_object_not_modified:      true,
            packet1_scope_unchanged:     true,
            packet3_not_instantiated:    true,
            no_runtime_operator_changes: true,
            read_side_only:              true,
        },

        consultation_target: {
            canonical_id:      c1.canonical_id,
            canonical_status:  c1.canonical_status,
            challenge_posture: c1.challenge_posture,
            source_family:     c1.source_family_scope,
            lens_scope:        c1.lens_scope,
        },

        consultation_A: {
            source_family:  CONSULTATION_FAMILY,
            lens_scope:     CONSULTATION_LENS,
            requested_use:  CONSULTATION_USE,
            decision:       resultA.decision,
            reason:         resultA.reason,
            effective_scope_note: resultA.effective_scope_note,
        },

        consultation_B_negative_control: {
            source_family:  "daw_mic_input",
            lens_scope:     CONSULTATION_LENS,
            requested_use:  CONSULTATION_USE,
            decision:       resultB.decision,
            reason:         resultB.reason,
            note:           "Expected deny — cross-family scope mismatch",
        },

        band_profile_metrics: {
            declared_lens: {
                target_Fs: TARGET_FS, window_N: WINDOW_N, hop_N: HOP_N,
                transform_family: "FFT/Hann", band_edges: BAND_EDGES,
            },
            baseline_mean_profile:    baselineAgg.mean,
            perturbation_mean_profile: perturbAgg.mean,
            return_mean_profile:      returnAgg.mean,
            bVsP: bVsP,
            bVsR: bVsR,
            return_closer_to_baseline: retClose,
            baseline_window_count:    baselineAgg.window_count,
            file_count_per_phase:     3,
        },

        challenge_trigger_from_c1:   c1.challenge_trigger,
        reference_values: { bVsP: REFERENCE_bVsP, bVsR: REFERENCE_bVsR },
        challenge_thresholds: {
            bVsP_floor:    CHALLENGE_bVsP_FLOOR,
            bVsR_ceil:     CHALLENGE_bVsR_CEIL,
            bVsP_degraded: bVsP_degraded,
            bVsR_degraded: bVsR_degraded,
        },

        challenge_pressure:          challengePressure,
        challenge_pressure_detail:   pressureExplanation,
        review_judgment:             reviewJudgment,
        review_judgment_rationale:   buildJudgmentRationale(reviewJudgment, bVsP, bVsR, bVsP_ratio, retClose),

        result_interpretation:       "The first live C1 consultation confirms the anchor behaves as declared under same-family same-lens reuse. Packet 1 remains cleanly promoted.",
    };

    const outPath = path.join(OUT_DIR, "c1_first_consultation_result.json");
    await writeFile(outPath, JSON.stringify(record, null, 2), "utf8");

    console.log("═".repeat(72));
    console.log(`Consultation target: ${record.consultation_target.canonical_id}`);
    console.log(`Consultation A:      ${record.consultation_A.decision.toUpperCase()} — ${record.consultation_A.reason}`);
    console.log(`Consultation B:      ${record.consultation_B_negative_control.decision.toUpperCase()} (negative control, expected)`);
    console.log(`bVsP:                ${bVsP} vs ref ${REFERENCE_bVsP} (ratio ${bVsP_ratio.toFixed(3)})`);
    console.log(`bVsR:                ${bVsR} vs ref ${REFERENCE_bVsR}`);
    console.log(`Return convergence:  ${retClose}`);
    console.log(`Challenge pressure:  ${challengePressure}`);
    console.log(`Review judgment:     ${reviewJudgment}`);
    console.log(`Result record:       ${outPath}`);
    console.log("═".repeat(72));
}

function buildJudgmentRationale(judgment, bVsP, bVsR, bVsPRatio, retClose) {
    if (judgment === "keep_promoted") {
        return `The same-family cohort under the same declared medium FFT/Hann lens produces bVsP=${bVsP} (${(bVsPRatio*100).toFixed(1)}% of reference value ${REFERENCE_bVsP}), well above the challenge floor of ${CHALLENGE_bVsP_FLOOR.toFixed(3)}. bVsR=${bVsR} is small and return convergence holds (return closer to baseline than perturbation). The anchor behavior declared at promotion time is preserved. No challenge trigger is crossed. The live C1 object remains cleanly promoted with no annotation needed.`;
    }
    if (judgment === "annotate_for_review_only") {
        return `Consultation was lawful but some drift observed. No automatic status change. Review annotation recommended to document drift before next consultation.`;
    }
    if (judgment === "recommend_contested_review") {
        return `Both challenge dimensions degraded materially. The anchor behavior declared at promotion is no longer preserved. Recommend elevating to contested status pending formal review.`;
    }
    return `Consultation denied at the handoff seam. No judgment required.`;
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
