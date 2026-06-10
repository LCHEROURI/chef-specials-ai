import { toSavePromptArgs } from "./prompt-api";

test("maps a new prompt to the transactional RPC", () => {
  expect(
    toSavePromptArgs(null, {
      aiPlatform: "Claude",
      category: "Research",
      changeNotes: "",
      description: "A useful research prompt",
      favorite: true,
      folderIds: [],
      promptText: "Research the market.",
      rating: 4,
      status: "active",
      tagIds: [],
      title: "Market research"
    })
  ).toMatchObject({
    p_ai_platform: "Claude",
    p_category: "Research",
    p_id: null,
    p_prompt_text: "Research the market.",
    p_rating: 4,
    p_title: "Market research"
  });
});
