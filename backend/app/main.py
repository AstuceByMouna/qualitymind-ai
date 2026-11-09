"""ASGI composition root for QualityMind AI."""
from fastapi import FastAPI

from app.api.v1.requirements import router as requirements_router

app = FastAPI(
    title="QualityMind AI",
    description="Enterprise AI-Powered Quality Engineering Platform",
    version="0.1.0",
)
app.include_router(requirements_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
