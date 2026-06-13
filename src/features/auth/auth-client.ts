import type { Provider } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

type AuthResult = Promise<{ error: { message: string } | null }>;

export type AuthClient = {
  exchangeCodeForSession: (code: string) => AuthResult;
  signInWithOAuth: (credentials: {
    provider: Provider;
    options: { redirectTo: string };
  }) => AuthResult;
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => AuthResult;
  signUp: (credentials: {
    email: string;
    password: string;
    options: { emailRedirectTo: string };
  }) => AuthResult;
};

export const authClient: AuthClient = {
  exchangeCodeForSession: (code) =>
    supabase.auth.exchangeCodeForSession(code),
  signInWithOAuth: (credentials) =>
    supabase.auth.signInWithOAuth(credentials),
  signInWithPassword: (credentials) =>
    supabase.auth.signInWithPassword(credentials),
  signUp: (credentials) => supabase.auth.signUp(credentials)
};
