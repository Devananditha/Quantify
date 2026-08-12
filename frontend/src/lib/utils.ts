/**
 * Utility helpers shared across components.
 */

/** Format a number as INR currency string with Indian grouping */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format an ISO UTC date string into a human-readable local date+time */
export function formatDate(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  return {
    date: d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

/** Map a status string to its CSS utility class name */
export function statusClass(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: "badge badge-success",
    FAILED:  "badge badge-danger",
    PENDING: "badge badge-pending",
  };
  return map[status] ?? "badge";
}

/** Map a payment method to a short emoji/icon label */
export function methodIcon(method: string): string {
  const map: Record<string, string> = {
    "Credit Card": "💳",
    "Debit Card":  "🏧",
    "UPI":         "⚡",
    "Netbanking":  "🏦",
    "Wallet":      "👛",
  };
  return map[method] ?? "💰";
}
