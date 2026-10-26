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
    label: 'Symbole · Spiel/Pause',
    faces: [
      { id: 'k1', name: 'Ausgegraut mit Grund' },
      { id: 'k2', name: 'Nur was passt' },
      { id: 'k3', name: 'Mit Anzahl' },
    ],
  },
];

function initial(): string | null {
  if (typeof location === 'undefined') {
    return null;
  }
  // While the drafts are open for choosing, the switcher always shows.
  return sessionStore.get(KEY) ?? 'k1';
}

export const facelift = signal<string | null>(initial());

export function setFacelift(face: string): void {
  sessionStore.set(KEY, face);
  facelift.set(face);
}

export function closeFacelift(): void {
  facelift.set(null);
}
