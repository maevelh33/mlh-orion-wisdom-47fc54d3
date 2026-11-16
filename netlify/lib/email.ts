import type { Course, Enrollment } from "../../src/lib/course";
import { de, formatLabel, formatPrice, type Order, type Product } from "../../src/lib/shop";
import { requireEnv } from "./env";

export interface Email {
  to: string;
  toName?: string | null;
  subject: string;
  html: string;
}

export type Mailer = (email: Email) => Promise<void>;

/** Envoi par l'API transactionnelle de Brevo. */
export const brevoMailer: Mailer = async ({ to, toName, subject, html }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": requireEnv("BREVO_API_KEY"), "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: requireEnv("MAIL_FROM_EMAIL"), name: process.env.MAIL_FROM_NAME || "Maëve Orion" },
      replyTo: process.env.MAIL_REPLY_TO ? { email: process.env.MAIL_REPLY_TO } : undefined,
      to: [{ email: to, name: toName || undefined }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status} : ${await res.text()}`);
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Couleurs du site (src/index.css) : crème, bordeaux, encre.
const C = { cream: "#f6f1ea", paper: "#fbf8f4", ink: "#2b2522", muted: "#7a6f68", bordeaux: "#6f2934", line: "#e6ddd2" };

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${C.bordeaux};color:${C.paper};text-decoration:none;font-family:Arial,sans-serif;font-size:13px;letter-spacing:3px;text-transform:uppercase;padding:14px 28px">${esc(label)}</a>`;

/** Mise en page commune : logo, contenu, pied de page. */
export const layout = (title: string, body: string, site: string) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:${C.cream};padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.paper};border:1px solid ${C.line}">
      <tr><td style="padding:32px 40px 8px;text-align:center;font-family:Georgia,'Cormorant Garamond',serif;font-size:22px;letter-spacing:2px;color:${C.ink}">
        MLH.<span style="color:${C.bordeaux}">ORION</span>
      </td></tr>
      <tr><td style="padding:0 40px"><div style="width:48px;height:1px;background:${C.bordeaux};margin:16px auto 24px"></div></td></tr>
      <tr><td style="padding:0 40px 32px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:${C.muted}">
        <h1 style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:normal;font-size:26px;color:${C.ink};margin:0 0 16px">${esc(title)}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:20px 40px;border-top:1px solid ${C.line};font-family:Arial,sans-serif;font-size:12px;color:${C.muted};text-align:center">
        Maëve Orion — <a href="${esc(site)}" style="color:${C.muted}">mlhorion.com</a><br>
        Vous recevez cet e-mail suite à votre commande.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

const p = (text: string) => `<p style="margin:0 0 16px">${text}</p>`;

const summary = (order: Order, product: Product) => {
  const rows = [
    [`${esc(product.title)} — ${formatLabel(order.format)}`, formatPrice(order.amount_total_cents - order.shipping_cents, order.currency)],
    ...(order.shipping_cents ? [["Livraison", formatPrice(order.shipping_cents, order.currency)]] : []),
    ["<strong>Total</strong>", `<strong>${formatPrice(order.amount_total_cents, order.currency)}</strong>`],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line};margin:8px 0 24px">${rows
    .map(([a, b]) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};color:${C.ink}">${a}</td><td style="padding:10px 0;border-bottom:1px solid ${C.line};text-align:right;color:${C.ink}">${b}</td></tr>`)
    .join("")}</table>`;
};

const greeting = (order: Pick<Order, "customer_name">) => p(order.customer_name ? `Bonjour ${esc(order.customer_name.split(" ")[0])},` : "Bonjour,");

export const orderConfirmationEmail = (order: Order, product: Product, site: string): Email => {
  const ready = order.format === "ebook" && product.ebook_status === "available";
  const next =
    order.format === "paper"
      ? `Votre exemplaire vous sera expédié à la sortie du livre${product.release_label ? ` (${esc(product.release_label.toLowerCase())})` : ""}.${order.dedication ? ` Il sera dédicacé pour <strong>${esc(order.dedication)}</strong>.` : ""}`
      : ready
        ? "Votre ebook est disponible dès maintenant dans votre espace."
        : `Votre ebook sera disponible dans votre espace à sa sortie${product.release_label ? ` (${esc(product.release_label.toLowerCase())})` : ""}. Je vous préviendrai par e-mail ce jour-là.`;
  return {
    to: order.email,
    toName: order.customer_name,
    subject: ready ? `Votre ebook ${product.title} est prêt` : `Votre précommande ${de(product.title)} est confirmée`,
    html: layout(
      ready ? "Merci pour votre achat" : "Merci pour votre précommande",
      greeting(order) +
        p(`Votre paiement est confirmé. ${next}`) +
        summary(order, product) +
        p("Retrouvez vos achats, leur statut et vos livres dans votre espace, en vous connectant avec cette adresse e-mail.") +
        `<p style="text-align:center;margin:28px 0 8px">${button(`${site}/compte`, "Mon espace")}</p>`,
      site,
    ),
  };
};

export const paymentFailedEmail = (order: Order, product: Product, site: string): Email => ({
  to: order.email,
  toName: order.customer_name,
  subject: `Votre paiement pour ${product.title} n'a pas abouti`,
  html: layout(
    "Le paiement n'a pas abouti",
    greeting(order) +
      p(`Votre banque a refusé le paiement de votre commande ${de(`<strong>${esc(product.title)}</strong>`)} (${formatLabel(order.format).toLowerCase()}). Aucune somme n'a été prélevée.`) +
      p("Vous pouvez recommencer quand vous le souhaitez :") +
      `<p style="text-align:center;margin:28px 0 8px">${button(`${site}/livres/${product.id}/precommander`, "Réessayer")}</p>`,
    site,
  ),
});

export const refundEmail = (order: Order, product: Product, site: string): Email => {
  const full = order.status === "refunded";
  return {
    to: order.email,
    toName: order.customer_name,
    subject: `Remboursement de votre commande ${de(product.title)}`,
    html: layout(
      full ? "Votre commande a été remboursée" : "Remboursement partiel effectué",
      greeting(order) +
        p(`Un remboursement de <strong>${formatPrice(order.amount_refunded_cents, order.currency)}</strong> a été effectué pour votre commande ${de(esc(product.title))} (${formatLabel(order.format).toLowerCase()}).`) +
        p("Il apparaîtra sur votre compte bancaire sous 5 à 10 jours ouvrés, selon votre banque.") +
        (full && order.format === "ebook" ? p("L'accès à cet ebook a été retiré de votre espace.") : ""),
      site,
    ),
  };
};

export const bookAvailableEmail = (order: Order, product: Product, site: string): Email => ({
  to: order.email,
  toName: order.customer_name,
  subject: `${product.title} est disponible`,
  html: layout(
    `${product.title} est enfin là`,
    greeting(order) +
      p(`Le jour est venu : votre ebook <strong>${esc(product.title)}</strong> est disponible. Merci de l'avoir attendu.`) +
      p("Vous pouvez le lire en ligne ou le télécharger depuis votre espace. Connectez-vous avec cette adresse e-mail : un lien de connexion vous sera envoyé.") +
      `<p style="text-align:center;margin:28px 0 8px">${button(`${site}/compte`, "Lire mon livre")}</p>`,
    site,
  ),
});

/** Lien de connexion avec l'adresse pré-remplie (dans le fragment #, qui n'est jamais envoyé au serveur). */
export const loginLink = (site: string, email: string, next?: string) =>
  `${site}/connexion${next ? `?suite=${encodeURIComponent(next)}` : ""}#email=${encodeURIComponent(email)}`;

/** Invitation des acheteurs des anciennes précommandes (importées) à découvrir leur espace. */
export const welcomeEmail = (order: Order, product: Product, site: string): Email => {
  const link = loginLink(site, order.email);
  const li = (text: string) => `<li style="margin:0 0 8px">${text}</li>`;
  return {
    to: order.email,
    toName: order.customer_name,
    subject: "Votre espace vous attend sur mlhorion.com",
    html: layout(
      "Votre espace vous attend",
      greeting(order) +
        p(
          `Vous avez fait partie des tout premiers à précommander <strong>${esc(product.title)}</strong>, avant même que la boutique n'existe. Merci : votre confiance compte énormément pour moi.`,
        ) +
        p("Pour vous accueillir comme il se doit, j'ai ouvert sur mon site un espace rien qu'à vous. Vous y retrouverez :") +
        `<ul style="margin:0 0 20px;padding-left:20px">${[
          `votre précommande ${de(esc(product.title))} et son suivi, jusqu'à l'expédition de votre exemplaire ;`,
          "les nouvelles de la sortie, dès qu'elles tombent ;",
          "bientôt, mes livres numériques à lire directement en ligne.",
        ]
          .map(li)
          .join("")}</ul>` +
        p(`Pas de mot de passe à retenir : connectez-vous simplement avec cette adresse e-mail (<strong>${esc(order.email)}</strong>), et un lien de connexion vous sera envoyé.`) +
        `<p style="text-align:center;margin:28px 0 12px">${button(link, "Découvrir mon espace")}</p>` +
        `<p style="margin:0 0 24px;text-align:center;font-size:12px">Ou copiez ce lien : <a href="${esc(link)}" style="color:${C.bordeaux};word-break:break-all">${esc(link)}</a></p>` +
        p(`À très bientôt dans les pages ${de(esc(product.title))},`) +
        `<p style="margin:0;font-family:Georgia,'Cormorant Garamond',serif;font-size:20px;color:${C.ink}">Maëve</p>`,
      site,
    ),
  };
};

// ---------------------------------------------------------------------------
// Formation
// ---------------------------------------------------------------------------

export const courseWelcomeEmail = (enrollment: Enrollment, course: Course, site: string): Email => ({
  to: enrollment.email,
  toName: enrollment.customer_name,
  subject: `Bienvenue dans la formation « ${course.title} »`,
  html: layout(
    "Bienvenue dans la formation",
    greeting(enrollment) +
      p(`Votre paiement de <strong>${formatPrice(enrollment.amount_total_cents, enrollment.currency)}</strong> est confirmé : la formation <strong>${esc(course.title)}</strong> est à vous, à vie.`) +
      p("Toutes les leçons vous attendent dans votre espace. Vous y suivez votre avancement, reprenez là où vous vous êtes arrêté et prenez vos notes, leçon après leçon.") +
      p(`Connectez-vous avec cette adresse e-mail (<strong>${esc(enrollment.email)}</strong>) : un lien de connexion vous sera envoyé.`) +
      `<p style="text-align:center;margin:28px 0 8px">${button(loginLink(site, enrollment.email, "/compte/formation"), "Commencer la formation")}</p>`,
    site,
  ),
});

export const coursePaymentFailedEmail = (enrollment: Enrollment, course: Course, site: string): Email => ({
  to: enrollment.email,
  toName: enrollment.customer_name,
  subject: "Votre paiement pour la formation n'a pas abouti",
  html: layout(
    "Le paiement n'a pas abouti",
    greeting(enrollment) +
      p(`Votre banque a refusé le paiement de la formation <strong>${esc(course.title)}</strong>. Aucune somme n'a été prélevée.`) +
      p("Vous pouvez recommencer quand vous le souhaitez :") +
      `<p style="text-align:center;margin:28px 0 8px">${button(`${site}/formation`, "Réessayer")}</p>`,
    site,
  ),
});

export const courseRefundEmail = (enrollment: Enrollment, course: Course, site: string): Email => {
  const full = enrollment.status === "refunded";
  return {
    to: enrollment.email,
    toName: enrollment.customer_name,
    subject: "Remboursement de votre formation",
    html: layout(
      full ? "Votre formation a été remboursée" : "Remboursement partiel effectué",
      greeting(enrollment) +
        p(`Un remboursement de <strong>${formatPrice(enrollment.amount_refunded_cents, enrollment.currency)}</strong> a été effectué pour la formation <strong>${esc(course.title)}</strong>.`) +
        p("Il apparaîtra sur votre compte bancaire sous 5 à 10 jours ouvrés, selon votre banque.") +
        (full ? p("L'accès à la formation a été retiré de votre espace.") : ""),
      site,
    ),
  };
};

/** Invitation des personnes qui avaient acheté la formation avant le site (ancien lien Stripe, accès offert). */
export const courseInvitationEmail = (enrollment: Pick<Enrollment, "email" | "customer_name">, course: Course, site: string): Email => {
  const link = loginLink(site, enrollment.email, "/compte/formation");
  return {
    to: enrollment.email,
    toName: enrollment.customer_name,
    subject: "Votre formation a un nouveau chez-elle",
    html: layout(
      "Votre formation vous attend",
      greeting(enrollment) +
        p(`Merci encore d'avoir rejoint la formation <strong>${esc(course.title)}</strong>.`) +
        p("Elle a désormais sa place sur mon site, dans un espace rien qu'à vous : toutes les leçons au même endroit, votre avancement, la reprise là où vous vous êtes arrêté, et vos notes personnelles pour chaque leçon.") +
        p(`Connectez-vous simplement avec cette adresse e-mail (<strong>${esc(enrollment.email)}</strong>) : un lien de connexion vous sera envoyé, et votre accès est déjà ouvert.`) +
        `<p style="text-align:center;margin:28px 0 12px">${button(link, "Accéder à ma formation")}</p>` +
        `<p style="margin:0 0 24px;text-align:center;font-size:12px">Ou copiez ce lien : <a href="${esc(link)}" style="color:${C.bordeaux};word-break:break-all">${esc(link)}</a></p>` +
        p("Belle écriture,") +
        `<p style="margin:0;font-family:Georgia,'Cormorant Garamond',serif;font-size:20px;color:${C.ink}">Maëve</p>`,
      site,
    ),
  };
};
