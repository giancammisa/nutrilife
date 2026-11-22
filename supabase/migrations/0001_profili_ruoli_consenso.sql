-- =====================================================================
-- NutriLife · Passo 2 · Profili, ruoli e consenso privacy
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. I quattro ruoli possibili
create type public.user_role as enum ('cliente', 'nutrizionista', 'cucina', 'admin');

-- 2. Tabella dei profili: una riga per ogni persona registrata
create table public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  role                     public.user_role not null default 'cliente',
  full_name                text check (char_length(full_name) <= 120),
  phone                    text check (char_length(phone) <= 30),
  active                   boolean not null default true,
  privacy_consent_at       timestamptz,
  privacy_consent_version  text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.profiles is 'Profilo di ogni utente: ruolo, nome, telefono, consenso privacy. Nessun dato sanitario.';

-- 3. Aggiorna da solo la data di modifica
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4. Quando qualcuno si registra, crea in automatico il suo profilo (ruolo: cliente)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Funzione di servizio: l'utente collegato è un admin attivo?
--    (security definer: legge profiles senza passare dalle regole, evita giri infiniti)
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and active
  );
$$;

-- 6. Consenso privacy: lo registra il database con la sua ora, non l'app
create function public.give_privacy_consent(p_version text, p_full_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Accesso richiesto';
  end if;
  if coalesce(trim(p_version), '') = '' then
    raise exception 'Versione informativa mancante';
  end if;
  if char_length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'Inserisci nome e cognome';
  end if;

  update public.profiles
     set privacy_consent_at = now(),
         privacy_consent_version = trim(p_version),
         full_name = trim(p_full_name)
   where id = (select auth.uid());
end;
$$;

-- 7. Regole di accesso (Row Level Security)
alter table public.profiles enable row level security;

-- Ognuno vede il proprio profilo
create policy "Vedo il mio profilo"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- L'admin vede tutti i profili
create policy "L'admin vede tutti i profili"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

-- Ognuno può modificare il proprio profilo (ma solo nome e telefono: vedi i permessi sotto)
create policy "Modifico il mio profilo"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- 8. Permessi delle tabelle (il progetto NON li dà in automatico)
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
-- Ruolo, stato attivo e consenso NON sono modificabili dall'app:
-- il ruolo lo cambia l'admin (passo 3), il consenso passa da give_privacy_consent.

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.give_privacy_consent(text, text) from public, anon;
grant execute on function public.give_privacy_consent(text, text) to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
