export const promptKeys = {
  all: ["prompts"] as const,
  detail: (id: string) => ["prompts", "detail", id] as const,
  versions: (id: string) => ["prompts", "versions", id] as const
};
