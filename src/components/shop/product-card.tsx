import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useCart } from "@/lib/shop/cart";
import { inr, offPercent, type Product } from "@/lib/shop/catalog";

export function ProductCard({ product }: { product: Product }) {
  const addQty = useCart((state) => state.addQty);
  const [held, setHeld] = useState(false);
  const gone = product.stock === 0;
  const off = offPercent(product.price, product.compareAt);
  // One badge per card, highest priority wins.
  const badge = gone
    ? { label: "SOLD OUT", tone: "bg-mist" }
    : off > 0
      ? { label: `${off}% OFF`, tone: "bg-clay" }
      : product.badge === "new"
        ? { label: "NEW", tone: "bg-ink" }
        : product.badge === "best"
          ? { label: "BESTSELLER", tone: "bg-ink" }
          : null;

  return (
    <article className="flex min-w-0 flex-col border border-ink/10 bg-paper">
      <Link to="/product/$id" params={{ id: String(product.id) }} className="group relative block">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={cn(
            "aspect-square w-full object-cover",
            gone && "opacity-60",
          )}
        />
        {badge && (
          <span
            className={cn(
              "absolute top-2 left-2 px-2 py-1 text-[11px] font-semibold tracking-wide text-white",
              badge.tone,
            )}
          >
            {badge.label}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link to="/product/$id" params={{ id: String(product.id) }}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        </Link>
        <p className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-semibold tabular-nums">{inr(product.price)}</span>
          {off > 0 && (
            <span className="text-xs text-mist line-through tabular-nums">{inr(product.compareAt)}</span>
          )}
        </p>
        <StockLine stock={product.stock} />
        <div className="pt-2" />
        <button
          type="button"
          disabled={gone}
          onClick={() => {
            addQty(product.id, 1, product.stock);
            setHeld(true);
            window.setTimeout(() => setHeld(false), 900);
          }}
          className="mt-auto h-10 w-full bg-ink text-sm font-medium text-paper transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
        >
          {gone ? "Sold out" : held ? "Added" : "Add to bag"}
        </button>
      </div>
    </article>
  );
}

export function StockLine({ stock }: { stock: number }) {
  if (stock === 0) return <p className="text-xs text-mist">Sold out</p>;
  if (stock <= 5) return <p className="text-xs font-medium text-clay">Only {stock} left</p>;
  if (stock <= 20) return <p className="text-xs text-mist">Selling fast</p>;
  return <p className="text-xs text-mist">In stock</p>;
}
