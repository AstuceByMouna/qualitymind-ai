
from fastapi import FastAPI

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.requirement import Requirement
from app.schemas.requirement import RequirementCreate

app = FastAPI(
    title="QualityMind AI",
    description="Enterprise AI-Powered Quality Engineering Platform",
    version="0.1.0"
)


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/requirements", status_code=201)
def create_requirement(
    data: RequirementCreate,
    db: Session = Depends(get_db),
):
    requirement = Requirement(
        title=data.title,
        description=data.description,
    )

    db.add(requirement)
    db.commit()
    db.refresh(requirement)

    return {
        "id": requirement.id,
        "title": requirement.title,
        "description": requirement.description,
        "created_at": requirement.created_at,
    }
