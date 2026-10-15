import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { a as asProduct, f as productWriteSchema, i as asItems, o as authMiddleware, u as getSql } from "./catalog-BKpCNYV2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-C9MqrAn_.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
async function ensureOwner(userId) {
	const sql = await getSql();
	const owner = (await sql`
    select owner_user_id from shop where id = 1
  `)[0]?.owner_user_id ?? null;
	if (owner === userId) return "owner";
	if (owner) return "locked";
	if (!(await sql`
    update shop set owner_user_id = ${userId}
    where id = 1 and owner_user_id is null
    returning owner_user_id
  `).length) return (await sql`
      select owner_user_id from shop where id = 1
    `)[0]?.owner_user_id === userId ? "owner" : "locked";
	await sql`update products set user_id = ${userId} where user_id = 'seed'`;
	return "owner";
}
var listProducts_createServerFn_handler = createServerRpc({
	id: "6d88a232489cf1c5b481fc03f408b661bc9c5edc05e620ba92241d2bb873d223",
	name: "listProducts",
	filename: "src/lib/shop/api.ts"
}, (opts) => listProducts.__executeServer(opts));
var listProducts = createServerFn({ method: "GET" }).handler(listProducts_createServerFn_handler, async () => {
	return (await (await getSql())`
    select id, name, category, price, stock, blurb, image, badge, published
    from products
    where published = true
    order by case badge when 'best' then 0 when 'new' then 1 else 2 end, id asc
  `).map(asProduct);
});
var getProduct_createServerFn_handler = createServerRpc({
	id: "056df3fd413c1fecba66bbe0d4c274db08a73f579fe21b47b5a6a7772839d6d2",
	name: "getProduct",
	filename: "src/lib/shop/api.ts"
}, (opts) => getProduct.__executeServer(opts));
var getProduct = createServerFn({ method: "GET" }).validator((id) => {
	const parsed = typeof id === "number" ? id : Number(id);
	if (!Number.isInteger(parsed) || parsed < 1) return 0;
	return parsed;
}).handler(getProduct_createServerFn_handler, async ({ data: id }) => {
	if (id < 1) return null;
	const rows = await (await getSql())`
      select id, name, category, price, stock, blurb, image, badge, published
      from products
      where id = ${id} and published = true
    `;
	return rows[0] ? asProduct(rows[0]) : null;
});
var getStudio_createServerFn_handler = createServerRpc({
	id: "c9ab01d55d31739bdb254f25073eddd4ff9724103289309c7a4ac0c09ddaaac9",
	name: "getStudio",
	filename: "src/lib/shop/api.ts"
}, (opts) => getStudio.__executeServer(opts));
var getStudio = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getStudio_createServerFn_handler, async ({ context }) => {
	if (await ensureOwner(context.userId) !== "owner") return {
		role: "locked",
		products: [],
		orders: []
	};
	const sql = await getSql();
	const products = await sql`
      select id, name, category, price, stock, blurb, image, badge, published
      from products
      where user_id = ${context.userId}
      order by id desc
    `;
	const orders = await sql`
      select id, items, total, created_at::text as created_at
      from orders
      order by id desc
      limit 12
    `;
	return {
		role: "owner",
		products: products.map(asProduct),
		orders: orders.map((order) => ({
			id: Number(order.id),
			items: asItems(order.items),
			total: Number(order.total),
			createdAt: order.created_at
		}))
	};
});
var saveProduct_createServerFn_handler = createServerRpc({
	id: "ee0debef06093bc6209fa51b6624053c8296e761dd0355ca2794f174509ae56f",
	name: "saveProduct",
	filename: "src/lib/shop/api.ts"
}, (opts) => saveProduct.__executeServer(opts));
var saveProduct = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((raw) => {
	const parsed = productWriteSchema.safeParse(raw);
	if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the product details.");
	return parsed.data;
}).handler(saveProduct_createServerFn_handler, async ({ context, data }) => {
	if (await ensureOwner(context.userId) !== "owner") throw new Error("Only the shop owner can change the shelf.");
	const sql = await getSql();
	if (data.id) {
		const rows = await sql`
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
	const rows = await sql`
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
var deleteProduct_createServerFn_handler = createServerRpc({
	id: "d91e7d5b82773b6ca0f382218973447efd0d1d06b82e7b2bfb91d3b0cbfb4508",
	name: "deleteProduct",
	filename: "src/lib/shop/api.ts"
}, (opts) => deleteProduct.__executeServer(opts));
var deleteProduct = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => {
	const parsed = typeof id === "number" ? id : Number(id);
	if (!Number.isInteger(parsed) || parsed < 1) throw new Error("Missing piece.");
	return parsed;
}).handler(deleteProduct_createServerFn_handler, async ({ context, data: id }) => {
	if (await ensureOwner(context.userId) !== "owner") throw new Error("Only the shop owner can change the shelf.");
	await (await getSql())`delete from products where id = ${id} and user_id = ${context.userId}`;
	return { ok: true };
});
var orderSchema = zLines();
function zLines() {
	return { parse(raw) {
		if (!raw || typeof raw !== "object" || !("lines" in raw)) throw new Error("The bag is empty.");
		const lines = raw.lines;
		if (!Array.isArray(lines) || lines.length < 1 || lines.length > 20) throw new Error("The bag looks off.");
		const merged = /* @__PURE__ */ new Map();
		for (const line of lines) {
			if (!line || typeof line !== "object") throw new Error("The bag looks off.");
			const row = line;
			const id = typeof row.id === "number" ? row.id : Number(row.id);
			const qty = typeof row.qty === "number" ? row.qty : Number(row.qty);
			if (!Number.isInteger(id) || id < 1 || !Number.isInteger(qty) || qty < 1 || qty > 12) throw new Error("Check the quantities.");
			merged.set(id, Math.min(12, (merged.get(id) ?? 0) + qty));
		}
		return [...merged.entries()].map(([id, qty]) => ({
			id,
			qty
		}));
	} };
}
var placeOrder_createServerFn_handler = createServerRpc({
	id: "4ff5a7391e6fe057722e0e074b76576ad8128eb5a554745725ec7d9eadaecf0a",
	name: "placeOrder",
	filename: "src/lib/shop/api.ts"
}, (opts) => placeOrder.__executeServer(opts));
var placeOrder = createServerFn({ method: "POST" }).validator((raw) => orderSchema.parse(raw)).handler(placeOrder_createServerFn_handler, async ({ data: lines }) => {
	const sql = await getSql();
	const picked = [];
	for (const line of lines) {
		const product = (await sql`
        select id, name, price, stock from products
        where id = ${line.id} and published = true
      `)[0];
		if (!product) throw new Error("Something in the bag is no longer for sale.");
		if (Number(product.stock) < line.qty) throw new Error(`${product.name} only has ${product.stock} left.`);
		picked.push({
			id: Number(product.id),
			name: product.name,
			price: Number(product.price),
			qty: line.qty
		});
	}
	const held = [];
	try {
		for (const line of picked) {
			if (!(await sql`
          update products set stock = stock - ${line.qty}
          where id = ${line.id} and stock >= ${line.qty}
          returning id
        `).length) throw new Error(`${line.name} just sold out.`);
			held.push(line);
		}
		const total = picked.reduce((sum, line) => sum + line.price * line.qty, 0);
		const inserted = await sql`
        insert into orders (items, total)
        values (${JSON.stringify(picked)}, ${total})
        returning id
      `;
		return {
			id: Number(inserted[0].id),
			total,
			lines: picked
		};
	} catch (error) {
		for (const line of held) await sql`update products set stock = stock + ${line.qty} where id = ${line.id}`;
		throw error;
	}
});
//#endregion
export { deleteProduct_createServerFn_handler, getProduct_createServerFn_handler, getStudio_createServerFn_handler, listProducts_createServerFn_handler, placeOrder_createServerFn_handler, saveProduct_createServerFn_handler };
