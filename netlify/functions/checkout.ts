// POST /api/checkout → { url } de la page de paiement Stripe.
//   { productId, format, zone? } : un livre
//   { courseId }                 : la formation (accès immédiat)
import type { Config } from "@netlify/functions";
import type { Course } from "../../src/lib/course";
import type { Format, Product, ShippingZone } from "../../src/lib/shop";
import { buildCheckoutParams, buildCourseCheckoutParams, CheckoutError } from "../lib/checkout";
import { getStripe, getSupabaseAdmin } from "../lib/clients";
import { ConfigError, describeConfigError, requestSiteUrl } from "../lib/env";
import { fail, getUser, json } from "../lib/http";

export default async (req: Request) => {
  if (req.method !== "POST") return fail("Méthode non autorisée", 405);

  let body: { productId?: string; format?: Format; zone?: ShippingZone; courseId?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Requête invalide");
  }
  const forCourse = Boolean(body.courseId);
  if (!forCourse && (!body.productId || (body.format !== "ebook" && body.format !== "paper"))) return fail("Requête invalide");
  if (body.zone && body.zone !== "fr" && body.zone !== "eu") return fail("Zone de livraison invalide");

  try {
    const db = getSupabaseAdmin();
    const user = await getUser(req, db);
    const customer = user?.email ? { id: user.id, email: user.email } : null;
    const siteUrl = requestSiteUrl(req);
    let params;

    if (forCourse) {
      const { data: course, error: dbError } = await db.from("courses").select("*").eq("id", body.courseId).maybeSingle<Course>();
      if (dbError) throw new ConfigError(`base Supabase inaccessible (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ?) : ${dbError.message}`);
      if (!course) return fail("Formation introuvable", 404);
      if (user) {
        // Déjà inscrite ou inscrit : inutile de payer une deuxième fois.
        const { data: existing } = await db
          .from("enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .in("status", ["paid", "partially_refunded"])
          .limit(1);
        if (existing?.length) return fail("Vous avez déjà accès à cette formation : retrouvez-la dans votre espace.", 409);
      }
      params = buildCourseCheckoutParams({ course, customer, siteUrl });
    } else {
      const { data: product, error: dbError } = await db.from("products").select("*").eq("id", body.productId).maybeSingle<Product>();
      if (dbError) throw new ConfigError(`base Supabase inaccessible (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ?) : ${dbError.message}`);
      if (!product) return fail("Livre introuvable", 404);
      params = buildCheckoutParams({ product, format: body.format!, zone: body.zone, customer, siteUrl });
    }

    const session = await getStripe().checkout.sessions.create(params);
    return json({ url: session.url });
  } catch (error) {
    if (error instanceof CheckoutError) return fail(error.message);
    console.error("checkout", error);
    const config = describeConfigError(error);
    // Type d'erreur seul (sans son contenu) : aide au diagnostic sans rien révéler.
    const kind = (error as { type?: string; name?: string } | null)?.type ?? (error as Error | null)?.name ?? "inconnue";
    return fail(`Le paiement est momentanément indisponible.${config ? ` Réglage à vérifier : ${config}.` : ` Réessayez dans quelques minutes. (${kind})`}`, 500);
  }
};

export const config: Config = { path: "/api/checkout" };
