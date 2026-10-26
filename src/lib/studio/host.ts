import { createServerFn } from "@tanstack/react-start";
import { notFound, redirect } from "@tanstack/react-router";

/** Server-checked: is this request on the studio host? */
export const checkStudioHost = createServerFn({ method: "GET" }).handler(async () => {
  const { requestIsStudioHost } = await import("./host.server");
  return requestIsStudioHost();
});

/** Route guard for owner-only pages: 404 on public hosts. */
export async function requireStudioHost() {
  if (!(await checkStudioHost())) throw notFound();
}

const checkDedicatedStudioHost = createServerFn({ method: "GET" }).handler(async () => {
  const { requestIsDedicatedStudioHost } = await import("./host.server");
  return requestIsDedicatedStudioHost();
});

// The host never changes within a browser session, so ask the server once.
let dedicatedCache: Promise<boolean> | null = null;

/** On STUDIO_HOST itself, send every non-owner page to /studio. */
export async function redirectPublicPagesOnStudioHost(pathname: string) {
  if (pathname === "/studio" || pathname === "/login" || pathname.startsWith("/api/")) return;
  const pending =
    typeof window === "undefined" ? checkDedicatedStudioHost() : (dedicatedCache ??= checkDedicatedStudioHost());
  if (await pending) throw redirect({ to: "/studio", search: { piece: 0 } });
}
