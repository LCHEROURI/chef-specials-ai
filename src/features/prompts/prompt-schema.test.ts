import { promptSchema } from "./prompt-schema";

const validPrompt = {
  aiPlatform: "ChatGPT",
  category: "Business",
  changeNotes: "",
  description: "",
  favorite: false,
  folderIds: [],
  promptText: "Analyze this business.",
  rating: null,
  status: "active" as const,
  tagIds: [],
  title: "Business analysis"
};

test("requires a prompt title", () => {
  const result = promptSchema.safeParse({ ...validPrompt, title: " " });
  expect(result.success).toBe(false);
});

test("requires prompt content", () => {
  const result = promptSchema.safeParse({ ...validPrompt, promptText: "" });
  expect(result.success).toBe(false);
});

test("accepts ratings from one to five or null", () => {
  expect(promptSchema.safeParse({ ...validPrompt, rating: 5 }).success).toBe(
    true
  );
  expect(promptSchema.safeParse({ ...validPrompt, rating: null }).success).toBe(
    true
  );
  expect(promptSchema.safeParse({ ...validPrompt, rating: 6 }).success).toBe(
    false
  );
});
