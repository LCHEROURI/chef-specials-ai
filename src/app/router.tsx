import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AuthRoute } from "../features/auth/AuthRoute";
import { AuthCallback } from "../features/auth/AuthCallback";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { PromptDetail } from "../features/prompts/PromptDetail";
import { PromptEditor } from "../features/prompts/PromptEditor";
import { PromptLibraryPage } from "../features/prompts/library/PromptLibraryPage";
import { TemplatesPage } from "../features/templates/TemplatesPage";
import { AnalyticsPage } from "../features/analytics/AnalyticsPage";
import { ImportPage } from "../features/imports/ImportPage";
import { SettingsPage } from "../features/settings/SettingsPage";

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { element: <PromptLibraryPage />, path: "/" },
          { element: <PromptLibraryPage favoritesOnly />, path: "/favorites" },
          { element: <TemplatesPage />, path: "/templates" },
          { element: <AnalyticsPage />, path: "/analytics" },
          { element: <SettingsPage />, path: "/settings" },
          { element: <PromptEditor />, path: "/prompts/new" },
          { element: <ImportPage />, path: "/import" },
          { element: <PromptDetail />, path: "/prompts/:promptId" },
          { element: <PromptEditor />, path: "/prompts/:promptId/edit" }
        ]
      }
    ]
  },
  { element: <AuthCallback />, path: "/auth/callback" },
  { element: <AuthRoute />, path: "/auth" },
  { element: <Navigate replace to="/" />, path: "*" }
]);
