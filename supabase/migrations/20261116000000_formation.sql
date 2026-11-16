-- Formation « Écrire un livre de A à Z » : vente, accès des inscrits et suivi.
-- À exécuter une fois dans Supabase : SQL Editor > New query (onglet vide) > coller > Run.
-- Les vidéos sont sur YouTube (non répertoriées) : leur identifiant n'est lisible
-- que par les inscrits et l'administratrice, jamais par les visiteurs.

-- ---------------------------------------------------------------------------
-- Formations en vente
-- ---------------------------------------------------------------------------
create table public.courses (
  id           text primary key,                  -- ex. 'ecrire-un-livre'
  title        text not null,
  price_cents  integer not null check (price_cents > 0),
  on_sale      boolean not null default true,     -- false = plus de nouvelles inscriptions
  updated_at   timestamptz not null default now()
);

insert into public.courses (id, title, price_cents) values ('ecrire-un-livre', 'Écrire un livre de A à Z', 22500);

-- ---------------------------------------------------------------------------
-- Leçons (une vidéo YouTube, un résumé, un PDF facultatif)
-- ---------------------------------------------------------------------------
create table public.course_lessons (
  id                uuid primary key default gen_random_uuid(),
  course_id         text not null references public.courses (id) on delete cascade,
  position          integer not null default 0,
  title             text not null,
  summary           text not null default '',      -- résumé et conseils, affichés sous la vidéo
  youtube_id        text,                          -- identifiant de la vidéo non répertoriée
  duration_minutes  integer check (duration_minutes > 0),
  attachment_path   text,                          -- PDF dans le stockage « formation »
  published         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index course_lessons_course_idx on public.course_lessons (course_id, position);

-- ---------------------------------------------------------------------------
-- Inscriptions (achats de la formation)
-- ---------------------------------------------------------------------------
create table public.enrollments (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references auth.users (id) on delete set null,
  email                     text not null,
  customer_name             text,
  course_id                 text not null references public.courses (id),
  status                    text not null default 'pending'
                              check (status in ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  amount_total_cents        integer not null default 0,
  amount_refunded_cents     integer not null default 0,
  currency                  text not null default 'eur',
  stripe_session_id         text unique,
  stripe_payment_intent_id  text unique,
  receipt_url               text,
  -- checkout : boutique ; import : ancien lien Stripe ; offert : accès ouvert par l'administratrice
  source                    text not null default 'checkout' check (source in ('checkout', 'import', 'offert')),
  welcome_sent_at           timestamptz,
  created_at                timestamptz not null default now(),
  paid_at                   timestamptz,
  refunded_at               timestamptz,
  updated_at                timestamptz not null default now()
);

create index enrollments_user_idx on public.enrollments (user_id);
create index enrollments_email_idx on public.enrollments (lower(email));

-- ---------------------------------------------------------------------------
-- Suivi : leçons vues, terminées, et notes personnelles
-- ---------------------------------------------------------------------------
create table public.lesson_progress (
  user_id       uuid not null references auth.users (id) on delete cascade,
  lesson_id     uuid not null references public.course_lessons (id) on delete cascade,
  last_seen_at  timestamptz not null default now(),
  completed_at  timestamptz,
  notes         text not null default '',
  primary key (user_id, lesson_id)
);

create trigger courses_touch before update on public.courses
  for each row execute function public.touch_updated_at();
create trigger course_lessons_touch before update on public.course_lessons
  for each row execute function public.touch_updated_at();
create trigger enrollments_touch before update on public.enrollments
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Fonctions
-- ---------------------------------------------------------------------------
-- Le client connecté a-t-il accès à la formation ? (payée, pas entièrement remboursée)
create function public.has_course(course text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments
     where user_id = auth.uid() and course_id = course and status in ('paid', 'partially_refunded')
  );
$$;

-- Programme public (titres et durées), sans les vidéos : affiché sur la page de vente.
create function public.course_outline(course text)
returns table (lesson_position integer, title text, duration_minutes integer, has_attachment boolean)
language sql stable security definer set search_path = public as $$
  select l.position, l.title, l.duration_minutes, l.attachment_path is not null
    from public.course_lessons l
   where l.course_id = course and l.published
   order by l.position, l.created_at;
$$;

-- À l'inscription : rattache aussi les achats de la formation faits avec le même e-mail.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  update public.orders set user_id = new.id
   where user_id is null and lower(email) = lower(new.email);
  update public.enrollments set user_id = new.id
   where user_id is null and lower(email) = lower(new.email);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Règles d'accès (RLS)
-- ---------------------------------------------------------------------------
alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- Formations : visibles par tous (titre, prix), modifiables par l'administratrice.
create policy "courses_read" on public.courses for select using (true);
create policy "courses_admin_write" on public.courses for update
  using (public.is_admin()) with check (public.is_admin());

-- Leçons : les inscrits lisent les leçons publiées ; l'administratrice gère tout.
create policy "lessons_read" on public.course_lessons for select
  using ((published and public.has_course(course_id)) or public.is_admin());
create policy "lessons_admin_insert" on public.course_lessons for insert
  with check (public.is_admin());
create policy "lessons_admin_update" on public.course_lessons for update
  using (public.is_admin()) with check (public.is_admin());
create policy "lessons_admin_delete" on public.course_lessons for delete
  using (public.is_admin());

-- Inscriptions : chacun voit les siennes ; l'administratrice voit tout et peut offrir un accès.
create policy "enrollments_read" on public.enrollments for select
  using (user_id = auth.uid() or public.is_admin());
create policy "enrollments_admin_insert" on public.enrollments for insert
  with check (public.is_admin());
create policy "enrollments_admin_update" on public.enrollments for update
  using (public.is_admin()) with check (public.is_admin());

-- Suivi : chacun gère le sien, pour les leçons d'une formation à laquelle il a accès.
create function public.can_follow_lesson(lesson uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.course_lessons l where l.id = lesson and public.has_course(l.course_id));
$$;

-- Les notes sont personnelles : même l'administratrice ne les lit pas (voir course_students ci-dessous).
create policy "progress_read" on public.lesson_progress for select
  using (user_id = auth.uid());
create policy "progress_insert" on public.lesson_progress for insert
  with check (user_id = auth.uid() and public.can_follow_lesson(lesson_id));
create policy "progress_update" on public.lesson_progress for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.can_follow_lesson(lesson_id));

-- Avancement des élèves pour l'administratrice : nombre de leçons terminées, sans les notes.
create function public.course_students(course text)
returns table (user_id uuid, lessons_done integer, last_seen_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.user_id, count(p.completed_at)::integer, max(p.last_seen_at)
    from public.lesson_progress p
    join public.course_lessons l on l.id = p.lesson_id
   where l.course_id = course and public.is_admin()
   group by p.user_id;
$$;

-- ---------------------------------------------------------------------------
-- Stockage privé des PDF de la formation
-- ---------------------------------------------------------------------------
-- Fichiers rangés par formation : formation/ecrire-un-livre/structure.pdf…
insert into storage.buckets (id, name, public) values ('formation', 'formation', false)
on conflict (id) do nothing;

create policy "formation_read" on storage.objects for select
  using (bucket_id = 'formation' and (public.has_course(split_part(name, '/', 1)) or public.is_admin()));
create policy "formation_admin_insert" on storage.objects for insert
  with check (bucket_id = 'formation' and public.is_admin());
create policy "formation_admin_update" on storage.objects for update
  using (bucket_id = 'formation' and public.is_admin());
create policy "formation_admin_delete" on storage.objects for delete
  using (bucket_id = 'formation' and public.is_admin());
