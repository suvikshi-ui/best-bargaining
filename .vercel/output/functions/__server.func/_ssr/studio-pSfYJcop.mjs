import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { d as inr, f as productWriteSchema, r as PHOTOS, s as categoryOf, t as CATEGORIES } from "./catalog-BKpCNYV2.mjs";
import { a as hasGateSessionMarker } from "./server-DPG1U4mb.mjs";
import { a as deleteProduct, s as getStudio, u as saveProduct } from "./router-BRwj-h7q.mjs";
import { t as ShopShell } from "./shell-C4bg7hQa.mjs";
import { i as signOut } from "./client-1vAx-gM_.mjs";
import { n as useCurrentUser, r as useCurrentUserState, t as OwnerSignButtons } from "./use-current-user-BoWgacv5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/studio-pSfYJcop.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var emptyDraft = () => ({
	name: "",
	category: "toys",
	price: "",
	stock: "1",
	blurb: "",
	image: PHOTOS[0].src,
	badge: "",
	published: true
});
function Studio() {
	const { user, isPending } = useCurrentUserState();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ShopShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-start justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-clay",
				children: "Owner desk"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-5xl leading-none",
				children: "What you sell"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-xl text-sm text-mist",
				children: "Toys, rainy-night pieces, and everyday items. Set the price and कितने items are on the shelf."
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-10",
			children: user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}) : null
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-8",
		children: isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-80 animate-pulse rounded-3xl bg-card" }) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-4 text-sm text-mist",
				children: "Sign in once. The first person in becomes the owner and takes the starter shelf."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OwnerSignButtons, {})]
		})
	})] });
}
function Desk() {
	const queryClient = useQueryClient();
	const studio = useQuery({
		queryKey: ["studio"],
		queryFn: () => getStudio()
	});
	const [draft, setDraft] = (0, import_react.useState)(emptyDraft);
	const [message, setMessage] = (0, import_react.useState)("");
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	async function refresh() {
		await queryClient.invalidateQueries({ queryKey: ["studio"] });
		await queryClient.invalidateQueries({ queryKey: ["products"] });
		await queryClient.invalidateQueries({ queryKey: ["product"] });
	}
	const save = useMutation({
		mutationFn: (input) => saveProduct({ data: input }),
		onSuccess: async () => {
			setDraft(emptyDraft());
			setConfirmDelete(false);
			setMessage("Saved to the shelf.");
			await refresh();
		},
		onError: (err) => {
			setMessage(err instanceof Error ? err.message : "Could not save.");
		}
	});
	const remove = useMutation({
		mutationFn: (id) => deleteProduct({ data: id }),
		onSuccess: async () => {
			setDraft(emptyDraft());
			setConfirmDelete(false);
			setMessage("Removed from the shop.");
			await refresh();
		},
		onError: (err) => {
			setMessage(err instanceof Error ? err.message : "Could not remove it.");
		}
	});
	if (studio.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-80 animate-pulse rounded-3xl bg-card" });
	if (studio.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-clay",
		role: "alert",
		children: studio.error instanceof Error ? studio.error.message : "The desk did not open."
	});
	if (studio.data.role === "locked") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "max-w-md text-sm text-mist",
		children: "This shop already has an owner. Sign in with the account that opened the desk."
	});
	const products = studio.data.products;
	const toys = products.filter((product) => product.category === "toys").length;
	const rainy = products.filter((product) => product.category === "rainy").length;
	const low = products.filter((product) => product.published && product.stock <= 3).length;
	function submit() {
		const parsed = productWriteSchema.safeParse({
			...draft,
			id: draft.id,
			price: Math.round(Number(draft.price)),
			stock: Math.round(Number(draft.stock))
		});
		if (!parsed.success) {
			setMessage(parsed.error.issues[0]?.message ?? "Check the details.");
			return;
		}
		setMessage("");
		save.mutate(parsed.data);
	}
	function edit(product) {
		setConfirmDelete(false);
		setMessage("");
		setDraft({
			id: product.id,
			name: product.name,
			category: product.category,
			price: String(product.price),
			stock: String(product.stock),
			blurb: product.blurb,
			image: product.image,
			badge: product.badge,
			published: product.published
		});
		document.getElementById("desk-form")?.scrollIntoView({ block: "start" });
	}
	async function bump(product, delta) {
		const stock = Math.max(0, Math.min(1e5, product.stock + delta));
		setMessage("");
		try {
			await saveProduct({ data: {
				id: product.id,
				name: product.name,
				category: product.category,
				price: product.price,
				stock,
				blurb: product.blurb,
				image: product.image,
				badge: product.badge,
				published: product.published
			} });
			await refresh();
		} catch (err) {
			setMessage(err instanceof Error ? err.message : "Could not change the count.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "grid grid-cols-3 gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Toys",
					value: String(toys)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Rainy night",
					value: String(rainy)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Low stock",
					value: String(low)
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			id: "desk-form",
			className: "mt-8 scroll-mt-24 rounded-3xl bg-card p-4 md:p-6",
			onSubmit: (event) => {
				event.preventDefault();
				submit();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl",
					children: draft.id ? "Edit piece" : "Add a piece"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-4 md:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Name",
							htmlFor: "piece-name",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "piece-name",
								value: draft.name,
								maxLength: 80,
								onChange: (event) => setDraft({
									...draft,
									name: event.target.value
								}),
								className: inputClass,
								required: true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Category",
							htmlFor: "piece-cat",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "piece-cat",
								value: draft.category,
								onChange: (event) => setDraft({
									...draft,
									category: event.target.value
								}),
								className: inputClass,
								children: CATEGORIES.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: category.id,
									children: [
										category.label,
										" — ",
										category.hindi
									]
								}, category.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Price in ₹",
							htmlFor: "piece-price",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "piece-price",
								inputMode: "numeric",
								value: draft.price,
								onChange: (event) => setDraft({
									...draft,
									price: event.target.value
								}),
								className: inputClass,
								required: true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Stock — कितने items",
							htmlFor: "piece-stock",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "piece-stock",
								inputMode: "numeric",
								value: draft.stock,
								onChange: (event) => setDraft({
									...draft,
									stock: event.target.value
								}),
								className: inputClass,
								required: true
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Short note",
					htmlFor: "piece-blurb",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						id: "piece-blurb",
						value: draft.blurb,
						maxLength: 400,
						onChange: (event) => setDraft({
							...draft,
							blurb: event.target.value
						}),
						className: `${inputClass} mt-2 h-24 py-3`
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: "text-sm text-mist",
						children: "Mark"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: [
							["", "None"],
							["new", "New"],
							["best", "Best"]
						].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setDraft({
								...draft,
								badge: value
							}),
							className: draft.badge === value ? "h-11 rounded-full bg-ink px-4 text-sm text-paper" : "h-11 rounded-full border border-ink/15 px-4 text-sm",
							children: label
						}, label))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: "text-sm text-mist",
						children: "Photo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5",
						children: PHOTOS.map((photo) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: draft.image === photo.src ? "overflow-hidden rounded-2xl border-2 border-clay" : "overflow-hidden rounded-2xl border-2 border-transparent",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "radio",
								name: "photo",
								className: "sr-only",
								checked: draft.image === photo.src,
								onChange: () => setDraft({
									...draft,
									image: photo.src
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: photo.src,
								alt: photo.label,
								className: "aspect-square w-full object-cover"
							})]
						}, photo.src))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-4 flex h-11 items-center gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: draft.published,
						onChange: (event) => setDraft({
							...draft,
							published: event.target.checked
						}),
						className: "size-4 accent-clay"
					}), "Show on the website"]
				}),
				message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-clay",
					role: "status",
					children: message
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: save.isPending,
							className: "h-12 rounded-full bg-clay px-5 text-sm text-paper transition-transform duration-150 active:scale-[0.96] disabled:opacity-40",
							children: save.isPending ? "Saving…" : draft.id ? "Save changes" : "Add to shop"
						}),
						draft.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setDraft(emptyDraft());
								setConfirmDelete(false);
							},
							className: "h-12 rounded-full border border-ink/15 px-5 text-sm",
							children: "Cancel"
						}),
						draft.id && !confirmDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setConfirmDelete(true),
							className: "h-12 rounded-full px-5 text-sm text-clay",
							children: "Remove"
						}),
						draft.id && confirmDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: remove.isPending,
							onClick: () => remove.mutate(draft.id),
							className: "h-12 rounded-full bg-ink px-5 text-sm text-paper disabled:opacity-40",
							children: remove.isPending ? "Removing…" : "Yes, remove"
						})
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-10 font-display text-3xl",
			children: "On the shelf"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 divide-y divide-ink/10",
			children: products.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex gap-3 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: product.image,
					alt: "",
					className: "h-16 w-16 rounded-2xl object-cover"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate font-medium",
							children: [product.name, !product.published && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-mist",
								children: " · hidden"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-mist",
							children: [
								categoryOf(product.category).label,
								" · ",
								inr(product.price)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": `Fewer ${product.name}`,
									onClick: () => void bump(product, -1),
									className: "grid h-11 w-11 place-items-center rounded-full border border-ink/15",
									children: "−"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-8 text-center tabular-nums",
									children: product.stock
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": `More ${product.name}`,
									onClick: () => void bump(product, 1),
									className: "grid h-11 w-11 place-items-center rounded-full border border-ink/15",
									children: "+"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => edit(product),
									className: "h-11 px-3 text-sm",
									children: "Edit"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void bumpPublish(product, !product.published).catch((err) => setMessage(err instanceof Error ? err.message : "Could not update.")),
									className: "h-11 px-3 text-sm text-mist",
									children: product.published ? "Hide" : "Show"
								})
							]
						})
					]
				})]
			}, product.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-10 font-display text-3xl",
			children: "Orders"
		}),
		studio.data.orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-mist",
			children: "No orders yet. A checkout shows the pieces and the total here."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-3",
			children: studio.data.orders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-2xl bg-card px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-medium",
					children: [
						"Order #",
						order.id,
						" · ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: inr(order.total)
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-mist",
					children: order.items.map((item) => `${item.qty} × ${item.name}`).join(", ")
				})]
			}, order.id))
		})
	] });
	async function bumpPublish(product, published) {
		await saveProduct({ data: {
			id: product.id,
			name: product.name,
			category: product.category,
			price: product.price,
			stock: product.stock,
			blurb: product.blurb,
			image: product.image,
			badge: product.badge,
			published
		} });
		await refresh();
	}
}
var inputClass = "mt-2 h-11 w-full rounded-2xl border border-ink/15 bg-paper px-3 text-sm text-ink outline-none focus:border-clay";
function Field({ label, htmlFor, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		htmlFor,
		className: "block text-sm text-mist",
		children: [label, children]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-card px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs text-mist",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "font-display text-2xl tabular-nums",
			children: value
		})]
	});
}
//#endregion
export { Studio as component };
