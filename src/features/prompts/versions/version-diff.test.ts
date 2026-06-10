import { buildVersionDiff } from "./version-diff";

test("marks removed and added prompt text", () => {
  const changes = buildVersionDiff(
    "Analyze the menu for pricing.",
    "Analyze the restaurant menu for profitability."
  );

  expect(changes.some((change) => change.added)).toBe(true);
  expect(changes.some((change) => change.removed)).toBe(true);
});

test("identical prompts have no highlighted changes", () => {
  const changes = buildVersionDiff("Same prompt", "Same prompt");
  expect(changes.map((change) => change.value).join("")).toBe("Same prompt");
  expect(changes.some((change) => change.added || change.removed)).toBe(false);
});
