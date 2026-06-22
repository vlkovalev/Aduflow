"use client";

import { useState } from "react";
import Link from "next/link";

const card: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  fontSize: "14px",
  outline: "none",
};

const label: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(255,255,255,0.7)",
  fontWeight: 600,
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(data.message || data.error || "If an account exists for that email, a reset link has been sent.");
      setSubmitted(true);
    } catch {
      setMessage("Error connecting to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #244537 0%, #17201b 100%)",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          padding: "40px 32px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          color: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-0.5px", color: "var(--gold)" }}>
            ADUflow
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>Reset your password</p>
        </div>

        {message && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "13px",
              marginBottom: "20px",
              color: "#ffffff",
            }}
          >
            {message}
          </div>
        )}

        {!submitted && (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
            <div style={{ display: "grid", gap: "6px" }}>
              <label style={label}>Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={card}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border: 0,
                background: "var(--gold)",
                color: "#17201b",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/builder/login" style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
