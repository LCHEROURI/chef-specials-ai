import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";
import type { PromptFormValues } from "./prompt-schema";

export type Prompt = Database["public"]["Tables"]["prompts"]["Row"];
export type PromptVersion =
  Database["public"]["Tables"]["prompt_versions"]["Row"];
type SavePromptArgs =
  Database["public"]["Functions"]["save_prompt"]["Args"];

export function toSavePromptArgs(
  promptId: string | null,
  values: PromptFormValues
): SavePromptArgs {
  return {
    p_ai_platform: values.aiPlatform,
    p_category: values.category,
    p_change_notes: values.changeNotes || null,
    p_description: values.description,
    p_favorite: values.favorite,
    p_id: promptId,
    p_prompt_text: values.promptText,
    p_rating: values.rating,
    p_status: values.status,
    p_title: values.title
  };
}

export async function savePrompt(
  promptId: string | null,
  values: PromptFormValues
) {
  const { data, error } = await supabase.rpc(
    "save_prompt",
    toSavePromptArgs(promptId, values)
  );

  if (error) throw error;
  return data;
}

export async function getPrompt(promptId: string) {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", promptId)
    .single();

  if (error) throw error;
  return data;
}

export async function getPromptVersions(promptId: string) {
  const { data, error } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("prompt_id", promptId)
    .order("version_number", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updatePromptFlags(
  prompt: Prompt,
  updates: Pick<Prompt, "favorite" | "status">
) {
  return savePrompt(prompt.id, {
    aiPlatform: prompt.ai_platform,
    category: prompt.category,
    changeNotes: "",
    description: prompt.description,
    favorite: updates.favorite,
    folderIds: [],
    promptText: prompt.prompt_text,
    rating: prompt.rating,
    status: updates.status,
    tagIds: [],
    title: prompt.title
  });
}

export async function deletePrompt(promptId: string) {
  const { error } = await supabase.from("prompts").delete().eq("id", promptId);
  if (error) throw error;
}

export async function recordPromptUse(promptId: string) {
  const { error } = await supabase.rpc("record_prompt_use", {
    p_prompt_id: promptId
  });
  if (error) throw error;
}
