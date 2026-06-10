import { BookOpen, Menu, Plus } from "lucide-react";

export function MobileNavigation() {
  return (
    <header className="mobile-nav">
      <button aria-label="Open navigation" type="button">
        <Menu aria-hidden="true" />
      </button>
      <div>
        <BookOpen aria-hidden="true" size={18} />
        <span>Prompt Vault</span>
      </div>
      <button aria-label="Create prompt" type="button">
        <Plus aria-hidden="true" />
      </button>
    </header>
  );
}
