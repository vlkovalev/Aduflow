import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

loadEnv(".env.local");
const since = process.argv.find((arg) => arg.startsWith("--since="))?.slice(8) || "2026-07-22T15:21:17Z";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase.from("product_events").select("created_at,event_name,path,session_id").gte("created_at", since).order("created_at", { ascending: false }).limit(1000);
if (error) throw new Error(error.message);
const events = data ?? [];
console.log(`ADUflow product events since ${since}`);
console.log(`Total events: ${events.length}`);
console.log(`Unique sessions: ${new Set(events.map((event) => event.session_id).filter(Boolean)).size}`);
console.log("Events:");
for (const [name, count] of countBy(events, (event) => event.event_name)) console.log(`- ${count} ${name}`);
console.log("Recent events:");
for (const event of events.slice(0, 20)) console.log(`- ${event.created_at} ${event.event_name} ${event.path}`);

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) counts.set(keyFn(row), (counts.get(keyFn(row)) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
function loadEnv(file) {
  let raw = "";
  try { raw = readFileSync(path.resolve(file), "utf8"); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
