import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { requireEnv } from "./env";

let stripe: Stripe | undefined;
let supabase: SupabaseClient | undefined;

export const getStripe = () => (stripe ??= new Stripe(requireEnv("STRIPE_SECRET_KEY")));

/** Client Supabase « service_role » : ignore les règles RLS, réservé au serveur. */
export const getSupabaseAdmin = () =>
  (supabase ??= createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    // Les fonctions Netlify tournent sous Node 20, sans WebSocket natif : supabase-js
    // refuse alors de démarrer. On lui fournit celui du module « ws » (non utilisé ici).
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
  }));
