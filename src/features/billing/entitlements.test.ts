import { getPromptAllowance } from "./entitlements";

test("free plans can create up to 25 prompts", () => {
  expect(getPromptAllowance("free", 24)).toEqual({
    allowed: true,
    limit: 25,
    remaining: 1
  });
  expect(getPromptAllowance("free", 25).allowed).toBe(false);
});

test("pro plans have unlimited prompts", () => {
  expect(getPromptAllowance("pro", 500)).toEqual({
    allowed: true,
    limit: null,
    remaining: null
  });
});
