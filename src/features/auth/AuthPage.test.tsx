import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AuthPage } from "./AuthPage";
import type { AuthClient } from "./auth-client";

function createAuthClient(): AuthClient {
  return {
    exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null })
  };
}

test("rejects an invalid email address", async () => {
  const user = userEvent.setup();
  render(<AuthPage client={createAuthClient()} />);

  await user.type(screen.getByLabelText("Email address"), "not-an-email");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Enter a valid email address.")).toBeVisible();
});

test("rejects passwords shorter than eight characters", async () => {
  const user = userEvent.setup();
  render(<AuthPage client={createAuthClient()} />);

  await user.type(screen.getByLabelText("Email address"), "user@example.com");
  await user.type(screen.getByLabelText("Password"), "short");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(
    await screen.findByText("Password must be at least 8 characters.")
  ).toBeVisible();
});

test("starts Google OAuth with the current origin", async () => {
  const user = userEvent.setup();
  const client = createAuthClient();
  render(<AuthPage client={client} />);

  await user.click(screen.getByRole("button", { name: "Continue with Google" }));

  expect(client.signInWithOAuth).toHaveBeenCalledWith({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });
});
