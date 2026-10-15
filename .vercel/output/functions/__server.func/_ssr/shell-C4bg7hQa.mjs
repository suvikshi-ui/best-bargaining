import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link, p as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as KeyRound, n as Store, r as ShoppingBag } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-C4bg7hQa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var useCart = create()(persist((set, get) => ({
	lines: [],
	addQty: (id, qty, stock) => {
		const add = Math.max(1, Math.min(12, qty));
		const lines = get().lines;
		const have = lines.find((line) => line.id === id)?.qty ?? 0;
		const next = Math.min(stock, 12, have + add);
		if (next <= 0) return;
		set({ lines: lines.some((line) => line.id === id) ? lines.map((line) => line.id === id ? {
			...line,
			qty: next
		} : line) : [...lines, {
			id,
			qty: next
		}] });
	},
	setQty: (id, qty, stock) => {
		if (qty <= 0) {
			set({ lines: get().lines.filter((line) => line.id !== id) });
			return;
		}
		const next = Math.min(stock, 12, qty);
		set({ lines: get().lines.map((line) => line.id === id ? {
			...line,
			qty: next
		} : line) });
	},
	remove: (id) => set({ lines: get().lines.filter((line) => line.id !== id) }),
	clear: () => set({ lines: [] })
}), { name: "rainside-bag" }));
function useBagCount() {
	const count = useCart((state) => state.lines.reduce((sum, line) => sum + line.qty, 0));
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setReady(true), []);
	return ready ? count : 0;
}
function BagLink({ className }) {
	const count = useBagCount();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/cart",
		"aria-label": count ? `Bag, ${count} pieces` : "Bag",
		className: cn("relative grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-ink/5", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, {
			className: "size-5",
			"aria-hidden": "true"
		}), count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute top-1 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-xs text-paper tabular-nums",
			children: count
		})]
	});
}
function ShopShell({ children }) {
	const path = useRouterState({ select: (state) => state.location.pathname });
	const shopOn = path === "/" || path.startsWith("/product");
	const bagOn = path === "/cart";
	const ownerOn = path === "/studio" || path === "/login";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-paper text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							search: { cat: "all" },
							className: "font-display text-2xl tracking-tight text-ink",
							children: ["Rainside", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-clay",
								children: "."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "hidden items-center gap-6 md:flex",
							"aria-label": "Shop",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									search: { cat: "toys" },
									className: "text-sm text-mist hover:text-ink",
									children: "Toys"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									search: { cat: "rainy" },
									className: "text-sm text-mist hover:text-ink",
									children: "Rainy Night"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									search: { cat: "everyday" },
									className: "text-sm text-mist hover:text-ink",
									children: "Everyday"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/studio",
									className: "text-sm text-ink",
									children: "Owner desk"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BagLink, {})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pb-16",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-ink/10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-6xl px-4 py-10 md:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-2xl text-ink",
						children: ["Rainside", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-clay",
							children: "."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-sm text-sm text-mist",
						children: "Toys for daylight. Things for rainy nights. Counted, priced, and put on the shelf by the owner."
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-paper md:hidden",
				"aria-label": "Primary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							search: { cat: "all" },
							className: cn("flex h-16 flex-col items-center justify-center gap-1 text-xs", shopOn ? "text-ink" : "text-mist"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, {
								className: "size-5",
								"aria-hidden": "true"
							}), "Shop"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/cart",
							className: cn("flex h-16 flex-col items-center justify-center gap-1 text-xs", bagOn ? "text-ink" : "text-mist"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, {
								className: "size-5",
								"aria-hidden": "true"
							}), "Bag"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/studio",
							className: cn("flex h-16 flex-col items-center justify-center gap-1 text-xs", ownerOn ? "text-ink" : "text-mist"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {
								className: "size-5",
								"aria-hidden": "true"
							}), "Owner"]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { cn as n, useCart as r, ShopShell as t };
