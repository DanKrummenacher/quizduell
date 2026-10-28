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
    label: 'Ganze Seiten, Admin-Bausteine',
    faces: [
      { id: 't1', name: 'Arbeitsplatz' },
      { id: 't2', name: 'Bericht' },
      { id: 't3', name: 'Durchgehen' },
      { id: 't4', name: 'Tabelle' },
    ],
  },
  {
    label: 'Karte, Spektrum, Halbkreis',
    faces: [
      { id: 's1', name: 'Spektrum + Halbkreis' },
      { id: 's2', name: 'Karte mit Rändern' },
      { id: 's3', name: 'Grosser Halbkreis' },
      { id: 's4', name: 'Ansicht wechseln' },
      { id: 's5', name: 'Spektrum im Kopf' },
      { id: 's6', name: 'Spektrum je Prüfung' },
    ],
  },
  {
    label: 'Zwei Schritte, mutig',
    faces: [
      { id: 'r1', name: 'Spektrum' },
      { id: 'r2', name: 'Leuchtkopf' },
      { id: 'r3', name: 'Strichcode' },
      { id: 'r4', name: 'Kategorie-Ring' },
      { id: 'r5', name: 'Fragenkarte' },
      { id: 'r6', name: 'Fokus-Frage' },
    ],
  },
  {
    label: 'Zwei Schritte, neue Köpfe',
    faces: [
      { id: 'v1', name: 'Kacheln (bisher)' },
      { id: 'y1', name: 'Prüf-Stepper' },
      { id: 'y2', name: 'Überblick als Schritt' },
      { id: 'y3', name: 'Blaues Band' },
      { id: 'y4', name: 'Aufteilung' },
      { id: 'y5', name: 'Kopf als Filter' },
      { id: 'y6', name: 'Meta-Zeile' },
      { id: 'q1', name: 'Prüf-Ringe' },
      { id: 'q2', name: 'Halbkreis' },
      { id: 'q3', name: 'Prüf-Chips' },
      { id: 'q4', name: 'Grosse Zahl + Liste' },
      { id: 'q5', name: 'Bewertungstabelle' },
      { id: 'q6', name: 'Satz mit Werten' },
    ],
  },
  {
    label: 'Zwei Schritte, Kopf',
    faces: [
      { id: 'v1', name: 'Kacheln (bisher)' },
      { id: 'z1', name: 'Ring + Prüfungen' },
      { id: 'z2', name: 'Statuszeile' },
      { id: 'z3', name: 'Prüfband' },
      { id: 'z4', name: 'Ein Satz' },
      { id: 'z5', name: 'Histogramm' },
      { id: 'z6', name: 'Ziel' },
      { id: 'z7', name: 'Entwicklung' },
      { id: 'z8', name: 'Ohne Kopf' },
    ],
  },
  {
    label: 'Verfeinert',
    faces: [
      { id: 'p1', name: 'Übersicht' },
      { id: 'p2', name: 'Fall für Fall' },
      { id: 'p3', name: 'Prüfbericht' },
    ],
  },
  {
    label: 'Finalisten',
    faces: [
      { id: 'b1', name: 'Lagezentrum' },
      { id: 'b2', name: 'Arbeitsablauf' },
      { id: 'b3', name: 'Analyse' },
      { id: 'b4', name: 'Arbeitsplatz' },
      { id: 'c1', name: 'Nach Kategorie' },
      { id: 'c2', name: 'Liste + Detail' },
      { id: 'c3', name: 'Entwicklung zuerst' },
      { id: 'c4', name: 'Reiter + Karten' },
      { id: 'd1', name: 'Messwert-Tabelle' },
      { id: 'd2', name: 'Wichtigkeits-Leiter' },
      { id: 'd3', name: 'Fragen aufklappen' },
      { id: 'd4', name: 'Kartenraster' },
    ],
  },
  {
    label: 'Neu',
    faces: [
      { id: 'v1', name: 'Zwei Schritte' },
      { id: 'v2', name: 'Nach Wichtigkeit' },
      { id: 'v3', name: 'Wie Fragen' },
      { id: 'v4', name: 'Prüfung wählen' },
      { id: 'v5', name: 'Pro Frage' },
      { id: 'v6', name: 'Entscheiden' },
      { id: 'v7', name: 'Nach Kategorie' },
      { id: 'v8', name: 'Kategorie wählen' },
      { id: 'v9', name: 'Prüfband' },
      { id: 'v10', name: 'Qualitätsring' },
      { id: 'v11', name: 'Histogramm' },
      { id: 'v12', name: 'Ampel-Matrix' },
      { id: 'v13', name: 'Seitenleiste' },
      { id: 'v14', name: 'Ziel' },
      { id: 'v15', name: 'Trichter' },
      { id: 'v16', name: 'Kategorie-Balken' },
      { id: 'v17', name: 'Kästchen' },
      { id: 'v18', name: 'Spotlight' },
      { id: 'v19', name: 'Prüfleiste' },
      { id: 'v20', name: 'Suche' },
      { id: 'v21', name: 'Entwicklung' },
      { id: 'v22', name: 'Antwort-Heatmap' },
      { id: 'v23', name: 'Was wäre, wenn' },
      { id: 'v24', name: 'Statuszeile' },
      { id: 'v25', name: 'Prüf-Spalten' },
      { id: 'v26', name: 'Reiter' },
    ],
  },
];

function initial(): string | null {
  if (typeof location === 'undefined') {
    return null;
  }
  // While the drafts are open for choosing, the switcher always shows.
  const stored = sessionStore.get(KEY);
  const known = FACE_GROUPS.some((group) =>
    group.faces.some((face) => face.id === stored),
  );
  return known ? stored : 't1';
}

export const facelift = signal<string | null>(initial());

export function setFacelift(face: string): void {
  sessionStore.set(KEY, face);
  facelift.set(face);
}

export function closeFacelift(): void {
  facelift.set(null);
}

/** Temporary: drafts with sample data or as they are. */
const DATA_KEY = 'playduelio.admin.facelift.data';
type FaceData = 'empty' | 'full' | 'alarm';
function initialData(): FaceData {
  const stored = typeof location !== 'undefined' ? sessionStore.get(DATA_KEY) : null;
  return stored === 'full' || stored === 'alarm' ? stored : 'empty';
}
export const faceData = signal<FaceData>(initialData());

export function setFaceData(data: FaceData): void {
  sessionStore.set(DATA_KEY, data);
  faceData.set(data);
}
