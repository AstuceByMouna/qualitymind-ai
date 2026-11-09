
"""ASGI composition root for QualityMind AI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.requirements import router as requirements_router
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
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(requirements_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
