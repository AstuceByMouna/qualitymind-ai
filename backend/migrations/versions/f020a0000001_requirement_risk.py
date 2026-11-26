"""QA-111: explicit risk assessment level, initially UNKNOWN.

Revision ID: f020a0000001
Revises: e020a0000001
"""
from alembic import op
import sqlalchemy as sa

revision = "f020a0000001"
down_revision = "e020a0000001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("requirements", sa.Column(
        "risk_level", sa.String(10), nullable=False, server_default="UNKNOWN"
    ))
    op.create_check_constraint(
        "ck_requirements_risk_level", "requirements",
        "risk_level IN ('UNKNOWN', 'LOW', 'MEDIUM', 'HIGH')",
    )


def downgrade():
    op.drop_constraint("ck_requirements_risk_level", "requirements", type_="check")
    op.drop_column("requirements", "risk_level")
