"""Fetch ILO indicator data from the rplumber API and save as CSV.

API endpoint: https://rplumber.ilo.org/data/indicator
Metadata:   https://rplumber.ilo.org/metadata/toc/indicator?lang=en&format=.csv

This replaces the old seed script which expected CSV files from ilostat.ilo.org bulk download.
The rplumber API provides the same data directly.

Usage:
  python scripts/fetch_ilo_data.py                      # fetch all indicators
  python scripts/fetch_ilo_data.py --indicator EMP_TEMP_SEX_OC2_NB_A  # fetch one indicator
  python scripts/fetch_ilo_data.py --country GHA          # filter by country

The script creates data/ilo/ directory and saves CSV files matching the format
expected by seed_ilo_indicators.py:
  ref_area.label, sex.label, classif1.label, classif2.label, time, obs_value

For indicator_02 (employment by occupation), we use EMP_TEMP_SEX_OC2_NB_A (ISCO-08 level 2).
The classif1 values (OC2_ISCO08_XX) are mapped to 1-digit ISCO group codes internally
by seed_ilo_indicators.py using OCCUPATION_GROUP_MAP.
"""

import csv
import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests

OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "ilo"
BASE_URL = "https://rplumber.ilo.org/data/indicator"
YEAR_FROM = 2018
YEAR_TO = 2024

# Map our indicator names to rplumber API indicator IDs
# These were found by querying the metadata endpoint
INDICATORS = {
    # indicator_02: Employment by occupation (ISCO level 2)
    # Maps classif1 OC2_ISCO08_XX to 1-digit ISCO groups in seed script
    "indicator_02": "EMP_TEMP_SEX_OC2_NB_A",
    # indicator_04: Unemployment by sex, age, education
    "indicator_04": "UNE_TUNE_SEX_AGE_EDU_NB_A",
    # indicator_10: Potential labour force (combined unemployment + potential LF)
    "indicator_10": "LUU_XLU3_SEX_AGE_EDU_RT_A",
    # indicator_11: NEET (youth not in employment, education or training)
    "indicator_11": "EIP_NEET_SEX_AGE_NB_A",
    # indicator_12: Combined employment/unemployment/inactivity status
    "indicator_12": "EIP_TRES_SEX_AGE_NB_A",
    # indicator_13: Time-related underemployment
    "indicator_13": "TRU_TTRU_SEX_AGE_EDU_NB_A",
    # indicator_14: Own-use producers (subsistence agriculture)
    "indicator_14": "EOP_TOWK_SEX_SECTOR_NB_A",
    # indicator_15: Average weekly hours worked
    "indicator_15": "EMP_TEMP_SEX_HOW_EDU_NB_A",
}

# ISCO-08 1-digit occupation group labels -> ISCO digit codes (used in seed script)
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

# Reverse map: OC2_ISCO08_XX -> 1-digit ISCO code
def oc2_to_isco_group(oc2_value: str) -> str | None:
    """Convert OC2_ISCO08_XX to 1-digit ISCO group code."""
    if not oc2_value:
        return None
    # OC2_ISCO08_TOTAL -> None (skip)
    if "TOTAL" in oc2_value:
        return None
    # OC2_ISCO08_XX where XX is 2-digit ISCO code -> take first digit
    parts = oc2_value.split("_")
    if len(parts) >= 2:
        code = parts[-1]  # e.g., "01", "11", "21"
        if len(code) == 2 and code.isdigit():
            return code[0]  # Return 1st digit as 1-digit ISCO group
    return None


def fetch_indicator(indicator_id: str, countries: list[str] | None = None) -> list[dict]:
    """Fetch indicator data from rplumber API."""
    params = {
        "id": indicator_id,
        "format": ".csv",
        "latestyear": "FALSE",  # We want all years, not just latest
    }
    if countries:
        params["ref_area"] = ",".join(countries)

    url = f"{BASE_URL}?id={indicator_id}&format=.csv"
    if countries:
        url += f"&ref_area={','.join(countries)}"

    print(f"  Fetching {indicator_id}...", end=" ", flush=True)
    try:
        resp = requests.get(url, timeout=120)
        resp.raise_for_status()
        print(f"OK ({resp.text.count(chr(10))} rows)")
        return parse_csv(resp.text)
    except Exception as e:
        print(f"FAILED: {e}")
        return []


def parse_csv(csv_text: str) -> list[dict]:
    """Parse rplumber CSV response into list of dicts."""
    reader = csv.DictReader(io.StringIO(csv_text))
    rows = []
    for row in reader:
        time_val = int(row.get("time", 0))
        if time_val < YEAR_FROM:
            continue

        obs_raw = row.get("obs_value", "")
        obs_value = None
        if obs_raw and obs_raw.strip():
            try:
                obs_value = float(obs_raw)
            except ValueError:
                pass

        rows.append({
            "ref_area.label": row.get("ref_area", ""),
            "sex.label": map_sex(row.get("sex", "")),
            "classif1.label": row.get("classif1", ""),
            "classif2.label": row.get("classif2", ""),
            "time": time_val,
            "obs_value": obs_value,
        })
    return rows


def map_sex(sex_code: str) -> str:
    """Map API sex codes to seed script expected values."""
    mapping = {
        "SEX_T": "Total",
        "SEX_M": "Male",
        "SEX_F": "Female",
    }
    return mapping.get(sex_code, sex_code)


def save_csv(rows: list[dict], output_path: Path):
    """Save rows to CSV in format expected by seed_ilo_indicators.py."""
    if not rows:
        output_path.write_text("")
        return

    fieldnames = ["ref_area.label", "sex.label", "classif1.label", "classif2.label", "time", "obs_value"]
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            if row.get("ref_area.label"):
                writer.writerow(row)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Fetch ILO indicator data from rplumber API")
    parser.add_argument("--indicator", type=str, default=None, help="Fetch specific indicator only")
    parser.add_argument("--country", type=str, default=None, help="Filter by country code (e.g., GHA)")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    indicators_to_fetch = {args.indicator: INDICATORS[args.indicator]} if args.indicator else INDICATORS
    countries = [args.country.upper()] if args.country else None

    print(f"Fetching ILO data from {YEAR_FROM} to {YEAR_TO}")
    print(f"Output directory: {OUT_DIR}\n")

    for indicator_name, indicator_id in indicators_to_fetch.items():
        output_file = OUT_DIR / f"{indicator_name}_clean.csv"

        if output_file.exists():
            print(f"  {indicator_name}_clean.csv already exists, skipping")
            continue

        rows = fetch_indicator(indicator_id, countries)
        if rows:
            save_csv(rows, output_file)
            print(f"  -> Saved {len(rows)} rows to {indicator_name}_clean.csv")
        else:
            print(f"  -> No valid rows for {indicator_name}")

    print("\nDone. Run `python scripts/seed_ilo_indicators.py` to ingest the data.")


if __name__ == "__main__":
    main()
