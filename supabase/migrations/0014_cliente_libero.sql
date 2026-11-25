-- =====================================================================
-- NutriLife · Passo 13 · Cliente libero
-- Il cliente, anche senza nutrizionista, compone i suoi piatti pesati.
-- I suoi piatti hanno nutritionist_id vuoto; quelli del nutrizionista restano "verificati".
-- Il cliente non può mai modificare i pasti del nutrizionista, né quelli di altri.
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- 1. Pasti senza nutrizionista = piatti del cliente
alter table public.meal_templates alter column nutritionist_id drop not null;

-- 2. Chi può modificare un pasto: il nutrizionista del paziente (come prima)
--    oppure il cliente stesso, solo per i propri piatti
create or replace function public.can_edit_template(p_template uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.meal_templates t
    where t.id = p_template
      and (
        (t.nutritionist_id = (select auth.uid()) and public.is_my_patient(t.patient_id))
        or (t.nutritionist_id is null and t.patient_id = (select auth.uid())
            and public.current_role_is('cliente'))
      )
  );
$$;

-- 3. Il cliente crea e modifica solo i propri piatti
create policy "Il cliente crea i suoi piatti"
  on public.meal_templates for insert to authenticated
  with check (patient_id = (select auth.uid()) and nutritionist_id is null
              and (select public.current_role_is('cliente')));

create policy "Il cliente modifica i suoi piatti"
  on public.meal_templates for update to authenticated
  using (patient_id = (select auth.uid()) and nutritionist_id is null
         and (select public.current_role_is('cliente')))
  with check (patient_id = (select auth.uid()) and nutritionist_id is null
              and (select public.current_role_is('cliente')));
