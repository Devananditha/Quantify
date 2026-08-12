"""
FastAPI Application Entry-Point
================================
Assembles the app, registers routers, and configures CORS + lifecycle events.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import get_pool
from app.routes import coins, redemptions, rewards, transactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up the connection pool on startup; close it on shutdown."""
    get_pool()          # initialise pool eagerly
    yield
    pool = get_pool()
    pool.closeall()


app = FastAPI(
    title="Rewards & Transactions API",
    description=(
        "A normalized backend for fetching transactions, computing coin balances, "
        "browsing a reward catalogue, and processing redemptions."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS – allow any origin during local development
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(transactions.router)
app.include_router(coins.router)
app.include_router(rewards.router)
app.include_router(redemptions.router)


# ---------------------------------------------------------------------------
# Health-check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"], summary="API health check")
def health():
    return {"status": "ok"}
