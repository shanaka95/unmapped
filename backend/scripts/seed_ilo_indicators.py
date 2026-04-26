"""Seed ilo_indicator_values table from rplumber API CSV files.

This replaces the old approach of downloading from ilostat.ilo.org bulk download.
CSVs are fetched by scripts/fetch_ilo_data.py from https://rplumber.ilo.org/

Expected CSV columns (from rplumber API):
  ref_area.label, sex.label, classif1.label, classif2.label, time, obs_value

The rplumber API has restructured indicator codes. The mapping:
  indicator_02: EMP_TEMP_SEX_OC2_NB_A  — Employment by ISCO-08 level 2 (2-digit)
  indicator_04: UNE_TUNE_SEX_AGE_EDU_NB_A — Unemployment by sex, age, education
  indicator_10: LUU_XLU3_SEX_AGE_EDU_RT_A — Combined rate of unemployment + potential LF
  indicator_11: EIP_NEET_SEX_AGE_NB_A — Youth NEET
  indicator_12: EIP_TRES_SEX_AGE_NB_A  — Combined status (not available in rplumber)
  indicator_13: TRU_TTRU_SEX_AGE_EDU_NB_A — Time-related underemployment
  indicator_14: EOP_TOWK_SEX_SECTOR_NB_A — Own-use producers (not available)
  indicator_15: EMP_TEMP_SEX_HOW_EDU_NB_A — Average weekly hours worked

Usage:
  python scripts/seed_ilo_indicators.py
"""

import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.ilo_indicator import IloIndicatorValue, IndicatorType

OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "ilo"

# ISCO-08 1-digit occupation group labels -> ISCO digit codes
# Used for mapping OC2_ISCO08_XX classif1 values from indicator_02
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

# Map rplumber API sex codes to seed script expected values
SEX_MAP = {
    "SEX_T": "Total",
    "SEX_M": "Male",
    "SEX_F": "Female",
}

# Map OC2 ISCO08 2-digit codes to 1-digit group codes
def oc2_to_isco_group(code: str) -> str | None:
    """Convert OC2_ISCO08_XX to 1-digit ISCO group code."""
    if not code or "TOTAL" in code:
        return None
    # OC2_ISCO08_01 -> 0, OC2_ISCO08_11 -> 1, etc.
    parts = code.split("_")
    if len(parts) >= 1:
        last = parts[-1]
        if len(last) == 2 and last.isdigit():
            return last[0]
    return None


INDICATOR_FILES = [
    ("indicator_02_clean.csv", IndicatorType.INDICATOR_02, True),   # has OC2, needs mapping
    ("indicator_04_clean.csv", IndicatorType.INDICATOR_04, False),
    ("indicator_10_clean.csv", IndicatorType.INDICATOR_10, False),
    ("indicator_11_clean.csv", IndicatorType.INDICATOR_11, False),
    ("indicator_12_clean.csv", IndicatorType.INDICATOR_12, False),  # may not exist
    ("indicator_13_clean.csv", IndicatorType.INDICATOR_13, False),
    ("indicator_14_clean.csv", IndicatorType.INDICATOR_14, False),  # may not exist
    ("indicator_15_clean.csv", IndicatorType.INDICATOR_15, False),
]


def seed():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        existing = session.query(IloIndicatorValue).count()
        if existing:
            print(f"ILO indicator values already exist ({existing} rows). Skipping.")
            return

        total_rows = 0
        for filename, indicator_type, is_occupation in INDICATOR_FILES:
            filepath = OUT_DIR / filename
            if not filepath.exists():
                print(f"Warning: {filepath} not found, skipping {indicator_type.value}")
                continue

            records = []
            row_count = 0
            skipped_years = 0
            with open(filepath, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    time_val = int(row.get("time", 0))
                    if time_val < 2018:
                        skipped_years += 1
                        continue

                    sex_raw = row.get("sex.label", "")
                    sex = SEX_MAP.get(sex_raw, sex_raw)

                    classif1 = row.get("classif1.label", "")
                    classif2 = row.get("classif2.label", "")

                    # For indicator_02 (employment by occupation), map OC2 2-digit to 1-digit ISCO
                    if is_occupation and classif1:
                        isco_group = oc2_to_isco_group(classif1)
                        if isco_group is None:
                            # Skip TOTAL or unmapped
                            continue
                        classif1 = isco_group
                    else:
                        classif1 = classif1 or None

                    classif2 = classif2 or None

                    obs_raw = row.get("obs_value", "")
                    obs_value = None
                    if obs_raw and obs_raw.strip():
                        try:
                            obs_value = float(obs_raw)
                        except ValueError:
                            pass

                    ref_area = row.get("ref_area.label", "")
                    if not ref_area:
                        continue

                    records.append(
                        IloIndicatorValue(
                            indicator_type=indicator_type,
                            ref_area_label=ref_area,
                            sex_label=sex,
                            classif1_label=classif1,
                            classif2_label=classif2,
                            time=time_val,
                            obs_value=obs_value,
                        )
                    )
                    row_count += 1

            if records:
                session.add_all(records)
                session.commit()
                print(f"{indicator_type.value}: {len(records)} rows seeded ({row_count} read, {skipped_years} pre-2018 skipped)")
                total_rows += len(records)
            else:
                print(f"{indicator_type.value}: no valid rows found")

        print(f"\nTotal: {total_rows} rows seeded")


if __name__ == "__main__":
    seed()
