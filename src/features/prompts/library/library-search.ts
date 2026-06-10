export type LibraryFilters = {
  category: string | null;
  favorite: boolean;
  page: number;
  platform: string | null;
  query: string;
  rating: number | null;
  sort: "updated_desc" | "created_desc" | "rating_desc" | "title_asc";
};

const validSorts = new Set<LibraryFilters["sort"]>([
  "updated_desc",
  "created_desc",
  "rating_desc",
  "title_asc"
]);

export const defaultLibraryFilters: LibraryFilters = {
  category: null,
  favorite: false,
  page: 1,
  platform: null,
  query: "",
  rating: null,
  sort: "updated_desc"
};

export function parseLibrarySearch(params: URLSearchParams): LibraryFilters {
  const page = Number(params.get("page"));
  const rating = Number(params.get("rating"));
  const sort = params.get("sort") as LibraryFilters["sort"] | null;

  return {
    category: params.get("category") || null,
    favorite: params.get("favorite") === "true",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    platform: params.get("platform") || null,
    query: params.get("q")?.trim() ?? "",
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
    sort: sort && validSorts.has(sort) ? sort : "updated_desc"
  };
}

export function serializeLibrarySearch(filters: LibraryFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.rating) params.set("rating", String(filters.rating));
  if (filters.favorite) params.set("favorite", "true");
  if (filters.sort !== "updated_desc") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}
