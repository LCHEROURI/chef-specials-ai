import { expect, test } from "@playwright/test";

test("renders the Prompt Vault authentication shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/auth$/);
  await expect(
    page.getByRole("heading", {
      name: "Keep your best AI work within reach."
    })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("switches between sign-in and registration", async ({ page }) => {
  await page.goto("/auth");

  await page.getByRole("button", { name: "Create an account" }).click();

  await expect(
    page.getByRole("heading", { name: "Create your vault" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
});

test("does not overflow the mobile viewport", async ({ page }) => {
  await page.goto("/auth");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});
