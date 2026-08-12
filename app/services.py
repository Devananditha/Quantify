"""
Business-Logic (Service) Layer
================================
Sits between routes and the repository.
Handles validation, enrichment, and domain rules.
Never imports FastAPI or HTTP concerns.
"""
from fastapi import HTTPException

from app import repository
from app.database import get_db
from app.schemas import (
    CoinBalance,
    PaginatedTransactions,
    RedemptionResponse,
    RewardItem,
    RewardsCatalogue,
    TransactionOut,
)

# ---------------------------------------------------------------------------
# Static reward catalogue  (5 items — easily extended)
# ---------------------------------------------------------------------------
_CATALOGUE: list[RewardItem] = [
    RewardItem(
        reward_id=1,
        name="Amazon ₹100 Gift Card",
        description="Instant digital gift card redeemable on Amazon.in for any product.",
        coins_required=100,
        category="Shopping",
        available=True,
    ),
    RewardItem(
        reward_id=2,
        name="Zomato Gold – 1 Month",
        description="Enjoy unlimited free deliveries and exclusive restaurant discounts for 30 days.",
        coins_required=250,
        category="Food & Dining",
        available=True,
    ),
    RewardItem(
        reward_id=3,
        name="BookMyShow Movie Voucher",
        description="Buy 1 Get 1 free on movie tickets at any PVR / INOX screen across India.",
        coins_required=150,
        category="Entertainment",
        available=True,
    ),
    RewardItem(
        reward_id=4,
        name="Airtel Recharge ₹199",
        description="Prepaid recharge worth ₹199 with 2 GB/day data and unlimited calls.",
        coins_required=200,
        category="Utilities",
        available=True,
    ),
    RewardItem(
        reward_id=5,
        name="Cult.fit 7-Day Free Pass",
        description="Full access to any Cult.fit gym or live workout class for an entire week.",
        coins_required=300,
        category="Health",
        available=True,
    ),
    RewardItem(
        reward_id=6,
        name="MakeMyTrip Hotel Discount ₹500",
        description="₹500 off on any hotel booking above ₹2,000 through MakeMyTrip.",
        coins_required=500,
        category="Travel",
        available=True,
    ),
]

_CATALOGUE_INDEX: dict[int, RewardItem] = {r.reward_id: r for r in _CATALOGUE}


# ---------------------------------------------------------------------------
# Service functions
# ---------------------------------------------------------------------------

def get_transactions(
    page: int,
    page_size: int,
    status: str | None,
    category: str | None,
    user_id: int | None,
    search: str | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    sort_key: str = "transaction_date",
    sort_dir: str = "desc",
) -> PaginatedTransactions:
    with get_db() as conn:
        data = repository.fetch_transactions(
            conn,
            page=page,
            page_size=page_size,
            status=status,
            category=category,
            user_id=user_id,
            search=search,
            min_amount=min_amount,
            max_amount=max_amount,
            start_date=start_date,
            end_date=end_date,
            sort_key=sort_key,
            sort_dir=sort_dir,
        )
    return PaginatedTransactions(
        total=data["total"],
        page=page,
        page_size=page_size,
        results=[TransactionOut(**r) for r in data["rows"]],
    )


def get_spend_analytics(
    status: str | None = None,
    user_id: int | None = None,
    search: str | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    with get_db() as conn:
        return repository.fetch_spend_analytics(
            conn,
            status=status,
            user_id=user_id,
            search=search,
            min_amount=min_amount,
            max_amount=max_amount,
            start_date=start_date,
            end_date=end_date,
        )


def get_coin_balance(user_id: int) -> CoinBalance:
    with get_db() as conn:
        data = repository.fetch_coin_balance(conn, user_id)
    return CoinBalance(**data)


def get_rewards_catalogue() -> RewardsCatalogue:
    return RewardsCatalogue(items=_CATALOGUE)


def get_user_redemptions(user_id: int):
    with get_db() as conn:
        rows = repository.fetch_redemptions(conn, user_id)
    
    # Map raw rows to the Redemption model the frontend expects
    results = []
    for r in rows:
        reward = _CATALOGUE_INDEX.get(r["reward_id"]) if r["reward_id"] else None
        reward_name = reward.name if reward else "Unknown Reward"
        
        results.append({
            "redemption_id": r["redemption_id"],
            "user_id": r["user_id"],
            "reward_id": r["reward_id"] or 0,
            "reward_name": reward_name,
            "coins_deducted": r["points_redeemed"],
            "redeemed_at": r["redemption_date"].isoformat(),
            "status": "claimed"
        })
    return {"items": results}


def process_redemption(user_id: int, reward_id: int) -> RedemptionResponse:
    # 1. Validate reward exists in catalogue
    reward = _CATALOGUE_INDEX.get(reward_id)
    if not reward:
        raise HTTPException(status_code=400, detail=f"Reward {reward_id} not found in catalogue.")

    if not reward.available:
        raise HTTPException(status_code=400, detail=f"Reward '{reward.name}' is currently unavailable.")

    # 2. Check user's current balance
    with get_db() as conn:
        # Acquire pessimistic lock to prevent concurrent redemptions overselling balance
        repository.lock_user(conn, user_id)

        balance_data = repository.fetch_coin_balance(conn, user_id)
        current_coins = balance_data["total_coins"]

        if current_coins < reward.coins_required:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient coins. Required: {reward.coins_required}, "
                    f"Available: {current_coins}."
                ),
            )

        # 3. Persist the redemption inside the same connection (atomic)
        redemption_id = repository.insert_redemption(
            conn,
            user_id=user_id,
            reward_id=reward_id,
            points_to_deduct=reward.coins_required,
        )

    return RedemptionResponse(
        success=True,
        message=f"Successfully redeemed '{reward.name}'!",
        user_id=user_id,
        reward_id=reward_id,
        coins_deducted=reward.coins_required,
        remaining_balance=current_coins - reward.coins_required,
        redemption_id=redemption_id,
    )
