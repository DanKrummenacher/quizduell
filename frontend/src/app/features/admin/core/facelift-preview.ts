import { signal } from '@angular/core';
import { sessionStore } from '../../../core/platform/safe-storage';

/**
 * Temporary: facelift drafts of the whole admin, to compare in the browser.
 * Opened with `?facelift` in the address, kept for the tab. Removed again once
 * one of them is chosen.
 */
const KEY = 'playduelio.admin.facelift';

export const FACE_GROUPS: {
  label: string;
  faces: { id: string; name: string }[];
}[] = [
  { label: '', faces: [{ id: '0', name: 'Heute' }] },
  {
    label: 'Final · Zuletzt geändert',
    faces: [
      { id: 'Y7', name: 'Gross + ganze Kachel' },
      { id: 'Y8', name: 'Gross + Knopf «Verlauf»' },
      { id: 'Y9', name: 'Gross + Fusszeile' },
      { id: 'Y10', name: 'Gross + Symbolknopf' },
      { id: 'Y3', name: 'Ganze Kachel zum Verlauf' },
      { id: 'Y4', name: 'Mit Link «Im Verlauf ansehen»' },
      { id: 'Y5', name: 'Mit Anzahl' },
      { id: 'Y6', name: 'Mit den Änderungen' },
      { id: 'Y2', name: 'Bisher: Antwort im Schnitt' },
    ],
  },
  {
    label: 'Runde 29 · Feinschliff Seite',
    faces: [
      { id: 'X1', name: 'Wie jetzt' },
      { id: 'X2', name: 'Titel «Vorlagen»' },
      { id: 'X3', name: '«Vorlagen» + «Regeln»' },
      { id: 'X4', name: 'Beides als Abschnitt' },
      { id: 'X5', name: 'Alle Kapitel offen' },
      { id: 'X6', name: 'Beide gleich gestaltet' },
      { id: 'X7', name: 'Schritt 1 + 2' },
      { id: 'X8', name: 'Aktive Vorlage + Anzahl' },
      { id: 'X9', name: 'Eine Zeile + Standard-Stand' },
    ],
  },
  {
    label: 'Runde 28 · Ganze Seite',
    faces: [
      { id: 'Q1', name: 'Mit Seitenspalte' },
      { id: 'Q2', name: 'Vorlage im Regelkopf' },
      { id: 'Q3', name: 'Mit Navigation' },
      { id: 'Q4', name: 'Ruhig' },
      { id: 'Q5', name: 'Kacheln + Vorlagen-Leiste' },
    ],
  },
  {
    label: 'Runde 27 · Ganze Seite',
    faces: [
      { id: 'P1', name: 'Wie jetzt' },
      { id: 'P2', name: 'Vorlagen + Regeln' },
      { id: 'P3', name: 'Kompakt + Ausgangspunkt' },
      { id: 'P4', name: 'Kompakt + Abschnitte' },
      { id: 'P5', name: 'Ohne Kennzahlen' },
    ],
  },
  {
    label: 'Runde 26 · Marke + Tabelle',
    faces: [
      { id: 'a1', name: 'Marke ganz klickbar' },
      { id: 'a2', name: 'Marke wird «Zurücksetzen»' },
      { id: 'a3', name: 'Marke zweiteilig' },
      { id: 'a4', name: 'Marke gestrichen' },
      { id: 'a5', name: 'Marke in Worten' },
      { id: 'a6', name: 'Tabelle linksbündig' },
      { id: 'a7', name: 'Tabelle mit Streifen' },
      { id: 'a8', name: 'Tabelle mit Linien' },
      { id: 'a9', name: 'Tabelle kräftiger Kopf' },
    ],
  },
  {
    label: 'Runde 25 · Standard / Bisher',
    faces: [
      { id: 's1', name: 'Tabelle' },
      { id: 's2', name: 'Im Kapitelkopf' },
      { id: 's3', name: 'Fusszeile je Kapitel' },
      { id: 's4', name: 'Häkchen im Wert' },
      { id: 's5', name: 'Übersicht + Hervorheben' },
    ],
  },
  {
    label: 'Runde 24 · Geändert',
    faces: [
      { id: 'i1', name: 'Zeile hellblau' },
      { id: 'i2', name: 'Diff-Zeile' },
      { id: 'i3', name: 'Mit Wirkung' },
      { id: 'i4', name: 'Alter Wert als Chip' },
      { id: 'i5', name: 'Differenz als Zahl' },
      { id: 'i6', name: 'Kapitel färbt sich' },
      { id: 'i7', name: 'Leuchtet kurz auf' },
    ],
  },
  {
    label: 'Runde 23 · Standard + Geändert',
    faces: [
      { id: 'f1', name: 'Spalte + gestrichelt' },
      { id: 'f2', name: 'Karte + nummeriert' },
      { id: 'f3', name: 'Segment + angehoben' },
      { id: 'f4', name: 'Punkt + Wertseite' },
      { id: 'f5', name: 'Nur Popover + Verlauf' },
      { id: 'f6', name: 'Spalte + unterstrichen' },
    ],
  },
  {
    label: 'Runde 22 · Standard + Einfärben',
    faces: [
      { id: 'e1', name: 'Im Chip + Zeile hellblau' },
      { id: 'e2', name: 'Nur Symbol + Kante' },
      { id: 'e3', name: 'Marke + Zeile kräftig' },
      { id: 'e4', name: 'Rechts + Textteil' },
      { id: 'e5', name: 'Beschreibung + gefüllt' },
      { id: 'e6', name: 'Nur wenn nötig + Schein' },
    ],
  },
  {
    label: 'Runde 21 · Standard + Geändert',
    faces: [
      { id: 'd1', name: 'Daneben + blauer Chip' },
      { id: 'd2', name: 'Nur wenn nötig + Rückgängig am Chip' },
      { id: 'd3', name: 'Am Titel + Titel markiert' },
      { id: 'd4', name: 'Beim Überfahren + Punkt' },
      { id: 'd5', name: 'Nur wenn nötig + vorher → neu' },
      { id: 'd6', name: 'Daneben + umrandet' },
    ],
  },
  {
    label: 'Runde 20 · Geändert',
    faces: [
      { id: 'c1', name: 'Chip + Symbol' },
      { id: 'c2', name: 'Vorher → neu' },
      { id: 'c3', name: 'Hinweis unter Text' },
      { id: 'c4', name: 'Beim Überfahren' },
      { id: 'c5', name: 'Linie links' },
      { id: 'c6', name: 'Zeile getönt' },
      { id: 'c7', name: 'Nur der Chip' },
      { id: 'c8', name: 'Marke am Titel' },
    ],
  },
  {
    label: 'Runde 19 · Prüfen neu gedacht',
    faces: [
      { id: 'b1', name: 'Prüfen und speichern' },
      { id: 'b2', name: 'Wie die Kapitel' },
      { id: 'b3', name: 'Vorschau beim Überfahren' },
      { id: 'b4', name: 'Lasche oben' },
      { id: 'b5', name: 'Details' },
      { id: 'b6', name: 'Mit Taste P' },
    ],
  },
  {
    label: 'Runde 18 · Prüfen',
    faces: [
      { id: 'l1', name: 'Knopf mit Zahl' },
      { id: 'l2', name: 'Symbol ist der Knopf' },
      { id: 'l3', name: 'Im Titel' },
      { id: 'l4', name: 'In der Unterzeile' },
      { id: 'l5', name: 'Symbolknopf' },
      { id: 'l6', name: 'Pfeil am Rand' },
      { id: 'l7', name: 'Am Speichern-Knopf' },
      { id: 'l8', name: 'Knopfgruppe' },
    ],
  },
  {
    label: 'Runde 17 · Zugeklappt + Prüfen',
    faces: [
      { id: 'j1', name: 'Zusammengefasst + Symbol' },
      { id: 'j2', name: 'Zähler + Knopfgruppe' },
      { id: 'j3', name: 'Seit + Pfeil vorne' },
      { id: 'j4', name: 'Symbol + am Speichern' },
      { id: 'j5', name: 'Marken + Zahl' },
    ],
  },
  {
    label: 'Runde 16 · Prüfen',
    faces: [
      { id: 'g1', name: 'Textknopf + Rand' },
      { id: 'g2', name: 'Voller Knopf + wie bisher' },
      { id: 'g3', name: 'Griff + grau mit Rand' },
      { id: 'g4', name: 'Link + Trennlinien' },
      { id: 'g5', name: 'Paar + Rand bei Änderung' },
    ],
  },
  {
    label: 'Runde 15 · Prüfen-Leiste',
    faces: [
      { id: 'h1', name: 'Änderungen + Knopf' },
      { id: 'h2', name: 'Auswirkung + Link' },
      { id: 'h3', name: 'Chips + ganze Zeile' },
      { id: 'h4', name: 'Zähler + Balken' },
      { id: 'h5', name: 'Eine Zeile + Pfeil' },
    ],
  },
  {
    label: 'Runde 14 · Leiste',
    faces: [
      { id: 'w1', name: 'Klar' },
      { id: 'w2', name: 'Kapsel' },
      { id: 'w3', name: 'Mit Status' },
      { id: 'w4', name: 'Prüfen zum Aufklappen' },
      { id: 'w5', name: 'Karte rechts' },
      { id: 'w6', name: 'Mit Hinweisen' },
    ],
  },
  {
    label: 'Runde 13 · Feinschliff',
    faces: [
      { id: 'v1', name: 'Listenzeile + Klar' },
      { id: 'v2', name: 'Feld + Änderungen auf Klick' },
      { id: 'v3', name: 'Stepper + Auswirkung' },
      { id: 'v4', name: 'Kompakt + Navy' },
      { id: 'v5', name: 'Auf Klick + bündig' },
    ],
  },
  {
    label: 'Runde 12 · Werteliste',
    faces: [
      { id: 'u1', name: 'Klar + Liste' },
      { id: 'u2', name: 'Dauerbalken + Auswirkung' },
      { id: 'u3', name: 'Vorschau + Aufklappbar' },
      { id: 'u4', name: 'Eingabe + Chips' },
      { id: 'u5', name: 'Markiert + Schlank' },
    ],
  },
  {
    label: 'Runde 11 · Popover',
    faces: [
      { id: 't1', name: 'Kompakt + fix unten' },
      { id: 't2', name: 'Werteliste' },
      { id: 't3', name: 'Mit Vergleich' },
      { id: 't4', name: 'Kacheln' },
      { id: 't5', name: 'Regler' },
    ],
  },
  {
    label: 'Runde 10 · Vorschläge',
    faces: [
      { id: 'r1', name: 'Regelkarten' },
      { id: 'r2', name: 'Kompakt' },
      { id: 'r3', name: 'Menüs + Prüfen' },
      { id: 'r4', name: 'Popover' },
    ],
  },
  {
    label: 'Runde 9 · Vorschläge',
    faces: [
      { id: 'q1', name: 'Ruhig' },
      { id: 'q2', name: 'Klassisch' },
      { id: 'q3', name: 'Eine Karte' },
      { id: 'q4', name: 'Reiter + Prüfen' },
      { id: 'q5', name: 'Mit Navigation' },
      { id: 'q6', name: 'Regler' },
    ],
  },
  {
    label: 'Runde 8',
    faces: [
      { id: 'o1', name: 'Menüs + Vorlagen' },
      { id: 'o2', name: 'Statuskarte' },
      { id: 'o3', name: 'Regler' },
      { id: 'o4', name: 'Vorlagen im Vergleich' },
      { id: 'o5', name: 'Kompakt + Popover' },
    ],
  },
  {
    label: 'Runde 7',
    faces: [
      { id: 'n1', name: 'Vorlagen + Leiste' },
      { id: 'n2', name: 'Leiste oben' },
      { id: 'n3', name: 'Seitenspalte' },
      { id: 'n4', name: 'Ansehen, dann ändern' },
      { id: 'n5', name: 'Eine Karte' },
    ],
  },
  {
    label: 'Runde 6',
    faces: [
      { id: 'm1', name: 'Aufklappbar' },
      { id: 'm2', name: 'Drei Spalten' },
      { id: 'm3', name: 'Standard markiert' },
      { id: 'm4', name: 'Helles Kopfband' },
      { id: 'm5', name: 'Übersicht + Fenster' },
    ],
  },
  {
    label: 'Runde 5',
    faces: [
      { id: 'k1', name: 'Kapitel mit Wirkung' },
      { id: 'k2', name: 'Gruppierte Liste' },
      { id: 'k3', name: 'Abschnitte links' },
      { id: 'k4', name: 'Getönte Karten' },
      { id: 'k5', name: 'Navy + Karten' },
    ],
  },
  {
    label: 'Weitere',
    faces: [
      { id: 'z1', name: 'Reiter' },
      { id: 'z2', name: 'Regelkarten' },
      { id: 'z3', name: 'Wie Fragen' },
      { id: 'z4', name: 'Seitenspalte' },
      { id: 'z5', name: 'Navy-Kopf' },
    ],
  },
  {
    label: 'Neu',
    faces: [
      { id: 'y1', name: 'Kartenraster' },
      { id: 'y2', name: 'Kapitel + Zusammenfassung' },
      { id: 'y3', name: 'Auswahlwerte' },
      { id: 'y4', name: 'Ansehen + Ändern' },
      { id: 'y5', name: 'Mit Wirkung' },
    ],
  },
  {
    label: 'Ansätze',
    faces: [
      { id: 'x1', name: 'Einstellungsseite' },
      { id: 'x2', name: 'Als Satz' },
      { id: 'x3', name: 'Tabelle' },
      { id: 'x4', name: 'Liste + Detail' },
      { id: 'x5', name: 'Kennzahlen oben' },
    ],
  },
  {
    label: 'Spielregeln',
    faces: [
      { id: 'p1', name: 'Klar' },
      { id: 'p2', name: 'Kapitel' },
      { id: 'p3', name: 'Zeitleiste' },
      { id: 'p4', name: 'Kacheln' },
      { id: 'p5', name: 'Vorschau oben' },
      { id: 'p6', name: 'Schieberegler' },
    ],
  },
  {
    label: 'Neu',
    faces: [
      { id: 'p7', name: 'Vorlagen' },
      { id: 'p8', name: 'Spielvorschau' },
      { id: 'p9', name: 'Vorher – nachher' },
      { id: 'p10', name: 'Schnellwerte' },
      { id: 'p11', name: 'Navy-Panel' },
    ],
  },
];

function initial(): string | null {
  if (typeof location === 'undefined') {
    return null;
  }
  // While the drafts are open for choosing, the switcher always shows.
  return sessionStore.get(KEY) ?? 'Y7';
}

export const facelift = signal<string | null>(initial());

export function setFacelift(face: string): void {
  sessionStore.set(KEY, face);
  facelift.set(face);
}

export function closeFacelift(): void {
  facelift.set(null);
}
