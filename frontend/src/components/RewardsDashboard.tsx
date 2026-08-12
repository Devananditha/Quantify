"use client";

import { useState } from "react";
import { RewardItem, CoinBalance, redeemReward } from "@/lib/api";

interface RewardsDashboardProps {
  initialBalance: CoinBalance;
  rewards: RewardItem[];
}

export function RewardsDashboard({ initialBalance, rewards }: RewardsDashboardProps) {
  const [balance, setBalance] = useState<number>(initialBalance.total_coins);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleRedeem = async (reward: RewardItem) => {
    const previousBalance = balance;
    setBalance((prev) => prev - reward.coins_required);
    setLoadingId(reward.reward_id);
    try {
      const res = await redeemReward(1, reward.reward_id);
      showToast(res.message, "success");
    } catch (error: unknown) {
      setBalance(previousBalance);
      let msg = "Redemption failed.";
      if (error instanceof Error) msg = error.message.replace("API 400: ", "");
      try {
        const parsed = JSON.parse(msg);
        showToast(parsed.detail || "Redemption failed.", "error");
      } catch {
        showToast(msg || "Redemption failed.", "error");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const categories = ["All", ...Array.from(new Set(rewards.map((r) => r.category)))];
  const filtered = activeCategory === "All" ? rewards : rewards.filter((r) => r.category === activeCategory);

  return (
    <div className="min-h-screen w-full px-8 py-10 relative">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[#08172c] text-4xl font-bold tracking-tight mb-1">Rewards Catalogue</h1>
          <p className="text-slate-500 text-sm font-medium">Redeem your hard-earned coins for exclusive benefits.</p>
        </div>

        {/* Available Balance Glass Pill */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl px-6 py-4 flex items-center gap-4">
          {/* Coin icon */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8ce3f5] to-[#4fd1c5] flex items-center justify-center shadow-[0_4px_12px_rgba(79,209,197,0.35)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F1E36" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="8"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <div>
            <p className="text-[#08172c]/50 text-[10px] font-bold tracking-widest uppercase mb-0.5">Available Balance</p>
            {/* Dot-Matrix coin number */}
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-digital text-[#0F1E36] text-3xl font-bold tracking-tight leading-none transition-all ${loadingId ? "opacity-50 scale-95" : ""}`}
                style={{ fontVariationSettings: '"ROND" 100, "wght" 700' }}
              >
                {balance.toLocaleString()}
              </span>
              <span className="text-[#0F1E36]/60 text-sm font-semibold">coins</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all border ${
              activeCategory === cat
                ? "bg-gradient-to-r from-[#8ce3f5] to-[#4fd1c5] text-[#0F1E36] border-transparent shadow-[0_4px_12px_rgba(79,209,197,0.3)]"
                : "bg-white/20 backdrop-blur-sm border-white/50 text-[#08172c]/70 hover:bg-white/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Rewards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((reward) => {
          const canAfford = balance >= reward.coins_required;
          const isProcessing = loadingId === reward.reward_id;
          const isDisabled = !canAfford || !reward.available;

          return (
            <div
              key={reward.reward_id}
              className={`flex flex-col gap-4 p-5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(34,211,238,0.15)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(34,211,238,0.25)] transition-all duration-300 ${
                isDisabled ? "opacity-60 saturate-50" : ""
              }`}
            >
              {/* Card Header: category + price */}
              <div className="flex items-center justify-between">
                <span className="text-[#0d9488] text-xs font-bold tracking-widest uppercase">
                  {reward.category}
                </span>
                {/* Coin price in dot-matrix */}
                <div className="flex items-center gap-1 bg-white/50 border border-white/60 rounded-xl px-2.5 py-1 shadow-sm">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F1E36" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="8"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  <span
                    className="font-digital text-[#0F1E36] text-base font-bold tracking-tight"
                    style={{ fontVariationSettings: '"ROND" 100, "wght" 700' }}
                  >
                    {reward.coins_required.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="flex-1">
                <h3 className="text-[#0F1E36] text-base font-bold leading-snug mb-1.5">{reward.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">{reward.description}</p>
              </div>

              {/* Affordability tag */}
              {!canAfford && reward.available && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-amber-600 uppercase">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Need {(reward.coins_required - balance).toLocaleString()} more coins
                </div>
              )}

              {/* Redeem Button */}
              <button
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200
                  ${isDisabled
                    ? "bg-slate-200/60 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#8ce3f5] to-[#4fd1c5] text-[#0F1E36] shadow-[0_4px_15px_rgba(79,209,197,0.3)] hover:shadow-[0_6px_20px_rgba(79,209,197,0.5)] hover:brightness-105"
                  }`}
                disabled={isDisabled || loadingId !== null}
                onClick={() => handleRedeem(reward)}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Processing…
                  </span>
                ) : !reward.available ? "Out of Stock"
                  : !canAfford ? "Insufficient Coins"
                  : "Redeem Now"}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(34,211,238,0.2)] transition-all animate-fade-in-up
          ${toast.type === "success"
            ? "bg-emerald-50/80 border-emerald-200/60"
            : "bg-rose-50/80 border-rose-200/60"
          }`}
        >
          {toast.type === "success" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          <span className={`text-sm font-semibold ${toast.type === "success" ? "text-emerald-800" : "text-rose-800"}`}>
            {toast.message}
          </span>
        </div>
      )}
    </div>
  );
}
