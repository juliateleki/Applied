"""add applied_at to applications

Revision ID: 3a9f_applied_at_required
Revises: 2c4a8f1d9a12
Create Date: 2026-01-29
"""

from alembic import op
import sqlalchemy as sa

revision = "3a9f_applied_at_required"
down_revision = "2c4a8f1d9a12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add column as nullable first so existing rows don't break
    op.add_column(
        "applications",
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 2. Backfill existing rows using created_at
    op.execute(
        "UPDATE applications SET applied_at = created_at WHERE applied_at IS NULL"
    )

    # 3. Make it NOT NULL
    op.alter_column("applications", "applied_at", nullable=False)

    op.create_index(
        "ix_applications_applied_at",
        "applications",
        ["applied_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_applications_applied_at", table_name="applications")
    op.drop_column("applications", "applied_at")
