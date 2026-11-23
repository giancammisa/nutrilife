-- =====================================================================
-- NutriLife · Passo 5 · Prezzi al kg, costi riservati, costo fisso
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. Costo fisso per pasto di ogni gastronomia (in centesimi: 150 = 1,50 €)
alter table public.kitchens
  add column fixed_fee_cents integer not null default 0
  check (fixed_fee_cents between 0 and 10000);

grant update (fixed_fee_cents) on public.kitchens to authenticated;

-- 2. Prezzo di vendita al kg di ogni base della gastronomia (pubblico: lo vede il cliente)
--    Si cambia solo con la funzione admin_set_base_price, mai direttamente.
alter table public.kitchen_bases
  add column price_per_kg_cents integer
  check (price_per_kg_cents is null or price_per_kg_cents between 1 and 100000);

-- 3. Costi RISERVATI: costo in fattura, calo peso in cottura, ricarico
create type public.pricing_mode as enum ('diretto', 'da_costo');

create table public.kitchen_base_costs (
  kitchen_base_id    uuid primary key references public.kitchen_bases (id) on delete cascade,
  pricing_mode       public.pricing_mode not null,
  cost_per_kg_cents  integer check (cost_per_kg_cents between 1 and 100000),
  cooking_loss_pct   numeric(4,1) not null default 0 check (cooking_loss_pct >= 0 and cooking_loss_pct < 90),
  markup_pct         numeric(6,1) check (markup_pct >= 0 and markup_pct <= 1000),
  updated_at         timestamptz not null default now(),
  updated_by         uuid references public.profiles (id) on delete set null,
  check (pricing_mode = 'diretto' or (cost_per_kg_cents is not null and markup_pct is not null))
);

alter table public.kitchen_base_costs enable row level security;

create policy "Solo l'admin vede i costi"
  on public.kitchen_base_costs for select to authenticated
  using ((select public.is_admin()));

revoke all on public.kitchen_base_costs from anon, authenticated;
grant select on public.kitchen_base_costs to authenticated;

-- 4. La formula di NutriLife (risultato in centesimi al kg)
--    costo cotto = costo ÷ (1 − calo%)      prezzo = costo cotto × (1 + ricarico%)
create function public.price_from_cost(p_cost_cents integer, p_loss_pct numeric, p_markup_pct numeric)
returns integer
language sql
immutable
set search_path = ''
as $$
  select round(p_cost_cents / (1 - coalesce(p_loss_pct, 0) / 100.0) * (1 + p_markup_pct / 100.0))::integer;
$$;

-- 5. L'admin imposta il prezzo di una base: diretto oppure dal costo (calcolato qui)
create function public.admin_set_base_price(
  p_kitchen_base  uuid,
  p_mode          public.pricing_mode,
  p_price_cents   integer,
  p_cost_cents    integer,
  p_loss_pct      numeric,
  p_markup_pct    numeric
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_price integer;
begin
  if not public.is_admin() then
    raise exception 'Solo l''admin può impostare i prezzi';
  end if;

  if p_mode = 'diretto' then
    v_price := p_price_cents;
  else
    if p_cost_cents is null or p_markup_pct is null then
      raise exception 'Servono costo e ricarico';
    end if;
    if coalesce(p_loss_pct, 0) < 0 or coalesce(p_loss_pct, 0) >= 90 then
      raise exception 'Calo peso non valido';
    end if;
    v_price := public.price_from_cost(p_cost_cents, p_loss_pct, p_markup_pct);
  end if;

  if v_price is null or v_price < 1 or v_price > 100000 then
    raise exception 'Prezzo non valido';
  end if;

  update public.kitchen_bases set price_per_kg_cents = v_price where id = p_kitchen_base;
  if not found then
    raise exception 'Base non trovata';
  end if;

  insert into public.kitchen_base_costs
    (kitchen_base_id, pricing_mode, cost_per_kg_cents, cooking_loss_pct, markup_pct, updated_at, updated_by)
  values
    (p_kitchen_base, p_mode,
     case when p_mode = 'da_costo' then p_cost_cents end,
     case when p_mode = 'da_costo' then coalesce(p_loss_pct, 0) else 0 end,
     case when p_mode = 'da_costo' then p_markup_pct end,
     now(), (select auth.uid()))
  on conflict (kitchen_base_id) do update set
    pricing_mode      = excluded.pricing_mode,
    cost_per_kg_cents = excluded.cost_per_kg_cents,
    cooking_loss_pct  = excluded.cooking_loss_pct,
    markup_pct        = excluded.markup_pct,
    updated_at        = excluded.updated_at,
    updated_by        = excluded.updated_by;

  return v_price;
end;
$$;

-- 6. Prezzo di un pasto: somma di grammi × prezzo al kg + costo fisso (in centesimi).
--    null se una base manca, non è disponibile o non ha prezzo in quella gastronomia.
--    Servirà anche all'ordine (passo 6) per "fotografare" il prezzo.
create function public.meal_price_cents(p_template uuid, p_kitchen uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with items as (
    select i.grams, kb.price_per_kg_cents, kb.available
      from public.meal_template_items i
      left join public.kitchen_bases kb
        on kb.base_id = i.base_id and kb.kitchen_id = p_kitchen
     where i.template_id = p_template
  )
  select case
           when not public.can_read_template(p_template) then null
           when not exists (select 1 from items) then null
           when exists (select 1 from items where price_per_kg_cents is null or not available) then null
           else (select round(sum(grams * price_per_kg_cents) / 1000.0)::integer from items)
                + (select fixed_fee_cents from public.kitchens where id = p_kitchen and active)
         end;
$$;

revoke all on function public.price_from_cost(integer, numeric, numeric) from public, anon;
grant execute on function public.price_from_cost(integer, numeric, numeric) to authenticated;
revoke all on function public.admin_set_base_price(uuid, public.pricing_mode, integer, integer, numeric, numeric) from public, anon;
grant execute on function public.admin_set_base_price(uuid, public.pricing_mode, integer, integer, numeric, numeric) to authenticated;
revoke all on function public.meal_price_cents(uuid, uuid) from public, anon;
grant execute on function public.meal_price_cents(uuid, uuid) to authenticated;
