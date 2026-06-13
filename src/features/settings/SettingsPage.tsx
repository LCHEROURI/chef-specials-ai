import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import { PlanUsage } from "../billing/PlanUsage";
import { useAuth } from "../auth/auth-context";

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <section className="library-page settings-page">
      <header className="library-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account preferences and plan usage.</p>
        </div>
      </header>

      <div className="settings-grid">
        <section className="settings-card">
          <h2>Appearance</h2>
          <p>Choose the theme that is easiest on your eyes.</p>
          <ThemeToggle />
        </section>

        <section className="settings-card">
          <h2>Plan</h2>
          <p>System templates never count against your prompt allowance.</p>
          <PlanUsage />
        </section>

        <section className="settings-card">
          <h2>Privacy</h2>
          <div className="settings-card__privacy">
            <ShieldCheck aria-hidden="true" />
            <p>
              Your prompts and files are private to your signed-in Supabase
              account.
            </p>
          </div>
        </section>

        <section className="settings-card">
          <h2>Account</h2>
          <p>{user?.email ?? "Signed-in Prompt Vault account"}</p>
        </section>
      </div>
    </section>
  );
}
