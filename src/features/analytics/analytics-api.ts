import { supabase } from "../../lib/supabase";

export async function getAnalytics() {
  const [promptsResult, usageResult] = await Promise.all([
    supabase
      .from("prompts")
      .select("id,title,category,ai_platform,rating,favorite,created_at"),
    supabase.from("prompt_usage").select("prompt_id,use_count,last_used")
  ]);
  if (promptsResult.error) throw promptsResult.error;
  if (usageResult.error) throw usageResult.error;

  const prompts = promptsResult.data;
  const usage = usageResult.data;
  const sumBy = (key: "category" | "ai_platform") =>
    Object.entries(
      prompts.reduce<Record<string, number>>((totals, prompt) => {
        totals[prompt[key]] = (totals[prompt[key]] ?? 0) + 1;
        return totals;
      }, {})
    ).sort((a, b) => b[1] - a[1]);

  return {
    categories: sumBy("category"),
    favorites: prompts.filter((prompt) => prompt.favorite).length,
    highestRated: [...prompts]
      .filter((prompt) => prompt.rating)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 5),
    mostUsed: [...usage]
      .sort((a, b) => Number(b.use_count) - Number(a.use_count))
      .slice(0, 5)
      .map((item) => ({
        ...item,
        title:
          prompts.find((prompt) => prompt.id === item.prompt_id)?.title ??
          "Deleted prompt"
      })),
    platforms: sumBy("ai_platform"),
    total: prompts.length,
    totalUses: usage.reduce((sum, item) => sum + Number(item.use_count), 0)
  };
}
