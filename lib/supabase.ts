import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;
let isSupabaseHealthy = true;

export function markSupabaseUnhealthy() {
  isSupabaseHealthy = false;
}

export function isSupabaseActive() {
  return isSupabaseHealthy;
}

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !isSupabaseHealthy) {
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
            isSupabaseHealthy = false;
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !isSupabaseHealthy) {
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
            isSupabaseHealthy = false;
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


