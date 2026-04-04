// hud/DoorOneHUD.js
//
// Minimal lawful terminal inspection surface for Door One runtime outputs.
//
// Boundary contract:
//   - display tooling only
//   - consumes lawful result/workbench shapes as-is; no re-computation of authority
//   - not canon
//   - not promotion
//   - not ontology
//   - no "true attractor basin" language — neighborhoods only
//   - deterministic: same input → same formatted string
//
// Supported entry points:
//   - render(result, meta)         -> DoorOneOrchestrator result
//   - renderWorkbench(workbench)   -> DoorOneWorkbench integration surface

const W = 72;

export class DoorOneHUD {
    /**
     * @param {Object} [cfg]
     * @param {number} [cfg.width=72]
     * @param {boolean} [cfg.show_ids=false]
     * @param {number} [cfg.max_transitions=8]
     * @param {number} [cfg.max_dwell=6]
     * @param {number} [cfg.max_audit=5]
     * @param {number} [cfg.max_list=6]
     */
    constructor(cfg = {}) {
        this.width = cfg.width ?? W;
        this.show_ids = cfg.show_ids ?? false;
        this.max_transitions = cfg.max_transitions ?? 8;
        this.max_dwell = cfg.max_dwell ?? 6;
        this.max_audit = cfg.max_audit ?? 5;
        this.max_list = cfg.max_list ?? 6;
    }

    /**
     * Render a HUD from a DoorOneOrchestrator result.
     *
     * @param {Object} result
     * @param {Object} [meta]
     * @returns {string}
     */
    render(result, meta = {}) {
        if (!result?.ok) {
            return this._renderFailed("DOOR ONE — RUNTIME INSPECTION HUD", result);
        }

        const view = {
            mode: meta.mode ?? "batch",
            run_label: meta.run_label ?? "—",
            scope: {
                stream_id: result?.artifacts?.a1?.stream_id ?? null,
                segment_ids: Array.isArray(result?.substrate?.segment_ids) ? [...result.substrate.segment_ids] : [],
                t_span: this._copy(result?.substrate?.t_span ?? null),
                cross_run_context: { available: false, run_count: 0 },
            },
            runtime: {
                artifacts: this._copy(result?.artifacts ?? {}),
                substrate: this._copy(result?.substrate ?? {}),
                summaries: this._copy(result?.summaries ?? {}),
                audit: this._copy(result?.audit ?? {}),
            },
            interpretation: {
                trajectory: this._copy(result?.interpretation?.trajectory ?? null),
                attention_memory: this._copy(result?.interpretation?.attention_memory ?? null),
            },
            cross_run: {
                available: false,
                report: null,
            },
            promotion_readiness: {
                report: null,
            },
            canon_candidate: {
                dossier: null,
            },
            consensus_review: {
                review: null,
            },
            notes: [],
        };

        return this._renderCore("DOOR ONE — RUNTIME INSPECTION HUD", view, { ...meta, workbench: false });
    }

    /**
     * Render a HUD from a DoorOneWorkbench object.
     *
     * @param {Object} workbench
     * @param {Object} [meta]
     * @returns {string}
     */
    renderWorkbench(workbench, meta = {}) {
        if (!workbench || workbench.workbench_type !== "runtime:door_one_workbench") {
            return this._renderFailed("DOOR ONE — WORKBENCH HUD", {
                error: "INVALID_WORKBENCH",
                reasons: ["DoorOneHUD.renderWorkbench requires workbench_type=runtime:door_one_workbench"],
            });
        }

        const view = {
            mode: meta.mode ?? "workbench",
            run_label: meta.run_label ?? "—",
            scope: this._copy(workbench.scope ?? {
                stream_id: null,
                segment_ids: [],
                t_span: null,
                cross_run_context: { available: false, run_count: 0 },
            }),
            runtime: this._copy(workbench.runtime ?? {
                artifacts: {},
                substrate: {},
                summaries: {},
                audit: {},
            }),
            interpretation: this._copy(workbench.interpretation ?? {
                trajectory: null,
                attention_memory: null,
            }),
            cross_run: this._copy(workbench.cross_run ?? { available: false, report: null }),
            promotion_readiness: this._copy(workbench.promotion_readiness ?? { report: null }),
            canon_candidate: this._copy(workbench.canon_candidate ?? { dossier: null }),
            consensus_review: this._copy(workbench.consensus_review ?? { review: null }),
            notes: this._copy(workbench.notes ?? []),
        };

        return this._renderCore("DOOR ONE — WORKBENCH HUD", view, { ...meta, workbench: true });
    }

    _renderFailed(title, payload) {
        const lines = [];
        const push = (...args) => lines.push(...args);

        push(this._bar("═"), `  ${title}`, this._bar("═"));
        push(
            this._row("STATUS", "FAILED"),
            this._row("error", payload?.error ?? "unknown"),
            ...((payload?.reasons ?? []).map(r => this._row("  reason", r))),
            this._bar("═"),
        );

        return lines.join("\n");
    }

    _renderCore(title, view, meta = {}) {
        const lines = [];
        const push = (...args) => lines.push(...args);

        const artifacts = view?.runtime?.artifacts ?? {};
        const substrate = view?.runtime?.substrate ?? {};
        const summaries = view?.runtime?.summaries ?? {};
        const audit = view?.runtime?.audit ?? {};
        const tr = substrate?.transition_report ?? {};
        const traj = summaries?.trajectory ?? {};
        const tir = view?.interpretation?.trajectory ?? {};
        const amr = view?.interpretation?.attention_memory ?? {};
        const prr = view?.promotion_readiness?.report ?? {};
        const dossier = view?.canon_candidate?.dossier ?? {};
        const review = view?.consensus_review?.review ?? null;
        const crossRun = view?.cross_run?.report ?? null;

        push(this._bar("═"), `  ${title}`, this._bar("═"));

        // [1] Runtime Summary
        push(this._bar("─"), "  [1] RUNTIME SUMMARY", this._bar("─"));
        push(
            this._row("mode", meta.mode ?? view?.mode ?? "—"),
            this._row("run_label", meta.run_label ?? view?.run_label ?? "—"),
            this._row("stream_id", view?.scope?.stream_id ?? artifacts?.a1?.stream_id ?? "—"),
            this._row("t_span", this._tspan(view?.scope?.t_span ?? substrate?.t_span)),
            this._row("windows_ok", String(artifacts?.h1s?.length ?? 0)),
            this._row("windows_skip", String(audit?.skipped_windows?.length ?? 0)),
            this._row("segments", String(substrate?.segment_count ?? "—")),
            this._row("seg_ids", this._segList(view?.scope?.segment_ids ?? substrate?.segment_ids ?? [])),
        );

        // [2] Artifacts
        push(this._bar("─"), "  [2] ARTIFACTS  (pipeline artifact classes only)", this._bar("─"));
        push(
            this._artRow("A1", artifacts?.a1, "ClockStreamChunk"),
            this._artRow("A2", artifacts?.a2, "AlignedStreamChunk"),
            this._artRow("H1", artifacts?.h1s, "HarmonicState[]", artifacts?.h1s?.length),
            this._artRow("M1", artifacts?.m1s, "MergedState[]", artifacts?.m1s?.length),
            this._artRow("An", artifacts?.anomaly_reports, "AnomalyReport[]", artifacts?.anomaly_reports?.length),
            this._artRow("A3", artifacts?.a3, "ReconstructedChunk"),
            this._artRow("Q", artifacts?.q, "QueryResult (Tooling)", this._queryResultCount(artifacts?.q)),
            this._artRow("BN", artifacts?.basin_sets, "BasinSet[]", artifacts?.basin_sets?.length),
        );
        push("  " + dim("note: substrate reports, summaries, and audit are NOT pipeline artifacts"));

        // [3] Substrate
        push(this._bar("─"), "  [3] SUBSTRATE  (plain-data read surface)", this._bar("─"));
        push(
            this._row("state_count", String(substrate?.state_count ?? "—")),
            this._row("basin_count", String(substrate?.basin_count ?? "—")),
            this._row("segment_count", String(substrate?.segment_count ?? "—")),
            this._row("traj_frames", String(traj?.frame_count ?? substrate?.trajectory_frames ?? "—")),
            this._row("seg_trans", `${String(substrate?.segment_transitions?.length ?? 0)} segment boundary events`),
        );

        const segTrans = substrate?.segment_transitions ?? [];
        if (segTrans.length > 0) {
            push("  " + dim("segment boundary events:"));
            for (const t of segTrans.slice(0, this.max_audit)) {
                const events = Array.isArray(t?.detected_event_types) ? t.detected_event_types.join(", ") : "—";
                push(this._indent(`t=${fmt2(t?.t_transition)}  div=${fmt4(t?.divergence_score)}  [${events}]`));
            }
            if (segTrans.length > this.max_audit) {
                push(this._indent(dim(`… ${segTrans.length - this.max_audit} more`)));
            }
        }

        // [4] Structural Neighborhoods
        push(this._bar("─"), "  [4] STRUCTURAL NEIGHBORHOODS  (observational, not prediction)", this._bar("─"));
        push(
            this._row("neighborhoods", String(tr?.total_neighborhoods_observed ?? "—")),
            this._row("transitions", String(tr?.total_transitions ?? "—")),
            this._row("re_entries", String(tr?.total_re_entries ?? "—")),
            this._row("current_nbhd", this._shortId(tr?.current_neighborhood_id)),
            this._row(
                "current_dwell",
                tr?.current_dwell_count != null
                    ? `${tr.current_dwell_count} frames / ${fmt2(tr?.current_dwell_duration_sec)}s`
                    : "—"
            ),
        );

        const trans = tr?.transitions ?? [];
        if (trans.length > 0) {
            const total = tr?.total_transitions ?? 1;
            push("  " + dim("neighborhood transitions  (from → to  |  count  |  share):"));
            push("  " + dim("─".repeat(this.width - 4)));
            for (const t of trans.slice(0, this.max_transitions)) {
                const share = total > 0 ? ((t?.count / total) * 100).toFixed(0).padStart(3) : "  —";
                push(this._indent(
                    `${this._shortId(t?.from)}  →  ${this._shortId(t?.to)}    ${String(t?.count ?? 0).padStart(3)} (${share}%)`
                ));
            }
            if (trans.length > this.max_transitions) {
                push(this._indent(dim(`… ${trans.length - this.max_transitions} more`)));
            }
        }

        const dwell = tr?.dwell ?? [];
        if (dwell.length > 0) {
            push("  " + dim("dwell per structural neighborhood  (runs | frames | dur_sec | mean_sec):"));
            push("  " + dim("─".repeat(this.width - 4)));
            for (const d of dwell.slice(0, this.max_dwell)) {
                const re = (tr?.recurrence ?? []).find(r => r?.basin_id === d?.basin_id)?.re_entry_count ?? 0;
                push(this._indent(
                    `${this._shortId(d?.basin_id).padEnd(12)}  ` +
                    `runs=${String(d?.dwell_runs ?? 0).padStart(2)}  ` +
                    `frames=${String(d?.total_frames ?? 0).padStart(3)}  ` +
                    `dur=${fmt2(d?.total_duration_sec)}s  ` +
                    `mean=${fmt2(d?.mean_duration_sec)}s  ` +
                    `re-entries=${re}`
                ));
            }
            if (dwell.length > this.max_dwell) {
                push(this._indent(dim(`… ${dwell.length - this.max_dwell} more`)));
            }
        }

        push("  " + dim("source: " + (tr?.generated_from ?? "—")));

        // [5] Audit
        push(this._bar("─"), "  [5] AUDIT", this._bar("─"));
        const skip = audit?.skipped_windows ?? [];
        const mfail = audit?.merge_failures ?? [];
        const crec = audit?.consensus_receipts ?? [];

        push(this._row("skipped_windows", `${skip.length}`));
        if (skip.length > 0) {
            for (const s of skip.slice(0, this.max_audit)) {
                push(this._indent(`window=${s?.window_id ?? "?"}  stage=${s?.stage ?? "?"}  err=${s?.error ?? "?"}`));
            }
            if (skip.length > this.max_audit) {
                push(this._indent(dim(`… ${skip.length - this.max_audit} more`)));
            }
        }

        push(this._row("merge_failures", `${mfail.length}`));
        if (mfail.length > 0) {
            for (const f of mfail.slice(0, this.max_audit)) {
                push(this._indent(`seg=${f?.segment_id ?? "?"}  pair=${f?.pair ?? "?"}  err=${f?.error ?? "?"}`));
            }
            if (mfail.length > this.max_audit) {
                push(this._indent(dim(`… ${mfail.length - this.max_audit} more`)));
            }
        }

        push(this._row("consensus (stub)", `${crec.length} evaluated, all result=deferred`));
        if (crec.length > 0) {
            const passCount = crec.filter(r => r?.legitimacy_passed).length;
            push(this._indent(`legitimacy passed: ${passCount}/${crec.length}`));
        }

        // [6] Interpretation
        push(this._bar("─"), "  [6] INTERPRETATION  (derived overlays only)", this._bar("─"));
        push("  " + dim("base trajectory interpretation:"));
        push(
            this._row("convergence", String(tir?.trajectory_character?.convergence ?? "—")),
            this._row("motion", String(tir?.trajectory_character?.motion ?? "—")),
            this._row("occupancy", String(tir?.neighborhood_character?.occupancy ?? "—")),
            this._row("recurrence", String(tir?.neighborhood_character?.recurrence_strength ?? "—")),
            this._row("continuity", String(tir?.segment_character?.continuity ?? "—")),
        );

        push("  " + dim("attention / memory overlay:"));
        push(
            this._row("attention.conc", String(amr?.attention_character?.concentration ?? "—")),
            this._row("attention.persist", String(amr?.attention_character?.persistence ?? "—")),
            this._row("attention.volatil", String(amr?.attention_character?.volatility ?? "—")),
            this._row("memory.recur", String(amr?.memory_character?.recurrence_strength ?? "—")),
            this._row("memory.persist", String(amr?.memory_character?.persistence ?? "—")),
            this._row("memory.stability", String(amr?.memory_character?.stability ?? "—")),
            this._row("pre_commitment", String(amr?.coordination_hints?.pre_commitment ?? "—")),
        );

        if (Array.isArray(amr?.overlay_flags) && amr.overlay_flags.length > 0) {
            push("  " + dim("overlay flags:"));
            push(this._indent(amr.overlay_flags.join(", ")));
        }

        push("  " + dim("note: derived overlays only; not canon, not intent, not ontology"));

        if (meta.workbench) {
            // [7] Promotion Readiness
            push(this._bar("─"), "  [7] PROMOTION READINESS  (evidence only, not promotion)", this._bar("─"));
            push(
                this._row("overall", String(prr?.readiness_summary?.overall_readiness ?? "—")),
                this._row("confidence", String(prr?.readiness_summary?.confidence_posture ?? "—")),
                this._row("blockers", String(prr?.readiness_summary?.blocker_count ?? 0)),
                this._row("insufficiencies", String(prr?.readiness_summary?.insufficiency_count ?? 0)),
            );

            const domainLabels = prr?.evidence_domains ?? {};
            const domainParts = [];
            for (const [k, v] of Object.entries(domainLabels)) {
                domainParts.push(`${k}=${v?.label ?? "—"}`);
            }
            if (domainParts.length > 0) {
                push("  " + dim("domains:"));
                for (const row of this._chunk(domainParts, 2)) {
                    push(this._indent(row.join("  |  ")));
                }
            }

            // [8] Canon Candidate Dossier
            push(this._bar("─"), "  [8] CANON CANDIDATE DOSSIER  (candidate packet only)", this._bar("─"));
            push(
                this._row("candidate_id", String(dossier?.candidate_id ?? "—")),
                this._row("claim_type", String(dossier?.candidate_claim?.claim_type ?? "—")),
                this._row("claim_label", String(dossier?.candidate_claim?.claim_label ?? "—")),
                this._row("canon_target", String(dossier?.candidate_claim?.intended_canon_target ?? "—")),
                this._row("trust_status", String(dossier?.candidate_claim?.trust_status ?? "—")),
                this._row("review_status", String(dossier?.promotion_recommendation?.review_status ?? "—")),
                this._row("recommendation", String(dossier?.promotion_recommendation?.recommendation ?? "—")),
            );

            // [9] Consensus Review
            push(this._bar("─"), "  [9] CONSENSUS REVIEW  (explicit review outcome)", this._bar("─"));
            if (!review) {
                push(
                    this._row("result", "not_run"),
                    this._row("note", "epoch context not supplied"),
                );
            } else {
                push(
                    this._row("result", String(review?.result ?? "—")),
                    this._row("policy_id", String(review?.review_receipt?.policy_id ?? "—")),
                    this._row("epoch_id", String(review?.review_receipt?.epoch_id ?? "—")),
                    this._row("dossier_id", String(review?.review_receipt?.dossier_id ?? "—")),
                    this._row("c1_emitted", String(review?.review_receipt?.canonical_state_emitted ?? false)),
                );

                const rationale = review?.review_receipt?.rationale ?? [];
                if (rationale.length > 0) {
                    push("  " + dim("rationale:"));
                    for (const r of rationale.slice(0, this.max_list)) {
                        push(this._indent(String(r)));
                    }
                    if (rationale.length > this.max_list) {
                        push(this._indent(dim(`… ${rationale.length - this.max_list} more`)));
                    }
                }
            }

        }
        if (meta.workbench) {
            push("  " + dim("workbench notes:"));
            push(this._indent("Workbench is an integration view, not canon."));
            push(this._indent("Consensus review remains explicit and does not itself imply C1 minting in v0.1."));
        }

        push(this._bar("═"), "  end of inspection  |  no canon, prediction, or ontology below this line", this._bar("═"));

        return lines.join("\n");
    }

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

    _artRow(cls, val, name, extra) {
        const present = val != null && (Array.isArray(val) ? val.length > 0 : true);
        const badge = present ? "✓" : "·";
        const detail = extra != null ? `  [${extra}]` : "";
        const k = (`  ${badge} ${cls}`).padEnd(22);
        return `${k}  ${name}${detail}`;
    }

    _queryResultCount(q) {
        if (!q) return null;
        if (Array.isArray(q?.results)) return `${q.results.length} results`;
        return null;
    }

    _shortId(id) {
        if (!id) return "null";
        if (this.show_ids) return id;

        const bnMatch = String(id).match(/:c(\d+):([0-9a-f]{8})$/);
        if (bnMatch) return `c${bnMatch[1]}:${bnMatch[2]}`;

        const segMatch = String(id).match(/:(\d+)$/);
        if (segMatch) return `seg:${segMatch[1]}`;

        return "…" + String(id).slice(-12);
    }

    _tspan(span) {
        if (!span) return "—";
        return `${fmt2(span?.t_start)}s – ${fmt2(span?.t_end)}s`;
    }

    _segList(ids) {
        if (!ids || ids.length === 0) return "—";
        return ids.map(id => this._shortId(id)).join("  ");
    }

    _chunk(arr, n) {
        const out = [];
        for (let i = 0; i < arr.length; i += n) {
            out.push(arr.slice(i, i + n));
        }
        return out;
    }

    _copy(v) {
        return v == null ? v : JSON.parse(JSON.stringify(v));
    }
}

function fmt2(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toFixed(2);
}

function fmt4(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toFixed(4);
}

function dim(s) {
    return `\x1b[2m${s}\x1b[0m`;
}