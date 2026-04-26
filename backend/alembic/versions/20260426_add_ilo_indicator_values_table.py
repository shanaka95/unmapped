"""add ilo_indicator_values table

Revision ID: 20260426_add_ilo_indicator_values
Revises: 20260426_add_countries_languages
Create Date: 2026-04-26 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260426_add_ilo_indicator_values"
down_revision: Union[str, Sequence[str], None] = "20260426_add_countries_languages"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ilo_indicator_values",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "indicator_type",
            sa.Enum(
                "INDICATOR_02",
                "INDICATOR_04",
                "INDICATOR_10",
                "INDICATOR_11",
                "INDICATOR_12",
                "INDICATOR_13",
                "INDICATOR_14",
                "INDICATOR_15",
                name="indicatortype",
            ),
            nullable=False,
        ),
        sa.Column("ref_area_label", sa.String(length=100), nullable=False),
        sa.Column("sex_label", sa.String(length=20), nullable=False),
        sa.Column("classif1_label", sa.String(length=100), nullable=True),
        sa.Column("classif2_label", sa.String(length=100), nullable=True),
        sa.Column("time", sa.Integer(), nullable=False),
        sa.Column("obs_value", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ilo_indicator_values_indicator_type"), "ilo_indicator_values", ["indicator_type"], unique=False)
    op.create_index(op.f("ix_ilo_indicator_values_ref_area_label"), "ilo_indicator_values", ["ref_area_label"], unique=False)
    op.create_index(op.f("ix_ilo_indicator_values_sex_label"), "ilo_indicator_values", ["sex_label"], unique=False)
    op.create_index(op.f("ix_ilo_indicator_values_classif1_label"), "ilo_indicator_values", ["classif1_label"], unique=False)
    op.create_index(op.f("ix_ilo_indicator_values_time"), "ilo_indicator_values", ["time"], unique=False)
    op.create_index(op.f("ix_ilo_values_country_year"), "ilo_indicator_values", ["ref_area_label", "time"], unique=False)
    op.create_index(
        op.f("ix_ilo_values_indicator_country_year"),
        "ilo_indicator_values",
        ["indicator_type", "ref_area_label", "time"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_ilo_values_indicator_country_year"), table_name="ilo_indicator_values")
    op.drop_index(op.f("ix_ilo_values_country_year"), table_name="ilo_indicator_values")
    op.drop_index(op.f("ix_ilo_indicator_values_time"), table_name="ilo_indicator_values")
    op.drop_index(op.f("ix_ilo_indicator_values_classif1_label"), table_name="ilo_indicator_values")
    op.drop_index(op.f("ix_ilo_indicator_values_sex_label"), table_name="ilo_indicator_values")
    op.drop_index(op.f("ix_ilo_indicator_values_ref_area_label"), table_name="ilo_indicator_values")
    op.drop_index(op.f("ix_ilo_indicator_values_indicator_type"), table_name="ilo_indicator_values")
    op.drop_table("ilo_indicator_values")
