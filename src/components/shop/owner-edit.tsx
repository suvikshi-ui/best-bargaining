import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getStudio } from "@/lib/shop/api";

export function OwnerEdit({
  piece = 0,
  label = "Edit",
  className = "inline-flex h-9 items-center rounded-full border border-ink/15 px-3 text-xs font-medium",
}: {
  piece?: number;
  label?: string;
  className?: string;
}) {
  const { user } = useCurrentUserState();
  const studio = useQuery({
    queryKey: ["studio"],
    queryFn: () => getStudio(),
    enabled: Boolean(user),
    retry: false,
  });
  if (studio.data?.role !== "owner") return null;
  return (
    <Link
      to="/studio"
      search={{ piece }}
      className={className}
    >
      {label}
    </Link>
  );
}
