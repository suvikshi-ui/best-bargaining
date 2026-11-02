import { useState, type FormEvent } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";

const BEARER_KEY = "grok-auth.bearer-token";
const input =
  "mt-1 h-12 w-full rounded-2xl border border-ink/15 bg-card px-3 text-sm text-ink outline-none focus:border-clay";

/** Owner passwordless login: email → one-time code → /studio. */
export function OwnerOtpLogin() {
  const [email, setEmail] = useState("contact@bestbargain.in");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (!authEnabled) return <p className="text-sm text-mist">Sign-in is turned off.</p>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (!sent) {
        const r = await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
        if (r.error) return setMsg(r.error.message ?? "Could not send the code.");
        setSent(true);
        setMsg("If this is the owner email, a 6-digit code is on its way.");
      } else {
        const r = await authClient.signIn.emailOtp({ email: email.trim(), otp: otp.trim() });
        if (r.error) return setMsg(r.error.message ?? "Wrong or expired code.");
        const token = (r.data as { token?: string } | null)?.token;
        if (token) {
          try {
            window.sessionStorage.setItem(BEARER_KEY, token);
          } catch {
            /* storage unavailable */
          }
        }
        await authClient.getSession();
        window.location.assign("/studio");
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex w-full max-w-sm flex-col gap-3">
      <label className="block text-sm text-mist">
        Owner email
        <input type="email" required value={email} disabled={sent} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={input} />
      </label>
      {sent && (
        <label className="block text-sm text-mist">
          Login code
          <input inputMode="numeric" pattern="[0-9]{6}" required value={otp} onChange={(e) => setOtp(e.target.value)} autoComplete="one-time-code" className={input} />
        </label>
      )}
      {msg && <p className="text-sm text-clay" role="status">{msg}</p>}
      <button type="submit" disabled={busy} className="h-12 rounded-full bg-clay text-sm text-paper disabled:opacity-40">
        {busy ? "Please wait…" : sent ? "Log in" : "Email me a code"}
      </button>
      {sent && (
        <button type="button" onClick={() => { setSent(false); setOtp(""); setMsg(""); }} className="h-11 text-sm text-mist">
          Use a different email / resend
        </button>
      )}
    </form>
  );
}
