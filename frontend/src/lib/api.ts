/**
 * Typed API client for the FastAPI backend.
 * All fetch calls are centralised here so routes/components stay clean.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TxnStatus = "SUCCESS" | "FAILED" | "PENDING";

export interface Transaction {
  txn_id: string;
  user_id: number;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  status: TxnStatus;
  payment_method: string;
  transaction_date: string; // ISO UTC string
}

export interface PaginatedTransactions {
  total: number;
  page: number;
  page_size: number;
  results: Transaction[];
}

export interface TransactionFilters {
  page?: number;
  page_size?: number;
  status?: string;
  category?: string;
  user_id?: number;
}

export interface CoinBalance {
  user_id: number;
  total_coins: number;
  total_spent_inr: number;
  transaction_count: number;
}

export interface RewardItem {
  reward_id: number;
  name: string;
  description: string;
  coins_required: number;
  category: string;
  available: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    // Next.js: no-store so we always get fresh data in server components
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<PaginatedTransactions> {
  const q = buildQuery({
    page:      filters.page      ?? 1,
    page_size: filters.page_size ?? 50,
    status:    filters.status,
    category:  filters.category,
    user_id:   filters.user_id,
  });
  return apiFetch<PaginatedTransactions>(`/api/transactions${q}`);
}

/**
 * Fetches the entire transaction dataset in one shot (page_size=10000).
 * Used by the virtual scroll table — all 10k rows are held in JS memory
 * and only the visible slice is rendered to the DOM.
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  const data = await apiFetch<PaginatedTransactions>(
    `/api/transactions?page=1&page_size=10000`
  );
  return data.results;
}

export async function getCoinBalance(userId: number): Promise<CoinBalance> {
  return apiFetch<CoinBalance>(`/api/users/${userId}/balance`);
}

export async function getRewards(): Promise<{ items: RewardItem[] }> {
  return apiFetch<{ items: RewardItem[] }>("/api/rewards");
}

export interface RedemptionResponse {
  success: boolean;
  message: string;
  user_id: number;
  reward_id: number;
  coins_deducted: number;
  remaining_balance: number;
  redemption_id: number;
}

export async function redeemReward(userId: number, rewardId: number): Promise<RedemptionResponse> {
  return apiPost<RedemptionResponse>("/api/redemptions", { user_id: userId, reward_id: rewardId });
}

export interface Redemption {
  redemption_id: number;
  user_id: number;
  reward_id: number;
  reward_name: string;
  coins_deducted: number;
  redeemed_at: string;
  status: string;
}

export async function getRedemptions(userId: number): Promise<{ items: Redemption[] }> {
  return apiFetch<{ items: Redemption[] }>(`/api/redemptions?user_id=${userId}`);
}

