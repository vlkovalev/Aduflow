import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { readEnv } from "./env";

/**
 * Session + credential primitives for ADUflow.
 *
 * This replaces the previous, spoofable plaintext `builder_id` cookie (audit
 * findings F-01, F-02, F-03, F-09, BUG-02, BUG-15). A builder now authenticates
 * with an email + password; the server issues an HMAC-signed, HttpOnly session
 * cookie whose payload (builder id + expiry) cannot be forged without the
 * server secret. Every protected route derives the builder identity from this
 * verified session — never from a client-supplied id.
 *
 * When Supabase Auth is enabled in production, this module's session can be
 * swapped for Supabase sessions + Row-Level Security (see database/rls.sql).
 */

export const SESSION_COOKIE = "aduflow_session";
/** Non-sensitive flag cookie so the client UI can show the right login state. */
export const AUTH_FLAG_COOKIE = "aduflow_auth";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

function getSecret(): string {
  const secret = readEnv("APP_SECRET") ?? readEnv("NEXTAUTH_SECRET");
  if (secret && secret.length >= 16) {
    return secret;
  }
  // Dev/sandbox fallback so the app runs without configuration. This is NOT
  // secure for production — set APP_SECRET to a long random value there.
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[auth] APP_SECRET is not set (or too short). Falling back to an insecure default. " +
        "Set APP_SECRET to a long random string in production.",
    );
  }
  return "aduflow-insecure-dev-secret-change-me";
}

// ── Password hashing (scrypt) ──────────────────────────────────────────────

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  try {
    const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ── Signed session token ────────────────────────────────────────────────────

type SessionPayload = {
  bid: string; // builder id
  iat: number; // issued-at (seconds)
  exp: number; // expiry (seconds)
};

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

function sign(data: string): string {
  return base64url(createHmac("sha256", getSecret()).update(data).digest());
}

export function createSessionToken(builderId: string, ttlSeconds = SESSION_TTL_SECONDS): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { bid: builderId, iat: now, exp: now + ttlSeconds };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

/** Verify a session token and return the builder id, or null if invalid/expired. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = sign(body);
  // Constant-time signature comparison.
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64url(body).toString("utf8")) as SessionPayload;
    if (!isUuid(payload.bid)) return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload.bid;
  } catch {
    return null;
  }
}

// ── Cookie helpers ──────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === "production";

type CookieOptions = {
  name: string;
  value: string;
  httpOnly: boolean;
  maxAge: number;
};

export function sessionCookie(builderId: string): CookieOptions {
  return {
    name: SESSION_COOKIE,
    value: createSessionToken(builderId),
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function authFlagCookie(): CookieOptions {
  return {
    name: AUTH_FLAG_COOKIE,
    value: "1",
    httpOnly: false,
    maxAge: SESSION_TTL_SECONDS,
  };
}

/** Apply standard hardening attributes when writing a cookie on a NextResponse. */
export function cookieAttributes(httpOnly: boolean, maxAge: number) {
  return {
    httpOnly,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Read the authenticated builder id from the request's verified session cookie.
 * Returns null when there is no valid, unexpired, correctly-signed session.
 */
export async function getAuthenticatedBuilderId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
