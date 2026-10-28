import { describe, expect, it } from "vitest";
import { displayStatus, formatPrice, grantsEbook } from "./shop";

describe("displayStatus", () => {
  const preorder = { ebook_status: "preorder" as const };
  const available = { ebook_status: "available" as const };

  it("ebook payé : précommandé avant la sortie, disponible après", () => {
    const order = { format: "ebook" as const, status: "paid" as const, shipped_at: null };
    expect(displayStatus(order, preorder).label).toBe("Précommandé");
    expect(displayStatus(order, available).label).toBe("Disponible");
  });

  it("livre papier : précommandé puis expédié", () => {
    const order = { format: "paper" as const, status: "paid" as const, shipped_at: null };
    expect(displayStatus(order, available).label).toBe("Précommandé");
    expect(displayStatus({ ...order, shipped_at: "2027-01-10" }, available).label).toBe("Expédié");
  });

  it("paiement en attente, échoué, remboursé", () => {
    const base = { format: "ebook" as const, shipped_at: null };
    expect(displayStatus({ ...base, status: "pending" }, available).label).toBe("Paiement en cours");
    expect(displayStatus({ ...base, status: "failed" }, available).label).toBe("Paiement échoué");
    expect(displayStatus({ ...base, status: "refunded" }, available).label).toBe("Remboursé");
  });
});

describe("grantsEbook", () => {
  it("donne accès sauf si non payé ou entièrement remboursé", () => {
    expect(grantsEbook({ format: "ebook", status: "paid" })).toBe(true);
    expect(grantsEbook({ format: "ebook", status: "partially_refunded" })).toBe(true);
    expect(grantsEbook({ format: "ebook", status: "refunded" })).toBe(false);
    expect(grantsEbook({ format: "paper", status: "paid" })).toBe(false);
  });
});

it("formatPrice affiche les prix à la française", () => {
  expect(formatPrice(3399).replace(/\s/g, " ")).toBe("33,99 €");
});

it("élide « de » devant une voyelle ou un h muet", async () => {
  const { de } = await import("./shop");
  expect(de("Hybris")).toBe("d'Hybris");
  expect(de("Chaton")).toBe("de Chaton");
  expect(de("<strong>Hybris</strong>")).toBe("d'<strong>Hybris</strong>");
});
