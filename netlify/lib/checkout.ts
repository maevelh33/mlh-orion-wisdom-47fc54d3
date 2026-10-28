import type Stripe from "stripe";
import { EU_COUNTRIES, priceFor, shippingFor, type Format, type Product, type ShippingZone } from "../../src/lib/shop";

export class CheckoutError extends Error {}

export interface CheckoutRequest {
  product: Product;
  format: Format;
  zone?: ShippingZone;
  customer?: { id: string; email: string } | null;
  siteUrl: string;
}

/**
 * Paramètres de la session Stripe Checkout. Les prix viennent de la base
 * (table products), jamais du navigateur.
 */
export const buildCheckoutParams = ({ product, format, zone, customer, siteUrl }: CheckoutRequest): Stripe.Checkout.SessionCreateParams => {
  const price = priceFor(product, format);
  if (!price) throw new CheckoutError("Ce format n'est pas en vente.");

  const preorder = format === "paper" || product.ebook_status === "preorder";
  const formatName = format === "ebook" ? "Ebook" : "Livre papier";
  const metadata: Record<string, string> = { product_id: product.id, format };
  if (customer) metadata.user_id = customer.id;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    locale: "fr",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: price,
          product_data: {
            name: `${product.title} — ${formatName}${preorder ? " (précommande)" : ""}`,
            description: preorder && product.release_label ? `Sortie prévue : ${product.release_label}` : undefined,
          },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
    client_reference_id: customer?.id,
    customer_email: customer?.email,
    success_url: `${siteUrl}/compte?commande={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/livres/${product.id}/precommander?annule=1`,
    custom_text: {
      submit: { message: `En validant, vous acceptez les conditions générales de vente : ${siteUrl}/cgv` },
    },
  };

  if (format === "paper") {
    if (!zone) throw new CheckoutError("Choisissez le pays de livraison.");
    const shipping = shippingFor(product, zone);
    if (shipping == null) throw new CheckoutError("La livraison n'est pas encore ouverte pour cette zone.");
    metadata.zone = zone;
    params.shipping_address_collection = {
      allowed_countries: (zone === "fr" ? ["FR"] : [...EU_COUNTRIES]) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
    };
    params.shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: zone === "fr" ? "Envoi en France" : "Envoi en Europe",
          fixed_amount: { amount: shipping, currency: "eur" },
        },
      },
    ];
    params.custom_fields = [
      {
        key: "dedicace",
        label: { type: "custom", custom: "Prénom pour la dédicace (facultatif)" },
        type: "text",
        optional: true,
        text: { maximum_length: 60 },
      },
    ];
  }

  return params;
};
