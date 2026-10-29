import type { Format, Order } from "@/lib/shop";

/** Ce qu'un client possède d'un livre : la meilleure commande pour chaque format. */
export interface ShelfEntry {
  slug: string;
  ebook?: Order;
  paper?: Order;
}

// Une commande payée l'emporte sur une commande en attente ; échecs et remboursements ne comptent pas.
const rank = (o: Order) => (o.status === "paid" || o.status === "partially_refunded" ? 2 : o.status === "pending" ? 1 : 0);

/**
 * Répartit les livres entre ceux que le client possède (au moins un format payé ou en
 * cours de paiement) et ceux à lui suggérer (en vente sur la boutique, pas encore achetés).
 */
export const bookshelf = (orders: Order[], bookOrder: string[], forSale: (slug: string) => boolean) => {
  const owned: ShelfEntry[] = [];
  const suggestions: string[] = [];
  for (const slug of bookOrder) {
    const entry: ShelfEntry = { slug };
    for (const format of ["ebook", "paper"] as Format[]) {
      const best = orders
        .filter((o) => o.product_id === slug && o.format === format && rank(o) > 0)
        .sort((a, b) => rank(b) - rank(a))[0];
      if (best) entry[format] = best;
    }
    if (entry.ebook || entry.paper) owned.push(entry);
    else if (forSale(slug)) suggestions.push(slug);
  }
  return { owned, suggestions };
};

/** Début du résumé, coupé proprement à la fin d'un mot. */
export const teaser = (text: string, max = 190) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`;
};
