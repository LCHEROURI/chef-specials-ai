import { Navigate } from "react-router-dom";
import { AuthPage } from "./AuthPage";
import { useAuth } from "./auth-context";

export function AuthRoute() {
  const { loading, user } = useAuth();
  if (!loading && user) {
    return <Navigate replace to="/" />;
  }
  return <AuthPage />;
}
