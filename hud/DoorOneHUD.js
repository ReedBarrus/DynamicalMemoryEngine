// DoorOneHUD.js
//
// Minimal lawful terminal inspection surface for DoorOneOrchestrator output.
//
// Boundary contract:
//   - consumes DoorOneOrchestrator result shape as-is; no re-computation
//   - renders only what is already lawful in the result
//   - preserves hard separation: artifacts / substrate / summaries / audit
//   - no prediction UI, no canon/trust/promoted memory UI
//   - no "true attractor basin" language — neighborhoods only
//   - no reach behind the orchestrator (does not import operators directly)
//   - output is deterministic: same result → same formatted string
//
// Authority class: none — display tooling only, not a runtime authority surface
// Layer: Substrate Space (inspection helper)
//
// Usage:
//   import { DoorOneHUD } from './DoorOneHUD.js';
//   const hud = new DoorOneHUD();
//   console.log(hud.render(orchestratorResult));
//
//   // or write to file:
//   await writeFile('./out/hud.txt', hud.render(result));
//
// References:
//   - README_MasterConstitution.md §3 (layer definitions, boundary rules)
//   - README_ConstitutionAppendix.md §A (Tooling authority class)
//   - DoorOneOrchestrator.js (output shape this HUD consumes)

const W = 72; // terminal width

// ─── DoorOneHUD ───────────────────────────────────────────────────────────────

export class DoorOneHUD {
    /**
     * @param {Object} [cfg]
     * @param {number} [cfg.width=72]           — terminal column width
     * @param {boolean} [cfg.show_ids=false]    — show full state/basin IDs (off by default)
     * @param {number}  [cfg.max_transitions=8] — cap on transition rows shown
     * @param {number}  [cfg.max_dwell=6]       — cap on dwell rows shown
     * @param {number}  [cfg.max_audit=5]       — cap on audit rows per section
     */
    constructor(cfg = {}) {
        this.width           = cfg.width           ?? W;
        this.show_ids        = cfg.show_ids        ?? false;
        this.max_transitions = cfg.max_transitions ?? 8;
        this.max_dwell       = cfg.max_dwell       ?? 6;
        this.max_audit       = cfg.max_audit       ?? 5;
    }

    /**
     * Render a full HUD string from a DoorOneOrchestrator result.
     * Returns an empty-body error panel if result.ok is false.
     *
     * @param {Object} result  — DoorOneOrchestrator result
     * @param {Object} [meta]  — optional caller-supplied metadata
     * @param {string} [meta.mode]       — "batch" | "incremental"
     * @param {string} [meta.run_label]  — short label for this run
     * @returns {string}
     */
    render(result, meta = {}) {
        const lines = [];
        const push  = (...args) => lines.push(...args);

        push(this._bar("═"), "  DOOR ONE — RUNTIME INSPECTION HUD", this._bar("═"));

        if (!result?.ok) {
            push(
                this._row("STATUS", "FAILED"),
                this._row("error",  result?.error ?? "unknown"),
                ...(result?.reasons ?? []).map(r => this._row("  reason", r)),
                this._bar("─"),
            );
            return lines.join("\n");
        }

        const { artifacts, substrate, summaries, audit } = result;
        const tr = substrate?.transition_report ?? {};
        const traj = summaries?.trajectory ?? {};

        // ── Panel 1: Runtime Summary ─────────────────────────────────────────
        push(this._bar("─"), "  [1] RUNTIME SUMMARY", this._bar("─"));
        push(
            this._row("mode",          meta.mode ?? "batch"),
            this._row("run_label",     meta.run_label ?? "—"),
            this._row("stream_id",     artifacts.a1?.stream_id ?? "—"),
            this._row("t_span",        this._tspan(substrate?.t_span)),
            this._row("windows_ok",    String(artifacts.h1s?.length ?? 0)),
            this._row("windows_skip",  String(audit?.skipped_windows?.length ?? 0)),
            this._row("segments",      String(substrate?.segment_count ?? "—")),
            this._row("seg_ids",       this._segList(substrate?.segment_ids ?? [])),
        );

        // ── Panel 2: Artifact Surface ─────────────────────────────────────────
        push(this._bar("─"), "  [2] ARTIFACTS  (pipeline artifact classes only)", this._bar("─"));
        push(
            this._artRow("A1", artifacts.a1,           "ClockStreamChunk"),
            this._artRow("A2", artifacts.a2,           "AlignedStreamChunk"),
            this._artRow("H1", artifacts.h1s,          "HarmonicState[]",        artifacts.h1s?.length),
            this._artRow("M1", artifacts.m1s,          "MergedState[]",          artifacts.m1s?.length),
            this._artRow("An", artifacts.anomaly_reports, "AnomalyReport[]",     artifacts.anomaly_reports?.length),
            this._artRow("A3", artifacts.a3,           "ReconstructedChunk"),
            this._artRow("Q",  artifacts.q,            "QueryResult (Tooling)",  artifacts.q?.results?.length + " results"),
            this._artRow("BN", artifacts.basin_sets,   "BasinSet[]",             artifacts.basin_sets?.length),
        );
        // Explicit non-artifact note — prevents HUD from being read as authoritative
        push("  " + dim("note: substrate reports, summaries, and audit are NOT pipeline artifacts"));

        // ── Panel 3: Substrate Summary ────────────────────────────────────────
        push(this._bar("─"), "  [3] SUBSTRATE  (plain-data read surface)", this._bar("─"));
        push(
            this._row("state_count",   String(substrate?.state_count  ?? "—")),
            this._row("basin_count",   String(substrate?.basin_count  ?? "—")),
            this._row("segment_count", String(substrate?.segment_count ?? "—")),
            this._row("traj_frames",   String(traj.frame_count ?? substrate?.trajectory_frames ?? "—")),
            this._row("seg_trans",     String(substrate?.segment_transitions?.length ?? 0) + " segment boundary events"),
        );
        // Segment transitions (if any)
        const segTrans = substrate?.segment_transitions ?? [];
        if (segTrans.length > 0) {
            push("  " + dim("segment boundary events:"));
            for (const t of segTrans.slice(0, this.max_audit)) {
                const events = t.detected_event_types?.join(", ") || "—";
                push(this._indent(
                    `t=${fmt2(t.t_transition)}  div=${fmt4(t.divergence_score)}  [${events}]`
                ));
            }
            if (segTrans.length > this.max_audit)
                push(this._indent(dim(`… ${segTrans.length - this.max_audit} more`)));
        }

        // ── Panel 4: Neighborhood Transition View ─────────────────────────────
        push(this._bar("─"), "  [4] STRUCTURAL NEIGHBORHOODS  (observational, not prediction)", this._bar("─"));
        push(
            this._row("neighborhoods",  String(tr.total_neighborhoods_observed ?? "—")),
            this._row("transitions",    String(tr.total_transitions ?? "—")),
            this._row("re_entries",     String(tr.total_re_entries  ?? "—")),
            this._row("current_nbhd",   this._shortId(tr.current_neighborhood_id)),
            this._row("current_dwell",  tr.current_dwell_count != null
                ? `${tr.current_dwell_count} frames / ${fmt2(tr.current_dwell_duration_sec)}s` : "—"),
        );

        // Transition table
        const trans = tr.transitions ?? [];
        if (trans.length > 0) {
            const total = tr.total_transitions ?? 1;
            push("  " + dim("neighborhood transitions  (from → to  |  count  |  share):"));
            push("  " + dim("─".repeat(this.width - 4)));
            for (const t of trans.slice(0, this.max_transitions)) {
                const share = total > 0 ? ((t.count / total) * 100).toFixed(0).padStart(3) : "  —";
                const from  = this._shortId(t.from);
                const to    = this._shortId(t.to);
                push(this._indent(`${from}  →  ${to}    ${String(t.count).padStart(3)} (${share}%)`));
            }
            if (trans.length > this.max_transitions)
                push(this._indent(dim(`… ${trans.length - this.max_transitions} more`)));
        }

        // Dwell table
        const dwell = tr.dwell ?? [];
        if (dwell.length > 0) {
            push("  " + dim("dwell per structural neighborhood  (runs | frames | dur_sec | mean_sec):"));
            push("  " + dim("─".repeat(this.width - 4)));
            for (const d of dwell.slice(0, this.max_dwell)) {
                const re = tr.recurrence?.find(r => r.basin_id === d.basin_id)?.re_entry_count ?? 0;
                push(this._indent(
                    `${this._shortId(d.basin_id).padEnd(12)}  ` +
                    `runs=${String(d.dwell_runs).padStart(2)}  ` +
                    `frames=${String(d.total_frames).padStart(3)}  ` +
                    `dur=${fmt2(d.total_duration_sec)}s  ` +
                    `mean=${fmt2(d.mean_duration_sec)}s  ` +
                    `re-entries=${re}`
                ));
            }
            if (dwell.length > this.max_dwell)
                push(this._indent(dim(`… ${dwell.length - this.max_dwell} more`)));
        }

        push("  " + dim("source: " + (tr.generated_from ?? "—")));

        // ── Panel 5: Audit ────────────────────────────────────────────────────
        push(this._bar("─"), "  [5] AUDIT", this._bar("─"));
        const skip   = audit?.skipped_windows   ?? [];
        const mfail  = audit?.merge_failures    ?? [];
        const crec   = audit?.consensus_receipts ?? [];

        push(this._row("skipped_windows",  `${skip.length}`));
        if (skip.length > 0) {
            for (const s of skip.slice(0, this.max_audit))
                push(this._indent(`window=${s.window_id ?? "?"}  stage=${s.stage}  err=${s.error}`));
            if (skip.length > this.max_audit)
                push(this._indent(dim(`… ${skip.length - this.max_audit} more`)));
        }

        push(this._row("merge_failures",   `${mfail.length}`));
        if (mfail.length > 0) {
            for (const f of mfail.slice(0, this.max_audit))
                push(this._indent(`seg=${f.segment_id}  pair=${f.pair}  err=${f.error}`));
            if (mfail.length > this.max_audit)
                push(this._indent(dim(`… ${mfail.length - this.max_audit} more`)));
        }

        push(this._row("consensus (stub)", `${crec.length} evaluated, all result=deferred`));
        if (crec.length > 0) {
            const passCount = crec.filter(r => r.legitimacy_passed).length;
            push(this._indent(`legitimacy passed: ${passCount}/${crec.length}`));
        }

        push(this._bar("═"), "  end of inspection  |  no canon, prediction, or ontology below this line",
             this._bar("═"));

        return lines.join("\n");
    }

    // ─── Formatting helpers ───────────────────────────────────────────────────

    _bar(ch) {
        return "  " + ch.repeat(this.width - 2);
    }

    _row(key, val) {
        const k = ("  " + key).padEnd(22);
        return `${k}  ${val ?? "—"}`;
    }

    _indent(s) {
        return "    " + s;
    }

    /**
     * Render one artifact row. val can be an object, array, or null.
     * Shows presence + count; does NOT recompute or reinterpret content.
     */
    _artRow(cls, val, name, extra) {
        const present = val != null && (Array.isArray(val) ? val.length > 0 : true);
        const badge   = present ? "✓" : "·";
        const detail  = extra != null ? `  [${extra}]` : "";
        const k = ("  " + badge + " " + cls).padEnd(22);
        return `${k}  ${name}${detail}`;
    }

    /**
     * Shorten a basin/segment ID to a readable tag.
     * Uses the last 8 chars of the hash portion + cluster index if present.
     * If show_ids=true, return the full ID.
     */
    _shortId(id) {
        if (!id) return "null";
        if (this.show_ids) return id;
        // BN:...:c<n>:<hash8> → c<n>:<hash8>
        const bnMatch = id.match(/:c(\d+):([0-9a-f]{8})$/);
        if (bnMatch) return `c${bnMatch[1]}:${bnMatch[2]}`;
        // seg:...:N → seg:N
        const segMatch = id.match(/:(\d+)$/);
        if (segMatch) return `seg:${segMatch[1]}`;
        // fallback: last 12 chars
        return "…" + id.slice(-12);
    }

    _tspan(span) {
        if (!span) return "—";
        return `${fmt2(span.t_start)}s – ${fmt2(span.t_end)}s`;
    }

    _segList(ids) {
        if (!ids || ids.length === 0) return "—";
        return ids.map(id => this._shortId(id)).join("  ");
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt2(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toFixed(2);
}

function fmt4(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toFixed(4);
}

/** Wrap text in ANSI dim — safe to use in terminal; ignored if not a TTY */
function dim(s) {
    return `\x1b[2m${s}\x1b[0m`;
}
