import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { readEnv } from "../../../lib/env";
import { clientIp, rateLimit } from "../../../lib/rateLimit";
import { recordSiteVisit } from "../../../lib/siteVisitStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = await rateLimit(`visit:${ip}`, 60, 60);
  if (!limit.allowed) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = stringValue(body.path);
  if (!path || !path.startsWith("/") || path.length > 500) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await recordSiteVisit({
      path,
      pageTitle: stringValue(body.pageTitle),
      referrer: stringValue(body.referrer),
      sessionId: stringValue(body.sessionId),
      visitorHash: hashVisitor(ip, request.headers.get("user-agent") || ""),
      userAgent: request.headers.get("user-agent") || "",
      utmSource: stringValue(body.utmSource),
      utmMedium: stringValue(body.utmMedium),
      utmCampaign: stringValue(body.utmCampaign),
      utmTerm: stringValue(body.utmTerm),
      utmContent: stringValue(body.utmContent),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hashVisitor(ip: string, userAgent: string): string {
  const secret = readEnv("APP_SECRET") || "aduflow-dev-visit-hash";
  return createHash("sha256").update(`${secret}:${ip}:${userAgent}`).digest("hex");
}
