import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, ChevronDown, Lock, Package } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import { booksData } from "@/data/books";
import { callApi } from "@/lib/api";
import { formatPrice, priceFor, shippingFor, type Format, type ShippingZone } from "@/lib/shop";
import { useAuth } from "@/auth/AuthProvider";
import { useProduct } from "@/shop/useShop";
import { Eyebrow, Notice, PageShell, PrimaryButton } from "@/shop/ui";
import NotFound from "./NotFound";

const formats: { id: Format; label: string; icon: typeof Package; perks: string[] }[] = [
  {
    id: "paper",
    label: "Livre papier",
    icon: Package,
    perks: ["Exemplaire imprimé, expédié à la sortie", "Dédicace personnalisée offerte aux 100 premiers", "Suivi de la commande dans votre espace"],
  },
  {
    id: "ebook",
    label: "Ebook",
    icon: BookOpen,
    perks: ["Lecture en ligne dans votre espace", "Téléchargement sécurisé", "Disponible le jour de la sortie"],
  },
];

const Precommande = () => {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const book = booksData[slug];
  const { product, isLoading } = useProduct(slug);
  const { session } = useAuth();

  const [chosenFormat, setFormat] = useState<Format | null>(null);
  const [zone, setZone] = useState<ShippingZone>("fr");
  const [accepted, setAccepted] = useState(false);
  const [showExtract, setShowExtract] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!book || (!product && !isLoading)) return <NotFound />;
  if (!product) {
    return (
      <PageShell>
        <p className="font-body text-sm text-muted-foreground">Chargement…</p>
      </PageShell>
    );
  }

  // Par défaut le livre papier s'il existe, sinon l'ebook (ex. Chaton, vendu seulement en ebook).
  const format: Format = chosenFormat ?? (product.paper_price_cents ? "paper" : "ebook");
  const price = priceFor(product, format) ?? 0;
  const shipping = format === "paper" ? shippingFor(product, zone) : 0;
  const shippingOpen = format === "ebook" || shipping != null;
  const preorder = format === "paper" || product.ebook_status === "preorder";
  const extract = book.insidePages ?? [];

  const checkout = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { url } = await callApi<{ url: string }>("checkout", { productId: product.id, format, zone: format === "paper" ? zone : undefined });
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  };

  return (
    <PageShell wide>
      <Link
        to={`/livres/${slug}`}
        className="inline-flex items-center gap-2 mb-10 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {book.title}
      </Link>

      {params.get("annule") && (
        <div className="mb-10">
          <Notice>Paiement annulé : rien n'a été débité. Vous pouvez reprendre quand vous voulez.</Notice>
        </div>
      )}

      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-12 lg:gap-20 items-start">
        {/* Couverture */}
        <FadeIn className="md:sticky md:top-32">
          {book.cover && (
            <img src={book.cover} alt={`Couverture de ${book.title}`} className="w-full max-w-[13rem] md:max-w-sm mx-auto rounded shadow-2xl" />
          )}
        </FadeIn>

        {/* Offre */}
        <FadeIn delay={0.1}>
          <Eyebrow>{preorder ? "Précommande" : "Disponible"} · Roman</Eyebrow>
          <h1 className="font-display text-4xl md:text-6xl font-light text-foreground mb-3">{book.title}</h1>
          <p className="font-body text-sm text-muted-foreground mb-8">
            Sortie prévue : <span className="text-foreground">{product.release_label || "bientôt"}</span>
          </p>
          <p className="font-body text-base leading-[1.9] text-muted-foreground mb-10">{book.synopsis[0]}</p>

          <fieldset className="mb-8">
            <legend className="font-body text-xs tracking-[0.3em] uppercase text-bordeaux mb-4">Choisissez votre format</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              {formats
                .filter((f) => priceFor(product, f.id))
                .map((f) => {
                  const selected = format === f.id;
                  return (
                    <label
                      key={f.id}
                      className={`relative block cursor-pointer p-5 border rounded-sm transition-colors ${
                        selected ? "border-bordeaux bg-cream shadow-[0_10px_30px_-20px_hsl(var(--bordeaux)/0.6)]" : "border-border bg-card/50 hover:border-bordeaux/40"
                      }`}
                    >
                      <input type="radio" name="format" value={f.id} checked={selected} onChange={() => setFormat(f.id)} className="sr-only" />
                      <div className="flex items-start justify-between mb-3">
                        <f.icon className={`w-5 h-5 ${selected ? "text-bordeaux" : "text-muted-foreground"}`} />
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${selected ? "border-bordeaux bg-bordeaux" : "border-border"}`}
                          aria-hidden
                        >
                          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </span>
                      </div>
                      <p className="font-display text-xl text-foreground">{f.label}</p>
                      <p className="font-display text-2xl text-foreground mt-1 mb-3">
                        {formatPrice(priceFor(product, f.id)!)}
                        {f.id === "paper" && <span className="font-body text-xs text-muted-foreground"> + port</span>}
                      </p>
                      <ul className="space-y-1.5">
                        {f.perks.map((perk) => (
                          <li key={perk} className="flex gap-2 font-body text-xs leading-snug text-muted-foreground">
                            <Check className="w-3.5 h-3.5 mt-px shrink-0 text-vert-antique" />
                            {perk}
                          </li>
                        ))}
                      </ul>
                    </label>
                  );
                })}
            </div>
          </fieldset>

          {format === "paper" && (
            <fieldset className="mb-8">
              <legend className="font-body text-xs tracking-[0.3em] uppercase text-bordeaux mb-4">Livraison</legend>
              <div className="flex flex-col sm:flex-row gap-3">
                {(["fr", "eu"] as const).map((z) => {
                  const cost = shippingFor(product, z);
                  return (
                    <label
                      key={z}
                      className={`flex-1 flex items-center justify-between gap-3 px-4 py-3 border rounded-sm font-body text-sm ${
                        cost == null ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      } ${zone === z ? "border-bordeaux bg-cream" : "border-border"}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <input type="radio" name="zone" value={z} checked={zone === z} disabled={cost == null} onChange={() => setZone(z)} className="accent-[hsl(var(--bordeaux))]" />
                        {z === "fr" ? "France" : "Union européenne"}
                      </span>
                      <span className="text-muted-foreground">{cost == null ? "bientôt" : formatPrice(cost)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="border-t border-border pt-6 mb-6">
            <div className="flex items-baseline justify-between mb-6">
              <span className="font-body text-sm tracking-[0.2em] uppercase text-muted-foreground">Total</span>
              <span className="font-display text-3xl text-foreground">{formatPrice(price + (shipping ?? 0))}</span>
            </div>

            <label className="flex items-start gap-3 mb-6 cursor-pointer font-body text-sm leading-relaxed text-muted-foreground">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 accent-[hsl(var(--bordeaux))]"
              />
              <span>
                J'accepte les{" "}
                <Link to="/cgv" target="_blank" className="underline underline-offset-2 hover:text-foreground">
                  conditions générales de vente
                </Link>
                {format === "ebook" &&
                  ". Je demande à accéder à l'ebook dès sa sortie et reconnais perdre mon droit de rétractation à partir de ce moment"}
                .
              </span>
            </label>

            {error && (
              <div className="mb-4">
                <Notice tone="danger">{error}</Notice>
              </div>
            )}

            <PrimaryButton onClick={checkout} disabled={!accepted || submitting || !shippingOpen} className="w-full py-4">
              {submitting ? "Redirection vers le paiement…" : `${preorder ? "Précommander" : "Acheter"} · ${formatPrice(price + (shipping ?? 0))}`}
            </PrimaryButton>

            <p className="mt-4 flex items-center justify-center gap-2 font-body text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" /> Paiement sécurisé par Stripe
            </p>
            <p className="mt-4 font-body text-xs leading-relaxed text-muted-foreground text-center">
              {session
                ? `La commande sera ajoutée à votre espace (${session.user.email}).`
                : "Votre espace client est créé avec l'e-mail saisi au paiement : connectez-vous ensuite avec la même adresse pour retrouver votre achat."}
            </p>
          </div>
        </FadeIn>
      </div>

      {/* Résumé et extrait */}
      <div className="max-w-3xl mx-auto mt-24">
        <FadeIn>
          <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-6">Résumé</h2>
          <div className="space-y-4 mb-16">
            {book.synopsis.map((p, i) => (
              <p key={i} className="font-body text-base leading-[1.9] text-muted-foreground">
                {p}
              </p>
            ))}
          </div>
        </FadeIn>

        {extract.length > 0 && (
          <FadeIn>
            <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-6">Extrait</h2>
            <button
              onClick={() => setShowExtract((s) => !s)}
              aria-expanded={showExtract}
              className="inline-flex items-center gap-2 font-body text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-bordeaux transition-colors mb-8"
            >
              {showExtract ? "Refermer l'extrait" : "Lire les premières pages"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showExtract ? "rotate-180" : ""}`} />
            </button>
            {showExtract && (
              <div className="space-y-6">
                {extract.map((page, i) => (
                  <img
                    key={page}
                    src={page}
                    alt={`Extrait de ${book.title}, page ${i + 1}`}
                    loading="lazy"
                    className="w-full max-w-xl mx-auto bg-cream border border-border shadow-lg rounded-sm"
                  />
                ))}
              </div>
            )}
          </FadeIn>
        )}
      </div>
    </PageShell>
  );
};

export default Precommande;
