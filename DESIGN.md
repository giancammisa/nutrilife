---
name: NutriLife
description: Cucina 3.0 — il piano del nutrizionista, cucinato e pesato al grammo da una gastronomia di Altamura.
colors:
  paper: "#F3F2EE"
  ink: "#121210"
  lemon: "#F4E96B"
  sage: "#3E7A55"
  card: "#FCFBF8"
  muted: "#E6E4DC"
  muted-text: "#56554E"
  border: "#D9D6CC"
  destructive: "#B8321A"
  warning: "#D9731A"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.01em"
  number:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
rounded:
  card: "14px"
  inner: "10px"
  pill: "9999px"
spacing:
  gutter: "24px"
  stack: "24px"
  card: "20px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 20px"
  button-lemon:
    backgroundColor: "{colors.lemon}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "48px"
  header-band:
    backgroundColor: "{colors.lemon}"
    textColor: "{colors.ink}"
  number-card:
    backgroundColor: "{colors.lemon}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  chip-role:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.lemon}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: NutriLife

## Overview
"Cucina 3.0": una cucina di quartiere che lavora con precisione da laboratorio. Il mondo visivo è inchiostro su carta con campi di **giallo burro**; la voce è un bastoni **espanso e pesantissimo in maiuscolo** per tutto ciò che si misura (giorni, grammi, chili, prezzi). La direzione è ispirata al progetto Behance "Omnui" di Velvele Studio (palette e tono), ma segno, forme e grafiche sono originali di NutriLife. App da telefono, schermate operative: la grafica non deve mai rallentare il compito.

Mossa firma: **il pasto in cerchi fusi**. Ogni pasto si disegna come cerchi (proteina, carboidrato, verdura) con area proporzionale ai grammi veri, fusi da un contorno inchiostro. Lo stesso linguaggio genera il segno del logo (tre cerchi fusi).

## Colors
### Primary
- **Inchiostro** `#121210`: testo, pulsanti principali, silhouette dei cerchi.
- **Giallo burro** `#F4E96B`: banda d'intestazione, schede-numero (produzione, totale), scelta selezionata, carboidrati nei cerchi.
### Secondary
- **Salvia** `#3E7A55`: verdure nei cerchi e stato "nessun allergene".
### Neutral
- **Carta** `#F3F2EE` (fondo), **card** `#FCFBF8`, **muted** `#E6E4DC`, testo secondario `#56554E`, bordi `#D9D6CC`.
### Named Rules
- **Colore con un lavoro.** Rosso `#B8321A` solo per allergene bloccato/annullato; arancio `#D9731A` solo per "allergeni non verificati". Nessun altro accento.
- **Mai solo colore.** Allergeni e stati sono sempre anche scritti; i cerchi hanno la legenda dove serve.

## Typography
Una sola famiglia: **Archivo** (variabile, asse larghezza).
### Hierarchy
- `h1`/`h2` e utility `display`: larghezza 125%, peso 800, maiuscolo, interlinea 0.98, tracking −0.01em. h1 1.85rem (telefono), h2 1.125–1.25rem.
- `h3`: larghezza 112%, peso 700, maiuscole/minuscole.
- Utility `num`: cifre tabellari, larghezza 112%, peso 700 — grammi e quantità.
- Testo: Archivo 100%, 400/500, 1rem.

## Layout
Colonna unica `max-w-md` (448px) con margini 24px; pila verticale con 24px tra blocchi. Intestazione a tutta larghezza (banda gialla) con contenuto allineato alla colonna. Su desktop la colonna resta centrata.

## Elevation & Depth
Piatto. Nessuna ombra: la profondità si fa con il colore (campi gialli, schede inchiostro) e con bordi da 1px.

## Shapes
Card 14px; riquadri interni 10px; pillole per pulsanti, chip, stati. Cerchi pieni come unico motivo grafico (cerchi fusi e puntini elenco).

## Components
### Buttons
Pillole. Primario inchiostro/carta (h 44–56px), variante `lemon` giallo/inchiostro, outline con bordo inchiostro 30%, ghost per azioni secondarie.
### Chips
Pillole piccole: ruolo (inchiostro con testo giallo), allergeni (rosso 10%), nessun allergene (salvia 12%), non verificato (arancio con bordo).
### Cards / Containers
Card carta chiara con bordo 1px e raggio 14px; **number-card** gialla per riepiloghi che contano (Da preparare in cucina, totale ordine).
### Navigation
Banda gialla: segno + NUTRILIFE a sinistra, chip ruolo + icona Esci a destra. Ritorno con freccia Lucide sopra il titolo.
### Meal blob (firma)
`MealBlob` in `src/components/brand.tsx`: cerchi per famiglia, raggio ∝ √grammi, fusi con filtro SVG (sfocatura + soglia alfa). Sempre accompagnato da grammi in testo; `MealLegend` per la legenda.

## Do's and Don'ts
### Do:
- Usa la voce espansa per tutto ciò che si conta o si legge da lontano (giorni, kg, prezzi).
- Usa il giallo come campo intero, non come puntino decorativo.
- Disegna i pasti con `MealBlob` e i grammi veri.
### Don't:
- Non copiare logo, forme o grafiche di Omnui: solo la direzione.
- Niente etichette piccole sopra i titoli, niente gradienti, niente ombre decorative.
- Niente emoji o caratteri freccia al posto delle icone: usa Lucide.
- Niente colori per stati senza testo.
