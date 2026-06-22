"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"checking" | "verified" | "error">("checking");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    async function verify() {
      const token = new URLSearchParams(window.location.search).get("token") ?? "";
      if (!token) {
        setStatus("error");
        setMessage("This page requires a valid verification link.");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          setStatus("error");
          setMessage(result.error ?? "Unable to verify this email.");
          return;
        }
        setStatus("verified");
        setMessage("Your email is verified. You can now sign in.");
      } catch {
        setStatus("error");
        setMessage("Network error while verifying email. Please try the link again.");
      }
    }

    verify();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #244537 0%, #17201b 100%)",
        padding: 20,
        color: "#fff",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 460,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: "36px 30px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: "0 0 10px", color: "var(--gold)" }}>ADUflow</h1>
        <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{message}</p>
        <div style={{ marginTop: 22 }}>
          {status === "verified" ? (
            <Link className="button primary" href="/builder/login" style={{ display: "inline-flex" }}>
              Sign in
            </Link>
          ) : status === "error" ? (
            <Link className="button secondary" href="/builder/login" style={{ display: "inline-flex" }}>
              Back to login
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
