// @vitest-environment node
// Formation : seuls les inscrits voient les vidéos, chacun ne gère que son propre suivi.
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { startDatabase } from "./database";

const ADMIN = "00000000-0000-0000-0000-00000000000a";
const ELEVE = "00000000-0000-0000-0000-0000000000e1";
const VISITEUR = "00000000-0000-0000-0000-0000000000f1";
const COURSE = "ecrire-un-livre";

let db: PGlite;
let asUser: Awaited<ReturnType<typeof startDatabase>>["asUser"];
let lesson1: string;
let lesson2: string;

beforeAll(async () => {
  ({ db, asUser } = await startDatabase());
  // Achat importé (ancien lien Stripe) avant que l'élève n'ait de compte.
  await db.query(`insert into public.enrollments (email, course_id, status, amount_total_cents, source) values ('Eleve@Example.com', $1, 'paid', 22500, 'import')`, [COURSE]);
  await db.query(`insert into auth.users (id, email) values ($1, 'admin@mlhorion.com'), ($2, 'eleve@example.com'), ($3, 'visiteur@example.com')`, [ADMIN, ELEVE, VISITEUR]);
  await db.query(`update public.profiles set is_admin = true where id = $1`, [ADMIN]);
  await asUser(ADMIN, `insert into public.course_lessons (course_id, position, title, youtube_id) values ($1, 1, 'Trouver son idée', 'aaaaaaaaaaa'), ($1, 2, 'Construire le plan', 'bbbbbbbbbbb')`, [COURSE]);
  await asUser(ADMIN, `insert into public.course_lessons (course_id, position, title, youtube_id, published) values ($1, 3, 'Brouillon', 'ccccccccccc', false)`, [COURSE]);
  [lesson1, lesson2] = (await db.query<{ id: string }>("select id from public.course_lessons order by position")).rows.map((r) => r.id);
  await db.query(`insert into storage.objects (bucket_id, name) values ('formation', $1)`, [`${COURSE}/structure.pdf`]);
});

describe("migration formation", () => {
  it("crée la formation à 225 €", async () => {
    const [c] = (await db.query("select * from public.courses")).rows as Record<string, unknown>[];
    expect(c).toMatchObject({ id: COURSE, title: "Écrire un livre de A à Z", price_cents: 22500, on_sale: true });
  });

  it("rattache l'achat importé au compte créé avec le même e-mail", async () => {
    expect(await asUser(ELEVE, "select user_id, status from public.enrollments")).toEqual([{ user_id: ELEVE, status: "paid" }]);
    expect(await asUser(VISITEUR, "select id from public.enrollments")).toEqual([]);
  });

  it("le programme est public, sans les vidéos ni les leçons non publiées", async () => {
    const outline = await asUser(null, "select * from public.course_outline($1)", [COURSE]);
    expect(outline).toEqual([
      { lesson_position: 1, title: "Trouver son idée", duration_minutes: null, has_attachment: false },
      { lesson_position: 2, title: "Construire le plan", duration_minutes: null, has_attachment: false },
    ]);
  });

  it("seuls les inscrits lisent les leçons publiées et leurs vidéos", async () => {
    expect(await asUser(null, "select youtube_id from public.course_lessons")).toEqual([]);
    expect(await asUser(VISITEUR, "select youtube_id from public.course_lessons")).toEqual([]);
    expect(await asUser(ELEVE, "select youtube_id from public.course_lessons order by position")).toEqual([
      { youtube_id: "aaaaaaaaaaa" },
      { youtube_id: "bbbbbbbbbbb" },
    ]);
    expect(await asUser(ADMIN, "select id from public.course_lessons")).toHaveLength(3);
  });

  it("le PDF n'est lisible que par les inscrits", async () => {
    const read = (uid: string) => asUser(uid, "select name from storage.objects where bucket_id = 'formation'");
    expect(await read(ELEVE)).toEqual([{ name: `${COURSE}/structure.pdf` }]);
    expect(await read(VISITEUR)).toEqual([]);
  });

  it("l'élève enregistre son suivi ; un visiteur non inscrit ne peut pas", async () => {
    await asUser(ELEVE, "insert into public.lesson_progress (user_id, lesson_id, completed_at, notes) values ($1, $2, now(), 'Mes idées')", [ELEVE, lesson1]);
    await asUser(ELEVE, "update public.lesson_progress set notes = 'Mes idées, suite' where lesson_id = $1", [lesson1]);
    expect(await asUser(ELEVE, "select notes from public.lesson_progress")).toEqual([{ notes: "Mes idées, suite" }]);
    await expect(asUser(VISITEUR, "insert into public.lesson_progress (user_id, lesson_id) values ($1, $2)", [VISITEUR, lesson2])).rejects.toThrow(/row-level security/);
    await expect(asUser(VISITEUR, "insert into public.lesson_progress (user_id, lesson_id) values ($1, $2)", [ELEVE, lesson2])).rejects.toThrow(/row-level security/);
    expect(await asUser(VISITEUR, "select * from public.lesson_progress")).toEqual([]);
  });

  it("l'administratrice voit l'avancement des élèves, mais jamais leurs notes", async () => {
    expect(await asUser(ADMIN, "select * from public.lesson_progress")).toEqual([]);
    expect(await asUser(ADMIN, "select user_id, lessons_done from public.course_students($1)", [COURSE])).toEqual([{ user_id: ELEVE, lessons_done: 1 }]);
    expect(await asUser(ELEVE, "select * from public.course_students($1)", [COURSE])).toEqual([]);
  });

  it("un client ne peut ni s'inscrire lui-même, ni modifier les leçons ou le prix", async () => {
    await expect(
      asUser(VISITEUR, "insert into public.enrollments (user_id, email, course_id, status) values ($1, 'visiteur@example.com', $2, 'paid')", [VISITEUR, COURSE]),
    ).rejects.toThrow(/row-level security/);
    await asUser(ELEVE, "update public.courses set price_cents = 1");
    await asUser(ELEVE, "update public.course_lessons set youtube_id = 'zzzzzzzzzzz'");
    expect((await db.query<{ price_cents: number }>("select price_cents from public.courses")).rows[0].price_cents).toBe(22500);
    expect((await db.query("select id from public.course_lessons where youtube_id = 'zzzzzzzzzzz'")).rows).toEqual([]);
  });

  it("un remboursement total retire l'accès", async () => {
    await db.query("update public.enrollments set status = 'refunded' where user_id = $1", [ELEVE]);
    expect(await asUser(ELEVE, "select id from public.course_lessons")).toEqual([]);
    await expect(asUser(ELEVE, "insert into public.lesson_progress (user_id, lesson_id) values ($1, $2)", [ELEVE, lesson2])).rejects.toThrow(/row-level security/);
  });
});
