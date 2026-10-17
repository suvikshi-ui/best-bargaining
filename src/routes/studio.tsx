import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { OwnerSignButtons } from "@/components/shop/sign-buttons";
import { ShopShell } from "@/components/shop/shell";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { deleteProduct, getPages, getStudio, savePage, saveProduct } from "@/lib/shop/api";
import {
  CATEGORIES,
  PHOTOS,
  categoryOf,
  inr,
  productWriteSchema,
  type CategoryId,
  type Product,
  type ProductWrite,
} from "@/lib/shop/catalog";

export const Route = createFileRoute("/studio")({
  validateSearch: (search: Record<string, unknown>) => {
    const piece = typeof search.piece === "number" ? search.piece : Number(search.piece);
    return { piece: Number.isInteger(piece) && piece > 0 ? piece : 0 };
  },
  component: Studio,
});

type Draft = {
  id?: number;
  name: string;
  category: CategoryId;
  price: string;
  stock: string;
  blurb: string;
  image: string;
  badge: "" | "new" | "best";
  published: boolean;
  compare: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  category: "gadgets",
  price: "",
  stock: "1",
  blurb: "",
  image: "",
  badge: "",
  published: true,
  compare: "",
});

function Studio() {
  const { user, isPending } = useCurrentUserState();
  return (
    <ShopShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-clay">Owner desk</p>
          <h1 className="mt-1 font-display text-5xl leading-none">What you sell</h1>
          <p className="mt-3 max-w-xl text-sm text-mist">
            Gadgets, kitchen, fashion, and every other shelf. Set the price and कितने items are on the shelf.
          </p>
        </div>
        <div className="min-h-10">{user ? <UserButton /> : null}</div>
      </div>
      <div className="mt-8">
        {isPending ? (
          <div className="h-80 animate-pulse rounded-3xl bg-card" />
        ) : user ? (
          <Desk />
        ) : (
          <div className="max-w-sm">
            <p className="mb-4 text-sm text-mist">
              Log in to open the desk. First login becomes the owner.
            </p>
            <OwnerSignButtons />
          </div>
        )}
      </div>
    </ShopShell>
  );
}

function Desk() {
  const queryClient = useQueryClient();
  const studio = useQuery({
    queryKey: ["studio"],
    queryFn: () => getStudio(),
  });
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { piece } = Route.useSearch();
  const opened = useRef(0);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["studio"] });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.invalidateQueries({ queryKey: ["product"] });
  }

  const save = useMutation({
    mutationFn: (input: ProductWrite) => saveProduct({ data: input }),
    onSuccess: async () => {
      setDraft(emptyDraft());
      setConfirmDelete(false);
      setMessage("Saved to the shelf.");
      await refresh();
    },
    onError: (err: unknown) => {
      setMessage(err instanceof Error ? err.message : "Could not save.");
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteProduct({ data: id }),
    onSuccess: async () => {
      setDraft(emptyDraft());
      setConfirmDelete(false);
      setMessage("Removed from the shop.");
      await refresh();
    },
    onError: (err: unknown) => {
      setMessage(err instanceof Error ? err.message : "Could not remove it.");
    },
  });

  if (studio.isPending) return <div className="h-80 animate-pulse rounded-3xl bg-card" />;
  if (studio.isError) {
    return (
      <p className="text-sm text-clay" role="alert">
        {studio.error instanceof Error ? studio.error.message : "The desk did not open."}
      </p>
    );
  }
  if (studio.data.role === "locked") {
    return (
      <p className="max-w-md text-sm text-mist">
        This shop already has an owner. Sign in with the account that opened the desk.
      </p>
    );
  }

  const products = studio.data.products;
  const departments = new Set(products.map((product) => product.category)).size;
  const low = products.filter((product) => product.published && product.stock <= 3).length;

  function submit() {
    const parsed = productWriteSchema.safeParse({
      ...draft,
      id: draft.id,
      price: Math.round(Number(draft.price)),
      stock: Math.round(Number(draft.stock)),
      compareAt: draft.compare.trim() === "" ? 0 : Math.round(Number(draft.compare)),
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Check the details.");
      return;
    }
    setMessage("");
    save.mutate(parsed.data);
  }

  function edit(product: Product) {
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
      published: product.published,
      compare: product.compareAt > 0 ? String(product.compareAt) : "",
    });
    document.getElementById("desk-form")?.scrollIntoView({ block: "start" });
  }

  async function bump(product: Product, delta: number) {
    const stock = Math.max(0, Math.min(100_000, product.stock + delta));
    setMessage("");
    try {
      await saveProduct({
        data: {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          stock,
          blurb: product.blurb,
          image: product.image,
          badge: product.badge,
          published: product.published,
          compareAt: product.compareAt,
        },
      });
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not change the count.");
    }
  }

  useEffect(() => {
    if (!piece || opened.current === piece || studio.data?.role !== "owner") return;
    const product = studio.data.products.find((item) => item.id === piece);
    if (!product) return;
    opened.current = piece;
    edit(product);
  }, [piece, studio.data]);

  async function replacePhoto(product: Product, file: File | undefined) {
    if (!file) return;
    setMessage("");
    try {
      const image = await compressPhoto(file);
      await saveProduct({
        data: {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          blurb: product.blurb,
          image,
          badge: product.badge,
          published: product.published,
          compareAt: product.compareAt,
        },
      });
      if (draft.id === product.id) setDraft({ ...draft, image });
      setMessage("Photo updated.");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update the photo.");
    }
  }

  return (
    <div>
      <dl className="grid grid-cols-3 gap-3">
        <Stat label="Pieces" value={String(products.length)} />
        <Stat label="Departments" value={String(departments)} />
        <Stat label="Low stock" value={String(low)} />
      </dl>

      <SiteEditor />

      <form
        id="desk-form"
        className="mt-8 scroll-mt-24 rounded-3xl bg-card p-4 md:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <h2 className="font-display text-3xl">{draft.id ? "Edit piece" : "Add a piece"}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Name" htmlFor="piece-name">
            <input
              id="piece-name"
              value={draft.name}
              maxLength={80}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Category" htmlFor="piece-cat">
            <select
              id="piece-cat"
              value={draft.category}
              onChange={(event) =>
                setDraft({ ...draft, category: event.target.value as CategoryId })
              }
              className={inputClass}
            >
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price in ₹" htmlFor="piece-price">
            <input
              id="piece-price"
              inputMode="numeric"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: event.target.value })}
              className={inputClass}
              required
            />
          </Field>
          <Field label="MRP — was price, optional" htmlFor="piece-mrp">
            <input
              id="piece-mrp"
              inputMode="numeric"
              value={draft.compare}
              onChange={(event) => setDraft({ ...draft, compare: event.target.value })}
              className={inputClass}
              placeholder="Blank if no offer"
            />
          </Field>
          <Field label="Stock — कितने items" htmlFor="piece-stock">
            <input
              id="piece-stock"
              inputMode="numeric"
              value={draft.stock}
              onChange={(event) => setDraft({ ...draft, stock: event.target.value })}
              className={inputClass}
              required
            />
          </Field>
        </div>
        <Field label="Short note" htmlFor="piece-blurb">
          <textarea
            id="piece-blurb"
            value={draft.blurb}
            maxLength={400}
            onChange={(event) => setDraft({ ...draft, blurb: event.target.value })}
            className={`${inputClass} mt-2 h-24 py-3`}
          />
        </Field>
        <fieldset className="mt-4">
          <legend className="text-sm text-mist">Mark</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["", "None"],
                ["new", "New"],
                ["best", "Best"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => setDraft({ ...draft, badge: value })}
                className={
                  draft.badge === value
                    ? "h-11 rounded-full bg-ink px-4 text-sm text-paper"
                    : "h-11 rounded-full border border-ink/15 px-4 text-sm"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <PhotoField
          image={draft.image}
          onImage={(image) => setDraft({ ...draft, image })}
          onError={setMessage}
        />
        {draft.image ? (
          <button
            type="button"
            onClick={() => setDraft({ ...draft, image: PHOTOS[0].src })}
            className="mt-2 h-11 text-sm text-clay"
          >
            Clear photo
          </button>
        ) : null}
        <p className="mt-3 text-sm text-mist">Or use a shelf photo</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {PHOTOS.map((photo) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setDraft({ ...draft, image: photo.src })}
              className={
                draft.image === photo.src
                  ? "overflow-hidden rounded-2xl border-2 border-clay"
                  : "overflow-hidden rounded-2xl border-2 border-transparent"
              }
            >
              <img src={photo.src} alt={photo.label} className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
        <label className="mt-4 flex h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
            className="size-4 accent-clay"
          />
          Show on the website
        </label>
        {message && (
          <p className="mt-3 text-sm text-clay" role="status">
            {message}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="h-12 rounded-full bg-clay px-5 text-sm text-paper transition-transform duration-150 active:scale-[0.96] disabled:opacity-40"
          >
            {save.isPending ? "Saving…" : draft.id ? "Save changes" : "Add to shop"}
          </button>
          {draft.id && (
            <button
              type="button"
              onClick={() => {
                setDraft(emptyDraft());
                setConfirmDelete(false);
              }}
              className="h-12 rounded-full border border-ink/15 px-5 text-sm"
            >
              Cancel
            </button>
          )}
          {draft.id && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="h-12 rounded-full px-5 text-sm text-clay"
            >
              Remove
            </button>
          )}
          {draft.id && confirmDelete && (
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate(draft.id!)}
              className="h-12 rounded-full bg-ink px-5 text-sm text-paper disabled:opacity-40"
            >
              {remove.isPending ? "Removing…" : "Yes, remove"}
            </button>
          )}
        </div>
      </form>

      <h2 className="mt-10 font-display text-3xl">On the shelf</h2>
      <ul className="mt-2 divide-y divide-ink/10">
        {products.map((product) => (
          <li key={product.id} className="flex gap-3 py-4">
            <img src={product.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {product.name}
                {!product.published && <span className="text-mist"> · hidden</span>}
              </p>
              <p className="text-sm text-mist">
                {categoryOf(product.category).label} · {inr(product.price)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label={`Fewer ${product.name}`}
                  onClick={() => void bump(product, -1)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-ink/15"
                >
                  −
                </button>
                <span className="w-8 text-center tabular-nums">{product.stock}</span>
                <button
                  type="button"
                  aria-label={`More ${product.name}`}
                  onClick={() => void bump(product, 1)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-ink/15"
                >
                  +
                </button>
                <button type="button" onClick={() => edit(product)} className="h-11 px-3 text-sm">
                  Edit
                </button>
                <label className="inline-flex h-11 cursor-pointer items-center px-3 text-sm">
                  Change photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(event) => {
                      void replacePhoto(product, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    void bumpPublish(product, !product.published).catch((err: unknown) =>
                      setMessage(err instanceof Error ? err.message : "Could not update."),
                    )
                  }
                  className="h-11 px-3 text-sm text-mist"
                >
                  {product.published ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-3xl font-semibold">Customers</h2>
      <p className="mt-1 text-sm text-mist">
        Everyone who signs in. Their bag, and every order they have placed.
      </p>
      {studio.data.customers.length === 0 ? (
        <p className="mt-2 text-sm text-mist">No customer has signed in yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {studio.data.customers.map((customer) => (
            <li key={customer.userId} className="rounded-2xl bg-card px-4 py-3">
              <p className="font-medium">{customer.name || "Customer"}</p>
              <p className="text-sm">{customer.email || "No login email"}</p>
              <p className="text-sm tabular-nums">{customer.phone || "No mobile yet"}</p>
              <p className="mt-2 text-sm font-medium">Bag</p>
              {customer.bag.length === 0 ? (
                <p className="text-sm text-mist">Bag is empty.</p>
              ) : (
                <p className="text-sm text-mist">
                  {customer.bag.map((line) => `${line.qty} × ${line.name}`).join(", ")}
                </p>
              )}
              <p className="mt-2 text-sm font-medium">Order history</p>
              {customer.orders.length === 0 ? (
                <p className="text-sm text-mist">No orders yet.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm text-mist">
                  {customer.orders.map((order) => (
                    <li key={order.id}>
                      #{order.id} · {inr(order.total)} ·{" "}
                      {order.items.map((item) => `${item.qty} × ${item.name}`).join(", ")}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-display text-3xl">Orders</h2>
      {studio.data.orders.length === 0 ? (
        <p className="mt-2 text-sm text-mist">No orders yet. A checkout shows the pieces and the total here.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {studio.data.orders.map((order) => (
            <li key={order.id} className="rounded-2xl bg-card px-4 py-3">
              <p className="font-medium">
                Order #{order.id} · <span className="tabular-nums">{inr(order.total)}</span>
              </p>
              {order.customerName ? (
                <div className="mt-2 text-sm">
                  <p>{order.customerName}</p>
                  <p className="tabular-nums">{order.customerPhone}</p>
                  <p>{order.customerEmail}</p>
                  <p className="text-mist">Login: {order.accountEmail || order.customerEmail}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-mist">No contact on this order.</p>
              )}
              <p className="mt-2 text-sm text-mist">
                {order.items.map((item) => `${item.qty} × ${item.name}`).join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  async function bumpPublish(product: Product, published: boolean) {
    await saveProduct({
      data: {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        blurb: product.blurb,
        image: product.image,
        badge: product.badge,
        published,
        compareAt: product.compareAt,
      },
    });
    await refresh();
  }
}

const inputClass =
  "mt-2 h-11 w-full rounded-2xl border border-ink/15 bg-paper px-3 text-sm text-ink outline-none focus:border-clay";

function SiteEditor() {
  const queryClient = useQueryClient();
  const pages = useQuery({ queryKey: ["pages"], queryFn: () => getPages() });
  const [message, setMessage] = useState("");
  const rows = [
    { slug: "home", label: "Home" },
    ...CATEGORIES.map((category) => ({ slug: category.id, label: category.label })),
  ];

  async function save(slug: string, title: string, note: string) {
    setMessage("");
    try {
      await savePage({ data: { slug, title, note } });
      await queryClient.invalidateQueries({ queryKey: ["pages"] });
      setMessage("Site page saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save that page.");
    }
  }

  return (
    <section className="mt-8 rounded-3xl bg-card p-4 md:p-6">
      <h2 className="font-display text-3xl">Site</h2>
      <p className="mt-1 text-sm text-mist">Home and every department. Leave a line blank to keep the original.</p>
      <ul className="mt-4 space-y-4">
        {rows.map((row) => {
          const saved = pages.data?.find((page) => page.slug === row.slug);
          return (
            <PageRow
              key={row.slug}
              label={row.label}
              title={saved?.title ?? ""}
              note={saved?.note ?? ""}
              onSave={(title, note) => save(row.slug, title, note)}
            />
          );
        })}
      </ul>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </section>
  );
}

function PageRow({
  label,
  title,
  note,
  onSave,
}: {
  label: string;
  title: string;
  note: string;
  onSave: (title: string, note: string) => void;
}) {
  const [nextTitle, setNextTitle] = useState(title);
  const [nextNote, setNextNote] = useState(note);
  useEffect(() => {
    setNextTitle(title);
    setNextNote(note);
  }, [title, note]);
  return (
    <li className="border-t border-ink/10 pt-3">
      <p className="text-sm font-medium">{label}</p>
      <input
        value={nextTitle}
        maxLength={120}
        placeholder="Title"
        onChange={(event) => setNextTitle(event.target.value)}
        className={inputClass}
      />
      <input
        value={nextNote}
        maxLength={400}
        placeholder="Short line"
        onChange={(event) => setNextNote(event.target.value)}
        className={inputClass}
      />
      <button
        type="button"
        onClick={() => onSave(nextTitle.trim(), nextNote.trim())}
        className="mt-2 h-11 rounded-full bg-ink px-4 text-sm text-paper"
      >
        Save {label}
      </button>
    </li>
  );
}

function PhotoField({
  image,
  onImage,
  onError,
}: {
  image: string;
  onImage: (image: string) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onImage(await compressPhoto(file));
      onError("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not use that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-mist">Photo</p>
      <label className="mt-2 block max-w-xs cursor-pointer">
        <span className="grid aspect-square place-items-center overflow-hidden rounded-3xl border border-dashed border-ink/20 bg-paper">
          {image ? (
            <img src={image} alt="Chosen photo" className="h-full w-full object-cover" />
          ) : (
            <span className="px-6 text-center text-sm text-mist">
              {busy ? "Reading photo…" : "Tap to take a photo"}
            </span>
          )}
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      <label className="mt-3 inline-flex h-11 cursor-pointer items-center text-sm text-clay">
        Upload from gallery
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 960;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not use that photo."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("That file is not a photo."));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm text-mist">
      {label}
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card px-3 py-3">
      <dt className="text-xs text-mist">{label}</dt>
      <dd className="font-display text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
