"""ensure_lesson_slides_and_system_status_exist

Revision ID: f1a2c3d4e5f6
Revises: e0671c685099
Create Date: 2026-05-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = 'f1a2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'e0671c685099'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        'lesson_slides',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('slide_index', sa.Integer(), nullable=False),
        sa.Column('slide_type', sa.String(length=50), nullable=False),
        sa.Column('content_text', sa.Text(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('embedding', Vector(dim=768), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True,
    )

    op.create_table(
        'system_status',
        sa.Column('key', sa.String(length=50), nullable=False),
        sa.Column('value', sa.String(length=255), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('key'),
        if_not_exists=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('system_status', if_exists=True)
    op.drop_table('lesson_slides', if_exists=True)
