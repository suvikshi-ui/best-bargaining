import { Navigate, createFileRoute } from "@tanstack/react-router";
import { OwnerSignButtons } from "@/components/shop/sign-buttons";
import { ShopShell } from "@/components/shop/shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    desk: search.desk === "1" || search.desk === 1 || search.desk === true,
  }),
  component: Login,
});

function Login() {
  const { desk } = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  return (
    <ShopShell>
      <div className="mx-auto max-w-sm">
        <p className="text-sm text-clay">{desk ? "Owner desk" : "Account"}</p>
        <h1 className="mt-2 text-4xl font-semibold leading-none">{desk ? "Owner login" : "Sign in"}</h1>
        <p className="mt-3 text-sm text-mist">
          {desk
            ? "Owner login. After this you can add items and upload a photo."
            : "Create a login to place an order. Your name, mobile, and email stay saved with the shop."}
        </p>
        <div className="mt-8">
          {isPending ? (
            <div className="h-28 animate-pulse rounded-3xl bg-card" />
          ) : user ? (
            <Navigate to={desk ? "/studio" : "/account"} />
          ) : (
            <OwnerSignButtons redirectTo={desk ? "/studio" : "/account"} />
          )}
        </div>
      </div>
    </ShopShell>
  );
}
