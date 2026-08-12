/**
 * FilterContext
 * =============
 * Centralized global filter state for cross-filtering between
 * SpendAnalytics chart and VirtualTransactionTable.
 *
 * Design decisions:
 * - Uses React Context (no external deps) — lightweight & sufficient.
 * - `selectedCategory` is the single source of truth.
 * - Both chart chips and the table's category dropdown read/write here.
 * - useMemo in consumers ensures 10k-row filtering only re-runs when
 *   selectedCategory actually changes.
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ─── State shape ──────────────────────────────────────────────────────────────

interface FilterState {
  /** null = no filter (show all categories) */
  selectedCategory: string | null;
}

interface FilterContextValue extends FilterState {
  /** Toggle: clicking the same category again clears the filter */
  setCategory: (category: string | null) => void;
  /** Programmatic clear — used by "Clear all" buttons */
  clearCategory: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FilterContext = createContext<FilterContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const setCategory = useCallback((category: string | null) => {
    setSelectedCategory((prev) =>
      // Clicking the same category a second time acts as a toggle-off
      prev === category ? null : category
    );
  }, []);

  const clearCategory = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  const value = useMemo<FilterContextValue>(
    () => ({ selectedCategory, setCategory, clearCategory }),
    [selectedCategory, setCategory, clearCategory]
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFilter(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilter must be used inside <FilterProvider>");
  }
  return ctx;
}
