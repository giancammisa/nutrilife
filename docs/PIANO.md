# NutriLife v1 — piano approvato (22/11/2026)

## Decisioni prese
- **Allergie del cliente:** si salvano (solo la lista dei 14 allergeni UE + intolleranze), con consenso specifico. Servono a bloccare gli ordini pericolosi.
- **Basi:** catalogo unico (`bases`, usato dal nutrizionista) + versione di ogni cucina (`kitchen_bases`, con allergeni e disponibilità).
- **Login:** senza password, con **codice di 6 cifre via email** (deciso al passo 2 al posto del link: il link apre il browser e non l'app installata sul telefono).
- **Prezzi (23/11/2026):** ogni gastronomia dà un prezzo **al kg** a ogni sua base, in due modi: **diretto** (prezzo di vendita al kg) oppure **dal costo** (costo in fattura al kg + **calo peso in cottura %** + **ricarico % sul costo**). Formula: costo cotto = costo ÷ (1 − calo%); prezzo = costo cotto × (1 + ricarico%). Calcolo fatto dal database. Costo, calo e ricarico sono riservati (solo admin, poi cucina). Prezzo del pasto = Σ grammi × prezzo/kg + **costo fisso per pasto** della gastronomia. Prezzo fotografato nell'ordine. **Pagamento al ritiro in gastronomia**, nessun pagamento nell'app.
- **Pacchetti:** rinviati. Quando serviranno, sarà un **credito in euro** (non "N pasti"), perché i pasti hanno prezzi diversi.
- **Listino della gastronomia (24/11/2026):** la cucina gestisce da sola, solo per la sua gastronomia, basi del listino, prezzi (diretti o dal costo, costi riservati visibili a lei e all'admin), allergeni, disponibilità e costo fisso per pasto (`/cucina/listino`). Il catalogo comune delle basi resta all'admin. SQL `0009_listino_cucina.sql` eseguito su Supabase (24/11/2026).
- **Ritiro (24/11/2026):** dopo l'ordine il cliente ha un **biglietto di ritiro** (`/cliente/ritiro/[id]`) con un **codice di 4 caratteri** ricavato dal numero dell'ordine (`src/lib/pickup.ts`), nome, giorno, gastronomia, prezzo da pagare e stato. Lo stesso codice è sulla scheda della cucina e sull'etichetta; al banco si controllano codice + nome. Nessuna modifica al database. Possibili passi futuri: QR da scansionare e codice unico garantito dal database.
- **`legacy/`** non va mai su GitHub (contiene PDF caricati e password di prova).

## Stato (23/11/2026)
- Passo 0 e 1: fatti in locale e su GitHub. **Manca Vercel** (bloccato dalla verifica del telefono).
- Passo 2: fatto e provato (accesso con codice o link, Benvenuto con consenso, area Cliente). SQL `0001` eseguito su Supabase.
- Passo 3: fatto e provato (gastronomie, catalogo basi, allergeni a tre stati nel pannello admin). SQL `0002` eseguito su Supabase. Utente titolare = admin.
- Passo 4: fatto e provato (ruolo da admin, invito nutrizionista → paziente, pasti tipo visibili al paziente, paziente respinto da pagine nutrizionista/admin). SQL `0003` eseguito. Utenti di prova `nutrizionista.prova@nutrilife.test` e `paziente.prova@nutrilife.test` (accesso da `/accedi/prova`, solo in locale).
- Passo 5 (prezzi): fatto e provato. SQL `0004` eseguito. Pollo 10 €/kg, calo 25%, ricarico 30% → 17,33 €/kg (anteprima e database coincidono); zucchine 8,00 €/kg diretto; costo fisso 1,50 € → Pranzo A (150 g + 200 g) = 5,70 € visto dal paziente. Il paziente non legge i costi e non può cambiare i prezzi.
- Passo 6 (ordini): fatto e provato. SQL `0005` eseguito. Orario limite 17:59 aperto / 18:01 chiuso verificato in app e nel database (inverno, estate, cambio ora 29/03 e 25/10/2026). Ordine reale del paziente di prova per il 25/11 (5,70 €, copia di basi/prezzi/allergeni). Rifiutati dal database: doppio ordine, ordine oltre l'orario, oltre 14 giorni, modifica diretta del prezzo, ordine con allergene del cliente (Uova). Non provato con dati reali: il caso "allergeni non verificati" con spunta (nessuna base non verificata nei dati di prova).
- Passo 7 (storico e annullamento): fatto e provato. SQL `0006` eseguito. Annullato dall'app l'ordine del 25 (prima dell'orario limite) e rifatto; il database rifiuta l'annullamento dopo l'orario limite e quello di un ordine già annullato. Per la prova è stato inserito a mano un ordine di prova con ritiro 23/11 per il paziente di prova. Per cambiare un ordine: annulla e rifai entro l'orario limite.
- Passo 8 (cucina): fatto e provato come admin. SQL `0007` eseguito. Vista cucina (oggi/domani, riepilogo produzione in kg, ordini con grammi e allergeni, Pronto/Ritirato), etichette da stampare, collegamento utenti Cucina dalla scheda gastronomia. L'ordine di prova del 23/11 è passato a Pronto e Ritirato. Il paziente non può cambiare stati né vedere la cucina. Provato anche con l'utente di prova Cucina (`provacucina.prova@nutrilife.test`): senza collegamento non vede ordini né cambia stati; collegato vede solo gli ordini della sua gastronomia, nessun profilo cliente (solo il nome sull'ordine), nessun costo né pasto tipo; può segnare Pronto e tornare indietro; non entra nel pannello admin. Stampa su carta vera da provare in gastronomia.
- Passo 9 (PWA e BETA_MODE): fatto e provato in locale. Manifest (avvio da /home, schermo intero, colori NutriLife), icone 192/512/maskable/Apple, fascia "Versione di prova" quando BETA_MODE è attivo, pagina admin Impostazioni (orario limite e modalità prova). Un non-admin non può cambiare le impostazioni. Nessuna modalità offline (scelta: ordini e orari sempre aggiornati). **L'installazione sul telefono si prova solo con il sito online (HTTPS) → dopo Vercel.**
- Passo 10 (controllo finale): fatto. Tutte le 14 tabelle con RLS, anonimo senza accesso, prove di lettura/scrittura per ruolo superate, Advisor 0 errori, SQL `0008` eseguito. Informativa riscritta (bozza per il consulente) e nuovo consenso quando cambia la versione. Cosa manca per aprire ai pazienti: vedi `docs/PUBBLICAZIONE.md`.
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

## Grafica — "Cucina 3.0" di giorno (24/11/2026)
- Regole complete in `DESIGN.md` (direzione ispirata a Behance "Sisense AI Assistant"; logo e grafiche originali). Sostituisce la prova "Omnui" (giallo/inchiostro), scartata dal titolare.
- Fondo salvia chiaro #DFE6DA che sfuma nel grigio; schede di vetro bianco; colori pieni in sfumatura con testo nero: lime, verde leggero, grigio. Nero #0B0B0B per i pulsanti importanti (Accedi, Ordina, Conferma) e le icone da premere.
- Foto di cibo in controluce qua e là (`public/immagini`). **Prima di pubblicare servono foto con licenza d'uso.**
- Urbanist: sottile e grande per titoli e numeri, 600 per i nomi.
- Segno: tre cerchi fusi. Mossa firma: pasto in cerchi fusi (proteina rosa, carboidrato lime, verdura verde).
- Motto: **Cucina 3.0**.


## Prossimi passi v2 (decisi il 24/11/2026)
- **Catalogo basi:** obiettivo ~100–150 basi coprendo i gruppi alimentari (proteine animali e vegetali, latticini, cereali e derivati, tuberi, verdure, frutta, grassi e frutta secca): è l'ordine di grandezza con cui un nutrizionista compone diete senza sentirsi limitato. Nuova categoria **Frutta** (SQL `0010`). Catalogo di prova in `supabase/seed/basi_prova.sql` (~106 basi).
- **Passo 11 · Alternative nel pasto tipo (fatto, SQL `0011` eseguito il 24/11/2026):** per ogni parte del pasto il nutrizionista mette 2–4 alternative, ognuna con i suoi grammi (es. pollo 150 g / merluzzo 200 g). Il cliente ne sceglie una per parte quando ordina. Dati: `meal_template_items.choice_group` (stesso numero = alternative). L'ordine riceve le scelte e controlla una sola scelta per gruppo.
- **Passo 12 · Ordine da più punti vendita (fatto, SQL `0012` eseguito il 24/11/2026):** per ogni parte del pasto il cliente sceglie il punto vendita (es. pollo dalla gastronomia, piselli lessati da **Soleterra Primizie**, fruttivendolo con laboratorio). Nasce un ordine per ogni punto, legati da un `basket_id`, ognuno con il suo biglietto di ritiro e il suo costo fisso. Il vincolo "un ordine per cliente, giorno e momento" diventa "per punto vendita". Annullare annulla tutto il pasto. Ogni cucina vede e prepara solo la sua parte.
- **Cambio di vista (24/11/2026):** un account può avere più ruoli permessi (`profiles.allowed_roles`) e passare dall'uno all'altro dal menu del ruolo nell'intestazione (`switch_my_role`). Il ruolo attivo resta `profiles.role`, quindi tutte le regole di sicurezza restano invariate. L'admin ha tutte le viste. SQL `0013` eseguito su Supabase (24/11/2026).
