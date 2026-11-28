"""Import-time fingerprint over persisted draft definition, version 1."""
import hashlib
import json

from app.models.test_case import TestCase


def definition_fingerprint(case: TestCase) -> str:
    definition = {
        "criterion_id": str(case.criterion_id) if case.criterion_id else None,
        "source_criterion": case.source_criterion,
        "kind": case.kind,
        "title": case.title,
        "preconditions": case.preconditions,
        "steps": case.steps,
        "expected_result": case.expected_result,
        "requires_rule_clarification": case.requires_rule_clarification,
        "generator_version": case.generator_version,
    }
    canonical = json.dumps(definition, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return "v1:sha256:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()
