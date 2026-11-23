# NutriLife v1 — piano approvato (22/11/2026)

## Decisioni prese
- **Allergie del cliente:** si salvano (solo la lista dei 14 allergeni UE + intolleranze), con consenso specifico. Servono a bloccare gli ordini pericolosi.
- **Basi:** catalogo unico (`bases`, usato dal nutrizionista) + versione di ogni cucina (`kitchen_bases`, con allergeni e disponibilità).
- **Login:** senza password, con **codice di 6 cifre via email** (deciso al passo 2 al posto del link: il link apre il browser e non l'app installata sul telefono).
- **Prezzi (23/11/2026):** ogni gastronomia dà un prezzo **al kg** a ogni sua base, in due modi: **diretto** (prezzo di vendita al kg) oppure **dal costo** (costo in fattura al kg + **calo peso in cottura %** + **ricarico % sul costo**). Formula: costo cotto = costo ÷ (1 − calo%); prezzo = costo cotto × (1 + ricarico%). Calcolo fatto dal database. Costo, calo e ricarico sono riservati (solo admin, poi cucina). Prezzo del pasto = Σ grammi × prezzo/kg + **costo fisso per pasto** della gastronomia. Prezzo fotografato nell'ordine. **Pagamento al ritiro in gastronomia**, nessun pagamento nell'app.
- **Pacchetti:** rinviati. Quando serviranno, sarà un **credito in euro** (non "N pasti"), perché i pasti hanno prezzi diversi.
- **`legacy/`** non va mai su GitHub (contiene PDF caricati e password di prova).

## Stato (23/11/2026)
- Passo 0 e 1: fatti in locale e su GitHub. **Manca Vercel** (bloccato dalla verifica del telefono).
- Passo 2: fatto e provato (accesso con codice o link, Benvenuto con consenso, area Cliente). SQL `0001` eseguito su Supabase.
- Passo 3: fatto e provato (gastronomie, catalogo basi, allergeni a tre stati nel pannello admin). SQL `0002` eseguito su Supabase. Utente titolare = admin.
- Passo 4: fatto e provato (ruolo da admin, invito nutrizionista → paziente, pasti tipo visibili al paziente, paziente respinto da pagine nutrizionista/admin). SQL `0003` eseguito. Utenti di prova `nutrizionista.prova@nutrilife.test` e `paziente.prova@nutrilife.test` (accesso da `/accedi/prova`, solo in locale).
- Passo 5 (prezzi): fatto e provato. SQL `0004` eseguito. Pollo 10 €/kg, calo 25%, ricarico 30% → 17,33 €/kg (anteprima e database coincidono); zucchine 8,00 €/kg diretto; costo fisso 1,50 € → Pranzo A (150 g + 200 g) = 5,70 € visto dal paziente. Il paziente non legge i costi e non può cambiare i prezzi.
- Vercel: account bloccato dalla verifica in due passaggi; scritto al supporto Vercel.
- Email: SMTP Resend con mittente provvisorio `onboarding@resend.dev` (arriva solo all'email del titolare). Serve un dominio prima dei pazienti.

## Allergeni: modello a tre stati (dalla demo)
1. Dichiarato con conflitto con un'allergia del cliente → ordine **bloccato**.
2. Dichiarato e sicuro → ordine permesso.
3. Non verificato (allergeni non dichiarati) → banner ambra + casella obbligatoria "Confermo che verificherò gli allergeni con la gastronomia".
- Intolleranze: solo avviso giallo, non bloccano.
- Nella v1 gli allergeni stanno su ogni base: un pasto tipo eredita l'unione degli allergeni delle sue basi; è "non verificato" se almeno una base non è dichiarata.

## Passi
| # | Passo | Prova |
|---|---|---|
| 0 | Git, GitHub privato, `.gitignore` (esclude `legacy/` e `.env.local`) | Su GitHub non c'è nulla di legacy |
| 1 | Scheletro Next.js + Tailwind + shadcn con la grafica della demo, online su Vercel | Si apre dal telefono |
| 2 | Supabase (UE) + login + `profiles` con ruoli + consenso privacy | Registrazione, consenso, home diversa per ruolo |
| 3 | Admin: cucine, basi, allergeni + RLS | Creo una gastronomia e 5 basi con allergeni |
| 4 | Nutrizionista: pazienti, link invito, pasti tipo | Il paziente di prova vede i suoi pasti tipo, un altro no |
| 5 | Prezzi: prezzo/kg per base (diretto o dal costo con calo e ricarico), costo fisso per gastronomia, prezzo del pasto | Pollo 10 €/kg, calo 25%, ricarico 30% → 17,33 €/kg; il cliente vede il prezzo del pasto tipo |
| 6 | Cliente: la mia settimana + ordina (allergeni, orario limite 18:00 Europe/Rome, prezzo mostrato e fotografato, pagamento al ritiro) | Test 17:59 sì / 18:01 no, anche al cambio dell'ora; test allergeni |
| 7 | Cliente: storico ordini e annullamento | Annullare prima delle 18:00 funziona, dopo no |
| 8 | Cucina: ordini di domani, riepilogo produzione, etichette, pronto/ritirato | Stampa di un'etichetta vera |
| 9 | PWA + BETA_MODE | Installata sul telefono |
| 10 | Controllo RLS con utenti di ruoli diversi, informativa privacy, pubblicazione definitiva (con conferma) | — |

## Modello dati (Supabase)
- `profiles`: ruolo (cliente/nutrizionista/cucina/admin), nome, telefono, attivo, data e versione del consenso
- `allergens`: 14 allergeni UE (codice, nome)
- `kitchens`: nome, indirizzo, attiva
- `kitchen_members`: utenti di una cucina
- `bases`: catalogo (nome, categoria: proteina/carboidrato/verdura/altro)
- `kitchen_bases`: base in quella cucina (allergeni, allergeni dichiarati sì/no, disponibile, **prezzo di vendita al kg**)
- `kitchen_base_costs`: **riservata** — modo (diretto/dal costo), costo al kg, calo peso %, ricarico %
- `kitchens.fixed_fee_cents`: costo fisso per pasto
- `nutritionist_patients`: nutrizionista ↔ paziente
- `invites`: codice casuale, scadenza, usato da/quando
- `meal_templates`: pasto tipo del paziente (nome, momento: pranzo/cena, attivo)
- `meal_template_items`: basi + grammi
- `packages`: rinviato (credito in euro)
- `orders`: cliente, cucina, pasto tipo, prezzo fotografato, data di ritiro, stato (confermato/pronto/ritirato/annullato), conferma "non verificato"
- `order_items`: copia di basi, grammi e allergeni al momento dell'ordine (per l'etichetta)
- `app_settings`: BETA_MODE, orario limite

Regole nel database: l'ordine passa da un'unica funzione che controlla orario limite e allergeni, calcola e fotografa il prezzo. Vincolo: un solo ordine per cliente, giorno e momento.

## Grafica (dalla demo)
- Font: Manrope (titoli), IBM Plex Sans (testo)
- Chiaro: sfondo #F7F6F3, testo #1A1A1A, card #FFFFFF, primario #4A7C59, accento #E8B275
- Scuro: sfondo #141413, testo #F7F6F3, card #1E1E1C, primario #6B9B78, accento #E8B275
- Pulsanti a pillola, niente blu, niente nero/bianco puri.
