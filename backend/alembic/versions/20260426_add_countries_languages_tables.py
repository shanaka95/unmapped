"""add countries, languages, and language_country tables

Revision ID: 20260426_add_countries_languages
Revises: ff94fc8f50c1
Create Date: 2026-04-26 10:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260426_add_countries_languages'
down_revision: Union[str, Sequence[str], None] = 'ff94fc8f50c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'countries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=2), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('area', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )
    op.create_index(op.f('ix_countries_code'), 'countries', ['code'], unique=True)

    op.create_table(
        'languages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=3), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )
    op.create_index(op.f('ix_languages_code'), 'languages', ['code'], unique=True)

    op.create_table(
        'language_country',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('language_id', sa.Integer(), nullable=False),
        sa.Column('country_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['country_id'], ['countries.id']),
        sa.ForeignKeyConstraint(['language_id'], ['languages.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('language_id', 'country_id', name='uq_language_country'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('language_country')
    op.drop_index(op.f('ix_languages_code'), table_name='languages')
    op.drop_table('languages')
    op.drop_index(op.f('ix_countries_code'), table_name='countries')
    op.drop_table('countries')
