"""QA-107: human-review-only test case drafts linked to a requirement and source criterion."""
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.requirement import Base


class TestCase(Base):
    __tablename__ = "test_cases"
    __table_args__ = (
        UniqueConstraint("requirement_id", "criterion_id", "kind", name="uq_test_case_source_kind"),
        CheckConstraint("kind IN ('POSITIVE', 'NEGATIVE')", name="ck_test_case_kind"),
        CheckConstraint("status = 'DRAFT'", name="ck_test_case_draft_only"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requirement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("requirements.id", ondelete="CASCADE"), index=True, nullable=False
    )
    criterion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("acceptance_criteria.id", ondelete="SET NULL"), index=True
    )
    source_criterion: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    preconditions: Mapped[str] = mapped_column(Text, nullable=False)
    steps: Mapped[str] = mapped_column(Text, nullable=False)
    expected_result: Mapped[str] = mapped_column(Text, nullable=False)
    requires_rule_clarification: Mapped[bool] = mapped_column(nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="DRAFT", server_default="DRAFT")
    generator_version: Mapped[str] = mapped_column(String(40), nullable=False, default="rules-v1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
