"use client";

import styles from "./PredictiveInsightCard.module.css";

// ─── Hardcoded AI predictions (realistic, based on the transaction dataset) ───

interface Prediction {
  id: string;
  category: string;
  metric: string;
  direction: "up" | "down";
  delta: string;
  period: string;
  confidence: string;
  explanation: string;
  modelVersion: string;
  dataPoints: number;
}

const PREDICTIONS: Prediction[] = [
  {
    id: "travel-surge",
    category: "Travel",
    metric: "Spend demand",
    direction: "up",
    delta: "+12%",
    period: "next 14 days",
    confidence: "±3.1%",
    explanation:
      "Based on 47 recurring flight & hotel booking patterns detected in the last 60 days. December data shows a consistent pre-holiday surge beginning on Day 8. Model leverages seasonal decomposition with low variance (σ=0.031) on this category.",
    modelVersion: "Trend Extrapolation v2.1",
    dataPoints: 1847,
  },
  {
    id: "food-stable",
    category: "Food & Dining",
    metric: "Monthly outflow",
    direction: "down",
    delta: "−4%",
    period: "next 30 days",
    confidence: "±1.8%",
    explanation:
      "Frequency of high-value restaurant transactions (>₹2,000) has declined 11% over the past 3 weeks. Recurring weekly spend at quick-service outlets remains stable. Agent identified a substitution pattern toward grocery spend.",
    modelVersion: "Frequency Regression v1.4",
    dataPoints: 3214,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PredictiveInsightCard() {
  return (
    <div className={styles.strip} aria-label="AI Predictive Insights">
      <div className={styles.stripLabel}>
        AI Predictions
        <span className={styles.modelTag}>Live</span>
      </div>

      <div className={styles.cards}>
        {PREDICTIONS.map((p) => (
          <article key={p.id} className={styles.card} aria-label={`Prediction: ${p.category}`}>
            {/* Main metric */}
            <div className={styles.cardTop}>
              <span className={styles.category}>{p.category}</span>
              <span
                className={`${styles.delta} ${p.direction === "up" ? styles.deltaUp : styles.deltaDown}`}
                aria-label={`${p.direction === "up" ? "Increase" : "Decrease"} of ${p.delta}`}
              >
                {p.delta}
              </span>
            </div>

            <p className={styles.prediction}>
              {p.metric} projected{" "}
              <strong className={`${p.direction === "up" ? styles.deltaUp : styles.deltaDown}`}>
                {p.delta}
              </strong>{" "}
              in <em>{p.period}</em>{" "}
              <span className={styles.confidence}>({p.confidence} CI)</span>
            </p>

            {/* XAI hover overlay — pure CSS, no JS needed */}
            <div className={styles.xaiTrigger} role="button" tabIndex={0} aria-label="Explain this prediction">
              <span className={styles.xaiLabel}>Why?</span>

              <div className={styles.xaiPopover} role="tooltip">
                <div className={styles.xaiHeader}>
                  Explainable AI
                </div>
                <p className={styles.xaiText}>{p.explanation}</p>
                <div className={styles.xaiMeta}>
                  <span className={styles.xaiMetaItem}>
                    <span className={styles.xaiMetaLabel}>Model</span>
                    {p.modelVersion}
                  </span>
                  <span className={styles.xaiMetaItem}>
                    <span className={styles.xaiMetaLabel}>Data Points</span>
                    {p.dataPoints.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
