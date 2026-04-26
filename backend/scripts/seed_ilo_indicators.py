"""Seed ilo_indicator_values table from ILO/WB CSV files.

Download instructions:
1. Visit https://ilostat.ilo.org/ and search for the following indicators:
   - Employment (EAP_TEAP_SEX_AGE_ECO_CIV_NDB_A) -> indicator_02
   - Unemployment (EES_TEUS_SEX_AGE_EDU_NDB_A) -> indicator_04
   - Potential labour force (EPL_TPFA_SEX_AGE_EDU_NDB_A) -> indicator_10
   - Youth not in education/employment/training (SILC_TNEED_SEX_AGE_NDB_A) -> indicator_11
   - Combined status (EIP_TRES_SEX_AGE_EDU_NDB_A) -> indicator_12
   - Time-related underemployment (EET_TTRU_SEX_AGE_EDU_NDB_A) -> indicator_13
   - Own-use producers (EOP_TOWK_SEX_SECTOR_NDB_A) -> indicator_14
   - Average weekly hours worked (EES_TWH_SEX_AGE_EDU_NDB_A) -> indicator_15
2. For each indicator, filter by: time >= 2018, sex = Total/Male/Female
3. Download as CSV with "ref_area.label", "sex.label", "classif1.label", "classif2.label", "time", "obs_value" columns
4. Save as: data/ilo/indicator_02_clean.csv through data/ilo/indicator_15_clean.csv
"""

import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.ilo_indicator import IloIndicatorValue, IndicatorType

# ISCO-08 1-digit occupation group labels -> ISCO digit codes
OCCUPATION_GROUP_MAP = {
    "Armed forces occupations": "0",
    "Managers": "1",
    "Professionals": "2",
    "Technicians and associate professionals": "3",
    "Clerical support workers": "4",
    "Service and sales workers": "5",
    "Skilled agricultural, forestry and fishery workers": "6",
    "Craft and related trades workers": "7",
    "Plant and machine operators, and assemblers": "8",
    "Elementary occupations": "9",
}

INDICATOR_FILES = [
    ("indicator_02_clean.csv", IndicatorType.INDICATOR_02),
    ("indicator_04_clean.csv", IndicatorType.INDICATOR_04),
    ("indicator_10_clean.csv", IndicatorType.INDICATOR_10),
    ("indicator_11_clean.csv", IndicatorType.INDICATOR_11),
    ("indicator_12_clean.csv", IndicatorType.INDICATOR_12),
    ("indicator_13_clean.csv", IndicatorType.INDICATOR_13),
    ("indicator_14_clean.csv", IndicatorType.INDICATOR_14),
    ("indicator_15_clean.csv", IndicatorType.INDICATOR_15),
]

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "ilo"
YEAR_FROM = 2018


def seed():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        existing = session.query(IloIndicatorValue).count()
        if existing:
            print(f"ILO indicator values already exist ({existing} rows). Skipping.")
            return

        total_rows = 0
        for filename, indicator_type in INDICATOR_FILES:
            filepath = DATA_DIR / filename
            if not filepath.exists():
                print(f"Warning: {filepath} not found, skipping {indicator_type.value}")
                continue

            records = []
            row_count = 0
            with open(filepath, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    time_val = int(row.get("time", 0))
                    if time_val < YEAR_FROM:
                        continue

                    sex = row.get("sex.label", "Total")

                    classif1 = row.get("classif1.label", "")
                    classif2 = row.get("classif2.label", "")

                    # For indicator_02, map occupation labels to 1-digit ISCO codes
                    if indicator_type == IndicatorType.INDICATOR_02 and classif1:
                        classif1 = OCCUPATION_GROUP_MAP.get(classif1, classif1)

                    obs_raw = row.get("obs_value", "")
                    obs_value = None
                    if obs_raw and obs_raw.strip():
                        try:
                            obs_value = float(obs_raw)
                        except ValueError:
                            pass

                    records.append(
                        IloIndicatorValue(
                            indicator_type=indicator_type,
                            ref_area_label=row.get("ref_area.label", ""),
                            sex_label=sex,
                            classif1_label=classif1 or None,
                            classif2_label=classif2 or None,
                            time=time_val,
                            obs_value=obs_value,
                        )
                    )
                    row_count += 1

            if records:
                session.add_all(records)
                session.commit()
                print(f"{indicator_type.value}: {len(records)} rows (read {row_count} total)")
                total_rows += len(records)
            else:
                print(f"{indicator_type.value}: no valid rows found")

        print(f"\nTotal: {total_rows} rows seeded")


if __name__ == "__main__":
    seed()
