import { create } from "zustand";
import { persist } from "zustand/middleware";

type Line = { id: number; qty: number };

type CartState = {
  lines: Line[];
  addQty: (id: number, qty: number, stock: number) => void;
  setQty: (id: number, qty: number, stock: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addQty: (id, qty, stock) => {
        const add = Math.max(1, Math.min(12, qty));
        const lines = get().lines;
        const have = lines.find((line) => line.id === id)?.qty ?? 0;
        const next = Math.min(stock, 12, have + add);
        if (next <= 0) return;
        const exists = lines.some((line) => line.id === id);
        set({
          lines: exists
            ? lines.map((line) => (line.id === id ? { ...line, qty: next } : line))
            : [...lines, { id, qty: next }],
        });
      },
      setQty: (id, qty, stock) => {
        if (qty <= 0) {
          set({ lines: get().lines.filter((line) => line.id !== id) });
          return;
        }
        const next = Math.min(stock, 12, qty);
        set({
          lines: get().lines.map((line) => (line.id === id ? { ...line, qty: next } : line)),
        });
      },
      remove: (id) => set({ lines: get().lines.filter((line) => line.id !== id) }),
      clear: () => set({ lines: [] }),
    }),
    { name: "rainside-bag" },
  ),
);
