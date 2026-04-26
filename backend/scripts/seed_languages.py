"""Seed languages table and language_country junction from Ethnologue tab files."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.language import Language
from app.models.country import Country
from app.models.association import language_country

TAB_DIR = Path(__file__).resolve().parent.parent / "data" / "ethnologue"
LANGUAGE_CODES_FILE = TAB_DIR / "LanguageCodes.tab"
LANGUAGE_INDEX_FILE = TAB_DIR / "LanguageIndex.tab"


def seed():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        existing = session.query(Language).count()
        if existing:
            print(f"Languages already exist ({existing} rows). Skipping.")
            return

        # Read LanguageCodes.tab for language info
        print(f"Reading languages from {LANGUAGE_CODES_FILE}...")
        lang_code_to_id = {}
        batch = []
        seen = set()
        with open(LANGUAGE_CODES_FILE, "r", encoding="utf-8") as f:
            header = f.readline().strip().split("\t")
            for line in f:
                parts = line.strip().split("\t")
                if len(parts) < 4:
                    continue
                lang_id = parts[0]  # ISO 639-3 code
                name = parts[3]
                if not lang_id or not name or lang_id in seen:
                    continue
                seen.add(lang_id)
                lang = Language(code=lang_id, name=name)
                batch.append(lang)
                lang_code_to_id[lang_id] = len(batch) - 1

        session.add_all(batch)
        session.commit()
        print(f"Seeded {len(batch)} languages")

        # Build language_id lookup: code -> db id
        lang_rows = {row.code: row.id for row in session.query(Language).all()}

        # Build country_id lookup: code (alpha-2) -> db id
        country_rows = {row.code: row.id for row in session.query(Country).all()}

        # Read LanguageIndex.tab for country-language mappings
        print(f"Reading language-country mappings from {LANGUAGE_INDEX_FILE}...")
        mappings = set()
        with open(LANGUAGE_INDEX_FILE, "r", encoding="utf-8") as f:
            header = f.readline().strip().split("\t")
            for line in f:
                parts = line.strip().split("\t")
                if len(parts) < 2:
                    continue
                lang_code = parts[0]
                country_code = parts[1]
                if lang_code in lang_rows and country_code in country_rows:
                    mappings.add((lang_rows[lang_code], country_rows[country_code]))

        # Insert junction entries
        print(f"Inserting {len(mappings)} language-country mappings...")
        for lang_id, country_id in mappings:
            session.execute(
                language_country.insert().values(language_id=lang_id, country_id=country_id)
            )
        session.commit()
        print("Done seeding language-country mappings.")


if __name__ == "__main__":
    seed()
