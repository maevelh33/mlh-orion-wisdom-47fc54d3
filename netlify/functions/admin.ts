// POST /api/admin { action, ... } : actions réservées à l'administratrice.
//   notify-availability { productId }            → e-mail « disponible » aux acheteurs de l'ebook
//   import-stripe { paymentLinkUrl, productId, format } → importe les anciennes précommandes
//   welcome-preview                               → s'envoie l'invitation à soi-même, pour la relire
//   welcome-list / welcome                        → invite les acheteurs importés à découvrir leur espace
//   test-email                                    → s'envoie un e-mail d'essai (vérifie Brevo)
//   course-import { paymentLinkUrl, courseId }    → importe les anciens achats de la formation
//   course-grant { courseId, email, name? }       → offre l'accès à la formation
//   course-invite-list / course-invite            → invite les élèves importés ou offerts
//   course-invite-preview { courseId }            → s'envoie l'invitation à soi-même
import type { Config } from "@netlify/functions";
import {
  importCoursePaymentLink,
  importPaymentLink,
  listCourseInvites,
  listWelcomePending,
  notifyAvailability,
  sendCourseInvites,
  sendWelcome,
} from "../lib/admin";
import { getStripe, getSupabaseAdmin } from "../lib/clients";
import { brevoMailer, courseInvitationEmail, layout, welcomeEmail } from "../lib/email";
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
      case "welcome-preview": {
        const { data: product } = await db.from("products").select("*").eq("id", "hybris").maybeSingle();
        const { data: profile } = await db.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
        if (!product) return fail("Livre introuvable", 404);
        const mail = welcomeEmail({ email: user.email!, customer_name: profile?.full_name ?? null } as never, product, siteUrl());
        await brevoMailer({ ...mail, subject: `[Aperçu] ${mail.subject}` });
        return json({ sent: user.email });
      }
      case "welcome":
        return json(await sendWelcome(db, brevoMailer, siteUrl()));
      case "test-email":
        await brevoMailer({
          to: user.email!,
          subject: "E-mail d'essai — boutique MLH.ORION",
          html: layout("Tout fonctionne", "<p>Si vous lisez ceci, l'envoi des e-mails de la boutique est bien configuré.</p>", siteUrl()),
        });
        return json({ sent: user.email });
      case "course-import":
        return json(await importCoursePaymentLink(db, getStripe(), { paymentLinkUrl: body.paymentLinkUrl, courseId: body.courseId }));
      case "course-grant": {
        const email = body.email?.trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Adresse e-mail invalide");
        const { data: existing } = await db
          .from("enrollments")
          .select("id")
          .eq("course_id", body.courseId)
          .eq("email", email)
          .in("status", ["paid", "partially_refunded"])
          .limit(1);
        if (existing?.length) return fail("Cette personne a déjà accès à la formation.", 409);
        const { data: profile } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
        const { error } = await db.from("enrollments").insert({
          email,
          customer_name: body.name?.trim() || null,
          course_id: body.courseId,
          status: "paid",
          source: "offert",
          user_id: profile?.id ?? null,
          paid_at: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
        return json({ granted: email });
      }
      case "course-invite-list":
        return json({ people: await listCourseInvites(db) });
      case "course-invite-preview": {
        const { data: course } = await db.from("courses").select("*").eq("id", body.courseId).maybeSingle();
        if (!course) return fail("Formation introuvable", 404);
        const { data: profile } = await db.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
        const mail = courseInvitationEmail({ email: user.email!, customer_name: profile?.full_name ?? null }, course, siteUrl());
        await brevoMailer({ ...mail, subject: `[Aperçu] ${mail.subject}` });
        return json({ sent: user.email });
      }
      case "course-invite":
        return json(await sendCourseInvites(db, brevoMailer, siteUrl()));
      default:
        return fail("Action inconnue");
    }
  } catch (error) {
    console.error(`admin ${body.action}`, error);
    return fail(error instanceof Error ? error.message : "Erreur inconnue", 500);
  }
};

export const config: Config = { path: "/api/admin" };
