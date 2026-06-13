import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { authClient } from "./auth-client";
import { authSchema } from "./auth-schema";
import type { AuthClient } from "./auth-client";
import type { AuthFormValues } from "./auth-schema";

type AuthMode = "sign-in" | "sign-up";

type AuthPageProps = {
  client?: AuthClient;
};

function authCallbackUrl() {
  return new URL("/auth/callback", window.location.origin).toString();
}

export function AuthPage({ client = authClient }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [serverMessage, setServerMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" }
  });

  async function submit(values: AuthFormValues) {
    setServerMessage("");
    const result =
      mode === "sign-in"
        ? await client.signInWithPassword(values)
        : await client.signUp({
            ...values,
            options: { emailRedirectTo: authCallbackUrl() }
          });

    if (result.error) {
      setServerMessage(result.error.message);
      return;
    }

    if (mode === "sign-up") {
      setServerMessage("Check your email to confirm your account.");
      reset({ email: values.email, password: "" });
    }
  }

  async function continueWithGoogle() {
    setServerMessage("");
    setGoogleLoading(true);
    const result = await client.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authCallbackUrl() }
    });
    if (result.error) {
      setServerMessage(result.error.message);
      setGoogleLoading(false);
    }
  }

  function switchMode() {
    setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
    setServerMessage("");
  }

  return (
    <main className="auth-page">
      <section className="auth-intro" aria-labelledby="auth-product-title">
        <div className="auth-brand">
          <span className="auth-brand__mark" aria-hidden="true">
            P
          </span>
          <span>Prompt Vault Pro</span>
        </div>
        <div>
          <h1 id="auth-product-title">Keep your best AI work within reach.</h1>
          <p>
            Store, refine, version, and reuse prompts without searching through
            old chats and scattered documents.
          </p>
        </div>
        <ul className="auth-benefits">
          <li>One searchable prompt library</li>
          <li>Version history that preserves your thinking</li>
          <li>Private by default with Supabase security</li>
        </ul>
      </section>

      <section className="auth-panel" aria-labelledby="auth-heading">
        <div className="auth-panel__heading">
          <h2 id="auth-heading">
            {mode === "sign-in" ? "Welcome back" : "Create your vault"}
          </h2>
          <p>
            {mode === "sign-in"
              ? "Sign in to continue to your prompt library."
              : "Start with 25 prompts on the free plan."}
          </p>
        </div>

        <Button
          className="auth-google"
          loading={googleLoading}
          onClick={continueWithGoogle}
          variant="secondary"
        >
          Continue with Google
        </Button>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
          <Input
            autoComplete="email"
            error={errors.email?.message}
            label="Email address"
            placeholder="you@example.com"
            type="email"
            {...register("email")}
          />
          <Input
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            error={errors.password?.message}
            label="Password"
            placeholder="At least 8 characters"
            type="password"
            {...register("password")}
          />
          {serverMessage ? (
            <p className="auth-message" role="status">
              {serverMessage}
            </p>
          ) : null}
          <Button loading={isSubmitting} type="submit">
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="auth-switch">
          {mode === "sign-in" ? "New to Prompt Vault?" : "Already have a vault?"}{" "}
          <button onClick={switchMode} type="button">
            {mode === "sign-in" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}
