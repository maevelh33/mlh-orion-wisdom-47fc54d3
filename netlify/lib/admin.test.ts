// @vitest-environment node
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Order } from "../../src/lib/shop";
import { listWelcomePending, sendWelcome } from "./admin";
import { loginLink, welcomeEmail, type Email } from "./email";

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

const order = (o: Partial<Order>) =>
  ({
    id: crypto.randomUUID(),
    product_id: "hybris",
    format: "paper",
    status: "paid",
    source: "import",
    amount_total_cents: 3399,
    amount_refunded_cents: 0,
    customer_name: null,
    welcome_sent_at: null,
    created_at: "2026-01-01",
    ...o,
  }) as Order;

const setup = () => {
  const orders = [
    order({ email: "lou@example.com", customer_name: "Lou Martin" }),
    order({ email: "lou@example.com" }), // deux exemplaires : un seul e-mail
    order({ email: "sam@example.com" }),
    order({ email: "rembourse@example.com", status: "refunded", amount_refunded_cents: 3399 }),
    order({ email: "boutique@example.com", source: "checkout" }), // commande faite sur la nouvelle boutique
    order({ email: "ebook@example.com", format: "ebook", amount_total_cents: 1500 }),
    order({ email: "deja@example.com", welcome_sent_at: "2026-10-01" }),
  ];
  const products = [{ id: "hybris", title: "Hybris", release_label: "Début 2027", ebook_status: "preorder" }];
  const sent: Email[] = [];
  const db = fakeDb({ orders: orders as unknown as Record<string, unknown>[], products });
  return { db, orders, sent, mail: async (e: Email) => void sent.push(e) };
};

describe("invitation des premiers acheteurs", () => {
  it("ne vise que les précommandes papier de Hybris importées et payées", async () => {
    const { db } = setup();
    const people = await listWelcomePending(db);
    expect(people.map((p) => p.email).sort()).toEqual(["lou@example.com", "sam@example.com"]);
    expect(people.find((p) => p.email === "lou@example.com")).toMatchObject({ paid_cents: 6798, orders: 2, name: "Lou Martin" });
  });

  it("envoie un seul e-mail par personne, et jamais deux fois", async () => {
    const { db, sent, mail } = setup();
    expect(await sendWelcome(db, mail, "https://mlhorion.com")).toEqual({ sent: 2, remaining: 0, failures: [] });
    expect(sent.map((e) => e.to).sort()).toEqual(["lou@example.com", "sam@example.com"]);

    await sendWelcome(db, mail, "https://mlhorion.com");
    expect(sent).toHaveLength(2);
    expect(await listWelcomePending(db)).toEqual([]);
  });
});

describe("e-mail de bienvenue", () => {
  it("contient le bouton et le lien direct, l'adresse hors de la partie envoyée au serveur", () => {
    const o = order({ email: "lou+livres@example.com", customer_name: "Lou Martin" });
    const mail = welcomeEmail(o, { id: "hybris", title: "Hybris" } as never, "https://mlhorion.com");
    const link = loginLink("https://mlhorion.com", o.email);
    expect(link).toBe("https://mlhorion.com/connexion#email=lou%2Blivres%40example.com");
    expect(mail.subject).toBe("Votre espace vous attend sur mlhorion.com");
    expect(mail.html).toContain("Bonjour Lou,");
    expect(mail.html).toContain(`href="${link}"`);
    expect(mail.html).toContain("Découvrir mon espace");
  });
});
