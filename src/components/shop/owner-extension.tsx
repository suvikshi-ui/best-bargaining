import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function OwnerExtension() {
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUserState();
  return (
    <div className="fixed right-3 bottom-20 z-40 md:bottom-4">
      {open && (
        <div className="mb-2 w-56 rounded-2xl border border-ink/10 bg-paper p-3 shadow-lg">
          <p className="text-xs font-semibold tracking-wide uppercase">Owner</p>
          <p className="mt-1 text-xs text-mist">Shop edits and every guest order stay here.</p>
          <Link
            to={user ? "/studio" : "/login"}
            search={user ? { piece: 0 } : { desk: true }}
            className="mt-3 flex h-10 items-center justify-center rounded-full bg-ink text-sm text-paper"
            onClick={() => setOpen(false)}
          >
            {user ? "Open desk" : "Owner login"}
          </Link>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto flex h-10 items-center rounded-full border border-ink/15 bg-paper px-3 text-xs text-mist shadow-sm"
        aria-expanded={open}
      >
        Owner
      </button>
    </div>
  );
}
