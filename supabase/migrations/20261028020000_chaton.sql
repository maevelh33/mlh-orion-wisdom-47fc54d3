-- Chaton en précommande, en ebook seulement (pas de version papier pour l'instant).
-- À exécuter une fois dans Supabase : SQL Editor > New query (onglet vide) > coller > Run.
-- Prix et date de sortie se modifient ensuite dans Administration > Livres.
insert into public.products (id, title, release_label, ebook_price_cents, paper_price_cents)
values ('chaton', 'Chaton', 'Date à venir', 1250, null)
on conflict (id) do nothing;
