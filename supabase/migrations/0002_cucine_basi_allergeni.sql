-- =====================================================================
-- NutriLife · Passo 3 · Gastronomie, catalogo basi, allergeni
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. I 14 allergeni UE (Reg. UE 1169/2011): elenco fisso, solo da leggere
create table public.allergens (
  code     text primary key,
  name_it  text not null,
  sort     smallint not null
);

insert into public.allergens (code, name_it, sort) values
  ('glutine',          'Cereali con glutine',        1),
  ('crostacei',        'Crostacei',                  2),
  ('uova',             'Uova',                       3),
  ('pesce',            'Pesce',                      4),
  ('arachidi',         'Arachidi',                   5),
  ('soia',             'Soia',                       6),
  ('latte',            'Latte e lattosio',           7),
  ('frutta_a_guscio',  'Frutta a guscio',            8),
  ('sedano',           'Sedano',                     9),
  ('senape',           'Senape',                    10),
  ('sesamo',           'Semi di sesamo',            11),
  ('solfiti',          'Anidride solforosa e solfiti', 12),
  ('lupini',           'Lupini',                    13),
  ('molluschi',        'Molluschi',                 14);

-- 2. Gastronomie partner
create table public.kitchens (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 2 and 120),
  address     text check (char_length(address) <= 200),
  phone       text check (char_length(phone) <= 30),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger kitchens_set_updated_at
  before update on public.kitchens
  for each row execute function public.set_updated_at();

-- 3. Chi lavora in quale gastronomia (servirà ai passi successivi)
create table public.kitchen_members (
  kitchen_id  uuid not null references public.kitchens (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (kitchen_id, profile_id)
);

-- 4. Catalogo unico delle basi
create type public.base_category as enum ('proteina', 'carboidrato', 'verdura', 'altro');

create table public.bases (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 2 and 120),
  category    public.base_category not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index bases_name_unique on public.bases (lower(trim(name)));

create trigger bases_set_updated_at
  before update on public.bases
  for each row execute function public.set_updated_at();

-- 5. La base com'è fatta in una gastronomia: allergeni e disponibilità
--    Tre stati: allergens_declared = false        → "non verificata"
--               allergens_declared = true, vuoto  → "nessun allergene"
--               allergens_declared = true, elenco → "contiene …"
create table public.kitchen_bases (
  id                  uuid primary key default gen_random_uuid(),
  kitchen_id          uuid not null references public.kitchens (id) on delete cascade,
  base_id             uuid not null references public.bases (id) on delete restrict,
  allergens           text[] not null default '{}' check (allergens <@ array['glutine','crostacei','uova','pesce','arachidi','soia','latte',
                        'frutta_a_guscio','sedano','senape','sesamo','solfiti','lupini','molluschi']::text[]),
  allergens_declared  boolean not null default false,
  available           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (kitchen_id, base_id),
  -- se gli allergeni non sono dichiarati, l'elenco deve restare vuoto
  check (allergens_declared or cardinality(allergens) = 0)
);

create trigger kitchen_bases_set_updated_at
  before update on public.kitchen_bases
  for each row execute function public.set_updated_at();

-- 6. Regole di accesso (Row Level Security)
alter table public.allergens       enable row level security;
alter table public.kitchens        enable row level security;
alter table public.kitchen_members enable row level security;
alter table public.bases           enable row level security;
alter table public.kitchen_bases   enable row level security;

-- Allergeni: li legge chiunque sia collegato
create policy "Allergeni leggibili"
  on public.allergens for select to authenticated using (true);

-- Gastronomie: tutti vedono quelle attive, l'admin le vede tutte e le modifica
create policy "Gastronomie attive leggibili"
  on public.kitchens for select to authenticated
  using (active or (select public.is_admin()));
create policy "Admin crea gastronomie"
  on public.kitchens for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admin modifica gastronomie"
  on public.kitchens for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Membri della cucina: li vede l'admin e la persona stessa; li gestisce l'admin
create policy "Vedo le mie cucine"
  on public.kitchen_members for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admin aggiunge membri"
  on public.kitchen_members for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admin toglie membri"
  on public.kitchen_members for delete to authenticated
  using ((select public.is_admin()));

-- Catalogo basi: tutti vedono quelle attive, l'admin le vede tutte e le modifica
create policy "Basi attive leggibili"
  on public.bases for select to authenticated
  using (active or (select public.is_admin()));
create policy "Admin crea basi"
  on public.bases for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admin modifica basi"
  on public.bases for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Basi della gastronomia: leggibili da tutti i collegati (servono per gli allergeni), modificabili dall'admin
create policy "Basi di cucina leggibili"
  on public.kitchen_bases for select to authenticated using (true);
create policy "Admin aggiunge basi alla cucina"
  on public.kitchen_bases for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admin modifica basi della cucina"
  on public.kitchen_bases for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- 7. Permessi delle tabelle (nessuna cancellazione: si disattiva)
revoke all on public.allergens, public.kitchens, public.kitchen_members,
              public.bases, public.kitchen_bases from anon, authenticated;

grant select on public.allergens to authenticated;
grant select, insert on public.kitchens to authenticated;
grant update (name, address, phone, active) on public.kitchens to authenticated;
grant select, insert, delete on public.kitchen_members to authenticated;
grant select, insert on public.bases to authenticated;
grant update (name, category, active) on public.bases to authenticated;
grant select, insert on public.kitchen_bases to authenticated;
grant update (allergens, allergens_declared, available) on public.kitchen_bases to authenticated;

