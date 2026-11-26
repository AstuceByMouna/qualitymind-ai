"""QA-112: optional metadata-only Playwright reference on a test case.

Revision ID: f120a0000001
Revises: f020a0000001
"""
from alembic import op
import sqlalchemy as sa

revision = "f120a0000001"
down_revision = "f020a0000001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "test_cases",
        sa.Column("playwright_script_path", sa.String(300), nullable=True),
    )


def downgrade():
    op.drop_column("test_cases", "playwright_script_path")
