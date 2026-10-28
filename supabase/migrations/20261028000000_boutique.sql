-- Boutique MLH.ORION : livres, commandes, comptes clients, notifications.
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
-- Le serveur (fonctions Netlify) écrit avec la clé « service_role », qui ignore
-- ces règles ; les visiteurs et clients passent par les règles RLS ci-dessous.

-- ---------------------------------------------------------------------------
-- Livres en vente
-- ---------------------------------------------------------------------------
create table public.products (
  id                       text primary key,                 -- ex. 'hybris' (= slug de l'URL)
  title                    text not null,
  release_label            text not null default '',         -- affiché : « Début 2027 »
  release_date             date,                             -- date précise, si connue
  ebook_status             text not null default 'preorder'
                             check (ebook_status in ('preorder', 'available')),
  ebook_price_cents        integer not null check (ebook_price_cents > 0),
  paper_price_cents        integer check (paper_price_cents > 0),   -- null = pas de version papier
  shipping_fr_cents        integer check (shipping_fr_cents >= 0),  -- null = pas d'envoi en France
  shipping_eu_cents        integer check (shipping_eu_cents >= 0),  -- null = pas d'envoi en Europe
  ebook_file_path          text,                             -- chemin dans le stockage « ebooks »
  updated_at               timestamptz not null default now()
);

insert into public.products (id, title, release_label, ebook_price_cents, paper_price_cents)
values ('hybris', 'Hybris', 'Début 2027', 1500, 3399);

-- ---------------------------------------------------------------------------
-- Profils (un par compte client, créé automatiquement à l'inscription)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (lower(email));

-- ---------------------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------------------
create table public.orders (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references auth.users (id) on delete set null,
  email                     text not null,
  customer_name             text,
  product_id                text not null references public.products (id),
  format                    text not null check (format in ('ebook', 'paper')),
  status                    text not null default 'pending'
                              check (status in ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  amount_total_cents        integer not null default 0,
  amount_refunded_cents     integer not null default 0,
  currency                  text not null default 'eur',
  shipping_cents            integer not null default 0,
  shipping_address          jsonb,
  dedication                text,                            -- prénom pour la dédicace (papier)
  shipped_at                timestamptz,
  stripe_session_id         text unique,
  stripe_payment_intent_id  text unique,
  receipt_url               text,
  source                    text not null default 'checkout' check (source in ('checkout', 'import')),
  availability_notified_at  timestamptz,
  created_at                timestamptz not null default now(),
  paid_at                   timestamptz,
  refunded_at               timestamptz,
  updated_at                timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_email_idx on public.orders (lower(email));
create index orders_product_idx on public.orders (product_id, format, status);

-- ---------------------------------------------------------------------------
-- Notifications affichées dans l'espace client
-- ---------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  body        text not null default '',
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------------
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- À l'inscription : crée le profil et rattache les commandes passées avec le même e-mail
-- (achat sans compte, ou anciennes précommandes importées depuis Stripe).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  update public.orders set user_id = new.id
   where user_id is null and lower(email) = lower(new.email);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un client ne peut modifier que son nom (pas son statut d'administratrice).
-- auth.uid() est vide pour le serveur et l'éditeur SQL de Supabase : eux restent libres.
create function public.protect_profile() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.is_admin = old.is_admin;
    new.email = old.email;
  end if;
  return new;
end;
$$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile();

-- ---------------------------------------------------------------------------
-- Règles d'accès (RLS)
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.notifications enable row level security;

-- Livres : visibles par tous, modifiables par l'administratrice.
create policy "products_read" on public.products for select using (true);
create policy "products_admin_write" on public.products for update
  using (public.is_admin()) with check (public.is_admin());

-- Profils : chacun voit et modifie le sien ; l'administratrice voit tout.
create policy "profiles_read" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profiles_update" on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Commandes : chacun voit les siennes ; l'administratrice voit et modifie tout.
-- (Les commandes sont créées uniquement par le serveur, après paiement Stripe.)
create policy "orders_read" on public.orders for select
  using (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_update" on public.orders for update
  using (public.is_admin()) with check (public.is_admin());

-- Notifications : chacun lit les siennes et peut les marquer comme lues.
create policy "notifications_read" on public.notifications for select
  using (user_id = auth.uid());
create policy "notifications_mark_read" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Stockage privé des ebooks
-- ---------------------------------------------------------------------------
-- Fichiers rangés par livre : ebooks/hybris/hybris.pdf, ebooks/hybris/hybris.epub…
insert into storage.buckets (id, name, public) values ('ebooks', 'ebooks', false)
on conflict (id) do nothing;

-- Un client ne peut ouvrir le fichier que s'il a payé l'ebook ET que le livre est disponible.
create function public.can_read_ebook(object_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.orders o
      join public.products p on p.id = o.product_id
     where o.user_id = auth.uid()
       and o.format = 'ebook'
       and o.status in ('paid', 'partially_refunded')
       and p.ebook_status = 'available'
       and object_name like p.id || '/%'
  );
$$;

create policy "ebooks_read" on storage.objects for select
  using (bucket_id = 'ebooks' and (public.can_read_ebook(name) or public.is_admin()));
create policy "ebooks_admin_insert" on storage.objects for insert
  with check (bucket_id = 'ebooks' and public.is_admin());
create policy "ebooks_admin_update" on storage.objects for update
  using (bucket_id = 'ebooks' and public.is_admin());
create policy "ebooks_admin_delete" on storage.objects for delete
  using (bucket_id = 'ebooks' and public.is_admin());
