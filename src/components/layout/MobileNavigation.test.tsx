import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MobileNavigation } from "./MobileNavigation";

test("opens the approved mobile navigation and closes after selection", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <MobileNavigation />
    </MemoryRouter>
  );

  await user.click(screen.getByRole("button", { name: "Open navigation" }));

  expect(screen.getByRole("dialog", { name: "Navigation" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Library" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Favorites" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Templates" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Analytics" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Settings" })).toBeVisible();

  await user.click(screen.getByRole("link", { name: "Settings" }));

  expect(
    screen.queryByRole("dialog", { name: "Navigation" })
  ).not.toBeInTheDocument();
});
