import { getRequestHeader, getRequestHost } from "@tanstack/react-start/server";

/**
 * The owner desk (/studio, /login and owner server functions) is only served on
 * STUDIO_HOST (default studio.bestbargain.in), plus local dev, *.vercel.app
 * deploy hosts and the sandbox preview. Public hosts such as bestbargain.in and
 * www.bestbargain.in never expose it.
 */
export function studioHost(): string {
  const value = process.env.STUDIO_HOST?.trim().toLowerCase();
  return (value || "studio.bestbargain.in").replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export function isStudioHostname(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const host = raw.split(",")[0]!.trim().toLowerCase().replace(/:\d+$/, "");
  if (host === studioHost()) return true;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  if (host.endsWith(".vercel.app") || host.endsWith(".grok-sandbox.com")) return true;
  return false;
}

/** True when the current request came in on a host allowed to serve the owner desk. */
export function requestIsStudioHost(): boolean {
  const forwarded = getRequestHeader("x-forwarded-host");
  return isStudioHostname(forwarded ?? getRequestHost());
}

/** True only on the dedicated studio host itself (not dev/preview hosts). */
export function requestIsDedicatedStudioHost(): boolean {
  const raw = getRequestHeader("x-forwarded-host") ?? getRequestHost();
  const host = (raw ?? "").split(",")[0]!.trim().toLowerCase().replace(/:\d+$/, "");
  return host === studioHost();
}
