import { parseImportFile } from "./parse-import";

test("plain text becomes one prompt named from the file", async () => {
  const file = new File(["Analyze this business."], "business-analysis.txt");
  const result = await parseImportFile(file);
  expect(result.errors).toEqual([]);
  expect(result.prompts[0]).toMatchObject({
    promptText: "Analyze this business.",
    title: "business analysis"
  });
});

test("CSV reports invalid rows without hiding valid rows", async () => {
  const file = new File(
    ["title,prompt_text,category\nGood,Do the work,Business\nMissing,,Custom"],
    "prompts.csv"
  );
  const result = await parseImportFile(file);
  expect(result.prompts).toHaveLength(1);
  expect(result.errors).toEqual([
    expect.objectContaining({ row: 3 })
  ]);
});
