from sqlalchemy import select

from app.database import SessionLocal, engine, Base
from app.models import IloSector

SECTORS = [
    "Agriculture, plantations, other rural sectors",
    "Basic metal production",
    "Chemical industries",
    "Commerce",
    "Construction",
    "Education and research",
    "Financial services, professional services",
    "Food, drink, tobacco",
    "Forestry, wood, pulp and paper",
    "Health services",
    "Hotels, catering, tourism",
    "Mechanical and electrical engineering",
    "Media, culture, graphical",
    "Mining (coal, other mining)",
    "Oil and gas production, oil refining",
    "Other manufacturing",
    "Postal and telecommunications services",
    "Public service",
    "Shipping, ports, fisheries, inland waterways",
    "Textiles, clothing, leather, footwear",
    "Transport (including civil aviation, road transport and railways)",
    "Transport equipment manufacturing",
    "Utilities (water, gas, electricity)",
]


def seed():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        existing = {s.name for s in session.scalars(select(IloSector)).all()}
        new = [IloSector(name=name) for name in SECTORS if name not in existing]
        if new:
            session.add_all(new)
            session.commit()
            print(f"Seeded {len(new)} ILO sectors.")
        else:
            print("ILO sectors already seeded.")


if __name__ == "__main__":
    seed()
