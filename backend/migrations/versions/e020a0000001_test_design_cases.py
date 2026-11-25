"""QA-107 test case drafts linked to acceptance criteria.

Revision ID: e020a0000001
Revises: d020a0000001
"""
from alembic import op
import sqlalchemy as sa

revision = "e020a0000001"
down_revision = "d020a0000001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "test_cases",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("requirement_id", sa.UUID(), sa.ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("criterion_id", sa.UUID(), sa.ForeignKey("acceptance_criteria.id", ondelete="SET NULL"), nullable=True),
        sa.Column("source_criterion", sa.Text(), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("preconditions", sa.Text(), nullable=False),
        sa.Column("steps", sa.Text(), nullable=False),
        sa.Column("expected_result", sa.Text(), nullable=False),
        sa.Column("requires_rule_clarification", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("status", sa.String(16), nullable=False, server_default="DRAFT"),
        sa.Column("generator_version", sa.String(40), nullable=False, server_default="rules-v1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("requirement_id", "criterion_id", "kind", name="uq_test_case_source_kind"),
        sa.CheckConstraint("kind IN ('POSITIVE', 'NEGATIVE')", name="ck_test_case_kind"),
        sa.CheckConstraint("status = 'DRAFT'", name="ck_test_case_draft_only"),
    )
    op.create_index("ix_test_cases_requirement_id", "test_cases", ["requirement_id"])
    op.create_index("ix_test_cases_criterion_id", "test_cases", ["criterion_id"])


def downgrade():
    op.drop_index("ix_test_cases_criterion_id", table_name="test_cases")
    op.drop_index("ix_test_cases_requirement_id", table_name="test_cases")
    op.drop_table("test_cases")
