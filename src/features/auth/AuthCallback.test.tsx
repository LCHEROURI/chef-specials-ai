import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { AuthCallback } from "./AuthCallback";

test("exchanges the callback code before entering the app", async () => {
  const exchangeCode = vi.fn().mockResolvedValue({ error: null });
  const onComplete = vi.fn();

  render(
    <MemoryRouter>
      <AuthCallback
        exchangeCode={exchangeCode}
        onComplete={onComplete}
        search="?code=oauth-code"
      />
    </MemoryRouter>
  );

  expect(screen.getByText("Completing sign in")).toBeVisible();
  await waitFor(() => expect(exchangeCode).toHaveBeenCalledWith("oauth-code"));
  await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
});

test("shows callback errors without re-entering the login loop", async () => {
  const exchangeCode = vi.fn().mockResolvedValue({
    error: { message: "Authorization code expired" }
  });
  const onComplete = vi.fn();

  render(
    <MemoryRouter>
      <AuthCallback
        exchangeCode={exchangeCode}
        onComplete={onComplete}
        search="?code=expired-code"
      />
    </MemoryRouter>
  );

  expect(
    await screen.findByText("Authorization code expired")
  ).toBeVisible();
  expect(onComplete).not.toHaveBeenCalled();
});
