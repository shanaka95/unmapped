"""Labor market signals router."""

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user_id
from app.services.labor_market_signals import generate_signals

router = APIRouter(prefix="/api/labor-market", tags=["labor-market"])


@router.get("/signals")
def get_labor_market_signals(
    isco_code: str = Query(
        ..., description="ISCO occupation code (e.g., 2142 or 2411.2)"
    ),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get labor market signals for a specific occupation in the user's country.

    Returns data-driven insights including:
    - Current employment outlook for the occupation group
    - Regional/area comparison within the country
    - Migration recommendation with reasoning
    - Gender gap analysis
    - Underemployment and working time indicators

    All data points include citations to the source ILO indicator files.
    """
    result = generate_signals(user_id, isco_code)
    return result
