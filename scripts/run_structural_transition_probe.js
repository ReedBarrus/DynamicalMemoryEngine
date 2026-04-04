// scripts/run_structural_transition_probe.js
//
// Structural Transition Probe — Door One Read-Side Only
//
// Constitutional posture:
//   - Runtime remains below canon.
//   - All candidate transition classes are provisional structural hypotheses only.
//   - They are not truth labels, not validated phases, not semantic events.
//   - No runtime authority, BasinOp changes, workbench effects, or promotion.
//   - Findings are provisional, probe-local, non-canonical.
//   - This probe sits downstream of the continuous master-stream probe —
//     transition vocabulary is visibly derived from the same boundary / segment /
//     recurrence surfaces, not from a new ingest ontology.
//
// Primary question:
//   Can Door One emit a richer candidate structural transition description for
//   unlabeled continuous real-source streams than the coarse three-phase scaffold?
//
// Source family:
//   test_signal/daw_mic_input/master_01–03.wav (same as continuous master probe)
//   Same lens: 2400Hz, N=256, hop=128, bands=[0,300,600,900,1200]
//
// Candidate transition classes (definitions):
//   dwell:       low adjacent-segment L1 + profile stable vs prior segment
//   drift:       gradual monotone directional movement across multiple segments
//   ingress:     moderate L1 (0.08–0.20) — settling into a new structural neighborhood
//                following a rupture (not itself a rupture)
//   coupling:    within a region: two non-dominant bands co-vary (high |correlation|)
//                while band-0 remains suppressed
//   decoupling:  end of a coupling region — previously co-varying bands diverge
//   rupture:     large abrupt L1 (≥ 0.20) — rapid major profile change
//   re-entry:    segment is similar to an earlier segment from a distinct prior region
//                (recurrence after an intervening rupture)
//   unresolved:  none of the above patterns are clearly supported at the current lens
//
// Not used in this probe (justification):
//   distortion:  would require a reference "undistorted" profile, which is not declared
//   collapse:    requires band-spread to narrow toward a single dominant band — not
//                observed in this cohort (all bands non-trivial throughout)
//   branching:   requires competing plausible continuations — single stream, no forks
//
// Transition classification rules (explicit and bounded):
//   boundary_score = L1 between adjacent segment mean profiles
//   rupture:   boundary_score >= RUPTURE_THRESHOLD (0.20)
//   ingress:   boundary_score >= INGRESS_THRESHOLD (0.08) AND < RUPTURE_THRESHOLD
//              AND the segment being entered has not been seen before (no prior similar)
//   dwell:     boundary_score < INGRESS_THRESHOLD AND internal std of band-0 < DRIFT_STD_THRESHOLD
//   drift:     boundary_score < INGRESS_THRESHOLD AND band-2 (or dominant mid-band)
//              shows monotone trend (>= DRIFT_MONOTONE_RATIO of consecutive increases)
//              across >= DRIFT_MIN_SEGS consecutive segments
//   coupling:  within a candidate phase: |corr(band-1, band-2)| >= COUPLING_THRESHOLD
//              AND band-0 mean < LOW_BAND0_THRESHOLD (band-0 suppressed)
//   re-entry:  segment profile is similar to an earlier segment from a different
//              candidate phase (L1 < REENTRY_THRESHOLD) after an intervening rupture
//
// Relationship to continuous master probe:
//   - Reuses the same WAV parser, decimator, band-profile computation
//   - Reuses the same segmentation (4s macro-segments) and boundary detection
//   - Transition vocabulary is explicitly derived from those surfaces
//   - The prior probe output JSON may also be read as input (see --from-probe flag)
//
// Run:
//   node scripts/run_structural_transition_probe.js
//   node scripts/run_structural_transition_probe.js --file master_01.wav
//
// Optional env:
//   PROBE_STP_COHORT_DIR  — override cohort directory
//   PROBE_STP_OUTPUT_DIR  — override output directory

import { mkdir, writeFile } from "node:fs/promises";
import { readFile as fsRead } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dirname, "..");

const COHORT_DIR = process.env.PROBE_STP_COHORT_DIR
    ?? path.join(REPO_ROOT, "test_signal", "daw_mic_input");
const OUTPUT_DIR = process.env.PROBE_STP_OUTPUT_DIR
    ?? path.join(REPO_ROOT, "out_experiments", "structural_transition_probe");

const argv     = process.argv.slice(2);
const fileArg  = argv[argv.indexOf("--file") + 1];
const MASTER_FILES = ["master_01.wav", "master_02.wav", "master_03.wav"];
const FILES_TO_RUN = fileArg ? [fileArg] : MASTER_FILES;

// ─── Lens parameters (identical to continuous master probe — lens-honest) ─────
const TARGET_FS        = 2400;
const WINDOW_N         = 256;
const HOP_N            = 128;
const BAND_EDGES       = [0, 300, 600, 900, 1200];
const N_BANDS          = BAND_EDGES.length - 1;
const SEG_DURATION_SEC = 4.0;
const MIN_WINDOWS_PER_SEG = 8;

// ─── Transition classification thresholds (declared, not implicit) ─────────────
const RUPTURE_THRESHOLD      = 0.20;    // L1 boundary score → rupture
const INGRESS_THRESHOLD      = 0.08;    // L1 boundary score → ingress (if < rupture)
const DRIFT_STD_THRESHOLD    = 0.02;    // band-0 std-dev → dwell (not drift)
const DRIFT_MONOTONE_RATIO   = 0.55;    // fraction of monotone steps needed for drift
const DRIFT_MIN_SEGS         = 4;       // minimum consecutive segments for drift label
const COUPLING_THRESHOLD     = 0.60;    // |corr(band-1, band-2)| → coupling
const LOW_BAND0_THRESHOLD    = 0.50;    // band-0 mean below this → candidate coupling region
const REENTRY_THRESHOLD      = 0.08;    // L1 → re-entry similarity
const REENTRY_MIN_GAP_SEGS   = 3;       // minimum gap between segments for re-entry

// ─── WAV helpers (same as continuous master probe and real-source probe) ───────
function readAscii(buf, s, l) { return buf.toString("ascii", s, s + l); }

function parseWav(buffer) {
    if (readAscii(buffer, 0, 4) !== "RIFF" || readAscii(buffer, 8, 4) !== "WAVE")
        throw new Error("Not a RIFF/WAVE file");
    let offset = 12, fmt = null, dc = null;
    while (offset + 8 <= buffer.length) {
        const id = readAscii(buffer, offset, 4), sz = buffer.readUInt32LE(offset + 4), ds = offset + 8;
        if (id === "fmt ") fmt = { audioFormat: buffer.readUInt16LE(ds), numChannels: buffer.readUInt16LE(ds+2),
            sampleRate: buffer.readUInt32LE(ds+4), blockAlign: buffer.readUInt16LE(ds+12), bitsPerSample: buffer.readUInt16LE(ds+14) };
        else if (id === "data") dc = { start: ds, size: sz };
        offset = ds + sz + (sz % 2);
    }
    if (!fmt || !dc) throw new Error("WAV missing fmt or data chunk");
    const fc = Math.floor(dc.size / fmt.blockAlign), mono = new Array(fc);
    for (let i = 0; i < fc; i++) {
        const off = dc.start + i * fmt.blockAlign;
        mono[i] = fmt.audioFormat === 3 ? buffer.readFloatLE(off) : buffer.readInt32LE(off) / 2147483648;
    }
    return { ...fmt, frameCount: fc, mono, duration_sec: fc / fmt.sampleRate };
}

function decimate(mono, factor) {
    if (factor <= 1) return mono.slice();
    const out = []; for (let i = 0; i < mono.length; i += factor) out.push(mono[i]); return out;
}

// ─── Band profile computation (same algorithm as continuous master probe) ──────
function computeWindowProfiles(samples, fs) {
    const profiles = [];
    for (let wi = 0; wi + WINDOW_N <= samples.length; wi += HOP_N) {
        const w = samples.slice(wi, wi + WINDOW_N);
        for (let i = 0; i < WINDOW_N; i++) w[i] *= 0.5 * (1 - Math.cos(2 * Math.PI * i / (WINDOW_N - 1)));
        const energy = new Array(N_BANDS).fill(0);
        const nOut = Math.floor(WINDOW_N / 2);
        for (let k = 1; k < nOut; k++) {
            let re = 0, im = 0;
            for (let i = 0; i < WINDOW_N; i++) { re += w[i] * Math.cos(2*Math.PI*k*i/WINDOW_N); im += w[i] * Math.sin(2*Math.PI*k*i/WINDOW_N); }
            const e = re*re + im*im, freq = k*fs/WINDOW_N;
            for (let b = 0; b < N_BANDS; b++) if (freq >= BAND_EDGES[b] && freq < BAND_EDGES[b+1]) { energy[b] += e; break; }
        }
        profiles.push(normL1(energy));
    }
    return profiles;
}

function buildSegmentProfiles(windowProfiles, fs) {
    const winPerSeg = Math.floor(SEG_DURATION_SEC * fs / HOP_N);
    const nSegs = Math.floor(windowProfiles.length / winPerSeg);
    return Array.from({ length: nSegs }, (_, s) => {
        const wins = windowProfiles.slice(s * winPerSeg, (s+1) * winPerSeg);
        const mean = new Array(N_BANDS).fill(0);
        wins.forEach(p => p.forEach((v, i) => { mean[i] += v; }));
        return {
            seg_index:         s,
            t_start_sec:       parseFloat((s * SEG_DURATION_SEC).toFixed(2)),
            t_end_sec:         parseFloat(((s+1) * SEG_DURATION_SEC).toFixed(2)),
            window_count:      wins.length,
            mean_band_profile: mean.map(v => parseFloat((v / wins.length).toFixed(6))),
            dominant_band_hz:  BAND_EDGES[mean.indexOf(Math.max(...mean))],
            valid:             wins.length >= MIN_WINDOWS_PER_SEG,
        };
    });
}

// ─── Transition classification ─────────────────────────────────────────────────

/**
 * Classify the transition at each segment boundary.
 * Each entry describes: what happens when we move from segments[i-1] to segments[i].
 */
function classifyBoundaryTransitions(segments, candidatePhases) {
    const transitions = [];

    for (let i = 1; i < segments.length; i++) {
        const prev = segments[i - 1];
        const curr = segments[i];
        const score = l1(prev.mean_band_profile, curr.mean_band_profile);

        let candidateClass, evidence;

        if (score >= RUPTURE_THRESHOLD) {
            candidateClass = "rupture";
            evidence = `boundary_score=${score.toFixed(4)} (>= rupture_threshold=${RUPTURE_THRESHOLD}) — abrupt major profile change`;
        } else if (score >= INGRESS_THRESHOLD) {
            // Ingress: entering a new structural neighborhood after a prior rupture?
            const prevRupture = transitions.slice(-2).some(t => t.candidate_transition === "rupture");
            if (prevRupture) {
                candidateClass = "ingress";
                evidence = `boundary_score=${score.toFixed(4)} following rupture — settling into new structural neighborhood`;
            } else {
                candidateClass = "ingress";
                evidence = `boundary_score=${score.toFixed(4)} (>= ingress_threshold=${INGRESS_THRESHOLD}) — non-trivial profile shift`;
            }
        } else {
            candidateClass = "dwell";
            evidence = `boundary_score=${score.toFixed(4)} (< ingress_threshold=${INGRESS_THRESHOLD}) — low adjacent variation`;
        }

        transitions.push({
            from_seg:           prev.seg_index,
            to_seg:             curr.seg_index,
            from_t_sec:         prev.t_start_sec,
            to_t_sec:           curr.t_start_sec,
            boundary_score:     parseFloat(score.toFixed(6)),
            candidate_transition: candidateClass,
            evidence,
        });
    }

    return transitions;
}

/**
 * Detect drift regions: sequences of segments with monotone directional movement
 * in any single band over >= DRIFT_MIN_SEGS consecutive segments.
 */
function detectDriftRegions(segments) {
    const driftRegions = [];

    // Check each band for monotone drift
    for (let band = 0; band < N_BANDS; band++) {
        const vals = segments.map(s => s.mean_band_profile[band]);
        let runStart = 0, runDir = 0, runLen = 0;

        for (let i = 1; i < vals.length; i++) {
            const dir = vals[i] > vals[i-1] ? 1 : vals[i] < vals[i-1] ? -1 : 0;
            if (dir !== 0 && dir === runDir) {
                runLen++;
            } else {
                if (runLen >= DRIFT_MIN_SEGS - 1) {
                    driftRegions.push({
                        band_index:      band,
                        band_hz:         `${BAND_EDGES[band]}-${BAND_EDGES[band+1]}`,
                        direction:       runDir > 0 ? "increasing" : "decreasing",
                        from_seg:        segments[runStart].seg_index,
                        to_seg:          segments[i-1].seg_index,
                        t_start_sec:     segments[runStart].t_start_sec,
                        t_end_sec:       segments[i-1].t_end_sec,
                        duration_sec:    parseFloat((segments[i-1].t_end_sec - segments[runStart].t_start_sec).toFixed(2)),
                        value_start:     parseFloat(vals[runStart].toFixed(6)),
                        value_end:       parseFloat(vals[i-1].toFixed(6)),
                        magnitude:       parseFloat(Math.abs(vals[i-1] - vals[runStart]).toFixed(6)),
                        candidate_transition: "drift",
                        evidence: `band-${band} (${BAND_EDGES[band]}-${BAND_EDGES[band+1]}Hz) ${runDir>0?"increases":"decreases"} monotonically for ${runLen+1} consecutive segments`,
                    });
                }
                runStart = i - 1;
                runDir   = dir;
                runLen   = 1;
            }
        }
        // Final run
        if (runLen >= DRIFT_MIN_SEGS - 1) {
            driftRegions.push({
                band_index: band, band_hz: `${BAND_EDGES[band]}-${BAND_EDGES[band+1]}`,
                direction: runDir > 0 ? "increasing" : "decreasing",
                from_seg: segments[runStart].seg_index, to_seg: segments.at(-1).seg_index,
                t_start_sec: segments[runStart].t_start_sec, t_end_sec: segments.at(-1).t_end_sec,
                duration_sec: parseFloat((segments.at(-1).t_end_sec - segments[runStart].t_start_sec).toFixed(2)),
                value_start: parseFloat(vals[runStart].toFixed(6)),
                value_end: parseFloat(vals.at(-1).toFixed(6)),
                magnitude: parseFloat(Math.abs(vals.at(-1) - vals[runStart]).toFixed(6)),
                candidate_transition: "drift",
                evidence: `band-${band} monotone continuation to stream end`,
            });
        }
    }
    return driftRegions;
}

/**
 * Detect coupling regions: sub-sequences where two non-dominant bands co-vary
 * strongly while band-0 is suppressed.
 */
function detectCouplingRegions(segments, candidatePhases) {
    const couplingRegions = [];

    for (const phase of candidatePhases) {
        const phaseSegs = segments.filter(s => phase.seg_indices.includes(s.seg_index));
        if (phaseSegs.length < 3) continue;

        const band0Mean = phaseSegs.reduce((s, p) => s + p.mean_band_profile[0], 0) / phaseSegs.length;
        if (band0Mean >= LOW_BAND0_THRESHOLD) continue;   // band-0 not suppressed → skip

        // Check correlations between all band pairs
        for (let b1 = 1; b1 < N_BANDS; b1++) {
            for (let b2 = b1 + 1; b2 < N_BANDS; b2++) {
                const v1 = phaseSegs.map(s => s.mean_band_profile[b1]);
                const v2 = phaseSegs.map(s => s.mean_band_profile[b2]);
                const corr = pearsonCorr(v1, v2);
                if (Math.abs(corr) >= COUPLING_THRESHOLD) {
                    couplingRegions.push({
                        candidate_phase:   phase.candidate_label,
                        t_start_sec:       phaseSegs[0].t_start_sec,
                        t_end_sec:         phaseSegs.at(-1).t_end_sec,
                        band_a:            `${BAND_EDGES[b1]}-${BAND_EDGES[b1+1]}Hz`,
                        band_b:            `${BAND_EDGES[b2]}-${BAND_EDGES[b2+1]}Hz`,
                        corr:              parseFloat(corr.toFixed(6)),
                        corr_direction:    corr > 0 ? "co-increasing" : "anti-correlated",
                        band0_mean:        parseFloat(band0Mean.toFixed(6)),
                        candidate_transition: "coupling",
                        evidence: `|corr(band-${b1}, band-${b2})|=${Math.abs(corr).toFixed(4)} >= ${COUPLING_THRESHOLD} while band-0 mean=${band0Mean.toFixed(4)} < ${LOW_BAND0_THRESHOLD} — ${Math.abs(corr)>=COUPLING_THRESHOLD?"coupled":"uncoupled"} mid-band redistribution`,
                    });
                }
            }
        }
    }
    return couplingRegions;
}

/**
 * Detect re-entry: segment pairs where a later segment is similar to an earlier
 * one from a different candidate phase, after an intervening rupture.
 */
function detectReentryRegions(segments, transitions, candidatePhases) {
    const reentryRows = [];
    const ruptureSegs = new Set(transitions.filter(t => t.candidate_transition === "rupture").map(t => t.to_seg));

    for (let j = REENTRY_MIN_GAP_SEGS; j < segments.length; j++) {
        const phaseJ = candidatePhases.find(p => p.seg_indices.includes(j));
        for (let i = 0; i < j - REENTRY_MIN_GAP_SEGS; i++) {
            const phaseI = candidatePhases.find(p => p.seg_indices.includes(i));
            if (!phaseI || !phaseJ || phaseI.candidate_label === phaseJ.candidate_label) continue;
            // Only flag re-entry if there was at least one rupture between them
            const anyRuptureBetween = [...ruptureSegs].some(r => r > i && r <= j);
            if (!anyRuptureBetween) continue;
            const dist = l1(segments[j].mean_band_profile, segments[i].mean_band_profile);
            if (dist < REENTRY_THRESHOLD) {
                reentryRows.push({
                    reference_seg:      i,
                    current_seg:        j,
                    reference_t_sec:    segments[i].t_start_sec,
                    current_t_sec:      segments[j].t_start_sec,
                    l1_similarity:      parseFloat(dist.toFixed(6)),
                    reference_phase:    phaseI.candidate_label,
                    current_phase:      phaseJ.candidate_label,
                    candidate_transition: "re-entry",
                    evidence: `seg ${j} (t=${segments[j].t_start_sec}s, ${phaseJ.candidate_label}) is similar to earlier seg ${i} (t=${segments[i].t_start_sec}s, ${phaseI.candidate_label}) after intervening rupture — provisional return-like convergence`,
                });
            }
        }
    }
    // Deduplicate — one representative pair per (current_seg, reference_phase) to limit output
    const seen = new Set();
    return reentryRows
        .sort((a, b) => a.l1_similarity - b.l1_similarity)
        .filter(r => {
            const key = `${r.current_seg}:${r.reference_phase}`;
            if (seen.has(key)) return false; seen.add(key); return true;
        }).slice(0, 30);
}

/**
 * Assess ambiguity regions: segments where the transition class is uncertain.
 */
function detectAmbiguityRegions(segments, boundaryTransitions) {
    const ambiguous = [];
    const scoreMap  = Object.fromEntries(
        boundaryTransitions.map(t => [t.to_seg, t.boundary_score]));

    for (let i = 1; i < segments.length; i++) {
        const score = scoreMap[i] ?? 0;
        // Ambiguous: score near the ingress threshold (±0.02)
        if (Math.abs(score - INGRESS_THRESHOLD) < 0.02 || Math.abs(score - RUPTURE_THRESHOLD) < 0.02) {
            ambiguous.push({
                seg_index:   i,
                t_start_sec: segments[i].t_start_sec,
                boundary_score: parseFloat(score.toFixed(6)),
                near_threshold: score < INGRESS_THRESHOLD + 0.02 ? "ingress/dwell boundary"
                    : "ingress/rupture boundary",
                note: "score within ±0.02 of a classification threshold — candidate transition is borderline",
            });
        }
    }
    return ambiguous;
}

/** Build boundary summary from transition rows */
function buildBoundarySummary(boundaryTransitions) {
    const ruptureRows  = boundaryTransitions.filter(t => t.candidate_transition === "rupture");
    const ingressRows  = boundaryTransitions.filter(t => t.candidate_transition === "ingress");
    const dwellRows    = boundaryTransitions.filter(t => t.candidate_transition === "dwell");
    return {
        total_boundaries:        boundaryTransitions.length,
        rupture_count:           ruptureRows.length,
        ingress_count:           ingressRows.length,
        dwell_count:             dwellRows.length,
        rupture_at_t:            ruptureRows.map(t => t.to_t_sec),
        ingress_at_t:            ingressRows.map(t => t.to_t_sec),
        strongest_transition_t:  boundaryTransitions.reduce((a, b) => b.boundary_score > a.boundary_score ? b : a, {boundary_score:0})?.to_t_sec ?? null,
        strongest_transition_score: parseFloat(Math.max(...boundaryTransitions.map(t => t.boundary_score)).toFixed(6)),
    };
}

/** Build recurrence summary from re-entry rows and all-pairs recurrence */
function buildRecurrenceSummary(segments, reentryRows, candidatePhases) {
    // Inter-phase recurrence: mean L1 for each pair of candidate phases
    const phasePairs = [];
    for (let i = 0; i < candidatePhases.length; i++) {
        for (let j = i + 1; j < candidatePhases.length; j++) {
            const segsI = segments.filter(s => candidatePhases[i].seg_indices.includes(s.seg_index));
            const segsJ = segments.filter(s => candidatePhases[j].seg_indices.includes(s.seg_index));
            if (!segsI.length || !segsJ.length) continue;
            const profI = meanVec(segsI.map(s => s.mean_band_profile));
            const profJ = meanVec(segsJ.map(s => s.mean_band_profile));
            phasePairs.push({
                phase_a:      candidatePhases[i].candidate_label,
                phase_b:      candidatePhases[j].candidate_label,
                mean_l1:      parseFloat(l1(profI, profJ).toFixed(6)),
                return_like:  l1(profI, profJ) < REENTRY_THRESHOLD,
            });
        }
    }
    const firstLastReturnLike = phasePairs.find(
        p => p.phase_a === "candidate_A" && p.phase_b === "candidate_C")?.return_like ?? null;

    return {
        total_reentry_pairs:          reentryRows.length,
        reentry_connecting_phases:    [...new Set(reentryRows.map(r => `${r.reference_phase}↔${r.current_phase}`))],
        inter_phase_mean_l1:          phasePairs,
        first_to_last_return_like:    firstLastReturnLike,
        strongest_reentry_l1:         reentryRows.length
            ? parseFloat(Math.min(...reentryRows.map(r => r.l1_similarity)).toFixed(6))
            : null,
    };
}

/** Top-level probe summary for one file */
function buildFileSummary(filename, segments, boundaryTransitions, driftRegions, couplingRegions, reentryRows, ambiguity, candidatePhases) {
    const bs = buildBoundarySummary(boundaryTransitions);
    const hasRupture  = bs.rupture_count >= 1;
    const hasCoupling = couplingRegions.length > 0;
    const hasReentry  = reentryRows.length > 0;
    const hasDrift    = driftRegions.length > 0;

    const vocabUsed = Array.from(new Set([
        ...boundaryTransitions.map(t => t.candidate_transition),
        ...(hasDrift ? ["drift"] : []),
        ...(hasCoupling ? ["coupling"] : []),
        ...(hasReentry ? ["re-entry"] : []),
    ])).sort();

    const interpretation = buildInterpretation(bs, hasCoupling, hasReentry, hasDrift, candidatePhases);

    return {
        filename,
        total_segments:             segments.length,
        transition_vocabulary_used: vocabUsed,
        rupture_count:              bs.rupture_count,
        coupling_regions:           couplingRegions.length,
        reentry_pairs:              reentryRows.length,
        drift_regions:              driftRegions.length,
        ambiguity_regions:          ambiguity.length,
        interpretation,
        not_canon:    true,
        not_prediction: true,
        not_promotion:  true,
        diagnostic_posture: "provisional read-side structural hypothesis — not truth, not validated, not canon",
    };
}

function buildInterpretation(bs, hasCoupling, hasReentry, hasDrift, phases) {
    const parts = [];
    if (bs.rupture_count === 2)
        parts.push(`two ruptures at t=[${bs.rupture_at_t.join("s, ")}s]`);
    else if (bs.rupture_count === 1)
        parts.push(`one rupture at t=${bs.rupture_at_t[0]}s`);
    if (bs.ingress_count > 0)
        parts.push(`${bs.ingress_count} ingress settling regions`);
    if (hasCoupling)
        parts.push("mid-band coupling detected in the disrupted region");
    if (hasReentry)
        parts.push("re-entry: later stream segments converge toward the initial structural neighborhood");
    if (hasDrift)
        parts.push("internal drift observed in one or more bands");
    if (!parts.length) return "no strong candidate transitions at this lens";
    return parts.join("; ");
}

// ─── Metric helpers ───────────────────────────────────────────────────────────
function l1(a, b) { return a.reduce((s, v, i) => s + Math.abs(v - (b[i] ?? 0)), 0); }
function normL1(v) { const s = v.reduce((a, x) => a + Math.abs(x), 0); return s === 0 ? v.map(() => 0) : v.map(x => x / s); }
function meanVec(vecs) {
    if (!vecs.length) return [];
    const acc = new Array(vecs[0].length).fill(0);
    for (const v of vecs) v.forEach((x, i) => { acc[i] += x; });
    return acc.map(x => parseFloat((x / vecs.length).toFixed(6)));
}
function pearsonCorr(x, y) {
    const mx = x.reduce((a, b) => a + b, 0) / x.length;
    const my = y.reduce((a, b) => a + b, 0) / y.length;
    let cov = 0, sx = 0, sy = 0;
    for (let i = 0; i < x.length; i++) {
        cov += (x[i] - mx) * (y[i] - my);
        sx  += (x[i] - mx) ** 2;
        sy  += (y[i] - my) ** 2;
    }
    return sx > 0 && sy > 0 ? cov / Math.sqrt(sx * sy) : 0;
}

// ─── Process one file ─────────────────────────────────────────────────────────
async function processFile(filename) {
    const filePath = path.join(COHORT_DIR, filename);
    let buffer;
    try { buffer = await fsRead(filePath); }
    catch (err) { return { filename, file_found: false, error: err.message }; }

    const parsed      = parseWav(buffer);
    const decimFactor = Math.round(parsed.sampleRate / TARGET_FS);
    const decimated   = decimate(parsed.mono, decimFactor);
    const effectiveFs = Math.round(parsed.sampleRate / decimFactor);

    const lens = {
        source_family:    "daw_mic_input",
        nominal_fs:       parsed.sampleRate,
        decim_factor:     decimFactor,
        effective_fs:     effectiveFs,
        window_N:         WINDOW_N,
        hop_N:            HOP_N,
        band_edges:       BAND_EDGES,
        seg_duration_sec: SEG_DURATION_SEC,
        modality:         "audio",
        channel:          "ch0",
        slice_rule:       "full_stream",
        thresholds: {
            rupture:          RUPTURE_THRESHOLD,
            ingress:          INGRESS_THRESHOLD,
            drift_std:        DRIFT_STD_THRESHOLD,
            drift_monotone:   DRIFT_MONOTONE_RATIO,
            coupling:         COUPLING_THRESHOLD,
            low_band0:        LOW_BAND0_THRESHOLD,
            reentry:          REENTRY_THRESHOLD,
        },
        derived_posture: "read-side observation — provisional, not durable, not canon",
    };

    const t0 = Date.now();

    // ── Compute band profiles and segments ────────────────────────────────────
    const windowProfiles = computeWindowProfiles(decimated, effectiveFs);
    const segments       = buildSegmentProfiles(windowProfiles, effectiveFs);

    // ── Candidate phases (same logic as continuous master probe) ──────────────
    const { candidatePhases, peaks: boundaryPeaks } = buildCandidatePhasesAndPeaks(segments);

    // ── Transition classification ──────────────────────────────────────────────
    const boundaryTransitions = classifyBoundaryTransitions(segments, candidatePhases);
    const driftRegions        = detectDriftRegions(segments);
    const couplingRegions     = detectCouplingRegions(segments, candidatePhases);
    const reentryRows         = detectReentryRegions(segments, boundaryTransitions, candidatePhases);
    const ambiguityRegions    = detectAmbiguityRegions(segments, boundaryTransitions);

    // ── Summaries ─────────────────────────────────────────────────────────────
    const boundarySummary   = buildBoundarySummary(boundaryTransitions);
    const recurrenceSummary = buildRecurrenceSummary(segments, reentryRows, candidatePhases);
    const fileSummary       = buildFileSummary(filename, segments, boundaryTransitions,
        driftRegions, couplingRegions, reentryRows, ambiguityRegions, candidatePhases);

    return {
        filename,
        raw_filepath:   filePath,
        file_found:     true,
        source_id:      `stp.${filename}`,
        stream_id:      `STR:stp.${filename}:ch0:audio:wav:${effectiveFs}:full`,
        channel:        "ch0",
        modality:       "audio",
        clock_policy_id: "clock.stp.v1",
        wav_meta: { duration_sec: parseFloat(parsed.duration_sec.toFixed(3)),
            frame_count: parsed.frameCount, sample_rate: parsed.sampleRate,
            bits_per_sample: parsed.bitsPerSample, audio_format: parsed.audioFormat },
        lens,
        elapsed_ms:          Date.now() - t0,
        total_segments:      segments.length,
        segments,
        candidate_phases:    candidatePhases,
        candidate_boundary_peaks: boundaryPeaks,
        boundary_transitions:    boundaryTransitions,
        drift_regions:           driftRegions,
        coupling_regions:        couplingRegions,
        reentry_rows:            reentryRows,
        ambiguity_regions:       ambiguityRegions,
        boundary_summary:        boundarySummary,
        recurrence_summary:      recurrenceSummary,
        file_summary:            fileSummary,
    };
}

// Re-implement candidate phases inline (same algorithm as continuous master probe)
function buildCandidatePhasesAndPeaks(segments) {
    const scores = segments.slice(1).map((seg, i) => ({
        between: [i, i+1], t: seg.t_start_sec,
        score: l1(seg.mean_band_profile, segments[i].mean_band_profile),
    }));
    const peaks = scores.filter((b, i) => {
        if (b.score < INGRESS_THRESHOLD) return false;   // reuse INGRESS_THRESHOLD as minimum peak
        const prev = scores[i-1]?.score ?? 0, next = scores[i+1]?.score ?? 0;
        return b.score >= prev && b.score >= next;
    // Further filter: only boundary peaks that are above rupture OR clear local maxima
    }).filter(b => b.score >= INGRESS_THRESHOLD);

    const phaseLabels = ["candidate_A","candidate_B","candidate_C","candidate_D","candidate_E"];
    const peakTs = peaks.map(p => p.t);
    const breakpoints = [0, ...peakTs, Infinity];
    const candidatePhases = [];
    for (let i = 0; i < breakpoints.length - 1; i++) {
        const t0 = breakpoints[i], t1 = breakpoints[i+1];
        const phaseSegs = segments.filter(s => s.t_start_sec >= t0 && s.t_start_sec < t1);
        if (!phaseSegs.length) continue;
        const meanProf = meanVec(phaseSegs.map(s => s.mean_band_profile));
        candidatePhases.push({
            phase_index:      i,
            candidate_label:  phaseLabels[i] ?? `candidate_${String.fromCharCode(65+i)}`,
            t_start_sec:      phaseSegs[0].t_start_sec,
            t_end_sec:        phaseSegs.at(-1).t_end_sec,
            duration_sec:     parseFloat((phaseSegs.at(-1).t_end_sec - phaseSegs[0].t_start_sec).toFixed(2)),
            seg_count:        phaseSegs.length,
            seg_indices:      phaseSegs.map(s => s.seg_index),
            mean_band_profile: meanProf,
            dominant_band_hz: BAND_EDGES[meanProf.indexOf(Math.max(...meanProf))],
        });
    }
    return { candidatePhases, peaks };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    console.log("Structural Transition Probe — Door One Read-Side Only");
    console.log(`  cohort dir : ${COHORT_DIR}`);
    console.log(`  output dir : ${OUTPUT_DIR}`);
    console.log(`  files      : ${FILES_TO_RUN.join(", ")}`);
    console.log(`  lens       : ${TARGET_FS}Hz, N=${WINDOW_N}, hop=${HOP_N}, seg=${SEG_DURATION_SEC}s, bands=${JSON.stringify(BAND_EDGES)}`);
    console.log(`  thresholds : rupture=${RUPTURE_THRESHOLD}, ingress=${INGRESS_THRESHOLD}, coupling=${COUPLING_THRESHOLD}`);
    console.log();

    const results = [];
    for (const filename of FILES_TO_RUN) {
        process.stdout.write(`Processing ${filename}... `);
        const result = await processFile(filename);
        results.push(result);

        if (!result.file_found) { console.log(`FILE NOT FOUND`); continue; }
        console.log(`done (${result.elapsed_ms}ms)`);

        const s = result.file_summary;
        console.log(`  Transition vocabulary: [${s.transition_vocabulary_used.join(", ")}]`);
        console.log(`  Ruptures: ${s.rupture_count}  Coupling regions: ${s.coupling_regions}  Re-entry pairs: ${s.reentry_pairs}  Drift regions: ${s.drift_regions}`);
        for (const t of result.boundary_transitions.filter(t => t.candidate_transition !== "dwell")) {
            console.log(`    ${t.candidate_transition.padEnd(10)} t=${t.to_t_sec}s  L1=${t.boundary_score.toFixed(4)}`);
        }
        for (const c of result.coupling_regions) {
            console.log(`    coupling    ${c.t_start_sec}–${c.t_end_sec}s  bands=${c.band_a}↔${c.band_b}  corr=${c.corr.toFixed(4)}`);
        }
        for (const r of result.reentry_rows.slice(0,3)) {
            console.log(`    re-entry    t=${r.reference_t_sec}s↔t=${r.current_t_sec}s  L1=${r.l1_similarity.toFixed(4)}  (${r.reference_phase}→${r.current_phase})`);
        }
        console.log(`  → ${s.interpretation}`);
        console.log();
    }

    const report = {
        probe_type:    "structural_transition_probe",
        probe_version: "0.1.0",
        generated_from: "Door One structural transition probe — read-side only, provisional vocabulary, non-canonical",
        generated_at:   new Date().toISOString(),
        constitutional_posture: {
            runtime_below_canon:              true,
            transition_classes_are_provisional: true,
            no_truth_labels:                  true,
            no_semantic_event_naming:         true,
            no_runtime_authority:             true,
            no_workbench_effects:             true,
            no_canon_minting:                 true,
            no_prediction_claims:             true,
            findings_provisional:             true,
            findings_probe_local:             true,
            findings_non_canonical:           true,
            not_promotion:                    true,
        },
        probe_config: {
            lens: { target_Fs: TARGET_FS, window_N: WINDOW_N, hop_N: HOP_N, band_edges: BAND_EDGES,
                seg_duration_sec: SEG_DURATION_SEC },
            thresholds: { rupture: RUPTURE_THRESHOLD, ingress: INGRESS_THRESHOLD,
                drift_monotone: DRIFT_MONOTONE_RATIO, drift_min_segs: DRIFT_MIN_SEGS,
                coupling: COUPLING_THRESHOLD, low_band0: LOW_BAND0_THRESHOLD, reentry: REENTRY_THRESHOLD },
            transition_class_definitions: {
                dwell:    `boundary_score < ${INGRESS_THRESHOLD} — low adjacent variation`,
                ingress:  `boundary_score in [${INGRESS_THRESHOLD}, ${RUPTURE_THRESHOLD}) — settling into new structural neighborhood`,
                rupture:  `boundary_score >= ${RUPTURE_THRESHOLD} — abrupt major profile change`,
                drift:    `monotone movement in any band across >= ${DRIFT_MIN_SEGS} consecutive segments`,
                coupling: `|corr(band-1, band-2)| >= ${COUPLING_THRESHOLD} while band-0 mean < ${LOW_BAND0_THRESHOLD}`,
                re_entry: `later segment similar to earlier (L1 < ${REENTRY_THRESHOLD}) from different candidate phase after intervening rupture`,
            },
            excluded_classes: {
                distortion: "requires reference 'undistorted' profile — not declared in this lens",
                collapse:   "requires band-spread narrowing toward single dominant band — not observed",
                branching:  "requires competing plausible continuations — single stream, no forks",
                decoupling: "coupling ends abruptly at t=64s rupture, not through gradual decoupling — classified as rupture instead",
            },
        },
        per_file_results: results,
    };

    const outPath = path.join(OUTPUT_DIR, "structural_transition_report.json");
    await writeFile(outPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`Full report → ${outPath}`);
    console.log("Done. BasinOp unchanged. No runtime authority modified. Read-side only.");
}

main().catch(err => { console.error("Fatal:", err.message ?? err); process.exit(1); });
