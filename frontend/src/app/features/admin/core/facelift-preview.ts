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
    label: 'Live',
    faces: [
      { id: 'l1', name: 'Klar' },
      { id: 'l2', name: 'Spielfeld' },
      { id: 'l3', name: 'Leitstand' },
      { id: 'l4', name: 'Puls' },
    ],
  },
  {
    label: 'Neu',
    faces: [
      { id: 'l5', name: 'Detail' },
      { id: 'l6', name: 'Raster' },
      { id: 'l7', name: 'Bühne' },
      { id: 'l8', name: 'Baukasten' },
      { id: 'l9', name: 'Gewählt' },
    ],
  },
];

function initial(): string | null {
  if (typeof location === 'undefined') {
    return null;
  }
  if (new URLSearchParams(location.search).has('facelift')) {
    return sessionStore.get(KEY) ?? 'l9';
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
