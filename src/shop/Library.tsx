import { Link } from "react-router-dom";
import { BookOpen, Package, Plus } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import BookNotice from "@/components/BookNotice";
import { BOOK_ORDER, booksData } from "@/data/books";
import { displayStatus, formatPrice, type Format, type Order, type Product } from "@/lib/shop";
import { bookshelf, teaser, type ShelfEntry } from "./bookshelf";
import { StatusBadge } from "./ui";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-body text-xs tracking-[0.3em] uppercase text-bordeaux mb-6">{children}</h2>
);

const Cover = ({ slug }: { slug: string }) => (
  <Link to={`/livres/${slug}`} className="shrink-0">
    <img
      src={booksData[slug].cover}
      alt={`Couverture de ${booksData[slug].title}`}
      className="w-24 md:w-28 aspect-[2/3] object-cover rounded-sm shadow-md hover:shadow-lg transition-shadow"
    />
  </Link>
);

const preorderLink = (slug: string, format?: Format) => `/livres/${slug}/precommander${format ? `?format=${format}` : ""}`;

/** Un format possédé : statut, et ce qu'on peut en faire. */
const OwnedFormat = ({ format, order, product }: { format: Format; order: Order; product?: Product }) => {
  const status = displayStatus(order, product);
  const Icon = format === "ebook" ? BookOpen : Package;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 border-t border-border first:border-t-0">
      <span className="inline-flex items-center gap-2 font-body text-sm text-foreground min-w-[7.5rem]">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {format === "ebook" ? "Ebook" : "Livre papier"}
      </span>
      <StatusBadge status={status} />
      {format === "ebook" && status.key === "available" && (
        <Link
          to={`/compte/lire/${order.product_id}`}
          className="inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-4 py-2 bg-bordeaux text-primary-foreground hover:bg-bordeaux/90 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" /> Lire
        </Link>
      )}
      {status.key === "preordered" && (
        <span className="font-body text-xs text-muted-foreground">
          {format === "ebook" ? "À lire ici dès la sortie" : "Expédié à la sortie"}
          {product?.release_label ? ` · ${product.release_label}` : ""}
        </span>
      )}
      {format === "paper" && order.dedication && (
        <span className="font-body text-xs text-muted-foreground">Dédicace pour {order.dedication}</span>
      )}
    </div>
  );
};

const OwnedCard = ({ entry, product }: { entry: ShelfEntry; product?: Product }) => {
  const book = booksData[entry.slug];
  // Proposer le format manquant, s'il est en vente.
  const missing: Format | null = !entry.ebook && product?.ebook_price_cents ? "ebook" : !entry.paper && product?.paper_price_cents ? "paper" : null;
  return (
    <article className="flex gap-5 p-5 bg-card/60 border border-border rounded-sm">
      <Cover slug={entry.slug} />
      <div className="flex-1 min-w-0">
        <p className="font-display text-2xl text-foreground leading-tight mb-2">{book.title}</p>
        {book.notice && <BookNotice className="mb-3 !px-3 !py-1.5 !text-[10px]">{book.notice}</BookNotice>}
        <div>
          {entry.ebook && <OwnedFormat format="ebook" order={entry.ebook} product={product} />}
          {entry.paper && <OwnedFormat format="paper" order={entry.paper} product={product} />}
        </div>
        {missing && product && (
          <Link
            to={preorderLink(entry.slug, missing)}
            className="mt-3 inline-flex items-center gap-1.5 font-body text-xs text-muted-foreground hover:text-bordeaux underline underline-offset-4 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {missing === "ebook"
              ? `Ajouter l'ebook · ${formatPrice(product.ebook_price_cents)}`
              : `Recevoir aussi le livre papier · ${formatPrice(product.paper_price_cents!)}`}
          </Link>
        )}
      </div>
    </article>
  );
};

const SuggestionCard = ({ slug, product }: { slug: string; product: Product }) => {
  const book = booksData[slug];
  const prices = [
    product.paper_price_cents ? `Livre papier ${formatPrice(product.paper_price_cents)}` : null,
    `Ebook ${formatPrice(product.ebook_price_cents)}`,
  ].filter(Boolean);
  return (
    <article className="flex gap-5 p-5 bg-cream border border-bordeaux/20 rounded-sm">
      <Cover slug={slug} />
      <div className="flex-1 min-w-0 flex flex-col">
        <p className="font-display text-2xl text-foreground leading-tight mb-2">{book.title}</p>
        {book.notice && <BookNotice className="mb-3 self-start !px-3 !py-1.5 !text-[10px]">{book.notice}</BookNotice>}
        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">{teaser(book.synopsis[0])}</p>
        <p className="font-body text-xs tracking-[0.1em] text-foreground mb-4">{prices.join(" · ")}</p>
        <div className="mt-auto flex flex-wrap items-center gap-4">
          <Link
            to={preorderLink(slug)}
            className="inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 bg-bordeaux text-primary-foreground hover:bg-bordeaux/90 transition-colors"
          >
            {product.ebook_status === "available" && !product.paper_price_cents ? "Acheter" : "Précommander"}
          </Link>
          <Link to={`/livres/${slug}`} className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-bordeaux">
            En savoir plus
          </Link>
        </div>
      </div>
    </article>
  );
};

/** Bibliothèque de l'espace client : livres achetés, puis ceux qui pourraient intéresser. */
const Library = ({ orders, products, loading }: { orders: Order[]; products: Product[]; loading: boolean }) => {
  const productOf = (slug: string) => products.find((p) => p.id === slug);
  const { owned, suggestions } = bookshelf(orders, BOOK_ORDER, (slug) => Boolean(booksData[slug]?.preorder && productOf(slug)));

  if (loading) return <p className="font-body text-sm text-muted-foreground mb-16">Chargement…</p>;

  return (
    <>
      <FadeIn className="mb-16">
        <SectionTitle>Ma bibliothèque</SectionTitle>
        {owned.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            Vous n'avez pas encore de livre. Vous avez commandé avec une autre adresse e-mail ? Connectez-vous avec celle-ci pour le retrouver.
          </p>
        ) : (
          <div className="grid gap-5">
            {owned.map((entry) => (
              <OwnedCard key={entry.slug} entry={entry} product={productOf(entry.slug)} />
            ))}
          </div>
        )}
      </FadeIn>

      {suggestions.length > 0 && (
        <FadeIn className="mb-16">
          <SectionTitle>{owned.length ? "Pourrait aussi vous intéresser" : "Mes livres"}</SectionTitle>
          <div className="grid gap-5">
            {suggestions.map((slug) => (
              <SuggestionCard key={slug} slug={slug} product={productOf(slug)!} />
            ))}
          </div>
        </FadeIn>
      )}
    </>
  );
};

export default Library;
