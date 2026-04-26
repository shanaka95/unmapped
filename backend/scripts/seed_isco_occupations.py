"""Seed ISCO-08 occupations and groups from the official EN Structure and definitions CSV."""

import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.isco_occupation import IscoOccupation
from app.models.isco_occupation_group import IscoOccupationGroup

CSV_PATH = "/home/shanaka/Downloads/ISCO-08 EN Structure and definitions.csv"

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

# Map major group code -> group id
GROUP_MAP = {g["code"]: g["name"] for g in GROUPS}


def seed():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        # Delete existing data
        session.query(IscoOccupation).delete()
        session.query(IscoOccupationGroup).delete()
        session.commit()
        print("Cleared existing ISCO occupations and groups.")

        # Re-seed groups
        groups = [IscoOccupationGroup(**data) for data in GROUPS]
        session.add_all(groups)
        session.commit()

        # Build code -> group id map
        group_records = session.query(IscoOccupationGroup).all()
        group_by_code = {g.code: g.id for g in group_records}

        # Parse CSV and insert occupations
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            occupations = []
            for row in reader:
                level = row["Level"].strip()
                code = row["ISCO 08 Code"].strip()
                title = row["Title EN"].strip()
                definition = row["Definition"].strip() or None
                tasks_include = row["Tasks include"].strip() or None
                included_occupations = row["Included occupations"].strip() or None
                excluded_occupations = row["Excluded occupations"].strip() or None
                notes = row["Notes"].strip() or None

                # Determine group_id from the first digit(s) of the code
                group_id = None
                major_code = _major_code(code, int(level))
                if major_code in group_by_code:
                    group_id = group_by_code[major_code]

                occupations.append(
                    IscoOccupation(
                        level=int(level),
                        code=code,
                        title=title,
                        definition=definition,
                        tasks_include=tasks_include,
                        included_occupations=included_occupations,
                        excluded_occupations=excluded_occupations,
                        notes=notes,
                        group_id=group_id,
                    )
                )

        session.add_all(occupations)
        session.commit()
        print(f"Seeded {len(occupations)} ISCO occupations with {len(groups)} groups.")


def _major_code(code: str, level: int) -> int | None:
    """Extract the major group code from an ISCO-08 code."""
    if level == 1:
        # Major group: single digit like "1" or "0"
        return int(code)
    elif level == 2:
        # Sub-major group: two digits like "11", "22"
        return int(code[0])
    elif level == 3:
        # Minor group: three digits like "111", "213"
        return int(code[0])
    elif level == 4:
        # Unit group: four digits like "1111", "2132"
        return int(code[0])
    return None


if __name__ == "__main__":
    seed()
