import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShopShell } from "@/components/shop/shell";
import { useCart } from "@/lib/shop/cart";
import { getProduct } from "@/lib/shop/api";
import { categoryOf, inr, offPercent } from "@/lib/shop/catalog";

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
        <Link to="/" search={{ cat: "all", q: "" }} className="mt-4 inline-flex h-11 items-center text-sm font-medium">
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
      <Link to="/" search={{ cat: "all", q: "" }} className="text-sm text-mist hover:text-ink">
        Home
      </Link>
      <div className="mt-4 grid items-start gap-6 md:grid-cols-2">
        <ProductGallery photos={[product.image, ...(product.images ?? [])]} name={product.name} />
        <div>
          <p className="text-sm text-mist">
            {category.label} · {category.hindi}
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">{product.name}</h1>
          <p className="mt-3 max-w-md text-sm text-mist">{product.blurb}</p>
          {product.description && product.showDescription !== false ? (
            <div className="mt-4 max-w-md whitespace-pre-line text-sm leading-relaxed" data-testid="product-description">
              {product.description}
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <p className="text-3xl font-semibold tabular-nums">{inr(product.price)}</p>
            {offPercent(product.price, product.compareAt) > 0 && (
              <>
                <p className="text-sm text-mist line-through tabular-nums">{inr(product.compareAt)}</p>
                <p className="bg-clay px-2 py-1 text-xs font-semibold text-white">
                  {offPercent(product.price, product.compareAt)}% OFF
                </p>
              </>
            )}
          </div>
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
            className="mt-6 h-12 w-full bg-ink px-6 text-sm font-semibold text-paper disabled:opacity-40 md:w-auto"
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


function ProductGallery({ photos, name }: { photos: string[]; name: string }) {
  const list = photos.filter(Boolean).slice(0, 4);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const count = list.length;

  const go = useCallback(
    (index: number, smooth = true) => {
      const next = Math.max(0, Math.min(count - 1, index));
      setActive(next);
      const el = track.current;
      if (el) el.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
    },
    [count],
  );

  // Keep the active dot in step with native swipes (scroll-snap).
  function onScroll() {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== active) setActive(index);
  }

  useEffect(() => {
    if (!zoom) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoom(false);
      else if (event.key === "ArrowRight") setActive((i) => Math.min(count - 1, i + 1));
      else if (event.key === "ArrowLeft") setActive((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [zoom, count]);

  // When the zoom view closes, line the slider up with the photo last shown.
  useEffect(() => {
    if (!zoom) go(active, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  if (count === 0) return <div data-testid="product-gallery" className="aspect-square w-full border border-ink/10 bg-card" />;

  const arrow =
    "absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-xl shadow sm:flex disabled:opacity-0";

  return (
    <div data-testid="product-gallery">
      <div
        className="relative overflow-hidden border border-ink/10 bg-card outline-none focus-visible:ring-2 focus-visible:ring-clay"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} photos`}
        tabIndex={count > 1 ? 0 : -1}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            go(active + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(active - 1);
          }
        }}
      >
        <div
          ref={track}
          data-testid="gallery-track"
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {list.map((photo, i) => (
            <button
              key={`${i}-${photo.slice(-24)}`}
              type="button"
              className="w-full shrink-0 snap-center cursor-zoom-in"
              aria-label={`Photo ${i + 1} of ${count}, open full screen`}
              onClick={() => {
                setActive(i);
                setZoom(true);
              }}
            >
              <img
                src={photo}
                alt={i === 0 ? name : `${name}, photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
        {count > 1 ? (
          <>
            <button type="button" aria-label="Previous photo" disabled={active === 0} onClick={() => go(active - 1)} className={`${arrow} left-2`}>
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              disabled={active === count - 1}
              onClick={() => go(active + 1)}
              className={`${arrow} right-2`}
            >
              ›
            </button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5" data-testid="gallery-dots">
              {list.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => go(i)}
                  className={`h-2 rounded-full transition-all ${i === active ? "w-5 bg-clay" : "w-2 bg-paper/90 shadow"}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {list.map((photo, i) => (
            <button
              key={`${i}-${photo.slice(-24)}`}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => go(i)}
              className={i === active ? "border-2 border-clay" : "border-2 border-transparent"}
            >
              <img src={photo} alt="" loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      {zoom ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name}, photo ${active + 1} of ${count}`}
          data-testid="gallery-zoom"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95"
          onClick={() => setZoom(false)}
        >
          <img
            src={list[active]}
            alt={`${name}, photo ${active + 1}`}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Close"
            autoFocus
            onClick={() => setZoom(false)}
            className="absolute right-3 top-3 h-10 w-10 rounded-full bg-paper/90 text-xl"
          >
            ×
          </button>
          {count > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                disabled={active === 0}
                onClick={(event) => {
                  event.stopPropagation();
                  setActive(active - 1);
                }}
                className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-paper/90 text-xl disabled:opacity-0"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next photo"
                disabled={active === count - 1}
                onClick={(event) => {
                  event.stopPropagation();
                  setActive(active + 1);
                }}
                className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-paper/90 text-xl disabled:opacity-0"
              >
                ›
              </button>
              <p className="absolute bottom-4 text-sm text-paper/80 tabular-nums">
                {active + 1} / {count}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
