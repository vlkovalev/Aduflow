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

export default function BuilderLogin() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registration extras
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.href = "/builder";
      } else {
        setError(data.error || "Unable to sign in.");
      }
    } catch {
      setError("Error connecting to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.href = "/builder";
      } else {
        setError(data.error || "Unable to create account.");
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
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
              color: "var(--gold)",
            }}
          >
            ADUflow
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>
            Builder OS Portal
          </p>
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            padding: "4px",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => {
              setIsRegistering(false);
              setError("");
            }}
            style={{
              padding: "8px",
              border: 0,
              borderRadius: "6px",
              background: !isRegistering ? "rgba(255, 255, 255, 0.15)" : "transparent",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsRegistering(true);
              setError("");
            }}
            style={{
              padding: "8px",
              border: 0,
              borderRadius: "6px",
              background: isRegistering ? "rgba(255, 255, 255, 0.15)" : "transparent",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create Account
          </button>
        </div>

        {!isRegistering ? (
          <form onSubmit={handleLogin} style={{ display: "grid", gap: "20px" }}>
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
            <div style={{ display: "grid", gap: "6px" }}>
              <label style={label}>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Signing in…" : "Enter Builder OS"}
            </button>
            <div style={{ textAlign: "center" }}>
              <Link
                href="/builder/forgot-password"
                style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}
              >
                Forgot password?
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gap: "6px" }}>
              <label style={label}>Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Apex Modular Builders"
                style={card}
                required
              />
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              <label style={label}>Email Address *</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@apexmodular.com"
                style={card}
                required
              />
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              <label style={label}>Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(604) 555-0199"
                style={card}
              />
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              <label style={label}>Password * (min 8 characters)</label>
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
                marginTop: "8px",
              }}
            >
              {loading ? "Creating account…" : "Create Account & Sign In"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link
            href="/"
            style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}
          >
            Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
