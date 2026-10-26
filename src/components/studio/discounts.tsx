import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteDiscount, listDiscounts, saveDiscount, saveStackSetting, type StudioDiscount } from "@/lib/shop/api";
import { CATEGORIES, inr } from "@/lib/shop/catalog";
import { DISCOUNT_TYPES, typeLabel, type DiscountType } from "@/lib/shop/discounts";

const input = "h-9 rounded-xl border border-ink/15 bg-paper px-2 text-sm";
const KEY = ["studio-discounts"];

type Form = {
  id?: number;
  type: DiscountType;
  name: string;
  code: string;
  phone: string;
  pct: string;
  amount: string;
  cap: string;
  minSubtotal: string;
  minItems: string;
  startsAt: string; // datetime-local, IST
  endsAt: string;
  categories: string[];
  maxUses: string;
  active: boolean;
};

const blank = (type: DiscountType): Form => ({
  type,
  name: "",
  code: "",
  phone: "",
  pct: "",
  amount: "",
  cap: "",
  minSubtotal: "",
  minItems: "",
  startsAt: "",
  endsAt: "",
  categories: [],
  maxUses: "",
  active: false,
});

/** Which fields each type uses. */
const FIELDS: Record<DiscountType, (keyof Form)[]> = {
  first_order: ["name", "pct", "cap"],
  festival: ["name", "pct", "startsAt", "endsAt", "code", "categories"],
  spend: ["name", "minSubtotal", "pct", "amount"],
  bulk: ["name", "minItems", "pct"],
  flat: ["name", "code", "amount", "minSubtotal", "maxUses", "endsAt"],
  guest: ["name", "phone", "code", "pct"],
};

const LABELS: Partial<Record<keyof Form, string>> = {
  name: "Name",
  code: "Code",
  phone: "WhatsApp (optional)",
  pct: "Discount %",
  amount: "₹ off",
  cap: "Max ₹ (optional)",
  minSubtotal: "Minimum order ₹",
  minItems: "Minimum items",
  startsAt: "Starts (IST)",
  endsAt: "Ends (IST)",
  maxUses: "Max uses (optional)",
};

const PLACEHOLDERS: Partial<Record<keyof Form, string>> = {
  minSubtotal: "e.g. 3000",
  minItems: "e.g. 5",
  name: "e.g. Diwali sale",
  code: "Type a code",
};

// IST is a fixed +05:30 offset (no DST), so conversion is exact.
const IST_MS = 330 * 60 * 1000;
function istLocalToIso(local: string): string | null {
  if (!local) return null;
  const ms = Date.parse(`${local}:00Z`);
  return Number.isNaN(ms) ? null : new Date(ms - IST_MS).toISOString();
}
function isoToIstLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(Date.parse(iso) + IST_MS).toISOString().slice(0, 16);
}
function formatIst(iso: string | null): string {
  return iso ? `${isoToIstLocal(iso).replace("T", " ")} IST` : "—";
}

const num = (value: string) => (value.trim() === "" ? null : Number(value));
const str = (value: number | null) => (value === null ? "" : String(value));

function toForm(d: StudioDiscount): Form {
  return {
    id: d.id,
    type: d.type,
    name: d.name,
    code: d.code ?? "",
    phone: d.phone ?? "",
    pct: str(d.pct),
    amount: str(d.amount),
    cap: str(d.cap),
    minSubtotal: str(d.minSubtotal),
    minItems: str(d.minItems),
    startsAt: isoToIstLocal(d.startsAt),
    endsAt: isoToIstLocal(d.endsAt),
    categories: d.categories,
    maxUses: str(d.maxUses),
    active: d.active,
  };
}

function toPayload(form: Form) {
  const used = new Set(FIELDS[form.type]);
  const pick = <T,>(key: keyof Form, value: T, empty: T) => (used.has(key) ? value : empty);
  return {
    id: form.id,
    type: form.type,
    name: pick("name", form.name, ""),
    code: pick("code", form.code, ""),
    phone: pick("phone", form.phone, ""),
    pct: pick("pct", num(form.pct), null),
    amount: pick("amount", num(form.amount), null),
    cap: pick("cap", num(form.cap), null),
    minSubtotal: pick("minSubtotal", num(form.minSubtotal), null),
    minItems: pick("minItems", num(form.minItems), null),
    startsAt: pick("startsAt", istLocalToIso(form.startsAt), null),
    endsAt: pick("endsAt", istLocalToIso(form.endsAt), null),
    categories: pick("categories", form.categories, [] as string[]),
    maxUses: pick("maxUses", num(form.maxUses), null),
    active: form.active,
  };
}

/** Plain-words summary of what a discount does, and why it is not live yet. */
function describe(d: StudioDiscount): { text: string; missing: string } {
  const pct = d.pct === null ? "—%" : `${d.pct}%`;
  const off = d.pct !== null ? pct : d.amount !== null ? `${inr(d.amount)} off` : "—";
  switch (d.type) {
    case "first_order":
      return { text: `${pct} on a first order${d.cap ? `, max ${inr(d.cap)}` : ""}`, missing: d.pct === null ? "Set a %." : "" };
    case "festival":
      return {
        text: `${pct} · ${formatIst(d.startsAt)} → ${formatIst(d.endsAt)}${d.code ? ` · code ${d.code}` : " · automatic"}${
          d.categories.length ? ` · ${d.categories.join(", ")}` : ""
        }`,
        missing: d.pct === null || !d.startsAt || !d.endsAt ? "Set a %, start and end." : "",
      };
    case "spend":
      return {
        text: `${off} when the order is ${d.minSubtotal === null ? "₹—" : inr(d.minSubtotal)} or more`,
        missing: d.minSubtotal === null || (d.pct === null && d.amount === null) ? "Set the ₹ threshold and a % (or ₹ off)." : "",
      };
    case "bulk":
      return {
        text: `${pct} on ${d.minItems ?? "—"}+ items`,
        missing: d.minItems === null || d.pct === null ? "Set the item count and %." : "",
      };
    case "flat":
      return {
        text: `${d.amount === null ? "₹—" : inr(d.amount)} off with ${d.code ?? "—"}${
          d.minSubtotal ? ` · min ${inr(d.minSubtotal)}` : ""
        }${d.maxUses !== null ? ` · ${d.uses}/${d.maxUses} uses` : ""}${d.endsAt ? ` · until ${formatIst(d.endsAt)}` : ""}`,
        missing: !d.code || !d.amount ? "Set a code and ₹ amount." : "",
      };
    case "guest":
      return {
        text: `${pct} with ${d.code ?? "—"}${d.phone ? ` · ${d.phone}` : ""}`,
        missing: !d.code || d.pct === null ? "Set a code and %." : "",
      };
  }
}

function DiscountForm({
  initial,
  types,
  onDone,
  onCancel,
}: {
  initial: Form;
  types: DiscountType[];
  onDone: (message: string) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<Form>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fields = FIELDS[form.type];
  const set = (patch: Partial<Form>) => setForm((prev) => ({ ...prev, ...patch }));

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await saveDiscount({ data: toPayload(form) });
      if (!form.id) setForm(blank(form.type));
      await onDone(form.id ? "Saved." : "Added. Turn on Active when it is filled in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="mt-3 grid gap-2 rounded-2xl bg-card p-3 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {types.length > 1 ? (
        <label className="block text-xs text-mist">
          Type
          <select
            className={`${input} mt-1 block w-full`}
            value={form.type}
            disabled={Boolean(form.id)}
            onChange={(event) => setForm({ ...blank(event.target.value as DiscountType), active: form.active })}
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {typeLabel(type)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {fields
        .filter((key) => key !== "categories")
        .map((key) => {
          const isDate = key === "startsAt" || key === "endsAt";
          const isText = key === "name" || key === "phone";
          const isCode = key === "code";
          return (
            <label key={key} className="block text-xs text-mist">
              {key === "endsAt" && form.type === "flat" ? "Expires (IST, optional)" : LABELS[key]}
              {key === "code" && form.type === "festival" ? " (optional, blank = automatic)" : ""}
              <input
                className={`${input} mt-1 block w-full ${isCode ? "font-mono uppercase" : ""}`}
                type={isDate ? "datetime-local" : "text"}
                inputMode={isDate || isText || isCode ? undefined : "numeric"}
                autoComplete="off"
                placeholder={PLACEHOLDERS[key] ?? ""}
                value={form[key] as string}
                onChange={(event) => {
                  let value = event.target.value;
                  if (isCode) value = value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
                  else if (!isDate && !isText) value = value.replace(/[^0-9]/g, "").slice(0, key === "pct" ? 2 : 7);
                  set({ [key]: value } as Partial<Form>);
                }}
              />
            </label>
          );
        })}
      {fields.includes("categories") ? (
        <fieldset className="md:col-span-3">
          <legend className="text-xs text-mist">Only these categories (none ticked = whole bag)</legend>
          <div className="mt-1 flex flex-wrap gap-3 text-sm">
            {CATEGORIES.map((category) => (
              <label key={category.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="size-4 accent-clay"
                  checked={form.categories.includes(category.id)}
                  onChange={(event) =>
                    set({
                      categories: event.target.checked
                        ? [...form.categories, category.id]
                        : form.categories.filter((id) => id !== category.id),
                    })
                  }
                />
                {category.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {form.type === "spend" ? (
        <p className="text-xs text-mist md:col-span-3">Use either a % or ₹ off. If both are set, the % is used.</p>
      ) : null}
      <div className="flex items-center gap-3 md:col-span-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-clay" checked={form.active} onChange={(event) => set({ active: event.target.checked })} />
          Active
        </label>
        <button type="submit" disabled={busy} className="h-9 rounded-full bg-ink px-4 text-sm text-paper">
          {form.id ? "Save" : "Add"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="h-9 px-2 text-sm text-mist">
            Cancel
          </button>
        ) : null}
        {error ? (
          <p className="text-sm text-clay" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function useDiscounts() {
  return useQuery({ queryKey: KEY, queryFn: () => listDiscounts() });
}

function DiscountTable({
  rows,
  guest,
  onChanged,
}: {
  rows: StudioDiscount[];
  guest?: boolean;
  onChanged: (message: string) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState<number | null>(null);

  async function toggle(d: StudioDiscount, active: boolean) {
    try {
      await saveDiscount({ data: toPayload({ ...toForm(d), active }) });
      await onChanged(active ? "Turned on." : "Turned off.");
    } catch (err) {
      await onChanged(err instanceof Error ? err.message : "Could not save.");
    }
  }
  async function remove(d: StudioDiscount) {
    if (!window.confirm(`Delete ${d.name || typeLabel(d.type)}? Past orders keep their discount.`)) return;
    await deleteDiscount({ data: d.id });
    await onChanged("Deleted.");
  }

  if (!rows.length) return <p className="mt-3 text-sm text-mist">{guest ? "No guests yet." : "No discounts yet."}</p>;
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl bg-card">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-mist">
          <tr>
            <th className="px-3 py-2">{guest ? "Guest" : "Type"}</th>
            <th className="px-3 py-2">{guest ? "Code" : "Name"}</th>
            <th className="px-3 py-2">{guest ? "%" : "Rule"}</th>
            <th className="px-3 py-2 text-right">{guest ? "Purchases" : "Used"}</th>
            <th className="px-3 py-2 text-right">{guest ? "Order value" : "Sales"}</th>
            <th className="px-3 py-2">Active</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => {
            const info = describe(d);
            if (editing === d.id) {
              return (
                <tr key={d.id} className="border-t border-ink/10">
                  <td colSpan={7} className="px-3 py-2">
                    <DiscountForm
                      initial={toForm(d)}
                      types={[d.type]}
                      onCancel={() => setEditing(null)}
                      onDone={async (message) => {
                        setEditing(null);
                        await onChanged(message);
                      }}
                    />
                  </td>
                </tr>
              );
            }
            return (
              <tr key={d.id} className="border-t border-ink/10 align-top">
                <td className="px-3 py-2">
                  {guest ? d.name || "—" : typeLabel(d.type)}
                  {guest && d.phone ? <span className="block text-xs text-mist">{d.phone}</span> : null}
                </td>
                <td className="px-3 py-2">{guest ? <span className="font-mono">{d.code || "—"}</span> : d.name || "—"}</td>
                <td className="px-3 py-2">
                  {guest ? (d.pct === null ? "—" : `${d.pct}%`) : info.text}
                  {info.missing ? <span className="block text-xs text-clay">Not live: {info.missing}</span> : null}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{d.uses}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(d.sales)}</td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-clay"
                    checked={d.active}
                    onChange={(event) => void toggle(d, event.target.checked)}
                    aria-label={`Active ${d.name || d.code || typeLabel(d.type)}`}
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <button type="button" onClick={() => setEditing(d.id)} className="h-9 px-2 text-clay">
                    Edit
                  </button>
                  <button type="button" onClick={() => void remove(d)} className="h-9 px-2 text-clay">
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const SHOP_TYPES = DISCOUNT_TYPES.map((item) => item.id).filter((id) => id !== "guest");

export function DiscountsSection() {
  const queryClient = useQueryClient();
  const data = useDiscounts();
  const [message, setMessage] = useState("");
  const refresh = async (text: string) => {
    setMessage(text);
    await queryClient.invalidateQueries({ queryKey: KEY });
  };
  const rows = (data.data?.discounts ?? []).filter((d) => d.type !== "guest");

  return (
    <section className="mt-10">
      <h2 className="text-3xl font-semibold">Discounts</h2>
      <p className="mt-1 text-sm text-mist">
        Pick a type, fill it in and turn on Active. Only the single best discount applies to an order. Referral codes are
        in Referral agents above.
      </p>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-clay"
          checked={Boolean(data.data?.stackReferral)}
          disabled={!data.data}
          onChange={async (event) => {
            await saveStackSetting({ data: event.target.checked });
            await refresh(event.target.checked ? "Referral codes now stack with one automatic discount." : "Single best discount only.");
          }}
        />
        Allow referral code to stack with one automatic discount
      </label>
      <DiscountForm initial={blank("spend")} types={SHOP_TYPES} onDone={refresh} />
      {message ? (
        <p className="mt-2 text-sm text-clay" role="status">
          {message}
        </p>
      ) : null}
      {data.data ? <DiscountTable rows={rows} onChanged={refresh} /> : null}
    </section>
  );
}

export function LoyalGuests() {
  const queryClient = useQueryClient();
  const data = useDiscounts();
  const [message, setMessage] = useState("");
  const refresh = async (text: string) => {
    setMessage(text);
    await queryClient.invalidateQueries({ queryKey: KEY });
  };
  const rows = (data.data?.discounts ?? []).filter((d) => d.type === "guest");
  return (
    <section className="mt-10">
      <h2 className="text-3xl font-semibold">Loyal guest codes</h2>
      <p className="mt-1 text-sm text-mist">
        A reusable code for a regular customer. It works once it has a code and a % and is Active.
      </p>
      <DiscountForm initial={blank("guest")} types={["guest"]} onDone={refresh} />
      {message ? (
        <p className="mt-2 text-sm text-clay" role="status">
          {message}
        </p>
      ) : null}
      {data.data ? <DiscountTable rows={rows} guest onChanged={refresh} /> : null}
    </section>
  );
}
