import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Mail, Package, Search, Upload } from "lucide-react";
import { callApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { displayStatus, formatLabel, formatPrice, type Format, type Order, type Product } from "@/lib/shop";
import { useProducts } from "@/shop/useShop";
import { Eyebrow, formatDate, Notice, PageShell, PrimaryButton, SecondaryButton, StatusBadge, Title } from "@/shop/ui";

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

const useAllOrders = () =>
  useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase!.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

const useProfiles = () =>
  useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase!.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProfileRow[];
    },
  });

const inputClass =
  "w-full px-3 py-2 bg-background border border-border rounded-sm font-body text-sm text-foreground focus:outline-none focus:border-bordeaux";

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block font-body text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5">{label}</span>
    {children}
    {hint && <span className="block font-body text-xs text-muted-foreground/80 mt-1">{hint}</span>}
  </label>
);

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="p-4 bg-card/60 border border-border rounded-sm">
    <p className="font-body text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1">{label}</p>
    <p className="font-display text-2xl text-foreground">{value}</p>
  </div>
);

const addressLines = (o: Order) => {
  const a = o.shipping_address;
  if (!a) return [];
  return [a.name, a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.country].filter(Boolean) as string[];
};

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const downloadCsv = (orders: Order[], products: Product[]) => {
  const header = ["Date", "E-mail", "Nom", "Livre", "Format", "Statut", "Montant", "Port", "Remboursé", "Dédicace", "Adresse", "Expédié le"];
  const rows = orders.map((o) => [
    formatDate(o.paid_at ?? o.created_at),
    o.email,
    o.customer_name,
    products.find((p) => p.id === o.product_id)?.title ?? o.product_id,
    formatLabel(o.format),
    displayStatus(o, products.find((p) => p.id === o.product_id)).label,
    (o.amount_total_cents / 100).toFixed(2).replace(".", ","),
    (o.shipping_cents / 100).toFixed(2).replace(".", ","),
    (o.amount_refunded_cents / 100).toFixed(2).replace(".", ","),
    o.dedication,
    addressLines(o).join(", "),
    o.shipped_at ? formatDate(o.shipped_at) : "",
  ]);
  // Point-virgule et BOM : Excel en français l'ouvre directement avec les accents.
  const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `commandes-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------
const OrdersTab = () => {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useAllOrders();
  const { data: products = [] } = useProducts();
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState<"" | Format>("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (!format || o.format === format) &&
          (!status || o.status === status || (status === "to_ship" && o.format === "paper" && o.status === "paid" && !o.shipped_at)) &&
          (!search || `${o.email} ${o.customer_name ?? ""}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [orders, format, status, search],
  );

  const paid = orders.filter((o) => o.status === "paid" || o.status === "partially_refunded");
  const revenue = paid.reduce((s, o) => s + o.amount_total_cents - o.amount_refunded_cents, 0);

  const update = async (id: string, patch: Partial<Order>) => {
    const { error } = await supabase!.from("orders").update(patch).eq("id", id);
    if (error) alert(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Commandes payées" value={paid.length} />
        <Stat label="Ebooks" value={paid.filter((o) => o.format === "ebook").length} />
        <Stat label="Livres papier" value={paid.filter((o) => o.format === "paper").length} />
        <Stat label="Encaissé" value={formatPrice(revenue)} />
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un e-mail ou un nom" className={`${inputClass} pl-9`} />
        </div>
        <select value={format} onChange={(e) => setFormat(e.target.value as "" | Format)} className={`${inputClass} md:w-44`}>
          <option value="">Tous les formats</option>
          <option value="ebook">Ebook</option>
          <option value="paper">Livre papier</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} md:w-48`}>
          <option value="">Tous les statuts</option>
          <option value="to_ship">À expédier</option>
          <option value="paid">Payées</option>
          <option value="pending">En attente</option>
          <option value="failed">Échouées</option>
          <option value="partially_refunded">Remboursées en partie</option>
          <option value="refunded">Remboursées</option>
        </select>
        <SecondaryButton onClick={() => downloadCsv(filtered, products)} disabled={!filtered.length}>
          <Download className="w-4 h-4" /> CSV
        </SecondaryButton>
      </div>

      {isLoading ? (
        <p className="font-body text-sm text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">Aucune commande.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {filtered.map((o) => {
            const product = products.find((p) => p.id === o.product_id);
            const expanded = open === o.id;
            return (
              <li key={o.id} className="py-4">
                <button onClick={() => setOpen(expanded ? null : o.id)} className="w-full text-left grid gap-2 md:grid-cols-[7.5rem_minmax(0,1fr)_10rem_6rem_13rem] md:items-center md:gap-4">
                  <span className="font-body text-xs text-muted-foreground">{formatDate(o.paid_at ?? o.created_at)}</span>
                  <span className="min-w-0">
                    <span className="block font-body text-sm text-foreground truncate">{o.customer_name || o.email}</span>
                    {o.customer_name && <span className="block font-body text-xs text-muted-foreground truncate">{o.email}</span>}
                  </span>
                  <span className="font-body text-sm text-foreground">
                    {product?.title ?? o.product_id} · {formatLabel(o.format)}
                  </span>
                  <span className="font-body text-sm text-foreground">{formatPrice(o.amount_total_cents, o.currency)}</span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={displayStatus(o, product)} />
                    {!o.user_id && <span className="font-body text-[10px] text-muted-foreground" title="Pas encore de compte client">sans compte</span>}
                  </span>
                </button>

                {expanded && (
                  <div className="mt-4 p-4 bg-cream/60 border border-border rounded-sm grid gap-4 md:grid-cols-3 font-body text-sm">
                    <div>
                      <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Détails</p>
                      <p>Source : {o.source === "import" ? "importée de Stripe" : "boutique"}</p>
                      {o.shipping_cents > 0 && <p>Port : {formatPrice(o.shipping_cents)}</p>}
                      {o.amount_refunded_cents > 0 && <p>Remboursé : {formatPrice(o.amount_refunded_cents)}</p>}
                      {o.availability_notified_at && <p>Sortie annoncée le {formatDate(o.availability_notified_at)}</p>}
                      {o.receipt_url && (
                        <a href={o.receipt_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                          Reçu Stripe
                        </a>
                      )}
                    </div>
                    {o.format === "paper" && (
                      <div>
                        <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Envoi</p>
                        {addressLines(o).map((l) => (
                          <p key={l}>{l}</p>
                        ))}
                        {o.dedication && <p className="mt-2">Dédicace : « {o.dedication} »</p>}
                      </div>
                    )}
                    <div className="flex flex-col gap-2 items-start">
                      <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Actions</p>
                      {o.format === "paper" && (o.status === "paid" || o.status === "partially_refunded") && (
                        <SecondaryButton onClick={() => update(o.id, { shipped_at: o.shipped_at ? null : new Date().toISOString() })}>
                          <Package className="w-4 h-4" /> {o.shipped_at ? "Annuler « expédié »" : "Marquer expédié"}
                        </SecondaryButton>
                      )}
                      {o.source === "import" && (
                        <Field label="Format (commande importée)">
                          <select value={o.format} onChange={(e) => update(o.id, { format: e.target.value as Format })} className={inputClass}>
                            <option value="ebook">Ebook</option>
                            <option value="paper">Livre papier</option>
                          </select>
                        </Field>
                      )}
                      <p className="text-xs text-muted-foreground">Remboursement : depuis le tableau de bord Stripe ; le statut se met à jour tout seul.</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
const CustomersTab = () => {
  const { data: profiles = [] } = useProfiles();
  const { data: orders = [] } = useAllOrders();
  const [search, setSearch] = useState("");

  // Un client = une adresse e-mail, avec ou sans compte.
  const customers = useMemo(() => {
    const map = new Map<string, { email: string; name: string | null; account: ProfileRow | null; orders: Order[] }>();
    for (const p of profiles) map.set(p.email.toLowerCase(), { email: p.email, name: p.full_name, account: p, orders: [] });
    for (const o of orders) {
      const key = o.email.toLowerCase();
      const c = map.get(key) ?? { email: o.email, name: o.customer_name, account: null, orders: [] };
      c.name ??= o.customer_name;
      c.orders.push(o);
      map.set(key, c);
    }
    return [...map.values()]
      .filter((c) => !search || `${c.email} ${c.name ?? ""}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.orders.length - a.orders.length);
  }, [profiles, orders, search]);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Stat label="Clients" value={customers.length} />
        <Stat label="Avec un compte" value={profiles.length} />
        <Stat label="Sans compte" value={customers.filter((c) => !c.account).length} />
      </div>
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher" className={`${inputClass} pl-9`} />
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {customers.map((c) => {
          const spent = c.orders
            .filter((o) => o.status === "paid" || o.status === "partially_refunded")
            .reduce((s, o) => s + o.amount_total_cents - o.amount_refunded_cents, 0);
          return (
            <li key={c.email} className="py-4 grid gap-1 md:grid-cols-[1fr_10rem_8rem_8rem] md:items-center font-body text-sm">
              <span className="min-w-0">
                <span className="block text-foreground truncate">{c.name || c.email}</span>
                {c.name && <span className="block text-xs text-muted-foreground truncate">{c.email}</span>}
              </span>
              <span className="text-xs text-muted-foreground">
                {c.account ? `Compte depuis le ${formatDate(c.account.created_at)}` : "Sans compte"}
                {c.account?.is_admin && " · admin"}
              </span>
              <span className="text-muted-foreground">
                {c.orders.length} commande{c.orders.length > 1 ? "s" : ""}
              </span>
              <span className="text-foreground">{formatPrice(spent)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Livres : sortie, disponibilité, fichier, prix, e-mail de disponibilité
// ---------------------------------------------------------------------------
const euros = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(2).replace(".", ","));
const cents = (value: string) => {
  const v = value.trim().replace(",", ".");
  return v === "" ? null : Math.round(Number(v) * 100);
};

const ProductEditor = ({ product }: { product: Product }) => {
  const queryClient = useQueryClient();
  const { data: orders = [] } = useAllOrders();
  const [form, setForm] = useState({
    release_label: product.release_label,
    release_date: product.release_date ?? "",
    ebook_status: product.ebook_status,
    ebook_price: euros(product.ebook_price_cents),
    paper_price: euros(product.paper_price_cents),
    shipping_fr: euros(product.shipping_fr_cents),
    shipping_eu: euros(product.shipping_eu_cents),
  });
  const [message, setMessage] = useState<{ tone: "success" | "danger" | "neutral"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const ebookBuyers = orders.filter((o) => o.product_id === product.id && o.format === "ebook" && (o.status === "paid" || o.status === "partially_refunded"));
  const toNotify = ebookBuyers.filter((o) => !o.availability_notified_at).length;
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const ebookPrice = cents(form.ebook_price);
    if (!ebookPrice || ebookPrice <= 0) return setMessage({ tone: "danger", text: "Le prix de l'ebook est obligatoire." });
    if (form.ebook_status === "available" && !product.ebook_file_path)
      return setMessage({ tone: "danger", text: "Déposez d'abord le fichier de l'ebook avant de le rendre disponible." });
    setBusy(true);
    const { error } = await supabase!
      .from("products")
      .update({
        release_label: form.release_label.trim(),
        release_date: form.release_date || null,
        ebook_status: form.ebook_status,
        ebook_price_cents: ebookPrice,
        paper_price_cents: cents(form.paper_price),
        shipping_fr_cents: cents(form.shipping_fr),
        shipping_eu_cents: cents(form.shipping_eu),
      })
      .eq("id", product.id);
    setBusy(false);
    setMessage(error ? { tone: "danger", text: error.message } : { tone: "success", text: "Enregistré." });
    refresh();
  };

  const upload = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "epub") return setMessage({ tone: "danger", text: "Format accepté : PDF ou ePub." });
    setBusy(true);
    setMessage({ tone: "neutral", text: "Envoi du fichier…" });
    const path = `${product.id}/${product.id}.${ext}`;
    const { error } = await supabase!.storage.from("ebooks").upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (!error) await supabase!.from("products").update({ ebook_file_path: path }).eq("id", product.id);
    setBusy(false);
    setMessage(error ? { tone: "danger", text: error.message } : { tone: "success", text: `Fichier enregistré (${path}).` });
    refresh();
  };

  const notify = async () => {
    if (!confirm(`Envoyer l'e-mail « ${product.title} est disponible » à ${toNotify} acheteur${toNotify > 1 ? "s" : ""} ?`)) return;
    setBusy(true);
    let total = 0;
    const failures: string[] = [];
    try {
      // Par lots : on rappelle tant qu'il reste des acheteurs à prévenir.
      for (;;) {
        const r = await callApi<{ sent: number; remaining: number; failures: string[] }>("admin", { action: "notify-availability", productId: product.id });
        total += r.sent;
        failures.push(...r.failures);
        setMessage({ tone: "neutral", text: `${total} e-mail${total > 1 ? "s" : ""} envoyé${total > 1 ? "s" : ""}…` });
        if (r.remaining === 0 || r.sent === 0) break;
      }
      setMessage(
        failures.length
          ? { tone: "danger", text: `${total} envoyés, ${failures.length} en échec : ${failures.join(" ; ")}` }
          : { tone: "success", text: `${total} acheteur${total > 1 ? "s" : ""} prévenu${total > 1 ? "s" : ""}.` },
      );
    } catch (e) {
      setMessage({ tone: "danger", text: e instanceof Error ? e.message : String(e) });
    }
    setBusy(false);
    refresh();
  };

  return (
    <section className="p-6 md:p-8 bg-card/50 border border-border rounded-sm mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className="font-display text-3xl text-foreground">{product.title}</h3>
        <StatusBadge
          status={product.ebook_status === "available" ? { key: "available", label: "Ebook disponible", tone: "success" } : { key: "preordered", label: "En précommande", tone: "neutral" }}
        />
      </div>

      <form onSubmit={save} className="grid gap-5 md:grid-cols-2 mb-8">
        <Field label="Sortie (texte affiché)" hint="Ex. « Début 2027 », « 15 mars 2027 »">
          <input value={form.release_label} onChange={set("release_label")} className={inputClass} />
        </Field>
        <Field label="Date de sortie précise" hint="Facultatif, pour vous">
          <input type="date" value={form.release_date} onChange={set("release_date")} className={inputClass} />
        </Field>
        <Field label="Ebook" hint="« Disponible » ouvre la lecture aux acheteurs (sans les prévenir)">
          <select value={form.ebook_status} onChange={set("ebook_status")} className={inputClass}>
            <option value="preorder">En précommande</option>
            <option value="available">Disponible</option>
          </select>
        </Field>
        <Field label="Prix de l'ebook (€)">
          <input inputMode="decimal" value={form.ebook_price} onChange={set("ebook_price")} className={inputClass} />
        </Field>
        <Field label="Prix du livre papier (€)" hint="Vide = pas de version papier">
          <input inputMode="decimal" value={form.paper_price} onChange={set("paper_price")} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Port France (€)" hint="Vide = fermé">
            <input inputMode="decimal" value={form.shipping_fr} onChange={set("shipping_fr")} className={inputClass} />
          </Field>
          <Field label="Port Europe (€)" hint="Vide = fermé">
            <input inputMode="decimal" value={form.shipping_eu} onChange={set("shipping_eu")} className={inputClass} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <PrimaryButton type="submit" disabled={busy}>
            Enregistrer
          </PrimaryButton>
        </div>
      </form>

      <div className="grid gap-6 md:grid-cols-2 border-t border-border pt-6">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Fichier de l'ebook</p>
          <p className="font-body text-sm text-foreground mb-3">{product.ebook_file_path ?? "Aucun fichier pour l'instant."}</p>
          <label className="inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 border border-border hover:border-bordeaux hover:text-bordeaux cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> {product.ebook_file_path ? "Remplacer" : "Déposer"} (PDF ou ePub)
            <input type="file" accept=".pdf,.epub" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          <p className="font-body text-xs text-muted-foreground mt-2">Le PDF se lit directement sur le site ; l'ePub se télécharge.</p>
        </div>
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Prévenir les acheteurs</p>
          <p className="font-body text-sm text-foreground mb-3">
            {ebookBuyers.length} acheteur{ebookBuyers.length > 1 ? "s" : ""} de l'ebook · {toNotify} à prévenir
          </p>
          <PrimaryButton onClick={notify} disabled={busy || product.ebook_status !== "available" || !product.ebook_file_path || toNotify === 0}>
            <Mail className="w-4 h-4" /> Envoyer l'e-mail de disponibilité
          </PrimaryButton>
          <p className="font-body text-xs text-muted-foreground mt-2">
            Envoie un e-mail et une notification dans l'espace client. Chaque acheteur n'est prévenu qu'une fois.
          </p>
        </div>
      </div>

      {message && (
        <div className="mt-6">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
    </section>
  );
};

const BooksTab = () => {
  const { data: products = [] } = useProducts();
  return (
    <div>
      {products.map((p) => (
        <ProductEditor key={`${p.id}-${p.updated_at}`} product={p} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Invitation des acheteurs des anciennes précommandes
// ---------------------------------------------------------------------------
const WelcomeSection = () => {
  const queryClient = useQueryClient();
  const pending = useQuery({
    queryKey: ["admin", "welcome-list"],
    queryFn: () =>
      callApi<{ people: { email: string; name: string | null; paid_cents: number; orders: number }[] }>("admin", { action: "welcome-list" }),
  });
  const people = pending.data?.people ?? [];
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger" | "neutral"; text: string } | null>(null);
  const count = people.length;

  const preview = async () => {
    setBusy(true);
    try {
      const r = await callApi<{ sent: string }>("admin", { action: "welcome-preview" });
      setMessage({ tone: "success", text: `Aperçu envoyé à ${r.sent}. Vérifiez votre boîte (et les indésirables).` });
    } catch (e) {
      setMessage({ tone: "danger", text: e instanceof Error ? e.message : String(e) });
    }
    setBusy(false);
  };

  const send = async () => {
    if (!confirm(`Envoyer l'e-mail « Votre espace vous attend » à ${count} personne${count > 1 ? "s" : ""} ?`)) return;
    setBusy(true);
    let total = 0;
    const failures: string[] = [];
    try {
      for (;;) {
        const r = await callApi<{ sent: number; remaining: number; failures: string[] }>("admin", { action: "welcome" });
        total += r.sent;
        failures.push(...r.failures);
        setMessage({ tone: "neutral", text: `${total} e-mail${total > 1 ? "s" : ""} envoyé${total > 1 ? "s" : ""}…` });
        if (r.remaining === 0 || r.sent === 0) break;
      }
      setMessage(
        failures.length
          ? { tone: "danger", text: `${total} envoyés, ${failures.length} en échec : ${failures.join(" ; ")}` }
          : { tone: "success", text: `${total} personne${total > 1 ? "s" : ""} invitée${total > 1 ? "s" : ""}.` },
      );
    } catch (e) {
      setMessage({ tone: "danger", text: e instanceof Error ? e.message : String(e) });
    }
    setBusy(false);
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  return (
    <section className="p-6 md:p-8 bg-card/50 border border-border rounded-sm">
      <h3 className="font-display text-2xl text-foreground mb-2">Inviter les premiers acheteurs</h3>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Envoie un e-mail « Votre espace vous attend » aux personnes qui ont payé le livre papier de Hybris avec l'ancien lien Stripe (commandes
        importées et payées uniquement : jamais les appels, la formation ni les commandes remboursées). Une seule fois par personne. Vérifiez la
        liste ci-dessous avant d'envoyer.
      </p>
      <p className="font-body text-sm text-foreground mb-3">
        {pending.isLoading ? "Calcul…" : pending.isError ? "Liste indisponible." : `${count} personne${count > 1 ? "s" : ""} à inviter`}
      </p>
      {count > 0 && (
        <ul className="mb-6 max-h-72 overflow-y-auto divide-y divide-border border-y border-border font-body text-sm">
          {people.map((p) => (
            <li key={p.email} className="py-2 flex justify-between gap-4">
              <span className="min-w-0 truncate">
                {p.name ? `${p.name} · ` : ""}
                <span className="text-muted-foreground">{p.email}</span>
              </span>
              <span className="shrink-0 text-foreground">
                {formatPrice(p.paid_cents)}
                {p.orders > 1 && <span className="text-muted-foreground"> ({p.orders} commandes)</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3">
        <SecondaryButton onClick={preview} disabled={busy}>
          M'envoyer un aperçu
        </SecondaryButton>
        <PrimaryButton onClick={send} disabled={busy || count === 0}>
          <Mail className="w-4 h-4" /> Envoyer l'invitation
        </PrimaryButton>
      </div>
      {message && (
        <div className="mt-6">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Outils : import des anciennes précommandes, test des e-mails
// ---------------------------------------------------------------------------
const ToolsTab = () => {
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const [link, setLink] = useState("https://buy.stripe.com/3cIbJ2abCdVW7reb4Gfw402");
  const [productId, setProductId] = useState("hybris");
  const [format, setFormat] = useState<"auto" | Format>("auto");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const run = async (body: Record<string, string>, ok: (r: Record<string, unknown>) => string) => {
    setBusy(true);
    setMessage(null);
    try {
      const r = await callApi<Record<string, unknown>>("admin", body);
      setMessage({ tone: "success", text: ok(r) });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      setMessage({ tone: "danger", text: e instanceof Error ? e.message : String(e) });
    }
    setBusy(false);
  };

  return (
    <div className="grid gap-8">
      <section className="p-6 md:p-8 bg-card/50 border border-border rounded-sm">
        <h3 className="font-display text-2xl text-foreground mb-2">Importer d'anciennes précommandes</h3>
        <p className="font-body text-sm text-muted-foreground mb-6">
          Récupère les paiements faits avec un lien Stripe (buy.stripe.com/…) avant l'ouverture de la boutique. Les clients les retrouvent en se
          connectant avec le même e-mail. Aucun e-mail ne leur est envoyé. Vous pouvez relancer l'import sans risque de doublon.
        </p>
        <div className="grid gap-4 md:grid-cols-[1fr_10rem_12rem_auto] md:items-end">
          <Field label="Lien de paiement">
            <input value={link} onChange={(e) => setLink(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Livre">
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Format">
            <select value={format} onChange={(e) => setFormat(e.target.value as "auto" | Format)} className={inputClass}>
              <option value="auto">Deviner (adresse = papier)</option>
              <option value="paper">Livre papier</option>
              <option value="ebook">Ebook</option>
            </select>
          </Field>
          <PrimaryButton
            disabled={busy || !link}
            onClick={() =>
              run({ action: "import-stripe", paymentLinkUrl: link, productId, format }, (r) => `${r.imported} commande(s) importée(s), ${r.skipped} ignorée(s).`)
            }
          >
            Importer
          </PrimaryButton>
        </div>
      </section>

      <WelcomeSection />

      <section className="p-6 md:p-8 bg-card/50 border border-border rounded-sm">
        <h3 className="font-display text-2xl text-foreground mb-2">Tester les e-mails</h3>
        <p className="font-body text-sm text-muted-foreground mb-6">Vous envoie un e-mail d'essai, pour vérifier la configuration de Brevo.</p>
        <SecondaryButton disabled={busy} onClick={() => run({ action: "test-email" }, (r) => `E-mail envoyé à ${r.sent}.`)}>
          <Mail className="w-4 h-4" /> M'envoyer un e-mail d'essai
        </SecondaryButton>
      </section>

      {message && <Notice tone={message.tone}>{message.text}</Notice>}
    </div>
  );
};

const tabs = [
  { id: "orders", label: "Commandes", Component: OrdersTab },
  { id: "customers", label: "Clients", Component: CustomersTab },
  { id: "books", label: "Livres", Component: BooksTab },
  { id: "tools", label: "Outils", Component: ToolsTab },
] as const;

const Admin = () => {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("orders");
  const Current = tabs.find((t) => t.id === tab)!.Component;
  return (
    <PageShell wide>
      <Eyebrow>Administration</Eyebrow>
      <Title>Boutique</Title>
      <div role="tablist" className="flex gap-1 border-b border-border mb-10 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 -mb-px border-b-2 font-body text-xs tracking-[0.2em] uppercase whitespace-nowrap transition-colors ${
              tab === t.id ? "border-bordeaux text-bordeaux" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Current />
    </PageShell>
  );
};

export default Admin;
