"""QA-124: API returns only allowlisted diagnostics, never submitted log content."""
from fastapi import APIRouter

from app.modules.failure_analysis.policy import classify_failure
from app.schemas.failure_analysis import FailureAnalysisRequest, FailureAnalysisResult

router = APIRouter(prefix="/api/v1/failure-analysis", tags=["failure-analysis"])


@router.post("/classify", response_model=FailureAnalysisResult)
def classify(data: FailureAnalysisRequest) -> FailureAnalysisResult:
    category, label, next_step = classify_failure(data.excerpt)
    return FailureAnalysisResult(
        classification=category,
        indicator=label,
        suggested_next_step=next_step,
    )
