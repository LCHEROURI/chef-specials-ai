import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  Star,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/toast-context";
import {
  deletePrompt,
  getPrompt,
  getPromptVersions,
  recordPromptUse,
  updatePromptFlags
} from "./prompt-api";
import { promptKeys } from "./prompt-keys";
import { VersionHistory } from "./versions/VersionHistory";
import { ExportMenu } from "../exports/ExportMenu";
import { PromptFiles } from "./files/PromptFiles";

export function PromptDetail() {
  const { promptId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);
  const promptQuery = useQuery({
    queryFn: () => getPrompt(promptId),
    queryKey: promptKeys.detail(promptId)
  });
  const versionsQuery = useQuery({
    queryFn: () => getPromptVersions(promptId),
    queryKey: promptKeys.versions(promptId)
  });
  const flagMutation = useMutation({
    mutationFn: ({
      favorite,
      status
    }: {
      favorite: boolean;
      status: "active" | "archived";
    }) => updatePromptFlags(promptQuery.data!, { favorite, status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: promptKeys.detail(promptId)
      });
      await queryClient.invalidateQueries({ queryKey: promptKeys.all });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: () => deletePrompt(promptId),
    onSuccess: () => {
      notify("Prompt deleted");
      navigate("/");
    }
  });

  if (promptQuery.isLoading) {
    return <LoadingState label="Loading prompt..." />;
  }

  if (!promptQuery.data || promptQuery.isError) {
    return (
      <section className="detail-page">
        <h1>Prompt not found</h1>
        <Link to="/">Return to library</Link>
      </section>
    );
  }

  const prompt = promptQuery.data;

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    notify("Prompt copied");
    void recordPromptUse(prompt.id);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="detail-page">
      <header className="page-titlebar detail-titlebar">
        <div>
          <Link className="back-link" to="/">
            <ArrowLeft aria-hidden="true" size={17} /> Prompt library
          </Link>
          <div className="detail-kicker">
            <span>{prompt.category}</span>
            <span>{prompt.ai_platform}</span>
            {prompt.status === "archived" ? <span>Archived</span> : null}
          </div>
          <h1>{prompt.title}</h1>
          {prompt.description ? <p>{prompt.description}</p> : null}
        </div>
        <div className="detail-titlebar__actions">
          <Button onClick={copyPrompt}>
            {copied ? <Check size={17} /> : <Copy size={17} />}{" "}
            {copied ? "Copied" : "Copy prompt"}
          </Button>
          <Link className="ui-button ui-button--secondary" to="edit">
            <Edit3 aria-hidden="true" size={17} /> Edit
          </Link>
        </div>
      </header>

      <div className="prompt-detail-grid">
        <article className="prompt-paper">
          <div className="prompt-paper__header">
            <span>Prompt</span>
            {prompt.rating ? <span>{prompt.rating} / 5 rating</span> : null}
          </div>
          <pre>{prompt.prompt_text}</pre>
        </article>

        <aside className="detail-sidebar">
          <section className="editor-card">
            <h2>Quick actions</h2>
            <button
              className="detail-action"
              onClick={() =>
                flagMutation.mutate({
                  favorite: !prompt.favorite,
                  status: prompt.status
                })
              }
              type="button"
            >
              <Star
                fill={prompt.favorite ? "currentColor" : "none"}
                size={18}
              />
              {prompt.favorite ? "Remove favorite" : "Add favorite"}
            </button>
            <ExportMenu prompt={prompt} />
            <button
              className="detail-action"
              onClick={() =>
                flagMutation.mutate({
                  favorite: prompt.favorite,
                  status:
                    prompt.status === "active" ? "archived" : "active"
                })
              }
              type="button"
            >
              <Archive size={18} />
              {prompt.status === "active" ? "Archive prompt" : "Restore prompt"}
            </button>
            <button
              className="detail-action detail-action--danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm("Delete this prompt and its version history?")) {
                  deleteMutation.mutate();
                }
              }}
              type="button"
            >
              <Trash2 size={18} /> Delete prompt
            </button>
          </section>

          <VersionHistory prompt={prompt} versions={versionsQuery.data ?? []} />
          <PromptFiles promptId={prompt.id} />
        </aside>
      </div>
    </section>
  );
}
