"""Seed automation exposure data from ILO text file."""
from sqlalchemy import text

from app.database import SessionLocal, engine


def seed():
    filepath = "/home/shanaka/Desktop/projects/unmapped/backend/data/automation_exposure.txt"
    rows = []

    with open(filepath) as f:
        content = f.read()

    lines = content.split("\n")

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        # Look for 4-digit code
        if line.isdigit() and len(line) == 4:
            code = line
            # Next non-empty line should be occupation name
            i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            name = lines[i].strip() if i < len(lines) else ""

            # Next non-empty should be mean
            i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            mean_str = lines[i].strip() if i < len(lines) else ""

            # Next non-empty should be sd
            i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            sd_str = lines[i].strip() if i < len(lines) else ""

            # Next non-empty should be gradient
            i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            gradient = lines[i].strip() if i < len(lines) else ""

            try:
                mean_val = float(mean_str)
                sd_val = float(sd_str) if sd_str else None
            except ValueError:
                i += 1
                continue

            rows.append((code, name, mean_val, sd_val, gradient or None))
            i += 1
        else:
            i += 1

    print(f"Parsed {len(rows)} rows from file")

    # Insert into DB
    with engine.connect() as conn:
        # Check existing count
        result = conn.execute(text("SELECT COUNT(*) FROM automation_exposure"))
        existing = result.scalar()
        print(f"Existing rows in DB: {existing}")

        if existing >= len(rows):
            print("Data already seeded, skipping.")
            return

        conn.execute(text("DELETE FROM automation_exposure"))
        conn.commit()

    inserted = 0
    with SessionLocal() as session:
        for code, name, mean_val, sd_val, gradient in rows:
            session.execute(
                text("""
                    INSERT INTO automation_exposure (isco_code, occupation_name, mean, sd, gradient)
                    VALUES (:code, :name, :mean, :sd, :gradient)
                """),
                {"code": code, "name": name, "mean": mean_val, "sd": sd_val, "gradient": gradient},
            )
            inserted += 1

        session.commit()

    print(f"Inserted {inserted} automation exposure rows")

    # Cross-check with ISCO occupations
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) FROM automation_exposure ae
            WHERE EXISTS (SELECT 1 FROM isco_occupations isco WHERE isco.code = ae.isco_code)
        """))
        matched = result.scalar()
        result2 = conn.execute(text("SELECT COUNT(*) FROM automation_exposure"))
        total = result2.scalar()
        print(f"Matched to ISCO codes: {matched}/{total}")

        # Show unmatched
        result3 = conn.execute(text("""
            SELECT ae.isco_code, ae.occupation_name FROM automation_exposure ae
            WHERE NOT EXISTS (SELECT 1 FROM isco_occupations isco WHERE isco.code = ae.isco_code)
            LIMIT 10
        """))
        unmatched = result3.fetchall()
        if unmatched:
            print(f"Sample unmatched codes: {unmatched[:5]}")


if __name__ == "__main__":
    seed()