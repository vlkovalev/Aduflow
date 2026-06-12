"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(document.cookie.includes("builder_id="));
  }, [pathname]); // Refresh when pathname changes

  function handleSignOut() {
    document.cookie = "builder_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
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

