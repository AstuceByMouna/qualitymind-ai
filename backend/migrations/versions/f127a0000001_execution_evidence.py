"""Add QA-127 external execution evidence without modifying existing rows."""
import sqlalchemy as sa
from alembic import context, op

revision = "f127a0000001"
down_revision = "f120a0000001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "execution_evidence",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("test_case_id", sa.Uuid(), sa.ForeignKey("test_cases.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("external_run_id", sa.String(128), nullable=False),
        sa.Column("external_result_id", sa.String(128), nullable=False),
        sa.Column("script_path", sa.String(300), nullable=False),
        sa.Column("tested_commit_sha", sa.String(40), nullable=False),
        sa.Column("executed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("outcome", sa.String(7), nullable=False),
        sa.Column("provenance", sa.String(13), server_default="USER_IMPORTED", nullable=False),
        sa.Column("definition_fingerprint", sa.String(80), nullable=False),
        sa.Column("imported_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("test_case_id", "external_run_id", "external_result_id",
                            name="uq_execution_evidence_identity"),
        sa.CheckConstraint("outcome IN ('PASS', 'FAIL', 'SKIPPED', 'ERROR')", name="ck_execution_outcome"),
        sa.CheckConstraint("provenance = 'USER_IMPORTED'", name="ck_execution_provenance"),
        sa.CheckConstraint("tested_commit_sha ~ '^[0-9a-f]{40}$'", name="ck_execution_sha"),
    )
    op.create_index("ix_execution_evidence_history", "execution_evidence", ["test_case_id", "imported_at", "id"])


def downgrade():
    if context.is_offline_mode():
        raise RuntimeError("Execution evidence downgrade requires an online emptiness check.")
    bind = op.get_bind()
    bind.execute(sa.text("LOCK TABLE execution_evidence IN ACCESS EXCLUSIVE MODE"))
    if bind.scalar(sa.text("SELECT EXISTS (SELECT 1 FROM execution_evidence)")):
        raise RuntimeError("Execution evidence history exists. Roll back the application and retain this table.")
    op.drop_table("execution_evidence")
