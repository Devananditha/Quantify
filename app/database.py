"""
Database connection management.
Provides a psycopg2 connection pool and a context-manager helper
that routes and business-logic layers can import directly.
"""
import os
from contextlib import contextmanager
from typing import Generator

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

# ---------------------------------------------------------------------------
# Config – reads from env vars first, falls back to seed_db defaults
# ---------------------------------------------------------------------------
DB_CONFIG = {
    "dbname":   os.getenv("DB_NAME",     "postgres"),
    "user":     os.getenv("DB_USER",     "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host":     os.getenv("DB_HOST",     "localhost"),
    "port":     os.getenv("DB_PORT",     "5432"),
}

# A simple thread-safe connection pool (min 1, max 10 connections)
_pool: pool.ThreadedConnectionPool | None = None


def get_pool() -> pool.ThreadedConnectionPool:
    """Initialise pool lazily on first call."""
    global _pool
    if _pool is None:
        _pool = pool.ThreadedConnectionPool(minconn=1, maxconn=10, **DB_CONFIG)
    return _pool


@contextmanager
def get_db() -> Generator[psycopg2.extensions.connection, None, None]:
    """
    Yield a connection from the pool with RealDictCursor as default cursor factory.
    The connection is returned to the pool when the context exits.
    """
    conn = get_pool().getconn()
    conn.cursor_factory = RealDictCursor
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        get_pool().putconn(conn)
