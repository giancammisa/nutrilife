-- =====================================================================
-- NutriLife · Passo 10 · Chiusure dal controllo di sicurezza
-- Da incollare nell'SQL Editor di Supabase e premere "Run" (una volta sola).
-- =====================================================================

-- Funzione creata da Supabase per attivare RLS sulle nuove tabelle: gira in automatico,
-- non serve che sia richiamabile dall'esterno (avviso dell'Advisor di sicurezza).
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Funzione dei trigger "data di modifica": non serve richiamarla dall'esterno.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
