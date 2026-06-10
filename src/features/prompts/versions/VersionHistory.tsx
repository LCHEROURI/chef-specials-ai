import { useMutation, useQueryClient } from "@tanstack/react-query";
import { History, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/toast-context";
import { savePrompt, type Prompt, type PromptVersion } from "../prompt-api";
import { promptKeys } from "../prompt-keys";
import { VersionDiff } from "./VersionDiff";

export function VersionHistory({
  prompt,
  versions
}: {
  prompt: Prompt;
  versions: PromptVersion[];
}) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = versions.find((version) => version.id === selectedId);
  const rollback = useMutation({
    mutationFn: (version: PromptVersion) =>
      savePrompt(prompt.id, {
        aiPlatform: prompt.ai_platform,
        category: prompt.category,
        changeNotes: `Restored version ${version.version_number}`,
        description: prompt.description,
        favorite: prompt.favorite,
        folderIds: [],
        promptText: version.prompt_text,
        rating: prompt.rating,
        status: prompt.status,
        tagIds: [],
        title: prompt.title
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: promptKeys.detail(prompt.id)
        }),
        queryClient.invalidateQueries({
          queryKey: promptKeys.versions(prompt.id)
        }),
        queryClient.invalidateQueries({ queryKey: promptKeys.all })
      ]);
      notify("Version restored as the newest version");
      setSelectedId(null);
    }
  });

  return (
    <section className="editor-card version-history">
      <h2>
        <History aria-hidden="true" size={19} /> Version history
      </h2>
      {versions.length ? (
        <ol className="version-list">
          {versions.map((version) => (
            <li key={version.id}>
              <button
                className={selectedId === version.id ? "is-active" : ""}
                onClick={() =>
                  setSelectedId((current) =>
                    current === version.id ? null : version.id
                  )
                }
                type="button"
              >
                <strong>Version {version.version_number}</strong>
                <span>{version.change_notes || "Prompt content updated"}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted-copy">No versions available yet.</p>
      )}

      {selected ? (
        <div className="version-preview">
          <div>
            <span className="sidebar-section-label">Changes to current</span>
            <VersionDiff
              currentText={prompt.prompt_text}
              previousText={selected.prompt_text}
            />
          </div>
          {selected.prompt_text !== prompt.prompt_text ? (
            <Button
              loading={rollback.isPending}
              onClick={() => rollback.mutate(selected)}
              variant="secondary"
            >
              <RotateCcw size={16} /> Restore this version
            </Button>
          ) : (
            <span className="muted-copy">This is the current prompt text.</span>
          )}
        </div>
      ) : null}
    </section>
  );
}
