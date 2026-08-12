"""
Route: /api/redemptions
========================
Handles coin-redemption requests.
"""
from fastapi import APIRouter

from app import services
from app.schemas import RedemptionRequest, RedemptionResponse

router = APIRouter(prefix="/api/redemptions", tags=["Redemptions"])


@router.post(
    "",
    response_model=RedemptionResponse,
    status_code=201,
    summary="Redeem coins for a reward",
)
def redeem_reward(payload: RedemptionRequest):
    """
    Process a **coin redemption** for a user.

    - Validates that the `reward_id` exists in the catalogue and is available.
    - Checks the user has **sufficient coin balance**.
    - Atomically inserts a redemption record and returns the updated balance.

    Returns `402` if the user's balance is too low, `404` if the reward is unknown.
    """
    return services.process_redemption(
        user_id=payload.user_id,
        reward_id=payload.reward_id,
    )


@router.get(
    "",
    summary="Get user redemptions",
)
def get_redemptions(user_id: int):
    """
    Returns the redemption history for a user.
    """
    return services.get_user_redemptions(user_id=user_id)
