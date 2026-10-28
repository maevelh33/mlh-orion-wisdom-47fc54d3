import { supabase } from "./supabase";

/** Appelle une fonction serveur (/api/…) avec le jeton du client connecté, s'il y en a un. */
export const callApi = async <T>(path: string, body: unknown): Promise<T> => {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  const res = await fetch(`/api/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Une erreur est survenue. Réessayez dans quelques minutes.");
  return data as T;
};
