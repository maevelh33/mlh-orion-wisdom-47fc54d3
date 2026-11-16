// @vitest-environment node
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import type { Course, Enrollment } from "../../src/lib/course";
import { listCourseInvites, sendCourseInvites } from "./admin";
import { buildCourseCheckoutParams, CheckoutError } from "./checkout";
import { courseInvitationEmail, type Email } from "./email";
import type { CourseRepo } from "./enrollments";
import { handleStripeEvent, type ShopRepo, type WebhookDeps } from "./orders";

const course: Course = { id: "ecrire-un-livre", title: "Écrire un livre de A à Z", price_cents: 22500, on_sale: true };

/** Inscriptions en mémoire, qui imitent Supabase. */
const memory = () => {
  const enrollments: Enrollment[] = [];
  const notifications: { userId: string; title: string; link?: string }[] = [];
  const courseRepo: CourseRepo = {
    getCourse: async (id) => (id === course.id ? course : null),
    findEnrollmentBySession: async (id) => enrollments.find((e) => e.stripe_session_id === id) ?? null,
    findEnrollmentByPaymentIntent: async (id) => enrollments.find((e) => e.stripe_payment_intent_id === id) ?? null,
    upsertEnrollment: async (row) => {
      const existing = enrollments.find((e) => e.stripe_session_id === row.stripe_session_id);
      if (existing) return Object.assign(existing, row);
      const e = { id: `ins-${enrollments.length + 1}`, amount_refunded_cents: 0, ...row } as Enrollment;
      enrollments.push(e);
      return e;
    },
    updateEnrollment: async (id, patch) => Object.assign(enrollments.find((e) => e.id === id)!, patch),
  };
  const shopRepo = {
    findOrderBySession: async () => null,
    findOrderByPaymentIntent: async () => null,
    findUserIdByEmail: async (email: string) => (email === "eleve@example.com" ? "user-eleve" : null),
    notify: async (userId: string, n: { title: string; link?: string }) => {
      notifications.push({ userId, ...n });
    },
  } as unknown as ShopRepo;
  return { enrollments, notifications, courseRepo, shopRepo };
};

const session = (overrides: Partial<Stripe.Checkout.Session> = {}) =>
  ({
    id: "cs_formation_1",
    created: 1_790_000_000,
    payment_status: "paid",
    payment_intent: "pi_formation_1",
    amount_total: 22500,
    currency: "eur",
    customer_details: { email: "Eleve@Example.com", name: "Lou Martin" },
    metadata: { kind: "course", course_id: course.id },
    ...overrides,
  }) as unknown as Stripe.Checkout.Session;

const event = (type: string, object: unknown) => ({ id: `evt_${type}`, type, data: { object } }) as unknown as Stripe.Event;

let db: ReturnType<typeof memory>;
let sent: string[];
let deps: WebhookDeps;

beforeEach(() => {
  db = memory();
  sent = [];
  deps = {
    repo: db.shopRepo,
    getReceiptUrl: async () => "https://pay.stripe.com/receipts/f",
    sendEmail: async () => {
      throw new Error("pas d'e-mail de livre pour la formation");
    },
    course: {
      repo: db.courseRepo,
      sendEmail: async (kind, e) => {
        sent.push(`${kind}:${e.email}`);
      },
    },
  };
});

describe("webhook Stripe : formation", () => {
  it("inscrit l'élève, la rattache à son compte et envoie un seul e-mail de bienvenue", async () => {
    await handleStripeEvent(event("checkout.session.completed", session()), deps);
    await handleStripeEvent(event("checkout.session.completed", session()), deps); // renvoi de Stripe
    expect(db.enrollments).toHaveLength(1);
    expect(db.enrollments[0]).toMatchObject({
      email: "eleve@example.com",
      user_id: "user-eleve",
      course_id: course.id,
      status: "paid",
      amount_total_cents: 22500,
      receipt_url: "https://pay.stripe.com/receipts/f",
    });
    expect(sent).toEqual(["confirmation:eleve@example.com"]);
    expect(db.notifications).toEqual([expect.objectContaining({ userId: "user-eleve", link: "/compte/formation" })]);
  });

  it("paiement différé refusé : échoué, avec un e-mail pour réessayer", async () => {
    await handleStripeEvent(event("checkout.session.completed", session({ payment_status: "unpaid" })), deps);
    expect(db.enrollments[0].status).toBe("pending");
    await handleStripeEvent(event("checkout.session.async_payment_failed", session({ payment_status: "unpaid" })), deps);
    expect(db.enrollments[0].status).toBe("failed");
    expect(sent).toEqual(["failed:eleve@example.com"]);
  });

  it("un remboursement total retire l'accès", async () => {
    await handleStripeEvent(event("checkout.session.completed", session()), deps);
    const charge = { payment_intent: "pi_formation_1", amount: 22500, amount_refunded: 22500 };
    await handleStripeEvent(event("charge.refunded", charge), deps);
    expect(db.enrollments[0]).toMatchObject({ status: "refunded", amount_refunded_cents: 22500 });
    expect(sent).toEqual(["confirmation:eleve@example.com", "refund:eleve@example.com"]);
  });

  it("sans configuration de la formation, ses paiements sont ignorés", async () => {
    const result = await handleStripeEvent(event("checkout.session.completed", session()), { ...deps, course: undefined });
    expect(result).toMatch(/ignoré/);
  });
});

describe("session de paiement de la formation", () => {
  const params = (c = course) => buildCourseCheckoutParams({ course: c, customer: { id: "u1", email: "eleve@example.com" }, siteUrl: "https://mlhorion.com" });

  it("prix de la base, retour vers la formation, renonciation notée", () => {
    const p = params();
    expect(p.line_items?.[0].price_data?.unit_amount).toBe(22500);
    expect(p.success_url).toBe("https://mlhorion.com/compte/formation?inscription={CHECKOUT_SESSION_ID}");
    expect(p.cancel_url).toBe("https://mlhorion.com/formation?annule=1");
    expect(p.metadata).toMatchObject({ kind: "course", course_id: course.id, user_id: "u1", acces_immediat_renonciation_retractation: "oui" });
    expect(p.shipping_address_collection).toBeUndefined();
  });

  it("refuse quand les inscriptions sont fermées", () => {
    expect(() => params({ ...course, on_sale: false })).toThrow(CheckoutError);
  });
});

/** Imitation minimale du client Supabase : filtres eq / in / is, select, update. */
const fakeDb = (tables: Record<string, Record<string, unknown>[]>) => {
  const query = (table: string) => {
    const filters: ((r: Record<string, unknown>) => boolean)[] = [];
    let patch: Record<string, unknown> | null = null;
    let single = false;
    const q = {
      select: () => q,
      order: () => q,
      returns: () => q,
      eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), q),
      in: (c: string, v: unknown[]) => (filters.push((r) => v.includes(r[c])), q),
      is: (c: string, v: unknown) => (filters.push((r) => (r[c] ?? null) === v), q),
      update: (p: Record<string, unknown>) => ((patch = p), q),
      maybeSingle: () => ((single = true), q),
      then: (resolve: (r: unknown) => void) => {
        const rows = tables[table].filter((r) => filters.every((f) => f(r)));
        if (patch) rows.forEach((r) => Object.assign(r, patch));
        resolve({ data: single ? rows[0] ?? null : rows, error: null });
      },
    };
    return q;
  };
  return { from: query } as unknown as SupabaseClient;
};

describe("invitation des anciens élèves", () => {
  const rows = () => [
    { email: "a@example.com", customer_name: "Ana", course_id: course.id, source: "import", status: "paid", welcome_sent_at: null },
    { email: "a@example.com", customer_name: "Ana", course_id: course.id, source: "import", status: "paid", welcome_sent_at: null },
    { email: "b@example.com", customer_name: null, course_id: course.id, source: "offert", status: "paid", welcome_sent_at: null },
    { email: "rembourse@example.com", customer_name: null, course_id: course.id, source: "import", status: "refunded", welcome_sent_at: null },
    { email: "site@example.com", customer_name: null, course_id: course.id, source: "checkout", status: "paid", welcome_sent_at: null },
  ];

  it("une invitation par personne, jamais aux remboursés ni aux achats faits sur le site, et jamais deux fois", async () => {
    const tables = { enrollments: rows(), courses: [course as unknown as Record<string, unknown>] };
    const db = fakeDb(tables);
    expect((await listCourseInvites(db)).map((p) => p.email)).toEqual(["a@example.com", "b@example.com"]);
    const mails: Email[] = [];
    const r = await sendCourseInvites(db, async (m) => void mails.push(m), "https://mlhorion.com");
    expect(r).toEqual({ sent: 2, remaining: 0, failures: [] });
    expect(mails.map((m) => m.to)).toEqual(["a@example.com", "b@example.com"]);
    expect(await listCourseInvites(db)).toEqual([]);
  });

  it("le lien de l'invitation pré-remplit l'adresse et mène à la formation", () => {
    const mail = courseInvitationEmail({ email: "a@example.com", customer_name: "Ana Lima" }, course, "https://mlhorion.com");
    expect(mail.html).toContain("https://mlhorion.com/connexion?suite=%2Fcompte%2Fformation#email=a%40example.com");
    expect(mail.html).toContain("Bonjour Ana,");
  });
});
