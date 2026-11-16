"""QA-90 AI analyses and human decisions.

Revision ID: 90a1b0000001
Revises: 9c87a0000001
"""
from alembic import op
import sqlalchemy as sa

revision = "90a1b0000001"
down_revision = "9c87a0000001"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "requirement_ai_analysis_runs",
        sa.Column("id", sa.UUID(), nullable=False, primary_key=True),
        sa.Column("requirement_id", sa.UUID(), nullable=False),
        sa.Column("source_digest", sa.String(length=64), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("prompt_version", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=20), nullable=False),
        sa.Column("error_code", sa.String(length=32), nullable=True),
        sa.Column("consented_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["requirement_id"], ["requirements.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_requirement_ai_analysis_runs_requirement_id", "requirement_ai_analysis_runs", ["requirement_id"])
    op.create_table(
        "requirement_ai_suggestions",
        sa.Column("id", sa.UUID(), nullable=False, primary_key=True),
        sa.Column("run_id", sa.UUID(), nullable=False),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("observation", sa.Text(), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column("recommendation", sa.Text(), nullable=False),
        sa.Column("suggested_test_case", sa.Text(), nullable=True),
        sa.Column("risk_level", sa.String(10), nullable=False),
        sa.Column("decision", sa.String(16), nullable=False),
        sa.Column("edited_recommendation", sa.Text(), nullable=True),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["run_id"], ["requirement_ai_analysis_runs.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_ai_suggestions_run_id", "requirement_ai_suggestions", ["run_id"])

def downgrade():
    op.drop_index("ix_ai_suggestions_run_id", table_name="requirement_ai_suggestions")
    op.drop_table("requirement_ai_suggestions")
    op.drop_index("ix_requirement_ai_analysis_runs_requirement_id", table_name="requirement_ai_analysis_runs")
    op.drop_table("requirement_ai_analysis_runs")
