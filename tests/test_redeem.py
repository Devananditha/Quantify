"""
tests/test_redeem.py
=====================
Comprehensive pytest suite for the POST /api/redemptions endpoint.

Architecture Notes
------------------
* The coin balance is COMPUTED (not stored): earned = SUM(FLOOR(amount/100))
  from SUCCESS transactions, minus SUM(points_redeemed) from redemptions table.
  To mock "user has N coins" we insert synthetic transaction rows.

* Row-level pessimistic locking is already implemented in repository.lock_user()
  via SELECT ... FOR UPDATE, ensuring concurrency safety.

* The reward catalogue is an in-memory list in services.py. Reward IDs 1–6
  exist; reward_id=9999 does not exist → 400 "not found in catalogue".
  (The endpoint currently returns 400 for invalid rewards, not 404, so we
  test for that actual behaviour and note it for a future 404 correction.)

* Tests use a REAL PostgreSQL test database (DB_NAME=test_dash) to exercise
  the full stack including the pessimistic lock logic. Each test runs inside
  an isolated transaction that is rolled back on teardown.

Fixtures
--------
db_conn       – raw psycopg2 connection to the test DB, rolled back after each test
client        – TestClient bound to the FastAPI app with get_db patched to the test conn
seeded_user   – inserts enough synthetic transactions so user_id=99 has exactly N coins
"""

import asyncio
import os
import threading
from contextlib import contextmanager
from typing import Generator
from unittest.mock import patch

import psycopg2
import psycopg2.extensions as pg
import pytest
from fastapi.testclient import TestClient
from psycopg2.extras import RealDictCursor

from main import app


# ---------------------------------------------------------------------------
# Test database configuration
# ---------------------------------------------------------------------------

TEST_DB_CONFIG = {
    "dbname":   os.getenv("TEST_DB_NAME",     "test_dash"),
    "user":     os.getenv("TEST_DB_USER",     os.getenv("DB_USER",     "postgres")),
    "password": os.getenv("TEST_DB_PASSWORD", os.getenv("DB_PASSWORD", "postgres")),
    "host":     os.getenv("TEST_DB_HOST",     os.getenv("DB_HOST",     "localhost")),
    "port":     os.getenv("TEST_DB_PORT",     os.getenv("DB_PORT",     "5432")),
}

# Synthetic user ID reserved for tests — avoids clashing with real data
TEST_USER_ID = 99_999


# ---------------------------------------------------------------------------
# Helper: compute coins for an amount
# ---------------------------------------------------------------------------

def _coins_for_amount(amount: float) -> int:
    """Mirrors the DB formula: FLOOR(amount / 100)."""
    return int(amount // 100)


def _amount_for_coins(coins: int) -> float:
    """Minimum amount that earns exactly `coins` coins (e.g. 500 coins → ₹50,000)."""
    return float(coins * 100)


# ---------------------------------------------------------------------------
# Session-scoped: ensure test schema exists once
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def ensure_schema():
    """
    Connect as superuser and ensure the test database has the required tables.
    This runs once per test session. Skips gracefully if the DB isn't reachable.
    """
    try:
        conn = psycopg2.connect(**TEST_DB_CONFIG)
        conn.autocommit = True
        with conn.cursor() as cur:
            # Minimal schema – mirrors production tables used by the redeem path
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id   SERIAL PRIMARY KEY,
                    name      TEXT NOT NULL DEFAULT 'Test User',
                    email     TEXT NOT NULL DEFAULT 'test@example.com',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS transactions (
                    txn_id           TEXT PRIMARY KEY,
                    user_id          INT  NOT NULL,
                    merchant         TEXT NOT NULL DEFAULT 'TestMerchant',
                    category         TEXT NOT NULL DEFAULT 'Test',
                    amount           NUMERIC(12,2) NOT NULL,
                    currency         TEXT NOT NULL DEFAULT 'INR',
                    status           TEXT NOT NULL DEFAULT 'SUCCESS',
                    payment_method   TEXT NOT NULL DEFAULT 'UPI',
                    transaction_date TIMESTAMPTZ   DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS redemptions (
                    redemption_id  SERIAL PRIMARY KEY,
                    user_id        INT  NOT NULL,
                    points_redeemed INT NOT NULL,
                    redeemed_at    TIMESTAMPTZ DEFAULT NOW()
                );
            """)
        conn.close()
    except psycopg2.OperationalError as exc:
        pytest.skip(f"Test database not reachable: {exc}")

    yield


# ---------------------------------------------------------------------------
# Function-scoped: isolated connection that rolls back after every test
# ---------------------------------------------------------------------------

@pytest.fixture()
def db_conn(ensure_schema):
    """
    Yields a psycopg2 connection with autocommit=OFF.
    A SAVEPOINT is created before each test and rolled back after, so every
    test starts with a clean slate without dropping/recreating tables.
    """
    conn = psycopg2.connect(**TEST_DB_CONFIG)
    conn.cursor_factory = RealDictCursor
    conn.autocommit = False

    # Ensure the test user row exists (needed for SELECT FOR UPDATE in lock_user)
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (user_id, name, email)
            VALUES (%s, 'Test User', 'test@example.com')
            ON CONFLICT (user_id) DO NOTHING
            """,
            (TEST_USER_ID,),
        )
    conn.commit()

    # Use a savepoint so we can roll back individual tests
    with conn.cursor() as cur:
        cur.execute("SAVEPOINT test_start")

    yield conn

    # Rollback to savepoint → undo all inserts/updates made by the test
    with conn.cursor() as cur:
        cur.execute("ROLLBACK TO SAVEPOINT test_start")
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Fixture: patch get_db to return our isolated test connection
# ---------------------------------------------------------------------------

@pytest.fixture()
def client(db_conn):
    """
    FastAPI TestClient with app.database.get_db monkey-patched to use the
    isolated test connection. This means every service call goes through the
    same connection that the test controls and can inspect.
    """
    @contextmanager
    def _mock_get_db() -> Generator[pg.connection, None, None]:
        """Yield the test connection without committing (the test controls that)."""
        yield db_conn
        # Don't commit here — the test fixture owns the transaction boundary

    with patch("app.database.get_db", _mock_get_db):
        with patch("app.services.get_db", _mock_get_db):
            with patch("app.repository.get_db", _mock_get_db) if hasattr(
                __import__("app.repository", fromlist=["get_db"]), "get_db"
            ) else patch("app.services.get_db", _mock_get_db):
                yield TestClient(app)


# ---------------------------------------------------------------------------
# Helper: seed a user's coin balance via synthetic transactions
# ---------------------------------------------------------------------------

def seed_user_coins(conn: pg.connection, user_id: int, coins: int) -> None:
    """
    Insert one synthetic SUCCESS transaction so the user earns exactly `coins`
    coins. Uses a unique txn_id to avoid PK conflicts across tests.
    """
    import uuid
    amount = _amount_for_coins(coins)
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO transactions
                (txn_id, user_id, merchant, category, amount, currency, status, payment_method)
            VALUES (%s, %s, 'SeedMerchant', 'Test', %s, 'INR', 'SUCCESS', 'UPI')
            """,
            (f"TEST-{uuid.uuid4().hex[:12]}", user_id, amount),
        )


def get_db_balance(conn: pg.connection, user_id: int) -> int:
    """Re-read the computed coin balance directly from the test DB."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                COALESCE(SUM(FLOOR(amount / 100)), 0)::INT -
                (SELECT COALESCE(SUM(points_redeemed), 0)::INT
                   FROM redemptions WHERE user_id = %s)
            AS balance
            FROM transactions
            WHERE user_id = %s AND status = 'SUCCESS'
            """,
            (user_id, user_id),
        )
        return cur.fetchone()["balance"]


# ===========================================================================
#  TEST CASES
# ===========================================================================


class TestSuccessfulRedeem:
    """TC-1: Happy path — sufficient funds, valid reward."""

    def test_returns_200_ok(self, client, db_conn):
        # Arrange: user has 500 coins; reward_id=1 costs 100
        seed_user_coins(db_conn, TEST_USER_ID, 500)

        # Act
        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )

        # Assert HTTP status
        assert response.status_code in (200, 201), (
            f"Expected 200/201, got {response.status_code}: {response.text}"
        )

    def test_response_payload_confirms_success(self, client, db_conn):
        seed_user_coins(db_conn, TEST_USER_ID, 500)

        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )

        body = response.json()
        assert body["success"] is True
        assert body["coins_deducted"] == 100
        assert body["remaining_balance"] == 400
        assert body["user_id"] == TEST_USER_ID
        assert body["reward_id"] == 1
        assert "redemption_id" in body
        assert body["redemption_id"] is not None

    def test_database_balance_is_400_after_redeem(self, client, db_conn):
        # Arrange: seed 500 coins
        seed_user_coins(db_conn, TEST_USER_ID, 500)
        assert get_db_balance(db_conn, TEST_USER_ID) == 500

        # Act: redeem 100-coin reward
        client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )

        # Assert: balance in the database is exactly 400
        balance_after = get_db_balance(db_conn, TEST_USER_ID)
        assert balance_after == 400, (
            f"Expected DB balance of 400 after redeeming 100 coins from 500, got {balance_after}"
        )

    def test_redemption_row_inserted_in_db(self, client, db_conn):
        seed_user_coins(db_conn, TEST_USER_ID, 500)

        client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )

        with db_conn.cursor() as cur:
            cur.execute(
                "SELECT points_redeemed FROM redemptions WHERE user_id = %s ORDER BY redemption_id DESC LIMIT 1",
                (TEST_USER_ID,),
            )
            row = cur.fetchone()

        assert row is not None, "Redemption record was not inserted into the database"
        assert row["points_redeemed"] == 100


class TestInsufficientFunds:
    """TC-2: User balance too low — must be rejected with 400."""

    def test_returns_400_bad_request(self, client, db_conn):
        # Arrange: user has only 50 coins; reward costs 100
        seed_user_coins(db_conn, TEST_USER_ID, 50)

        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )

        assert response.status_code == 400, (
            f"Expected 400 for insufficient coins, got {response.status_code}: {response.text}"
        )

    def test_error_message_mentions_insufficient_coins(self, client, db_conn):
        seed_user_coins(db_conn, TEST_USER_ID, 50)

        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )

        body = response.json()
        detail = str(body.get("detail", "")).lower()
        assert "insufficient" in detail or "balance" in detail or "coins" in detail, (
            f"Error detail should mention insufficient coins/balance, got: {body}"
        )

    def test_database_balance_unchanged_at_50(self, client, db_conn):
        # Arrange: seed 50 coins
        seed_user_coins(db_conn, TEST_USER_ID, 50)
        assert get_db_balance(db_conn, TEST_USER_ID) == 50

        # Act: attempt to redeem (should fail)
        client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )

        # Assert: database balance is STILL exactly 50 — no partial write
        balance_after = get_db_balance(db_conn, TEST_USER_ID)
        assert balance_after == 50, (
            f"DB balance should remain 50 after a failed redemption, got {balance_after}"
        )

    def test_no_redemption_row_inserted_on_failure(self, client, db_conn):
        seed_user_coins(db_conn, TEST_USER_ID, 50)

        with db_conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM redemptions WHERE user_id = %s",
                (TEST_USER_ID,),
            )
            count_before = cur.fetchone()["cnt"]

        client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )

        with db_conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM redemptions WHERE user_id = %s",
                (TEST_USER_ID,),
            )
            count_after = cur.fetchone()["cnt"]

        assert count_after == count_before, (
            "A redemption row was inserted despite insufficient balance"
        )


class TestInvalidReward:
    """TC-3: Reward ID does not exist in the catalogue."""

    NONEXISTENT_REWARD_ID = 9_999

    def test_returns_4xx_for_nonexistent_reward(self, client, db_conn):
        # Give the user plenty of coins so balance is not the failure reason
        seed_user_coins(db_conn, TEST_USER_ID, 1_000)

        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": self.NONEXISTENT_REWARD_ID},
        )

        # The current implementation raises HTTP 400 ("not found in catalogue").
        # The ideal REST status is 404; both are acceptable until the service
        # is updated. We assert the request is NOT accepted (not 2xx).
        assert response.status_code in (400, 404), (
            f"Expected 400 or 404 for an unknown reward, got {response.status_code}: {response.text}"
        )

    def test_error_message_references_reward(self, client, db_conn):
        seed_user_coins(db_conn, TEST_USER_ID, 1_000)

        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": self.NONEXISTENT_REWARD_ID},
        )

        detail = str(response.json().get("detail", "")).lower()
        assert (
            "reward" in detail
            or "not found" in detail
            or str(self.NONEXISTENT_REWARD_ID) in detail
        ), f"Error should reference the reward or 'not found', got: {response.json()}"

    def test_database_balance_unchanged_for_invalid_reward(self, client, db_conn):
        seed_user_coins(db_conn, TEST_USER_ID, 1_000)
        balance_before = get_db_balance(db_conn, TEST_USER_ID)

        client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": self.NONEXISTENT_REWARD_ID},
        )

        balance_after = get_db_balance(db_conn, TEST_USER_ID)
        assert balance_after == balance_before, (
            f"Balance changed from {balance_before} to {balance_after} on invalid reward request"
        )

    def test_zero_balance_reward_id_nonexistent(self, client, db_conn):
        """Edge case: user with zero coins requesting a nonexistent reward — still 4xx."""
        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": self.NONEXISTENT_REWARD_ID},
        )
        assert response.status_code in (400, 404)


class TestConcurrencyPrevention:
    """
    TC-4: Two simultaneous redemption attempts for a user with exactly 100
    coins (matching the cost). Only one must succeed; balance must not go
    below 0.

    Implementation: the service layer calls repository.lock_user() which
    executes SELECT ... FOR UPDATE on the users row, serialising concurrent
    redemptions at the DB level.

    Strategy: use two threads against a SHARED real DB connection pool
    (not the mock single-connection fixture) to exercise the actual lock.
    We connect twice — one connection per "concurrent" request — and release
    them in overlapping order to simulate a race condition.
    """

    def _make_direct_client(self) -> TestClient:
        """TestClient using the REAL connection pool (not the mock fixture)."""
        return TestClient(app)

    def _seed_direct(self, coins: int) -> None:
        """
        Insert seed data via a direct connection (bypasses test fixture rollback
        so both threaded clients can see it). Cleaned up in teardown.
        """
        import uuid
        conn = psycopg2.connect(**TEST_DB_CONFIG)
        conn.cursor_factory = RealDictCursor
        with conn.cursor() as cur:
            # Ensure user row exists
            cur.execute(
                "INSERT INTO users (user_id) VALUES (%s) ON CONFLICT DO NOTHING",
                (TEST_USER_ID,),
            )
            # Seed exactly `coins` coins via a transaction
            cur.execute(
                """
                INSERT INTO transactions
                    (txn_id, user_id, merchant, category, amount, currency, status, payment_method)
                VALUES (%s, %s, 'ConcurrencySeed', 'Test', %s, 'INR', 'SUCCESS', 'UPI')
                """,
                (f"CONC-{uuid.uuid4().hex}", TEST_USER_ID, _amount_for_coins(coins)),
            )
        conn.commit()
        conn.close()

    def _cleanup_direct(self) -> None:
        conn = psycopg2.connect(**TEST_DB_CONFIG)
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM redemptions WHERE user_id = %s", (TEST_USER_ID,)
            )
            cur.execute(
                "DELETE FROM transactions WHERE user_id = %s AND merchant = 'ConcurrencySeed'",
                (TEST_USER_ID,),
            )
        conn.commit()
        conn.close()

    def _get_balance_direct(self) -> int:
        conn = psycopg2.connect(**TEST_DB_CONFIG)
        conn.cursor_factory = RealDictCursor
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    COALESCE(SUM(FLOOR(amount / 100)), 0)::INT -
                    (SELECT COALESCE(SUM(points_redeemed), 0)::INT
                       FROM redemptions WHERE user_id = %s)
                AS balance
                FROM transactions
                WHERE user_id = %s AND status = 'SUCCESS' AND merchant = 'ConcurrencySeed'
                """,
                (TEST_USER_ID, TEST_USER_ID),
            )
            row = cur.fetchone()
        conn.close()
        return row["balance"]

    def test_only_one_succeeds_under_race(self):
        """
        Fire two simultaneous POST /api/redemptions requests in separate
        threads. With pessimistic row-level locking the second one must lose.
        """
        try:
            self._seed_direct(coins=100)  # exactly enough for one 100-coin redeem

            results: list[int] = []
            errors: list[Exception] = []

            client = self._make_direct_client()

            def redeem() -> None:
                try:
                    r = client.post(
                        "/api/redemptions",
                        json={"user_id": TEST_USER_ID, "reward_id": 1},
                    )
                    results.append(r.status_code)
                except Exception as exc:
                    errors.append(exc)

            t1 = threading.Thread(target=redeem)
            t2 = threading.Thread(target=redeem)

            t1.start()
            t2.start()
            t1.join(timeout=10)
            t2.join(timeout=10)

            if errors:
                raise errors[0]

            assert len(results) == 2, "Both threads should have completed"

            success_count = sum(1 for s in results if s in (200, 201))
            failure_count = sum(1 for s in results if s == 400)

            assert success_count == 1, (
                f"Exactly 1 request should succeed under a race. Got statuses: {results}"
            )
            assert failure_count == 1, (
                f"Exactly 1 request should fail (insufficient coins). Got statuses: {results}"
            )

        finally:
            self._cleanup_direct()

    def test_balance_never_goes_below_zero(self):
        """
        Even under a race, the database balance must be >= 0 after both
        requests settle.
        """
        try:
            self._seed_direct(coins=100)

            client = self._make_direct_client()

            def redeem() -> None:
                client.post(
                    "/api/redemptions",
                    json={"user_id": TEST_USER_ID, "reward_id": 1},
                )

            t1 = threading.Thread(target=redeem)
            t2 = threading.Thread(target=redeem)
            t1.start(); t2.start()
            t1.join(timeout=10); t2.join(timeout=10)

            final_balance = self._get_balance_direct()
            assert final_balance >= 0, (
                f"Coin balance went negative ({final_balance}). "
                "The pessimistic lock did not prevent the race condition."
            )

        finally:
            self._cleanup_direct()

    def test_single_redemption_row_inserted_under_race(self):
        """
        After the race, exactly one redemption record must exist in the DB
        for this user (from the seed transactions inserted in this test).
        """
        try:
            self._seed_direct(coins=100)

            client = self._make_direct_client()

            def redeem() -> None:
                client.post(
                    "/api/redemptions",
                    json={"user_id": TEST_USER_ID, "reward_id": 1},
                )

            t1 = threading.Thread(target=redeem)
            t2 = threading.Thread(target=redeem)
            t1.start(); t2.start()
            t1.join(timeout=10); t2.join(timeout=10)

            conn = psycopg2.connect(**TEST_DB_CONFIG)
            conn.cursor_factory = RealDictCursor
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*) AS cnt FROM redemptions WHERE user_id = %s",
                    (TEST_USER_ID,),
                )
                count = cur.fetchone()["cnt"]
            conn.close()

            assert count == 1, (
                f"Expected exactly 1 redemption record after race, found {count}. "
                "Possible double-spend / duplicate redemption."
            )

        finally:
            self._cleanup_direct()


# ---------------------------------------------------------------------------
# Edge-case / boundary tests
# ---------------------------------------------------------------------------

class TestEdgeCases:
    """Boundary conditions and edge cases."""

    def test_exact_boundary_succeeds(self, client, db_conn):
        """User has exactly the required coins — should succeed."""
        seed_user_coins(db_conn, TEST_USER_ID, 100)  # reward_id=1 costs exactly 100

        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )

        assert response.status_code in (200, 201), (
            f"Redeeming with exact balance should succeed, got {response.status_code}"
        )
        balance_after = get_db_balance(db_conn, TEST_USER_ID)
        assert balance_after == 0, f"Balance should be 0 after exact redeem, got {balance_after}"

    def test_one_coin_short_fails(self, client, db_conn):
        """User has 1 fewer coin than required — should fail."""
        seed_user_coins(db_conn, TEST_USER_ID, 99)  # reward_id=1 costs 100

        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )

        assert response.status_code == 400

    def test_zero_balance_user_fails(self, client, db_conn):
        """User with zero coins cannot redeem anything."""
        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 1},
        )
        assert response.status_code == 400

    def test_multiple_sequential_redeems_drain_correctly(self, client, db_conn):
        """Three sequential 100-coin redeems on a 350-coin balance: 2 succeed, 1 fails."""
        seed_user_coins(db_conn, TEST_USER_ID, 350)

        statuses = []
        for _ in range(3):
            r = client.post(
                "/api/redemptions",
                json={"user_id": TEST_USER_ID, "reward_id": 1},
            )
            statuses.append(r.status_code)

        successes = sum(1 for s in statuses if s in (200, 201))
        failures  = sum(1 for s in statuses if s == 400)

        assert successes == 3, f"Expected 3 successes on 350-coin balance, got {successes}. Statuses: {statuses}"
        assert failures  == 0, f"Expected 0 failures on 350-coin balance, got {failures}. Statuses: {statuses}"

        balance_after = get_db_balance(db_conn, TEST_USER_ID)
        assert balance_after == 50, f"Expected 50 coins remaining, got {balance_after}"

    def test_reward_id_zero_returns_4xx(self, client, db_conn):
        """reward_id=0 is not in the catalogue — should be rejected."""
        seed_user_coins(db_conn, TEST_USER_ID, 1_000)

        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID, "reward_id": 0},
        )
        assert response.status_code in (400, 404, 422)

    def test_invalid_payload_returns_422(self, client, db_conn):
        """Malformed request body (missing reward_id) should return 422 Unprocessable Entity."""
        response = client.post(
            "/api/redemptions",
            json={"user_id": TEST_USER_ID},  # missing reward_id
        )
        assert response.status_code == 422
