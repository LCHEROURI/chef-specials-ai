import { render, screen } from "@testing-library/react";
import { App } from "./App";
import { AppProviders } from "./providers";

test("renders the Prompt Vault product name", async () => {
  render(
    <AppProviders>
      <App />
    </AppProviders>
  );
  expect(await screen.findByText("Prompt Vault Pro")).toBeVisible();
});
