"""QA-124: API returns allowlisted diagnostics, never the submitted excerpt."""
from collections.abc import Callable
from typing import Awaitable

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute

from app.modules.failure_analysis.policy import classify_failure
from app.schemas.failure_analysis import FailureAnalysisRequest, FailureAnalysisResult


class SanitizedValidationRoute(APIRoute):
    """Avoid FastAPI's default 422 response echoing sensitive submitted inputs."""

    def get_route_handler(self) -> Callable[[Request], Awaitable[Response]]:
        original = super().get_route_handler()

        async def sanitized(request: Request) -> Response:
            try:
                return await original(request)
            except RequestValidationError:
                raise HTTPException(status_code=422, detail="Invalid failure excerpt") from None

        return sanitized


router = APIRouter(
    prefix="/api/v1/failure-analysis",
    tags=["failure-analysis"],
    route_class=SanitizedValidationRoute,
)


@router.post("/classify", response_model=FailureAnalysisResult)
def classify(data: FailureAnalysisRequest) -> FailureAnalysisResult:
    category, label, next_step = classify_failure(data.excerpt)
    return FailureAnalysisResult(
        classification=category,
        indicator=label,
        suggested_next_step=next_step,
    )
