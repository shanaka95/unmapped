"""Labor market signals service — fetches ILO data and generates AI insights."""

import json
from typing import Any

from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.ilo_indicator import IloIndicatorValue, IndicatorType
from app.models.occupation import Occupation
from app.models.user_profile import UserProfile
from app.models.automation_exposure import AutomationExposure
from app.models.work_experience import WorkExperience
from app.services.ai_minimax import chat as minimax_chat

YEAR_FROM = 2018


def _fetch_indicator_data(
    db: Session,
    indicator_type: IndicatorType,
    country: str,
    sex: str,
    classif1: str | None = None,
) -> list[dict[str, Any]]:
    """Fetch indicator data filtered by country, sex, and optionally classif1."""
    filters = [
        IloIndicatorValue.indicator_type == indicator_type,
        IloIndicatorValue.ref_area_label == country,
        IloIndicatorValue.time >= YEAR_FROM,
    ]

    if sex:
        filters.append(IloIndicatorValue.sex_label == sex)

    if classif1:
        filters.append(IloIndicatorValue.classif1_label == classif1)

    stmt = (
        select(IloIndicatorValue)
        .where(and_(*filters))
        .order_by(IloIndicatorValue.time.desc())
    )

    return [
        {
            "sex_label": row.sex_label,
            "classif1_label": row.classif1_label,
            "classif2_label": row.classif2_label,
            "time": row.time,
            "obs_value": row.obs_value,
            "citation": f"Source: ILOSTAT, {indicator_type.value}_clean.csv, {row.ref_area_label}, {row.sex_label}, {row.time}",
        }
        for row in db.execute(stmt).scalars().all()
    ]


def _format_data_for_prompt(
    data: list[dict[str, Any]], indicator_name: str
) -> str:
    """Format a list of indicator records into a readable table for the prompt."""
    if not data:
        return f"{indicator_name}: No data available."

    rows = []
    for row in sorted(data, key=lambda x: x["time"], reverse=True)[:10]:
        val = f"{row['obs_value']:.2f}" if row["obs_value"] is not None else "N/A"
        sex = row["sex_label"]
        time = row["time"]
        classif1 = row["classif1_label"] or ""
        classif2 = row["classif2_label"] or ""
        rows.append(f"| {sex} | {time} | {classif1} | {classif2} | {val} |")

    return f"{indicator_name}:\n| Sex | Year | Classif1 | Classif2 | Value |\n" + "\n".join(rows)


def generate_signals(user_id: int, isco_code: str) -> dict[str, Any]:
    """Generate labor market signals for a user's selected occupation.

    Args:
        user_id: The authenticated user's ID.
        isco_code: The selected occupation's ISCO code (e.g., "2142", "2411.2").

    Returns:
        JSON-serializable dict with employment outlook, regional comparison,
        migration recommendation, gender gap, underemployment, and working time.
    """
    db = SessionLocal()
    try:
        # Get user profile
        profile = db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        ).scalar_one_or_none()

        if not profile:
            raise ValueError("User profile not found")

        country = profile.country
        gender = profile.gender

        if not country:
            raise ValueError("User country not set in profile")

        # Map gender to ILO sex label
        sex_map = {"male": "Male", "female": "Female", "other": "Total"}
        sex_label = sex_map.get(gender.lower() if gender else "", "Total")
        total_sex_label = "Total"

        # Extract 1-digit ISCO from occupation code
        isco_digit = isco_code[0] if isco_code else "0"
        isco_digit_map = {
            "0": "Armed forces occupations",
            "1": "Managers",
            "2": "Professionals",
            "3": "Technicians and associate professionals",
            "4": "Clerical support workers",
            "5": "Service and sales workers",
            "6": "Skilled agricultural, forestry and fishery workers",
            "7": "Craft and related trades workers",
            "8": "Plant and machine operators, and assemblers",
            "9": "Elementary occupations",
        }
        isco_group_name = isco_digit_map.get(isco_digit, isco_digit)

        # Fetch occupation title
        occupation = db.execute(
            select(Occupation).where(Occupation.code == isco_code[:4])
        ).scalar_one_or_none()
        occupation_title = occupation.title if occupation else isco_code

        # Fetch relevant indicator data
        # Employment by occupation group (indicator_02)
        employment_data = _fetch_indicator_data(
            db, IndicatorType.INDICATOR_02, country, total_sex_label, isco_digit
        )
        employment_user_sex = _fetch_indicator_data(
            db, IndicatorType.INDICATOR_02, country, sex_label, isco_digit
        )

        # Unemployment (indicator_04)
        unemployment_data = _fetch_indicator_data(
            db, IndicatorType.INDICATOR_04, country, sex_label
        )

        # Potential labor force (indicator_10)
        potential_lf_data = _fetch_indicator_data(
            db, IndicatorType.INDICATOR_10, country, sex_label
        )

        # NEET (indicator_11)
        neet_data = _fetch_indicator_data(db, IndicatorType.INDICATOR_11, country, sex_label)

        # Underemployment (indicator_13)
        underemployment_data = _fetch_indicator_data(
            db, IndicatorType.INDICATOR_13, country, sex_label
        )

        # Working time (indicator_15)
        working_time_data = _fetch_indicator_data(
            db, IndicatorType.INDICATOR_15, country, sex_label
        )

        # Format data for prompt
        data_sections = []
        data_sections.append(_format_data_for_prompt(employment_data, "Employment by occupation group"))
        data_sections.append(_format_data_for_prompt(employment_user_sex, f"Employment by occupation group ({sex_label})"))
        data_sections.append(_format_data_for_prompt(unemployment_data, "Unemployment"))
        data_sections.append(_format_data_for_prompt(potential_lf_data, "Potential labor force"))
        data_sections.append(_format_data_for_prompt(neet_data, "Youth not in education/employment/training (NEET)"))
        data_sections.append(_format_data_for_prompt(underemployment_data, "Underemployment (time-related)"))
        data_sections.append(_format_data_for_prompt(working_time_data, "Average weekly hours worked"))

        system_prompt = """You are a labor market analyst AI. You will analyze ILO labor market data and provide structured insights with precise data citations.

For each data point you reference, you MUST cite it as:
Source: ILOSTAT, [filename].csv, [country], [sex], [year]

Example: "The employment rate for {isco_group_name} in Germany was 75.2% in 2021."
Source: ILOSTAT, indicator_02_clean.csv, Germany, Total, 2021

Never make up data. If you don't have data for a specific query, say so explicitly.
Format your response as a valid JSON object only — no markdown code blocks, no explanations outside the JSON."""

        user_prompt = f"""Analyze the following labor market data for the occupation group "{isco_group_name}" (ISCO-{isco_digit}) in {country}, segmented by sex.

DATA:
{chr(10).join(data_sections)}

TASK: Generate a JSON response with the following structure:

{{
  "employment_outlook": {{
    "current_rate": [most recent employment % for this occupation group, or null],
    "trend": "increasing" | "decreasing" | "stable" | "insufficient_data",
    "trend_years": [list of years with data, e.g. [2019, 2020, 2021]],
    "citation": "Source: ILOSTAT, indicator_02_clean.csv, {country}, Total, [year]"
  }},
  "regional_comparison": [
    {{
      "area_type": "Urban" | "Rural" | [area type label from data],
      "employment_rate": [rate or null],
      "recommendation": "short recommendation text",
      "citation": "full citation string"
    }}
  ],
  "migration_recommendation": {{
    "should_relocate": true | false,
    "target_areas": ["area1", "area2"] or [],
    "reasoning": "2-3 sentence explanation based on the data",
    "citations": ["citation1", "citation2"]
  }},
  "gender_gap": {{
    "male_rate": [male employment rate or null],
    "female_rate": [female employment rate or null],
    "gap_analysis": "2-3 sentence analysis of the gender disparity",
    "citation": "full citation string"
  }},
  "underemployment": {{
    "rate": [most recent underemployment rate or null],
    "citation": "citation string"
  }},
  "working_time": {{
    "avg_hours": [most recent average weekly hours or null],
    "citation": "citation string"
  }}
}}

Return ONLY valid JSON — no markdown, no text outside the JSON."""

        response = minimax_chat(
            user_prompt,
            system=system_prompt,
            temperature=0.3,
            max_tokens=2048,
        )

        # Parse JSON response
        try:
            # Try to extract JSON from response (handle any surrounding text)
            json_str = response.strip()
            if json_str.startswith("```"):
                json_str = json_str.split("```")[1]
                if json_str.startswith("json"):
                    json_str = json_str[4:]
            signals = json.loads(json_str)
        except json.JSONDecodeError:
            signals = {
                "employment_outlook": {"current_rate": None, "trend": "insufficient_data", "trend_years": [], "citation": ""},
                "regional_comparison": [],
                "migration_recommendation": {"should_relocate": False, "target_areas": [], "reasoning": "Insufficient data available.", "citations": []},
                "gender_gap": {"male_rate": None, "female_rate": None, "gap_analysis": "Insufficient data available.", "citation": ""},
                "underemployment": {"rate": None, "citation": ""},
                "working_time": {"avg_hours": None, "citation": ""},
            }

        return {
            "occupation": {
                "isco_code": isco_code,
                "title": occupation_title,
                "isco_group": isco_group_name,
                "country": country,
                "sex_label": sex_label,
            },
            "signals": signals,
        }

    finally:
        db.close()


def generate_automation_risk(
    user_id: int,
    selected_code: str,
    selected_title: str,
    recommendations: list[dict],
) -> dict:
    """Generate automation risk analysis for selected occupation and alternatives.

    Args:
        user_id: The authenticated user's ID.
        selected_code: The user's chosen ISCO code.
        selected_title: The user's chosen occupation title.
        recommendations: List of { isco_code, title } for all other suggested occupations.

    Returns:
        Dict with selected risk, all occupations risks, and summary reasoning.
    """
    db = SessionLocal()
    try:
        # Get user profile
        profile = db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        ).scalar_one_or_none()

        if not profile:
            raise ValueError("User profile not found")

        # Build all codes to fetch
        all_codes = [selected_code] + [r["isco_code"] for r in recommendations if r.get("isco_code")]

        # Fetch automation exposure data
        exposure_rows = db.execute(
            select(AutomationExposure).where(
                AutomationExposure.isco_code.in_(all_codes)
            )
        ).scalars().all()

        # Build exposure lookup
        exposure_map = {row.isco_code: {"mean": row.mean, "sd": row.sd, "gradient": row.gradient} for row in exposure_rows}

        # Fetch user's work experiences for context
        work_exps = db.execute(
            select(WorkExperience).where(WorkExperience.profile_id == profile.id)
        ).scalars().all()

        work_summary = ""
        if work_exps:
            roles = [f"{w.job_title} at {w.company}" if w.company else w.job_title for w in work_exps if w.job_title]
            work_summary = f"Work experience: {', '.join(roles)}"

        # Build occupation data with risk scores
        def build_occ_data(code: str, title: str) -> dict:
            exp = exposure_map.get(code, {"mean": None, "sd": None, "gradient": None})
            risk = exp["mean"]
            # Determine risk level
            if risk is None:
                risk_label = "unknown"
            elif risk > 0.5:
                risk_label = "high"
            elif risk > 0.3:
                risk_label = "medium"
            else:
                risk_label = "low"
            return {
                "isco_code": code,
                "title": title,
                "risk_score": risk,
                "sd": exp["sd"],
                "gradient": exp["gradient"],
                "risk_label": risk_label,
            }

        selected_data = build_occ_data(selected_code, selected_title)
        other_occs = [build_occ_data(r["isco_code"], r["title"]) for r in recommendations if r.get("isco_code") != selected_code]

        # Sort by risk_score descending (highest risk first for alternatives)
        other_occs_sorted = sorted(other_occs, key=lambda x: (x["risk_score"] is None, -(x["risk_score"] or 0)))

        # Build prompt for Minimax
        occupation_table = ""
        occupation_table += f"SELECTED (user's choice): {selected_code} — {selected_title} | Risk: {selected_data['risk_score']} | SD: {selected_data['sd']} | Gradient: {selected_data['gradient']}\n"
        for i, occ in enumerate(other_occs_sorted, 1):
            occupation_table += f"  {i}. {occ['isco_code']} — {occ['title']} | Risk: {occ['risk_score']} | SD: {occ['sd']} | Gradient: {occ['gradient']}\n"

        prompt = f"""You are an AI analyzing automation risk for career paths.

USER PROFILE:
- Name: {profile.user.name if hasattr(profile, 'user') and profile.user else 'Unknown'}
- Country: {profile.country or 'Not set'}
- Education: {profile.education_level.name if profile.education_level else 'Not set'}
- {"Languages: " + (', '.join([ul.language.name for ul in profile.languages]) if profile.languages else 'Not set')}
{f"- {work_summary}" if work_summary else ""}
{f"- Self-taught skills: {profile.self_taught_skills}" if profile.self_taught_skills else ""}
{f"- Informal work: {profile.informal_work}" if profile.informal_work else ""}

SELECTED OCCUPATION:
{selected_code} — {selected_title}
Automation risk score: {selected_data['risk_score']} (scale: 0 = no risk, 1 = maximum risk)
Standard deviation: {selected_data['sd']}
Risk trend gradient: {selected_data['gradient']}

OTHER RECOMMENDED OCCUPATIONS:
{occupation_table}

INTERPRETATION GUIDE:
- Risk > 0.5 = High automation risk (many tasks can be automated with current AI)
- Risk 0.3–0.5 = Medium risk (some tasks vulnerable, human judgment still needed)
- Risk < 0.3 = Low risk (requires human creativity, social intelligence, physical dexterity)

Your task: For each occupation, provide analysis that:
1. Explains what automation risk the occupation faces based on its score
2. Identifies which specific tasks/aspects make it more or less automatable
3. Compares the selected occupation's risk against alternatives
4. Mentions what skills or traits would help humans in these roles remain relevant

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:

{{
  "selected": {{
    "isco_code": "{selected_code}",
    "title": "{selected_title}",
    "risk_score": {selected_data['risk_score']},
    "sd": {selected_data['sd']},
    "gradient": "{selected_data['gradient'] or ''}",
    "risk_label": "{selected_data['risk_label']}",
    "analysis": "2-3 sentence analysis of this occupation's automation risk based on the score and user profile"
  }},
  "all_occupations": [
    {{
      "isco_code": "string",
      "title": "string",
      "risk_score": number,
      "sd": number or null,
      "gradient": "string or null",
      "risk_label": "high|medium|low|unknown",
      "analysis": "2-3 sentence analysis"
    }}
  ],
  "summary": "Overall comparison: why the selected path is better/worse than alternatives from automation risk perspective, considering user's background."
}}

Return ONLY JSON."""

        response = minimax_chat(
            prompt=prompt,
            system="You are an automation risk analyst. Return ONLY valid JSON, nothing else.",
            temperature=0.4,
            max_tokens=2048,
        )

        # Parse JSON response
        try:
            json_str = response.strip()
            if json_str.startswith("```"):
                json_str = json_str.split("```")[1]
                if json_str.startswith("json"):
                    json_str = json_str[4:]
            result_data = json.loads(json_str)
        except json.JSONDecodeError:
            result_data = {
                "selected": {
                    "isco_code": selected_code,
                    "title": selected_title,
                    "risk_score": selected_data["risk_score"],
                    "sd": selected_data["sd"],
                    "gradient": selected_data["gradient"],
                    "risk_label": selected_data["risk_label"],
                    "analysis": "Analysis unavailable at this time.",
                },
                "all_occupations": [
                    {**occ, "analysis": "Analysis unavailable at this time."} for occ in other_occs_sorted
                ],
                "summary": "Could not generate analysis due to a processing error.",
            }

        return result_data

    finally:
        db.close()
