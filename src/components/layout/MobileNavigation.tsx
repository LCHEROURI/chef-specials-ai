import { BookOpen, Menu, Plus, X } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { primaryNavigation } from "./navigation";

export function MobileNavigation() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="mobile-nav">
        <button
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <div>
          <BookOpen aria-hidden="true" size={18} />
          <span>Prompt Vault</span>
        </div>
        <button
          aria-label="Create prompt"
          onClick={() => {
            setOpen(false);
            navigate("/prompts/new");
          }}
          type="button"
        >
          <Plus aria-hidden="true" />
        </button>
      </header>
      {open ? (
        <div
          aria-label="Navigation"
          aria-modal="true"
          className="mobile-drawer"
          role="dialog"
        >
          <nav aria-label="Mobile primary navigation">
            {primaryNavigation.map(({ icon: Icon, label, to }) => (
              <NavLink
                className={({ isActive }) =>
                  `mobile-drawer__link${
                    isActive ? " mobile-drawer__link--active" : ""
                  }`
                }
                end={to === "/"}
                key={to}
                onClick={() => setOpen(false)}
                to={to}
              >
                <Icon aria-hidden="true" size={20} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
