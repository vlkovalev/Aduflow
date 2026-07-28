import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "../../../lib/rateLimit";
import { recordProductEvent } from "../../../lib/productEventStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = await rateLimit(`product-event:${ip}`, 120, 60);
  if (!limit.allowed) return NextResponse.json({ ok: true }, { status: 202 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const eventName = stringValue(body.eventName);
  const path = stringValue(body.path);
  if (!eventName || !path.startsWith("/")) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await recordProductEvent({
      eventName,
      path,
      sessionId: stringValue(body.sessionId),
      metadata: isMetadata(body.metadata) ? body.metadata : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ ok: false }, { status: 202 }); }
}

function stringValue(value: unknown): string { return typeof value === "string" ? value.trim().slice(0, 500) : ""; }
function isMetadata(value: unknown): value is Record<string, string | number | boolean> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
