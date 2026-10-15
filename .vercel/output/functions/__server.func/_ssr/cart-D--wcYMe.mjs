import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as inr } from "./catalog-BKpCNYV2.mjs";
import { c as listProducts, l as placeOrder, r as Route$4 } from "./router-BRwj-h7q.mjs";
import { r as useCart, t as ShopShell } from "./shell-C4bg7hQa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cart-D--wcYMe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var RECEIPT_KEY = "rainside-receipt";
function Bag() {
	const initial = Route$4.useLoaderData();
	const queryClient = useQueryClient();
	const products = useQuery({
		queryKey: ["products"],
		queryFn: () => listProducts(),
		initialData: initial
	});
	const lines = useCart((state) => state.lines);
	const setQty = useCart((state) => state.setQty);
	const remove = useCart((state) => state.remove);
	const clear = useCart((state) => state.clear);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [receipt, setReceipt] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setReady(true);
		const saved = sessionStorage.getItem(RECEIPT_KEY);
		if (!saved) return;
		try {
			setReceipt(JSON.parse(saved));
		} catch {
			sessionStorage.removeItem(RECEIPT_KEY);
		}
	}, []);
	const rows = lines.map((line) => {
		return {
			line,
			product: products.data.find((item) => item.id === line.id)
		};
	}).filter((row) => row.product);
	const total = rows.reduce((sum, row) => sum + (row.product?.price ?? 0) * row.line.qty, 0);
	const blocked = rows.some((row) => row.product && row.line.qty > row.product.stock);
	async function checkout() {
		setBusy(true);
		setError("");
		try {
			const result = await placeOrder({ data: { lines: rows.map((row) => ({
				id: row.line.id,
				qty: row.line.qty
			})) } });
			const next = {
				id: result.id,
				total: result.total,
				lines: result.lines,
				note: note.trim()
			};
			sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(next));
			setReceipt(next);
			clear();
			setNote("");
			await queryClient.invalidateQueries({ queryKey: ["products"] });
		} catch (err) {
			setError(err instanceof Error ? err.message : "The order did not go through.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ShopShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-5xl leading-none",
			children: "Bag"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-md text-sm text-mist",
			children: "Checkout reserves the pieces and updates the count. Your name stays on this phone."
		}),
		receipt && ready && lines.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-8 rounded-3xl bg-ink p-6 text-paper",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-paper/70",
					children: "Order held"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mt-1 font-display text-4xl",
					children: ["#", receipt.id]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-1 text-sm text-paper/80",
					children: receipt.lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						line.qty,
						" × ",
						line.name,
						" · ",
						inr(line.price * line.qty)
					] }, line.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 font-display text-2xl tabular-nums",
					children: inr(receipt.total)
				}),
				receipt.note && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-sm text-paper/70",
					children: ["Your note: ", receipt.note]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-paper/70",
					children: "Tell the shop this number when you pay."
				})
			]
		}),
		!ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-10 text-mist",
			children: "Opening the bag…"
		}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-10",
			children: [lines.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-mist",
				children: "Those pieces left the shelf."
			}) : receipt ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-mist",
				children: "The bag is empty."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				search: { cat: "all" },
				className: "mt-4 inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm text-paper",
				children: "Shop the shelf"
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-8 md:grid-cols-[1.4fr_0.8fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-ink/10",
				children: rows.map(({ line, product }) => product ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-3 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: product.image,
						alt: "",
						className: "h-20 w-20 rounded-2xl object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/product/$id",
								params: { id: String(product.id) },
								className: "font-display text-xl",
								children: product.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm tabular-nums text-mist",
								children: [
									inr(product.price),
									" · ",
									product.stock,
									" left"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": `Fewer ${product.name}`,
										onClick: () => setQty(product.id, line.qty - 1, product.stock),
										className: "grid h-11 w-11 place-items-center rounded-full border border-ink/15",
										children: "−"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-6 text-center tabular-nums",
										children: line.qty
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": `More ${product.name}`,
										onClick: () => setQty(product.id, line.qty + 1, product.stock),
										className: "grid h-11 w-11 place-items-center rounded-full border border-ink/15",
										children: "+"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => remove(product.id),
										className: "h-11 px-2 text-sm text-mist",
										children: "Remove"
									})
								]
							}),
							line.qty > product.stock && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm text-clay",
								children: [
									"Only ",
									product.stock,
									" left."
								]
							})
						]
					})]
				}, line.id) : null)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "h-fit rounded-3xl bg-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-mist",
						children: "Total"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-4xl tabular-nums",
						children: inr(total)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mt-5 block text-sm text-mist",
						htmlFor: "bag-note",
						children: "Name or phone — only on this phone, not saved by the shop"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "bag-note",
						value: note,
						onChange: (event) => setNote(event.target.value.slice(0, 80)),
						className: "mt-2 h-11 w-full rounded-2xl border border-ink/15 bg-paper px-3 text-sm outline-none focus:border-clay"
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-clay",
						role: "alert",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: busy || blocked || rows.length === 0,
						onClick: () => void checkout(),
						className: "mt-4 h-12 w-full rounded-full bg-clay text-sm text-paper transition-transform duration-150 active:scale-[0.96] disabled:opacity-40",
						children: busy ? "Reserving…" : "Place order"
					})
				]
			})]
		})
	] });
}
//#endregion
export { Bag as component };
