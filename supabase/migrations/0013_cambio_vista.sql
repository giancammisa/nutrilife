-- =====================================================================
-- NutriLife · Cambio di vista
-- Un account può avere più ruoli permessi (allowed_roles) e passare da uno all'altro.
-- Il ruolo "attivo" resta profiles.role: tutte le regole di sicurezza esistenti
-- continuano a valere per il ruolo che si sta usando in quel momento.
-- Solo l'admin può dare ruoli permessi; ognuno passa solo tra i suoi.
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. Ruoli tra cui l'account può passare (vuoto = solo il suo ruolo)
alter table public.profiles
  add column allowed_roles public.user_role[] not null default '{}';

-- 2. Passare a un altro dei propri ruoli permessi
create function public.switch_my_role(p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = (select auth.uid());
  if v_profile.id is null or not v_profile.active then
    raise exception 'Account non attivo';
  end if;
  if not (p_role = any(v_profile.allowed_roles)) then
    raise exception 'Ruolo non permesso';
  end if;
  update public.profiles set role = p_role where id = v_profile.id;
end;
$$;

revoke all on function public.switch_my_role(public.user_role) from public, anon;
grant execute on function public.switch_my_role(public.user_role) to authenticated;

-- 3. Chi oggi è admin può passare a tutte le viste
update public.profiles
   set allowed_roles = '{admin,nutrizionista,cliente,cucina}'
 where role = 'admin';
