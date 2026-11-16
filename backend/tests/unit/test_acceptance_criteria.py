"""QA-94 input validation and application service tests."""
from unittest.mock import Mock
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.acceptance_criterion import AcceptanceCriterionWrite
from app.modules.requirements.application.acceptance_criteria import (
    AcceptanceCriteriaService, AcceptanceRequirementNotFoundError,
    AcceptanceCriterionNotFoundError,
)


def test_valid_criterion_normalized():
    assert AcceptanceCriterionWrite.model_validate(
        {"content": "  Given A, when B, then C  "}
    ).content == "Given A, when B, then C"
    assert len(AcceptanceCriterionWrite(content="X" * 2000).content) == 2000


@pytest.mark.parametrize("payload", [
    {}, {"content": None}, {"content": ""}, {"content": "   "},
    {"content": 123}, {"content": "X" * 2001},
    {"content": f"bad{chr(0)}text"}, {"content": "good", "wrong": True},
])
def test_invalid_criterion_rejected(payload):
    with pytest.raises(ValidationError):
        AcceptanceCriterionWrite.model_validate(payload)


def test_service_missing_parent_and_criterion():
    parent, criterion = uuid4(), uuid4()
    repository = Mock()
    service = AcceptanceCriteriaService(repository)
    repository.list_for_requirement.return_value = None
    with pytest.raises(AcceptanceRequirementNotFoundError):
        service.list(parent)
    repository.add.return_value = None
    with pytest.raises(AcceptanceRequirementNotFoundError):
        service.add(parent, content="Valid")
    repository.update.return_value = None
    with pytest.raises(AcceptanceCriterionNotFoundError):
        service.update(parent, criterion, content="Valid")
    repository.remove.return_value = False
    with pytest.raises(AcceptanceCriterionNotFoundError):
        service.remove(parent, criterion)
