import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("seeds the personal master and power prompt frameworks", () => {
  const seedPath = resolve(process.cwd(), "supabase/seed.sql");
  const seed = readFileSync(seedPath, "utf8");

  expect(seed).toContain("'Master Prompt Template'");
  expect(seed).toContain("'Power Prompt Builder'");
  expect(seed).toContain("ROLE:");
  expect(seed).toContain("CONTEXT:");
  expect(seed).toContain("OBJECTIVE:");
  expect(seed).toContain("QUALITY CHECK:");
});
