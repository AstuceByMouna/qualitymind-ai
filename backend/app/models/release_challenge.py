"""DC-02: objections, their current state and an append-only transition trail.

This module adds no authorization or release approval capability.
"""
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.requirement import Base


class ReleaseChallenge(Base):
    __tablename__ = "release_challenges"
    __table_args__ = (
        UniqueConstraint(
            "release_id", "obligation_id", "version", "reason",
            name="uq_release_challenge_fingerprint",
        ),
        CheckConstraint(
            "severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
            name="ck_release_challenge_severity",
        ),
        CheckConstraint(
            "status IN ('OPEN_UNQUALIFIED', 'QUALIFIED', 'RESOLVED', 'REJECTED')",
            name="ck_release_challenge_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    release_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quality_releases.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    obligation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("release_obligations.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    version: Mapped[str] = mapped_column(String(80), nullable=False)
    source: Mapped[str] = mapped_column(String(120), nullable=False)
    owner: Mapped[str] = mapped_column(String(120), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    plausible_harm: Mapped[str | None] = mapped_column(String(500), nullable=True)
    required_evidence: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        String(25), nullable=False, default="OPEN_UNQUALIFIED",
        server_default="OPEN_UNQUALIFIED",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False,
    )


class ReleaseChallengeEvent(Base):
    __tablename__ = "release_challenge_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("release_challenges.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    from_status: Mapped[str | None] = mapped_column(String(25), nullable=True)
    to_status: Mapped[str] = mapped_column(String(25), nullable=False)
    actor: Mapped[str] = mapped_column(String(120), nullable=False)
    justification: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )
