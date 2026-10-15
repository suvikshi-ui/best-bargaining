import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, n as useQuery, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as inr, n as HERO, s as categoryOf, t as CATEGORIES } from "./catalog-BKpCNYV2.mjs";
import { c as listProducts, i as Route$5 } from "./router-BRwj-h7q.mjs";
import { n as cn, r as useCart, t as ShopShell } from "./shell-C4bg7hQa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Cw_8Eq-b.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProductCard({ product, tone = "day" }) {
	const addQty = useCart((state) => state.addQty);
	const [held, setHeld] = (0, import_react.useState)(false);
	const night = tone === "night";
	const gone = product.stock === 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex min-w-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/product/$id",
				params: { id: String(product.id) },
				className: "group block min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("overflow-hidden rounded-3xl", night ? "bg-paper/10" : "bg-card"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: product.image,
						alt: product.name,
						loading: "lazy",
						decoding: "async",
						className: cn("aspect-square w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]", gone && "opacity-60")
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-start justify-between gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: cn("font-display text-lg leading-tight", night ? "text-paper" : "text-ink"),
							children: product.name
						}),
						product.badge === "best" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 text-xs text-clay",
							children: "Best"
						}),
						product.badge === "new" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("shrink-0 text-xs", night ? "text-paper/70" : "text-mist"),
							children: "New"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: cn("mt-1 text-sm tabular-nums", night ? "text-paper/70" : "text-mist"),
				children: [
					inr(product.price),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						children: " · "
					}),
					gone ? "Gone for now" : `${product.stock} left`
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: gone,
				onClick: () => {
					addQty(product.id, 1, product.stock);
					setHeld(true);
					window.setTimeout(() => setHeld(false), 900);
				},
				className: "mt-3 h-11 rounded-full bg-clay px-4 text-sm text-paper transition-transform duration-150 active:scale-[0.96] disabled:opacity-40",
				children: gone ? "Sold out" : held ? "In the bag" : "Add to bag"
			})
		]
	});
}
function Home() {
	const { cat } = Route$5.useSearch();
	const initial = Route$5.useLoaderData();
	const query = useQuery({
		queryKey: ["products"],
		queryFn: () => listProducts(),
		initialData: initial
	});
	const [q, setQ] = (0, import_react.useState)("");
	const needle = q.trim().toLowerCase();
	const products = query.data;
	const visible = (0, import_react.useMemo)(() => products.filter((product) => {
		const catOk = cat === "all" || product.category === cat;
		const text = `${product.name} ${product.blurb}`.toLowerCase();
		return catOk && (!needle || text.includes(needle));
	}), [
		products,
		cat,
		needle
	]);
	const browsing = cat === "all" && needle.length === 0;
	const counts = countBy(products);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ShopShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "grid items-end gap-8 md:grid-cols-2 md:gap-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rise",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-clay",
					children: "दिन के खिलौने · रात की बारिश"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-5xl leading-none text-ink md:text-6xl",
					children: "Toys for daylight. Things for rainy nights."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-md text-mist",
					children: "Wooden play, warm light, wool, and a cup that stays hot. A small shelf you can actually finish looking at."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "#shelf",
						className: "inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm text-paper transition-transform duration-150 active:scale-[0.96]",
						children: "Shop the shelf"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/studio",
						className: "inline-flex h-12 items-center rounded-full border border-ink/15 px-5 text-sm text-ink",
						children: "Owner desk"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 text-sm tabular-nums text-mist",
					children: [
						counts.toys,
						" toys · ",
						counts.rainy,
						" rainy-night · ",
						counts.everyday,
						" everyday"
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-3xl bg-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: HERO,
				alt: "A rainy windowsill with wooden toys and a candle",
				className: "aspect-[4/5] w-full object-cover"
			})
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "shelf",
		className: "mt-12 scroll-mt-24",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4 border-b border-ink/10 pb-4 md:flex-row md:items-end md:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-x-5",
				role: "tablist",
				"aria-label": "Categories",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatLink, {
					id: "all",
					current: cat,
					count: products.length,
					label: "All"
				}), CATEGORIES.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatLink, {
					id: category.id,
					current: cat,
					count: counts[category.id],
					label: category.label
				}, category.id))]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block w-full md:max-w-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: "Search the shelf"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: q,
					onChange: (event) => setQ(event.target.value),
					placeholder: "Search pieces",
					className: "h-11 w-full rounded-full border border-ink/15 bg-card px-4 text-sm text-ink outline-none placeholder:text-mist focus:border-clay"
				})]
			})]
		}), browsing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shelf, {
				title: "Toys",
				hindi: "खिलौने",
				note: "Things small hands keep.",
				items: products.filter((product) => product.category === "toys")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-12 rounded-3xl bg-ink px-4 py-8 text-paper md:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-paper/70",
						children: "बारिश की रात"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-4xl",
						children: "Rainy night"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-md text-sm text-paper/70",
						children: "Light, wool, and something warm in both hands. For the hour the glass goes dark."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5",
						children: products.filter((product) => product.category === "rainy").map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, {
							product,
							tone: "night"
						}, product.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shelf, {
				title: "Everyday",
				hindi: "रोज़मर्रा",
				note: "The pieces you reach for twice.",
				items: products.filter((product) => product.category === "everyday")
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl",
					children: cat === "all" ? "Matches" : categoryOf(cat).label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-mist",
					children: visible.length === 0 ? "Nothing by that name." : `${visible.length} on the shelf.`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5",
					children: visible.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product }, product.id))
				})
			]
		})]
	})] });
}
function countBy(products) {
	return {
		toys: products.filter((product) => product.category === "toys").length,
		rainy: products.filter((product) => product.category === "rainy").length,
		everyday: products.filter((product) => product.category === "everyday").length
	};
}
function CatLink({ id, current, count, label }) {
	const on = current === id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		search: { cat: id },
		role: "tab",
		"aria-selected": on,
		className: cn("inline-flex h-11 items-center gap-2 border-b-2 text-sm", on ? "border-clay text-ink" : "border-transparent text-mist"),
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "tabular-nums text-xs",
			children: count
		})]
	});
}
function Shelf({ title, hindi, note, items }) {
	if (!items.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-end justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-clay",
				children: hindi
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-4xl text-ink",
				children: title
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "hidden max-w-xs text-right text-sm text-mist md:block",
				children: note
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5",
			children: items.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product }, product.id))
		})]
	});
}
//#endregion
export { Home as component };
