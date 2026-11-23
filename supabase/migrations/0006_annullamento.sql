-- =====================================================================
-- NutriLife · Passo 7 · Annullamento ordini
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- Il cliente annulla un proprio ordine, solo se ancora "confermato" e prima dell'orario limite.
-- L'ordine non viene cancellato: resta nello storico con stato "annullato".
create function public.cancel_order(p_order uuid)
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
  if v_order.status <> 'confermato' then
    raise exception 'Ordine non annullabile';
  end if;
  if not public.order_window_open(v_order.pickup_date) then
    raise exception 'Orario limite superato';
  end if;

  update public.orders
     set status = 'annullato', cancelled_at = now()
   where id = p_order;
end;
$$;

revoke all on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;
