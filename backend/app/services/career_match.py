"""Career match service — uses vector search + Minimax AI to recommend occupations."""

import json
from concurrent.futures import ThreadPoolExecutor

from openai import OpenAI
from sqlalchemy import select

from app.config import get_settings
from app.database import SessionLocal
from app.models.education_level import EducationLevel
from app.models.isco_occupation import IscoOccupation
from app.models.language import Language
from app.models.user import User
from app.models.user_profile import UserProfile, UserLanguage
from app.models.work_experience import WorkExperience
from app.services.ai_minimax import chat as minimax_chat
from app.services.vector_store import get_embedding, get_occupations_collection

settings = get_settings()

# OpenRouter client for embeddings
openai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)


def _build_query_text(
    work_exp: dict | None,
    education: str | None,
    informal_work: str | None,
    self_taught: str | None,
) -> str:
    """Build a combined query text from user data."""
    parts = []
    if work_exp:
        if work_exp.get("job_title"):
            parts.append(f"Job: {work_exp['job_title']}")
        if work_exp.get("company"):
            parts.append(f"Company: {work_exp['company']}")
        if work_exp.get("industry"):
            parts.append(f"Industry: {work_exp['industry']}")
    if education:
        parts.append(f"Education: {education}")
    if informal_work:
        parts.append(f"Informal work: {informal_work}")
    if self_taught:
        parts.append(f"Self-taught skills: {self_taught}")
    return "\n".join(parts)


def _query_vector(text: str, n: int = 5) -> list[dict]:
    """Query the vector store for top-N matching occupations."""
    collection = get_occupations_collection()
    embedding = get_embedding(text)
    results = collection.query(
        query_embeddings=[embedding],
        n_results=n,
        include=["metadatas", "documents", "distances"],
    )
    matches = []
    if results["ids"] and results["ids"][0]:
        for i, occ_id in enumerate(results["ids"][0]):
            matches.append({
                "id": occ_id,
                "isco_code": results["metadatas"][0][i]["isco_code"],
                "title": results["metadatas"][0][i]["title"],
                "level": results["metadatas"][0][i]["level"],
                "distance": results["distances"][0][i],
            })
    return matches


def _get_full_occupation(isco_code: str) -> IscoOccupation | None:
    """Fetch a full occupation record from DB by ISCO code."""
    with SessionLocal() as session:
        return session.execute(
            select(IscoOccupation).where(IscoOccupation.code == isco_code)
        ).scalars().first()


def _get_occupation_schema(isco_code: str) -> dict | None:
    """Get occupation details as a dict for AI analysis."""
    occ = _get_full_occupation(isco_code)
    if not occ:
        return None
    return {
        "isco_code": occ.code,
        "title": occ.title,
        "definition": occ.definition,
        "level": occ.level,
    }


def _build_user_context(
    profile: UserProfile,
    languages: list[str],
    work_experiences: list[dict],
    education_name: str | None,
) -> str:
    """Build a full user context string for the AI."""
    lines = []

    # Personal
    lines.append(f"Date of birth: {profile.date_of_birth}")
    if profile.country:
        lines.append(f"Country: {profile.country}")
    if profile.region:
        lines.append(f"Region: {profile.region}")
    if profile.city:
        lines.append(f"City: {profile.city}")
    if profile.settlement_type:
        lines.append(f"Settlement type: {profile.settlement_type}")

    # Languages
    if languages:
        lines.append(f"Languages: {', '.join(languages)}")

    # Education
    if education_name:
        lines.append(f"Education level: {education_name}")

    # Work experiences
    if work_experiences:
        lines.append("Work experiences:")
        for exp in work_experiences:
            parts = []
            if exp.get("job_title"):
                parts.append(exp["job_title"])
            if exp.get("company"):
                parts.append(f"at {exp['company']}")
            if exp.get("industry"):
                parts.append(f"in {exp['industry']}")
            date_str = ""
            sd = exp.get("start_date")
            if sd:
                date_str = str(sd) if not isinstance(sd, str) else sd
            if exp.get("is_current"):
                date_str += " - Current"
            elif exp.get("end_date"):
                date_str += f" - {exp['end_date']}"
            if parts:
                lines.append(f"  - {' '.join(parts)} ({date_str})")

    # Informal work
    if profile.informal_work:
        lines.append(f"Informal work: {profile.informal_work}")

    # Self-taught skills
    if profile.self_taught_skills:
        lines.append(f"Self-taught skills: {profile.self_taught_skills}")

    return "\n".join(lines)


def generate_user_profile(
    user_name: str,
    date_of_birth,
    country: str | None,
    region: str | None,
    city: str | None,
    settlement_type: str | None,
    language_names: list[str],
    work_exp_dicts: list[dict],
    education_name: str | None,
    informal_work: str | None,
    self_taught_skills: str | None,
) -> str:
    """Ask Minimax AI to generate a precise, well-structured user profile summary."""
    # Build raw user data string
    lines = []
    lines.append(f"Name: {user_name}")
    if date_of_birth:
        lines.append(f"Date of birth: {date_of_birth}")
    if country:
        lines.append(f"Country: {country}")
    if region:
        lines.append(f"Region: {region}")
    if city:
        lines.append(f"City: {city}")
    if settlement_type:
        lines.append(f"Settlement type: {settlement_type}")
    if language_names:
        lines.append(f"Languages: {', '.join(language_names)}")
    if education_name:
        lines.append(f"Education level: {education_name}")

    if work_exp_dicts:
        lines.append("Work experiences:")
        for exp in work_exp_dicts:
            parts = []
            if exp.get("job_title"):
                parts.append(exp["job_title"])
            if exp.get("company"):
                parts.append(f"at {exp['company']}")
            if exp.get("industry"):
                parts.append(f"in {exp['industry']}")
            date_str = ""
            sd = exp.get("start_date")
            if sd:
                date_str = str(sd) if not isinstance(sd, str) else sd
            if exp.get("is_current"):
                date_str += " - Current"
            elif exp.get("end_date"):
                date_str += f" - {exp['end_date']}"
            if parts:
                lines.append(f"  - {' '.join(parts)} ({date_str})")

    if informal_work:
        lines.append(f"Informal work experience: {informal_work}")
    if self_taught_skills:
        lines.append(f"Self-taught skills: {self_taught_skills}")

    raw_data = "\n".join(lines)

    prompt = f"""Analyze the following raw user data and generate a precise, well-structured profile summary. This summary will be used to find matching career occupations via vector search.

RAW USER DATA:
{raw_data}

Produce a concise but comprehensive profile that:
- Describes who the user is (name, approximate age from DOB, location)
- Summarizes their educational background and qualifications
- Details their work experience, key roles, industries, and responsibilities
- Highlights informal work experience and self-taught skills
- Lists their language capabilities
- Identifies their core competencies, transferable skills, and areas of expertise
- Infers career interests and trajectory from the available data

Return ONLY the profile summary as a single paragraph (no markdown, no code blocks, no JSON, no extra text). Write it in a way that would be effective for semantic matching against occupation descriptions — include specific skills, industries, role types, and domains rather than generic statements."""

    try:
        response = minimax_chat(
            prompt=prompt,
            system="You are a user profile generation AI. Return ONLY a plain-text profile summary paragraph, nothing else.",
            temperature=0.3,
            max_tokens=512,
        )
        return response.strip()
    except Exception as e:
        # Fall back to raw data if AI fails
        return raw_data


def analyze_matches(
    user_profile_summary: str,
    top_matches: list[dict],
    work_experiences: list[dict],
) -> dict:
    """Ask Minimax AI to analyze the top 10 matches and produce top 3 recommendations."""
    # Build the match list with full occupation details
    matches_text = ""
    for rank, m in enumerate(top_matches[:10], 1):
        occ = _get_full_occupation(m["isco_code"])
        if occ:
            seniority_hint = ""
            if occ.level == 1:
                seniority_hint = " (Major group — broad occupational category, entry-level)"
            elif occ.level == 2:
                seniority_hint = " (Sub-Major group — general occupational area)"
            elif occ.level == 3:
                seniority_hint = " (Minor group — specific occupational field, mid-level)"
            elif occ.level == 4:
                seniority_hint = " (Unit group — highly specialized role, senior/specialist level)"

            matches_text += f"\n{rank}. {occ.title} (ISCO: {occ.code}){seniority_hint}"
            if occ.definition:
                matches_text += f"\n   Definition: {occ.definition[:300]}"
            if occ.tasks_include:
                matches_text += f"\n   Tasks include: {occ.tasks_include[:300]}"
            if occ.included_occupations:
                matches_text += f"\n   Included roles: {occ.included_occupations[:200]}"
            matches_text += f"\n   Vector similarity score: {1 - m['distance']:.3f}"
            matches_text += "\n"

    # Build seniority context from work experiences
    seniority_context = ""
    if work_experiences:
        years_total = 0
        roles = []
        for exp in work_experiences:
            roles.append(exp.get("job_title", "Unknown"))
            if exp.get("start_date"):
                try:
                    from datetime import date
                    start = date.fromisoformat(exp["start_date"])
                    end = date.fromisoformat(exp["end_date"]) if exp.get("end_date") and not exp.get("is_current") else date.today()
                    years_total += (end - start).days / 365
                except Exception:
                    pass
        seniority_context = f"""
SENIORITY ANALYSIS:
- User has approximately {years_total:.1f} years of total work experience.
- Previous roles: {', '.join(r for r in roles if r)}
- This experience level should guide whether entry-level, mid-level, senior, or specialist occupations are appropriate.
- If experience is < 2 years: lean toward entry-level (level 1-2) or junior roles.
- If experience is 2-5 years: mid-level (level 2-3) roles are appropriate.
- If experience is 5+ years: senior/specialist (level 3-4) roles are suitable.
- Also consider whether the user's roles show progression (increasing responsibility) or are at a stable level.
"""

    prompt = f"""You are a career advisor AI. Analyze the following user profile summary and the top 10 matching occupations found through vector similarity search.

USER PROFILE SUMMARY (AI-generated from their complete background):
{user_profile_summary}

{seniority_context}

TOP MATCHING OCCUPATIONS (ranked by vector similarity):
{matches_text}

Analyze these matches and produce your top 3 recommendations. Consider:
1. How well the occupation matches the user's actual skills, experience, and education
2. The user's seniority level — match the occupation's ISCO level to their years of experience and role progression. A person with 10 years of management experience should not be recommended entry-level roles, and a fresh graduate should not be pushed into highly specialized specialist roles unless their background justifies it.
3. Growth potential and AI-resilience of the occupation
4. How realistic the match is given the user's context (location, settlement type, etc.)
5. Whether the occupation represents a natural progression from their current/past roles, or a realistic lateral move

For EACH recommendation, provide a deep but concise analysis that:
- Explains WHY this specific occupation was matched (reference the user's specific skills, experience, education, or background)
- Explains WHY it is placed at rank 1, 2, or 3 (what makes it the best/second/third choice)
- Addresses seniority: whether this role is appropriate for their experience level, and whether it represents growth, lateral movement, or a stepping stone
- If the match is at a different seniority level, explain WHY it still makes sense (e.g., transferable skills, market demand, learning curve)

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text) in this exact format:

{{
  "recommendations": [
    {{
      "rank": 1,
      "isco_code": "string",
      "title": "string",
      "confidence": "high" | "medium" | "low",
      "seniority_fit": "entry-level" | "mid-level" | "senior" | "specialist",
      "reason": "A deep but concise analysis (3-4 sentences) explaining the match, why this rank, and how it fits the user's seniority and career trajectory."
    }},
    {{
      "rank": 2,
      ...
    }},
    {{
      "rank": 3,
      ...
    }}
  ]
}}"""

    try:
        response = minimax_chat(
            prompt=prompt,
            system="You are a JSON-only career analysis AI. Return ONLY valid JSON, nothing else.",
            temperature=0.7,
            max_tokens=2048,
        )
        # Parse JSON from response
        # Handle case where AI wraps in markdown code blocks
        cleaned = response.strip()
        if cleaned.startswith("```"):
            # Remove markdown code block
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1]) if len(lines) > 2 else cleaned.strip("` \n")
        return json.loads(cleaned)
    except Exception as e:
        return {"error": str(e), "raw_response": response if 'response' in dir() else ""}


def find_career_matches(user_id: int) -> dict:
    """
    Main career matching function — two-step AI pipeline.

    Step 1: Generate AI user profile from all raw user data
    Step 2: Use AI profile for vector search (top 10)
    Step 3: Ask Minimax AI to analyze top 10 and produce top 3 recommendations
    """
    with SessionLocal() as session:
        # Fetch profile
        profile = session.execute(
            select(UserProfile)
            .where(UserProfile.user_id == user_id)
        ).scalars().first()

        if not profile:
            return {"error": "Profile not found"}

        # Fetch user name
        user = session.execute(
            select(User).where(User.id == user_id)
        ).scalars().first()
        user_name = user.name if user else "Unknown"

        # Capture profile fields as plain values (available outside session)
        profile_data = {
            "date_of_birth": profile.date_of_birth,
            "country": profile.country,
            "region": profile.region,
            "city": profile.city,
            "settlement_type": profile.settlement_type,
            "informal_work": profile.informal_work,
            "self_taught_skills": profile.self_taught_skills,
        }

        # Fetch education level
        education_name = None
        if profile.education_level_id:
            edu = session.execute(
                select(EducationLevel).where(EducationLevel.id == profile.education_level_id)
            ).scalars().first()
            if edu:
                education_name = edu.name

        # Fetch languages
        lang_records = session.execute(
            select(UserLanguage).where(UserLanguage.profile_id == profile.id)
        ).scalars().all()
        language_names = []
        for ul in lang_records:
            lang = session.execute(
                select(Language).where(Language.id == ul.language_id)
            ).scalars().first()
            if lang:
                language_names.append(lang.name)

        # Fetch work experiences
        work_exps = session.execute(
            select(WorkExperience)
            .where(WorkExperience.profile_id == profile.id)
            .order_by(WorkExperience.start_date.desc())
        ).scalars().all()
        work_exp_dicts = []
        for we in work_exps:
            work_exp_dicts.append({
                "job_title": we.job_title,
                "company": we.company,
                "industry": we.industry,
                "start_date": we.start_date,
                "end_date": we.end_date,
                "is_current": we.is_current,
            })

    # --- Step 1: Generate AI user profile ---
    user_profile_summary = generate_user_profile(
        user_name=user_name,
        date_of_birth=profile_data["date_of_birth"],
        country=profile_data["country"],
        region=profile_data["region"],
        city=profile_data["city"],
        settlement_type=profile_data["settlement_type"],
        language_names=language_names,
        work_exp_dicts=work_exp_dicts,
        education_name=education_name,
        informal_work=profile_data["informal_work"],
        self_taught_skills=profile_data["self_taught_skills"],
    )

    # Build raw fallback context for display purposes
    # Use a simple inline construction since profile object is detached
    user_context_lines = []
    if profile_data["date_of_birth"]:
        user_context_lines.append(f"Date of birth: {profile_data['date_of_birth']}")
    if profile_data["country"]:
        user_context_lines.append(f"Country: {profile_data['country']}")
    if profile_data["region"]:
        user_context_lines.append(f"Region: {profile_data['region']}")
    if profile_data["city"]:
        user_context_lines.append(f"City: {profile_data['city']}")
    if profile_data["settlement_type"]:
        user_context_lines.append(f"Settlement type: {profile_data['settlement_type']}")
    if language_names:
        user_context_lines.append(f"Languages: {', '.join(language_names)}")
    if education_name:
        user_context_lines.append(f"Education level: {education_name}")
    if work_exp_dicts:
        user_context_lines.append("Work experiences:")
        for exp in work_exp_dicts:
            parts = []
            if exp.get("job_title"):
                parts.append(exp["job_title"])
            if exp.get("company"):
                parts.append(f"at {exp['company']}")
            if exp.get("industry"):
                parts.append(f"in {exp['industry']}")
            sd = exp.get("start_date")
            date_str = str(sd) if sd else ""
            if exp.get("is_current"):
                date_str += " - Current"
            elif exp.get("end_date"):
                ed = exp["end_date"]
                date_str += f" - {ed}"
            if parts:
                user_context_lines.append(f"  - {' '.join(parts)} ({date_str})")
    if profile_data["informal_work"]:
        user_context_lines.append(f"Informal work: {profile_data['informal_work']}")
    if profile_data["self_taught_skills"]:
        user_context_lines.append(f"Self-taught skills: {profile_data['self_taught_skills']}")
    user_context = "\n".join(user_context_lines)

    # --- Step 2: Vector search using AI-generated profile ---
    all_matches: dict[str, dict] = {}

    # Primary query: AI-generated profile
    if user_profile_summary.strip():
        primary_matches = _query_vector(user_profile_summary, n=10)
        for match in primary_matches:
            key = match["isco_code"]
            if key not in all_matches or match["distance"] < all_matches[key]["distance"]:
                all_matches[key] = match

    # Fallback: if profile was too sparse, try individual queries
    if not all_matches:
        queries = []
        for we in work_exp_dicts:
            query_text = _build_query_text(we, education_name, None, None)
            if query_text.strip():
                queries.append(query_text)
        if profile_data["informal_work"] and profile_data["informal_work"].strip():
            queries.append(profile_data["informal_work"])
        if profile_data["self_taught_skills"] and profile_data["self_taught_skills"].strip():
            queries.append(profile_data["self_taught_skills"])
        if not queries and education_name:
            queries.append(education_name)

        with ThreadPoolExecutor(max_workers=min(len(queries), 10)) as executor:
            futures = {
                executor.submit(_query_vector, q, n=5): q
                for q in queries
            }
            for future in futures:
                try:
                    results = future.result()
                    for match in results:
                        key = match["isco_code"]
                        if key not in all_matches or match["distance"] < all_matches[key]["distance"]:
                            all_matches[key] = match
                except Exception as e:
                    print(f"Vector query failed: {e}")

    # Sort by distance (lower = more similar)
    sorted_matches = sorted(all_matches.values(), key=lambda m: m["distance"])

    if not sorted_matches:
        return {
            "recommendations": [],
            "message": "Not enough information to find matches. Please complete your profile.",
        }

    # --- Step 3: AI analysis of top 10 ---
    analysis = analyze_matches(user_profile_summary, sorted_matches[:10], work_exp_dicts)

    # Enrich AI recommendations with occupation details
    recommendations = []
    if "recommendations" in analysis:
        for rec in analysis["recommendations"]:
            occ = _get_occupation_schema(rec.get("isco_code", ""))
            if occ:
                recommendations.append({
                    "rank": rec.get("rank", 0),
                    "isco_code": occ["isco_code"],
                    "title": occ["title"],
                    "definition": occ.get("definition"),
                    "level": occ.get("level"),
                    "confidence": rec.get("confidence", "medium"),
                    "seniority_fit": rec.get("seniority_fit", "mid-level"),
                    "reason": rec.get("reason", ""),
                })

    return {
        "recommendations": recommendations,
        "total_matches_found": len(sorted_matches),
        "top_matches": sorted_matches[:10],
        "user_context": user_context,
        "user_profile_summary": user_profile_summary,
    }
