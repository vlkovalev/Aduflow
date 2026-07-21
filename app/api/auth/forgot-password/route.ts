import { NextResponse } from "next/server";
import { getBuilderAuthByEmail } from "../../../../lib/builderStore";
import { createPasswordResetToken } from "../../../../lib/auth";
import { clientIp, rateLimit } from "../../../../lib/rateLimit";
import { sendEmail } from "../../../../lib/email";
import { readEnv } from "../../../../lib/env";

export const runtime = "nodejs";

const GENERIC_RESPONSE = {
  message: "If an account exists for that email, a password reset link has been sent.",
};

export async function POST(request: Request) {
  // Throttle enumeration/abuse attempts (same pattern as register/login).
  const ip = clientIp(request);
  const limit = await rateLimit(`forgot-password:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Always return the same generic message regardless of whether the email
  // exists, to avoid leaking which addresses have accounts.
  const account = await getBuilderAuthByEmail(email);
  if (account) {
    const token = createPasswordResetToken(account.id, account.passwordHash);
    const origin = readEnv("NEXT_PUBLIC_SITE_URL") || new URL(request.url).origin;
    const resetUrl = `${origin}/builder/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: account.email,
      subject: "Reset your ADUflow password",
      html: `
        <p>Someone requested a password reset for your ADUflow builder account.</p>
        <p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
