/**
 * Discount engine — pure, shared by the server quote (bag/checkout display) and
 * placeOrder, so the bag and the stored order always use the same numbers.
 * All amounts are whole rupees.
 */

export const DISCOUNT_TYPES = [
  { id: "first_order", label: "First-order bonus" },
  { id: "festival", label: "Festival sale" },
  { id: "spend", label: "Spend-more discount" },
  { id: "bulk", label: "Bulk buy" },
  { id: "flat", label: "Flat ₹ off coupon" },
  { id: "guest", label: "Loyal guest code" },
] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number]["id"];

export type DiscountRule = {
  id: number;
  type: DiscountType;
  name: string;
  code: string | null;
  phone?: string;
  pct: number | null;
  amount: number | null;
  cap: number | null;
  minSubtotal: number | null;
  minItems: number | null;
  startsAt: string | null; // ISO
  endsAt: string | null; // ISO
  categories: string[];
  maxUses: number | null;
  active: boolean;
  uses: number;
};

export type QuoteLine = { price: number; qty: number; category: string };

export type Agent = { id: number; code: string; name?: string; discountPct: number };

export type AppliedDiscount = {
  kind: "referral" | DiscountType;
  id: number;
  label: string;
  code: string;
  amount: number;
};

export type QuoteInput = {
  lines: QuoteLine[];
  rules: DiscountRule[];
  /** Normalised code the customer typed ("" if none). */
  code: string;
  /** Active agent matching `code`, if any. */
  agent: Agent | null;
  /** true / false when known, null when the customer has not entered contact details yet. */
  isFirstOrder: boolean | null;
  stackReferral: boolean;
  now: Date;
};

export type Quote = {
  subtotal: number;
  items: number;
  applied: AppliedDiscount[];
  discount: number;
  total: number;
  /** "none": no code typed; "applied": the typed code is in `applied`; "valid": recognised but another discount is better; "invalid": not recognised / not eligible. */
  codeStatus: "none" | "applied" | "valid" | "invalid";
};

const pctOf = (base: number, pct: number) => Math.floor((base * Math.max(0, Math.min(90, pct))) / 100);

function withCap(value: number, cap: number | null) {
  return cap && cap > 0 ? Math.min(value, cap) : value;
}

function inWindow(rule: DiscountRule, now: Date) {
  if (rule.startsAt && now < new Date(rule.startsAt)) return false;
  if (rule.endsAt && now > new Date(rule.endsAt)) return false;
  return true;
}

/** Amount a rule gives for this cart, or 0 if it does not apply. Code-gated rules are checked by the caller. */
export function ruleAmount(rule: DiscountRule, input: Pick<QuoteInput, "lines" | "isFirstOrder" | "now">): number {
  if (!rule.active) return 0;
  const subtotal = input.lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const items = input.lines.reduce((sum, line) => sum + line.qty, 0);
  if (subtotal <= 0) return 0;
  switch (rule.type) {
    case "first_order":
      if (rule.pct === null || input.isFirstOrder !== true) return 0;
      return withCap(pctOf(subtotal, rule.pct), rule.cap);
    case "festival": {
      if (rule.pct === null || !rule.startsAt || !rule.endsAt || !inWindow(rule, input.now)) return 0;
      const base = rule.categories.length
        ? input.lines
            .filter((line) => rule.categories.includes(line.category))
            .reduce((sum, line) => sum + line.price * line.qty, 0)
        : subtotal;
      return withCap(pctOf(base, rule.pct), rule.cap);
    }
    case "spend":
      if (rule.minSubtotal === null || subtotal < rule.minSubtotal) return 0;
      if (rule.pct !== null) return withCap(pctOf(subtotal, rule.pct), rule.cap);
      return rule.amount ?? 0;
    case "bulk":
      if (rule.minItems === null || rule.pct === null || items < rule.minItems) return 0;
      return withCap(pctOf(subtotal, rule.pct), rule.cap);
    case "flat":
      if (!rule.code || !rule.amount) return 0;
      if (rule.minSubtotal !== null && subtotal < rule.minSubtotal) return 0;
      if (rule.maxUses !== null && rule.uses >= rule.maxUses) return 0;
      if (!inWindow(rule, input.now)) return 0;
      return rule.amount;
    case "guest":
      if (!rule.code || rule.pct === null) return 0;
      return withCap(pctOf(subtotal, rule.pct), rule.cap);
  }
}

export function quote(input: QuoteInput): Quote {
  const subtotal = input.lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const items = input.lines.reduce((sum, line) => sum + line.qty, 0);
  const code = input.code.toUpperCase();
  const clamp = (value: number) => Math.max(0, Math.min(subtotal, value));

  const automatic: AppliedDiscount[] = [];
  const coded: AppliedDiscount[] = [];
  let codeKnown = false;
  for (const rule of input.rules) {
    const ruleCode = (rule.code ?? "").toUpperCase();
    // Flat coupons and guest codes always need a code; festival only if the owner set one.
    const needsCode = rule.type === "flat" || rule.type === "guest" || (rule.type === "festival" && ruleCode !== "");
    if (needsCode && (!code || ruleCode !== code)) continue;
    if (needsCode && rule.active) codeKnown = true;
    const amount = clamp(ruleAmount(rule, input));
    if (amount <= 0) continue;
    const label = rule.type === "guest" ? `Guest code ${ruleCode}` : rule.name || typeLabel(rule.type);
    const entry = { kind: rule.type, id: rule.id, label, code: needsCode ? ruleCode : "", amount };
    (needsCode ? coded : automatic).push(entry);
  }
  let referral: AppliedDiscount | null = null;
  if (input.agent && code && input.agent.code.toUpperCase() === code) {
    codeKnown = true;
    const amount = clamp(pctOf(subtotal, input.agent.discountPct));
    if (amount > 0) referral = { kind: "referral", id: input.agent.id, label: `Code ${input.agent.code}`, code: input.agent.code, amount };
  }

  const best = (list: AppliedDiscount[]) =>
    list.reduce<AppliedDiscount | null>((top, item) => (!top || item.amount > top.amount ? item : top), null);

  const singles = [...automatic, ...coded, ...(referral ? [referral] : [])];
  let applied: AppliedDiscount[] = [];
  const single = best(singles);
  if (single) applied = [single];
  if (input.stackReferral && referral) {
    const auto = best(automatic);
    const stacked = auto ? [referral, auto] : [referral];
    const stackedTotal = clamp(stacked.reduce((sum, item) => sum + item.amount, 0));
    if (stackedTotal > (single?.amount ?? 0)) applied = stacked;
  }
  // Never discount below zero: trim the last entry if needed.
  let discount = applied.reduce((sum, item) => sum + item.amount, 0);
  if (discount > subtotal && applied.length) {
    const last = applied[applied.length - 1];
    applied = [...applied.slice(0, -1), { ...last, amount: last.amount - (discount - subtotal) }];
    discount = subtotal;
  }
  const codeStatus: Quote["codeStatus"] = !code
    ? "none"
    : applied.some((item) => item.code === code)
      ? "applied"
      : codeKnown
        ? "valid"
        : "invalid";
  return { subtotal, items, applied, discount, total: subtotal - discount, codeStatus };
}

export function typeLabel(type: DiscountType | "referral"): string {
  if (type === "referral") return "Referral code";
  return DISCOUNT_TYPES.find((item) => item.id === type)?.label ?? type;
}
