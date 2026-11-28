"""The versioned fingerprint follows the draft definition, not its script."""
from app.models.test_case import TestCase as DraftCase
from app.modules.automation_hub.execution_evidence import definition_fingerprint


def test_definition_fingerprint_changes_only_for_snapshotted_fields():
    case = DraftCase(title="Synthetic", steps="Inspect the synthetic screen")
    original = definition_fingerprint(case)
    assert original.startswith("v1:sha256:")
    assert len(original) == len("v1:sha256:") + 64
    case.playwright_script_path = "tests/synthetic.spec.ts"
    assert definition_fingerprint(case) == original
    case.steps = "Inspect the synthetic screen again"
    assert definition_fingerprint(case) != original
