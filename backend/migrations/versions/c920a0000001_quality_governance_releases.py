"""Add release readiness data, without approvals or GO state.

Revision ID: c920a0000001
Revises: 90a1b0000001
"""
from alembic import op
import sqlalchemy as sa

revision = "c920a0000001"
down_revision = "90a1b0000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "quality_releases",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("version", sa.String(80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_table(
        "release_obligations",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("release_id", sa.UUID(), sa.ForeignKey("quality_releases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("requirement_id", sa.UUID(), sa.ForeignKey("requirements.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("critical", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_release_obligations_release_id", "release_obligations", ["release_id"])
    op.create_index("ix_release_obligations_requirement_id", "release_obligations", ["requirement_id"])
    op.create_table(
        "release_evidence",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("obligation_id", sa.UUID(), sa.ForeignKey("release_obligations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reference", sa.String(500), nullable=False),
        sa.Column("tested_version", sa.String(80), nullable=False),
        sa.Column("result", sa.String(4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("result IN ('PASS', 'FAIL')", name="ck_release_evidence_result"),
    )
    op.create_index("ix_release_evidence_obligation_id", "release_evidence", ["obligation_id"])


def downgrade() -> None:
    op.drop_index("ix_release_evidence_obligation_id", table_name="release_evidence")
    op.drop_table("release_evidence")
    op.drop_index("ix_release_obligations_requirement_id", table_name="release_obligations")
    op.drop_index("ix_release_obligations_release_id", table_name="release_obligations")
    op.drop_table("release_obligations")
    op.drop_table("quality_releases")
