// Types et règles de la boutique, partagés par le site et les fonctions serveur (netlify/).

export type Format = "ebook" | "paper";
export type ShippingZone = "fr" | "eu";
export type EbookStatus = "preorder" | "available";
export type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";

export interface Product {
  id: string;
  title: string;
  release_label: string;
  release_date: string | null;
  ebook_status: EbookStatus;
  ebook_price_cents: number;
  paper_price_cents: number | null;
  shipping_fr_cents: number | null;
  shipping_eu_cents: number | null;
  ebook_file_path: string | null;
  updated_at?: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  email: string;
  customer_name: string | null;
  product_id: string;
  format: Format;
  status: OrderStatus;
  amount_total_cents: number;
  amount_refunded_cents: number;
  currency: string;
  shipping_cents: number;
  shipping_address: ShippingAddress | null;
  dedication: string | null;
  shipped_at: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  receipt_url: string | null;
  source: "checkout" | "import";
  availability_notified_at: string | null;
  welcome_sent_at?: string | null;
  created_at: string;
  paid_at: string | null;
  refunded_at: string | null;
}

export interface ShippingAddress {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

/** Pays de l'Union européenne livrables au tarif « Europe » (la France a son propre tarif). */
export const EU_COUNTRIES = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "GR", "HR", "HU", "IE",
  "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
] as const;

export const formatPrice = (cents: number, currency = "eur") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

/** « de » élidé devant une voyelle ou un h muet : « d'Hybris », « de Chaton ». */
export const de = (word: string) => (/^[aeiouyhàâéèêëîïôûù]/i.test(word.replace(/^<[^>]+>/, "")) ? `d'${word}` : `de ${word}`);

export const formatLabel = (format: Format) => (format === "ebook" ? "Ebook" : "Livre papier");

export const priceFor = (product: Product, format: Format) =>
  format === "ebook" ? product.ebook_price_cents : product.paper_price_cents;

export const shippingFor = (product: Product, zone: ShippingZone) =>
  zone === "fr" ? product.shipping_fr_cents : product.shipping_eu_cents;

/** Une commande donne accès à l'ebook tant qu'elle n'est pas entièrement remboursée. */
export const grantsEbook = (order: Pick<Order, "format" | "status">) =>
  order.format === "ebook" && (order.status === "paid" || order.status === "partially_refunded");

export type StatusTone = "neutral" | "success" | "warning" | "danger";

export interface DisplayStatus {
  key: "pending" | "failed" | "refunded" | "preordered" | "available" | "shipped";
  label: string;
  tone: StatusTone;
}

/** Statut affiché au client pour un achat : précommandé, disponible, expédié, remboursé… */
export const displayStatus = (
  order: Pick<Order, "format" | "status" | "shipped_at">,
  product: Pick<Product, "ebook_status"> | null | undefined,
): DisplayStatus => {
  switch (order.status) {
    case "pending":
      return { key: "pending", label: "Paiement en cours", tone: "warning" };
    case "failed":
      return { key: "failed", label: "Paiement échoué", tone: "danger" };
    case "refunded":
      return { key: "refunded", label: "Remboursé", tone: "neutral" };
  }
  if (order.format === "paper") {
    return order.shipped_at
      ? { key: "shipped", label: "Expédié", tone: "success" }
      : { key: "preordered", label: "Précommandé", tone: "neutral" };
  }
  return product?.ebook_status === "available"
    ? { key: "available", label: "Disponible", tone: "success" }
    : { key: "preordered", label: "Précommandé", tone: "neutral" };
};
