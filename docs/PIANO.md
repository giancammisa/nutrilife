# NutriLife v1 — piano approvato (22/11/2026)

## Decisioni prese
- **Allergie del cliente:** si salvano (solo la lista dei 14 allergeni UE + intolleranze), con consenso specifico. Servono a bloccare gli ordini pericolosi.
- **Basi:** catalogo unico (`bases`, usato dal nutrizionista) + versione di ogni cucina (`kitchen_bases`, con allergeni e disponibilità).
- **Login:** link magico via email (niente password).
- **`legacy/`** non va mai su GitHub (contiene PDF caricati e password di prova).

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
| 5 | Pacchetti caricati da admin/cucina | Il saldo mostra 10 |
| 6 | Cliente: la mia settimana + ordina (allergeni, orario limite 18:00 Europe/Rome, scala dal saldo) | Test 17:59 sì / 18:01 no, anche al cambio dell'ora; test allergeni |
| 7 | Cliente: il mio pacchetto + storico | Annullare prima delle 18:00 restituisce il pasto |
| 8 | Cucina: ordini di domani, riepilogo produzione, etichette, pronto/ritirato | Stampa di un'etichetta vera |
| 9 | PWA + BETA_MODE | Installata sul telefono |
| 10 | Controllo RLS con utenti di ruoli diversi, informativa privacy, pubblicazione definitiva (con conferma) | — |

## Modello dati (Supabase)
- `profiles`: ruolo (cliente/nutrizionista/cucina/admin), nome, telefono, attivo, data e versione del consenso
- `allergens`: 14 allergeni UE (codice, nome)
- `kitchens`: nome, indirizzo, attiva
- `kitchen_members`: utenti di una cucina
- `bases`: catalogo (nome, categoria: proteina/carboidrato/verdura/altro)
- `kitchen_bases`: base in quella cucina (allergeni, allergeni dichiarati sì/no, disponibile)
- `nutritionist_patients`: nutrizionista ↔ paziente
- `invites`: codice casuale, scadenza, usato da/quando
- `meal_templates`: pasto tipo del paziente (nome, momento: pranzo/cena, attivo)
- `meal_template_items`: basi + grammi
- `packages`: cliente, una cucina, pasti totali/rimasti, riferimento scontrino, caricato da
- `orders`: cliente, cucina, pacchetto, pasto tipo, data di ritiro, stato (confermato/pronto/ritirato/annullato), conferma "non verificato"
- `order_items`: copia di basi, grammi e allergeni al momento dell'ordine (per l'etichetta)
- `app_settings`: BETA_MODE, orario limite

Regole nel database: l'ordine passa da un'unica funzione che controlla orario limite, saldo e allergeni e scala il pasto in modo atomico. Vincolo: un solo ordine per cliente, giorno e momento.

## Grafica (dalla demo)
- Font: Manrope (titoli), IBM Plex Sans (testo)
- Chiaro: sfondo #F7F6F3, testo #1A1A1A, card #FFFFFF, primario #4A7C59, accento #E8B275
- Scuro: sfondo #141413, testo #F7F6F3, card #1E1E1C, primario #6B9B78, accento #E8B275
- Pulsanti a pillola, niente blu, niente nero/bianco puri.
