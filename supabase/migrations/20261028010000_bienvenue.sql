-- E-mail de bienvenue aux clients des anciennes précommandes (importées depuis Stripe).
-- À exécuter une fois dans Supabase : SQL Editor > New query (onglet vide) > coller > Run.
alter table public.orders add column if not exists welcome_sent_at timestamptz;
