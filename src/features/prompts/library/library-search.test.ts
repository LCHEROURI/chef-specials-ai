import { parseLibrarySearch, serializeLibrarySearch } from "./library-search";

test("parses typed prompt library filters from the URL", () => {
  const result = parseLibrarySearch(
    new URLSearchParams(
      "q=menu&category=Restaurants&platform=Claude&rating=4&favorite=true&page=2"
    )
  );

  expect(result).toEqual({
    category: "Restaurants",
    favorite: true,
    page: 2,
    platform: "Claude",
    query: "menu",
    rating: 4,
    sort: "updated_desc"
  });
});

test("serializes active filters and omits defaults", () => {
  const params = serializeLibrarySearch({
    category: null,
    favorite: false,
    page: 1,
    platform: "ChatGPT",
    query: "",
    rating: null,
    sort: "updated_desc"
  });

  expect(params.toString()).toBe("platform=ChatGPT");
});
