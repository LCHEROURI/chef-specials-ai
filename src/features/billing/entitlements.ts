export type AccountPlan = "free" | "pro";

export function getPromptAllowance(plan: AccountPlan, promptCount: number) {
  if (plan === "pro") {
    return { allowed: true, limit: null, remaining: null };
  }
  const remaining = Math.max(0, 25 - promptCount);
  return { allowed: remaining > 0, limit: 25, remaining };
}
