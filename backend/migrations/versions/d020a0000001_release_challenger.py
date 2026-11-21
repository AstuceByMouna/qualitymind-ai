"""Create Decision Challenger objections and append-only application event log.

Revision ID: d020a0000001
Revises: c920a0000001
"""
from alembic import op
import sqlalchemy as sa

revision = "d020a0000001"
down_revision = "c920a0000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "release_challenges",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column(
            "release_id", sa.UUID(),
            sa.ForeignKey("quality_releases.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "obligation_id", sa.UUID(),
            sa.ForeignKey("release_obligations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("version", sa.String(80), nullable=False),
        sa.Column("source", sa.String(120), nullable=False),
        sa.Column("owner", sa.String(120), nullable=False),
        sa.Column("reason", sa.String(500), nullable=False),
        sa.Column("severity", sa.String(16), nullable=False),
        sa.Column("plausible_harm", sa.String(500), nullable=True),
        sa.Column("required_evidence", sa.String(500), nullable=True),
        sa.Column(
            "status", sa.String(25), server_default="OPEN_UNQUALIFIED",
            nullable=False,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.text("now()"), nullable=False,
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True),
            server_default=sa.text("now()"), nullable=False,
        ),
        sa.CheckConstraint(
            "severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
            name="ck_release_challenge_severity",
        ),
        sa.CheckConstraint(
            "status IN ('OPEN_UNQUALIFIED', 'QUALIFIED', 'RESOLVED', 'REJECTED')",
            name="ck_release_challenge_status",
        ),
        sa.UniqueConstraint(
            "release_id", "obligation_id", "version", "reason",
            name="uq_release_challenge_fingerprint",
        ),
    )
    op.create_index("ix_release_challenges_release_id", "release_challenges", ["release_id"])
    op.create_index("ix_release_challenges_obligation_id", "release_challenges", ["obligation_id"])
    op.create_table(
        "release_challenge_events",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column(
            "challenge_id", sa.UUID(),
            sa.ForeignKey("release_challenges.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("from_status", sa.String(25), nullable=True),
        sa.Column("to_status", sa.String(25), nullable=False),
        sa.Column("actor", sa.String(120), nullable=False),
        sa.Column("justification", sa.String(500), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.text("now()"), nullable=False,
        ),
    )
    op.create_index("ix_release_challenge_events_challenge_id", "release_challenge_events", ["challenge_id"])


def downgrade() -> None:
    op.drop_index("ix_release_challenge_events_challenge_id", table_name="release_challenge_events")
    op.drop_table("release_challenge_events")
    op.drop_index("ix_release_challenges_obligation_id", table_name="release_challenges")
    op.drop_index("ix_release_challenges_release_id", table_name="release_challenges")
    op.drop_table("release_challenges")
