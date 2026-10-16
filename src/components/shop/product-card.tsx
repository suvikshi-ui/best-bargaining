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
        {off > 0 && (
          <span className="absolute top-2 left-2 bg-clay px-1.5 py-1 text-[11px] font-semibold text-white">
            {off}% OFF
          </span>
        )}
        {product.badge === "new" && (
          <span className="absolute top-2 right-2 bg-ink px-1.5 py-1 text-[11px] font-semibold text-white">
            NEW
          </span>
        )}
        {product.badge === "best" && (
          <span className="absolute top-2 right-2 bg-ink px-1.5 py-1 text-[11px] font-semibold text-white">
            BEST
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link to="/product/$id" params={{ id: String(product.id) }}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        </Link>
        <p className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-semibold tabular-nums">{inr(product.price)}</span>
          {off > 0 && (
            <span className="text-xs text-mist line-through tabular-nums">{inr(product.compareAt)}</span>
          )}
        </p>
        <p className="mt-1 text-xs text-mist">{gone ? "Sold out" : `${product.stock} left`}</p>
        <button
          type="button"
          disabled={gone}
          onClick={() => {
            addQty(product.id, 1, product.stock);
            setHeld(true);
            window.setTimeout(() => setHeld(false), 900);
          }}
          className="mt-3 h-10 bg-ink text-sm font-medium text-paper transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
        >
          {gone ? "Sold out" : held ? "Added" : "Add to bag"}
        </button>
      </div>
    </article>
  );
}
