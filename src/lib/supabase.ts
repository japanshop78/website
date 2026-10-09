import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
      })
    : null);

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabaseClient = supabase;
}
