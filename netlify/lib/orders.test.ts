// @vitest-environment node
import Stripe from "stripe";
import { beforeEach, describe, expect, it } from "vitest";
import type { Order, Product } from "../../src/lib/shop";
import { buildCheckoutParams, CheckoutError } from "./checkout";
import { handleStripeEvent, type ShopRepo, type WebhookDeps } from "./orders";

const hybris: Product = {
  id: "hybris",
  title: "Hybris",
  release_label: "Début 2027",
  release_date: null,
  ebook_status: "preorder",
  ebook_price_cents: 1500,
  paper_price_cents: 3399,
  shipping_fr_cents: 600,
  shipping_eu_cents: null,
  ebook_file_path: null,
};

/** Base de données en mémoire qui imite Supabase. */
const memoryRepo = () => {
  const orders: Order[] = [];
  const notifications: { userId: string; title: string }[] = [];
  const users: Record<string, string> = { "client@example.com": "user-client" };
  const repo: ShopRepo = {
    getProduct: async (id) => (id === hybris.id ? hybris : null),
    findOrderBySession: async (id) => orders.find((o) => o.stripe_session_id === id) ?? null,
    findOrderByPaymentIntent: async (id) => orders.find((o) => o.stripe_payment_intent_id === id) ?? null,
    findUserIdByEmail: async (email) => users[email] ?? null,
    upsertOrder: async (row) => {
      const existing = orders.find((o) => o.stripe_session_id === row.stripe_session_id);
      if (existing) return Object.assign(existing, row);
      const order = { id: `order-${orders.length + 1}`, amount_refunded_cents: 0, shipped_at: null, ...row } as Order;
      orders.push(order);
      return order;
    },
    updateOrder: async (id, patch) => Object.assign(orders.find((o) => o.id === id)!, patch),
    notify: async (userId, n) => {
      notifications.push({ userId, title: n.title });
    },
  };
  return { repo, orders, notifications };
};

const session = (overrides: Partial<Stripe.Checkout.Session> = {}) =>
  ({
    id: "cs_test_1",
    object: "checkout.session",
    created: 1_790_000_000,
    payment_status: "paid",
    payment_intent: "pi_1",
    amount_total: 1500,
    currency: "eur",
    customer_details: { email: "Client@Example.com", name: "Lou Martin" },
    metadata: { product_id: "hybris", format: "ebook" },
    custom_fields: [],
    collected_information: null,
    shipping_cost: null,
    ...overrides,
  }) as unknown as Stripe.Checkout.Session;

const event = (type: string, object: unknown) => ({ id: `evt_${type}`, type, data: { object } }) as unknown as Stripe.Event;

let db: ReturnType<typeof memoryRepo>;
let sent: string[];
let deps: WebhookDeps;

beforeEach(() => {
  db = memoryRepo();
  sent = [];
  deps = {
    repo: db.repo,
    sendEmail: async (kind, order) => {
      sent.push(`${kind}:${order.email}`);
    },
    getReceiptUrl: async () => "https://pay.stripe.com/receipts/1",
  };
});

describe("webhook Stripe", () => {
  it("accepte un vrai en-tête de signature Stripe et rejette un faux", async () => {
    const stripe = new Stripe("sk_test_fake");
    const payload = JSON.stringify(event("checkout.session.completed", session()));
    const secret = "whsec_test";
    const header = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret });
    const verified = await stripe.webhooks.constructEventAsync(payload, header, secret);
    expect(verified.type).toBe("checkout.session.completed");
    await expect(stripe.webhooks.constructEventAsync(payload, header, "whsec_autre")).rejects.toThrow();
  });

  it("enregistre une précommande payée, la rattache au compte et envoie une seule confirmation", async () => {
    await handleStripeEvent(event("checkout.session.completed", session()), deps);
    await handleStripeEvent(event("checkout.session.completed", session()), deps); // Stripe renvoie l'événement

    expect(db.orders).toHaveLength(1);
    expect(db.orders[0]).toMatchObject({
      status: "paid",
      email: "client@example.com",
      user_id: "user-client",
      format: "ebook",
      amount_total_cents: 1500,
      receipt_url: "https://pay.stripe.com/receipts/1",
    });
    expect(sent).toEqual(["confirmation:client@example.com"]);
    expect(db.notifications).toEqual([{ userId: "user-client", title: "Précommande d'Hybris confirmée" }]);
  });

  it("livre papier : adresse, frais de port et dédicace", async () => {
    await handleStripeEvent(
      event(
        "checkout.session.completed",
        session({
          amount_total: 3999,
          metadata: { product_id: "hybris", format: "paper", zone: "fr" },
          shipping_cost: { amount_total: 600 } as Stripe.Checkout.Session.ShippingCost,
          collected_information: {
            shipping_details: { name: "Lou Martin", address: { line1: "1 rue des Livres", city: "Paris", postal_code: "75001", country: "FR" } },
          } as Stripe.Checkout.Session.CollectedInformation,
          custom_fields: [{ key: "dedicace", text: { value: " Lou " } }] as Stripe.Checkout.Session.CustomField[],
        }),
      ),
      deps,
    );
    expect(db.orders[0]).toMatchObject({
      format: "paper",
      shipping_cents: 600,
      dedication: "Lou",
      shipping_address: { name: "Lou Martin", city: "Paris", country: "FR" },
    });
  });

  it("paiement différé (virement SEPA) : en attente, puis payé", async () => {
    await handleStripeEvent(event("checkout.session.completed", session({ payment_status: "unpaid" })), deps);
    expect(db.orders[0].status).toBe("pending");
    expect(sent).toEqual([]);

    await handleStripeEvent(event("checkout.session.async_payment_succeeded", session()), deps);
    expect(db.orders[0].status).toBe("paid");
    expect(sent).toEqual(["confirmation:client@example.com"]);
  });

  it("paiement différé refusé : échoué, avec e-mail pour réessayer", async () => {
    await handleStripeEvent(event("checkout.session.completed", session({ payment_status: "unpaid" })), deps);
    await handleStripeEvent(event("checkout.session.async_payment_failed", session({ payment_status: "unpaid" })), deps);
    expect(db.orders[0].status).toBe("failed");
    expect(sent).toEqual(["failed:client@example.com"]);
  });

  it("remboursements partiel puis total", async () => {
    await handleStripeEvent(event("checkout.session.completed", session()), deps);
    const charge = { payment_intent: "pi_1", amount: 1500 };
    await handleStripeEvent(event("charge.refunded", { ...charge, amount_refunded: 500 }), deps);
    expect(db.orders[0]).toMatchObject({ status: "partially_refunded", amount_refunded_cents: 500 });

    await handleStripeEvent(event("charge.refunded", { ...charge, amount_refunded: 1500 }), deps);
    await handleStripeEvent(event("charge.refunded", { ...charge, amount_refunded: 1500 }), deps); // doublon
    expect(db.orders[0]).toMatchObject({ status: "refunded", amount_refunded_cents: 1500 });
    expect(sent.filter((s) => s.startsWith("refund"))).toHaveLength(2);

    // Un événement de paiement arrivé en retard ne doit pas annuler le remboursement.
    await handleStripeEvent(event("checkout.session.completed", session()), deps);
    expect(db.orders[0].status).toBe("refunded");
  });

  it("une erreur d'envoi d'e-mail n'empêche pas d'enregistrer le paiement", async () => {
    deps.sendEmail = async () => {
      throw new Error("Brevo indisponible");
    };
    await handleStripeEvent(event("checkout.session.completed", session()), deps);
    expect(db.orders[0].status).toBe("paid");
  });

  it("ignore les paiements qui ne viennent pas de la boutique", async () => {
    const result = await handleStripeEvent(event("checkout.session.completed", session({ metadata: {} })), deps);
    expect(result).toMatch(/ignoré/);
    expect(await handleStripeEvent(event("charge.refunded", { payment_intent: "pi_inconnu", amount: 1, amount_refunded: 1 }), deps)).toMatch(/ignoré/);
    expect(db.orders).toEqual([]);
  });
});

describe("session de paiement", () => {
  const site = "https://mlhorion.com";

  it("ebook : prix de la base, sans livraison", () => {
    const params = buildCheckoutParams({ product: hybris, format: "ebook", siteUrl: site });
    expect(params.line_items?.[0].price_data?.unit_amount).toBe(1500);
    expect(params.line_items?.[0].price_data?.product_data?.name).toBe("Hybris — Ebook (précommande)");
    expect(params.shipping_address_collection).toBeUndefined();
    expect(params.success_url).toBe("https://mlhorion.com/compte?commande={CHECKOUT_SESSION_ID}");
  });

  it("papier en France : adresse française, frais de port, dédicace", () => {
    const params = buildCheckoutParams({
      product: hybris,
      format: "paper",
      zone: "fr",
      customer: { id: "u1", email: "client@example.com" },
      siteUrl: site,
    });
    expect(params.line_items?.[0].price_data?.unit_amount).toBe(3399);
    expect(params.shipping_address_collection?.allowed_countries).toEqual(["FR"]);
    expect(params.shipping_options?.[0].shipping_rate_data?.fixed_amount?.amount).toBe(600);
    expect(params.custom_fields?.[0].key).toBe("dedicace");
    expect(params.metadata).toEqual({ product_id: "hybris", format: "paper", user_id: "u1", zone: "fr" });
    expect(params.customer_email).toBe("client@example.com");
  });

  it("livre vendu seulement en ebook (Chaton) : le papier est refusé", () => {
    const chaton = { ...hybris, id: "chaton", title: "Chaton", ebook_price_cents: 1250, paper_price_cents: null };
    expect(buildCheckoutParams({ product: chaton, format: "ebook", siteUrl: site }).line_items?.[0].price_data?.unit_amount).toBe(1250);
    expect(() => buildCheckoutParams({ product: chaton, format: "paper", zone: "fr", siteUrl: site })).toThrow("Ce format n'est pas en vente.");
  });

  it("refuse une zone sans tarif et un papier sans zone", () => {
    expect(() => buildCheckoutParams({ product: hybris, format: "paper", zone: "eu", siteUrl: site })).toThrow(CheckoutError);
    expect(() => buildCheckoutParams({ product: hybris, format: "paper", siteUrl: site })).toThrow(CheckoutError);
  });

  it("ebook disponible : plus de mention « précommande »", () => {
    const params = buildCheckoutParams({ product: { ...hybris, ebook_status: "available" }, format: "ebook", siteUrl: site });
    expect(params.line_items?.[0].price_data?.product_data?.name).toBe("Hybris — Ebook");
  });
});
