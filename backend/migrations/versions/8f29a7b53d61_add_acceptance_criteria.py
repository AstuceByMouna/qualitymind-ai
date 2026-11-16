"""FR-005: acceptance criteria attached to requirements.

Revision ID: 8f29a7b53d61
Revises: 939344bcdd5f
Create Date: 2026-11-16
"""
from alembic import op
import sqlalchemy as sa

revision = "8f29a7b53d61"
down_revision = "939344bcdd5f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "acceptance_criteria",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("requirement_id", sa.UUID(), nullable=False),
        sa.Column("content", sa.String(length=2000), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.text("now()"), nullable=False,
        ),
        sa.ForeignKeyConstraint(["requirement_id"], ["requirements.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_acceptance_criteria_requirement_position",
        "acceptance_criteria",
        ["requirement_id", "position"],
    )


def downgrade() -> None:
    op.drop_index("ix_acceptance_criteria_requirement_position", table_name="acceptance_criteria")
    op.drop_table("acceptance_criteria")
