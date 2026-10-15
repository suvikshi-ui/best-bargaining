import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShopShell } from "@/components/shop/shell";
import { placeOrder, listProducts } from "@/lib/shop/api";
import { useCart } from "@/lib/shop/cart";
import { inr, type OrderItem } from "@/lib/shop/catalog";

export const Route = createFileRoute("/cart")({
  loader: () => listProducts(),
  component: Bag,
});

type Receipt = {
  id: number;
  total: number;
  lines: OrderItem[];
  note: string;
};

const RECEIPT_KEY = "rainside-receipt";

function Bag() {
  const initial = Route.useLoaderData();
  const queryClient = useQueryClient();
  const products = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
    initialData: initial,
  });
  const lines = useCart((state) => state.lines);
  const setQty = useCart((state) => state.setQty);
  const remove = useCart((state) => state.remove);
  const clear = useCart((state) => state.clear);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    setReady(true);
    const saved = sessionStorage.getItem(RECEIPT_KEY);
    if (!saved) return;
    try {
      setReceipt(JSON.parse(saved) as Receipt);
    } catch {
      sessionStorage.removeItem(RECEIPT_KEY);
    }
  }, []);

  const rows = lines
    .map((line) => {
      const product = products.data.find((item) => item.id === line.id);
      return { line, product };
    })
    .filter((row) => row.product);
  const total = rows.reduce((sum, row) => sum + (row.product?.price ?? 0) * row.line.qty, 0);
  const blocked = rows.some((row) => row.product && row.line.qty > row.product.stock);

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const result = await placeOrder({
        data: { lines: rows.map((row) => ({ id: row.line.id, qty: row.line.qty })) },
      });
      const next: Receipt = {
        id: result.id,
        total: result.total,
        lines: result.lines,
        note: note.trim(),
      };
      sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(next));
      setReceipt(next);
      clear();
      setNote("");
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The order did not go through.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ShopShell>
      <h1 className="font-display text-5xl leading-none">Bag</h1>
      <p className="mt-2 max-w-md text-sm text-mist">
        Checkout reserves the pieces and updates the count. Your name stays on this phone.
      </p>

      {receipt && ready && lines.length === 0 && (
        <section className="mt-8 rounded-3xl bg-ink p-6 text-paper">
          <p className="text-sm text-paper/70">Order held</p>
          <h2 className="mt-1 font-display text-4xl">#{receipt.id}</h2>
          <ul className="mt-4 space-y-1 text-sm text-paper/80">
            {receipt.lines.map((line) => (
              <li key={line.id}>
                {line.qty} × {line.name} · {inr(line.price * line.qty)}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-display text-2xl tabular-nums">{inr(receipt.total)}</p>
          {receipt.note && <p className="mt-3 text-sm text-paper/70">Your note: {receipt.note}</p>}
          <p className="mt-3 text-sm text-paper/70">Tell the shop this number when you pay.</p>
        </section>
      )}

      {!ready ? (
        <p className="mt-10 text-mist">Opening the bag…</p>
      ) : rows.length === 0 ? (
        <div className="mt-10">
          {lines.length > 0 ? (
            <p className="text-mist">Those pieces left the shelf.</p>
          ) : receipt ? null : (
            <p className="text-mist">The bag is empty.</p>
          )}
          <Link
            to="/"
            search={{ cat: "all" }}
            className="mt-4 inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm text-paper"
          >
            Shop the shelf
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1.4fr_0.8fr]">
          <ul className="divide-y divide-ink/10">
            {rows.map(({ line, product }) =>
              product ? (
                <li key={line.id} className="flex gap-3 py-4">
                  <img
                    src={product.image}
                    alt=""
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/product/$id"
                      params={{ id: String(product.id) }}
                      className="font-display text-xl"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm tabular-nums text-mist">
                      {inr(product.price)} · {product.stock} left
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Fewer ${product.name}`}
                        onClick={() => setQty(product.id, line.qty - 1, product.stock)}
                        className="grid h-11 w-11 place-items-center rounded-full border border-ink/15"
                      >
                        −
                      </button>
                      <span className="w-6 text-center tabular-nums">{line.qty}</span>
                      <button
                        type="button"
                        aria-label={`More ${product.name}`}
                        onClick={() => setQty(product.id, line.qty + 1, product.stock)}
                        className="grid h-11 w-11 place-items-center rounded-full border border-ink/15"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(product.id)}
                        className="h-11 px-2 text-sm text-mist"
                      >
                        Remove
                      </button>
                    </div>
                    {line.qty > product.stock && (
                      <p className="mt-1 text-sm text-clay">Only {product.stock} left.</p>
                    )}
                  </div>
                </li>
              ) : null,
            )}
          </ul>
          <aside className="h-fit rounded-3xl bg-card p-5">
            <p className="text-sm text-mist">Total</p>
            <p className="font-display text-4xl tabular-nums">{inr(total)}</p>
            <label className="mt-5 block text-sm text-mist" htmlFor="bag-note">
              Name or phone — only on this phone, not saved by the shop
            </label>
            <input
              id="bag-note"
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 80))}
              className="mt-2 h-11 w-full rounded-2xl border border-ink/15 bg-paper px-3 text-sm outline-none focus:border-clay"
            />
            {error && (
              <p className="mt-3 text-sm text-clay" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={busy || blocked || rows.length === 0}
              onClick={() => void checkout()}
              className="mt-4 h-12 w-full rounded-full bg-clay text-sm text-paper transition-transform duration-150 active:scale-[0.96] disabled:opacity-40"
            >
              {busy ? "Reserving…" : "Place order"}
            </button>
          </aside>
        </div>
      )}
    </ShopShell>
  );
}
