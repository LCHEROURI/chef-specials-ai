import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

test("disables actions while loading", () => {
  render(<Button loading>Save prompt</Button>);
  expect(screen.getByRole("button", { name: "Save prompt" })).toBeDisabled();
});
