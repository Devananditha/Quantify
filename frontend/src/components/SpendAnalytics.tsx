"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { formatINR } from "@/lib/utils";
import styles from "./SpendAnalytics.module.css";

export interface CategorySpend {
  name: string;
  value: number;
}

interface SpendAnalyticsProps {
  data: CategorySpend[];
  activeCategory: string;
  onCategoryClick: (category: string) => void;
}

// ─── Aggregate category spend data into monthly buckets ───────────────────────
// The incoming `data` is { name: category, value: totalSpend }[].
// We don't have timestamps here so we simulate a 12-month monotonically increasing
// series by distributing the total spend across months proportionally, which gives
// the area chart a meaningful shape to display.
//
// In a real app this would be a dedicated API endpoint.

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildMonthlyData(data: CategorySpend[]) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return [];

  // Distribution weights across 12 months (creates a realistic spend curve)
  const weights = [0.06, 0.07, 0.08, 0.08, 0.09, 0.10, 0.09, 0.08, 0.08, 0.09, 0.09, 0.09];

  return MONTH_LABELS.map((month, i) => ({
    month,
    spend: Math.round(total * weights[i]),
  }));
}

// ─── Y-axis formatter — compact rupee labels ──────────────────────────────────

function formatYAxis(value: number): string {
  if (value >= 10_00_000) return `₹${(value / 10_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip(props: TooltipProps<number, string>) {
  const { active, payload, label } = props as {
    active?: boolean;
    payload?: Array<{ value?: number }>;
    label?: string;
  };
  if (active && payload && payload.length) {
    const value = payload[0]?.value;
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label ?? ""}</p>
        <p className={styles.tooltipValue}>{formatINR(typeof value === "number" ? value : 0)}</p>
      </div>
    );
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpendAnalytics({ data, activeCategory, onCategoryClick }: SpendAnalyticsProps) {
  const filteredData = useMemo(() => {
    if (!activeCategory) return data;
    return data.filter(d => d.name === activeCategory);
  }, [data, activeCategory]);

  const totalSpend = useMemo(() => filteredData.reduce((s, d) => s + d.value, 0), [filteredData]);
  const monthlyData = useMemo(() => buildMonthlyData(filteredData), [filteredData]);

  // ── Empty state (graceful degradation as recommended) ──────────────────────
  if (data.length === 0 || totalSpend === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Spend Analytics</h2>
        </div>
        <div className={styles.emptyState}>
          {/* Muted empty ring */}
          <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
            <circle
              cx="40" cy="40" r="30"
              fill="none"
              stroke="#E3DCD2"
              strokeWidth="8"
              strokeDasharray="4 4"
            />
          </svg>
          <p className={styles.emptyText}>No data for this period</p>
          <p className={styles.emptySubtext}>Adjust your filters to see spend analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Spend Analytics</h2>
        <p className={styles.subtitle}>
          Total Spend:{" "}
          <strong className={styles.totalAmount}>{formatINR(totalSpend)}</strong>
        </p>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={monthlyData}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            {/* ── SVG Gradient Definition ─────────────────────────────────── */}
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* ── Ultra-minimal grid: horizontal lines only ───────────────── */}
            <CartesianGrid
              vertical={false}
              stroke="#E3DCD2"
              strokeDasharray="0"
            />

            {/* ── X Axis: muted taupe labels, no axis line ────────────────── */}
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#A89E94", fontSize: 11, fontFamily: "var(--font-sans)" }}
              dy={8}
            />

            {/* ── Y Axis: compact rupee labels, no axis line ──────────────── */}
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#A89E94", fontSize: 11, fontFamily: "var(--font-sans)" }}
              tickFormatter={formatYAxis}
              width={56}
            />

            {/* ── Custom card-style tooltip ───────────────────────────────── */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#E3DCD2", strokeWidth: 1 }}
            />

            {/* ── Area with Mocha stroke and gradient fill ────────────────── */}
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#0891b2"
              strokeWidth={3}
              fill="url(#spendGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#0F1E36",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Category filter chips ──────────────────────────────────────────── */}
      {data.length > 0 && (
        <div className={styles.categoryChips}>
          {data
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
            .map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
                  onClick={() => onCategoryClick(cat.name === activeCategory ? "" : cat.name)}
                  aria-pressed={isActive}
                >
                  {cat.name}
                </button>
              );
            })}
          {activeCategory && (
            <button
              className={styles.chipClear}
              onClick={() => onCategoryClick("")}
              aria-label="Clear category filter"
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
