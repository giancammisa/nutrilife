-- =====================================================================
-- NutriLife · Listino della gastronomia
-- La cucina gestisce da sola le basi della SUA gastronomia:
-- aggiungere basi dal catalogo, prezzi (diretti o dal costo), allergeni,
-- disponibilità e costo fisso per pasto. Mai le altre gastronomie.
-- Il catalogo comune delle basi resta all'admin.
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. Basi della gastronomia: la cucina può aggiungerne e modificarle (solo nella sua)
create policy "La cucina aggiunge basi alla sua gastronomia"
  on public.kitchen_bases for insert to authenticated
  with check ((select public.is_kitchen_member(kitchen_id)));

create policy "La cucina modifica le basi della sua gastronomia"
  on public.kitchen_bases for update to authenticated
  using ((select public.is_kitchen_member(kitchen_id)))
  with check ((select public.is_kitchen_member(kitchen_id)));

-- 2. Costi riservati: la cucina vede solo quelli della sua gastronomia (il cliente mai)
create policy "La cucina vede i costi della sua gastronomia"
  on public.kitchen_base_costs for select to authenticated
  using (
    exists (
      select 1 from public.kitchen_bases kb
      where kb.id = kitchen_base_id
        and public.is_kitchen_member(kb.kitchen_id)
    )
  );

-- 3. Prezzo di una base: admin oppure cucina della stessa gastronomia.
--    Stessa formula di admin_set_base_price (che resta invariata).
create function public.set_base_price(
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
  v_kitchen uuid;
  v_price   integer;
begin
  select kitchen_id into v_kitchen from public.kitchen_bases where id = p_kitchen_base;
  if v_kitchen is null then
    raise exception 'Base non trovata';
  end if;
  if not (public.is_admin() or public.is_kitchen_member(v_kitchen)) then
    raise exception 'Non puoi impostare i prezzi di questa gastronomia';
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

-- 4. Costo fisso per pasto: admin oppure cucina della stessa gastronomia
--    (la cucina non può cambiare nome, indirizzo o stato della gastronomia).
create function public.set_kitchen_fee(p_kitchen uuid, p_fee_cents integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.is_admin() or public.is_kitchen_member(p_kitchen)) then
    raise exception 'Non puoi modificare questa gastronomia';
  end if;
  if p_fee_cents is null or p_fee_cents < 0 or p_fee_cents > 10000 then
    raise exception 'Costo fisso non valido';
  end if;
  update public.kitchens set fixed_fee_cents = p_fee_cents where id = p_kitchen;
  if not found then
    raise exception 'Gastronomia non trovata';
  end if;
end;
$$;

revoke all on function public.set_base_price(uuid, public.pricing_mode, integer, integer, numeric, numeric) from public, anon;
grant execute on function public.set_base_price(uuid, public.pricing_mode, integer, integer, numeric, numeric) to authenticated;
revoke all on function public.set_kitchen_fee(uuid, integer) from public, anon;
grant execute on function public.set_kitchen_fee(uuid, integer) to authenticated;

-- 5. Il prezzo al kg si cambia solo con set_base_price / admin_set_base_price:
--    nessuno lo scrive direttamente quando aggiunge una base.
revoke insert on public.kitchen_bases from authenticated;
grant insert (kitchen_id, base_id) on public.kitchen_bases to authenticated;
