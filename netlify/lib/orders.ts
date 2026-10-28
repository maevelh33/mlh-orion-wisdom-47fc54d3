import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Format, Order, OrderStatus, Product, ShippingAddress } from "../../src/lib/shop";

/** Accès aux données dont le traitement des paiements a besoin (Supabase en vrai, mémoire en test). */
export interface ShopRepo {
  getProduct(id: string): Promise<Product | null>;
  findOrderBySession(sessionId: string): Promise<Order | null>;
  findOrderByPaymentIntent(paymentIntentId: string): Promise<Order | null>;
  findUserIdByEmail(email: string): Promise<string | null>;
  upsertOrder(order: Partial<Order> & { stripe_session_id: string }): Promise<Order>;
  updateOrder(id: string, patch: Partial<Order>): Promise<Order>;
  notify(userId: string, notification: { title: string; body: string; link?: string }): Promise<void>;
}

const idOf = (value: string | { id: string } | null | undefined) => (typeof value === "string" ? value : value?.id ?? null);

/** Convertit une session Checkout terminée en ligne de commande. */
export const orderFromSession = (
  session: Stripe.Checkout.Session,
  fallback: { productId?: string; format?: Format } = {},
): Partial<Order> & { stripe_session_id: string } => {
  const shipping = session.collected_information?.shipping_details;
  const address: ShippingAddress | null = shipping
    ? { name: shipping.name, ...shipping.address }
    : null;
  const dedication = session.custom_fields?.find((f) => f.key === "dedicace")?.text?.value?.trim() || null;
  const status: OrderStatus = session.payment_status === "unpaid" ? "pending" : "paid";
  const email = session.customer_details?.email ?? session.customer_email ?? "";
  return {
    stripe_session_id: session.id,
    stripe_payment_intent_id: idOf(session.payment_intent),
    email: email.toLowerCase(),
    customer_name: session.customer_details?.name ?? shipping?.name ?? null,
    product_id: session.metadata?.product_id ?? fallback.productId,
    format: (session.metadata?.format as Format | undefined) ?? fallback.format ?? (shipping ? "paper" : "ebook"),
    status,
    amount_total_cents: session.amount_total ?? 0,
    currency: session.currency ?? "eur",
    shipping_cents: session.shipping_cost?.amount_total ?? 0,
    shipping_address: address,
    dedication,
    paid_at: status === "paid" ? new Date(session.created * 1000).toISOString() : null,
  };
};

export interface WebhookDeps {
  repo: ShopRepo;
  /** Envoie l'e-mail correspondant ; une erreur d'envoi ne doit pas bloquer l'enregistrement. */
  sendEmail: (kind: "confirmation" | "failed" | "refund", order: Order, product: Product) => Promise<void>;
  getReceiptUrl?: (paymentIntentId: string) => Promise<string | null>;
  log?: (message: string, extra?: unknown) => void;
}

const SESSION_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
]);

/**
 * Traite un événement Stripe déjà vérifié. Idempotent : Stripe peut renvoyer
 * le même événement plusieurs fois, les e-mails ne partent qu'au changement de statut.
 */
export const handleStripeEvent = async (event: Stripe.Event, deps: WebhookDeps): Promise<string> => {
  const { repo, log = () => {} } = deps;

  if (SESSION_EVENTS.has(event.type)) {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!session.metadata?.product_id) return "ignoré : session sans produit (ancien lien de paiement ?)";

    const previous = await repo.findOrderBySession(session.id);
    const previousStatus = previous?.status; // gardé à part : l'écriture peut modifier `previous`
    const row = orderFromSession(session);
    if (event.type === "checkout.session.async_payment_succeeded") row.status = "paid";
    if (event.type === "checkout.session.async_payment_failed") row.status = "failed";
    // Un remboursement déjà enregistré ne doit pas être écrasé par un événement en retard.
    if (previous && (previous.status === "refunded" || previous.status === "partially_refunded")) row.status = previous.status;
    if (row.status === "paid") row.paid_at = previous?.paid_at ?? new Date().toISOString();
    else row.paid_at = previous?.paid_at ?? null;

    row.user_id = previous?.user_id ?? session.metadata.user_id ?? (row.email ? await repo.findUserIdByEmail(row.email) : null);
    if (row.stripe_payment_intent_id && deps.getReceiptUrl && row.status === "paid" && !previous?.receipt_url) {
      row.receipt_url = await deps.getReceiptUrl(row.stripe_payment_intent_id).catch(() => null);
    }

    const order = await repo.upsertOrder(row);
    const product = await repo.getProduct(order.product_id);
    if (!product) throw new Error(`Produit inconnu : ${order.product_id}`);

    if (order.status !== previousStatus) {
      if (order.status === "paid") {
        await deps.sendEmail("confirmation", order, product).catch((e) => log("e-mail de confirmation non envoyé", e));
        if (order.user_id) {
          await repo.notify(order.user_id, {
            title: order.format === "ebook" && product.ebook_status === "available" ? `${product.title} est dans votre bibliothèque` : `Précommande de ${product.title} confirmée`,
            body: "Merci pour votre confiance.",
            link: "/compte",
          });
        }
      } else if (order.status === "failed") {
        await deps.sendEmail("failed", order, product).catch((e) => log("e-mail d'échec non envoyé", e));
      }
    }
    return `commande ${order.id} : ${order.status}`;
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = idOf(charge.payment_intent);
    if (!paymentIntentId) return "ignoré : remboursement sans paiement associé";
    const order = await repo.findOrderByPaymentIntent(paymentIntentId);
    if (!order) return "ignoré : remboursement d'un paiement hors boutique";

    const status: OrderStatus = charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded";
    if (order.status === status && order.amount_refunded_cents === charge.amount_refunded) return "déjà enregistré";

    const updated = await repo.updateOrder(order.id, {
      status,
      amount_refunded_cents: charge.amount_refunded,
      refunded_at: new Date().toISOString(),
    });
    const product = await repo.getProduct(updated.product_id);
    if (product) {
      await deps.sendEmail("refund", updated, product).catch((e) => log("e-mail de remboursement non envoyé", e));
      if (updated.user_id) {
        await repo.notify(updated.user_id, {
          title: status === "refunded" ? `Commande ${product.title} remboursée` : `Remboursement partiel pour ${product.title}`,
          body: "Le montant apparaîtra sur votre compte sous quelques jours.",
          link: "/compte",
        });
      }
    }
    return `commande ${updated.id} : ${status}`;
  }

  return `ignoré : ${event.type}`;
};

/** Implémentation Supabase (clé service_role). */
export const supabaseRepo = (db: SupabaseClient): ShopRepo => {
  const one = async <T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>) => {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  };
  return {
    getProduct: (id) => one(db.from("products").select("*").eq("id", id).maybeSingle()),
    findOrderBySession: (sessionId) => one(db.from("orders").select("*").eq("stripe_session_id", sessionId).maybeSingle()),
    findOrderByPaymentIntent: (pi) => one(db.from("orders").select("*").eq("stripe_payment_intent_id", pi).maybeSingle()),
    findUserIdByEmail: async (email) => {
      // Supabase enregistre les e-mails en minuscules ; `ilike` traiterait « _ » comme un joker.
      const row = await one<{ id: string }>(db.from("profiles").select("id").eq("email", email.toLowerCase()).maybeSingle());
      return row?.id ?? null;
    },
    upsertOrder: async (order) =>
      (await one(db.from("orders").upsert(order, { onConflict: "stripe_session_id" }).select("*").single()))!,
    updateOrder: async (id, patch) => (await one(db.from("orders").update(patch).eq("id", id).select("*").single()))!,
    notify: async (userId, n) => {
      await one(db.from("notifications").insert({ user_id: userId, ...n }));
    },
  };
};
