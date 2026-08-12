import styles from "./BentoCard.module.css";

interface BentoCardProps {
  children: React.ReactNode;
  /** Grid column span (1-12) */
  colSpan?: number;
  /** Grid row span */
  rowSpan?: number;
  /** Visual accent variant */
  variant?: "default" | "brand" | "accent" | "glass";
  className?: string;
  /** Whether to show a glowing border on hover */
  glow?: boolean;
  style?: React.CSSProperties;
}

export function BentoCard({
  children,
  colSpan, // Deprecated prop
  rowSpan, // Deprecated prop
  variant = "default",
  className = "",
  glow = false,
  style,
}: BentoCardProps) {
  return (
    <div
      className={[
        // True glassmorphism: translucent frosted fill over the blue gradient background
        "relative rounded-2xl flex flex-col p-6 gap-4 overflow-hidden",
        "bg-white/20 backdrop-blur-2xl",
        "border border-white/50",
        "shadow-[0_8px_32px_rgba(14,165,233,0.18),inset_0_1px_0_rgba(255,255,255,0.6)]",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/40 before:to-white/5 before:pointer-events-none",
        "animate-fade-in-up",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}

/** Semantic card header — label + optional right slot */
export function CardHeader({
  label,
  right,
}: {
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[#08172c] text-xs font-bold tracking-widest uppercase">{label}</p>
      {right && <div>{right}</div>}
    </div>
  );
}

/** Large numeric metric display */
export function CardMetric({
  value,
  unit,
  sub,
}: {
  value: string | number;
  unit?: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-2 mt-auto">
      <div className="flex items-baseline gap-2">
        <span className="text-[#08172c] text-[40px] font-bold font-digital tracking-tight leading-none" style={{ fontVariationSettings: '"ROND" 100, "wght" 600' }}>{value}</span>
        {unit && <span className="text-[#08172c] text-lg font-normal">{unit}</span>}
      </div>
      {sub && <p className="text-[#08172c]/70 text-xs font-medium">{sub}</p>}
    </div>
  );
}
