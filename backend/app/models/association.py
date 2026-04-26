from sqlalchemy import Column, ForeignKey, Integer, Table, UniqueConstraint

from app.database import Base

language_country = Table(
    "language_country",
    Base.metadata,
    Column("id", Integer, primary_key=True),
    Column("language_id", Integer, ForeignKey("languages.id"), nullable=False),
    Column("country_id", Integer, ForeignKey("countries.id"), nullable=False),
    UniqueConstraint("language_id", "country_id", name="uq_language_country"),
)