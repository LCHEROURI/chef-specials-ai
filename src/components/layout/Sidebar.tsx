import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Code2,
  FileText,
  Heart,
  Plus,
  Store,
  Utensils
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Library", icon: BookOpen, to: "/" },
  { label: "Favorites", icon: Heart, to: "/favorites" },
  { label: "Templates", icon: FileText, to: "/templates" },
  { label: "Analytics", icon: BarChart3, to: "/analytics" }
];

const folders = [
  { label: "Marketing", icon: Store },
  { label: "Restaurant Ops", icon: Utensils },
  { label: "Coding", icon: Code2 }
];

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
        {navigation.map(({ icon: Icon, label, to }) => (
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

      <div className="sidebar-folders">
        <div className="sidebar-section-label">Folders</div>
        {folders.map(({ icon: Icon, label }) => (
          <button className="sidebar-folder" key={label} type="button">
            <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
            <span>{label}</span>
          </button>
        ))}
        <button className="sidebar-add" type="button">
          <Plus aria-hidden="true" size={18} />
          <span>Add folder</span>
        </button>
      </div>

      <div className="sidebar-account">
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
