"""Seed the education_levels table with humanized entries mapped to ISCED levels."""

from sqlalchemy import select, text

from app.database import SessionLocal
from app.models.education_level import EducationLevel

LEVELS = [
    {
        "name": "No Formal Education",
        "description": "I have not attended any formal school or early childhood education program.",
        "isced_level_code": 0,
    },
    {
        "name": "Pre-School / Kindergarten",
        "description": "I attended early childhood education such as pre-school or kindergarten before starting primary school.",
        "isced_level_code": 0,
    },
    {
        "name": "Primary School",
        "description": "I completed primary school, which is the first stage of formal education usually covering grades 1 through 6.",
        "isced_level_code": 1,
    },
    {
        "name": "Middle School",
        "description": "I completed lower secondary education, also known as middle school or junior high school.",
        "isced_level_code": 2,
    },
    {
        "name": "O-Levels / Ordinary Level",
        "description": "I completed ordinary level secondary education, typically ending around age 16 with national exams such as O-Levels or GCSEs.",
        "isced_level_code": 3,
    },
    {
        "name": "High School Diploma",
        "description": "I completed upper secondary education and received a high school diploma or equivalent qualification such as A-Levels.",
        "isced_level_code": 3,
    },
    {
        "name": "A-Levels / Advanced Level",
        "description": "I completed advanced level secondary education with specialized subjects, preparing for university entrance.",
        "isced_level_code": 3,
    },
    {
        "name": "Vocational Certificate",
        "description": "I completed a post-secondary vocational or technical certificate program that is below the bachelor's level.",
        "isced_level_code": 4,
    },
    {
        "name": "Foundation / Access Course",
        "description": "I completed a foundation or access course that prepares students for entry into a bachelor's degree program.",
        "isced_level_code": 4,
    },
    {
        "name": "Diploma",
        "description": "I completed a short-cycle tertiary program such as a diploma, typically lasting 1 to 2 years at a college or technical institute.",
        "isced_level_code": 5,
    },
    {
        "name": "Higher Diploma / Advanced Diploma",
        "description": "I completed a higher or advanced diploma, which is a more specialized short-cycle tertiary qualification.",
        "isced_level_code": 5,
    },
    {
        "name": "Bachelor's Degree",
        "description": "I have completed my bachelor's degree at a university. This is typically a 3 to 4 year undergraduate program.",
        "isced_level_code": 6,
    },
    {
        "name": "Bachelor's Degree (Honours)",
        "description": "I completed a bachelor's degree with honours, involving additional research or higher academic achievement.",
        "isced_level_code": 6,
    },
    {
        "name": "Postgraduate Diploma",
        "description": "I completed a postgraduate diploma after my bachelor's degree, providing specialized professional knowledge.",
        "isced_level_code": 7,
    },
    {
        "name": "Master's Degree",
        "description": "I have completed my master's degree. This is an advanced academic program typically requiring 1 to 2 years of study after a bachelor's degree.",
        "isced_level_code": 7,
    },
    {
        "name": "MBA / Professional Master's",
        "description": "I completed a professional master's degree such as an MBA, designed for career advancement in business or other professional fields.",
        "isced_level_code": 7,
    },
    {
        "name": "PhD / Doctorate",
        "description": "I have completed my doctoral degree (PhD). This is the highest level of academic achievement, involving original research and a thesis.",
        "isced_level_code": 8,
    },
    {
        "name": "Professional Doctorate",
        "description": "I completed a professional doctorate such as an MD, JD, or EdD, focused on advanced professional practice rather than academic research.",
        "isced_level_code": 8,
    },
]


def seed():
    with SessionLocal() as session:
        existing = session.scalar(text("SELECT COUNT(*) FROM education_levels"))
        if existing:
            print(f"Education levels already exist ({existing} found). Skipping.")
            return

        from app.models.isced_level import IscedLevel
        isced_map = {
            il.level: il.id
            for il in session.scalars(select(IscedLevel)).all()
        }

        records = []
        for data in LEVELS:
            isced_id = isced_map.get(data["isced_level_code"])
            if isced_id is None:
                continue
            records.append(EducationLevel(
                name=data["name"],
                description=data["description"],
                isced_level_id=isced_id,
            ))

        session.add_all(records)
        session.commit()
        print(f"Seeded {len(records)} education levels.")


if __name__ == "__main__":
    seed()
