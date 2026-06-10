import { supabase } from "../../lib/supabase";
import { getPromptAllowance } from "./entitlements";

export async function getEntitlements() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw userError ?? new Error("Authentication required");
  }

  const [profileResult, countResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", userData.user.id)
      .single(),
    supabase
      .from("prompts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userData.user.id)
  ]);
  if (profileResult.error) throw profileResult.error;
  if (countResult.error) throw countResult.error;

  const plan = profileResult.data.plan;
  const promptCount = countResult.count ?? 0;
  return { plan, promptCount, ...getPromptAllowance(plan, promptCount) };
}
