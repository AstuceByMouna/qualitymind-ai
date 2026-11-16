"""Immutable staging preview and import batch audit."""
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Integer, String, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.requirement import Base

class ImportBatch(Base):
    __tablename__ = "requirement_import_batches"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    source_name: Mapped[str] = mapped_column(String(255),nullable=False)
    digest: Mapped[str] = mapped_column(String(64),nullable=False)
    state: Mapped[str] = mapped_column(String(20),nullable=False,default="preview",server_default="preview")
    rows: Mapped[list] = mapped_column(JSON,nullable=False)
    accepted: Mapped[int] = mapped_column(Integer,nullable=False,default=0)
    rejected: Mapped[int] = mapped_column(Integer,nullable=False,default=0)
    ignored: Mapped[int] = mapped_column(Integer,nullable=False,default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),server_default=func.now(),nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True),nullable=True)
