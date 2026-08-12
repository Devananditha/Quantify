"""
Repository (Data-Access) Layer
================================
All raw SQL lives here.  No HTTP or business logic.
Functions accept a psycopg2 connection and return plain dicts/lists.
"""
from typing import Any

import psycopg2.extensions as pg


# ---------------------------------------------------------------------------
# Transactions repository
# ---------------------------------------------------------------------------

def fetch_transactions(
    conn: pg.connection,
    *,
    page: int = 1,
    page_size: int = 50,
    status: str | None = None,
    category: str | None = None,
    user_id: int | None = None,
) -> dict[str, Any]:
    """Return a paginated slice of transactions with optional filters."""
    offset = (page - 1) * page_size

    filters: list[str] = []
    params: list[Any] = []

    if status:
        filters.append("status = %s")
        params.append(status.upper())
    if category:
        filters.append("category ILIKE %s")
        params.append(category)
    if user_id:
        filters.append("user_id = %s")
        params.append(user_id)

    where_clause = ("WHERE " + " AND ".join(filters)) if filters else ""

    with conn.cursor() as cur:
        # total count
        cur.execute(
            f"SELECT COUNT(*) AS cnt FROM transactions {where_clause}",
            params,
        )
        total = cur.fetchone()["cnt"]

        # paginated rows
        cur.execute(
            f"""
            SELECT txn_id, user_id, merchant, COALESCE(category, 'Uncategorized') AS category,
                   amount, currency, status, payment_method,
                   transaction_date
            FROM   transactions
            {where_clause}
            ORDER  BY transaction_date DESC
            LIMIT  %s OFFSET %s
            """,
            [*params, page_size, offset],
        )
        rows = cur.fetchall()

    return {"total": total, "rows": [dict(r) for r in rows]}


# ---------------------------------------------------------------------------
# Coins / Balance repository
# ---------------------------------------------------------------------------

def lock_user(conn: pg.connection, user_id: int) -> None:
    """Acquires a pessimistic row-level lock on the user record for the duration of the transaction."""
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM users WHERE user_id = %s FOR UPDATE", (user_id,))

def fetch_coin_balance(conn: pg.connection, user_id: int) -> dict[str, Any]:
    """
    Calculate coin balance for a user.
    Rule: 1 coin per ₹100 spent on SUCCESS transactions.
    Points are SUM(amount // 100) minus points already redeemed.
    """
    with conn.cursor() as cur:
        # Total earned via successful transactions
        cur.execute(
            """
            SELECT COALESCE(SUM(FLOOR(amount / 100)), 0)::INT AS earned,
                   COALESCE(SUM(amount), 0)::FLOAT              AS total_spent,
                   COUNT(*)::INT                                 AS txn_count
            FROM   transactions
            WHERE  user_id = %s
              AND  status  = 'SUCCESS'
            """,
            (user_id,),
        )
        row = cur.fetchone()
        earned      = row["earned"]
        total_spent = row["total_spent"]
        txn_count   = row["txn_count"]

        # Total redeemed
        cur.execute(
            "SELECT COALESCE(SUM(points_redeemed), 0)::INT AS redeemed FROM redemptions WHERE user_id = %s",
            (user_id,),
        )
        redeemed = cur.fetchone()["redeemed"]

    return {
        "user_id":           user_id,
        "total_coins":       max(earned - redeemed, 0),
        "total_spent_inr":   total_spent,
        "transaction_count": txn_count,
    }


# ---------------------------------------------------------------------------
# Redemptions repository
# ---------------------------------------------------------------------------

def insert_redemption(
    conn: pg.connection,
    *,
    user_id: int,
    reward_id: int,
    points_to_deduct: int,
) -> int:
    """Insert a redemption record and return its new ID."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO redemptions (user_id, reward_id, points_redeemed)
            VALUES (%s, %s, %s)
            RETURNING redemption_id
            """,
            (user_id, reward_id, points_to_deduct),
        )
        return cur.fetchone()["redemption_id"]

def fetch_redemptions(conn: pg.connection, user_id: int) -> list[dict[str, Any]]:
    """Fetch all redemptions for a user."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT redemption_id, user_id, reward_id, points_redeemed, redemption_date
            FROM redemptions
            WHERE user_id = %s
            ORDER BY redemption_date DESC
            """,
            (user_id,)
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]
