import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShopShell } from "@/components/shop/shell";
import { placeOrder, listProducts } from "@/lib/shop/api";
import { useCart } from "@/lib/shop/cart";
import { inr, customerSchema, type OrderItem } from "@/lib/shop/catalog";

export const Route = createFileRoute("/cart")({
  loader: () => listProducts(),
  component: Bag,
});

type Receipt = {
  id: number;
  total: number;
  lines: OrderItem[];
  name: string;
  phone: string;
  email: string;
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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
      const customer = customerSchema.safeParse({ name, phone, email });
      if (!customer.success) {
        setError(customer.error.issues[0]?.message ?? "Add the customer details.");
        setBusy(false);
        return;
      }
      const result = await placeOrder({
        data: {
          lines: rows.map((row) => ({ id: row.line.id, qty: row.line.qty })),
          customer: customer.data,
        },
      });
      const next: Receipt = {
        id: result.id,
        total: result.total,
        lines: result.lines,
        name: customer.data.name,
        phone: customer.data.phone,
        email: customer.data.email,
      };
      sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(next));
      setReceipt(next);
      clear();
      setName("");
      setPhone("");
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["my-bag"] });
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
        Add your name, mobile, and email, then place the order. No sign-in.
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
          {receipt.name ? (
            <>
              <p className="mt-3 text-sm text-paper/80">{receipt.name}</p>
              <p className="text-sm text-paper/70">{receipt.phone}</p>
              <p className="text-sm text-paper/70">{receipt.email}</p>
            </>
          ) : null}
          <p className="mt-3 text-sm text-paper/70">The shop has these details with the order.</p>
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
            search={{ cat: "all", q: "" }}
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
            <label className="mt-4 block text-sm text-mist" htmlFor="customer-name">
              Customer name
            </label>
            <input
              id="customer-name"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-ink/15 bg-paper px-3 text-sm outline-none focus:border-clay"
            />
            <label className="mt-3 block text-sm text-mist" htmlFor="customer-phone">
              Mobile number
            </label>
            <input
              id="customer-phone"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-ink/15 bg-paper px-3 text-sm outline-none focus:border-clay"
            />
            <label className="mt-3 block text-sm text-mist" htmlFor="customer-email">
              Email
            </label>
            <input
              id="customer-email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
