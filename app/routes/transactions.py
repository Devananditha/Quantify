"""
Route: /api/transactions
========================
Thin routing layer – delegates everything to the service.
"""
from fastapi import APIRouter, Query

from app import services
from app.schemas import PaginatedTransactions

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("", response_model=PaginatedTransactions, summary="List all transactions")
def list_transactions(
    page:      int          = Query(1,    ge=1,  description="Page number (1-indexed)"),
    page_size: int          = Query(50,   ge=1, le=10000, description="Rows per page (max 10000)"),
    status:    str | None   = Query(None, description="Filter by status: SUCCESS, FAILED, PENDING"),
    category:  str | None   = Query(None, description="Filter by category (case-insensitive)"),
    user_id:   int | None   = Query(None, description="Filter by user ID"),
):
    """
    Returns a paginated list of all transactions.

    Supports optional filters for **status**, **category**, and **user_id**.
    Results are sorted newest-first by `transaction_date`.
    """
    return services.get_transactions(
        page=page,
        page_size=page_size,
        status=status,
        category=category,
        user_id=user_id,
    )
