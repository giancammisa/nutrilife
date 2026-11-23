-- =====================================================================
-- NutriLife · Passo 4 · Utenti, nutrizionista, inviti, pasti tipo
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. L'email nel profilo, per riconoscere le persone nel pannello admin
alter table public.profiles add column email text;

update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

-- 2. Funzioni di servizio sui ruoli
create function public.current_role_is(p_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = p_role and active
  );
$$;

-- 3. Admin: cambia ruolo e stato di un utente (non può togliere l'admin a sé stesso)
create function public.admin_set_user(p_user uuid, p_role public.user_role, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo l''admin può cambiare i ruoli';
  end if;
  if p_user = (select auth.uid()) and (p_role <> 'admin' or not p_active) then
    raise exception 'Non puoi togliere a te stesso il ruolo di admin';
  end if;
  update public.profiles set role = p_role, active = p_active where id = p_user;
end;
$$;

-- 4. Pazienti del nutrizionista (un paziente ha un solo nutrizionista)
create table public.nutritionist_patients (
  nutritionist_id  uuid not null references public.profiles (id) on delete cascade,
  patient_id       uuid not null unique references public.profiles (id) on delete cascade,
  created_at       timestamptz not null default now(),
  primary key (nutritionist_id, patient_id)
);

create function public.is_my_patient(p_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.nutritionist_patients
    where nutritionist_id = (select auth.uid()) and patient_id = p_patient
  ) and public.current_role_is('nutrizionista');
$$;

-- 5. Inviti: il codice del link è salvato solo cifrato (sha256)
create table public.invites (
  id               uuid primary key default gen_random_uuid(),
  nutritionist_id  uuid not null references public.profiles (id) on delete cascade,
  token_hash       text not null unique,
  label            text check (char_length(label) <= 80),
  expires_at       timestamptz not null default now() + interval '14 days',
  accepted_by      uuid references public.profiles (id) on delete set null,
  accepted_at      timestamptz,
  created_at       timestamptz not null default now()
);

-- Il paziente accetta l'invito: lo collega al nutrizionista
create function public.accept_invite(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.invites;
  v_me     uuid := (select auth.uid());
  v_name   text;
begin
  if v_me is null then
    raise exception 'Accesso richiesto';
  end if;

  select * into v_invite
    from public.invites
   where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
   for update;

  if not found then
    raise exception 'Invito non valido';
  end if;
  if v_invite.accepted_at is not null then
    if v_invite.accepted_by = v_me then
      select full_name into v_name from public.profiles where id = v_invite.nutritionist_id;
      return coalesce(v_name, 'il tuo nutrizionista');
    end if;
    raise exception 'Invito già usato';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'Invito scaduto';
  end if;
  if not public.current_role_is('cliente') then
    raise exception 'Solo un cliente può accettare un invito';
  end if;
  if exists (select 1 from public.nutritionist_patients where patient_id = v_me) then
    raise exception 'Sei già collegato a un nutrizionista';
  end if;

  insert into public.nutritionist_patients (nutritionist_id, patient_id)
  values (v_invite.nutritionist_id, v_me);

  update public.invites
     set accepted_by = v_me, accepted_at = now()
   where id = v_invite.id;

  select full_name into v_name from public.profiles where id = v_invite.nutritionist_id;
  return coalesce(v_name, 'il tuo nutrizionista');
end;
$$;

-- 6. Pasti tipo del paziente
create type public.meal_slot as enum ('pranzo', 'cena');

create table public.meal_templates (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references public.profiles (id) on delete cascade,
  nutritionist_id  uuid not null references public.profiles (id) on delete cascade,
  name             text not null check (char_length(trim(name)) between 1 and 60),
  meal_slot        public.meal_slot not null,
  notes            text check (char_length(notes) <= 300),
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index meal_templates_patient_idx on public.meal_templates (patient_id);

create trigger meal_templates_set_updated_at
  before update on public.meal_templates
  for each row execute function public.set_updated_at();

create table public.meal_template_items (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.meal_templates (id) on delete cascade,
  base_id      uuid not null references public.bases (id) on delete restrict,
  grams        integer not null check (grams between 1 and 1000),
  created_at   timestamptz not null default now(),
  unique (template_id, base_id)
);

-- Funzione di servizio: posso modificare questo pasto tipo? (nutrizionista del paziente)
create function public.can_edit_template(p_template uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.meal_templates t
    where t.id = p_template
      and t.nutritionist_id = (select auth.uid())
      and public.is_my_patient(t.patient_id)
  );
$$;

create function public.can_read_template(p_template uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.meal_templates t
    where t.id = p_template
      and (t.patient_id = (select auth.uid())
           or public.is_my_patient(t.patient_id)
           or public.is_admin())
  );
$$;

-- 7. Regole di accesso (Row Level Security)
alter table public.nutritionist_patients enable row level security;
alter table public.invites               enable row level security;
alter table public.meal_templates        enable row level security;
alter table public.meal_template_items   enable row level security;

-- Profili: il nutrizionista vede i suoi pazienti, il paziente vede il suo nutrizionista
create policy "Il nutrizionista vede i suoi pazienti"
  on public.profiles for select to authenticated
  using ((select public.is_my_patient(id)));

create policy "Il paziente vede il suo nutrizionista"
  on public.profiles for select to authenticated
  using (exists (
    select 1 from public.nutritionist_patients np
    where np.patient_id = (select auth.uid()) and np.nutritionist_id = profiles.id
  ));

-- Collegamenti: li vedono il nutrizionista, il paziente e l'admin (si creano solo con accept_invite)
create policy "Vedo i miei collegamenti"
  on public.nutritionist_patients for select to authenticated
  using (nutritionist_id = (select auth.uid())
         or patient_id = (select auth.uid())
         or (select public.is_admin()));

-- Inviti: il nutrizionista crea e vede i propri
create policy "Il nutrizionista vede i suoi inviti"
  on public.invites for select to authenticated
  using (nutritionist_id = (select auth.uid()) or (select public.is_admin()));
create policy "Il nutrizionista crea inviti"
  on public.invites for insert to authenticated
  with check (nutritionist_id = (select auth.uid())
              and (select public.current_role_is('nutrizionista')));

-- Pasti tipo: li legge il paziente, il suo nutrizionista e l'admin; li scrive il nutrizionista
create policy "Leggo i pasti tipo"
  on public.meal_templates for select to authenticated
  using (patient_id = (select auth.uid())
         or (select public.is_my_patient(patient_id))
         or (select public.is_admin()));
create policy "Il nutrizionista crea pasti tipo"
  on public.meal_templates for insert to authenticated
  with check (nutritionist_id = (select auth.uid()) and (select public.is_my_patient(patient_id)));
create policy "Il nutrizionista modifica pasti tipo"
  on public.meal_templates for update to authenticated
  using (nutritionist_id = (select auth.uid()) and (select public.is_my_patient(patient_id)))
  with check (nutritionist_id = (select auth.uid()) and (select public.is_my_patient(patient_id)));

create policy "Leggo le basi dei pasti tipo"
  on public.meal_template_items for select to authenticated
  using ((select public.can_read_template(template_id)));
create policy "Il nutrizionista aggiunge basi"
  on public.meal_template_items for insert to authenticated
  with check ((select public.can_edit_template(template_id)));
create policy "Il nutrizionista modifica le grammature"
  on public.meal_template_items for update to authenticated
  using ((select public.can_edit_template(template_id)))
  with check ((select public.can_edit_template(template_id)));
create policy "Il nutrizionista toglie basi"
  on public.meal_template_items for delete to authenticated
  using ((select public.can_edit_template(template_id)));

-- 8. Permessi
revoke all on public.nutritionist_patients, public.invites,
              public.meal_templates, public.meal_template_items from anon, authenticated;

grant select on public.nutritionist_patients to authenticated;
grant select (id, nutritionist_id, label, expires_at, accepted_by, accepted_at, created_at)
  on public.invites to authenticated;
grant insert (nutritionist_id, token_hash, label) on public.invites to authenticated;
grant select, insert on public.meal_templates to authenticated;
grant update (name, meal_slot, notes, active) on public.meal_templates to authenticated;
grant select, insert, delete on public.meal_template_items to authenticated;
grant update (grams) on public.meal_template_items to authenticated;

revoke all on function public.current_role_is(public.user_role) from public, anon;
grant execute on function public.current_role_is(public.user_role) to authenticated;
revoke all on function public.admin_set_user(uuid, public.user_role, boolean) from public, anon;
grant execute on function public.admin_set_user(uuid, public.user_role, boolean) to authenticated;
revoke all on function public.is_my_patient(uuid) from public, anon;
grant execute on function public.is_my_patient(uuid) to authenticated;
revoke all on function public.accept_invite(text) from public, anon;
grant execute on function public.accept_invite(text) to authenticated;
revoke all on function public.can_edit_template(uuid) from public, anon;
grant execute on function public.can_edit_template(uuid) to authenticated;
revoke all on function public.can_read_template(uuid) from public, anon;
grant execute on function public.can_read_template(uuid) to authenticated;
