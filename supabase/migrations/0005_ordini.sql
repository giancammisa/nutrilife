-- =====================================================================
-- NutriLife · Passo 6 · Allergie del cliente, impostazioni, ordini
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. Allergie e intolleranze del cliente (dato sanitario: consenso specifico)
alter table public.profiles
  add column allergies text[] not null default '{}'
    check (allergies <@ array['glutine','crostacei','uova','pesce','arachidi','soia','latte',
           'frutta_a_guscio','sedano','senape','sesamo','solfiti','lupini','molluschi']::text[]),
  add column intolerances text[] not null default '{}'
    check (intolerances <@ array['glutine','crostacei','uova','pesce','arachidi','soia','latte',
           'frutta_a_guscio','sedano','senape','sesamo','solfiti','lupini','molluschi']::text[]),
  add column health_consent_at timestamptz;

create function public.set_my_allergies(p_allergies text[], p_intolerances text[], p_consent boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_any boolean := cardinality(coalesce(p_allergies, '{}')) + cardinality(coalesce(p_intolerances, '{}')) > 0;
begin
  if (select auth.uid()) is null then
    raise exception 'Accesso richiesto';
  end if;
  if v_any and not coalesce(p_consent, false) then
    raise exception 'Serve il consenso per salvare allergie e intolleranze';
  end if;
  update public.profiles
     set allergies = coalesce(p_allergies, '{}'),
         intolerances = coalesce(p_intolerances, '{}'),
         health_consent_at = case when v_any then coalesce(health_consent_at, now()) else null end
   where id = (select auth.uid());
end;
$$;

-- 2. Impostazioni dell'app (una sola riga): orario limite e modalità prova
create table public.app_settings (
  id           boolean primary key default true check (id),
  cutoff_hour  smallint not null default 18 check (cutoff_hour between 0 and 23),
  beta_mode    boolean not null default true,
  updated_at   timestamptz not null default now()
);

insert into public.app_settings default values;

alter table public.app_settings enable row level security;
create policy "Impostazioni leggibili"
  on public.app_settings for select to authenticated using (true);
create policy "L'admin modifica le impostazioni"
  on public.app_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to authenticated;
grant update (cutoff_hour, beta_mode) on public.app_settings to authenticated;

-- 3. Date e orario limite, sempre con l'ora di Roma (cambio dell'ora compreso)
create function public.rome_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Rome')::date;
$$;

-- Momento limite per ordinare il ritiro del giorno p_pickup: il giorno prima alle 18:00 (ora di Roma)
create function public.order_cutoff(p_pickup date)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((p_pickup - 1)::timestamp
          + make_interval(hours => coalesce((select cutoff_hour from public.app_settings limit 1), 18)))
         at time zone 'Europe/Rome';
$$;

create function public.order_window_open(p_pickup date, p_now timestamptz default now())
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_now < public.order_cutoff(p_pickup);
$$;

-- 4. Ordini e copia ("fotografia") delle basi al momento dell'ordine
create type public.order_status as enum ('confermato', 'pronto', 'ritirato', 'annullato');

create table public.orders (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.profiles (id) on delete cascade,
  kitchen_id            uuid not null references public.kitchens (id) on delete restrict,
  meal_template_id      uuid references public.meal_templates (id) on delete set null,
  template_name         text not null,
  meal_slot             public.meal_slot not null,
  pickup_date           date not null,
  status                public.order_status not null default 'confermato',
  price_cents           integer not null check (price_cents >= 0),
  fixed_fee_cents       integer not null default 0,
  allergens             text[] not null default '{}',
  allergens_unverified  boolean not null default false,
  unverified_ack        boolean not null default false,
  intolerance_warning   text[] not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  cancelled_at          timestamptz
);

-- Un solo ordine attivo per cliente, giorno e momento (pranzo/cena)
create unique index orders_one_per_slot
  on public.orders (client_id, pickup_date, meal_slot)
  where status <> 'annullato';

create index orders_kitchen_date_idx on public.orders (kitchen_id, pickup_date);
create index orders_client_date_idx on public.orders (client_id, pickup_date);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders (id) on delete cascade,
  base_id             uuid references public.bases (id) on delete set null,
  base_name           text not null,
  category            public.base_category not null,
  grams               integer not null check (grams between 1 and 1000),
  price_per_kg_cents  integer not null,
  allergens           text[] not null default '{}',
  allergens_declared  boolean not null
);

create index order_items_order_idx on public.order_items (order_id);

-- 5. Chi può vedere un ordine: il cliente, la sua gastronomia (passo 8), l'admin
create function public.is_kitchen_member(p_kitchen uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.kitchen_members
    where kitchen_id = p_kitchen and profile_id = (select auth.uid())
  ) and public.current_role_is('cucina');
$$;

create function public.can_read_order(p_order uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order
      and (o.client_id = (select auth.uid())
           or public.is_kitchen_member(o.kitchen_id)
           or public.is_admin())
  );
$$;

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "Vedo i miei ordini"
  on public.orders for select to authenticated
  using (client_id = (select auth.uid())
         or (select public.is_kitchen_member(kitchen_id))
         or (select public.is_admin()));

create policy "Vedo le basi dei miei ordini"
  on public.order_items for select to authenticated
  using ((select public.can_read_order(order_id)));

-- Gli ordini si creano SOLO con place_order (nessun permesso di scrittura diretta)
revoke all on public.orders, public.order_items from anon, authenticated;
grant select on public.orders, public.order_items to authenticated;

-- 6. L'ordine: tutti i controlli in un colpo solo
create function public.place_order(
  p_template        uuid,
  p_kitchen         uuid,
  p_pickup          date,
  p_ack_unverified  boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me         uuid := (select auth.uid());
  v_profile    public.profiles;
  v_tpl        public.meal_templates;
  v_fee        integer;
  v_allergens  text[];
  v_unverified boolean;
  v_conflict   text[];
  v_intol      text[];
  v_price      integer;
  v_order      uuid;
begin
  select * into v_profile from public.profiles where id = v_me;
  if v_profile.id is null or v_profile.role <> 'cliente' or not v_profile.active
     or v_profile.privacy_consent_at is null then
    raise exception 'Solo un cliente attivo può ordinare';
  end if;

  select * into v_tpl from public.meal_templates
   where id = p_template and patient_id = v_me and active;
  if not found then
    raise exception 'Pasto tipo non valido';
  end if;

  select fixed_fee_cents into v_fee from public.kitchens where id = p_kitchen and active;
  if not found then
    raise exception 'Gastronomia non disponibile';
  end if;

  if p_pickup > public.rome_today() + 14 then
    raise exception 'Puoi ordinare al massimo 14 giorni prima';
  end if;
  if not public.order_window_open(p_pickup) then
    raise exception 'Orario limite superato';
  end if;

  if not exists (select 1 from public.meal_template_items where template_id = p_template) then
    raise exception 'Pasto non disponibile in questa gastronomia';
  end if;
  if exists (
    select 1
      from public.meal_template_items i
      left join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = p_kitchen
     where i.template_id = p_template
       and (kb.id is null or not kb.available or kb.price_per_kg_cents is null)
  ) then
    raise exception 'Pasto non disponibile in questa gastronomia';
  end if;

  select coalesce(array_agg(distinct a order by a), '{}')
    into v_allergens
    from public.meal_template_items i
    join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = p_kitchen
    cross join lateral unnest(kb.allergens) as a
   where i.template_id = p_template;

  select bool_or(not kb.allergens_declared)
    into v_unverified
    from public.meal_template_items i
    join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = p_kitchen
   where i.template_id = p_template;

  v_conflict := array(select unnest(v_allergens) intersect select unnest(v_profile.allergies));
  if cardinality(v_conflict) > 0 then
    raise exception 'Allergene bloccato: %', array_to_string(v_conflict, ', ');
  end if;

  if v_unverified and not coalesce(p_ack_unverified, false) then
    raise exception 'Conferma allergeni non verificati';
  end if;

  v_intol := array(select unnest(v_allergens) intersect select unnest(v_profile.intolerances));
  v_price := public.meal_price_cents(p_template, p_kitchen);
  if v_price is null then
    raise exception 'Pasto non disponibile in questa gastronomia';
  end if;

  begin
    insert into public.orders
      (client_id, kitchen_id, meal_template_id, template_name, meal_slot, pickup_date,
       price_cents, fixed_fee_cents, allergens, allergens_unverified, unverified_ack, intolerance_warning)
    values
      (v_me, p_kitchen, p_template, v_tpl.name, v_tpl.meal_slot, p_pickup,
       v_price, v_fee, v_allergens, coalesce(v_unverified, false),
       coalesce(v_unverified, false) and coalesce(p_ack_unverified, false), v_intol)
    returning id into v_order;
  exception when unique_violation then
    raise exception 'Hai già un ordine per questo pasto in quel giorno';
  end;

  insert into public.order_items
    (order_id, base_id, base_name, category, grams, price_per_kg_cents, allergens, allergens_declared)
  select v_order, b.id, b.name, b.category, i.grams, kb.price_per_kg_cents, kb.allergens, kb.allergens_declared
    from public.meal_template_items i
    join public.bases b on b.id = i.base_id
    join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = p_kitchen
   where i.template_id = p_template;

  return v_order;
end;
$$;

-- 7. Permessi delle funzioni
revoke all on function public.set_my_allergies(text[], text[], boolean) from public, anon;
grant execute on function public.set_my_allergies(text[], text[], boolean) to authenticated;
revoke all on function public.rome_today() from public, anon;
grant execute on function public.rome_today() to authenticated;
revoke all on function public.order_cutoff(date) from public, anon;
grant execute on function public.order_cutoff(date) to authenticated;
revoke all on function public.order_window_open(date, timestamptz) from public, anon;
grant execute on function public.order_window_open(date, timestamptz) to authenticated;
revoke all on function public.is_kitchen_member(uuid) from public, anon;
grant execute on function public.is_kitchen_member(uuid) to authenticated;
revoke all on function public.can_read_order(uuid) from public, anon;
grant execute on function public.can_read_order(uuid) to authenticated;
revoke all on function public.place_order(uuid, uuid, date, boolean) from public, anon;
grant execute on function public.place_order(uuid, uuid, date, boolean) to authenticated;
