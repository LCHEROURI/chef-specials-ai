import { supabase } from "../../../lib/supabase";

const allowedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "image/png",
  "image/jpeg"
]);

export async function getPromptFiles(promptId: string) {
  const { data, error } = await supabase
    .from("prompt_files")
    .select("*")
    .eq("prompt_id", promptId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function uploadPromptFile(promptId: string, file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("Files must be 10 MB or smaller.");
  if (!allowedTypes.has(file.type)) throw new Error("This file type is not supported.");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication required");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${userData.user.id}/${promptId}/${crypto.randomUUID()}-${safeName}`;
  const upload = await supabase.storage.from("prompt-files").upload(storagePath, file);
  if (upload.error) throw upload.error;

  const { data, error } = await supabase
    .from("prompt_files")
    .insert({
      file_name: file.name,
      mime_type: file.type,
      prompt_id: promptId,
      size_bytes: file.size,
      storage_path: storagePath,
      user_id: userData.user.id
    })
    .select("*")
    .single();
  if (error) {
    await supabase.storage.from("prompt-files").remove([storagePath]);
    throw error;
  }
  return data;
}

export async function openPromptFile(storagePath: string) {
  const { data, error } = await supabase.storage
    .from("prompt-files")
    .createSignedUrl(storagePath, 60);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

export async function deletePromptFile(id: string, storagePath: string) {
  const storage = await supabase.storage.from("prompt-files").remove([storagePath]);
  if (storage.error) throw storage.error;
  const { error } = await supabase.from("prompt_files").delete().eq("id", id);
  if (error) throw error;
}
