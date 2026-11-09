import { createFileRoute } from "@tanstack/react-router";
import { isPublicShopHost, siteUrl } from "@/lib/seo/site";

/**
 * /robots.txt — the public shop (www / bare domain) is open to crawlers and
 * points at the sitemap. Any other host (studio.bestbargain.in, *.vercel.app
 * deploy URLs, previews) is disallowed so it never gets indexed.
 */
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
        const body = isPublicShopHost(host)
          ? [
              "User-agent: *",
              "Allow: /",
              "Disallow: /studio",
              "Disallow: /login",
              "Disallow: /cart",
              "Disallow: /account",
              "Disallow: /api/",
              "",
              `Sitemap: ${siteUrl("/sitemap.xml")}`,
              "",
            ].join("\n")
          : ["User-agent: *", "Disallow: /", ""].join("\n");
        return new Response(body, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=0, s-maxage=3600",
          },
        });
      },
    },
  },
});
