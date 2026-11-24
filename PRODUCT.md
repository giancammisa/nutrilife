# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(Mobile-first web app, installabile come PWA dalla schermata Home.)

## Users
- **Cliente/paziente** (pubblico principale — *ipotesi di lavoro, da confermare*): persona che segue il piano di un nutrizionista e vuole i pasti già preparati e pesati senza cucinare. Usa l'app dal telefono, di solito in pochi minuti: guarda la settimana, ordina entro le 18:00 del giorno prima, ritira in gastronomia.
- **Nutrizionista**: inserisce per ogni paziente 3–4 pasti tipo (basi + grammature) e lo invita con un link. Il piano completo resta nel suo software.
- **Cucina partner (gastronomia partner, ovunque)**: legge gli ordini di domani, il riepilogo di produzione in kg, stampa le etichette, segna pronto/ritirato. Spesso in piedi, mani occupate, schermo in cucina.
- **Admin (titolare NutriLife)**: gestisce gastronomie, catalogo basi, prezzi, allergeni, utenti e impostazioni.

## Product Purpose
NutriLife fa cucinare il piano del nutrizionista da una gastronomia partner, ovunque si trovi: il cliente ordina il giorno prima e ritira il pasto già pesato. Successo = il cliente rispetta il piano senza fatica, la gastronomia produce senza sprechi, il nutrizionista vede i pazienti seguiti.

## Positioning
Una cucina di quartiere che lavora con un menu componibile di basi (proteine, carboidrati, verdure) cucinate in quantità e pesate al grammo per ogni persona, secondo il pasto tipo deciso dal nutrizionista. Precisione da laboratorio, cibo vero da gastronomia.

## Operating Context
- Ordine entro le 18:00 del giorno prima (ora di Roma); annullabile fino a quell'ora.
- Pagamento in gastronomia al ritiro; l'app mostra il prezzo (al kg per base + costo fisso).
- Allergeni UE a tre stati (verificato/nessuno/non verificato) visibili prima di ordinare e stampati sull'etichetta.
- Etichette stampate in gastronomia; vista cucina su tablet o PC.

## Capabilities and Constraints
- Next.js 16 + Supabase (UE) + Tailwind 4 + shadcn/ui; interfaccia in italiano.
- Funzioni v1 complete (passi 0–10 in docs/PIANO.md). Fuori v1: pagamenti in app, AI, recensioni, notifiche.
- Privacy: niente anamnesi/peso/esami; allergie solo con consenso specifico.

## Brand Commitments
- Nome: **NutriLife**.
- Motto: **"Cucina 3.0"** (sostituisce "Dimmelo prima", 24/11/2026).
- Riferimento visivo vincolante scelto dal titolare (24/11/2026, sostituisce Omnui): progetto Behance "Sisense AI Assistant – SaaS & UX UI Dashboard Design" come **direzione**: sfondo nero, colori pieni chiari (lime, menta, azzurro, grigio chiaro), contrasti forti, effetto vetro, Urbanist sottile e grande, angoli molto arrotondati e pillole. Logo e grafiche di NutriLife restano **originali**.

## Evidence on Hand
- Nessuna fotografia, testimonianza o dato reale di clienti ancora disponibile: non inventarne.
- Nomi di gastronomie e prezzi nel database sono dati di prova.

## Product Principles
1. Il piano del nutrizionista è la verità: l'app non riscrive dosi né consigli.
2. Sicurezza prima di tutto: allergeni sempre visibili prima di confermare.
3. Pochi tocchi dal telefono: l'ordine di domani si fa in meno di un minuto.
4. Precisione visibile: grammi, prezzi e orari sempre esatti e leggibili.

## Accessibility & Inclusion
Utenti di tutte le età (anche pazienti anziani): testo grande e contrasto alto, obiettivi tattili ampi, nessuna informazione affidata solo al colore (allergeni e stati sempre anche in testo).
