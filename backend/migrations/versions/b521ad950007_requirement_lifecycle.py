"""FR-007 requirement lifecycle.

Revision ID: b521ad950007
Revises: 8f29a7b53d61
Create Date: 2026-11-16
"""
from alembic import op
import sqlalchemy as sa

revision = "b521ad950007"
down_revision = "8f29a7b53d61"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("requirements", sa.Column(
        "status", sa.String(length=20), server_default="Draft", nullable=False
    ))
    op.create_check_constraint(
        "ck_requirements_lifecycle_status", "requirements",
        "status IN ('Draft', 'In Review', 'Ready')"
    )
    op.create_table(
        "requirement_status_history",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("requirement_id", sa.UUID(), nullable=False),
        sa.Column("from_status", sa.String(length=20), nullable=False),
        sa.Column("to_status", sa.String(length=20), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("source", sa.String(length=32), server_default="api", nullable=False),
        sa.ForeignKeyConstraint(["requirement_id"], ["requirements.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_requirement_status_history_requirement_id",
                    "requirement_status_history", ["requirement_id"])

def downgrade() -> None:
    op.drop_index("ix_requirement_status_history_requirement_id", table_name="requirement_status_history")
    op.drop_table("requirement_status_history")
    op.drop_constraint("ck_requirements_lifecycle_status", "requirements", type_="check")
    op.drop_column("requirements", "status")
