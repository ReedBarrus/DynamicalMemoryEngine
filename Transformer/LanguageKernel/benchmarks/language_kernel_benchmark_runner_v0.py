from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from Transformer.LanguageKernel.validator.language_kernel_validator_v0 import (  # noqa: E402
    ROOT as SCHEMA_ROOT,
    SchemaResolver,
    ValidationError,
    validate_instance,
)


FIXTURE_ROOT = Path(__file__).resolve().parent / "fixtures"
OUTPUT_ROOT = REPO_ROOT / "Transformer" / "LanguageKernel" / "outputs"

SUPPORTED_FAMILIES = (
    "invariant_preservation",
    "frame_contract_conformance",
    "thread_continuity",
    "query_preservation",
    "claim_discipline",
)
SUPPORTED_REGIMES = ("stable", "perturbation", "failure")
FAMILY_TO_TIER = {
    "invariant_preservation": "tier_1_loop_lawfulness",
    "frame_contract_conformance": "tier_1_loop_lawfulness",
    "thread_continuity": "tier_2_conversation_behavior",
    "query_preservation": "tier_2_conversation_behavior",
    "claim_discipline": "tier_2_conversation_behavior",
}
DEFAULT_DOWNGRADE_POSTURE = {
    "invariant_preservation": "continuity_drift",
    "frame_contract_conformance": "frame_rejection",
    "thread_continuity": "continuity_drift",
    "query_preservation": "support_only",
    "claim_discipline": "claim_ceiling_breach",
}
EXPECTED_STATUS_BY_REGIME = {
    "stable": "valid",
    "perturbation": "downgraded",
    "failure": "aborted",
}
SMOKE_CASES = (
    (
        FIXTURE_ROOT / "valid" / "language_kernel_run.stable.json",
        "invariant_preservation",
        "stable",
        OUTPUT_ROOT / "benchmark_invariant_preservation.stable.json",
    ),
    (
        FIXTURE_ROOT / "valid" / "language_kernel_run.stable.json",
        "thread_continuity",
        "stable",
        OUTPUT_ROOT / "benchmark_thread_continuity.stable.json",
    ),
    (
        FIXTURE_ROOT / "valid" / "language_kernel_run.stable.json",
        "query_preservation",
        "stable",
        OUTPUT_ROOT / "benchmark_query_preservation.stable.json",
    ),
    (
        FIXTURE_ROOT / "perturbation" / "language_kernel_run.perturbation.json",
        "frame_contract_conformance",
        "perturbation",
        OUTPUT_ROOT / "benchmark_frame_contract_conformance.perturbation.json",
    ),
    (
        FIXTURE_ROOT / "valid" / "language_kernel_run.failure.json",
        "claim_discipline",
        "failure",
        OUTPUT_ROOT / "benchmark_claim_discipline.failure.json",
    ),
)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def mean_score(*values: float) -> float:
    filtered = [value for value in values if value is not None]
    if not filtered:
        return 1.0
    return round(sum(filtered) / len(filtered), 4)


def clamp_score(value: float) -> float:
    return max(0.0, min(1.0, round(value, 4)))


def exact_string_adherence(run_object: dict[str, Any]) -> float:
    frames = run_object.get("language_frames", [])
    if not frames:
        return 0.0
    exact = 0
    for frame in frames:
        if (
            frame.get("legal_claim")
            == "Bounded interpretation overlay only. No canon authority. Not structural truth. Read-side recursion experiment."
            and frame.get("what_next")
            == "Await explicit operator request for next recursion turn or new retained signature reference."
        ):
            exact += 1
    return clamp_score(exact / len(frames))


def query_preservation_score(run_object: dict[str, Any]) -> float:
    frames = run_object.get("language_frames", [])
    if not frames:
        return 0.0
    preserved = sum(1 for frame in frames if frame.get("query_class") == run_object.get("query_class"))
    return clamp_score(preserved / len(frames))


def claim_discipline_score(run_object: dict[str, Any]) -> float:
    run_metrics = run_object.get("run_metrics", {})
    if "claim_ceiling_adherence" in run_metrics:
        return clamp_score(float(run_metrics["claim_ceiling_adherence"]))
    frames = run_object.get("language_frames", [])
    if not frames:
        return 0.0
    preserved = sum(1 for frame in frames if frame.get("claim_class_ceiling") == run_object.get("claim_class_ceiling"))
    return clamp_score(preserved / len(frames))


def reference_integrity_score(run_object: dict[str, Any]) -> float:
    run_metrics = run_object.get("run_metrics", {})
    if "structural_fidelity_score" in run_metrics:
        return clamp_score(float(run_metrics["structural_fidelity_score"]))
    frames = run_object.get("language_frames", [])
    if not frames:
        return 0.0
    intact = sum(1 for frame in frames if frame.get("depends_on"))
    return clamp_score(intact / len(frames))


def receipt_chain_completeness_score(run_object: dict[str, Any]) -> float:
    present = 0
    total = 4
    if run_object.get("export_packet_id"):
        present += 1
    if run_object.get("prompt_receipt_id"):
        present += 1
    if run_object.get("response_receipt_id"):
        present += 1
    if run_object.get("validation_receipt", {}).get("validation_receipt_id"):
        present += 1
    return clamp_score(present / total)


def status_honesty_score(run_object: dict[str, Any]) -> float:
    run_status = run_object.get("run_metrics", {}).get("overall_status")
    validation_status = run_object.get("validation_receipt", {}).get("overall_status")
    if not run_status or not validation_status:
        return 0.5
    return 1.0 if run_status == validation_status else 0.5


def invariant_scores(run_object: dict[str, Any]) -> dict[str, float]:
    results = {}
    for item in run_object.get("validation_receipt", {}).get("invariant_results", []):
        results[item["invariant_name"]] = clamp_score(float(item["score"]))
    return results


def downgrade_honesty_score(run_object: dict[str, Any]) -> float:
    validation_status = run_object.get("validation_receipt", {}).get("overall_status")
    downgrade_posture = run_object.get("validation_receipt", {}).get("downgrade_posture", [])
    if validation_status == "valid":
        return 1.0 if not downgrade_posture else 0.5
    if validation_status == "aborted":
        return 1.0 if "run_abort" in downgrade_posture else 0.5
    return 1.0 if downgrade_posture else 0.5


def support_anchor_stability_score(run_object: dict[str, Any]) -> float:
    frames = run_object.get("language_frames", [])
    if not frames:
        return 0.0
    stable = 0
    for frame in frames:
        anchors = [item for item in frame.get("depends_on", []) if not item.startswith("LF:")]
        if anchors:
            stable += 1
    return clamp_score(stable / len(frames))


def mechanization_honesty_score(run_object: dict[str, Any]) -> float:
    violations = run_object.get("validation_receipt", {}).get("violations", [])
    problematic = {
        "authority_bleed",
        "claim_ceiling_breach",
        "mechanization_gap",
        "missing_legal_claim",
    }
    if not violations:
        return 1.0
    issues = sum(1 for violation in violations if violation.get("violation_class") in problematic)
    return clamp_score(1 - (issues / max(1, len(violations))))


def build_raw_metrics(run_object: dict[str, Any], family: str) -> dict[str, float]:
    invariants = invariant_scores(run_object)
    common = {
        "reference_integrity": reference_integrity_score(run_object),
        "status_honesty": status_honesty_score(run_object),
        "receipt_chain_completeness": receipt_chain_completeness_score(run_object),
        "exact_string_adherence": exact_string_adherence(run_object),
        "query_preservation": query_preservation_score(run_object),
        "claim_discipline": claim_discipline_score(run_object),
        "downgrade_honesty": downgrade_honesty_score(run_object),
        "mechanization_honesty": mechanization_honesty_score(run_object),
        "support_anchor_stability": support_anchor_stability_score(run_object),
        "drift_coherence": invariants.get("continuity_loss", 1.0),
        "schema_conformance_rate": 1.0,
    }
    if family == "invariant_preservation":
        return {
            "reference_integrity": common["reference_integrity"],
            "status_honesty": common["status_honesty"],
            "receipt_chain_completeness": common["receipt_chain_completeness"],
            "downgrade_honesty": common["downgrade_honesty"],
        }
    if family == "frame_contract_conformance":
        return {
            "schema_conformance_rate": common["schema_conformance_rate"],
            "exact_string_adherence": common["exact_string_adherence"],
            "reference_integrity": common["reference_integrity"],
            "status_honesty": common["status_honesty"],
        }
    if family == "thread_continuity":
        return {
            "drift_coherence": common["drift_coherence"],
            "status_honesty": common["status_honesty"],
            "support_anchor_stability": common["support_anchor_stability"],
            "query_preservation": common["query_preservation"],
        }
    if family == "query_preservation":
        return {
            "query_preservation": common["query_preservation"],
            "claim_discipline": common["claim_discipline"],
            "status_honesty": common["status_honesty"],
            "receipt_chain_completeness": common["receipt_chain_completeness"],
        }
    if family == "claim_discipline":
        return {
            "claim_discipline": common["claim_discipline"],
            "exact_string_adherence": common["exact_string_adherence"],
            "status_honesty": common["status_honesty"],
            "mechanization_honesty": common["mechanization_honesty"],
        }
    raise ValidationError(f"Unsupported benchmark family {family!r}")


def build_derived_scores(raw_metrics: dict[str, float]) -> dict[str, float]:
    values = list(raw_metrics.values())
    loop_lawfulness = mean_score(*values)
    reference_grounding = mean_score(
        raw_metrics.get("reference_integrity", 1.0),
        raw_metrics.get("receipt_chain_completeness", 1.0),
        raw_metrics.get("support_anchor_stability", 1.0),
    )
    recursion_discipline = mean_score(
        raw_metrics.get("query_preservation", 1.0),
        raw_metrics.get("exact_string_adherence", 1.0),
        raw_metrics.get("status_honesty", 1.0),
    )
    loss_honesty = mean_score(
        raw_metrics.get("drift_coherence", 1.0),
        raw_metrics.get("status_honesty", 1.0),
        raw_metrics.get("downgrade_honesty", 1.0),
    )
    non_authority = mean_score(
        raw_metrics.get("claim_discipline", 1.0),
        raw_metrics.get("exact_string_adherence", 1.0),
        raw_metrics.get("mechanization_honesty", 1.0),
    )
    return {
        "loop_lawfulness_score": clamp_score(loop_lawfulness),
        "reference_grounding_score": clamp_score(reference_grounding),
        "recursion_discipline_score": clamp_score(recursion_discipline),
        "loss_honesty_score": clamp_score(loss_honesty),
        "non_authority_discipline_score": clamp_score(non_authority),
    }


def build_source_artifacts(run_object: dict[str, Any]) -> dict[str, Any]:
    payload = {
        "kernel_run_id": run_object["kernel_run_id"],
        "export_packet_id": run_object["export_packet_id"],
        "validation_receipt_id": run_object["validation_receipt"]["validation_receipt_id"],
        "frame_ids": [frame["frame_id"] for frame in run_object.get("language_frames", [])],
    }
    if run_object.get("prompt_receipt_id"):
        payload["prompt_receipt_id"] = run_object["prompt_receipt_id"]
    if run_object.get("response_receipt_id"):
        payload["response_receipt_id"] = run_object["response_receipt_id"]
    return payload


def build_benchmark_receipt_refs(run_object: dict[str, Any]) -> dict[str, str]:
    payload: dict[str, str] = {
        "validation_receipt_id": run_object["validation_receipt"]["validation_receipt_id"],
    }
    if run_object.get("prompt_receipt_id"):
        payload["prompt_receipt_id"] = run_object["prompt_receipt_id"]
    if run_object.get("response_receipt_id"):
        payload["response_receipt_id"] = run_object["response_receipt_id"]
    return payload


def build_benchmark_run_id(run_object: dict[str, Any], family: str, regime: str) -> str:
    kernel_suffix = run_object["kernel_run_id"]
    if kernel_suffix.startswith("KR:"):
        kernel_suffix = kernel_suffix[3:]
    return f"BK:{kernel_suffix}:{family}:{regime}"


def determine_final_status(run_object: dict[str, Any], regime: str) -> str:
    validation_status = run_object["validation_receipt"]["overall_status"]
    if regime == "failure" or validation_status == "aborted":
        return "aborted"
    if regime == "perturbation" or validation_status == "downgraded":
        return "downgraded"
    return "valid"


def build_observed_notes(run_object: dict[str, Any], family: str, regime: str, final_status: str) -> list[str]:
    notes: list[str] = []
    if regime == "perturbation":
        notes.append(f"{family} remained bounded under perturbation but required downgrade review")
    if regime == "failure":
        notes.append(f"{family} hit a bounded failure-path posture and stayed non-authoritative")
    for violation in run_object["validation_receipt"].get("violations", []):
        message = violation.get("message")
        if message:
            notes.append(message)
    if final_status == "valid" and not notes:
        notes.append(f"{family} remained inside the declared v0 benchmark posture")
    return notes[:4]


def build_failure_notes(run_object: dict[str, Any], family: str, regime: str, final_status: str) -> list[str] | None:
    notes = build_observed_notes(run_object, family, regime, final_status)
    if final_status == "valid":
        return None
    return notes


def build_downgrade_posture(run_object: dict[str, Any], family: str, final_status: str) -> list[str] | None:
    mapped = []
    for posture in run_object["validation_receipt"].get("downgrade_posture", []):
        mapped.append("benchmark_abort" if posture == "run_abort" else posture)
    if final_status == "aborted":
        if "benchmark_abort" not in mapped:
            mapped.append("benchmark_abort")
    elif final_status == "downgraded" and not mapped:
        mapped.append(DEFAULT_DOWNGRADE_POSTURE[family])
    return mapped or None


def build_benchmark_run(
    run_object: dict[str, Any],
    family: str,
    regime: str,
    benchmark_contract_version: str | None = None,
) -> dict[str, Any]:
    if family not in FAMILY_TO_TIER:
        raise ValidationError(f"Unsupported benchmark family {family!r}")
    if regime not in SUPPORTED_REGIMES:
        raise ValidationError(f"Unsupported regime {regime!r}")

    raw_metrics = build_raw_metrics(run_object, family)
    derived_scores = build_derived_scores(raw_metrics)
    final_status = determine_final_status(run_object, regime)
    observed_notes = build_observed_notes(run_object, family, regime, final_status)
    benchmark_contract_version = benchmark_contract_version or run_object["kernel_contract_version"]

    payload: dict[str, Any] = {
        "benchmark_run_id": build_benchmark_run_id(run_object, family, regime),
        "benchmark_contract_version": benchmark_contract_version,
        "kernel_contract_version": run_object["kernel_contract_version"],
        "benchmark_family": family,
        "benchmark_tier": FAMILY_TO_TIER[family],
        "regime": regime,
        "source_artifacts": build_source_artifacts(run_object),
        "expected_posture": {
            "query_class": run_object["query_class"],
            "claim_class_ceiling": run_object["claim_class_ceiling"],
            "operator_mode": run_object.get("operator_mode", "explicit_only"),
            "overall_status": EXPECTED_STATUS_BY_REGIME[regime],
        },
        "observed_posture": {
            "query_class": run_object["query_class"],
            "claim_class_ceiling": run_object["claim_class_ceiling"],
            "operator_mode": run_object.get("operator_mode", "explicit_only"),
            "overall_status": final_status,
            "notes": observed_notes,
        },
        "raw_metrics": raw_metrics,
        "derived_scores": derived_scores,
        "benchmark_receipt_refs": build_benchmark_receipt_refs(run_object),
        "final_status": final_status,
        "benchmarked_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    }

    failure_notes = build_failure_notes(run_object, family, regime, final_status)
    if failure_notes:
        payload["failure_notes"] = failure_notes

    downgrade_posture = build_downgrade_posture(run_object, family, final_status)
    if downgrade_posture:
        payload["downgrade_posture_required"] = downgrade_posture

    return payload


def validate_run_file(run_path: Path, resolver: SchemaResolver) -> dict[str, Any]:
    run_object = load_json(run_path)
    run_schema = resolver.load_json(SCHEMA_ROOT / "language_kernel_run.schema.json")
    validate_instance(run_object, run_schema, SCHEMA_ROOT / "language_kernel_run.schema.json", resolver)
    return run_object


def validate_benchmark_object(payload: dict[str, Any], resolver: SchemaResolver) -> None:
    schema_path = SCHEMA_ROOT / "language_kernel_benchmark_run.schema.json"
    benchmark_schema = resolver.load_json(schema_path)
    validate_instance(payload, benchmark_schema, schema_path, resolver)


def run_benchmark_file(
    input_path: Path,
    family: str,
    regime: str,
    output_path: Path | None,
    benchmark_contract_version: str | None = None,
) -> dict[str, Any]:
    resolver = SchemaResolver()
    run_object = validate_run_file(input_path, resolver)
    payload = build_benchmark_run(run_object, family, regime, benchmark_contract_version)
    validate_benchmark_object(payload, resolver)
    if output_path is not None:
        write_json(output_path, payload)
    return payload


def run_smoke_tests(output_root: Path = OUTPUT_ROOT) -> int:
    failures = 0
    for input_path, family, regime, output_path in SMOKE_CASES:
        try:
            run_benchmark_file(input_path, family, regime, output_root / output_path.name)
        except Exception as exc:
            failures += 1
            print(f"[FAIL] smoke-test: {family}/{regime} -> {exc}")
        else:
            print(f"[PASS] smoke-test: {family}/{regime} -> {(output_root / output_path.name).resolve()}")

    invalid_fixture = FIXTURE_ROOT / "invalid" / "language_kernel_run.invalid.json"
    try:
        run_benchmark_file(
            invalid_fixture,
            "invariant_preservation",
            "failure",
            output_root / "invalid_should_not_emit.json",
        )
    except Exception:
        print("[PASS] smoke-test: invalid input fixture rejected as expected")
    else:
        failures += 1
        print("[FAIL] smoke-test: invalid input fixture was accepted")

    return 1 if failures else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run bounded Language Kernel benchmark families over run envelopes.")
    subparsers = parser.add_subparsers(dest="command")

    run_parser = subparsers.add_parser("run", help="Emit one benchmark object from one Language Kernel run JSON.")
    run_parser.add_argument("--input", required=True, help="Path to a language_kernel_run JSON file.")
    run_parser.add_argument("--family", required=True, choices=SUPPORTED_FAMILIES)
    run_parser.add_argument("--regime", required=True, choices=SUPPORTED_REGIMES)
    run_parser.add_argument("--output", required=True, help="Path to the emitted benchmark JSON file.")
    run_parser.add_argument("--benchmark-contract-version", default=None)

    smoke_parser = subparsers.add_parser("smoke-test", help="Run the initial fixture-driven benchmark smoke tests.")
    smoke_parser.add_argument("--output-root", default=str(OUTPUT_ROOT))
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "run":
        payload = run_benchmark_file(
            Path(args.input).resolve(),
            args.family,
            args.regime,
            Path(args.output).resolve(),
            args.benchmark_contract_version,
        )
        print(json.dumps(payload, indent=2))
        return 0

    if args.command == "smoke-test":
        return run_smoke_tests(Path(args.output_root).resolve())

    parser.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
