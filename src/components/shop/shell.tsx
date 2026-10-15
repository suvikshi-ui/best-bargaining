import { Link, useRouterState } from "@tanstack/react-router";
import { KeyRound, ShoppingBag, Store } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useCart } from "@/lib/shop/cart";

function useBagCount() {
  const count = useCart((state) => state.lines.reduce((sum, line) => sum + line.qty, 0));
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? count : 0;
}

function BagLink({ className }: { className?: string }) {
  const count = useBagCount();
  return (
    <Link
      to="/cart"
      aria-label={count ? `Bag, ${count} pieces` : "Bag"}
      className={cn(
        "relative grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-ink/5",
        className,
      )}
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute top-1 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-xs text-paper tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}

export function ShopShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const shopOn = path === "/" || path.startsWith("/product");
  const bagOn = path === "/cart";
  const ownerOn = path === "/studio" || path === "/login";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Link to="/" search={{ cat: "all" }} className="font-display text-2xl tracking-tight text-ink">
            Rainside<span className="text-clay">.</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Shop">
            <Link to="/" search={{ cat: "toys" }} className="text-sm text-mist hover:text-ink">
              Toys
            </Link>
            <Link to="/" search={{ cat: "rainy" }} className="text-sm text-mist hover:text-ink">
              Rainy Night
            </Link>
            <Link to="/" search={{ cat: "everyday" }} className="text-sm text-mist hover:text-ink">
              Everyday
            </Link>
            <Link to="/studio" className="text-sm text-ink">
              Owner desk
            </Link>
          </nav>
          <BagLink />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pb-16">{children}</main>
      <footer className="border-t border-ink/10">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <p className="font-display text-2xl text-ink">
            Rainside<span className="text-clay">.</span>
          </p>
          <p className="mt-2 max-w-sm text-sm text-mist">
            Toys for daylight. Things for rainy nights. Counted, priced, and put on the shelf by the owner.
          </p>
        </div>
      </footer>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-paper md:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-3">
          <Link
            to="/"
            search={{ cat: "all" }}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-xs",
              shopOn ? "text-ink" : "text-mist",
            )}
          >
            <Store className="size-5" aria-hidden="true" />
            Shop
          </Link>
          <Link
            to="/cart"
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-xs",
              bagOn ? "text-ink" : "text-mist",
            )}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            Bag
          </Link>
          <Link
            to="/studio"
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-xs",
              ownerOn ? "text-ink" : "text-mist",
            )}
          >
            <KeyRound className="size-5" aria-hidden="true" />
            Owner
          </Link>
        </div>
      </nav>
    </div>
  );
}

