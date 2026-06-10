import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renders the Prompt Vault product name", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: "Prompt Vault Pro" })
  ).toBeVisible();
});
