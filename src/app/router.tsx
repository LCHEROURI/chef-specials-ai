import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AuthRoute } from "../features/auth/AuthRoute";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { LibraryPlaceholder } from "../features/prompts/library/LibraryPlaceholder";

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { element: <LibraryPlaceholder />, path: "/" },
          { element: <LibraryPlaceholder />, path: "/favorites" },
          { element: <LibraryPlaceholder />, path: "/templates" },
          { element: <LibraryPlaceholder />, path: "/analytics" }
        ]
      }
    ]
  },
  { element: <AuthRoute />, path: "/auth" },
  { element: <Navigate replace to="/" />, path: "*" }
]);
