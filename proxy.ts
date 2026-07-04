import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global security proxy (audit findings F-06, F-07, F-08, F-04).
 *
 * 1. Applies hardening response headers to every response (CSP, anti-clickjacking,
 *    MIME sniffing protection, referrer policy, permissions policy, HSTS in prod).
 * 2. Gates builder/project/permit/proposal pages behind the presence of a
 *    session cookie. The cookie signature is fully verified inside the
 *    routes/server components; this is a cheap first-line redirect for
 *    unauthenticated users.
 *
 * Renamed from middleware.ts to proxy.ts per Next.js's middleware-to-proxy
 * migration (https://nextjs.org/docs/messages/middleware-to-proxy) — file and
 * exported function renamed, behavior unchanged.
 */

const SESSION_COOKIE = "aduflow_session";

// Content-Security-Policy. Next.js requires 'unsafe-inline' for its inline
// bootstrap styles/scripts; this still meaningfully constrains injection.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https:",
  "font-src 'self' data:",
].join("; ");

// audit critical-process-audit.md §4/§14 — /proposals previously had no global
// gate, which let /proposals/[id] and /proposals/[id]/lender be reached by
// anyone with a lead UUID. It is now protected like /builder, /projects, and
// /permit. The /proposals/share/[token] route is intentionally public (it's
// the homeowner-facing shared-link page) and is carved out via PUBLIC_PREFIXES.
const PROTECTED_PREFIXES = ["/builder", "/projects", "/permit", "/proposals"];
const PUBLIC_PATHS = [
  "/builder/login",
  "/builder/forgot-password",
  "/builder/reset-password",
  "/builder/verify-email",
];
const PUBLIC_PREFIXES = ["/proposals/share"];

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) &&
    !PUBLIC_PATHS.includes(pathname) &&
    !PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!hasSession) {
      const loginUrl = new URL("/builder/login", request.url);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  // Run on all routes except Next static assets and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
