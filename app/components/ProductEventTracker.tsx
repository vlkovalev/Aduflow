"use client";

const SESSION_KEY = "aduflow_product_session";

export function trackProductEvent(eventName: string, metadata?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  let sessionId = window.sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  const payload = JSON.stringify({ eventName, path: `${window.location.pathname}`, sessionId, metadata });
  const blob = new Blob([payload], { type: "application/json" });
  if (navigator.sendBeacon) { navigator.sendBeacon("/api/product-events", blob); return; }
  fetch("/api/product-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
}
