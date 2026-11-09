/**
 * Public SEO helpers. The bare domain (bestbargain.in) 308-redirects to www,
 * so every canonical, og:url and sitemap <loc> uses the www host.
 */
export const SITE_ORIGIN = "https://www.bestbargain.in";
export const SITE_NAME = "Best Bargain";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og.jpg`;

/** Absolute URL on the canonical host. */
export function siteUrl(path = "/"): string {
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Hosts that should be crawled; everything else (studio, *.vercel.app, previews) is noindex via robots. */
export function isPublicShopHost(raw: string | null | undefined): boolean {
  const host = (raw ?? "").split(",")[0]!.trim().toLowerCase().replace(/:\d+$/, "");
  return host === "www.bestbargain.in" || host === "bestbargain.in";
}

/** Collapse whitespace and trim to ~155 chars on a word boundary. */
export function metaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
}

/** Absolute http(s) image URL for og:image, or null for data: URLs / empty. */
export function shareImage(src: string | null | undefined): string | null {
  const value = (src ?? "").trim();
  if (!value || value.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return siteUrl(value);
  return null;
}

export function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
