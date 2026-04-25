"""add isco occupation groups table and group fk

Revision ID: 985ff74afa5b
Revises: ddc85b673a91
Create Date: 2026-04-26 01:50:34.780410

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '985ff74afa5b'
down_revision: Union[str, Sequence[str], None] = 'ddc85b673a91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('isco_occupation_groups',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('code', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('skill_level', sa.String(length=20), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_isco_occupation_groups_code'), 'isco_occupation_groups', ['code'], unique=True)

    with op.batch_alter_table('isco_occupations') as batch_op:
        batch_op.add_column(sa.Column('group_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_isco_occupations_group_id', 'isco_occupation_groups', ['group_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('isco_occupations') as batch_op:
        batch_op.drop_constraint('fk_isco_occupations_group_id', type_='foreignkey')
        batch_op.drop_column('group_id')

    op.drop_index(op.f('ix_isco_occupation_groups_code'), table_name='isco_occupation_groups')
    op.drop_table('isco_occupation_groups')
