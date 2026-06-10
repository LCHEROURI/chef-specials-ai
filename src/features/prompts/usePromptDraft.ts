import { useEffect } from "react";
import type { PromptFormValues } from "./prompt-schema";

const draftKey = "prompt-vault:new-prompt-draft";

export function readPromptDraft() {
  try {
    const value = localStorage.getItem(draftKey);
    return value ? (JSON.parse(value) as Partial<PromptFormValues>) : null;
  } catch {
    return null;
  }
}

export function clearPromptDraft() {
  localStorage.removeItem(draftKey);
}

export function usePromptDraft(
  values: Partial<PromptFormValues>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const timeout = window.setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(values));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [enabled, values]);
}
