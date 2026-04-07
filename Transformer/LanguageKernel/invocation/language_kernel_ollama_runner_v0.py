from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from Transformer.LanguageKernel.benchmarks.language_kernel_benchmark_runner_v0 import run_benchmark_file  # noqa: E402
from Transformer.LanguageKernel.validator.language_kernel_local_model_conformance_v0 import (  # noqa: E402
    ALLOWED_PANEL_MODELS,
    OPERATION_MODES,
    build_receipt as build_received_response_receipt,
    raw_decode_json,
)
from Transformer.LanguageKernel.validator.language_kernel_validator_v0 import (  # noqa: E402
    ROOT as SCHEMA_ROOT,
    SchemaResolver,
    ValidationError,
    validate_instance,
)


OUTPUT_ROOT = REPO_ROOT / "Transformer" / "LanguageKernel" / "outputs"
DEFAULT_EXPORT_PACKET = OUTPUT_ROOT / "export_packet.first_run.json"
DEFAULT_PROMPT_TEMPLATE = (
    REPO_ROOT / "Transformer" / "LanguageKernel" / "examples" / "prompt" / "language_kernel.first_turn.contract_conformance_mode.prompt.txt"
)
DEFAULT_FAMILY = "frame_contract_conformance"
MODEL_ALIAS_MAP = {
    "Hermes 3 Llama 3.2 3B": "hermes3:3b",
    "Meta Llama 3.1 8B Instruct": "llama3.1:8b",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def build_id_base(export_packet: dict[str, Any], model_name: str) -> str:
    packet_suffix = export_packet["export_packet_id"].replace("EK:", "").replace(":", "_")
    model_suffix = model_name.lower().replace(" ", "_").replace(".", "_")
    return f"{packet_suffix}.{model_suffix}"


def artifact_paths(output_root: Path, id_base: str) -> dict[str, Path]:
    return {
        "prompt_text": output_root / f"{id_base}.prompt.txt",
        "prompt_receipt": output_root / f"{id_base}.prompt_receipt.json",
        "raw_response": output_root / f"{id_base}.raw_response.txt",
        "response_receipt": output_root / f"{id_base}.response_receipt.json",
        "run": output_root / f"{id_base}.run.json",
        "benchmark": output_root / f"{id_base}.benchmark.json",
        "summary": output_root / f"{id_base}.invocation_summary.json",
    }


def validate_export_packet(export_packet_file: Path, resolver: SchemaResolver) -> dict[str, Any]:
    export_packet = load_json(export_packet_file)
    schema_path = SCHEMA_ROOT / "language_overlay_export.schema.json"
    validate_instance(export_packet, resolver.load_json(schema_path), schema_path, resolver)
    return export_packet


def build_prompt(template_path: Path, export_packet: dict[str, Any]) -> str:
    template_text = template_path.read_text(encoding="utf-8")
    export_blob = json.dumps(export_packet, indent=2)
    if "<EXPORT_PACKET_JSON>" not in template_text:
        raise ValidationError("Prompt template did not contain <EXPORT_PACKET_JSON> placeholder.")
    prompt_text = template_text.replace("<EXPORT_PACKET_JSON>", export_blob)
    first_row = export_packet["rows"][0]
    resolved_lines = [
        "",
        "Resolved first-turn anchors for this exact export packet:",
        f'- what_object_am_i must include "{first_row["object_handle"]}" without angle-bracket placeholders.',
        f'- how_produced must include export packet id "{export_packet["export_packet_id"]}".',
        f'- depends_on must include "{first_row["object_handle"]}".',
        f'- query_class must be "{export_packet["query_class"]}".',
        f'- claim_class_ceiling must be "{export_packet["claim_class_ceiling"]}".',
        f'- current_status.continuity must be "{first_row["continuity_status"]}".',
        f'- current_status.structural_loss_percent must be {first_row["structural_loss_percent"]}.',
        f'- current_status.support_tier must be "{export_packet["support_tier"]}".',
        '- reasoning_overlay must be one concise sentence grounded in the export packet, not placeholder text.',
        '- what_next must be present exactly as shown in the template.',
        '- Remove all angle-bracket placeholder tokens before you return JSON.',
    ]
    if first_row.get("upstream_handles"):
        resolved_lines.insert(4, f'- depends_on may also include "{first_row["upstream_handles"][0]}".')
    return prompt_text + "\n".join(resolved_lines) + "\n"


def build_prompt_receipt(
    *,
    prompt_receipt_id: str,
    kernel_run_id: str,
    export_packet: dict[str, Any],
    prompt_text: str,
    model_name: str,
    prompt_status: str,
    invoked_at: str,
    prompt_notes: list[str],
    block_reasons: list[str] | None = None,
) -> dict[str, Any]:
    receipt: dict[str, Any] = {
        "prompt_receipt_id": prompt_receipt_id,
        "invoker_version": "v0.1",
        "kernel_contract_version": export_packet["kernel_contract_version"],
        "export_packet_id": export_packet["export_packet_id"],
        "kernel_run_id": kernel_run_id,
        "provider": "ollama",
        "model_name": model_name,
        "declared_lens": export_packet["declared_lens"],
        "query_class": export_packet["query_class"],
        "claim_class_ceiling": export_packet["claim_class_ceiling"],
        "operator_mode": "explicit_only",
        "legal_claim_string": "Bounded interpretation overlay only. No canon authority. Not structural truth. Read-side recursion experiment.",
        "what_next_string": "Await explicit operator request for next recursion turn or new retained signature reference.",
        "allowed_reference_scope": "export_packet_only",
        "allowed_frame_types": [
            "reasoning_overlay",
        ],
        "allowed_uses": export_packet["allowed_uses"],
        "non_claims": export_packet["non_claims"],
        "prompt_flags": [
            "json_only",
            "explicit_recursion_only",
            "fixed_legal_claim",
            "fixed_what_next",
            "bounded_export_only",
            "no_authority_inflation",
        ],
        "legal_posture": "Read-side Language Kernel prompt only. No canon authority. Not structural truth. Not primary retention substance.",
        "prompt_status": prompt_status,
        "invoked_at": invoked_at,
    }
    if prompt_status in {"assembled", "submitted"}:
        receipt["prompt_hash_sha256"] = sha256_hex(prompt_text)
    if prompt_notes:
        receipt["prompt_notes"] = prompt_notes
    if block_reasons:
        receipt["block_reasons"] = block_reasons

    resolver = SchemaResolver()
    schema_path = SCHEMA_ROOT / "prompt_receipt.schema.json"
    validate_instance(receipt, resolver.load_json(schema_path), schema_path, resolver)
    return receipt


def build_blocked_response_receipt(
    *,
    response_receipt_id: str,
    prompt_receipt_id: str,
    kernel_run_id: str,
    export_packet: dict[str, Any],
    model_name: str,
    refusal_reason: str,
    receiver_notes: list[str],
) -> dict[str, Any]:
    receipt = {
        "response_receipt_id": response_receipt_id,
        "receiver_version": "v0.1",
        "kernel_contract_version": export_packet["kernel_contract_version"],
        "kernel_run_id": kernel_run_id,
        "export_packet_id": export_packet["export_packet_id"],
        "prompt_receipt_id": prompt_receipt_id,
        "provider": "ollama",
        "model_name": model_name,
        "declared_lens": export_packet["declared_lens"],
        "query_class": export_packet["query_class"],
        "claim_class_ceiling": export_packet["claim_class_ceiling"],
        "legal_posture": "Read-side Language Kernel response only. No canon authority. Not structural truth. Not primary retention substance.",
        "response_status": "blocked",
        "parse_status": "not_attempted",
        "schema_status": "not_checked",
        "frame_count": 0,
        "conformance_outcome": "aborted_contract_failure",
        "receiver_flags": [
            "json_only_expected",
        ],
        "refusal_reason": refusal_reason,
        "receiver_notes": receiver_notes,
        "received_at": utc_now(),
    }
    resolver = SchemaResolver()
    schema_path = SCHEMA_ROOT / "response_receipt.schema.json"
    validate_instance(receipt, resolver.load_json(schema_path), schema_path, resolver)
    return receipt


def extract_conformant_frames(raw_text: str, resolver: SchemaResolver) -> list[dict[str, Any]]:
    payload, parse_status, extra_prose = raw_decode_json(raw_text)
    if parse_status != "parsed" or extra_prose:
        raise ValidationError("Raw response was not clean parsed JSON.")
    if not isinstance(payload, dict) or not isinstance(payload.get("language_frames"), list):
        raise ValidationError("Raw response did not contain a top-level language_frames array.")
    frames = payload["language_frames"]
    schema_path = SCHEMA_ROOT / "reasoning_frame.schema.json"
    schema = resolver.load_json(schema_path)
    for index, frame in enumerate(frames):
        validate_instance(frame, schema, schema_path, resolver, f"$.language_frames[{index}]")
    return frames


def make_violation(
    *,
    violation_id: str,
    violation_class: str,
    severity: str,
    message: str,
    frame_id: str | None = None,
    source_handle: str | None = None,
    expected: str | float | bool | None = None,
    observed: str | float | bool | None = None,
    suggested_posture: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "violation_id": violation_id,
        "violation_class": violation_class,
        "severity": severity,
        "message": message,
    }
    if frame_id is not None:
        payload["frame_id"] = frame_id
    if source_handle is not None:
        payload["source_handle"] = source_handle
    if expected is not None:
        payload["expected"] = expected
    if observed is not None:
        payload["observed"] = observed
    if suggested_posture is not None:
        payload["suggested_posture"] = suggested_posture
    return payload


def invariant_status(score: float) -> str:
    if score >= 1.0:
        return "pass"
    if score <= 0:
        return "fail"
    return "downgraded"


def clamp_score(value: float) -> float:
    return max(0.0, min(1.0, round(value, 4)))


def build_validation_receipt(
    *,
    kernel_run_id: str,
    export_packet: dict[str, Any],
    prompt_receipt: dict[str, Any],
    response_receipt: dict[str, Any],
    frames: list[dict[str, Any]],
) -> dict[str, Any]:
    rows = export_packet["rows"]
    row_by_handle = {row["object_handle"]: row for row in rows}
    allowed_refs: set[str] = set()
    for row in rows:
        allowed_refs.add(row["object_handle"])
        allowed_refs.add(row["provenance_receipt_hash"])
        for upstream in row.get("upstream_handles", []):
            allowed_refs.add(upstream)

    identity_hits = 0
    provenance_hits = 0
    recursion_hits = 0
    continuity_hits = 0
    geometry_hits = 0
    violations: list[dict[str, Any]] = []
    downgrade_posture: set[str] = set()

    for index, frame in enumerate(frames, start=1):
        frame_id = frame["frame_id"]
        matched_handle = next((ref for ref in frame["depends_on"] if ref in row_by_handle), None)
        matched_row = row_by_handle.get(matched_handle) if matched_handle else None

        if matched_row and matched_handle in frame["what_object_am_i"]:
            identity_hits += 1
        else:
            violations.append(
                make_violation(
                    violation_id=f"VV:{kernel_run_id.replace('KR:', '')}:identity:{index:02d}",
                    violation_class="identity_loss",
                    severity="warning",
                    frame_id=frame_id,
                    source_handle=matched_handle,
                    message="Frame self-description did not preserve an exact exported object handle.",
                    suggested_posture="downgrade",
                )
            )
            downgrade_posture.add("support_only")

        unsupported_refs = [ref for ref in frame["depends_on"] if not ref.startswith("LF:") and ref not in allowed_refs]
        if matched_row and not unsupported_refs:
            provenance_hits += 1
        else:
            violations.append(
                make_violation(
                    violation_id=f"VV:{kernel_run_id.replace('KR:', '')}:provenance:{index:02d}",
                    violation_class="unsupported_reference",
                    severity="error",
                    frame_id=frame_id,
                    source_handle=matched_handle,
                    message="Frame dependency trace included unsupported or ungrounded references.",
                    observed=", ".join(unsupported_refs) if unsupported_refs else "no exact export row handle matched",
                    suggested_posture="downgrade",
                )
            )
            downgrade_posture.add("unsupported_reference")

        if (
            frame["what_next"]
            == "Await explicit operator request for next recursion turn or new retained signature reference."
        ):
            recursion_hits += 1
        else:
            violations.append(
                make_violation(
                    violation_id=f"VV:{kernel_run_id.replace('KR:', '')}:explicit:{index:02d}",
                    violation_class="explicit_recursion_breach",
                    severity="error",
                    frame_id=frame_id,
                    message="Frame did not preserve the fixed explicit-recursion what_next string.",
                    suggested_posture="downgrade",
                )
            )
            downgrade_posture.add("mechanization_uncertainty")

        if (
            matched_row
            and frame["current_status"]["continuity"] == matched_row["continuity_status"]
            and frame["current_status"]["structural_loss_percent"] == matched_row["structural_loss_percent"]
            and frame["current_status"]["support_tier"] == export_packet["support_tier"]
        ):
            continuity_hits += 1
        else:
            violations.append(
                make_violation(
                    violation_id=f"VV:{kernel_run_id.replace('KR:', '')}:continuity:{index:02d}",
                    violation_class="continuity_smoothing",
                    severity="warning",
                    frame_id=frame_id,
                    source_handle=matched_handle,
                    message="Frame continuity/loss posture drifted from the matched export row.",
                    suggested_posture="downgrade",
                )
            )
            downgrade_posture.add("continuity_drift")

        if (
            frame["frame_type"] == "reasoning_overlay"
            and frame["query_class"] == export_packet["query_class"]
            and frame["claim_class_ceiling"] == export_packet["claim_class_ceiling"]
            and frame["legal_claim"]
            == "Bounded interpretation overlay only. No canon authority. Not structural truth. Read-side recursion experiment."
        ):
            geometry_hits += 1
        else:
            violations.append(
                make_violation(
                    violation_id=f"VV:{kernel_run_id.replace('KR:', '')}:geometry:{index:02d}",
                    violation_class="claim_ceiling_breach",
                    severity="error",
                    frame_id=frame_id,
                    message="Frame-level query/claim/legal posture drifted from the active run contract.",
                    suggested_posture="downgrade",
                )
            )
            downgrade_posture.add("claim_ceiling_breach")

    frame_ids = [frame["frame_id"] for frame in frames]
    total_frames = max(1, len(frames))
    invariant_scores = {
        "identity": clamp_score(identity_hits / total_frames),
        "provenance": clamp_score(provenance_hits / total_frames),
        "explicit_recursion": clamp_score(recursion_hits / total_frames),
        "continuity_loss": clamp_score(continuity_hits / total_frames),
        "geometric_alignment": clamp_score(geometry_hits / total_frames),
    }

    invariant_results = []
    for invariant_name, score in invariant_scores.items():
        item: dict[str, Any] = {
            "invariant_name": invariant_name,
            "status": invariant_status(score),
            "score": score,
        }
        if invariant_name in {"identity", "explicit_recursion", "geometric_alignment"}:
            item["checked_frames"] = frame_ids
        invariant_results.append(item)

    overall_status = "valid" if all(score == 1.0 for score in invariant_scores.values()) and not violations else "downgraded"

    receipt: dict[str, Any] = {
        "validation_receipt_id": f"VR:{kernel_run_id.replace('KR:', '')}",
        "validator_version": "v0.1",
        "validation_scope": "full_kernel_run",
        "checked_artifacts": {
            "kernel_run_id": kernel_run_id,
            "export_packet_id": export_packet["export_packet_id"],
            "prompt_receipt_id": prompt_receipt["prompt_receipt_id"],
            "response_receipt_id": response_receipt["response_receipt_id"],
            "frame_ids": frame_ids,
        },
        "invariant_results": invariant_results,
        "passed_invariants": [name for name, score in invariant_scores.items() if score == 1.0],
        "violations": violations,
        "summary_counts": {
            "frames_checked": len(frames),
            "invariants_checked": len(invariant_scores),
            "violations_total": len(violations),
            "fatal_violations": 0,
            "downgraded_invariants": sum(1 for score in invariant_scores.values() if 0 < score < 1),
        },
        "overall_status": overall_status,
        "validated_at": utc_now(),
    }
    if overall_status != "valid" and downgrade_posture:
        receipt["downgrade_posture"] = sorted(downgrade_posture)
    receipt["validator_notes"] = [
        "v0 validation used exact export-row grounding, fixed-string checks, and first-turn reasoning-frame invariants only.",
    ]

    resolver = SchemaResolver()
    schema_path = SCHEMA_ROOT / "validation_receipt.schema.json"
    validate_instance(receipt, resolver.load_json(schema_path), schema_path, resolver)
    return receipt


def build_run_metrics(validation_receipt: dict[str, Any]) -> dict[str, Any]:
    score_map = {item["invariant_name"]: float(item["score"]) for item in validation_receipt["invariant_results"]}
    identity = score_map["identity"]
    provenance = score_map["provenance"]
    recursion = score_map["explicit_recursion"]
    continuity = score_map["continuity_loss"]
    geometry = score_map["geometric_alignment"]
    return {
        "structural_fidelity_score": clamp_score((identity + geometry) / 2),
        "provenance_trace_completeness": provenance,
        "anomaly_propagation_fidelity": continuity,
        "loss_gradient_honesty": continuity,
        "continuity_badge_accuracy": continuity,
        "claim_ceiling_adherence": geometry,
        "recursion_explicitness_score": recursion,
        "stack_purity_score": clamp_score((identity + provenance) / 2),
        "identity_trace_completeness": identity,
        "overall_status": validation_receipt["overall_status"],
    }


def build_run_object(
    *,
    kernel_run_id: str,
    export_packet: dict[str, Any],
    prompt_receipt: dict[str, Any],
    response_receipt: dict[str, Any],
    frames: list[dict[str, Any]],
    model_name: str,
) -> dict[str, Any]:
    validation_receipt = build_validation_receipt(
        kernel_run_id=kernel_run_id,
        export_packet=export_packet,
        prompt_receipt=prompt_receipt,
        response_receipt=response_receipt,
        frames=frames,
    )
    model_info: dict[str, Any] = {
        "provider": "ollama",
        "model_name": model_name,
    }

    payload = {
        "kernel_run_id": kernel_run_id,
        "kernel_contract_version": export_packet["kernel_contract_version"],
        "reasoning_schema_version": "v0.1",
        "export_schema_version": "v0.1",
        "validation_schema_version": "v0.1",
        "model_info": model_info,
        "export_packet_id": export_packet["export_packet_id"],
        "prompt_receipt_id": prompt_receipt["prompt_receipt_id"],
        "response_receipt_id": response_receipt["response_receipt_id"],
        "declared_lens": export_packet["declared_lens"],
        "query_class": export_packet["query_class"],
        "claim_class_ceiling": export_packet["claim_class_ceiling"],
        "legal_posture": "Read-side Language Kernel run only. No canon authority. Not structural truth. Not primary retention substance.",
        "operator_mode": "explicit_only",
        "recursion_depth": 1,
        "language_frames": frames,
        "run_metrics": build_run_metrics(validation_receipt),
        "validation_receipt": validation_receipt,
        "run_notes": [
            "Run assembled only from a clean parsed response whose language_frames array already satisfied the reasoning-frame contract.",
        ],
        "timestamps": {
            "invoked_at": prompt_receipt["invoked_at"],
            "validated_at": validation_receipt["validated_at"],
        },
    }

    resolver = SchemaResolver()
    schema_path = SCHEMA_ROOT / "language_kernel_run.schema.json"
    validate_instance(payload, resolver.load_json(schema_path), schema_path, resolver)
    return payload


def determine_regime(run_object: dict[str, Any]) -> str:
    status = run_object["run_metrics"]["overall_status"]
    if status == "valid":
        return "stable"
    if status == "downgraded":
        return "perturbation"
    return "failure"


def strip_ansi(text: str) -> str:
    return re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", text).replace("\r", "").strip()


def parse_installed_models(list_output: str) -> set[str]:
    installed: set[str] = set()
    for line in list_output.splitlines()[1:]:
        parts = line.split()
        if parts:
            installed.add(parts[0])
    return installed


def ensure_local_model_available(ollama_model: str) -> tuple[bool, str]:
    completed = subprocess.run(
        ["ollama", "list"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if completed.returncode != 0:
        return False, completed.stderr.strip() or "ollama list failed"
    installed = parse_installed_models(completed.stdout)
    if ollama_model not in installed:
        return False, f"{ollama_model} is not present in local ollama list"
    return True, ""


def invoke_ollama(prompt_text: str, ollama_model: str, timeout_seconds: int) -> tuple[int, str, str]:
    completed = subprocess.run(
        ["ollama", "run", ollama_model, "--nowordwrap", "--hidethinking", "--format", "json"],
        input=prompt_text,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
        timeout=timeout_seconds,
    )
    return completed.returncode, completed.stdout, completed.stderr


def invoke_once(
    *,
    export_packet_file: Path,
    prompt_template_file: Path,
    model_name: str,
    ollama_model: str,
    output_root: Path,
    output_prefix: str | None,
    operation_mode: str,
    timeout_seconds: int,
    benchmark_family: str,
) -> tuple[int, dict[str, Any]]:
    resolver = SchemaResolver()
    export_packet = validate_export_packet(export_packet_file, resolver)
    prompt_text = build_prompt(prompt_template_file, export_packet)
    id_base = output_prefix or build_id_base(export_packet, model_name)
    paths = artifact_paths(output_root, id_base)
    kernel_run_id = f"KR:{id_base.replace('.', ':')}"
    prompt_receipt_id = f"PR:{id_base.replace('.', ':')}"
    response_receipt_id = f"RR:{id_base.replace('.', ':')}"

    write_text(paths["prompt_text"], prompt_text)

    prompt_receipt = build_prompt_receipt(
        prompt_receipt_id=prompt_receipt_id,
        kernel_run_id=kernel_run_id,
        export_packet=export_packet,
        prompt_text=prompt_text,
        model_name=model_name,
        prompt_status="assembled",
        invoked_at=utc_now(),
        prompt_notes=[
            f"operation_mode={operation_mode}",
            f"ollama_model={ollama_model}",
        ],
    )

    model_available, availability_note = ensure_local_model_available(ollama_model)
    summary: dict[str, Any] = {
        "kernel_run_id": kernel_run_id,
        "model_name": model_name,
        "ollama_model": ollama_model,
        "operation_mode": operation_mode,
        "export_packet_path": str(export_packet_file.resolve()),
        "prompt_template_path": str(prompt_template_file.resolve()),
        "artifact_paths": {key: str(path.resolve()) for key, path in paths.items()},
        "run_assembled": False,
        "benchmark_emitted": False,
        "status": "blocked",
        "notes": [],
    }

    if not model_available:
        prompt_receipt = build_prompt_receipt(
            prompt_receipt_id=prompt_receipt_id,
            kernel_run_id=kernel_run_id,
            export_packet=export_packet,
            prompt_text=prompt_text,
            model_name=model_name,
            prompt_status="blocked",
            invoked_at=utc_now(),
            prompt_notes=[
                f"operation_mode={operation_mode}",
                f"ollama_model={ollama_model}",
            ],
            block_reasons=["provider_unavailable"],
        )
        write_json(paths["prompt_receipt"], prompt_receipt)
        response_receipt = build_blocked_response_receipt(
            response_receipt_id=response_receipt_id,
            prompt_receipt_id=prompt_receipt_id,
            kernel_run_id=kernel_run_id,
            export_packet=export_packet,
            model_name=model_name,
            refusal_reason=availability_note,
            receiver_notes=[
                f"operation_mode={operation_mode}",
                "ollama model was not locally available, so no response body was captured.",
            ],
        )
        write_json(paths["response_receipt"], response_receipt)
        summary["notes"].append(availability_note)
        write_json(paths["summary"], summary)
        return 1, summary

    write_json(paths["prompt_receipt"], prompt_receipt)
    returncode, stdout_text, stderr_text = invoke_ollama(prompt_text, ollama_model, timeout_seconds)
    write_text(paths["raw_response"], stdout_text)

    if returncode != 0:
        cleaned_stderr = strip_ansi(stderr_text)
        response_receipt = build_blocked_response_receipt(
            response_receipt_id=response_receipt_id,
            prompt_receipt_id=prompt_receipt_id,
            kernel_run_id=kernel_run_id,
            export_packet=export_packet,
            model_name=model_name,
            refusal_reason=(cleaned_stderr or f"ollama run exited with code {returncode}"),
            receiver_notes=[
                f"operation_mode={operation_mode}",
                "ollama returned a non-zero exit code before a lawful response body was captured.",
            ],
        )
        write_json(paths["response_receipt"], response_receipt)
        summary["notes"].append(response_receipt["refusal_reason"])
        write_json(paths["summary"], summary)
        return 1, summary

    response_receipt = build_received_response_receipt(
        response_file=paths["raw_response"],
        prompt_file=paths["prompt_text"],
        export_packet_file=export_packet_file,
        model_name=model_name,
        provider="ollama",
        operation_mode=operation_mode,
        prompt_receipt_id=prompt_receipt_id,
        kernel_run_id=kernel_run_id,
        response_receipt_id=response_receipt_id,
    )
    write_json(paths["response_receipt"], response_receipt)
    summary["response_conformance_outcome"] = response_receipt.get("conformance_outcome")
    cleaned_stderr = strip_ansi(stderr_text)
    if cleaned_stderr:
        summary["notes"].append(f"ollama stderr: {cleaned_stderr}")

    if response_receipt["conformance_outcome"] != "contract_conformant":
        summary["status"] = "partial"
        summary["notes"].append("Run assembly was skipped because the raw response did not satisfy the reasoning-frame contract.")
        write_json(paths["summary"], summary)
        return 1, summary

    frames = extract_conformant_frames(stdout_text, resolver)
    run_object = build_run_object(
        kernel_run_id=kernel_run_id,
        export_packet=export_packet,
        prompt_receipt=prompt_receipt,
        response_receipt=response_receipt,
        frames=frames,
        model_name=model_name,
    )
    write_json(paths["run"], run_object)
    regime = determine_regime(run_object)
    benchmark_payload = run_benchmark_file(paths["run"], benchmark_family, regime, paths["benchmark"])

    summary["run_assembled"] = True
    summary["benchmark_emitted"] = True
    summary["run_status"] = run_object["run_metrics"]["overall_status"]
    summary["benchmark_regime"] = regime
    summary["benchmark_final_status"] = benchmark_payload["final_status"]
    summary["status"] = "complete"
    write_json(paths["summary"], summary)
    return 0, summary


def run_smoke_test(
    *,
    model_name: str,
    ollama_model: str,
    output_root: Path,
    output_prefix: str,
    timeout_seconds: int,
    benchmark_family: str,
) -> int:
    exit_code, summary = invoke_once(
        export_packet_file=DEFAULT_EXPORT_PACKET,
        prompt_template_file=DEFAULT_PROMPT_TEMPLATE,
        model_name=model_name,
        ollama_model=ollama_model,
        output_root=output_root,
        output_prefix=output_prefix,
        operation_mode="contract_conformance_mode",
        timeout_seconds=timeout_seconds,
        benchmark_family=benchmark_family,
    )
    if exit_code == 0:
        print(f"[PASS] invocation-smoke-test: assembled run and benchmark for {model_name}")
    else:
        print(f"[FAIL] invocation-smoke-test: {model_name} -> {summary['status']}")
    print(json.dumps(summary, indent=2))
    return exit_code


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a bounded seam-local Ollama Language Kernel first-turn invocation.")
    subparsers = parser.add_subparsers(dest="command")

    invoke_parser = subparsers.add_parser("invoke", help="Build prompt, invoke ollama, emit receipts, and assemble a run when lawful.")
    invoke_parser.add_argument("--export-packet-file", default=str(DEFAULT_EXPORT_PACKET))
    invoke_parser.add_argument("--prompt-template-file", default=str(DEFAULT_PROMPT_TEMPLATE))
    invoke_parser.add_argument("--model-name", required=True, choices=ALLOWED_PANEL_MODELS)
    invoke_parser.add_argument("--ollama-model", default=None)
    invoke_parser.add_argument("--output-root", default=str(OUTPUT_ROOT))
    invoke_parser.add_argument("--output-prefix", default=None)
    invoke_parser.add_argument("--operation-mode", default="contract_conformance_mode", choices=OPERATION_MODES)
    invoke_parser.add_argument("--timeout-seconds", type=int, default=180)
    invoke_parser.add_argument("--benchmark-family", default=DEFAULT_FAMILY)

    smoke_parser = subparsers.add_parser("smoke-test", help="Run one bounded real first-turn invocation over the default export packet.")
    smoke_parser.add_argument("--model-name", default="Hermes 3 Llama 3.2 3B", choices=ALLOWED_PANEL_MODELS)
    smoke_parser.add_argument("--ollama-model", default=None)
    smoke_parser.add_argument("--output-root", default=str(OUTPUT_ROOT))
    smoke_parser.add_argument("--output-prefix", default="ollama_real_first_run")
    smoke_parser.add_argument("--timeout-seconds", type=int, default=180)
    smoke_parser.add_argument("--benchmark-family", default=DEFAULT_FAMILY)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "invoke":
        exit_code, summary = invoke_once(
            export_packet_file=Path(args.export_packet_file).resolve(),
            prompt_template_file=Path(args.prompt_template_file).resolve(),
            model_name=args.model_name,
            ollama_model=args.ollama_model or MODEL_ALIAS_MAP[args.model_name],
            output_root=Path(args.output_root).resolve(),
            output_prefix=args.output_prefix,
            operation_mode=args.operation_mode,
            timeout_seconds=args.timeout_seconds,
            benchmark_family=args.benchmark_family,
        )
        print(json.dumps(summary, indent=2))
        return exit_code

    if args.command == "smoke-test":
        return run_smoke_test(
            model_name=args.model_name,
            ollama_model=args.ollama_model or MODEL_ALIAS_MAP[args.model_name],
            output_root=Path(args.output_root).resolve(),
            output_prefix=args.output_prefix,
            timeout_seconds=args.timeout_seconds,
            benchmark_family=args.benchmark_family,
        )

    parser.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
