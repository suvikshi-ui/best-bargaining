import { useState } from "react";
import { requestStockAlert } from "@/lib/shop/api";

/** Card-level back-in-stock request: a Notify tag that opens a one-field email form (saves to stock_alerts). */
export function NotifyInline({ productId }: { productId: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  if (state === "done") return <p className="text-xs text-emerald-800">Done — we'll email you when it's back.</p>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="h-10 w-full border border-ink text-sm font-medium">
        Notify
      </button>
    );
  return (
    <form
      className="flex flex-col gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        setState("sending");
        setError("");
        void requestStockAlert({ data: { productId, email } })
          .then(() => setState("done"))
          .catch((err: unknown) => {
            setState("idle");
            setError(err instanceof Error ? err.message : "Try again.");
          });
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email for back-in-stock alert"
        className="h-10 w-full border border-ink/15 bg-paper px-2 text-sm"
      />
      <button type="submit" disabled={state === "sending"} className="h-10 w-full bg-ink text-sm font-medium text-paper disabled:opacity-50">
        {state === "sending" ? "…" : "Notify"}
      </button>
      {error && <p className="text-xs text-clay">{error}</p>}
    </form>
  );
}
