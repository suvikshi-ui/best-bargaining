import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useCart } from "@/lib/shop/cart";
import { inr, type Product } from "@/lib/shop/catalog";

export function ProductCard({
  product,
  tone = "day",
}: {
  product: Product;
  tone?: "day" | "night";
}) {
  const addQty = useCart((state) => state.addQty);
  const [held, setHeld] = useState(false);
  const night = tone === "night";
  const gone = product.stock === 0;

  return (
    <article className="flex min-w-0 flex-col">
      <Link
        to="/product/$id"
        params={{ id: String(product.id) }}
        className="group block min-w-0"
      >
        <div className={cn("overflow-hidden rounded-3xl", night ? "bg-paper/10" : "bg-card")}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={cn(
              "aspect-square w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]",
              gone && "opacity-60",
            )}
          />
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <h3
            className={cn(
              "font-display text-lg leading-tight",
              night ? "text-paper" : "text-ink",
            )}
          >
            {product.name}
          </h3>
          {product.badge === "best" && <span className="shrink-0 text-xs text-clay">Best</span>}
          {product.badge === "new" && (
            <span className={cn("shrink-0 text-xs", night ? "text-paper/70" : "text-mist")}>New</span>
          )}
        </div>
      </Link>
      <p className={cn("mt-1 text-sm tabular-nums", night ? "text-paper/70" : "text-mist")}>
        {inr(product.price)}
        <span aria-hidden="true"> · </span>
        {gone ? "Gone for now" : `${product.stock} left`}
      </p>
      <button
        type="button"
        disabled={gone}
        onClick={() => {
          addQty(product.id, 1, product.stock);
          setHeld(true);
          window.setTimeout(() => setHeld(false), 900);
        }}
        className="mt-3 h-11 rounded-full bg-clay px-4 text-sm text-paper transition-transform duration-150 active:scale-[0.96] disabled:opacity-40"
      >
        {gone ? "Sold out" : held ? "In the bag" : "Add to bag"}
      </button>
    </article>
  );
}
