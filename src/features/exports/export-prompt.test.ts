import { exportFilename, promptAsMarkdown, safeFilename } from "./export-prompt";

const prompt = {
  ai_platform: "ChatGPT",
  category: "Business",
  created_at: "",
  description: "A useful prompt",
  favorite: false,
  id: "prompt-id",
  prompt_text: "Analyze the company.",
  rating: 5,
  status: "active" as const,
  title: "SWOT: Analysis / Pro",
  updated_at: "",
  user_id: "user-id"
};

test("creates safe dated filenames", () => {
  expect(safeFilename(prompt.title)).toBe("swot-analysis-pro");
  expect(exportFilename(prompt.title, "md", new Date("2026-06-10"))).toBe(
    "swot-analysis-pro-2026-06-10.md"
  );
});

test("markdown includes metadata and prompt content", () => {
  expect(promptAsMarkdown(prompt)).toContain("**AI platform:** ChatGPT");
  expect(promptAsMarkdown(prompt)).toContain("Analyze the company.");
});
