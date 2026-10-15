import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { x as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as ShopShell } from "./shell-C4bg7hQa.mjs";
import { r as useCurrentUserState, t as OwnerSignButtons } from "./use-current-user-BoWgacv5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-CCo7QSU6.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { user, isPending } = useCurrentUserState();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-clay",
				children: "Owner desk"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-5xl leading-none",
				children: "Sign in"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-mist",
				children: "Add toys, rainy-night pieces, and everyday items. Set the price and how many you have."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 animate-pulse rounded-3xl bg-card" }) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/studio" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OwnerSignButtons, {})
			})
		]
	}) });
}
//#endregion
export { Login as component };
