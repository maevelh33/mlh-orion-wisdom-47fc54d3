import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Format, Order, Product } from "../../src/lib/shop";
import { bookAvailableEmail, welcomeEmail, type Mailer } from "./email";
import { orderFromSession } from "./orders";

/** Nombre d'e-mails envoyés par appel : la page d'administration rappelle tant qu'il en reste. */
export const AVAILABILITY_BATCH = 25;

/**
 * Prévient les acheteurs de l'ebook qu'il est disponible (e-mail + notification),
 * par lots, sans jamais prévenir deux fois la même commande.
 */
export const notifyAvailability = async (db: SupabaseClient, mail: Mailer, productId: string, site: string) => {
  const { data: product } = await db.from("products").select("*").eq("id", productId).maybeSingle<Product>();
  if (!product) throw new Error("Livre introuvable.");
  if (product.ebook_status !== "available") throw new Error("Passez d'abord le livre en « Disponible ».");
  if (!product.ebook_file_path) throw new Error("Déposez d'abord le fichier de l'ebook.");

  const pending = db
    .from("orders")
    .select("*", { count: "exact" })
    .eq("product_id", productId)
    .eq("format", "ebook")
    .in("status", ["paid", "partially_refunded"])
    .is("availability_notified_at", null);
  const { data: orders, count, error } = await pending.limit(AVAILABILITY_BATCH).returns<Order[]>();
  if (error) throw new Error(error.message);

  let sent = 0;
  const failures: string[] = [];
  for (const order of orders ?? []) {
    try {
      await mail(bookAvailableEmail(order, product, site));
      if (order.user_id) {
        await db.from("notifications").insert({
          user_id: order.user_id,
          title: `${product.title} est disponible`,
          body: "Votre ebook vous attend dans votre bibliothèque.",
          link: `/compte/lire/${product.id}`,
        });
      }
      await db.from("orders").update({ availability_notified_at: new Date().toISOString() }).eq("id", order.id);
      sent++;
    } catch (e) {
      failures.push(`${order.email} : ${e instanceof Error ? e.message : e}`);
    }
  }
  // Les envois en échec restent à faire : on ne les compte pas comme restants pour éviter une boucle infinie.
  const remaining = Math.max(0, (count ?? 0) - sent - failures.length);
  return { sent, remaining, failures };
};

/**
 * Importe les paiements faits avant la boutique via un lien de paiement Stripe
 * (buy.stripe.com/…). Les clients retrouvent ces commandes en se connectant
 * avec le même e-mail. Aucun e-mail n'est envoyé.
 */
export const importPaymentLink = async (
  db: SupabaseClient,
  stripe: Stripe,
  opts: { paymentLinkUrl: string; productId: string; format: Format | "auto" },
) => {
  const url = opts.paymentLinkUrl.trim().replace(/\/+$/, "");
  let link: Stripe.PaymentLink | undefined;
  for await (const l of stripe.paymentLinks.list({ limit: 100 })) {
    if (l.url.replace(/\/+$/, "") === url) {
      link = l;
      break;
    }
  }
  if (!link) throw new Error("Lien de paiement introuvable dans ce compte Stripe.");

  let imported = 0;
  let skipped = 0;
  const sessions = stripe.checkout.sessions.list({
    payment_link: link.id,
    status: "complete",
    limit: 100,
    expand: ["data.payment_intent.latest_charge"],
  });
  for await (const session of sessions) {
    if (session.payment_status === "unpaid") {
      skipped++;
      continue;
    }
    const row = orderFromSession(session, {
      productId: opts.productId,
      format: opts.format === "auto" ? undefined : opts.format,
    });
    row.product_id = opts.productId;
    if (opts.format !== "auto") row.format = opts.format;

    const pi = typeof session.payment_intent === "object" ? session.payment_intent : null;
    const charge = pi && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
    row.receipt_url = charge?.receipt_url ?? null;
    if (charge?.amount_refunded) {
      row.amount_refunded_cents = charge.amount_refunded;
      row.status = charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded";
    }

    const { data: existing } = await db.from("orders").select("id, user_id, source").eq("stripe_session_id", session.id).maybeSingle();
    if (existing && existing.source !== "import") {
      skipped++; // déjà enregistrée par la boutique elle-même
      continue;
    }
    if (!existing?.user_id && row.email) {
      const { data: profile } = await db.from("profiles").select("id").eq("email", row.email).maybeSingle();
      row.user_id = profile?.id ?? null;
    }
    const { error } = await db.from("orders").upsert({ ...row, source: "import" }, { onConflict: "stripe_session_id" });
    if (error) throw new Error(error.message);
    imported++;
  }
  return { imported, skipped };
};

/** Seules les précommandes du livre papier de Hybris faites avec l'ancien lien Stripe sont concernées. */
export const WELCOME_SCOPE = { productId: "hybris", format: "paper" } as const;

/**
 * Commandes importées (ancien lien de paiement), payées, du livre papier de Hybris,
 * dont l'acheteur n'a pas encore reçu l'e-mail de bienvenue. Les autres paiements
 * Stripe (appels, formation…) ne sont jamais importés, donc jamais concernés.
 */
const welcomePending = (db: SupabaseClient) =>
  db
    .from("orders")
    .select("*")
    .eq("source", "import")
    .eq("product_id", WELCOME_SCOPE.productId)
    .eq("format", WELCOME_SCOPE.format)
    .eq("status", "paid")
    .is("welcome_sent_at", null)
    .order("created_at");

/** Liste des personnes (une par adresse e-mail) qui recevront l'invitation, pour vérification. */
export const listWelcomePending = async (db: SupabaseClient) => {
  const { data, error } = await welcomePending(db).returns<Order[]>();
  if (error) throw new Error(error.message);
  const people = new Map<string, { email: string; name: string | null; paid_cents: number; orders: number }>();
  for (const o of data ?? []) {
    const p = people.get(o.email) ?? { email: o.email, name: o.customer_name, paid_cents: 0, orders: 0 };
    p.paid_cents += o.amount_total_cents - o.amount_refunded_cents;
    p.orders++;
    people.set(o.email, p);
  }
  return [...people.values()];
};

/**
 * Invite les acheteurs des anciennes précommandes à découvrir leur espace :
 * un seul e-mail par personne, même si elle a plusieurs commandes, et jamais deux fois.
 */
export const sendWelcome = async (db: SupabaseClient, mail: Mailer, site: string) => {
  const { data, error } = await welcomePending(db).returns<Order[]>();
  if (error) throw new Error(error.message);

  const byEmail = new Map<string, Order>();
  for (const o of data ?? []) if (!byEmail.has(o.email.toLowerCase())) byEmail.set(o.email.toLowerCase(), o);

  const products = new Map<string, Product>();
  let sent = 0;
  const failures: string[] = [];
  for (const [email, order] of [...byEmail].slice(0, AVAILABILITY_BATCH)) {
    try {
      let product = products.get(order.product_id);
      if (!product) {
        const { data: p } = await db.from("products").select("*").eq("id", order.product_id).maybeSingle<Product>();
        if (!p) throw new Error("livre introuvable");
        products.set(order.product_id, (product = p));
      }
      await mail(welcomeEmail(order, product, site));
      await db
        .from("orders")
        .update({ welcome_sent_at: new Date().toISOString() })
        .eq("source", "import")
        .eq("email", order.email); // les e-mails des commandes sont enregistrés en minuscules
      sent++;
    } catch (e) {
      failures.push(`${email} : ${e instanceof Error ? e.message : e}`);
    }
  }
  const remaining = Math.max(0, byEmail.size - sent - failures.length);
  return { sent, remaining, failures };
};
