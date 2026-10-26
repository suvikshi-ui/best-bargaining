import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  asItems,
  asProduct,
  customerSchema,
  productWriteSchema,
  CATEGORIES,
  type Product,
  type ProductWrite,
  type ShopCustomer,
  type ShopOrder,
  type SitePage,
  type ReferralAgent,
  readReferralCode,
  parseAgentCode,
  type ShopSettings,
  parseJsonList,
  shopSettingsSchema,
  normalizeWhatsApp,
  CATEGORIES as ALL_CATEGORIES,
} from "@/lib/shop/catalog";
import {
  quote as computeQuote,
  DISCOUNT_TYPES,
  type DiscountRule,
  type DiscountType,
  type Quote,
} from "@/lib/shop/discounts";

/**
 * OWNER_EMAIL (server env) locks the studio owner to one email address.
 * When set, only the signed-in user with that email (case-insensitive) can be
 * or become the owner; anyone else is "locked", even if the shop row names them.
 * If the row points at someone else, the matching user takes it over and the
 * previous owner's products move to them. When unset: first sign-in wins.
 */
function ownerEmail(): string | null {
  const value = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return value ? value : null;
}

async function ensureOwner(userId: string): Promise<"owner" | "locked"> {
  const { requestIsStudioHost } = await import("@/lib/studio/host.server");
  if (!requestIsStudioHost()) return "locked";
  const sql = await getSql();
  const lockedEmail = ownerEmail();
  if (lockedEmail) {
    const users = await sql<{ email: string | null }>`
      select email from "user" where id = ${userId}
    `;
    const email = users[0]?.email?.trim().toLowerCase() ?? "";
    if (email !== lockedEmail) return "locked";
    const current = await sql<{ owner_user_id: string | null }>`
      select owner_user_id from shop where id = 1
    `;
    const previous = current[0]?.owner_user_id ?? null;
    if (previous === userId) return "owner";
    await sql`update shop set owner_user_id = ${userId} where id = 1`;
    await sql`update products set user_id = ${userId} where user_id = 'seed'`;
    if (previous) {
      await sql`update products set user_id = ${userId} where user_id = ${previous}`;
    }
    return "owner";
  }
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
    select id, name, category, price, compare_at, stock, blurb, image, badge, published
    from products
    where published = true
    order by category, id asc
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
      select id, name, category, price, compare_at, stock, blurb, image, badge, published, images, description, show_description
      from products
      where id = ${id} and published = true
    `;
    return rows[0] ? asProduct(rows[0]) : null;
  });

export const getPages = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<SitePage>`select slug, title, note from site_pages`;
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title ?? "",
    note: row.note ?? "",
  }));
});

const pageSchema = z.object({
  slug: z.string().trim().min(1).max(40),
  title: z.string().trim().max(120),
  note: z.string().trim().max(400),
});

export const savePage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const parsed = pageSchema.safeParse(raw);
    if (!parsed.success) throw new Error("Check the page title.");
    return parsed.data;
  })
  .handler(async ({ context, data }) => {
    const role = await ensureOwner(context.userId);
    if (role !== "owner") throw new Error("Only the shop owner can edit the site.");
    const allowed = data.slug === "home" || CATEGORIES.some((item) => item.id === data.slug);
    if (!allowed) throw new Error("That page is not on the site.");
    const sql = await getSql();
    await sql`
      insert into site_pages (slug, title, note)
      values (${data.slug}, ${data.title}, ${data.note})
      on conflict (slug) do update set title = excluded.title, note = excluded.note
    `;
    return { ok: true };
  });

export const getStudio = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const role = await ensureOwner(context.userId);
    if (role !== "owner") {
      return { role: "locked" as const, products: [] as Product[], orders: [] as ShopOrder[], customers: [] as ShopCustomer[] };
    }
    const sql = await getSql();
    const products = await sql<Product>`
      select id, name, category, price, compare_at, stock, blurb, image, badge, published, images, description, show_description
      from products
      where user_id = ${context.userId}
      order by id desc
    `;
    const orders = await sql<{
      id: number;
      items: string;
      total: number;
      created_at: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string;
      account_email: string;
      user_id: string;
      referral_code: string | null;
      discount_amount: number | null;
      discount_label: string | null;
    }>`
      select id, items, total, created_at::text as created_at,
        customer_name, customer_phone, customer_email, account_email, user_id,
        referral_code, discount_amount, discount_label
      from orders
      order by id desc
      limit 80
    `;
    const profiles = await sql<{
      user_id: string;
      name: string;
      email: string;
      phone: string;
      last_seen: string;
    }>`
      select user_id, name, email, phone, last_seen::text as last_seen
      from customer_profiles
      where user_id <> ${context.userId}
      order by last_seen desc
      limit 80
    `;
    const bagRows = await sql<{
      user_id: string;
      id: number;
      name: string;
      qty: number;
      price: number;
    }>`
      select b.user_id, p.id, p.name, b.qty, p.price
      from bags b
      join products p on p.id = b.product_id
      where b.user_id <> ${context.userId}
      order by p.name
    `;
    const mappedOrders = orders.map((order) => ({
      id: Number(order.id),
      items: asItems(order.items),
      total: Number(order.total),
      createdAt: order.created_at,
      customerName: order.customer_name ?? "",
      customerPhone: order.customer_phone ?? "",
      customerEmail: order.customer_email ?? "",
      accountEmail: order.account_email ?? "",
      userId: order.user_id ?? "",
      referralCode: order.referral_code ?? "",
      discountAmount: Number(order.discount_amount ?? 0),
      discountLabel: order.discount_label ?? "",
    }));
    const byUser = new Map<string, ShopCustomer>();
    for (const profile of profiles) {
      byUser.set(profile.user_id, {
        userId: profile.user_id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        lastSeen: profile.last_seen,
        bag: [],
        orders: [],
      });
    }
    for (const order of mappedOrders) {
      if (!order.userId || order.userId === context.userId) continue;
      const row = byUser.get(order.userId) ?? {
        userId: order.userId,
        name: order.customerName,
        email: order.accountEmail || order.customerEmail,
        phone: order.customerPhone,
        lastSeen: order.createdAt,
        bag: [],
        orders: [],
      };
      if (!row.name) row.name = order.customerName;
      if (!row.phone) row.phone = order.customerPhone;
      if (!row.email) row.email = order.accountEmail || order.customerEmail;
      row.orders.push(order);
      byUser.set(order.userId, row);
    }
    for (const line of bagRows) {
      const row = byUser.get(line.user_id);
      if (!row) continue;
      row.bag.push({
        id: Number(line.id),
        name: line.name,
        qty: Number(line.qty),
        price: Number(line.price),
      });
    }
    return {
      role: "owner" as const,
      products: products.map(asProduct),
      orders: mappedOrders,
      customers: [...byUser.values()],
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
          published = ${data.published},
          compare_at = ${data.compareAt > 0 ? data.compareAt : null},
          images = ${JSON.stringify(data.images)},
          description = ${data.description},
          show_description = ${data.showDescription}
        where id = ${data.id} and user_id = ${context.userId}
        returning id
      `;
      if (!rows.length) throw new Error("That piece is not in your shop.");
      return { id: Number(rows[0].id) };
    }
    const rows = await sql<{ id: number }>`
      insert into products (user_id, name, category, price, compare_at, stock, blurb, image, badge, published, images, description, show_description)
      values (
        ${context.userId},
        ${data.name},
        ${data.category},
        ${data.price},
        ${data.compareAt > 0 ? data.compareAt : null},
        ${data.stock},
        ${data.blurb},
        ${data.image},
        ${data.badge},
        ${data.published},
        ${JSON.stringify(data.images)},
        ${data.description},
        ${data.showDescription}
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
  .validator((raw: unknown) => {
    if (!raw || typeof raw !== "object") throw new Error("The bag is empty.");
    const body = raw as { lines?: unknown; customer?: unknown; referralCode?: unknown };
    const lines = orderSchema.parse({ lines: body.lines });
    const customer = customerSchema.safeParse(body.customer);
    if (!customer.success) {
      throw new Error(customer.error.issues[0]?.message ?? "Add the customer details.");
    }
    return { lines, customer: customer.data, referralCode: readReferralCode(body.referralCode) };
  })
  .handler(async ({ data }) => {
    const { lines, customer, referralCode } = data;
    const sql = await getSql();
    const picked: { id: number; name: string; price: number; qty: number; category: string }[] = [];
    for (const line of lines) {
      const rows = await sql<{ id: number; name: string; price: number; stock: number; category: string }>`
        select id, name, price, stock, category from products
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
        category: product.category,
      });
    }
    const priced = await quoteFor(picked, referralCode, customer.phone, customer.email);
    if (priced.codeStatus === "invalid") throw new Error("That code is not valid.");
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
      const { subtotal, discount, total, applied } = priced;
      const primary = applied[0];
      const referral = applied.find((item) => item.kind === "referral");
      const ruleUsed = applied.find((item) => item.kind !== "referral");
      const items = picked.map(({ id, name, price, qty }) => ({ id, name, price, qty }));
      const inserted = await sql<{ id: number }>`
        insert into orders (items, total, customer_name, customer_phone, customer_email, account_email, user_id,
          referral_code, referral_agent_id, discount_amount, discount_type, discount_label, discount_id, discounts_applied)
        values (
          ${JSON.stringify(items)},
          ${total},
          ${customer.name},
          ${customer.phone},
          ${customer.email},
          ${""},
          ${"guest"},
          ${referral ? referral.code : ""},
          ${referral ? referral.id : null},
          ${discount},
          ${applied.map((item) => item.kind).join("+")},
          ${applied.map((item) => item.label).join(" + ")},
          ${ruleUsed ? ruleUsed.id : null},
          ${JSON.stringify(applied.map(({ kind, id, code, amount }) => ({ kind, id, code, amount })))}
        )
        returning id
      `;
      return {
        id: Number(inserted[0].id),
        total,
        subtotal,
        discount,
        discounts: applied.map(({ label, amount }) => ({ label, amount })),
        referralCode: primary?.code ?? "",
        lines: items,
      };
    } catch (error) {
      for (const line of held) {
        await sql`update products set stock = stock + ${line.qty} where id = ${line.id}`;
      }
      throw error;
    }
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const orders = await sql<{
      id: number;
      items: string;
      total: number;
      created_at: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string;
    }>`
      select id, items, total, created_at::text as created_at,
        customer_name, customer_phone, customer_email
      from orders
      where user_id = ${context.userId}
      order by id desc
      limit 30
    `;
    return orders.map((order) => ({
      id: Number(order.id),
      items: asItems(order.items),
      total: Number(order.total),
      createdAt: order.created_at,
      customerName: order.customer_name ?? "",
      customerPhone: order.customer_phone ?? "",
      customerEmail: order.customer_email ?? "",
    }));
  });

const bagLinesSchema = z
  .array(
    z.object({
      id: z.number().int().positive(),
      qty: z.number().int().min(1).max(12),
    }),
  )
  .max(40);

function cleanBag(raw: unknown) {
  const parsed = bagLinesSchema.safeParse(raw);
  if (!parsed.success) throw new Error("That bag could not be saved.");
  const map = new Map<number, number>();
  for (const line of parsed.data) map.set(line.id, line.qty);
  return [...map.entries()].map(([id, qty]) => ({ id, qty }));
}

export const touchCustomer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const body = raw && typeof raw === "object" ? (raw as { name?: unknown; email?: unknown }) : {};
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 120) : "";
    return { name, email };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into customer_profiles (user_id, name, email, last_seen)
      values (${context.userId}, ${data.name}, ${data.email}, now())
      on conflict (user_id) do update set
        name = case when excluded.name <> '' then excluded.name else customer_profiles.name end,
        email = case when excluded.email <> '' then excluded.email else customer_profiles.email end,
        last_seen = now()
    `;
    return { ok: true };
  });

export const getMyBag = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ id: number; name: string; price: number; qty: number; stock: number }>`
      select p.id, p.name, p.price, b.qty, p.stock
      from bags b
      join products p on p.id = b.product_id
      where b.user_id = ${context.userId}
      order by p.name
    `;
    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      price: Number(row.price),
      qty: Number(row.qty),
      stock: Number(row.stock),
    }));
  });

export const saveBag = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const body = raw && typeof raw === "object" ? (raw as { lines?: unknown }) : {};
    return { lines: cleanBag(body.lines) };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from bags where user_id = ${context.userId}`;
    for (const line of data.lines) {
      const found = await sql<{ id: number }>`
        select id from products where id = ${line.id} and published = true
      `;
      if (!found.length) continue;
      await sql`
        insert into bags (user_id, product_id, qty)
        values (${context.userId}, ${line.id}, ${line.qty})
        on conflict (user_id, product_id) do update set qty = excluded.qty
      `;
    }
    return { ok: true };
  });


export const getShopSettings = createServerFn({ method: "GET" }).handler(async (): Promise<ShopSettings> => {
  const sql = await getSql();
  const rows = await sql<{ nav_categories: string | null; hero_slides: string | null }>`
    select nav_categories, hero_slides from shop where id = 1
  `;
  return {
    navCategories: parseJsonList(rows[0]?.nav_categories),
    heroSlides: parseJsonList(rows[0]?.hero_slides).slice(0, 4),
  };
});

export const saveShopSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown): ShopSettings => {
    const parsed = shopSettingsSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the settings.");
    return parsed.data;
  })
  .handler(async ({ context, data }) => {
    const role = await ensureOwner(context.userId);
    if (role !== "owner") throw new Error("Only the shop owner can change settings.");
    const sql = await getSql();
    await sql`
      update shop set
        nav_categories = ${JSON.stringify(data.navCategories)},
        hero_slides = ${JSON.stringify(data.heroSlides)}
      where id = 1
    `;
    return { ok: true as const };
  });

async function findActiveAgent(code: string) {
  const sql = await getSql();
  const rows = await sql<{ id: number; code: string; discount_pct: number | null }>`
    select id, code, discount_pct from referral_agents
    where code is not null and upper(code) = upper(${code}) and active = true and discount_pct is not null
  `;
  const row = rows[0];
  return row ? { id: Number(row.id), code: row.code, discountPct: Number(row.discount_pct) } : null;
}

async function requireOwner(userId: string) {
  if ((await ensureOwner(userId)) !== "owner") throw new Error("Only the shop owner can manage referral agents.");
}

export const listReferralAgents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ReferralAgent[]> => {
    await requireOwner(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      name: string;
      code: string | null;
      discount_pct: number | null;
      active: boolean;
      times_used: number;
      total_value: number;
    }>`
      select a.id, a.name, a.code, a.discount_pct, a.active,
        count(o.id)::int as times_used, coalesce(sum(o.total), 0)::int as total_value
      from referral_agents a
      left join orders o on o.referral_agent_id = a.id
      group by a.id
      order by a.created_at desc
    `;
    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      code: row.code ?? "",
      discountPct: row.discount_pct === null ? null : Number(row.discount_pct),
      active: Boolean(row.active),
      timesUsed: Number(row.times_used),
      totalValue: Number(row.total_value),
    }));
  });

const pctSchema = z.number().int().min(0, "Discount 0–90%.").max(90, "Discount 0–90%.").nullable();

function isUniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && (err as { code?: string }).code === "23505");
}

const CODE_TAKEN = "That code is already in use (agent, coupon or guest code).";

export const createReferralAgent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      name: z.string().trim().min(1, "Add the agent name.").max(80).parse(body.name),
      code: parseAgentCode(body.code),
      discountPct: pctSchema.parse(body.discountPct ?? null),
    };
  })
  .handler(async ({ context, data }) => {
    await requireOwner(context.userId);
    await assertCodeFree(data.code, {});
    const sql = await getSql();
    try {
      const rows = await sql<{ id: number }>`
        insert into referral_agents (name, code, discount_pct)
        values (${data.name}, ${data.code || null}, ${data.discountPct})
        returning id
      `;
      return { id: Number(rows[0].id), code: data.code };
    } catch (err) {
      if (isUniqueViolation(err)) throw new Error(CODE_TAKEN);
      throw err;
    }
  });

export const updateReferralAgent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        code: z.unknown().transform((value) => parseAgentCode(value)),
        discountPct: pctSchema,
        active: z.boolean(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    await requireOwner(context.userId);
    await assertCodeFree(data.code, { agentId: data.id });
    const sql = await getSql();
    try {
      await sql`
        update referral_agents
        set code = ${data.code || null}, discount_pct = ${data.discountPct}, active = ${data.active}
        where id = ${data.id}
      `;
    } catch (err) {
      if (isUniqueViolation(err)) throw new Error(CODE_TAKEN);
      throw err;
    }
    return { ok: true as const };
  });

export const deleteReferralAgent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => z.number().int().positive().parse(raw))
  .handler(async ({ context, data: id }) => {
    await requireOwner(context.userId);
    const sql = await getSql();
    await sql`delete from referral_agents where id = ${id}`;
    return { ok: true as const };
  });

// ── Discounts ────────────────────────────────────────────────────────────────

type DiscountRow = {
  id: number;
  type: string;
  name: string;
  code: string | null;
  phone: string;
  pct: number | null;
  amount: number | null;
  cap: number | null;
  min_subtotal: number | null;
  min_items: number | null;
  starts_at: string | null;
  ends_at: string | null;
  categories: string;
  max_uses: number | null;
  active: boolean;
  uses: number;
  sales: number;
};

const n = (value: unknown) => (value === null || value === undefined ? null : Number(value));

async function loadDiscounts(): Promise<(DiscountRule & { sales: number })[]> {
  const sql = await getSql();
  const rows = await sql<DiscountRow>`
    select d.id, d.type, d.name, d.code, d.phone, d.pct, d.amount, d.cap, d.min_subtotal, d.min_items,
      to_char(d.starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as starts_at,
      to_char(d.ends_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as ends_at,
      d.categories, d.max_uses, d.active,
      count(o.id)::int as uses, coalesce(sum(o.total), 0)::int as sales
    from discounts d
    left join orders o on o.discounts_applied::jsonb @> jsonb_build_array(jsonb_build_object('kind', d.type, 'id', d.id))
    group by d.id
    order by d.created_at desc, d.id desc
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    type: row.type as DiscountType,
    name: row.name,
    code: row.code,
    phone: row.phone ?? "",
    pct: n(row.pct),
    amount: n(row.amount),
    cap: n(row.cap),
    minSubtotal: n(row.min_subtotal),
    minItems: n(row.min_items),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    categories: parseJsonList(row.categories),
    maxUses: n(row.max_uses),
    active: Boolean(row.active),
    uses: Number(row.uses),
    sales: Number(row.sales),
  }));
}

async function isFirstOrder(phone: string, email: string): Promise<boolean | null> {
  const p = phone ? normalizeWhatsApp(phone) : "";
  const e = email.trim().toLowerCase();
  const validPhone = /^\+[1-9]\d{7,14}$/.test(p);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  if (!validPhone && !validEmail) return null;
  const sql = await getSql();
  const rows = await sql<{ c: number }>`
    select count(*)::int as c from orders
    where (${validPhone} and customer_phone = ${p}) or (${validEmail} and lower(customer_email) = ${e})
  `;
  return Number(rows[0]?.c ?? 0) === 0;
}

async function stackSetting(): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ stack_referral: boolean }>`select stack_referral from shop where id = 1`;
  return Boolean(rows[0]?.stack_referral);
}

/** Server-side price of a bag: the single source of truth for the bag display and the order. */
async function quoteFor(
  lines: { price: number; qty: number; category: string }[],
  code: string,
  phone: string,
  email: string,
): Promise<Quote> {
  const [rules, agent, firstOrder, stackReferral] = await Promise.all([
    loadDiscounts(),
    code ? findActiveAgent(code) : Promise.resolve(null),
    isFirstOrder(phone, email),
    stackSetting(),
  ]);
  return computeQuote({
    lines,
    rules,
    code,
    agent,
    isFirstOrder: firstOrder,
    stackReferral,
    now: new Date(),
  });
}

/** Public: price the bag (live in the cart). Returns only labels and rupee amounts. */
export const quoteBag = createServerFn({ method: "POST" })
  .validator((raw: unknown) => {
    const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      lines: orderSchema.parse({ lines: body.lines }),
      code: readReferralCode(body.code),
      phone: typeof body.phone === "string" ? body.phone.slice(0, 40) : "",
      email: typeof body.email === "string" ? body.email.slice(0, 120) : "",
    };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const priced: { price: number; qty: number; category: string }[] = [];
    for (const line of data.lines) {
      const rows = await sql<{ price: number; category: string }>`
        select price, category from products where id = ${line.id} and published = true
      `;
      if (rows[0]) priced.push({ price: Number(rows[0].price), qty: line.qty, category: rows[0].category });
    }
    const result = await quoteFor(priced, data.code, data.phone, data.email);
    return {
      subtotal: result.subtotal,
      discount: result.discount,
      total: result.total,
      discounts: result.applied.map(({ label, amount }) => ({ label, amount })),
      codeStatus: result.codeStatus,
    };
  });

export type StudioDiscount = Awaited<ReturnType<typeof loadDiscounts>>[number];

export const listDiscounts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireOwner(context.userId);
    return { discounts: await loadDiscounts(), stackReferral: await stackSetting() };
  });

const optInt = (min: number, max: number, label: string) =>
  z
    .union([z.number(), z.null(), z.undefined()])
    .transform((value) => (value === undefined ? null : value))
    .refine((value) => value === null || (Number.isInteger(value) && value >= min && value <= max), `${label}: ${min}–${max}.`);

const optDate = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), "Check the date and time.");

const discountWriteSchema = z.object({
  id: z.number().int().positive().optional(),
  type: z.enum(DISCOUNT_TYPES.map((item) => item.id) as [DiscountType, ...DiscountType[]]),
  name: z.string().trim().max(80, "Keep the name under 80 characters.").default(""),
  code: z.unknown().transform((value) => parseAgentCode(value)),
  phone: z.string().trim().max(40).default(""),
  pct: optInt(0, 90, "Discount %"),
  amount: optInt(0, 5_000_000, "₹ amount"),
  cap: optInt(0, 5_000_000, "₹ cap"),
  minSubtotal: optInt(0, 5_000_000, "Minimum ₹"),
  minItems: optInt(1, 1000, "Minimum items"),
  startsAt: optDate,
  endsAt: optDate,
  categories: z.array(z.string()).max(40).default([]).transform((ids) =>
    ids.filter((id) => ALL_CATEGORIES.some((item) => item.id === id)),
  ),
  maxUses: optInt(0, 1_000_000, "Max uses"),
  active: z.boolean().default(false),
});

/** Codes are unique across agents and every code-carrying discount (case-insensitive). */
async function assertCodeFree(code: string, except: { agentId?: number; discountId?: number }) {
  if (!code) return;
  const sql = await getSql();
  const rows = await sql<{ c: number }>`
    select (
      (select count(*) from referral_agents where code is not null and upper(code) = upper(${code}) and id <> ${except.agentId ?? 0})
      + (select count(*) from discounts where code is not null and upper(code) = upper(${code}) and id <> ${except.discountId ?? 0})
    )::int as c
  `;
  if (Number(rows[0]?.c ?? 0) > 0) throw new Error(CODE_TAKEN);
}

export const saveDiscount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const parsed = discountWriteSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the discount.");
    const data = parsed.data;
    if (data.startsAt && data.endsAt && Date.parse(data.endsAt) <= Date.parse(data.startsAt)) {
      throw new Error("The end must be after the start.");
    }
    if (data.type === "guest" && data.phone) {
      const phone = normalizeWhatsApp(data.phone);
      if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("Add the WhatsApp number with country code, or leave it blank.");
      data.phone = phone;
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    await requireOwner(context.userId);
    await assertCodeFree(data.code, { discountId: data.id });
    const sql = await getSql();
    const code = data.code || null;
    const categories = JSON.stringify(data.categories);
    try {
      if (data.id) {
        await sql`
          update discounts set type = ${data.type}, name = ${data.name}, code = ${code}, phone = ${data.phone},
            pct = ${data.pct}, amount = ${data.amount}, cap = ${data.cap}, min_subtotal = ${data.minSubtotal},
            min_items = ${data.minItems}, starts_at = ${data.startsAt}, ends_at = ${data.endsAt},
            categories = ${categories}, max_uses = ${data.maxUses}, active = ${data.active}
          where id = ${data.id}
        `;
        return { id: data.id };
      }
      const rows = await sql<{ id: number }>`
        insert into discounts (type, name, code, phone, pct, amount, cap, min_subtotal, min_items, starts_at, ends_at, categories, max_uses, active)
        values (${data.type}, ${data.name}, ${code}, ${data.phone}, ${data.pct}, ${data.amount}, ${data.cap},
          ${data.minSubtotal}, ${data.minItems}, ${data.startsAt}, ${data.endsAt}, ${categories}, ${data.maxUses}, ${data.active})
        returning id
      `;
      return { id: Number(rows[0].id) };
    } catch (err) {
      if (isUniqueViolation(err)) throw new Error(CODE_TAKEN);
      throw err;
    }
  });

export const deleteDiscount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => z.number().int().positive().parse(raw))
  .handler(async ({ context, data: id }) => {
    await requireOwner(context.userId);
    const sql = await getSql();
    await sql`delete from discounts where id = ${id}`;
    return { ok: true as const };
  });

export const saveStackSetting = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => z.boolean().parse(raw))
  .handler(async ({ context, data }) => {
    await requireOwner(context.userId);
    const sql = await getSql();
    await sql`update shop set stack_referral = ${data} where id = 1`;
    return { ok: true as const };
  });
