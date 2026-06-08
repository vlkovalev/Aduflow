"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();

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
      </div>
    </nav>
  );
}
