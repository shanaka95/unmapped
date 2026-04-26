"""Seed the isced_levels table with the 9 ISCED 2011 levels."""

from sqlalchemy import select

from app.database import SessionLocal
from app.models.isced_level import IscedLevel

LEVELS = [
    {"level": 0, "name": "Early childhood education"},
    {"level": 1, "name": "Primary education"},
    {"level": 2, "name": "Lower secondary education"},
    {"level": 3, "name": "Upper secondary education"},
    {"level": 4, "name": "Post-secondary non-tertiary education"},
    {"level": 5, "name": "Short-cycle tertiary education"},
    {"level": 6, "name": "Bachelor's or equivalent level"},
    {"level": 7, "name": "Master's or equivalent level"},
    {"level": 8, "name": "Doctoral or equivalent level"},
]


def seed():
    with SessionLocal() as session:
        existing = session.scalars(select(IscedLevel)).all()
        if existing:
            print(f"ISCED levels already exist ({len(existing)} found). Skipping.")
            return

        records = [IscedLevel(**data) for data in LEVELS]
        session.add_all(records)
        session.commit()
        print(f"Seeded {len(records)} ISCED levels.")


if __name__ == "__main__":
    seed()
