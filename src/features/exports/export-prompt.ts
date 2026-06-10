import type { EditablePrompt } from "../prompts/prompt-api";

export type ExportFormat = "txt" | "md" | "docx" | "pdf";

export function safeFilename(title: string) {
  return (
    title
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase() || "prompt"
  );
}

export function exportFilename(
  title: string,
  format: ExportFormat,
  date = new Date()
) {
  return `${safeFilename(title)}-${date.toISOString().slice(0, 10)}.${format}`;
}

export function promptAsText(prompt: EditablePrompt) {
  return [
    prompt.title,
    "",
    prompt.description,
    "",
    `Category: ${prompt.category}`,
    `AI platform: ${prompt.ai_platform}`,
    `Rating: ${prompt.rating ?? "Not rated"}`,
    "",
    prompt.prompt_text
  ].join("\n");
}

export function promptAsMarkdown(prompt: EditablePrompt) {
  return [
    `# ${prompt.title}`,
    "",
    prompt.description,
    "",
    `- **Category:** ${prompt.category}`,
    `- **AI platform:** ${prompt.ai_platform}`,
    `- **Rating:** ${prompt.rating ?? "Not rated"}`,
    "",
    "## Prompt",
    "",
    "```text",
    prompt.prompt_text,
    "```"
  ].join("\n");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportPrompt(
  prompt: EditablePrompt,
  format: ExportFormat
) {
  const filename = exportFilename(prompt.title, format);
  if (format === "txt" || format === "md") {
    const content =
      format === "md" ? promptAsMarkdown(prompt) : promptAsText(prompt);
    downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), filename);
    return;
  }

  if (format === "docx") {
    const { Document, HeadingLevel, Packer, Paragraph } = await import("docx");
    const document = new Document({
      sections: [{
        children: [
          new Paragraph({ heading: HeadingLevel.TITLE, text: prompt.title }),
          new Paragraph(prompt.description),
          new Paragraph(`Category: ${prompt.category}`),
          new Paragraph(`AI platform: ${prompt.ai_platform}`),
          new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Prompt" }),
          ...prompt.prompt_text.split("\n").map((line) => new Paragraph(line))
        ]
      }]
    });
    downloadBlob(await Packer.toBlob(document), filename);
    return;
  }

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  const lines = pdf.splitTextToSize(promptAsText(prompt), 175);
  pdf.text(lines, 18, 20);
  pdf.save(filename);
}
