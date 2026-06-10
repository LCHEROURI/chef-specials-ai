import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";

export type PromptTemplate = Database["public"]["Tables"]["templates"]["Row"];

export async function getTemplates() {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("category")
    .order("title");
  if (error) throw error;
  return data;
}
