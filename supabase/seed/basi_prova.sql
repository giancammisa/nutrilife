-- =====================================================================
-- NutriLife · Catalogo basi di prova (dati, non struttura)
-- Basi comuni nelle diete, già pensate come "cotte e pronte".
-- Le basi che esistono già (stesso nome) vengono saltate.
-- Da incollare nell'SQL Editor di Supabase e premere "Run".
-- =====================================================================

insert into public.bases (name, category) values
  -- Proteine
  ('Petto di pollo', 'proteina'),
  ('Fesa di tacchino alla piastra', 'proteina'),
  ('Manzo magro alla piastra', 'proteina'),
  ('Salmone al forno', 'proteina'),
  ('Merluzzo al vapore', 'proteina'),
  ('Orata al forno', 'proteina'),
  ('Tonno al naturale', 'proteina'),
  ('Uova sode', 'proteina'),
  ('Frittata di albumi', 'proteina'),
  ('Ricotta vaccina', 'proteina'),
  ('Bresaola', 'proteina'),
  ('Tofu alla piastra', 'proteina'),
  ('Lenticchie lessate', 'proteina'),
  ('Ceci lessati', 'proteina'),
  -- Carboidrati
  ('Riso basmati', 'carboidrato'),
  ('Riso integrale', 'carboidrato'),
  ('Pasta di semola', 'carboidrato'),
  ('Pasta integrale', 'carboidrato'),
  ('Farro perlato', 'carboidrato'),
  ('Orzo perlato', 'carboidrato'),
  ('Quinoa', 'carboidrato'),
  ('Couscous', 'carboidrato'),
  ('Patate al forno', 'carboidrato'),
  ('Patate dolci al forno', 'carboidrato'),
  ('Pane integrale', 'carboidrato'),
  -- Verdure
  ('Zucchine grigliate', 'verdura'),
  ('Melanzane grigliate', 'verdura'),
  ('Peperoni al forno', 'verdura'),
  ('Spinaci saltati', 'verdura'),
  ('Broccoli al vapore', 'verdura'),
  ('Fagiolini lessati', 'verdura'),
  ('Carote al vapore', 'verdura'),
  ('Cavolfiore al forno', 'verdura'),
  ('Finocchi gratinati', 'verdura'),
  ('Insalata mista', 'verdura'),
  ('Pomodorini', 'verdura'),
  -- Altro
  ('Olio extravergine d''oliva', 'altro'),
  ('Avocado', 'altro'),
  ('Mandorle', 'altro'),
  ('Parmigiano Reggiano', 'altro')
on conflict do nothing;

-- Controllo: quante basi per categoria
select category, count(*) from public.bases where active group by category order by category;
