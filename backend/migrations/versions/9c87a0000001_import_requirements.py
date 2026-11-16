"""QA-87 import batches and provenance.

Revision ID: 9c87a0000001
Revises: 9c97a0000001
"""
from alembic import op
import sqlalchemy as sa

revision="9c87a0000001"
down_revision="9c97a0000001"
branch_labels=None
depends_on=None

def upgrade():
    for name,length in (("import_source",255),("external_id",255),("priority",32)):
        op.add_column("requirements",sa.Column(name,sa.String(length=length),nullable=True))
    op.create_index("uq_requirements_import_identity","requirements",["import_source","external_id"],unique=True,
        postgresql_where=sa.text("import_source IS NOT NULL AND external_id IS NOT NULL"))
    op.create_table("requirement_import_batches",
        sa.Column("id",sa.UUID(),primary_key=True),
        sa.Column("source_name",sa.String(255),nullable=False),
        sa.Column("digest",sa.String(64),nullable=False),
        sa.Column("state",sa.String(20),server_default="preview",nullable=False),
        sa.Column("rows",sa.JSON(),nullable=False),
        sa.Column("accepted",sa.Integer(),nullable=False),
        sa.Column("rejected",sa.Integer(),nullable=False),
        sa.Column("ignored",sa.Integer(),nullable=False),
        sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.text("now()"),nullable=False),
        sa.Column("confirmed_at",sa.DateTime(timezone=True),nullable=True))
def downgrade():
    op.drop_table("requirement_import_batches")
    op.drop_index("uq_requirements_import_identity",table_name="requirements")
    for name in ("priority","external_id","import_source"):
        op.drop_column("requirements",name)
