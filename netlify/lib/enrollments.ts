import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course, Enrollment } from "../../src/lib/course";
import type { OrderStatus } from "../../src/lib/shop";

/** Accès aux inscriptions à la formation (Supabase en vrai, mémoire en test). */
export interface CourseRepo {
  getCourse(id: string): Promise<Course | null>;
  findEnrollmentBySession(sessionId: string): Promise<Enrollment | null>;
  findEnrollmentByPaymentIntent(paymentIntentId: string): Promise<Enrollment | null>;
  upsertEnrollment(row: Partial<Enrollment> & { stripe_session_id: string }): Promise<Enrollment>;
  updateEnrollment(id: string, patch: Partial<Enrollment>): Promise<Enrollment>;
}

export interface CourseDeps {
  repo: CourseRepo;
  /** Envoie l'e-mail correspondant ; une erreur d'envoi ne doit pas bloquer l'enregistrement. */
  sendEmail: (kind: "confirmation" | "failed" | "refund", enrollment: Enrollment, course: Course) => Promise<void>;
}

/** Ce que le traitement des événements partage avec celui des livres. */
interface Shared {
  findUserIdByEmail(email: string): Promise<string | null>;
  notify(userId: string, notification: { title: string; body: string; link?: string }): Promise<void>;
  getReceiptUrl?: (paymentIntentId: string) => Promise<string | null>;
  log: (message: string, extra?: unknown) => void;
}

const idOf = (value: string | { id: string } | null | undefined) => (typeof value === "string" ? value : value?.id ?? null);

export const isCourseSession = (session: Stripe.Checkout.Session) => session.metadata?.kind === "course";

/** Convertit une session Checkout terminée en inscription. */
export const enrollmentFromSession = (session: Stripe.Checkout.Session, fallbackCourseId?: string): Partial<Enrollment> & { stripe_session_id: string } => {
  const status: OrderStatus = session.payment_status === "unpaid" ? "pending" : "paid";
  const email = session.customer_details?.email ?? session.customer_email ?? "";
  return {
    stripe_session_id: session.id,
    stripe_payment_intent_id: idOf(session.payment_intent),
    email: email.toLowerCase(),
    customer_name: session.customer_details?.name ?? null,
    course_id: session.metadata?.course_id ?? fallbackCourseId,
    status,
    amount_total_cents: session.amount_total ?? 0,
    currency: session.currency ?? "eur",
    paid_at: status === "paid" ? new Date(session.created * 1000).toISOString() : null,
  };
};

/** Paiement de la formation (terminé, confirmé plus tard ou échoué). Idempotent. */
export const handleCourseSession = async (event: Stripe.Event, deps: CourseDeps, shared: Shared): Promise<string> => {
  const session = event.data.object as Stripe.Checkout.Session;
  const { repo } = deps;
  const previous = await repo.findEnrollmentBySession(session.id);
  const previousStatus = previous?.status;
  const row = enrollmentFromSession(session);
  if (event.type === "checkout.session.async_payment_succeeded") row.status = "paid";
  if (event.type === "checkout.session.async_payment_failed") row.status = "failed";
  // Un remboursement déjà enregistré ne doit pas être écrasé par un événement en retard.
  if (previous && (previous.status === "refunded" || previous.status === "partially_refunded")) row.status = previous.status;
  row.paid_at = row.status === "paid" ? (previous?.paid_at ?? new Date().toISOString()) : (previous?.paid_at ?? null);
  row.user_id = previous?.user_id ?? session.metadata?.user_id ?? (row.email ? await shared.findUserIdByEmail(row.email) : null);
  if (row.stripe_payment_intent_id && shared.getReceiptUrl && row.status === "paid" && !previous?.receipt_url) {
    row.receipt_url = await shared.getReceiptUrl(row.stripe_payment_intent_id).catch(() => null);
  }

  const enrollment = await repo.upsertEnrollment(row);
  const course = await repo.getCourse(enrollment.course_id);
  if (!course) throw new Error(`Formation inconnue : ${enrollment.course_id}`);

  if (enrollment.status !== previousStatus) {
    if (enrollment.status === "paid") {
      await deps.sendEmail("confirmation", enrollment, course).catch((e) => shared.log("e-mail de bienvenue (formation) non envoyé", e));
      if (enrollment.user_id) {
        await shared.notify(enrollment.user_id, {
          title: `Bienvenue dans la formation « ${course.title} »`,
          body: "Toutes les leçons vous attendent. Bonne écriture !",
          link: "/compte/formation",
        });
      }
    } else if (enrollment.status === "failed") {
      await deps.sendEmail("failed", enrollment, course).catch((e) => shared.log("e-mail d'échec (formation) non envoyé", e));
    }
  }
  return `inscription ${enrollment.id} : ${enrollment.status}`;
};

/** Remboursement d'une inscription : l'accès est retiré s'il est total. */
export const handleCourseRefund = async (charge: Stripe.Charge, deps: CourseDeps, shared: Shared): Promise<string> => {
  const paymentIntentId = idOf(charge.payment_intent);
  if (!paymentIntentId) return "ignoré : remboursement sans paiement associé";
  const enrollment = await deps.repo.findEnrollmentByPaymentIntent(paymentIntentId);
  if (!enrollment) return "ignoré : remboursement d'un paiement hors boutique";

  const status: OrderStatus = charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded";
  if (enrollment.status === status && enrollment.amount_refunded_cents === charge.amount_refunded) return "déjà enregistré";

  const updated = await deps.repo.updateEnrollment(enrollment.id, {
    status,
    amount_refunded_cents: charge.amount_refunded,
    refunded_at: new Date().toISOString(),
  });
  const course = await deps.repo.getCourse(updated.course_id);
  if (course) {
    await deps.sendEmail("refund", updated, course).catch((e) => shared.log("e-mail de remboursement (formation) non envoyé", e));
    if (updated.user_id) {
      await shared.notify(updated.user_id, {
        title: status === "refunded" ? "Formation remboursée" : "Remboursement partiel de la formation",
        body: "Le montant apparaîtra sur votre compte sous quelques jours.",
        link: "/compte",
      });
    }
  }
  return `inscription ${updated.id} : ${status}`;
};

/** Implémentation Supabase (clé service_role). */
export const supabaseCourseRepo = (db: SupabaseClient): CourseRepo => {
  const one = async <T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>) => {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  };
  return {
    getCourse: (id) => one(db.from("courses").select("*").eq("id", id).maybeSingle()),
    findEnrollmentBySession: (id) => one(db.from("enrollments").select("*").eq("stripe_session_id", id).maybeSingle()),
    findEnrollmentByPaymentIntent: (pi) => one(db.from("enrollments").select("*").eq("stripe_payment_intent_id", pi).maybeSingle()),
    upsertEnrollment: async (row) => (await one(db.from("enrollments").upsert(row, { onConflict: "stripe_session_id" }).select("*").single()))!,
    updateEnrollment: async (id, patch) => (await one(db.from("enrollments").update(patch).eq("id", id).select("*").single()))!,
  };
};
