import styles from "./BentoGrid.module.css";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 12-column CSS-grid wrapper for Bento-style layouts.
 * Each child (BentoCard) controls its own span via `gridColumn` / `gridRow`.
 */
export function BentoGrid({ children, className = "" }: BentoGridProps) {
  return (
    <div className={`${styles.grid} ${className}`}>
      {children}
    </div>
  );
}
