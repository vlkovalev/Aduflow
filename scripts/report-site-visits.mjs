import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

const DEFAULT_SINCE = "2026-07-22T15:21:17Z";

loadEnv(".env.local");

const since = process.argv.find((arg) => arg.startsWith("--since="))?.slice("--since=".length) || DEFAULT_SINCE;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const { data, error } = await supabase
  .from("site_visits")
  .select("created_at,path,referrer,session_id,visitor_hash,utm_source,utm_medium,utm_campaign,user_agent")
  .gte("created_at", since)
  .order("created_at", { ascending: false })
  .limit(500);

if (error) throw new Error(error.message);

const visits = data ?? [];
const uniqueSessions = new Set(visits.map((visit) => visit.session_id).filter(Boolean));
const uniqueVisitors = new Set(visits.map((visit) => visit.visitor_hash).filter(Boolean));
const byPath = countBy(visits, (visit) => visit.path || "(unknown)");
const byReferrer = countBy(visits, (visit) => normalizeReferrer(visit.referrer));
const byCampaign = countBy(visits, (visit) => visit.utm_campaign || "(none)");

console.log(`ADUflow visits since ${since}`);
console.log(`Total pageviews: ${visits.length}`);
console.log(`Unique sessions: ${uniqueSessions.size}`);
console.log(`Unique visitors: ${uniqueVisitors.size}`);
console.log("");
printCounts("Top paths", byPath);
printCounts("Top referrers", byReferrer);
printCounts("UTM campaigns", byCampaign);
console.log("Recent visits:");
for (const visit of visits.slice(0, 20)) {
  console.log(`- ${visit.created_at} ${visit.path} ref=${normalizeReferrer(visit.referrer)}`);
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function printCounts(title, rows) {
  console.log(`${title}:`);
  for (const [key, count] of rows.slice(0, 10)) {
    console.log(`- ${count} ${key}`);
  }
  if (!rows.length) console.log("- none");
  console.log("");
}

function normalizeReferrer(referrer) {
  if (!referrer) return "(direct)";
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return referrer.slice(0, 80);
  }
}

function loadEnv(file) {
  const envPath = path.resolve(file);
  let raw = "";
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
