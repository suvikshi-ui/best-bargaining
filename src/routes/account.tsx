import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ShopShell } from "@/components/shop/shell";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyOrders } from "@/lib/shop/api";
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

  return (
    <ShopShell>
      <p className="text-sm text-clay">Your account</p>
      <h1 className="mt-1 text-4xl font-semibold">Orders</h1>
      {isPending ? (
        <div className="mt-6 h-28 animate-pulse bg-card" />
      ) : !user ? (
        <div className="mt-6 max-w-sm">
          <p className="text-sm text-mist">Sign in to see orders saved on this login.</p>
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
          {orders.isPending ? (
            <div className="mt-6 h-24 animate-pulse bg-card" />
          ) : orders.data && orders.data.length > 0 ? (
            <ul className="mt-6 space-y-3">
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
            <p className="mt-6 text-sm text-mist">No orders on this login yet.</p>
          )}
        </div>
      )}
    </ShopShell>
  );
}
