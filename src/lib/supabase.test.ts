import { describe, expect, it } from "vitest";
import { supabaseAuthOptions } from "./supabase";

describe("Supabase auth configuration", () => {
  it("leaves PKCE callback exchange to the callback route", () => {
    expect(supabaseAuthOptions).toMatchObject({
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true
    });
  });
});
