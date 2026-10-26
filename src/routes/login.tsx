import { Navigate, createFileRoute } from "@tanstack/react-router";
import { OwnerSignButtons } from "@/components/shop/sign-buttons";
import { requireStudioHost } from "@/lib/studio/host";
import { ShopShell } from "@/components/shop/shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({
  beforeLoad: () => requireStudioHost(),
  validateSearch: (search: Record<string, unknown>) => ({
    desk: search.desk === "1" || search.desk === 1 || search.desk === true,
  }),
  component: Login,
});

function Login() {
  const { user, isPending } = useCurrentUserState();
  return (
    <ShopShell>
      <div className="mx-auto max-w-sm">
        <p className="text-sm text-clay">Owner desk</p>
        <h1 className="mt-2 text-4xl font-semibold leading-none">Owner login</h1>
        <p className="mt-3 text-sm text-mist">
          Only the owner signs in here. Guest orders do not need an account.
        </p>
        <div className="mt-8">
          {isPending ? (
            <div className="h-28 animate-pulse rounded-3xl bg-card" />
          ) : user ? (
            <Navigate to="/studio" search={{ piece: 0 }} />
          ) : (
            <OwnerSignButtons redirectTo="/studio" />
          )}
        </div>
      </div>
    </ShopShell>
  );
}
