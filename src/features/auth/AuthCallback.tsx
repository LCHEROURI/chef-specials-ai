import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoadingState } from "../../components/ui/LoadingState";
import { authClient } from "./auth-client";

type ExchangeCode = typeof authClient.exchangeCodeForSession;

type AuthCallbackProps = {
  exchangeCode?: ExchangeCode;
  onComplete?: () => void;
  search?: string;
};

function completeAuth() {
  window.location.replace("/");
}

export function AuthCallback({
  exchangeCode = authClient.exchangeCodeForSession,
  onComplete = completeAuth,
  search = window.location.search
}: AuthCallbackProps) {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const callbackError = params.get("error_description") ?? params.get("error");
  const [exchangeError, setExchangeError] = useState("");

  useEffect(() => {
    if (!code || callbackError) return;

    let active = true;
    void exchangeCode(code).then(({ error }) => {
      if (!active) return;
      if (error) {
        setExchangeError(error.message);
        return;
      }
      onComplete();
    });

    return () => {
      active = false;
    };
  }, [callbackError, code, exchangeCode, onComplete]);

  const error =
    callbackError ||
    exchangeError ||
    (!code ? "The sign-in response did not include an authorization code." : "");

  if (error) {
    return (
      <main className="auth-callback">
        <section className="auth-callback__card">
          <span className="auth-brand__mark" aria-hidden="true">
            P
          </span>
          <h1>Sign in could not be completed</h1>
          <p role="alert">{error}</p>
          <Link to="/auth">Return to sign in</Link>
        </section>
      </main>
    );
  }

  return <LoadingState label="Completing sign in" />;
}
