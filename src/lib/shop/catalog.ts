import { z } from "zod";

export type Category = { id: string; label: string; hindi: string; note: string };
/** No seeded categories: the owner creates a category by typing it when adding a piece. */
export const CATEGORIES: readonly Category[] = [];

export type CategoryId = string;
export type ShopCat = string;

export function slugifyCategory(value: string): string {
  return value.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function prettyCategory(id: string): string {
  return id.split("-").filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** Distinct categories in use, in first-seen order. */
export function categoriesFrom(items: { category: string }[]): Category[] {
  const seen = new Set<string>();
  const out: Category[] = [];
  for (const item of items) {
    if (!item.category || seen.has(item.category)) continue;
    seen.add(item.category);
    out.push(categoryOf(item.category));
  }
  return out;
}

export const PHOTOS = [
  { src: "/products/earbuds.jpg", label: "Earbuds" },
  { src: "/products/charger.jpg", label: "Charger" },
  { src: "/products/watch.jpg", label: "Watch" },
  { src: "/products/belt.jpg", label: "Belt" },
  { src: "/products/sunglasses.jpg", label: "Sunglasses" },
  { src: "/products/roller.jpg", label: "Face roller" },
  { src: "/products/holder.jpg", label: "Phone holder" },
  { src: "/products/kitchen.jpg", label: "Kitchen tools" },
  { src: "/products/led.jpg", label: "LED strip" },
  { src: "/products/baby.jpg", label: "Baby bottle" },
  { src: "/products/necklace.jpg", label: "Necklace" },
  { src: "/products/mouse.jpg", label: "Gaming mouse" },
  { src: "/products/bands.jpg", label: "Bands" },
  { src: "/products/trimmer.jpg", label: "Trimmer" },
  { src: "/products/pet.jpg", label: "Pet bowl" },
  { src: "/products/pillow.jpg", label: "Neck pillow" },
  { src: "/products/notebook.jpg", label: "Notebook" },
  { src: "/products/fabric.jpg", label: "Fabric" },
  { src: "/products/sew.jpg", label: "Sewing machine" },
  { src: "/products/stand.jpg", label: "Laptop stand" },
  { src: "/products/lamp.jpg", label: "Night lamp" },
  { src: "/products/case.jpg", label: "Phone case" },
  { src: "/products/bamboo.jpg", label: "Bamboo set" },
  { src: "/products/tiffin.jpg", label: "Tiffin" },
] as const;

export const HERO = "/products/hero.jpg";

const PHOTO_SRC: readonly string[] = PHOTOS.map((photo) => photo.src);

export const BADGES = [
  { id: "", label: "None" },
  { id: "new", label: "New" },
  { id: "best", label: "Bestseller" },
  { id: "fast", label: "Fast selling" },
  { id: "limited", label: "Limited stock" },
] as const;
export type Badge = "" | "new" | "best" | "fast" | "limited";
export const ORDER_STATUSES = ["placed", "confirmed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Sale price applies when set, below the regular price, and inside its dates. */
export function saleIsLive(row: { price: number; sale_price?: number | null; sale_starts_at?: string | null; sale_ends_at?: string | null }, now = Date.now()) {
  const sale = Number(row.sale_price ?? 0);
  if (!(sale > 0 && sale < Number(row.price))) return false;
  if (row.sale_starts_at && Date.parse(row.sale_starts_at) > now) return false;
  if (row.sale_ends_at && Date.parse(row.sale_ends_at) < now) return false;
  return true;
}

export function parseVariants(text: string | undefined) {
  return (text ?? "")
    .split("\n")
    .map((line) => {
      const [label, rest] = line.split(":");
      const options = (rest ?? "").split(",").map((o) => o.trim()).filter(Boolean);
      return { label: (label ?? "").trim(), options };
    })
    .filter((group) => group.label && group.options.length);
}

export type Product = {
  id: number;
  name: string;
  category: CategoryId;
  price: number;
  stock: number;
  blurb: string;
  image: string;
  badge: Badge;
  published: boolean;
  compareAt: number;
  /** Real pieces on hand are `stock`; customers see `shownStock` (owner's public count, never above real). */
  shownStock: number;
  /** Owner's raw public-count setting (null = show real). Studio only. */
  publicStock: number | null;
  /** Owner-set % shown on the card badge (0 = automatic from regular price). */
  cardOffPct: number;
  /** Owner's regular price (price may be a live sale price). Studio only edits this. */
  basePrice?: number;
  salePrice?: number;
  saleStartsAt?: string;
  saleEndsAt?: string;
  saleActive?: boolean;
  /** One option group per line, e.g. "Size: S, M, L". */
  variants?: string;
  /** Extra photos after `image` (max 3). Only loaded on product page and studio. */
  images?: string[];
  description?: string;
  showDescription?: boolean;
  archived?: boolean;
};

export type OrderItem = {
  id: number;
  name: string;
  qty: number;
  price: number;
};

export type ShopOrder = {
  id: number;
  items: OrderItem[];
  total: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  accountEmail: string;
  userId: string;
  referralCode?: string;
  discountAmount?: number;
  discountLabel?: string;
  status?: OrderStatus;
};

export type ReferralAgent = {
  id: number;
  name: string;
  code: string;
  discountPct: number | null;
  active: boolean;
  timesUsed: number;
  totalValue: number;
};

/** Max length of an agent code (letters, digits, hyphens). */
export const REFERRAL_CODE_MAX = 20;

/** Normalise a typed code: trim, uppercase, drop spaces/other characters. */
export function readReferralCode(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, REFERRAL_CODE_MAX)
    : "";
}

/** Owner-entered code: "" (blank) or 1–20 of A–Z, 0–9, "-". Throws a readable error. */
export function parseAgentCode(value: unknown): string {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!raw) return "";
  if (raw.length > REFERRAL_CODE_MAX) throw new Error(`Code must be at most ${REFERRAL_CODE_MAX} characters.`);
  if (!/^[A-Z0-9-]+$/.test(raw)) throw new Error("Code can use only letters, digits and hyphens.");
  return raw;
}

/** Discount in rupees for a subtotal at pct%, rounded down. */
export function discountFor(subtotal: number, pct: number): number {
  return Math.floor((subtotal * Math.max(0, Math.min(90, pct))) / 100);
}

export type SitePage = {
  slug: string;
  title: string;
  note: string;
};

export type ShopCustomer = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  lastSeen: string;
  bag: { id: number; name: string; qty: number; price: number }[];
  orders: ShopOrder[];
};

/**
 * Normalise a WhatsApp number to E.164 (+<country><number>). A bare 10-digit
 * number (optionally with a leading 0) is treated as Indian (+91).
 */
export function normalizeWhatsApp(raw: string): string {
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

/** wa.me link for a stored number, or "" if it has no digits. */
export function whatsAppLink(phone: string): string {
  const digits = normalizeWhatsApp(phone).replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : "";
}

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Add the customer name.").max(80, "Keep the name shorter."),
  phone: z
    .string()
    .trim()
    .min(1, "Add a WhatsApp number.")
    .transform((value) => normalizeWhatsApp(value))
    .refine((value) => /^\+[1-9]\d{7,14}$/.test(value), "Add a WhatsApp number with country code, e.g. +91 98765 43210."),
  email: z.string().trim().email("Add an email.").max(120, "That email is too long."),
});

export type CustomerDetails = z.infer<typeof customerSchema>;

export function isPhotoValue(value: string) {
  return (
    PHOTO_SRC.includes(value) ||
    /^\/products\/[\w.-]+$/.test(value) ||
    value.startsWith("data:image/jpeg") ||
    value.startsWith("data:image/png") ||
    value.startsWith("data:image/webp") ||
    /^https:\/\/[^\s"'<>]+$/.test(value)
  );
}

const photoSchema = z
  .string()
  .min(1)
  .max(1_500_000, "That photo is too large. Try another.")
  .refine(isPhotoValue, "Add a photo (upload, or an https:// link).");

/** Per product photo cap on the stored data: URL (≈ 450 KB of image). The studio compresses to ~200 KB. */
export const PRODUCT_PHOTO_MAX_CHARS = 600_000;
const PHOTO_TOO_LARGE = "That photo is too large (over about 450 KB). Upload it again so the studio can shrink it.";

const productPhotoSchema = z
  .string()
  .min(1)
  .max(PRODUCT_PHOTO_MAX_CHARS, PHOTO_TOO_LARGE)
  .refine(isPhotoValue, "Add a photo (upload, or an https:// link).");

export const shopSettingsSchema = z.object({
  navCategories: z.array(z.string()).max(40),
  heroSlides: z.array(photoSchema).max(5, "Up to 5 slider photos."),
});

export type ShopSettings = z.infer<typeof shopSettingsSchema> & { homeSections: HomeSection[] };

/** One category section lower on the homepage. Empty text means "use the default". */
export type HomeSection = { id: CategoryId; show: boolean; title: string; note: string; dealText: string };

export const DEFAULT_DEAL_TEXT = "UPTO {off}% OFF";

export const homeSectionsSchema = z
  .array(
    z.object({
      id: z.string(),
      show: z.boolean(),
      title: z.string().trim().max(80, "Keep section titles under 80 characters."),
      note: z.string().trim().max(160, "Keep section subtitles under 160 characters."),
      dealText: z.string().trim().max(60, "Keep the deal line under 60 characters."),
    }),
  )
  .max(40)
  .transform((rows) => resolveHomeSections(rows));

/** Saved order first (known categories only, no duplicates), then any category not saved yet with defaults. */
export function resolveHomeSections(saved: unknown, ids: string[] = []): HomeSection[] {
  const raw = typeof saved === "string" ? safeParse(saved) : saved;
  const list = Array.isArray(raw) ? raw : [];
  const out: HomeSection[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "");
    if (!id || seen.has(id) || (ids.length > 0 && !ids.includes(id))) continue;
    seen.add(id);
    const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    out.push({
      id: id as CategoryId,
      show: row.show !== false,
      title: text(row.title, 80),
      note: text(row.note, 160),
      dealText: text(row.dealText, 60),
    });
  }
  for (const id of ids) if (!seen.has(id)) out.push({ id, show: true, title: "", note: "", dealText: "" });
  return out;
}

/** "UPTO {off}% OFF" with the real figure; "" when there is no discount. */
export function dealLine(template: string, off: number): string {
  if (off <= 0) return "";
  return (template.trim() || DEFAULT_DEAL_TEXT).replace(/\{off\}/g, String(off));
}

/**
 * Categories the owner left out of the top menu are hidden everywhere on the homepage.
 * An empty menu (never set up: Home only) hides nothing, so the default homepage is unchanged.
 */
export function categoryOnHome(_id: string, _navCategories: string[]): boolean {
  return true;
}

export function parseJsonList(value: unknown): string[] {
  const raw = typeof value === "string" ? safeParse(value) : value;
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}

export const productWriteSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Name the piece.").max(80, "Keep the name shorter."),
  category: z.string().trim().min(1, "Type a category.").max(40, "Keep the category under 40 characters.").transform((v) => slugifyCategory(v)).refine((v) => v.length > 0, "Type a category."),
  price: z.number().int().min(1, "Add a price in rupees.").max(5_000_000),
  stock: z.number().int().min(0, "Stock cannot be negative.").max(100_000),
  publicStock: z.number().int().min(1, "Public count must be at least 1 (leave blank to show the real count).").max(100_000).nullable().default(null),
  cardOffPct: z.number().int().min(0, "Discount % cannot be negative.").max(95, "Discount % can be at most 95.").default(0),
  blurb: z.string().trim().max(400, "Keep the note under 400 characters."),
  image: z
    .string()
    .min(1, "Add Photo 1 (the main photo).")
    .max(PRODUCT_PHOTO_MAX_CHARS, `Photo 1: ${PHOTO_TOO_LARGE}`)
    .refine(
      (value) =>
        PHOTO_SRC.includes(value) ||
        value.startsWith("data:image/jpeg") ||
        value.startsWith("data:image/png") ||
        value.startsWith("data:image/webp"),
      "Add Photo 1 (the main photo).",
    ),
  badge: z.enum(["", "new", "best", "fast", "limited"]),
  salePrice: z.number().int().min(0).max(5_000_000).default(0),
  saleStartsAt: z.string().max(40).default(""),
  saleEndsAt: z.string().max(40).default(""),
  variants: z.string().max(400, "Keep variants under 400 characters.").default(""),
  published: z.boolean(),
  compareAt: z.number().int().min(0).max(5_000_000),
  images: z.array(productPhotoSchema).max(3, "Up to 3 extra photos (Photos 2-4).").default([]),
  description: z.string().trim().max(4000, "Keep the description under 4000 characters.").default(""),
  showDescription: z.boolean().default(true),
});

export type ProductWrite = z.infer<typeof productWriteSchema>;

export function readQuery(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 60);
}

/** % on the card badge: owner's number wins, otherwise worked out from the regular price. */
export function cardOff(product: { price: number; compareAt: number; cardOffPct?: number }) {
  return product.cardOffPct && product.cardOffPct > 0 ? product.cardOffPct : offPercent(product.price, product.compareAt);
}

export function offPercent(price: number, compareAt: number) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

export function readCat(value: unknown): ShopCat {
  if (typeof value === "string" && /^[a-z0-9-]{1,40}$/.test(value)) return value;
  return "all";
}

export function categoryOf(id: string) {
  return { id, label: prettyCategory(id) || id, hindi: "", note: "" };
}

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function inr(value: number) {
  return money.format(value);
}

export function asProduct(
  row: Product & {
    compare_at?: number | null;
    public_stock?: number | null;
    card_off_pct?: number | null;
    show_description?: boolean | null;
    sale_price?: number | null;
    sale_starts_at?: string | null;
    sale_ends_at?: string | null;
  },
): Product {
  const badge: Badge = (["new", "best", "fast", "limited"] as const).includes(row.badge as never) ? (row.badge as Badge) : "";
  const base = Number(row.price);
  const live = saleIsLive({ price: base, sale_price: row.sale_price, sale_starts_at: row.sale_starts_at, sale_ends_at: row.sale_ends_at });
  const mrp = Math.max(0, Number(row.compareAt || row.compare_at || 0));
  const category = String(row.category || "general");
  return {
    id: Number(row.id),
    name: row.name,
    category,
    price: live ? Number(row.sale_price) : base,
    basePrice: base,
    salePrice: Number(row.sale_price ?? 0),
    saleStartsAt: row.sale_starts_at ?? "",
    saleEndsAt: row.sale_ends_at ?? "",
    saleActive: live,
    variants: row.variants ?? "",
    stock: Number(row.stock),
    publicStock: row.public_stock == null ? null : Number(row.public_stock),
    shownStock:
      Number(row.stock) <= 0 ? 0 : row.public_stock == null ? Number(row.stock) : Math.max(1, Math.min(Number(row.public_stock), Number(row.stock))),
    cardOffPct: Math.max(0, Math.min(95, Number(row.card_off_pct ?? 0))),
    blurb: row.blurb ?? "",
    image: row.image,
    badge,
    published: Boolean(row.published),
    compareAt: live ? Math.max(mrp, base) : mrp,
    ...("images" in row ? { images: parseJsonList(row.images).slice(0, 3) } : {}),
    ...("description" in row ? { description: row.description ?? "" } : {}),
    ...("show_description" in row ? { showDescription: row.show_description !== false } : {}),
    ...("archived" in row ? { archived: Boolean((row as { archived?: boolean }).archived) } : {}),
  };
}

export function asItems(value: unknown): OrderItem[] {
  const raw = typeof value === "string" ? safeParse(value) : value;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    if (
      typeof row.id !== "number" ||
      typeof row.name !== "string" ||
      typeof row.qty !== "number" ||
      typeof row.price !== "number"
    ) {
      return [];
    }
    return [{ id: row.id, name: row.name, qty: row.qty, price: row.price }];
  });
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
