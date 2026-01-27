"""add application_events

Revision ID: 1b2c3d4e5f6g
Revises: 07de4d00f25e
Create Date: 2026-01-26
"""

from alembic import op
import sqlalchemy as sa


revision = "1b2c3d4e5f6g"
down_revision = "07de4d00f25e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "application_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("from_status", sa.String(length=50), nullable=True),
        sa.Column("to_status", sa.String(length=50), nullable=True),
        sa.Column("note", sa.String(length=2000), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_application_events_application_id", "application_events", ["application_id"])
    op.create_index("ix_application_events_occurred_at", "application_events", ["occurred_at"])


def downgrade() -> None:
    op.drop_index("ix_application_events_occurred_at", table_name="application_events")
    op.drop_index("ix_application_events_application_id", table_name="application_events")
    op.drop_table("application_events")
