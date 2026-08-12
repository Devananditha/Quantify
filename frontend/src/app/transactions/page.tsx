import { Suspense } from "react";
import { PaginatedTransactionTable } from "@/components/PaginatedTransactionTable";
import { FilterProvider } from "@/context/FilterContext";
import styles from "./page.module.css";

export const metadata = {
  title: "Transactions — Dash",
  description:
    "Browse and filter transactions using server-side pagination.",
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={`skeleton ${styles.skeletonBar}`} />
      <div className={`skeleton ${styles.skeletonBar}`} style={{ height: "40px", width: "60%" }} />
      <div className={`skeleton ${styles.skeletonTable}`} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  return (
    <FilterProvider>
      <div className="flex flex-col gap-6 w-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-cyan-100/50">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div>
              <h1 className={styles.title}>Transactions</h1>
              <p className={styles.sub}>
                Browse all records with {" "}
                <strong style={{ color: "var(--color-brand-400)" }}>server-side pagination</strong>
                {" "} and filtering.
              </p>
            </div>
            <div className="flex md:hidden items-center justify-center w-10 h-10 rounded-full bg-cyan-100 border border-cyan-200 overflow-hidden cursor-pointer shadow-sm shrink-0">
              <span className="text-sm font-bold text-[#0F1E36]">U1</span>
            </div>
          </div>
        </header>

        <Suspense fallback={<TableSkeleton />}>
          <PaginatedTransactionTable />
        </Suspense>
      </div>
    </FilterProvider>
  );
}
