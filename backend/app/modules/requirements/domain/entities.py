"""Domain representation of a requirement (framework-independent)."""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class RequirementEntity:
    id: UUID
    title: str
    description: str
    created_at: datetime
