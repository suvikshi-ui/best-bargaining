import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, ShoppingBag, Store } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { getShopSettings } from "@/lib/shop/api";
import { useCart } from "@/lib/shop/cart";
import { BagSync } from "@/components/shop/bag-sync";
import { CATEGORIES, readCat, type ShopCat } from "@/lib/shop/catalog";

function useBagCount() {
  const count = useCart((state) => state.lines.reduce((sum, line) => sum + line.qty, 0));
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? count : 0;
}

/** Fallback when the owner has not saved a menu yet: Home only. */
const DEFAULT_NAV_CATEGORY_IDS: string[] = [];

function useNavCats(): { id: ShopCat; label: string }[] {
  const settings = useQuery({ queryKey: ["shop-settings"], queryFn: () => getShopSettings(), staleTime: 60_000 });
  const ids = settings.data?.navCategories ?? DEFAULT_NAV_CATEGORY_IDS;
  return [
    { id: "all", label: "Home" },
    ...CATEGORIES.filter((item) => ids.includes(item.id)).map((item) => ({ id: item.id, label: item.label })),
  ];
}

export function ShopShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const cats = useNavCats();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const current = useRouterState({
    select: (state) => readCat((state.location.search as { cat?: unknown }).cat),
  });
  const shopOn = path === "/" || path.startsWith("/product");
  const bagOn = path === "/cart";
  const count = useBagCount();

  const [q, setQ] = useState("");

  function search(event: FormEvent) {
    event.preventDefault();
    void navigate({ to: "/", search: { cat: "all", q: q.trim() } });
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <BagSync />
      <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-paper">
        More savings & faster shopping
      </div>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-8">
          <Link to="/" search={{ cat: "all", q: "" }} className="shrink-0 text-xl font-semibold tracking-tight">
            Best Bargain
          </Link>
          <form onSubmit={search} className="relative min-w-0 flex-1">
            <label className="sr-only" htmlFor="shop-search">
              Search products
            </label>
            <input
              id="shop-search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search products"
              className="h-10 w-full rounded-md border border-ink/15 bg-card pr-10 pl-3 text-sm outline-none focus:border-ink"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute top-0 right-0 grid h-10 w-10 place-items-center text-ink"
            >
              <Search className="size-4" aria-hidden="true" />
            </button>
          </form>
          <Link
            to="/cart"
            aria-label={count ? `Bag, ${count} pieces` : "Bag"}
            className="relative grid h-11 w-11 shrink-0 place-items-center"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute top-1 right-0 grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[11px] font-semibold text-white tabular-nums">
                {count}
              </span>
            )}
          </Link>
        </div>
        <nav className="overflow-x-auto border-t border-ink/10" aria-label="Categories">
          <div className="mx-auto flex max-w-7xl gap-6 px-4 md:px-8">
            {cats.map((item) => {
              const on = path === "/" && current === item.id;
              return (
                <Link
                  key={item.id}
                  to="/"
                  search={{ cat: item.id, q: "" }}
                  className={cn(
                    "shrink-0 border-b-2 py-3 text-sm font-medium",
                    on ? "border-ink text-ink" : "border-transparent text-mist",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 pt-4 pb-28 md:px-8 md:pb-12">{children}</main>
      <footer className="border-t border-ink/10 bg-card pb-24 md:pb-0">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3 md:px-8">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase">Shop</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-mist">
              <Link to="/" search={{ cat: "gadgets", q: "" }}>
                Gadgets
              </Link>
              <Link to="/" search={{ cat: "kitchen-essentials", q: "" }}>
                Kitchen
              </Link>
              <Link to="/" search={{ cat: "womens-fashion", q: "" }}>
                Fashion
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase">Orders</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-mist">
              <Link to="/cart">Your bag</Link>
              <p>Add your name, mobile, and email when you place the order.</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase">Best Bargain</p>
            <p className="mt-3 max-w-xs text-sm text-mist">
              The same shelves as a full home shop: gadgets, kitchen, fashion, kids, and more. Prices in rupees.
            </p>
          </div>
        </div>
      </footer>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-paper md:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-2">
          <Link
            to="/"
            search={{ cat: "all", q: "" }}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-1 text-xs",
              shopOn ? "text-ink" : "text-mist",
            )}
          >
            <Store className="size-5" aria-hidden="true" />
            Shop
          </Link>
          <Link
            to="/cart"
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-1 text-xs",
              bagOn ? "text-ink" : "text-mist",
            )}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            Bag
          </Link>
        </div>
      </nav>
    </div>
  );
}
