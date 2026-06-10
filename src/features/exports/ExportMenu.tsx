import { Download } from "lucide-react";
import { useState } from "react";
import type { EditablePrompt } from "../prompts/prompt-api";
import {
  exportPrompt,
  type ExportFormat
} from "./export-prompt";

export function ExportMenu({ prompt }: { prompt: EditablePrompt }) {
  const [open, setOpen] = useState(false);

  async function choose(format: ExportFormat) {
    await exportPrompt(prompt, format);
    setOpen(false);
  }

  return (
    <div className="export-menu">
      <button
        className="detail-action"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Download size={18} /> Export prompt
      </button>
      {open ? (
        <div className="export-menu__options">
          {(["txt", "md", "docx", "pdf"] as const).map((format) => (
            <button key={format} onClick={() => choose(format)} type="button">
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
