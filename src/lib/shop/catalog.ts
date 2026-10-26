import { z } from "zod";

export const CATEGORIES = [
  { id: "gadgets", label: "Gadgets", hindi: "", note: "Watches, chargers, cables, and small electronics." },
  { id: "kitchen-essentials", label: "Kitchen", hindi: "", note: "Cooking tools, gadgets, and storage." },
  { id: "mobile-accessories", label: "Mobile", hindi: "", note: "Cases, stands, grips, and chargers." },
  { id: "womens-fashion", label: "Fashion", hindi: "", note: "Ethnic wear, dresses, and everyday clothes." },
  { id: "mens-grooming", label: "Grooming", hindi: "", note: "Trimmers, kits, and shaving." },
  { id: "beauty", label: "Beauty", hindi: "", note: "Skin tools, hair, and self-care." },
  { id: "accessories", label: "Accessories", hindi: "", note: "Belts, caps, shades, and everyday carry." },
  { id: "jewellery", label: "Jewellery", hindi: "", note: "Chains, rings, and everyday gold-tone pieces." },
  { id: "kids-products", label: "Kids", hindi: "", note: "Care, feeding, and toys." },
  { id: "led-lights-2", label: "LED Lights", hindi: "", note: "Strips, lamps, and wall light." },
  { id: "car-bike", label: "Car & Bike", hindi: "", note: "Holders, lights, and organisers for the ride." },
  { id: "fitness", label: "Fitness", hindi: "", note: "Bands, bags, and home workout tools." },
  { id: "wellness-essentials", label: "Wellness", hindi: "", note: "Sleep, posture, and massage." },
  { id: "work-from-home", label: "Work From Home", hindi: "", note: "Stands, light, and desk order." },
  { id: "diy-tools", label: "DIY Tools", hindi: "", note: "Hooks, kits, and repair tools." },
  { id: "gaming", label: "Gaming", hindi: "", note: "Mouse, pads, and headset gear." },
  { id: "travel", label: "Travel", hindi: "", note: "Bags, bottles, and neck pillows." },
  { id: "gifts", label: "Gifts", hindi: "", note: "Pens, notebooks, and festival sets." },
  { id: "eco-friendly", label: "Eco-Friendly", hindi: "", note: "Bamboo, cloth bags, and reusable pieces." },
  { id: "pet-care", label: "Pet Care", hindi: "", note: "Bowls, clothes, and toys." },
  { id: "fabric", label: "Fabric", hindi: "", note: "Cotton, silk, rayon, and polyester." },
  { id: "sewing-machine", label: "Sewing", hindi: "", note: "Domestic and industrial machines." },
  { id: "cooked-foods", label: "Cooked Food", hindi: "", note: "Veg and non-veg meals, packed to order." },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type ShopCat = CategoryId | "all";

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

export type Product = {
  id: number;
  name: string;
  category: CategoryId;
  price: number;
  stock: number;
  blurb: string;
  image: string;
  badge: "" | "new" | "best";
  published: boolean;
  compareAt: number;
  /** Extra photos after `image` (max 3). Only loaded on product page and studio. */
  images?: string[];
  description?: string;
  showDescription?: boolean;
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
};

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

export const shopSettingsSchema = z.object({
  navCategories: z.array(z.string()).max(40).transform((ids) =>
    ids.filter((id) => CATEGORIES.some((item) => item.id === id)),
  ),
  heroSlides: z.array(photoSchema).max(4, "Up to 4 slider photos."),
});

export type ShopSettings = z.infer<typeof shopSettingsSchema>;

export function parseJsonList(value: unknown): string[] {
  const raw = typeof value === "string" ? safeParse(value) : value;
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}

export const productWriteSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Name the piece.").max(80, "Keep the name shorter."),
  category: z.string().refine((value): value is CategoryId => CATEGORIES.some((item) => item.id === value), "Pick a department."),
  price: z.number().int().min(1, "Add a price in rupees.").max(5_000_000),
  stock: z.number().int().min(0, "Stock cannot be negative.").max(100_000),
  blurb: z.string().trim().max(400, "Keep the note under 400 characters."),
  image: z
    .string()
    .min(1, "Add a photo.")
    .max(1_500_000, "That photo is too large. Try another.")
    .refine(
      (value) =>
        PHOTO_SRC.includes(value) ||
        value.startsWith("data:image/jpeg") ||
        value.startsWith("data:image/png") ||
        value.startsWith("data:image/webp"),
      "Add a photo.",
    ),
  badge: z.enum(["", "new", "best"]),
  published: z.boolean(),
  compareAt: z.number().int().min(0).max(5_000_000),
  images: z.array(photoSchema).max(3, "Up to 3 extra photos.").default([]),
  description: z.string().trim().max(4000, "Keep the description under 4000 characters.").default(""),
  showDescription: z.boolean().default(true),
});

export type ProductWrite = z.infer<typeof productWriteSchema>;

export function readQuery(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 60);
}

export function offPercent(price: number, compareAt: number) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

export function readCat(value: unknown): ShopCat {
  if (typeof value === "string" && CATEGORIES.some((item) => item.id === value)) {
    return value as CategoryId;
  }
  return "all";
}

export function categoryOf(id: string) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[2];
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
  row: Product & { compare_at?: number | null; show_description?: boolean | null },
): Product {
  const badge = row.badge === "new" || row.badge === "best" ? row.badge : "";
  const known = CATEGORIES.some((item) => item.id === row.category);
  const category = known ? (row.category as CategoryId) : CATEGORIES[0].id;
  return {
    id: Number(row.id),
    name: row.name,
    category,
    price: Number(row.price),
    stock: Number(row.stock),
    blurb: row.blurb ?? "",
    image: row.image,
    badge,
    published: Boolean(row.published),
    compareAt: Math.max(0, Number(row.compareAt || row.compare_at || 0)),
    ...("images" in row ? { images: parseJsonList(row.images).slice(0, 3) } : {}),
    ...("description" in row ? { description: row.description ?? "" } : {}),
    ...("show_description" in row ? { showDescription: row.show_description !== false } : {}),
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
