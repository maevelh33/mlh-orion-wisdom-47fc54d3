// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Order, Product } from "../../src/lib/shop";
import { bookAvailableEmail, orderConfirmationEmail, refundEmail } from "./email";

const product = { id: "hybris", title: "Hybris", release_label: "Début 2027", ebook_status: "preorder" } as Product;
const order = {
  email: "lou@example.com",
  customer_name: "Lou Martin",
  format: "paper",
  status: "paid",
  amount_total_cents: 3999,
  shipping_cents: 600,
  amount_refunded_cents: 0,
  currency: "eur",
  dedication: "<script>alert(1)</script>",
} as Order;
const site = "https://mlhorion.com";

describe("e-mails", () => {
  it("confirmation de précommande papier : récapitulatif, sortie, dédicace échappée", () => {
    const mail = orderConfirmationEmail(order, product, site);
    expect(mail.subject).toBe("Votre précommande de Hybris est confirmée");
    expect(mail.html).toContain("Bonjour Lou,");
    expect(mail.html).toContain("début 2027");
    expect(mail.html).toMatch(/39,99\s€/);
    expect(mail.html).toMatch(/6,00\s€/);
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("ebook disponible et remboursement", () => {
    const ebook = { ...order, format: "ebook", shipping_cents: 0, amount_total_cents: 1500 } as Order;
    expect(bookAvailableEmail(ebook, product, site).html).toContain(`${site}/compte`);
    const refund = refundEmail({ ...ebook, status: "refunded", amount_refunded_cents: 1500 }, product, site);
    expect(refund.html).toMatch(/15,00\s€/);
    expect(refund.html).toContain("L'accès à cet ebook a été retiré");
  });
});
