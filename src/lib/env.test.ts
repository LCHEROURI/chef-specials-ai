import { readEnv } from "./env";

test("rejects missing Supabase configuration", () => {
  expect(() => readEnv({})).toThrow("VITE_SUPABASE_URL");
});
