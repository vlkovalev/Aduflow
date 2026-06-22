"use client";

import { useState } from "react";

export function BillingActions({
  hasActiveSubscription,
  planId,
  label,
}: {
  hasActiveSubscription: boolean;
  /** lib/billingPlans.ts plan id to subscribe to. Omit for the legacy single-plan checkout. */
  planId?: string;
  label?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startBillingFlow(endpoint: "/api/billing/checkout" | "/api/billing/portal") {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: planId ? { "Content-Type": "application/json" } : undefined,
        body: planId ? JSON.stringify({ planId }) : undefined,
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        setError(data.error ?? "Unable to start billing session.");
        setIsLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error while contacting billing. Please try again.");
      setIsLoading(false);
    }
  }

  const defaultLabel = hasActiveSubscription ? "Manage billing" : "Subscribe";

  return (
    <div>
      <button
        className="button primary"
        type="button"
        disabled={isLoading}
        onClick={() => startBillingFlow(hasActiveSubscription ? "/api/billing/portal" : "/api/billing/checkout")}
      >
        {isLoading ? "Redirecting…" : label ?? defaultLabel}
      </button>
      {error ? <p style={{ color: "var(--clay)", marginTop: 8 }}>{error}</p> : null}
    </div>
  );
}
