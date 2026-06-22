import { NextResponse } from "next/server";
import { isBuilderEmailVerified, verifyBuilderLogin } from "../../../../lib/builderStore";
import { authFlagCookie, cookieAttributes, sessionCookie } from "../../../../lib/auth";
import { clientIp, rateLimit } from "../../../../lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Throttle credential-stuffing / brute force (audit F-05, F-12).
  const ip = clientIp(request);
  const limit = await rateLimit(`login:${ip}`, 5, 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const builder = await verifyBuilderLogin(email, password);
  if (!builder) {
    // Generic message — do not reveal whether the email exists.
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!(await isBuilderEmailVerified(builder.id))) {
    return NextResponse.json(
      {
        error: "Please verify your email before signing in.",
        requiresVerification: true,
        email: builder.email,
      },
      { status: 403 },
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
