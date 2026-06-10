import { BookOpen, Menu, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MobileNavigation() {
  const navigate = useNavigate();
  return (
    <header className="mobile-nav">
      <button aria-label="Open navigation" type="button">
        <Menu aria-hidden="true" />
      </button>
      <div>
        <BookOpen aria-hidden="true" size={18} />
        <span>Prompt Vault</span>
      </div>
      <button
        aria-label="Create prompt"
        onClick={() => navigate("/prompts/new")}
        type="button"
      >
        <Plus aria-hidden="true" />
      </button>
    </header>
  );
}
