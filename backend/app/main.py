
"""ASGI composition root for QualityMind AI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.test_design import router as test_design_router
from app.api.v1.releases import router as releases_router
from app.api.v1.release_challenges import router as challenges_router
from app.api.v1.quality_analysis import router as quality_router
from app.api.v1.ai_analysis import router as ai_router
from app.api.v1.imports import router as imports_router
from app.api.v1.requirements import router as requirements_router
from app.api.v1.acceptance_criteria import router as acceptance_criteria_router
from app.core.config import get_cors_origins

app = FastAPI(
    title="QualityMind AI",
    description="Enterprise AI-Powered Quality Engineering Platform",
    version="0.1.0",
)

# Allow only explicitly configured frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(requirements_router)
app.include_router(imports_router)
app.include_router(ai_router)
app.include_router(quality_router)
app.include_router(releases_router)
app.include_router(challenges_router)
app.include_router(acceptance_criteria_router)
app.include_router(test_design_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
