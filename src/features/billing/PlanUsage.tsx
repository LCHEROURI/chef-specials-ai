import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { getEntitlements } from "./entitlement-api";

export function PlanUsage() {
  const entitlements = useQuery({
    queryFn: getEntitlements,
    queryKey: ["entitlements"]
  });

  if (!entitlements.data) return null;

  const { limit, plan, promptCount, remaining } = entitlements.data;
  return (
    <div className="plan-usage">
      <div>
        <Sparkles size={15} />
        <strong>{plan === "pro" ? "Pro plan" : "Free plan"}</strong>
      </div>
      {limit ? (
        <>
          <div
            aria-label={`${promptCount} of ${limit} prompts used`}
            className="plan-usage__track"
          >
            <span
              style={{
                width: `${Math.min(100, (promptCount / limit) * 100)}%`
              }}
            />
          </div>
          <small>{remaining} prompts remaining</small>
        </>
      ) : (
        <small>Unlimited prompts</small>
      )}
    </div>
  );
}
