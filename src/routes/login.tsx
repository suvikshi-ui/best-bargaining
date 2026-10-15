import { Navigate, createFileRoute } from "@tanstack/react-router";
import { OwnerSignButtons } from "@/components/shop/sign-buttons";
import { ShopShell } from "@/components/shop/shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { user, isPending } = useCurrentUserState();
  return (
    <ShopShell>
      <div className="mx-auto max-w-sm">
        <p className="text-sm text-clay">Owner desk</p>
        <h1 className="mt-2 font-display text-5xl leading-none">Log in</h1>
        <p className="mt-3 text-sm text-mist">
          Owner login. After this you can add items and upload a photo.
        </p>
        <div className="mt-8">
          {isPending ? (
            <div className="h-28 animate-pulse rounded-3xl bg-card" />
          ) : user ? (
            <Navigate to="/studio" />
          ) : (
            <OwnerSignButtons />
          )}
        </div>
      </div>
    </ShopShell>
  );
}
