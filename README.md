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
- **Frontend**: [https://quantify-gpb3.vercel.app/](https://quantify-gpb3.vercel.app/)
- **Backend API**: [https://quantify-api-do45.onrender.com](https://quantify-api-do45.onrender.com)
*(A demo video link will be provided via email as requested).*

## Done / Not-Done / Known Issues

### Done
- **Transactions Table**: Robust server-side pagination ensuring rapid load times and low memory usage even for massive datasets.
- **Core Filters & Sorts**: Dynamic server-side SQL generation supporting comprehensive date, amount, NLP text, and categorical filtering across 10k+ rows.
- **Two-way Analytics**: Analytics endpoints aggregate data based on the current active table filters, ensuring the charts perfectly mirror the filtered dataset.
- **Hand-Built Components**: Table, modals, buttons, and layout built from scratch with clean CSS Modules.
- **Charts**: Category spending donut chart and predictive insights using Recharts.
- **Rewards Flow**: Optimistic UI updates with a fully validated backend redemption process.

### Known Limitations & Next Steps
- **Mobile Responsiveness**: Given the time constraints, I prioritized core architectural requirements—including robust server-side pagination for 10,000 rows, API error handling, and a custom data table. The desktop UI is fully polished, but mobile responsiveness (media queries for table overflow and grid stacking) is incomplete and would be my immediate next priority.
- **Search Capabilities**: The NLP conversational search uses basic substring matching under the hood. For a production environment with complex conversational requests, this could be upgraded to a vector similarity search or an LLM query parser.

## 👨‍💻 About the Developer
Developed by **Devananditha V**. As a final-year B.Tech undergraduate in Computer Science Engineering at Vellore Institute of Technology, Amaravati, I specialize in full-stack architecture and AI integration. Drawing from my experience building production-ready pipelines and AI-powered interfaces, I engineered Quantify to be fast, strictly typed, and visually polished.
