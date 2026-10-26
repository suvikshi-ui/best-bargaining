import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";

/** Server-checked: is this request on the studio host? */
export const checkStudioHost = createServerFn({ method: "GET" }).handler(async () => {
  const { requestIsStudioHost } = await import("./host.server");
  return requestIsStudioHost();
});

/** Route guard for owner-only pages: 404 on public hosts. */
export async function requireStudioHost() {
  if (!(await checkStudioHost())) throw notFound();
}
