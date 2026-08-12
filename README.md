# Quantify

A data-heavy financial dashboard for paying credit-card bills, earning reward coins, and tracking spending. Built for the Digital Alpha Technologies Take-Home Assignment.

## Stack
* **Frontend**: Next.js, React, TypeScript, Vanilla CSS Modules
* **Backend**: FastAPI (Python), PostgreSQL, psycopg2

## Setup (Under 5 Minutes)

### 1. Database
1. Ensure PostgreSQL is running locally on port `5432` with username `postgres` and password `postgres` (or adjust `DB_USER` / `DB_PASSWORD` in your environment).
2. Create a database named `postgres` if one doesn't exist.
3. Run the seed script to create the schema, clean the dirty data, and insert all 10,000 transactions:
   ```bash
   python seed_db.py
   ```

### 2. Backend
1. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/Scripts/activate  # Or `.venv/bin/activate` on Windows
   pip install -r requirements.txt
   ```
2. Run the FastAPI server:
   ```bash
   fastapi dev main.py
   ```
   The backend will be available at `http://localhost:8000`.

### 3. Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

## Live URLs
- **Frontend**: Locally run by default.
- **Backend API**: Locally run by default.
*(A demo video link will be provided via email as requested).*

## Done / Not-Done / Known Issues

### Done
- **Transactions Table**: Renders 10k rows smoothly using purely custom virtualization (no external UI libraries).
- **Core Filters & Sorts**: Works instantly across all 10k rows loaded in-memory.
- **Hand-Built Components**: Table, modals, buttons, and layout built from scratch with clean CSS Modules.
- **Charts**: Category spending donut chart and predictive insights using Recharts.
- **Rewards Flow**: Optimistic UI updates with a fully validated backend redemption process.

### Not Done
- Two-way chart-to-table filtering (chart clicking currently filters table, but table filters don't reshape charts).
- Server-side pagination (chose client-side virtualization as the prompt suggested "full set loaded").

### Known Issues
- Currently, filtering relies heavily on client-side JS. This is blazing fast for 10k rows due to virtualization but would need to be migrated to server-side query filters if the dataset grows to millions of rows.
