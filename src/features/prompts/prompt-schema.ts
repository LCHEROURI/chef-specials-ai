import { z } from "zod";

export const promptSchema = z.object({
  aiPlatform: z.string().trim().min(1, "Choose an AI platform"),
  category: z.string().trim().min(1, "Choose a category"),
  changeNotes: z.string().trim().max(300),
  description: z.string().trim().max(500),
  favorite: z.boolean(),
  folderIds: z.array(z.string()),
  promptText: z.string().trim().min(1, "Prompt content is required"),
  rating: z.number().int().min(1).max(5).nullable(),
  status: z.enum(["active", "archived"]),
  tagIds: z.array(z.string()),
  title: z.string().trim().min(1, "Title is required").max(120)
});

export type PromptFormValues = z.infer<typeof promptSchema>;

export const defaultPromptValues: PromptFormValues = {
  aiPlatform: "ChatGPT",
  category: "Business",
  changeNotes: "",
  description: "",
  favorite: false,
  folderIds: [],
  promptText: "",
  rating: null,
  status: "active",
  tagIds: [],
  title: ""
};
