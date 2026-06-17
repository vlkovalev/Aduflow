import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readEnv } from "./env";

let browserClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

// A transient Supabase error (timeout, network blip) used to disable Supabase
// for the rest of the warm instance's lifetime, silently falling back to
// instance-local /tmp storage. On serverless that caused different concurrent
// instances to disagree about where data lives, and data written during a
// "degraded" window could vanish on cold start. Instead, treat unhealthy as a
// short cooldown: retry Supabase on the next call once it elapses.
const UNHEALTHY_COOLDOWN_MS = 30_000;
let unhealthyUntil = 0;

export function markSupabaseUnhealthy() {
  unhealthyUntil = Date.now() + UNHEALTHY_COOLDOWN_MS;
}

export function isSupabaseActive() {
  return Date.now() >= unhealthyUntil;
}

export function getSupabaseBrowserClient() {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !isSupabaseActive()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (input, init) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          try {
            const res = await fetch(input, {
              ...init,
              signal: controller.signal,
            });
            clearTimeout(timer);
            return res;
          } catch (err) {
            clearTimeout(timer);
            markSupabaseUnhealthy();
            console.error("Supabase browser client request failed, fallback enabled:", err);
            return new Response(
              JSON.stringify({
                message: "Database offline (local fallback enabled)",
                code: "OFFLINE",
                details: err instanceof Error ? err.message : String(err),
              }),
              {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        },
      },
    });
  }

  return browserClient;
}

export function getSupabaseServiceClient() {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey || !isSupabaseActive()) {
    return null;
  }

  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
      global: {
        fetch: async (input, init) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          try {
            const res = await fetch(input, {
              ...init,
              signal: controller.signal,
            });
            clearTimeout(timer);
            return res;
          } catch (err) {
            clearTimeout(timer);
            markSupabaseUnhealthy();
            console.error("Supabase service client request failed, fallback enabled:", err);
            return new Response(
              JSON.stringify({
                message: "Database offline (local fallback enabled)",
                code: "OFFLINE",
                details: err instanceof Error ? err.message : String(err),
              }),
              {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        },
      },
    });
  }

  return serviceClient;
}

