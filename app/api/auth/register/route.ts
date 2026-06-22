import { NextResponse } from "next/server";
import { AuthError, registerBuilder } from "../../../../lib/builderStore";
import { createEmailVerificationToken } from "../../../../lib/auth";
import { clientIp, rateLimit } from "../../../../lib/rateLimit";
import { sendEmail } from "../../../../lib/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // Throttle automated sign-up abuse (audit F-05, F-12).
  const ip = clientIp(request);
  const limit = await rateLimit(`register:${ip}`, 5, 60 * 60);
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

  const verification = await sendVerificationEmail(builder.id, builder.email, request.url);

  return NextResponse.json({
    builder: { id: builder.id, companyName: builder.companyName, email: builder.email },
    requiresVerification: true,
    verificationUrl: verification.sent ? undefined : verification.url,
    message: "Account created. Check your email to verify your account before signing in.",
  });
}

async function sendVerificationEmail(builderId: string, email: string, requestUrl: string) {
  const token = createEmailVerificationToken(builderId, email);
  const origin = new URL(requestUrl).origin;
  const verifyUrl = `${origin}/builder/verify-email?token=${encodeURIComponent(token)}`;
  const sent = await sendEmail({
    to: email,
    subject: "Verify your ADUflow builder account",
    html: `
      <p>Welcome to ADUflow. Verify your builder account to finish setting up your portal.</p>
      <p><a href="${verifyUrl}">Verify your email</a>. This link expires in 7 days.</p>
      <p>If you did not create this account, you can ignore this email.</p>
    `,
  });
  return { sent, url: verifyUrl };
}
