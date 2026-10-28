// @vitest-environment node
// Vérifie la migration et les règles d'accès sur un PostgreSQL en mémoire (PGlite),
// avec une imitation minimale des schémas « auth » et « storage » de Supabase.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const migration = ["20261028000000_boutique.sql", "20261028010000_bienvenue.sql"]
  .map((f) => readFileSync(join(__dirname, "../migrations", f), "utf8"))
  .join("\n");

const SUPABASE_STUB = `
  create schema auth;
  create table auth.users (id uuid primary key, email text not null);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('test.uid', true), '')::uuid
  $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create role authenticated;
`;

const GRANTS = `
  grant usage on schema public, auth, storage to authenticated;
  grant select, update on all tables in schema public to authenticated;
  grant select, insert, update, delete on storage.objects to authenticated;
  grant execute on all functions in schema public, auth to authenticated;
`;

const ADMIN = "00000000-0000-0000-0000-00000000000a";
const ALICE = "00000000-0000-0000-0000-0000000000a1";
const BOB = "00000000-0000-0000-0000-0000000000b0";

let db: PGlite;

/** Exécute une requête comme le client connecté `uid`, soumise aux règles RLS. */
const asUser = async <T>(uid: string | null, sql: string, params: unknown[] = []) => {
  await db.exec(`set test.uid = '${uid ?? ""}'; set role authenticated;`);
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec("reset role;");
  }
};

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  await db.exec(migration);
  await db.exec(GRANTS);

  // Une précommande importée avant qu'Alice n'ait de compte.
  await db.query(
    `insert into public.orders (email, product_id, format, status, amount_total_cents, source)
     values ('Alice@Example.com', 'hybris', 'ebook', 'paid', 1500, 'import')`,
  );
  await db.query(`insert into auth.users (id, email) values ($1, 'admin@mlhorion.com'), ($2, 'alice@example.com'), ($3, 'bob@example.com')`, [ADMIN, ALICE, BOB]);
  await db.query(`update public.profiles set is_admin = true where id = $1`, [ADMIN]);
  await db.query(
    `insert into public.orders (user_id, email, product_id, format, status, amount_total_cents)
     values ($1, 'bob@example.com', 'hybris', 'paper', 'paid', 3399)`,
    [BOB],
  );
  await db.query(`insert into storage.objects (bucket_id, name) values ('ebooks', 'hybris/hybris.pdf')`);
});

describe("migration boutique", () => {
  it("crée Hybris avec ses prix", async () => {
    const [p] = (await db.query<{ ebook_price_cents: number; paper_price_cents: number; ebook_status: string }>(
      "select * from public.products where id = 'hybris'",
    )).rows;
    expect(p).toMatchObject({ ebook_price_cents: 1500, paper_price_cents: 3399, ebook_status: "preorder" });
  });

  it("crée un profil et rattache les commandes du même e-mail à l'inscription", async () => {
    const rows = await asUser<{ user_id: string }>(ALICE, "select user_id from public.orders");
    expect(rows).toEqual([{ user_id: ALICE }]);
  });

  it("un client ne voit que ses commandes", async () => {
    expect(await asUser(BOB, "select format from public.orders")).toEqual([{ format: "paper" }]);
    expect(await asUser(null, "select * from public.orders")).toEqual([]);
  });

  it("l'administratrice voit toutes les commandes et tous les profils", async () => {
    expect(await asUser(ADMIN, "select id from public.orders")).toHaveLength(2);
    expect(await asUser(ADMIN, "select id from public.profiles")).toHaveLength(3);
  });

  it("un client ne peut pas se donner les droits d'administratrice", async () => {
    await asUser(ALICE, "update public.profiles set is_admin = true, full_name = 'Alice' where id = $1", [ALICE]);
    const [p] = (await db.query<{ is_admin: boolean; full_name: string }>("select * from public.profiles where id = $1", [ALICE])).rows;
    expect(p).toEqual(expect.objectContaining({ is_admin: false, full_name: "Alice" }));
  });

  it("un client ne peut pas modifier une commande ni un livre", async () => {
    await asUser(ALICE, "update public.orders set status = 'paid', amount_total_cents = 0");
    await asUser(ALICE, "update public.products set ebook_status = 'available'");
    const [o] = (await db.query<{ amount_total_cents: number }>("select amount_total_cents from public.orders where user_id = $1", [ALICE])).rows;
    const [p] = (await db.query<{ ebook_status: string }>("select ebook_status from public.products")).rows;
    expect(o.amount_total_cents).toBe(1500);
    expect(p.ebook_status).toBe("preorder");
  });

  it("le fichier de l'ebook n'est lisible qu'après la sortie, et seulement par les acheteurs de l'ebook", async () => {
    const read = (uid: string) => asUser(uid, "select name from storage.objects");
    expect(await read(ALICE)).toEqual([]); // précommande : pas encore disponible

    await asUser(ADMIN, "update public.products set ebook_status = 'available'");
    expect(await read(ALICE)).toEqual([{ name: "hybris/hybris.pdf" }]);
    expect(await read(BOB)).toEqual([]); // a acheté le papier, pas l'ebook

    await db.query("update public.orders set status = 'refunded' where user_id = $1", [ALICE]);
    expect(await read(ALICE)).toEqual([]); // remboursé : plus d'accès
  });

  it("seule l'administratrice peut déposer un fichier", async () => {
    await expect(
      asUser(ALICE, "insert into storage.objects (bucket_id, name) values ('ebooks', 'hybris/pirate.pdf')"),
    ).rejects.toThrow(/row-level security/);
    await asUser(ADMIN, "insert into storage.objects (bucket_id, name) values ('ebooks', 'hybris/hybris.epub')");
  });
});
