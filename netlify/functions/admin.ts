// POST /api/admin { action, ... } : actions réservées à l'administratrice.
//   notify-availability { productId }            → e-mail « disponible » aux acheteurs de l'ebook
//   import-stripe { paymentLinkUrl, productId, format } → importe les anciennes précommandes
//   welcome-list / welcome                        → invite les acheteurs importés à découvrir leur espace
//   test-email                                    → s'envoie un e-mail d'essai (vérifie Brevo)
import type { Config } from "@netlify/functions";
import { importPaymentLink, listWelcomePending, notifyAvailability, sendWelcome } from "../lib/admin";
import { getStripe, getSupabaseAdmin } from "../lib/clients";
import { brevoMailer, layout } from "../lib/email";
import { siteUrl } from "../lib/env";
import { fail, getUser, isAdmin, json } from "../lib/http";

export default async (req: Request) => {
  if (req.method !== "POST") return fail("Méthode non autorisée", 405);

  const db = getSupabaseAdmin();
  const user = await getUser(req, db);
  if (!user || !(await isAdmin(db, user.id))) return fail("Accès réservé à l'administratrice.", 403);

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return fail("Requête invalide");
  }

  try {
    switch (body.action) {
      case "notify-availability":
        return json(await notifyAvailability(db, brevoMailer, body.productId, siteUrl()));
      case "import-stripe":
        if (!["auto", "ebook", "paper"].includes(body.format)) return fail("Format invalide");
        return json(
          await importPaymentLink(db, getStripe(), {
            paymentLinkUrl: body.paymentLinkUrl,
            productId: body.productId,
            format: body.format as "auto" | "ebook" | "paper",
          }),
        );
      case "welcome-list":
        return json({ people: await listWelcomePending(db) });
      case "welcome":
        return json(await sendWelcome(db, brevoMailer, siteUrl()));
      case "test-email":
        await brevoMailer({
          to: user.email!,
          subject: "E-mail d'essai — boutique MLH.ORION",
          html: layout("Tout fonctionne", "<p>Si vous lisez ceci, l'envoi des e-mails de la boutique est bien configuré.</p>", siteUrl()),
        });
        return json({ sent: user.email });
      default:
        return fail("Action inconnue");
    }
  } catch (error) {
    console.error(`admin ${body.action}`, error);
    return fail(error instanceof Error ? error.message : "Erreur inconnue", 500);
  }
};

export const config: Config = { path: "/api/admin" };
