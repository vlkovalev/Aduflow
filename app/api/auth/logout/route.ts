import { NextResponse } from "next/server";
import { AUTH_FLAG_COOKIE, SESSION_COOKIE, cookieAttributes } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  // Expire both cookies immediately.
  response.cookies.set(SESSION_COOKIE, "", cookieAttributes(true, 0));
  response.cookies.set(AUTH_FLAG_COOKIE, "", cookieAttributes(false, 0));
  return response;
}
