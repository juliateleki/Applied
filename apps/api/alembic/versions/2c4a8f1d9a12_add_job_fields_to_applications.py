"""add job fields to applications

Revision ID: 2c4a8f1d9a12
Revises: 1b2c3d4e5f6g
Create Date: 2026-01-28
"""

from alembic import op
import sqlalchemy as sa

revision = "2c4a8f1d9a12"
down_revision = "1b2c3d4e5f6g"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("applications", sa.Column("job_url", sa.String(length=1000), nullable=True))
    op.add_column("applications", sa.Column("job_description", sa.Text(), nullable=True))
    op.create_index("ix_applications_job_url", "applications", ["job_url"])


def downgrade() -> None:
    op.drop_index("ix_applications_job_url", table_name="applications")
    op.drop_column("applications", "job_description")
    op.drop_column("applications", "job_url")
