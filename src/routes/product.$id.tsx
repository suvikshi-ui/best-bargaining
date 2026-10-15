import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShopShell } from "@/components/shop/shell";
import { useCart } from "@/lib/shop/cart";
import { getProduct } from "@/lib/shop/api";
import { categoryOf, inr } from "@/lib/shop/catalog";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => getProduct({ data: Number(params.id) }),
  component: Piece,
});

function Piece() {
  const initial = Route.useLoaderData();
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct({ data: Number(id) }),
    initialData: initial,
  });
  const product = query.data;
  const addQty = useCart((state) => state.addQty);
  const [qty, setQty] = useState(1);
  const [held, setHeld] = useState(false);

  if (!product) {
    return (
      <ShopShell>
        <h1 className="font-display text-4xl">That piece is not on the shelf.</h1>
        <Link to="/" search={{ cat: "all" }} className="mt-4 inline-flex h-11 items-center text-clay">
          Back to the shop
        </Link>
      </ShopShell>
    );
  }

  const category = categoryOf(product.category);
  const gone = product.stock === 0;
  const max = Math.min(12, product.stock);

  return (
    <ShopShell>
      <Link to="/" search={{ cat: "all" }} className="text-sm text-mist hover:text-ink">
        All pieces
      </Link>
      <div className="mt-4 grid items-start gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-card">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </div>
        <div>
          <p className="text-sm text-clay">
            {category.hindi} · {category.label}
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none">{product.name}</h1>
          <p className="mt-4 max-w-md text-mist">{product.blurb}</p>
          <p className="mt-6 font-display text-3xl tabular-nums">{inr(product.price)}</p>
          <p className="mt-1 text-sm text-mist">
            {gone ? "Gone for now." : `${product.stock} in the shop.`}
          </p>
          {!gone && (
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                className="grid h-11 w-11 place-items-center rounded-full border border-ink/15 text-lg"
              >
                −
              </button>
              <span className="w-8 text-center tabular-nums">{Math.min(qty, max)}</span>
              <button
                type="button"
                aria-label="More"
                onClick={() => setQty((value) => Math.min(max, value + 1))}
                className="grid h-11 w-11 place-items-center rounded-full border border-ink/15 text-lg"
              >
                +
              </button>
            </div>
          )}
          <button
            type="button"
            disabled={gone}
            onClick={() => {
              addQty(product.id, Math.min(qty, max), product.stock);
              setHeld(true);
              void queryClient.invalidateQueries({ queryKey: ["products"] });
            }}
            className="mt-6 h-12 w-full rounded-full bg-clay px-6 text-sm text-paper transition-transform duration-150 active:scale-[0.96] disabled:opacity-40 md:w-auto"
          >
            {gone ? "Sold out" : held ? "In the bag" : "Add to bag"}
          </button>
          <Link to="/cart" className="mt-4 block text-sm text-mist hover:text-ink">
            View bag
          </Link>
        </div>
      </div>
    </ShopShell>
  );
}

