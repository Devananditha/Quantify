import { Suspense } from "react";
import { getAllTransactions } from "@/lib/api";
import { VirtualTransactionTable } from "@/components/VirtualTransactionTable";
import { FilterProvider } from "@/context/FilterContext";
import styles from "./page.module.css";

export const metadata = {
  title: "Transactions — Dash",
  description:
    "Browse and filter all 10,000 transactions with client-side virtualization — only visible rows are rendered.",
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

// ─── Server component — fetches all 10k rows once ─────────────────────────────

async function VirtualTableLoader() {
  const allRows = await getAllTransactions();
  return <VirtualTransactionTable allRows={allRows} />;
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
              All{" "}
              <strong style={{ color: "var(--color-brand-400)" }}>10,000 rows</strong>
              {" "} loaded in memory — filter &amp; sort instantly, zero pagination
            </p>
          </div>
        </header>

        <Suspense fallback={<TableSkeleton />}>
          <VirtualTableLoader />
        </Suspense>
      </div>
    </FilterProvider>
  );
}
