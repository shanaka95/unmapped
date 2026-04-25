"""Seed the isco_occupation_groups table with the 10 ISCO-08 Major Groups."""

from sqlalchemy import select

from app.database import SessionLocal
from app.models.isco_occupation_group import IscoOccupationGroup

GROUPS = [
    {"code": 1, "name": "Managers", "skill_level": "3, 4"},
    {"code": 2, "name": "Professionals", "skill_level": "4"},
    {"code": 3, "name": "Technicians and Associate Professionals", "skill_level": "3"},
    {"code": 4, "name": "Clerical Support Workers", "skill_level": "2"},
    {"code": 5, "name": "Service and Sales Workers", "skill_level": "2"},
    {"code": 6, "name": "Skilled Agricultural, Forestry and Fishery Workers", "skill_level": "2"},
    {"code": 7, "name": "Craft and Related Trades Workers", "skill_level": "2"},
    {"code": 8, "name": "Plant and Machine Operators, and Assemblers", "skill_level": "2"},
    {"code": 9, "name": "Elementary Occupations", "skill_level": "1"},
    {"code": 0, "name": "Armed Forces Occupations", "skill_level": "1, 2, 4"},
]


def seed():
    with SessionLocal() as session:
        existing = session.scalars(select(IscoOccupationGroup)).all()
        if existing:
            print(f"ISCO occupation groups already exist ({len(existing)} found). Skipping.")
            return

        records = [IscoOccupationGroup(**data) for data in GROUPS]
        session.add_all(records)
        session.commit()
        print(f"Seeded {len(records)} ISCO occupation groups.")


if __name__ == "__main__":
    seed()
