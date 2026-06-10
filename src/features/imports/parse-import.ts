import Papa from "papaparse";
import {
  defaultPromptValues,
  promptSchema,
  type PromptFormValues
} from "../prompts/prompt-schema";
import type { ImportCandidate, ImportReview } from "./import-types";

type CsvRow = {
  ai_platform?: string;
  category?: string;
  description?: string;
  favorite?: string;
  prompt_text?: string;
  rating?: string;
  title?: string;
};

function titleFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function candidateFromText(
  filename: string,
  promptText: string,
  sourceRow = 1
): ImportCandidate {
  return {
    ...defaultPromptValues,
    promptText: promptText.trim(),
    sourceRow,
    title: titleFromFilename(filename) || "Imported prompt"
  };
}

function readBlobAsText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(blob);
  });
}

function readBlobAsArrayBuffer(blob: Blob) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });
}

function reviewCandidates(candidates: ImportCandidate[]): ImportReview {
  const prompts: ImportCandidate[] = [];
  const errors: ImportReview["errors"] = [];

  for (const candidate of candidates) {
    const result = promptSchema.safeParse(candidate);
    if (result.success) {
      prompts.push(candidate);
    } else {
      errors.push({
        message: result.error.issues.map((issue) => issue.message).join(", "),
        row: candidate.sourceRow
      });
    }
  }
  return { errors, prompts };
}

function csvCandidate(row: CsvRow, sourceRow: number): ImportCandidate {
  const rating = row.rating ? Number(row.rating) : null;
  return {
    ...defaultPromptValues,
    aiPlatform: row.ai_platform?.trim() || "ChatGPT",
    category: row.category?.trim() || "Custom",
    description: row.description?.trim() || "",
    favorite: row.favorite?.toLowerCase() === "true",
    promptText: row.prompt_text?.trim() || "",
    rating: Number.isInteger(rating) ? rating : null,
    sourceRow,
    title: row.title?.trim() || ""
  };
}

export async function parseImportFile(file: File): Promise<ImportReview> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const parsed = Papa.parse<CsvRow>(await readBlobAsText(file), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase()
    });
    const parserErrors = parsed.errors.map((error) => ({
      message: error.message,
      row: (error.row ?? 0) + 2
    }));
    const review = reviewCandidates(
      parsed.data.map((row, index) => csvCandidate(row, index + 2))
    );
    return { errors: [...parserErrors, ...review.errors], prompts: review.prompts };
  }

  if (extension === "docx") {
    const { default: mammoth } = await import("mammoth");
    const result = await mammoth.extractRawText({
      arrayBuffer: await readBlobAsArrayBuffer(file)
    });
    return reviewCandidates([candidateFromText(file.name, result.value)]);
  }

  if (extension === "txt" || extension === "md" || extension === "markdown") {
    return reviewCandidates([
      candidateFromText(file.name, await readBlobAsText(file))
    ]);
  }

  return {
    errors: [{ message: "Use a TXT, Markdown, CSV, or DOCX file.", row: 1 }],
    prompts: []
  };
}

export function toPromptValues(candidate: ImportCandidate): PromptFormValues {
  return {
    aiPlatform: candidate.aiPlatform,
    category: candidate.category,
    changeNotes: candidate.changeNotes,
    description: candidate.description,
    favorite: candidate.favorite,
    folderIds: candidate.folderIds,
    promptText: candidate.promptText,
    rating: candidate.rating,
    status: candidate.status,
    tagIds: candidate.tagIds,
    title: candidate.title
  };
}
