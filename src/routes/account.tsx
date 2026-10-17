import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ShopShell } from "@/components/shop/shell";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyBag, getMyOrders } from "@/lib/shop/api";
import { inr } from "@/lib/shop/catalog";

export const Route = createFileRoute("/account")({
  component: Account,
});

function Account() {
  const { user, isPending } = useCurrentUserState();
  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: () => getMyOrders(),
    enabled: Boolean(user),
  });
  const bag = useQuery({
    queryKey: ["my-bag", user?.id],
    queryFn: () => getMyBag(),
    enabled: Boolean(user),
  });
  const bagTotal = (bag.data ?? []).reduce((sum, line) => sum + line.price * line.qty, 0);

  return (
    <ShopShell>
      <p className="text-sm text-clay">Your account</p>
      <h1 className="mt-1 text-4xl font-semibold">Bag and orders</h1>
      {isPending ? (
        <div className="mt-6 h-28 animate-pulse bg-card" />
      ) : !user ? (
        <div className="mt-6 max-w-sm">
          <p className="text-sm text-mist">Sign in to see the bag and every order on this login.</p>
          <Link
            to="/login"
            search={{ desk: false }}
            className="mt-4 inline-flex h-11 items-center bg-ink px-5 text-sm font-medium text-paper"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{user.displayName || "Customer"}</p>
              <p className="text-sm text-mist">{user.primaryEmail}</p>
            </div>
            <UserButton />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/cart" className="inline-flex h-11 items-center bg-ink px-5 text-sm font-medium text-paper">
              View bag
            </Link>
            <Link
              to="/cart"
              className="inline-flex h-11 items-center border border-ink/15 px-5 text-sm font-medium"
            >
              Book order
            </Link>
          </div>
          {!bag.data?.length && !bag.isPending ? (
            <p className="mt-3 text-sm text-mist">The bag is empty. Pick a product, then book the order.</p>
          ) : null}

          <h2 className="mt-8 text-xl font-semibold">In the bag</h2>
          {bag.isPending ? (
            <div className="mt-3 h-16 animate-pulse bg-card" />
          ) : bag.data && bag.data.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {bag.data.map((line) => (
                <li key={line.id} className="flex items-center justify-between border border-ink/10 px-3 py-2 text-sm">
                  <span>
                    {line.qty} × {line.name}
                  </span>
                  <span className="tabular-nums">{inr(line.price * line.qty)}</span>
                </li>
              ))}
              <li className="text-sm font-medium">Bag total {inr(bagTotal)}</li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-mist">The bag is empty.</p>
          )}
          <Link to="/cart" className="mt-3 inline-flex h-11 items-center text-sm font-medium">
            Open bag
          </Link>

          <h2 className="mt-8 text-xl font-semibold">Order history</h2>
          {orders.isPending ? (
            <div className="mt-3 h-24 animate-pulse bg-card" />
          ) : orders.data && orders.data.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {orders.data.map((order) => (
                <li key={order.id} className="border border-ink/10 px-4 py-3">
                  <p className="font-medium">
                    Order #{order.id} · <span className="tabular-nums">{inr(order.total)}</span>
                  </p>
                  <p className="mt-1 text-sm text-mist">
                    {order.customerName} · {order.customerPhone}
                  </p>
                  <p className="text-sm text-mist">
                    {order.items.map((item) => `${item.qty} × ${item.name}`).join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-mist">No orders on this login yet.</p>
          )}
        </div>
      )}
    </ShopShell>
  );
}
