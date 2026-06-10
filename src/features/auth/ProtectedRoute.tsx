import { Navigate, Outlet } from "react-router-dom";
import { LoadingState } from "../../components/ui/LoadingState";
import { useAuth } from "./auth-context";

export function ProtectedRoute() {
  const { loading, user } = useAuth();

  if (loading) {
    return <LoadingState label="Opening your prompt vault" />;
  }

  return user ? <Outlet /> : <Navigate replace to="/auth" />;
}
