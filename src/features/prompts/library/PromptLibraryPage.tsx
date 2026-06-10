import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/toast-context";
import { recordPromptUse, updatePromptFlags } from "../prompt-api";
import { promptKeys } from "../prompt-keys";
import { LibraryToolbar } from "./LibraryToolbar";
import {
  LIBRARY_PAGE_SIZE,
  searchPromptLibrary,
  type LibraryPrompt
} from "./library-api";
import {
  parseLibrarySearch,
  serializeLibrarySearch,
  type LibraryFilters
} from "./library-search";
import { PromptCard } from "./PromptCard";

export function PromptLibraryPage({
  favoritesOnly = false
}: {
  favoritesOnly?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => {
    const parsed = parseLibrarySearch(params);
    return favoritesOnly ? { ...parsed, favorite: true } : parsed;
  }, [favoritesOnly, params]);
  const [queryInput, setQueryInput] = useState(filters.query);
  const [view, setView] = useState<"grid" | "list">(() =>
    localStorage.getItem("prompt-library-view") === "list" ? "list" : "grid"
  );
  const libraryQuery = useQuery({
    queryFn: () => searchPromptLibrary(filters),
    queryKey: [...promptKeys.all, "library", filters]
  });
  const favoriteMutation = useMutation({
    mutationFn: (prompt: LibraryPrompt) =>
      updatePromptFlags(prompt, {
        favorite: !prompt.favorite,
        status: prompt.status
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: promptKeys.all })
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (queryInput !== filters.query) {
        setParams(
          serializeLibrarySearch({ ...filters, page: 1, query: queryInput })
        );
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [filters, queryInput, setParams]);

  function updateFilters(updates: Partial<LibraryFilters>) {
    setParams(
      serializeLibrarySearch({ ...filters, ...updates, page: updates.page ?? 1 })
    );
  }

  function changeView(nextView: "grid" | "list") {
    setView(nextView);
    localStorage.setItem("prompt-library-view", nextView);
  }

  async function copyPrompt(prompt: LibraryPrompt) {
    await navigator.clipboard.writeText(prompt.prompt_text);
    notify("Prompt copied");
    void recordPromptUse(prompt.id);
  }

  const prompts = libraryQuery.data ?? [];
  const total = prompts[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE));

  return (
    <section className="library-page">
      <header className="library-header">
        <div>
          <h1>Prompt Library</h1>
          <p>Your best AI prompts, organized and ready to use.</p>
        </div>
        <div className="library-header__actions library-header__actions--compact">
          <Button onClick={() => navigate("/import")} variant="secondary">
            Import <FileUp aria-hidden="true" size={18} />
          </Button>
          <Button onClick={() => navigate("/prompts/new")}>
            New prompt <Plus aria-hidden="true" size={18} />
          </Button>
        </div>
      </header>

      <LibraryToolbar
        filters={filters}
        onChange={updateFilters}
        onClear={() => {
          setQueryInput("");
          setParams(new URLSearchParams());
        }}
        onViewChange={changeView}
        queryInput={queryInput}
        setQueryInput={setQueryInput}
        view={view}
      />

      {libraryQuery.isLoading ? (
        <div className="prompt-skeleton-grid" aria-label="Loading prompts">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="prompt-skeleton" key={index} />
          ))}
        </div>
      ) : libraryQuery.isError ? (
        <div className="library-empty-preview">
          <div>
            <h2>We could not load your prompts.</h2>
            <p>Check your connection and try again.</p>
          </div>
          <Button onClick={() => libraryQuery.refetch()}>Try again</Button>
        </div>
      ) : prompts.length === 0 ? (
        <div className="library-empty-preview">
          <div>
            <h2>
              {params.size
                ? "No prompts match those filters."
                : "Your prompt library starts here."}
            </h2>
            <p>
              {params.size
                ? "Clear a filter or try a broader search."
                : "Create your first reusable prompt and keep every winning version in one place."}
            </p>
          </div>
          {params.size ? (
            <Button
              onClick={() => {
                setQueryInput("");
                setParams(new URLSearchParams());
              }}
              variant="secondary"
            >
              Clear filters
            </Button>
          ) : (
            <Button onClick={() => navigate("/prompts/new")}>
              Create first prompt
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="library-results-heading">
            <strong>{total} prompts</strong>
            <span>
              Page {filters.page} of {totalPages}
            </span>
          </div>
          <div
            className={view === "grid" ? "prompt-grid" : "prompt-list"}
          >
            {prompts.map((prompt) => (
              <PromptCard
                compact={view === "list"}
                key={prompt.id}
                onCopy={copyPrompt}
                onFavorite={(item) => favoriteMutation.mutate(item)}
                prompt={prompt}
              />
            ))}
          </div>
          <nav className="pagination" aria-label="Prompt library pages">
            <Button
              disabled={filters.page <= 1}
              onClick={() => updateFilters({ page: filters.page - 1 })}
              variant="secondary"
            >
              Previous
            </Button>
            <Button
              disabled={filters.page >= totalPages}
              onClick={() => updateFilters({ page: filters.page + 1 })}
              variant="secondary"
            >
              Next
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}
