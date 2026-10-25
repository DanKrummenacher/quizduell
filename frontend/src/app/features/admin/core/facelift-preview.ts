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
  { label: 'Final', faces: [{ id: 'w1', name: 'Gewählt' }] },
  {
    label: 'Kurzliste',
    faces: [
      { id: 'v1', name: 'Basis' },
      { id: 'v2', name: 'Getönter Kopf' },
      { id: 'v3', name: 'Navy-Kopf' },
      { id: 'v4', name: 'Zebra' },
      { id: 'v5', name: 'Kennzahl-Chips' },
      { id: 'v6', name: 'Akzentkante' },
      { id: 'v7', name: 'Ruhig' },
    ],
  },
  {
    label: 'Final',
    faces: [
      { id: 'u1', name: 'Basis' },
      { id: 'u2', name: 'Kennzahlen im Kopf' },
      { id: 'u3', name: 'Farbmarke' },
      { id: 'u4', name: 'Kurzliste' },
      { id: 'u5', name: 'Reiter' },
    ],
  },
  {
    label: 'Gewählt',
    faces: [
      { id: 't1', name: 'Basis' },
      { id: 't2', name: 'Ergebniszeile' },
      { id: 't3', name: 'Treffer im Suchfeld' },
      { id: 't4', name: 'Inhaltsverzeichnis' },
      { id: 't5', name: 'Starke Kapitel' },
    ],
  },
  {
    label: 'Fragen',
    faces: [
      { id: 'q1', name: 'Klar' },
      { id: 'q2', name: 'Kennzahlen' },
      { id: 'q3', name: 'Seitenleiste' },
      { id: 'q4', name: 'Gruppiert' },
      { id: 'q5', name: 'Werkbank' },
    ],
  },
  {
    label: 'Neu',
    faces: [
      { id: 'q6', name: 'Karten' },
      { id: 'q7', name: 'Vorschau' },
      { id: 'q8', name: 'Nach Schwierigkeit' },
    ],
  },
  {
    label: 'Gruppiert',
    faces: [
      { id: 'r1', name: 'Kapitelkarten' },
      { id: 'r2', name: 'Übersicht zuerst' },
      { id: 'r3', name: 'Sprungleiste' },
      { id: 'r4', name: 'Kompakt' },
    ],
  },
  {
    label: 'Weitere',
    faces: [
      { id: 's1', name: 'Kategorie-Kacheln' },
      { id: 's2', name: 'Zustand' },
      { id: 's3', name: 'Arbeitsplatz' },
    ],
  },
];

function initial(): string | null {
  if (typeof location === 'undefined') {
    return null;
  }
  // While the drafts are open for choosing, the switcher always shows.
  return sessionStore.get(KEY) ?? 'w1';
}

export const facelift = signal<string | null>(initial());

export function setFacelift(face: string): void {
  sessionStore.set(KEY, face);
  facelift.set(face);
}

export function closeFacelift(): void {
  facelift.set(null);
}

/** Temporary: how the question editor opens, beside the page drafts. */
export const EDITOR_FACES = [
  { id: 'e1', name: 'Seitenfenster' },
  { id: 'e2', name: 'Breit' },
  { id: 'e3', name: 'Reiter' },
  { id: 'e4', name: 'Mittig' },
];

const EDITOR_KEY = 'playduelio.admin.facelift.editor';

export const editorFace = signal<string>(sessionStore.get(EDITOR_KEY) ?? 'e1');

export function setEditorFace(face: string): void {
  sessionStore.set(EDITOR_KEY, face);
  editorFace.set(face);
}

/** Temporary: how «Statistik zurücksetzen» stands in the editor. */
export const RESET_FACES = [
  { id: 'z1', name: 'Etikett' },
  { id: 'z2', name: 'Hinweis' },
  { id: 'z3', name: 'Schalter' },
  { id: 'z4', name: 'Leise' },
];

const RESET_KEY = 'playduelio.admin.facelift.reset';

export const resetFace = signal<string>(sessionStore.get(RESET_KEY) ?? 'z1');

export function setResetFace(face: string): void {
  sessionStore.set(RESET_KEY, face);
  resetFace.set(face);
}
