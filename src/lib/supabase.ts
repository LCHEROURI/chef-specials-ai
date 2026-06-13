import { createClient } from "@supabase/supabase-js";
import { readEnv } from "./env";
import type { Database } from "../types/database";

const env = readEnv(import.meta.env);

export const supabaseAuthOptions = {
  detectSessionInUrl: false,
  flowType: "pkce" as const,
  persistSession: true
};

export const supabase = createClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: supabaseAuthOptions
  }
);
