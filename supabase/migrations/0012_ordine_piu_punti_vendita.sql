-- =====================================================================
-- NutriLife · Passo 12 · Un pasto da più punti vendita
-- Il cliente sceglie, per ogni parte del pasto, il punto vendita
-- (es. pollo dalla gastronomia, piselli da "Soleterra Primizie").
-- Nasce un ordine per ogni punto vendita, tutti legati dallo stesso "carrello" (basket_id):
-- ognuno con il suo costo fisso, il suo biglietto di ritiro e la sua cucina.
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. Carrello: gli ordini già esistenti diventano un carrello da soli
alter table public.orders
  add column basket_id uuid not null default gen_random_uuid();

create index orders_basket_idx on public.orders (basket_id);

-- 2. Un solo ordine attivo per cliente, giorno, momento E punto vendita
--    (che il pasto sia uno solo per giorno e momento lo controlla place_meal)
drop index public.orders_one_per_slot;
create unique index orders_one_per_slot_kitchen
  on public.orders (client_id, pickup_date, meal_slot, kitchen_id)
  where status <> 'annullato';

-- 3. Nuovo ordine: p_parts = [{"kitchen_id": "...", "items": ["id riga pasto", ...]}, ...]
--    Ogni riga fissa del pasto va in un solo punto vendita; di ogni gruppo di
--    alternative va una sola riga. Tutto o niente: se una parte non va, non nasce nulla.
drop function public.place_order(uuid, uuid, date, boolean, uuid[]);

create function public.place_meal(
  p_template        uuid,
  p_pickup          date,
  p_ack_unverified  boolean,
  p_parts           jsonb
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
  v_basket     uuid := gen_random_uuid();
  v_part       record;
  v_all        uuid[] := '{}';
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

  if p_pickup > public.rome_today() + 14 then
    raise exception 'Puoi ordinare al massimo 14 giorni prima';
  end if;
  if not public.order_window_open(p_pickup) then
    raise exception 'Orario limite superato';
  end if;

  if jsonb_typeof(p_parts) <> 'array' or jsonb_array_length(p_parts) not between 1 and 5 then
    raise exception 'Parti del pasto non valide';
  end if;

  if exists (
    select 1 from public.orders
     where client_id = v_me and pickup_date = p_pickup
       and meal_slot = v_tpl.meal_slot and status <> 'annullato'
  ) then
    raise exception 'Hai già un ordine per questo pasto in quel giorno';
  end if;

  -- Tutte le righe assegnate: nessun doppione, tutte del pasto
  for v_part in
    select (e->>'kitchen_id')::uuid as kitchen_id,
           array(select (x)::uuid from jsonb_array_elements_text(e->'items') x) as items
      from jsonb_array_elements(p_parts) e
  loop
    if cardinality(v_part.items) = 0 then
      raise exception 'Parti del pasto non valide';
    end if;
    v_all := v_all || v_part.items;
  end loop;

  if cardinality(v_all) <> (select count(distinct x) from unnest(v_all) x)
     or exists (
       select 1 from unnest(v_all) x
        where not exists (select 1 from public.meal_template_items i
                           where i.id = x and i.template_id = p_template)
     ) then
    raise exception 'Parti del pasto non valide';
  end if;

  -- Ogni riga fissa presente; una sola riga per ogni gruppo di alternative
  if exists (
    select 1 from public.meal_template_items i
     where i.template_id = p_template and i.choice_group is null and not (i.id = any(v_all))
  ) or exists (
    select 1
      from (select distinct choice_group from public.meal_template_items
             where template_id = p_template and choice_group is not null) g
     where (select count(*) from public.meal_template_items i
             where i.template_id = p_template and i.choice_group = g.choice_group
               and i.id = any(v_all)) <> 1
  ) then
    raise exception 'Scelta delle alternative non valida';
  end if;

  -- Una parte per punto vendita
  if (select count(distinct (e->>'kitchen_id')) from jsonb_array_elements(p_parts) e)
     <> jsonb_array_length(p_parts) then
    raise exception 'Parti del pasto non valide';
  end if;

  -- Controlli e inserimento, punto vendita per punto vendita
  for v_part in
    select (e->>'kitchen_id')::uuid as kitchen_id,
           array(select (x)::uuid from jsonb_array_elements_text(e->'items') x) as items
      from jsonb_array_elements(p_parts) e
  loop
    select fixed_fee_cents into v_fee from public.kitchens where id = v_part.kitchen_id and active;
    if not found then
      raise exception 'Gastronomia non disponibile';
    end if;

    if exists (
      select 1
        from public.meal_template_items i
        left join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = v_part.kitchen_id
       where i.id = any(v_part.items)
         and (kb.id is null or not kb.available or kb.price_per_kg_cents is null)
    ) then
      raise exception 'Pasto non disponibile in questa gastronomia';
    end if;

    select coalesce(array_agg(distinct a order by a), '{}')
      into v_allergens
      from public.meal_template_items i
      join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = v_part.kitchen_id
      cross join lateral unnest(kb.allergens) as a
     where i.id = any(v_part.items);

    select bool_or(not kb.allergens_declared)
      into v_unverified
      from public.meal_template_items i
      join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = v_part.kitchen_id
     where i.id = any(v_part.items);

    v_conflict := array(select unnest(v_allergens) intersect select unnest(v_profile.allergies));
    if cardinality(v_conflict) > 0 then
      raise exception 'Allergene bloccato: %', array_to_string(v_conflict, ', ');
    end if;

    if v_unverified and not coalesce(p_ack_unverified, false) then
      raise exception 'Conferma allergeni non verificati';
    end if;

    v_intol := array(select unnest(v_allergens) intersect select unnest(v_profile.intolerances));

    select round(sum(i.grams * kb.price_per_kg_cents) / 1000.0)::integer + v_fee
      into v_price
      from public.meal_template_items i
      join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = v_part.kitchen_id
     where i.id = any(v_part.items);

    insert into public.orders
      (client_id, kitchen_id, meal_template_id, template_name, meal_slot, pickup_date,
       price_cents, fixed_fee_cents, allergens, allergens_unverified, unverified_ack,
       intolerance_warning, basket_id)
    values
      (v_me, v_part.kitchen_id, p_template, v_tpl.name, v_tpl.meal_slot, p_pickup,
       v_price, v_fee, v_allergens, coalesce(v_unverified, false),
       coalesce(v_unverified, false) and coalesce(p_ack_unverified, false), v_intol, v_basket)
    returning id into v_order;

    insert into public.order_items
      (order_id, base_id, base_name, category, grams, price_per_kg_cents, allergens, allergens_declared)
    select v_order, b.id, b.name, b.category, i.grams, kb.price_per_kg_cents, kb.allergens, kb.allergens_declared
      from public.meal_template_items i
      join public.bases b on b.id = i.base_id
      join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = v_part.kitchen_id
     where i.id = any(v_part.items);
  end loop;

  return v_basket;
end;
$$;

revoke all on function public.place_meal(uuid, date, boolean, jsonb) from public, anon;
grant execute on function public.place_meal(uuid, date, boolean, jsonb) to authenticated;

-- 4. Annullamento: si annulla tutto il pasto (tutte le parti), solo se nessuna è già pronta o ritirata
create or replace function public.cancel_order(p_order uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order
    from public.orders
   where id = p_order and client_id = (select auth.uid())
   for update;

  if not found then
    raise exception 'Ordine non trovato';
  end if;
  if exists (
    select 1 from public.orders
     where basket_id = v_order.basket_id and client_id = v_order.client_id
       and status not in ('confermato', 'annullato')
  ) or v_order.status <> 'confermato' then
    raise exception 'Ordine non annullabile';
  end if;
  if not public.order_window_open(v_order.pickup_date) then
    raise exception 'Orario limite superato';
  end if;

  update public.orders
     set status = 'annullato', cancelled_at = now()
   where basket_id = v_order.basket_id and client_id = v_order.client_id and status = 'confermato';
end;
$$;
