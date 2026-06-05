import Link from "next/link";

export default function NotFound() {
  return (
    <main className="appShell">
      <nav className="nav compact" aria-label="Main navigation">
        <Link className="brand" href="/">
          ADUflow
        </Link>
      </nav>

      <section className="pageIntro" style={{ paddingTop: 80, textAlign: "center" }}>
        <p className="eyebrow">404</p>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "0 auto 20px" }}>
          Page not found
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 18, maxWidth: 480, margin: "0 auto 32px" }}>
          This proposal link may have expired or the address is incorrect.
          Check the link and try again, or start a new quote.
        </p>
        <Link className="button primary" href="/configurator">
          Start a new quote
        </Link>
      </section>
    </main>
  );
}
