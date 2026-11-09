import { createFileRoute } from "@tanstack/react-router";
import { siteUrl, xmlEscape } from "@/lib/seo/site";

/**
 * /sitemap.xml — generated from the products table on every request, so it
 * only ever lists live pieces (published, not archived/deleted).
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { getSql } = await import("@/lib/db");
        const sql = await getSql();
        const rows = await sql<{ id: number; lastmod: string | null }>`
          select p.id,
            to_char(greatest(p.created_at, coalesce(m.last_move, p.created_at)) at time zone 'UTC', 'YYYY-MM-DD') as lastmod
          from products p
          left join (
            select product_id, max(created_at) as last_move from stock_movements group by product_id
          ) m on m.product_id = p.id
          where p.published = true and p.archived = false
          order by p.id asc
        `;
        const newest = rows.reduce<string>((acc, row) => (row.lastmod && row.lastmod > acc ? row.lastmod : acc), "");
        const urls = [
          `  <url><loc>${xmlEscape(siteUrl("/"))}</loc>${newest ? `<lastmod>${newest}</lastmod>` : ""}<changefreq>daily</changefreq><priority>1.0</priority></url>`,
          ...rows.map(
            (row) =>
              `  <url><loc>${xmlEscape(siteUrl(`/product/${Number(row.id)}`))}</loc>${row.lastmod ? `<lastmod>${row.lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.8</priority></url>`,
          ),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
          },
        });
      },
    },
  },
});
