
from fastapi import FastAPI

app = FastAPI(
    title="QualityMind AI",
    description="Enterprise AI-Powered Quality Engineering Platform",
    version="0.1.0"
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
