import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { OwnerEdit } from "@/components/shop/owner-edit";
import { ShopShell } from "@/components/shop/shell";
import { getPages, listProducts } from "@/lib/shop/api";
import {
  CATEGORIES,
  HERO,
  categoryOf,
  offPercent,
  readCat,
  readQuery,
  type Product,
  type ShopCat,
} from "@/lib/shop/catalog";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    cat: readCat(search.cat),
    q: readQuery(search.q),
  }),
  loader: () => listProducts(),
  component: Home,
});

function Home() {
  const { cat, q } = Route.useSearch();
  const initial = Route.useLoaderData();
  const query = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
    initialData: initial,
  });
  const pages = useQuery({ queryKey: ["pages"], queryFn: () => getPages() });
  const pageOf = (slug: string) => pages.data?.find((page) => page.slug === slug);
  const products = query.data;
  const needle = q.trim().toLowerCase();
  const visible = useMemo(
    () =>
      products.filter((product) => {
        const catOk = cat === "all" && !needle ? true : cat === "all" || product.category === cat;
        const text = `${product.name} ${product.blurb}`.toLowerCase();
        const textOk = !needle || text.includes(needle);
        const inCat = cat === "all" || product.category === cat;
        return inCat && textOk && catOk;
      }),
    [products, cat, needle],
  );
  const browsing = cat === "all" && needle.length === 0;

  return (
    <ShopShell>
      {browsing ? (
        <>
          <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-ink">
            <img
              src={HERO}
              alt="A rainy windowsill with wooden toys and a candle"
              className="h-56 w-full object-cover md:h-[420px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-12">
              <p className="text-xs font-semibold tracking-wide text-white uppercase">Rainside</p>
              <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight text-white md:text-5xl">
                {pageOf("home")?.title || "Gadgets, kitchen, fashion, and the rest of the house."}
              </h1>
              {pageOf("home")?.note ? <p className="mt-2 max-w-md text-sm text-white/80">{pageOf("home")?.note}</p> : null}
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="#shelf"
                  className="inline-flex h-11 w-fit items-center bg-clay px-5 text-sm font-semibold text-white"
                >
                  Shop now
                </a>
                <OwnerEdit
                  label="Edit site"
                  className="inline-flex h-11 items-center border border-white/40 px-4 text-sm font-medium text-white"
                />
              </div>
            </div>
          </section>

          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => {
              const items = products.filter((product) => product.category === category.id);
              const cover = items[0];
              const off = maxOff(items);
              return (
                <Link
                  key={category.id}
                  to="/"
                  search={{ cat: category.id, q: "" }}
                  className="w-24 shrink-0 text-center"
                >
                  <span className="mx-auto grid size-20 place-items-center overflow-hidden rounded-full border border-ink/10 bg-card md:size-28">
                    {cover ? (
                      <img src={cover.image} alt="" className="size-full object-cover" />
                    ) : null}
                  </span>
                  <span className="mt-2 block text-sm font-medium">{category.label}</span>
                  {category.hindi ? (
                    <span className="mt-0.5 block text-[11px] text-mist">{category.hindi}</span>
                  ) : null}
                  {off > 0 && (
                    <span className="mt-1 block text-xs font-semibold text-clay">UPTO {off}% OFF</span>
                  )}
                </Link>
              );
            })}
          </div>

          <div id="shelf" className="scroll-mt-28">
            {CATEGORIES.map((category) => (
              <Shelf
                key={category.id}
                id={category.id}
                title={pageOf(category.id)?.title || category.label}
                note={pageOf(category.id)?.note || category.note}
                items={products.filter((product) => product.category === category.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <section>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold">
              {needle ? `Search: ${q}` : pageOf(cat)?.title || categoryOf(cat).label}
            </h1>
            {!needle && <OwnerEdit label="Edit section" />}
          </div>
          <p className="mt-1 text-sm text-mist">
            {needle
              ? visible.length === 0
                ? "Nothing matched."
                : `${visible.length} products`
              : pageOf(cat)?.note ||
                (visible.length === 0 ? "Nothing matched." : `${visible.length} products`)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </ShopShell>
  );
}

function maxOff(items: Product[]) {
  return items.reduce((best, product) => Math.max(best, offPercent(product.price, product.compareAt)), 0);
}

function Shelf({
  id,
  title,
  note,
  items,
}: {
  id: ShopCat;
  title: string;
  note: string;
  items: Product[];
}) {
  if (!items.length) return null;
  const off = maxOff(items);
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3 border-b border-ink/10 pb-2">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-mist">{note}</p>
        </div>
        <div className="flex items-center gap-3">
          {off > 0 && <span className="text-xs font-semibold text-clay">UPTO {off}% OFF</span>}
          <OwnerEdit label="Edit" />
          <Link to="/" search={{ cat: id, q: "" }} className="text-sm font-medium">
            View all
          </Link>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
