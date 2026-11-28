"""Append-only, user-imported test execution declarations."""
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.requirement import Base


class ExecutionEvidence(Base):
    __tablename__ = "execution_evidence"
    __table_args__ = (
        UniqueConstraint("test_case_id", "external_run_id", "external_result_id",
                         name="uq_execution_evidence_identity"),
        CheckConstraint("outcome IN ('PASS', 'FAIL', 'SKIPPED', 'ERROR')", name="ck_execution_outcome"),
        CheckConstraint("provenance = 'USER_IMPORTED'", name="ck_execution_provenance"),
        CheckConstraint("tested_commit_sha ~ '^[0-9a-f]{40}$'", name="ck_execution_sha"),
        Index("ix_execution_evidence_history", "test_case_id", "imported_at", "id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    test_case_id: Mapped[UUID] = mapped_column(ForeignKey("test_cases.id", ondelete="RESTRICT"))
    external_run_id: Mapped[str] = mapped_column(String(128))
    external_result_id: Mapped[str] = mapped_column(String(128))
    script_path: Mapped[str] = mapped_column(String(300))
    tested_commit_sha: Mapped[str] = mapped_column(String(40))
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    outcome: Mapped[str] = mapped_column(String(7))
    provenance: Mapped[str] = mapped_column(String(13), server_default="USER_IMPORTED")
    definition_fingerprint: Mapped[str] = mapped_column(String(80))
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
