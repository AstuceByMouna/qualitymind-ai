"""QA-97 reversible archival.

Revision ID: 9c97a0000001
Revises: b521ad950007
"""
from alembic import op
import sqlalchemy as sa

revision = "9c97a0000001"
down_revision = "b521ad950007"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("requirements", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("requirements", sa.Column("archive_source", sa.String(length=32), nullable=True))
    op.create_index("ix_requirements_archived_at", "requirements", ["archived_at"])

def downgrade() -> None:
    op.drop_index("ix_requirements_archived_at", table_name="requirements")
    op.drop_column("requirements", "archive_source")
    op.drop_column("requirements", "archived_at")
