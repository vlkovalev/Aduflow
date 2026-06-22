import { NextResponse } from "next/server";
import {
  decodeEmailVerificationToken,
  matchesEmailVerificationToken,
} from "../../../../lib/auth";
import {
  getBuilderEmailVerificationTarget,
  markBuilderEmailVerified,
} from "../../../../lib/builderStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const decoded = decodeEmailVerificationToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
  }

  const target = await getBuilderEmailVerificationTarget(decoded.builderId);
  if (!target || !matchesEmailVerificationToken(target.email, decoded.emailHash)) {
    return NextResponse.json({ error: "This verification link no longer matches the account email." }, { status: 400 });
  }

  const ok = await markBuilderEmailVerified(decoded.builderId);
  if (!ok) {
    return NextResponse.json({ error: "Unable to verify this account." }, { status: 500 });
  }

  return NextResponse.json({ verified: true });
}
