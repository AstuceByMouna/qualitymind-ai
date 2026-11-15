"""QA-84: partial update input validation tests without database access."""
import pytest
from pydantic import ValidationError

from app.schemas.requirement import RequirementUpdate


@pytest.mark.parametrize("payload,expected", [
    ({"title": "  Change title  "}, {"title": "Change title", "description": None}),
    ({"description": "  Change description  "}, {"title": None, "description": "Change description"}),
    ({"title": "T", "description": "D"}, {"title": "T", "description": "D"}),
    ({"title": "T" * 255, "description": "D" * 10000},
     {"title": "T" * 255, "description": "D" * 10000}),
])
def test_partial_update_normalizes_fields(payload, expected):
    result = RequirementUpdate.model_validate(payload)
    assert result.title == expected["title"]
    assert result.description == expected["description"]


@pytest.mark.parametrize("payload", [
    {}, {"title": None}, {"description": None},
    {"title": "  "}, {"description": "  "},
    {"title": "A" * 256}, {"description": "D" * 10001},
    {"title": f"bad{chr(0)}text"}, {"description": f"bad{chr(0)}text"},
    {"title": 7}, {"description": []}, {"title": "valid", "id": "forbidden"},
])
def test_partial_update_rejects_invalid_payload(payload):
    with pytest.raises(ValidationError):
        RequirementUpdate.model_validate(payload)
