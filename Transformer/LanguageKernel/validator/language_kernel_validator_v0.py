from __future__ import annotations

import argparse
import copy
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[3]
ROOT = REPO_ROOT / "README" / "Transformer" / "LanguageKernel"
SCHEMA_FILES = (
    "reasoning_frame.schema.json",
    "language_overlay_export.schema.json",
    "language_kernel_run.schema.json",
    "validation_receipt.schema.json",
    "export_receipt.schema.json",
    "prompt_receipt.schema.json",
    "response_receipt.schema.json",
    "language_kernel_benchmark_run.schema.json",
)
CONTRACT_FILES = (
    "README.LanguageKernelContract.v0.md",
    "README.LanguageKernelBenchmarkContract.v0.md",
)
OLD_CONTRACT_NAMES = (
    "README.LanguageKernelContract.md",
    "README.LanguageKernelBenchmarkContract.md",
)


class ValidationError(Exception):
    pass


@dataclass
class Finding:
    status: str
    check: str
    detail: str


@dataclass
class AuditReport:
    findings: list[Finding] = field(default_factory=list)

    def add(self, status: str, check: str, detail: str) -> None:
        self.findings.append(Finding(status=status, check=check, detail=detail))

    @property
    def failed(self) -> bool:
        return any(finding.status == "FAIL" for finding in self.findings)

    def summary(self) -> tuple[int, int, int]:
        passed = sum(1 for finding in self.findings if finding.status == "PASS")
        downgraded = sum(1 for finding in self.findings if finding.status == "DOWNGRADED")
        failed = sum(1 for finding in self.findings if finding.status == "FAIL")
        return passed, downgraded, failed

    def emit(self) -> None:
        for finding in self.findings:
            print(f"[{finding.status}] {finding.check}: {finding.detail}")
        passed, downgraded, failed = self.summary()
        print(f"\nSummary: {passed} pass, {downgraded} downgraded, {failed} fail")


class SchemaResolver:
    def __init__(self) -> None:
        self._cache: dict[Path, Any] = {}

    def load_json(self, path: Path) -> Any:
        resolved = path.resolve()
        if resolved not in self._cache:
            self._cache[resolved] = json.loads(resolved.read_text(encoding="utf-8"))
        return self._cache[resolved]

    def resolve_pointer(self, document: Any, pointer: str) -> Any:
        if pointer in ("", "#"):
            return document
        if not pointer.startswith("#/"):
            raise ValidationError(f"Unsupported pointer {pointer!r}")
        current = document
        for part in pointer[2:].split("/"):
            key = part.replace("~1", "/").replace("~0", "~")
            current = current[key]
        return current

    def resolve_ref(self, base_path: Path, ref: str) -> tuple[Any, Path]:
        base = base_path.resolve()
        if ref.startswith("#"):
            document = self.load_json(base)
            return self.resolve_pointer(document, ref), base
        if "#" in ref:
            rel_path, fragment = ref.split("#", 1)
            target = (base.parent / rel_path).resolve()
            document = self.load_json(target)
            return self.resolve_pointer(document, f"#{fragment}"), target
        target = (base.parent / ref).resolve()
        return self.load_json(target), target


def type_matches(value: Any, schema_type: str) -> bool:
    if schema_type == "object":
        return isinstance(value, dict)
    if schema_type == "array":
        return isinstance(value, list)
    if schema_type == "string":
        return isinstance(value, str)
    if schema_type == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if schema_type == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if schema_type == "boolean":
        return isinstance(value, bool)
    return True


def validate_instance(
    value: Any,
    schema: Any,
    base_path: Path,
    resolver: SchemaResolver,
    path: str = "$",
) -> None:
    if schema is False:
        raise ValidationError(f"{path}: property is forbidden")

    if isinstance(schema, dict) and "$ref" in schema:
        target_schema, target_path = resolver.resolve_ref(base_path, schema["$ref"])
        validate_instance(value, target_schema, target_path, resolver, path)
        return

    if isinstance(schema, dict) and "allOf" in schema:
        for subschema in schema["allOf"]:
            if isinstance(subschema, dict) and "if" in subschema and "then" in subschema:
                try:
                    validate_instance(value, subschema["if"], base_path, resolver, path)
                except ValidationError:
                    continue
                validate_instance(value, subschema["then"], base_path, resolver, path)
            else:
                validate_instance(value, subschema, base_path, resolver, path)

    if isinstance(schema, dict) and "const" in schema and value != schema["const"]:
        raise ValidationError(f"{path}: expected const {schema['const']!r}, got {value!r}")

    if isinstance(schema, dict) and "enum" in schema and value not in schema["enum"]:
        raise ValidationError(f"{path}: expected one of {schema['enum']!r}, got {value!r}")

    if isinstance(schema, dict) and "not" in schema:
        try:
            validate_instance(value, schema["not"], base_path, resolver, path)
        except ValidationError:
            pass
        else:
            raise ValidationError(f"{path}: matched forbidden subschema")

    if isinstance(schema, dict) and "type" in schema:
        expected_types = schema["type"] if isinstance(schema["type"], list) else [schema["type"]]
        if not any(type_matches(value, item_type) for item_type in expected_types):
            raise ValidationError(f"{path}: expected type {expected_types!r}, got {type(value).__name__}")

    if isinstance(value, str) and isinstance(schema, dict):
        if "minLength" in schema and len(value) < schema["minLength"]:
            raise ValidationError(f"{path}: string shorter than minLength")
        if "maxLength" in schema and len(value) > schema["maxLength"]:
            raise ValidationError(f"{path}: string longer than maxLength")
        if "pattern" in schema and re.search(schema["pattern"], value) is None:
            raise ValidationError(f"{path}: string does not match pattern {schema['pattern']!r}")
        if schema.get("format") == "date-time":
            try:
                datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError as exc:
                raise ValidationError(f"{path}: invalid date-time {value!r}") from exc

    if isinstance(value, (int, float)) and not isinstance(value, bool) and isinstance(schema, dict):
        if "minimum" in schema and value < schema["minimum"]:
            raise ValidationError(f"{path}: below minimum")
        if "maximum" in schema and value > schema["maximum"]:
            raise ValidationError(f"{path}: above maximum")
        if "multipleOf" in schema:
            quotient = value / schema["multipleOf"]
            if abs(quotient - round(quotient)) > 1e-9:
                raise ValidationError(f"{path}: not a multipleOf {schema['multipleOf']}")

    if isinstance(value, list) and isinstance(schema, dict):
        if "minItems" in schema and len(value) < schema["minItems"]:
            raise ValidationError(f"{path}: fewer than minItems")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            raise ValidationError(f"{path}: more than maxItems")
        if schema.get("uniqueItems"):
            seen: list[Any] = []
            for item in value:
                if item in seen:
                    raise ValidationError(f"{path}: duplicate item {item!r}")
                seen.append(item)
        if "items" in schema:
            for index, item in enumerate(value):
                validate_instance(item, schema["items"], base_path, resolver, f"{path}[{index}]")
        if "contains" in schema:
            matched = False
            for index, item in enumerate(value):
                try:
                    validate_instance(item, schema["contains"], base_path, resolver, f"{path}[{index}]")
                except ValidationError:
                    continue
                matched = True
                break
            if not matched:
                raise ValidationError(f"{path}: does not satisfy contains")

    if isinstance(value, dict) and isinstance(schema, dict):
        properties = schema.get("properties", {})
        required = schema.get("required", [])
        for required_key in required:
            if required_key not in value:
                raise ValidationError(f"{path}: missing required property {required_key!r}")

        if schema.get("additionalProperties") is False:
            extras = [key for key in value if key not in properties]
            if extras:
                raise ValidationError(f"{path}: unexpected properties {extras!r}")

        for key, item in value.items():
            if key in properties:
                validate_instance(item, properties[key], base_path, resolver, f"{path}.{key}")
            elif isinstance(schema.get("additionalProperties"), dict):
                validate_instance(item, schema["additionalProperties"], base_path, resolver, f"{path}.{key}")


def iter_refs(node: Any) -> list[str]:
    refs: list[str] = []
    if isinstance(node, dict):
        if "$ref" in node:
            refs.append(node["$ref"])
        for child in node.values():
            refs.extend(iter_refs(child))
    elif isinstance(node, list):
        for child in node:
            refs.extend(iter_refs(child))
    return refs


def schema_path_map(root: Path) -> dict[str, Path]:
    return {path.name: path for path in sorted(root.glob("*.schema.json"))}


def audit_contract_files(root: Path, report: AuditReport) -> None:
    for contract_name in CONTRACT_FILES:
        contract_path = root / contract_name
        if contract_path.exists():
            report.add("PASS", "contract-file", f"{contract_name} present")
        else:
            report.add("FAIL", "contract-file", f"{contract_name} missing")

    stale_hits: list[str] = []
    for path in sorted(root.glob("*")):
        if not path.is_file():
            continue
        if path.suffix not in {".md", ".json"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for old_name in OLD_CONTRACT_NAMES:
            if old_name in text:
                stale_hits.append(f"{path.name} references {old_name}")
    if stale_hits:
        for hit in stale_hits:
            report.add("FAIL", "contract-reference", hit)
    else:
        report.add("PASS", "contract-reference", "No stale pre-v0 contract filename references found")


def audit_schema_parse(root: Path, resolver: SchemaResolver, report: AuditReport) -> None:
    for schema_name in SCHEMA_FILES:
        schema_path = root / schema_name
        if not schema_path.exists():
            report.add("FAIL", "schema-parse", f"{schema_name} missing")
            continue
        try:
            resolver.load_json(schema_path)
        except Exception as exc:
            report.add("FAIL", "schema-parse", f"{schema_name}: {exc}")
        else:
            report.add("PASS", "schema-parse", schema_name)


def audit_ref_sanity(root: Path, resolver: SchemaResolver, report: AuditReport) -> None:
    for schema_name in SCHEMA_FILES:
        schema_path = root / schema_name
        if not schema_path.exists():
            continue
        try:
            document = resolver.load_json(schema_path)
            refs = iter_refs(document)
            if not refs:
                report.add("DOWNGRADED", "ref-sanity", f"{schema_name}: no refs to resolve")
                continue
            for ref in refs:
                resolver.resolve_ref(schema_path, ref)
            report.add("PASS", "ref-sanity", f"{schema_name}: resolved {len(refs)} refs")
        except Exception as exc:
            report.add("FAIL", "ref-sanity", f"{schema_name}: {exc}")


def audit_examples(root: Path, resolver: SchemaResolver, report: AuditReport) -> None:
    for schema_name in SCHEMA_FILES:
        schema_path = root / schema_name
        if not schema_path.exists():
            continue
        try:
            schema = resolver.load_json(schema_path)
            examples = schema.get("examples", [])
            if not examples:
                report.add("DOWNGRADED", "example-validation", f"{schema_name}: no embedded examples")
                continue
            for index, example in enumerate(examples):
                validate_instance(example, schema, schema_path, resolver)
                report.add("PASS", "example-validation", f"{schema_name} example[{index}]")
        except Exception as exc:
            report.add("FAIL", "example-validation", f"{schema_name}: {exc}")


def make_invalid_cases(root: Path, resolver: SchemaResolver) -> list[tuple[str, Path, Any]]:
    reasoning_schema = resolver.load_json(root / "reasoning_frame.schema.json")
    prompt_schema = resolver.load_json(root / "prompt_receipt.schema.json")
    response_schema = resolver.load_json(root / "response_receipt.schema.json")
    benchmark_schema = resolver.load_json(root / "language_kernel_benchmark_run.schema.json")

    reasoning_case = copy.deepcopy(reasoning_schema["examples"][0])
    reasoning_case["legal_claim"] = "not the approved exact string"

    prompt_case = copy.deepcopy(prompt_schema["examples"][0])
    prompt_case.pop("prompt_hash_sha256", None)

    response_case = {
        "response_receipt_id": "RR:test:blocked",
        "receiver_version": "v0.1",
        "kernel_contract_version": "v0.1",
        "kernel_run_id": "KR:test:blocked",
        "export_packet_id": "EK:test:blocked",
        "prompt_receipt_id": "PR:test:blocked",
        "provider": "ollama",
        "model_name": "llama3.1",
        "declared_lens": "test lens",
        "query_class": "Q3",
        "claim_class_ceiling": "L1",
        "legal_posture": "Read-side Language Kernel response only. No canon authority. Not structural truth. Not primary retention substance.",
        "raw_response_hash_sha256": "0" * 64,
        "response_status": "blocked",
        "parse_status": "not_attempted",
        "schema_status": "not_checked",
        "frame_count": 0,
        "refusal_reason": "provider unavailable before response capture",
        "received_at": "2026-04-06T12:00:11Z",
    }

    benchmark_case = copy.deepcopy(benchmark_schema["examples"][0])
    benchmark_case["benchmark_tier"] = "tier_1_loop_lawfulness"
    benchmark_case["benchmark_family"] = "thread_continuity"

    return [
        ("reasoning_legal_claim_exactness", root / "reasoning_frame.schema.json", reasoning_case),
        ("prompt_submitted_requires_hash", root / "prompt_receipt.schema.json", prompt_case),
        ("response_blocked_forbids_raw_hash", root / "response_receipt.schema.json", response_case),
        ("benchmark_tier_family_coherence", root / "language_kernel_benchmark_run.schema.json", benchmark_case),
    ]


def audit_invalid_cases(root: Path, resolver: SchemaResolver, report: AuditReport) -> None:
    for case_name, schema_path, instance in make_invalid_cases(root, resolver):
        schema = resolver.load_json(schema_path)
        try:
            validate_instance(instance, schema, schema_path, resolver)
        except ValidationError:
            report.add("PASS", "invalid-case", f"{case_name} rejected as expected")
        except Exception as exc:
            report.add("FAIL", "invalid-case", f"{case_name}: unexpected error {exc}")
        else:
            report.add("FAIL", "invalid-case", f"{case_name}: invalid instance was accepted")


def validate_supplied_files(root: Path, resolver: SchemaResolver, schema_name: str, json_files: list[str]) -> int:
    schema_file_map = schema_path_map(root)
    candidates = {
        schema_name,
        f"{schema_name}.schema.json",
    }
    selected_path = None
    for candidate in candidates:
        if candidate in schema_file_map:
            selected_path = schema_file_map[candidate]
            break
    if selected_path is None:
        print(f"Unknown schema {schema_name!r}. Known schemas: {', '.join(sorted(schema_file_map))}", file=sys.stderr)
        return 2

    schema = resolver.load_json(selected_path)
    failures = 0
    for json_file in json_files:
        instance_path = Path(json_file).resolve()
        try:
            instance = json.loads(instance_path.read_text(encoding="utf-8"))
            validate_instance(instance, schema, selected_path, resolver)
        except Exception as exc:
            failures += 1
            print(f"[FAIL] file-validation: {instance_path} -> {exc}")
        else:
            print(f"[PASS] file-validation: {instance_path}")
    return 1 if failures else 0


def run_audit(root: Path) -> int:
    resolver = SchemaResolver()
    report = AuditReport()
    audit_contract_files(root, report)
    audit_schema_parse(root, resolver, report)
    audit_ref_sanity(root, resolver, report)
    audit_examples(root, resolver, report)
    audit_invalid_cases(root, resolver, report)
    report.emit()
    return 1 if report.failed else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate the bounded Language Kernel schema/contract packet.")
    subparsers = parser.add_subparsers(dest="command")

    audit_parser = subparsers.add_parser("audit", help="Run the full Language Kernel packet audit.")
    audit_parser.add_argument("--root", default=str(ROOT), help="Path to the LanguageKernel seam root.")

    validate_parser = subparsers.add_parser("validate", help="Validate JSON instance files against one schema.")
    validate_parser.add_argument("--root", default=str(ROOT), help="Path to the LanguageKernel seam root.")
    validate_parser.add_argument("--schema", required=True, help="Schema file name or short schema name.")
    validate_parser.add_argument("json_files", nargs="+", help="JSON files to validate.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command in (None, "audit"):
        return run_audit(Path(getattr(args, "root", ROOT)).resolve())
    if args.command == "validate":
        resolver = SchemaResolver()
        return validate_supplied_files(Path(args.root).resolve(), resolver, args.schema, args.json_files)

    parser.error(f"Unsupported command {args.command!r}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
