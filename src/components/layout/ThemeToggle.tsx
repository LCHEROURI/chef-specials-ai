import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("prompt-vault-theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("prompt-vault-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setDark((current) => !current)}
      type="button"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
