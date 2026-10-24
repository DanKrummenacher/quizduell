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
    label: 'Runde 1',
    faces: [
      { id: 'b1', name: 'Präzision' },
      { id: 'b2', name: 'Weich' },
      { id: 'b3', name: 'Glas' },
      { id: 'b4', name: 'Struktur' },
      { id: 'b5', name: 'Marke' },
      { id: 'b6', name: 'Kompakt' },
      { id: 'b7', name: 'Navy' },
      { id: 'b8', name: 'Luftig' },
    ],
  },
  {
    label: 'Runde 2',
    faces: [
      { id: 'c1', name: 'Offen' },
      { id: 'c2', name: 'Dashboard' },
      { id: 'c3', name: 'Navyband' },
      { id: 'c4', name: 'Tonal' },
      { id: 'c5', name: 'Bento' },
      { id: 'c6', name: 'Raster' },
      { id: 'c7', name: 'Fläche' },
    ],
  },
  {
    label: 'Runde 3',
    faces: [
      { id: 'd1', name: 'Linie' },
      { id: 'd2', name: 'Kante' },
      { id: 'd3', name: 'Leuchtrand' },
      { id: 'd4', name: 'Kontur' },
      { id: 'd5', name: 'Tiefe' },
      { id: 'd6', name: 'Bühne' },
    ],
  },
  {
    label: 'Runde 4',
    faces: [
      { id: 'e1', name: 'Komposition' },
      { id: 'e2', name: 'Überlappung' },
      { id: 'e3', name: 'Monochrom' },
      { id: 'e4', name: 'Zweiflächig' },
      { id: 'e5', name: 'Doppelkarte' },
      { id: 'e6', name: 'Frisch' },
    ],
  },
  {
    label: 'Runde 5',
    faces: [
      { id: 'f1', name: 'Seitenspalte' },
      { id: 'f2', name: 'Bereichsfarbe' },
      { id: 'f3', name: 'Arbeitsmodus' },
      { id: 'f4', name: 'Morgenlicht' },
      { id: 'f5', name: 'Blaupause' },
      { id: 'f6', name: 'Fokus' },
    ],
  },
  {
    label: 'Runde 6',
    faces: [
      { id: 'g1', name: 'Blatt' },
      { id: 'g2', name: 'Hauptzahl' },
      { id: 'g3', name: 'Kapitel' },
      { id: 'g4', name: 'Typografie' },
      { id: 'g5', name: 'Glanz' },
      { id: 'g6', name: 'Interaktion' },
    ],
  },
  {
    label: 'Runde 7',
    faces: [
      { id: 'h1', name: 'Klar' },
      { id: 'h2', name: 'Fläche' },
      { id: 'h3', name: 'Zweiflächig' },
      { id: 'h4', name: 'Morgenlicht' },
      { id: 'h5', name: 'Papier' },
      { id: 'h6', name: 'Leuchtlinie' },
      { id: 'h7', name: 'Raster' },
      { id: 'h8', name: 'Nebel' },
    ],
  },
  {
    label: 'Runde 8',
    faces: [
      { id: 'i1', name: 'Schatten' },
      { id: 'i2', name: 'Bogen' },
      { id: 'i3', name: 'Nordlicht' },
      { id: 'i4', name: 'Ausklang' },
      { id: 'i5', name: 'Lichtkegel' },
      { id: 'i6', name: 'Schräge' },
      { id: 'i7', name: 'Kopfkarte' },
      { id: 'i8', name: 'Punktfeld' },
    ],
  },
  {
    label: 'Runde 9',
    faces: [
      { id: 'j1', name: 'Navykante' },
      { id: 'j2', name: 'Tiefblau' },
      { id: 'j3', name: 'Übergang' },
      { id: 'j4', name: 'Kühlgrau' },
      { id: 'j5', name: 'Glut' },
      { id: 'j6', name: 'Stufen' },
      { id: 'j7', name: 'Seitenlicht' },
      { id: 'j8', name: 'Tonfläche' },
    ],
  },
  {
    label: 'Final',
    faces: [
      { id: 'k1', name: 'Klar' },
      { id: 'k2', name: 'Gross' },
      { id: 'k3', name: 'Kante' },
      { id: 'k4', name: 'Navy' },
    ],
  },
  {
    label: 'Neu',
    faces: [
      { id: 'm1', name: 'Basis' },
      { id: 'm2', name: 'Kapitel' },
      { id: 'm3', name: 'Grundton' },
      { id: 'm4', name: 'Sektionsfläche' },
      { id: 'm5', name: 'Kartenkopf' },
      { id: 'm6', name: 'Tiefe' },
      { id: 'm7', name: 'Kapitel hell' },
      { id: 'm8', name: 'Kapitel heller' },
    ],
  },
];

function initial(): string | null {
  if (typeof location === 'undefined') {
    return null;
  }
  if (new URLSearchParams(location.search).has('facelift')) {
    return sessionStore.get(KEY) ?? '0';
  }
  return sessionStore.get(KEY);
}

export const facelift = signal<string | null>(initial());

export function setFacelift(face: string): void {
  sessionStore.set(KEY, face);
  facelift.set(face);
}

export function closeFacelift(): void {
  sessionStore.remove(KEY);
  facelift.set(null);
}
