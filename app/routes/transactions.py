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
    page:       int          = Query(1,    ge=1,  description="Page number (1-indexed)"),
    page_size:  int          = Query(50,   ge=1, le=10000, description="Rows per page (max 10000)"),
    status:     str | None   = Query(None, description="Filter by status: SUCCESS, FAILED, PENDING"),
    category:   str | None   = Query(None, description="Filter by category (case-insensitive)"),
    user_id:    int | None   = Query(None, description="Filter by user ID"),
    search:     str | None   = Query(None, description="Search merchant, txn_id, or category"),
    min_amount: float | None = Query(None, description="Minimum amount"),
    max_amount: float | None = Query(None, description="Maximum amount"),
    start_date: str | None   = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date:   str | None   = Query(None, description="End date (YYYY-MM-DD)"),
    sort_key:   str          = Query("transaction_date", description="Sort by column"),
    sort_dir:   str          = Query("desc", description="Sort direction (asc/desc)"),
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
        search=search,
        min_amount=min_amount,
        max_amount=max_amount,
        start_date=start_date,
        end_date=end_date,
        sort_key=sort_key,
        sort_dir=sort_dir,
    )


@router.get("/analytics", summary="Get spend analytics for charts")
def get_analytics(
    status:     str | None   = Query(None, description="Filter by status: SUCCESS, FAILED, PENDING"),
    user_id:    int | None   = Query(None, description="Filter by user ID"),
    search:     str | None   = Query(None, description="Search merchant, txn_id, or category"),
    min_amount: float | None = Query(None, description="Minimum amount"),
    max_amount: float | None = Query(None, description="Maximum amount"),
    start_date: str | None   = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date:   str | None   = Query(None, description="End date (YYYY-MM-DD)"),
):
    """
    Returns aggregated spend analytics by category to power the donut chart.
    """
    return services.get_spend_analytics(
        status=status,
        user_id=user_id,
        search=search,
        min_amount=min_amount,
        max_amount=max_amount,
        start_date=start_date,
        end_date=end_date,
    )
