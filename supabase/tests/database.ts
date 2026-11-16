// PostgreSQL en mémoire (PGlite) avec une imitation minimale des schémas « auth » et « storage »
// de Supabase, pour vérifier les migrations et les règles d'accès.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

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

// Comme Supabase : les clients connectés ont les droits SQL, limités ensuite par les règles RLS.
const GRANTS = `
  grant usage on schema public, auth, storage to authenticated;
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant select, insert, update, delete on storage.objects to authenticated;
  grant execute on all functions in schema public, auth to authenticated;
`;

export const MIGRATIONS = [
  "20261028000000_boutique.sql",
  "20261028010000_bienvenue.sql",
  "20261028020000_chaton.sql",
  "20261116000000_formation.sql",
];

export const startDatabase = async () => {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  for (const file of MIGRATIONS) await db.exec(readFileSync(join(__dirname, "../migrations", file), "utf8"));
  await db.exec(GRANTS);

  /** Exécute une requête comme le client connecté `uid`, soumise aux règles RLS. */
  const asUser = async <T>(uid: string | null, sql: string, params: unknown[] = []) => {
    await db.exec(`set test.uid = '${uid ?? ""}'; set role authenticated;`);
    try {
      return (await db.query<T>(sql, params)).rows;
    } finally {
      await db.exec("reset role;");
    }
  };
  return { db, asUser };
};
