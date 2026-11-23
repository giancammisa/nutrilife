---
name: NutriLife
description: Cucina 3.0 — il piano del nutrizionista, cucinato e pesato al grammo da una gastronomia di Altamura.
colors:
  ink: "#0B0B0B"
  surface: "#141414"
  card: "#1A1A1A"
  muted: "#242424"
  border: "#2A2A2A"
  input: "#333333"
  paper: "#F5F5F4"
  muted-text: "#A6A6A3"
  lemon: "#EDFF8C"
  mint: "#CFE1CA"
  sky: "#D8DFE9"
  cloud: "#EFEFEF"
  rose: "#F4B3AC"
  sage: "#9EE6A0"
  destructive: "#FF7B6B"
  warning: "#FFB86B"
  glass-fill: "rgb(255 255 255 / 0.07)"
  glass-edge: "rgb(255 255 255 / 0.1)"
  print-white: "#fff"
  print-black: "#000"
typography:
  hero:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "3.4rem"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  page-title:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 300
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  page-title-plain:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "2.4rem"
    fontWeight: 300
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  number:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.03em"
  heading:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0em"
  micro:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0em"
  button-sm:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0em"
  print-micro:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0em"
rounded:
  card: "28px"
  hero: "32px"
  inner: "24px"
  pill: "9999px"
spacing:
  gutter: "20px"
  stack: "20px"
  card: "20px"
components:
  button-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 20px"
  button-lemon:
    backgroundColor: "{colors.lemon}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "48px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "20px"
  fill-card-lemon:
    backgroundColor: "{colors.lemon}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  fill-card-sky:
    backgroundColor: "{colors.sky}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  chip-beta:
    backgroundColor: "{colors.lemon}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: NutriLife

## Overview
"Cucina 3.0" di notte: un pannello di precisione per il cibo. **Fondo nero**, schede scure e, accanto, **schede piene a colori chiari con testo nero** che fanno il contrasto. Il **vetro** (traslucido e sfocato) tiene insieme intestazione, pulsanti rotondi e la barra del totale. Titoli e numeri in **Urbanist sottile e grande**. Direzione ispirata al progetto Behance "Sisense AI Assistant" (palette, contrasti, vetro, forme); logo, cerchi del pasto e grafiche sono originali di NutriLife.

Mossa firma: **il pasto in cerchi fusi**, proteina rosa, carboidrato lime, verdura verde, con area proporzionale ai grammi veri. Nella prima pagina i cerchi diventano grandi e una scheda di vetro li sfoca per mostrare i grammi.

## Colors
### Primary
- **Nero** `#0B0B0B` (fondo), **schede** `#1A1A1A`, **superfici** `#141414`/`#242424`.
- **Testo** `#F5F5F4`, secondario `#A6A6A3`.
### Secondary — colori pieni (testo sempre nero sopra)
- **Lime** `#EDFF8C`: ciò che conta di più (totale, riepilogo produzione, scelta selezionata, "Prova").
- **Menta** `#CFE1CA` e **azzurro** `#D8DFE9`: passi e pasti tipo. **Nuvola** `#EFEFEF` di riserva.
- Cerchi del pasto: **rosa** `#F4B3AC` proteine, **lime** carboidrati, **verde** `#9EE6A0` verdure.
### Named Rules
- **Colore con un lavoro.** Rosso `#FF7B6B` solo per allergeni bloccati/annullato; arancio `#FFB86B` solo per "non verificati".
- **Mai solo colore.** Allergeni e stati sono sempre scritti.

## Typography
Una sola famiglia: **Urbanist** (variabile).
### Hierarchy
- Hero 3.4rem/300 (prima pagina, con la prima parola in 600); titolo pagina 2.5rem/300 (2.4rem nelle pagine fuori dalle aree riservate); numeri grandi (`display`) 2.25rem/300 in lime o nero.
- Titoli di sezione e nomi 1–1.125rem/600. Testo 1rem/400. Etichette 0.75rem/500. Micro 11px/600 (chip). Solo in stampa: 10px.
- `num`: cifre tabellari 600 per grammi e quantità.

## Layout
Colonna unica `max-w-md` con margini 20px e 20px tra i blocchi. Intestazione di vetro fissa in alto a tutta larghezza.

## Elevation & Depth
Nessuna ombra. La profondità viene dal vetro (bianco 7% + sfocatura 18px + bordo bianco 10%) sopra il nero o sopra i colori, e dal contrasto tra schede scure e schede piene.

## Shapes
Schede 28px (hero 32px, interni 24px); pillole per pulsanti, chip e ritorno; pulsanti-icona circolari in vetro. Cerchi pieni come unico motivo grafico.

## Components
### Buttons
Primario: pillola bianca con testo nero. Variante lime. Su schede lime il pulsante diventa nero. Contorno: bordo bianco 20%.
### Chips
Ruolo in vetro; "Prova" in lime; allergeni rosso 10%, nessun allergene verde 12%, non verificati arancio con bordo.
### Cards / Containers
Schede scure con bordo `#2A2A2A`; schede piene (lime, menta, azzurro) con testo nero e secondario al 65–75% di nero.
### Navigation
Intestazione di vetro: segno + NutriLife a sinistra; "Prova", ruolo e Esci (cerchio di vetro) a destra. Ritorno: pillola di vetro con freccia in un cerchio bianco.
### Meal blob (firma)
`MealBlob` in `src/components/brand.tsx`: silhouette chiara (bianco 34%) su fondo scuro, nera (`outline="var(--ink)"`) su schede chiare.

## Do's and Don'ts
### Do:
- Usa i colori pieni come schede intere con testo nero.
- Usa il vetro per ciò che galleggia (intestazione, barra del totale, pulsanti rotondi).
- Titoli e numeri grandi e sottili; nomi in 600.
### Don't:
- Non copiare logo o grafiche di Sisense: solo la direzione.
- Niente testo bianco su colori chiari; niente ombre; niente caratteri freccia al posto delle icone.
- Le etichette di stampa restano bianche.
