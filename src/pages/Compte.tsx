import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, BookOpen, ExternalLink, LogOut, Package } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import { useAuth } from "@/auth/AuthProvider";
import { booksData } from "@/data/books";
import { supabase } from "@/lib/supabase";
import { displayStatus, formatLabel, formatPrice, grantsEbook, type Order, type Product } from "@/lib/shop";
import { useMyOrders, useNotifications, useProducts } from "@/shop/useShop";
import { Eyebrow, formatDate, Notice, SecondaryButton, StatusBadge, Title } from "@/shop/ui";
import { PageShell } from "@/shop/ui";
import PasswordForm from "@/shop/PasswordForm";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-body text-xs tracking-[0.3em] uppercase text-bordeaux mb-6">{children}</h2>
);

/** Une entrée par livre numérique possédé (la meilleure commande si plusieurs). */
const libraryOf = (orders: Order[]) => {
  const rank = (o: Order) => (grantsEbook(o) ? 2 : o.status === "refunded" ? 1 : 0);
  const byProduct = new Map<string, Order>();
  for (const o of orders.filter((o) => o.format === "ebook" && o.status !== "failed" && o.status !== "pending")) {
    const current = byProduct.get(o.product_id);
    if (!current || rank(o) > rank(current)) byProduct.set(o.product_id, o);
  }
  return [...byProduct.values()];
};

const LibraryCard = ({ order, product }: { order: Order; product: Product | undefined }) => {
  const book = booksData[order.product_id];
  const status = displayStatus(order, product);
  const readable = status.key === "available";
  return (
    <article className="flex gap-5 p-5 bg-card/60 border border-border rounded-sm">
      {book?.cover && <img src={book.cover} alt="" className="w-20 md:w-24 aspect-[2/3] object-cover rounded-sm shadow-md shrink-0" />}
      <div className="flex flex-col min-w-0">
        <p className="font-display text-2xl text-foreground leading-tight mb-2">{product?.title ?? book?.title}</p>
        <div className="mb-3">
          <StatusBadge status={status} />
        </div>
        {readable ? (
          <Link
            to={`/compte/lire/${order.product_id}`}
            className="mt-auto inline-flex w-fit items-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 bg-bordeaux text-primary-foreground hover:bg-bordeaux/90 transition-colors"
          >
            <BookOpen className="w-4 h-4" /> Lire
          </Link>
        ) : status.key === "preordered" ? (
          <p className="mt-auto font-body text-sm text-muted-foreground">
            Disponible {product?.release_label ? product.release_label.toLowerCase() : "à la sortie"}. Un e-mail vous préviendra.
          </p>
        ) : (
          <p className="mt-auto font-body text-sm text-muted-foreground">Cet achat a été remboursé.</p>
        )}
      </div>
    </article>
  );
};

const Compte = () => {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const orders = useMyOrders(userId);
  const { data: products = [] } = useProducts();
  const notifications = useNotifications(userId);

  const justPaid = params.get("commande");
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState(false);
  useEffect(() => setName(profile?.full_name ?? ""), [profile?.full_name]);

  // Retour de Stripe : la commande arrive par le webhook, parfois quelques secondes après.
  const paidOrderArrived = Boolean(justPaid && orders.data?.some((o) => o.stripe_session_id === justPaid));
  useEffect(() => {
    if (!justPaid || paidOrderArrived) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      queryClient.invalidateQueries({ queryKey: ["orders", userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      if (tries >= 10) window.clearInterval(timer);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [justPaid, paidOrderArrived, queryClient, userId]);

  const productById = (id: string) => products.find((p) => p.id === id);
  const library = libraryOf(orders.data ?? []);
  const unread = (notifications.data ?? []).filter((n) => !n.read_at);

  const markRead = async (id?: string) => {
    const query = supabase!.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId!).is("read_at", null);
    await (id ? query.eq("id", id) : query);
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase!.from("profiles").update({ full_name: name.trim() || null }).eq("id", userId!);
    await refreshProfile();
    setSavedName(true);
    window.setTimeout(() => setSavedName(false), 2500);
  };

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <PageShell>
      <FadeIn>
        <Eyebrow>Mon espace</Eyebrow>
        <Title>{firstName ? `Bonjour ${firstName}` : "Bienvenue"}</Title>
      </FadeIn>

      {justPaid && (
        <div className="mb-10">
          <Notice tone="success">
            <strong className="font-medium">Merci pour votre commande.</strong>{" "}
            {paidOrderArrived
              ? "Votre paiement est confirmé et un e-mail de confirmation vous a été envoyé."
              : "Votre paiement est en cours d'enregistrement : il apparaîtra ci-dessous dans quelques instants."}
            <button onClick={() => setParams({}, { replace: true })} className="ml-2 underline underline-offset-2">
              Fermer
            </button>
          </Notice>
        </div>
      )}

      {unread.length > 0 && (
        <FadeIn className="mb-14">
          <div className="border border-bordeaux/25 bg-cream rounded-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-bordeaux/15">
              <p className="flex items-center gap-2 font-body text-xs tracking-[0.25em] uppercase text-bordeaux">
                <Bell className="w-4 h-4" /> Nouveautés
              </p>
              <button onClick={() => markRead()} className="font-body text-xs text-muted-foreground hover:text-foreground">
                Tout marquer comme lu
              </button>
            </div>
            <ul>
              {unread.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-4 px-5 py-4 border-b border-bordeaux/10 last:border-0">
                  <div>
                    <p className="font-display text-lg text-foreground">{n.title}</p>
                    {n.body && <p className="font-body text-sm text-muted-foreground">{n.body}</p>}
                    <p className="font-body text-xs text-muted-foreground/70 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {n.link && n.link !== "/compte" && (
                      <Link to={n.link} onClick={() => markRead(n.id)} className="font-body text-xs tracking-[0.2em] uppercase text-bordeaux hover:underline">
                        Ouvrir
                      </Link>
                    )}
                    <button onClick={() => markRead(n.id)} className="font-body text-xs text-muted-foreground hover:text-foreground" aria-label="Marquer comme lu">
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      )}

      <FadeIn className="mb-16">
        <SectionTitle>Ma bibliothèque</SectionTitle>
        {orders.isLoading ? (
          <p className="font-body text-sm text-muted-foreground">Chargement…</p>
        ) : library.length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-sm text-center">
            <BookOpen className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground mb-5">Vos ebooks apparaîtront ici.</p>
            <Link to="/livres/hybris/precommander" className="font-body text-xs tracking-[0.2em] uppercase text-bordeaux hover:underline">
              Découvrir Hybris
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {library.map((o) => (
              <LibraryCard key={o.id} order={o} product={productById(o.product_id)} />
            ))}
          </div>
        )}
      </FadeIn>

      <FadeIn className="mb-16">
        <SectionTitle>Mes commandes</SectionTitle>
        {orders.data && orders.data.length === 0 && (
          <p className="font-body text-sm text-muted-foreground">
            Aucune commande pour le moment. Vous avez commandé avec une autre adresse e-mail ? Connectez-vous avec celle-ci pour la retrouver.
          </p>
        )}
        <ul className="divide-y divide-border border-y border-border">
          {(orders.data ?? []).map((o) => {
            const product = productById(o.product_id);
            return (
              <li key={o.id} className="py-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex gap-4 items-start">
                  {o.format === "paper" ? (
                    <Package className="w-5 h-5 mt-1 text-muted-foreground shrink-0" />
                  ) : (
                    <BookOpen className="w-5 h-5 mt-1 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="font-display text-xl text-foreground">
                      {product?.title ?? o.product_id} — {formatLabel(o.format)}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {formatDate(o.paid_at ?? o.created_at)} · {formatPrice(o.amount_total_cents, o.currency)}
                      {o.shipping_cents > 0 && ` dont ${formatPrice(o.shipping_cents, o.currency)} de livraison`}
                      {o.amount_refunded_cents > 0 && ` · ${formatPrice(o.amount_refunded_cents, o.currency)} remboursés`}
                    </p>
                    {o.format === "paper" && o.dedication && (
                      <p className="font-body text-xs text-muted-foreground mt-1">Dédicace pour : {o.dedication}</p>
                    )}
                    {o.status === "failed" && (
                      <Link to={`/livres/${o.product_id}/precommander`} className="inline-block mt-2 font-body text-xs text-bordeaux underline underline-offset-2">
                        Recommencer la commande
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:justify-end pl-9 sm:pl-0">
                  <StatusBadge status={displayStatus(o, product)} />
                  {o.receipt_url && (
                    <a
                      href={o.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-body text-xs text-muted-foreground hover:text-foreground"
                    >
                      Reçu <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </FadeIn>

      <FadeIn>
        <SectionTitle>Mon profil</SectionTitle>
        <form onSubmit={saveName} className="grid sm:grid-cols-[1fr_auto] gap-3 items-end max-w-xl mb-6">
          <label className="block">
            <span className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Nom</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:border-bordeaux"
            />
          </label>
          <SecondaryButton type="submit">{savedName ? "Enregistré" : "Enregistrer"}</SecondaryButton>
        </form>
        <p className="font-body text-sm text-muted-foreground mb-8">E-mail : {session?.user.email}</p>
        <PasswordForm />
        <div className="flex flex-wrap gap-3">
          <SecondaryButton onClick={signOut}>
            <LogOut className="w-4 h-4" /> Se déconnecter
          </SecondaryButton>
          {profile?.is_admin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 border border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-primary-foreground transition-colors"
            >
              Administration
            </Link>
          )}
        </div>
      </FadeIn>
    </PageShell>
  );
};

export default Compte;
