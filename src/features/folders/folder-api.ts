import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";

export type Folder = Database["public"]["Tables"]["folders"]["Row"];

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Authentication required");
  return data.user.id;
}

export async function getFolders() {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("folder_name");
  if (error) throw error;
  return data;
}

export async function createFolder(folderName: string, color = "#176b54") {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("folders")
    .insert({ color, folder_name: folderName.trim(), user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateFolder(
  folderId: string,
  updates: Pick<Folder, "color" | "folder_name">
) {
  const { data, error } = await supabase
    .from("folders")
    .update(updates)
    .eq("id", folderId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFolder(folderId: string) {
  const { error } = await supabase.from("folders").delete().eq("id", folderId);
  if (error) throw error;
}
