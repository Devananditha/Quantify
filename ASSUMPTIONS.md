# Assumptions

1. **Dataset Size**: While the initial dataset is 10k transactions, the architecture was designed with scalability in mind. Server-side pagination and SQL-level filtering were implemented to ensure the application remains performant even if the dataset grows to millions of rows.
2. **Reward Coins System**: Assumed that the 1 coin per ₹100 spent only applies to successful transactions, and the current balance is derived from the sum of all successful transactions minus the cost of all previous redemptions.
3. **Redemption Catalog**: I assumed a static list of 6 hardcoded rewards across various categories (Shopping, Dining, Travel, etc.) is sufficient for the MVP.
4. **Design Aesthetic**: The brief left the UI open but requested polish. I chose a modern, glassmorphic, dark-blue aesthetic (which I dubbed "Quantify") to make the financial data feel premium and engaging, stepping away from standard dull enterprise dashboards.
