import { Injectable, signal } from '@angular/core';
import { localStore } from '../platform/safe-storage';

export type HeaderVariant = 1 | 2 | 3 | 4 | 5 | 6;

export const HEADER_VARIANTS: { id: HeaderVariant; name: string; idea: string }[] = [
  {
    id: 1,
    name: 'Verlauf zentriert',
    idea: 'Kompakte Verlaufsleiste, App-Icon und Name in der Mitte',
  },
  {
    id: 2,
    name: 'Verlauf mit Chip',
    idea: 'Name links, «Quizduell Challenge» als feiner Chip rechts',
  },
  {
    id: 3,
    name: 'Verlauf mit Bogen',
    idea: 'Weich geschwungene Unterkante, wirkt wie eine Bühne',
  },
  {
    id: 4,
    name: 'Verlauf mit Muster',
    idea: 'Die Formen aus dem Logo als dezentes Muster',
  },
  {
    id: 5,
    name: 'Dunkelblau mit Linie',
    idea: 'Ruhig und seriös, Verlauf nur als Akzentlinie',
  },
  {
    id: 6,
    name: 'Hell mit Verlaufskante',
    idea: 'Weisse Leiste, farbiges Logo, Verlauf als Oberkante',
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
