// Run: node scripts/tests/discounts.check.mjs  (engine + migrations on in-memory PGlite)
import { createJiti } from "jiti";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const jiti = createJiti(import.meta.url);
const { quote } = await jiti.import("../../src/lib/shop/discounts.ts");

const base = { id: 0, name: "", code: null, pct: null, amount: null, cap: null, minSubtotal: null, minItems: null,
  startsAt: null, endsAt: null, categories: [], maxUses: null, active: true, uses: 0 };
const R = (o) => ({ ...base, ...o });
const now = new Date("2026-11-01T06:30:00Z"); // 12:00 IST
const bag = [{ price: 1999, qty: 1, category: "gadgets" }, { price: 333, qty: 3, category: "kitchen" }]; // 2998, 4 items
const big = [{ price: 1500, qty: 2, category: "gadgets" }]; // 3000
const Q = (lines, rules, extra = {}) => quote({ lines, rules, code: "", agent: null, isFirstOrder: null, stackReferral: false, now, ...extra });
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

// "Bag display" = the quoteBag result; "server total" = placeOrder's quote. Both call quote() with the same
// server-loaded inputs, so we check each type's numbers and that total = subtotal - discount ≥ 0.
const check = (q, discount, label) => {
  assert.equal(q.discount, discount); assert.equal(q.total, q.subtotal - q.discount); assert.ok(q.total >= 0);
  if (label) assert.equal(q.applied[0].label, label);
};

t("spend: below threshold none; at 3000 applies 10% (floor)", () => {
  const rules = [R({ id: 1, type: "spend", name: "Spend more", minSubtotal: 3000, pct: 10 })];
  check(Q(bag, rules), 0); check(Q(big, rules), 300, "Spend more");
});
t("spend: ₹ off variant; inactive ignored; blank threshold ignored", () => {
  check(Q(big, [R({ id: 1, type: "spend", minSubtotal: 3000, amount: 250 })]), 250);
  check(Q(big, [R({ id: 1, type: "spend", minSubtotal: 3000, pct: 10, active: false })]), 0);
  check(Q(big, [R({ id: 1, type: "spend", pct: 10 })]), 0);
});
t("bulk: 4+ items 5%", () => check(Q(bag, [R({ id: 2, type: "bulk", minItems: 4, pct: 5 })]), 149));
t("first order: unknown/false none, true 15% capped 200", () => {
  const rules = [R({ id: 3, type: "first_order", pct: 15, cap: 200 })];
  check(Q(bag, rules), 0); check(Q(bag, rules, { isFirstOrder: false }), 0); check(Q(bag, rules, { isFirstOrder: true }), 200);
});
t("festival: IST window, category-limited, expired, coded", () => {
  const f = { id: 4, type: "festival", name: "Diwali", pct: 20, startsAt: "2026-10-31T18:30:00Z", endsAt: "2026-11-01T18:29:59Z" }; // 1 Nov IST
  check(Q(bag, [R(f)]), 599, "Diwali");
  check(Q(bag, [R({ ...f, categories: ["kitchen"] })]), 199);
  check(Q(bag, [R(f)], { now: new Date("2026-11-01T18:31:00Z") }), 0); // 00:01 IST on 2 Nov
  const coded = R({ ...f, code: "DIWALI" });
  check(Q(bag, [coded]), 0); check(Q(bag, [coded], { code: "DIWALI" }), 599);
});
t("flat: code, minimum, max uses, expiry, invalid code", () => {
  const f = R({ id: 5, type: "flat", name: "Welcome", code: "WELCOME-100", amount: 100, minSubtotal: 2500, maxUses: 2 });
  check(Q(bag, [f], { code: "WELCOME-100" }), 100);
  assert.equal(Q(bag, [f], { code: "WELCOME-100" }).codeStatus, "applied");
  assert.equal(Q([{ price: 100, qty: 1, category: "x" }], [f], { code: "WELCOME-100" }).codeStatus, "valid");
  check(Q(bag, [{ ...f, uses: 2 }], { code: "WELCOME-100" }), 0);
  check(Q(bag, [{ ...f, endsAt: "2026-10-01T00:00:00Z" }], { code: "WELCOME-100" }), 0);
  assert.equal(Q(bag, [f], { code: "NOPE" }).codeStatus, "invalid");
});
t("flat never goes negative", () => check(Q([{ price: 50, qty: 1, category: "x" }], [R({ id: 6, type: "flat", code: "BIG", amount: 500 })], { code: "BIG" }), 50));
t("guest: code + % applies; blank code or % never", () => {
  check(Q(bag, [R({ id: 7, type: "guest", name: "Ravi", code: "RAVI-VIP", pct: 12 })], { code: "ravi-vip".toUpperCase() }), 359, "Guest code RAVI-VIP");
  check(Q(bag, [R({ id: 7, type: "guest", code: "RAVI-VIP" })], { code: "RAVI-VIP" }), 0);
});
t("referral agent alone", () => check(Q(bag, [], { code: "VIK123", agent: { id: 1, code: "VIK123", discountPct: 10 } }), 299, "Code VIK123"));
t("single best wins (no stacking) and stacking setting", () => {
  const rules = [R({ id: 2, type: "bulk", minItems: 4, pct: 5 }), R({ id: 8, type: "spend", minSubtotal: 1000, pct: 8 })];
  const agent = { id: 1, code: "VIK123", discountPct: 10 };
  const single = Q(bag, rules, { code: "VIK123", agent });
  check(single, 299); assert.equal(single.applied.length, 1);
  const stacked = Q(bag, rules, { code: "VIK123", agent, stackReferral: true });
  check(stacked, 299 + 239); assert.deepEqual(stacked.applied.map((a) => a.kind), ["referral", "spend"]);
  // coded non-referral discounts never stack
  const g = R({ id: 9, type: "guest", code: "G1", pct: 30 });
  assert.equal(Q(bag, [...rules, g], { code: "G1", stackReferral: true }).applied.length, 1);
});

// DB: migrations apply, codes unique, usage join and first-order query work.
const db = new PGlite();
await db.exec("create table if not exists _m(x int)");
for (const f of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) await db.exec(readFileSync(`migrations/${f}`, "utf8"));
await db.exec(`insert into discounts(type,name,code,pct,active) values ('guest','Ravi','RAVI-VIP',12,true)`);
await assert.rejects(db.exec(`insert into discounts(type,code) values ('flat','ravi-vip')`)); n++; console.log("ok - discount codes unique case-insensitively");
await db.exec(`insert into orders(items,total,customer_name,customer_phone,customer_email,account_email,user_id,discount_amount,discount_type,discount_label,discount_id,discounts_applied)
  values ('[]',2639,'T','+919800000000','A@x.in','','guest',359,'guest','Guest code RAVI-VIP',1,'[{"kind":"guest","id":1,"code":"RAVI-VIP","amount":359}]')`);
const u = await db.query(`select count(o.id)::int as uses, coalesce(sum(o.total),0)::int as sales from discounts d
  left join orders o on o.discounts_applied::jsonb @> jsonb_build_array(jsonb_build_object('kind', d.type, 'id', d.id)) where d.id=1 group by d.id`);
assert.deepEqual(u.rows[0], { uses: 1, sales: 2639 }); n++; console.log("ok - usage count and sales");
const first = async (p, e) => (await db.query(`select count(*)::int as c from orders where ($1 and customer_phone=$2) or ($3 and lower(customer_email)=$4)`, [!!p, p, !!e, e])).rows[0].c === 0;
assert.equal(await first("+919800000000", ""), false); assert.equal(await first("", "a@x.in"), false); assert.equal(await first("+919811111111", "b@x.in"), true);
n++; console.log("ok - first-order detection by phone or email");
console.log(`\n${n} checks passed`);
