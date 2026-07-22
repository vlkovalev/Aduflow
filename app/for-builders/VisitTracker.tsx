"use client";

import { useEffect } from "react";

const SESSION_KEY = "aduflow_visit_session";

export function VisitTracker({ pageTitle }: { pageTitle: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let sessionId = window.sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    const payload = {
      path: `${window.location.pathname}${window.location.search}`,
      pageTitle,
      referrer: document.referrer,
      sessionId,
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmTerm: params.get("utm_term") || "",
      utmContent: params.get("utm_content") || "",
    };

    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/site-visits", blob);
      return;
    }

    fetch("/api/site-visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [pageTitle]);

  return null;
}
