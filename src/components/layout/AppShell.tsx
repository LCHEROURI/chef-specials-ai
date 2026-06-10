import { Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";
import { MobileNavigation } from "./MobileNavigation";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { signOut } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar onSignOut={signOut} />
      <MobileNavigation />
      <main className="app-workspace">
        <Outlet />
      </main>
    </div>
  );
}
