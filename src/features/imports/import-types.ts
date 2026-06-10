import type { PromptFormValues } from "../prompts/prompt-schema";

export type ImportCandidate = PromptFormValues & {
  sourceRow: number;
};

export type ImportReview = {
  errors: Array<{ message: string; row: number }>;
  prompts: ImportCandidate[];
};
