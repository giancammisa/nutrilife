-- =====================================================================
-- NutriLife · Nuova categoria di base: Frutta
-- Da eseguire DA SOLO (prima di inserire basi di frutta), poi "Run".
-- =====================================================================
alter type public.base_category add value if not exists 'frutta' before 'altro';
