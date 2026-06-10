import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1)
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(values: Record<string, unknown>): AppEnv {
  return envSchema.parse(values);
}
