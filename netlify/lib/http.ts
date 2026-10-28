import type { SupabaseClient, User } from "@supabase/supabase-js";

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export const fail = (message: string, status = 400) => json({ error: message }, status);

/** Client connecté d'après le jeton Supabase envoyé par le site (en-tête Authorization). */
export const getUser = async (req: Request, db: SupabaseClient): Promise<User | null> => {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
};

export const isAdmin = async (db: SupabaseClient, userId: string) => {
  const { data } = await db.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  return Boolean(data?.is_admin);
};
