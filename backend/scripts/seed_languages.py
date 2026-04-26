"""Seed languages table with ~100 most spoken languages (ISO 639-2 codes)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.language import Language

LANGUAGES = [
    ("zho", "Chinese"),
    ("spa", "Spanish"),
    ("eng", "English"),
    ("hin", "Hindi"),
    ("ara", "Arabic"),
    ("por", "Portuguese"),
    ("ben", "Bengali"),
    ("rus", "Russian"),
    ("jpn", "Japanese"),
    ("fra", "French"),
    ("deu", "German"),
    ("kor", "Korean"),
    ("tur", "Turkish"),
    ("tam", "Tamil"),
    ("tel", "Telugu"),
    ("vie", "Vietnamese"),
    ("urd", "Urdu"),
    ("guj", "Gujarati"),
    ("pol", "Polish"),
    ("ukr", "Ukrainian"),
    ("kan", "Kannada"),
    ("mal", "Malayalam"),
    ("ita", "Italian"),
    ("pan", "Punjabi (Gurmukhi)"),
    ("yor", "Yoruba"),
    ("swh", "Swahili"),
    ("mai", "Maithili"),
    ("mya", "Burmese"),
    ("tha", "Thai"),
    ("sun", "Sundanese"),
    ("aze", "Azerbaijani"),
    ("uzb", "Uzbek"),
    ("hin", "Hindi (Fiji)"),
    ("ron", "Romanian"),
    ("nld", "Dutch"),
    ("hau", "Hausa"),
    ("fas", "Persian"),
    ("amh", "Amharic"),
    ("nob", "Norwegian Bokmål"),
    ("kat", "Georgian"),
    ("ces", "Czech"),
    ("sin", "Sinhala"),
    ("som", "Somali"),
    ("hun", "Hungarian"),
    ("ell", "Greek"),
    ("kin", "Kinyarwanda"),
    ("ibo", "Igbo"),
    ("zul", "Zulu"),
    ("heb", "Hebrew"),
    ("swe", "Swedish"),
    ("dan", "Danish"),
    ("fin", "Finnish"),
    ("nor", "Norwegian"),
    ("slk", "Slovak"),
    ("bul", "Bulgarian"),
    ("hrv", "Croatian"),
    ("srp", "Serbian"),
    ("bel", "Belarusian"),
    ("sqi", "Albanian"),
    ("lit", "Lithuanian"),
    ("lav", "Latvian"),
    ("slv", "Slovenian"),
    ("est", "Estonian"),
    ("mal", "Malay"),
    ("ind", "Indonesian"),
    ("tgl", "Tagalog"),
    ("ceb", "Cebuano"),
    ("ilo", "Ilocano"),
    ("hil", "Hiligaynon"),
    ("kaz", "Kazakh"),
    ("khm", "Khmer"),
    ("lao", "Lao"),
    ("nep", "Nepali"),
    ("pus", "Pashto"),
    ("kur", "Kurdish"),
    ("kat", "Georgian"),
    ("arm", "Armenian"),
    ("mon", "Mongolian"),
    ("tzm", "Central Atlas Tamazight"),
    ("ber", "Berber"),
    ("aka", "Akan"),
    ("lug", "Ganda"),
    ("orm", "Oromo"),
    ("tir", "Tigrinya"),
    ("mlg", "Malagasy"),
    ("mri", "Maori"),
    ("haw", "Hawaiian"),
    ("smo", "Samoan"),
    ("ton", "Tongan"),
    ("fij", "Fijian"),
    ("tpi", "Tok Pisin"),
    ("bis", "Bislama"),
]


def seed():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        existing = session.query(Language).count()
        if existing:
            print(f"Languages already exist ({existing} rows). Skipping.")
            return

        seen = set()
        batch = []
        for code, name in LANGUAGES:
            if code in seen:
                continue
            seen.add(code)
            batch.append(Language(code=code, name=name))

        session.add_all(batch)
        session.commit()
        print(f"Seeded {len(batch)} languages")


if __name__ == "__main__":
    seed()
