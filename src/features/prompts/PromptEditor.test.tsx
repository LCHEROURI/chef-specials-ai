import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, vi } from "vitest";
import { ToastProvider } from "../../components/ui/ToastProvider";
import { savePrompt } from "./prompt-api";
import { PromptEditor } from "./PromptEditor";

vi.mock("../billing/entitlement-api", () => ({
  getEntitlements: vi.fn().mockResolvedValue({
    allowed: true,
    plan: "free",
    promptCount: 0
  })
}));

vi.mock("../folders/folder-api", () => ({
  createFolder: vi.fn(),
  getFolders: vi.fn().mockResolvedValue([])
}));

vi.mock("./organization-api", () => ({
  createTag: vi.fn(),
  getPromptOrganization: vi.fn().mockResolvedValue({
    folderIds: [],
    tagIds: []
  }),
  getTags: vi.fn().mockResolvedValue([]),
  syncPromptOrganization: vi.fn()
}));

vi.mock("./prompt-api", () => ({
  getPrompt: vi.fn(),
  savePrompt: vi.fn()
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

test("makes an empty-title save unmistakable without losing the draft", async () => {
  const user = userEvent.setup();
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false }
    }
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/prompts/new"]}>
          <Routes>
            <Route path="/prompts/new" element={<PromptEditor />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );

  const promptContent = screen.getByPlaceholderText(
    "Write or paste your prompt here..."
  );
  await user.type(promptContent, "Analyze this fictional restaurant menu.");
  await user.click(screen.getByRole("button", { name: "Save prompt" }));

  expect(
    await screen.findByRole("alert", {
      name: "Prompt could not be saved"
    })
  ).toHaveTextContent("Add a title before saving your prompt.");
  const titleInput = screen.getByLabelText(/Title/);
  expect(titleInput).toHaveFocus();
  expect(savePrompt).not.toHaveBeenCalled();
  expect(promptContent).toHaveValue("Analyze this fictional restaurant menu.");

  await user.type(titleInput, "Menu analyzer");

  expect(
    screen.queryByRole("alert", {
      name: "Prompt could not be saved"
    })
  ).not.toBeInTheDocument();
  expect(savePrompt).not.toHaveBeenCalled();
});
