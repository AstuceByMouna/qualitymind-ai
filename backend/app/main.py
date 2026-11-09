
from fastapi import FastAPI

from fastapi import Depends
from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException
from app.db import get_db
from app.models.requirement import Requirement
from app.schemas.requirement import RequirementCreate
from sqlalchemy import select
from app.schemas.requirement import RequirementRead
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

@app.get("/requirements", response_model=list[RequirementRead])
def list_requirements(db: Session = Depends(get_db)):
    statement = select(Requirement).order_by(
        Requirement.created_at.desc(),
        Requirement.id.desc(),
    )

    requirements = db.scalars(statement).all()

    return requirements

@app.get("/requirements/{requirement_id}", response_model=RequirementRead)
def get_requirement(
    requirement_id: UUID,
    db: Session = Depends(get_db),
):
    requirement = db.get(Requirement, requirement_id)

    if requirement is None:
        raise HTTPException(
            status_code=404,
            detail="Requirement not found",
        )

    return requirement
