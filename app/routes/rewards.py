"""
Route: /api/rewards
====================
Returns the static reward catalogue.
"""
from fastapi import APIRouter

from app import services
from app.schemas import RewardsCatalogue

router = APIRouter(prefix="/api/rewards", tags=["Rewards"])


@router.get("", response_model=RewardsCatalogue, summary="List available rewards")
def list_rewards():
    """
    Returns the full **reward catalogue** (4-6 curated items).

    Each item shows the coin cost, category, and availability flag.
    """
    return services.get_rewards_catalogue()
