import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getAdminPasskeyHash } from "@/utils/security";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    supabaseAnonKey.length > 20
  );
};

// Custom fetch wrapper that attaches admin passkey hash via x-client-info header
// (x-client-info is pre-allowed by Supabase PostgREST CORS Access-Control-Allow-Headers)
const customSupabaseFetch: typeof fetch = (input, init) => {
  const adminHash = getAdminPasskeyHash();
  if (adminHash) {
    const headers = new Headers(init?.headers);
    headers.set("x-client-info", `japan-shop-admin/${adminHash}`);
    return fetch(input, { ...init, headers });
  }
  return fetch(input, init);
};

// Global singleton pattern to prevent multiple GoTrueClient instances during HMR / re-renders
const globalForSupabase = globalThis as unknown as {
  supabaseClient?: SupabaseClient | null;
};

export const supabase: SupabaseClient | null =
  globalForSupabase.supabaseClient ??
  (isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          fetch: customSupabaseFetch,
        },
      })
    : null);

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabaseClient = supabase;
}
