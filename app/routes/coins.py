"""
Route: /api/users/{user_id}/balance
=====================================
Returns the computed coin balance for a given user.
"""
from fastapi import APIRouter

from app import services
from app.schemas import CoinBalance

router = APIRouter(prefix="/api/users", tags=["Coins"])


@router.get(
    "/{user_id}/balance",
    response_model=CoinBalance,
    summary="Get a user's current coin balance",
)
def get_balance(user_id: int):
    """
    Returns the **live coin balance** for a user.

    Calculation rule: **1 coin per ₹100** spent across all `SUCCESS` transactions,
    minus coins already redeemed.
    """
    return services.get_coin_balance(user_id)
