import { createClient } from "@supabase/supabase-js";

// Clés publiques (sans danger côté navigateur : l'accès est limité par les règles RLS).
// À définir dans Netlify : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Vaut null tant que la boutique n'est pas configurée : les pages l'affichent proprement. */
export const supabase = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true, detectSessionInUrl: true } }) : null;

export const shopConfigured = supabase !== null;
