import { NextResponse } from "next/server";
import { decodePasswordResetToken, hashPassword, passwordHashFingerprint } from "../../../../lib/auth";
import { getBuilderPasswordHashById, updateBuilderPassword } from "../../../../lib/builderStore";
import { clientIp, rateLimit } from "../../../../lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = await rateLimit(`reset-password:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: "Password must be 8-200 characters." }, { status: 400 });
  }

  const decoded = decodePasswordResetToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const currentPasswordHash = await getBuilderPasswordHashById(decoded.builderId);
  if (!currentPasswordHash || passwordHashFingerprint(currentPasswordHash) !== decoded.fingerprint) {
    // Either the builder no longer exists, or the password already changed
    // since this token was issued (token reuse after a prior reset).
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  await updateBuilderPassword(decoded.builderId, hashPassword(password));

  return NextResponse.json({ message: "Password updated. You can now sign in." });
}
