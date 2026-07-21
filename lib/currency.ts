/**
 * Shared currency support for ADUflow. formatCurrency was previously
 * hardcoded to en-CA/CAD in two separate places (lib/proposalBuilder.ts and
 * a duplicate inline copy in app/configurator/page.tsx), so every quote
 * displayed as plain "$" regardless of whether the builder or the property
 * was in the US or Canada. This module is the single source of truth for
 * both formatting and jurisdiction-based currency detection.
 */

export type CurrencyCode = "CAD" | "USD";

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === "CAD" || value === "USD";
}

const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY",
  "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND",
  "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]);

const CA_PROVINCE_CODES = new Set([
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
]);

/**
 * Infers CAD/USD from a jurisdiction string like "Portland, OR" or
 * "Surrey, BC" by matching the two-letter state/province token. Returns null
 * when no recognizable state/province code is present (can't be inferred —
 * caller should fall back to the builder's default currency).
 */
export function detectCurrencyFromJurisdiction(jurisdiction: string | null | undefined): CurrencyCode | null {
  if (!jurisdiction) return null;
  const tokens = jurisdiction.split(",").map((part) => part.trim().toUpperCase());
  for (const token of tokens) {
    if (US_STATE_CODES.has(token)) return "USD";
    if (CA_PROVINCE_CODES.has(token)) return "CAD";
  }
  return null;
}

/**
 * Formats a monetary value. Renders identically to the previous CAD-only
 * behavior when currency is "CAD" (no visual regression for existing
 * builders). USD amounts get an explicit " USD" suffix so a US quote is
 * never mistaken for a CAD one — both locales otherwise render the bare "$"
 * symbol, which was the root of the original ambiguity.
 */
export function formatCurrency(value: number, currency: CurrencyCode = "CAD"): string {
  const formatted = new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
  return currency === "USD" ? `${formatted} USD` : formatted;
}
