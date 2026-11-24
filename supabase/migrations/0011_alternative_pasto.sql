-- =====================================================================
-- NutriLife · Passo 11 · Alternative nel pasto tipo
-- Nel pasto tipo, le basi con lo stesso "gruppo di scelta" sono alternative
-- (es. pollo 150 g OPPURE merluzzo 200 g): il cliente ne sceglie una.
-- Le basi senza gruppo ci sono sempre.
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. Gruppo di scelta (vuoto = base fissa)
alter table public.meal_template_items
  add column choice_group smallint check (choice_group between 1 and 50);

grant update (choice_group) on public.meal_template_items to authenticated;

-- 2. L'ordine riceve le basi scelte dal cliente (p_items: righe del pasto tipo scelte).
--    Si controlla che ci sia esattamente una scelta per ogni gruppo.
drop function public.place_order(uuid, uuid, date, boolean);

create function public.place_order(
  p_template        uuid,
  p_kitchen         uuid,
  p_pickup          date,
  p_ack_unverified  boolean,
  p_items           uuid[]
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
  v_items      uuid[];
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

  -- Righe del pasto: le fisse + quelle scelte tra le alternative
  v_items := array(
    select i.id from public.meal_template_items i
     where i.template_id = p_template
       and (i.choice_group is null or i.id = any(coalesce(p_items, '{}')))
  );
  if cardinality(v_items) = 0 then
    raise exception 'Pasto non disponibile in questa gastronomia';
  end if;
  -- Una e una sola scelta per ogni gruppo
  if exists (
    select 1
      from (select distinct choice_group from public.meal_template_items
             where template_id = p_template and choice_group is not null) g
     where (select count(*) from public.meal_template_items i
             where i.template_id = p_template and i.choice_group = g.choice_group
               and i.id = any(v_items)) <> 1
  ) then
    raise exception 'Scelta delle alternative non valida';
  end if;

  if exists (
    select 1
      from public.meal_template_items i
      left join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = p_kitchen
     where i.id = any(v_items)
       and (kb.id is null or not kb.available or kb.price_per_kg_cents is null)
  ) then
    raise exception 'Pasto non disponibile in questa gastronomia';
  end if;

  select coalesce(array_agg(distinct a order by a), '{}')
    into v_allergens
    from public.meal_template_items i
    join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = p_kitchen
    cross join lateral unnest(kb.allergens) as a
   where i.id = any(v_items);

  select bool_or(not kb.allergens_declared)
    into v_unverified
    from public.meal_template_items i
    join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = p_kitchen
   where i.id = any(v_items);

  v_conflict := array(select unnest(v_allergens) intersect select unnest(v_profile.allergies));
  if cardinality(v_conflict) > 0 then
    raise exception 'Allergene bloccato: %', array_to_string(v_conflict, ', ');
  end if;

  if v_unverified and not coalesce(p_ack_unverified, false) then
    raise exception 'Conferma allergeni non verificati';
  end if;

  v_intol := array(select unnest(v_allergens) intersect select unnest(v_profile.intolerances));

  -- Prezzo: somma grammi × prezzo al kg delle righe scelte + costo fisso (stessa regola di prima)
  select round(sum(i.grams * kb.price_per_kg_cents) / 1000.0)::integer + v_fee
    into v_price
    from public.meal_template_items i
    join public.kitchen_bases kb on kb.base_id = i.base_id and kb.kitchen_id = p_kitchen
   where i.id = any(v_items);
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
   where i.id = any(v_items);

  return v_order;
end;
$$;

revoke all on function public.place_order(uuid, uuid, date, boolean, uuid[]) from public, anon;
grant execute on function public.place_order(uuid, uuid, date, boolean, uuid[]) to authenticated;
