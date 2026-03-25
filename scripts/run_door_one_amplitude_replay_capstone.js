// scripts/run_door_one_amplitude_replay_capstone.js
//
// Door One amplitude replay capstone — DAW tone / amplitude perturbation axis
//
// Purpose:
//   - read 9 separate WAV files from ./test_signal/daw_tone_amplitude/
//   - decode each to mono, decimate to ingest lens (2400 Hz)
//   - ingest each file as one labeled run through DoorOneExecutiveLane
//   - write per-run outputs, durable provenance receipts, rolling digest,
//     and one pinned cohort packet
//
// Experiment shape:
//   Phase A — baseline_stable    (3 runs): clean continuous DAW tone
//   Phase B — amplitude_shift   (3 runs): same tone with -6 db amplitude from baseline
//   Phase C — return_stable      (3 runs): back to clean continuous tone
//
// Source note:
//   baseline_01/02/03 are intentionally condition-identical within phase.
//   amplitude_shift_01/02/03 are intentionally condition-identical within phase.
//   return_01/02/03 are intentionally condition-identical within phase.
//   stream_id is PHASE-INVARIANT so cross-run session spans all 9 runs.
//
// Lens posture:
//   base_window_N=1024, hop_N=512, Fs_target=2400 Hz
//   This is the tighter temporal support established in the prior audio slice
//   capstone. The coarser 4096-window variant failed to represent perturbation
//   slices as structured state. Do NOT revert to the coarser window.
//
// Boundary posture:
//   - file-backed source, one lawful ingest seam
//   - not canon, not promotion, not ontology, not truth
//   - receipts survive live pruning
//   - pin packet is preservation-only
//
// Run:
//   node scripts/run_door_one_amplitude_replay_capstone.js
//
// Optional env overrides:
//   DOOR_ONE_CAPSTONE_AUDIO_DIR   — override ./test_signal/daw_tone_amplitude/
//   DOOR_ONE_CAPSTONE_OUTPUT_DIR  — override ./out_experiments/amplitude_replay_capstone
//   DOOR_ONE_CAPSTONE_PROVENANCE  — override ./out_provenance/amplitude_replay_capstone
//   DOOR_ONE_CAPSTONE_PIN_ROOT    — override ./out_provenance/pinned
//
// References:
//   - README_DoorOneContinuousReplayExperiment.md
//   - README_ContinuousIngestRetentionLadder.md
//   - README_DoorOneRuntimeBoundary.md
//   - scripts/run_door_one_audio_file_slice.js   (lens / WAV decode / slice model)
//   - scripts/run_door_one_live.js               (receipt / prune / digest model)
//   - scripts/run_door_one_provenance_digest.js  (digest regeneration)
//   - scripts/run_door_one_pin_packet.js         (pin packet writer)

import { mkdir, readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DoorOneExecutiveLane } from "../runtime/DoorOneExecutiveLane.js";

// ─── Paths ────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUDIO_DIR = process.env.DOOR_ONE_CAPSTONE_AUDIO_DIR
    ?? path.resolve(__dirname, "../test_signal/daw_tone_amplitude");
const OUTPUT_DIR = process.env.DOOR_ONE_CAPSTONE_OUTPUT_DIR
    ?? "./out_experiments/amplitude_replay_capstone";
const PROV_ROOT = process.env.DOOR_ONE_CAPSTONE_PROVENANCE
    ?? "./out_provenance/amplitude_replay_capstone";
const PIN_ROOT = process.env.DOOR_ONE_CAPSTONE_PIN_ROOT
    ?? "./out_provenance/daw_tone_amplitude_v1";

// ─── Lens posture (tighter temporal support — do not change) ─────────────────

const TARGET_SAMPLE_RATE = 2400;

// ─── Policies ────────────────────────────────────────────────────────────────

const BASE_POLICIES = {
    clock_policy_id: "clock.capstone.amplitude.v1",

    ingest_policy: {
        policy_id: "ingest.capstone.amplitude.v1",
        gap_threshold_multiplier: 3.0,
        allow_non_monotonic: false,
        allow_empty: false,
        non_monotonic_mode: "reject",
    },

    grid_spec: {
        Fs_target: TARGET_SAMPLE_RATE,
        t_ref: 0,
        grid_policy: "strict",
        drift_model: "none",
        non_monotonic_policy: "reject",
        interp_method: "linear",
        gap_policy: "interpolate_small",
        small_gap_multiplier: 3.0,
        max_gap_seconds: null,
        anti_alias_filter: false,
    },

    // TIGHTER TEMPORAL SUPPORT — established in prior audio slice capstone.
    // base_window_N=1024 at 2400 Hz → ~0.427 s window duration.
    // This is what made perturbation slices representable as structured state.
    // The coarser 4096 variant (~1.7 s) failed to represent short perturbations.
    window_spec: {
        mode: "fixed",
        Fs_target: TARGET_SAMPLE_RATE,
        base_window_N: 1024,
        hop_N: 512,
        window_function: "hann",
        overlap_ratio: 0.5,
        stationarity_policy: "tolerant",
        salience_policy: "off",
        gap_policy: "interpolate_small",
        max_missing_ratio: 0.25,
        boundary_policy: "pad",
    },

    transform_policy: {
        policy_id: "transform.capstone.amplitude.v1",
        transform_type: "fft",
        normalization_mode: "forward_1_over_N",
        scaling_convention: "real_input_half_spectrum",
        numeric_policy: "tolerant",
    },

    compression_policy: {
        policy_id: "compress.capstone.amplitude.v1",
        selection_method: "topK",
        budget_K: 16,
        maxK: 16,
        include_dc: true,
        invariance_lens: "identity",
        numeric_policy: "tolerant",
        respect_novelty_boundary: true,
        thresholds: {
            max_recon_rmse: 0.25,
            max_energy_residual: 0.25,
            max_band_divergence: 0.30,
        },
    },

    anomaly_policy: {
        policy_id: "anomaly.capstone.amplitude.v1",
        invariance_mode: "band_profile",
        divergence_metric: "band_l1",
        threshold_value: 0.12,
        frequency_tolerance_hz: 3.0,
        phase_sensitivity_mode: "strict",
        novelty_min_duration: 0,
        segmentation_mode: "strict",
        dominant_bin_threshold: 0.2,
        new_frequency_threshold: 0.15,
        vanished_frequency_threshold: 0.15,
        energy_shift_threshold: 0.12,
    },

    merge_policy: {
        policy_id: "merge.capstone.amplitude.v1",
        adjacency_rule: "time_touching",
        phase_alignment_mode: "clock_delta_rotation",
        weights_mode: "duration",
        novelty_gate: "strict",
        merge_mode: "authoritative",
        grid_tolerance: 0,
    },

    post_merge_compression_policy: {
        policy_id: "merge.compress.capstone.amplitude.v1",
        selection_method: "topK",
        budget_K: 16,
        maxK: 16,
        include_dc: true,
        invariance_lens: "identity",
        thresholds: {
            max_recon_rmse: 0.30,
            max_energy_residual: 0.30,
            max_band_divergence: 0.30,
        },
    },

    reconstruct_policy: {
        policy_id: "reconstruct.capstone.amplitude.v1",
        output_format: "values",
        fill_missing_bins: "ZERO",
        validate_invariants: true,
        window_compensation: "NONE",
        numeric_policy: "tolerant",
    },

    basin_policy: {
        policy_id: "basin.capstone.amplitude.v1",
        similarity_threshold: 0.35,
        min_member_count: 1,
        weight_mode: "duration",
        linkage: "single_link",
    },

    consensus_policy: {
        policy_id: "consensus.capstone.amplitude.v1",
        promotion_threshold: 0.8,
        max_energy_drift: 0.1,
        max_band_drift: 0.1,
        coherence_tests: ["energy_invariance", "band_profile_invariance"],
        settlement_mode: "single_node",
    },
};

const QUERY_SPEC = {
    query_id: "q.capstone.amplitude",
    kind: "energy_trend",
    mode: "ENERGY",
    scope: { allow_cross_segment: true },
};

const QUERY_POLICY = {
    policy_id: "qp.capstone.amplitude.v1",
    scoring: "energy_delta",
    normalization: "none",
    topK: 5,
};

const EPOCH_CONTEXT = {
    epoch_id: "epoch.capstone.amplitude.v1",
    t_start: 0,
    t_end: 60,
    settlement_policy_id: "settlement.capstone.amplitude.v1",
    consensus_window: 10,
};

// ─── Run plan ─────────────────────────────────────────────────────────────────
// Files must exist at AUDIO_DIR/<filename>.
// run_labels are used for receipts, output dirs, and pin packet labeling.
// stream_id is built from source_id + channel + modality + sampleRate only —
// phase is intentionally EXCLUDED so all 9 runs share one stream identity and
// cross-run session sees them as the same source across phases.

const SOURCE_ID = "door1.audio.daw_tone.amplitude_v1";
const CHANNEL = "mono_master";
const MODALITY = "audio_amplitude";

const RUN_PLAN = [
    // Phase A — baseline
    { run_label: "baseline_01", phase: "phase_baseline", filename: "baseline_01.wav" },
    { run_label: "baseline_02", phase: "phase_baseline", filename: "baseline_02.wav" },
    { run_label: "baseline_03", phase: "phase_baseline", filename: "baseline_03.wav" },
    // Phase B — continuity perturbation
    { run_label: "amplitude_shift_01", phase: "phase_perturbation", filename: "amplitude_shift_01.wav" },
    { run_label: "amplitude_shift_02", phase: "phase_perturbation", filename: "amplitude_shift_02.wav" },
    { run_label: "amplitude_shift_03", phase: "phase_perturbation", filename: "amplitude_shift_03.wav" },
    // Phase C — return
    { run_label: "return_01", phase: "phase_return", filename: "return_01.wav" },
    { run_label: "return_02", phase: "phase_return", filename: "return_02.wav" },
    { run_label: "return_03", phase: "phase_return", filename: "return_03.wav" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });
    await mkdir(PROV_ROOT, { recursive: true });
    await mkdir(PIN_ROOT, { recursive: true });

    console.log("Door One Amplitude Replay Capstone");
    console.log(`  source dir : ${AUDIO_DIR}`);
    console.log(`  output dir : ${OUTPUT_DIR}`);
    console.log(`  prov root  : ${PROV_ROOT}`);
    console.log(`  lens       : base_window_N=1024, hop_N=512, Fs_target=${TARGET_SAMPLE_RATE} Hz`);
    console.log(`  runs       : ${RUN_PLAN.length}`);
    console.log();

    const lane = new DoorOneExecutiveLane({
        policies: clone(BASE_POLICIES),
        querySpec: clone(QUERY_SPEC),
        queryPolicy: clone(QUERY_POLICY),
        epochContext: clone(EPOCH_CONTEXT),
        consensusPolicy: clone(BASE_POLICIES.consensus_policy),
        max_runs: RUN_PLAN.length + 2,  // headroom
        session_id: "door-one-amplitude-replay-capstone",
    });

    const runRecords = [];
    let cycleIndex = 0;

    for (const runSpec of RUN_PLAN) {
        cycleIndex += 1;
        const filePath = path.join(AUDIO_DIR, runSpec.filename);

        // Read and decode WAV
        let audioBuffer;
        try {
            audioBuffer = await readFile(filePath);
        } catch (err) {
            console.error(`  ✗ ${runSpec.run_label}: cannot read ${filePath} — ${err.message}`);
            process.exit(1);
        }

        const decoded = parseWav(audioBuffer);

        // Validate decimation
        if (decoded.sampleRate % TARGET_SAMPLE_RATE !== 0) {
            console.error(
                `  ✗ ${runSpec.run_label}: source rate ${decoded.sampleRate} Hz does not divide ` +
                `cleanly into ${TARGET_SAMPLE_RATE} Hz`
            );
            process.exit(1);
        }

        const decimationFactor = decoded.sampleRate / TARGET_SAMPLE_RATE;
        const mono = decimateMono(decoded.mono, decimationFactor);

        // Build raw ingest input.
        // stream_id is phase-invariant — cross-run session must span all 9 runs.
        const rawInput = buildRawIngestInput({
            mono,
            sampleRate: TARGET_SAMPLE_RATE,
            source_id: SOURCE_ID,
            channel: CHANNEL,
            modality: MODALITY,
            clock_policy_id: BASE_POLICIES.clock_policy_id,
            source_path: filePath,
            phase: runSpec.phase,
            run_label: runSpec.run_label,
            decimation_factor: decimationFactor,
            original_sample_rate: decoded.sampleRate,
        });

        // Ingest through executive lane
        const result = lane.ingest(rawInput, {
            run_label: runSpec.run_label,
            candidateOptions: {
                claim_type: "stable_structural_identity",
                claim_label: "candidate structural identity — capstone run",
            },
        });

        const ok = result?.ok === true;
        const statusChar = ok ? "✓" : "✗";

        const segCount = result?.run_result?.substrate?.segment_count ?? "—";
        const basinCount = result?.run_result?.substrate?.basin_count ?? "—";
        const stateCount = result?.run_result?.substrate?.state_count ?? "—";
        const transitions = result?.run_result?.substrate?.transition_report?.total_transitions ?? "—";
        const readiness = result?.workbench?.promotion_readiness?.report?.readiness_summary?.overall_readiness ?? "—";

        console.log(
            `  ${statusChar} [${String(cycleIndex).padStart(2)}] ${runSpec.run_label.padEnd(22)}` +
            `  phase=${runSpec.phase.padEnd(20)}` +
            `  seg=${segCount}  basins=${basinCount}  states=${stateCount}` +
            `  trans=${transitions}  readiness=${readiness}`
        );

        if (!ok) {
            console.error(`     error: ${result?.error ?? "unknown"}`);
            if (result?.reasons?.length) result.reasons.forEach(r => console.error(`     reason: ${r}`));
            process.exit(1);
        }

        // Write per-run outputs
        const runDir = path.join(OUTPUT_DIR, runSpec.run_label);
        await mkdir(runDir, { recursive: true });
        await writeJson(path.join(runDir, "run_result.json"), result.run_result);
        await writeJson(path.join(runDir, "workbench.json"), result.workbench);
        await writeJson(path.join(runDir, "cross_run_report.json"), result.cross_run_report);
        await writeJson(path.join(runDir, "session_summary.json"), result.session_summary);
        await writeJson(path.join(runDir, "source_info.json"), {
            run_label: runSpec.run_label,
            phase: runSpec.phase,
            filename: runSpec.filename,
            source_path: filePath,
            source_id: SOURCE_ID,
            channel: CHANNEL,
            modality: MODALITY,
            original_sample_rate_hz: decoded.sampleRate,
            ingested_sample_rate_hz: TARGET_SAMPLE_RATE,
            decimation_factor: decimationFactor,
            sample_count: mono.length,
            duration_sec: mono.length / TARGET_SAMPLE_RATE,
        });

        // Write durable provenance receipt
        const receipt = buildProvenanceReceipt({
            cycleIndex,
            runLabel: runSpec.run_label,
            phase: runSpec.phase,
            runDir: `${runSpec.run_label}`,
            result,
            rawInput,
            filePath,
        });
        const receiptPath = await writeProvenanceReceipt({ provenanceRoot: PROV_ROOT, receipt });
        console.log(`       receipt → ${receiptPath}`);

        runRecords.push({
            cycle_index: cycleIndex,
            run_label: runSpec.run_label,
            phase: runSpec.phase,
            ok,
            stream_id: rawInput.stream_id,
            sample_count: mono.length,
            duration_sec: mono.length / TARGET_SAMPLE_RATE,
            receipt_path: receiptPath,
        });
    }

    console.log();

    // ── Experiment manifest ────────────────────────────────────────────────────
    const manifest = {
        experiment_type: "door_one_amplitude_replay_capstone",
        perturbation_axis: "amplitude",
        source_id: SOURCE_ID,
        channel: CHANNEL,
        modality: MODALITY,
        audio_dir: AUDIO_DIR,
        output_dir: OUTPUT_DIR,
        provenance_root: PROV_ROOT,
        pin_root: PIN_ROOT,
        lens: {
            Fs_target: TARGET_SAMPLE_RATE,
            base_window_N: 1024,
            hop_N: 512,
            window_function: "hann",
        },
        run_plan: RUN_PLAN,
        run_count: runRecords.length,
        ok_count: runRecords.filter(r => r.ok).length,
        phases: {
            phase_baseline: RUN_PLAN.filter(r => r.phase === "phase_baseline").map(r => r.run_label),
            phase_perturbation: RUN_PLAN.filter(r => r.phase === "phase_perturbation").map(r => r.run_label),
            phase_return: RUN_PLAN.filter(r => r.phase === "phase_return").map(r => r.run_label),
        },
        generated_from: "door_one_amplitude_replay_capstone runner — not canon, not promotion",
    };
    await writeJson(path.join(OUTPUT_DIR, "experiment_manifest.json"), manifest);

    // ── Cross-run summary table ────────────────────────────────────────────────
    await writeJson(path.join(OUTPUT_DIR, "runs_summary.json"), runRecords);

    // Final session outputs
    const finalRun = lane.latestRunResult();
    const finalWorkbench = lane.latestWorkbench();
    const finalCrossRun = lane.latestCrossRunReport();
    const sessionSummary = lane.sessionSummary();
    await writeJson(path.join(OUTPUT_DIR, "last_session_summary.json"), sessionSummary);
    await writeJson(path.join(OUTPUT_DIR, "last_cross_run_report.json"), finalCrossRun);
    await writeJson(path.join(OUTPUT_DIR, "last_workbench.json"), finalWorkbench);

    console.log(`Experiment outputs written to ${OUTPUT_DIR}`);

    // ── Rolling digest (Tier 2) ────────────────────────────────────────────────
    console.log();
    console.log("Building rolling provenance digest...");
    const digest = await buildAndWriteDigest({ provenanceRoot: PROV_ROOT });
    console.log(`  digest → ${digest.file_path}  (${digest.receipt_count} receipts)`);

    // ── Pinned cohort packet (Tier 3) ─────────────────────────────────────────
    console.log("Writing pinned cohort packet...");
    const pinResult = await buildAndWritePinPacket({
        provenanceRoot: PROV_ROOT,
        pinRoot: PIN_ROOT,
        digest,
        manifest,
    });
    console.log(`  pin packet → ${pinResult.file_path}`);

    console.log();
    console.log("Retention summary:");
    console.log(`  Tier 1 (durable receipts) : ${runRecords.length} receipts in ${PROV_ROOT}`);
    console.log(`  Tier 2 (rolling digest)   : ${path.join(PROV_ROOT, "live_digest.json")}`);
    console.log(`  Tier 3 (pinned packet)    : ${pinResult.file_path}`);
    console.log();
    console.log("Done. Inspect with:");
    console.log(`  cat ${path.join(OUTPUT_DIR, "runs_summary.json")}`);
    console.log(`  cat ${path.join(OUTPUT_DIR, "last_cross_run_report.json")}`);
    console.log(`  cat ${pinResult.file_path}`);
}

// ─── Retention helpers ────────────────────────────────────────────────────────

// These are self-contained in this script so the runner has no hidden import
// dependency on the separate digest/pin scripts (which may have different
// default path assumptions). The schemas match those scripts exactly.

const RECEIPT_FILE_RE = /^receipt_cycle_(\d+)_.*\.json$/;

function parseReceiptCycleIndex(name) {
    const m = String(name).match(RECEIPT_FILE_RE);
    if (!m) return null;
    const n = Number.parseInt(m[1], 10);
    return Number.isFinite(n) ? n : null;
}

async function writeProvenanceReceipt({ provenanceRoot, receipt }) {
    const idx = String(receipt?.cycle?.cycle_index ?? 0).padStart(4, "0");
    const label = String(receipt?.cycle?.run_label ?? "unknown").replace(/[^a-zA-Z0-9._-]/g, "_");
    const name = `receipt_cycle_${idx}_${label}.json`;
    const fpath = path.join(provenanceRoot, name);
    await writeJson(fpath, receipt);
    return fpath;
}

function buildProvenanceReceipt({ cycleIndex, runLabel, phase, runDir, result, rawInput, filePath }) {
    const wb = result?.workbench ?? {};
    const runtime = wb?.runtime ?? {};
    const substrate = runtime?.substrate ?? {};
    const prr = wb?.promotion_readiness?.report ?? {};
    const readiness = prr?.readiness_summary ?? {};
    const review = wb?.consensus_review?.review ?? {};
    const crossRun = result?.cross_run_report ?? null;

    return {
        receipt_type: "runtime:door_one_live_provenance_receipt",
        receipt_version: "0.1.0",
        generated_from:
            "Door One amplitude replay capstone — durable provenance receipt, not canon, not promotion",
        written_at: new Date().toISOString(),

        cycle: {
            cycle_dir: runDir,
            cycle_index: cycleIndex,
            run_label: runLabel,
            phase,
        },

        scope: {
            stream_id: rawInput?.stream_id ?? null,
            source_mode: "file",
            source_id: rawInput?.source_id ?? null,
            channel: rawInput?.channel ?? null,
            modality: rawInput?.modality ?? null,
            source_path: filePath ?? null,
        },

        structural_summary: {
            state_count: substrate?.state_count ?? 0,
            basin_count: substrate?.basin_count ?? 0,
            segment_count: substrate?.segment_count ?? 0,
            convergence: wb?.interpretation?.trajectory?.trajectory_character?.convergence ?? "unknown",
            motion: wb?.interpretation?.trajectory?.trajectory_character?.motion ?? "unknown",
            occupancy: wb?.interpretation?.trajectory?.neighborhood_character?.occupancy ?? "unknown",
            recurrence: wb?.interpretation?.trajectory?.neighborhood_character?.recurrence_strength ?? "unknown",
            continuity: wb?.interpretation?.trajectory?.segment_character?.continuity ?? "unknown",
            transition_selectivity:
                prr?.evidence_domains?.transition_selectivity?.label ?? "unknown",
        },

        review_summary: {
            readiness: readiness?.overall_readiness ?? "unknown",
            confidence: readiness?.confidence ?? "unknown",
            claim_type:
                wb?.canon_candidate?.dossier?.candidate_claim?.claim_type ?? null,
            consensus_result: review?.result ?? "not_reviewed",
            blocker_count:
                Array.isArray(wb?.canon_candidate?.dossier?.blockers)
                    ? wb.canon_candidate.dossier.blockers.length : 0,
            insufficiency_count:
                Array.isArray(wb?.canon_candidate?.dossier?.insufficiencies)
                    ? wb.canon_candidate.dossier.insufficiencies.length : 0,
        },

        cross_run_context: {
            available: !!crossRun,
            run_count: crossRun?.scope?.run_count ?? 0,
        },

        references: {
            live_cycle_dir: `./${runDir}`,
            latest_cross_run_report: path.join(OUTPUT_DIR, "last_cross_run_report.json"),
            latest_session_summary: path.join(OUTPUT_DIR, "last_session_summary.json"),
        },
    };
}

async function buildAndWriteDigest({ provenanceRoot }) {
    // Discover receipt files
    let entries;
    try {
        entries = await readdir(provenanceRoot, { withFileTypes: true });
    } catch { entries = []; }

    const receiptFiles = entries
        .filter(e => e.isFile() && RECEIPT_FILE_RE.test(e.name))
        .map(e => path.join(provenanceRoot, e.name))
        .sort((a, b) => {
            const ai = parseReceiptCycleIndex(path.basename(a)) ?? 0;
            const bi = parseReceiptCycleIndex(path.basename(b)) ?? 0;
            return ai - bi;
        });

    const loaded = [];
    for (const fp of receiptFiles) {
        try {
            const raw = JSON.parse(await readFile(fp, "utf8"));
            loaded.push({ file_name: path.basename(fp), receipt: raw });
        } catch { /* skip malformed */ }
    }

    const timeline = loaded.map(({ file_name, receipt }) => ({
        file_name,
        cycle_index: receipt?.cycle?.cycle_index ?? null,
        run_label: receipt?.cycle?.run_label ?? null,
        phase: receipt?.cycle?.phase ?? null,
        stream_id: receipt?.scope?.stream_id ?? null,
        source_mode: receipt?.scope?.source_mode ?? null,
        readiness: receipt?.review_summary?.readiness ?? "unknown",
        consensus_result: receipt?.review_summary?.consensus_result ?? "not_reviewed",
        recurrence: receipt?.structural_summary?.recurrence ?? "unknown",
        convergence: receipt?.structural_summary?.convergence ?? "unknown",
        state_count: receipt?.structural_summary?.state_count ?? 0,
        segment_count: receipt?.structural_summary?.segment_count ?? 0,
    }));

    function countBy(arr) {
        const out = {};
        for (const v of arr) { out[v ?? "unknown"] = (out[v ?? "unknown"] ?? 0) + 1; }
        return out;
    }
    function uniqSorted(arr) {
        return [...new Set(arr.filter(v => v != null).map(String))].sort();
    }

    const digest = {
        digest_type: "runtime:door_one_live_provenance_digest",
        digest_version: "0.1.0",
        generated_from:
            "Door One durable provenance receipts only; derived replay/digest surface, not canon, not promotion",
        scope: {
            receipt_count: timeline.length,
            cycle_index_min: timeline.length ? Math.min(...timeline.map(r => r.cycle_index ?? 0)) : null,
            cycle_index_max: timeline.length ? Math.max(...timeline.map(r => r.cycle_index ?? 0)) : null,
            run_labels: uniqSorted(timeline.map(r => r.run_label)),
            phases: uniqSorted(timeline.map(r => r.phase)),
            source_modes: uniqSorted(timeline.map(r => r.source_mode)),
            stream_ids: uniqSorted(timeline.map(r => r.stream_id)),
        },
        aggregates: {
            readiness_counts: countBy(timeline.map(r => r.readiness)),
            consensus_counts: countBy(timeline.map(r => r.consensus_result)),
            recurrence_counts: countBy(timeline.map(r => r.recurrence)),
            convergence_counts: countBy(timeline.map(r => r.convergence)),
            phase_counts: countBy(timeline.map(r => r.phase)),
        },
        timelines: {
            cycle_rows: timeline,
        },
        references: {
            durable_surface: `${provenanceRoot}/receipt_cycle_*.json`,
            receipt_files: receiptFiles.map(p => path.basename(p)),
        },
    };

    const digestPath = path.join(provenanceRoot, "live_digest.json");
    await writeJson(digestPath, digest);

    return { ok: true, digest, file_path: digestPath, receipt_count: timeline.length };
}

async function buildAndWritePinPacket({ provenanceRoot, pinRoot, digest, manifest }) {
    // Read all receipt file names from digest (already ordered)
    const receiptRows = (digest?.digest?.timelines?.cycle_rows ?? []).map(row => ({
        file_name: row.file_name,
        cycle_index: row.cycle_index,
        run_label: row.run_label,
        phase: row.phase,
        stream_id: row.stream_id,
        readiness: row.readiness,
    }));

    const cycleIndices = receiptRows.map(r => r.cycle_index).filter(n => Number.isFinite(n));
    const cycleMin = cycleIndices.length ? Math.min(...cycleIndices) : null;
    const cycleMax = cycleIndices.length ? Math.max(...cycleIndices) : null;

    const packet = {
        packet_type: "runtime:door_one_pin_packet",
        packet_version: "0.1.0",
        generated_from:
            "Door One durable provenance receipts with digest snapshot; " +
            "bounded preservation packet, not canon, not promotion",
        created_at: new Date().toISOString(),

        packet_metadata: {
            declared_purpose: "amplitude_replay_capstone_cohort",
            pin_label: `daw_tone_amplitude_v1_cycles_${String(cycleMin ?? 0).padStart(4, "0")}_${String(cycleMax ?? 0).padStart(4, "0")}`,
            provenance_root: provenanceRoot,
            receipt_count: receiptRows.length,
            cycle_index_min: cycleMin,
            cycle_index_max: cycleMax,
            run_labels: receiptRows.map(r => r.run_label),
            phases: [...new Set(receiptRows.map(r => r.phase).filter(Boolean))].sort(),
            source_modes: ["file"],
            perturbation_axis: "amplitude",
        },

        disclaimers: {
            not_canon: true,
            not_truth: true,
            not_ontology: true,
            not_promotion: true,
            receipts_outrank_digest: true,
            storage_class_not_authority_class: true,
        },

        preservation_contents: {
            receipts: receiptRows,
            digest_snapshot: digest?.digest ?? null,
            experiment_manifest_summary: {
                experiment_type: manifest?.experiment_type ?? null,
                perturbation_axis: manifest?.perturbation_axis ?? null,
                lens: manifest?.lens ?? null,
                run_count: manifest?.run_count ?? null,
                ok_count: manifest?.ok_count ?? null,
            },
        },
    };

    const label = packet.packet_metadata.pin_label;
    const pinName = `${label}.json`;
    const pinPath = path.join(pinRoot, pinName);
    await writeJson(pinPath, packet);

    return { ok: true, packet, file_path: pinPath };
}

// ─── WAV decode (copied from run_door_one_audio_file_slice.js) ────────────────

function readAscii(buffer, start, len) {
    return buffer.toString("ascii", start, start + len);
}

function parseWav(buffer) {
    if (readAscii(buffer, 0, 4) !== "RIFF" || readAscii(buffer, 8, 4) !== "WAVE") {
        throw new Error("Not a valid WAV file");
    }

    let offset = 12;
    let fmtFound = false;
    let dataOffset = 0;
    let dataSize = 0;
    let audioFormat, numChannels, sampleRate, bitsPerSample;

    while (offset + 8 <= buffer.length) {
        const chunkId = readAscii(buffer, offset, 4);
        const chunkSize = buffer.readUInt32LE(offset + 4);
        offset += 8;

        if (chunkId === "fmt ") {
            audioFormat = buffer.readUInt16LE(offset);
            numChannels = buffer.readUInt16LE(offset + 2);
            sampleRate = buffer.readUInt32LE(offset + 4);
            bitsPerSample = buffer.readUInt16LE(offset + 14);
            fmtFound = true;
        } else if (chunkId === "data") {
            dataOffset = offset;
            dataSize = chunkSize;
            break;
        }

        offset += chunkSize + (chunkSize % 2);
    }

    if (!fmtFound) throw new Error("WAV missing fmt chunk");
    if (!dataOffset) throw new Error("WAV missing data chunk");

    const bytesPerSample = bitsPerSample / 8;
    const frameCount = Math.floor(dataSize / (numChannels * bytesPerSample));
    const mono = new Array(frameCount);

    function sampleAt(frame, ch) {
        const sampleOffset = dataOffset + (frame * numChannels + ch) * bytesPerSample;
        if (audioFormat === 1) {
            if (bitsPerSample === 16) return buffer.readInt16LE(sampleOffset) / 32768;
            if (bitsPerSample === 24) {
                const lo = buffer.readUInt16LE(sampleOffset);
                const hi = buffer.readInt8(sampleOffset + 2);
                return ((hi << 16) | lo) / 8388608;
            }
            if (bitsPerSample === 32) return buffer.readInt32LE(sampleOffset) / 2147483648;
            throw new Error(`Unsupported PCM bit depth: ${bitsPerSample}`);
        }
        if (audioFormat === 3) {
            if (bitsPerSample === 32) return buffer.readFloatLE(sampleOffset);
            if (bitsPerSample === 64) return buffer.readDoubleLE(sampleOffset);
            throw new Error(`Unsupported float bit depth: ${bitsPerSample}`);
        }
        throw new Error(`Unsupported WAV audio format: ${audioFormat}`);
    }

    for (let i = 0; i < frameCount; i++) {
        let sum = 0;
        for (let ch = 0; ch < numChannels; ch++) sum += sampleAt(i, ch);
        mono[i] = sum / numChannels;
    }

    return { sampleRate, numChannels, bitsPerSample, audioFormat, frameCount, mono };
}

function decimateMono(mono, factor) {
    if (!Number.isInteger(factor) || factor < 1)
        throw new Error("decimateMono requires an integer factor >= 1");
    if (factor === 1) return mono.slice();
    const out = [];
    for (let i = 0; i < mono.length; i += factor) out.push(mono[i]);
    return out;
}

// ─── Raw ingest builder ───────────────────────────────────────────────────────

function buildRawIngestInput({
    mono, sampleRate, source_id, channel, modality,
    clock_policy_id, source_path, phase, run_label,
    decimation_factor, original_sample_rate,
}) {
    const timestamps = new Array(mono.length);
    for (let i = 0; i < mono.length; i++) timestamps[i] = i / sampleRate;

    // Phase-invariant stream_id — all 9 runs share one stream identity so
    // DoorOneExecutiveLane cross-run session accumulates across phases.
    const stream_id = `STR:${source_id}:${channel}:${modality}:wav:${sampleRate}`;

    return {
        timestamps,
        values: mono,
        stream_id,
        source_id,
        channel,
        modality,
        clock_policy_id,
        meta: {
            source_mode: "file",
            source_format: "wav",
            nominal_sample_rate_hz: sampleRate,
            original_sample_rate_hz: original_sample_rate,
            decimation_factor,
            decode: "mono_average",
            source_path,
            phase,
            run_label,
        },
    };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

async function writeJson(filePath, data) {
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// ─── Entry ────────────────────────────────────────────────────────────────────

main().catch(err => {
    console.error("Fatal:", err.message ?? err);
    process.exit(1);
});
