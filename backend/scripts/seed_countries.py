"""Seed countries table from restcountries.com API."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import urllib.request

from app.database import SessionLocal, engine, Base
from app.models.country import Country

COUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=cca2,name"


def seed():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        existing = session.query(Country).count()
        if existing:
            print(f"Countries already exist ({existing} rows). Skipping.")
            return

        print("Fetching countries from restcountries.com...")
        req = urllib.request.Request(COUNTRIES_URL, headers={"User-Agent": "Unmapped/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())

        batch = []
        for entry in data:
            code = entry.get("cca2", "")
            name = entry.get("name", {}).get("common", "")
            if not code or not name:
                continue
            batch.append(Country(code=code, name=name))

        session.add_all(batch)
        session.commit()
        print(f"Seeded {len(batch)} countries")


if __name__ == "__main__":
    seed()
