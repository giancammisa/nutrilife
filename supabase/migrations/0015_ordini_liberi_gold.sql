-- =====================================================================
-- NutriLife · Passo 15 · Ordini liberi, punti e Gold dal nutrizionista
-- - Il cliente può condividere i suoi ordini RITIRATI con il suo nutrizionista
--   (interruttore, spento di default, lo cambia solo il cliente).
-- - Il nutrizionista vede un riepilogo degli ordini dei SUOI pazienti, solo se condivisi,
--   ultimi 90 giorni, solo basi e grammi (niente prezzi, niente allergie).
-- - Il nutrizionista assegna il Gold dopo il controllo. Nessuna nota libera:
--   nel Gold non finiscono dati sanitari.
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. Consenso del cliente a condividere gli ordini
alter table public.profiles
  add column if not exists share_orders boolean not null default false;
grant update (share_orders) on public.profiles to authenticated;
-- (la regola "Modifico il mio profilo" permette di cambiare solo la propria riga)

-- 2. Riepilogo ordini per il nutrizionista
create or replace function public.patient_orders(p_patient uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not public.is_my_patient(p_patient) then null
    when not coalesce((select p.share_orders from public.profiles p where p.id = p_patient), false)
      then jsonb_build_object('shared', false, 'rows', '[]'::jsonb)
    else jsonb_build_object(
      'shared', true,
      'rows', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'date', o.pickup_date, 'slot', o.meal_slot, 'basket', o.basket_id,
                 'base', i.base_name, 'category', i.category, 'grams', i.grams)
               order by o.pickup_date desc, o.meal_slot)
        from public.orders o
        join public.order_items i on i.order_id = o.id
        where o.client_id = p_patient
          and o.status = 'ritirato'
          and o.pickup_date >= current_date - 90
      ), '[]'::jsonb))
  end;
$$;
revoke all on function public.patient_orders(uuid) from public, anon;
grant execute on function public.patient_orders(uuid) to authenticated;

-- 3. Gold
create table if not exists public.gold_awards (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.profiles (id) on delete cascade,
  nutritionist_id  uuid references public.profiles (id) on delete set null,
  awarded_on       date not null default current_date,
  created_at       timestamptz not null default now()
);
create index if not exists gold_awards_client_idx on public.gold_awards (client_id);

alter table public.gold_awards enable row level security;

create policy "Vedo i miei Gold"
  on public.gold_awards for select to authenticated
  using (client_id = (select auth.uid())
         or nutritionist_id = (select auth.uid())
         or (select public.is_admin()));

create policy "Il nutrizionista assegna il Gold ai suoi pazienti"
  on public.gold_awards for insert to authenticated
  with check (nutritionist_id = (select auth.uid()) and (select public.is_my_patient(client_id)));

create policy "Il nutrizionista toglie un Gold dato per errore"
  on public.gold_awards for delete to authenticated
  using (nutritionist_id = (select auth.uid()) and (select public.is_my_patient(client_id)));

revoke all on public.gold_awards from anon, authenticated;
grant select, delete on public.gold_awards to authenticated;
grant insert (client_id, nutritionist_id) on public.gold_awards to authenticated;
