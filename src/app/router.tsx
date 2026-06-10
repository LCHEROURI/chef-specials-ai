import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AuthRoute } from "../features/auth/AuthRoute";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { PromptDetail } from "../features/prompts/PromptDetail";
import { PromptEditor } from "../features/prompts/PromptEditor";
import { PromptLibraryPage } from "../features/prompts/library/PromptLibraryPage";
import { TemplatesPage } from "../features/templates/TemplatesPage";

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { element: <PromptLibraryPage />, path: "/" },
          { element: <PromptLibraryPage />, path: "/favorites" },
          { element: <TemplatesPage />, path: "/templates" },
          { element: <PromptLibraryPage />, path: "/analytics" },
          { element: <PromptEditor />, path: "/prompts/new" },
          { element: <PromptDetail />, path: "/prompts/:promptId" },
          { element: <PromptEditor />, path: "/prompts/:promptId/edit" }
        ]
      }
    ]
  },
  { element: <AuthRoute />, path: "/auth" },
  { element: <Navigate replace to="/" />, path: "*" }
]);
