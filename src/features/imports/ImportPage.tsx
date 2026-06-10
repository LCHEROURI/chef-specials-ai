import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileUp, Upload } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/toast-context";
import { getEntitlements } from "../billing/entitlement-api";
import { savePrompt } from "../prompts/prompt-api";
import { promptKeys } from "../prompts/prompt-keys";
import {
  parseImportFile,
  toPromptValues
} from "./parse-import";
import type { ImportReview } from "./import-types";

export function ImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [filename, setFilename] = useState("");
  const [review, setReview] = useState<ImportReview | null>(null);
  const [parseError, setParseError] = useState("");
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!review || review.errors.length) {
        throw new Error("Fix invalid rows before importing.");
      }
      const allowance = await getEntitlements();
      if (allowance.limit && review.prompts.length > (allowance.remaining ?? 0)) {
        throw new Error(
          `Your free plan has room for ${allowance.remaining} more prompts.`
        );
      }
      for (const candidate of review.prompts) {
        await savePrompt(null, toPromptValues(candidate));
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: promptKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["entitlements"] })
      ]);
      notify(`${review?.prompts.length ?? 0} prompts imported`);
      navigate("/");
    }
  });

  async function readFile(file: File) {
    setFilename(file.name);
    setParseError("");
    try {
      setReview(await parseImportFile(file));
    } catch (error) {
      setReview(null);
      setParseError(
        error instanceof Error ? error.message : "This file could not be read."
      );
    }
  }

  return (
    <section className="editor-page">
      <header className="page-titlebar">
        <div>
          <Link className="back-link" to="/">
            <ArrowLeft size={17} /> Prompt library
          </Link>
          <h1>Import prompts</h1>
          <p>
            Bring in TXT, Markdown, CSV, or DOCX collections. CSV headers:
            title, prompt_text, description, category, ai_platform, rating,
            favorite.
          </p>
        </div>
      </header>

      <div className="import-layout">
        <label className="import-dropzone">
          <FileUp size={30} />
          <strong>{filename || "Choose a prompt collection"}</strong>
          <span>Maximum file size: 10 MB</span>
          <input
            accept=".txt,.md,.markdown,.csv,.docx"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readFile(file);
            }}
            type="file"
          />
        </label>

        {parseError ? <p className="form-error">{parseError}</p> : null}
        {review ? (
          <section className="import-review">
            <div className="import-summary">
              <strong>{review.prompts.length} valid prompts</strong>
              <span>{review.errors.length} rows need attention</span>
            </div>
            {review.errors.length ? (
              <ul className="import-errors">
                {review.errors.map((error) => (
                  <li key={`${error.row}-${error.message}`}>
                    Row {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="import-table">
                {review.prompts.map((prompt) => (
                  <article key={`${prompt.sourceRow}-${prompt.title}`}>
                    <strong>{prompt.title}</strong>
                    <span>{prompt.category} · {prompt.aiPlatform}</span>
                  </article>
                ))}
              </div>
            )}
            {importMutation.isError ? (
              <p className="form-error">{importMutation.error.message}</p>
            ) : null}
            <Button
              disabled={Boolean(review.errors.length)}
              loading={importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              <Upload size={17} /> Import all valid prompts
            </Button>
          </section>
        ) : null}
      </div>
    </section>
  );
}
