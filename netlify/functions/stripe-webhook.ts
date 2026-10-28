// POST /api/stripe-webhook : Stripe y signale paiements, échecs et remboursements.
// Adresse à déclarer dans Stripe : Développeurs > Webhooks (voir docs/BOUTIQUE.md).
import type { Config } from "@netlify/functions";
import type Stripe from "stripe";
import { getStripe, getSupabaseAdmin } from "../lib/clients";
import { brevoMailer, orderConfirmationEmail, paymentFailedEmail, refundEmail } from "../lib/email";
import { requireEnv, siteUrl } from "../lib/env";
import { handleStripeEvent, supabaseRepo } from "../lib/orders";

const templates = { confirmation: orderConfirmationEmail, failed: paymentFailedEmail, refund: refundEmail };

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Méthode non autorisée", { status: 405 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    // La signature se vérifie sur le corps brut, avant toute lecture JSON.
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      req.headers.get("stripe-signature") ?? "",
      requireEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch (error) {
    console.warn("webhook : signature invalide", error);
    return new Response("Signature invalide", { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event, {
      repo: supabaseRepo(getSupabaseAdmin()),
      sendEmail: (kind, order, product) => brevoMailer(templates[kind](order, product, siteUrl())),
      getReceiptUrl: async (paymentIntentId) => {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
        const charge = pi.latest_charge as Stripe.Charge | null;
        return charge?.receipt_url ?? null;
      },
      log: (message, extra) => console.error(message, extra),
    });
    console.log(`webhook ${event.type} (${event.id}) : ${result}`);
    return new Response(result, { status: 200 });
  } catch (error) {
    // 500 : Stripe réessaiera automatiquement plus tard.
    console.error(`webhook ${event.type} (${event.id}) en erreur`, error);
    return new Response("Erreur de traitement", { status: 500 });
  }
};

export const config: Config = { path: "/api/stripe-webhook" };
