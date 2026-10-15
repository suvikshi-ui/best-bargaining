import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";

const BEARER_KEY = "grok-auth.bearer-token";

function keepSessionToken(token: string | null | undefined) {
  if (!token || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BEARER_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

export function OwnerSignButtons() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!authEnabled) {
    return <p className="text-sm text-mist">Sign-in is turned off.</p>;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result =
        mode === "in"
          ? await authClient.signIn.email({
              email: email.trim(),
              password,
              callbackURL: "/studio",
            })
          : await authClient.signUp.email({
              email: email.trim(),
              password,
              name: name.trim() || "Shop owner",
              callbackURL: "/studio",
            });
      if (result.error) {
        setError(result.error.message ?? "Could not sign in.");
        return;
      }
      keepSessionToken(result.data?.token);
      await authClient.getSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-3">
        {mode === "up" && (
          <label className="block text-sm text-mist">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className="mt-1 h-12 w-full rounded-2xl border border-ink/15 bg-card px-3 text-sm text-ink outline-none focus:border-clay"
            />
          </label>
        )}
        <label className="block text-sm text-mist">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="mt-1 h-12 w-full rounded-2xl border border-ink/15 bg-card px-3 text-sm text-ink outline-none focus:border-clay"
          />
        </label>
        <label className="block text-sm text-mist">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            className="mt-1 h-12 w-full rounded-2xl border border-ink/15 bg-card px-3 text-sm text-ink outline-none focus:border-clay"
          />
        </label>
        {error && (
          <p className="text-sm text-clay" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="h-12 rounded-full bg-clay text-sm text-paper transition-transform duration-150 active:scale-[0.96] disabled:opacity-40"
        >
          {busy ? "Please wait…" : mode === "in" ? "Log in" : "Create login"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setError("");
          }}
          className="h-11 text-sm text-mist"
        >
          {mode === "in" ? "नया login बनाएं" : "Already have a login? Log in"}
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-2">
        {GROK_PROVIDERS.map((provider) => (
          <button
            key={provider.providerId}
            type="button"
            onClick={() => signIn(provider.providerId, { callbackURL: "/studio" })}
            className="h-12 w-full rounded-full border border-ink/15 bg-card text-sm font-medium text-ink transition-transform duration-150 active:scale-[0.96]"
          >
            Continue with {provider.label}
          </button>
        ))}
      </div>
    </div>
  );
}
