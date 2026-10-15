import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as inr, s as categoryOf } from "./catalog-BKpCNYV2.mjs";
import { n as Route$1, o as getProduct } from "./router-BRwj-h7q.mjs";
import { r as useCart, t as ShopShell } from "./shell-C4bg7hQa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/product._id-dUiBuzvr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Piece() {
	const initial = Route$1.useLoaderData();
	const { id } = Route$1.useParams();
	const queryClient = useQueryClient();
	const product = useQuery({
		queryKey: ["product", id],
		queryFn: () => getProduct({ data: Number(id) }),
		initialData: initial
	}).data;
	const addQty = useCart((state) => state.addQty);
	const [qty, setQty] = (0, import_react.useState)(1);
	const [held, setHeld] = (0, import_react.useState)(false);
	if (!product) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ShopShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "font-display text-4xl",
		children: "That piece is not on the shelf."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/",
		search: { cat: "all" },
		className: "mt-4 inline-flex h-11 items-center text-clay",
		children: "Back to the shop"
	})] });
	const category = categoryOf(product.category);
	const gone = product.stock === 0;
	const max = Math.min(12, product.stock);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ShopShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/",
		search: { cat: "all" },
		className: "text-sm text-mist hover:text-ink",
		children: "All pieces"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 grid items-start gap-8 md:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-3xl bg-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: product.image,
				alt: product.name,
				className: "aspect-square w-full object-cover"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-clay",
				children: [
					category.hindi,
					" · ",
					category.label
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-5xl leading-none",
				children: product.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 max-w-md text-mist",
				children: product.blurb
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 font-display text-3xl tabular-nums",
				children: inr(product.price)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-mist",
				children: gone ? "Gone for now." : `${product.stock} in the shop.`
			}),
			!gone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Fewer",
						onClick: () => setQty((value) => Math.max(1, value - 1)),
						className: "grid h-11 w-11 place-items-center rounded-full border border-ink/15 text-lg",
						children: "−"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-8 text-center tabular-nums",
						children: Math.min(qty, max)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "More",
						onClick: () => setQty((value) => Math.min(max, value + 1)),
						className: "grid h-11 w-11 place-items-center rounded-full border border-ink/15 text-lg",
						children: "+"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: gone,
				onClick: () => {
					addQty(product.id, Math.min(qty, max), product.stock);
					setHeld(true);
					queryClient.invalidateQueries({ queryKey: ["products"] });
				},
				className: "mt-6 h-12 w-full rounded-full bg-clay px-6 text-sm text-paper transition-transform duration-150 active:scale-[0.96] disabled:opacity-40 md:w-auto",
				children: gone ? "Sold out" : held ? "In the bag" : "Add to bag"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/cart",
				className: "mt-4 block text-sm text-mist hover:text-ink",
				children: "View bag"
			})
		] })]
	})] });
}
//#endregion
export { Piece as component };
