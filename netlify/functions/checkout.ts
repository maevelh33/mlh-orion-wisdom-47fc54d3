// POST /api/checkout { productId, format, zone? } → { url } de la page de paiement Stripe.
import type { Config } from "@netlify/functions";
import type { Format, Product, ShippingZone } from "../../src/lib/shop";
import { buildCheckoutParams, CheckoutError } from "../lib/checkout";
import { getStripe, getSupabaseAdmin } from "../lib/clients";
import { siteUrl } from "../lib/env";
import { fail, getUser, json } from "../lib/http";

export default async (req: Request) => {
  if (req.method !== "POST") return fail("Méthode non autorisée", 405);

  let body: { productId?: string; format?: Format; zone?: ShippingZone };
  try {
    body = await req.json();
  } catch {
    return fail("Requête invalide");
  }
  if (!body.productId || (body.format !== "ebook" && body.format !== "paper")) return fail("Requête invalide");
  if (body.zone && body.zone !== "fr" && body.zone !== "eu") return fail("Zone de livraison invalide");

  try {
    const db = getSupabaseAdmin();
    const { data: product } = await db.from("products").select("*").eq("id", body.productId).maybeSingle<Product>();
    if (!product) return fail("Livre introuvable", 404);

    const user = await getUser(req, db);
    const params = buildCheckoutParams({
      product,
      format: body.format,
      zone: body.zone,
      customer: user?.email ? { id: user.id, email: user.email } : null,
      siteUrl: siteUrl(),
    });
    const session = await getStripe().checkout.sessions.create(params);
    return json({ url: session.url });
  } catch (error) {
    if (error instanceof CheckoutError) return fail(error.message);
    console.error("checkout", error);
    return fail("Le paiement est momentanément indisponible. Réessayez dans quelques minutes.", 500);
  }
};

export const config: Config = { path: "/api/checkout" };
