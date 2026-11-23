---
name: NutriLife
description: Cucina 3.0 — il piano del nutrizionista, cucinato e pesato al grammo da una gastronomia di Altamura.
colors:
  ink: "#0B0B0B"
  salvia: "#DFE6DA"
  salvia-grey: "#E6E7E3"
  salvia-deep: "#D3DCCC"
  water-green: "rgb(190 235 170 / 0.45)"
  card: "rgb(255 255 255 / 0.55)"
  popover: "#FFFFFF"
  secondary: "#D3DBCD"
  border: "rgb(11 11 11 / 0.09)"
  input: "rgb(11 11 11 / 0.18)"
  paper: "#F5F5F4"
  muted-text: "#565C53"
  ok: "#2E6B35"
  lemon: "#EDFF8C"
  mint: "#CFE1CA"
  sky: "#D8DFE9"
  cloud: "#EFEFEF"
  leaf: "#DCE8D2"
  fog: "#E3E3DF"
  night-green: "#101411"
  grad-lime-light: "#F3FFB0"
  grad-lime-green: "#B9EFA0"
  grad-leaf-light: "#EAF2E2"
  grad-leaf-deep: "#C6DDBA"
  grad-fog-light: "#F0F0EC"
  grad-fog-blue: "#D3D9E2"
  grad-sky-light: "#E8EDF4"
  rose: "#F4B3AC"
  sage: "#9EE6A0"
  destructive: "#B8322A"
  warning: "#9A5300"
  glass-fill: "rgb(255 255 255 / 0.75)"
  glass-edge: "rgb(255 255 255 / 0.8)"
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
  pickup-code:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "5.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.04em"
  day-number:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.03em"
  number:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.03em"
  section-title:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  card-title:
    fontFamily: "Urbanist, system-ui, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.015em"
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
  arc: "64px"
spacing:
  gutter: "20px"
  stack: "20px"
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
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  fill-card-lemon:
    backgroundColor: "{colors.lemon}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  fill-card-leaf:
    backgroundColor: "{colors.leaf}"
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
"Cucina 3.0" di giorno: un pannello di precisione per il cibo. **Fondo salvia chiaro** che sfuma nel **grigio chiaro**, schede di **vetro bianco** (traslucide e sfocate), e accanto **schede piene a colori chiari** (lime, verde leggero, grigio) con testo nero. Il **nero** è riservato a ciò che si preme e conta: Accedi, Ordina, Conferma, Esci, la freccia di ritorno, la barra del totale. Titoli e numeri in **Urbanist sottile e grande**. Foto di cibo in controluce qua e là.

Mossa firma: **il pasto in cerchi fusi**, proteina rosa, carboidrato lime, verdura verde, con area proporzionale ai grammi veri.

## Colors
### Primary
- **Salvia** `#DFE6DA`: fondo **piatto**. Il grigio `#E6E7E3` e il salvia scuro `#D3DCCC` solo dentro schede e banner.
- **Nero** `#0B0B0B`: testo, pulsanti importanti, icone da premere. Sopra il nero testo `#F5F5F4`.
- Testo secondario `#565C53`. Schede: vetro bianco 55%.
### Secondary — colori pieni (testo sempre nero sopra)
- **Lime** `#EDFF8C`: ciò che conta di più (totale, riepilogo produzione, scelta selezionata, "Prova", pulsante sulla barra nera).
- **Verde leggero** `#DCE8D2` e **grigio chiaro** `#E3E3DF`: schede piene che si alternano. **Menta**, **azzurro**, **nuvola** per sfumare.
- **Gradienti**: ogni colore pieno è una sfumatura (`bg-grad-lime`, `bg-grad-leaf`, `bg-grad-fog`, `bg-grad-sky`), mai sul testo.
- Cerchi del pasto: **rosa** `#F4B3AC` proteine, **lime** carboidrati, **verde** `#9EE6A0` verdure; contorno nero.
### Named Rules
- **Il nero si preme.** Un solo pulsante nero per schermata (l'azione principale) più le icone rotonde; il resto contorno o vetro.
- **Colore con un lavoro.** Rosso `#B8322A` solo per allergeni bloccati/annullato; arancio `#9A5300` solo per "non verificati"; verde scuro `#2E6B35` per "nessun allergene".
- **Mai solo colore.** Allergeni e stati sono sempre scritti.

## Typography
Una sola famiglia: **Urbanist** (variabile).
### Hierarchy
- Hero 3.4rem/300 (prima pagina, con la prima parola in 600); titolo pagina 2.5rem/300 (2.4rem nelle pagine fuori dalle aree riservate); numeri grandi (`display`) 2.25rem/300 in lime o nero.
- Titoli di sezione (`section-title`) 1.6rem/600, es. "Oggi, lunedì 23 novembre", "I tuoi pasti tipo". Titoli nelle schede (`card-title`) 1.4rem/600: passi della prima pagina, pasti tipo, nomi dei clienti in cucina, giorni in "I miei ordini". Etichette dei campi 1rem/600. Testo 1rem/400. Etichette 0.75rem/500. Micro 11px/600 (chip). Solo in stampa: 10px.
- `num`: cifre tabellari 600 per grammi e quantità.

## Layout
Colonna unica `max-w-md` con margini 20px e 20px tra i blocchi. Intestazione di vetro fissa in alto a tutta larghezza.

## Elevation & Depth
Nessuna ombra. La profondità viene dal vetro bianco (75→40% + sfocatura 22px + bordo bianco 80%) sopra il fondo salvia, e da poche superfici nere piene (barra del totale, scheda dei grammi sulla foto) che fanno il contrasto. I menu a comparsa sono bianchi pieni.

## Shapes
Schede 28px (hero 32px, interni 24px); pillole per pulsanti, chip e ritorno; pulsanti-icona circolari in vetro. Cerchi pieni come unico motivo grafico.

## Components
### Buttons
Primario: pillola **nera** con testo chiaro (Accedi, Ordina). Sulla barra nera del totale il pulsante è lime. Contorno: bordo nero 20%.
### Chips
Ruolo in vetro; "Prova" in lime; allergeni rosso 10%, nessun allergene verde 12%, non verificati arancio con bordo.
### Cards / Containers
Schede di vetro bianco; schede piene (lime, menta, azzurro) con testo nero e secondario al 65–75% di nero.
### Navigation
Intestazione di vetro bianco: segno + NutriLife a sinistra; "Prova", ruolo e Esci (cerchio nero) a destra. Ritorno: pillola di vetro con freccia in un cerchio nero.
### Nastro dei giorni (cliente)
`DayArc` in `src/app/cliente/day-arc.tsx`: su fondo piatto, un **banner ad arco di vetro** (una grande ciambella: anello esterno di vetro sfumato dal rosa `#F4B3AC` al bianco, così si stacca dai bollini bianchi, a taglio vivo (nessun bordo); interno salvia scuro `#D3DCCC`) a tutta larghezza. Fascia spessa 66px, quanto i bollini laterali: quello al centro sborda. I 7 giorni sono bollini bianchi da 76px che scorrono a metà della fascia: al centro più grandi (×1.14) con contorno nero e trattino nero sotto, ai lati più piccoli (×0.84) e più in basso. Giorno già ordinato: bollino lime con spunta nera; ordini chiusi senza ordine: sbiadito. Dentro l'arco, sotto: data, orario limite, ordini del giorno (schede lime) o pulsante nero Ordina. Tastiera: frecce sinistra/destra.
### Segno animato (prima pagina)
`AnimatedMark` in `src/components/brand.tsx`: il segno dei tre cerchi in grande (128px) accanto al titolo "Cucina / 3.0" su due righe. Cerchi nei colori del pasto (verde verdura, lime carboidrato, rosa proteina) con la silhouette nera fusa sotto; si allontanano e si riavvicinano (6–8 s) e il collo nero li tiene uniti. Fermo con "riduci movimento".
### Sfondo "acqua" (prima pagina e Accedi)
`LivingBackground` in `src/components/living-background.tsx`: sul salvia, sei macchie morbide solo nei verdi chiari (menta, verde leggero, verde un po. più vivo qua e là) e bianco, leggerissime, che si muovono vivaci (9–15 s, con un punto intermedio, avanti e indietro) più un velo di riflessi bianchi che ondeggia, come luce sott'acqua. Solo `transform`, nessun video da scaricare; con "riduci movimento" resta fermo. Solo all'ingresso: le aree riservate restano a fondo piatto.
### Accesso
`AuthStage` in `src/components/auth-stage.tsx`: lo stesso sistema della prima pagina. Sfondo "acqua", titolo, poi una scheda con la foto a tutta superficie (Accedi: uva rosa; prova: pompelmo) e sopra, in basso, una scheda di vetro bianco leggera con il modulo e il pulsante nero. Niente schede nere grandi: la foto resta protagonista.
### Biglietto di ritiro (cliente)
`/cliente/ritiro/[id]`: scheda lime a tutta larghezza con "Mostra al banco", **codice di ritiro** enorme (`#0BAE`, 5.5rem), nome, giorno e pasto; riga tratteggiata come un biglietto strappato; sotto gastronomia e prezzo da pagare. Poi i tre stati (Confermato, Pronto, Ritirato) con quello raggiunto in nero, e cosa c'è nel piatto. Dalla settimana e da "I miei ordini" ci si arriva con la pillola nera "Mostra al ritiro #codice". In cucina e sulle etichette il codice compare accanto al nome.
### Immagini in controluce
Foto di cibo tagliato sottile e traslucido (cetriolo, uva, fico, pompelmo, piselli, pera) in `public/immagini/*.webp`, componente `FoodPhoto` in `src/components/food-art.tsx`. Sempre su schede chiare con `mix-blend-multiply`, così il bianco sparisce. Usate **qua e là**, non ovunque: prima pagina (riquadro esempio a tutta foto, passi 02 e 03 a striscia sfumata a destra), pagina Accedi (foto di sfondo della scheda d'accesso), pasti tipo del cliente (striscia sfumata al 45%). Mai dietro numeri o allergeni senza contrasto pieno; sempre decorative (`aria-hidden`).
### Meal blob (firma)
`MealBlob` in `src/components/brand.tsx`: cerchi colorati con contorno nero.

## Do's and Don'ts
### Do:
- Usa i colori pieni come schede intere con testo nero.
- Usa il vetro bianco per schede e intestazione; il nero per l'azione principale.
- Titoli e numeri grandi e sottili; nomi in 600.
### Don't:
- Non copiare logo o grafiche di Sisense: solo la direzione.
- Niente testo bianco su colori chiari; niente ombre; niente caratteri freccia al posto delle icone.
- Non usare il vetro bianco sopra una superficie nera: si ingrigisce.
- Le etichette di stampa restano bianche.
