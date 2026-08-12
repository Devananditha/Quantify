"use client";

import {
  useCallback,
  useState,
  useEffect,
  useRef,
  memo,
} from "react";
import type { Transaction, CategorySpend } from "@/lib/api";
import { getTransactions, getSpendAnalytics } from "@/lib/api";
import { formatINR, formatDate, statusClass, methodIcon } from "@/lib/utils";
import { SpendAnalytics } from "./SpendAnalytics";
import { CategoryDonutChart } from "./CategoryDonutChart";
import { PredictiveInsightCard } from "./PredictiveInsightCard";
import { Modal } from "./Modal";
import { useFilter } from "@/context/FilterContext";
import styles from "./PaginatedTransactionTable.module.css";

// ─── Constants ────────────────────────────────────────────────────────────────

interface Column {
  key: string;
  label: string;
  width: string;
  sortable: boolean;
  align?: "right";
}

const COLUMNS: Column[] = [
  { key: "txn_id",           label: "Transaction ID", width: "160px", sortable: true },
  { key: "transaction_date", label: "Date & Time",    width: "140px", sortable: true  },
  { key: "merchant",         label: "Merchant",       width: "auto",  sortable: true  },
  { key: "category",         label: "Category",       width: "140px", sortable: true  },
  { key: "payment_method",   label: "Method",         width: "120px", sortable: false },
  { key: "amount",           label: "Amount (₹)",     width: "130px", sortable: true, align: "right" },
  { key: "status",           label: "Status",         width: "110px", sortable: false },
];

export function PaginatedTransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<CategorySpend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Filter state
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [sortKey,   setSortKey]   = useState("transaction_date");
  const [sortDir,   setSortDir]   = useState("desc");

  // Global cross-filter state (shared with SpendAnalytics chart)
  const { selectedCategory, setCategory, clearCategory } = useFilter();
  const category = selectedCategory ?? "";

  // Modal state
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Transactions and Analytics
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const [txnRes, analyticsRes] = await Promise.all([
          getTransactions({
            page,
            page_size: pageSize,
            status: status || undefined,
            category: category || undefined,
            search: debouncedSearch || undefined,
            min_amount: minAmount || undefined,
            max_amount: maxAmount || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            sort_key: sortKey,
            sort_dir: sortDir,
          }),
          getSpendAnalytics({
            status: status || undefined,
            search: debouncedSearch || undefined,
            min_amount: minAmount || undefined,
            max_amount: maxAmount || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
          })
        ]);
        if (active) {
          setTransactions(txnRes.results || []);
          setTotalRows(txnRes.total || 0);
          setAnalyticsData(analyticsRes || []);
          setIsLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (active) setIsLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, status, category, debouncedSearch, minAmount, maxAmount, startDate, endDate, sortKey, sortDir]);

  // Sort handler
  const handleSort = useCallback(
    (key: string) => {
      setSortDir((d) => (sortKey === key ? (d === "asc" ? "desc" : "asc") : "desc"));
      setSortKey(key);
      setPage(1);
    },
    [sortKey]
  );

  // NLP Conversational Query Parser
  const handleSearchChange = (val: string) => {
    setSearch(val);
    const lower = val.toLowerCase();
    
    if (lower.includes("food") || lower.includes("dining")) {
      setCategory("Food & Dining");
    } else if (lower.includes("travel")) {
      setCategory("Travel");
    } else if (lower.includes("failed") || lower.includes("declined")) {
      setStatus("FAILED");
    } else if (lower.includes("success")) {
      setStatus("SUCCESS");
    }
    
    if (lower.includes("largest") || lower.includes("highest") || lower.includes("biggest")) {
      setSortKey("amount");
      setSortDir("desc");
    }
  };

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatus("");
    clearCategory();
    setMinAmount("");
    setMaxAmount("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }, [clearCategory]);

  const totalAmount = analyticsData.reduce((sum, item) => sum + item.value, 0);
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  // Hardcoded categories list since we removed `allRows`
  const categories = [
    "Entertainment", "Food & Dining", "Groceries", 
    "Health", "Insurance", "Shopping", "Travel", "Utilities"
  ];

  return (
    <div className={styles.wrapper}>

      {/* ── Top Dashboard Area ── */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl p-6 mb-6">
        <PredictiveInsightCard />
      </div>
      
      {/* ── Analytics & Categories Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Trend Line */}
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl p-6">
          <SpendAnalytics 
            data={analyticsData} 
            activeCategory={category} 
            onCategoryClick={(c) => { setCategory(c === category ? null : c); setPage(1); }} 
          />
        </div>
        
        {/* Category Donut */}
        <div className="lg:col-span-1 bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl p-6 flex flex-col">
          <CategoryDonutChart 
            data={analyticsData} 
            activeCategory={category} 
            onCategoryClick={(c) => { setCategory(c === category ? null : c); setPage(1); }} 
          />
        </div>
      </div>

      <AnimatedTopMerchants />

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl p-4 w-full mb-6" role="search" aria-label="Filter transactions">

        {/* 1. SEARCH BAR */}
        <div className="relative w-full lg:w-auto flex-1 shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Ask your financial data..." 
            className="w-full pl-10 pr-4 py-2 bg-white/60 border border-cyan-100 text-[#0F1E36] text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-slate-400 transition-all shadow-sm" 
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* 2. CENTER FILTERS */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto flex-1">
          
          <label className={styles.srOnly} htmlFor="v-status">Status</label>
          <select
            id="v-status"
            className="px-4 py-2 bg-white/60 border border-cyan-100 text-[#0F1E36] text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm appearance-none cursor-pointer min-w-[130px]"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">✅ Success</option>
            <option value="FAILED">❌ Failed</option>
            <option value="PENDING">🕐 Pending</option>
          </select>

          <label className={styles.srOnly} htmlFor="v-category">Category</label>
          <select
            id="v-category"
            className="px-4 py-2 bg-white/60 border border-cyan-100 text-[#0F1E36] text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm appearance-none cursor-pointer min-w-[130px]"
            value={category}
            onChange={(e) => { setCategory(e.target.value || null); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Date Group */}
          <div className="flex items-center gap-2">
            <label className={styles.srOnly} htmlFor="v-start-date">Start Date</label>
            <input
              id="v-start-date"
              type="date"
              className="w-[130px] px-3 py-2 bg-white/60 border border-cyan-100 text-[#0F1E36] text-sm rounded-xl focus:outline-none shadow-sm"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              title="Start Date"
            />
            <span className="text-sm font-medium text-slate-500">to</span>
            <label className={styles.srOnly} htmlFor="v-end-date">End Date</label>
            <input
              id="v-end-date"
              type="date"
              className="w-[130px] px-3 py-2 bg-white/60 border border-cyan-100 text-[#0F1E36] text-sm rounded-xl focus:outline-none shadow-sm"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              title="End Date"
            />
          </div>

          {/* Amount Group */}
          <div className="flex items-center gap-2">
            <label className={styles.srOnly} htmlFor="v-min-amount">Min Amount</label>
            <input
              id="v-min-amount"
              type="number"
              className="w-[100px] px-3 py-2 bg-white/60 border border-cyan-100 text-[#0F1E36] text-sm rounded-xl focus:outline-none shadow-sm"
              placeholder="Min ₹"
              value={minAmount}
              onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
              min="0"
            />
            <span className="text-sm font-medium text-slate-500">-</span>
            <label className={styles.srOnly} htmlFor="v-max-amount">Max Amount</label>
            <input
              id="v-max-amount"
              type="number"
              className="w-[100px] px-3 py-2 bg-white/60 border border-cyan-100 text-[#0F1E36] text-sm rounded-xl focus:outline-none shadow-sm"
              placeholder="Max ₹"
              value={maxAmount}
              onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
              min="0"
            />
          </div>
        </div>

        {/* 3. ROW COUNTER */}
        <div className="flex flex-col items-end xl:border-l border-cyan-200 xl:pl-4 shrink-0 mt-2 xl:mt-0 w-full xl:w-auto text-right" aria-live="polite">
          <span className="text-2xl font-bold text-[#0F1E36] leading-none tracking-tight">{totalRows.toLocaleString()}</span>
          <span className="text-xs font-medium text-slate-500 mt-1">
            rows matched
          </span>
        </div>
      </div>

      {/* ── Metrics strip ──────────────────────────────────────────────── */}
      <div className={styles.metricsStrip}>
        <MetricChip
          icon="⬡"
          label="Server-Side"
          value="Paginated"
          accent="brand"
        />
        <MetricChip
          icon="📊"
          label="Rows Found"
          value={`${totalRows.toLocaleString()}`}
          accent="neutral"
        />
        <MetricChip
          icon="💰"
          label="Filtered total"
          value={formatINR(totalAmount)}
          accent="success"
        />
        {(status || category || debouncedSearch || startDate || endDate || minAmount || maxAmount) && (
          <button
            className={styles.clearFilters}
            onClick={clearFilters}
          >
            Clear all filters ✕
          </button>
        )}
      </div>

      {/* ── DATA TABLE MASTER CONTAINER ── */}
      <div className="flex flex-col bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl overflow-hidden mt-6 relative min-h-[400px]">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div
          className="overflow-x-auto overflow-y-auto max-h-[600px] w-full"
          role="region"
          aria-label="Transactions — paginated list"
        >
          <table className="w-full min-w-[800px] text-left border-collapse tabular-nums">
            <caption className={styles.srOnly}>
              {totalRows.toLocaleString()} transactions
            </caption>

            {/* Column widths */}
            <colgroup>
              {COLUMNS.map((c) => (
                <col key={c.key} style={{ width: c.width === "auto" ? undefined : c.width }} />
              ))}
            </colgroup>

            {/* Sticky header */}
            <thead className="sticky top-0 z-10 bg-[#e0f7fa]/90 backdrop-blur-md border-b border-cyan-200 text-xs font-bold text-[#0F1E36] uppercase tracking-wider">
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-6 py-4 whitespace-nowrap text-xs font-bold text-[#0F1E36] uppercase tracking-wider ${col.align === "right" ? "text-right" : "text-left"}`}
                    aria-sort={
                      col.sortable
                        ? sortKey === col.key
                          ? sortDir === "asc" ? "ascending" : "descending"
                          : "none"
                        : undefined
                    }
                  >
                    {col.sortable ? (
                      <button
                        className={styles.sortBtn}
                        onClick={() => handleSort(col.key)}
                        aria-label={`Sort by ${col.label}`}
                      >
                        {col.label}
                        <SortIcon active={sortKey === col.key} dir={sortDir as "asc" | "desc"} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className={styles.tbody}>
              {!isLoading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className={styles.emptyCell}>
                    <EmptyState onClear={clearFilters} />
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <DataRow 
                    key={txn.txn_id} 
                    txn={txn} 
                    onClick={() => setSelectedTxn(txn)} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── TABLE FOOTER (Pagination Controls) ── */}
        <div className="bg-[#e0f7fa]/80 backdrop-blur-md border-t border-cyan-200 p-4 flex justify-between items-center z-10 relative">
          <div className="text-xs font-bold text-[#0F1E36] tracking-wider uppercase">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-white border border-cyan-200 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-[#0F1E36] transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="px-4 py-2 rounded-lg bg-white border border-cyan-200 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-[#0F1E36] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <Modal 
        isOpen={selectedTxn !== null} 
        onClose={() => setSelectedTxn(null)} 
        title="Transaction Details"
      >
        {selectedTxn && (
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalAmount}>{formatINR(selectedTxn.amount)}</div>
              <div className={statusClass(selectedTxn.status)} style={{ marginLeft: "auto" }}>
                {selectedTxn.status}
              </div>
            </div>
            
            <div className={styles.modalGrid}>
              <div className={styles.modalLabel}>Merchant</div>
              <div className={styles.modalValue}>{selectedTxn.merchant}</div>
              
              <div className={styles.modalLabel}>Category</div>
              <div className={styles.modalValue}>
                <span className={styles.categoryPill}>{selectedTxn.category}</span>
              </div>
              
              <div className={styles.modalLabel}>Date</div>
              <div className={styles.modalValue}>{formatDate(selectedTxn.transaction_date).date} at {formatDate(selectedTxn.transaction_date).time}</div>
              
              <div className={styles.modalLabel}>Payment Method</div>
              <div className={styles.modalValue}>
                {methodIcon(selectedTxn.payment_method)} {selectedTxn.payment_method}
              </div>
              
              <div className={styles.modalLabel}>Transaction ID</div>
              <div className={styles.modalValue} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                {selectedTxn.txn_id}
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button className={styles.secondaryBtn} onClick={() => setSelectedTxn(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Row component (memoised — only re-renders when its txn changes) ──────────

const DataRow = memo(function DataRow({ txn, onClick }: { txn: Transaction, onClick: () => void }) {
  const { date, time } = formatDate(txn.transaction_date);
  return (
    <tr 
      className="border-b border-white/40 last:border-none hover:bg-white/60 transition-colors cursor-pointer group h-[60px]"
      tabIndex={0} 
      data-status={txn.status}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      role="button"
      aria-label={`View transaction ${txn.txn_id}`}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F1E36]" data-label="Transaction ID">
        <span className={styles.txnId}>{txn.txn_id}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F1E36]" data-label="Date">
        <span className={styles.dateDate}>{date}</span>
        <span className={styles.dateTime}>{time}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F1E36]" data-label="Merchant">
        <span className={styles.merchant}>{txn.merchant}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F1E36]" data-label="Category">
        <span className={styles.categoryPill}>{txn.category}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F1E36]" data-label="Method">
        <span className={styles.method}>
          <span aria-hidden="true">{methodIcon(txn.payment_method)}</span>
          {txn.payment_method}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F1E36] text-right font-mono font-semibold" data-label="Amount">
        {formatINR(txn.amount)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F1E36]" data-label="Status">
        <span className={statusClass(txn.status)}>{txn.status}</span>
      </td>
    </tr>
  );
});

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
      className={`${styles.sortIcon} ${active ? styles.sortIconActive : ""}`}>
      {dir === "asc" && active ? (
        <path d="M5 1L9 7H1L5 1Z" fill="currentColor" />
      ) : (
        <path d="M5 9L1 3H9L5 9Z" fill="currentColor" />
      )}
    </svg>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className={styles.emptyWrap}>
      <div className={styles.emptyIcon}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <h3 className={styles.emptyTitle}>No transactions found</h3>
      <p className={styles.emptySubtitle}>We couldn&apos;t find anything matching your current filters.</p>
      <button className={styles.secondaryBtn} onClick={onClear}>
        Clear all filters
      </button>
    </div>
  );
}

// ─── Metric chip ─────────────────────────────────────────────────────────────

function MetricChip({
  icon, label, value, accent,
}: { icon: string; label: string; value: string; accent: string }) {
  return (
    <div className={`${styles.chip} ${styles[`chip-${accent}`]}`}>
      <span aria-hidden="true">{icon}</span>
      <div>
        <p className={styles.chipLabel}>{label}</p>
        <p className={styles.chipValue}>{value}</p>
      </div>
    </div>
  );
}

// ─── Animated Top Merchants Component (Vertical Marquee) ─────────────────────

function AnimatedTopMerchants() {
  const merchants = [
    { name: 'Amazon', category: 'Shopping', amount: '₹24,500.00', percent: 75, code: 'AMZ' },
    { name: 'Zomato', category: 'Food & Dining', amount: '₹12,350.50', percent: 45, code: 'ZOM' },
    { name: 'Blinkit', category: 'Groceries', amount: '₹8,920.00', percent: 30, code: 'BLK' },
    { name: 'HDFC Ergo', category: 'Insurance', amount: '₹5,200.00', percent: 18, code: 'HDF' },
    { name: 'Uber', category: 'Travel', amount: '₹3,100.00', percent: 12, code: 'UBR' },
  ];

  // Duplicate array twice to create a seamless infinite scroll effect
  const duplicatedMerchants = [...merchants, ...merchants];

  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(34,211,238,0.15)] rounded-2xl p-6 w-full mt-6 mb-6">
      <style>{`
        @keyframes scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-up {
          animation: scroll-up 20s linear infinite;
        }
        .animate-scroll-up:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="flex flex-col mb-2">
        <h3 className="text-xl font-bold text-[#0F1E36] tracking-tight">Top Spending Merchants</h3>
        <p className="text-sm text-slate-500 mt-1">Live outflow tracking over the selected period</p>
      </div>
      
      <div 
        className="relative h-[250px] overflow-hidden"
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}
      >
        <div className="flex flex-col animate-scroll-up pt-4">
          {duplicatedMerchants.map((m, idx) => (
            <div 
              key={`${m.code}-${idx}`}
              className="flex items-center justify-between py-3 px-2 border-b border-white/40 hover:bg-white/50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100/60 flex items-center justify-center text-[#0F1E36] font-bold text-sm shrink-0 shadow-sm border border-cyan-200/50">
                  {m.code}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#0F1E36]">{m.name}</span>
                  <span className="text-xs text-slate-500">{m.category}</span>
                </div>
              </div>
              
              <div className="text-right w-36 shrink-0">
                <span className="text-sm font-bold text-[#0F1E36]">{m.amount}</span>
                <div className="w-full h-2 bg-cyan-100/80 rounded-full mt-1.5 overflow-hidden p-0.5">
                  <div 
                    className="bg-[#0F1E36] h-full rounded-full"
                    style={{ width: `${m.percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
