"""Seed countries table from Ethnologue CountryCodes.tab."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.country import Country

TAB_FILE = Path(__file__).resolve().parent.parent / "data" / "ethnologue" / "CountryCodes.tab"


def seed():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        existing = session.query(Country).count()
        if existing:
            print(f"Countries already exist ({existing} rows). Skipping.")
            return

        print(f"Reading countries from {TAB_FILE}...")
        batch = []
        with open(TAB_FILE, "r", encoding="utf-8") as f:
            header = f.readline().strip().split("\t")
            for line in f:
                parts = line.strip().split("\t")
                if len(parts) < 3:
                    continue
                code = parts[0]
                name = parts[1]
                area = parts[2]
                if not code or not name:
                    continue
                batch.append(Country(code=code, name=name, area=area))

        session.add_all(batch)
        session.commit()
        print(f"Seeded {len(batch)} countries")


if __name__ == "__main__":
    seed()
