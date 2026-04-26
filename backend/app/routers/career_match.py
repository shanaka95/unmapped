"""Career match router."""

from concurrent.futures import ThreadPoolExecutor
from typing import Any

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user_id
from app.services.career_match import find_career_matches

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.post("/career-match")
def career_match(user_id: int = Depends(get_current_user_id)):
    """
    Find the best career matches for the current user.

    Returns AI-analyzed top 3 occupation recommendations based on
    vector similarity search across work experience, informal work,
    and self-taught skills.
    """
    result = find_career_matches(user_id)
    return result
