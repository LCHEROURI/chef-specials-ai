import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../types/database";
import type { LibraryFilters } from "./library-search";

export const LIBRARY_PAGE_SIZE = 24;

export type LibraryPrompt = Omit<
  Database["public"]["Tables"]["prompts"]["Row"],
  "search_document"
> & { total_count: number };

export async function searchPromptLibrary(filters: LibraryFilters) {
  const { data, error } = await supabase.rpc("search_prompts", {
    p_category: filters.category,
    p_favorite: filters.favorite || null,
    p_limit: LIBRARY_PAGE_SIZE,
    p_min_rating: filters.rating,
    p_offset: (filters.page - 1) * LIBRARY_PAGE_SIZE,
    p_platform: filters.platform,
    p_query: filters.query || null,
    p_sort: filters.sort,
    p_status: "active",
    p_tags: null
  });

  if (error) throw error;
  return data;
}
