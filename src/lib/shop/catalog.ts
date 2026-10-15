import { z } from "zod";

export const CATEGORIES = [
  {
    id: "toys",
    label: "Toys",
    hindi: "खिलौने",
    note: "Things small hands keep.",
  },
  {
    id: "rainy",
    label: "Rainy Night",
    hindi: "बारिश की रात",
    note: "Light, wool, a cup that stays warm.",
  },
  {
    id: "everyday",
    label: "Everyday",
    hindi: "रोज़मर्रा",
    note: "The pieces you reach for twice.",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type ShopCat = CategoryId | "all";

export const PHOTOS = [
  { src: "/products/rainbow.jpg", label: "Cedar arches" },
  { src: "/products/rabbit.jpg", label: "Moon rabbit" },
  { src: "/products/train.jpg", label: "Wooden train" },
  { src: "/products/candle.jpg", label: "Amber candle" },
  { src: "/products/throw.jpg", label: "Wool throw" },
  { src: "/products/mug.jpg", label: "Rain cup" },
  { src: "/products/lamp.jpg", label: "Brass lamp" },
  { src: "/products/tote.jpg", label: "Market tote" },
  { src: "/products/bowl.jpg", label: "Clay bowl" },
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
};

export const productWriteSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Name the piece.").max(80, "Keep the name shorter."),
  category: z.enum(["toys", "rainy", "everyday"]),
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
});

export type ProductWrite = z.infer<typeof productWriteSchema>;

export function readCat(value: unknown): ShopCat {
  if (value === "toys" || value === "rainy" || value === "everyday") return value;
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

export function asProduct(row: Product): Product {
  const badge = row.badge === "new" || row.badge === "best" ? row.badge : "";
  const category =
    row.category === "toys" || row.category === "rainy" || row.category === "everyday"
      ? row.category
      : "everyday";
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
