import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import openpyxl

from app.database import SessionLocal, engine, Base
from app.models import IscoOccupation

XLSX_PATH = "/home/shanaka/Downloads/ISCO-08 EN Structure and definitions.xlsx"


def seed():
    Base.metadata.create_all(bind=engine)

    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True)
    ws = wb["ISCO-08 EN Struct and defin"]

    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        level, code, title, definition = row[0], row[1], row[2], row[3]
        if level is None or code is None:
            continue
        rows.append(
            IscoOccupation(
                level=int(level),
                code=str(code).strip(),
                title=str(title).strip(),
                definition=str(definition).strip() if definition else None,
            )
        )
    wb.close()

    with SessionLocal() as session:
        session.query(IscoOccupation).delete()
        session.add_all(rows)
        session.commit()
        print(f"Seeded {len(rows)} ISCO occupations.")


if __name__ == "__main__":
    seed()
