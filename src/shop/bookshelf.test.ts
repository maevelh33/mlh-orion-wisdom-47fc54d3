import { describe, expect, it } from "vitest";
import type { Order } from "@/lib/shop";
import { bookshelf, teaser } from "./bookshelf";

const order = (o: Partial<Order>) => ({ status: "paid", format: "ebook", ...o }) as Order;
const ORDER = ["chaton", "hybris"];
const forSale = () => true;

describe("bookshelf", () => {
  it("avec Hybris, propose Chaton", () => {
    const { owned, suggestions } = bookshelf([order({ product_id: "hybris", format: "paper" })], ORDER, forSale);
    expect(owned.map((e) => e.slug)).toEqual(["hybris"]);
    expect(owned[0].paper).toBeDefined();
    expect(owned[0].ebook).toBeUndefined();
    expect(suggestions).toEqual(["chaton"]);
  });

  it("sans achat, propose les deux livres", () => {
    expect(bookshelf([], ORDER, forSale)).toEqual({ owned: [], suggestions: ["chaton", "hybris"] });
  });

  it("un échec ou un remboursement ne compte pas comme un achat", () => {
    const orders = [order({ product_id: "chaton", status: "failed" }), order({ product_id: "hybris", status: "refunded" })];
    expect(bookshelf(orders, ORDER, forSale).suggestions).toEqual(["chaton", "hybris"]);
  });

  it("garde la commande payée plutôt que celle en attente", () => {
    const paid = order({ id: "payee", product_id: "chaton" });
    const { owned } = bookshelf([order({ id: "attente", product_id: "chaton", status: "pending" }), paid], ORDER, forSale);
    expect(owned[0].ebook?.id).toBe("payee");
  });

  it("ne propose pas un livre qui n'est pas en vente", () => {
    expect(bookshelf([], ORDER, (slug) => slug === "hybris").suggestions).toEqual(["hybris"]);
  });
});

it("teaser coupe à la fin d'un mot", () => {
  expect(teaser("un deux trois quatre", 10)).toBe("un deux…");
  expect(teaser("court")).toBe("court");
});
