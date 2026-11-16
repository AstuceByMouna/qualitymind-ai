import pytest
from pydantic import ValidationError
from app.schemas.ai_analysis import AIAnalysisRequest, ReviewDecision
from app.modules.requirements.application.ai_contract import AIAnalysisPayload, source_snapshot, source_digest
from app.modules.requirements.application.ai_privacy import appears_sensitive, exceeds_remote_limit

def test_consent_and_attestation_mandatory():
    with pytest.raises(ValidationError):
        AIAnalysisRequest(consent_to_external_processing=False, confirms_no_sensitive_data=True)
    with pytest.raises(ValidationError):
        AIAnalysisRequest(consent_to_external_processing=True, confirms_no_sensitive_data=False)
    assert AIAnalysisRequest(consent_to_external_processing=True, confirms_no_sensitive_data=True)

def test_review_edit_contract():
    with pytest.raises(ValidationError):
        ReviewDecision(decision="edited")
    with pytest.raises(ValidationError):
        ReviewDecision(decision="accepted", edited_recommendation="Unexpected")
    assert ReviewDecision(decision="edited", edited_recommendation="Precise text")

def test_structured_output_validation():
    value=AIAnalysisPayload.model_validate({"suggestions":[{
        "category":"ambiguity","observation":"Vague","rationale":"Missing threshold",
        "recommendation":"Add measurable threshold","suggested_test_case":None,"risk_level":"medium"
    }]})
    assert value.suggestions[0].risk_level=="medium"
    with pytest.raises(ValidationError):
        AIAnalysisPayload.model_validate({"suggestions":[{"category":"invented"}]})

def test_digests_sensitive_patterns_and_limits():
    source=source_snapshot("Title","Description",["AC"])
    assert source_digest(source)==source_digest(source)
    assert source_digest(source)!=source_digest(source_snapshot("Title","Different",["AC"]))
    assert appears_sensitive(source_snapshot("Contact","mail person@example.com",[]))
    assert appears_sensitive(source_snapshot("Secret","api_key=hidden_value",[]))
    assert not appears_sensitive(source_snapshot("User flow","A user sees a dialog",[]))
    assert exceeds_remote_limit(source_snapshot("A","X"*16001,[]))
