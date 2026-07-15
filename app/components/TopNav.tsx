"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // The session itself is an HttpOnly cookie that JS cannot read. A separate,
    // non-sensitive flag cookie (aduflow_auth) reflects login state for the UI.
    setIsLoggedIn(document.cookie.split("; ").some((c) => c.startsWith("aduflow_auth=")));
  }, [pathname]); // Refresh when pathname changes

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors; still redirect to the login page.
    }
    window.location.href = "/builder/login";
  }

  // Highlight configurator link when on `/configurator`
  const isConfiguratorActive = pathname === "/configurator";

  // Highlight Builder OS when on builder pages, proposals, permit, or active projects
  const isBuilderActive =
    pathname?.startsWith("/builder") ||
    pathname?.startsWith("/projects") ||
    pathname?.startsWith("/proposals") ||
    pathname?.startsWith("/permit");

  return (
    <nav className="nav compact printHide" aria-label="Main navigation">
      <Link className="brand" href="/">
        ADUflow
      </Link>
      <div className="navLinks">
        <Link
          href="/configurator"
          className={isConfiguratorActive ? "navLink active" : "navLink"}
        >
          Configurator
        </Link>
        <Link
          href="/builder"
          className={isBuilderActive ? "navLink active" : "navLink"}
        >
          Builder OS
        </Link>
        <Link
          href="/pricing"
          className={pathname === "/pricing" ? "navLink active" : "navLink"}
        >
          Pricing
        </Link>
        <Link href="/privacy" className={pathname === "/privacy" ? "navLink active" : "navLink"}>
          Privacy
        </Link>
        <Link href="/terms" className={pathname === "/terms" ? "navLink active" : "navLink"}>
          Terms
        </Link>
        {isLoggedIn && (
          <button
            onClick={handleSignOut}
            className="navLink"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              fontWeight: 700
            }}
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}

