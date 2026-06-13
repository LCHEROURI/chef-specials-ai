import { ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";
import { PlanUsage } from "../../features/billing/PlanUsage";
import { FolderManager } from "../../features/folders/FolderManager";
import { ThemeToggle } from "./ThemeToggle";
import { primaryNavigation } from "./navigation";

export function Sidebar({ onSignOut }: { onSignOut: () => void }) {
  return (
    <aside className="app-sidebar">
      <div className="app-brand">
        <span className="app-brand__mark" aria-hidden="true">
          P
        </span>
        <span>Prompt Vault Pro</span>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {primaryNavigation.map(({ icon: Icon, label, to }) => (
          <NavLink
            className={({ isActive }) =>
              `sidebar-link${isActive ? " sidebar-link--active" : ""}`
            }
            end={to === "/"}
            key={to}
            to={to}
          >
            <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <FolderManager />

      <div className="sidebar-account">
        <PlanUsage />
        <ThemeToggle />
        <div className="sidebar-user">
          <span className="sidebar-avatar">PV</span>
          <span>My account</span>
          <ChevronDown aria-hidden="true" size={16} />
        </div>
        <button className="sidebar-signout" onClick={onSignOut} type="button">
          Sign out
        </button>
      </div>
    </aside>
  );
}
