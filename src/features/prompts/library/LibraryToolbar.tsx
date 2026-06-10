import { Grid2X2, List, Search, X } from "lucide-react";
import type { LibraryFilters } from "./library-search";

type LibraryToolbarProps = {
  filters: LibraryFilters;
  onChange: (updates: Partial<LibraryFilters>) => void;
  onClear: () => void;
  onViewChange: (view: "grid" | "list") => void;
  queryInput: string;
  setQueryInput: (value: string) => void;
  view: "grid" | "list";
};

const categories = [
  "Business",
  "Marketing",
  "Hospitality",
  "Restaurants",
  "Coding",
  "Content Creation",
  "Research",
  "Automation"
];
const platforms = ["ChatGPT", "Claude", "Gemini", "Grok", "Codex", "Lovable"];

export function LibraryToolbar({
  filters,
  onChange,
  onClear,
  onViewChange,
  queryInput,
  setQueryInput,
  view
}: LibraryToolbarProps) {
  const hasFilters =
    Boolean(filters.category) ||
    Boolean(filters.platform) ||
    Boolean(filters.rating) ||
    filters.favorite ||
    Boolean(filters.query);

  return (
    <div className="library-controls">
      <label className="library-search library-search--wide">
        <Search aria-hidden="true" size={19} />
        <span className="sr-only">Search prompts</span>
        <input
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="Search titles, content, tags, and categories..."
          type="search"
          value={queryInput}
        />
      </label>
      <div className="library-toolbar">
        <div className="library-filters">
          <select
            aria-label="Filter by category"
            onChange={(event) =>
              onChange({ category: event.target.value || null })
            }
            value={filters.category ?? ""}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label="Filter by platform"
            onChange={(event) =>
              onChange({ platform: event.target.value || null })
            }
            value={filters.platform ?? ""}
          >
            <option value="">All platforms</option>
            {platforms.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label="Filter by minimum rating"
            onChange={(event) =>
              onChange({
                rating: event.target.value ? Number(event.target.value) : null
              })
            }
            value={filters.rating ?? ""}
          >
            <option value="">Any rating</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating}+ stars
              </option>
            ))}
          </select>
          <button
            className={filters.favorite ? "is-active" : ""}
            onClick={() => onChange({ favorite: !filters.favorite })}
            type="button"
          >
            Favorites
          </button>
          {hasFilters ? (
            <button onClick={onClear} type="button">
              <X size={15} /> Clear
            </button>
          ) : null}
        </div>
        <div className="library-view-options">
          <select
            aria-label="Sort prompts"
            onChange={(event) =>
              onChange({
                sort: event.target.value as LibraryFilters["sort"]
              })
            }
            value={filters.sort}
          >
            <option value="updated_desc">Recently updated</option>
            <option value="created_desc">Recently added</option>
            <option value="rating_desc">Highest rated</option>
            <option value="title_asc">Title A-Z</option>
          </select>
          <div className="view-switcher" aria-label="Library view">
            <button
              aria-label="Grid view"
              className={view === "grid" ? "is-active" : ""}
              onClick={() => onViewChange("grid")}
              type="button"
            >
              <Grid2X2 size={18} />
            </button>
            <button
              aria-label="List view"
              className={view === "list" ? "is-active" : ""}
              onClick={() => onViewChange("list")}
              type="button"
            >
              <List size={19} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
