"use client";

import { useState, useTransition } from "react";
import type { Transaction, PaginatedTransactions } from "@/lib/api";
import { getTransactions } from "@/lib/api";
import { formatINR, formatDate, statusClass, methodIcon } from "@/lib/utils";
import styles from "./TransactionTable.module.css";

// ─── Column definition ────────────────────────────────────────────────────────

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

const COLUMNS: Column[] = [
  { key: "txn_id",           label: "Transaction ID",  sortable: false },
  { key: "transaction_date", label: "Date & Time",     sortable: true  },
  { key: "merchant",         label: "Merchant",        sortable: true  },
  { key: "category",         label: "Category",        sortable: false },
  { key: "payment_method",   label: "Method",          sortable: false },
  { key: "amount",           label: "Amount (₹)",      sortable: true  },
  { key: "status",           label: "Status",          sortable: false },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface TransactionTableProps {
  initialData: PaginatedTransactions;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TransactionTable({ initialData }: TransactionTableProps) {
  const [data, setData]             = useState<PaginatedTransactions>(initialData);
  const [page, setPage]             = useState(1);
  const [status, setStatus]         = useState("");
  const [category, setCategory]     = useState("");
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState<string>("transaction_date");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [isPending, startTransition] = useTransition();

  const PAGE_SIZE = 50;

  // ─── Data fetching ───────────────────────────────────────────────────────

  function load(
    p: number,
    st: string,
    cat: string,
  ) {
    startTransition(async () => {
      const fresh = await getTransactions({
        page: p,
        page_size: PAGE_SIZE,
        status:   st   || undefined,
        category: cat  || undefined,
      });
      setData(fresh);
    });
  }

  function applyFilters(
    newStatus: string,
    newCategory: string,
  ) {
    setPage(1);
    load(1, newStatus, newCategory);
  }

  // ─── Sorting (client-side on current page) ───────────────────────────────

  function handleSort(key: string) {
    const dir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(dir);
  }

  const sorted = [...data.results].sort((a, b) => {
    const av = a[sortKey as keyof Transaction];
    const bv = b[sortKey as keyof Transaction];
    if (av == null || bv == null) return 0;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  // ─── Client-side search filter on current page ───────────────────────────

  const displayed = search.trim()
    ? sorted.filter((t) =>
        t.merchant.toLowerCase().includes(search.toLowerCase()) ||
        t.txn_id.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      )
    : sorted;

  // ─── Pagination helpers ──────────────────────────────────────────────────

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  function goPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    load(p, status, category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ─── Category options (derived from current page) ────────────────────────

  const CATEGORIES = Array.from(
    new Set(data.results.map((t) => t.category))
  ).sort();

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className={styles.filterBar} role="search" aria-label="Filter transactions">

        {/* Search */}
        <label className={styles.srOnly} htmlFor="txn-search">Search transactions</label>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            id="txn-search"
            type="search"
            className={styles.searchInput}
            placeholder="Search merchant, ID, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search transactions"
          />
        </div>

        {/* Status filter */}
        <label className={styles.srOnly} htmlFor="status-filter">Filter by status</label>
        <select
          id="status-filter"
          className={styles.select}
          value={status}
          onChange={(e) => { setStatus(e.target.value); applyFilters(e.target.value, category); }}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">✅ Success</option>
          <option value="FAILED">❌ Failed</option>
          <option value="PENDING">🕐 Pending</option>
        </select>

        {/* Category filter */}
        <label className={styles.srOnly} htmlFor="category-filter">Filter by category</label>
        <select
          id="category-filter"
          className={styles.select}
          value={category}
          onChange={(e) => { setCategory(e.target.value); applyFilters(status, e.target.value); }}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Result count */}
        <p className={styles.resultCount} aria-live="polite">
          {data.total.toLocaleString()} transactions
          {status && ` · ${status}`}
          {category && ` · ${category}`}
        </p>
      </div>

      {/* ── Table Container (sticky header lives here) ──────────────────── */}
      <div
        className={`${styles.tableContainer} ${isPending ? styles.loading : ""}`}
        role="region"
        aria-label="Transactions table"
        aria-busy={isPending}
      >
        <table className={styles.table}>
          <caption className={styles.caption}>
            Transaction history — {data.total.toLocaleString()} records
            {status && `, filtered by ${status}`}
          </caption>

          {/* Column width hints */}
          <colgroup>
            <col style={{ width: "150px" }} />
            <col style={{ width: "140px" }} />
            <col />
            <col style={{ width: "140px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "110px" }} />
          </colgroup>

          {/* Sticky header */}
          <thead className={styles.thead}>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`${styles.th} ${col.key === "amount" ? styles.thAmount : ""}`}
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
                      <SortIcon
                        active={sortKey === col.key}
                        dir={sortDir}
                      />
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
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              displayed.map((txn) => (
                <TransactionRow key={txn.txn_id} txn={txn} />
              ))
            )}
          </tbody>

          {/* Footer summary row */}
          {displayed.length > 0 && (
            <tfoot className={styles.tfoot}>
              <tr>
                <th scope="row" colSpan={5} className={styles.tfootLabel}>
                  Page total ({displayed.length} rows)
                </th>
                <td className={styles.tfootAmount}>
                  {formatINR(
                    displayed.reduce((sum, t) => sum + t.amount, 0)
                  )}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      <nav className={styles.pagination} aria-label="Table pagination">
        <button
          className={`${styles.pageBtn} ${styles.pageBtnIcon}`}
          onClick={() => goPage(1)}
          disabled={page === 1}
          aria-label="First page"
        >«</button>

        <button
          className={`${styles.pageBtn} ${styles.pageBtnIcon}`}
          onClick={() => goPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >‹</button>

        <PageNumbers
          current={page}
          total={totalPages}
          onPage={goPage}
          styles={styles}
        />

        <button
          className={`${styles.pageBtn} ${styles.pageBtnIcon}`}
          onClick={() => goPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >›</button>

        <button
          className={`${styles.pageBtn} ${styles.pageBtnIcon}`}
          onClick={() => goPage(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
        >»</button>

        <span className={styles.pageInfo}>
          Page {page} of {totalPages}
        </span>
      </nav>
    </div>
  );
}

// ─── Row sub-component ────────────────────────────────────────────────────────

function TransactionRow({ txn }: { txn: Transaction }) {
  const { date, time } = formatDate(txn.transaction_date);

  return (
    <tr className={styles.tr} tabIndex={0}>
      {/* ID */}
      <td className={styles.td} data-label="Transaction ID">
        <span className={styles.txnId}>{txn.txn_id}</span>
      </td>

      {/* Date */}
      <td className={styles.td} data-label="Date">
        <span className={styles.dateDate}>{date}</span>
        <span className={styles.dateTime}>{time}</span>
      </td>

      {/* Merchant */}
      <td className={styles.td} data-label="Merchant">
        <span className={styles.merchantName}>{txn.merchant}</span>
      </td>

      {/* Category */}
      <td className={styles.td} data-label="Category">
        <span className={styles.categoryPill}>{txn.category}</span>
      </td>

      {/* Payment method */}
      <td className={styles.td} data-label="Method">
        <span className={styles.method}>
          <span aria-hidden="true">{methodIcon(txn.payment_method)}</span>
          {txn.payment_method}
        </span>
      </td>

      {/* Amount — tabular-nums font */}
      <td className={`${styles.td} ${styles.tdAmount}`} data-label="Amount">
        {formatINR(txn.amount)}
      </td>

      {/* Status */}
      <td className={styles.td} data-label="Status">
        <span className={statusClass(txn.status)}>{txn.status}</span>
      </td>
    </tr>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12"
      fill="none" aria-hidden="true"
      style={{ opacity: active ? 1 : 0.3, transition: "opacity 150ms" }}
    >
      {dir === "asc" && active ? (
        <path d="M6 2L10 8H2L6 2Z" fill="currentColor" />
      ) : (
        <path d="M6 10L2 4H10L6 10Z" fill="currentColor" />
      )}
    </svg>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-text-tertiary)" }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.2" style={{ margin: "0 auto var(--space-4)", display: "block", opacity: 0.4 }}>
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
      <p style={{ fontSize: "var(--text-sm)" }}>No transactions match your filters.</p>
    </div>
  );
}

// ─── Page number buttons ──────────────────────────────────────────────────────

function PageNumbers({
  current, total, onPage, styles,
}: {
  current: number;
  total: number;
  onPage: (p: number) => void;
  styles: Record<string, string>;
}) {
  // Show at most 5 page buttons centred around current
  const range: (number | "…")[] = [];
  const delta = 2;
  const left  = Math.max(1, current - delta);
  const right = Math.min(total, current + delta);

  if (left > 1)     { range.push(1); if (left > 2) range.push("…"); }
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total) { if (right < total - 1) range.push("…"); range.push(total); }

  return (
    <>
      {range.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
        ) : (
          <button
            key={p}
            className={`${styles.pageBtn} ${p === current ? styles.pageBtnActive : ""}`}
            onClick={() => onPage(p)}
            aria-label={`Page ${p}`}
            aria-current={p === current ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
    </>
  );
}
