import { NextResponse } from "next/server";
import { createEmailVerificationToken } from "../../../../lib/auth";
import {
  getBuilderAuthByEmail,
  isBuilderEmailVerified,
  setBuilderEmailVerification,
} from "../../../../lib/builderStore";
import { isEmailConfigured, sendEmail } from "../../../../lib/email";
import { readEnv } from "../../../../lib/env";
import { clientIp, rateLimit } from "../../../../lib/rateLimit";

export const runtime = "nodejs";

const GENERIC_RESPONSE = {
  message: "If this account needs verification, a new verification link has been sent.",
};

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = await rateLimit(`resend-verification:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many verification requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production" && !isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email verification is temporarily unavailable. Please contact ADUflow support." },
      { status: 503 },
    );
  }

  const account = await getBuilderAuthByEmail(email);
  let verificationUrl: string | undefined;
  if (account && !(await isBuilderEmailVerified(account.id))) {
    await setBuilderEmailVerification(account.id, false);
    const token = createEmailVerificationToken(account.id, account.email);
    const origin = readEnv("NEXT_PUBLIC_SITE_URL") || new URL(request.url).origin;
    const verifyUrl = `${origin}/builder/verify-email?token=${encodeURIComponent(token)}`;
    const sent = await sendEmail({
      to: account.email,
      subject: "Verify your ADUflow builder account",
      html: `
        <p>Use this link to verify your ADUflow builder account.</p>
        <p><a href="${verifyUrl}">Verify your email</a>. This link expires in 7 days.</p>
      `,
    });
    if (!sent && process.env.NODE_ENV !== "production") verificationUrl = verifyUrl;
  }

  return NextResponse.json({ ...GENERIC_RESPONSE, verificationUrl });
}
