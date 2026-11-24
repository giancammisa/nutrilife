# NutriLife — prima di aprire ai pazienti veri

Lista dal controllo finale del passo 10 (23/11/2026). Le voci con ⚠️ bloccano la partenza.

## 1. Mettere l'app online
- ⚠️ **Vercel**: sbloccare l'account (richiesta al supporto per la verifica in due passaggi) oppure decidere un'alternativa.
- Importare il repository `giancammisa/nutrilife` e inserire le variabili:
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://oxvqwkcykbwkcuqtpvpv.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = la chiave `sb_publishable_…`
- In Supabase → Authentication → URL Configuration:
  - **Site URL** = indirizzo online (es. `https://app.nutrilife.it`)
  - **Redirect URLs**: aggiungere `https://<indirizzo online>/**` (lasciare `http://localhost:3000/**` per lo sviluppo)
- Controllare che `/accedi/prova` online risponda **404** (esiste solo in sviluppo).

## 2. Dominio ed email
- ⚠️ **Dominio** (es. `nutrilife.it`): collegarlo a Vercel e verificarlo in **Resend** (record DNS).
- In Supabase → SMTP: mittente `accesso@<dominio>` al posto di `onboarding@resend.dev` (oggi le email arrivano solo al titolare).
- Supabase → Authentication → Rate Limits: alzare il limite di invio email (es. 100/ora).

## 3. Privacy (dati sulla salute: allergie e intolleranze)
- ⚠️ Far rivedere `src/app/privacy/page.tsx` a un consulente privacy e completare le parti `[tra parentesi quadre]` (titolare, email privacy, tempi di conservazione, fornitori).
- ⚠️ Dopo la revisione: aumentare `PRIVACY_VERSION` in `src/lib/auth.ts` → tutti ridanno il consenso al primo accesso.
- Accordi di trattamento (DPA) con Supabase, Resend, Vercel e **Anthropic** (lettura dei piani dieta con l'AI: inserirla anche nell'informativa); registro dei trattamenti; valutare con il consulente se serve la valutazione d'impatto (DPIA) per i dati sanitari.
- Procedura per le richieste di cancellazione/accesso ai dati (per ora manuale via email).

## 4. Dati e configurazione
- ⚠️ **Pulizia dei dati di prova** (da fare insieme, con conferma): utenti `nutrizionista.prova@`, `paziente.prova@`, `provacucina.prova@nutrilife.test`, ordini di prova, prezzi di prova (pollo 10 €/kg, calo 25%, ricarico 30%; zucchine 8 €/kg; costo fisso 1,50 €) e la gastronomia di prova "L'angolo delle bontà" se non è reale.
- Catalogo basi, prezzi e **allergeni verificati con la gastronomia vera**.
- Stampare un'etichetta vera con la stampante della gastronomia.
- Lasciare **Modalità prova (BETA)** attiva durante la fase di prova.

## 5. Account e continuità
- Attivare la verifica in due passaggi (con codici di recupero salvati!) su GitHub, Supabase, Vercel, Resend.
- ⚠️ Supabase piano Free: il progetto **si mette in pausa dopo 7 giorni senza attività** e i backup sono limitati → per la prova con pazienti valutare il piano Pro.
- Installare l'app su un Android e un iPhone veri e provare un ordine completo.

## 6. Miglioramenti dopo la prova (non bloccanti)
- Spostare le funzioni di controllo interne (`is_admin`, `is_my_patient`, …) in uno schema non esposto (avvisi dell'Advisor, oggi innocui: rivelano solo i permessi di chi chiama).
- Credito prepagato in euro; notifiche; pagina "I miei dati" con richiesta di cancellazione.

## Controllo di sicurezza del 23/11/2026 (risultati)
- 14 tabelle, tutte con Row Level Security; l'anonimo non legge né scrive nulla.
- Ordini, collegamenti paziente e costi si scrivono solo tramite funzioni con controlli.
- Prove per ruolo (lettura e scrittura) superate per anonimo, cliente, nutrizionista e cucina; admin provato dalle pagine nei passi 3–9.
- Advisor Supabase: 0 errori; avvisi spiegati sopra; chiusa `rls_auto_enable` (SQL `0008`).


## Prima dell'apertura al pubblico
- Togliere `robots: { index: false, follow: false }` da `src/app/layout.tsx` (oggi il sito non va nei motori di ricerca, perché è in prova).
- Controllare in Supabase → Advisors (Security e Performance) che non ci siano avvisi.
