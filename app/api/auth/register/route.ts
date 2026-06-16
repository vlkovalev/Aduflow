import { NextResponse } from "next/server";
import { AuthError, registerBuilder } from "../../../../lib/builderStore";
import { authFlagCookie, cookieAttributes, sessionCookie } from "../../../../lib/auth";
import { clientIp, rateLimit } from "../../../../lib/rateLimit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // Throttle automated sign-up abuse (audit F-05, F-12).
  const ip = clientIp(request);
  const limit = rateLimit(`register:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { companyName?: unknown; email?: unknown; phone?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const errors: string[] = [];
  if (!companyName) errors.push("Company name is required.");
  if (companyName.length > 200) errors.push("Company name is too long.");
  if (!email || !EMAIL_RE.test(email)) errors.push("A valid email is required.");
  if (email.length > 254) errors.push("Email is too long.");
  if (password.length < 8) errors.push("Password must be at least 8 characters.");
  if (password.length > 200) errors.push("Password is too long.");
  if (phone.length > 40) errors.push("Phone number is too long.");

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  let builder;
  try {
    builder = await registerBuilder({ companyName, email, phone, password });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to create account." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({
    builder: { id: builder.id, companyName: builder.companyName, email: builder.email },
  });

  const session = sessionCookie(builder.id);
  response.cookies.set(session.name, session.value, cookieAttributes(true, session.maxAge));
  const flag = authFlagCookie();
  response.cookies.set(flag.name, flag.value, cookieAttributes(false, flag.maxAge));

  return response;
}
