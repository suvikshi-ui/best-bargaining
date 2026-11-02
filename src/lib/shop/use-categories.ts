import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/shop/api";
import { categoriesFrom, type Category } from "@/lib/shop/catalog";

/** Categories that currently have at least one published piece (owner-created, none seeded). */
export function useCategories(): Category[] {
  const products = useQuery({ queryKey: ["products"], queryFn: () => listProducts(), staleTime: 30_000 });
  return categoriesFrom(products.data ?? []);
}
