# Assumptions

1. **Dataset Size**: The brief mentioned 10k transactions. I assumed that fetching all 10k transactions at once and keeping them in memory for blazing-fast filtering/sorting is acceptable for this scale, as it avoids complex server-side query permutations for this specific take-home scope.
2. **Reward Coins System**: Assumed that the 1 coin per ₹100 spent only applies to successful transactions, and the current balance is derived from the sum of all successful transactions minus the cost of all previous redemptions.
3. **Redemption Catalog**: I assumed a static list of 4 hardcoded rewards (₹500 Amazon Voucher, ₹1000 Flipkart Voucher, 5% Cashback, Spotify Premium) is sufficient for the MVP.
4. **Design Aesthetic**: The brief left the UI open but requested polish. I chose a modern, glassmorphic, dark-blue aesthetic (which I dubbed "Quantify") to make the financial data feel premium and engaging, stepping away from standard dull enterprise dashboards.
