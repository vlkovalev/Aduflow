import {
  createHash,
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
  purpose: "session";
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
  const payload: SessionPayload = { bid: builderId, iat: now, exp: now + ttlSeconds, purpose: "session" };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

/** Decode and signature-verify any signed token produced by this module. Internal use only. */
function verifySignedPayload(token: string | undefined | null): Record<string, unknown> | null {
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
    return JSON.parse(fromBase64url(body).toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Verify a session token and return the builder id, or null if invalid/expired. */
export function verifySessionToken(token: string | undefined | null): string | null {
  const payload = verifySignedPayload(token);
  if (!payload || payload.purpose !== "session") return null;
  if (!isUuid(payload.bid)) return null;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload.bid as string;
}

// ── Password reset token ────────────────────────────────────────────────────

const RESET_TTL_SECONDS = 60 * 60; // 1 hour

type ResetPayload = {
  bid: string; // builder id
  pwfp: string; // fingerprint of the password hash at issuance time
  iat: number;
  exp: number;
  purpose: "pwreset";
};

/** Short, non-secret fingerprint of a password hash — changes whenever the password changes. */
function passwordHashFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

/**
 * Create a password-reset token tied to the builder's *current* password
 * hash. Because the fingerprint is embedded in the signed payload, a token
 * automatically stops working the moment the password actually changes —
 * including via the reset itself — without needing a server-side revocation
 * list. It does not, however, prevent reuse of an unused token within its
 * 1-hour window if it leaks before being used.
 */
export function createPasswordResetToken(builderId: string, currentPasswordHash: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: ResetPayload = {
    bid: builderId,
    pwfp: passwordHashFingerprint(currentPasswordHash),
    iat: now,
    exp: now + RESET_TTL_SECONDS,
    purpose: "pwreset",
  };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

/**
 * Verify a password-reset token's signature/expiry/purpose and return the
 * builder id it was issued for, plus the fingerprint it was issued against.
 * Callers must separately fetch that builder's *current* password hash and
 * compare it with passwordHashFingerprint() — this function can't do that
 * itself because the builder id is only known after decoding the token.
 */
export function decodePasswordResetToken(token: string | undefined | null): { builderId: string; fingerprint: string } | null {
  const payload = verifySignedPayload(token);
  if (!payload || payload.purpose !== "pwreset") return null;
  if (!isUuid(payload.bid)) return null;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (typeof payload.pwfp !== "string") return null;
  return { builderId: payload.bid as string, fingerprint: payload.pwfp };
}

export { passwordHashFingerprint };

// ── Email verification token ────────────────────────────────────────────────

const EMAIL_VERIFY_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type EmailVerifyPayload = {
  bid: string;
  emailHash: string;
  iat: number;
  exp: number;
  purpose: "emailverify";
};

function emailFingerprint(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 24);
}

export function createEmailVerificationToken(builderId: string, email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: EmailVerifyPayload = {
    bid: builderId,
    emailHash: emailFingerprint(email),
    iat: now,
    exp: now + EMAIL_VERIFY_TTL_SECONDS,
    purpose: "emailverify",
  };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function decodeEmailVerificationToken(
  token: string | undefined | null,
): { builderId: string; emailHash: string } | null {
  const payload = verifySignedPayload(token);
  if (!payload || payload.purpose !== "emailverify") return null;
  if (!isUuid(payload.bid)) return null;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (typeof payload.emailHash !== "string") return null;
  return { builderId: payload.bid as string, emailHash: payload.emailHash };
}

export function matchesEmailVerificationToken(email: string, emailHash: string): boolean {
  return emailFingerprint(email) === emailHash;
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
