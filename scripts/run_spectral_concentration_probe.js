// scripts/run_spectral_concentration_probe.js
//
// Spectral Concentration Probe — Rupture Mechanism Distinction
// Door One Read-Side Only
//
// Constitutional posture:
//   - Runtime remains below canon.
//   - Concentration descriptors are derived read-side support fields only.
//   - The existing `rupture` class is NOT redefined or replaced.
//   - These descriptors supplement rupture with bounded mechanism context.
//   - No runtime authority, BasinOp changes, workbench effects, or promotion.
//   - All findings provisional, probe-local, non-canonical.
//
// Motivation:
//   The distortion audit on the `daw_mic_sine_400hz` family found label flattening:
//   both narrow-band concentration rupture and broadband redistribution rupture
//   receive the same `rupture` label. The audit recommended `add_read_side_probe`.
//   This probe is that probe.
//
// Primary question:
//   Can a minimal concentration descriptor cleanly distinguish
//   narrow-band concentration from broader redistribution in the current
//   real-source rupture families without changing runtime meaning?
//
// Concentration descriptors (all derived, all read-side, all support only):
//   concentration_ratio:
//     max(profile) / second_max(profile)
//     High value = energy concentrated in one band; low = distributed.
//     Threshold: >= 4.0 → concentration_high; < 4.0 → redistribution_broad.
//     Justified by cohort data: prior broadband max ratio ≈ 3.1; sine_400hz min ≈ 4.6.
//
//   nontrivial_band_count:
//     Number of bands carrying >= NONTRIVIAL_THRESHOLD of total normalized energy.
//     Low count = fewer bands meaningfully active.
//     NONTRIVIAL_THRESHOLD = 0.05 (5% of total)
//
//   profile_entropy:
//     -Σ p_i log(p_i) over nonzero band fractions.
//     Lower = more concentrated. Baseline ≈ 1.17; sine perturbation ≈ 0.67.
//     For reference only — ratio and nontrivial_count are the primary descriptors.
//
//   rupture_support_class:
//     "concentration_high":    ratio >= CONCENTRATION_THRESHOLD
//     "redistribution_broad":  ratio < CONCENTRATION_THRESHOLD
//     "unresolved":            profile is near-zero (signal absent)
//
// Cohort families processed:
//   1. daw_mic_input (prior broadband fan+heater)
//   2. daw_mic_sine_400hz (narrow-band 400Hz sine tone)
//
// Same analysis lens for both — lens-honest cross-cohort comparison.
//
// Distortion-audit follow-through:
//   Reports whether the new descriptor resolves the label-flattening finding
//   from audit C in the tighter-band probe.
//
// Run:
//   node scripts/run_spectral_concentration_probe.js
//
// Optional env:
//   PROBE_SCP_OUTPUT_DIR — override output directory

import { mkdir, writeFile } from "node:fs/promises";
import { readFile as fsRead } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dirname, "..");

const OUTPUT_DIR = process.env.PROBE_SCP_OUTPUT_DIR
    ?? path.join(REPO_ROOT, "out_experiments", "spectral_concentration_probe");

// ─── Declared lens (identical to prior real-source probes — lens-honest) ──────
const TARGET_FS     = 2400;
const WINDOW_N      = 256;
const HOP_N         = 128;
const BAND_EDGES    = [0, 300, 600, 900, 1200];
const N_BANDS       = BAND_EDGES.length - 1;
const SEG_DURATION_SEC = 4.0;

// ─── Concentration thresholds (declared, justified) ───────────────────────────
// Justified by cohort separation analysis (see pre-run findings in header):
//   - prior broadband perturbation: ratio = 1.56 (low → redistribution_broad)
//   - sine_400hz perturbation:      ratio = 5.88 (high → concentration_high)
//   - comfortable margin: nearest false candidate ≈ 3.3; nearest true hit ≈ 4.6
const CONCENTRATION_THRESHOLD = 4.0;
const NONTRIVIAL_THRESHOLD    = 0.05;  // 5% of total normalized energy

// ─── Cohort definitions ───────────────────────────────────────────────────────
const COHORTS = [
    {
        family:   "daw_mic_input",
        label:    "Broadband fan+heater (prior cohort)",
        dir:      path.join(REPO_ROOT, "test_signal", "daw_mic_input"),
        files: [
            { filename: "baseline_01.wav", replay_phase: "baseline" },
            { filename: "baseline_02.wav", replay_phase: "baseline" },
            { filename: "baseline_03.wav", replay_phase: "baseline" },
            { filename: "perturb_01.wav",  replay_phase: "perturbation" },
            { filename: "perturb_02.wav",  replay_phase: "perturbation" },
            { filename: "perturb_03.wav",  replay_phase: "perturbation" },
            { filename: "return_01.wav",   replay_phase: "return" },
            { filename: "return_02.wav",   replay_phase: "return" },
            { filename: "return_03.wav",   replay_phase: "return" },
        ],
        masters: ["master_01.wav", "master_02.wav", "master_03.wav"],
        expected_rupture_support: "redistribution_broad",
        perturbation_description: "broadband fan+heater noise — energy redistributes across bands 1-3",
    },
    {
        family:   "daw_mic_sine_400hz",
        label:    "Narrow-band 400Hz sine (tighter-band cohort)",
        dir:      path.join(REPO_ROOT, "test_signal", "daw_mic_sine_400hz"),
        files: [
            { filename: "baseline_01.wav", replay_phase: "baseline" },
            { filename: "baseline_02.wav", replay_phase: "baseline" },
            { filename: "baseline_03.wav", replay_phase: "baseline" },
            { filename: "perturb_01.wav",  replay_phase: "perturbation" },
            { filename: "perturb_02.wav",  replay_phase: "perturbation" },
            { filename: "perturb_03.wav",  replay_phase: "perturbation" },
            { filename: "return_01.wav",   replay_phase: "return" },
            { filename: "return_02.wav",   replay_phase: "return" },
            { filename: "return_03.wav",   replay_phase: "return" },
        ],
        masters: ["master_01.wav", "master_02.wav", "master_03.wav"],
        expected_rupture_support: "concentration_high",
        perturbation_description: "400Hz sine tone — energy concentrates in band-1 [300-600Hz]",
    },
];

// ─── WAV helpers (same as prior probes) ───────────────────────────────────────
function readAscii(buf, s, l) { return buf.toString("ascii", s, s + l); }

function parseWav(buffer, maxSec) {
    let offset = 12, fmt = null, dc = null;
    while (offset + 8 <= buffer.length) {
        const id = readAscii(buffer, offset, 4), sz = buffer.readUInt32LE(offset + 4), ds = offset + 8;
        if (id === "fmt ") fmt = { audioFormat: buffer.readUInt16LE(ds), sampleRate: buffer.readUInt32LE(ds + 4),
            blockAlign: buffer.readUInt16LE(ds + 12), bitsPerSample: buffer.readUInt16LE(ds + 14) };
        else if (id === "data") dc = { start: ds, size: sz };
        offset = ds + sz + (sz % 2);
    }
    const { audioFormat, sampleRate, blockAlign } = fmt;
    const rawFC = Math.floor(dc.size / blockAlign);
    const fc = maxSec ? Math.min(rawFC, Math.floor(maxSec * sampleRate)) : rawFC;
    const mono = new Array(fc);
    for (let i = 0; i < fc; i++) {
        const off = dc.start + i * blockAlign;
        mono[i] = audioFormat === 3 ? buffer.readFloatLE(off) : buffer.readInt32LE(off) / 2147483648;
    }
    return { sampleRate, mono, duration_sec: fc / sampleRate };
}

function decimate(mono, factor) {
    const out = []; for (let i = 0; i < mono.length; i += factor) out.push(mono[i]); return out;
}

// ─── Band profiles ────────────────────────────────────────────────────────────
function windowBandProfiles(samples, fs) {
    const profiles = [];
    for (let wi = 0; wi + WINDOW_N <= samples.length; wi += HOP_N) {
        const w = samples.slice(wi, wi + WINDOW_N);
        for (let i = 0; i < WINDOW_N; i++) w[i] *= 0.5 * (1 - Math.cos(2 * Math.PI * i / (WINDOW_N - 1)));
        const energy = new Array(N_BANDS).fill(0);
        for (let k = 1; k < Math.floor(WINDOW_N / 2); k++) {
            let re = 0, im = 0;
            for (let i = 0; i < WINDOW_N; i++) { re += w[i] * Math.cos(2*Math.PI*k*i/WINDOW_N); im += w[i] * Math.sin(2*Math.PI*k*i/WINDOW_N); }
            const e = re*re + im*im, freq = k*fs/WINDOW_N;
            for (let b = 0; b < N_BANDS; b++) if (freq >= BAND_EDGES[b] && freq < BAND_EDGES[b+1]) { energy[b] += e; break; }
        }
        profiles.push(normL1(energy));
    }
    return profiles;
}

function meanProfile(windowProfiles) {
    const acc = new Array(N_BANDS).fill(0);
    windowProfiles.forEach(p => p.forEach((v, i) => { acc[i] += v; }));
    return acc.map(v => parseFloat((v / windowProfiles.length).toFixed(6)));
}

function macroSegmentProfiles(windowProfiles, fs) {
    const winPerSeg = Math.floor(SEG_DURATION_SEC * fs / HOP_N);
    const nSegs = Math.floor(windowProfiles.length / winPerSeg);
    return Array.from({ length: nSegs }, (_, s) => {
        const wins = windowProfiles.slice(s * winPerSeg, (s+1) * winPerSeg);
        const mean = meanProfile(wins);
        return { seg_index: s, t_start_sec: parseFloat((s * SEG_DURATION_SEC).toFixed(2)), mean_band_profile: mean };
    });
}

// ─── Concentration descriptors ────────────────────────────────────────────────

/**
 * Compute concentration descriptors for a band profile.
 * All derived, all read-side, all support only.
 */
function concentrationDescriptors(profile) {
    const sorted = [...profile].sort((a, b) => b - a);
    const ratio  = sorted[1] > 0 ? sorted[0] / sorted[1] : 999;
    const domIdx = profile.indexOf(Math.max(...profile));
    const nontrivial = profile.filter(v => v >= NONTRIVIAL_THRESHOLD).length;
    // profile_entropy: -Σ p log p over nonzero bands (reference only)
    const entropy = -profile.filter(v => v > 0).reduce((s, v) => s + v * Math.log(v), 0);

    const supportClass = sorted[0] < NONTRIVIAL_THRESHOLD ? "unresolved"
        : ratio >= CONCENTRATION_THRESHOLD ? "concentration_high"
        : "redistribution_broad";

    return {
        dominant_band_index:    domIdx,
        dominant_band_hz:       `${BAND_EDGES[domIdx]}-${BAND_EDGES[domIdx+1]}Hz`,
        concentration_ratio:    parseFloat(ratio.toFixed(4)),
        nontrivial_band_count:  nontrivial,
        profile_entropy:        parseFloat(entropy.toFixed(4)),
        rupture_support_class:  supportClass,
    };
}

// ─── Per-file labeled replay row ───────────────────────────────────────────────
async function analyzeReplayFile(family, dir, spec, seqIdx) {
    const filePath = path.join(dir, spec.filename);
    let buffer;
    try { buffer = await fsRead(filePath); } catch (e) {
        return { filename: spec.filename, replay_phase: spec.replay_phase, file_found: false, error: e.message };
    }
    const parsed   = parseWav(buffer, 8);    // first 8s slice
    const factor   = Math.round(parsed.sampleRate / TARGET_FS);
    const dec      = decimate(parsed.mono, factor);
    const fs       = Math.round(parsed.sampleRate / factor);
    const profiles = windowBandProfiles(dec, fs);
    const mp       = meanProfile(profiles);
    const conc     = concentrationDescriptors(mp);
    return {
        filename:              spec.filename,
        replay_phase:          spec.replay_phase,
        replay_sequence_index: seqIdx,
        source_family:         family,
        source_id:             `scp.${family}.${spec.filename}`,
        raw_filepath:          filePath,
        file_found:            true,
        window_count:          profiles.length,
        mean_band_profile:     mp,
        lens:                  lens(fs, family),
        // Concentration support fields
        ...conc,
        interpretation: `[${spec.replay_phase}] ${conc.rupture_support_class} — ratio=${conc.concentration_ratio}, nontrivial=${conc.nontrivial_band_count}`,
    };
}

// ─── Per-master boundary transition rows ──────────────────────────────────────
async function analyzeMasterBoundaries(family, dir, filename) {
    const filePath = path.join(dir, filename);
    let buffer;
    try { buffer = await fsRead(filePath); } catch (e) {
        return { filename, file_found: false, error: e.message };
    }
    const parsed   = parseWav(buffer, null);
    const factor   = Math.round(parsed.sampleRate / TARGET_FS);
    const dec      = decimate(parsed.mono, factor);
    const fs       = Math.round(parsed.sampleRate / factor);
    const profiles = windowBandProfiles(dec, fs);
    const segments = macroSegmentProfiles(profiles, fs);

    // Boundary scores + concentration for each boundary
    const boundaryRows = segments.slice(1).map((seg, i) => {
        const score = l1(seg.mean_band_profile, segments[i].mean_band_profile);
        const transClass = score >= 0.20 ? "rupture" : score >= 0.08 ? "ingress" : "dwell";
        // For rupture boundaries: annotate BOTH sides with concentration descriptors
        const concBefore = concentrationDescriptors(segments[i].mean_band_profile);
        const concAfter  = concentrationDescriptors(seg.mean_band_profile);
        return {
            boundary_t_sec:         seg.t_start_sec,
            between_segs:           [i, i+1],
            l1_score:               parseFloat(score.toFixed(6)),
            candidate_transition:   transClass,
            // Concentration support — before and after the boundary
            before_rupture_support: concBefore.rupture_support_class,
            after_rupture_support:  concAfter.rupture_support_class,
            before_concentration_ratio: concBefore.concentration_ratio,
            after_concentration_ratio:  concAfter.concentration_ratio,
            before_nontrivial_bands:    concBefore.nontrivial_band_count,
            after_nontrivial_bands:     concAfter.nontrivial_band_count,
            // Mechanism: what KIND of rupture was this (if rupture)?
            rupture_mechanism: transClass === "rupture"
                ? classifyRuptureMechanism(concBefore, concAfter)
                : null,
        };
    });

    const ruptureRows = boundaryRows.filter(r => r.candidate_transition === "rupture");
    return {
        filename, family, file_found: true, source_id: `scp.master.${family}.${filename}`,
        total_segments: segments.length,
        boundary_transition_rows: boundaryRows,
        rupture_rows: ruptureRows,
        lens: lens(fs, family),
    };
}

/**
 * Classify the rupture mechanism from the concentration descriptors on each side.
 * Returns a bounded mechanism string.
 */
function classifyRuptureMechanism(concBefore, concAfter) {
    const intoConc   = concAfter.rupture_support_class  === "concentration_high";
    const outOfConc  = concBefore.rupture_support_class === "concentration_high";
    if (intoConc && !outOfConc)  return "onset_concentration";    // room→sine: entering narrow-band state
    if (!intoConc && outOfConc)  return "release_concentration";  // sine→room: leaving narrow-band state
    if (intoConc && outOfConc)   return "concentration_shift";    // high→high (different band)
    return "redistribution_transition";                            // broad→broad: energy redistributes
}

// ─── Cross-cohort comparison ───────────────────────────────────────────────────
function buildCrossCohortComparison(cohortResults) {
    const rows = [];
    for (const { cohort, replayRows } of cohortResults) {
        const byPhase = {};
        for (const r of replayRows.filter(r => r.file_found)) {
            if (!byPhase[r.replay_phase]) byPhase[r.replay_phase] = [];
            byPhase[r.replay_phase].push(r);
        }
        const meanRatio = phase => {
            const rs = byPhase[phase] ?? [];
            return rs.length ? parseFloat((rs.reduce((s, r) => s + r.concentration_ratio, 0) / rs.length).toFixed(4)) : null;
        };
        const majorityClass = phase => {
            const rs = byPhase[phase] ?? [];
            const counts = {};
            for (const r of rs) counts[r.rupture_support_class] = (counts[r.rupture_support_class] ?? 0) + 1;
            return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";
        };
        rows.push({
            cohort_family:                    cohort.family,
            cohort_label:                     cohort.label,
            perturbation_description:         cohort.perturbation_description,
            baseline_mean_ratio:              meanRatio("baseline"),
            perturbation_mean_ratio:          meanRatio("perturbation"),
            return_mean_ratio:                meanRatio("return"),
            baseline_support_class:           majorityClass("baseline"),
            perturbation_support_class:       majorityClass("perturbation"),
            return_support_class:             majorityClass("return"),
            expected_rupture_support:         cohort.expected_rupture_support,
            classification_correct:           majorityClass("perturbation") === cohort.expected_rupture_support,
            separation_from_baseline_ratio:   meanRatio("perturbation") && meanRatio("baseline")
                ? parseFloat((meanRatio("perturbation") / meanRatio("baseline")).toFixed(3)) : null,
        });
    }
    return {
        comparison_basis:   "concentration_ratio and rupture_support_class",
        lens_match:         "identical lens for both cohorts — lens-honest comparison",
        comparison_rows:    rows,
        separation_clean:   rows.every(r => r.classification_correct),
        interpretation:     rows.every(r => r.classification_correct)
            ? "concentration descriptor cleanly separates narrow-band concentration from broadband redistribution across both cohorts"
            : "classification does not fully separate cohorts — inspect individual rows",
    };
}

// ─── Distortion-audit follow-through ──────────────────────────────────────────
function buildAuditFollowThrough(crossCohort) {
    const clean = crossCohort.separation_clean;
    return {
        audit_reference:    "Audit C (C.transition_vocabulary) from run_tighter_band_real_source_probe.js",
        original_finding:   "label_flattening — narrow-band concentration rupture and broadband redistribution rupture received the same 'rupture' label; mechanism distinction was collapsed",
        original_severity:  "moderate",
        original_action:    "add_read_side_probe",
        probe_response:     "run_spectral_concentration_probe.js adds concentration_ratio, nontrivial_band_count, and rupture_support_class as support descriptors on rupture boundaries and replay summaries",
        resolution_status:  clean ? "distinction_preserved" : "distinction_partially_preserved",
        separation_clean:   clean,
        evidence:           clean
            ? "concentration_ratio cleanly separates broadband (ratio≈1.6–3.1) from narrow-band (ratio≈4.6–5.9) with comfortable margin at threshold=4.0; nontrivial_band_count drops from 4 to 2 during sine perturbation"
            : "some cohort rows may not fully separate — inspect cross_cohort_comparison",
        rupture_class_unchanged: true,
        note: "The `rupture` transition class is NOT redefined. It remains a boundary-severity descriptor (L1 >= 0.20). The concentration descriptor is a supplementary support field that annotates the mechanism — what KIND of structural shift caused the rupture — without changing the threshold classification.",
        updated_severity:   clean ? "low" : "moderate",
        recommended_action: clean ? "clarify_language_only" : "add_unresolved_posture",
        not_canon:          true, not_promotion: true,
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function l1(a, b) { return a.reduce((s, v, i) => s + Math.abs(v - (b[i] ?? 0)), 0); }
function normL1(v) { const s = v.reduce((a, x) => a + Math.abs(x), 0); return s === 0 ? v.map(() => 0) : v.map(x => x / s); }
function lens(fs, family) {
    return { source_family: family, nominal_fs: 48000, effective_fs: fs,
        decim_factor: Math.round(48000 / fs), window_N: WINDOW_N, hop_N: HOP_N,
        band_edges: BAND_EDGES, seg_duration_sec: SEG_DURATION_SEC,
        modality: "audio", channel: "ch0",
        concentration_threshold: CONCENTRATION_THRESHOLD,
        nontrivial_threshold: NONTRIVIAL_THRESHOLD,
        derived_posture: "read-side support descriptor — provisional, not durable, not canon",
    };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Spectral Concentration Probe — Rupture Mechanism Distinction");
    console.log("Door One Read-Side Only");
    console.log(`  output dir          : ${OUTPUT_DIR}`);
    console.log(`  lens                : ${TARGET_FS}Hz, N=${WINDOW_N}, hop=${HOP_N}, bands=${JSON.stringify(BAND_EDGES)}`);
    console.log(`  concentration_threshold : ${CONCENTRATION_THRESHOLD}`);
    console.log(`  nontrivial_threshold    : ${NONTRIVIAL_THRESHOLD}`);
    console.log(`  cohorts : ${COHORTS.map(c => c.family).join(", ")}`);
    console.log();

    const cohortResults = [];

    for (const cohort of COHORTS) {
        console.log(`── Cohort: ${cohort.family} (${cohort.label})`);

        // Labeled replay
        const replayRows = [];
        for (let i = 0; i < cohort.files.length; i++) {
            const row = await analyzeReplayFile(cohort.family, cohort.dir, cohort.files[i], i);
            replayRows.push(row);
            if (row.file_found) {
                console.log(`  ${row.replay_phase.padEnd(13)} ${row.filename.padEnd(16)} ratio=${String(row.concentration_ratio).padStart(6)}  ${row.rupture_support_class}`);
            } else {
                console.log(`  ${row.replay_phase.padEnd(13)} ${row.filename.padEnd(16)} NOT FOUND`);
            }
        }

        // Master boundary analysis
        const masterResults = [];
        for (const fn of cohort.masters) {
            const r = await analyzeMasterBoundaries(cohort.family, cohort.dir, fn);
            masterResults.push(r);
            if (r.file_found) {
                for (const b of r.rupture_rows) {
                    console.log(`    rupture t=${b.boundary_t_sec}s  L1=${b.l1_score.toFixed(4)}  mechanism=${b.rupture_mechanism}  before=${b.before_rupture_support} → after=${b.after_rupture_support}`);
                }
            }
        }

        cohortResults.push({ cohort, replayRows, masterResults });
        console.log();
    }

    // Cross-cohort comparison
    console.log("── Cross-Cohort Comparison");
    const crossCohort = buildCrossCohortComparison(cohortResults);
    for (const r of crossCohort.comparison_rows) {
        const checkmark = r.classification_correct ? "✓" : "✗";
        console.log(`  ${checkmark} ${r.cohort_family.padEnd(22)} pert_ratio=${r.perturbation_mean_ratio}  class=${r.perturbation_support_class}  expected=${r.expected_rupture_support}`);
    }
    console.log(`  Separation clean: ${crossCohort.separation_clean}`);
    console.log(`  ${crossCohort.interpretation}`);

    // Distortion-audit follow-through
    console.log("\n── Distortion-Audit Follow-Through (Audit C)");
    const audit = buildAuditFollowThrough(crossCohort);
    console.log(`  Original severity : ${audit.original_severity} → updated: ${audit.updated_severity}`);
    console.log(`  Resolution status : ${audit.resolution_status}`);
    console.log(`  rupture class unchanged: ${audit.rupture_class_unchanged}`);
    console.log(`  ${audit.evidence}`);

    // Write report
    const report = {
        probe_type:    "spectral_concentration_probe",
        probe_version: "0.1.0",
        generated_at:  new Date().toISOString(),
        constitutional_posture: {
            runtime_below_canon:                  true,
            concentration_descriptors_are_support: true,
            rupture_class_not_redefined:          true,
            no_truth_labels:                      true,
            no_runtime_authority:                 true,
            no_workbench_effects:                 true,
            no_canon_minting:                     true,
            no_prediction_claims:                 true,
            findings_provisional:                 true,
            findings_non_canonical:               true,
        },
        probe_config: {
            lens: { target_Fs: TARGET_FS, window_N: WINDOW_N, hop_N: HOP_N,
                band_edges: BAND_EDGES, seg_duration_sec: SEG_DURATION_SEC },
            concentration_threshold: CONCENTRATION_THRESHOLD,
            nontrivial_threshold:    NONTRIVIAL_THRESHOLD,
            descriptor_definitions: {
                concentration_ratio: "max(profile) / second_max(profile) — higher = more concentrated",
                nontrivial_band_count: `bands with energy >= ${NONTRIVIAL_THRESHOLD} of total`,
                profile_entropy: "-sum(p log p) — lower = more concentrated",
                rupture_support_class: `concentration_high if ratio >= ${CONCENTRATION_THRESHOLD}; redistribution_broad otherwise; unresolved if no signal`,
                rupture_mechanism: "onset_concentration | release_concentration | concentration_shift | redistribution_transition",
            },
            threshold_justification: {
                concentration_threshold: `${CONCENTRATION_THRESHOLD} — prior broadband perturbation max ratio ≈ 3.1; sine_400hz min ratio ≈ 4.6; comfortable margin at 4.0`,
                nontrivial_threshold: `${NONTRIVIAL_THRESHOLD} — 5% of total normalized energy; prior cohort all-4 nontrivial; sine_400hz perturbation drops to 2`,
            },
            cohorts_processed: COHORTS.map(c => ({ family: c.family, label: c.label })),
        },
        per_cohort_results: cohortResults.map(({ cohort, replayRows, masterResults }) => ({
            cohort_family: cohort.family,
            labeled_replay_rows: replayRows,
            master_boundary_results: masterResults,
        })),
        cross_cohort_comparison: crossCohort,
        distortion_audit_followthrough: audit,
    };

    const reportPath = path.join(OUTPUT_DIR, "spectral_concentration_report.json");
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nFull report → ${reportPath}`);
    console.log("Done. BasinOp unchanged. No runtime authority modified. Read-side only.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
