"""
Pydantic schemas – the contract between the API layer and callers.
No database logic lives here; these are pure data shapes.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------
class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    txn_id: str
    user_id: int
    merchant: str
    category: str
    amount: float
    currency: str
    status: str
    payment_method: str
    transaction_date: datetime


class PaginatedTransactions(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[TransactionOut]


# ---------------------------------------------------------------------------
# Coins / Balance
# ---------------------------------------------------------------------------
class CoinBalance(BaseModel):
    user_id: int
    total_coins: int
    total_spent_inr: float
    transaction_count: int


# ---------------------------------------------------------------------------
# Rewards Catalogue
# ---------------------------------------------------------------------------
class RewardItem(BaseModel):
    reward_id: int
    name: str
    description: str
    coins_required: int
    category: str
    available: bool


class RewardsCatalogue(BaseModel):
    items: list[RewardItem]


# ---------------------------------------------------------------------------
# Redemptions
# ---------------------------------------------------------------------------
class RedemptionRequest(BaseModel):
    user_id: int
    reward_id: int


class RedemptionResponse(BaseModel):
    success: bool
    message: str
    user_id: int
    reward_id: int
    coins_deducted: int
    remaining_balance: int
    redemption_id: Optional[int] = None
