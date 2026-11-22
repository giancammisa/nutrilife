# NutriLife — istruzioni per Claude Code

## Chi sono e come lavorare con me
- Sono Gianvito, fondatore di NutriLife, ad Altamura. **Non sono uno sviluppatore professionista.**
- Rispondi sempre in **italiano**.
- Spiegami le scelte tecniche in parole semplici, in 2-3 righe, prima di farle. Non darle per scontate.
- Lavora a **piccoli passi**: un pezzo alla volta, verificato e funzionante, poi un commit su GitHub con un messaggio chiaro in italiano.
- Prima di tutto ciò che è difficile da annullare (cancellare file o dati, cambiare lo schema del database già in uso, pubblicare online) chiedimi conferma.
- Non dire che una cosa è finita se non l'hai provata. Se qualcosa non funziona, dimmelo chiaramente.
- Quando hai bisogno che io faccia qualcosa (creare un account, copiare una chiave), dammi istruzioni passo per passo.

## Il prodotto
NutriLife è il servizio che fa **cucinare il piano del nutrizionista** da una gastronomia di Altamura.
Tormentone del brand: **"Dimmelo prima"**: il cliente ordina il giorno prima, la cucina gli prepara il pasto già pesato.

Tre utenti:
1. **Nutrizionista**: inserisce per ogni paziente 3-4 "pasti tipo" (basi + grammature) e lo invita con un link. Non scrive l'intero piano: quello resta nel suo software.
2. **Cliente/paziente**: vede il calendario, sceglie i giorni in cui farsi preparare un pasto tipo, sceglie la gastronomia, ordina **entro le 18:00 del giorno prima** (ora di Roma), ritira in gastronomia.
3. **Cucina partner (gastronomia)**: riceve la lista degli ordini del giorno dopo con le grammature, il riepilogo di produzione (es. "domani 3,2 kg di pollo") e stampa le etichette (nome, grammature, allergeni).

Idea chiave: la cucina lavora con un **menu componibile di basi** (proteine, carboidrati, verdure) che cucina in quantità e poi pesa per ogni ordine.

## Da dove partiamo
- Il codice della demo fatta con Emergent è nella cartella `legacy/` (React + FastAPI + MongoDB).
- **Non** copiarlo così com'è. Usalo come riferimento per schermate, testi, logica e grafica (Tailwind + shadcn/ui).
- Il backend FastAPI (`legacy/backend/server.py`, oltre 2.100 righe) va sostituito da Supabase: riprendi solo le regole di business che servono.
- Non toccare mai i file in `legacy/`: sono solo da leggere.

## Tecnologia
- **Next.js** (App Router, TypeScript)
- **Supabase**: database Postgres, login, Row Level Security; progetto in **regione UE**
- **Tailwind CSS + shadcn/ui** (come nella demo)
- Pubblicazione su **Vercel**
- Web app installabile come **PWA** (icona sulla schermata Home, schermo intero), pensata prima di tutto per il telefono
- Le chiavi e i segreti stanno solo in `.env.local`, mai nel codice e mai su GitHub.

## Cosa costruiamo ora (versione 1)
Cinque schermate, più il login con i ruoli:
1. **Cliente: la mia settimana** (calendario con i pasti tipo e gli ordini)
2. **Cliente: ordina** (scelta del pasto tipo e della gastronomia, allergeni ben visibili, controllo dell'orario limite)
3. **Cliente: il mio pacchetto** (pasti rimasti, storico ordini)
4. **Cucina: ordini di domani** (lista, riepilogo di produzione, etichette da stampare, segna come pronto/ritirato)
5. **Nutrizionista: pasti tipo del paziente** (inserimento basi + grammature, invito del paziente con link)

Più un pannello **admin** minimo per me: creare cucine, basi, pacchetti, attivare utenti.

## Fuori dalla versione 1 (non costruire, anche se c'è nella demo)
NutriScore, abbonamento Premium a 4,99 €, consigli AI, recensioni, notifiche push, pagamenti in app (Stripe Connect), match in percentuale con i ristoranti. Ci torneremo dopo la fase di prova.

## Regole di business
- **Orario limite:** un ordine per il giorno X si può fare o modificare fino alle 18:00 del giorno X-1, fuso orario Europe/Rome.
- **Pacchetti:** il cliente compra in gastronomia un pacchetto prepagato (es. 10 pasti) legato a **una sola gastronomia**. Il pagamento avviene in negozio, con lo scontrino della gastronomia. Nell'app c'è solo il **saldo**: ogni ordine scala un pasto. L'admin o la cucina caricano i pacchetti.
- **Allergeni:** ogni base ha i suoi allergeni (14 allergeni UE), con il modello a tre stati già deciso nell'audit della demo (controlla `legacy/` per i dettagli). Gli allergeni devono essere visibili **prima** della conferma dell'ordine e stampati sull'etichetta.
- **BETA_MODE:** mantieni un interruttore di configurazione per la fase di prova (come nella demo).

## Privacy e sicurezza (non negoziabile)
- Raccogliamo solo ciò che serve: pasti tipo e grammature. **Niente** anamnesi, peso, esami o il piano alimentare completo.
- Row Level Security su tutte le tabelle: il cliente vede solo i suoi dati, la cucina solo i suoi ordini, il nutrizionista solo i suoi pazienti.
- Consenso esplicito al trattamento dei dati alla registrazione, con link all'informativa privacy.
- Nessun dato personale nei log o negli URL.

## Bozza del modello dati (da rivedere insieme prima di crearlo)
- `profiles` (ruolo: cliente, nutrizionista, cucina, admin)
- `kitchens` (gastronomie partner)
- `bases` (basi del menu componibile, con allergeni, per cucina)
- `meal_templates` (pasti tipo del paziente: componenti + grammature, creati dal nutrizionista)
- `orders` (cliente, cucina, data di ritiro, pasto tipo, stato)
- `packages` (pacchetto prepagato: cliente, cucina, pasti totali e rimasti)
