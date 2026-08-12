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
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Transactions</h1>
            <p className={styles.sub}>
              Browse all records with {" "}
              <strong style={{ color: "var(--color-brand-400)" }}>server-side pagination</strong>
              {" "} and filtering.
            </p>
          </div>
        </header>

        <Suspense fallback={<TableSkeleton />}>
          <PaginatedTransactionTable />
        </Suspense>
      </div>
    </FilterProvider>
  );
}
