import Link from "next/link";
import { BentoGrid } from "@/components/BentoGrid";
import { BentoCard, CardHeader, CardMetric } from "@/components/BentoCard";
import styles from "./page.module.css";
import { getCoinBalance, getTransactions, getRewards, getRedemptions } from "@/lib/api";
import { formatINR } from "@/lib/utils";

export const metadata = {
  title: "Dashboard — Dash",
  description: "Overview of your transactions, coin balance, and rewards.",
};

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    SUCCESS: "badge bg-[#13735c] text-white border-none rounded-full px-3 py-1 text-xs font-bold shadow-sm",
    FAILED:  "badge bg-[#e6c0a5] text-[#08172c] border-none rounded-full px-3 py-1 text-xs font-bold shadow-sm",
    PENDING: "badge bg-[#fbc353] text-[#08172c] border-none rounded-full px-3 py-1 text-xs font-bold shadow-sm",
  };
  return map[status] ?? "badge";
}

function formatCompactINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`;
  return `₹${amount.toFixed(0)}`;
}

export default async function DashboardPage() {
  const userId = 1;
  const [balance, txnsRes, rewardsRes, redemptionsRes] = await Promise.all([
    getCoinBalance(userId).catch(() => null),
    getTransactions({ user_id: userId, page: 1, page_size: 5 }).catch(() => null),
    getRewards().catch(() => null),
    getRedemptions(userId).catch(() => null)
  ]);

  const recentTxns = txnsRes?.results || [];
  const rewards = (rewardsRes?.items || []).slice(0, 6);
  const totalRedeemed = redemptionsRes?.items.length || 0;
  
  const redeemedCoins = redemptionsRes?.items.reduce((acc, r) => acc + (r.coins_deducted || 0), 0) || 0;
  const currentCoins = balance?.total_coins || 0;
  const earnedCoins = currentCoins + redeemedCoins;
  
  // Math for SVG dasharray (out of 314)
  const ratio = Math.max(0, Math.min(currentCoins / Math.max(earnedCoins, 1), 1));
  const strokeDasharray = `${ratio * 314} 314`;

  const STATS = [
    { label: "Total Transactions", value: (balance?.transaction_count || 0).toLocaleString("en-IN"), unit: "txns", sub: "All time" },
    { label: "Coin Balance", value: currentCoins.toLocaleString("en-IN"), unit: "coins", sub: `User #${userId} · Live` },
    { label: "Total Spent", value: formatCompactINR(balance?.total_spent_inr || 0), unit: "", sub: "SUCCESS transactions" },
    { label: "Rewards Redeemed", value: totalRedeemed.toString(), unit: "items", sub: "Your redemptions" },
  ];

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-cyan-100/50">
        <div>
          <h1 className={styles.pageTitle}>Welcome back,</h1>
          <p className={styles.pageSub}>Your financial overview at a glance</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link href="/rewards" className="w-full sm:w-auto btn btn-sm bg-gradient-to-b from-[#8ce3f5] to-[#4fd1c5] text-[#0F1E36] font-medium shadow-[0_4px_15px_rgba(79,209,197,0.4)] rounded-xl hover:brightness-105 transition-all inline-flex items-center justify-center">
            Redeem Coins
          </Link>
        </div>
      </header>

      {/* Main Page Layout */}
      <div className="flex flex-col gap-6 w-full">

        {/* ── Row 1: Four KPI tiles ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
          {STATS.map((stat, i) => (
            <BentoCard
              key={stat.label}
              variant={i === 1 ? "brand" : "default"}
              glow={i === 1}
              className={`delay-${i + 1}`}
            >
              <CardHeader label={stat.label} />
              <CardMetric value={stat.value} unit={stat.unit} sub={stat.sub} />
            </BentoCard>
          ))}
        </div>

        {/* ── Row 2: Recent transactions + Coin gauge ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <BentoCard variant="default" className="lg:col-span-2 delay-1">
          <CardHeader
            label="Recent Transactions"
            right={<Link href="/transactions" className="text-sm text-brand" style={{ color: "var(--color-brand-400)" }}>View all →</Link>}
          />
          <div className="w-full overflow-x-auto overflow-y-hidden rounded-xl">
            <div className={`${styles.txnTable} min-w-[800px]`}>
              <div className="grid grid-cols-[140px_1fr_1fr_90px_90px] gap-4 pb-3 border-b border-cyan-100/50 text-slate-500 text-sm">
                <span>ID</span>
                <span>Merchant</span>
                <span>Category</span>
                <span className="text-right">Amount</span>
                <span>Status</span>
              </div>
              {recentTxns.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No recent transactions found</div>
              ) : recentTxns.map((txn) => (
                <div key={txn.txn_id} className="grid grid-cols-[140px_1fr_1fr_90px_90px] gap-4 items-center p-3 rounded-md transition-colors hover:bg-cyan-50/50 text-sm">
                  <span className="font-mono text-xs text-slate-500">
                    {txn.txn_id}
                  </span>
                  <span className="font-semibold text-[#08172c]">{txn.merchant}</span>
                  <span className="text-slate-500 text-xs">{txn.category}</span>
                  <span className="font-digital text-[#08172c] font-bold text-right tabular-nums tracking-tight" style={{ fontVariationSettings: '"ROND" 100, "wght" 700' }}>₹{Math.round(txn.amount).toLocaleString("en-IN")}</span>
                  <span className={statusBadge(txn.status)}>{txn.status}</span>
                </div>
              ))}
            </div>
          </div>
        </BentoCard>

        {/* Coin Balance Gauge */}
        <BentoCard variant="brand" glow className="lg:col-span-1 delay-2">
          <CardHeader label="Coin Balance" />
          <div className={styles.coinGauge}>
            <div className={styles.coinRing}>
              <svg viewBox="0 0 120 120" className={styles.coinSvg}>
                <circle cx="60" cy="60" r="50" fill="none" className="stroke-[#cffafe]" strokeWidth="14"/>
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="url(#coinGrad)" strokeWidth="14"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset="78.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9"/>
                    <stop offset="100%" stopColor="#14b8a6"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className={styles.coinInner}>
                <span className={styles.coinValue}>{currentCoins.toLocaleString("en-IN")}</span>
                <span className={styles.coinLabel}>coins</span>
              </div>
            </div>
            <div className={styles.coinStats}>
              <div className="flex flex-col items-center gap-1 text-sm">
                <span className="text-slate-500 text-xs">Earned</span>
                <span className="font-semibold text-emerald-600">{earnedCoins.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-sm">
                <span className="text-slate-500 text-xs">Redeemed</span>
                <span className="font-semibold text-slate-400">{redeemedCoins.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </BentoCard>

        </div>

        {/* ── Row 3: Rewards Catalogue ── */}
        <BentoCard className="!bg-transparent !backdrop-blur-none !border-transparent !shadow-none !p-0 delay-3 w-full">
          <CardHeader
            label="Rewards Catalogue"
            right={<Link href="/rewards" className="btn btn-ghost btn-sm inline-flex items-center justify-center">Browse all</Link>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 w-full">
            {rewards.length === 0 ? (
              <div className="col-span-6 py-8 text-center text-slate-400 text-sm">No rewards available</div>
            ) : rewards.map((reward) => (
              <div key={reward.reward_id} className="flex flex-col gap-3 p-5 relative rounded-xl min-h-[180px] transition-all hover:-translate-y-1 overflow-hidden bg-white/20 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(14,165,233,0.18),inset_0_1px_0_rgba(255,255,255,0.6)]">
                <div className="flex items-center justify-between gap-2">
                  <span className={`badge badge-brand truncate max-w-[65%]`} style={{ fontSize: "var(--text-xs)" }}>
                    {reward.category}
                  </span>
                  <span className="text-[#08172c] font-bold text-sm tracking-tight shrink-0 font-digital" style={{ fontVariationSettings: '"ROND" 100, "wght" 700' }}>⬡ {reward.coins_required}</span>
                </div>
                <p className="text-[#08172c] font-bold text-sm leading-snug flex-1">{reward.name}</p>
                <Link 
                  href="/rewards"
                  className="mt-auto w-full py-2.5 bg-gradient-to-br from-[#0ea5e9]/70 via-[#bae6fd]/40 to-[#f0f9ff]/80 backdrop-blur-md border border-white/70 shadow-[0_4px_16px_rgba(14,165,233,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] text-[#0F1E36] font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(14,165,233,0.3),inset_0_1px_2px_rgba(255,255,255,0.9)] hover:brightness-105 flex items-center justify-center"
                >
                  Redeem
                </Link>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
