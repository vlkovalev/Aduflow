import { randomUUID } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";

export type ProductEventInput = {
  eventName: string;
  path: string;
  sessionId?: string;
  metadata?: Record<string, string | number | boolean>;
};

const EVENT_NAME = /^[a-z][a-z0-9_]{1,63}$/;

export async function recordProductEvent(input: ProductEventInput): Promise<void> {
  if (!EVENT_NAME.test(input.eventName)) throw new Error("Invalid event name");
  const supabase = getSupabaseServiceClient();
  if (!supabase) return;

  const metadata = Object.fromEntries(
    Object.entries(input.metadata || {}).filter(([, value]) =>
      ["string", "number", "boolean"].includes(typeof value),
    ),
  );
  const { error } = await supabase.from("product_events").insert({
    id: randomUUID(),
    event_name: input.eventName,
    path: input.path.slice(0, 500),
    session_id: input.sessionId?.slice(0, 120) || "",
    metadata,
  });
  if (error) throw new Error(error.message);
}
