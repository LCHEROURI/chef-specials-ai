import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";

export type Tag = Database["public"]["Tables"]["tags"]["Row"];

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Authentication required");
  return data.user.id;
}

export async function getTags() {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function createTag(name: string) {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("tags")
    .insert({ name: name.trim(), user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getPromptOrganization(promptId: string) {
  const [foldersResult, tagsResult] = await Promise.all([
    supabase
      .from("prompt_folders")
      .select("folder_id")
      .eq("prompt_id", promptId),
    supabase.from("prompt_tags").select("tag_id").eq("prompt_id", promptId)
  ]);
  if (foldersResult.error) throw foldersResult.error;
  if (tagsResult.error) throw tagsResult.error;
  return {
    folderIds: foldersResult.data.map((item) => item.folder_id),
    tagIds: tagsResult.data.map((item) => item.tag_id)
  };
}

export async function syncPromptOrganization(
  promptId: string,
  folderIds: string[],
  tagIds: string[]
) {
  const [deleteFolders, deleteTags] = await Promise.all([
    supabase.from("prompt_folders").delete().eq("prompt_id", promptId),
    supabase.from("prompt_tags").delete().eq("prompt_id", promptId)
  ]);
  if (deleteFolders.error) throw deleteFolders.error;
  if (deleteTags.error) throw deleteTags.error;

  const operations = [];
  if (folderIds.length) {
    operations.push(
      supabase
        .from("prompt_folders")
        .insert(folderIds.map((folderId) => ({ folder_id: folderId, prompt_id: promptId })))
    );
  }
  if (tagIds.length) {
    operations.push(
      supabase
        .from("prompt_tags")
        .insert(tagIds.map((tagId) => ({ prompt_id: promptId, tag_id: tagId })))
    );
  }
  const results = await Promise.all(operations);
  const failure = results.find((result) => result.error);
  if (failure?.error) throw failure.error;
}
