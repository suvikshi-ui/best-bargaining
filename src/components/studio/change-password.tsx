import { useState } from "react";
import { authClient } from "@/lib/auth/client";

/** Must match `minPasswordLength` in src/lib/auth/server.ts. */
export const MIN_PASSWORD_LENGTH = 10;

const inputClass = "mt-1 w-full rounded-xl border border-line bg-background px-3 py-2 text-base";

/** Owner-only: change the signed-in account's password via better-auth. */
export function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  function validate(): string | null {
    if (!current) return "Enter your current password.";
    if (next.length < MIN_PASSWORD_LENGTH)
      return `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (next !== confirm) return "The new passwords do not match.";
    if (next === current) return "The new password must be different from the current one.";
    return null;
  }

  async function submit() {
    const problem = validate();
    if (problem) return setStatus({ ok: false, text: problem });
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: revokeOthers,
      });
      if (error) {
        const code = (error as { code?: string }).code;
        const text =
          code === "INVALID_PASSWORD"
            ? "Your current password is incorrect."
            : code === "PASSWORD_TOO_SHORT"
              ? `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`
              : error.message || "Could not change the password.";
        setStatus({ ok: false, text });
      } else {
        setCurrent("");
        setNext("");
        setConfirm("");
        setStatus({
          ok: true,
          text: revokeOthers
            ? "Password changed. Other devices have been signed out."
            : "Password changed.",
        });
      }
    } catch {
      setStatus({ ok: false, text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-3xl font-semibold">Change password</h2>
      <p className="mt-1 text-sm text-mist">Use at least {MIN_PASSWORD_LENGTH} characters.</p>
      <form
        className="mt-3 grid max-w-md gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="block text-sm text-mist">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            className={inputClass}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label className="block text-sm text-mist">
          New password
          <input
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            className={inputClass}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <label className="block text-sm text-mist">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={revokeOthers}
            onChange={(e) => setRevokeOthers(e.target.checked)}
          />
          Sign out other devices
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-fit rounded-full bg-foreground px-5 py-2 text-background disabled:opacity-50"
        >
          {busy ? "Saving…" : "Change password"}
        </button>
        {status && (
          <p
            role={status.ok ? "status" : "alert"}
            className={status.ok ? "text-sm text-green-700" : "text-sm text-red-600"}
          >
            {status.text}
          </p>
        )}
      </form>
    </section>
  );
}
