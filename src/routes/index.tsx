import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { ShopShell } from "@/components/shop/shell";
import { cn } from "@/lib/cn";
import { listProducts } from "@/lib/shop/api";
import {
  CATEGORIES,
  HERO,
  categoryOf,
  readCat,
  type Product,
  type ShopCat,
} from "@/lib/shop/catalog";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    cat: readCat(search.cat),
  }),
  loader: () => listProducts(),
  component: Home,
});

function Home() {
  const { cat } = Route.useSearch();
  const initial = Route.useLoaderData();
  const query = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
    initialData: initial,
  });
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const products = query.data;
  const visible = useMemo(
    () =>
      products.filter((product) => {
        const catOk = cat === "all" || product.category === cat;
        const text = `${product.name} ${product.blurb}`.toLowerCase();
        return catOk && (!needle || text.includes(needle));
      }),
    [products, cat, needle],
  );
  const browsing = cat === "all" && needle.length === 0;
  const counts = countBy(products);

  return (
    <ShopShell>
      <section className="grid items-end gap-8 md:grid-cols-2 md:gap-12">
        <div className="rise">
          <p className="text-sm text-clay">दिन के खिलौने · रात की बारिश</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-ink md:text-6xl">
            Toys for daylight. Things for rainy nights.
          </h1>
          <p className="mt-4 max-w-md text-mist">
            Wooden play, warm light, wool, and a cup that stays hot. A small shelf you can actually finish looking at.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#shelf"
              className="inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm text-paper transition-transform duration-150 active:scale-[0.96]"
            >
              Shop the shelf
            </a>
            <Link
              to="/studio"
              className="inline-flex h-12 items-center rounded-full border border-ink/15 px-5 text-sm text-ink"
            >
              Owner desk
            </Link>
          </div>
          <p className="mt-6 text-sm tabular-nums text-mist">
            {counts.toys} toys · {counts.rainy} rainy-night · {counts.everyday} everyday
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl bg-card">
          <img
            src={HERO}
            alt="A rainy windowsill with wooden toys and a candle"
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
      </section>

      <div id="shelf" className="mt-12 scroll-mt-24">
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-x-5" role="tablist" aria-label="Categories">
            <CatLink id="all" current={cat} count={products.length} label="All" />
            {CATEGORIES.map((category) => (
              <CatLink
                key={category.id}
                id={category.id}
                current={cat}
                count={counts[category.id]}
                label={category.label}
              />
            ))}
          </div>
          <label className="block w-full md:max-w-xs">
            <span className="sr-only">Search the shelf</span>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search pieces"
              className="h-11 w-full rounded-full border border-ink/15 bg-card px-4 text-sm text-ink outline-none placeholder:text-mist focus:border-clay"
            />
          </label>
        </div>

        {browsing ? (
          <>
            <Shelf
              title="Toys"
              hindi="खिलौने"
              note="Things small hands keep."
              items={products.filter((product) => product.category === "toys")}
            />
            <section className="mt-12 rounded-3xl bg-ink px-4 py-8 text-paper md:px-8">
              <p className="text-sm text-paper/70">बारिश की रात</p>
              <h2 className="mt-1 font-display text-4xl">Rainy night</h2>
              <p className="mt-2 max-w-md text-sm text-paper/70">
                Light, wool, and something warm in both hands. For the hour the glass goes dark.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                {products
                  .filter((product) => product.category === "rainy")
                  .map((product) => (
                    <ProductCard key={product.id} product={product} tone="night" />
                  ))}
              </div>
            </section>
            <Shelf
              title="Everyday"
              hindi="रोज़मर्रा"
              note="The pieces you reach for twice."
              items={products.filter((product) => product.category === "everyday")}
            />
          </>
        ) : (
          <section className="mt-8">
            <h2 className="font-display text-3xl">
              {cat === "all" ? "Matches" : categoryOf(cat).label}
            </h2>
            <p className="mt-1 text-sm text-mist">
              {visible.length === 0 ? "Nothing by that name." : `${visible.length} on the shelf.`}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </ShopShell>
  );
}

function countBy(products: Product[]) {
  return {
    toys: products.filter((product) => product.category === "toys").length,
    rainy: products.filter((product) => product.category === "rainy").length,
    everyday: products.filter((product) => product.category === "everyday").length,
  };
}

function CatLink({
  id,
  current,
  count,
  label,
}: {
  id: ShopCat;
  current: ShopCat;
  count: number;
  label: string;
}) {
  const on = current === id;
  return (
    <Link
      to="/"
      search={{ cat: id }}
      role="tab"
      aria-selected={on}
      className={cn(
        "inline-flex h-11 items-center gap-2 border-b-2 text-sm",
        on ? "border-clay text-ink" : "border-transparent text-mist",
      )}
    >
      {label}
      <span className="tabular-nums text-xs">{count}</span>
    </Link>
  );
}

function Shelf({
  title,
  hindi,
  note,
  items,
}: {
  title: string;
  hindi: string;
  note: string;
  items: Product[];
}) {
  if (!items.length) return null;
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-clay">{hindi}</p>
          <h2 className="font-display text-4xl text-ink">{title}</h2>
        </div>
        <p className="hidden max-w-xs text-right text-sm text-mist md:block">{note}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
