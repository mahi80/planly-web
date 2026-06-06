/**
 * Formatting helpers shared by the billing / onboarding screens.
 */

/** Format integer pence as GBP currency, e.g. 7500 -> "£75.00". */
export function formatPricePence(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format((pence ?? 0) / 100);
}

/** Format an ISO date string as "5 Jun 2026"; "—" when absent/invalid. */
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
