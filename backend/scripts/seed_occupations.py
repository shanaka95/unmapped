"""Seed the occupations table from existing isco_occupations data."""

from sqlalchemy import select, text

from app.database import SessionLocal
from app.models.isco_occupation import IscoOccupation
from app.models.occupation import Occupation


def seed():
    with SessionLocal() as session:
        existing = session.scalar(text("SELECT COUNT(*) FROM occupations"))
        if existing:
            print(f"Occupations already exist ({existing} found). Skipping.")
            return

        isco_records = session.scalars(select(IscoOccupation)).all()
        for isco in isco_records:
            occupation = Occupation(
                level=isco.level,
                code=isco.code,
                title=isco.title,
                definition=isco.definition,
                group_id=isco.group_id,
            )
            session.add(occupation)

        session.commit()
        print(f"Seeded {len(isco_records)} occupations from ISCO data.")


if __name__ == "__main__":
    seed()
