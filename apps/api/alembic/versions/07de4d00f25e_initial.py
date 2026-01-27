"""initial

Revision ID: 07de4d00f25e
Revises:
Create Date: 2026-01-13 18:14:58.987192

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "07de4d00f25e"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_name", sa.String(length=200), nullable=False),
        sa.Column("role_title", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="applied"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_applications_status", "applications", ["status"])
    op.create_index("ix_applications_company_name", "applications", ["company_name"])


def downgrade() -> None:
    op.drop_index("ix_applications_company_name", table_name="applications")
    op.drop_index("ix_applications_status", table_name="applications")
    op.drop_table("applications")
