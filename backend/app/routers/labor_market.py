"""Labor market signals router."""

from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user_id
from app.services.labor_market_signals import generate_signals, generate_automation_risk

router = APIRouter(prefix="/api/labor-market", tags=["labor-market"])


class AutomationRiskRequest(BaseModel):
    selected_code: str
    selected_title: str
    recommendations: list[dict]


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


@router.post("/automation-risk")
def get_automation_risk(
    data: AutomationRiskRequest,
    user_id: int = Depends(get_current_user_id),
):
    """
    Get automation risk analysis for the selected occupation and alternatives.

    Returns:
    - Risk score for selected occupation (with analysis)
    - Risk scores for all alternative recommendations (with analysis)
    - Overall comparison summary
    """
    result = generate_automation_risk(
        user_id=user_id,
        selected_code=data.selected_code,
        selected_title=data.selected_title,
        recommendations=data.recommendations,
    )
    return result
