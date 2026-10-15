import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  asItems,
  asProduct,
  productWriteSchema,
  type Product,
  type ProductWrite,
  type ShopOrder,
} from "@/lib/shop/catalog";

async function ensureOwner(userId: string): Promise<"owner" | "locked"> {
  const sql = await getSql();
  const rows = await sql<{ owner_user_id: string | null }>`
    select owner_user_id from shop where id = 1
  `;
  const owner = rows[0]?.owner_user_id ?? null;
  if (owner === userId) return "owner";
  if (owner) return "locked";
  const claimed = await sql<{ owner_user_id: string }>`
    update shop set owner_user_id = ${userId}
    where id = 1 and owner_user_id is null
    returning owner_user_id
  `;
  if (!claimed.length) {
    const again = await sql<{ owner_user_id: string | null }>`
      select owner_user_id from shop where id = 1
    `;
    return again[0]?.owner_user_id === userId ? "owner" : "locked";
  }
  await sql`update products set user_id = ${userId} where user_id = 'seed'`;
  return "owner";
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<Product>`
    select id, name, category, price, stock, blurb, image, badge, published
    from products
    where published = true
    order by case badge when 'best' then 0 when 'new' then 1 else 2 end, id asc
  `;
  return rows.map(asProduct);
});

export const getProduct = createServerFn({ method: "GET" })
  .validator((id: unknown) => {
    const parsed = typeof id === "number" ? id : Number(id);
    if (!Number.isInteger(parsed) || parsed < 1) return 0;
    return parsed;
  })
  .handler(async ({ data: id }) => {
    if (id < 1) return null;
    const sql = await getSql();
    const rows = await sql<Product>`
      select id, name, category, price, stock, blurb, image, badge, published
      from products
      where id = ${id} and published = true
    `;
    return rows[0] ? asProduct(rows[0]) : null;
  });

export const getStudio = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const role = await ensureOwner(context.userId);
    if (role !== "owner") {
      return { role: "locked" as const, products: [] as Product[], orders: [] as ShopOrder[] };
    }
    const sql = await getSql();
    const products = await sql<Product>`
      select id, name, category, price, stock, blurb, image, badge, published
      from products
      where user_id = ${context.userId}
      order by id desc
    `;
    const orders = await sql<{ id: number; items: string; total: number; created_at: string }>`
      select id, items, total, created_at::text as created_at
      from orders
      order by id desc
      limit 12
    `;
    return {
      role: "owner" as const,
      products: products.map(asProduct),
      orders: orders.map((order) => ({
        id: Number(order.id),
        items: asItems(order.items),
        total: Number(order.total),
        createdAt: order.created_at,
      })),
    };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown): ProductWrite => {
    const parsed = productWriteSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Check the product details.");
    }
    return parsed.data;
  })
  .handler(async ({ context, data }) => {
    const role = await ensureOwner(context.userId);
    if (role !== "owner") throw new Error("Only the shop owner can change the shelf.");
    const sql = await getSql();
    if (data.id) {
      const rows = await sql<{ id: number }>`
        update products set
          name = ${data.name},
          category = ${data.category},
          price = ${data.price},
          stock = ${data.stock},
          blurb = ${data.blurb},
          image = ${data.image},
          badge = ${data.badge},
          published = ${data.published}
        where id = ${data.id} and user_id = ${context.userId}
        returning id
      `;
      if (!rows.length) throw new Error("That piece is not in your shop.");
      return { id: Number(rows[0].id) };
    }
    const rows = await sql<{ id: number }>`
      insert into products (user_id, name, category, price, stock, blurb, image, badge, published)
      values (
        ${context.userId},
        ${data.name},
        ${data.category},
        ${data.price},
        ${data.stock},
        ${data.blurb},
        ${data.image},
        ${data.badge},
        ${data.published}
      )
      returning id
    `;
    return { id: Number(rows[0].id) };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => {
    const parsed = typeof id === "number" ? id : Number(id);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("Missing piece.");
    return parsed;
  })
  .handler(async ({ context, data: id }) => {
    const role = await ensureOwner(context.userId);
    if (role !== "owner") throw new Error("Only the shop owner can change the shelf.");
    const sql = await getSql();
    await sql`delete from products where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

const orderSchema = zLines();

function zLines() {
  return {
    parse(raw: unknown) {
      if (!raw || typeof raw !== "object" || !("lines" in raw)) {
        throw new Error("The bag is empty.");
      }
      const lines = (raw as { lines: unknown }).lines;
      if (!Array.isArray(lines) || lines.length < 1 || lines.length > 20) {
        throw new Error("The bag looks off.");
      }
      const merged = new Map<number, number>();
      for (const line of lines) {
        if (!line || typeof line !== "object") throw new Error("The bag looks off.");
        const row = line as { id?: unknown; qty?: unknown };
        const id = typeof row.id === "number" ? row.id : Number(row.id);
        const qty = typeof row.qty === "number" ? row.qty : Number(row.qty);
        if (!Number.isInteger(id) || id < 1 || !Number.isInteger(qty) || qty < 1 || qty > 12) {
          throw new Error("Check the quantities.");
        }
        merged.set(id, Math.min(12, (merged.get(id) ?? 0) + qty));
      }
      return [...merged.entries()].map(([id, qty]) => ({ id, qty }));
    },
  };
}

export const placeOrder = createServerFn({ method: "POST" })
  .validator((raw: unknown) => orderSchema.parse(raw))
  .handler(async ({ data: lines }) => {
    const sql = await getSql();
    const picked: { id: number; name: string; price: number; qty: number }[] = [];
    for (const line of lines) {
      const rows = await sql<{ id: number; name: string; price: number; stock: number }>`
        select id, name, price, stock from products
        where id = ${line.id} and published = true
      `;
      const product = rows[0];
      if (!product) throw new Error("Something in the bag is no longer for sale.");
      if (Number(product.stock) < line.qty) {
        throw new Error(`${product.name} only has ${product.stock} left.`);
      }
      picked.push({
        id: Number(product.id),
        name: product.name,
        price: Number(product.price),
        qty: line.qty,
      });
    }
    const held: typeof picked = [];
    try {
      for (const line of picked) {
        const rows = await sql<{ id: number }>`
          update products set stock = stock - ${line.qty}
          where id = ${line.id} and stock >= ${line.qty}
          returning id
        `;
        if (!rows.length) throw new Error(`${line.name} just sold out.`);
        held.push(line);
      }
      const total = picked.reduce((sum, line) => sum + line.price * line.qty, 0);
      const inserted = await sql<{ id: number }>`
        insert into orders (items, total)
        values (${JSON.stringify(picked)}, ${total})
        returning id
      `;
      return {
        id: Number(inserted[0].id),
        total,
        lines: picked,
      };
    } catch (error) {
      for (const line of held) {
        await sql`update products set stock = stock + ${line.qty} where id = ${line.id}`;
      }
      throw error;
    }
  });

