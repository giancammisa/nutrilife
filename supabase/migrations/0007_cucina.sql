-- =====================================================================
-- NutriLife · Passo 8 · Cucina: nome sull'etichetta, stati degli ordini
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. Nome del cliente copiato sull'ordine: è l'unico dato personale che vede la cucina
alter table public.orders add column client_name text;

update public.orders o
   set client_name = coalesce(nullif(trim(p.full_name), ''), 'Cliente')
  from public.profiles p
 where p.id = o.client_id and o.client_name is null;

create function public.orders_set_client_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(nullif(trim(full_name), ''), 'Cliente') into new.client_name
    from public.profiles where id = new.client_id;
  return new;
end;
$$;

create trigger orders_client_name
  before insert on public.orders
  for each row execute function public.orders_set_client_name();

-- 2. La cucina (o l'admin) cambia lo stato: confermato → pronto → ritirato
--    (si può tornare da pronto a confermato in caso di errore; gli annullati non si toccano)
create function public.set_order_status(p_order uuid, p_status public.order_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order for update;
  if not found then
    raise exception 'Ordine non trovato';
  end if;
  if not (public.is_kitchen_member(v_order.kitchen_id) or public.is_admin()) then
    raise exception 'Non è un ordine della tua gastronomia';
  end if;
  if not (
       (v_order.status = 'confermato' and p_status = 'pronto')
    or (v_order.status = 'pronto'     and p_status = 'ritirato')
    or (v_order.status = 'pronto'     and p_status = 'confermato')
    or (v_order.status = 'confermato' and p_status = 'ritirato')
  ) then
    raise exception 'Cambio di stato non permesso';
  end if;

  update public.orders set status = p_status where id = p_order;
end;
$$;

revoke all on function public.orders_set_client_name() from public, anon, authenticated;
revoke all on function public.set_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;

-- 3. La cucina vede anche la propria gastronomia se disattivata (per lo storico)
create policy "La cucina vede la sua gastronomia"
  on public.kitchens for select to authenticated
  using ((select public.is_kitchen_member(id)));
