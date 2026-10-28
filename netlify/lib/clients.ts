import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

let stripe: Stripe | undefined;
let supabase: SupabaseClient | undefined;

export const getStripe = () => (stripe ??= new Stripe(requireEnv("STRIPE_SECRET_KEY")));

/** Client Supabase « service_role » : ignore les règles RLS, réservé au serveur. */
export const getSupabaseAdmin = () =>
  (supabase ??= createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
