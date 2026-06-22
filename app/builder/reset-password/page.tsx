"use client";

import { useEffect, useState } from "react";
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

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(new URLSearchParams(window.location.search).get("token") ?? "");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Unable to reset password.");
      }
    } catch {
      setError("Error connecting to the server.");
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
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>Choose a new password</p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(183, 95, 56, 0.2)",
              border: "1px solid #b75f38",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "13px",
              marginBottom: "20px",
              color: "#ffc9c2",
            }}
          >
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "14px", marginBottom: "20px" }}>
              Your password has been updated.
            </p>
            <Link
              href="/builder/login"
              className="button primary"
              style={{ display: "inline-block", padding: "12px 24px", borderRadius: "8px" }}
            >
              Sign in
            </Link>
          </div>
        ) : !token ? (
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
            This page requires a valid reset link. Check your email, or{" "}
            <Link href="/builder/forgot-password" style={{ color: "var(--gold)" }}>
              request a new one
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
            <div style={{ display: "grid", gap: "6px" }}>
              <label style={label}>New password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={card}
                required
              />
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              <label style={label}>Confirm new password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? "Updating…" : "Update password"}
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
