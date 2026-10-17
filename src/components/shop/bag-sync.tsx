import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyBag, saveBag, touchCustomer } from "@/lib/shop/api";
import { useCart } from "@/lib/shop/cart";

function useBagHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const persist = useCart.persist;
    if (!persist) {
      setReady(true);
      return;
    }
    if (persist.hasHydrated()) setReady(true);
    return persist.onFinishHydration(() => setReady(true));
  }, []);
  return ready;
}

function mergeLines(local: { id: number; qty: number }[], remote: { id: number; qty: number }[]) {
  const map = new Map<number, number>();
  for (const line of remote) map.set(line.id, line.qty);
  for (const line of local) {
    const have = map.get(line.id) ?? 0;
    map.set(line.id, Math.min(12, Math.max(have, line.qty)));
  }
  return [...map.entries()].map(([id, qty]) => ({ id, qty }));
}

export function BagSync() {
  const { user, isPending } = useCurrentUserState();
  const ready = useBagHydrated();
  const queryClient = useQueryClient();
  const lines = useCart((state) => state.lines);
  const replace = useCart((state) => state.replace);
  const clear = useCart((state) => state.clear);
  const syncedFor = useRef<string | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!ready || isPending) return;
    if (!userId || !user) {
      if (syncedFor.current) {
        syncedFor.current = null;
        clear();
      }
      return;
    }
    if (syncedFor.current === userId) return;
    let cancel = false;
    void (async () => {
      await touchCustomer({
        data: { name: user.displayName ?? "", email: user.primaryEmail ?? "" },
      });
      const remote = await getMyBag();
      if (cancel) return;
      const merged = mergeLines(
        useCart.getState().lines,
        remote.map((line) => ({ id: line.id, qty: line.qty })),
      );
      syncedFor.current = userId;
      replace(merged);
      await saveBag({ data: { lines: merged } });
      await queryClient.invalidateQueries({ queryKey: ["my-bag", userId] });
    })();
    return () => {
      cancel = true;
    };
  }, [ready, isPending, userId, user, clear, replace]);

  useEffect(() => {
    if (!userId || syncedFor.current !== userId) return;
    const handle = window.setTimeout(() => {
      void saveBag({ data: { lines } }).then(() =>
        queryClient.invalidateQueries({ queryKey: ["my-bag", userId] }),
      );
    }, 400);
    return () => window.clearTimeout(handle);
  }, [lines, userId]);

  return null;
}
