"use client";

import { useState, useEffect } from "react";
import { Redemption } from "@/lib/api";
import { Gift, Coins, CheckCircle, Copy, Check, Sparkles } from "lucide-react";
import { Modal } from "./Modal";
import { ScratchCard } from "./ScratchCard";

interface RedeemCenterProps {
  balance: number;
  redemptions: Redemption[];
}

const STATUS_STYLES: Record<string, string> = {
  claimed:    "bg-[#dcfce7] text-[#166534] px-3 py-1 rounded-full text-xs font-bold shadow-sm",
  completed:  "bg-[#dcfce7] text-[#166534] px-3 py-1 rounded-full text-xs font-bold shadow-sm",
  processing: "bg-[#fef08a] text-[#854d0e] px-3 py-1 rounded-full text-xs font-bold shadow-sm",
  failed:     "bg-[#fecdd3] text-[#9f1239] px-3 py-1 rounded-full text-xs font-bold shadow-sm",
};

export function RedeemCenter({ balance, redemptions }: RedeemCenterProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedVoucherForScratch, setSelectedVoucherForScratch] = useState<any | null>(null);
  const [isVoucherScratched, setIsVoucherScratched] = useState(false);
  const [usedVoucherIds, setUsedVoucherIds] = useState<number[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("usedVouchers");
    if (saved) {
      try { setUsedVoucherIds(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    
    setUsedVoucherIds(prev => {
      const next = [...prev, id];
      localStorage.setItem("usedVouchers", JSON.stringify(next));
      return next;
    });

    setTimeout(() => {
      setCopiedId(null);
      setSelectedVoucherForScratch(null);
    }, 1500);
  };

  const history = redemptions;

  const activeVouchers = history
    .filter((r) => !usedVoucherIds.includes(r.redemption_id) && ((r.status ?? "claimed").toLowerCase() === "claimed" || (r.status ?? "claimed").toLowerCase() === "completed"))
    .map((r, index) => {
      // Deterministic pseudo-random code based on ID + index to guarantee uniqueness even with mock data bugs
      const safeId = r.redemption_id ? r.redemption_id + (index * 1000) : index * 1000;
      const codeSuffix = (safeId * 987654321).toString(36).toUpperCase().substring(0, 6);
      const code = `VCH-${codeSuffix}`;
      
      let category = "Reward";
      if (r.reward_name.toLowerCase().includes("amazon") || r.reward_name.toLowerCase().includes("flipkart")) category = "Shopping";
      if (r.reward_name.toLowerCase().includes("zomato") || r.reward_name.toLowerCase().includes("swiggy")) category = "Food & Dining";
      if (r.reward_name.toLowerCase().includes("bookmyshow")) category = "Entertainment";

      const expiryDate = new Date(new Date(r.redeemed_at).getTime() + 365 * 24 * 60 * 60 * 1000);

      return {
        id: r.redemption_id,
        name: r.reward_name,
        category,
        code,
        icon: <Gift className="w-6 h-6 stroke-[#0ea5e9]" />,
        expiry: expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        coins: r.coins_deducted,
      };
    });

  return (
    <>
      <div className="w-full flex flex-col">

        {/* ── Page Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-6 w-full" style={{ marginBottom: '60px' }}>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e3a8a] font-sans">Redemption Center</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Manage your claimed rewards and active vouchers.</p>
          </div>

          {/* Balance Glass Card */}
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8ce3f5] to-[#4fd1c5] flex items-center justify-center shadow-[0_4px_12px_rgba(79,209,197,0.35)]">
              <Coins className="w-5 h-5 text-[#0F1E36]" />
            </div>
            <div>
              <p className="text-[#08172c]/50 text-[10px] font-bold tracking-widest uppercase mb-0.5">Available Coins</p>
              <div className="flex items-baseline gap-2 mt-3">
                <span
                  className="font-digital text-4xl font-bold text-[#0F1E36] leading-none tracking-tight"
                  style={{ fontVariationSettings: '"ROND" 100, "wght" 700' }}
                >
                  {balance.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-slate-500">coins</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-5 w-full" style={{ marginBottom: '60px' }}>
          {[
            { label: "Total Redeemed", value: history.length, unit: "vouchers", icon: <Gift className="w-6 h-6 stroke-[#0ea5e9]" /> },
            { label: "Coins Spent",    value: history.reduce((s, r) => s + (r.coins_deducted ?? 0), 0).toLocaleString(), unit: "coins", icon: <Coins className="w-6 h-6 stroke-[#0ea5e9]" /> },
            { label: "Active Vouchers",value: activeVouchers.length, unit: "ready to use", icon: <CheckCircle className="w-6 h-6 stroke-[#0ea5e9]" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                {stat.icon}
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span
                  className="text-4xl font-bold text-[#0F1E36] leading-none tracking-tight font-digital"
                  style={{ fontVariationSettings: '"ROND" 100, "wght" 700' }}
                >
                  {stat.value}
                </span>
                <span className="text-sm font-medium text-slate-500">{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Active Vouchers ── */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl p-6 w-full overflow-hidden mb-16">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-lg font-bold tracking-tight text-[#1e3a8a] font-sans">Ready to Use</h2>
            <span className="text-xs font-bold tracking-widest uppercase text-[#0d9488] bg-emerald-50/60 border border-emerald-200/60 px-3 py-1 rounded-full">
              {activeVouchers.length} Active
            </span>
          </div>

          {activeVouchers.length > 0 ? (
            <>
              <style>{`
                @keyframes scroll-left {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .animate-scroll-left {
                  animation: scroll-left 90s linear infinite;
                  width: max-content;
                }
                .animate-scroll-left:hover {
                  animation-play-state: paused;
                }
              `}</style>
              
              <div 
                className="relative w-full"
                style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}
              >
                <div className="flex gap-5 animate-scroll-left pb-2">
                  {/* Duplicate array heavily to ensure infinite scrolling never runs out of content on wide screens */}
                  {[...activeVouchers, ...activeVouchers, ...activeVouchers, ...activeVouchers].map((voucher, idx) => (
                    <div
                      key={`${voucher.id}-${idx}`}
                      className="bg-white/60 backdrop-blur-md border border-white/70 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5 flex flex-col min-w-[280px] w-[280px] shrink-0"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-50 text-blue-500 p-2 rounded-full shadow-inner">
                            <div className="scale-75">{voucher.icon}</div>
                          </div>
                          <div>
                            <p className="text-[#0d9488] text-[9px] font-bold tracking-widest uppercase">{voucher.category}</p>
                            <h3 className="text-[#0F1E36] text-sm font-bold leading-snug truncate max-w-[120px]">{voucher.name}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-white/50 border border-white/60 rounded-xl px-2 py-1 shadow-sm shrink-0">
                          <span className="text-[#0F1E36]/60 text-[10px]">⊕</span>
                          <span
                            className="font-digital text-[#0F1E36] text-xs font-bold tracking-tight"
                            style={{ fontVariationSettings: '"ROND" 100, "wght" 700' }}
                          >
                            {voucher.coins}
                          </span>
                        </div>
                      </div>

                      {/* Spoiler Code Box */}
                      <div 
                        className="bg-white/50 shadow-inner border border-dashed border-cyan-300 rounded-xl py-3 px-3 my-4 flex items-center justify-center flex-col gap-1 cursor-pointer hover:bg-cyan-50 transition-colors group"
                        onClick={() => { setSelectedVoucherForScratch(voucher); setIsVoucherScratched(false); }}
                      >
                        <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400 mb-0.5 group-hover:text-cyan-600 transition-colors">Voucher Code</p>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <p className="text-sm font-bold tracking-wide text-cyan-600 group-hover:text-cyan-700">Tap to Reveal</p>
                        </div>
                      </div>

                      {/* Expiry */}
                      <p className="text-[10px] text-slate-400 text-center mb-3 mt-auto">
                        Valid until <span className="text-slate-600 font-semibold">{voucher.expiry}</span>
                      </p>

                      {/* Copy Button (Triggers Scratch Reveal) */}
                      <button
                        onClick={() => { setSelectedVoucherForScratch(voucher); setIsVoucherScratched(false); }}
                        className="w-full py-2.5 rounded-xl border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Reveal Code
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-slate-400 text-sm py-8 w-full text-center">
              You have no active vouchers right now.
            </div>
          )}
        </div>

        {/* ── Hard Spacer to guarantee gap ── */}
        <div className="h-16 w-full shrink-0"></div>

        {/* ── Redemption History Table ── */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl p-6 w-full">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold tracking-tight text-[#1e3a8a] font-sans">Redemption History</h2>
            <span className="text-slate-500 text-xs font-medium">{history.length} transactions</span>
          </div>

          {/* Table */}
          <div className="w-full">
            {/* Header */}
            <div className="grid grid-cols-[1fr_2fr_120px_110px] gap-4 pb-3 border-b border-white/60 text-slate-500 text-xs font-bold tracking-widest uppercase">
              <span>Date</span>
              <span>Reward</span>
              <span className="text-right">Cost</span>
              <span className="text-center">Status</span>
            </div>

            {/* Rows */}
            <div>
              {history.map((item) => {
                const statusKey = (item.status ?? "claimed").toLowerCase();
                const statusStyle = STATUS_STYLES[statusKey] ?? STATUS_STYLES["claimed"];
                const date = new Date(item.redeemed_at);
                const formattedDate = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

                return (
                  <div
                    key={item.redemption_id}
                    className="grid grid-cols-[1fr_2fr_120px_110px] gap-4 items-center py-4 border-b border-white/40 last:border-0 hover:bg-white/20 transition-colors rounded-lg px-1 -mx-1"
                  >
                    <span className="text-slate-500 text-sm">{formattedDate}</span>
                    <span className="text-[#0F1E36] font-semibold text-sm truncate">{item.reward_name}</span>
                    <div className="flex items-center justify-end gap-1 text-rose-500 font-bold font-digital text-lg tracking-tight" style={{ fontVariationSettings: '"ROND" 100, "wght" 700' }}>
                      − {(item.coins_deducted ?? 0).toLocaleString()}
                    </div>
                    <div className="flex justify-center">
                      <span className={statusStyle}>
                        {statusKey}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {history.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-sm">
                No redemptions yet — head to the Rewards page to redeem your coins!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scratch Card Modal */}
      <Modal 
        isOpen={selectedVoucherForScratch !== null} 
        onClose={() => {
          setSelectedVoucherForScratch(null);
          setIsVoucherScratched(false);
        }} 
        title="Reveal Your Code!"
      >
        {selectedVoucherForScratch && (
          <div className="flex flex-col items-center justify-center p-6 w-[360px] max-w-full">
            <p className="text-sm text-slate-500 mb-6 text-center">
              Scratch off the magical coating below to reveal your <span className="font-bold text-[#0F1E36]">{selectedVoucherForScratch.name}</span> coupon code.
            </p>
            
            <ScratchCard 
              code={selectedVoucherForScratch.code} 
              onReveal={() => setIsVoucherScratched(true)} 
            />
            
            <div className="mt-8 w-full flex flex-col gap-3">
              <button
                disabled={!isVoucherScratched}
                onClick={() => {
                  if (isVoucherScratched) {
                    copyCode(selectedVoucherForScratch.id, selectedVoucherForScratch.code);
                  }
                }}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isVoucherScratched 
                    ? "bg-[#0F1E36] text-white hover:bg-[#0F1E36]/90 shadow-[0_4px_12px_rgba(15,30,54,0.3)] hover:-translate-y-0.5" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-70"
                }`}
              >
                {copiedId === selectedVoucherForScratch.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {isVoucherScratched ? "Copy Code" : "Scratch to Copy"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
