import { Injectable, signal } from '@angular/core';
import { localStore } from '../platform/safe-storage';

export type HeaderVariant = 1 | 2 | 3 | 4 | 5 | 6;

export const HEADER_VARIANTS: { id: HeaderVariant; name: string; idea: string }[] = [
  { id: 1, name: 'Verlaufsleiste', idea: 'Dein bisheriger Favorit als Vergleich' },
  {
    id: 2,
    name: 'Logo als Hero',
    idea: 'Kein Header: das Logo baut sich gross auf',
  },
  {
    id: 3,
    name: 'Verlaufsbühne',
    idea: 'Obere Hälfte im Markenverlauf, Titel in Weiss',
  },
  {
    id: 4,
    name: 'Wasserzeichen',
    idea: 'Grosser Formenkreis dreht sich dezent im Hintergrund',
  },
  {
    id: 5,
    name: 'Marke im Fuss',
    idea: 'Inhalt zuerst, Logo und Name ruhig am Seitenende',
  },
  {
    id: 6,
    name: 'Split-Screen',
    idea: 'Tablet/Desktop zweigeteilt, Handy wie Verlaufsbühne',
  },
];

const HEADER_KEY = 'playduelio.preview.header';

/** Currently shown header design (switchable while choosing a design). */
@Injectable({ providedIn: 'root' })
export class BrandingStore {
  readonly header = signal<HeaderVariant>(readVariant());

  setHeader(variant: HeaderVariant): void {
    this.header.set(variant);
    localStore.set(HEADER_KEY, String(variant));
  }
}

function readVariant(): HeaderVariant {
  const value = Number(localStore.get(HEADER_KEY));
  return (value >= 1 && value <= 6 ? value : 1) as HeaderVariant;
}
