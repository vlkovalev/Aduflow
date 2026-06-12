"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BuilderProfile = {
  id: string;
  companyName: string;
  email: string;
  phone: string;
};

export default function BuilderLogin() {
  const [builders, setBuilders] = useState<BuilderProfile[]>([]);
  const [selectedBuilder, setSelectedBuilder] = useState("");
  const [customUuid, setCustomUuid] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Registration form
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/builders");
        const data = await res.json();
        if (Array.isArray(data.builders)) {
          setBuilders(data.builders);
          if (data.builders.length > 0) {
            setSelectedBuilder(data.builders[0].id);
          }
        }
      } catch (err) {
        setError("Failed to load builder profiles.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function setCookieAndRedirect(id: string) {
    // Set builder_id cookie with 1-year expiry
    document.cookie = `builder_id=${id}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.href = "/builder";
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const id = customUuid.trim() || selectedBuilder;
    if (!id) {
      setError("Please select or enter a builder ID.");
      return;
    }
    setCookieAndRedirect(id);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!regCompanyName.trim()) {
      setError("Company Name is required.");
      return;
    }

    try {
      const res = await fetch("/api/builders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: regCompanyName,
          email: regEmail,
          phone: regPhone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.builder?.id) {
        setCookieAndRedirect(data.builder.id);
      } else {
        setError(data.error || "Failed to register builder.");
      }
    } catch {
      setError("Error connecting to server.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #244537 0%, #17201b 100%)",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        background: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "16px",
        padding: "40px 32px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
        color: "#ffffff"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "800",
            margin: "0 0 8px 0",
            letterSpacing: "-0.5px",
            color: "var(--gold)"
          }}>
            ADUflow
          </h1>
          <p style={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.7)",
            margin: 0
          }}>
            Builder OS Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(183, 95, 56, 0.2)",
            border: "1px solid #b75f38",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "13px",
            marginBottom: "20px",
            color: "#ffc9c2"
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "8px",
          padding: "4px",
          marginBottom: "24px"
        }}>
          <button
            onClick={() => { setIsRegistering(false); setError(""); }}
            style={{
              padding: "8px",
              border: 0,
              borderRadius: "6px",
              background: !isRegistering ? "rgba(255, 255, 255, 0.15)" : "transparent",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsRegistering(true); setError(""); }}
            style={{
              padding: "8px",
              border: 0,
              borderRadius: "6px",
              background: isRegistering ? "rgba(255, 255, 255, 0.15)" : "transparent",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Onboard New Builder
          </button>
        </div>

        {!isRegistering ? (
          <form onSubmit={handleLogin} style={{ display: "grid", gap: "20px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                Loading builder profiles...
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: "6px" }}>
                  <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
                    Select Builder Account
                  </label>
                  <select
                    value={selectedBuilder}
                    onChange={(e) => setSelectedBuilder(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "#17201b",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  >
                    {builders.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gap: "6px" }}>
                  <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
                    Or enter Builder ID (UUID)
                  </label>
                  <input
                    type="text"
                    value={customUuid}
                    onChange={(e) => setCustomUuid(e.target.value)}
                    placeholder="e.g. 00000000-0000-0000-0000-000000000001"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    border: 0,
                    background: "var(--gold)",
                    color: "#17201b",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "opacity 0.2s"
                  }}
                >
                  Enter Builder OS
                </button>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
                Company Name *
              </label>
              <input
                type="text"
                value={regCompanyName}
                onChange={(e) => setRegCompanyName(e.target.value)}
                placeholder="Apex Modular Builders"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none"
                }}
                required
              />
            </div>

            <div style={{ display: "grid", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
                Email Address
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="info@apexmodular.com"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "grid", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
                Phone Number
              </label>
              <input
                type="text"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="(604) 555-0199"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border: 0,
                background: "var(--gold)",
                color: "#17201b",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                marginTop: "12px"
              }}
            >
              Onboard & Sign In
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/" style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.5)",
            textDecoration: "underline"
          }}>
            Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
